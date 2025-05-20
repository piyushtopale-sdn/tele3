"use strict";

import express from "express";
import { patient } from '../controllers/patient.js';
import ProfileInformation from '../controllers/profile-information.controller.js';
const patientRoute = express.Router();

import { verifyRole, verifyToken } from "../helpers/verifyToken"

patientRoute.post("/signup", patient.signup);
patientRoute.post("/login", patient.login);
patientRoute.post("/logout", patient.logout);
patientRoute.post("/send-email-otp-for-2fa", patient.sendEmailOtpFor2fa);
patientRoute.post("/match-email-otp-for-2fa", patient.matchEmailOtpFor2fa);
patientRoute.post("/send-sms-otp-for-2fa", patient.sendSmsOtpFor2fa);
patientRoute.post("/match-sms-otp-for-2fa", patient.matchSmsOtpFor2fa);
patientRoute.post("/change-password", patient.changePassword);
patientRoute.post("/forgot-password", patient.forgotPassword);
patientRoute.post("/reset-forgot-password", patient.resetForgotPassword);
patientRoute.get("/common-api", patient.commonAPI);


patientRoute.use(verifyToken);

patientRoute.post('/add-assessment', verifyRole(['patient', 'superadmin']), patient.addAssessment);
patientRoute.get('/get-assessment', verifyRole(['patient', 'superadmin', 'INDIVIDUAL_DOCTOR','INDIVIDUAL_DOCTOR_ADMIN','SUPER_USER']), patient.getAssessment);
patientRoute.post('/assign-doctor', verifyRole(['patient', 'superadmin', 'INDIVIDUAL_DOCTOR']), patient.assignDoctor);
patientRoute.get('/get-assign-doctor-family-member/:id', patient.getAssignedDoctorForFamilyMember);
patientRoute.get('/get-assigned-doctors/:id', verifyRole(['patient', 'superadmin']), patient.getAssignedDoctors);
patientRoute.get('/get-patient-subscription-details/:id', verifyRole(['superadmin', 'patient']), patient.getPatientSubscriptionDetails);
patientRoute.get('/get-patient-profile-completion-details/:id', verifyRole(['patient']), patient.getPatientProfileCompletionDetails);
patientRoute.get('/get-all-patient-having-subscription', verifyRole(['superadmin']), patient.getAllPatientHavingSubscription);
patientRoute.get('/get-total-patient-count', verifyRole(['superadmin']), patient.getTotalPatientCount);
patientRoute.get('/get-all-revenue', verifyRole(['superadmin']), patient.getAllRevenue);
patientRoute.get('/get-all-patient-details-revenue', verifyRole(['superadmin']), patient.getAllRevenueWithPatientDetails);
patientRoute.get('/get-total-revenue-details', verifyRole(['superadmin']), patient.getTotalRevenueWithDetails);
patientRoute.get('/subscriber-report-active-cancel-data', verifyRole(['superadmin']), patient.getPatientActiveCancelledList);
patientRoute.get('/subscriber-dashboard', verifyRole(['superadmin']), patient.subscriberDashboard);
patientRoute.get('/subscriber-report-for-dashboard', verifyRole(['superadmin']), patient.subscriberReportForDashboard);
patientRoute.get('/subscriber-discount-used-report', verifyRole(['superadmin']), patient.subscriberDiscountUsedReport);
patientRoute.get('/patient-dont-have-subscription-plan', verifyRole(['superadmin']), patient.patientNothavingSubscriptionPlan);
patientRoute.get('/notify-doctor-for-waiting', patient.notifyDoctorForWaiting);
patientRoute.get('/get-subscribed-patient-for-doctor', patient.getSubscribedPatientForDoctor);
patientRoute.get('/export-revenue-list', verifyRole(['superadmin']), patient.exportMainRevenueList);
patientRoute.get('/get-total-patient-records', verifyRole(['superadmin']), patient.getTotalPatientRecords);
patientRoute.get('/subscriber-report-get-patient-data', verifyRole(['superadmin']), patient.getPatientTotalSubscriberList);

