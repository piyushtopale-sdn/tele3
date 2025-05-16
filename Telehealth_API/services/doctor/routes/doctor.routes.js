import express from "express";
import { addMembersToGroupChat, allMessage, clearAllmessages, clearSinglemessages, createdChat, createGroupChat, getCreatedChats, getNotification, markAllReadNotification, markReadNotificationByID, readMessageCount, saveNotification, sendMessage, sendPushNotificattionToPatient, totalMessageCount, updateOnlineStatus } from "../controllers/Chat-Controller/Chat";
const hospital = require("../controllers/hospital_controller");
const hospitalStaff = require("../controllers/hospital_staff_controller");
import { verifyToken, verifyRole } from "../helpers/verifyToken";
import { handleResponse } from "../middleware/utils";
const hospitalStaffRole = require("../controllers/roles/role");
const doctor2Route = express.Router();
import fs from "fs";

const uploadFileToLocalStorage = async (req, res, next) => {
    if (!req.files) {
        return handleResponse(req, res, 500, {
            status: false,
            body: null,
            message: "No files found",
            errorCode: "INTERNAL_SERVER_ERROR",
        })
    }
    // 
    const file = req.files.file;
    if (file.mimetype !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
        return handleResponse(req, res, 500, {
            status: false,
            body: null,
            message: "Only excel file allowed!",
            errorCode: "INTERNAL_SERVER_ERROR",
        })
    }
    const filename = file.name.split('.')[0] + '-' + Date.now() + '.xlsx';
    req.filename = filename;
    const newPath = `${__dirname.replace('routes', 'uploads')}/${filename}`
    fs.writeFile(newPath, file.data, (err) => {
        if (err) {
            return handleResponse(req, res, 500, {
                status: false,
                body: err,
                message: "Something went wrong while uploading file",
                errorCode: "INTERNAL_SERVER_ERROR ",
            })
        }
        next()
    })
}

doctor2Route.post("/send-sms-otp-for-2fa", hospital.sendSmsOtpFor2fa);
doctor2Route.post("/send-email-otp-for-2fa", hospital.sendEmailOtpFor2fa);
doctor2Route.post("/match-otp-for-2fa", hospital.matchOtpFor2fa);
doctor2Route.post("/match-Email-Otp-For2fa", hospital.matchEmailOtpFor2fa);
doctor2Route.get('/all-specialty', hospital.allSpecialty)
doctor2Route.get('/filter-value', hospital.filterValue)
doctor2Route.get('/set-doctor-availability-for-filter', hospital.setDoctorAvailabilityForFilter)
doctor2Route.get('/export-speciality', hospital.allSpecialtyListforexport)
//Staff Role
doctor2Route.post("/add-staff-role", hospitalStaffRole.add_role);
doctor2Route.get("/all-staff-role", hospitalStaffRole.all_role);
doctor2Route.post("/update-staff-role", hospitalStaffRole.update_role);
doctor2Route.post("/delete-staff-role", hospitalStaffRole.delete_role);

doctor2Route.post("/forgot-password", hospital.forgotPassword);
doctor2Route.post("/change-password", hospital.changePassword);
doctor2Route.post("/reset-forgot-password", hospital.resetForgotPassword);


//Notification
doctor2Route.post('/notification', hospital.notification);
doctor2Route.get('/notificationlist', hospital.notificationlist);
doctor2Route.post('/update-notification', hospital.updateNotification)
doctor2Route.get('/get-all-notification', getNotification)
doctor2Route.get("/get-hospital-location", hospital.getHospitalLocationData);
doctor2Route.get("/get-portal-user-data", hospital.getPortalUserData);
doctor2Route.get("/get-service-data", hospital.getServiceData);
doctor2Route.get("/get-department-data", hospital.getDepartmentData);
doctor2Route.get("/get-speciality-data", hospital.getSpecialityData);
doctor2Route.post("/save-four-portal-hospital-location", hospital.saveFouPortalLocationData);
doctor2Route.get("/get-expertise-data", hospital.getExpertiseData);
doctor2Route.get("/get-staff-profile-data", hospital.getStaffProfileData);
//logsUpdate
doctor2Route.post("/update-logs", hospital.updatelogsData);
doctor2Route.get("/get-all-logs-by-userId", hospital.getAllLogs);
doctor2Route.get("/get-all-staff-data", hospital.getHospitalStaffData);

