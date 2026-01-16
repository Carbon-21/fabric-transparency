const logger = require("./logger");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DEFAULT_IPFS_API_URL = "http://127.0.0.1:5001";
const DEFAULT_IPNS_KEY_NAME = "transparency";

exports.DEFAULT_IPNS_KEY_NAME = DEFAULT_IPNS_KEY_NAME;

exports.createClient = async () => {
  const ipfsApiUrl = process.env.IPFS_API_URL || DEFAULT_IPFS_API_URL;
  const { create } = await import("kubo-rpc-client");
  return create({ url: ipfsApiUrl });
};

exports.ensureIpnsKey = async (ipfs, keyName = DEFAULT_IPNS_KEY_NAME) => {
  try {
    const keys = await ipfs.key.list();
    const existing = keys.find((k) => k.name === keyName);
    if (existing) return existing.id;

    await ipfs.key.gen(keyName, { type: "ed25519" });
    const keysAfter = await ipfs.key.list();
    const created = keysAfter.find((k) => k.name === keyName);
    return created ? created.id : null;
  } catch (err) {
    logger.warn(
      `Could not ensure IPNS key "${keyName}". You may need to run 'ipfs key gen ${keyName} --type=ed25519' in the Kubo container.`,
      err
    );
    return null;
  }
};

async function catToString(ipfs, cid) {
  const decoder = new TextDecoder();
  let out = "";
  for await (const chunk of ipfs.cat(cid)) {
    out += decoder.decode(chunk, { stream: true });
  }
  out += decoder.decode(new Uint8Array(), { stream: false });
  return out;
}

async function resolveNameToCid(ipfs, name) {
  // `ipfs.name.resolve` can be an async iterable (most common), but some clients
  // may return a string/object. Handle both.
  const resolved = ipfs.name.resolve(name);
  if (typeof resolved === "string") return resolved.replace("/ipfs/", "");
  if (resolved && typeof resolved === "object" && resolved.path) {
    return String(resolved.path).replace("/ipfs/", "");
  }

  for await (const v of resolved) {
    return String(v).replace("/ipfs/", "");
  }
  return null;
}

async function getKeyId(ipfs, keyName = DEFAULT_IPNS_KEY_NAME) {
  const keys = await ipfs.key.list();
  const key = keys.find((k) => k.name === keyName);
  return key ? key.id : null;
}

async function resolveLatestCidFromKey(ipfs, keyName = DEFAULT_IPNS_KEY_NAME) {
  const id = await getKeyId(ipfs, keyName);
  if (!id) return null;
  return await resolveNameToCid(ipfs, `/ipns/${id}`);
}

function normalizeToString(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 4);
}

async function lsToMap(ipfs, cid) {
  const map = new Map();
  for await (const entry of ipfs.ls(cid)) {
    if (!entry || !entry.name) continue;
    map.set(entry.name, entry.cid?.toString ? entry.cid.toString() : String(entry.cid));
  }
  return map;
}