patientRoute.get("/get-all-patient-lis-for-admin-dashboard", verifyRole(['superadmin', 'INDIVIDUAL_DOCTOR']), patient.getAllPatientForAdminDashboardReport);// Added by Tanay
patientRoute.get('/subscriber-report-active-cancel-data', verifyRole(['superadmin']), patient.getPatientActiveCancelledList); //Altamash

patientRoute.get("/getAllPatient-with-previous-doc", verifyRole(['superadmin','INDIVIDUAL_DOCTOR_ADMIN','SUPER_USER']), patient.getPatientsWithPreviousDoctors) //AYAN API
patientRoute.get("/getAllPatient-with-currentassign-doc", verifyRole(['superadmin','INDIVIDUAL_DOCTOR_ADMIN','SUPER_USER']), patient.getPatientsWithCurrentAssignedDoctors) //AYAN API
patientRoute.get('/get-total-revenues', verifyRole(['superadmin']), patient.getTotalAmountPaid); //AYAN API

patientRoute.post("/logout-patient", patient.logoutPatient); // Dilip

patientRoute.put('/update-consultation-count', patient.updateConsultationCount);
patientRoute.post("/upload-medical-document", verifyRole(['patient']), patient.uploadMedicalDocument);
patientRoute.get("/get-medical-documents", verifyRole(['patient', 'INDIVIDUAL_DOCTOR', 'INDIVIDUAL_DOCTOR_ADMIN','SUPER_USER']), patient.getMedicalDocuments);
patientRoute.delete("/delete-medical-documents/:id", verifyRole(['patient']), patient.deleteMedicalDocuments);

patientRoute.get("/get-patient-discount-coupon-details", verifyRole(['superadmin', 'ADMIN', 'SUPER_USER']), patient.getLabTestsByDiscountCoupon);
patientRoute.get("/get-labRadioTest-invoice-cancel-details", verifyRole(['superadmin', 'ADMIN', 'SUPER_USER']), patient.getLabRadioTestInvoiceCancelDetails)

/** Start */

patientRoute.post("/create-profile/personal-details", verifyRole(['patient', 'superadmin', 'INDIVIDUAL_DOCTOR']), patient.personalDetails);
patientRoute.post("/patient-add-by-doctor", verifyRole(['patient', 'superadmin', 'INDIVIDUAL_DOCTOR']), patient.patientAddByDoctor);
patientRoute.post("/create-profile/add-vitals", verifyRole(['patient', 'superadmin', 'INDIVIDUAL_DOCTOR']), patient.addVitals);
patientRoute.delete("/create-profile/delete-vitals/:id", verifyRole(['patient', 'superadmin', 'INDIVIDUAL_DOCTOR']), patient.deleteVitals);
patientRoute.post("/create-profile/medicine-details", verifyRole(['patient', 'superadmin', 'INDIVIDUAL_DOCTOR']), patient.medicineDetails);

//Patient Vitals Management
patientRoute.post("/add-vitals", verifyRole(['patient', 'superadmin', 'INDIVIDUAL_DOCTOR']), patient.addPatientVitals);
patientRoute.put("/edit-vitals", verifyRole(['patient', 'superadmin', 'INDIVIDUAL_DOCTOR']), patient.editPatientVitals);
patientRoute.delete("/delete-vitals/:id", verifyRole(['patient', 'superadmin', 'INDIVIDUAL_DOCTOR']), patient.deletePatientVitals);
patientRoute.get("/get-all-vitals", patient.getPatientVitals);
patientRoute.get("/get-all-vitals-for-graph", patient.getPatientVitalsForGraph);
patientRoute.post("/add-patient-history-details", verifyRole(['patient', 'superadmin', 'INDIVIDUAL_DOCTOR']), patient.addpatient_historyDetails);
patientRoute.post("/create-profile/medical-document", verifyRole(['patient', 'superadmin', 'INDIVIDUAL_DOCTOR']), patient.medicalDocument);
patientRoute.get("/get-vitals", patient.vitalsList);

