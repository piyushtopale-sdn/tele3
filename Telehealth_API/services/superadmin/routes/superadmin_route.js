"use strict";

import express from "express";
import fs from "fs";
import contentManagementController from "../controllers/contentManagement/contentManagementController"
import {
    listMedicineWithoutPaginationForDoctor, uploadCSVForMedicine, allSubscriptionPlans, listSubscriptionPlans,subscriptionPlanGetById,
    createSubscriptionPlan, deleteSubscriptionPlan, editSubscriptionPlan, forgotPassword, getServiceField, getSubscriptionPlanDetails, login, logout, matchEmailOtpFor2fa,
     matchSmsOtpFor2fa, resetForgotPassword, sendEmailOtpFor2fa, sendSmsOtpFor2fa, setMaximumRequest, listMedicineWithoutPagination,
     fetchedMedicineByID, getLocationName, refreshToken, getMaximumRequest, getSelectedMasterData, addOrUpdateAppointmentCommission, getAppointmentCommission,listMedicineforexport,allAdminProfileList,
     getallplanPriceforSuperAdmin,gettotalMonthWiseforSuperAdmingraph,deteleLockAdminUser,
     getallPaymentHistory,changePassword, updatelogsData, getAllLogs, getSuperAdminData, notification, viewRes, addUserLogs, getGeneralSettings, getDashboardData, getDashboardGraphData,updateGeneralSettings,
     createAdminProfile,
     getPatientRecords,
     getDoctorRecords,
     getPharmacieRecords,
     getRadioRecords,
     getLaboratoryRecords,
     getRadiologyRecords,
     getDoctorPatientRecords,
     getPharmacyOrderRecords,getlabRecords,
     getLatestPatientLogin,updateAdminProfile} from "../controllers/superadmin/superadminController";


import { authorizeRole, verifyToken } from "../helpers/verifyToken";
import StaffManagementController from "../controllers/superadmin/staffManagementController";
import LeaveManagement from "../controllers/superadmin/leaveManagement";
import ICDManagement from "../controllers/superadmin/icd_management";
import AssessmentController from "../controllers/superadmin/assessmentController";
import LoincManagement from "../controllers/superadmin/loinc_management";

import {
  createdChat,
  getCreatedChats,
  sendMessage,
  allMessage,
  createGroupChat,
  saveNotification,
  getNotification,
  markAllReadNotification,
  updateNotification,
  clearAllmessages,
  markReadNotificationByID,
  addMembersToGroupChat,
  updateOnlineStatus,
  clearSinglemessages,
} from "../controllers/Chat-Controller/Chat";
import { handleResponse } from "../helpers/transmission";
import {
  addNotification,
  deleteNotification,
  editNotification,
  getNotificationByCondition,
  getNotificationById,
  getNotificationList,
} from "../controllers/Notification-management/notification-management";

const superadminRoute = express.Router();

