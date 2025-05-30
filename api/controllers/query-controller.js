const logger = require("../util/logger");
const HttpError = require("../util/http-error");
const helper = require("../util/helper");
const fabproto6 = require("fabric-protos");
const { BlockDecoder } = require("fabric-common");

//return the balance of the requesting client's account, for a given token
exports.selfBalance = async (req, res, next) => {
  const chaincodeName = req.params.chaincode;
  const channel = req.params.channel;
  const tokenId = req.query.tokenId;
  const username = req.jwt.username;
  const org = req.jwt.org;

  //connect to the channel and get the chaincode
  const [chaincode, gateway] = await helper.getChaincode(
    org,
    channel,
    chaincodeName,
    username,
    next
  );
  if (!chaincode) return;

  //get balance
  try {
    let result = await chaincode.evaluateTransaction(
      "SmartContract:SelfBalance",
      tokenId
    );
    result = JSON.parse(result.toString());

    //close communication channel
    await gateway.disconnect();

    //send OK response
    logger.info(`${tokenId} balance retrieved successfully: ${result} `);
    return res.json({
      result,
    });
  } catch (err) {
    return next(new HttpError(500, err.message));
  }
};


//get entire world state
exports.getWorldState = async (req, res, next) => {
  logger.trace(`Entered getWorldState controller`);
  const chaincodeName = req.params.chaincode;
  const channel = req.params.channel;

  //connect to the channel and get the chaincode
  const [chaincode, gateway] = await helper.getChaincode("Org1", channel, chaincodeName, "admin", next);
  if (!chaincode) return;

  //get balance
  try {
    let result = await chaincode.evaluateTransaction("SmartContract:GetWorldState");

    result = Buffer.from(result).toString();

    //close communication channel
    await gateway.disconnect();

    //send OK response
    logger.info(`World state fetched!`);
    return res.json({
      result: result === "" ? "" : JSON.parse(result),
    });
  } catch (err) {
    return next(new HttpError(500, err));
  }
};

//get world state
//used on transparency log's crontab (thus local)
exports.getWorldStateLocal = async (chaincodeName, channelName) => {
  //connect to the channel and get the gateway
  const [chaincode, gateway] = await helper.getChaincode("Org1", channelName, chaincodeName, "admin", null);

  //get ws
  try {
    let result = await chaincode.evaluateTransaction("SmartContract:GetWorldState");

    result = Buffer.from(result).toString();

    //close communication channel
    await gateway.disconnect();

    //send OK response
    logger.debug(`World state fetched!`);
    return result;
  } catch (err) {
    return new HttpError(500, err);
  }
};

//get last block
exports.getBlockByNumber = async (req, res, next) => {
  const chaincodeName = req.params.chaincode;
  const channelName = req.params.channel;
  let blockNumber = req.query.blockNumber;

  // //connect to the channel and get the
  const [chaincode, gateway] = await helper.getChaincode("Org1", channelName, chaincodeName, "admin", next);

  try {
    //use QSCC
    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract("qscc");

    //get last block number
    let info = await contract.evaluateTransaction("GetChainInfo", channelName);
    info = fabproto6.common.BlockchainInfo.decode(info);
    let tailNumber = info.height.low - 1;

    //adjust initial block number, if needed
    if (blockNumber === "beginning") blockNumber = 0;

    //get block number, if user requested it
    if (blockNumber === "end") blockNumber = tailNumber;

    //if requested range is out of boundaries or isn't int => error
    blockNumber = parseInt(blockNumber);
    if (!Number.isInteger(blockNumber) || blockNumber < 0 || blockNumber > tailNumber) return next(new HttpError(500, "Invalid value."));


    //get block
    let block = await contract.evaluateTransaction("GetBlockByNumber", channelName, String(blockNumber));

    //decode block
    block = BlockDecoder.decode(block);

    //decode block's fields, when possible
    if (blockNumber > 1) decodeBlockBuffers(block);

    //close communication channel
    await gateway.disconnect();

    //send OK response
    logger.info(`Block fetched!`);
    return res.json({
      block,
      info,
      blockNumber
    });
  } catch (err) {
    return next(new HttpError(500, err));
  }
};

