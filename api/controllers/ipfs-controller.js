//IPFS controller. The functions here relate to IPFS, setting up its structure or writing/reading from there

const logger = require("../util/logger");
const HttpError = require("../util/http-error");
// const { setURI } = require("../controllers/invoke-controller");
const ipfs = require("../util/ipfs");
const {
  getBlockchainTailLocal,
  getWorldStateLocal,
} = require("./query-controller");
// const { getURILocal } = require("./query-controller");

// create a Kubo RPC client (singleton in app.js)
exports.createIpfsClient = async () => {
  try {
    const client = await ipfs.createClient();
    if (client) {
      await ipfs.ensureIpnsKey(client);
      logger.info("IPFS (Kubo RPC) initialized successfully!");
      return client;
    }
  } catch (error) {
    return new HttpError(500, error);
  }
};

// Backwards-compatible export name (older app.js expects this)
exports.createIpfsNode = exports.createIpfsClient;

//post blockchain's tail + world state + previous cid to the IPFS
//used by crontab
exports.postTransparencyLog = async (req, res, next) => {
  const chaincodeName = "chaincode";
  const channelName = "channel1";

  try {
    const client = req.ipfs;

    // Get blockchain tail
    let tail = await getBlockchainTailLocal(chaincodeName, channelName);
    tail = JSON.stringify(tail, null, 4);

    // Get world state
    const ws = await getWorldStateLocal(chaincodeName, channelName);

    // Write to IPFS and get CID
    const cid = await ipfs.writeIPFS(tail, ws, client);

    if (cid) {
      logger.info("Transparency log posted to IPFS with CID:", cid);
      // Return consistent response format with CID string
      res.status(200).json({
        success: true,
        message: "Transparency log posted to IPFS successfully",
        cid: cid.toString(), // Ensure CID is string
      });
    } else {
      logger.error("IPFS publication failed!");
      next(new HttpError(500, "IPFS publication failed"));
    }
  } catch (error) {
    next(new HttpError(500, "Error posting transparency log: " + error));
  }
};

//get the content of a given publication, using its CID (content identifier)
exports.getCidContent = async (req, res, next) => {
  const cid = req.query.cid;

  try {
    const client = req.ipfs;

    // Get content
    const result = await ipfs.getCidContent(cid, client);

    if (result) {
      res.status(200).json({
        success: true,
        content: result,
        message: "Content retrieved from IPFS successfully",
      });
    } else {
      next(new HttpError(500, "CID not found"));
    }
  } catch (error) {
    next(new HttpError(500, "Error retrieving transparency log: " + error));
  }
};

//get cid linked to the ipns address, which points to a given CID (identifier of a publication)
exports.getIpnsContent = async (req, res, next) => {
  const ipnsAddress = req.query.ipnsAddress;

  try {
    const client = req.ipfs;

    // Get content
    const content = await ipfs.getIpnsContent(ipnsAddress, client);

    if (content) {
      res.status(200).json({
        success: true,
        content: content.cid,
        ipnsName: content.ipnsName,
        keyName: content.keyName,
        message: "Content retrieved from IPNS successfully",
      });
    } else {
      next(
        new HttpError(
          500,
          "IPNS address not found. Is there something published on IPFS already?"
        )
      );
    }
  } catch (error) {
    next(new HttpError(500, "Error retrieving drom IPNS: " + error));
  }
};

//get the tail of the first publication on IPFS
exports.getFirstTailOnIPFS = async (req, res, next) => {
  try {
    const client = req.ipfs;

    // Get content
    const result = await ipfs.getFirstTailOnIPFS(client);

    res.status(200).json(result);
  } catch (error) {
    next(new HttpError(500, "Error retrieving first tail: " + error));
  }
};

//get the tail of the last publication on IPFS
exports.getLastTailOnIPFS = async (req, res, next) => {
  try {
    const client = req.ipfs;

    // Get content
    const result = await ipfs.getLastTailOnIPFS(client);

    res.status(200).json(result);
  } catch (error) {
    next(new HttpError(500, "Error retrieving last tail: " + error));
  }
};

// Check if public gateways have synced with our local node's IPNS record
exports.getGatewaySyncStatus = async (req, res, next) => {
  try {
    const client = req.ipfs;
    const result = await ipfs.getGatewaySyncStatus(client);
    res.status(200).json({
      success: true,
      ...result,
      message: "Gateway sync status retrieved",
    });
  } catch (error) {
    next(new HttpError(500, "Error retrieving gateway sync status: " + error));
  }
};

//get last block posted to IPFS
//deprecated: IPFS' cid not save onchain anymore. we are now using IPNS. "last ipfs block" isn't displayed on logs page anymore, because... why doing it?
// exports.getLatestIPFSBlock = async (req, res, next) => {
//   const chaincodeName = "chaincode";
//   const channelName = "channel1";
//   const org = "Org1";

//   //get get date in dd-mm-yyyy format
//   let currentDate = new Date();
//   currentDate = currentDate.getDate() + "-" + (currentDate.getMonth() + 1) + "-" + currentDate.getFullYear();

//   try {
//     //get IPFS URI from the ledger, using current date as key
//     const uri = await getURILocal(String(currentDate), org, chaincodeName, channelName);
//     if (!uri) return next(new HttpError(404, "Nenhum bloco adicionado ao IPFS"));
//     logger.info("IFPS URI retrieved from the ledger:", uri);

//     //get block info from the IPFS
//     let ipfsData = await ipfs.readIPFS(uri.replace("ipfs://", ""));
//     let ipfsDataJson = (await ipfsData) ? JSON.parse(ipfsData) : null;
//     logger.info("Block data retrieved from the IPFS");

//     return res.json({ tail: ipfsDataJson });
//   } catch (error) {
//     return next(new HttpError(500));
//   }
// };
