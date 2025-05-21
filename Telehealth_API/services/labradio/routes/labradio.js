"use strict";

import express from "express";
import labRadioRouteRole from "../controllers/roles/role";
import labRadioRouteStaff from "../controllers/staffmanagement";
import orderFlow from "../controllers/order-price-availibity-request";
import AppointmentController, { portal_viewAppointmentByRoomName, updateUnreadMessage, viewAppointmentByRoomName, viewAppointmentCheck } from '../controllers/appointment';
const fourportalappointment = new AppointmentController();

import { verifyRole, verifyToken } from "../helpers/verifyToken"

import { activeLockDeleteLabRadio, approveOrRejectLabRadio, getLabRadioTestsList, getLab_RadioList, getLabRadioListByPortalUser,  labRadioViewBasicInfo } from "../controllers/superadminmanagement";
import { labradio } from "../controllers/labradio.js";
import { advFiltersLabRadio } from '../controllers/homepage-filter-list/advance_filters.js';
import { addMembersToGroupChat, allMessage, clearAllmessages, clearSinglemessages, createdChat, createGroupChat, getAllUsersForChat, getCreatedChats, getNotification, markAllReadNotification, markReadNotificationByID, saveNotification, sendMessage, updateNotification, updateOnlineStatus } from "../controllers/Chat";
const labRadioRoute = express.Router();

// login
labRadioRoute.post("/sign-up", labradio.signUp);
labRadioRoute.post("/login", labradio.login);
labRadioRoute.post("/send-sms-otp-for-2fa", labradio.sendSmsOtpFor2fa);
labRadioRoute.post("/send-email-otp-for-2fa", labradio.sendEmailOtpFor2fa);
labRadioRoute.post("/match-otp-SMS-for-2fa", labradio.matchOtpFor2fa);
labRadioRoute.post("/match-Otp-Email-For-2-fa", labradio.matchEmailOtpFor2fa);
labRadioRoute.post("/forgot-password", labradio.forgotPassword);
labRadioRoute.post("/reset-password", labradio.resetForgotPassword);
labRadioRoute.post("/change-password", labradio.changePassword);
labRadioRoute.use(verifyToken)
labRadioRoute.post("/logout", labradio.logout);
labRadioRoute.post("/upload-documents", verifyRole(['superadmin', "INDIVIDUAL", 'pharmacy', "INDIVIDUAL_DOCTOR", "patient"]), labradio.uploadDocuments);
labRadioRoute.post("/get-signed-url", verifyRole(['superadmin', "INDIVIDUAL", 'pharmacy', "INDIVIDUAL_DOCTOR", "patient"]), labradio.getSignedUrl);

// profile
labRadioRoute.post('/centre-create-profile', labradio.centreProfileCreate);
labRadioRoute.get('/centre-view-profile', verifyRole(['superadmin', 'INDIVIDUAL', 'patient', 'ADMIN', 'SUPER_USER']), labradio.centreViewProfile);
labRadioRoute.post("/delete-fourportal-pathology-tests", labradio.deletePathologyTest)
labRadioRoute.get('/get-Idby-portaluser-name', labradio.getIdbyPortalUserName);
// Superadmin portal
labRadioRoute.get("/get-lab-radio-list", getLab_RadioList);
labRadioRoute.get("/get-lab-radio-list-by-portal-user", getLabRadioListByPortalUser);
labRadioRoute.get("/get-lab-radio-tests-list", getLabRadioTestsList);
labRadioRoute.post('/approve-or-reject-labradio', approveOrRejectLabRadio);
labRadioRoute.post('/active-lock-delete-labradio', activeLockDeleteLabRadio);

//hospital management
labRadioRoute.get('/four-portal-management-request-list', labradio.fourportalManagementRequestList);
labRadioRoute.get('/four-portal-all-management-list', labradio.fourPortalAllManagementList);
labRadioRoute.post('/four-portal-management-accept-or-reject', labradio.acceptOrRejectFourPortalRequest);


// role
labRadioRoute.post("/add-role", labRadioRouteRole.add_role);
labRadioRoute.get("/all-role", labRadioRouteRole.all_role);
labRadioRoute.post("/update-role", labRadioRouteRole.update_role);
labRadioRoute.post("/delete-role", labRadioRouteRole.delete_role);
labRadioRoute.get("/listCategoryStaff", labradio.listCategoryStaff);
//Advance Filter
labRadioRoute.get("/four-portal-management-detail", advFiltersLabRadio.viewFourPortalDetailsForPatient);
labRadioRoute.post('/four-portal-management-addReviews', advFiltersLabRadio.postReviewAndRating);
labRadioRoute.get('/four-portal-management-getReviews', advFiltersLabRadio.getReviewAndRating);
labRadioRoute.post('/delete-review-and-rating-fourportal', advFiltersLabRadio.deleteReviewAndRating);


