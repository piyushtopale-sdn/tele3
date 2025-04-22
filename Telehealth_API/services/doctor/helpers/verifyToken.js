import jwt from "jsonwebtoken";
import { messageID, messages, config } from "../config/constants";
import { sendResponse } from "../helpers/transmission"
import PortalUser from  "../models/portal_user"
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
        if (req?.user?.role === "INDIVIDUAL_DOCTOR") {
        const checkUserToken = await PortalUser.findById(req.user._id);
        if (checkUserToken?.activeToken !== token) {
            return sendResponse(req, res, messageID.unAuthorizedUser, {
                status: false,
                body: null,
                message: messages.authError,
                errorCode: null,
            });
        }
    }

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

export const verifyRole = (validRoles) => {
    return (req, res, next) => {
        const role = req.user.role
        if (validRoles.includes(role)) {
            next()
        } else {
            sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: messages.notAuthorized,
                errorCode: null,
            });
        }
    }
}