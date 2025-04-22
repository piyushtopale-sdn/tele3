"use strict";

import express from "express";
import Subscription from "../controllers/subscription/subscriptionController";
import DiscountManagement from "../controllers/discount/discount";
import DiscountValidator from "../controllers/discount/discount.validate";
import validate from "../controllers/subscription/subscription.validate";
import { verifyToken, authorizeRole } from "../helpers/verifyToken";
const subscriptionRoute = express.Router();

subscriptionRoute.use(verifyToken);

subscriptionRoute.get("/subscription-plan-listing", validate.subscriptionPlanListing, Subscription.subscriptionPlanListing);
subscriptionRoute.get("/all-subscription-plans-config", Subscription.allSubscriptionPlansConfig);

//Manage discount for subscription
subscriptionRoute.post("/create-discount", authorizeRole(['superadmin']), DiscountValidator.createDiscountCoupon, DiscountManagement.createDiscountCoupon);
subscriptionRoute.get("/validate-discount-coupon", DiscountValidator.validateDiscountCoupon, DiscountManagement.validateDiscountCoupon);
subscriptionRoute.get("/generate-coupon", DiscountManagement.generateCoupon);
subscriptionRoute.get("/list-coupon", DiscountValidator.validateListDiscountCoupon, DiscountManagement.getAllCoupons);
subscriptionRoute.get("/list-coupon-lab", DiscountValidator.validateListDiscountCoupon, DiscountManagement.getAllCouponsLab);
subscriptionRoute.get("/get-coupon-by-subscription/:id", DiscountManagement.getCouponBySubscription);
subscriptionRoute.delete("/delete-discount/:id", DiscountManagement.deleteDiscountCoupon);
subscriptionRoute.get("/validate-labradio-coupon", DiscountManagement.validateDiscountCouponLabRadio);
subscriptionRoute.get("/get-coupon-details-by-ids", DiscountManagement.getCouponDetailsByIds);




export default subscriptionRoute;