// //Staff
labRadioRoute.post("/add-staff", labRadioRouteStaff.addStaff);
labRadioRoute.post("/edit-staff", labRadioRouteStaff.editStaff);
labRadioRoute.get("/get-all-staff", labRadioRouteStaff.getAllStaff);
labRadioRoute.get("/get-all-staff-without-pagination", labRadioRouteStaff.getAllStaffWithoutPagination);
labRadioRoute.get("/get-staff-details", labRadioRouteStaff.getStaffDetails)
labRadioRoute.post("/delete-active-and-lock-staff", labRadioRouteStaff.actionForStaff);


// orderFLow
labRadioRoute.post('/add-new-lab-order', orderFlow.newOrder);
labRadioRoute.post("/four-portal-order-list", orderFlow.listOrder);
labRadioRoute.get("/four-portal-totalOrderCount", orderFlow.totalOrderCount);
labRadioRoute.post("/four-portal-fetchOrderDetails", orderFlow.fetchOrderDetails);
labRadioRoute.put("/four-portal-update-order-details", orderFlow.updateOrderDetails);
labRadioRoute.post("/four-portal-cancel-order", orderFlow.cancelOrder);
labRadioRoute.post("/four-portal-confirm-order", orderFlow.confirmOrder);
labRadioRoute.post("/four-portal-update-schedule-order", orderFlow.updateConfirmScheduleorder);
labRadioRoute.post("/four-portal-save-pdf-data", orderFlow.fourPortalSavePdf);
labRadioRoute.post('/edit-new-lab-name-superadmin', orderFlow.editImagingName);


// Chat
labRadioRoute.get('/get-all-chat-user', getAllUsersForChat);

// chat route
labRadioRoute.post('/create-chat', createdChat);
labRadioRoute.get('/get-create-chat', getCreatedChats);
labRadioRoute.post('/create-message', sendMessage);
labRadioRoute.get('/all-message', allMessage);
labRadioRoute.post('/create-group-chat', createGroupChat);
labRadioRoute.post('/addmembers-to-groupchat', addMembersToGroupChat)


// notification
labRadioRoute.post('/save-notification', saveNotification);
labRadioRoute.get('/get-all-notification', getNotification);
labRadioRoute.put('/mark-all-read-notification', markAllReadNotification)
labRadioRoute.put('/mark-read-notification-id', markReadNotificationByID)
labRadioRoute.post('/update-notification', updateNotification);

labRadioRoute.put('/clear-all-messages', clearAllmessages)
labRadioRoute.post('/update-online-status', updateOnlineStatus)
labRadioRoute.put('/clear-single-message', clearSinglemessages)

labRadioRoute.get('/get-portaluser-data', labradio.getPortalUserData);
labRadioRoute.get('/get-fourportal-basicinfo-data', labradio.getBasicInfoData);
labRadioRoute.get('/get-fourportal-list-forchat-hosp', labradio.fourPortalHospitalListforChat);
labRadioRoute.get('/get-fourportal-registered-user', labradio.getAllPortal_RegisteredUser);
//appointment
labRadioRoute.post("/four-portal-appointment", fourportalappointment.portalAppointment);
labRadioRoute.get("/four-portal-view-Appointment", fourportalappointment.portal_viewAppointment);
labRadioRoute.post("/four-portal-update-Appointment", fourportalappointment.portal_updateAppointmentPaymentStatus);
labRadioRoute.post('/four-portal-cancel-and-approve-appointment', fourportalappointment.portal_cancelAppointment);
labRadioRoute.get('/four-portal_appointment-details', fourportalappointment.portal_appointmentDetails);

labRadioRoute.get('/appointmentList_for_patient', fourportalappointment.appointmentList_for_patient);
labRadioRoute.post('/four-portal-assign-healthcare-provider', fourportalappointment.portal_assignHealthcareProvider);
labRadioRoute.post('/four-portal-consulatation-data', fourportalappointment.portal_post_updateConsulatation);
labRadioRoute.post("/four-portal-reschedule-appointment", fourportalappointment.portal_rescheduleAppointment);
labRadioRoute.get("/four-portal-to-hospital-payment-history", fourportalappointment.hospitalPaymentHistory);
/* videocalling */
labRadioRoute.get('/four-portal-view-appointment-by-roomname', portal_viewAppointmentByRoomName);

