import { validationResult } from "express-validator";
import * as CryptoJS from 'crypto-js';
import { config, generate4DigitOTP, messageID } from "../config/constants";
import Counter from "../models/counter";
import bcrypt from 'bcrypt';
const cryptoSecret = config.CRYPTO_SECRET;
import jwt from "jsonwebtoken";
import xlsx from "xlsx";

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


export const encryptObjectData = (data) => {
    const dataToEncrypt = JSON.stringify(data);
    const encPassword = cryptoSecret;
    const encryptedData = CryptoJS.AES.encrypt(dataToEncrypt.trim(), encPassword.trim()).toString();
    return encryptedData;
}

export const encryptData = (data) => {
    const encPassword = cryptoSecret;
    const encryptedData = CryptoJS.AES.encrypt(data.trim(), encPassword.trim()).toString();
    return encryptedData;
}


export const decryptObjectData = (response) => {
    if (!response.data) return false;
    const decPassword = cryptoSecret;
    const decryptedOutput = CryptoJS.AES.decrypt(response.data.trim(), decPassword.trim()).toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedOutput);
}

export const decryptionData = (data) => {
    if (data) {
        const decPassword = cryptoSecret;
        const conversionDecryptOutput = CryptoJS.AES.decrypt(data.trim(), decPassword.trim()).toString(CryptoJS.enc.Utf8);
        return conversionDecryptOutput;
    }
}

export const decryptMiddleware = async (req, res, next) => {
    let dc = await decryptObjectData(req.body)
    req.body = dc
    next()
}

export const handleRejectionError = async (res, error, code) => {
    res.status(code).json({
        errors: {
            message: error.message
        }
    });
}

/**
 * Item not found
 * @param {Object} err - error object
 * @param {Object} item - item result object
 * @param {Object} reject - reject object
 * @param {string} message - message
 */
export const itemNotFound = (err, item, reject, message) => {
    if (err) {
        reject(exports.buildErrObject(422, err.message));
    }
    if (!item) {
        reject(exports.buildErrObject(404, message));
    }
};

/**
 * Handles error by printing to console in development env and builds and sends an error response
 * @param {Object} res - response object
 * @param {Object} err - error object
 */
exports.handleError = (res, err) => {
    // Sends error to user
    res.status(err.code).json({
        errors: {
            msg: err.message
        }
    });
};

/**
 * Builds error object
 * @param {number} code - error code
 * @param {string} message - error text
 */
export const buildErrObject = (code, message) => {
    return {
        code,
        message
    };
};

/**
 * Builds error for validation files
 * @param {Object} req - request object
 * @param {Object} res - response object
 * @param {Object} next - next object
 */
exports.validationResult = (req, res, next) => {
    try {
        validationResult(req).throw();
        if (req.body.email) {
            req.body.email = req.body.email.toLowerCase();
        }
        return next();
    } catch (err) {
        return exports.handleError(res, exports.buildErrObject(422, err.array()));
    }
};

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
        config.SECRET.JWT
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
        config.SECRET.JWT
    );
};

export const checkPassword = async (password, user) => {
    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch
}

export const generateRandomString = (length = 12) => {
    const chars =
        "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz1234567890";
    const randomArray = Array.from(
        { length },
        () => chars[Math.floor(Math.random() * chars.length)]
    );
    const randomString = randomArray.join("");
    return randomString;
}

export async function getNextSequenceValue(sequenceName) {
    const sequenceDocument = await Counter.findOneAndUpdate({ _id: sequenceName }, { $inc: { sequence_value: 1 } }, { new: true }).exec();
    return sequenceDocument.sequence_value;
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
function generateSequenceCounter() {
    return new Promise(async (resolve) => {
      try {
        const getCounter = await Counter.findOne({_id: 'orderid'})
        let sequenceDocument
        const currentDate = new Date()
        if (getCounter) {
          const existingDate = new Date(getCounter.date)
          if (existingDate.getDate() < currentDate.getDate()) {
            sequenceDocument = await Counter.findOneAndUpdate({_id: 'orderid'},{$set: {sequence_value: 1, date: currentDate.toISOString()}}, { new: true })
          } else {
            sequenceDocument = await Counter.findOneAndUpdate({ _id: 'orderid' }, { $inc: { sequence_value: 1 } }, { new: true }).exec();
          }
        } else {
          sequenceDocument = await Counter.findOneAndUpdate({_id: 'orderid'},{$set: {sequence_value: 1, date: currentDate.toISOString()}}, { new: true, upsert: true }).exec()
        }
        resolve(sequenceDocument.sequence_value)
      } catch (error) {
        console.error("An error occurred:", error);
        const randomNumber = generate4DigitOTP();
        resolve(randomNumber)
      }
    })
}
export const generateSequenceNumber = async () => {
    // Get current date in YYYYMMDD format
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-based
    const day = now.getDate().toString().padStart(2, '0');
  
    const datePart = `${year}${month}${day}`; // Combine to YYYYMMDD
    const sequenceCounter = await generateSequenceCounter()
    const sequencePart = sequenceCounter.toString().padStart(4, '0'); // Pad sequence to 4 digits
  
    return `${datePart}${sequencePart}`;
}