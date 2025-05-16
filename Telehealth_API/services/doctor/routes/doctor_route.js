"use strict";

import express from "express";
const { doctorController } = require("../controllers/doctor.controller");
import { verifyRole, verifyToken } from "../helpers/verifyToken";
import { handleResponse } from "../middleware/utils";
import fs from "fs";

const doctorRoute = express.Router();

const uploadImage = async (req, res, next) => {
  const file = req.files.file;
  const filename = file.name.split('.')[0] + '-' + Date.now() + '.jpg';
  req.filename = filename;
  
  const newPath = `${__dirname.replace('routes', 'uploadEsignature')}/${filename}`
  file.mv(newPath);
  next()
}
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

doctorRoute.post("/add-staff", doctorController.addStaff);
doctorRoute.post("/delete-staff", doctorController.deleteStaff);
doctorRoute.put(
  "/update-staff-details",
  doctorController.updateStaffDetails
);
doctorRoute.post("/add-doctor", doctorController.addDoctor);
doctorRoute.post("/delete-doctor", doctorController.deleteDoctor);
doctorRoute.put(
  "/update-doctor-details",
  doctorController.updateDoctorDetails
);
doctorRoute.post(
  "/add-doctor-education",
  doctorController.addDoctorEducation
);
doctorRoute.put(
  "/update-doctor-education",
  doctorController.updateDoctorEducation
);
doctorRoute.post(
  "/delete-doctor-education",
  doctorController.deleteDoctorEducation
);
doctorRoute.post(
  "/add-doctor-availability",
  doctorController.addDoctorAvailability
);
doctorRoute.put(
  "/update-doctor-availability",
  doctorController.updateDoctorAvailability
);
doctorRoute.post(
  "/delete-doctor-availability",
  doctorController.deleteDoctorAvailability
);
doctorRoute.put(
  "/update-doctor-consultation",
  doctorController.updateDoctorConsultation
);
doctorRoute.post(
  "/delete-doctor-consultation",
  doctorController.deleteDoctorConsultation
);
doctorRoute.post("/save-document", doctorController.saveDocumentMetadata);
doctorRoute.post(
  "/delete-document",
  doctorController.deleteDocumentMetadata
);
doctorRoute.post("/list-document", doctorController.listDocumentMetadata);

doctorRoute.post('/advance-doctor-filter', doctorController.advanceDoctorFilter);
doctorRoute.get('/doctor-management-view-basic-info', doctorController.doctorManagementViewBasicInfo);
doctorRoute.get('/doctor-management-get-locations', doctorController.doctorManagementGetLocations);
doctorRoute.get('/get-related-doctors', doctorController.getRelatedDoctors);
doctorRoute.get('/get-related-doctors-fourPortals', doctorController.getRelatedDoctorsForFourPortals);
doctorRoute.post('/update-appointment-status', doctorController.updateAppointmentPaymentStatus);
doctorRoute.get('/get-eprescription-template-url', doctorController.getEprescriptionTemplateUrl);
doctorRoute.get('/get-Idby-DoctorName', doctorController.getIdbyDoctorName);
doctorRoute.post('/send-Mail-TO-Patient', doctorController.sendMailTOPatient);
doctorRoute.get('/get-eprescription', doctorController.getEprescription);

doctorRoute.post('/add-manuall-tests', doctorController.addManualTest);
doctorRoute.post('/edit-manual-tests', doctorController.editManualTest);


doctorRoute.get('/updateUnreadMessage', doctorController.updateUnreadMessage);
doctorRoute.get('/viewAppointmentCheck', doctorController.viewAppointmentCheck);

//Check Eprescription available or not based on return all medicine
doctorRoute.get('/check-eprescription-availability', doctorController.checkEprescriptionAvailability);
doctorRoute.use(verifyToken);
doctorRoute.get('/view-appointment-by-roomname', doctorController.viewAppointmentByRoomName);

