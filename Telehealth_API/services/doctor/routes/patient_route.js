import express from "express";
const patient = require("../controllers/patient_controller");
const PatientRoute = express.Router();

PatientRoute.get('/view-hospital-details-for-patient', patient.viewHospitalAdminDetailsForPatient);
PatientRoute.get('/hospitalDetailsById', patient.hospitalDetailsById);


PatientRoute.get('/view-hospital-doctor-for-patient', patient.viewHospitalDoctorsForPatient);
PatientRoute.get('/view-doctor-details-for-patient', patient.viewDoctorDetailsForPatient);
PatientRoute.post('/post-review-and-rating', patient.postReviewAndRating);
PatientRoute.get('/get-review-and-rating', patient.getReviewAndRating);
PatientRoute.get('/get-review-and-rating-for-superadmin', patient.getReviewAndRatingForSupeAdmin);
PatientRoute.get('/get-review-and-rating-for-admin', patient.getReviewAndRatingForAdmin);
PatientRoute.post('/update-Status-review-and-rating', patient.updateStatusReviewAndRating);

PatientRoute.post('/delete-review-and-rating-hospital', patient.deleteReviewAndRating);
//get rating & review of hospital/doctor for patient
PatientRoute.get('/get-rating-review-by-patient', patient.getRatingReviewByPatient);

PatientRoute.get('/list-appointment-upcoming', patient.listAppointmentUpcomingCount);
PatientRoute.get('/getappointmentdetailDoctorName', patient.getappointmentdetailDoctorName)
PatientRoute.get('/getAllPatientAddedByHospitalDoctor', patient.getAllPatientAddedByHospitalDoctor)



export default PatientRoute;