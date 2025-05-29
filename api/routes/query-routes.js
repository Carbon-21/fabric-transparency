const { Router } = require("express");
const { body, query, param } = require("express-validator");

const { validateAll } = require("../util/validation");
const checkAuth = require("../middleware/check-auth");
const queryController = require("../controllers/query-controller.js");

const router = Router();

// UNAUTHENTICATHED ROUTES
router.get(
  "/channels/:channel/chaincodes/:chaincode/getBlockByNumber",
  [
    param("channel").trim().not().isEmpty().isString(),
    param("chaincode").trim().not().isEmpty().isString(),
    query("blockNumber").trim().not().isEmpty().isString(),
    validateAll,
  ],
  queryController.getBlockByNumber
);

router.get(
  "/channels/:channel/chaincodes/:chaincode/getBlockchainTail",
  [param("channel").trim().not().isEmpty().isString(), param("chaincode").trim().not().isEmpty().isString(), validateAll],
  queryController.getBlockchainTail
);

router.get(
  "/channels/:channel/chaincodes/:chaincode/getWorldState",
  [param("channel").trim().not().isEmpty().isString(), param("chaincode").trim().not().isEmpty().isString(), validateAll],
  queryController.getWorldState
);

router.get(
  "/channels/:channel/chaincodes/:chaincode/getRangeOfBlocks",
  [
    param("channel").trim().not().isEmpty().isString(),
    param("chaincode").trim().not().isEmpty().isString(),
    query("min").trim().not().isEmpty().isString(),
    query("max").trim().not().isEmpty().isString(),
    validateAll,
  ],
  queryController.getRangeOfBlocks
);

router.get(
  "/channels/:channel/chaincodes/:chaincode/getBlocksWithChaincodeDeployment",
  [
    param("channel").trim().not().isEmpty().isString(),
    param("chaincode").trim().not().isEmpty().isString(),
    validateAll,
  ],
  queryController.getBlocksWithChaincodeDeployment
);

// AUTHENTICATHED ROUTES
router.use(checkAuth);

router.get(
  "/channels/:channel/chaincodes/:chaincode/selfBalance",
  [param("channel").trim().not().isEmpty().isString(), param("chaincode").trim().not().isEmpty().isString(), query("tokenId").trim().not().isEmpty().isString(), validateAll],
  queryController.selfBalance
);

module.exports = router;
