"use strict";

///// REQUIRES /////
//npm packages
require ("dotenv").config();
const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");

//native packages
const bodyParser = require("body-parser");
const path = require("path");

//local packages
const logger = require("./util/logger");
const cors = require("./middleware/cors");
const error = require("./middleware/error");
const { createAdmin } = require("./controllers/auth-crontroller");
const { postTransparencyLog, createIpfsNode } = require("./controllers/ipfs-controller");

//routes
const authRoutes = require("./routes/auth-routes");
const invokeRoutes = require("./routes/invoke-routes");
const queryRoutes = require("./routes/query-routes");
const frontRoutes = require("./routes/front-routes");
const ipfsRoutes = require("./routes/ipfs-routes");


///// CONFIGS /////
//express
const app = express();

//cors
app.use(cors);

//bodyParser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//network
const host = process.env.HOST;
const port = process.env.PORT;

///// FRONT /////
//ejs
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

global.__basedir = __dirname;

//flash
const sessionConfig = {
  secret: process.env.SESSION_SECRET_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};
app.use(session(sessionConfig));
app.use(flash());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.session.username;
  next();
});

//home
app.get("/", function (req, res) {
  res.render("transparency", { title: "Home", cssPath: "css/transparency.css" });
});


///// ROUTES /////
app.use("/ipfs", ipfsRoutes);
app.use("/auth", authRoutes);
app.use("/invoke", invokeRoutes);
app.use("/query", queryRoutes);
app.use("/", frontRoutes);

///// ERROR MIDDLEWARE /////
//executed if any other middleware yields an error
app.use(error);

///// SERVER INIT /////
//create admin accounts if needed and start the server
createAdmin()
  .then(() => {
    app.listen(port, host);
    logger.info("****************** SERVER STARTED ************************");
    logger.info("***************  http://%s:%s  ******************", host, port);
  })
  .catch((err) => {
    logger.fatal("Server couldn't be initialized: ", err);
  });

//// IPFS publication ////
createIpfsNode().then((helia) => {
  postTransparencyLog(helia);
})
.catch((err) => {
  logger.fatal("IPFS couldn't be initialized: ", err);
});

//transparency log: regularly post blockchain's tail to the IPFS
// var cronJob = require("cron").CronJob;
// new cronJob(process.env.LOG_CRONTAB, postTransparencyLog, null, true);



/// OLD

///// SERVER INIT /////
// app.listen(port, host);
// logger.info("****************** SERVER STARTED ************************");
// logger.info("***************  http://%s:%s  ******************", host, port);

// ///// ERROR MIDDLEWARE /////
// //executed if any other middleware yields an error
// app.use(error);

// async function createNode () {
//   const { noise } = await import("@chainsafe/libp2p-noise");
//   const { yamux } = await import("@chainsafe/libp2p-yamux");
//   const { bootstrap } = await import("@libp2p/bootstrap");
//   const { tcp } = await import("@libp2p/tcp");
//   const { MemoryBlockstore } = await import("blockstore-core");
//   const { MemoryDatastore } = await import("datastore-core");
//   const { createHelia } = await import("helia");
//   const { createLibp2p } = await import("libp2p");
//   const { identify } = await import("@libp2p/identify");
  
//   // the blockstore is where we store the blocks that make up files
//   const blockstore = new MemoryBlockstore()

//   // application-specific data lives in the datastore
//   const datastore = new MemoryDatastore()

//   // libp2p is the networking layer that underpins Helia
//   const libp2p = await createLibp2p({
//     datastore,
//     addresses: {
//       listen: [
//         '/ip4/127.0.0.1/tcp/0'
//       ]
//     },
//     transports: [
//       tcp()
//     ],
//     connectionEncrypters: [
//       noise()
//     ],
//     streamMuxers: [
//       yamux()
//     ],
//     peerDiscovery: [
//       bootstrap({
//         list: [
//           '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
//           '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
//           '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
//           '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
//         ]
//       })
//     ],
//     services: {
//       identify: identify()
//     }
//   })

//   return await createHelia({
//     datastore,
//     blockstore,
//     libp2p
//   })
// }