//FamilyMember
patientRoute.post("/create-profile/family-details", verifyRole(['patient', 'superadmin', 'INDIVIDUAL_DOCTOR']), patient.familyDetails);
patientRoute.post("/create-profile/add-family", verifyRole(['patient', 'superadmin', 'INDIVIDUAL_DOCTOR']), ProfileInformation.addFamily);
patientRoute.get("/create-profile/list-family-member", ProfileInformation.listFamilyMember);
patientRoute.get("/create-profile/deleted-list-family-member", ProfileInformation.deletedFamilyMembersList);
patientRoute.put("/create-profile/delete-activate-family", verifyRole(['patient', 'superadmin', 'INDIVIDUAL_DOCTOR']), ProfileInformation.deleteActivateFamilyMember);
patientRoute.put("/create-profile/edit-family", verifyRole(['patient', 'superadmin', 'INDIVIDUAL_DOCTOR']), ProfileInformation.editFamilyMember);

//MedicalHistory
patientRoute.post("/create-profile/add-medical-history", verifyRole(['patient', 'superadmin', 'INDIVIDUAL_DOCTOR']), ProfileInformation.addMedicalHistory);
patientRoute.get("/create-profile/list-medical-history", ProfileInformation.listMedicalHistory);
patientRoute.put("/create-profile/delete-medical-history", verifyRole(['patient', 'superadmin', 'INDIVIDUAL_DOCTOR']), ProfileInformation.deleteMedicalHistory);
patientRoute.put("/create-profile/edit-medical-history", verifyRole(['patient', 'superadmin', 'INDIVIDUAL_DOCTOR']), ProfileInformation.editMedicalHistory);
//SocialHistory
patientRoute.post("/create-profile/add-social-history", verifyRole(['patient', 'superadmin', 'INDIVIDUAL_DOCTOR']), ProfileInformation.addSocialHistory);
patientRoute.get("/create-profile/list-social-history", ProfileInformation.listSocialHistory);
patientRoute.put("/create-profile/delete-social-history", verifyRole(['patient', 'superadmin', 'INDIVIDUAL_DOCTOR']), ProfileInformation.deleteSocialHistory);
patientRoute.put("/create-profile/edit-social-history", verifyRole(['patient', 'superadmin', 'INDIVIDUAL_DOCTOR']), ProfileInformation.editSocialHistory);

patientRoute.get("/get-all-patient", patient.getAllPatient);
patientRoute.get("/get-all-patient-added-by-doctor", patient.getAllPatientAddedByDoctor);
patientRoute.get("/getAllPatientForSuperAdmin", patient.getAllPatientForSuperAdmin);// Added by Tanay
patientRoute.get("/getAllPatientForSuperAdminNew", patient.getAllPatientForSuperAdminNew);// Added by Altamash
patientRoute.get("/getAllPatientForSuperAdminNewToNotify", patient.getAllPatientForSuperAdminNewToNotify);// Added by Dilip
patientRoute.put("/active-lock-patient", verifyRole(['superadmin', 'INDIVIDUAL_DOCTOR']), patient.activeLockPatient);
patientRoute.post("/delete-patient-docs", verifyRole(['patient', 'superadmin', 'INDIVIDUAL_DOCTOR']), patient.deletePatientDocs);
patientRoute.get("/getAllPatienthaving-fcm-Token",verifyRole(['superadmin', 'INDIVIDUAL_DOCTOR']), patient.getPatienthavingFCMtoken);
patientRoute.post("/save-superadmin-notification", patient.saveSuperadminNotification);

