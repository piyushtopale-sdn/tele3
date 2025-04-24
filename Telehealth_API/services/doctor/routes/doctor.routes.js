import express from "express";
import { addMembersToGroupChat, allMessage, clearAllmessages, clearSinglemessages, createdChat, createGroupChat, getCreatedChats, getNotification, markAllReadNotification, markReadNotificationByID, readMessageCount, saveNotification, sendMessage, sendPushNotificattionToPatient, totalMessageCount, updateOnlineStatus } from "../controllers/Chat-Controller/Chat";
const hospital = require("../controllers/hospital_controller");
import MasterController from "../controllers/masterController"
const hospitalStaff = require("../controllers/hospital_staff_controller");
import { verifyToken, verifyRole } from "../helpers/verifyToken";
import { handleResponse } from "../middleware/utils";
const hospitalStaffRole = require("../controllers/roles/role");
const doctor2Route = express.Router();
const fs = require('fs');


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
    fs.writeFile(newPath, file.data, (err, data) => {
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


const uploadFileToLocalStoragecsv = (req, res, next) => {
    if (!req.files) {
        return handleResponse(req, res, 200, {
            status: false,
            body: null,
            message: "No files found",
            errorCode: "INTERNAL_SERVER_ERROR",
        })
    }
    const file = req.files.file;
    if (file.mimetype !== "text/csv") {
        return handleResponse(req, res, 200, {

            status: false,
            body: null,
            message: "Only .csv mime type allowed!",
            errorCode: "INTERNAL_SERVER_ERROR",
        })
    }
    const filename = file.name.split('.')[0] + '-' + Date.now() + '.xlsx';
    req.filename = filename;
    const path = `./uploads/${filename}`

    file.mv(path, (err) => {
        if (err) {
            return handleResponse(req, res, 500, {
                status: false,
                body: null,
                message: "Something went wrong while uploading file",
                errorCode: "INTERNAL_SERVER_ERROR",
            })
        }
        next()
    });
}

doctor2Route.post("/admin-signup", hospital.signup);
doctor2Route.get("/get-hospital-details", hospital.getHospitalDetails);

doctor2Route.post("/delete-hospital-pathology-tests",hospital.deletePathologyTest)

doctor2Route.post("/login", hospital.login);
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
doctor2Route.get("/get-unit-data", hospital.getUnitData);
doctor2Route.get("/get-speciality-data", hospital.getSpecialityData);
doctor2Route.post("/save-four-portal-hospital-location", hospital.saveFouPortalLocationData);
doctor2Route.get("/get-team-data", hospital.getTeamsData);
doctor2Route.get("/get-expertise-data", hospital.getExpertiseData);
doctor2Route.get("/get-staff-profile-data", hospital.getStaffProfileData);
doctor2Route.get("/get-hospital-admin-data", hospital.getAllHospitalAdmin);
//logsUpdate
doctor2Route.post("/update-logs", hospital.updatelogsData);
doctor2Route.get("/get-all-logs-by-userId", hospital.getAllLogs);
doctor2Route.get("/get-all-staff-data", hospital.getHospitalStaffData);
doctor2Route.post("/unRegisteredHospitalUpdate", hospital.unRegisteredHospitalUpdate);

doctor2Route.use(verifyToken);
doctor2Route.post('/uploadExcelforDepartment', uploadFileToLocalStorage, hospital.uploadExcelforDepartment)
doctor2Route.post('/uploadExcelforExpertise', uploadFileToLocalStorage, hospital.uploadExcelforExpertise)
doctor2Route.post('/uploadCSVForService', uploadFileToLocalStorage, hospital.uploadCSVForService)
doctor2Route.get('/expertiseListforexport', hospital.expertiseListforexport)
doctor2Route.get('/departmentListforexport', hospital.departmentListforexport)
doctor2Route.get('/serviceListforexport', hospital.serviceListforexport)
doctor2Route.post('/uploadCSVForUnitHospital', uploadFileToLocalStorage, hospital.uploadCSVForUnitHospital)
doctor2Route.get('/unitListforexport', hospital.unitListforexport)
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

//Hospital Department
doctor2Route.post("/add-department", hospital.addDepartment);
doctor2Route.get("/all-department", hospital.allDepartment);
doctor2Route.get("/department-details", hospital.departmentDetails);
doctor2Route.post("/update-department", hospital.updateDepartment);
doctor2Route.post("/action-on-department", hospital.actionOnDepartment);

//Hospital Service
doctor2Route.post("/add-service", hospital.addService);
doctor2Route.get("/all-service", hospital.allService);
doctor2Route.get("/service-details", hospital.serviceDetails);
doctor2Route.post("/update-service", hospital.updateService);
doctor2Route.post("/action-on-service", hospital.actionOnService);

//Hospital Unit
doctor2Route.post("/add-unit", hospital.addUnit);
doctor2Route.get("/all-unit", hospital.allUnit);
doctor2Route.get("/unit-details", hospital.unitDetails);
doctor2Route.post("/update-unit", hospital.updateUnit);
doctor2Route.post("/action-on-unit", hospital.actionOnUnit);

//Get Department, Service, Unit
doctor2Route.post("/list-of-department-service-unit", hospital.listOfDepartmentServiceUnit);

//Lab Test
doctor2Route.post('/add-lab-test-master', MasterController.addLabTest)
doctor2Route.get('/lab-test-master-list', MasterController.labTestMasterList)
doctor2Route.get('/lab-test-master-list-for-doctor', MasterController.labTestMasterListForDoctor)
doctor2Route.get('/lab-test-master-details', MasterController.labTestMasterDetails)
doctor2Route.post('/lab-test-master-edit', MasterController.labTestMasterEdit)
doctor2Route.post('/lab-test-master-action', MasterController.labTestMasterAction)
doctor2Route.post('/upload-csv-for-lab-test', uploadFileToLocalStorage, MasterController.uploadCSVForLabTest)
doctor2Route.get('/export-lab-test-master', MasterController.exportLabTestMaster)
doctor2Route.get('/lab-test-master-list-export', MasterController.labTestMasterListforexport)
doctor2Route.get('/labTestList-without-pagination', MasterController.labTestListWithoutPagination)
doctor2Route.get('/lab-test-byId', MasterController.labTestbyId)



//Imaging Test
doctor2Route.post('/add-imaging-test-master', MasterController.addImagingTest)
doctor2Route.get('/imaging-test-master-list', MasterController.imagingTestMasterList)
doctor2Route.get('/imaging-test-master-list-for-doctor', MasterController.imagingTestMasterListForDoctor)
doctor2Route.get('/imaging-test-master-details', MasterController.imagingTestMasterDetails)
doctor2Route.post('/imaging-test-master-edit', MasterController.imagingTestMasterEdit)
doctor2Route.post('/imaging-test-master-action', MasterController.imagingTestMasterAction)
doctor2Route.post('/upload-csv-for-imaging-test', uploadFileToLocalStorage, MasterController.uploadCSVForImagingTest)
doctor2Route.get('/export-imaging-test-master', MasterController.exportImagingTestMaster)
doctor2Route.get('/imaging-test-master-list-export', MasterController.imagingTestMasterListforexport)
doctor2Route.get('/imagingTestList-without-pagination', MasterController.imagingListWithoutPagination)
doctor2Route.get('/imaging-test-byId', MasterController.imagingTestbyId)


//Vaccination Test
doctor2Route.post('/add-vaccination-master', MasterController.addVaccinationTest)
doctor2Route.get('/vaccination-master-list', MasterController.vaccinationTestMasterList)
doctor2Route.get('/vaccination-master-list-for-doctor', MasterController.vaccinationTestMasterListForDoctor)
doctor2Route.get('/vaccination-master-details', MasterController.vaccinationTestMasterDetails)
doctor2Route.post('/vaccination-master-edit', MasterController.vaccinationTestMasterEdit)
doctor2Route.post('/vaccination-master-action', MasterController.vaccinationTestMasterAction)
doctor2Route.post('/upload-csv-for-vaccination-test', uploadFileToLocalStorage, MasterController.uploadCSVForVaccinationTest)
doctor2Route.get('/export-vaccination-test-master', MasterController.exportVaccinationTestMaster)
doctor2Route.get('/vaccination-master-list-export', MasterController.vaccinationTestMasterListforexport)


//Others Test
doctor2Route.post('/add-others-test-master', MasterController.addOthersTest)
doctor2Route.get('/others-test-master-list', MasterController.othersTestTestMasterList)
doctor2Route.get('/others-test-master-list-for-doctor', MasterController.othersTestTestMasterListForDoctor)
doctor2Route.get('/others-test-master-details', MasterController.othersTestTestMasterDetails)
doctor2Route.post('/others-test-master-edit', MasterController.othersTestTestMasterEdit)
doctor2Route.post('/others-test-master-action', MasterController.othersTestTestMasterAction)
doctor2Route.post('/upload-csv-for-others-test', uploadFileToLocalStorage, MasterController.uploadCSVForOthersTest)
doctor2Route.get('/export-others-test-master', MasterController.exportOthersTestMaster)
doctor2Route.get('/otherstest-list-export', MasterController.othersTestTestMasterListforexport)
doctor2Route.get('/othersTestList-without-pagination', MasterController.OthersListWithoutPagination)
doctor2Route.get('/others-test-byId', MasterController.OthersTestbyId)

//EyeGlass
doctor2Route.post('/add-eyeglass-master', MasterController.addEyeglassMaster)
doctor2Route.get('/list-eyeglass-master', MasterController.listEyeglassMaster)
doctor2Route.get('/list-eyeglass-master-for-doctor', MasterController.listEyeglassMasterForDoctor)
doctor2Route.post('/active-delete-eyeglass-master', MasterController.activeDeleteEyeglassMaster)
doctor2Route.get('/view-eyeglass-master', MasterController.viewEyeglassMaster)
doctor2Route.post('/update-eyeglass-master', MasterController.updateEyeglassMaster)
doctor2Route.post('/upload-csv-for-eyeglass-master', uploadFileToLocalStorage, MasterController.uploadCSVForEyeglassMaster)
doctor2Route.get('/export-eyeglass-master', MasterController.exportEyeglassMaster)
doctor2Route.get('/eyeglasses-list-export', MasterController.listEyeglassMasterforexport);
doctor2Route.get('/eyeglassesTestList-without-pagination', MasterController.eyeglassesListWithoutPagination)
doctor2Route.get('/eyeglasses-test-byId', MasterController.eyeglassesTestbyId)

//Reason for Appointment
doctor2Route.post("/add-appointment-reason", hospital.addAppointmentReason);
doctor2Route.post("/bulk-upload-appointment-reason", uploadFileToLocalStorage, hospital.bulkUploadAppointmentReason);
doctor2Route.get("/reason-for-appointment-list", hospital.reasonForAppointmentList);
doctor2Route.get("/appointment-reason-details", hospital.reasonForAppointmentDetails);
doctor2Route.post("/update-appointment-reason", hospital.updateReasonForAppointment);
doctor2Route.post("/action-on-appointment-reason", hospital.actionOnReasonForAppointment);
doctor2Route.get('/get-all-doctor-location-by-id', hospital.getAllLocationById);

//Questionnaire
doctor2Route.post("/add-questionnaire", hospital.addQuestionnaire);
doctor2Route.get("/questionnaire-list", hospital.QuestionnaireList);
doctor2Route.get("/questionnaire-details", hospital.QuestionnaireDetails);
doctor2Route.post("/update-questionnaire", hospital.updateQuestionnaire);
doctor2Route.post("/action-on-questionnaire", hospital.actionOnQuestionnaire);

//Patient Assessment
doctor2Route.post("/add-and-edit-assessment", hospital.addAssessment);
doctor2Route.get("/assessment-list", hospital.assessmentList);


//Hospital Expertise
doctor2Route.post("/add-expertise", hospital.addExpertise);
doctor2Route.get("/all-expertise", hospital.allExpertise);
doctor2Route.get("/expertise-details", hospital.expertiseDetails);
doctor2Route.post("/update-expertise", hospital.updateExpertise);
doctor2Route.post("/action-on-expertise", hospital.actionOnExpertise);

doctor2Route.get('/list-hospital-admin-user', hospital.listHospitalAdminUser);
doctor2Route.get("/get-all-hospital-details-by-id", hospital.getAllHospitalDetailsByID);
// Routes for superadmin
doctor2Route.get('/get-all-hospital-list', hospital.getAllHospitalListForSuperAdmin);
doctor2Route.get('/get-all-hospital-list-under-doctor', hospital.getAllHospitalListUnderDoctor);
doctor2Route.get('/view-hospital-admin-details', hospital.viewHospitalAdminDetails);
doctor2Route.post('/approve-or-reject-hospital', hospital.approveOrRejectHospital);
doctor2Route.post('/active-lock-delete-hospital', hospital.activeLockDeleteHospital);

doctor2Route.get('/get-all-hospital', hospital.getAllHospital);
doctor2Route.get('/read-hospital-locations', hospital.readHospitalLocations);
doctor2Route.get('/get-all-hospital-and-clinic', hospital.getAllHospitalList);
doctor2Route.get('/get-all-doctor-as-per-loc', hospital.getDoctorListforLocation);
doctor2Route.get('/get-all-user-for-chat', hospital.getAllUsersForChat);
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

// Team
doctor2Route.post('/add-team', hospital.addTeam_SuperAdmin)
doctor2Route.get('/list-team', hospital.allTeamList)
doctor2Route.put('/update-team', hospital.updateTeam)
doctor2Route.post('/delete-team', hospital.actionOnTeam)
doctor2Route.get('/exportsheetlist-team', hospital.allTeamListforexport)
doctor2Route.post('/upload-csv-for-team-list', uploadFileToLocalStorage, hospital.uploadCSVForTeam)
doctor2Route.get('/getById-team', hospital.TeamById)
doctor2Route.get('/common-teamlist', hospital.commmonTeamList)
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