//Hospital OR Individual Doctor routes
doctorRoute.post('/doctor-management-educational-details', verifyRole(['superadmin', 'INDIVIDUAL_DOCTOR_ADMIN', 'INDIVIDUAL_DOCTOR']), doctorController.doctorManagementEducationalDetails);
doctorRoute.post('/doctor-management-doctor-availability', verifyRole(['superadmin', 'INDIVIDUAL_DOCTOR_ADMIN', 'INDIVIDUAL_DOCTOR']), doctorController.doctorManagementDoctorAvailability);
doctorRoute.post('/doctor-management-fee-management', verifyRole(['superadmin', 'INDIVIDUAL_DOCTOR_ADMIN', 'INDIVIDUAL_DOCTOR']), doctorController.doctorManagementFeeManagement);
doctorRoute.post('/doctor-management-document-management', verifyRole(['superadmin', 'INDIVIDUAL_DOCTOR_ADMIN', 'INDIVIDUAL_DOCTOR']), doctorController.doctorManagementDocumentManagement);
doctorRoute.get('/doctor-management-view-doctor-profile', doctorController.doctorManagementViewDoctorProfile);
doctorRoute.put('/doctor-management-update-availability', doctorController.doctorManagementUpdateAvailability); 
doctorRoute.get('/doctor-management-list-doctor', doctorController.doctorManagementListDoctor);
doctorRoute.get('/doctor-management-request-list', doctorController.doctorManagementRequestList);
doctorRoute.post('/doctor-management-accept-or-reject', doctorController.acceptOrRejectDoctorRequest);
doctorRoute.post('/doctor-management-active-lock-delete-doctor', verifyRole(['superadmin', 'INDIVIDUAL_DOCTOR_ADMIN', 'INDIVIDUAL_DOCTOR']), doctorController.doctorManagementActiveLockDeleteDoctor);
doctorRoute.post('/delete-availabilty-by-deleting-location', doctorController.deleteAvailability);
doctorRoute.get('/doctor-four-portal-management-list', doctorController.doctorFourPortalListForHospital);
doctorRoute.post('/doctor-management-basic-info', verifyRole(['superadmin', 'INDIVIDUAL_DOCTOR_ADMIN', 'INDIVIDUAL_DOCTOR']), doctorController.doctorManagementBasicInfo);
doctorRoute.post('/doctor-management-available-dates', doctorController.addAvailableDates); 

//Doctor Routes for Super-admin
doctorRoute.get('/get-doctor-list', verifyRole(['superadmin', 'INDIVIDUAL_DOCTOR_ADMIN']), doctorController.getDoctorList);
doctorRoute.post('/approve-or-reject-doctor', doctorController.approveOrRejectDoctor);
doctorRoute.post('/active-lock-delete-doctor', verifyRole(['superadmin', 'INDIVIDUAL_DOCTOR_ADMIN', 'INDIVIDUAL_DOCTOR']), doctorController.activeLockDeleteDoctor);
doctorRoute.get('/appointments-doctor-patient-details', doctorController.getAppointmentsWithDoctorPatientDetails);
doctorRoute.post("/update-videocall-appointment", doctorController.UpdateVideocallAppointment);
doctorRoute.post("/update-videocall-chatmessage", doctorController.UpdateVideocallchatmessage);
doctorRoute.post('/assign-healthcare-provider', doctorController.assignHealthcareProvider);
doctorRoute.get('/allDoctorsHopitalizationList', doctorController.allDoctorsHopitalizationList);
doctorRoute.get('/all-doctors', doctorController.allDoctors);
doctorRoute.get('/alldoctor_fourportal_users', doctorController.alldoctor_fourportal);

doctorRoute.post('/add-consulatation-data', doctorController.updateAppointmentData);

//Template Builder
doctorRoute.post('/add-template', doctorController.addTemplate);
doctorRoute.get('/template-list', doctorController.templateList);
doctorRoute.get('/template-details', doctorController.templateDetails);
doctorRoute.post('/template-delete', doctorController.templateDelete);