async function readPublication(ipfs, cid) {
  const entries = await lsToMap(ipfs, cid);

  // New format (preferred)
  if (entries.has("manifest.json")) {
    const manifestRaw = await catToString(ipfs, entries.get("manifest.json"));
    let manifest = null;
    try {
      manifest = JSON.parse(manifestRaw);
    } catch (err) {
      logger.warn(
        `Invalid manifest.json for CID ${cid}. Falling back to best-effort read.`,
        err
      );
    }

    const tail = entries.has("tail.json")
      ? await catToString(ipfs, entries.get("tail.json"))
      : null;
    const worldState = entries.has("world_state.json")
      ? await catToString(ipfs, entries.get("world_state.json"))
      : null;
    const signature = entries.has("signature.txt")
      ? await catToString(ipfs, entries.get("signature.txt"))
      : null;
    const cert = entries.has("cert.pem")
      ? await catToString(ipfs, entries.get("cert.pem"))
      : null;

    return {
      schemaVersion: manifest?.schemaVersion ?? 1,
      timestamp: manifest?.timestamp ?? null,
      firstCid: manifest?.firstCid || "",
      prevCid: manifest?.prevCid || "",
      tail,
      worldState,
      signature,
      cert,
      manifest: manifest || null,
      manifestRaw: manifest ? undefined : manifestRaw,
    };
  }

  // Legacy Helia format (best-effort)
  const pickByPrefix = (prefix) => {
    const names = [...entries.keys()].filter((n) => n.startsWith(prefix));
    if (!names.length) return null;
    names.sort(); // deterministic: lexicographic
    return names[names.length - 1];
  };

  const signatureName = pickByPrefix("RSA_SHA256_");
  const certName = pickByPrefix("cert_");
  const firstCidName = pickByPrefix("first_cid_");
  const prevCidName = pickByPrefix("prev_cid_");
  const tailName = pickByPrefix("tail_");
  const wsName = pickByPrefix("world_state_");

  const signature = signatureName ? await catToString(ipfs, entries.get(signatureName)) : null;
  const cert = certName ? await catToString(ipfs, entries.get(certName)) : null;
  const firstCid = firstCidName ? await catToString(ipfs, entries.get(firstCidName)) : "";
  const prevCid = prevCidName ? await catToString(ipfs, entries.get(prevCidName)) : "";
  const tail = tailName ? await catToString(ipfs, entries.get(tailName)) : null;
  const worldState = wsName ? await catToString(ipfs, entries.get(wsName)) : null;

  return {
    schemaVersion: 0,
    timestamp: null,
    firstCid: firstCid || "",
    prevCid: prevCid || "",
    tail,
    worldState,
    signature,
    cert,
    manifest: null,
  };
}

async function addPublicationDirectory(ipfs, files) {
  const root = "publication";
  const addEntries = files.map((f) => ({
    path: `${root}/${f.path}`,
    content: f.content,
  }));

  let rootCid = null;
  for await (const entry of ipfs.addAll(addEntries, { wrapWithDirectory: true })) {
    if (entry.path === root) rootCid = entry.cid.toString();
  }
  return rootCid;
}

// Write blockchain tail + world state to IPFS, then publish to IPNS (Kubo key)
exports.writeIPFS = async (tail, ws, ipfs) => {
  try {
    const keyName = process.env.IPNS_KEY_NAME || DEFAULT_IPNS_KEY_NAME;
    await exports.ensureIpnsKey(ipfs, keyName);

    const prevCid = await resolveLatestCidFromKey(ipfs, keyName);
    let firstCid = "";
    if (prevCid) {
      const prevPub = await readPublication(ipfs, prevCid);
      firstCid = prevPub?.firstCid || prevCid;

      // Heal chains that started with an invalid manifest.json (e.g. dev/test publishes)
      // If the referenced first CID exists but has an unparsable manifest, reset the chain
      // to start at the previous CID so future publications are clean/deterministic.
      if (firstCid) {
        const firstPub = await readPublication(ipfs, firstCid);
        if (firstPub?.manifest === null && typeof firstPub?.manifestRaw === "string") {
          logger.warn(
            `First CID ${firstCid} has invalid manifest.json; resetting firstCid to ${prevCid}`
          );
          firstCid = prevCid;
        }
      }
    }

    const certPem = fs.readFileSync(path.join(__dirname, "../keys/ipfs-cert.pem"), "utf8");
    const signature = signContent(
      normalizeToString(tail),
      normalizeToString(ws),
      firstCid,
      prevCid || "",
      certPem
    );

    const manifest = {
      schemaVersion: 1,
      timestamp: Date.now(),
      firstCid: firstCid || "",
      prevCid: prevCid || "",
    };

    const rootCid = await addPublicationDirectory(ipfs, [
      { path: "manifest.json", content: Buffer.from(JSON.stringify(manifest, null, 2)) },
      { path: "tail.json", content: Buffer.from(normalizeToString(tail)) },
      { path: "world_state.json", content: Buffer.from(normalizeToString(ws)) },
      { path: "cert.pem", content: Buffer.from(certPem) },
      { path: "signature.txt", content: Buffer.from(signature) },
    ]);

    if (!rootCid) throw new Error("Failed to compute publication root CID");

    await ipfs.name.publish(`/ipfs/${rootCid}`, { key: keyName, allowOffline: true });
    logger.info(`IPFS publication created: ${rootCid} (IPNS key: ${keyName})`);
    return rootCid;
  } catch (error) {
    logger.error(error);
    return null;
  }
};

