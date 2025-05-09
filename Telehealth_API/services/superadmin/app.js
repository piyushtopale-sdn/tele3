import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import InitiateMongoServer from "./config/db.js";
import {
  roleRoute,
  menuRoute,
  categoryRoute,
  alphaResultRoute,
  vitalsThesholdRoute,
  vitalThresholdMaster,
  medicineRoute,
  specialityRoute,
  subscriptionRoute,
  superadminRoute,
  commonApiRoute,
  contentManagementRoute
} from './routes/index.js';
import "dotenv/config.js";
const useragent = require('express-useragent');
const fileUpload = require('express-fileupload');
const app = express();

InitiateMongoServer();
// middleware
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: false }));
const _dirname = path.resolve();
app.use(fileUpload());
app.use(bodyParser.json());
app.use(useragent.express());

app.use(express.static(path.join(_dirname, "public")));

app.use((err, req, res, next) => {
  console.log("Error @ app ", err);
  next(err);
});

// Routes
app.use("/", express.static("public"));
app.use("/role", roleRoute);
app.use("/menu", menuRoute);
app.use("/category", categoryRoute);
app.use("/alpharesult", alphaResultRoute);
app.use("/vitalsthreshold", vitalsThesholdRoute);
app.use("/newvitalsthreshold", vitalThresholdMaster);
app.use("/medicine", medicineRoute);
app.use("/speciality", specialityRoute);
app.use("/subscription", subscriptionRoute);
app.use("/superadmin", superadminRoute);
app.use("/common-api", commonApiRoute);
app.use("/content-management", contentManagementRoute);


export default app;
