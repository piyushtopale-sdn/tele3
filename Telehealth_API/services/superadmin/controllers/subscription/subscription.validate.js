import { validationResultData } from "../../helpers/transmission";
import { check } from "express-validator";

exports.subscriptionPlanListing = [
    check("subscription_plan_for")
        .exists()
        .withMessage("Module missing")
        .not()
        .isEmpty()
        .withMessage("Please provide module name"),

    (req, res, next) => {
        validationResultData(req, res, next);
    }
]