// Return the first tail registered on IPFS
exports.getFirstTailOnIPFS = async (ipfs) => {
  const keyName = process.env.IPNS_KEY_NAME || DEFAULT_IPNS_KEY_NAME;
  const currentCid = await resolveLatestCidFromKey(ipfs, keyName);
  if (!currentCid) return null;

  const currentPub = await readPublication(ipfs, currentCid);
  const firstCid = currentPub?.firstCid || currentCid;
  const firstPub = await readPublication(ipfs, firstCid);
  return firstPub?.tail || null;
};

// Return the last tail registered on IPFS
exports.getLastTailOnIPFS = async (ipfs) => {
  const keyName = process.env.IPNS_KEY_NAME || DEFAULT_IPNS_KEY_NAME;
  const currentCid = await resolveLatestCidFromKey(ipfs, keyName);
  if (!currentCid) return null;

  const currentPub = await readPublication(ipfs, currentCid);
  return currentPub?.tail || null;
};

// Get content of a given CID
exports.getCidContent = async (cid, ipfs) => {
  try {
    return await readPublication(ipfs, cid);
  } catch (error) {
    logger.error(error);
    return null;
  }
};

// Get CID linked to an IPNS address (or default key if omitted)
exports.getIpnsContent = async (ipnsAddress, ipfs) => {
  try {
    const keyName = process.env.IPNS_KEY_NAME || DEFAULT_IPNS_KEY_NAME;
    await exports.ensureIpnsKey(ipfs, keyName);

    if (ipnsAddress && typeof ipnsAddress === "string" && ipnsAddress.trim()) {
      const resolvedCid = await resolveNameToCid(ipfs, `/ipns/${ipnsAddress.trim()}`);
      return { cid: resolvedCid, ipnsName: ipnsAddress.trim(), keyName: null };
    }

    const ipnsName = await getKeyId(ipfs, keyName);
    const cid = ipnsName ? await resolveNameToCid(ipfs, `/ipns/${ipnsName}`) : null;
    return { cid, ipnsName, keyName };
  } catch (error) {
    logger.error(error);
    return null;
  }
};

/////// AUX //////
// Concat transparency log content (tail + ws + firstCid + prevCid + cert) and sign it
const signContent = (tail, ws, firstCid, prevCid, cert) => {
  //concat
  const concat = tail.concat(ws, firstCid, prevCid, cert);
  // console.log(concat)

  //get RSA private key
  const ipfsPrivateKey = fs.readFileSync(
    path.join(__dirname, "../keys/ipfs-key.pem")
  );
  const privateKey = crypto.createPrivateKey({
    key: ipfsPrivateKey,
    format: "pem",
    type: "pkcs8",
    // 'cipher': 'rsa',
    passphrase: process.env.IPFS_SECRET_KEY,
  });

  //sign
  let signer = crypto.createSign("RSA-SHA256");
  signer.write(concat);
  signer.end();
  const signature = signer.sign(privateKey, "base64");

  // verifySignature(signature, tailWs);

  return signature;
};
 
// verifySignature (unused in current flow, but useful for debugging)
const verifySignature = async (signature, content) => {
  const cert = fs.readFileSync(path.join(__dirname, "../keys/ipfs-cert.pem"));
  const pubKey = crypto.createPublicKey(cert);

  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(content);
  const result = verifier.verify(pubKey, signature, "base64");

  logger.info("Resultado da verificação de assinatura:", result); //true or false
};

