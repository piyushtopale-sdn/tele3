"use strict";
// const individualDoctorStaffRole = require("../controllers/roles/role");
import individualDoctorStaffRole from "../controllers/roles/role.js";
// const individualDoctorStaff = require("../controllers/individual_doctor_staff_controller");
import individualDoctorStaff from "../controllers/individual_doctor_staff_controller.js";

import express from "express";
import { individualDoctor } from "../controllers/individual_doctor.js";
const individualDoctorRoute = express.Router();
import {verifyRole, verifyToken} from "../helpers/verifyToken"

individualDoctorRoute.post("/sign-up", individualDoctor.signUp);
individualDoctorRoute.post("/login", individualDoctor.login);
individualDoctorRoute.get("/get-doctors-list", individualDoctor.listIndividualDoctor);
individualDoctorRoute.get("/get-doctor-details", individualDoctor.individualDoctor);
individualDoctorRoute.post("/forgot-password", individualDoctor.forgotPassword);
individualDoctorRoute.post("/reset-forgot-password", individualDoctor.resetForgotPassword);
individualDoctorRoute.post("/send-sms-otp-for-2fa", individualDoctor.sendSmsOtpFor2fa);
individualDoctorRoute.post("/send-email-otp-for-2fa", individualDoctor.sendEmailOtpFor2fa);
individualDoctorRoute.post("/match-otp-for-2fa", individualDoctor.matchOtpFor2fa);
individualDoctorRoute.post("/match-Email-Otp-For-2-fa", individualDoctor.matchEmailOtpFor2fa);

individualDoctorRoute.post("/change-password", individualDoctor.changePassword);

individualDoctorRoute.use(verifyToken)
//Staff
individualDoctorRoute.post("/add-staff", individualDoctorStaff.addStaff);
individualDoctorRoute.post("/edit-staff", individualDoctorStaff.editStaff);
individualDoctorRoute.get("/get-all-staff", individualDoctorStaff.getAllStaff);
individualDoctorRoute.get("/get-all-staff-without-pagination", individualDoctorStaff.getAllStaffWithoutPagination);
individualDoctorRoute.get("/get-staff-details", individualDoctorStaff.getStaffDetails)
individualDoctorRoute.post("/delete-active-and-lock-staff", individualDoctorStaff.actionForStaff);

// //Staff Role
individualDoctorRoute.post("/add-staff-role", individualDoctorStaffRole.add_role);
individualDoctorRoute.get("/all-staff-role", individualDoctorStaffRole.all_role);
individualDoctorRoute.post("/update-staff-role", individualDoctorStaffRole.update_role);
individualDoctorRoute.post("/delete-staff-role", individualDoctorStaffRole.delete_role);

//Individual Doctor For Super-admin

//update logs
individualDoctorRoute.post("/update-logs" ,individualDoctor.updatelogsData);
individualDoctorRoute.get("/get-all-logs-by-userId",individualDoctor.getAllLogs);

individualDoctorRoute.post("/create-unregister-doctor", individualDoctor.unregisterDoctor);
individualDoctorRoute.post("/create-unregister-doctor-staff", individualDoctor.unregisterDoctorStaff);
individualDoctorRoute.get("/get-unregister-doctor", individualDoctor.get_unregisterDoctor);
individualDoctorRoute.post("/update-unregister-doctor", individualDoctor.updateUnregisterDoctor);


individualDoctorRoute.get("/get-individual-doctors-by-id", individualDoctor.getIndividualDoctorsById);

individualDoctorRoute.post("/logout", individualDoctor.logout);
individualDoctorRoute.post("/fetch-room-call", individualDoctor.fetchRoomCall);
individualDoctorRoute.post("/start-recordings", individualDoctor.startRecordings);
individualDoctorRoute.put("/stop-recordings/:id", individualDoctor.stopRecordings);
individualDoctorRoute.get("/get-participant-details", individualDoctor.participantInfo);

individualDoctorRoute.get("/get-individualdoctor-count-superadmin-dashboard", individualDoctor.totalIndividualDoctorforAdminDashboard);

