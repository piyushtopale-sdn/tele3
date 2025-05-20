import express from "express";
import AppointmentController from "../controllers/appointment.controller";
import { verifyRole, verifyToken } from "../helpers/verifyToken";
const appointmentRoutes = express.Router();
appointmentRoutes.get('/get-alborge-results-from-prescribed-Id', AppointmentController.appointmentDetailsByPrescribedId);
appointmentRoutes.put('/update-appointment-status-for-external-results', AppointmentController.updateAppointmentStatusForExternalResults);
appointmentRoutes.use(verifyToken);

appointmentRoutes.get("/get-labradio-slot", verifyRole(['patient']), AppointmentController.labRadiologySlot);
appointmentRoutes.post("/book-appointment", verifyRole(["patient"]), AppointmentController.bookAppointment);
appointmentRoutes.get("/get-most-Performed-tests", AppointmentController.mostFrequentlyPerformedTest);
appointmentRoutes.get("/total-test-Performed-each-center", AppointmentController.totalEachTestPerformedPerCenter);
appointmentRoutes.get("/get-most-used-center", AppointmentController.mostUsedCenter);
appointmentRoutes.post("/reschedule-appointment", verifyRole(["patient"]), AppointmentController.rescheduleAppointment);
appointmentRoutes.get('/list-appointment', verifyRole(["patient", "INDIVIDUAL", "INDIVIDUAL_DOCTOR", "ADMIN", "INDIVIDUAL_DOCTOR_ADMIN",'SUPER_USER']), AppointmentController.listAppointment);
appointmentRoutes.get('/lab-radio-test-record-count', verifyRole(["patient", "INDIVIDUAL", "INDIVIDUAL_DOCTOR", "ADMIN", "INDIVIDUAL_DOCTOR_ADMIN",'SUPER_USER']), AppointmentController.labRadioTestRecordsCount);
appointmentRoutes.get('/list-appointment-for-emr', verifyRole(["INDIVIDUAL_DOCTOR", "INDIVIDUAL_DOCTOR_ADMIN",'SUPER_USER']), AppointmentController.listAppointmentForEMR);
appointmentRoutes.get('/all-appointment-for-timeline', verifyRole(["patient"]), AppointmentController.allAppointmentForTimeline);
appointmentRoutes.get('/view-appointment', verifyRole(["patient", "INDIVIDUAL", "ADMIN", 'SUPER_USER']), AppointmentController.viewAppointment);
appointmentRoutes.post('/cancel-and-approve-appointment', verifyRole(["INDIVIDUAL", "patient"]), AppointmentController.cancelAndApproveAppointment);
appointmentRoutes.post('/add-test-results', verifyRole(["INDIVIDUAL"]), AppointmentController.addTestResults);
appointmentRoutes.get('/get-test-results', verifyRole(["INDIVIDUAL", "INDIVIDUAL_DOCTOR", "INDIVIDUAL_DOCTOR_ADMIN",'SUPER_USER', "ADMIN", 'SUPER_USER']), AppointmentController.getTestResults);
appointmentRoutes.get('/get-test-results/:id', verifyRole(["INDIVIDUAL", "INDIVIDUAL_DOCTOR", "patient", "ADMIN", 'SUPER_USER']), AppointmentController.getTestResultsById);
appointmentRoutes.put('/update-appointment-status', verifyRole(["INDIVIDUAL"]), AppointmentController.updateAppointmentStatus);
appointmentRoutes.get('/get-test-record', verifyRole(["INDIVIDUAL", "ADMIN", 'SUPER_USER']), AppointmentController.getTestRecord);
appointmentRoutes.get('/get-appointment-report', verifyRole(["patient"]), AppointmentController.getAppointmentReport);
appointmentRoutes.get('/get-delayed-appointment', verifyRole(["INDIVIDUAL"]), AppointmentController.getDelayedAppointment);
appointmentRoutes.get('/get-test-history/:id', verifyRole(["INDIVIDUAL", "INDIVIDUAL_DOCTOR", "patient","ADMIN", "INDIVIDUAL_DOCTOR_ADMIN",'SUPER_USER']), AppointmentController.getTestHistory);
appointmentRoutes.get('/export-list-appointment', verifyRole([ "INDIVIDUAL", 'ADMIN', 'SUPER_USER']), AppointmentController.exportlistAppointment);
appointmentRoutes.get('/get-test-procedure-history', verifyRole([ "INDIVIDUAL_DOCTOR", "INDIVIDUAL_DOCTOR_ADMIN",'SUPER_USER']), AppointmentController.getTestProcedureHistory);

/**Fetch order test results from alborge lab - Jan 31 */
appointmentRoutes.post('/get-order-result-alborge', verifyRole([ "INDIVIDUAL", "INDIVIDUAL_DOCTOR", "INDIVIDUAL_DOCTOR_ADMIN",'SUPER_USER', "patient"]), AppointmentController.getOrderResultPdf);
appointmentRoutes.get('/get-total-labradio-order-list-records-export', verifyRole(['INDIVIDUAL_DOCTOR_ADMIN','SUPER_USER']), AppointmentController.getDashboardLabRadiologyReportExport);

export default appointmentRoutes;