doctor2Route.use(verifyToken);
doctor2Route.post('/uploadExcelforDepartment', uploadFileToLocalStorage, hospital.uploadExcelforDepartment)
doctor2Route.post('/uploadExcelforExpertise', uploadFileToLocalStorage, hospital.uploadExcelforExpertise)
doctor2Route.post('/uploadCSVForService', uploadFileToLocalStorage, hospital.uploadCSVForService)
doctor2Route.get('/expertiseListforexport', hospital.expertiseListforexport)
doctor2Route.get('/departmentListforexport', hospital.departmentListforexport)
doctor2Route.get('/serviceListforexport', hospital.serviceListforexport)
//Staff
doctor2Route.post("/add-staff", hospitalStaff.addStaff);
doctor2Route.post("/edit-staff", hospitalStaff.editStaff);
doctor2Route.get("/get-all-staff", hospitalStaff.getAllStaff);
doctor2Route.get("/get-all-staff-without-pagination", hospitalStaff.getAllStaffWithoutPagination);
doctor2Route.get("/get-staff-details", hospitalStaff.getStaffDetails)
doctor2Route.post("/delete-active-and-lock-staff", hospitalStaff.actionForStaff);

//Specialty
doctor2Route.post('/add-specialty', verifyRole(["superadmin"]), hospital.addSpecialty)
doctor2Route.post('/update-specialty', verifyRole(["superadmin"]), hospital.updateSpecialty)
doctor2Route.post('/action-on-specialty', verifyRole(["superadmin"]), hospital.actionOnSpecialty)
doctor2Route.post('/upload-csv-for-specialty', uploadFileToLocalStorage, hospital.uploadCSVForSpecialty)
doctor2Route.get('/export-specialty', hospital.exportSpecialty)


// chat route
doctor2Route.post('/create-chat', createdChat);
doctor2Route.get('/get-create-chat', getCreatedChats);
doctor2Route.post('/create-message', sendMessage);
doctor2Route.get('/all-message', allMessage);
doctor2Route.post('/create-group-chat', createGroupChat);
doctor2Route.post('/addmembers-to-groupchat', addMembersToGroupChat);
doctor2Route.get('/send-push-notificattion-to-patient', sendPushNotificattionToPatient)
doctor2Route.get('/total-message-count', totalMessageCount);
doctor2Route.get('/read-message-count', readMessageCount);


// notification
doctor2Route.post('/save-notification', saveNotification);
doctor2Route.put('/mark-all-read-notification', markAllReadNotification)
doctor2Route.put('/mark-read-notification-id', markReadNotificationByID)

doctor2Route.put('/clear-all-messages', clearAllmessages)
doctor2Route.post('/update-online-status', updateOnlineStatus)
doctor2Route.put('/clear-single-message', clearSinglemessages)

doctor2Route.post("/save-superadmin-notification", hospital.saveSuperadminNotification);
doctor2Route.get("/get-hospital-count-superadmin-dashboard", hospital.totalHospitalforAdminDashboard);
doctor2Route.get("/get-consultation-count", hospital.totalConsultation);
doctor2Route.post("/update-notification-status",hospital.updateNotificationStatus);
doctor2Route.get("/providerdocumentlist",hospital.getProviderDocumentsByFilters);
doctor2Route.get("/getproviderdocument",hospital.getProviderDocument);
doctor2Route.put("/inactive_isdelete_providerdocument",hospital.inActive_isDeletedProviderDocument);
doctor2Route.get("/get-hospital-dashboard-count", hospital.totalCountforHospitalDashboard);
doctor2Route.get("/get-hospital-dashboard-staff-count", hospital.totalStaffDoctorHospitalDashboard);

export default doctor2Route;