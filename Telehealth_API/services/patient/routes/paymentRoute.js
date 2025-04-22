"use strict";

import express from "express";
import Payment from "../controllers/payment/paymentController";
import AmazonPaymentController from "../controllers/payment/amazonPayment";
import validate from "../controllers/payment/payment.validate";
import { verifyRole, verifyToken } from "../helpers/verifyToken";
const paymentRoute = express.Router();
paymentRoute.post("/fetch-signature-details", AmazonPaymentController.fetchSignatureDetails);
paymentRoute.use(verifyToken);
paymentRoute.get("/get-payment-history", validate.getPaymentHistory, Payment.getPaymentHistory);
paymentRoute.post("/save-payment-history",verifyRole(["patient"]), Payment.savePaymentHistory);
paymentRoute.post("/save-addon-history",verifyRole(["patient"]), Payment.maintainAddonHistory);
paymentRoute.delete("/cancel-subscription/:id",verifyRole(["superadmin", "patient"]), Payment.cancelSubscription);
paymentRoute.put("/upgrade-subscription-plan",verifyRole(["superadmin", "patient"]), Payment.upgradeSubscriptionPlan);
paymentRoute.post("/save-payment_history-labradio", verifyRole(["superadmin", "patient"]), Payment.savePaymentHistryForLabRadioTests);
paymentRoute.get("/get-all-payment-history", Payment.getAllPaymentHistory);
paymentRoute.get("/get-payment-details-by-id", Payment.getPaymentDetailsById);
paymentRoute.put("/update-purchase-history", verifyRole(["superadmin"]), Payment.updatePurchaseHistory);


/** Amazon Pay - Under Process*/
paymentRoute.post("/initiate-payment-amazon", AmazonPaymentController.initiatePayment);
paymentRoute.post("/verify-payment-amazon", AmazonPaymentController.verifyPayment);
paymentRoute.post("/get-sdk-token", AmazonPaymentController.getSDKToken);

/** Mar 10 Start */
paymentRoute.post("/payment-initiate-applepay", AmazonPaymentController.initiateApplePay);
/** Mar 10 End */

export default paymentRoute;