import express from "express";
import { registerValidator } from "../validator/pharmacy";
import { dataValidation } from "../helpers/transmission";
const pharmacy = require("../controllers/pharmacy_controller");
import StaffManagementController from "../controllers/staffManagementController"
import { verifyRole, verifyToken } from "../helpers/verifyToken";
import { addMembersToGroupChat, allMessage, clearAllmessages, createdChat, createGroupChat, getCreatedChats, getNotification, markAllReadNotification, markReadNotificationByID, saveNotification, sendMessage, updateNotification, updateOnlineStatus, updateConfirmScheduleorder, clearSinglemessages } from "../controllers/Chat-Controller/Chat";
const pharmacyRoute = express.Router();


pharmacyRoute.get(
    "/view-pharmacy-admin-details",
    pharmacy.viewPharmacyAdminDetails
);
pharmacyRoute.post("/send-sms-otp", pharmacy.sendSmsOtpFor2fa)
pharmacyRoute.post("/match-sms-otp", pharmacy.matchSmsOtpFor2fa)
pharmacyRoute.post('/send-email-verification', pharmacy.sendVerificationEmail);
pharmacyRoute.post("/match-Email-Otp-For2fa", pharmacy.matchEmailOtpFor2fa)
pharmacyRoute.post("/signup", registerValidator, dataValidation, pharmacy.signup);
pharmacyRoute.post("/login", pharmacy.login);
pharmacyRoute.post("/refresh-token", pharmacy.refreshToken);
pharmacyRoute.post("/forgot-password", pharmacy.forgotPassword);
pharmacyRoute.post("/change-password", pharmacy.changePassword);
pharmacyRoute.post("/lock-profile", pharmacy.lockProfile);
pharmacyRoute.post('/delete-active-admin', pharmacy.deleteActiveadmin)
pharmacyRoute.post("/pharmacy-opening-hours", pharmacy.pharmacyOpeningHours);
pharmacyRoute.post("/reset-password", pharmacy.resetPassword);
pharmacyRoute.get("/get-all-pharmacy", pharmacy.getAllPharmacy);
pharmacyRoute.get("/get-all-pharmacy-admin-details", pharmacy.getAllPharmacyAdminDetails);
pharmacyRoute.get("/get-pharmacy-details", pharmacy.getAllPharmacyAdminDetails);
pharmacyRoute.get("/check-route", pharmacy.checkRoute);
pharmacyRoute.get("/pharmacy-admin-details", pharmacy.pharmacyAdminDetails);
pharmacyRoute.post("/save-superadmin-notification", pharmacy.saveSuperadminNotification);
pharmacyRoute.get("/get-pharmacy-count-superadmin-dashboard", pharmacy.totalPharmacyforAdminDashboard);
pharmacyRoute.get("/get-orders-doctor-patient-details", pharmacy.getOrdersWithDoctorPatientDetails);

pharmacyRoute.get('/get-review-and-rating', pharmacy.getReviewAndRating);
pharmacyRoute.post('/delete-review-and-rating-pharmacy', pharmacy.deleteReviewAndRating);
pharmacyRoute.get('/get-review-and-rating-by-patient', pharmacy.getReviewAndRatinByPatient);
pharmacyRoute.post("/pharmacy-profile-create", pharmacy.pharmacyCreateProfile);
pharmacyRoute.post('/post-review-and-rating', pharmacy.postReviewAndRating);
// unregisteredUser
pharmacyRoute.post('/create-unregistered-pharmacy-staff', pharmacy.unregisterPharmacyStaff);
pharmacyRoute.get("/unregister-list-pharmacy", pharmacy.unregisterPharmacyList);
pharmacyRoute.get("/get-unregister-pharmacy-details", pharmacy.getUnregisterPharmacyDetails);
pharmacyRoute.post("/update-unregistered-pharmacy", pharmacy.unregisterPharmacyUpdate);
//logsUpdate
pharmacyRoute.post("/update-logs", pharmacy.updatelogsData);
pharmacyRoute.get("/get-all-logs-by-userId", pharmacy.getAllLogs);
pharmacyRoute.post("/pharmacy-profile", pharmacy.pharmacyProfile);

