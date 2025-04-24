"use strict";

const bcrypt = require('bcrypt');
import jwt from "jsonwebtoken";
import crypto from "crypto"
const fs = require('fs');
const csv = require('fast-csv');
import Superadmin from "../../models/superadmin/superadmin";
import Medicine from "../../models/medicine";
import MaximumRequest from "../../models/superadmin/maximum_request";
import PortalUser from "../../models/superadmin/portal_user";
import SubscriptionPlan from "../../models/subscription/subscriptionplans";
import PlanPeriodical from "../../models/subscription/planperiodical";
import SubscriptionPlanService from "../../models/subscription/subscriptionplan_service";
import Otp2fa from "../../models/otp2fa";
import { config, smsTemplateOTP, MedicineColumns } from "../../config/constants";
const { OTP_EXPIRATION, OTP_LIMIT_EXCEED_WITHIN, OTP_TRY_AFTER, SEND_ATTEMPTS, test_p_FRONTEND_URL } = config
const { bcryptCompare, generateTenSaltHash, processExcel, generate4DigitOTP } = require("../../middleware/utils");
const secret = config.SECRET;
import { sendResponse } from "../../helpers/transmission";
import ForgotPasswordToken from "../../models/forgot_password_token";
import { sendSms } from "../../middleware/sendSms";
import { sendEmail } from "../../helpers/ses";

import Country from "../../models/common_data/country"
import City from "../../models/common_data/city"
import Department from "../../models/common_data/department"
import Province from "../../models/common_data/province"
import Region from "../../models/common_data/region"
import Village from "../../models/common_data/village"
import Speciality from "../../models/speciality"
import AppointmentCommission from "../../models/superadmin/appointment-commision"
import mongoose from "mongoose";
import Invitation from '../../models/superadmin/email_invitation';
import { sendMailInvitations } from '../../helpers/emailTemplate'
import Notification from "../../models/superadmin/Chat/Notification";
const Http = require('../../helpers/httpservice');
import { decryptionData } from "../../helpers/crypto";

import Logs from "../../models/superadmin/log"
import GeneralSettings from "../../models/superadmin/general_settings";

const httpService = new Http()
/**
 * Generates a token
 * @param {Object} user - user object
 */
const generateToken = payload => {
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
};
const generateRefreshToken = payload => {
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
/**
 * Compare password using bcrypt
 * @param {string} password 
 * @param {boolean} user 
 */
const checkPassword = async (password, user) => {
    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch
}
/**
 * Login using email and password
 * @param {Object} req 
 * @param {Object} res 
 */
const checkIp = async (currentIP, userIP) => {
    if (currentIP === userIP) {
        return true
    }
}

// export const saveLogs = (logData) => {
//     return new Promise(async (resolve, reject) => {
//         try {
//             const logEntry = new Logs(logData);
//             await logEntry.save();
//             resolve(true)
//         } catch (err) {
//             console.error("Error logging action: ", err);
//             resolve(false)
//         }
//     })
// };
// PT - Mar 18
export const saveLogs = (logData) => {
    return new Promise((resolve, reject) => {
      const logEntry = new Logs(logData);
      logEntry.save()
        .then(() => resolve(true))
        .catch((err) => {
          console.error("Error logging action: ", err);
          resolve(false); // You can reject if you prefer, depending on your use case
        });
    });
  };
  

export const viewRes = async (req, res) => {
    try {
        const { serverData } = req.body;
        res.status(200).json(JSON.parse(decryptionData(serverData)));
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "failed to get view res",
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
}

const canSendOtp = (deviceExist, currentTime) => {
    return new Promise((resolve, reject) => {
        const limitExceedWithin1 = new Date(currentTime.getTime() + OTP_LIMIT_EXCEED_WITHIN * 60000);
        let returnData = { status: false, limitExceedWithin: limitExceedWithin1 }
        if (!deviceExist) resolve({status: true}) // First time sending
        const { send_attempts, limitExceedWithin, isTimestampLocked } = deviceExist;
        const limitExceedTimestamp = new Date(limitExceedWithin);
        if (send_attempts <= SEND_ATTEMPTS && currentTime > limitExceedTimestamp) {
            resolve({status: true, limitExceedWithin: limitExceedWithin1, send_attempts: 1, reset: true, isTimestampLocked: false}) // Reset attempts if time has exceeded
        } else if (send_attempts < SEND_ATTEMPTS) {
            resolve({status: true}) // Allow sending if below SEND_ATTEMPTS attempts
        }
        const addMinutes = new Date(currentTime.getTime() + OTP_TRY_AFTER * 60000);
        if (send_attempts == SEND_ATTEMPTS && !isTimestampLocked) {
            returnData.limitExceedWithin = addMinutes
            returnData.isTimestampLocked = true
        } 
        resolve(returnData); // Otherwise, do not allow sending
    })
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const superAdminData = await Superadmin.findOne({ email, isDeleted: false }).lean();
        if (!superAdminData) {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "User not found",
                errorCode: "USER_NOT_FOUND",
            });
        }
        if (!superAdminData.isActive || superAdminData.isLocked || superAdminData.isDeleted) {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "Your account is inactive. Please contact the admin for assistance.",
                errorCode: "USER_INACTIVE",
            });
        }
        const isPasswordMatch = await checkPassword(password, superAdminData);
        if (!isPasswordMatch) {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "The password is incorrect.",
                errorCode: "INCORRECT_PASSWORD",
            });
        }
        superAdminData.password = undefined

        return sendResponse(req, res, 200, {
            status: true,
            body: {
                otp_verified: false,
                token: null,
                refreshToken: null,
                findUser: {
                    _id: superAdminData?._id,
                    email: superAdminData?.email,
                    mobile: superAdminData?.mobile,
                    country_code: superAdminData?.country_code,
                },
                role: superAdminData?.role
            },
            message: "OTP verification pending 2fa",
            errorCode: "VERIFICATION_PENDING",
        });
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: null,
        });
    }
}

export const logout = async (req, res) => {
    try {
        const { uuid } = req.headers;

        await Otp2fa.updateMany({ uuid }, {
            $set: {
                verified: false
            }
        })

        const getData = await Otp2fa.findOne({ uuid })
        
        if (getData) {
          const getSuperadminData = await Superadmin.findOne({_id: {$eq: getData?.for_portal_user}}).select('fullName')
          
          //Save audit logs
          const objData = { 
            userId: getData?.for_portal_user,
            userName: getSuperadminData?.fullName,
            role: 'superadmin',
            action: `logout`,
            actionDescription: `Logout: ${getSuperadminData?.fullName} logout successfully.`,
          }
          await saveLogs(objData)

           await Superadmin.findOneAndUpdate(
                { _id: mongoose.Types.ObjectId(req.user._id) },
                {
                    $set: { activeToken: "" },
                },
                { upsert: false, new: true }
            );
        }


        return sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: "User logged out successfully",
            errorCode: "USER_LOGOUT",
        });
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: null,
        });
    }
}

export const sendEmailOtpFor2fa = async (req, res) => {
    try {
        const { email } = req.body;
        const { uuid } = req.headers;
        const headers = {
            'Authorization': req.headers['authorization']
        }
        const superAdminData = await Superadmin.findOne({ email }).lean();
        const deviceExist = await Otp2fa.findOne({ uuid, email }).lean();
        if (!superAdminData) {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "User not found",
                errorCode: "USER_NOT_FOUND",
            });
        }
        await Otp2fa.updateMany({ uuid }, {
            $set: {
                verified: false
            }
        })
        const currentTime = new Date();

        const canOtpSend = await canSendOtp(deviceExist, currentTime)
        
        // Check if the OTP can be sent
        if (!canOtpSend.status) {
            const timeLeft = new Date(deviceExist.isTimestampLocked ? deviceExist.limitExceedWithin : canOtpSend.limitExceedWithin) - currentTime;
            if (!deviceExist.isTimestampLocked) {
                await Otp2fa.findOneAndUpdate({ email, uuid, for_portal_user: superAdminData._id }, { $set: {
                    limitExceedWithin: canOtpSend.limitExceedWithin,
                    isTimestampLocked: canOtpSend.isTimestampLocked
                } }).exec();
            }

            return sendResponse(req, res, 200, {
                status: false,
                message: `Maximum limit exceeded. Try again after ${Math.ceil(timeLeft / 60000)} minutes.`,
                errorCode: null,
            })
        }
        const otp = generate4DigitOTP();
        const otpExpiration = new Date(currentTime.getTime() + OTP_EXPIRATION * 60000); //This will add 10 minutes time for otp expiration
        const getEmailContent = await httpService.getStaging('superadmin/get-notification-by-condition', { condition: 'LOGIN_OTP', type: 'email' }, headers, 'superadminServiceUrl');
        let emailContent
        if (getEmailContent?.status && getEmailContent?.data?.length > 0) {
            emailContent = getEmailContent?.data[0]?.content.replace(/{{otp}}/g, otp)
        } else {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "Email content not set yet",
                errorCode: null,
            });
        }
        const content = {
            subject: getEmailContent?.data[0]?.notification_title,
            body: emailContent
        }
        sendEmail(content, email);
        let updateObject = {
            otp,
            otpExpiration,
            send_attempts: (deviceExist ? deviceExist.send_attempts : 0) + 1,
        };
        let result = null;
        if (deviceExist) {
            updateObject.limitExceedWithin = canOtpSend.limitExceedWithin
            if (canOtpSend?.reset) {
                updateObject.send_attempts = 1
                updateObject.isTimestampLocked = false;
                updateObject.limitExceedWithin = canOtpSend.limitExceedWithin;
            }
            result = await Otp2fa.findOneAndUpdate(
                { email, uuid }, 
                { $set: updateObject }
            ).exec();
        } else {
            result = await new Otp2fa({
                email,
                otp,
                otpExpiration,
                limitExceedWithin: canOtpSend.limitExceedWithin,
                uuid,
                for_portal_user: superAdminData._id,
                send_attempts: 1
            }).save();
        }
        return sendResponse(req, res, 200, {
            status: true,
            message: "OTP has been sent successfully to your email.",
            body: {
                id: result._id
            },
            errorCode: null,
        });
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: null,
        });
    }
}

