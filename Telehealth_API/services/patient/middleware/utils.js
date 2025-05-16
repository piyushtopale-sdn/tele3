import { validationResult } from "express-validator";
import * as CryptoJS from 'crypto-js';
import { config, testEmailDomains, messageID } from "../config/constants"
const { CRYPTO_SECRET } = config;
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { randomInt } from 'crypto';
const xlsx = require('xlsx');

export const validationResponse = (req, res, next) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.json(encryptObjectData({
            status: "failed",
            messageID: messageID.badRequest,
            message: error.array()
        }));
    } else {
        next();
    }
}

export const processExcel= (filepath) => {
    
    const workbook = xlsx.readFile(filepath);  
 
    let workbook_sheet = workbook.SheetNames; 
         
    let workbook_response = xlsx.utils.sheet_to_json(         
      workbook.Sheets[workbook_sheet[0]], {
                header: 0,
                defval: "",
                raw: false
        });

    return workbook_response
}
export const encryptObjectData = (data) => {
    const dataToEncrypt = JSON.stringify(data);
    const encPassword = CRYPTO_SECRET;
    const encryptedData = CryptoJS.AES.encrypt(dataToEncrypt.trim(), encPassword.trim()).toString();
    return encryptedData;
}

export const encryptData = (data) => {
    const encPassword = CRYPTO_SECRET;
    const encryptedData = CryptoJS.AES.encrypt(data.trim(), encPassword.trim()).toString();
    return encryptedData;
}


export const decryptObjectData = (response) => {
    if (!response.data) return false;
    const decPassword = CRYPTO_SECRET;
    const decryptedOutput = CryptoJS.AES.decrypt(response.data.trim(), decPassword.trim()).toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedOutput);
}

export const decryptionData = (data) => {
    if (data) {
        const decPassword = CRYPTO_SECRET;
        const conversionDecryptOutput = CryptoJS.AES.decrypt(data.trim(), decPassword.trim()).toString(CryptoJS.enc.Utf8);
        return conversionDecryptOutput;
    }
}

export const decryptMiddleware = async (req, res, next) => {
    let dc = await decryptObjectData(req.body)
    req.body = dc
    next()
}

export const handleRejectionError = async (req, res, error, code) => {
    res.status(code).json({
        errors: {
            message: error.message
        }
    });
}
export const handleResponse = async (req, res, code, result) => {
    if (config.NODE_ENV === "local") {
        return res.status(code).json(result);
    }
    return res.status(code).json(encryptObjectData(result));
}

exports.validationResult = (req, res, next) => {
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

export const checkPassword = async (password, user) => {
    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch
}

export const generateToken = payload => {
    // Gets expiration time
    const expiration =
        Math.floor(Date.now() / 1000) + 60 * config.JWT_EXPIRATION_IN_MINUTES;

    // returns signed token
    return jwt.sign(
        {
            data: payload,
            // exp: expiration
        },
        config.secret.JWT
    );
}

export const generateRefreshToken = payload => {
    // Gets expiration time
    const expiration =
        Math.floor(Date.now() / 1000) + 60 * config.JWT_EXPIRATION_IN_MINUTES + 120;

    // returns signed token
    return jwt.sign(
        {
            data: payload,
            exp: expiration
        },
        config.secret.JWT
    );
};

export const smsTemplateOTP = (otp2fa) => {
    return `Your verification OTP is: ${otp2fa}. Please don't share with anyone else.
  Website link- `
}

export const generate4DigitOTP = () => {
    return randomInt(1000, 10000);
}

export const generateTenSaltHash = async (data) => {
    const salt = await bcrypt.genSalt(10);
    const hashedData = await bcrypt.hash(data.toString(), salt);
    return hashedData
}

export const bcryptCompare = async (normalData, bcryptedData) => {
    const isMatch = await bcrypt.compare(normalData, bcryptedData);
    return isMatch
}

export const generateRandomString = (length = 12) => {
    const chars =
        "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz1234567890";
    const randomArray = Array.from(
        { length },
        (v, k) => chars[Math.floor(Math.random() * chars.length)]
    );
    const randomString = randomArray.join("");
    return randomString;
}
export const validateEmail = (email) => {
    return !testEmailDomains.includes(email.split("@")[1]);
}