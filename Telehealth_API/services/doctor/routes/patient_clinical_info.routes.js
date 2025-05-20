import express from "express";
import PatientClinicalInfoController from "../controllers/patient_clinical_info.controllers";

import { verifyRole, verifyToken } from "../helpers/verifyToken";
const patientClinicalInfoRoute = express.Router();

patientClinicalInfoRoute.put("/update-prescribed-test-array", PatientClinicalInfoController.updatePrescribedArrayForExternalLabs);
patientClinicalInfoRoute.use(verifyToken);

patientClinicalInfoRoute.post("/create-epresciption", verifyRole(["INDIVIDUAL_DOCTOR"]), PatientClinicalInfoController.createEprescription);
patientClinicalInfoRoute.get("/get-epresciption", verifyRole(["INDIVIDUAL_DOCTOR", "patient", "INDIVIDUAL_DOCTOR_ADMIN",'SUPER_USER']), PatientClinicalInfoController.getEprescription);
patientClinicalInfoRoute.put("/update-epresciption-status", verifyRole(["INDIVIDUAL", "patient"]), PatientClinicalInfoController.updateEprescriptionStatus);
patientClinicalInfoRoute.get("/get-epresciption-by-id/:id", verifyRole(["INDIVIDUAL_DOCTOR", "patient"]), PatientClinicalInfoController.getEprescriptionByID);
patientClinicalInfoRoute.get("/get-all-medicine-dosage-by-ids", verifyRole(["patient", "pharmacy", "INDIVIDUAL_DOCTOR"]), PatientClinicalInfoController.getAllMedicineDosagesByIDs);

patientClinicalInfoRoute.post("/add-diagnosis", verifyRole(["INDIVIDUAL_DOCTOR"]), PatientClinicalInfoController.addDiagnosis);
patientClinicalInfoRoute.get("/get-diagnosis", verifyRole(["INDIVIDUAL_DOCTOR", 'patient', 'INDIVIDUAL_DOCTOR_ADMIN','SUPER_USER']), PatientClinicalInfoController.getDiagnosis);
patientClinicalInfoRoute.put("/edit-diagnosis", verifyRole(["INDIVIDUAL_DOCTOR"]), PatientClinicalInfoController.editDiagnosis);

patientClinicalInfoRoute.post("/prescribe-labtest", verifyRole(["INDIVIDUAL_DOCTOR"]), PatientClinicalInfoController.prescribeLabTest);
patientClinicalInfoRoute.get("/get-prescribe-labtest", verifyRole(["INDIVIDUAL_DOCTOR", "patient", "INDIVIDUAL_DOCTOR_ADMIN",'SUPER_USER']), PatientClinicalInfoController.getPrescribeLabTest);
patientClinicalInfoRoute.get("/get-prescribe-labtest-count", verifyRole(["INDIVIDUAL_DOCTOR", "patient", "INDIVIDUAL_DOCTOR_ADMIN",'SUPER_USER']), PatientClinicalInfoController.getPrescribeLabTestCount);
patientClinicalInfoRoute.post("/add-tests-payment-info", verifyRole(["INDIVIDUAL_DOCTOR", "patient", "INDIVIDUAL_DOCTOR_ADMIN",'SUPER_USER']), PatientClinicalInfoController.updatePaymentInfoIntoLabRadioTests);
patientClinicalInfoRoute.get("/get-test-payment-info", PatientClinicalInfoController.getTestsDetailsFromCenter);
patientClinicalInfoRoute.get("/get-revenue-per-test", PatientClinicalInfoController.totalRevenuePerTest);
patientClinicalInfoRoute.get("/most-performed-test-per-doctor",PatientClinicalInfoController.mostPerformedTestPerDoctor);
patientClinicalInfoRoute.get("/total-test-Performed-each-doctor",PatientClinicalInfoController.totalEachTestPerformedPerDoctor);
patientClinicalInfoRoute.get("/list-discountcode-usedfor-each-test",PatientClinicalInfoController.listofDiscountCodeUsedforEachTest);


patientClinicalInfoRoute.post("/prescribe-radiology-test", verifyRole(["INDIVIDUAL_DOCTOR"]), PatientClinicalInfoController.prescribeRadiologyTest);
patientClinicalInfoRoute.get("/get-prescribe-radiology-test", verifyRole(["INDIVIDUAL_DOCTOR", "patient", "INDIVIDUAL_DOCTOR_ADMIN",'SUPER_USER']), PatientClinicalInfoController.getPrescribeRadiologyTest);
patientClinicalInfoRoute.get("/get-prescribe-radiology-test-count", verifyRole(["INDIVIDUAL_DOCTOR", "patient", "INDIVIDUAL_DOCTOR_ADMIN",'SUPER_USER']), PatientClinicalInfoController.getPrescribeRadiologyTestCount);

patientClinicalInfoRoute.put("/update-prescribed-lab-radiology-status", verifyRole(["INDIVIDUAL", "patient"]), PatientClinicalInfoController.updatePrescribedLabRadiologyStatus);
patientClinicalInfoRoute.put("/update-prescribed-test-status", verifyRole(["INDIVIDUAL", "patient", "superadmin"]), PatientClinicalInfoController._updatePrescribedLabRadiology_Status);
patientClinicalInfoRoute.get("/get-prescribed-test-history/:id", verifyRole(["INDIVIDUAL_DOCTOR"]), PatientClinicalInfoController.getPrescribedTestHistory);
patientClinicalInfoRoute.put("/lab-radio-update-prescribed-test-status-by-testIds", verifyRole(["INDIVIDUAL", "patient", "superadmin"]), PatientClinicalInfoController.prescribedLabRadio_update_statusHistory_forEachTest);



patientClinicalInfoRoute.get("/get-un-booked-prescribe-radiology-test", verifyRole(["INDIVIDUAL_DOCTOR", "patient", "INDIVIDUAL_DOCTOR_ADMIN",'SUPER_USER']), PatientClinicalInfoController.getUnBookedPrescribeRadiologyTest);
patientClinicalInfoRoute.get("/get-un-booked-prescribe-lab-test", verifyRole(["INDIVIDUAL_DOCTOR", "patient", "INDIVIDUAL_DOCTOR_ADMIN",'SUPER_USER']), PatientClinicalInfoController.getUnBookedPrescribeLabTest);

patientClinicalInfoRoute.get("/get_prescribed_labradio_test/:id", verifyRole(["superadmin"]), PatientClinicalInfoController.getPrescribeLabRadioTest);

export default patientClinicalInfoRoute;