import { validationResult } from "express-validator";
import { config } from "../config/constants";
import { encryptObjectData } from "../middleware/utils";

const sendResponse = (req, res, statusCode, result) => {
    if (
        // req.useragent.browser === "PostmanRuntime" && config.NODE_ENV === "local"
        config.NODE_ENV === "local"
    ) {
        return res.status(statusCode).send(result)
    }
    return res.status(statusCode).json(encryptObjectData(result));
};

const dataValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorBody = {
            errors: errors.array(),
        };
        return sendResponse(req, res, 400, {
            status: false,
            body: errorBody,
            message: "Invalid details entered",
            errorCode: "INVALID_REQUEST",
        });
    }
    next();
};

const handleResponse = async (req, res, code, result) => {
    if (config.NODE_ENV === "local") {
        return res.status(code).json(result);
    }
    return res.status(code).send(result, true);
}

const validationResultData = (req, res, next) => {
    try {
        validationResult(req).throw();
        if (req.body.email) {
            req.body.email = req.body.email.toLowerCase();
        }
        return next();
    } catch (err) {
        return sendResponse(req, res, 500, {
            status: false,
            body: err.array(),
            message: "failed with validation",
            errorCode: "INTERNAL_SERVER_ERROR",
        })
    }
};

module.exports = {
    sendResponse,
    dataValidation,
    validationResultData,
    handleResponse
};