individualDoctorRoute.post("/send-external-user-email", individualDoctor.sendEmailtojoinexternaluser);
individualDoctorRoute.post("/get-patient-doctors", verifyRole(['patient', "INDIVIDUAL", "INDIVIDUAL_DOCTOR", "pharmacy", "superadmin", "ADMIN", 'INDIVIDUAL_DOCTOR_ADMIN','SUPER_USER']), individualDoctor.getPatientDoctors);
individualDoctorRoute.get("/get-total-doctor-count", verifyRole(['superadmin']), individualDoctor.getTotalDoctorCount);
individualDoctorRoute.get("/dashboard", verifyRole(['INDIVIDUAL_DOCTOR', 'superadmin']), individualDoctor.getDashboardData);
individualDoctorRoute.get("/radiology-test-data", verifyRole(['INDIVIDUAL_DOCTOR', 'superadmin']), individualDoctor.getRadiologyTestAppointmentDetails);
individualDoctorRoute.get("/get-lab-test-appointment-details", verifyRole(['INDIVIDUAL_DOCTOR', 'superadmin']), individualDoctor.getLabTestAppointmentDetails);
individualDoctorRoute.get("/doctor-admin-dashboard", verifyRole(['INDIVIDUAL_DOCTOR_ADMIN','SUPER_USER']), individualDoctor.getDoctorAdminDashboardData);
individualDoctorRoute.get("/get-all-doctor", verifyRole(['INDIVIDUAL_DOCTOR_ADMIN','SUPER_USER',"superadmin"]), individualDoctor.getAllDoctor);
individualDoctorRoute.get("/dashboard-export", verifyRole(['INDIVIDUAL_DOCTOR', 'superadmin']), individualDoctor.getDashboardDataExport);
individualDoctorRoute.get("/get-patientData-export-for-doctor", verifyRole(['INDIVIDUAL_DOCTOR', 'superadmin']), individualDoctor.getDashboardPatientDataExport);
individualDoctorRoute.get("/get-total-doctor-records", verifyRole(['superadmin']), individualDoctor.getTotalDoctorRecents);
individualDoctorRoute.get("/get-labtest-appointment-list", verifyRole(['INDIVIDUAL_DOCTOR', 'superadmin']), individualDoctor.getLabTestAppointmentList);
individualDoctorRoute.get("/get-radio-test-appointment-list", verifyRole(['INDIVIDUAL_DOCTOR', 'superadmin']), individualDoctor.getRadiologyTestAppointmentList);
individualDoctorRoute.get("/dashboard-records", verifyRole(['INDIVIDUAL_DOCTOR', 'superadmin']), individualDoctor.getDashboardRecords);
individualDoctorRoute.get("/doctor-admin-dashboard-export-last-login", verifyRole(['INDIVIDUAL_DOCTOR_ADMIN','SUPER_USER']), individualDoctor.getExportAllDoctorLastLogin); //Dilip
individualDoctorRoute.get("/get-pending-labtest-appointment-list/:doctorId", verifyRole(['INDIVIDUAL_DOCTOR', 'superadmin']), individualDoctor.getPendingLabTests); //Dilip 
individualDoctorRoute.get("/get-pending-radio-test-appointment-list/:doctorId", verifyRole(['INDIVIDUAL_DOCTOR', 'superadmin']), individualDoctor.getPendingRadiologyTests); //Dilip 
individualDoctorRoute.get("/get-all-online-doctor", verifyRole(['superadmin']), individualDoctor.findOnlineDoctors); //findOnlineDoctors
individualDoctorRoute.put("/update-mark-as-doctor-admin",verifyRole(['superadmin']),individualDoctor.markAsDoctorAdmin);
/* super-user */
individualDoctorRoute.post("/create-superuser-profile",verifyRole(['superadmin']),individualDoctor.createSuperUserProfile);
individualDoctorRoute.post("/update-superuser-profile",verifyRole(['superadmin']),individualDoctor.updateSuperUserProfile);




export default individualDoctorRoute;