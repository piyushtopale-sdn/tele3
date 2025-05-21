import express from "express";
import { verifyToken } from "../helpers/verifyToken";
import patient from "../controllers/patient_controller.js";
const PatientRoute = express.Router();


PatientRoute.use(verifyToken);
PatientRoute.get('/view-doctor-details-for-patient', patient.viewDoctorDetailsForPatient);
PatientRoute.post('/post-review-and-rating', patient.postReviewAndRating);
PatientRoute.get('/get-review-and-rating-for-superadmin', patient.getReviewAndRatingForSupeAdmin);
PatientRoute.get('/get-review-and-rating-for-admin', patient.getReviewAndRatingForAdmin);
PatientRoute.post('/update-Status-review-and-rating', patient.updateStatusReviewAndRating);
PatientRoute.get('/get-rating-review-by-patient', patient.getRatingReviewByPatient);
PatientRoute.get('/list-appointment-upcoming', patient.listAppointmentUpcomingCount);
PatientRoute.get('/getappointmentdetailDoctorName', patient.getappointmentdetailDoctorName)
PatientRoute.get('/getAllPatientAddedByHospitalDoctor', patient.getAllPatientAddedByHospitalDoctor);
PatientRoute.get('/get-review-and-rating', patient.getReviewAndRating);



export default PatientRoute;