export const sendSmsOtpFor2fa = async (req, res) => {
    try {
        const { email } = req.body;
        const { uuid } = req.headers;
        const headers = {
            'Authorization': req.headers['authorization']
        }
        const superAdminData = await Superadmin.findOne({ email }).lean();
        if (!superAdminData) {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "User does not exist.",
                errorCode: "USER_NOT_EXIST",
            });
        }
        await Otp2fa.updateMany({ uuid }, {
            $set: {
                verified: false
            }
        })
        const mobile = superAdminData.mobile
        const country_code = superAdminData.country_code
        const deviceExist = await Otp2fa.findOne({ mobile, country_code, uuid, for_portal_user: superAdminData._id }).lean();
        const currentTime = new Date();

        const canOtpSend = await canSendOtp(deviceExist, currentTime)
        
        let otp = 1111;

        if(process.env.NODE_ENV === "production"){
            otp = generate4DigitOTP();
        }
        const otpExpiration = new Date(currentTime.getTime() + OTP_EXPIRATION * 60000); //This will add 10 minutes time for otp expiration
        const getSMSContent = await httpService.getStaging('superadmin/get-notification-by-condition', { condition: 'LOGIN_OTP', type: 'sms' }, headers, 'superadminServiceUrl');
        let otpText
        if (getSMSContent?.status && getSMSContent?.data?.length > 0) {
            otpText = getSMSContent?.data[0]?.content.replace(/{{otp}}/g, otp)
        } else {
            otpText = smsTemplateOTP(otp);
        }
        await sendSms(country_code + mobile, otpText);
        let updateObject = {
            otp,
            otpExpiration,
            send_attempts: (deviceExist ? deviceExist.send_attempts : 0) + 1,
        };
        let result = null;
            if (deviceExist) {
                updateObject.limitExceedWithin = canOtpSend.limitExceedWithin
                if (canOtpSend?.reset) {
                    updateObject.send_attempts = 1
                    updateObject.isTimestampLocked = false;
                    updateObject.limitExceedWithin = canOtpSend.limitExceedWithin;
                }
                result = await Otp2fa.findOneAndUpdate(
                    { mobile, country_code, uuid, for_portal_user: superAdminData._id }, 
                    { $set: updateObject }
                ).exec();
            } else {
                result = await new Otp2fa({
                    mobile,
                    otp,
                    otpExpiration,
                    limitExceedWithin: canOtpSend.limitExceedWithin,
                    country_code,
                    uuid,
                    for_portal_user: superAdminData._id,
                    send_attempts: 1
                }).save();
            }
            return sendResponse(req, res, 200, {
                status: true,
                body: {
                    id: result._id
                },
                message: "OTP sent successfully.",
                errorCode: null,
            });
        // } else {
        //     sendResponse(req, res, 500, {
        //         status: false,
        //         body: null,
        //         message: "can't sent sms",
        //         errorCode: null,
        //     });
        // }
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: null,
        });
    }
}

export const matchEmailOtpFor2fa = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const { uuid } = req.headers;

        const portalUserData = await Superadmin.findOne({
            email: email,
        }).lean();
        if (!portalUserData) {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "User does not exist.",
                errorCode: null,
            });
        }
        const data = await Otp2fa.findOne({ uuid, email, for_portal_user: portalUserData._id, verified: false })

        if (data) {
             //Check OTP expiry
             const timestamp1 = new Date();  // First timestamp
             const timestamp2 = new Date(data?.otpExpiration);  // Second timestamp
 
             if (timestamp2.getTime() < timestamp1.getTime()) {
                 return sendResponse(req, res, 200, {
                     status: false,
                     body: null,
                     message: "The OTP has expired.",
                     errorCode: "OTP_EXPIRED",
                 });
             }
            if (data.otp == otp) {
                await Superadmin.findOneAndUpdate(
                    { _id: portalUserData._id },
                    {
                        $set: {
                            verified: true,
                        },
                    },
                    { new: true }
                ).exec();
                const updateVerifiedUUID = await Otp2fa.findOneAndUpdate(
                    { uuid, email, for_portal_user: portalUserData._id, verified: false },
                    {
                        $set: {
                            verified: true,
                        },
                    },
                    { new: true }
                ).exec();
                const tokenData = {
                    _id: portalUserData._id,
                    email: portalUserData.email,
                    role: portalUserData.role,
                    uuid: updateVerifiedUUID._id
                }
                //Save audit logs
                const objData = { 
                  userId: portalUserData?._id,
                  userName: portalUserData?.fullName,
                  role: 'superadmin',
                  action: `login`,
                  actionDescription: `Login: ${portalUserData?.fullName} login successfully.`,
                }
                await saveLogs(objData)
                let activeToken = generateToken(tokenData);
                await Superadmin.findOneAndUpdate(
                  { _id: portalUserData?._id },
                  {
                    $set: { activeToken: activeToken },
                  }
                );
                return sendResponse(req, res, 200, {
                    status: true,
                    body: {
                        otp_verified: true,
                        token: activeToken,
                        refreshToken: generateRefreshToken(tokenData),
                        findUser: {
                            _id: portalUserData?._id,
                            fullName: portalUserData?.fullName,
                            email: portalUserData?.email,
                            mobile: portalUserData?.mobile,
                            country_code: portalUserData?.country_code,
                            role: portalUserData?.role,
                        },
                        adminData: {
                            _id: portalUserData?._id,
                            role: portalUserData?.role,
                        },
                        role: portalUserData.role,
                    },
                    message: "OTP matched successfully.",
                    errorCode: null,
                });
            } else {
                return sendResponse(req, res, 200, {
                    status: false,
                    message: "OTP not matched",
                    errorCode: null,
                });
            }
        } else {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "OTP does not exist! Please resend OTP.",
                errorCode: "OTP_NOT_FOUND",
            });
        }
    } catch (error) {
        console.error("An error occurred:", error);
        return sendResponse(req, res, 500, {
            status: false,
            body: null,
            message: "Internal server error",
            errorCode: null,
        });
    }
}

export const matchSmsOtpFor2fa = async (req, res) => {
    try {
        const { otp, for_portal_user } = req.body;
        const { uuid } = req.headers;
        const portalUserData = await Superadmin.findOne({
            _id: for_portal_user,
        }).lean();
        if (!portalUserData) {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "User does not exist.",
                errorCode: null,
            });
        }
        const data = await Otp2fa.findOne({ uuid, mobile: portalUserData?.mobile, for_portal_user: portalUserData._id, verified: false })
        if (data) {
            //Check OTP expiry
            const timestamp1 = new Date();  // First timestamp
            const timestamp2 = new Date(data?.otpExpiration);  // Second timestamp

            if (timestamp2.getTime() < timestamp1.getTime()) {
                return sendResponse(req, res, 200, {
                    status: false,
                    body: null,
                    message: "The OTP has expired.",
                    errorCode: "OTP_EXPIRED",
                });
            }

            if (data.otp == otp) {
                const updateVerified = await Superadmin.findOneAndUpdate({ _id: for_portal_user }, {
                    $set: {
                        verified: true
                    }
                }, { new: true }).exec();
                const updateVerifiedUUID = await Otp2fa.findOneAndUpdate({ _id: data?._id }, {
                    $set: {
                        verified: true
                    }
                }, { new: true }).exec();
                const tokenData = {
                    _id: portalUserData._id,
                    email: portalUserData.email,
                    role: portalUserData.role,
                    uuid: updateVerifiedUUID._id
                }
                  //Save audit logs
                  const objData = { 
                    userId: portalUserData?._id,
                    userName: portalUserData?.fullName,
                    role: 'superadmin',
                    action: `login`,
                    actionDescription: `Login: ${portalUserData?.fullName} login successfully.`,
                  }
                  await saveLogs(objData)
                  let activeToken = generateToken(tokenData);
                      await Superadmin.findOneAndUpdate(
                        { _id: for_portal_user },
                        {
                          $set: { activeToken: activeToken },
                        }
                      );
                return sendResponse(req, res, 200, {
                    status: true,
                    body: {
                        id: updateVerified._id,
                        uuid: updateVerifiedUUID._id,
                        otp_verified: true,
                        token: activeToken,
                        refreshToken: generateRefreshToken(tokenData),
                        findUser: {
                            _id: portalUserData?._id,
                            fullName: portalUserData?.fullName,
                            email: portalUserData?.email,
                            mobile: portalUserData?.mobile,
                            country_code: portalUserData?.country_code,
                            role: portalUserData?.role,
                        },
                        adminData: {
                            _id: portalUserData?._id,
                            role: portalUserData?.role,
                        },
                        role: portalUserData.role,
                    },
                    message: "OTP matched successfully.",
                    errorCode: null,
                });
            } else {
                return sendResponse(req, res, 200, {
                    status: false,
                    body: null,
                    message: "Incorrect OTP",
                    errorCode: "INCORRECT_OTP",
                });
            }
        } else {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "OTP does not exist! Please resend OTP.",
                errorCode: "OTP_NOT_FOUND",
            });
        }
    } catch (error) {
        
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: null,
        });
    }
}

export const forgotPassword = async (req, res) => {
    const headers = {
        'Authorization': req.headers['authorization']
    }
    try {
        const { email } = req.body
        let userData = await Superadmin.findOne({ email });
        if (!userData) {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "User not found.",
                errorCode: null,
            });
        }
        let resetToken = crypto.randomBytes(32).toString("hex");
        const hashResetToken = await generateTenSaltHash(resetToken);

        let ForgotPasswordTokenData = await ForgotPasswordToken.findOne({ user_id: userData._id });
        if (ForgotPasswordTokenData) {
            await ForgotPasswordTokenData.deleteOne()
        }

        let ForgotPasswordData = new ForgotPasswordToken({
            user_id: userData._id,
            token: hashResetToken,
        });
        await ForgotPasswordData.save();

        const link = `${test_p_FRONTEND_URL}/super-admin/newpassword?token=${resetToken}&user_id=${userData._id}`
        const getEmailContent = await httpService.getStaging('superadmin/get-notification-by-condition', { condition: 'FORGOT_PASSWORD', type: 'email' }, headers, 'superadminServiceUrl');
        let emailContent
        if (getEmailContent?.status && getEmailContent?.data?.length > 0) {
            emailContent = getEmailContent?.data[0]?.content.replace(/{{link}}/g, link)
        } else {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "Email content not set yet",
                errorCode: "MAX ATTEMPT_EXCEEDED",
            });
        }
        const content = {
            subject: getEmailContent?.data[0]?.notification_title,
            body: emailContent
        }
        let sendEmailStatus = sendEmail(content, email);
        if (sendEmailStatus) {
            return sendResponse(req, res, 200, {
                status: true,
                body: {
                    user_id: userData._id,
                    resetToken
                },
                message: "A password reset link has been sent to your email.",
                errorCode: null,
            });
        } else {
            return sendResponse(req, res, 500, {
                status: false,
                message: "Internal server error. Unable to send email.",
                errorCode: null,
            });
        }
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: null,
        });
    }
}