patientRoute.get("/patient-details", patient.patientFullDetails);
patientRoute.get("/patient-parent-details", patient.patientParentFullDetails);
patientRoute.get("/patient-personal-details", patient.patientPersonalDetails);
patientRoute.get("/profile-details", patient.profileDetails);
patientRoute.get("/patient-existing-docs", patient.patientExistingDocs);
patientRoute.get("/patient-common-details", patient.patientCommonDetails);
patientRoute.post("/get-patient-details-by-id", patient.getPatientDetailsById)
patientRoute.post("/get-patient-details-basedon-request", patient.getPatientDetailsBasedOnRequest) //Return data based on request (like GraphQL)
patientRoute.post("/get-patient-documents-by-ids", patient.getPatientDocumentsById);
patientRoute.post('/notification', patient.notification);
patientRoute.get("/get-patient-profile-signed-url", patient.patientProfileSignedUrl);
patientRoute.get("/patient-dependent-family-members", patient.getDependentFamilyMembers);
patientRoute.put("/update-patient-details", verifyRole(['patient', 'superadmin', 'INDIVIDUAL_DOCTOR']), patient.updatePatientDetails);


//Roles and permissions
patientRoute.post('/set-profile-permission', verifyRole(['patient', 'superadmin', 'INDIVIDUAL_DOCTOR']), patient.setProfilePermission);
patientRoute.get('/get-profile-permission', verifyRole(['patient', 'superadmin', 'INDIVIDUAL_DOCTOR']), patient.getProfilePermission);

//Waiting Room
patientRoute.post("/add-medicine-on-waiting-room", verifyRole(['patient', 'superadmin', 'INDIVIDUAL_DOCTOR']), patient.addMedicineOnWaitingRoom);
patientRoute.post("/edit-medicine-on-waiting-room", verifyRole(['patient', 'superadmin', 'INDIVIDUAL_DOCTOR']), patient.editMedicineOnWaitingRoom);

//get all rating and reviews given by patient
patientRoute.get("/all-rating-reviews-by-patient", patient.getAllRatingReviewByGivenByPatient);
patientRoute.get("/search-any-portaluser-by-search-keyword", patient.SearchAnyPortaluserBySearchKeyword);

patientRoute.get('/get-all-notification', patient.getNotification);
patientRoute.put('/mark-all-read-notification', patient.markAllReadNotification)
patientRoute.put('/mark-read-notification-id', patient.markReadNotificationByID)
patientRoute.post('/update-notification', patient.updateNotification);

patientRoute.post("/update-notification-status", patient.updateNotificationStatus);
patientRoute.get("/get-portal-data", patient.getPortalData)
patientRoute.get("/get-profile-info-data", patient.getProfileInfoData)

// family_memberList
patientRoute.get("/patient-familymember-list", patient.getListofFamilyMember);
patientRoute.post('/delete-family-member', verifyRole(['patient', 'superadmin', 'INDIVIDUAL_DOCTOR']), patient.deleteFamilyMember)
// preferred-pharmacy
patientRoute.post('/add-preferred-pharmacy', verifyRole(['patient', 'superadmin', 'INDIVIDUAL_DOCTOR']), patient.addPreferredPharmacy)
patientRoute.get('/get-preferred-pharmacy/:id', patient.getPreferredPharmacy)
patientRoute.put('/remove-preferred-pharmacy', verifyRole(['patient', 'superadmin', 'INDIVIDUAL_DOCTOR']), patient.removedPreferredPharmacy)
// delete-patient-history
patientRoute.post('/delete-history-info', verifyRole(['patient', 'superadmin', 'INDIVIDUAL_DOCTOR']), patient.deletePatientHistory)
patientRoute.post('/delete-medical-socail-family_member_history', verifyRole(['patient', 'superadmin', 'INDIVIDUAL_DOCTOR']), patient.delete_medical_socail_familyHistory)
patientRoute.get("/patient-history-list", patient.patient_historyList);

/** End */


export default patientRoute;
