"use strict";

const checkNodeModules = () => {
  try {
    require("express");
    startServer(); // inicia a aplicação
  } catch (error) {
    console.log('Loading node_modules:')
    setTimeout(checkNodeModules, 2000);
  }
}

const startServer = () => {
  ///// REQUIRES /////
  //npm packages
  const express = require("express");
  const fs = require("fs");
  const session = require("express-session");
  const flash = require("connect-flash");
  const axios = require("axios").default;
  const https = require("https");
  var cronJob = require("cron").CronJob;

  //native packages
  const bodyParser = require("body-parser");
  const path = require("path");
  
  //local packages
  const logger = require("./util/logger");
  const cors = require("./middleware/cors");
  const error = require("./middleware/error");
  const { postTransparencyLog } = require("./controllers/ipfs-controller");
  const { checkCarsAlerts } = require("./controllers/nft-controller");
  const { createAdmin } = require("./controllers/auth-crontroller");
  
  //routes
  const authRoutes = require("./routes/auth-routes");
  const ipfsRoutes = require("./routes/ipfs-routes");
  const invokeRoutes = require("./routes/invoke-routes");
  const queryRoutes = require("./routes/query-routes");
  const frontRoutes = require("./routes/front-routes");
  const nftRoutes = require("./routes/nft-routes");
  
  ///// CONFIGS /////
  // TLS configs
  const options = {
    key: fs.readFileSync(path.join(__dirname, "keys/key.pem")),
    cert: fs.readFileSync(path.join(__dirname, "keys/cert.pem")),
    passphrase: process.env.TLS_SECRET_KEY,
  };
  
  //express
  const app = express();
  
  //cors
  app.use(cors);
  
  //timezone
  process.env.TZ = "America/Sao_Paulo";
  
  //bodyParser
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  
  //network
  const host = process.env.HOST;
  const port = process.env.PORT;
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0; // bypass certificate check (when using self-signed cert)
  
  //front
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));
  app.use(express.static(path.join(__dirname, "public")));
  
  global.__basedir = __dirname;
  
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
    res.locals.currentRole = req.session.role;
    next();
  });
  
  app.get("/", function (req, res) {
    res.render("home", { title: "Home", cssPath: "css/home.css" });
  });
  
  //transparency log: regularly post blockchain's tail to the IPFS
  // new cronJob(process.env.LOG_CRONTAB, postTransparencyLog, null, true);

  //CAR alerts: regularly check for new alerts
  new cronJob(process.env.CAR_CRONTAB.toString(), checkCarsAlerts, null, true);

  ///// ROUTES /////
  app.use("/auth", authRoutes);
  app.use("/invoke", invokeRoutes);
  app.use("/query", queryRoutes);
  app.use("/", frontRoutes);
  app.use("/nft", nftRoutes);
  app.use("/ipfs", ipfsRoutes);
  
  ///// ERROR MIDDLEWARE /////
  //executed if any other middleware yields an error
  app.use(error);
  
  ///// SERVER INIT /////
  //create admin accounts if needed and start the server
  createAdmin()
    .then(() => {
      const httpsServer = https.createServer(options, app);
      httpsServer.listen(port, () => {
        logger.info("****************** HTTPS SERVER STARTED ************************");
        logger.info("***************  https://%s:%s  *******************", host, port);
      });
      // postTransparencyLog();
    })
    .catch((err) => {
      logger.fatal("Server couldn't be initialized:", err);
    });
}

checkNodeModules();