export const resetForgotPassword = async (req, res) => {
    try {
        const { user_id, resetToken, newPassword } = req.body
        let ForgotPasswordTokenData = await ForgotPasswordToken.findOne({ user_id });

        if (!ForgotPasswordTokenData) {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "The token has expired.",
                errorCode: null,
            });
        }
        const isPasswordMatch = await bcryptCompare(resetToken, ForgotPasswordTokenData.token);
        if (!isPasswordMatch) {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "The token does not match.",
                errorCode: null,
            });
        }
        const passCheck = await Superadmin.findOne({ _id: user_id });
        const isPasswordCheck = await checkPassword(newPassword, passCheck);

        if (isPasswordCheck) {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "This is your previous password. Please enter a new password.",
                errorCode: null,
            });
        } else {
            const hashPassword = await generateTenSaltHash(newPassword);

            await Superadmin.findOneAndUpdate(
                { _id: user_id },
                { password: hashPassword },
                { new: true }
            )
            //DELETE the token after successful reset
            await ForgotPasswordToken.deleteOne({ user_id });
            return sendResponse(req, res, 200, {
                status: true,
                body: { hashPassword },
                message: "New password has been set successfully.",
                errorCode: null,
            });
        }

    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: null,
        });
    }
}

export const listMedicineforexport = async (req, res) => {
    const { searchText, limit, page } = req.query
    let filter
    if (searchText == "") {
        filter = {
            isDeleted: false
        }
    } else {
        filter = {
            isDeleted: false,
            $or: [
              { 'medicine.scientific_name': { $regex: searchText || "", $options: "i" } },
              { 'medicine.commercial_name': { $regex: searchText || "", $options: "i" } },
            ],
        }
    }
    try {
        let result = '';
        if (limit > 0) {
            result = await Medicine.find(filter)
                .sort([["createdAt", -1]])
                .skip((page - 1) * limit)
                .limit(limit * 1)
                .exec();
        }
        else {
            result = await Medicine.aggregate([{
                $match: filter
            },
            { $sort: { "createdAt": -1 } },
            {
                $project: {
                    _id: 0,
                    scientific_name: "$medicine.scientific_name",
                    commercial_name: "$medicine.commercial_name",
                    manufacturer: "$medicine.manufacturer",
                    pharmaceutical_formulation: "$medicine.pharmaceutical_formulation",
                    indication: "$medicine.indication",
                    storage_information: "$medicine.storage_information",    
                    note:"$medicine.note"
                }
            }
            ])
        }
        let array = result.map(obj => Object.values(obj));       

        return sendResponse(req, res, 200, {
            status: true,
            data: {
                result,
                array
            },
            message: `Medicine list exported successfully.`,
            errorCode: null,
        });
    } catch (err) {
        
        return sendResponse(req, res, 500, {
            status: false,
            data: err,
            message: `Failed to export medicine.`,
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
}


export const fetchedMedicineByID = async (req, res) => {
    try {
        const { medicineIds } = req.body;
        const medicineArray = await Medicine.find({ _id: { $in: medicineIds } }, { _id: 1, medicine: 1 })

        return sendResponse(req, res, 200, {
            status: true,
            body: medicineArray,
            message: "Medicine records fetched successfully.",
            errorCode: null,
        });

    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Failed to fetch medicine records.",
            errorCode: null,
        });
    }
}

export const listMedicineWithoutPagination = async (req, res) => {
    try {
        let medicineDetails = await Medicine.find({
            isDeleted: false,
            isNew: false,
            'medicine.status': true,
            $or: [
                {
                    'medicine.medicine_name': { $regex: req.query.query || '', $options: "i" },
                }
            ]
        }).select('medicine.medicine_name')
            .sort([["createdAt", -1]])
            .limit(20)
            .exec();
        const medicneArray = []
        for (const medicine of medicineDetails) {
            medicneArray.push({
                _id: medicine._id,
                medicine_name: medicine.medicine.medicine_name,
            })
        }

        
        return sendResponse(req, res, 200, {
            status: true,
            body: { medicneArray },
            message: "Medicine records fetched successfully.",
            errorCode: null,
        });
    } catch (error) {
        
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Failed to fetch medicine records.",
            errorCode: null,
        });
    }
}

export const listMedicineWithoutPaginationForDoctor = async (req, res) => {
    try {
        let medicineDetails = await Medicine.find({
            isDeleted: false,
            $or: [
                {
                    'medicine.medicine_name': { $regex: (req.query.query).trim() || '', $options: "i" },
                }
            ],
            added_by: { $in: [mongoose.Types.ObjectId("63763d9eda5f0a2708aff9fe"), req.query.doctorId] }
        }).select('medicine.medicine_name')
            .sort([["createdAt", -1]])
            .limit(20)
            .exec();
        const medicneArray = []
        for (const medicine of medicineDetails) {
            medicneArray.push({ 
                _id: medicine._id,
                medicine_name: medicine.medicine.medicine_name,
            })
        }

        return sendResponse(req, res, 200, {
            status: true,
            body: { medicneArray },
            message: "Medicine records fetched successfully.",
            errorCode: null,
        });
    } catch (error) {
        
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Failed to fetch medicine records.",
            errorCode: null,
        });
    }
}


const validateColumnWithExcel = (toValidate, excelColumn) => {
    const requestBodyCount = Object.keys(toValidate).length
    const fileColumnCount = Object.keys(excelColumn).length
    if (requestBodyCount !== fileColumnCount) {
        return false
    }
    let index = 1
    for (const iterator of Object.keys(excelColumn)) {
        if (iterator !== toValidate[`col${index}`]) {
            return false
        }
        index++
    }
    return true
}

export const uploadCSVForMedicine = async (req, res) => {
    try {
        const filePath = './uploads/' + req.filename
        const data = await processExcel(filePath);
        const isValidFile = validateColumnWithExcel(MedicineColumns, data[0]);
        fs.unlinkSync(filePath);

        if (!isValidFile) {
            return sendResponse(req, res, 500, {
                status: false,
                body: isValidFile,
                message: "Invalid excel sheet! column not matched.",
                errorCode: null,
            });
        }

        const existingscientificName = await Medicine.distinct('medicine.scientific_name', { 'isDeleted': false });

        const existingcommercialName = await Medicine.distinct('medicine.commercial_name', { 'isDeleted': false });

        const medicineData = [];

        for (const medicine of data) {
            const scientificName = medicine.scientific_name;
            const commercialName = medicine.commercial_name;

            if (
                existingscientificName.includes(scientificName) &&
                existingcommercialName.includes(commercialName)
            ) {
                return sendResponse(req, res, 200, {
                    status: false,
                    body: null,
                    message: `Medicine with Scientific Name '${scientificName}' and Commercial Name '${commercialName}' already exists`,
                    errorCode: null,
                });
            }

            medicineData.push({
                medicine: {
                    scientific_name: medicine.scientific_name,
                    commercial_name: medicine.commercial_name,
                    manufacturer: medicine.manufacturer,
                    pharmaceutical_formulation: medicine.pharmaceutical_formulation,
                    indication: medicine.indication,
                    storage_information: medicine.storage_information,    
                    status:true,
                    note: medicine.note,
                },
                added_by: req.body.userId,
            });
        }

        if (medicineData.length === 0) {
            return sendResponse(req, res, 200, {
                status: true,
                body: null,
                message: "All medicine records already exist.",
                errorCode: null,
            });
        }

        await Medicine.insertMany(medicineData);
        return sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: "Medicine records added successfully.",
            errorCode: null,
        });
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: error.message ? error.message : "Internal server error",
            errorCode: error.message ? error.message : null,
        });
    }
}

export const getServiceField = async (req, res) => {
    try {
        const { plan_for } = req.query
        let allSubscriptionPlanService = await SubscriptionPlanService.find({ plan_for });
        if (allSubscriptionPlanService.length < 1) {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "No service exist",
                errorCode: null,
            });
        }
        return sendResponse(req, res, 200, {
            status: true,
            body: allSubscriptionPlanService,
            message: "all service",
            errorCode: null,
        });
    } catch (error) {
        return sendResponse(req, res, 200, {
            status: false,
            body: { error },
            message: "server error",
            errorCode: "Internal server error",
        });
    }
}

export const createSubscriptionPlan = async (req, res) => {
    try {
        const {
            plan_for,
            plan_name,
            plan_name_arabic,
            description,
            descriptionArabic,
            services,
            plan_duration,
            is_activated,
            price_per_member,
            trial_period,
            trial_period_description,
        } = req.body

        let subscriptionPlanExist = await SubscriptionPlan.findOne(
            {
                plan_name,
                is_deleted: false
            }
        );
        if (subscriptionPlanExist) {
            return sendResponse(req, res, 200, {
                status: false,
                message: "Subscription plan already exists.",
                body: subscriptionPlanExist,
                errorCode: null,
            });
        }

        let metadata = {}
        for (const ele of services) {
            metadata[ele.name] = ele.max_number
        }

        let newSubscriptionPlanDetails = new SubscriptionPlan({
            plan_for,
            plan_name,
            plan_name_arabic,
            description,
            descriptionArabic,
            services,
            plan_duration,
            is_activated,
            price_per_member,
            trial_period,
            trial_period_description,
            createdBy: req?.user?._id
        });
        let newSubscriptionPlan = await newSubscriptionPlanDetails.save();

        return sendResponse(req, res, 200, {
            status: true,
            message: "Subscription plan created successfully.",
            body: newSubscriptionPlan,
            errorCode: null,
        });
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            message: "Internal server error",
            body: error,
            errorCode: "Internal server error",
        });
    }
}

export const getSubscriptionPlanDetails = async (req, res) => {
    try {
        const { id } = req.query
        let planDetail = await SubscriptionPlan.findOne({
            _id: id,
            is_deleted: false
        })
            .populate({
                path: "plan_duration",
            })
        if (planDetail) {
            return sendResponse(req, res, 200, {
                status: true,
                body: planDetail,
                message: "subscription plan details",
                errorCode: null,
            });
        }
        return sendResponse(req, res, 200, {
            status: false,
            body: null,
            message: "This subscription plan does not exist.",
            errorCode: null,
        });
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: "Internal server error",
        });
    }
}

