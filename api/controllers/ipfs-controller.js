const logger = require("../util/logger");
const HttpError = require("../util/http-error");
// const { setURI } = require("../controllers/invoke-controller");
const ipfs = require("../util/ipfs");
const { getBlockchainTailLocal, getWorldStateLocal } = require("./query-controller");
// const { getURILocal } = require("./query-controller");

exports.createIpfsNode = async () => {
  try {
    const helia = await ipfs.createNode();
    if (helia) {
      logger.info("IPFS environment initialized successfully!");
      return helia;
    }

  } catch (error) {
    return new HttpError(500, error);
  }
}

//post blockchain's tail + world state + previous cid to the IPFS
//used by crontab
exports.postTransparencyLog = async (req, res, next) => {
  const chaincodeName = "chaincode";
  const channelName = "channel1";

  try {
    const helia = req.helia;
    
    // Get blockchain tail
    let tail = await getBlockchainTailLocal(chaincodeName, channelName);
    tail = JSON.stringify(tail, null, 4);

    // Get world state
    const ws = await getWorldStateLocal(chaincodeName, channelName);

    // Write to IPFS and get CID
    const cid = await ipfs.writeIPFS(tail, ws, helia);

    if (cid) {
      logger.info("Transparency log posted to IPFS with CID:", cid);
      // Return consistent response format with CID string
      res.status(200).json({ 
        success: true,
        message: "Transparency log posted to IPFS successfully", 
        cid: cid.toString() // Ensure CID is string
      });
    } else {
      logger.error("IPFS publication failed!");
      next(new HttpError(500, "IPFS publication failed"));
    }
  } catch (error) {
    next(new HttpError(500, "Error posting transparency log: " + error)); 
  }
};

exports.getCidContent = async (req, res, next) => {
  const cid = req.query.cid;

  try {
    const helia = req.helia;
    
    // Get content
    const result = await ipfs.getCidContent(cid, helia);

    if (result) {
      res.status(200).json({ 
        success: true,
        content: result.catContent,
        pubKey: result.pubKey,
        message: "Content retrieved from IPFS successfully", 
      });
    } else {
      next(new HttpError(500, "CID not found"));
    }
  } catch (error) {
    next(new HttpError(500, "Error retrieving transparency log: " + error)); 
  }
};

//get cid linked to the ipns address
exports.getIpnsContent = async (req, res, next) => {
  const ipnsAddress = req.query.ipnsAddress;

  try {
    const helia = req.helia;
    
    // Get content
    const content = await ipfs.getIpnsContent(ipnsAddress, helia);

    if (content) {
      res.status(200).json({ 
        success: true,
        content,
        message: "Content retrieved from IPNS successfully", 
      });
    } else {
      next(new HttpError(500, "IPNS address not found. Is there something published on IPFS already?"));
    }
  } catch (error) {
    next(new HttpError(500, "Error retrieving drom IPNS: " + error)); 
  }
};

exports.getFirstTailOnIPFS = async (req, res, next) => {
  try {
    const helia = req.helia;
    
    // Get content
    const result = await ipfs.getFirstTailOnIPFS(helia);

    res.status(200).json(result);
  } catch (error) {
    next(new HttpError(500, "Error retrieving first tail: " + error)); 
  }
};

exports.getLastTailOnIPFS = async (req, res, next) => {
  try {
    const helia = req.helia;
    
    // Get content
    const result = await ipfs.getLastTailOnIPFS(helia);

    res.status(200).json(result);
  } catch (error) {
    next(new HttpError(500, "Error retrieving last tail: " + error)); 
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
