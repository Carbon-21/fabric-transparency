const { Router } = require("express");
const { body } = require("express-validator");
const { validateAll } = require("../util/validation");
const ipfsController = require("../controllers/ipfs-controller.js");

const router = Router();

//// UNAUTHENTICATED ROUTES ////
router.get("/getLatestIPFSBlock", ipfsController.getLatestIPFSBlock);


module.exports = router;