export const allSubscriptionPlans = async (req, res) => {
    const { limit, page, is_deleted, is_activated, plan_for, plan_name } = req.query;
    let sort = req.query.sort
    let sortingarray = {};
    if (sort != 'undefined' && sort != '' && sort != undefined) {
        let keynew = sort.split(":")[0];
        let value = sort.split(":")[1];
        sortingarray[keynew] = value;
    } else {
        sortingarray['createdAt'] = -1;
    }

    const filter = {
        is_deleted,
        is_activated,
        plan_for,
        plan_name: {
            $regex: plan_name || '',
            $options: "i"
        }
    }

    if (is_deleted == "all") {
        delete filter.is_deleted
    }
    if (is_activated == "all") {
        delete filter.is_activated
    }
    if (plan_for == "all") {
        delete filter.plan_for
    }
    if (plan_name == "") {
        delete filter.plan_name
    }
    
    try {
        let allPlans = await SubscriptionPlan.find(filter)
            .populate({
                path: "plan_duration",
            })
            .sort(sortingarray)
            .limit(limit * 1)
            .skip(plan_name ? 0 : (page - 1) * limit)
            .exec();
        const count = await SubscriptionPlan.countDocuments(filter)
        if (count < 1) {
            return sendResponse(req, res, 200, {
                status: false,
                message: "No subscription plan exists.",
                errorCode: null,
            });
        }
        return sendResponse(req, res, 200, {
            status: true,
            body: {
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                totalRecords: count,
                allPlans,
            },
            message: "List of all subscription plans",
            errorCode: null,
        });
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: "Internal server error",
        });
    }
}

export const listSubscriptionPlans = async (req, res) => {
    try {
        let allPlans = await SubscriptionPlan.find({is_deleted: false, is_activated: true}).select('plan_name')
        return sendResponse(req, res, 200, {
            status: true,
            body: allPlans,
            message: "List of all subscription plans",
            errorCode: null,
        });
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: "Internal server error",
        });
    }
}

export const subscriptionPlanGetById = async (req, res) => {
    try {
        let { planIds } = req.query;  
        if (!planIds) {
            return sendResponse(req, res, 400, {
                status: false,
                body: null,
                message: "Subscription Plan IDs are required",
                errorCode: "MISSING_IDS",
            });
        }

        if (typeof planIds === "string") {
            planIds = planIds.split(",");
        }

        const invalidIds = planIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            return sendResponse(req, res, 400, {
                status: false,
                body: null,
                message: `Invalid Subscription Plan IDs: ${invalidIds.join(", ")}`,
                errorCode: "INVALID_IDS",
            });
        }

        const plans = await SubscriptionPlan.find({ _id: { $in: planIds } });

        if (!plans.length) {
            return sendResponse(req, res, 404, {
                status: false,
                body: null,
                message: "No Subscription Plans found",
                errorCode: "NOT_FOUND",
            });
        }

        return sendResponse(req, res, 200, {
            status: true,
            body: plans,
            message: "Subscription Plans fetched successfully",
            errorCode: null,
        });

    } catch (error) {
        console.error("Error fetching plans:", error);
        return sendResponse(req, res, 500, {
            status: false,
            body: null,
            message: "Internal Server Error",
            errorCode: "SERVER_ERROR",
        });
    }
};

export const getPeriodicList = async (req, res) => {
    try {
        let allPeriodicalPlans = await PlanPeriodical.find()
        return sendResponse(req, res, 200, {
            status: true,
            body: {
                allPeriodicalPlans,
            },
            message: "All periodic plan list",
            errorCode: null,
        });
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: "Internal server error",
        });
    }
}

export const editSubscriptionPlan = async (req, res) => {
    try {
        const {
            _id,
            plan_for,
            plan_name,
            plan_name_arabic,
            description,
            descriptionArabic,
            services,
            plan_price,
            plan_duration,
            is_activated
        } = req.body

        let updatedsubscriptionPlan = await SubscriptionPlan.findOneAndUpdate(
            {
                _id
            },
            {
                plan_for,
                plan_name,
                plan_name_arabic,
                description,
                descriptionArabic,
                services,
                plan_price,
                plan_duration,
                is_activated
            },
            { new: true }
        );
        if (updatedsubscriptionPlan) {
            return sendResponse(req, res, 200, {
                status: true,
                body: updatedsubscriptionPlan,
                message: "Subscription plan updated successfully.",
                errorCode: null,
            });
        }
        return sendResponse(req, res, 200, {
            status: false,
            body: null,
            message: "Failed to update the subscription plan.",
            errorCode: "Internal server error",
        });
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: "Internal server error",
        });
    }
}

export const deleteSubscriptionPlan = async (req, res) => {
    try {
        const { id ,action_name, action_value } = req.query
        let message = "";
        const filter = {};
              if (action_name == "active") filter["is_activated"] = action_value;

              if (action_name == "delete") filter["is_deleted"] = action_value;
        
              if (action_name == "active") {
                let result = await SubscriptionPlan.updateOne({ _id: id }, filter, {
                  new: true,
                }).exec();
        
                    if (action_value == "true") {
                        message = "Plan activated successfully";
                    } else {
                        message = "Successfully deactivated the subscription plan";
                    }
 
                  return sendResponse(req, res, 200, {
                        status: true,
                        body: result,
                        message: message,
                        errorCode: null,
                    });
              }

        const headers = {
            Authorization: req.headers["authorization"],
        };
        let getSubscriptionPlan = await SubscriptionPlan.findById(id);
        if (!getSubscriptionPlan) {
            return sendResponse(req, res, 500, {
                status: false,
                body: null,
                message: "No subscription plan available",
                errorCode: null,
            });
        }

        //Get all subscription which associated with patient
        let getData = await httpService.getStaging(
            "patient/get-all-patient-having-subscription",
            {},
            headers,
            "patientServiceUrl"
        );
        const ids = []
        if (getData.status) {
            for (const ele of getData.data) {
                if(!ids.includes(ele.subscriptionDetails.nextBillingPlanId)) {
                    ids.push(ele.subscriptionDetails.nextBillingPlanId)
                }
                if(!ids.includes(ele.subscriptionDetails.subscriptionPlanId)) {
                    ids.push(ele.subscriptionDetails.subscriptionPlanId)
                }
            }
        }

        if (ids.includes(id)) {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "Cannot delete! The subscription plan is already associated with a patient",
                errorCode: null,
            });
        }

        await SubscriptionPlan.findOneAndUpdate(
            {
                _id:id
            },
            { is_deleted: true },
        );

        return sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: "Subscription plan deleted successfully.",
            errorCode: null,
        });
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: "Internal server error",
        });
    }
}

export const setMaximumRequest = async (req, res) => {
    try {
        let { userId, pharmacy, hospital_doctor, individual_doctor, patient, dental, optical, labimg,para,createdBy } = req.body

        let checkUser = await Superadmin.findOne({ _id: mongoose.Types.ObjectId(userId) });

        if (checkUser.role === 'STAFF_USER') {
            let userFind = await PortalUser.findOne({ superadmin_id: mongoose.Types.ObjectId(userId) });
            userId = userFind?.for_staff;
        }

        const checkDataExists = await MaximumRequest.find({ superadmin_id: userId })
        let result
        if (checkDataExists.length > 0) {
            result = await MaximumRequest.findOneAndUpdate(
                { superadmin_id: { $eq: userId } },
                {
                    $set: {
                        pharmacy,
                        hospital_doctor,
                        individual_doctor,
                        patient,
                        dental, 
                        optical, 
                        labimg,
                        para
                    }
                }
            )
        } else {
            const newRequest = new MaximumRequest({
                pharmacy,
                hospital_doctor,
                individual_doctor,
                patient,
                dental, 
                optical, 
                labimg,
                para,
                superadmin_id: userId,
                createdBy: createdBy
            })
            result = await newRequest.save()
        }
        return sendResponse(req, res, 200, {
            status: true,
            body: result,
            message: "successfully set maximum request",
            errorCode: null,
        });
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "failed to set maximum request",
            errorCode: "Internal server error",
        });
    }
}
export const getMaximumRequest = async (req, res) => {
    try {
        let { userId } = req.query

        let checkUser = await Superadmin.findOne({ _id: mongoose.Types.ObjectId(userId) });

        if (checkUser.role === 'STAFF_USER') {
            let userFind = await PortalUser.findOne({ superadmin_id: mongoose.Types.ObjectId(userId) });
            userId = userFind?.for_staff;
        }

        const checkDataExists = await MaximumRequest.find({ superadmin_id: userId })
        if (checkDataExists.length > 0) {
            return sendResponse(req, res, 200, {
                status: true,
                body: checkDataExists,
                message: "successfully get maximum request",
                errorCode: null,
            });
        } else {
            return sendResponse(req, res, 200, {
                status: true,
                body: null,
                message: "No record found",
                errorCode: null,
            });
        }
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "failed to get maximum request",
            errorCode: "Internal server error",
        });
    }
}
export const getLocationName = async (req, res) => {
    try {
        const { _id, country, region, province, department, city, village, address, neighborhood, pincode } = req.body.location
        const countryName = country != '' ? (await Country.findById(country).select('name').exec()) : '';
        const regionName = region != '' ? (await Region.findById(region).select('name').exec()) : '';
        const provinceName = province != '' ? (await Province.findById(province).select('name').exec()) : '';
        const departmentName = department != '' ? (await Department.findById(department).select('name').exec()) : "";
        const cityName = city != '' ? (await City.findById(city).select('name').exec()) : '';
        const villageName = village != '' ? (await Village.findById(village).select('name').exec()) : '';

        const location = { _id, countryName, regionName, provinceName, departmentName, cityName, villageName, address, neighborhood, pincode }

        return sendResponse(req, res, 200, {
            status: true,
            body: location,
            message: "location name fetched successfully",
            errorCode: null,
        });
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Something went wrong fetching location name",
            errorCode: "Internal server error",
        });
    }
}

