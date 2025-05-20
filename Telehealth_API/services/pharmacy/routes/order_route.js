import express from "express";
import { verifyRole, verifyToken } from "../helpers/verifyToken";
const order = require("../controllers/order_controller");
const orderRoute = express.Router();

orderRoute.use(verifyToken);

orderRoute.post("/new-order", verifyRole(["patient"]), order.newOrder);
orderRoute.post("/list-order", verifyRole(["patient", "pharmacy", "INDIVIDUAL_DOCTOR", "INDIVIDUAL_DOCTOR_ADMIN",'SUPER_USER']), order.listOrder);
orderRoute.get("/get-order-by-id/:id", verifyRole(["patient", "pharmacy"]), order.getOrderById);
orderRoute.put('/cancel-and-approve-order', verifyRole(["patient", "pharmacy"]), order.cancelAndApproveOrder);
orderRoute.put('/update-delivery-status', verifyRole(["pharmacy"]), order.updateDeliveryStatus);
orderRoute.get("/order-count", order.totalOrderCount);
orderRoute.post("/order-details", order.fetchOrderDetails);
orderRoute.put("/order-details", order.updateOrderDetails);
orderRoute.post("/update-schedule-order", order.updateConfirmScheduleorder);

orderRoute.get("/totalorder", order.totalOrderDashboardCount);
orderRoute.get("/totalorder", order.totalOrderDashboardCount);
orderRoute.get("/total-copayment-for-revenue", order.getTotalCoPayment);
orderRoute.get("/dashboardLineGraph-montlyCount", order.dashboardLineGraph);

orderRoute.get("/order-payment-history", order.getOrderPaymentHistory);
orderRoute.get("/get-orded-medicine-of-appointment", order.getOrderMedicineOfAppointment);


export default orderRoute;