pharmacyRoute.use(verifyToken);
pharmacyRoute.post("/logout", pharmacy.logout);

pharmacyRoute.get("/list-pharmacy-admin-user", pharmacy.listPharmacyAdminUser);

//Staff Management
pharmacyRoute.post('/add-staff', verifyRole(['pharmacy']), StaffManagementController.addStaff)
pharmacyRoute.post('/edit-staff', verifyRole(['pharmacy']), StaffManagementController.editStaff)
pharmacyRoute.get("/list-staff", verifyRole(['pharmacy']), StaffManagementController.listStaff);
pharmacyRoute.get("/get-all-staff", StaffManagementController.getAllStaff); //Get all Staff without paginate
pharmacyRoute.get("/view-staff-details", StaffManagementController.viewStaff);
pharmacyRoute.put('/delete-active-lock-staff', verifyRole(['pharmacy']), StaffManagementController.deleteActiveLockStaff)
pharmacyRoute.get("/list-category-staff", StaffManagementController.listCategoryStaff)
pharmacyRoute.post("/approve-or-reject-pharmacy", pharmacy.approveOrRejectPharmacy);
pharmacyRoute.post("/pharmacy-profile-set-hours", pharmacy.pharmacyProfileSetHours);
pharmacyRoute.get("/list-approved-pharmacy-admin-user", pharmacy.listApprovedPharmacyAdminUser);
pharmacyRoute.get("/get-PharmacyBy-Id", pharmacy.getPharmacyById);
pharmacyRoute.get("/get-medicine-orderdetails-byid", pharmacy.getOrderDetailsById);
pharmacyRoute.get("/chat-list-staff", StaffManagementController.pharmacyListForChat);
// chat route
pharmacyRoute.post('/create-chat', createdChat);
pharmacyRoute.get('/get-create-chat', getCreatedChats);
pharmacyRoute.post('/create-message', sendMessage);
pharmacyRoute.get('/all-message', allMessage);
pharmacyRoute.post('/create-group-chat', createGroupChat);
pharmacyRoute.post('/addmembers-to-groupchat', addMembersToGroupChat)
// notification
pharmacyRoute.post('/save-notification', saveNotification);
pharmacyRoute.get('/get-all-notification', getNotification);
pharmacyRoute.put('/mark-all-read-notification', markAllReadNotification)
pharmacyRoute.put('/mark-read-notification-id', markReadNotificationByID)
pharmacyRoute.post('/update-notification', updateNotification);
pharmacyRoute.put('/clear-all-messages', clearAllmessages)
pharmacyRoute.post('/update-online-status', updateOnlineStatus)
pharmacyRoute.put("/update-schedule-order", updateConfirmScheduleorder);
pharmacyRoute.put('/clear-single-message', clearSinglemessages)
//Notification for order
pharmacyRoute.post('/notification', pharmacy.notification);
pharmacyRoute.get('/notificationlist', pharmacy.notificationlist);
pharmacyRoute.post("/update-notification-status",pharmacy.updateNotificationStatus);
pharmacyRoute.get("/get-portaluser-data",pharmacy.getPortalUserData);
pharmacyRoute.get('/get-total-pharmacy-count', verifyRole(['superadmin']), pharmacy.getTotalPharmacyCount);
pharmacyRoute.get("/dashboard", verifyRole(['pharmacy', 'superadmin']), pharmacy.getDashboardData);
pharmacyRoute.get("/dashboard-graph", verifyRole(['pharmacy', 'superadmin']), pharmacy.getDashboardGraphData);
pharmacyRoute.get('/get-total-pharmacy-records', verifyRole(['superadmin']), pharmacy.getTotalPharmacyRecords);
pharmacyRoute.get("/dashboard-records", verifyRole(['pharmacy', 'superadmin']), pharmacy.getDashboardRecords);

export default pharmacyRoute;
