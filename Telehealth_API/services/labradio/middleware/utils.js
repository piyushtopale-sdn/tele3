import { validationResult } from "express-validator";
import * as CryptoJS from 'crypto-js';
import { config, generate4DigitOTP, messageID } from "../config/constants";
const { cryptoSecret, secret } = config;
const bcrypt = require("bcrypt");
 const xlsx = require("xlsx");
import jwt from "jsonwebtoken";
import Counter from "../models/counter";

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
        secret.JWT
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
        secret.JWT
    );
};

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

export const formatDateAndTime = (date) => {
    const cdate = new Date(date)
    const currentdate = `0${cdate.getDate()}`
    const month = `0${cdate.getMonth() + 1}`
    const year = `${cdate.getFullYear()}`

    // const newDate = `${currentdate.length > 2 ? currentdate.slice(1) : currentdate}-${month.length > 2 ? month.slice(2) : month}-${year} ${cdate.getUTCHours()}:${cdate.getUTCMinutes()}`
    const newDate = `${year}-${month.length > 2 ? month.slice(2) : month}-${currentdate.length > 2 ? currentdate.slice(1) : currentdate} ${cdate.getUTCHours()}:${cdate.getUTCMinutes()}`
    return newDate
}

export const formatDateAndTimeNew = (date)=> {
    const cdate = new Date(date);
    const day = cdate.getDate().toString().padStart(2, '0');
    const month = (cdate.getMonth() + 1).toString().padStart(2, '0'); // Add 1 to month and pad with '0' if needed
    const year = cdate.getFullYear();
    const hours = cdate.getUTCHours().toString().padStart(2, '0');
    const minutes = cdate.getUTCMinutes().toString().padStart(2, '0');
  
    const newDate = `${year}-${month}-${day} ${hours}:${minutes}`;
    return newDate;
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

export const getDifferenceInDays = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    // Calculate the difference in years
    let yearsDifference = d2.getFullYear() - d1.getFullYear();

    // Adjust for months/days if the full year hasn't passed yet
    if (
        d2.getMonth() < d1.getMonth() || 
        (d2.getMonth() === d1.getMonth() && d2.getDate() < d1.getDate())
    ) {
        yearsDifference--;
    }

    return yearsDifference;
}

function generateSequenceCounter() {
    return new Promise(async (resolve, reject) => {
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

