import { encryptObjectData } from "./crypto";
import { validationResult } from "express-validator";
import { config } from "../config/constants";

const sendResponse = (req, res, statusCode, result) => {
  if (
    // req.useragent.browser === "PostmanRuntime" &&
    config.NODE_ENV === "local"
  ) {
    return res.status(statusCode).json(result);
  }
  return res.status(statusCode).json(encryptObjectData(result));
};

function ensureMultifactor(req, res, next) {
  if (!req.user.mfa || !req.user.mfa.enrolled) {
    next()
    return
  }
  req.session.mfaLock = true
  res.redirect(`/account/login/multifactor`)
}

function createSession(req, user) {
  req.session.regenerate(function () {
      req.session.loggedIn = true;
      req.session.user = user._id;
      req.session.username = user.email;
      req.session.msg = 'Authenticated as: ' + user.email;
      req.session.ph_verified = false;
  });
}

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
  if ( config.NODE_ENV === "local" ) {
      return res.status(code).json(result);
  }
  return res.status(code).json(encryptObjectData(result));
}

const validationResultData = (req, res, next) => {
  try {
    validationResult(req).throw();
    if (req.body.email) {
      req.body.email = req.body.email.toLowerCase();
    }
    return next();
  } catch (err) {
      return handleResponse(req, res, 500, {
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
  handleResponse,
  validationResultData,
  ensureMultifactor,
  createSession
};
