"use strict";

// models
import PortalUser from "../models/portal_user";
import AdminInfo from "../models/admin_info";
import StaffInfo from "../models/staff_info";
import LocationInfo from "../models/location_info";
import ResetPasswordHistory from "../models/reset_password_history";
import Otp2fa from "../models/otp2fa";
import ReviewAndRating from "../models/review"
// utils
import { sendResponse, createSession } from "../helpers/transmission";
import { hashPassword } from "../helpers/string";
import { sendEmail } from "../helpers/ses";
import { config, generate4DigitOTP, smsTemplateOTP } from "../config/constants";
const { OTP_EXPIRATION, OTP_LIMIT_EXCEED_WITHIN, OTP_TRY_AFTER, SEND_ATTEMPTS, test_p_FRONTEND_URL, LOGIN_AFTER, PASSWORD_ATTEMPTS, TIMEZONE, NODE_ENV } = config
import { sendSms } from "../middleware/sendSms";
import {
    generateRefreshToken,
    generateToken,
    checkPassword
} from "../middleware/utils";
import mongoose from "mongoose";
import Http from "../helpers/httpservice"
import crypto from "crypto"
import OrderDetail from "../models/order/order_detail";
const httpService = new Http()
import Notification from "../models/Chat/Notification";
import Logs from "../models/logs";
import { notification, sendNotification } from "../helpers/notification";
import { generateSignedUrl } from "../helpers/gcs";

