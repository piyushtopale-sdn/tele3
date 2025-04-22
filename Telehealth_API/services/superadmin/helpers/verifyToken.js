import jwt from "jsonwebtoken";
import { messageID, messages } from "../config/constants";
import { sendResponse } from "../helpers/transmission"
const config = require('../config/config').get();
const { secret } = config;

export const verifyToken = async (req, res, next) => {
    try {
        let token = req.header("Authorization");
        if(!token) return sendResponse(req, res, messageID.unAuthorizedUser, {
            status: false,
            body: null,
            message: messages.authError,
            errorCode: null,
        });
        token = token.split('Bearer ')[1];
        let jwtSecretKey = secret.JWT;
        const decode = jwt.verify(token, jwtSecretKey);
        req.user = decode.data
        next();
    } catch (error) {
        if (error.name == "TokenExpiredError") {
            return sendResponse(req, res, messageID.unAuthorizedUser, {
                status: false,
                body: null,
                message: messages.tokenExpire,
                errorCode: null,
            });
        }
        sendResponse(req, res, messageID.unAuthorizedUser, {
            status: false,
            body: null,
            message: messages.invalidToken,
            errorCode: null,
        });
    }
}

export const authorizeRole = (role) => {
    return (req, res, next) => {
      if (!role.includes(req.user.role)) {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: messages.notAuthorized,
                errorCode: null,
            });
        }
        next();
    };
};
