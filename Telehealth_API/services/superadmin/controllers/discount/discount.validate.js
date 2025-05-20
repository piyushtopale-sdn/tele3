import { validationResultData } from "../../helpers/transmission";
import { check } from "express-validator";


exports.createDiscountCoupon = [
    check("couponCode")
        .not()
        .isEmpty()
        .withMessage("Please provide coupon code"),
    check("type")
        .not()
        .isEmpty()
        .withMessage("Please provide type (fixed/percentage)"),

    (req, res, next) => {
        validationResultData(req, res, next);
    }
]
exports.validateDiscountCoupon = [
    check("couponCode")
        .not()
        .isEmpty()
        .withMessage("Please provide coupon code"),
    check("patientId")
        .not()
        .isEmpty()
        .withMessage("Please provide Patient ID"),
    check("subscriptionPlanId")
        .not()
        .isEmpty()
        .withMessage("Please provide subscription plan ID"),
    check("duration")
        .not()
        .isEmpty()
        .withMessage("Please provide plan duration"),

    (req, res, next) => {
        validationResultData(req, res, next);
    }
]
exports.validateListDiscountCoupon = [
    check("limit")
        .not()
        .isEmpty()
        .withMessage("Please provide limit"),
    check("page")
        .not()
        .isEmpty()
        .withMessage("Please provide page number"),

    (req, res, next) => {
        validationResultData(req, res, next);
    }
]