const canSendOtp = (deviceExist, currentTime) => {
    return new Promise((resolve) => {
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
class PharmacyController {
    async signup(req, res) {
        try {
            const { email, password, phone_number, first_name, middle_name, last_name, pharmacy_name, country_code } =
                req.body;
            const passwordHash = await hashPassword(password);
            let userData
            let adminData
            const createdBySuperAdmin = await PortalUser.findOne({ email, createdBy: "super-admin" }).lean();
            if (createdBySuperAdmin) {
                userData = await PortalUser.findOneAndUpdate(
                    { _id: createdBySuperAdmin._id },
                    {
                        $set: {
                            password: passwordHash,
                            phone_number,
                            country_code,
                            user_name: first_name + " " + middle_name + " " + last_name,
                            first_name,
                            middle_name,
                            last_name,
                            createdBy: "self"
                        }
                    },
                    { new: true }).exec();
                adminData = await AdminInfo.findOneAndUpdate(
                    { _id: createdBySuperAdmin._id },
                    {
                        $set: {
                            pharmacy_name
                        }
                    },
                    { new: true }).exec();
                return sendResponse(req, res, 200, {
                    status: true,
                    data: {
                        user_details: {
                            portalUserData: userData,
                            adminData
                        }
                    },
                    message: "successfully created pharmacy admin",
                    errorCode: null,
                });
            }

            const portalUserData = await PortalUser.findOne({ email, createdBy: "self", isDeleted: false }).lean();
            if (portalUserData) {
                portalUserData.password = undefined
                return sendResponse(req, res, 200, {
                    status: false,
                    data: {
                        portalUserData
                    },
                    message: "user already exist",
                    errorCode: null,
                });
            }
            const userDetails = new PortalUser({
                email: email,
                user_name: first_name + " " + middle_name + " " + last_name,
                first_name,
                middle_name,
                last_name,
                password: passwordHash,
                phone_number,
                country_code,
                verified: false,
                role: "PHARMACY_ADMIN",
            });
            userData = await userDetails.save();
            const adminDetails = new AdminInfo({
                pharmacy_name,
                verify_status: "PENDING",
                for_portal_user: userData._id,
            });
            adminData = await adminDetails.save();

            let superadminData = await httpService.getStaging(
                "superadmin/get-super-admin-data",
                {},
                {},
                "superadminServiceUrl"
            );

            let requestData = {
                created_by_type: "pharmacy",
                created_by: userData?._id,
                content: `New Registration From ${userData?.user_name}`,
                url: '',
                for_portal_user: superadminData?.body?._id,
                notitype: "New Registration",
                appointmentId: adminData?._id,
            }

           await notification("superadminServiceUrl", "", requestData)

            sendResponse(req, res, 200, {
                status: true,
                data: {
                    user_details: {
                        portalUserData: userData,
                        adminData
                    }
                },
                message: "successfully created pharmacy admin",
                errorCode: null,
            });
        } catch (error) {
            
            sendResponse(req, res, 500, {
                status: false,
                data: error,
                message: "failed to create pharmacy admin",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;
            const { uuid } = req.headers;

            const portalUserData = await PortalUser.findOne({ email: email.toLowerCase(), isDeleted: false }).lean();

            if (!portalUserData) {
                return sendResponse(req, res, 200, {
                    status: false,
                    body: null,
                    message: "User not found",
                    errorCode: "USER_NOT_FOUND",
                });
            }
            const currentTime = new Date()

            if (req.body.fcmToken != "" || req.body.fcmToken != undefined) {
                await PortalUser.findByIdAndUpdate(
                    portalUserData._id,
                    { $set: { fcmToken: req.body.fcmToken } }
                );
            }

            const isPasswordMatch = await checkPassword(password, portalUserData);
            if (!isPasswordMatch) {
                let data
                if (!portalUserData?.lock_details || portalUserData.lock_details?.passwordAttempts != PASSWORD_ATTEMPTS) {
                  data = await PortalUser.findOneAndUpdate(
                    {_id: portalUserData._id},
                    {$inc: {'lock_details.passwordAttempts': 1}},
                    {new: true}
                  )
                }
                 /** Commented code as client don't want to lock user */
                // if (data?.lock_details?.passwordAttempts == PASSWORD_ATTEMPTS) {
                //   const addMinutes = new Date(currentTime.getTime() + LOGIN_AFTER * 60000);
                //   await PortalUser.findOneAndUpdate(
                //     {_id: portalUserData._id},
                //     { $set: {
                //       lock_user: true,
                //       'lock_details.timestamps': addMinutes,
                //       'lock_details.lockedReason': "Incorrect password attempt",
                //       'lock_details.lockedBy': "pharmacy",
                //     }}
                //   )
                // }
                return sendResponse(req, res, 200, {
                    status: false,
                    body: null,
                    message: "The password is incorrect.",
                    errorCode: "INCORRECT_PASSWORD",
                });
            }
            let isAccountLocked = portalUserData.lock_user;
            const lock_details = portalUserData?.lock_details
            //Unlock pharmacy account if locked by pharmacy itself
            if (portalUserData?.lock_details && portalUserData.lock_details?.lockedBy == 'pharmacy') {
              const getTimestamp = new Date(portalUserData.lock_details?.timestamps)
              if (currentTime.getTime() > getTimestamp.getTime()) {
                await PortalUser.findOneAndUpdate(
                  {_id: portalUserData._id},
                  { 
                    $set: { lock_user: false },
                    $unset: { lock_details: "" }
                  },
                )
                isAccountLocked = false
              }
            }

            if (isAccountLocked) {
                let message = "User account temporarily locked."
                if (lock_details && lock_details?.timestamps && lock_details?.passwordAttempts == PASSWORD_ATTEMPTS) {
                  const timeLeft = new Date(lock_details?.timestamps) - currentTime;
                  message = `User account temporarily locked. Try again after ${Math.ceil(timeLeft / 60000)} minutes.`
                }
                return sendResponse(req, res, 200, {
                    status: false,
                    body: null,
                    message,
                    errorCode: "USER_LOCKED",
                });
            }

            if (portalUserData.isActive === false) {
                return sendResponse(req, res, 200, {
                    status: false,
                    body: null,
                    message: "User temporarily not active",
                    errorCode: "USER_NOT_ACTIVE",
                });
            }

            if (portalUserData.isDeleted === true) {
                return sendResponse(req, res, 200, {
                    status: false,
                    body: null,
                    message: "User deleted successfully.",
                    errorCode: "USER_DELETED",
                });
            }

            const deviceExist = await Otp2fa.findOne({ uuid, for_portal_user: portalUserData._id, verified: true }).lean();
            if (!deviceExist || portalUserData.verified !== true) {
                await PortalUser.findOneAndUpdate(
                    {_id: portalUserData._id},
                    { 
                      $unset: { lock_details: "" }
                    },
                )
                return sendResponse(req, res, 200, {
                    status: true,
                    body: {
                        otp_verified: false,
                        token: null,
                        refreshToken: null,
                        user_details: {
                            portalUserData,
                            // adminData
                        }
                    },
                    message: "OTP verification pending 2fa",
                    errorCode: "VERIFICATION_PENDING",
                });
            }
            let adminData = {}
            if (portalUserData.role == "PHARMACY_ADMIN") {
                // adminData = await AdminInfo.findOne({
                //     for_portal_user: portalUserData._id,

                // }).lean();
                let adminData1 = await AdminInfo.aggregate([
                    {
                        $match: { for_portal_user: portalUserData._id },
                    },
                    {
                        $lookup: {
                            from: "locationinfos",
                            localField: "in_location",
                            foreignField: "_id",
                            as: "locationinfos",
                        },
                    }
                ]);

                if (adminData1.length > 0) {
                    adminData = adminData1[0]
                }

                if (adminData?.locationinfos.length > 0) {
                    try {
                        let locationids = {
                            country_id: adminData?.locationinfos[0]?.nationality,
                            region_id: adminData?.locationinfos[0]?.region,
                            province_id: adminData?.locationinfos[0]?.province,
                            village_id: adminData?.locationinfos[0]?.village,
                            city_id: adminData?.locationinfos[0]?.city,
                            department_id: adminData?.locationinfos[0]?.department,
                        };


                        const locationdata = await httpService.postStaging(
                            "common-api/get-location-name",
                            { locationids: locationids },
                            {},
                            "superadminServiceUrl"
                        );

                        if (locationdata.status) {
                            adminData.locationinfos[0].country = {
                                countryname: locationdata.body.country_name,
                                country_iso_code: locationdata.body.country_iso_code,
                            };
                            adminData.locationinfos[0].region = locationdata.body.region_name;
                            adminData.locationinfos[0].province = locationdata.body.province_name;
                            adminData.locationinfos[0].village = locationdata.body.village_name;
                            adminData.locationinfos[0].city = locationdata.body.city_name;
                            adminData.locationinfos[0].department = locationdata.body.department_name;
                        }
                    } catch (error) {
                        console.error("An error occurred:", error);
                    }
                }


                if (adminData.verify_status !== "APPROVED") {
                    const currentDate = new Date();
                    const timeZone = TIMEZONE;                    
                    const formattedDate = currentDate.toLocaleString("en-US", { timeZone });
                    let addLogs = {};
                    let saveLogs = {};

                    addLogs = new Logs({
                        userName: portalUserData?.user_name,
                        userId: portalUserData?._id,
                        loginDateTime: formattedDate,
                        ipAddress: req?.headers['x-forwarded-for'] || req?.connection?.remoteAddress,

                    });
                    saveLogs = await addLogs.save();

                    const savedLogId = saveLogs ? saveLogs._id : null;
                    
                    return sendResponse(req, res, 200, {
                        status: true,
                        body: {
                            otp_verified: portalUserData.verified,
                            token: null,
                            refreshToken: null,
                            user_details: {
                                portalUserData,
                                adminData,
                                savedLogId
                            }
                        },
                        message: "Superadmin not approved yet",
                        errorCode: "PROFILE_NOT_APPROVED",
                    });
                }
            } else {
                adminData = await StaffInfo.findOne({
                    for_portal_user: portalUserData._id,
                }).populate({
                    path: "role"
                })

                let checkAdmin = await AdminInfo.findOne({ for_portal_user: mongoose.Types.ObjectId(adminData?.for_staff) })

                adminData = Object.assign({}, adminData._doc, {
                    pharmacy_name: checkAdmin?.pharmacy_name,

                });
            }         

            const tokenData = {
                portalUserId: portalUserData._id,
                uuid
            }

            createSession(req, portalUserData);
            // logs
            const currentDate = new Date();
            const timeZone = TIMEZONE;
            
            const formattedDate = currentDate.toLocaleString("en-US", { timeZone });
            let addLogs = {};
            let saveLogs = {};
            if (portalUserData.role == "PHARMACY_ADMIN") {
                addLogs = new Logs({
                    userName: portalUserData?.user_name,
                    userId: portalUserData?._id,
                    loginDateTime: formattedDate,
                    ipAddress: req?.headers['x-forwarded-for'] || req?.connection?.remoteAddress,

                });
                saveLogs = await addLogs.save();
            } else {
                let checkAdmin = await AdminInfo.findOne({ for_portal_user: mongoose.Types.ObjectId(portalUserData?.staff_createdBy) })
                addLogs = new Logs({
                    userName: portalUserData?.user_name,
                    userId: portalUserData?._id,
                    adminData: {
                        adminId: portalUserData?.staff_createdBy,
                        pharmacyName: checkAdmin?.pharmacy_name
                    },
                    loginDateTime: formattedDate,
                    ipAddress: req?.headers['x-forwarded-for'] || req?.connection?.remoteAddress,
                });
                saveLogs = await addLogs.save();
            }
            const savedLogId = saveLogs ? saveLogs._id : null;
            
            let activeToken = generateToken(tokenData);
                await PortalUser.findOneAndUpdate(
                    { _id: portalUserData._id },
                    {
                    $set: { activeToken: activeToken },
                    }
                );
            return sendResponse(req, res, 200, {
                status: true,
                body: {
                    otp_verified: portalUserData.verified,
                    token: activeToken,
                    refreshToken: generateRefreshToken(tokenData),
                    user_details: {
                        portalUserData,
                        adminData,
                        savedLogId
                    },
                },
                message: "pharmacy login done",
                errorCode: null,
            });
        } catch (error) {
            
            sendResponse(req, res, 500, {
                status: false,
                body: error,
                message: "Internal server error",
                errorCode: null,
            });
        }
    }

    async logout(req, res) {
        
        try {
            const { uuid } = req.headers;
    
            await Otp2fa.updateMany({ uuid }, {
                $set: {
                    verified: false
                }
            })

            const getData = await Otp2fa.findOne({ uuid })
            if (getData) {
              const getPharmacyData = await PortalUser.findOne({_id: {$eq: getData?.for_portal_user}}).select('pharmacy_name')
              //Save audit logs
              await httpService.postStaging(
                "superadmin/add-logs",
                { 
                  userId: req.user.portalUserId,
                  userName: getPharmacyData?.pharmacy_name,
                  role: 'pharmacy',
                  action: `logout`,
                  actionDescription: `Logout: ${getPharmacyData?.pharmacy_name} logout successfully.`,
                },
                {},
                "superadminServiceUrl"
              );

               await PortalUser.findOneAndUpdate(
                    { _id: mongoose.Types.ObjectId(req.user.portalUserId) },
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
            sendResponse(req, res, 500, {
                status: false,
                body: error,
                message: "Internal server error",
                errorCode: null,
            });
        }
    }

    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;

            return sendResponse(req, res, 200, {
                status: true,
                body: refreshToken,
                message: "pharmacy refresh token",
                errorCode: null,
            });
        } catch (error) {
            
            sendResponse(req, res, 500, {
                status: false,
                body: error,
                message: "Internal server error",
                errorCode: null,
            });
        }
    }

    async sendSmsOtpFor2fa(req, res) {
        try {
            const { email } = req.body;
            const { uuid } = req.headers;
            const headers = {
                'Authorization': req.headers['authorization']
            }
            const portalUserData = await PortalUser.findOne({ email, isDeleted: false }).lean();
            if (!portalUserData) {
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
            const mobile = portalUserData.phone_number
            const country_code = portalUserData.country_code
            const deviceExist = await Otp2fa.findOne({ mobile, country_code, uuid, for_portal_user: portalUserData._id }).lean();
            if (deviceExist && deviceExist.send_attempts >= 500000) {
                return sendResponse(req, res, 200, {
                    status: false,
                    body: null,
                    message: "Maximum attempt exceeded",
                    errorCode: "MAX ATTEMPT_EXCEEDED",
                });
            }

            const currentTime = new Date();

            const canOtpSend = await canSendOtp(deviceExist, currentTime)
            
            // Check if the OTP can be sent
            if (!canOtpSend.status) {
                const timeLeft = new Date(deviceExist.isTimestampLocked ? deviceExist.limitExceedWithin : canOtpSend.limitExceedWithin) - currentTime;
                if (!deviceExist.isTimestampLocked) {
                    await Otp2fa.findOneAndUpdate({ mobile, country_code, uuid, for_portal_user: portalUserData._id }, { $set: {
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

            let otp = 1111;

            if(NODE_ENV === "production"){
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
                        { mobile, country_code, uuid, for_portal_user: portalUserData._id }, 
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
                        for_portal_user: portalUserData._id,
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

    async matchSmsOtpFor2fa(req, res) {
        try {
            const { mobile, otp, for_portal_user } = req.body;
            const { uuid } = req.headers;
            
            const otpResult = await Otp2fa.findOne({ uuid, mobile, for_portal_user, verified: false });
            if (otpResult) {
                const portalUserData = await PortalUser.findOne({ _id: otpResult.for_portal_user, isDeleted: false }).lean();
                if (!portalUserData) {
                    return sendResponse(req, res, 422, {
                        status: false,
                        body: null,
                        message: "User does not exist.",
                        errorCode: null,
                    });
                }
                //Check OTP expiry
                const timestamp1 = new Date();  // First timestamp
                const timestamp2 = new Date(otpResult?.otpExpiration);  // Second timestamp

                if (timestamp2.getTime() < timestamp1.getTime()) {
                    return sendResponse(req, res, 200, {
                        status: false,
                        body: null,
                        message: "The OTP has expired.",
                        errorCode: "OTP_EXPIRED",
                    });
                }
                if (otpResult.otp == otp) {
                    req.session.ph_verified = true;
                    const updateVerified = await PortalUser.findOneAndUpdate({ _id: portalUserData._id }, {
                        $set: {
                            verified: true
                        }
                    }, { new: true }).exec();
                    const updateVerifiedUUID = await Otp2fa.findOneAndUpdate({ uuid, mobile, for_portal_user, verified: false }, {
                        $set: {
                            verified: true
                        }
                    }, { new: true }).exec();
                    const tokenData = {
                        portalUserId: portalUserData._id,
                        uuid,
                        role: 'pharmacy'
                    }
                    const adminData = await AdminInfo.findOne({for_portal_user: {$eq: portalUserData?._id}}) 
                     //Save audit logs
                     await httpService.postStaging(
                        "superadmin/add-logs",
                        { 
                            userId: portalUserData?._id,
                            userName: adminData?.pharmacy_name,
                            role: 'pharmacy',
                            action: `login`,
                            actionDescription: `Login: ${adminData?.pharmacy_name} login successfully.`,
                        },
                        {},
                        "superadminServiceUrl"
                    );
                    let activeToken = generateToken(tokenData);
                    await PortalUser.findOneAndUpdate(
                        { _id: portalUserData._id },
                        {
                        $set: { activeToken: activeToken },
                        }
                    );
                    return sendResponse(req, res, 200, {
                        status: true,
                        body: {
                            id: updateVerified._id,
                            uuid: updateVerifiedUUID._id,
                            otp_verified: portalUserData.verified,
                            token: activeToken,
                            refreshToken: generateRefreshToken(tokenData),
                            user_details: {
                                portalUserData: {
                                  _id: portalUserData?._id,
                                  pharmacy_name: adminData?.pharmacy_name,
                                  email: portalUserData?.email,
                                  mobile: portalUserData?.mobile,
                                  country_code: portalUserData?.country_code,
                                  role: portalUserData?.role,
                                },
                                adminData: {
                                  _id: portalUserData?._id,
                                  role: portalUserData?.role,
                                },
                            },
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

    async matchEmailOtpFor2fa(req, res) {
        try {
            const { email, otp, for_portal_user } = req.body;
            const { uuid } = req.headers;
            const otpResult = await Otp2fa.findOne({ uuid, email, for_portal_user, verified: false });
            if (otpResult) {
                const portalUserData = await PortalUser.findOne({ _id: otpResult.for_portal_user, isDeleted: false }).lean();
                if (!portalUserData) {
                    return sendResponse(req, res, 422, {
                        status: false,
                        body: null,
                        message: "User does not exist.",
                        errorCode: null,
                    });
                }
                const timestamp1 = new Date();  // First timestamp
                const timestamp2 = new Date(otpResult?.otpExpiration);  // Second timestamp
        
                if (timestamp2.getTime() < timestamp1.getTime()) {
                    return sendResponse(req, res, 200, {
                        status: false,
                        body: null,
                        message: "The OTP has expired.",
                        errorCode: "OTP_EXPIRED",
                    });
                }
                if (otpResult.otp == otp) {
                    req.session.ph_verified = true;
                    const updateVerified = await PortalUser.findOneAndUpdate({ _id: portalUserData._id }, {
                        $set: {
                            verified: true
                        }
                    }, { new: true }).exec();
                    const updateVerifiedUUID = await Otp2fa.findOneAndUpdate({ uuid, email, for_portal_user, verified: false }, {
                        $set: {
                            verified: true
                        }
                    }, { new: true }).exec();
                    const tokenData = {
                        portalUserId: portalUserData._id,
                        uuid,
                        role: 'pharmacy'
                    }
                    const adminData = await AdminInfo.findOne({for_portal_user: {$eq: portalUserData?._id}}) 
                    //Save audit logs
                    await httpService.postStaging(
                        "superadmin/add-logs",
                        { 
                        userId: portalUserData?._id,
                        userName: adminData?.pharmacy_name,
                        role: 'pharmacy',
                        action: `login`,
                        actionDescription: `Login: ${adminData?.pharmacy_name} login successfully.`,
                        },
                        {},
                        "superadminServiceUrl"
                    );
                    let activeToken = generateToken(tokenData);
                    await PortalUser.findOneAndUpdate(
                        { _id: portalUserData._id },
                        {
                        $set: { activeToken: activeToken },
                        }
                    );
                    return sendResponse(req, res, 200, {
                        status: true,
                        body: {
                            id: updateVerified._id,
                            uuid: updateVerifiedUUID._id,
                            otp_verified: portalUserData.verified,
                            token: activeToken,
                            refreshToken: generateRefreshToken(tokenData),
                            user_details: {
                                portalUserData: {
                                  _id: portalUserData?._id,
                                  pharmacy_name: adminData?.pharmacy_name,
                                  email: portalUserData?.email,
                                  mobile: portalUserData?.mobile,
                                  country_code: portalUserData?.country_code,
                                  role: portalUserData?.role,
                                },
                                adminData: {
                                  _id: portalUserData?._id,
                                  role: portalUserData?.role,
                                },
                            },
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

    async sendVerificationEmail(req, res) {
        try {
            const { email } = req.body;
            const { uuid } = req.headers;
            const headers = {
                'Authorization': req.headers['authorization']
            }
            const portalUserData = await PortalUser.findOne({ email, isDeleted: false }).lean();
            if (!portalUserData) {
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
            const deviceExist = await Otp2fa.findOne({ uuid, email, for_portal_user: portalUserData._id }).lean();

            const currentTime = new Date();

            const canOtpSend = await canSendOtp(deviceExist, currentTime)
            
            // Check if the OTP can be sent
            if (!canOtpSend.status) {
                const timeLeft = new Date(deviceExist.isTimestampLocked ? deviceExist.limitExceedWithin : canOtpSend.limitExceedWithin) - currentTime;
                if (!deviceExist.isTimestampLocked) {
                    await Otp2fa.findOneAndUpdate({ email, uuid, for_portal_user: portalUserData._id }, { $set: {
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
                    errorCode: "MAX ATTEMPT_EXCEEDED",
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
                for_portal_user: portalUserData._id,
                send_attempts: 1
              }).save();
            }
            return sendResponse(req, res, 200, {
                status: true,
                body: {
                    id: result._id
                },
                message: "Email Sent successfully",
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

    async forgotPassword(req, res) {
        const headers = {
            'Authorization': req.headers['authorization']
        }
        const { email } = req.body;
        const { uuid } = req.headers;
        try {
            const portalUserData = await PortalUser.findOne({ email }).lean();
            if (!portalUserData) {
                return sendResponse(req, res, 200, {
                    status: false,
                    body: null,
                    message: "User Not Found.",
                    errorCode: "USER_NOT_FOUND",
                });
            }
            const passwordToken = crypto.randomBytes(32).toString("hex");

            const otpData = new ResetPasswordHistory({
                email,
                uuid,
                for_portal_user: portalUserData._id,
                passwordToken
            });
            const result = await otpData.save();
            const link = `${test_p_FRONTEND_URL}/pharmacy/newpassword?token=${passwordToken}&user_id=${portalUserData._id}`
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
                        id: result._id
                    },
                    message: "A password reset link has been sent to your email.",
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

    async changePassword(req, res) {
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
            const portalUserData = await PortalUser.findOne({ _id: id, }).lean();
            if (!portalUserData) {
                return sendResponse(req, res, 200, {
                    status: false,
                    body: null,
                    message: "User not found",
                    errorCode: "USER_NOT_FOUND",
                });
            }
            const isPasswordOldMatch = await checkPassword(old_password, portalUserData);
            if (!isPasswordOldMatch) {
                return sendResponse(req, res, 200, {
                    status: false,
                    body: null,
                    message: "Incorrect Old Password.",
                    errorCode: null,
                });
            }
            const passwordHash = await hashPassword(new_password);
            const isPasswordMatch = await checkPassword(new_password, portalUserData);
            if (isPasswordMatch) {
                return sendResponse(req, res, 200, {
                    status: false,
                    body: null,
                    message: "This is your previous password. Please enter a new password.",
                    errorCode: "INCORRECT_PASSWORD",
                });
            }
            const result = await PortalUser.findOneAndUpdate({ _id: id }, {
                $set: {
                    password: passwordHash
                }
            }, { new: true }).exec();
            return sendResponse(req, res, 200, {
                status: true,
                data: { id: result._id },
                message: "Successfully changed password.",
                errorCode: null,
            });
        } catch (error) {
            
            sendResponse(req, res, 500, {
                status: false,
                body: error,
                message: "Internal server error",
                errorCode: null,
            });
        }
    }

    async resetPassword(req, res) {
        const { passwordToken, new_password } = req.body;
        try {
            const resetPaswordResult = await ResetPasswordHistory.findOne({ passwordToken }).lean();
            if (!resetPaswordResult) {
                return sendResponse(req, res, 200, {
                    status: false,
                    data: null,
                    message: "Invalid email token",
                    errorCode: "INVALID_TOKEN",
                });
            }

            const passCheck = await PortalUser.findOne({ _id: resetPaswordResult.for_portal_user });

            const isPasswordCheck = await checkPassword(new_password, passCheck);

            if (isPasswordCheck) {
                return sendResponse(req, res, 200, {
                    status: false,
                    body: null,
                    message: "This is your previous password. Please enter a new password.",
                    errorCode: null,
                });
            } else {
                const passwordHash = await hashPassword(new_password);
                const result = await PortalUser.findOneAndUpdate({ _id: resetPaswordResult.for_portal_user }, {
                    $set: {
                        password: passwordHash
                    }
                }, { new: true }).exec();
                // Delete the token after successful password reset
                await ResetPasswordHistory.deleteOne({ passwordToken });
                sendResponse(req, res, 200, {
                    status: true,
                    data: { id: result._id },
                    message: "Successfully reset password",
                    errorCode: null,
                });
            }

        } catch (error) {
            
            sendResponse(req, res, 500, {
                status: false,
                body: error,
                message: "Internal server error",
                errorCode: null,
            });
        }
    }

    async pharmacyProfile(req, res) {
        const headers = {
            Authorization: req.headers["authorization"],
        }
        try {
            const {
                address,
                pharmacy_name,
                pharmacy_name_arabic,
                slogan,
                main_phone_number,               
                additional_phone_number,
                about_pharmacy,               
                profile_picture,
                pharmacy_picture,
                licence_details,               
                location_info,
                for_portal_user,
                country_code,
                password,
                email,
                createdBy
            } = req.body;
            
            const {
                nationality,
                neighborhood,
                region,
                province,
                department,
                city,
                village,
                pincode,
                loc
            } = location_info;
            if(for_portal_user !=""){
                const userData = await PortalUser.findOneAndUpdate(
                    { _id: for_portal_user },
                    {
                        $set: {
                            pharmacy_name:pharmacy_name,
                            pharmacy_name_arabic:pharmacy_name_arabic,
                            email: email,
                            country_code: country_code,
                            phone_number:main_phone_number
                        },
                    },
                    { upsert: false, new: true }
                )


                const locationData = await LocationInfo.findOneAndUpdate(
                    { for_portal_user: for_portal_user },
                    {
                        $set: {
                            nationality: nationality == '' ? null : nationality,
                            neighborhood: neighborhood == '' ? null : neighborhood,
                            region: region == '' ? null : region,
                            province: province == '' ? null : province,
                            department: department == '' ? null : department,
                            city: city == '' ? null : city,
                            village: village == '' ? null : village,
                            pincode: pincode == '' ? null : pincode,
                            for_portal_user,
                            address: address == '' ? null : address,
                            loc: loc == '' ? null : loc,
                        },
                    },
                    { new: true }
                ).exec();

                const updateAdminData = await AdminInfo.findOneAndUpdate(
                    { for_portal_user: for_portal_user },
                    {
                        $set: {
                            address,
                            pharmacy_name,                           
                            pharmacy_name_arabic,                           
                            slogan,
                            main_phone_number,                           
                            additional_phone_number,
                            about_pharmacy,                           
                            profile_picture,
                            pharmacy_picture,
                            licence_details,                            
                            in_location: locationData?._id,                           
                        },
                    },
                    { new: true }
                );

                if( userData || updateAdminData || locationData){
                    return sendResponse(req, res, 200, {
                        status: true,
                        data:{userData,updateAdminData,locationData},
                        message: "Pharmacy profile updated successfully",
                        errorCode: null,
                    });
                }else{
                    return sendResponse(req, res, 200, {
                        status: false,
                        data:null,
                        message: "Failed to update profile!",
                        errorCode: null,
                    }); 
                }

            }else{
                const CheckEmail = await PortalUser.findOne({ email: email, isDeleted: false })
                if (CheckEmail) {
                  return sendResponse(req, res, 200, {
                    status: false,
                    body: null,
                    message: "Email address already exists for another user",
                    errorCode: "INTERNAL_SERVER_ERROR",
                  })
                }
                const passwordHash = await hashPassword(password);
                const userDetails = new PortalUser({
                    email: email,
                    password: passwordHash,
                    phone_number:main_phone_number,
                    country_code:country_code,
                    verified: true,
                    role: "PHARMACY_ADMIN",
                    createdBy:createdBy,
                    pharmacy_name:pharmacy_name,
                    pharmacy_name_arabic:pharmacy_name_arabic
                });
                let userData = await userDetails.save();

                const locationInfo = new LocationInfo({
                    nationality: nationality == '' ? null : nationality,
                    neighborhood: neighborhood == '' ? null : neighborhood,
                    region: region == '' ? null : region,
                    province: province == '' ? null : province,
                    department: department == '' ? null : department,
                    city: city == '' ? null : city,
                    village: village == '' ? null : village,
                    pincode: pincode == '' ? null : pincode,
                    for_portal_user: userData._id,
                    address: address == '' ? null : address,
                    loc: loc == '' ? null : loc,
                });
                let locationData = locationInfo.save();
                const userAdminInfo = new AdminInfo({
                    address,
                    pharmacy_name,                        
                    pharmacy_name_arabic,                        
                    slogan,
                    main_phone_number,
                    additional_phone_number,
                    about_pharmacy,                       
                    profile_picture,
                    pharmacy_picture,
                    licence_details,                      
                    verify_status: "APPROVED",
                    in_location: locationData?._id,
                    for_portal_user: userData._id
                })
                let saveAdminData = await userAdminInfo.save();    
                 //Send notification to pharmacy
                let paramsData = {
                    sendTo: 'pharmacy',
                    madeBy: 'superadmin',
                    condition: 'PROFILE_CREATED',
                    user_name: pharmacy_name,
                    user_email: email, 
                    user_mobile: main_phone_number,
                    country_code: country_code,
                    user_password: password, 
                    notification: ['sms', 'email'],
                    isProfile: true
                }
                sendNotification(paramsData, headers)          
                if(userData || saveAdminData || locationData){
                    return sendResponse(req, res, 200, {
                        status: true,
                        data:{userData,saveAdminData,locationData},
                        message: "successfully created pharmacy profile",
                        errorCode: null,
                    });
                }else{
                    return sendResponse(req, res, 200, {
                        status: false,
                        data:null,
                        message: "Failed to save profile information",
                        errorCode: null,
                    });                   
                }

            }
        } catch (error) {
            console.error(error);
            sendResponse(req, res, 500, {
                status: false,
                data: error,
                message: "failed to create pharmacy profile",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async pharmacyCreateProfile(req, res) {
        try {
            const {
                address,
                email,
                loc,
                first_name,
                middle_name,
                last_name,
                pharmacy_name,
                slogan,
                main_phone_number,
                mobile_phone_number,
                additional_phone_number,
                about_pharmacy,
                medicine_request,
                profile_picture,
                pharmacy_picture,
                licence_details,
                duty_group,
                show_to_patient,
                bank_details,
                mobile_pay_details,
                location_info,
                for_portal_user,
                country_code
            } = req.body;
            const {
                nationality,
                neighborhood,
                region,
                province,
                department,
                city,
                village,
                pincode,
            } = location_info;
            const {
                bank_name,
                account_holder_name,
                account_number,
                ifsc_code,
                bank_address,
            } = bank_details;

            const findUser = await PortalUser.findOne({ _id: for_portal_user })
            const isExist = await PortalUser.findOne({ email: email, _id: { $ne: for_portal_user }, isDeleted: false });
            if (isExist) {
                return sendResponse(req, res, 200, {
                    status: false,
                    body: null,
                    message: "Email Already Exist",
                    errorCode: "INTERNAL_SERVER_ERROR",
                });
            }
            const PortalUserDetails = await PortalUser.findOneAndUpdate(
                { _id: for_portal_user },
                {
                    $set: {
                        email: email,
                        user_name: first_name + " " + middle_name + " " + last_name, first_name, middle_name, last_name, phone_number: main_phone_number,
                        country_code: country_code, profile_picture: profile_picture
                    },
                },
                { upsert: false, new: true }
            )
            const findLocation = await LocationInfo.findOne({ for_portal_user: findUser?._id });
            let locationData
            if (!findLocation) {
                const locationInfo = new LocationInfo({
                    nationality: nationality == '' ? null : nationality,
                    neighborhood: neighborhood == '' ? null : neighborhood,
                    region: region == '' ? null : region,
                    province: province == '' ? null : province,
                    department: department == '' ? null : department,
                    city: city == '' ? null : city,
                    village: village == '' ? null : village,
                    pincode: pincode == '' ? null : pincode,
                    for_portal_user,
                    address: address == '' ? null : address,
                    loc: loc == '' ? null : loc,
                });
                try {
                    locationData = await locationInfo.save();
                } catch (error) {
                    console.error("Error saving locationData:", error);
                }
            } else {
                locationData = await LocationInfo.findOneAndUpdate(
                    { for_portal_user: for_portal_user },
                    {
                        $set: {
                            nationality: nationality == '' ? null : nationality,
                            neighborhood: neighborhood == '' ? null : neighborhood,
                            region: region == '' ? null : region,
                            province: province == '' ? null : province,
                            department: department == '' ? null : department,
                            city: city == '' ? null : city,
                            village: village == '' ? null : village,
                            pincode: pincode == '' ? null : pincode,
                            for_portal_user,
                            address: address == '' ? null : address,
                            loc: loc == '' ? null : loc,
                        },
                    },
                    { new: true }
                ).exec();
            }       

            // Mobile Pay 
            let dataArray = []
            for (const data of mobile_pay_details) {
                if (data?.provider != '') {
                    dataArray.push({
                        provider: data.provider,
                        pay_number: data.pay_number,
                        mobile_country_code: data?.mobile_country_code
                    })
                }
            }
            let mobilePayResult
           
            const mobile_pay_object_id = mobilePayResult?._id

            await Promise.all([locationData, bankData]);

            const pharmacyAdminData = await AdminInfo.findOneAndUpdate(
                { for_portal_user },
                {
                    $set: {
                        address,
                        pharmacy_name,
                        first_name,
                        middle_name,
                        last_name,
                        slogan,
                        main_phone_number,
                        mobile_phone_number,
                        additional_phone_number,
                        about_pharmacy,
                        medicine_request,
                        profile_picture,
                        pharmacy_picture,
                        licence_details,
                        duty_group,
                        show_to_patient,
                        // verify_status: "PENDING",
                        in_location: locationData._id,
                        in_bank: bankData._id,
                        in_mobile_pay: mobile_pay_object_id,
                    },
                },
                { new: true }
            );
            const locationinfos = await LocationInfo.find({ for_portal_user: findUser?._id });

            const pharmacyAdminInfo = {
                ...pharmacyAdminData.toObject(), // Convert to plain JavaScript object
                locationinfos: locationinfos.map(location => location.toObject()),
            };

            if (pharmacyAdminInfo?.locationinfos) {
                try {
                    let locationids = {
                        country_id: locationinfos[0]?.nationality,
                        region_id: locationinfos[0]?.region,
                        province_id: locationinfos[0]?.province,
                        village_id: locationinfos[0]?.village,
                        city_id: locationinfos[0]?.city,
                        department_id: locationinfos[0]?.department,
                    };

                    const locationdata = await httpService.postStaging(
                        "common-api/get-location-name",
                        { locationids: locationids },
                        {},
                        "superadminServiceUrl"
                    );
                    if (locationdata.status) {
                        pharmacyAdminInfo.locationinfos[0].country = {
                            countryname: locationdata?.body?.country_name,
                            country_iso_code: locationdata?.body?.country_iso_code,
                        };
                        pharmacyAdminInfo.locationinfos[0].region = locationdata?.body?.region_name;
                        pharmacyAdminInfo.locationinfos[0].province = locationdata?.body?.province_name;
                        pharmacyAdminInfo.locationinfos[0].village = locationdata?.body?.village_name;
                        pharmacyAdminInfo.locationinfos[0].city = locationdata?.body?.city_name;
                        pharmacyAdminInfo.locationinfos[0].department = locationdata?.body?.department_name;
                    }
                } catch (error) {
                    console.error("An error occurred:", error);
                }
            }

            sendResponse(req, res, 200, {
                status: true,
                data: { pharmacyAdminInfo, PortalUserDetails },
                message: "successfully created pharmacy admin profile",
                errorCode: null,
            });
        } catch (error) {
            console.error(error);
            sendResponse(req, res, 500, {
                status: false,
                data: error,
                message: "failed to create pharmacy admin profile",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async pharmacyProfileSetHours(req, res) {
        try {
            const {
                hoursset,
                for_portal_user,
            } = req.body;

            const pharmacyAdminInfo = await AdminInfo.findOneAndUpdate(
                { for_portal_user },
                {
                    $set: {
                        hoursset,
                    },
                },
                { new: true }
            );

            sendResponse(req, res, 200, {
                status: true,
                data: { pharmacyAdminInfo },
                message: "successfully Set Hours",
                errorCode: null,
            });
        } catch (error) {
            console.error(error);
            sendResponse(req, res, 500, {
                status: false,
                data: error,
                message: "failed to create pharmacy admin profile",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }


    async listPharmacyAdminUser(req, res) {
        try {
            const { page, limit, name, status, sort } = req.query;
    
            const pageNumber = Number(page) || 1;
            const limitNumber = Number(limit) || 10;
    
            let sortingArray = {};
            if (sort && sort !== 'undefined') {
                const [key, value] = sort.split(":");
                sortingArray[key] = Number(value);
            } else {
                sortingArray['createdAt'] = -1;
            }
    
            let filter = {
                verify_status: status,             
                "for_portal_user.isDeleted": false
            };
    
            if (req.user.role !== 'superadmin') {
                filter["for_portal_user.lock_user"] = false;
            }
    
            if (name) {
                filter.pharmacy_name = { $regex: name, $options: "i" };
            }
    
            let aggregate = [
                {
                    $lookup: {
                        from: "portalusers",
                        localField: "for_portal_user",
                        foreignField: "_id",
                        as: "for_portal_user"
                    }
                },
                {
                    $unwind: {
                        path: "$for_portal_user",
                        preserveNullAndEmptyArrays: true
                    }
                },
                { $match: filter }
            ];
    
            const totalCount = await AdminInfo.aggregate([...aggregate, { $count: "count" }]);
            const count = totalCount.length > 0 ? totalCount[0].count : 0;
    
            aggregate.push(
                { $sort: sortingArray },
                { $skip: (pageNumber - 1) * limitNumber },
                { $limit: limitNumber }
            );
    
            let result = await AdminInfo.aggregate(aggregate);
 
            result = await Promise.all(
                result.map(async (doc) => {
                    if (doc.profile_picture !=='') {
                        doc.profile_picture_signed_url = await generateSignedUrl(doc.profile_picture);
                    }
                    return doc;
                })
            );
    
            return sendResponse(req, res, 200, {
                status: true,
                data: {
                    data: result,
                    totalCount: count,
                },
                message: "Successfully fetched pharmacy admin list",
                errorCode: null,
            });
        } catch (error) {
            return sendResponse(req, res, 500, {
                status: false,
                data: error,
                message: "Failed to fetch pharmacy admin list",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }
    

    async approveOrRejectPharmacy(req, res) {
        const { verify_status, id, approved_or_rejected_by } = req.body;
        let date = null;
        if (verify_status == "APPROVED") {
            const cdate = new Date();
            date = `${cdate.getFullYear()}-${cdate.getMonth() + 1
                }-${cdate.getDate()}`;
        }

        try {
            const result = await AdminInfo.findOneAndUpdate(
                { _id: id },
                {
                    $set: {
                        verify_status,
                        approved_at: date,
                        approved_or_rejected_by,
                    },
                },
                { upsert: false, new: true }
            ).exec();

            sendResponse(req, res, 200, {
                status: true,
                data: result,
                message: `${verify_status} pharmacy successfully`,
                errorCode: null,
            });
        } catch (error) {
            sendResponse(req, res, 500, {
                status: false,
                data: error,
                message: `pharmacy request ${verify_status}`,
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async pharmacyAdminDetails(req, res) {
        try {
            const { userId } = req.query;    
            const adminData = await AdminInfo.findOne({
                _id: userId,
            })
            const locationData = await LocationInfo.findOne({
                for_portal_user: adminData.for_portal_user._id,
            }).exec();

            const portalUserData = await PortalUser.findOne({ _id: adminData.for_portal_user }).exec();
            if (adminData?.profile_picture) {
                adminData.profile_picture_signed_url = await generateSignedUrl(adminData?.profile_picture)
            }
            if (adminData?.licence_details?.licence_picture) {
                adminData.licence_details.licence_picture = await generateSignedUrl(adminData?.licence_details?.licence_picture)
            }
            let pharmacy_picture_signed_urls = []
            if (adminData?.pharmacy_picture.length > 0) {
                for (const key of adminData?.pharmacy_picture) {
                    pharmacy_picture_signed_urls.push(await generateSignedUrl(key))
                }
            }
            adminData.pharmacy_picture_signed_urls = pharmacy_picture_signed_urls

            sendResponse(req, res, 200, {
                status: true,
                data: {
                    portalUserData,
                    adminData,
                    locationData
                },
                message: `pharmacy admin details fetched successfully`,
                errorCode: null,
            });
        } catch (error) {
            console.error("An error occurred:", error);
            sendResponse(req, res, 500, {
                status: false,
                data: null,
                message: `failed to fetch pharmacy admin details`,
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async viewPharmacyAdminDetails(req, res) {
        try {
            const { id } = req.query;
            const portalUserData = await PortalUser.findOne({ _id: id }).exec();
            const adminData = await AdminInfo.findOne({
                for_portal_user: portalUserData._id,
            })
                .populate({
                    path: "in_location",
                })
                .lean(); 
            const locationData = await LocationInfo.findOne({
                for_portal_user: adminData.for_portal_user._id,
            }).exec();          

            const getLicenseData = adminData?.licence_details
            let licencePicSignedUrl = ''
            if (getLicenseData && getLicenseData?.licence_picture) {
                const singedUrl = await generateSignedUrl(getLicenseData?.licence_picture)
                licencePicSignedUrl = singedUrl
            }
    
            if (adminData?.profile_picture) {
              adminData.profile_picture_signed_url = await generateSignedUrl(adminData?.profile_picture)
            }
            if (adminData?.pharmacy_picture.length > 0) {
                let signedUrlArray = []
                for (const element of adminData?.pharmacy_picture ?? []) {
                    signedUrlArray.push(await generateSignedUrl(element))
                }
                adminData.pharmacy_picture_signed_urls = signedUrlArray
            }

            sendResponse(req, res, 200, {
                status: true,
                data: {
                    portalUserData,
                    adminData,
                    licencePicSignedUrl,
                    locationData,
                },
                message: `pharmacy admin details fetched successfully`,
                errorCode: null,
            });
        } catch (error) {
            console.error("An error occurred:", error);
            sendResponse(req, res, 500, {
                status: false,
                data: null,
                message: `failed to fetch pharmacy admin details`,
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }
    async deleteActiveadmin(req, res) {
        let actionMessage;

        try {
            const { action_name, action_value, id } = req.body
            
            let key;
            key = action_name === "delete" ? 'isDeleted' : action_name === "active" ? "isActive" : ''
            
            if (key) {
                const portalData = await PortalUser.findOneAndUpdate(
                    { _id: { $eq: id } },
                    {
                        $set: {
                            [key]: action_value
                        }
                    },
                    { new: true },
                )
                if (action_name === "active" && action_value) {
                    actionMessage = "actived"
                } else if (action_name === "active" && !action_value) {
                    actionMessage = "deactived"
                }
                if (action_name === "delete" && action_value) {
                    actionMessage = "deleted"
                }

                sendResponse(req, res, 200, {
                    status: true,
                    data: portalData,
                    message: `Pharmacy profile ${actionMessage} successfully`,
                    errorCode: null,
                });
            } else {
                sendResponse(req, res, 200, {
                    status: true,
                    data: null,
                    message: `Invalid Parameter`,
                    errorCode: "INTERNAL_SERVER_ERROR",
                });
            }
        } catch (error) {
            
            sendResponse(req, res, 500, {
                status: false,
                data: error,
                message: `failed to ${actionMessage} staff`,
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async lockProfile(req, res) {
        try {
            const { id, lock_user } = req.body;
            const portalUserData = await PortalUser.findOneAndUpdate(
                { _id: id },
                {
                    $set: {
                        lock_user,
                    },
                },
                { new: true }
            ).exec();
            sendResponse(req, res, 200, {
                status: true,
                data: {
                    portalUserData,
                },
                message: `pharmacy admin details updated successfully`,
                errorCode: null,
            });
        } catch (error) {
            
            sendResponse(req, res, 500, {
                status: false,
                data: error,
                message: `failed to update pharmacy admin details`,
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async getAllPharmacy(req, res) {
        try {
            const { searchKey } = req.query;
            let filter = { verify_status: "APPROVED" };
            if (searchKey != '' && searchKey) {
                filter.pharmacy_name = { $regex: searchKey || "", $options: "i" }
            }
            const result = await AdminInfo.find(filter).select({ for_portal_user: 1, pharmacy_name: 1 }).exec();
            sendResponse(req, res, 200, {
                status: true,
                body: result,
                message: `all pharmacy fetched successfully`,
                errorCode: null,
            });
        } catch (error) {
            sendResponse(req, res, 500, {
                status: false,
                data: error,
                message: `failed to get all pharmacy`,
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }
    async checkRoute(req, res) {
        try {
            sendResponse(req, res, 200, {
                status: true,
                data: 'result',
                message: `route working`,
                errorCode: null,
            });
        } catch (error) {
            sendResponse(req, res, 500, {
                status: false,
                data: error,
                message: `failed to get all pharmacy`,
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async postReviewAndRating(req, res) {
        try {
            const { for_portal_user, patient_login_id, rating, comment } = req.body
            //Store Location details
            let reviewObject = { rating, comment }
            const getReview = await ReviewAndRating.find({ patient_login_id: { $eq: patient_login_id }, portal_user_id: { $eq: for_portal_user } }).select('rating');
            if (getReview.length > 0) {
                await ReviewAndRating.findOneAndUpdate({ patient_login_id: { $eq: patient_login_id }, portal_user_id: { $eq: for_portal_user } }, {
                    $set: reviewObject
                }, { new: true }).exec();
            } else {
                reviewObject.for_portal_user = for_portal_user
                reviewObject.patient_login_id = patient_login_id
                reviewObject.portal_user_id = for_portal_user
                const reviewData = new ReviewAndRating(reviewObject);
                await reviewData.save()
            }
            const getAllRatings = await ReviewAndRating.find({ portal_user_id: mongoose.Types.ObjectId(for_portal_user) }).select('rating')
            
            const totalCount = getAllRatings.length
            let count = 0
            for (const rating of getAllRatings) {
                count += rating.rating
            }
            
            const average_rating = (count / totalCount).toFixed(1);
           
            await PortalUser.findOneAndUpdate({ _id: { $eq: for_portal_user } }, {
                $set: { average_rating }
            }, { new: true }).exec();
            sendResponse(req, res, 200, {
                status: true,
                body: null,
                message: `Review added successfully`,
                errorCode: null,
            });
        } catch (error) {
            sendResponse(req, res, 500, {
                status: false,
                body: error,
                message: `something went wrong to post review`,
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }
    async getReviewAndRating(req, res) {
        const headers = {
            Authorization: req.headers["authorization"],
          };
        try {
            let { portal_user_id, page, limit } = req.query;
            let sort = req.query.sort
            let sortingarray = {};
            if (sort != 'undefined' && sort != '' && sort != undefined) {
                let keynew = sort.split(":")[0];
                let value = sort.split(":")[1];
                sortingarray[keynew] = Number(value);
            } else {
                sortingarray['createdAt'] = -1;
            }
            if (portal_user_id != '') {

                let checkUser = await PortalUser.findOne({ _id: mongoose.Types.ObjectId(portal_user_id) });

                if (checkUser.role === 'PHARMACY_STAFF') {

                    let adminData = await StaffInfo.findOne({ for_portal_user: mongoose.Types.ObjectId(portal_user_id) });

                    portal_user_id = adminData?.for_staff

                }
            }

            let filter = {};
            if (portal_user_id !== '') {

                filter = {
                    portal_user_id: { $in: [mongoose.Types.ObjectId(portal_user_id)] },
                }
            }
          

            let aggregate = [
                {
                    $match: filter
                },
                {
                    $lookup: {
                        from: 'admininfos',
                        localField: 'portal_user_id',
                        foreignField: 'for_portal_user',
                        as: 'admininfos'
                    }
                },
                { $unwind: "$admininfos" },
                {
                    $project: {
                        rating: 1,
                        comment: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        patient_login_id: 1,
                        pharmacyName: '$admininfos.pharmacy_name'
                    }
                },
            ];

            const totalCount = await ReviewAndRating.aggregate(aggregate);
            aggregate.push(
                {
                    $sort: sortingarray
                }
            )

            if (limit > 0) {
                aggregate.push({ $skip: (page - 1) * limit }, { $limit: limit * 1 })
            }

            const result = await ReviewAndRating.aggregate(aggregate);


            let patientIDArray = []
            for (const id of result) {
                patientIDArray.push(id.patient_login_id)
            }

            const resData = await httpService.postStaging('patient/get-patient-details-by-id', { ids: patientIDArray }, headers, 'patientServiceUrl');
            const patientDetails = resData.data
            let ratingArray = [];

            for (const value of result) {
                ratingArray.push({
                    rating: value?.rating,
                    comment: value?.comment,
                    createdAt: value?.createdAt,
                    updatedAt: value?.updatedAt,
                    patientName: patientDetails[value?.patient_login_id]?.full_name,
                    profile_picture: patientDetails[value?.patient_login_id]?.profile_pic,
                    pharmacyName: value?.pharmacyName,
                    _id: value?._id
                })
            }

            let getAverage;
            let getAllRatings;
            let ratingCount;

            if (portal_user_id != '') {
                getAverage = await PortalUser.findById(portal_user_id).select('average_rating')
                getAllRatings = await ReviewAndRating.find({ portal_user_id: { $eq: portal_user_id } }).select('rating')

                let fiveStart = 0
                let fourStart = 0
                let threeStart = 0
                let twoStart = 0
                let oneStart = 0

                for (const rating of getAllRatings) {
                    if (rating.rating === 5) fiveStart += 1
                    if (rating.rating === 4) fourStart += 1
                    if (rating.rating === 3) threeStart += 1
                    if (rating.rating === 2) twoStart += 1
                    if (rating.rating === 1) oneStart += 1
                }
                ratingCount = { fiveStart, fourStart, threeStart, twoStart, oneStart }
            }


            // const totalCount = await ReviewAndRating.find({ portal_user_id: { $eq: portal_user_id } }).countDocuments()

            sendResponse(req, res, 200, {
                status: true,
                body: {
                    ratingArray,
                    getAverage,
                    ratingCount,
                    totalCount: totalCount?.length,
                    currentPage: page,
                    totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
                },
                message: `successfully fetched review and ratings`,
                errorCode: null,
            });
        } catch (error) {
            sendResponse(req, res, 500, {
                status: false,
                body: error,
                message: error.message ? error.message : `something went wrong while fetching reviews`,
                errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
            });
        }
    }


    async deleteReviewAndRating(req, res) {
        try {
            const { _id } = req.body;

            const result = await ReviewAndRating.deleteOne({ _id })

            if (result) {
                sendResponse(req, res, 200, {
                    status: true,
                    data: null,
                    message: `Rating & Review Deleted Successfully`,
                    errorCode: null,
                });
            }

        } catch (error) {
            sendResponse(req, res, 500, {
                status: false,
                body: error,
                message: `something went wrong`,
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }


    async getAllPharmacyAdminDetails(req, res) {
        try {
            const allIds = req.query.pharmacyIDs
            let ObjectIdArray = [];
            for (const id of allIds.split(",")) {
                ObjectIdArray.push(mongoose.Types.ObjectId(id))
            }
            const filter = {
                verify_status: "APPROVED",
                'for_portal_user_data.isDeleted': false,
                'for_portal_user_data.isActive': true,
                'for_portal_user_data.lock_user': false,
                for_portal_user: { $in: ObjectIdArray }
            }

            let aggregate = [
                {
                    $lookup: {
                        from: "portalusers",
                        localField: "for_portal_user",
                        foreignField: "_id",
                        as: "for_portal_user_data",
                    }
                },
                { $unwind: "$for_portal_user_data" },
                { $match: filter },
                {
                    $project: {
                        pharmacy_name: 1,
                        pharmacy_name_arabic: 1,
                        profile_picture: 1,
                        profile_picture_signed_url: 1,
                        address: 1,
                        portal_user_id: "$for_portal_user_data._id",
                        pharmacy_email: "$for_portal_user_data.email",
                        portal_user_phone_number: "$for_portal_user_data.phone_number",
                        portal_user_country_code: "$for_portal_user_data.country_code"
                    }
                },
            ];
            const result = await AdminInfo.aggregate(aggregate);
            const dataArray = []
            for (let data of result) {
                data['name'] = data.pharmacy_name;
                if (data?.profile_picture) {
                    data['signed_profile_picture'] = await generateSignedUrl(data.profile_picture);
                } else {
                    data['signed_profile_picture'] = ''; // Default empty value
                }
                dataArray.push(data);
            }
            return sendResponse(req, res, 200, {
                status: true,
                body: dataArray,
                message: "Successfully fetched all hospital",
                errorCode: null,
            });
        } catch (error) {
            return sendResponse(req, res, 500, {
                status: false,
                data: error,
                message: `failed to get all pharmacy details`,
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    // async enterLocation(req, res) {
    //     try {
    //         const locationInfo = new LocationInfo(req.body);
    //         const locationData = await locationInfo.save();
    //         sendResponse(req, res, 200, {
    //             status: true,
    //             data: locationData,
    //             message: `location added`,
    //             errorCode: null,
    //         });
    //     } catch (error) {
    //         sendResponse(req, res, 500, {
    //             status: false,
    //             data: error,
    //             message: `failed to get all pharmacy details`,
    //             errorCode: "INTERNAL_SERVER_ERROR",
    //         });
    //     }
    // }

    async getReviewAndRatinByPatient(req, res) {
        try {
            const { patientId } = req.query;

            const result = await ReviewAndRating.aggregate([
                {
                    $match: { patient_login_id: mongoose.Types.ObjectId(patientId) }
                },
                {
                    $lookup: {
                        from: 'portalusers',
                        localField: 'portal_user_id',
                        foreignField: '_id',
                        as: 'portalusers'
                    }
                },
                { $unwind: { path: "$portalusers", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'admininfos',
                        localField: 'portal_user_id',
                        foreignField: 'for_portal_user',
                        as: 'admininfos'
                    }
                },
                { $unwind: { path: "$admininfos", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'staffinfos',
                        localField: 'portal_user_id',
                        foreignField: 'for_portal_user',
                        as: 'staffinfos'
                    }
                },
                { $unwind: { path: "$staffinfos", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'documentinfos',
                        localField: 'staffinfos.staff_profile',
                        foreignField: '_id',
                        as: 'documentinfos'
                    }
                },
                { $unwind: { path: "$documentinfos", preserveNullAndEmptyArrays: true } },

                {
                    $project: {
                        _id: 1,
                        rating: 1,
                        comment: 1,
                        updatedAt: 1,
                        portal_user_id: 1,
                        role: "$portalusers.role",
                        pharmacyName: "$admininfos.pharmacy_name",
                        pharmacyProfile: "$admininfos.profile_picture",
                        staffProfile: "$documentinfos.url",
                        staffName: "$staffinfos.staff_name"
                    }
                }
            ]);

            let objArray = [];

            //arrange data
            for (const element of result) {
                const date = new Date(element.updatedAt);

                const year = date.getFullYear();
                const month = date.getMonth() + 1; // JavaScript months are zero-based
                const day = date.getDate();
                const hours = date.getHours();
                const minutes = date.getMinutes();
                const seconds = date.getSeconds();

                let filteredDate = `${year}-${month}-${day}`
                let filteredTime = `${hours}:${minutes}:${seconds}`
                if (element.role === 'PHARMACY_ADMIN') {
                    objArray.push(
                        {
                            _id: element?._id,
                            rating: element?.rating,
                            comment: element?.comment,
                            date: filteredDate,
                            time: filteredTime,
                            role: element?.role,
                            name: element?.pharmacyName,
                            for_portal_user: element?.portal_user_id,
                            profileUrl: element?.pharmacyProfile ? element?.pharmacyProfile : '',
                        }
                    )
                } else {
                    objArray.push(
                        {
                            rating: element?.rating,
                            comment: element?.comment,
                            role: element?.role,
                            date: filteredDate,
                            time: filteredTime,
                            name: element?.staffName,
                            for_portal_user: element?.portal_user_id,
                            profileUrl: element?.staffProfile ? element?.staffProfile : '',
                        }
                    )
                }
            }

            //get signed profile picture url
            for (const element of objArray) {
                element.profileUrl = ""
            }

            sendResponse(req, res, 200, {
                status: true,
                data: objArray,
                message: `successfully fetched review and ratings`,
                errorCode: null,
            });
        } catch (error) {
            sendResponse(req, res, 500, {
                status: false,
                body: error,
                message: error.message ? error.message : `something went wrong while fetching reviews`,
                errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
            });
        }
    }
    async getPharmacyById(req, res) {
        const { for_portal_user } = req.query
        try {

            const findUsers = await AdminInfo.findOne({ for_portal_user }, {
                for_portal_user: 1,
                pharmacy_name: 1,
                profile_picture: 1
            }).populate({
                path: 'for_portal_user',
                select: 'email country_code phone_number'
            })

            sendResponse(req, res, 200, {
                status: true,
                body: findUsers,
                message: "Get pharmacy list",
                errorCode: null,
            });
        }
        catch (error) {
            console.error("An error occurred:", error);
            sendResponse(req, res, 500, {
                status: false,
                body: null,
                message: "failed to get pharmacy details",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async listApprovedPharmacyAdminUser(req, res) {
        try {
            const { name, status } = req.query;
            
            const result = await AdminInfo.find({
                $and: [
                    {
                        pharmacy_name: { $regex: name || "", $options: "i" },
                    },
                    {
                        verify_status: { $regex: status || "", $options: "i" }
                    },
                ],
            })
                .select(
                    "for_portal_user pharmacy_name verify_status"
                )
                .populate('for_portal_user', null, null, { createdBy: 'self' })

                .exec();
            
            const count = await AdminInfo.countDocuments({
                $and: [
                    {
                        pharmacy_name: { $regex: name || "", $options: "i" },
                    },
                    {
                        verify_status: { $regex: status || "", $options: "i" }
                    }
                ],
            });
            
            sendResponse(req, res, 200, {
                status: true,
                data: {
                    data: result,
                    totalCount: count,
                },
                message: "successfully fetched pharmacy admin list",
                errorCode: null,
            });
        } catch (error) {
            
            sendResponse(req, res, 500, {
                status: false,
                data: error,
                message: "failed to fetch pharmacy admin list",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async getOrderDetailsById(req, res) {
        try {
            const { ids } = req.query;


            const idObjects = ids.map((id) => mongoose.Types.ObjectId(id));

            const results = await OrderDetail.find({ _id: { $in: idObjects } });

            if (results.length === 0) {
                return res.status(200).json({ message: 'No matching OrderDetail found' });
            }

            sendResponse(req, res, 200, {
                status: true,
                data: results,
                message: 'Order Details',
                errorCode: null,
            });
        } catch (err) {
            console.error(err);
            sendResponse(req, res, 500, {
                status: false,
                data: err,
                message: 'Failed to fetch data',
                errorCode: 'INTERNAL_SERVER_ERROR',
            });
        }
    }

    async saveSuperadminNotification(req, res) {
        try {

            let saveNotify = new Notification({
                created_by: req.body.data?.created_by,
                notification_name: req.body.data?.notification_name,
                for_portal_user: req.body?.data?.for_portal_user,
                content: req.body.data?.content,
                created_by_type: req.body.data?.created_by_type,
                notitype: req.body.data?.notitype
            })
            let saveData = await saveNotify.save();

            if (saveData) {
                return sendResponse(req, res, 200, {
                    status: true,
                    body: saveData,
                    message: "Notification Saved Successfully",
                });
            } else {
                return sendResponse(req, res, 400, {
                    status: true,
                    body: [],
                    message: "Notification not Saved",
                });
            }

        } catch (err) {
            
            return sendResponse(req, res, 500, {
                status: false,
                body: err,
                message: "Internal server error",
            });
        }
    }

    async totalPharmacyforAdminDashboard(req, res) {
        try {
            const totalCount = await PortalUser.countDocuments({ isDeleted: false });

            if (totalCount >= 0) {
                return sendResponse(req, res, 200, {
                    status: true,
                    body: { totalCount },
                    message: "Pharmacy Count Fetch Successfully",
                });
            } else {
                return sendResponse(req, res, 400, {
                    status: true,
                    body: { totalCount: 0 },
                    message: "Pharmacy Count not Fetch",
                });
            }
        } catch (err) {
            return sendResponse(req, res, 500, {
                status: false,
                body: err,
                message: "Internal server error",
            });
        }
    }

    async notification(req, res) {
        try {
            const {
              created_by_type,
              created_by,
              content,
              url,
              for_portal_user,
              title,
              appointmentId,
            } = req.body
            
            const addObject = {
              created_by_type,
              created_by,
              content,
              url,
              for_portal_user,
              title,
              appointmentId,
            }
            const notificationValue = new Notification(addObject);
            await notificationValue.save();
      
            sendResponse(req, res, 200, {
              status: true,
              message: `notification save in database successfully`,
              body: null,
              errorCode: null,
            });
          } catch (error) {
            sendResponse(req, res, 500, {
                status: false,
                body: error,
                message: `failed to get reason for appointment list`,
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async notificationlist(req, res) {     
        try {
            const notificationData = await Notification.find({
                for_portal_user: mongoose.Types.ObjectId(req.query.for_portal_user)

            }).sort({ createdAt: -1 }).limit(10)
            const count = await Notification.countDocuments({
                for_portal_user: mongoose.Types.ObjectId(req.query.for_portal_user),
                new: true
            });
            const isViewcount = await Notification.countDocuments({
                for_portal_user: mongoose.Types.ObjectId(req.query.for_portal_user),
                isView: false
            });
            const headers = {
                'Authorization': req.headers['authorization']
            }
            let newnotificationlist = [];
            if (notificationData.length > 0) {
                for await (const element of notificationData) {
                    let object = {
                        created_by_type: element.created_by_type,
                        appointmentId: element.appointmentId,
                        notitype: element.notitype,
                        _id: element._id,
                        content: element.content,
                        url: element.url,
                        created_by: element.created_by,
                        for_portal_user: element.for_portal_user,
                        createdAt: element.createdAt,
                        updatedAt: element.updatedAt,
                        isView: element.isView
                    };
                    if (element.created_by_type == 'patient') {
                        let ids = [element.created_by];
                        let resData = await httpService.postStaging('patient/get-patient-details-by-id', { ids: ids }, headers, 'patientServiceUrl');
                        object.name = resData.data[element.created_by].full_name
                        object.picture = resData.data[element.created_by].profile_pic
                        newnotificationlist.push(object)
                    } else {
                        object.name = ''
                        object.picture = ''
                        newnotificationlist.push(object)
                    }
                }

            }
            sendResponse(req, res, 200, {
                status: true,
                body: { list: newnotificationlist, count: count, isViewcount: isViewcount },

                message: `notification list`,
                errorCode: null,
            });         

        } catch (error) {
            sendResponse(req, res, 500, {
                status: false,
                body: error,
                message: `failed to get reason for appointment list`,
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async updateNotificationStatus(req, res) {
        try {
            const { id, notification } = req.body;
            const updatedNotification = await PortalUser.findByIdAndUpdate(
                { _id: id },
                { notification: notification }, // Update only the notification field
                { upsert: false, new: true }
            );
            sendResponse(req, res, 200, {
                status: true,
                body: updatedNotification,
                message: "Successfully updated notification status",
                errorCode: null,
            })
        } catch (error) {
            console.error("An error occurred:", error);
            sendResponse(req, res, 500, {
                status: false,
                body: null,
                message: "failed to update notification",
                errorCode: "INTERNAL_SERVER_ERROR",
            })
        }
    }

    async getPortalUserData(req, res) {
        try {
            let result = await PortalUser.find({ _id: mongoose.Types.ObjectId(req.query.data), isDeleted: false }).exec();

            sendResponse(req, res, 200, {
                status: true,
                data: result,
                message: `portal data fetch successfully`,
                errorCode: null,
            });
        } catch (error) {
            
            sendResponse(req, res, 500, {
                status: false,
                body: error,
                message: "Internal server error",
                errorCode: null,
            });
        }
    }


    async updatelogsData(req, res) {
        const { currentLogID, userAddress } = req.body;
        try {
            const currentDate = new Date();
            const formattedDate = currentDate.toISOString();
            if (userAddress) {
                await Logs.findOneAndUpdate(
                    { _id: mongoose.Types.ObjectId(currentLogID) },
                    {
                        $set: {
                            userAddress: userAddress,

                        },
                    },
                    { new: true }
                ).exec();
            } else {

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

    async getAllLogs(req, res) {
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

    async unregisterPharmacyStaff(req, res) {
        try {
            const {

                first_name,
                last_name,
                middle_name,
                email,
                role,
                created_by_user,
                creator_name

            } = req.body;


            let dummyEmail = 'sapphire.lok82@example.com'

            let finalemail;
      
            if (email == '' || email == null) {
              finalemail = dummyEmail
      
            } else {
      
              let userFind = await PortalUser.findOne(
                {
                  email: email.toLowerCase(), isDeleted: false
                }
              );
              if (userFind) {
                return sendResponse(req, res, 200, {
                  status: false,
                  body: userFind,
                  message: "User already exist",
                  errorCode: null,
                });
              }
              finalemail = email;
            }
            const passwordHash = await hashPassword("Admin@123");
            let userData = new PortalUser(
                {
                    user_name: first_name + " " + middle_name + " " + last_name,
                    email:finalemail,
                    country_code: "+223",
                    mobile: '',
                    role: "PHARMACY_STAFF",
                    password: passwordHash,
                    staff_createdBy: created_by_user,
                    verified: true,
                    creator_name
                }
            );
            let userDetails = await userData.save();
            let locationData = new LocationInfo(
                {

                    for_portal_user: userDetails._id
                }
            );
            let locationDetails = await locationData.save();


            let staffData = new StaffInfo(
                {
                    staff_name: first_name + " " + middle_name + " " + last_name,
                    first_name,
                    last_name,
                    middle_name,
                    role,
                    in_location: locationDetails._id,
                    for_staff: created_by_user,
                    for_portal_user: userDetails._id,
                }
            );
            let staffDetails = await staffData.save()
            sendResponse(req, res, 200, {
                status: true,
                body: staffDetails,
                message: "successfully created individual doctor staff",
                errorCode: null,
            });



        } catch (error) {
            console.error("An error occurred:", error);
            sendResponse(req, res, 500, {
                status: false,
                body: null,
                message: "failed to create individual doctor staff",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async unregisterPharmacyList(req, res) {
        try {
            const { page, limit, name, start_date, end_date } = req.query;

            let sort = req.query.sort
            let sortingarray = {};
            if (sort != 'undefined' && sort != '' && sort != undefined) {
                let keynew = sort.split(":")[0];
                let value = sort.split(":")[1];
                sortingarray[keynew] = Number(value);
            } else {
                sortingarray['createdAt'] = -1;

            }

            let filter = {
                verify_status: 'APPROVED',
                "for_portal_user.isDeleted": false
            }
            if (name != '') {
                filter.pharmacy_name = { $regex: name || "", $options: "i" }
            }
            if (start_date != '' && end_date != '') {
                filter.createdAt = {
                    $gte: new Date(start_date), $lte: new Date(end_date)
                }
            }
            else if (start_date != '') {
                filter.createdAt = { $gte: new Date(start_date) }


            }
            else if (end_date != '') {
                filter.createdAt = {
                    $lte: new Date(end_date)
                }

            }


            let aggregate = [
                {
                    $lookup: {
                        from: "portalusers",
                        localField: "for_portal_user",
                        foreignField: "_id",
                        as: "for_portal_user"
                    }
                },
                {
                    $unwind: {
                        path: "$for_portal_user",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $match: filter
                },

            ]
            
            const count = await AdminInfo.aggregate(aggregate);

            if (limit != 0) {
                aggregate.push(
                    {
                        $sort: sortingarray
                    },
                    {
                        $skip: (page - 1) * limit

                    }, {
                    $limit: limit * 1
                }
                )
            }

            const result = await AdminInfo.aggregate(aggregate);

            sendResponse(req, res, 200, {
                status: true,
                data: {
                    data: result,
                    totalCount: count.length,
                },
                message: "successfully fetched pharmacy admin list",
                errorCode: null,
            });
        } catch (error) {
            
            sendResponse(req, res, 500, {
                status: false,
                data: error,
                message: "failed to fetch pharmacy admin list",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }


    async getUnregisterPharmacyDetails(req, res) {
        try {
            const { pharmacyId } = req.query;

            const portalUserData = await PortalUser.findOne({ _id: mongoose.Types.ObjectId(pharmacyId) })

            if (!portalUserData) {
                return sendResponse(req, res, 200, {
                    status: false,
                    body: null,
                    message: "User not found",
                    errorCode: null,
                });
            }

            if (portalUserData) {
                const pharmAdmin_infoData = await AdminInfo.findOne({ for_portal_user: mongoose.Types.ObjectId(pharmacyId) })

                const data = {
                    pharmacy_name: pharmAdmin_infoData?.pharmacy_name,
                    first_name: pharmAdmin_infoData?.first_name,
                    middle_name: pharmAdmin_infoData?.middle_name,
                    last_name: pharmAdmin_infoData?.last_name,
                    email: portalUserData?.email,

                }
                if (pharmAdmin_infoData) {

                    sendResponse(req, res, 200, {
                        status: true,
                        body: data,
                        message: "Getting Pharmacy Data successfully!",
                        errorCode: null,
                    });
                }
            }
        } catch (error) {
            console.error("An error occurred:", error);
            sendResponse(req, res, 500, {
                status: false,
                body: null,
                message: "failed to create user",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }


    }

    async unregisterPharmacyUpdate(req, res) {
        try {
            const { pharmacyId, first_name, middle_name, pharmacy_name, last_name, email, } = req.body;


            let userFind = await PortalUser.findOne({ _id: mongoose.Types.ObjectId(pharmacyId), isDeleted: false });
            if (!userFind) {
                return sendResponse(req, res, 200, {
                    status: false,
                    body: userFind,
                    message: "User not exist",
                    errorCode: null,
                });
            } else {


                const portaldata = await PortalUser.findOneAndUpdate(
                    { _id: pharmacyId },
                    {
                        $set: {
                            user_name: first_name + " " + middle_name + " " + last_name,
                            first_name: first_name,
                            last_name: last_name,
                            middle_name: middle_name,
                            pharmacy_name: pharmacy_name,
                            email:email
                        }
                    },
                    { upsert: false, new: true })

                const adminInfo = await AdminInfo.findOneAndUpdate(
                    { for_portal_user: mongoose.Types.ObjectId(pharmacyId) },
                    {
                        $set: {

                            first_name: first_name,
                            last_name: last_name,
                            middle_name: middle_name,
                            pharmacy_name: pharmacy_name
                        }
                    },
                    { upsert: false, new: true }
                )
                if (adminInfo || portaldata) {

                    return sendResponse(req, res, 200, {
                        status: true,
                        body: null,
                        message: "Pharmacy Details Upadte Successfully!",
                        errorCode: null,
                    });
                }
            }

        } catch (error) {
            console.error("An error occurred:", error);
            sendResponse(req, res, 500, {
                status: false,
                body: null,
                message: "failed to create user",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async getTotalPharmacyCount(req, res) {
        try {
          const {fromDate, toDate} = req.query
          let date_filter = {}
          if(fromDate && toDate) {
            const fromDateObj = new Date(`${fromDate} 00:00:00`);
            const toDateObj = new Date(`${toDate} 23:59:59`);
            date_filter.createdAt = { $gte: fromDateObj, $lte: toDateObj }
          }
          const filterPipeline = [
            {
                $lookup: {
                    from: 'portalusers', // Collection name of the referenced model
                    localField: 'for_portal_user',
                    foreignField: '_id',
                    as: 'for_portal_user'
                }
            },
            {
                $unwind: '$for_portal_user'
            },
            {
                $match: {
                    'for_portal_user.isDeleted': false,
                    verify_status: "APPROVED",
                    $and: [
                      date_filter
                    ]
                }
            },
            {
                $count: 'count'
            }
          ];
          const getCount = await AdminInfo.aggregate(filterPipeline);
          sendResponse(req, res, 200, {
            status: true,
            message: `Total count.`,
            data: getCount?.length > 0 ? getCount[0]?.count : 0,
            errorCode: null,
          });
        } catch (error) {
          sendResponse(req, res, 500, {
            status: false,
            message: "Internal server error",
            body: error,
            errorCode: null,
          });
        }
    }

    async getTotalPharmacyRecords(req, res) {
        try {
          const { fromDate, toDate } = req.query;
          let date_filter = {};
      
          if (fromDate && toDate) {
            const fromDateObj = new Date(`${fromDate} 00:00:00`);
            const toDateObj = new Date(`${toDate} 23:59:59`);
            date_filter.createdAt = { $gte: fromDateObj, $lte: toDateObj };
          }
      
          const filterPipeline = [
            {
              $lookup: {
                from: 'portalusers',
                localField: 'for_portal_user',
                foreignField: '_id', 
                as: 'for_portal_user',
              },
            },
            {
              $unwind: '$for_portal_user',
            },
            {
              $match: {
                'for_portal_user.isDeleted': false,
                verify_status: 'APPROVED',
                $and: [date_filter],
              },
            },
          ];
          const data = await AdminInfo.aggregate(filterPipeline);
      
          const countPipeline = [
            {
              $lookup: {
                from: 'portalusers',
                localField: 'for_portal_user',
                foreignField: '_id',
                as: 'for_portal_user',
              },
            },
            {
              $unwind: '$for_portal_user',
            },
            {
              $match: {
                'for_portal_user.isDeleted': false,
                verify_status: 'APPROVED',
                $and: [date_filter],
              },
            },
            {
              $count: 'count',
            },
          ];
      
          const countData = await AdminInfo.aggregate(countPipeline);
          const totalCount = countData?.length > 0 ? countData[0].count : 0;
      
          return sendResponse(req, res, 200, {
            status: true,
            message: `Total Pharmacies`,
            data: {
              activeCount: totalCount,
              pharmacies: data,
            },
            errorCode: null,
          });
        } catch (error) {
          return sendResponse(req, res, 500, {
            status: false,
            message: 'Internal server error',
            body: error,
            errorCode: null,
          });
        }
      }      

    async getDashboardData(req, res) {
        try {
          const {fromDate, toDate} = req.query
          let filter = {}
          if (req.user?.role == 'pharmacy') {
            filter.forPortalUser = mongoose.Types.ObjectId(req?.user?.portalUserId);
          }
          if(fromDate && toDate) {
            const fromDateObj = new Date(`${fromDate} 00:00:00`);
            const toDateObj = new Date(`${toDate} 23:59:59`);
            filter.createdAt = { $gte: fromDateObj, $lte: toDateObj }
          }

          const totalOrder = OrderDetail.find({...filter, status: {$in: ["new", "accepted", "completed", "cancelled"]}}).countDocuments()
          const totalcompletedOrder = OrderDetail.find({...filter, status: {$in: ["completed"]}}).countDocuments()
          const totalNewOrder = OrderDetail.find({...filter, status: {$in: ["new"]}}).countDocuments()
          const totalCancelledOrder = OrderDetail.find({...filter, status: {$in: ["cancelled"]}}).countDocuments()
          
          const totalCount = await Promise.all([totalOrder, totalcompletedOrder, totalNewOrder, totalCancelledOrder])
    
          sendResponse(req, res, 200, {
              status: true,
              message: `Dashboard data fetched successfully`,
              body: {
                totalOrder: totalCount[0],
                totalcompletedOrder: totalCount[1],
                totalNewOrder: totalCount[2],
                totalCancelledOrder: totalCount[3]
              },
              errorCode: null,
          });
      } catch (error) {
          sendResponse(req, res, 500, {
              status: false,
              body: error,
              message: `failed to get dashboard data`,
              errorCode: "INTERNAL_SERVER_ERROR",
          });
      }
    }
    
    async getDashboardRecords(req, res) {
        try {
            const { fromDate, toDate } = req.query;
            let filter = {};

            const headers = {
                Authorization: req.headers["authorization"],
            };

            if (req.user?.role === 'pharmacy') {
                filter.forPortalUser = mongoose.Types.ObjectId(req?.user?.portalUserId);
            }

            if (fromDate && toDate) {
                const fromDateObj = new Date(`${fromDate} 00:00:00`);
                const toDateObj = new Date(`${toDate} 23:59:59`);
                filter.createdAt = { $gte: fromDateObj, $lte: toDateObj };
            }

            // Fetch all records instead of just counts
            const totalOrders = await OrderDetail.find({ ...filter, status: { $in: ["new", "accepted", "completed", "cancelled"] } });
            const patientIdsArray = [...new Set(totalOrders.map(appt => appt.patientId.toString()))];
            const appointmentIdArray = [...new Set(totalOrders.map(appt => appt.appointmentId.toString()))];

            const getPatientDetails = await httpService.postStaging(
                "patient/get-patient-details-by-id",
                { ids: patientIdsArray },
                headers,
                "patientServiceUrl"
            );

            const getAppointmentDetails = await httpService.postStaging(
                "appointment/all-appointments",
                { ids: appointmentIdArray },
                headers,
                "doctorServiceUrl"
            );

            const patientDetailsMap = getPatientDetails?.data || {};
            const mergedData = getAppointmentDetails?.data?.appointmentDetails.map(appt => ({
                ...appt,
                patientDetails: patientDetailsMap[appt.patientId.toString()] || null
            }));

            sendResponse(req, res, 200, {
                status: true,
                message: `Dashboard data fetched successfully`,
                body: mergedData,
                errorCode: null,
            });
        } catch (error) {
            sendResponse(req, res, 500, {
                status: false,
                body: error,
                message: `Failed to get dashboard data`,
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async getDashboardGraphData(req, res) {
        try {
          const {fromDate, toDate} = req.query
          
          let filter = { forPortalUser: mongoose.Types.ObjectId(req?.user?.portalUserId) }
          if(fromDate && toDate) {
            const fromDateObj = new Date(`${fromDate} 00:00:00`);
            const toDateObj = new Date(`${toDate} 23:59:59`);
            filter.createdAt = { $gte: fromDateObj, $lte: toDateObj }
          }
          
          const pipeline = [
            {
              $match: {
                ...filter,
                status: { $in: ["new", "accepted", "completed", "cancelled"] }
              }
            },
            {
              $group: {
                _id: { 
                    date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
                    status: "$status" 
                },
                count: { $sum: 1 },
              }
            },
            {
              $project: {
                _id: 0,
                createdAt: "$_id.date",
                status: "$_id.status",
                count: 1
              }
            },
          ]
          const getOrderCounts = await OrderDetail.aggregate(pipeline);
      
          const startDate = new Date(fromDate);
          const endDate = new Date(toDate);
          const allDates = [];
          for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            allDates.push(new Date(date).toISOString().split("T")[0]);
          }
      
          const statusCounts = {
            new: [],
            completed: [],
            accepted: [],
            cancelled: []
          };
      
          allDates.forEach(date => {
            ["new", "accepted", "completed", "cancelled"].forEach(status => {
              const order = getOrderCounts.find(ord => ord.createdAt === date && ord.status === status);
              statusCounts[status].push({
                date: date,
                count: order ? order.count : 0
              });
            });
          });
      
          sendResponse(req, res, 200, {
            status: true,
            message: `Dashboard data fetched successfully`,
            body: statusCounts,
            errorCode: null,
          });
        } catch (error) {
          sendResponse(req, res, 500, {
              status: false,
              body: error,
              message: `failed to get dashboard data`,
              errorCode: "INTERNAL_SERVER_ERROR",
          });
        }
    }

    async getOrdersWithDoctorPatientDetails(req, res) {
        try {
            let { startDate, endDate } = req.query;
        let filter = {};
        if(startDate && endDate){
            startDate = new Date(startDate);
            endDate = new Date(endDate);
            endDate.setHours(23, 59, 59, 999);
            filter.createdAt = { $gte: startDate, $lte: endDate}
        }
            const orders = await OrderDetail.find(filter).select('doctorId patientId orderId status');

            const doctorIds = orders.map(order => order.doctorId.toString());
            const patientIds = orders.map(order => order.patientId.toString());

            const headers = {
                Authorization: 'Bearer ' + generateToken({ role: 'superadmin' })
            };

            const doctorData = await Promise.all(
                doctorIds.map(id => 
                    httpService.getStaging(
                        "doctor/get-doctor-portal-data",
                        { doctorId: id },
                        headers,
                        "doctorServiceUrl"
                    )
                )
            );

            const getDetails = await httpService.postStaging(
                "patient/get-patient-details-by-id",
                { ids: patientIds },
                headers,
                "patientServiceUrl"
            );

            const doctorMap = doctorData.reduce((map, doctor) => {
                if (doctor?.body) {
                    map[doctor.body._id.toString()] = doctor.body;
                }
                return map;
            }, {});

            const finalOrders = await Promise.all(
                orders.map(async order => {
                    const doctorId = order.doctorId.toString();
                    const patientId = order.patientId.toString();
                    const doctor = doctorMap[doctorId] || {};
                    const patient = getDetails.data?.[patientId] || {};


                    return {
                        ...order.toObject(),
                        doctorName: doctor?.full_name || '',
                        doctorArabicName: doctor?.full_name_arabic || '',
                        patientName: patient?.full_name || '',
                        patientGender: patient?.gender || '',
                        orderStatus: order?.status || '',
                        mrnNumber: patient?.mrn_number || '',
                    };
                })
            );

            return sendResponse(req, res, 200, {
                status: true,
                message: "Data fetched successfully",
                data: finalOrders,
                totalOrders: finalOrders.length,
                errorCode: null,
            });
        } catch (error) {
            return sendResponse(req, res, 500, {
                status: false,
                message: "Failed to get data.",
                body: error,
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }
}
module.exports = new PharmacyController();
