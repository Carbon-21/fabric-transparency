const { Router } = require("express");
const { body, param } = require("express-validator");

const { validateAll } = require("../util/validation");
const checkAuth = require("../middleware/check-auth");
const invokeController = require("../controllers/invoke-controller.js");

const router = Router();

//// UNAUTHENTICATED ROUTES ////

///// AUTHENTICATED ROUTES /////
// router.use(checkAuth);

router.post(
  "/channels/:channel/chaincodes/:chaincode/mint",
  [
    param("channel").trim().not().isEmpty().isString(),
    param("chaincode").trim().not().isEmpty().isString(),
    body("tokenId").trim().not().isEmpty().isString(),
    body("tokenAmount").trim().not().isEmpty().isInt({ min: 1 }),
    body("tokenReceiver").trim().not().isEmpty().isEmail(),
    validateAll,
  ],
  invokeController.mint
);

router.post(
  "/channels/:channel/chaincodes/:chaincode/mintNFTCompensation",
  [
    param("channel").trim().not().isEmpty().isString(),
    param("chaincode").trim().not().isEmpty().isString(),
    body("idNFTTerra").trim().not().isEmpty().isString(),
    body("compensationTotalArea").trim().not().isEmpty().isString(),
    validateAll,
  ],
  invokeController.mintNFTCompensation
);

router.post(
  "/channels/:channel/chaincodes/:chaincode/fracCompNFT",
  [
    param("channel").trim().not().isEmpty().isString(),
    param("chaincode").trim().not().isEmpty().isString(),
    body("tokenTerraId").trim().not().isEmpty().isString(),
    body("tokenCompensationId").trim().not().isEmpty().isString(),
    body("fracAmount").trim().not().isEmpty().isString(),
    validateAll,
  ],
  invokeController.fracCompNFT
);

// Generate FT from NFT
router.post("/channels/:channel/chaincodes/:chaincode/ftfromnft", [param("channel").not().isEmpty(), param("chaincode").not().isEmpty(), validateAll], invokeController.ftfromnft);

router.post(
  "/channels/:channel/chaincodes/:chaincode/transfer",
  [
    param("channel").trim().not().isEmpty().isString(),
    param("chaincode").trim().not().isEmpty().isString(),
    body("tokenId").trim().not().isEmpty().isString(),
    body("tokenAmount").trim().not().isEmpty().isInt({ min: 1 }),
    body("tokenSender").trim().not().isEmpty().isEmail(),
    body("tokenReceiver").trim().not().isEmpty().isEmail(),
    validateAll,
  ],
  invokeController.transfer
);

// List NFT for sale
router.post(
  "/channels/:channel/chaincodes/:chaincode/setStatus",
  [
    param("channel").not().isEmpty(),
    param("chaincode").not().isEmpty(),
    body("tokenId").trim().not().isEmpty().isString(),
    body("status").trim().not().isEmpty().isString(),
    body("price").trim().not().isEmpty().isInt({ min: 1 }),
    body("NFTType").trim().not().isEmpty().isString(),
    validateAll,
  ],
  invokeController.setStatus
);

// Buy listed NFT
router.post(
  "/channels/:channel/chaincodes/:chaincode/Buy",
  [param("channel").not().isEmpty(), param("chaincode").not().isEmpty(), body("tokenId").trim().not().isEmpty().isString(), body("nftType").trim().not().isEmpty().isString(), validateAll],
  invokeController.buyListed
);

// Transfers
router.post(
  "/channels/:channel/chaincodes/:chaincode/transfer",
  [
    param("channel").trim().not().isEmpty().isString(),
    param("chaincode").trim().not().isEmpty().isString(),
    body("tokenId").trim().not().isEmpty().isString(),
    body("tokenAmount").trim().not().isEmpty().isInt({ min: 1 }),
    body("tokenSender").trim().not().isEmpty().isEmail(),
    body("tokenReceiver").trim().not().isEmpty().isEmail(),
    validateAll,
  ],
  invokeController.transfer
);

//auxiliary route used by postMetadata. Not invoked directly in the front.
router.post(
  "/channels/:channel/chaincodes/:chaincode/setURI",
  [
    param("channel").trim().not().isEmpty().isString(),
    param("chaincode").trim().not().isEmpty().isString(),
    body("tokenId").trim().not().isEmpty().isString(),
    body("URI").trim().not().isEmpty().isURL(),
    validateAll,
  ],
  invokeController.setURI
);

//auxiliary route used to update an NFT compensation State
router.patch(
  "/channels/:channel/chaincodes/:chaincode/compensateNFT",
  [
    param("channel").trim().not().isEmpty().isString(),
    param("chaincode").trim().not().isEmpty().isString(),
    body("tokenTerraId").trim().not().isEmpty().isString(),
    body("tokenCompensationId").trim().not().isEmpty().isString(),
    body("compensationAmount").trim().not().isEmpty().isString(),
    validateAll,
  ],
  invokeController.compensateNFT
);

//auxiliary route used to update an NFT Status
router.patch(
  "/channels/:channel/chaincodes/:chaincode/setNFTStatus",
  [
    param("channel").trim().not().isEmpty().isString(),
    param("chaincode").trim().not().isEmpty().isString(),
    body("tokenId").trim().not().isEmpty().isString(),
    body("statusNFT").trim().not().isEmpty().isString(),
    validateAll,
  ],
  invokeController.setNFTStatus
);

////////// OFFLINE TRANSACTION SIGNING ROUTES //////////

router.post(
  "/channels/:channel/chaincodes/:chaincode/generate-proposal",
  [param("channel").not().isEmpty(), param("chaincode").not().isEmpty(), body("transaction").not().isEmpty(), body("username").not().isEmpty(), validateAll],
  invokeController.generateTransactionProposal
);

router.post(
  "/channels/:channel/chaincodes/:chaincode/send-proposal",
  [param("channel").not().isEmpty(), param("chaincode").not().isEmpty(), body("signature").not().isEmpty(), body("proposal").not().isEmpty(), validateAll],
  invokeController.sendSignedTransactionProposal
);

router.post(
  "/channels/:channel/chaincodes/:chaincode/commit-transaction",
  [param("channel").not().isEmpty(), param("chaincode").not().isEmpty(), body("signature").not().isEmpty(), body("transaction").not().isEmpty(), validateAll],
  invokeController.commitSignedTransaction
);

module.exports = router;
