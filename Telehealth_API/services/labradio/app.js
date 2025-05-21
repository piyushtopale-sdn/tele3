import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cron from 'node-cron';
import path from "path";
import InitiateMongoServer from "./config/db.js";
import { labRadioRoute, labRadioTestRoute, labRadioManagementRoute, appointmentRoutes } from "./routes/index.js"
import appointmentController from "./controllers/appointment.controller.js";
import leaveManagementsRoute from "./routes/leave_route.js";
const fileUpload = require('express-fileupload');

const useragent = require('express-useragent');
const app = express();

InitiateMongoServer();
// middleware
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "50mb" }));
// app.use(fileUpload(
//     {
//         useTempFiles: true, // Enable temporary file storage
//         tempFileDir: '/tmp/', // Specify the directory for temporary files
//     }
// ))
app.use(fileUpload());
app.use(bodyParser.urlencoded({ limit: "50mb", extended: false }));
const _dirname = path.resolve();
app.use(bodyParser.json());
app.use(useragent.express());

app.use("/four-portal-esignature-for-e-prescription", express.static("uploadEsignature"));

app.use(express.static(path.join(_dirname, "public")));

app.use((err, req, res, next) => {
    console.log("Error @ app ", err);
    next(err);
});

cron.schedule('*/1 * * * *', () => {
    appointmentController.delayedAppointmentCron()
});

cron.schedule('*/15 * * * *', () => {
    appointmentController.getAlborgeTestReport();
});

/* update-appointment-status-after-15days-of-external-lab/radio-appointment */
// cron.schedule('*/1 * * * *', () => {
//     appointmentController.updateExternalLabRadioStatus();
// });

// Routes
app.use("/", express.static("public"));

app.use("/lab-radio", labRadioRoute);
app.use("/lab-radio-management", labRadioManagementRoute);
app.use("/labradio-test", labRadioTestRoute);
app.use("/leave", leaveManagementsRoute);
app.use("/appointment", appointmentRoutes);

export default app;