labRadioRoute.post('/add-manuall-tests', labradio.addManualTest);
labRadioRoute.post('/edit-manual-tests', labradio.editManualTest);
//Notification
labRadioRoute.post('/notification', labradio.notification);
labRadioRoute.get('/notificationlist', labradio.notificationlist);
labRadioRoute.post("/update-notification-status", labradio.updateNotificationStatus);

//logs update
labRadioRoute.post("/update-logs", labradio.updatelogsData)
labRadioRoute.get("/get-all-logs-by-userId", labradio.getAllLogs)

labRadioRoute.get('/viewAppointmentCheck', viewAppointmentCheck);
labRadioRoute.get('/updateUnreadMessage', updateUnreadMessage);

//video-calling
labRadioRoute.get('/view-appointment-by-roomname', viewAppointmentByRoomName);

labRadioRoute.post("/four-portal-fetch-room-call", labradio.portal_fetchRoomCall);
labRadioRoute.post("/four-portal-update-videocall-appointment", fourportalappointment.portal_UpdateVideocallAppointment);
labRadioRoute.post("/four-portal-update-videocall-chatmessage", fourportalappointment.portal_updateVideocallchatmessage);
labRadioRoute.get("/four-portal-participant-details", fourportalappointment.portal_participantInfo);
labRadioRoute.post("/appointment-details", fourportalappointment.fetchAppointmentDetails);
labRadioRoute.get("/four-portal-appointment-details-hospital-dashboard", fourportalappointment.totalCountforAppointmentHospitalDashboard);
labRadioRoute.get("/four-portal-payment-history", fourportalappointment.patientPaymentHistoryToFourPortal);



labRadioRoute.get("/getFourPortalList", labradio.getFourPortalList);

labRadioRoute.get("/fourtportalDetails", labradio.fourtportalDetails);
labRadioRoute.get("/get-rating-and-reveiws", labradio.getReviewAndRatinByPatient);
labRadioRoute.get("/get-reviews-rating-superadmin", labradio.getReviewAndRatingForSupeAdmin);
labRadioRoute.get("/get-all-labradio", labradio.getAllLabRadio); // This will return onlu center name for dropdown
labRadioRoute.post('/save-superadmin-notification', labradio.saveSuperadminNotification);
labRadioRoute.get('/get-total-labradio-count', verifyRole(['superadmin']), labradio.getTotalLabRadioCount);
labRadioRoute.get('/dashboard-labradio-report', verifyRole(['superadmin', 'INDIVIDUAL_DOCTOR_ADMIN', 'ADMIN','SUPER_USER']), labradio.getDashboardLabRadiologyReport) // For superadmin
labRadioRoute.get('/dashboard-labradio-list', verifyRole(['superadmin', "ADMIN", 'SUPER_USER']), labradio.getDashboardLabRadiologyList) // For superadmin
labRadioRoute.get('/export-dashboard-labradio-list', verifyRole(['superadmin']), labradio.export_getDashboardLabRadiologyList) // For superadmin
labRadioRoute.get('/dashboard', verifyRole(['INDIVIDUAL', 'superadmin']), labradio.getDashboardData) // For superadmin
labRadioRoute.get('/dashboard-graph', verifyRole(['INDIVIDUAL', 'superadmin']), labradio.getDashboardGraphData) // For superadmin
labRadioRoute.get('/get-labradio-details-by-id', verifyRole(['INDIVIDUAL_DOCTOR', 'patient', 'INDIVIDUAL']), labradio.getLabRadioDetailsById)
labRadioRoute.get('/dashboard-records', verifyRole(['superadmin']), labradio.getDashboardDataRecords);
labRadioRoute.get('/get-total-labradio-records', verifyRole(['superadmin']), labradio.getTotalLabRadioRecords);
labRadioRoute.put('/update-center-user-admin', verifyRole(['superadmin']), labradio.markAsCenterUserAdmin);

/* super-user */
labRadioRoute.post('/center-lab-radio-superuser-admin', verifyRole(['superadmin']), labradio.createLabRadioSuperUserProfile);
labRadioRoute.post('/update-lab-radio-superuser-admin', verifyRole(['superadmin']), labradio.updateLabRadioSuperUserProfile);

export default labRadioRoute;