export const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body
        if (refreshToken == "") {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "The refresh token is required",
                errorCode: null,
            });
        }
        jwt.verify(refreshToken, secret.JWT, (err, decoded) => {
            if (err) {
                return sendResponse(req, res, 200, {
                    status: false,
                    body: null,
                    message: "The refresh token is not valid",
                    errorCode: null,
                });
            } else {
                const tokenData = {
                    _id: decoded.data._id,
                    email: decoded.data.email,
                    role: decoded.data.role,
                    uuid: decoded.data.uuid
                }
                return sendResponse(req, res, 200, {
                    status: true,
                    body: {
                        token: generateToken(tokenData),
                        refreshToken: generateRefreshToken(tokenData),
                    },
                    message: "Generated new token and refresh token",
                    errorCode: null,
                });
            }
        })
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Something went wrong",
            errorCode: "Internal server error",
        });
    }
}

export const getSelectedMasterData = async (req, res) => {
    try {
        const { speciality } = req.body
        let resultArray = {}
        if (speciality.length > 0) {
            let specialityArry = speciality.map(val => mongoose.Types.ObjectId(val))
            const specialityData = await Speciality.find({ _id: { $in: specialityArry } }).select({ specilization: 1 })
            let specialityObject = {}
            for (const value of specialityData) {
                specialityObject[value._id] = value.specilization
            }
            resultArray.speciality = specialityData
            resultArray.specialityObject = specialityObject
        }
        return sendResponse(req, res, 200, {
            status: true,
            body: { result: resultArray },
            message: "master data fetched successfully",
            errorCode: null,
        });
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: error.message ? error.message : "Something went wrong fetching master details",
            errorCode: error.code ? error.code : "Internal server error",
        });
    }
}
export const addOrUpdateAppointmentCommission = async (req, res) => {
    try {
        const { type, online, home_visit, face_to_face, for_user, createdBy } = req.body
        const checkExist = await AppointmentCommission.find({ type })
        if (checkExist.length > 0) {
            await AppointmentCommission.findOneAndUpdate({ _id: { $eq: checkExist[0]._id } }, {
                $set: {
                    online,
                    home_visit,
                    face_to_face
                }
            }, { new: true }).exec();
        } else {
            const result = new AppointmentCommission({
                type,
                online,
                home_visit,
                face_to_face,
                for_user,
                createdBy
            })
            await result.save()
        }
        return sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: `commission data ${checkExist.length > 0 ? 'updated' : 'added'} successfully`,
            errorCode: null,
        });
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: error.message ? error.message : "Something went wrong",
            errorCode: error.code ? error.code : "Internal server error",
        });
    }
}
export const getAppointmentCommission = async (req, res) => {
    try {
        let { for_user } = req.query

        let checkUser = await Superadmin.findOne({ _id: mongoose.Types.ObjectId(for_user) });

        if (checkUser.role === 'STAFF_USER') {
            let userFind = await PortalUser.findOne({ superadmin_id: mongoose.Types.ObjectId(for_user) });
            for_user = userFind?.for_staff;
        }

        const checkExist = await AppointmentCommission.find({ for_user: { $eq: for_user } })

        return sendResponse(req, res, 200, {
            status: true,
            body: checkExist,
            message: `commission data fetched successfully`,
            errorCode: null,
        });
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: error.message ? error.message : "Something went wrong",
            errorCode: error.code ? error.code : "Internal server error",
        });
    }
}

export const gettotalMonthWiseforSuperAdmingraph = async (req, res) => {
    try {

        const { createdDate, updatedDate } = req.query
        const headers = {
            'Authorization': req.headers['authorization']
        }
        let patientData = await httpService.getStaging('payment/patient-getplanPriceMonthWise', { createdDate, updatedDate }, headers, 'patientServiceUrl');
        let pharmacyData = await httpService.getStaging('payment/pharmacy-getplanPriceMonthWise', { createdDate, updatedDate }, headers, 'pharmacyServiceUrl');
        let hospitalData = await httpService.getStaging('payment/hospital-getplanPriceMonthWise', { createdDate, updatedDate }, headers, 'hospitalServiceUrl');


        const allsubscriptionArray = Object.keys(patientData.body.subscriptionArray).reduce((result, month) => {
            result[month] = patientData.body.subscriptionArray[month] +
                pharmacyData.body.subscriptionArray[month] +
                hospitalData.body.subscriptionArray[month];
            return result;
        }, {});

        const allcommisionArray = Object.keys(patientData.body.commissionArray).reduce((result, month) => {
            result[month] = patientData.body.commissionArray[month] +
                pharmacyData.body.commissionArray[month] +
                hospitalData.body.commissionArray[month];
            return result;
        }, {});
        const alltotalTransaction = Object.keys(patientData.body.totalTransaction).reduce((result, month) => {
            result[month] = patientData.body.totalTransaction[month] +
                pharmacyData.body.totalTransaction[month] +
                hospitalData.body.totalTransaction[month];
            return result;
        }, {});



        return sendResponse(req, res, 200, {
            status: true,
            body: { allsubscriptionArray, allcommisionArray, alltotalTransaction },
            message: `All graph data fetched successfully`,
            errorCode: null,
        });
    } catch (error) {
        
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: error.message ? error.message : "Something went wrong",
            errorCode: error.code ? error.code : "Internal server error",
        });
    }
}
export const getallplanPriceforSuperAdmin = async (req, res) => {
    try {
        const { createdDate, updatedDate } = req.query

        const headers = {
            'Authorization': req.headers['authorization']
        }
        let totalcommisionamount = 0;
        let totalsubscriptionamount = 0;
        let totalnumber = 0;



        let sumOfPatient = await httpService.getStaging('payment/patient-getallplanPrice', { createdDate, updatedDate }, headers, 'patientServiceUrl');
        if (sumOfPatient.status == true) {
            totalsubscriptionamount += parseInt(sumOfPatient.body.totalPlanPrice)
            totalcommisionamount += parseInt(sumOfPatient.body.commission)
            totalnumber += parseInt(sumOfPatient.body.totalnumber)

        }
        let sumOfHospital = await httpService.getStaging('payment/hospital-getallplanPrice', { createdDate, updatedDate }, headers, 'hospitalServiceUrl');
        if (sumOfHospital.status == true) {
            totalsubscriptionamount += parseInt(sumOfHospital.body.totalPlanPrice)
            totalcommisionamount += parseInt(sumOfHospital.body.commission)
            totalnumber += parseInt(sumOfHospital.body.totalnumber)

        }
        let sumOfpharmacy = await httpService.getStaging('payment/pharmacy-getallplanPrice', { createdDate, updatedDate }, headers, 'pharmacyServiceUrl');
        if (sumOfpharmacy.status == true) {
            totalsubscriptionamount += parseInt(sumOfpharmacy.body.totalPlanPrice)
            totalcommisionamount += parseInt(sumOfpharmacy.body.commission)
            totalnumber += parseInt(sumOfpharmacy.body.totalnumber)

        }


        return sendResponse(req, res, 200, {
            status: true,
            body: { totalcommisionamount, totalsubscriptionamount, totalnumber },
            message: `All subscription plan price fetched successfully`,
            errorCode: null,
        });
    } catch (error) {
        
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: error.message ? error.message : "Something went wrong",
            errorCode: error.code ? error.code : "Internal server error",
        });
    }
}

