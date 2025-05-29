const logger = require("./logger");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

let catContent = []

exports.createNode = async () => {

  try {
    const { noise } = await import("@chainsafe/libp2p-noise");
    const { yamux } = await import("@chainsafe/libp2p-yamux");
    const { bootstrap } = await import("@libp2p/bootstrap");
    const { tcp } = await import("@libp2p/tcp");
    const { MemoryBlockstore } = await import("blockstore-core");
    const { MemoryDatastore } = await import("datastore-core");
    const { createHelia } = await import("helia");
    const { createLibp2p } = await import("libp2p");
    const { identify } = await import("@libp2p/identify");
    const { unixfs } = await import("@helia/unixfs");
    const { ipns } = await import("@helia/ipns");
    const {generateKeyPairFromSeed } = await import ('@libp2p/crypto/keys')
    
    ///// CREATE IPFS NODE ////
    // the blockstore is where we store the blocks that make up files
    const blockstore = new MemoryBlockstore()

    // application-specific data lives in the datastore
    const datastore = new MemoryDatastore()

    // libp2p is the networking layer that underpins Helia
    const libp2p = await createLibp2p({
      datastore,
      addresses: {
        listen: [
          '/ip4/127.0.0.1/tcp/0'
        ]
      },
      transports: [
        tcp()
      ],
      connectionEncrypters: [
        noise()
      ],
      streamMuxers: [
        yamux()
      ],
      peerDiscovery: [
        bootstrap({
          list: [
            '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
            '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
            '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
            '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
          ]
        })
      ],
      services: {
        identify: identify()
      }
    })

    const helia = await createHelia({
      datastore,
      blockstore,
      libp2p
    })

    //// CREATE IPNS OBJECT ////
     //generate IPNS key pair from a fixed seed
     const seed = new Uint8Array([
      1, 2, 3, 4, 5, 6, 7, 8,
      9, 10, 11, 12, 11, 14, 15, 16,
      17, 18, 19, 20, 21, 22, 23, 24,
      25, 26, 27, 28, 29, 30, 31, 32
    ]);
    const ipnsKeyPair = await generateKeyPairFromSeed('Ed25519',seed)

    //create IPNS object
    const ipnsName = ipns(helia)

    //// CREATE UNIXFS OBJECT ////
    const ipfsFs = unixfs(helia);

    return {ipfs:helia, ipnsKeyPair:ipnsKeyPair, ipns:ipnsName, unixfs:ipfsFs}
  } catch (error) {
    logger.error(error)
  }
}

//write world state + tails + previous cid to ipfs. then link to ipns
exports.writeIPFS = async (tail, ws, helia) => {
  try {
    //get cid from current IPNS reference, if any
    let prevCid
    try {
      prevCid = await helia.ipns.resolve(helia.ipnsKeyPair.publicKey)
    } catch (error) {  
    }
    
    //sign tail+ws+prevCid
    const tailWsSigned = signContent(tail, ws, prevCid);

    //we will use this TextEncoder to turn strings into Uint8Arrays
    const encoder = new TextEncoder();

    //files will have the timestamp in their name
    timestamp = Date.now().toString();

    //////IPFS//////
    let rootDirCid = await helia.unixfs.addDirectory();
    logger.debug("Created root dir:", rootDirCid);

    //vim world_state_<timestamp>.txt (cria arquivo fora do MFS ainda)
    let fileName = `world_state_${timestamp}.txt`;
    const wsCid = await helia.unixfs.addBytes(encoder.encode(ws));
    logger.debug(`Added file ${fileName} to IPFS:`, wsCid.toString());

    //cp world_state_<timestamp>.txt . (arquivo é adicionado ao MFS)
    rootDirCid = await cp(helia.unixfs, rootDirCid, wsCid, fileName);
    logger.debug(`Added ${fileName} to root dir. Updated directory cid:`, rootDirCid.toString());

    //vim tail_<timestamp>.txt (cria arquivo fora do MFS ainda)
    fileName = `tail_${timestamp}.txt`;
    const tailCid = await helia.unixfs.addBytes(encoder.encode(tail));
    logger.debug(`Added file ${fileName} to IPFS:`, tailCid.toString());

    //cp tail_<timestamp>.txt . (arquivo é adicionado ao MFS)
    rootDirCid = await cp(helia.unixfs, rootDirCid, tailCid, fileName);
    logger.debug(`Added ${fileName} to root dir. Updated directory cid:`, rootDirCid.toString());

    //vim prev_cid_<timestamp>.txt (cria arquivo fora do MFS ainda)
    fileName = `prev_cid_${timestamp}.txt`;
    const prevCidCid = await helia.unixfs.addBytes(prevCid ? encoder.encode(prevCid.cid.toString()) : encoder.encode(prevCid));
    logger.debug(`Added file ${fileName} to IPFS:`, prevCidCid.toString());

    //cp prev_cid_<timestamp>.txt . (arquivo é adicionado ao MFS)
    rootDirCid = await cp(helia.unixfs, rootDirCid, prevCidCid, fileName);
    logger.debug(`Added ${fileName} to root dir. Updated directory cid:`, rootDirCid.toString());

    //vim signed_tail_ws__<timestamp>.txt (cria arquivo fora do MFS ainda)
    fileName = `RSA_SHA256_${timestamp}.txt`;
    const signatureCid = await helia.unixfs.addBytes(encoder.encode(tailWsSigned));
    logger.debug(`Added file ${fileName} to IPFS:`, signatureCid.toString());

    //cp tail_<timestamp>.txt . (arquivo é adicionado ao MFS)
    rootDirCid = await cp(helia.unixfs, rootDirCid, signatureCid, fileName);
    logger.debug(`Added ${fileName} to root dir. Updated directory cid:`, rootDirCid.toString());
    logger.info("IPFS, resulting CID: ",rootDirCid.toString())

    /////// IPNS //////
    // publish to IPNS
    await helia.ipns.publish(helia.ipnsKeyPair, rootDirCid)
    logger.info("CID linked to IPNS. IPNS:", helia.ipnsKeyPair.publicKey.toCID(),helia.ipnsKeyPair.publicKey.toString())

    // test: resolve the name
    const result = await helia.ipns.resolve(helia.ipnsKeyPair.publicKey)
    logger.info("Retrieved from IPNS: ", result.cid, result.path)

    return rootDirCid;
  } catch (error) {
    logger.error(error)
  }
};