/////////// Legacy notes (Helia experiments kept as comments) ///////////

// mkdir ./ledger (before that, create root if needed)
// let dirName = "ledger";
// const ledgerDirCid = await mkdir(fs, dirName);
// logger.info(`Created empty directory ${dirName}:`, ledgerDirCid.toString());

// // mkdir ./ledger/checkpoint1
// dirName = Date.now().toString();
// const newCheckpointDirCid = await mkdir(fs, dirName, ledgerDirCid);
// logger.info(`Created empty directory ${dirName}:`, newCheckpointDirCid.toString());

// // cp world_state.txt ledger/ (arquivo é adicionado ao MFS)
// const updatedDirCid = await cp(fs, newCheckpointDirCid, ledgerDirCid, "ledger-teste");
// logger.info(`Added ${"ledger-teste"} to ${dirName}. Updated directory cid:`, updatedDirCid.toString());

// vim world_state.txt (cria arquivo fora do MFS ainda)
// const fileName = "world_state.txt";
// const fileCid = await fs.addBytes(encoder.encode("Um belo world state"));
// logger.info(`Added file ${fileName} to IPFS:`, fileCid.toString());

// // cp world_state.txt ledger/ (arquivo é adicionado ao MFS)
// const updatedDirCid = await cp(fs, newCheckpointDirCid, fileCid, fileName);
// logger.info(`Added ${fileName} to ${dirName}. Updated directory cid:`, updatedDirCid.toString());

// console.log("ledgerDirCid!!!!!");
// await ls(fs, ledgerDirCid);

// console.log("newCheckpointDirCid!!!!!");
// await ls(fs, newCheckpointDirCid);

// console.log("updatedDirCid!!!!!");
// await ls(fs, updatedDirCid);

// or doing the same thing as a stream
// let a = [];
// for await (const entry of fs.addAll([
//   {
//     path: "./teste/teste2/foo.txt",
//     content: encoder.encode("Um belo world state"),
//   },
// ])) {
//   a.push(entry);

//   console.info(entry);
//   entry.unixfs ? "" : cat(fs, entry.cid); // file => cat(file)
// }
// console.log("/////////////////////");

// console.log(a.reverse()[2]);

// console.log("/////////////////////");

// for await (const entry of fs.addAll([
//   {
//     path: "./teste/teste2/foo2.txt",
//     content: encoder.encode("Um belo world state"),
//   },
// ])) {
//   console.info(entry);
//   entry.unixfs ? "" : cat(fs, entry.cid); // file => cat(file)
// }

// const cid = await fs.addFile({
//   path: "./teste/teste2/foo2.txt",
//   content: encoder.encode("Um belo world state"),
//   mode: 0x755,
//   mtime: {
//     secs: 10n,
//     nsecs: 0,
//   },
// });

// console.info(cid);
// ls(fs, cid);

////////////////////HELIA SEM libp2p/////////////////////////

// // import { createHelia } from "helia";

// // create a Helia node

// let helia;

// async function loadIpfs() {
//   const { createHelia } = await import("helia");

//   logger.info("Creating IPFS object...");

//   helia = await createHelia();

//   logger.info("Done. Node Peer ID:", helia.libp2p.peerId);
// }

// exports.writeIPFS = async (data) => {
//   try {
//     const { unixfs } = await import("@helia/unixfs");

//     //initialize IPFS if it didn't happen already
//     if (!helia) await loadIpfs();

//     //WRITE
//     // create a filesystem on top of Helia, in this case it's UnixFS
//     const fs = unixfs(helia);

//     // we will use this TextEncoder to turn strings into Uint8Arrays
//     const encoder = new TextEncoder();

//     // add the bytes to your node and receive a unique content identifier
//     const cid = await fs.addBytes(encoder.encode("Hello World 101"), helia.blockstore);