export const sendInvitation = async (req, res) => {
    try {
        const {
            first_name,
            middle_name,
            last_name,
            email,
            phone,
            address,
            created_By,
            addedBy,
            invitationId
        } = req.body;

        if (invitationId) {
            // Update the existing record
            const updatedUserData = await Invitation.findOneAndUpdate(
                { _id: invitationId },
                {
                    $set: {
                        first_name,
                        middle_name,
                        last_name,
                        email,
                        phone,
                        address,
                        created_By,
                        verify_status: "PENDING",

                    }
                },
                { new: true }
            );

            if (updatedUserData) {
                const loggedInData = await Superadmin.find({ _id: created_By });
                const loggeInname = loggedInData[0].fullName;
                const content = sendMailInvitations(email, first_name, last_name, loggeInname);
                const mailSent = await sendEmail(content);

                if (mailSent) {
                    updatedUserData.verify_status = "SEND";
                    await updatedUserData.save();
                }

                return sendResponse(req, res, 200, {
                    status: true,
                    data: updatedUserData,
                    message: `Invitation updated and sent successfully`,
                    errorCode: null,
                });
            } else {
                return sendResponse(req, res, 404, {
                    status: false,
                    data: null,
                    message: `Invitation with ID ${invitationId} not found`,
                    errorCode: "NOT_FOUND",
                });
            }
        } else {
            // Create a new record
            let userData = await Invitation.findOne({ email, verify_status: "PENDING" });

            if (!userData) {
                userData = new Invitation({
                    first_name,
                    middle_name,
                    last_name,
                    email,
                    phone,
                    address,
                    created_By,
                    addedBy,
                    verify_status: "PENDING"
                });
                userData = await userData.save();
            }

            const loggedInData = await Superadmin.find({ _id: created_By });
            const loggeInname = loggedInData[0].fullName;
            const content = sendMailInvitations(email, first_name, last_name, loggeInname);
            const mailSent = await sendEmail(content);

            if (mailSent) {
                userData.verify_status = "SEND";
                await userData.save();
            }

            if (userData) {
                return sendResponse(req, res, 200, {
                    status: true,
                    data: userData,
                    message: `Invitation sent successfully`,
                    errorCode: null,
                });
            } else {
                return sendResponse(req, res, 200, {
                    status: false,
                    data: null,
                    message: `Invitation Send successfully`,
                    errorCode: null,
                });
            }
        }
    } catch (err) {
        
        return sendResponse(req, res, 500, {
            status: false,
            data: err,
            message: `Failed to send invitation`,
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
};
export const getAllInvitation = async (req, res) => {
    try {
        let { for_portal_user, page, limit, searchKey, createdDate, updatedDate } = req.query;

        let checkUser = await Superadmin.findOne({ _id: mongoose.Types.ObjectId(for_portal_user) });

        if (checkUser.role === 'STAFF_USER') {
            let userFind = await PortalUser.findOne({ superadmin_id: mongoose.Types.ObjectId(for_portal_user) });
            for_portal_user = userFind?.for_staff;
        }


        let sort = req.query.sort
        let sortingarray = {};
        if (sort != 'undefined' && sort != '' && sort != undefined) {
            let keynew = sort.split(":")[0];
            let value = sort.split(":")[1];
            sortingarray[keynew] = value;
        } else {
            sortingarray['createdAt'] = -1;
        }
        const filter = {};

        if (searchKey && searchKey !== "") {
            filter.$or = [
                { first_name: { $regex: searchKey } },
            ];
        }

        let dateFilter = {}
        if (createdDate && createdDate !== "" && updatedDate && updatedDate !== "") {
            const createdDateObj = new Date(createdDate);
            const updatedDateObj = new Date(updatedDate);
            dateFilter.createdAt = { $gte: createdDateObj, $lte: updatedDateObj };
        }
        else if (createdDate && createdDate !== "") {
            const createdDateObj = new Date(createdDate);
            dateFilter.createdAt = { $gte: createdDateObj };
        }
        else if (updatedDate && updatedDate !== "") {
            const updatedDateObj = new Date(updatedDate);
            dateFilter.createdAt = { $lte: updatedDateObj };
        }

        const listdata = await Invitation.find({
            created_By: for_portal_user,
            ...filter,
            ...dateFilter,
        })
            .sort(sortingarray)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Invitation.countDocuments({});

        return sendResponse(req, res, 200, {
            status: true,
            body: {
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                totalRecords: count,
                listdata,
            },
            message: `List Fetch successfully`,
            errorCode: null,
        });
    } catch (err) {
        
        return sendResponse(req, res, 500, {
            status: false,
            data: err,
            message: `Failed to fetch list`,
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
}

export const getInvitationById = async (req, res) => {
    try {
        const { id } = req.query;
        const result = await Invitation.findOne({ _id: mongoose.Types.ObjectId(id) })

        sendResponse(req, res, 200, {
            status: true,
            data: result,
            message: `Invitation Send successfully`,
            errorCode: null,
        })

    } catch (err) {
        
        sendResponse(req, res, 500, {
            status: false,
            data: err,
            message: `Failed to fetch list`,
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
}

export const deleteInvitation = async (req, res) => {
    try {
        const { id } = req.body;
        const result = await Invitation.deleteOne({ _id: mongoose.Types.ObjectId(id) })

        sendResponse(req, res, 200, {
            status: true,
            data: result,
            message: `Invitation Deleted successfully`,
            errorCode: null,
        })

    } catch (err) {
        
        sendResponse(req, res, 500, {
            status: false,
            data: err,
            message: `failed to delete invitation`,
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
}

export const getallPaymentHistory = async (req, res) => {
    try {
        const allowedPortals = ["PHARMACY_ADMIN", "PATIENT", "INDIVIDUAL_DOCTOR", "INDIVIDUAL"];
        const { limit, page, createdDate, updatedDate, order_type, portal, searchText } = req.query;

        let sort = req.query.sort
        let keynew = '';
        let value = '';
        let sortingarray = {};
        if (sort != 'undefined' && sort != '' && sort != undefined) {
            keynew = sort.split(":")[0];
            value = sort.split(":")[1];
            sortingarray[keynew] = value;
        } else {
            sortingarray['createdAt'] = -1;

        }
        const headers = {
            'Authorization': req.headers['authorization']
        }
        let totalRecords = 0;
        let totalAmount = 0;
        let list = [];

        let patientPayment = await httpService.getStaging('payment/patient-getPaymentHistory', { createdDate, updatedDate, order_type, searchText }, headers, 'patientServiceUrl');
        if (patientPayment.status == true) {
            list.push(patientPayment.body.paytransactions)
            totalRecords += parseInt(patientPayment.body.totalCount)
            totalAmount += parseInt(patientPayment.body.totalAmount)


        }
        let pharmacyPayment = await httpService.getStaging('payment/pharmacy-getPaymentHistory', { createdDate, updatedDate, order_type, searchText }, headers, 'pharmacyServiceUrl');
        if (pharmacyPayment.status == true) {
            list.push(pharmacyPayment.body.paytransactions)
            totalRecords += parseInt(pharmacyPayment.body.totalCount)
            totalAmount += parseInt(pharmacyPayment.body.totalAmount)

        }
        let individualdoctorPayment = await httpService.getStaging('payment/hospital-getPaymentHistory', { createdDate, updatedDate, order_type, searchText }, headers, 'hospitalServiceUrl');
        if (individualdoctorPayment.status == true) {
            list.push(individualdoctorPayment.body.paytransactions)
            totalRecords += parseInt(individualdoctorPayment.body.totalCount)
            totalAmount += parseInt(individualdoctorPayment.body.totalAmount)

        }

        let hospitalPayment = await httpService.getStaging('payment/hospital-getPaymentHistory_Hospital', { createdDate, updatedDate, order_type, searchText }, headers, 'hospitalServiceUrl');
        if (hospitalPayment.status == true) {
            list.push(hospitalPayment.body.paytransactions)
            totalRecords += parseInt(hospitalPayment.body.totalCount)
            totalAmount += parseInt(hospitalPayment.body.totalAmount)

        }

        let labradio = await httpService.getStaging('payment/four-portal-getPaymentHistory_four-portal', { createdDate, updatedDate, order_type, searchText }, headers, 'labradioServiceUrl');

        if (labradio.status == true) {
            list.push(labradio.body.paytransactions)
            totalRecords += parseInt(labradio.body.totalCount)
            totalAmount += parseInt(labradio.body.totalAmount)

        }
        list = list.flat();


        if (portal !== undefined && allowedPortals.includes(portal)) {
            list = list.filter(item => item.paymentBy === portal);
        }

        if (keynew == 'createdAt') {
            if (value == 'asc') {
                list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            } else {
                list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            }
        }

        if (keynew == 'Name') {
            if (value == 'asc') {
                list.sort((a, b) => {
                    if (a.Name < b.Name) return -1;
                    if (a.Name > b.Name) return 1;
                    return 0;
                });

            } else {
                list.sort((a, b) => {
                    if (a.Name > b.Name) return -1;
                    if (a.Name < b.Name) return 1;
                    return 0;
                });
            }
        }

        if (keynew == 'paymentBy') {
            if (value == 'asc') {
                list.sort((a, b) => {
                    if (a.paymentBy < b.paymentBy) return -1;
                    if (a.paymentBy > b.paymentBy) return 1;
                    return 0;
                });

            } else {
                list.sort((a, b) => {
                    if (a.paymentBy > b.paymentBy) return -1;
                    if (a.paymentBy < b.paymentBy) return 1;
                    return 0;
                });
            }
        }

        if (keynew == 'paymentType') {
            if (value == 'asc') {
                list.sort((a, b) => {
                    if (a.paymentType < b.paymentType) return -1;
                    if (a.paymentType > b.paymentType) return 1;
                    return 0;
                });

            } else {
                list.sort((a, b) => {
                    if (a.paymentType > b.paymentType) return -1;
                    if (a.paymentType < b.paymentType) return 1;
                    return 0;
                });
            }
        }


        if (keynew == 'Amount') {
            if (value == 'asc') {
                list.sort((a, b) => parseInt(a.Amount) - parseInt(b.Amount));

            } else {
                list.sort((a, b) => parseInt(b.Amount) - parseInt(a.Amount));

            }
        }

        if (keynew == 'payment_mode') {
            if (value == 'asc') {
                list.sort((a, b) => {
                    if (a.payment_mode < b.payment_mode) return -1;
                    if (a.payment_mode > b.payment_mode) return 1;
                    return 0;
                });

            } else {
                list.sort((a, b) => {
                    if (a.payment_mode > b.payment_mode) return -1;
                    if (a.payment_mode < b.payment_mode) return 1;
                    return 0;
                });
            }
        }

        if (keynew == 'transaction_id') {
            if (value == 'asc') {
                list.sort((a, b) => {
                    if (a.transaction_id < b.transaction_id) return -1;
                    if (a.transaction_id > b.transaction_id) return 1;
                    return 0;
                });

            } else {
                list.sort((a, b) => {
                    if (a.transaction_id > b.transaction_id) return -1;
                    if (a.transaction_id < b.transaction_id) return 1;
                    return 0;
                });
            }
        }


        let skip = (page - 1) * limit
        let start_index;
        if (skip == 0) {
            start_index = skip
        } else {
            start_index = skip;
        }

        const end_index = parseInt(limit) + parseInt(skip);
        const result = list.slice(start_index, end_index);

        sendResponse(req, res, 200, {
            status: true,
            body: {
                totalPages: Math.ceil(totalRecords / limit),
                currentPage: page,
                totalRecords: totalRecords,
                result, totalAmount
            },

            message: `Payment history list fetched successfully`,
            errorCode: null,
        });
    } catch (error) {
        
        sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: error.message ? error.message : "Something went wrong",
            errorCode: error.code ? error.code : "Internal server error",
        });
    }
}



export const changePassword = async (req, res) => {
    const { id, old_password, new_password } = req.body;

    if (old_password === new_password) {
        return sendResponse(req, res, 200, {
            status: false,
            body: null,
            message: "New password shouldn't be same as old password.",
            errorCode: "PASSWORD_MATCHED",
        });
    }
    try {
        const findUser = await Superadmin.findOne({ _id: id });
        const isPasswordOldMatch = await checkPassword(old_password, findUser);
        if (!isPasswordOldMatch) {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "Incorrect Old Password.",
                errorCode: null,
            });
        }

        const isPasswordMatch = await checkPassword(new_password, findUser);
        if (isPasswordMatch) {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "This is your previous password. Please enter a new password.",
                errorCode: null,
            });
        }

        const salt = await bcrypt.genSalt(10);
        let hashPassword = await bcrypt.hash(new_password, salt);
        let changedPassword = await Superadmin.findOneAndUpdate(
            { _id: id },
            { password: hashPassword },
            { new: true }
        );
        return sendResponse(req, res, 200, {
            status: true,
            body: changedPassword,
            message: "Password changed successfully.",
            errorCode: null,
        });
    } catch (error) {
        console.error("An error occurred:", error);
        return sendResponse(req, res, 500, {
            status: false,
            body: null,
            message: "Failed change password. ",
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
}

export const updatelogsData = async (req, res) => {
    const { currentLogID , userAddress } = req.body;
    try {
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString();
        if(userAddress){
            await Logs.findOneAndUpdate(
                { _id: mongoose.Types.ObjectId(currentLogID) },
                {
                    $set: {
                        userAddress: userAddress,
                        
                    },
                },
                { new: true }
            ).exec();
        }else{

            await Logs.findOneAndUpdate(
                { _id: mongoose.Types.ObjectId(currentLogID) },
                {
                    $set: {
                        logoutDateTime: formattedDate,
                        
                    },
                },
                { new: true }
            ).exec();
        }
        return sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: "Update Logs Successfully",
            errorCode: null,
        });
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            data: error,
            message: "Failed",
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
}

export const getAllLogs = async (req, res) => {
    const { userId, limit, page } = req.query
    try {
        let sort = req.query.sort
        let sortingarray = {};
        if (sort != 'undefined' && sort != '' && sort != undefined) {
            let keynew = sort.split(":")[0];
            let value = sort.split(":")[1];
            sortingarray[keynew] = value;
        } else {
            sortingarray['createdAt'] = -1;
        }
        let filter = {}

        filter = { userId: mongoose.Types.ObjectId(userId) }

        const userData = await Logs.find(filter)
            .sort(sortingarray)
            .skip((page - 1) * limit)
            .limit(limit * 1)
            .exec();

        const count = await Logs.countDocuments(filter)
        if (userData) {
            return sendResponse(req, res, 200, {
                status: true,
                body: {
                    count,
                    userData
                },
                message: "Update Log Successfully",
                errorCode: null,
            });
        } else {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "User Not Found!!",
                errorCode: null,
            });
        }

    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            data: error,
            message: "Failed",
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
}

export const getSuperAdminData = async (req, res) => {
    try {
        const superAdminData = await Superadmin.findOne({role:"superadmin"});

        if (superAdminData) {
            return sendResponse(req, res, 200, {
                status: true,
                body: superAdminData,
                message: "Data fetch successfully",
                errorCode: null,
            });
        } else {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "Data not fetch successfully",
                errorCode: null,
            });
        }

    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            data: error,
            message: "Failed",
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
}

export const notification = async (req, res) => {
    try {
        const notificationValue = new Notification(req.body);
        let notificationData = await notificationValue.save();

        await httpService.getStaging("pharmacy/sendnoti", { socketuserid: req.body.for_portal_user }, {}, "gatewayServiceUrl");

        return sendResponse(req, res, 200, {
            status: true,
            body: notificationData,
            message: `notification save`,
            errorCode: null,
        });
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: `failed to get reason for appointment list`,
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
}

export const addUserLogs = async (req, res) => {
    try {
        await saveLogs(req.body)

        return sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: `logs added successfully`,
            errorCode: null,
        });
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: `failed to add logs`,
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
}

export const getGeneralSettings = async (req, res) => {
    try {
        const { role } = req.query;

        let getData;

        if (role === 'ALL') {
            getData = await GeneralSettings.find({});
        } else {
            getData = await GeneralSettings.find({ role: role });
        }

        return sendResponse(req, res, 200, {
            status: true,
            body: getData,
            message: `Settings fetched successfully`,
            errorCode: null,
        });
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: `Failed to fetch settings`,
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
}

export const updateGeneralSettings = async (req, res) => {
    try {
        const reqData = req.body;

        const updatePromises = reqData.map(async (item) => {
            const { settingName, settingValue ,enableCallButton} = item;

            return GeneralSettings.findOneAndUpdate(
                { settingName },
                { $set: 
                    {
                     settingValue,
                     enableCallButton 
                    } 
                },
                { new: true } 
            );
        });

        const updatedSettings = await Promise.all(updatePromises);

        return sendResponse(req, res, 200, {
            status: true,
            message: "Settings updated successfully.",
            data: updatedSettings,
        });
        
    } catch (error) {
        console.error("Error updating general settings:", error);
        res.status(500).json({
            status: false,
            message: "Failed to update settings.",
            errorCode: "INTERNAL_SERVER_ERROR",
            error: error.message,
        });
    }
};
const getLabRadioConsultationCount = (query, header) => {
    return new Promise(async (resolve, reject) => {
        const { fromDate, toDate } = query
        let count = {
            labCounsultationcount: 0,
            radiologyCounsultationcount: 0
        }
        const countData = await Promise.all([
            httpService.getStaging('lab-radio/dashboard', { fromDate, toDate, type: 'lab' }, header, 'labradioServiceUrl'),
            httpService.getStaging('lab-radio/dashboard', { fromDate, toDate, type: 'radiology' }, header, 'labradioServiceUrl')
        ])
        if (countData[0]?.status) {
            count.labCounsultationcount = countData[0]?.body?.totalAppointments
        }
        if (countData[1]?.status) {
            count.radiologyCounsultationcount = countData[1]?.body?.totalAppointments
        }
        resolve(count)
    })
}
const getPharmacyOrderCount = (query, header) => {
    return new Promise(async (resolve, reject) => {
        const { fromDate, toDate } = query
        let count = 0
        const getData = await httpService.getStaging('pharmacy/dashboard', { fromDate, toDate }, header, 'pharmacyServiceUrl');
        if (getData?.status) {
            count = getData?.body?.totalOrder
        }
        resolve(count)
    })
}
const getConsultationCount = (query, header) => {
    return new Promise(async (resolve, reject) => {
        const { fromDate, toDate } = query
        let count = 0
        const getData = await httpService.getStaging('individual-doctor/dashboard', { fromDate, toDate }, header, 'doctorServiceUrl');
        if (getData?.status) {
            count = getData?.body?.totalAppointment
        }
        resolve(count)
    })
}
const getPatientCount = (query, header) => {
    return new Promise(async (resolve, reject) => {
        const { fromDate, toDate } = query
        let count = 0
        const getPatient = await httpService.getStaging('patient/get-total-patient-count', { fromDate, toDate }, header, 'patientServiceUrl');
        if (getPatient?.status) {
            count = getPatient?.data
        }
        resolve(count)
    })
}
const getDoctorCount = (query, header) => {
    return new Promise(async (resolve, reject) => {
        const { fromDate, toDate } = query
        let doctorCount = {
            activeCount: 0,
            onlineCount: 0
        }
        const getData = await httpService.getStaging('individual-doctor/get-total-doctor-count', { fromDate, toDate }, header, 'doctorServiceUrl');
        if (getData?.status) {
            doctorCount = getData?.data
        }
        resolve(doctorCount)
    })
}
const getPharmaciesCount = (query, header) => {
    return new Promise(async (resolve, reject) => {
        const { fromDate, toDate } = query
        let count = 0
        const getData = await httpService.getStaging('pharmacy/get-total-pharmacy-count', { fromDate, toDate }, header, 'pharmacyServiceUrl');
        if (getData?.status) {
            count = getData?.data
        }
        resolve(count)
    })
}
const getLabRadioCount = (query, header) => {
    return new Promise(async (resolve, reject) => {
        const { fromDate, toDate } = query
        let count = {
            totalLaboratory: 0,
            totalRadiology: 0
        }
        const getData = await httpService.getStaging('lab-radio/get-total-labradio-count', { fromDate, toDate }, header, 'labradioServiceUrl');
        if (getData?.status) {
            count = getData?.data
        }
        resolve(count)
    })
}

export const getDashboardData = async (req, res) => {
    try {
        const headers = {
            'Authorization': req.headers['authorization']
        }
        const getTotalPatient = getPatientCount(req.query, headers)
        const getTotalDoctor = getDoctorCount(req.query, headers)
        const getTotalPharmacies = getPharmaciesCount(req.query, headers)
        const getTotalLabRadio = getLabRadioCount(req.query, headers)

        const allCount = await Promise.all([getTotalPatient, getTotalDoctor, getTotalPharmacies, getTotalLabRadio])
        
        return sendResponse(req, res, 200, {
            status: true,
            message: `Dashboard data fetched successfully`,
            body: {
                totalPatient: allCount[0],
                totalActiveDoctor: allCount[1]?.activeCount,
                totalOnlineDoctor: allCount[1]?.onlineCount,
                totalPharmacies: allCount[2],
                totalLaboratory: allCount[3]?.totalLaboratory,
                totalRadiology: allCount[3]?.totalRadiology,
            },
            errorCode: null,
        });
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: `failed to get dashboard data`,
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
}

export const getPatientRecords = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        
        const header = {
            'Authorization': req.headers['authorization']
        }
        const getPatient = await httpService.getStaging('patient/get-total-patient-records', { fromDate, toDate }, header, 'patientServiceUrl');

        return sendResponse(req, res, 200, {
            status: true,
            message: `Patient data fetched successfully`,
            body: getPatient,
            errorCode: null,
        });
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: `failed to get Patient data`,
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
}

export const getDoctorRecords = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        
        const header = {
            'Authorization': req.headers['authorization']
        }
        const getDoctor = await httpService.getStaging('individual-doctor/get-total-doctor-records', { fromDate, toDate }, header, 'doctorServiceUrl');

        return sendResponse(req, res, 200, {
            status: true,
            message: `Doctor data fetched successfully`,
            body: getDoctor,
            errorCode: null,
        });
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: `failed to get Doctor data`,
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
}

export const getPharmacieRecords = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        
        const header = {
            'Authorization': req.headers['authorization']
        }
        const getPharmacy = await httpService.getStaging('pharmacy/get-total-pharmacy-records', { fromDate, toDate }, header, 'pharmacyServiceUrl');

        return sendResponse(req, res, 200, {
            status: true,
            message: `Pharmacy data fetched successfully`,
            body: getPharmacy,
            errorCode: null,
        });
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: `failed to get Pharmacy data`,
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
}

export const getLaboratoryRecords = async (req, res) => {
    try {        
        const { fromDate, toDate } = req.query;
        
        const header = {
            'Authorization': req.headers['authorization']
        }
        const getLabRadio = await httpService.getStaging('lab-radio/get-total-labradio-records', { fromDate, toDate }, header, 'labradioServiceUrl');        
        const data = {
            totalLaboratory: getLabRadio?.data?.totalLaboratory,
            laboratoryData: getLabRadio?.data?.laboratoryData
        }
        return sendResponse(req, res, 200, {
            status: true,
            message: `Laboratory data fetched successfully`,
            body: data,
            errorCode: null,
        });
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: `failed to get LabRadio data`,
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
}

export const getRadiologyRecords = async (req, res) => {
    try {        
        const { fromDate, toDate } = req.query;
        
        const header = {
            'Authorization': req.headers['authorization']
        }
        const getLabRadio = await httpService.getStaging('lab-radio/get-total-labradio-records', { fromDate, toDate }, header, 'labradioServiceUrl');

        const data = {
            totalLaboratory: getLabRadio?.data?.totalRadiology,
            laboratoryData: getLabRadio?.data?.radiologyData
        }

        return sendResponse(req, res, 200, {
            status: true,
            message: `LabRadio data fetched successfully`,
            body: data,
            errorCode: null,
        });
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: `failed to get LabRadio data`,
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
}

export const getDashboardGraphData = async (req, res) => {
    try {
        const headers = {
            'Authorization': req.headers['authorization']
        }
        const getTotalLabRadioConsultation = getLabRadioConsultationCount(req.query, headers)
        const getTotalPharmacyOrderCount = getPharmacyOrderCount(req.query, headers)
        const getTotalConsultationCount = getConsultationCount(req.query, headers)
        
        const allCount = await Promise.all([getTotalLabRadioConsultation, getTotalPharmacyOrderCount, getTotalConsultationCount])
        
        return sendResponse(req, res, 200, {
            status: true,
            message: `Dashboard data fetched successfully`,
            body: {
                totalLabConsultation: allCount[0]?.labCounsultationcount,
                totalRadiologyConsulation: allCount[0]?.radiologyCounsultationcount,
                totalPharmacyOrder: allCount[1],
                totalDoctorConsultation: allCount[2],
            },
            errorCode: null,
        });
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: `failed to get dashboard data`,
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
}

export const getDoctorPatientRecords = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;

        const header = {
            'Authorization': req.headers['authorization']
        }
        const getTotalConsultation = await httpService.getStaging('individual-doctor/dashboard-records', { fromDate, toDate }, header, 'doctorServiceUrl');        
    
        return sendResponse(req, res, 200, {
            status: true,
            message: `Doctor Patient data fetched successfully`,
            body: getTotalConsultation?.body,
            errorCode: null,
        });
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: `failed to get dashboard data`,
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
}

export const getPharmacyOrderRecords = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;

        const header = {
            'Authorization': req.headers['authorization']
        } 
        const getTotalPharmacyOrder = await httpService.getStaging('pharmacy/dashboard-records', { fromDate, toDate }, header, 'pharmacyServiceUrl');
    
        return sendResponse(req, res, 200, {
            status: true,
            message: `Pharmacy Order data fetched successfully`,
            body: getTotalPharmacyOrder?.body,
            errorCode: null,
        });
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: `failed to get dashboard data`,
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
}

export const getlabRecords = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;

        const header = {
            'Authorization': req.headers['authorization']
        }

        const getTotalLabRadioConsultation = await Promise.all([
            httpService.getStaging('lab-radio/dashboard-records', { fromDate, toDate, type: 'lab' }, header, 'labradioServiceUrl'),
        ])          
            
        return sendResponse(req, res, 200, {
            status: true,
            message: `Lab Radior data fetched successfully`,
            body: getTotalLabRadioConsultation,
            errorCode: null,
        });
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: `failed to get dashboard data`,
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
}

export const getRadioRecords = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;

        const header = {
            'Authorization': req.headers['authorization']
        }

        const getTotalLabRadioConsultation = await Promise.all([
            httpService.getStaging('lab-radio/dashboard-records', { fromDate, toDate, type: 'radiology' }, header, 'labradioServiceUrl')
        ])          
            
        return sendResponse(req, res, 200, {
            status: true,
            message: `Lab Radior data fetched successfully`,
            body: getTotalLabRadioConsultation,
            errorCode: null,
        });
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: `failed to get dashboard data`,
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
}

export const createAdminProfile = async (req, res) => {
    try {
      const { fullName, mobile, country_code, email, password } = req.body;
      const superAdminData = await Superadmin.findOne({ email:email.toLowerCase(), isDeleted: false }).lean();
      if (superAdminData) {
        return sendResponse(req, res, 200, {
            status: false,
            body: null,
            message: "User already exist",
            errorCode: null,
        });
      }
      const salt = await bcrypt.genSalt(10);
      let newPassword = await bcrypt.hash(password, salt);
  
      let userData = new Superadmin({
        fullName,
        email,
        country_code,
        mobile,
        password: newPassword,
        role: "superadmin"
      });
      let userDetails = await userData.save();
        const content = {
            subject:"SuperAdmin Created Successfully",
            body: "Hey user from now u are a Superadmin",
        };
        await sendEmail(content,userData.email);
        const text = "Hey User from Now You Are SuperAdmin Check Your Email for credentials ";
        const mobileNumber = `${userData.country_code}${userData.mobile}`;
        await sendSms(mobileNumber,text);


      return sendResponse(req, res, 200, {  
        status: true,
        body: userDetails,
        message: "Registration Successfully!",
        errorCode: null,  
      });
    } catch (error) {
        console.log("Error wwhile create admin profile:", error);
        return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Internal server error",
        errorCode: null,
      });
    }
  }

  export const allAdminProfileList = async (req, res) => {
    try {
        const { page, limit, searchText, status, sort, fromDate, toDate, userId } = req.query;

        let search_filter = [{}];
        if (searchText) {
            search_filter = [
                { fullName: { $regex: searchText || '', $options: "i" } },
                { email: { $regex: searchText || '', $options: "i" } },
                { mobile: { $regex: searchText || '', $options: "i" } }
            ];
        }

        let match = {
            isDeleted: false,
            role: 'superadmin',
            $or: search_filter
        };

        if (status && status !== 'all') {
            match.status = status;
        }

        if (userId) {
            match._id = { $ne: mongoose.Types.ObjectId(userId) }; // Exclude the user with given userId
        }

        let fieldName = 'fullName';
        let sortOrder = '-1';
        if (sort) {
            fieldName = sort.split(':')[0];
            sortOrder = sort.split(':')[1];
        }

        if (fromDate && toDate) {
            const fromDateObj = new Date(`${fromDate} 00:00:00`);
            const toDateObj = new Date(`${toDate} 23:59:59`);
            match['$and'] = [
                { createdAt: { $gte: fromDateObj, $lte: toDateObj } }
            ];
        }

        const pipeline = [
            {
                $match: match
            },
            {
                $group: {
                    _id: "$_id",
                    fullName: { $first: "$fullName" },
                    email: { $first: "$email" },
                    mobile: { $first: "$mobile" },
                    country_code: { $first: "$country_code" },
                    isLocked: { $first: "$isLocked" }
                }
            },
            {
                $sort: {
                    [fieldName]: parseInt(sortOrder)
                }
            },
            {
                $facet: {
                    totalCount: [{ $count: 'count' }],
                    paginatedResults: limit != 0 ? [
                        { $skip: searchText ? 0 : (page - 1) * limit },
                        { $limit: limit * 1 }
                    ] : [{ $skip: 0 }]
                }
            }
        ];

        const result = await Superadmin.aggregate(pipeline);
        let totalCount = result[0].totalCount.length > 0 ? result[0].totalCount[0].count : 0;

        return sendResponse(req, res, 200, {
            status: true,
            message: "Admin list fetched successfully",
            body: {
                totalPages: limit != 0 ? Math.ceil(totalCount / limit) : 1,
                currentPage: page,
                totalRecords: totalCount,
                result: result[0].paginatedResults
            },
            errorCode: null,
        });
    } catch (error) {
        console.log("error___",error);
        
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: null,
        });
    }
};

