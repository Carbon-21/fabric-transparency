const { Router } = require("express");
const { query } = require("express-validator");
const { validateAll } = require("../util/validation");
const ipfsController = require("../controllers/ipfs-controller.js");

const router = Router();

//// UNAUTHENTICATED ROUTES ////
router.post("/postTransparencyLog", ipfsController.postTransparencyLog);

router.get(
  "/getCidContent",
  [
    query("cid").trim().not().isEmpty().isString(),
    validateAll,
  ],
  ipfsController.getCidContent
);

router.get(
  "/getIpnsContent",
  [
    query("ipnsAddress").trim().not().isEmpty().isString(),
    validateAll,
  ],
  ipfsController.getIpnsContent
);

router.get(
  "/getFirstTailOnIPFS",
  ipfsController.getFirstTailOnIPFS
);



module.exports = router;