//     logger.info("Added file:", cid.toString());

//     //READ
//     // this decoder will turn Uint8Arrays into strings
//     const decoder = new TextDecoder();
//     let text = "";

//     for await (const chunk of fs.cat(cid)) {
//       text += decoder.decode(chunk, {
//         stream: true,
//       });
//     }

//     console.log("Added file contents:", text);

//write (not using MFS)
// const { cid } = await ipfs.add(JSON.stringify(data, { pin: false }));

// const timestamp = Date.now();
// // await ipfs.files.mkdir(`/${timestamp}`);
// // await ipfs.files.mkdir(`/${timestamp}`);
// console.log("AA");

// await ipfs.files.write("/tail.json", "teste", { create: true });
// const { cid } = await ipfs.files.stat("/tail.json");
// console.log(cid);

// // let ipfsData = [];
// let ipfsData = "";
// for await (const chunk of ipfs.files.read(cid)) {
//   ipfsData = chunk;
//   // ipfsData.push(chunk);
// }
// // console.log(uint8ArrayConcat(ipfsData).toString());
// console.log(ipfsData);

// console.log("BB");
// // const { cid } = await ipfs.files.write("/tail.json", data);
// cid = "banana";

// The address of your files.

// await ipfs.stop();
// await ipfs.start();
// const res = await ipfs.name.publish(cid);
// logger.info("cabou");
// You now have a res which contains two fields:
//   - name: the name under which the content was published.
//   - value: the "real" address to which Name points.
// logger.info(`https://gateway.ipfs.io/ipns/${res.name}`);

// const addr = `/ipfs/${cid.toString()}`;
// logger.info(addr);
// const res = await ipfs.name.publish(addr, { allowOffline: true });

// const { cidd } = await ipfs.add(JSON.stringify({ data: "data" }, { pin: false }));
// const addrr = `/ipfs/${cidd.toString()}`;
// await ipfs.name.publish(addrr, { allowOffline: true });

// const res = await ipfs.name.publish(addr, { allowOffline: true, resolve: false, lifetime: "2h" });

// const res = await ipfs.name.publish(addr);
// this.node.name...
// logger.info(`https://gateway.ipfs.io/ipns/${res.name}`);

// return cid;
//   } catch (error) {
//     logger.error("DEU ERRO EIN", error);
//   }
// };

// exports.readIPFS = async (cid) => {
//   try {
//     //initialize IPFS if it didn't happen already
//     if (!helia) await loadIpfs();

// //resolver ipns address (i.e. get ipfs address)
// const ipnsAddr = "/ipns/12D3KooWP3YLBzYKvQR3fpdfBXLgdj1FX6VGJTDpLg4JAyPJVXZX";
// ipfsAddr = "";
// for await (const name of ipfs.name.resolve(ipnsAddr)) {
//   ipfsAddr = name;
//   // an ipfsAddr concat should go here?
// }
// logger.info(`IPNS addres ${ipnsAddr} points to ${ipfsAddr}`);

// const ipfsData = [];
// for await (const chunk of ipfs.files.read("/tail.json")) {
//   ipfsData.push(chunk);
// }
// console.log(uint8ArrayConcat(ipfsData).toString());

// //read from ipfs (without MFS)
// // let ipfsData = "";
// // for await (const chunk of ipfs.cat(ipfsAddr)) {
// //   ipfsData = Buffer.from(chunk).toString("utf8");
// //   // an ipfsData concat should go here?
// // }

// logger.info("Data retrieved from the IPFS");

// return ipfsData;
//   } catch (error) {
//     logger.error("DEU RUIM", error);
//   }
// };

////////// IPFS-CORE ////////////
// const logger = require("./logger");

// let ipfs;

// async function loadIpfs() {
//   const { create } = await import("ipfs-core"); //done here because of ESM

//   logger.info("Creating IPFS object...");

//   ipfs = await create();
// }