//get content of a given cid
exports.getCidContent = async (cid, helia) => {
  try {
    //get every file inside the unixfs and put on global varaible catContent
    await recursiveCat(helia.unixfs, cid);

    //TODO verify on frontend
    // verifySignature(catContent[0], Buffer.from(catContent[2].concat(catContent[3],catContent[1])));

    //OLD TODO get pubkey on front
    const cert = fs.readFileSync(path.join(__dirname, "../keys/ipfs-cert.pem"));
    const pubKey = crypto.createPublicKey(cert);


    return {catContent,pubKey};
    
  } catch (error) {
    logger.error(error)
  }
};

//get cid linked to the ipns address
exports.getIpnsContent = async (ipnsAddress, helia) => {
  try {   
    const result = await helia.ipns.resolve(helia.ipnsKeyPair.publicKey)
    logger.info("Retrieved from IPNS: ", result.cid.toString())

    return result.cid.toString()

  } catch (error) {
    logger.error(error)
  }
};

/////// AUX //////
//concat transparent log content (bc tail + ws). Then, sing and return it
const signContent = (tail, ws, cid) => {
  //concat
  const concat = tail.concat(ws,cid);
  // console.log(concat)

  //get RSA private key
  const ipfsPrivateKey = fs.readFileSync(path.join(__dirname, "../keys/ipfs-key.pem"));
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

// verify signature using the signers' certificate
const verifySignature = async (signature, content) => {
  const cert = fs.readFileSync(path.join(__dirname, "../keys/ipfs-cert.pem"));
  const pubKey = crypto.createPublicKey(cert);

  verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(content);
  result = verifier.verify(pubKey, signature, "base64");

  logger.info("Resultado da verificação de assinatura:", result); //true or false
};

const cp = async (fs, dirCid, fileCid, fileName) => {
  const updatedDirCid = await fs.cp(fileCid, dirCid, fileName);

  return updatedDirCid;
};

const cat = async (fs, fileCid) => {
  const decoder = new TextDecoder();

  for await (const buf of fs.cat(fileCid)) {
    // logger.info(decoder.decode(buf));
    // catContent += decoder.decode(buf);
    catContent.push(decoder.decode(buf));
  }
};

//cat everything from a dir
const recursiveCat = async (fs, dirCid) => {
  catContent = []
  for await (const entry of fs.ls(dirCid)) {
    await cat(fs, entry.cid);
  }
};

//////// UNUSED (but useful) ///////
const ipnsPublish = async (cid, peerId, ipnsConfig) => {
  try {
    //update IPNS with new cid
    await ipnsConfig.publish(peerId, cid);
    logger.debug("IPNS updated with new cid", cid);

    // READ: resolve the name and check the content
    // const resolvedCid = await ipnsConfig.resolve(peerId);
    // readIPFS(resolvedCid);
  } catch (error) {
    logger.error(error);
  }
};



//TODO
//get cid from IPNS (if it exists), otherwise create an MFS root dir and return its seed
const getRootCid = async (ipnsConfig, peerId) => {
  //...
  const resolvedCid = await ipnsConfig.resolve(peerId);
  console.log("resolvedCid", resolvedCid);
  //...
};






//// MFS Functions ////
const ls = async (fs, dirCid) => {
  logger.info("$ ls");
  for await (const entry of fs.ls(dirCid)) {
    logger.info(entry);
  }
};

// mkdir: if pathCid is undefined, create dir at root
const mkdir = async (fs, dirName, pathCid) => {
  let emptyDirCid;

  //mkdir in root
  if (pathCid === undefined) {
    //create root (if needed)
    const rootDirCid = await fs.addDirectory();
    logger.debug("Created root dir:", rootDirCid);

    //create intended dir
    emptyDirCid = await fs.mkdir(rootDirCid, dirName);
    logger.debug("Created an empty dir:", emptyDirCid);
  }
  //mkdir inside given path
  else {
    //create intended dir
    emptyDirCid = await fs.mkdir(pathCid, dirName);
    logger.debug("Created an empty dir:", emptyDirCid);
  }

  return emptyDirCid;
};



///////////HELIA: alternativas pro writeIPFS (experimentos com diretórios falharam)///////////////

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
