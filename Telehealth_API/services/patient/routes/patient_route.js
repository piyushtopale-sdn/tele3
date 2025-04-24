"use strict";

import express from "express";
const { patient } = require("../controllers/patient");
const ProfileInformation = require("../controllers/profile-information.controller");
const patientRoute = express.Router();
const fs = require('fs');

import { verifyRole, verifyToken } from "../helpers/verifyToken"
const uploadFileToLocalStorage = async (req, res, next) => {
    if (!req.files) {
        return handleResponse(req, res, 500, {
            status: false,
            body: null,
            message: "No files found",
            errorCode: "INTERNAL_SERVER_ERROR",
        })
    }
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
patientRoute.post("/signup", patient.signup);
patientRoute.post("/login", patient.login);
patientRoute.post("/logout", patient.logout);
patientRoute.post("/send-email-otp-for-2fa", patient.sendEmailOtpFor2fa);
patientRoute.post("/match-email-otp-for-2fa", patient.matchEmailOtpFor2fa);
patientRoute.post("/send-sms-otp-for-2fa", patient.sendSmsOtpFor2fa);
patientRoute.post("/match-sms-otp-for-2fa", patient.matchSmsOtpFor2fa);

patientRoute.get("/static-immunization-list", patient.staticImmunizationList);
patientRoute.get("/static-patient-lifestyle-type-list", patient.staticPatientLifestyleTypeList);
patientRoute.get("/static-family-history-type-list", patient.staticFamilyHistoryTypeList);


patientRoute.post("/create-profile/personal-details", patient.personalDetails);
patientRoute.post("/patient-add-by-doctor", patient.patientAddByDoctor);
patientRoute.post("/create-profile/add-vitals", patient.addVitals);
patientRoute.delete("/create-profile/delete-vitals/:id", patient.deleteVitals);
patientRoute.post("/create-profile/medicine-details", patient.medicineDetails);
patientRoute.post("/create-profile/immunization-details", patient.immunizationDetails);
patientRoute.post("/edit-immunization", patient.editImmunization);
patientRoute.post("/delete-Immunization", patient.deleteImmunization);
//Patient Vitals Management
patientRoute.post("/add-vitals", patient.addPatientVitals);
patientRoute.put("/edit-vitals", patient.editPatientVitals);
patientRoute.delete("/delete-vitals/:id", patient.deletePatientVitals);
patientRoute.get("/get-all-vitals", patient.getPatientVitals);
patientRoute.get("/get-all-vitals-for-graph", patient.getPatientVitalsForGraph);

patientRoute.post("/add-patient-history-details", patient.addpatient_historyDetails);
patientRoute.post("/create-profile/medical-document", patient.medicalDocument);
//FamilyMember
patientRoute.post("/create-profile/family-details", patient.familyDetails);
patientRoute.post("/create-profile/add-family", ProfileInformation.addFamily);
patientRoute.get("/create-profile/list-family-member", ProfileInformation.listFamilyMember);
patientRoute.get("/create-profile/deleted-list-family-member", ProfileInformation.deletedFamilyMembersList);
patientRoute.put("/create-profile/delete-activate-family", ProfileInformation.deleteActivateFamilyMember);
patientRoute.put("/create-profile/edit-family", ProfileInformation.editFamilyMember);
//MedicalHistory
patientRoute.post("/create-profile/add-medical-history", ProfileInformation.addMedicalHistory);
patientRoute.get("/create-profile/list-medical-history", ProfileInformation.listMedicalHistory);
patientRoute.put("/create-profile/delete-medical-history", ProfileInformation.deleteMedicalHistory);
patientRoute.put("/create-profile/edit-medical-history", ProfileInformation.editMedicalHistory);
//SocialHistory
patientRoute.post("/create-profile/add-social-history", ProfileInformation.addSocialHistory);
patientRoute.get("/create-profile/list-social-history", ProfileInformation.listSocialHistory);
patientRoute.put("/create-profile/delete-social-history", ProfileInformation.deleteSocialHistory);
patientRoute.put("/create-profile/edit-social-history", ProfileInformation.editSocialHistory);

patientRoute.post("/change-password", patient.changePassword);
patientRoute.post("/forgot-password", patient.forgotPassword);
patientRoute.post("/reset-forgot-password", patient.resetForgotPassword);
patientRoute.get("/common-api", patient.commonAPI);
patientRoute.get("/get-all-patient", patient.getAllPatient);
patientRoute.get("/get-all-patient-added-by-doctor", patient.getAllPatientAddedByDoctor);
patientRoute.get("/getAllPatientForSuperAdmin", patient.getAllPatientForSuperAdmin);// Added by Tanay
patientRoute.get("/getAllPatientForSuperAdminNew", patient.getAllPatientForSuperAdminNew);// Added by Altamash
patientRoute.get("/getAllPatientForSuperAdminNewToNotify", patient.getAllPatientForSuperAdminNewToNotify);// Added by Dilip
patientRoute.put("/active-lock-patient", patient.activeLockPatient);
patientRoute.post("/delete-patient-docs", patient.deletePatientDocs);
patientRoute.get("/getAllPatienthaving-fcm-Token", patient.getPatienthavingFCMtoken);
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
patientRoute.put("/update-patient-details", patient.updatePatientDetails);


//Roles and permissions
patientRoute.post('/set-profile-permission', patient.setProfilePermission);
patientRoute.get('/get-profile-permission', patient.getProfilePermission);

//Waiting Room
patientRoute.post("/add-medicine-on-waiting-room", patient.addMedicineOnWaitingRoom);
patientRoute.post("/edit-medicine-on-waiting-room", patient.editMedicineOnWaitingRoom);

//get all rating and reviews given by patient
patientRoute.get("/all-rating-reviews-by-patient", patient.getAllRatingReviewByGivenByPatient);
patientRoute.get("/search-any-portaluser-by-search-keyword", patient.SearchAnyPortaluserBySearchKeyword);


patientRoute.get("/get-vitals", patient.vitalsList);

// email invitation
patientRoute.post("/send-email-invitation", patient.sendInvitation);
patientRoute.get("/get-email-invitation-list", patient.getAllInvitation);
patientRoute.get("/get-email-invitation-id", patient.getInvitationById);
patientRoute.post("/delete-email-invitation", patient.deleteInvitation);

patientRoute.get('/get-all-notification',  patient.getNotification);
patientRoute.put('/mark-all-read-notification',  patient.markAllReadNotification)
patientRoute.put('/mark-read-notification-id',  patient.markReadNotificationByID)
patientRoute.post('/update-notification',  patient.updateNotification);

patientRoute.post("/update-notification-status",patient.updateNotificationStatus);
patientRoute.get("/get-portal-data",patient.getPortalData)
patientRoute.get("/get-profile-info-data",patient.getProfileInfoData)
patientRoute.use(verifyToken);

patientRoute.post("/add-immunization", patient.addImmunization_SuperAdmin);
patientRoute.get("/list-immunizationlist", patient.allImmunizationList);
patientRoute.put('/update-immunization', patient.updateImmunization)
patientRoute.post('/delete-immunizationstatus', patient.actionOnImmunization)
patientRoute.get('/exportsheetlist-immunization', patient.allImmunizationListforexport)
patientRoute.post('/upload-csv-for-immunization-list', uploadFileToLocalStorage, patient.uploadCSVForImmunization)
patientRoute.get('/get-id-by-immunization', patient.getIDbyImmunization)
patientRoute.get('/get-QRcode-Scan-Data', patient.getQRcodeScanData)
// family_memberList
patientRoute.get("/patient-familymember-list", patient.getListofFamilyMember);
patientRoute.post('/delete-family-member', patient.deleteFamilyMember)
// preferred-pharmacy
patientRoute.post('/add-preferred-pharmacy', patient.addPreferredPharmacy)
patientRoute.get('/get-preferred-pharmacy/:id', patient.getPreferredPharmacy)
patientRoute.put('/remove-preferred-pharmacy', patient.removedPreferredPharmacy)
// delete-patient-history
patientRoute.post('/delete-history-info', patient.deletePatientHistory)
patientRoute.post('/delete-medical-socail-family_member_history', patient.delete_medical_socail_familyHistory)
patientRoute.get("/patient-history-list", patient.patient_historyList);

patientRoute.put('/update-consultation-count', patient.updateConsultationCount);
patientRoute.post("/upload-medical-document", verifyRole(['patient']), patient.uploadMedicalDocument);
patientRoute.get("/get-medical-documents", verifyRole(['patient', 'INDIVIDUAL_DOCTOR', 'INDIVIDUAL_DOCTOR_ADMIN']), patient.getMedicalDocuments);
patientRoute.delete("/delete-medical-documents/:id", verifyRole(['patient']), patient.deleteMedicalDocuments);

patientRoute.post('/add-assessment', patient.addAssessment);
patientRoute.get('/get-assessment', patient.getAssessment);
patientRoute.post('/assign-doctor', patient.assignDoctor);
patientRoute.get('/get-assign-doctor-family-member/:id', patient.getAssignedDoctorForFamilyMember);
patientRoute.get('/get-assigned-doctors/:id', verifyRole(['patient','superadmin']), patient.getAssignedDoctors);
patientRoute.get('/get-patient-subscription-details/:id', verifyRole(['superadmin','patient']), patient.getPatientSubscriptionDetails);
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
patientRoute.get('/get-total-revenue-details', verifyRole(['superadmin']), patient.getTotalRevenueWithDetails);

patientRoute.get("/get-all-patient-lis-for-admin-dashboard", patient.getAllPatientForAdminDashboardReport);// Added by Tanay
patientRoute.get('/subscriber-report-active-cancel-data', verifyRole(['superadmin']), patient.getPatientActiveCancelledList); //Altamash

patientRoute.get("/getAllPatient-with-previous-doc",patient.getPatientsWithPreviousDoctors) //AYAN API
patientRoute.get("/getAllPatient-with-currentassign-doc",patient.getPatientsWithCurrentAssignedDoctors) //AYAN API
patientRoute.get('/get-total-revenues', verifyRole(['superadmin']), patient.getTotalAmountPaid); //AYAN API

patientRoute.post("/logout-patient", patient.logoutPatient); // Dilip


patientRoute.get("/get-patient-discount-coupon-details",patient.getLabTestsByDiscountCoupon);
patientRoute.get("/get-labRadioTest-invoice-cancel-details",patient.getLabRadioTestInvoiceCancelDetails)

export default patientRoute;
