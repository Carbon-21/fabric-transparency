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

///// HELIA SINGLETON /////
let heliaInstance = null;
let heliaInitialized = false;

async function getHelia() {
  if (heliaInitialized) return heliaInstance;

  try {
    heliaInstance = await createIpfsNode();
    heliaInitialized = true;
    return heliaInstance;
  } catch (err) {
    logger.fatal("IPFS couldn't be initialized: ", err);
    throw err; // Rethrow to handle in main
  }
}

///// EXPRESS SETUP /////
const app = express();

// Apply middleware
app.use(cors);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// View engine setup
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
// Middleware to attach Helia to requests
app.use(async (req, res, next) => {
  try {
    req.helia = await getHelia();
    next();
  } catch (err) {
    next(err);
  }
});

app.use("/ipfs", ipfsRoutes);
app.use("/auth", authRoutes);
app.use("/invoke", invokeRoutes);
app.use("/query", queryRoutes);
app.use("/", frontRoutes);

///// ERROR MIDDLEWARE /////
app.use(error);

///// ASYNC INITIALIZATION /////
(async () => {
  try {
    // Initialize admin accounts
    await createAdmin();

    // Initialize IPFS node
    await getHelia();
    logger.info("IPFS node initialized");

    // Start server
    const host = process.env.HOST;
    const port = process.env.PORT;
    app.listen(port, host, () => {
      logger.info("****************** SERVER STARTED ************************");
      logger.info("***************  http://%s:%s  ******************", host, port);
    });

    // Uncomment to enable transparency log cron job
    // const cronJob = require("cron").CronJob;
    // new cronJob(process.env.LOG_CRONTAB, () => postTransparencyLog(heliaInstance), null, true);

  } catch (err) {
    logger.fatal("Application initialization failed: ", err);
    process.exit(1);
  }
})();