const uploadFileToLocalStorage = async (req, res, next) => {
  if (!req.files) {
    return handleResponse(req, res, 500, {
      status: false,
      body: null,
      message: "No files found",
      errorCode: "INTERNAL_SERVER_ERROR",
    });
  }
  const file = req.files.file;
 
  if (
    file.mimetype !==
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return handleResponse(req, res, 500, {
      status: false,
      body: null,
      message: "Only excel allowed!",
      errorCode: "INTERNAL_SERVER_ERROR",
    });
  }
 
  const filename = file.name.split(".")[0] + "-" + Date.now() + ".xlsx";
  req.filename = filename;
  const newPath = `${__dirname.replace("routes", "uploads")}/${filename}`;
  fs.writeFile(newPath, file.data, (err) => {
    if (err) {
      return handleResponse(req, res, 500, {
        status: false,
        body: err,
        message: "Something went wrong while uploading file",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
    next();
  });
};
//encrypt-decrypt-api
superadminRoute.post("/viewRes", viewRes);

superadminRoute.post("/login", login);
superadminRoute.post("/forgot-password", forgotPassword);
superadminRoute.post("/change-password", changePassword);
superadminRoute.post("/reset-forgot-password", resetForgotPassword);
superadminRoute.post("/send-email-otp-for-2fa", sendEmailOtpFor2fa);
superadminRoute.post("/match-email-otp-for-2fa", matchEmailOtpFor2fa);
superadminRoute.post("/send-sms-otp-for-2fa", sendSmsOtpFor2fa);
superadminRoute.post("/match-sms-otp-for-2fa", matchSmsOtpFor2fa);
superadminRoute.post("/refresh-token", refreshToken);
superadminRoute.get(
  "/list-medicine-without-pagination",
  listMedicineWithoutPagination
);
superadminRoute.get(
  "/list-medicine-without-pagination-for-doctor",
  listMedicineWithoutPaginationForDoctor
);

superadminRoute.post("/get-selected-master-data", getSelectedMasterData); //Get selected master data
// superadminRoute.post("/update-socket-id", updateSocketId);
superadminRoute.post("/add-logs", addUserLogs);
superadminRoute.post("/update-logs", updatelogsData);
superadminRoute.get("/get-all-logs-by-userId", getAllLogs);
superadminRoute.get("/get-super-admin-data", getSuperAdminData);
superadminRoute.post("/notification", notification);
superadminRoute.get("/get-notification-by-condition", getNotificationByCondition);

superadminRoute.use(verifyToken);
superadminRoute.post("/logout", logout);

//Subscription Plan
superadminRoute.put("/update-subscription-plan", editSubscriptionPlan)
superadminRoute.get("/get-service-field", getServiceField);
superadminRoute.post("/create-subscription-plan", createSubscriptionPlan);
superadminRoute.get("/all-subscription-plans", allSubscriptionPlans);
superadminRoute.get("/get-subscription-plan", subscriptionPlanGetById);
superadminRoute.get("/list-subscription-plans", listSubscriptionPlans);
superadminRoute.get("/get-subscription-plan-details", getSubscriptionPlanDetails);
superadminRoute.delete("/delete-subscription-plan/:id", deleteSubscriptionPlan);
superadminRoute.put("/update-subscription-plan", editSubscriptionPlan)
superadminRoute.get(
  "/getallplanPriceforSuperAdmin",
  getallplanPriceforSuperAdmin
);
superadminRoute.get(
  "/gettotalMonthWiseforSuperAdmingraph",
  gettotalMonthWiseforSuperAdmingraph
);

superadminRoute.get("/getallPaymentHistory", getallPaymentHistory);
superadminRoute.post(
  "/upload-csv-for-medicine",
  uploadFileToLocalStorage,
  uploadCSVForMedicine
);
superadminRoute.post("/get-all-medicine-byits-id", fetchedMedicineByID);
superadminRoute.get("/list-medicine-export", listMedicineforexport);

//Set Maximum Request
superadminRoute.post("/set-maximum-request", setMaximumRequest);
superadminRoute.get("/get-maximum-request", getMaximumRequest);

//Staff Management
superadminRoute.post("/add-staff", StaffManagementController.addStaff);
superadminRoute.post("/edit-staff", StaffManagementController.editStaff);
superadminRoute.get("/list-staff", StaffManagementController.listStaff);
superadminRoute.get("/get-all-staff", StaffManagementController.getAllStaff); //Get all Staff without paginate
superadminRoute.get("/view-staff-details", StaffManagementController.viewStaff);
superadminRoute.post(
  "/delete-active-lock-staff",
  StaffManagementController.deleteActiveLockStaff
);
superadminRoute.get(
  "/list-staff-forchat",
  StaffManagementController.listStaffforChat
);

superadminRoute.post("/get-locations-name", getLocationName); //Get Location name from location ID
superadminRoute.post(
  "/add-or-update-appointment-commission",
  addOrUpdateAppointmentCommission
);
superadminRoute.get("/get-appointment-commission", getAppointmentCommission);

// chat route
superadminRoute.post("/create-chat", createdChat);
superadminRoute.get("/get-create-chat", getCreatedChats);
superadminRoute.post("/create-message", sendMessage);
superadminRoute.get("/all-message", allMessage);
superadminRoute.post("/create-group-chat", createGroupChat);
superadminRoute.post("/addmembers-to-groupchat", addMembersToGroupChat);

// notification
superadminRoute.post("/save-notification", saveNotification);
superadminRoute.get("/get-all-notification", getNotification);
superadminRoute.put("/mark-all-read-notification", markAllReadNotification);
superadminRoute.put("/mark-read-notification-id", markReadNotificationByID);
superadminRoute.post("/update-notification", updateNotification);

superadminRoute.put("/clear-all-messages", clearAllmessages);
superadminRoute.put("/clear-single-message", clearSinglemessages);
superadminRoute.post("/update-online-status", updateOnlineStatus);

// notification management
superadminRoute.post("/add-notification", addNotification);
superadminRoute.put("/update-notification", editNotification);
superadminRoute.get("/get-all-notification-list", getNotificationList);
superadminRoute.get("/get-notification-by-id", getNotificationById);
superadminRoute.put("/delete-notification", deleteNotification);

// leavetype-management
superadminRoute.post('/add-leave_types', LeaveManagement.addLeaveTypes)
superadminRoute.get('/list-leave_types', LeaveManagement.allLeaveTypesList)
superadminRoute.put('/update-leave_types', LeaveManagement.updateLeaveTypes)
superadminRoute.post('/delete-leave_types', LeaveManagement.actionOnLeaveTypes)
superadminRoute.get('/exportsheetlist-leaveType', LeaveManagement.allLeaveTypeforexport)

// icd-code-management
superadminRoute.post('/add-icd-code', authorizeRole(['superadmin']), ICDManagement.addICD_code)
superadminRoute.get('/list-icd-code', authorizeRole(['superadmin', 'INDIVIDUAL_DOCTOR']), ICDManagement.allCodeList)
superadminRoute.put('/update-icd-code', authorizeRole(['superadmin']), ICDManagement.updateICDCOde)
superadminRoute.post('/delete-icd-code', authorizeRole(['superadmin']), ICDManagement.actionOnICDCode)
superadminRoute.get('/exportsheetlist-icd-code', ICDManagement.allICDListforexport)
superadminRoute.post('/upload-file-for-icd-code-list', uploadFileToLocalStorage, ICDManagement.uploadExcelforICDCode)
superadminRoute.get('/list-icd-code-filter', authorizeRole(['superadmin', 'INDIVIDUAL_DOCTOR']), ICDManagement.allCodeListFilter)

//Assessment questionnaire for choosing doctor
superadminRoute.post('/add-assessment', AssessmentController.addAssessment)
superadminRoute.put('/update-assessment', AssessmentController.updateAssessment)
superadminRoute.put('/set-assessment-order', AssessmentController.setAssessmentOrder)
superadminRoute.get('/list-assessment', AssessmentController.listAssessment)
superadminRoute.get('/list-assessment-for-superadmin', AssessmentController.listAssessmentForSuperadmin)
superadminRoute.get('/get-assessment-by-id/:id', AssessmentController.getAssessmentByID)
superadminRoute.put('/delete-activate-deactivate-assessment', AssessmentController.manageAssessmentStatus)
// Loinc-Code Management
superadminRoute.post('/add-loinc-code', authorizeRole(['superadmin']), LoincManagement.addLoinc_code)
superadminRoute.get('/list-loinc-code', authorizeRole(['superadmin']), LoincManagement.allLoincCodeList)
superadminRoute.put('/update-loinc-code', authorizeRole(['superadmin']), LoincManagement.updateLoincCode)
superadminRoute.post('/delete-loinc-code', authorizeRole(['superadmin']), LoincManagement.actionOnLoincCode)
superadminRoute.get('/exportsheetlist-loinc-code',LoincManagement.allLoincCodeListforexport)
superadminRoute.post('/upload-file-for-loinc-code-list', uploadFileToLocalStorage, LoincManagement.uploadExcelforLoincCode)
superadminRoute.post('/get-lonic-code-by-code', LoincManagement.getLonicCodeByID)

//Common APIs
superadminRoute.get('/general-settings', getGeneralSettings)
superadminRoute.put('/update-general-settings', updateGeneralSettings)

superadminRoute.get('/dashboard', authorizeRole(['superadmin']), getDashboardData)
superadminRoute.get('/dashboard-graph', authorizeRole(['superadmin']), getDashboardGraphData)
superadminRoute.get('/patient-records', authorizeRole(['superadmin']), getPatientRecords)
superadminRoute.get('/doctor-records', authorizeRole(['superadmin']), getDoctorRecords)
superadminRoute.get('/pharmacie-records', authorizeRole(['superadmin']), getPharmacieRecords)
superadminRoute.get('/laboratory-records', authorizeRole(['superadmin']), getLaboratoryRecords)
superadminRoute.get('/radiology-records', authorizeRole(['superadmin']), getRadiologyRecords)
superadminRoute.get('/doctor-patient-records', authorizeRole(['superadmin']), getDoctorPatientRecords)
superadminRoute.get('/pharmacy-order-records', authorizeRole(['superadmin']), getPharmacyOrderRecords)
superadminRoute.get('/lab-records', authorizeRole(['superadmin']), getlabRecords)
superadminRoute.get('/radio-records', authorizeRole(['superadmin']), getRadioRecords)



superadminRoute.post('/create-content', contentManagementController.createContent)
superadminRoute.get('/get-content', contentManagementController.getAllContent)
superadminRoute.get('/get-contentById/:id', contentManagementController.getById)
superadminRoute.put('/update-content/:id', contentManagementController.updateContent)
superadminRoute.delete('/delete-contentById/:id', contentManagementController.deleteContent)

superadminRoute.post("/create-admin-profile",  authorizeRole(['superadmin']),createAdminProfile);
superadminRoute.get("/all-admin-profile-list",  authorizeRole(['superadmin']),allAdminProfileList);
superadminRoute.post("/detele-lock-admin-user",  authorizeRole(['superadmin']),deteleLockAdminUser);
superadminRoute.get("/get-latest-patient-login",  authorizeRole(['superadmin']),getLatestPatientLogin);
superadminRoute.put("/update-admin-profile",  authorizeRole(['superadmin']),updateAdminProfile);




export default superadminRoute;
