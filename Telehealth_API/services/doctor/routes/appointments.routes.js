import express from "express";
import AppointmentController from "../controllers/appointment.controllers";
import { verifyRole, verifyToken } from "../helpers/verifyToken";
const appointmentRoutes = express.Router();
// This api is used for testing purpose.
appointmentRoutes.put('/update-appointment', AppointmentController.updateAppointment);
appointmentRoutes.use(verifyToken);

appointmentRoutes.post("/book-appointment", verifyRole(["patient"]), AppointmentController.bookAppointment);
appointmentRoutes.post("/reschedule-appointment", verifyRole(["patient"]), AppointmentController.rescheduleAppointment);
appointmentRoutes.get('/list-appointment', AppointmentController.listAppointment);
appointmentRoutes.post('/cancel-and-approve-appointment', AppointmentController.cancelAndApproveAppointment);
appointmentRoutes.post('/confirm-and-decline-appointment', AppointmentController.patientConfirmationForAppointment);
appointmentRoutes.get("/doctor-available-slot", AppointmentController.doctorAvailableSlot);
appointmentRoutes.get("/appointment-timeline", AppointmentController.getAppointmentTimeline); // This API will return all the appointment booked with laboratory, doctor and pharmacy
appointmentRoutes.get('/view-appointment', AppointmentController.viewAppointment);
appointmentRoutes.get('/get-all-appointment-by-ids', AppointmentController.getAllAppointmentByIds);
appointmentRoutes.get('/get-doctor-completed-appointents/:id', verifyRole(['patient']), AppointmentController.getDoctorsCompletedAppointment);
appointmentRoutes.get('/patient-can-chat', verifyRole(['patient', 'INDIVIDUAL_DOCTOR']), AppointmentController.patientCanChat);
appointmentRoutes.post('/appointment-status-maskAs-complete', verifyRole([ "INDIVIDUAL_DOCTOR" ]), AppointmentController.appointmentStatusMaskAsComplete);
appointmentRoutes.post("/all-appointments", AppointmentController.viewAllAppointments);

export default appointmentRoutes;