//get last block
exports.getBlockchainTail = async (req, res, next) => {
  const chaincodeName = req.params.chaincode;
  const channelName = req.params.channel;

  // //connect to the channel and get the
  const [chaincode, gateway] = await helper.getChaincode("Org1", channelName, chaincodeName, "admin", next);

  try {
    //use QSCC
    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract("qscc");

    //get last block's number
    let info = await contract.evaluateTransaction("GetChainInfo", channelName);
    info = fabproto6.common.BlockchainInfo.decode(info);
    let tailNumber = info.height.low - 1;

    //get blockhain's tail
    let tail = await contract.evaluateTransaction("GetBlockByNumber", channelName, String(tailNumber));

    //decode block
    tail = BlockDecoder.decode(tail);

    //decode block's fields
    decodeBlockBuffers(tail);

    //close communication channel
    await gateway.disconnect();

    //send OK response
    logger.info(`Tail fetched!`);
    return res.json({
      tail,
      info,
    });
  } catch (err) {
    return next(new HttpError(500, err));
  }
};

//used on transparency log's crontab
exports.getBlockchainTailLocal = async (chaincodeName, channelName) => {
  // //connect to the channel and get the
  const [chaincode, gateway] = await helper.getChaincode("Org1", channelName, chaincodeName, "admin", null);

  try {
    //use QSCC
    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract("qscc");

    //get last block's number
    let info = await contract.evaluateTransaction("GetChainInfo", channelName);
    info = fabproto6.common.BlockchainInfo.decode(info);
    let tailNumber = info.height.low - 1;

    //get blockhain's tail
    let tail = await contract.evaluateTransaction("GetBlockByNumber", channelName, String(tailNumber));
    tail = BlockDecoder.decode(tail);
    // decodeBlockBuffers(tail); //additional decoding

    //close communication channel
    await gateway.disconnect();

    tail.info = info;

    //send OK response
    logger.info(`Tail fetched!`);
    return tail;
  } catch (err) {
    return new HttpError(500, err);
  }
};

//get blocks where chaincodes were deployed
exports.getBlocksWithChaincodeDeployment = async (req, res, next) => {
  const chaincodeName = req.params.chaincode;
  const channelName = req.params.channel;


  // //connect to the channel and get the
  const [chaincode, gateway] = await helper.getChaincode("Org1", channelName, chaincodeName, "admin", next);

  try {
    //use QSCC
    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract("qscc");

    //get tail's number
    let info = await contract.evaluateTransaction("GetChainInfo", channelName);
    info = fabproto6.common.BlockchainInfo.decode(info);
    const tailNumber = info.height.low - 1;

    //get blocks and put them in array if they contain "chaincode:", which indicates a chaincode deploy
    let blocks = [];
    let indexes = [];
    let hashes = [];
    for (let i = 2; i <= tailNumber; i++) {
      //get block
      let block = await contract.evaluateTransaction("GetBlockByNumber", channelName, String(i));

      //decode block
      block = BlockDecoder.decode(block);
      decodeBlockBuffers(block);

      //check for deployment
      var obj1_str = JSON.stringify(block);
      const regex = /chaincode:([a-zA-Z0-9]+)/g;

      // Extract all hash values using match() and regex
      let matches = [];
      let match;
      while ((match = regex.exec(obj1_str)) !== null) {
          // match[1] contains the hash value (the part after "chaincode:")
          matches.push(match[1]);
      }

      // if there is a deployment
      if (matches.length > 0)
      {
        logger.info("Chaincode deployment detected in block: ",i); 

        //append
        blocks.push(block);
        indexes.push(i)
        hashes.push(matches)
      }
    }

    //close communication channel
    await gateway.disconnect();

    //send OK response
    return res.json({
      indexes,
      blocks,
      hashes
    });
  } catch (err) {
    return next(new HttpError(500, err));
  }
};

