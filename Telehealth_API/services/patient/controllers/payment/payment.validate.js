import { validationResultData } from "../../helpers/transmission";
import { check } from "express-validator";

exports.viewSubscriptionPurchasedPlans = [
    check("subscription_plan_id")
        .exists()
        .withMessage("Subscription payment ID missing")
        .not()
        .isEmpty()
        .withMessage("Please provide subscription payment ID"),

    (req, res, next) => {
        validationResultData(req, res, next);
    }
]
exports.getPaymentHistory = [
    check("limit")
        .exists()
        .withMessage("Limit is missing")
        .not()
        .isEmpty()
        .withMessage("Please provide limit"),
    check("page")
        .exists()
        .withMessage("Page number is missing")
        .not()
        .isEmpty()
        .withMessage("Please provide page number"),
    check("for_user")
        .exists()
        .withMessage("User ID is missing")
        .not()
        .isEmpty()
        .withMessage("Please provide user ID"),

    (req, res, next) => {
        validationResultData(req, res, next);
    }
]
exports.purchaseSubscriptionPlan = [
    check("paymentId")
        .exists()
        .withMessage("payment ID missing")
        .not()
        .isEmpty()
        .withMessage("Please provide payment ID"),
    check("portalUserId")
        .exists()
        .withMessage("portal user ID missing")
        .not()
        .isEmpty()
        .withMessage("Please provide portal user ID"),
    check("subscriptionPlanId")
        .exists()
        .withMessage("subscription ID missing")
        .not()
        .isEmpty()
        .withMessage("Please provide subscription ID"),

    (req, res, next) => {
        validationResultData(req, res, next);
    }
]