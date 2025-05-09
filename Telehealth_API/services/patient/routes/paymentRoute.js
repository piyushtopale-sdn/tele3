"use strict";

import express from "express";
import Payment from "../controllers/payment/paymentController";
import AmazonPaymentController from "../controllers/payment/amazonPayment";
import validate from "../controllers/payment/payment.validate";
import { verifyRole, verifyToken } from "../helpers/verifyToken";
const paymentRoute = express.Router();
//This api created for the test
/** Under Process */
paymentRoute.post("/validate-merchant", AmazonPaymentController.validateMerchant);
paymentRoute.post("/process-payment", AmazonPaymentController.processPayment);

paymentRoute.use(verifyToken);
paymentRoute.get("/get-payment-history", verifyRole(["superadmin", "patient"]), validate.getPaymentHistory, Payment.getPaymentHistory);
paymentRoute.post("/save-payment-history", verifyRole(["patient"]), Payment.savePaymentHistory);
paymentRoute.post("/save-addon-history", verifyRole(["patient"]), Payment.maintainAddonHistory);
paymentRoute.delete("/cancel-subscription/:id", verifyRole(["superadmin", "patient"]), Payment.cancelSubscription);
paymentRoute.put("/upgrade-subscription-plan", verifyRole(["superadmin", "patient"]), Payment.upgradeSubscriptionPlan);
paymentRoute.post("/save-payment_history-labradio", verifyRole(["superadmin", "patient"]), Payment.savePaymentHistryForLabRadioTests);
paymentRoute.get("/get-all-payment-history", verifyRole(["superadmin", "patient"]), Payment.getAllPaymentHistory);
paymentRoute.get("/get-payment-details-by-id", verifyRole(["superadmin", "patient"]), Payment.getPaymentDetailsById);
paymentRoute.put("/update-purchase-history", verifyRole(["superadmin"]), Payment.updatePurchaseHistory);





export default paymentRoute;