exports.getRangeOfBlocks = async (req, res, next) => {
  const chaincodeName = req.params.chaincode;
  const channelName = req.params.channel;
  let min = req.query.min;
  let max = req.query.max;

  // //connect to the channel and get the
  const [chaincode, gateway] = await helper.getChaincode("Org1", channelName, chaincodeName, "admin", next);

  try {
    //use QSCC
    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract("qscc");

    //get tail's number
    let info = await contract.evaluateTransaction("GetChainInfo", channelName);
    info = fabproto6.common.BlockchainInfo.decode(info);
    const tailNumber = info.height.low - 1;

    //adjust initial block's number, if needed
    if (min === "beginning") min = 0;

    //get tail's number, if user requested it
    if (max === "end") max = tailNumber;

    //if requested range is out of boundaries or isn't int => error
    min = parseInt(min);
    max = parseInt(max);
    if (!Number.isInteger(min) || !Number.isInteger(max) || min < 0 || max < 0 || max > tailNumber || min > tailNumber || min >= max) return next(new HttpError(500, "Invalid value."));

    //put every requested block in the blocks array
    let blocks = [];
    for (let i = min; i <= max; i++) {
      //get block
      let block = await contract.evaluateTransaction("GetBlockByNumber", channelName, String(i));

      //decode block
      block = BlockDecoder.decode(block);

      //append
      blocks.push(block);
    }

    //close communication channel
    await gateway.disconnect();

    //send OK response
    return res.json({
      blocks,
      min,
      max,
    });
  } catch (err) {
    return next(new HttpError(500, err));
  }
};

//encoded block info can be decoded to utf-8 or base64
decodeBlockBuffers = (block) => {
  // CC package id
  if (block.data.data[0].payload.data.actions[0].payload.chaincode_proposal_payload.input.chaincode_spec.input.args[1])
    block.data.data[0].payload.data.actions[0].payload.chaincode_proposal_payload.input.chaincode_spec.input.args[1] = Buffer.from(
      block.data.data[0].payload.data.actions[0].payload.chaincode_proposal_payload.input.chaincode_spec.input.args[1]
    ).toString("utf8");
    
  block.header.previous_hash = Buffer.from(block.header.previous_hash).toString("base64");
  block.header.data_hash = Buffer.from(block.header.data_hash).toString("base64");

  block.data.data.forEach((item) => {
    item.signature = Buffer.from(item.signature).toString("base64");
    item.payload.header.channel_header.extension = Buffer.from(item.payload.header.channel_header.extension).toString();
    item.payload.header.signature_header.creator.id_bytes = Buffer.from(item.payload.header.signature_header.creator.id_bytes).toString();
    item.payload.header.signature_header.nonce = Buffer.from(item.payload.header.signature_header.nonce).toString("base64");

    item.payload.data.actions.forEach((i) => {
      i.header.creator.id_bytes = Buffer.from(i.header.creator.id_bytes).toString();
      i.header.nonce = Buffer.from(i.header.nonce).toString("base64");
      i.payload.action.proposal_response_payload.proposal_hash = Buffer.from(i.payload.action.proposal_response_payload.proposal_hash).toString("base64");
      i.payload.action.proposal_response_payload.extension.response.payload = Buffer.from(i.payload.action.proposal_response_payload.extension.response.payload).toString();

      i.payload.action.endorsements.forEach((j) => {
        j.signature = Buffer.from(j.signature).toString("base64");
        j.endorser.id_bytes = Buffer.from(j.endorser.id_bytes).toString();
      });
    });
  });

  block.metadata.metadata.forEach((item) => {
    if (item.value) {
      item.value = Buffer.from(item.value).toString("base64");
    }

    if (item.signatures)
      item.signatures.forEach((sig) => {
        sig.signature_header.creator.id_bytes = Buffer.from(sig.signature_header.creator.id_bytes).toString();
        sig.signature_header.nonce = Buffer.from(sig.signature_header.nonce).toString("base64");
        sig.signature = Buffer.from(sig.signature).toString("base64");
      });
  });

  // console.log(Object.keys(block.data.data[0].payload.header));
};