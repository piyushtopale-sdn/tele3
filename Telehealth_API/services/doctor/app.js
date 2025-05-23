import cron from 'node-cron';
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import InitiateMongoServer from "./config/db.js";
import { doctorRoute, individualDoctorRoute, doctor2Route, appointmentRoutes, roleRoute, patientRoute, leaveManagementRoute, patientClinicalInfoRoute } from "./routes/index";
import AppointmentController from "./controllers/appointment.controllers";
const useragent = require('express-useragent');
const fileUpload = require('express-fileupload');
const app = express();

InitiateMongoServer();
// middleware
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: false }));
const _dirname = path.resolve();
app.use(bodyParser.json());
app.use(fileUpload());
app.use(useragent.express());

app.use(express.static(path.join(_dirname, "public")));


app.use((err, req, res, next) => {
    console.log("Error @ app ", err);
    next(err);
});

// Cron job to send reminders before consultation start time
cron.schedule('*/1 * * * *', () => {
    AppointmentController.sendReminderNotifications();
});

// Cron job to update appoitment status to MISSED if date passed
cron.schedule('*/1 * * * *', () => {
    AppointmentController.updateAppointmentStatus();
});

// Routes
app.use("/", express.static("public"));
app.use("/esignature-for-e-prescription", express.static("uploadEsignature"));

app.use("/doctor", doctorRoute);
app.use("/individual-doctor", individualDoctorRoute);
app.use("/patient-clinical-info", patientClinicalInfoRoute)
app.use("/doctor2", doctor2Route);
app.use("/appointment", appointmentRoutes);
app.use("/patient", patientRoute);
app.use("/role", roleRoute);
app.use("/leave", leaveManagementRoute);

export default app;