export const deteleLockAdminUser = async (req, res) => {
    try {
      const { action_name, action_value, userId } = req.body;
      let key;
      key =
        action_name === "delete"
          ? "isDeleted"
          : action_name === "lock"
          ? "isLocked"
          : action_name === "active"
          ? "isActive"
          : "";
      if (key) {
        await Superadmin.findOneAndUpdate(
          { _id: { $eq: userId } },
          {
            $set: {
              [key]: action_value,
            },
          },
          { new: true }
        );
        let actionMessage;
        if (action_name === "active" && action_value) {
          actionMessage = "activated";
        } else if (action_name === "active" && !action_value) {
          actionMessage = "deactivated";
        }
        if (action_name === "delete" && action_value) {
          actionMessage = "deleted";
        }
        if (action_name === "lock" && action_value) {
          actionMessage = "locked";
        } else if (action_name === "lock" && !action_value) {
          actionMessage = "unlocked";
        }
        return sendResponse(req, res, 200, {
          status: true,
          data: null,
          message: `User ${actionMessage} successfully!`,
          errorCode: null,
        });
      } else {
        return sendResponse(req, res, 500, {
          status: false,
          data: null,
          message: `Something went wrong`,
          errorCode: "INTERNAL_SERVER_ERROR",
        });
      }
    } catch (error) {
      console.log("error__", error);
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Internal server error",
        errorCode: null,
      });
    }
  };
  


  
  export const getLatestPatientLogin = async (req, res) => {
    try {
        const { patientId, date } = req.query;
        
        // Check if neither patientId nor date is provided
        if (!patientId && !date) {
            return sendResponse(req, res, 400, {
                status: false,
                data: null,
                message: "Either Patient ID or Date is required",
                errorCode: "BAD_REQUEST",
            });
        }

        let query = {
            role: "patient",
            action: "login"
        };

        // If date is provided, prioritize date over patientId
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            
            query.timestamp = {
                $gte: startDate,
                $lte: endDate
            };
        } 
        // If no date but patientId is provided
        else if (patientId) {
            try {
                const objectId = new mongoose.Types.ObjectId(patientId);
                query.userId = objectId;
            } catch (error) {
                console.error("An error occurred:", error);
                return sendResponse(req, res, 400, {
                    status: false,
                    data: null,
                    message: "Invalid Patient ID format",
                    errorCode: "BAD_REQUEST",
                });
            }
        }

        const latestLogin = await Logs.findOne(query)
            .sort({ timestamp: -1 })
            .select("userId userName role action timestamp ipAddress metadata");

        if (!latestLogin) {
            const message = date 
                ? "No login records found for the specified date" 
                : "No login record found for this patient";
                
            return sendResponse(req, res, 404, {
                status: false,
                data: null,
                message: message,
                errorCode: "NOT_FOUND",
            });
        }

        const payload = {
            userId: latestLogin.userId,
            userName: latestLogin.userName,
            role: latestLogin.role,
            action: latestLogin.action,
            lastLoginTime: latestLogin.timestamp,
            ipAddress: latestLogin.ipAddress || "N/A",
            metadata: latestLogin.metadata || {},
        };

        const successMessage = date 
            ? "Latest patient login for the specified date retrieved successfully" 
            : "Latest patient login retrieved successfully";

        return sendResponse(req, res, 200, {
            status: true,
            data: payload,
            message: successMessage,
            errorCode: null,
        });
    } catch (error) {
        console.log("Error : ", error.message);
        console.error("Error fetching latest login:", error);
        return sendResponse(req, res, 500, {
            status: false,
            data: null,
            message: "Internal server error",
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
};
  




