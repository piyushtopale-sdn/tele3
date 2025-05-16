import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import InitiateMongoServer from "./config/db.js";
import Payment from "./controllers/payment/paymentController";
import AmazonPayment from "./controllers/payment/amazonPayment";
import cron from 'node-cron';

const useragent = require('express-useragent');
const app = express();
const fileUpload = require('express-fileupload');

InitiateMongoServer();
// middleware
import { patientRoute, paymentRoute } from "./routes/index"

//middleware
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: false }));
const _dirname = path.resolve();
app.use(bodyParser.json());
app.use(useragent.express());
app.use(fileUpload(
    {
        useTempFiles: true, // Enable temporary file storage
        tempFileDir: '/tmp/', // Specify the directory for temporary files
      }
));
app.use(express.static(path.join(_dirname, "public")));

/** PT - Feb 19 Cron will trigger 12am to 5am */
cron.schedule('0 0-5 * * *', () => {
    Payment.checkSubscriptionExpiry();
    AmazonPayment.recurringCheck();
});

app.use((err, req, res, next) => {
    console.log("Error @ app ", err);
    next(err);
});

// Routes
app.use("/", express.static("public"));

app.use("/patient", patientRoute);
app.use("/payment", paymentRoute);



export default app;