//Eprescription Create
doctorRoute.post('/create-eprescription', doctorController.createEprescription);
doctorRoute.post('/add-eprescription-medicine-dosage', doctorController.addEprescriptionMedicineDosage);
doctorRoute.post('/delete-eprescription-medicine-dosage', doctorController.deleteEprescriptionMedicineDosage);
doctorRoute.post('/add-eprescription-labTest', doctorController.addEprescriptionLabTest);
doctorRoute.get('/get-eprescription-lab-test', doctorController.getEprescriptionLabTest);
doctorRoute.post('/add-eprescription-imagingTest', doctorController.addEprescriptionImagingTest);
doctorRoute.get('/get-eprescription-imaging-test', doctorController.getEprescriptionImagingTest);
doctorRoute.post('/add-eprescription-vaccination', doctorController.addEprescriptionVaccination);
doctorRoute.get('/get-eprescription-vaccination-test', doctorController.getEprescriptionVaccinationTest);
doctorRoute.post('/add-eprescription-other', doctorController.addEprescriptionOther);
doctorRoute.get('/get-eprescription-other-test', doctorController.getEprescriptionOtherTest);
doctorRoute.get('/get-eprescription-medicine-dosage', doctorController.getEprescriptionMedicineDosage);
doctorRoute.get('/get-all-eprescription-tests', doctorController.getAllTests);
doctorRoute.post('/add-eprescription-esignature', uploadImage, doctorController.addEprescriptionEsignature);
doctorRoute.post('/list-all-eprescription', doctorController.listAllEprescription);
doctorRoute.get('/get-doctor-location', doctorController.getDoctorLocationInfo);
doctorRoute.get('/get-all-eprescription-details-for-medicine', doctorController.getAllEprescriptionDetailsForMedicine);
// department_asper_hospital
doctorRoute.post('/department-Asper-Hospital_Doctor', doctorController.getdataAsperHospitalDoctor);
doctorRoute.post('/get-AssignDoctor', doctorController.postAssignDoctor);
doctorRoute.get('/online-consultation-count', doctorController.onlineConsultationCount);
doctorRoute.get('/facetoface-consultation-count', doctorController.facetofaceConsultationCount);
doctorRoute.get('/home-consultation-count', doctorController.homeConsultationCount);
doctorRoute.get('/all-consultation-count', doctorController.allConsultationCount);
doctorRoute.get('/graph-list-status', doctorController.graphListHospital);
doctorRoute.get('/Patient-payment-historyToDoc', doctorController.patientPaymentHistoryToDoctor);
doctorRoute.get('/getAllDoctorData', doctorController.getAllDoctorData);


// HospitalTypes
doctorRoute.post('/add-healthcentre', doctorController.addHealthCentre_SuperAdmin)
doctorRoute.get('/list-healthcentre', doctorController.allHealthCentreList)
doctorRoute.put('/update-healthcentre', doctorController.updateHealthCentre)
doctorRoute.post('/delete-healthcentre', doctorController.actionOnHealthCentre)
doctorRoute.get('/exportsheetlist-healthcentre', doctorController.allHealthCentreListforexport)
doctorRoute.post('/upload-csv-for-healthcentre-list', uploadFileToLocalStorage, doctorController.uploadCSVForHealthCentre)

doctorRoute.get('/common-healthcentrelist', doctorController.commmonHealthCentreList)

doctorRoute.post("/save-superadmin-notification", doctorController.saveSuperadminNotification);

doctorRoute.get('/get-patient-id-from-appointment', doctorController.getPatientIdFromAppointment) //Get patient ID from appointment of specific doctor
doctorRoute.get('/get-doctor-id-from-appointment', doctorController.getDoctorIdFromAppointment) //Get doctor ID from appointment of specific patientgetDoctorPortalData
doctorRoute.get('/get-doctor-portal-data', doctorController.getDoctorPortalData) 


export default doctorRoute;