// exports.writeIPFS = async (data) => {
//   try {
//     //initialize IPFS if it didn't happen already
//     if (!ipfs) await loadIpfs();

//     //write (not using MFS)
//     // const { cid } = await ipfs.add(JSON.stringify(data, { pin: false }));

//     const timestamp = Date.now();
//     // await ipfs.files.mkdir(`/${timestamp}`);
//     // await ipfs.files.mkdir(`/${timestamp}`);
//     console.log("AA");

//     await ipfs.files.write("/tail.json", "teste", { create: true });
//     const { cid } = await ipfs.files.stat("/tail.json");
//     console.log(cid);

//     // let ipfsData = [];
//     let ipfsData = "";
//     for await (const chunk of ipfs.files.read(cid)) {
//       ipfsData = chunk;
//       // ipfsData.push(chunk);
//     }
//     // console.log(uint8ArrayConcat(ipfsData).toString());
//     console.log(ipfsData);

//     console.log("BB");
//     // const { cid } = await ipfs.files.write("/tail.json", data);
//     cid = "banana";

//     // The address of your files.

//     // await ipfs.stop();
//     // await ipfs.start();
//     // const res = await ipfs.name.publish(cid);
//     // logger.info("cabou");
//     // You now have a res which contains two fields:
//     //   - name: the name under which the content was published.
//     //   - value: the "real" address to which Name points.
//     // logger.info(`https://gateway.ipfs.io/ipns/${res.name}`);

//     const addr = `/ipfs/${cid.toString()}`;
//     logger.info(addr);
//     const res = await ipfs.name.publish(addr, { allowOffline: true });

//     // const { cidd } = await ipfs.add(JSON.stringify({ data: "data" }, { pin: false }));
//     // const addrr = `/ipfs/${cidd.toString()}`;
//     // await ipfs.name.publish(addrr, { allowOffline: true });

//     // const res = await ipfs.name.publish(addr, { allowOffline: true, resolve: false, lifetime: "2h" });

//     // const res = await ipfs.name.publish(addr);
//     // this.node.name...
//     logger.info(`https://gateway.ipfs.io/ipns/${res.name}`);

//     return cid;
//   } catch (error) {
//     logger.info("DEU ERRO EIN", error);
//   }
// };

// exports.readIPFS = async (cid) => {
//   try {
//     //initialize IPFS if it didn't happen already
//     if (!ipfs) await loadIpfs();

//     //resolver ipns address (i.e. get ipfs address)
//     const ipnsAddr = "/ipns/12D3KooWP3YLBzYKvQR3fpdfBXLgdj1FX6VGJTDpLg4JAyPJVXZX";
//     ipfsAddr = "";
//     for await (const name of ipfs.name.resolve(ipnsAddr)) {
//       ipfsAddr = name;
//       // an ipfsAddr concat should go here?
//     }
//     logger.info(`IPNS addres ${ipnsAddr} points to ${ipfsAddr}`);

//     const ipfsData = [];
//     for await (const chunk of ipfs.files.read("/tail.json")) {
//       ipfsData.push(chunk);
//     }
//     console.log(uint8ArrayConcat(ipfsData).toString());

//     //read from ipfs (without MFS)
//     // let ipfsData = "";
//     // for await (const chunk of ipfs.cat(ipfsAddr)) {
//     //   ipfsData = Buffer.from(chunk).toString("utf8");
//     //   // an ipfsData concat should go here?
//     // }

//     logger.info("Data retrieved from the IPFS");

//     return ipfsData;
//   } catch (error) {
//     logger.info(error);
//   }
// };

////////// IPFS-MINI ////////////
// const IPFS = require("ipfs-mini");

// exports.writeIPFS = async (dto) => {
//   const ipfs = new IPFS();
//   return ipfs.addJSON(dto);
// };

// exports.readIPFS = async (hash) => {
//   const ipfs = new IPFS({ port: 8080 });
//   return ipfs.cat(hash);
// };
