import jwt from "jsonwebtoken";
import { messageID, messages, config } from "../config/constants";
import { sendResponse } from "./transmission"
const { SECRET } = config;

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
        let jwtSecretKey = SECRET.JWT;
        const decode = jwt.verify(token, jwtSecretKey);
        req.user = decode.data
        next();
    } catch (error) {
        if (error.name == "TokenExpiredError") {
            sendResponse(req, res, messageID.unAuthorizedUser, {
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