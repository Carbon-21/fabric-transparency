//define the API routes: what path should be used to execute a given function?

const { Router } = require("express");
const { query } = require("express-validator");
const { validateAll } = require("../util/validation");
const ipfsController = require("../controllers/ipfs-controller.js");

const router = Router();

//// UNAUTHENTICATED ROUTES ////
router.post("/postTransparencyLog", ipfsController.postTransparencyLog);

router.get(
  "/getCidContent",
  [query("cid").trim().not().isEmpty().isString(), validateAll],
  ipfsController.getCidContent
);

router.get(
  "/getIpnsContent",
  // `ipnsAddress` is optional now; when omitted, backend resolves the configured key
  [query("ipnsAddress").optional().trim().isString(), validateAll],
  ipfsController.getIpnsContent
);

router.get("/getFirstTailOnIPFS", ipfsController.getFirstTailOnIPFS);

router.get("/getLastTailOnIPFS", ipfsController.getLastTailOnIPFS);

module.exports = router;
