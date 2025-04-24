"use strict";

import PortalUser from "../models/portal_user";
import BasicInfo from "../models/basic_info";
import Counter from "../models/counter";
import Otp2fa from "../models/otp";
import LocationInfo from "../models/location_info";
import DocumentInfo from "../models/document_info";
import StaffInfo from "../models/staffInfo";
import ForgotPasswordToken from "../models/forgot_password_token";
import { generate4DigitOTP, smsTemplateOTP, AppointmentReasonColumns, config } from "../config/constants";
import { sendSms } from "../middleware/sendSms";
import { sendEmail } from "../helpers/ses";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { sendResponse } from "../helpers/transmission";
import {
  bcryptCompare,
  checkPassword,
  generateRefreshToken,
  generateTenSaltHash,
  generateToken,
  processExcel,
} from "../middleware/utils";
import mongoose from "mongoose";
import { hashPassword } from "../helpers/string";
import EducationalDetail from "../models/educational_details";
import HospitalLocation from "../models/hospital_location";
import Http from "../helpers/httpservice";
const httpService = new Http();
import Availability from "../models/availability";
import FeeManagement from "../models/fee_management";
import DocumentManagement from "../models/document_management";
import ReasonForAppointment from "../models/reason_of_appointment";
import ReviewAndRating from "../models/reviews";
import Questionnaire from "../models/questionnaire";
import fs from "fs";
import PathologyTestInfoNew from "../models/pathologyTestInfoNew";
import Appointment from "../models/appointment";
import moment from "moment";
import Notification from "../models/notification";
import { agoraTokenGenerator } from "../helpers/chat";
import Logs from "../models/logs";
import ProviderDocs from "../models/provider_document";
import { notification, sendNotification } from "../helpers/notification";
import { generateSignedUrl, uploadSingleOrMultipleDocuments } from "../helpers/gcs";
const { OTP_EXPIRATION, OTP_LIMIT_EXCEED_WITHIN, OTP_TRY_AFTER, SEND_ATTEMPTS, test_p_FRONTEND_URL, LOGIN_AFTER, PASSWORD_ATTEMPTS } = config

const validateColumnWithExcel = (toValidate, excelColumn) => {
  const requestBodyCount = Object.keys(toValidate).length;
  const fileColumnCount = Object.keys(excelColumn).length;
  if (requestBodyCount !== fileColumnCount) {
    return false;
  }

  let index = 1;
  for (const iterator of Object.keys(excelColumn)) {
    if (iterator !== toValidate[`col${index}`]) {
      return false;
    }
    index++;
  }
  return true;
};

export const addTestsForMngDoc = async (pathologyInfo, id, type) => {
  for (const test of pathologyInfo) {
    try {
      const existingTest = await PathologyTestInfoNew.findOne({
        for_portal_user: id,
        typeOfTest: test.typeOfTest,
        nameOfTest: test.nameOfTest,
      });

      if (existingTest) {
      } else {
        if (test.isExist === false) {
          await PathologyTestInfoNew.create({
            for_portal_user: id,
            typeOfTest: test.typeOfTest,
            nameOfTest: test.nameOfTest,
            isExist: true,
            type,
          });
        }
      }
    } catch (error) {
      console.error("Erroroccurreddddd:", error);
      // Handle the error as needed
    }
  }
};

const getDoctorOpeningsHours = async (week_days) => {
  let Sunday = [];
  let Monday = [];
  let Tuesday = [];
  let Wednesday = [];
  let Thursday = [];
  let Friday = [];
  let Saturday = [];
  if (week_days) {
    week_days.forEach((data) => {
      Sunday.push({
        start_time:
          data.sun_start_time.slice(0, 2) +
          ":" +
          data.sun_start_time.slice(2, 4),
        end_time:
          data.sun_end_time.slice(0, 2) + ":" + data.sun_end_time.slice(2, 4),
      });
      Monday.push({
        start_time:
          data.mon_start_time.slice(0, 2) +
          ":" +
          data.mon_start_time.slice(2, 4),
        end_time:
          data.mon_end_time.slice(0, 2) + ":" + data.mon_end_time.slice(2, 4),
      });
      Tuesday.push({
        start_time:
          data.tue_start_time.slice(0, 2) +
          ":" +
          data.tue_start_time.slice(2, 4),
        end_time:
          data.tue_end_time.slice(0, 2) + ":" + data.tue_end_time.slice(2, 4),
      });
      Wednesday.push({
        start_time:
          data.wed_start_time.slice(0, 2) +
          ":" +
          data.wed_start_time.slice(2, 4),
        end_time:
          data.wed_end_time.slice(0, 2) + ":" + data.wed_end_time.slice(2, 4),
      });
      Thursday.push({
        start_time:
          data.thu_start_time.slice(0, 2) +
          ":" +
          data.thu_start_time.slice(2, 4),
        end_time:
          data.thu_end_time.slice(0, 2) + ":" + data.thu_end_time.slice(2, 4),
      });
      Friday.push({
        start_time:
          data.fri_start_time.slice(0, 2) +
          ":" +
          data.fri_start_time.slice(2, 4),
        end_time:
          data.fri_end_time.slice(0, 2) + ":" + data.fri_end_time.slice(2, 4),
      });
      Saturday.push({
        start_time:
          data.sat_start_time.slice(0, 2) +
          ":" +
          data.sat_start_time.slice(2, 4),
        end_time:
          data.sat_end_time.slice(0, 2) + ":" + data.sat_end_time.slice(2, 4),
      });
    });
  }
  return {
    Sunday,
    Monday,
    Tuesday,
    Wednesday,
    Thursday,
    Friday,
    Saturday,
  };
};

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

const getAllDoctor = (paginatedResults, headers) => {
  return new Promise(async (resolve, reject) => {
    const doctorIdsArray = paginatedResults.map(val => val.doctorId)
    let doctorDetails = {}
    if (doctorIdsArray.length > 0) {
      const getDetails = await httpService.postStaging(
        "individual-doctor/get-patient-doctors",
        {
          doctorIds: doctorIdsArray,
        },
        headers,
        "doctorServiceUrl"
      );
      if (getDetails?.status) {
        for (const doctor of getDetails?.body?.results) {
          doctorDetails[doctor?.for_portal_user?._id] = doctor
        }
      }
    }
    resolve(doctorDetails)
  })
}
const getAllPatient = (paginatedResults) => {
  return new Promise(async (resolve, reject) => {
    const patientIdsArray = paginatedResults.map(val => val.patientId)
      let patientDetails = {}
      if (patientIdsArray.length > 0) {
        const getDetails = await httpService.postStaging(
          "patient/get-patient-details-by-id",
          { ids: patientIdsArray },
          {},
          "patientServiceUrl"
        );
  
        if (getDetails?.status) {
          patientDetails = getDetails?.data
        }
      }
    resolve(patientDetails)
  })
}

class LabRadiology {
  async signUp(req, res) {
    try {
      const {
        first_name,
        middle_name,
        last_name,
        email,
        password,
        country_code,
        phone_number,
        type,
      } = req.body;
      let userFind = await PortalUser.findOne({
        email: email.toLowerCase(),
        isDeleted: false,
      });
      if (userFind) {
        return sendResponse(req, res, 200, {
          status: false,
          body: userFind,
          message: "User already exist",
          errorCode: null,
        });
      }
      const salt = await bcrypt.genSalt(10);
      let newPassword = await bcrypt.hash(password, salt);
      let sequenceDocument = await Counter.findOneAndUpdate(
        { _id: "employeeid" },
        { $inc: { sequence_value: 1 } },
        { new: true }
      );
      let userData = new PortalUser({
        full_name: first_name + " " + middle_name + " " + last_name,
        email,
        country_code,
        phone_number,
        password: newPassword,
        role: "INDIVIDUAL",
        type,
        user_id: sequenceDocument.sequence_value,
        isFirstTime: 0,
      });
      let userDetails = await userData.save();
      let adminData = new BasicInfo({
        full_name: first_name + " " + middle_name + " " + last_name,
        first_name,
        middle_name,
        last_name,
        for_portal_user: userDetails._id,
        main_phone_number: phone_number,
        type,
      });
      let adminDetails = await adminData.save();

      let superadminData = await httpService.getStaging(
        "superadmin/get-super-admin-data",
        {},
        {},
        "superadminServiceUrl"
      );

      let requestData = {
        created_by_type: userDetails?.type,
        created_by: userDetails?._id,
        content: `New Registration From ${userDetails?.full_name}`,
        url: "",
        for_portal_user: superadminData?.body?._id,
        notitype: "New Registration",
        appointmentId: userDetails?._id,
      };

      await notification(
        "",
        "",
        "superadminServiceUrl",
        "",
        "",
        "",
        "",
        requestData
      );
      sendResponse(req, res, 200, {
        status: true,
        body: {
          adminDetails,
          userDetails,
        },
        message: "Registration Successfully!",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "Failed to create user.",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password, type } = req.body;
      const { uuid } = req.headers;

      const portalUserData = await PortalUser.findOne({
        email,type:type,
        isDeleted: false,
      }).lean();

      if (!portalUserData) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "User not found",
          errorCode: "USER_NOT_FOUND",
        });
      }
      const currentTime = new Date()

      if (type !== portalUserData.type) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: `Please login to ${portalUserData.type} portal.`,
          errorCode: "TYPE_MISMATCH",
        });
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
        if (data?.lock_details?.passwordAttempts == PASSWORD_ATTEMPTS) {
          const addMinutes = new Date(currentTime.getTime() + LOGIN_AFTER * 60000);
          await PortalUser.findOneAndUpdate(
            {_id: portalUserData._id},
            { $set: {
              lock_user: true,
              'lock_details.timestamps': addMinutes,
              'lock_details.lockedReason': "Incorrect password attempt",
              'lock_details.lockedBy': type.toLowerCase(),
            }}
          )
        }
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "The password is incorrect.",
          errorCode: "INCORRECT_PASSWORD",
        });
      }
      portalUserData.password = undefined;

      if (portalUserData.isDeleted === true) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "User deleted successfully.",
          errorCode: "USER_DELETED",
        });
      }
      let isAccountLocked = portalUserData.lock_user;
      const lock_details = portalUserData?.lock_details
      //Unlock account if locked by lab/radiology itself
      if (portalUserData?.lock_details && portalUserData.lock_details?.lockedBy == type.toLowerCase()) {
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
      let adminData;
      const deviceExist = await Otp2fa.findOne({
        uuid,
        for_portal_user: portalUserData._id,
        verified: true,
      }).lean();
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
              adminData,
            },
          },
          message: "OTP verification pending 2fa",
          errorCode: "VERIFICATION_PENDING",
        });
      }

      if (portalUserData.role == "INDIVIDUAL" || portalUserData.role == "ADMIN" ) {
        let adminData1 = await BasicInfo.aggregate([
          {
            $match: { for_portal_user: portalUserData?._id, type: type },
          },
          {
            $lookup: {
              from: "locationinfos",
              localField: "in_location",
              foreignField: "_id",
              as: "locationinfos",
            },
          },
        ]);

        if (adminData1.length > 0) {
          adminData = adminData1[0];
        }

        if (adminData?.locationinfos.length > 0) {
          try {
            let locationids = {
              country_id: adminData?.locationinfos[0]?.country,
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
                countryname: locationdata?.body?.country_name,
                country_iso_code: locationdata?.body?.country_iso_code,
              };
              adminData.locationinfos[0].region =
                locationdata?.body?.region_name;
              adminData.locationinfos[0].province =
                locationdata?.body?.province_name;
              adminData.locationinfos[0].village =
                locationdata?.body?.village_name;
              adminData.locationinfos[0].city = locationdata?.body?.city_name;
              adminData.locationinfos[0].department =
                locationdata?.body?.department_name;
            }
          } catch (err) {}
        }
        if (adminData.verify_status !== "APPROVED") {
          const currentDate = new Date();
          const timeZone = process.env.TIMEZONE;
          
          const formattedDate = currentDate.toLocaleString("en-US", { timeZone });
          let addLogs = {};
          let saveLogs = {};

          addLogs = new Logs({
            userName: portalUserData?.full_name,
            userId: portalUserData?._id,
            loginDateTime: formattedDate,
            ipAddress:
              req?.headers["x-forwarded-for"] || req?.connection?.remoteAddress,
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
                savedLogId,
              },
            },
            message: "Super-admin not approved yet",
            errorCode: "PROFILE_NOT_APPROVED",
          });
        }
      }

      if (portalUserData.role == "STAFF") {
        adminData = await StaffInfo.findOne({
          for_portal_user: portalUserData._id,
        }).populate({
          path: "role",
        });
      }

      if (adminData?.creatorId) {
        const adminName = await BasicInfo.findOne({
          for_portal_user: mongoose.Types.ObjectId(adminData.creatorId),
        });

        adminData = Object.assign({}, adminData._doc, {
          adminName: adminName.centre_name,
        });
      }

      const tokenData = {
        _id: portalUserData._id,
        email: portalUserData.email,
        role: portalUserData.role,
        uuid,
      };     
 
      // logs
      const currentDate = new Date();
      const timeZone = process.env.TIMEZONE;
      
      const formattedDate = currentDate.toLocaleString("en-US", { timeZone });
      let addLogs = {};
      let saveLogs = {};
      if (portalUserData.role == "INDIVIDUAL" || portalUserData.role == "ADMIN")  {
        addLogs = new Logs({
          userName: portalUserData?.full_name,
          userId: portalUserData?._id,
          loginDateTime: formattedDate,
          ipAddress:
            req?.headers["x-forwarded-for"] || req?.connection?.remoteAddress,
        });
        saveLogs = await addLogs.save();
      } else {
        let checkAdmin = await PortalUser.findOne({
          _id: mongoose.Types.ObjectId(portalUserData?.created_by_user),
        });
        addLogs = new Logs({
          userName: portalUserData?.full_name,
          userId: portalUserData?._id,
          adminData: {
            adminId: portalUserData?.created_by_user,
            adminName: checkAdmin?.full_name,
          },
          loginDateTime: formattedDate,
          ipAddress:
            req?.headers["x-forwarded-for"] || req?.connection?.remoteAddress,
        });
        saveLogs = await addLogs.save();
      }
      const savedLogId = saveLogs ? saveLogs._id : null;

        let activeToken = generateToken(tokenData);
        await PortalUser.findOneAndUpdate(
          { _id: portalUserData._id },
          {
            $set: { activeToken:activeToken }
          },
        )
      return sendResponse(req, res, 200, {
        status: true,
        body: {
          otp_verified: portalUserData.verified,
          token: activeToken,
          refreshToken: generateRefreshToken(tokenData),
          user_details: {
            portalUserData,
            adminData,
            savedLogId,
          },
        },
        message: "Logged in successfully!",
        errorCode: null,
      });
    } catch (error) {
      console.log("Eror while login labradio", error);
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
          const getLabRadioData = await BasicInfo.findOne({for_portal_user: req.user._id}).select('centre_name')
          //Save audit logs
          await httpService.postStaging(
            "superadmin/add-logs",
            { 
              userId: req.user._id,
              userName: getLabRadioData?.centre_name,
              role: 'labradio',
              action: `logout`,
              actionDescription: `Logout: ${getLabRadioData?.centre_name} logout successfully.`,
            },
            {},
            "superadminServiceUrl"
          );

          await PortalUser.findOneAndUpdate(
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
      const { phone_number, type } = req.body;
      const { uuid } = req.headers;
      const headers = {
        'Authorization': req.headers['authorization']
      }
      const portalUserData = await PortalUser.findOne({
        type,
        phone_number,
        isDeleted: false,
      }).lean();
      if (!portalUserData) {
        return sendResponse(req, res, 422, {
          status: false,
          body: null,
          message: "User not exist.",
          errorCode: "USER_NOT_EXIST",
        });
      }
      await Otp2fa.updateMany({ uuid }, {
        $set: {
          verified: false
        }
      })
      const country_code = portalUserData.country_code;
      const deviceExist = await Otp2fa.findOne({
        phone_number,
        country_code,
        uuid,
        for_portal_user: portalUserData._id,
        type,
      }).lean();
      
      const currentTime = new Date();

      const canOtpSend = await canSendOtp(deviceExist, currentTime)
      
      // Check if the OTP can be sent
      if (!canOtpSend.status) {
          const timeLeft = new Date(deviceExist.isTimestampLocked ? deviceExist.limitExceedWithin : canOtpSend.limitExceedWithin) - currentTime;
          if (!deviceExist.isTimestampLocked) {
              await Otp2fa.findOneAndUpdate({ phone_number, country_code, uuid, for_portal_user: portalUserData._id }, { $set: {
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
      await sendSms(country_code + phone_number, otpText);
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
              { phone_number, country_code, uuid, for_portal_user: portalUserData._id }, 
              { $set: updateObject }
          ).exec();
      } else {
          result = await new Otp2fa({
              phone_number,
              otp,
              otpExpiration,
              limitExceedWithin: canOtpSend.limitExceedWithin,
              country_code,
              type,
              uuid,
              for_portal_user: portalUserData._id,
              send_attempts: 1
          }).save();
      }
      return sendResponse(req, res, 200, {
        status: true,
        body: {
          id: result._id,
        },
        message: "OTP sent successfully.",
        errorCode: null,
      });
      // } else {
      //   sendResponse(req, res, 500, {
      //     status: false,
      //     body: null,
      //     message: "Can't Sent SMS.",
      //     errorCode: null,
      //   });
      // }
    } catch (error) {
      console.error("Error: while sending SMS on phone_number", error);
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Internal server error",
        errorCode: null,
      });
    }
  }

  async sendEmailOtpFor2fa(req, res) {
    try {
      const { email, type } = req.body;
      const { uuid } = req.headers;
      const headers = {
        'Authorization': req.headers['authorization']
      }
      const portalUserData = await PortalUser.findOne({
        email,
        type,
        isDeleted: false,
      }).lean();
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
      const deviceExist = await Otp2fa.findOne({
        email,
        uuid,
        for_portal_user: portalUserData._id,
        type,
      }).lean();

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
        type,
        for_portal_user: portalUserData._id,
        send_attempts: 1
      }).save();
    }
      return sendResponse(req, res, 200, {
        status: true,
        body: {
          id: result._id,
        },
        message: "Otp Sent to your email successfully!",
        errorCode: null,
      });
    } catch (error) {
      console.log("Error while sending email otp: " + error);
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Internal server error",
        errorCode: null,
      });
    }
  }

  async matchOtpFor2fa(req, res) {
    try {
      const { phone_number, otp, for_portal_user, type } = req.body;
      const { uuid } = req.headers;
      const otpResult = await Otp2fa.findOne({
        uuid,
        phone_number,
        for_portal_user,
        verified: false,
        type,
      });
      if (otpResult) {
        const portalUserData = await PortalUser.findOne({
          _id: mongoose.Types.ObjectId(for_portal_user),
        }).lean();
        if (!portalUserData) {
          return sendResponse(req, res, 200, {
            status: false,
            body: null,
            message: "User not exist",
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
          const tokenData = {
            _id: portalUserData._id,
            email: portalUserData.email,
            role: portalUserData.role,
            uuid,
          };
          const updateVerified = await PortalUser.findOneAndUpdate(
            { _id: portalUserData._id },
            {
              $set: {
                verified: true,
              },
            },
            { new: true }
          ).exec();
          const updateVerifiedUUID = await Otp2fa.findOneAndUpdate(
            { uuid, phone_number, for_portal_user, verified: false, type },
            {
              $set: {
                verified: true,
              },
            },
            { new: true }
          ).exec();

          const adminData = await BasicInfo.findOne({for_portal_user: {$eq: portalUserData?._id}})
           //Save audit logs
           await httpService.postStaging(
            "superadmin/add-logs",
            { 
              userId: portalUserData?._id,
              userName: adminData?.centre_name,
              role: 'labradio',
              action: `login`,
              actionDescription: `Login: ${adminData?.centre_name} login successfully.`,
            },
            {},
            "superadminServiceUrl"
          );
          let activeToken = generateToken(tokenData);
            await PortalUser.findOneAndUpdate(
              { _id: portalUserData._id },
              {
                $set: { activeToken:activeToken }
              },
            )
          return sendResponse(req, res, 200, {
            status: true,
            body: {
              id: updateVerified._id,
              uuid: updateVerifiedUUID._id,
              token: activeToken,
              refreshToken: generateRefreshToken(tokenData),
              user_details: {
                portalUserData: {
                  _id: portalUserData?._id,
                  centre_name: adminData?.centre_name,
                  email: portalUserData?.email,
                  phone_number: portalUserData?.phone_number,
                  country_code: portalUserData?.country_code,
                  role: portalUserData?.role,
                  permissions: portalUserData?.permissions,
                  full_name: portalUserData?.full_name,
                  type: portalUserData?.type,
                },
                adminData: {
                  _id: portalUserData?._id,
                  role: portalUserData?.role,
                },
              }
            },
            message: "OTP Matched Successfully!",
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
      console.log("error___________",error);
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
      const { email, otp, for_portal_user, type } = req.body;
      const { uuid } = req.headers;
      const otpResult = await Otp2fa.findOne({
        uuid,
        email,
        for_portal_user,
        verified: false,
        type,
      });
      if (otpResult) {
        const portalUserData = await PortalUser.findOne({
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
          const tokenData = {
            _id: portalUserData._id,
            email: portalUserData.email,
            role: portalUserData.role,
            uuid,
          };
          const updateVerified = await PortalUser.findOneAndUpdate(
            { _id: portalUserData._id },
            {
              $set: {
                verified: true,
              },
            },
            { new: true }
          ).exec();
          const updateVerifiedUUID = await Otp2fa.findOneAndUpdate(
            { uuid, email, for_portal_user, verified: false, type },
            {
              $set: {
                verified: true,
              },
            },
            { new: true }
          ).exec();
          const adminData = await BasicInfo.findOne({for_portal_user: {$eq: portalUserData?._id}})
          //Save audit logs
          await httpService.postStaging(
            "superadmin/add-logs",
            { 
              userId: portalUserData?._id,
              userName: adminData?.centre_name,
              role: 'labradio',
              action: `login`,
              actionDescription: `Login: ${adminData?.centre_name} login successfully.`,
            },
            {},
            "superadminServiceUrl"
          );
          let activeToken = generateToken(tokenData);
            await PortalUser.findOneAndUpdate(
              { _id: portalUserData._id },
              {
                $set: { activeToken:activeToken }
              },
            )
          return sendResponse(req, res, 200, {
            status: true,
            body: {
              id: updateVerified._id,
              uuid: updateVerifiedUUID._id,
              token: activeToken,
              refreshToken: generateRefreshToken(tokenData),
              user_details: {
                portalUserData: {
                  _id: portalUserData?._id,
                  centre_name: adminData?.centre_name,
                  email: portalUserData?.email,
                  phone_number: portalUserData?.phone_number,
                  country_code: portalUserData?.country_code,
                  permissions: portalUserData?.permissions,
                  full_name: portalUserData?.full_name,
                  role: portalUserData?.role,
                  type: portalUserData?.type,
                },
                adminData: {
                  _id: portalUserData?._id,
                  role: portalUserData?.role,
                },
              }
            },
            message: "OTP Matched Successfully!",
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
      sendResponse(req, res, 500, {
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
    try {
      const { email, type } = req.body;
      let userData = await PortalUser.findOne({ email, type });
      if (!userData) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "User not found",
          errorCode: null,
        });
      }
      let resetToken = crypto.randomBytes(32).toString("hex");
      const hashResetToken = await generateTenSaltHash(resetToken);
      let ForgotPasswordTokenData = await ForgotPasswordToken.findOne({
        user_id: userData._id,
      });
      if (ForgotPasswordTokenData) {
        await ForgotPasswordTokenData.deleteOne();
      }

      let ForgotPasswordData = new ForgotPasswordToken({
        user_id: userData._id,
        token: hashResetToken,
      });
      await ForgotPasswordData.save();
      const link = `${test_p_FRONTEND_URL}/portals/newpassword/${type}?token=${resetToken}&user_id=${userData._id}&type=${type}`
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
            resetToken,
          },
          message: "A password reset link has been sent to your email.",
          errorCode: null,
        });
      } else {
        console.log('Error while sending a reset link', error);
        return sendResponse(req, res, 500, {
          status: false,
          message: "Internal server error. Unable to send email.",
          errorCode: null,
        });
      }
    } catch (error) {
      console.log('Error while sending a reset link', error);
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Internal server error",
        errorCode: null,
      });
    }
  }

  async resetForgotPassword(req, res) {
    const { user_id, resetToken, newPassword, type } = req.body;
    try {
      let ForgotPasswordTokenData = await ForgotPasswordToken.findOne({
        user_id,
      });
      if (!ForgotPasswordTokenData) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "The token has expired.",
          errorCode: null,
        });
      }
      const isPasswordMatch = await bcryptCompare(
        resetToken,
        ForgotPasswordTokenData.token
      );
      if (!isPasswordMatch) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "The token does not match.",
          errorCode: null,
        });
      }
      const passCheck = await PortalUser.findOne({ _id: user_id, type });

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

        await PortalUser.findOneAndUpdate(
          { _id: user_id },
          { password: hashPassword },
          { new: true }
        );
        //DELETE the token after successful reset
      await ForgotPasswordToken.deleteOne({ user_id });
        return sendResponse(req, res, 200, {
          status: true,
          body: null,
          message: "New password has been set successfully.",
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

  async changePassword(req, res) {
    const { id, old_password, new_password, type } = req.body;
    if (old_password === new_password) {
      return sendResponse(req, res, 200, {
        status: false,
        body: null,
        message: "New password shouldn't be same as old password.",
        errorCode: "PASSWORD_MATCHED",
      });
    }
    try {
      const portalUserData = await PortalUser.findOne({ _id: id, type }).lean();
      if (!portalUserData) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "User not found",
          errorCode: "USER_NOT_FOUND",
        });
      }
      const isPasswordOldMatch = await checkPassword(
        old_password,
        portalUserData
      );
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
      const result = await PortalUser.findOneAndUpdate(
        { _id: id, type },
        {
          $set: {
            password: passwordHash,
          },
        },
        { new: true }
      ).exec();
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

  async uploadDocuments(req, res) {
    try {
      if (!req?.body?.userId) {
        req.body.userId = req.user._id;
      }
      if (!req?.files) {
        return sendResponse(req, res, 200, {
          status: false,
          message: "Please select file first.",
          data: null,
          errorCode: null,
        });
      }
      const key = await uploadSingleOrMultipleDocuments(req)
      
      return sendResponse(req, res, 200, {
        status: true,
        data: key,
        message: `File uploaded successfully`,
        errorCode: null,
      });
    } catch (err) {
      console.log("Error uploading file", err);
      return sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to upload file`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async centreProfileCreate(req, res) {
    try {
      const {
        centre_name,
        centre_name_arabic,
        slogan,
        main_phone_number,
        additional_phone_number,
        about_centre,
        profile_picture,
        centre_picture,
        licence_details,
        location_info,
        for_portal_user,
        country_code,
        password,
        email,
        createdBy,
        portal_type,
        identifier
      } = req.body;
      const {
        address,
        nationality,
        neighborhood,
        region,
        province,
        department,
        city,
        village,
        pincode,
        loc,
      } = location_info;

      if (for_portal_user != "") {
        const userData = await PortalUser.findOneAndUpdate(
          { _id: for_portal_user },
          {
            $set: {
              centre_name: centre_name,
              centre_name_arabic,
              email: email,
              country_code: country_code,
              phone_number: main_phone_number,
            },
          },
          { upsert: false, new: true }
        );
        const locationData = await LocationInfo.findOneAndUpdate(
          { for_portal_user: for_portal_user },
          {
            $set: {
              nationality: nationality == "" ? null : nationality,
              neighborhood: neighborhood == "" ? null : neighborhood,
              region: region == "" ? null : region,
              province: province == "" ? null : province,
              department: department == "" ? null : department,
              city: city == "" ? null : city,
              village: village == "" ? null : village,
              pincode: pincode == "" ? null : pincode,
              for_portal_user,
              address: address == "" ? null : address,
              loc: loc == "" ? null : loc,
            },
          },
          { new: true }
        ).exec();

        const updateAdminData = await BasicInfo.findOneAndUpdate(
          { for_portal_user: for_portal_user },
          {
            $set: {              
              centre_name,
              centre_name_arabic,
              slogan,
              main_phone_number,
              additional_phone_number,
              about_centre,
              profile_picture,
              centre_picture,
              licence_details,
              in_location: locationData?._id,
            },
          },
          { new: true }
        );

        if (userData || updateAdminData || locationData) {
          return sendResponse(req, res, 200, {
            status: true,
            data: { userData, updateAdminData, locationData },
            message: "Profile updated successfully",
            errorCode: null,
          });
        } else {
          return sendResponse(req, res, 200, {
            status: false,
            data: null,
            message: "Failed to update profile!",
            errorCode: null,
          });
        }
      } else {
        const headers = {
          Authorization: req.headers["authorization"],
        }
        const CheckEmail = await PortalUser.findOne({
          email: email,type: portal_type,
          isDeleted: false,
        });
        if (CheckEmail) {
          return sendResponse(req, res, 200, {
            status: false,
            body: null,
            message: "Email address already exists for another user",
            errorCode: "INTERNAL_SERVER_ERROR",
          });
        }
        const passwordHash = await hashPassword(password);
        const userDetails = new PortalUser({
          email: email,
          password: passwordHash,
          phone_number: main_phone_number,
          country_code: country_code,
          verified: true,
          role: "INDIVIDUAL",
          createdBy: createdBy,
          centre_name: centre_name,
          centre_name_arabic: centre_name_arabic,
          type: portal_type,
          identifier
        });
        let userData = await userDetails.save();

        const locationInfo = new LocationInfo({
          nationality: nationality == "" ? null : nationality,
          neighborhood: neighborhood == "" ? null : neighborhood,
          region: region == "" ? null : region,
          province: province == "" ? null : province,
          department: department == "" ? null : department,
          city: city == "" ? null : city,
          village: village == "" ? null : village,
          pincode: pincode == "" ? null : pincode,
          for_portal_user: userData._id,
          address: address == "" ? null : address,
          loc: loc == "" ? null : loc,
          type: portal_type,
        });
        let locationData = await locationInfo.save();

        const userAdminInfo = new BasicInfo({        
          centre_name,
          centre_name_arabic,
          slogan,
          main_phone_number,
          additional_phone_number,
          about_centre,
          profile_picture,
          centre_picture,
          licence_details,
          verify_status: "APPROVED",
          in_location: locationData?._id,
          for_portal_user: userData._id,
          type: portal_type,
        });

        let saveAdminData = await userAdminInfo.save();
          //Send notification to doctor
          let paramsData = {
            sendTo: portal_type.toLowerCase(),
            madeBy: 'superadmin',
            condition: 'PROFILE_CREATED',
            user_name: centre_name,
            user_email: email, 
            user_mobile: main_phone_number,
            country_code: country_code,
            user_password: password, 
            notification: ['sms', 'email'],
            isProfile: true
          }
          sendNotification(paramsData, headers)
        if (userData || saveAdminData || locationData) {
          return sendResponse(req, res, 200, {
            status: true,
            data: { userData, saveAdminData, locationData },
            message: "Successfully Profile Created",
            errorCode: null,
          });
        } else {
          return sendResponse(req, res, 200, {
            status: false,
            data: null,
            message: "Failed to create profile!",
            errorCode: null,
          });
        }
      }
    } catch (error) {
      console.log("error__________",error);

      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: error.message ? error.message : "Something went wrong",
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async centreViewProfile(req, res) {
    try {
        const { id } = req.query;           
        const portalUserData = await PortalUser.findOne({ _id: id }, {password: 0}).exec();
        const adminData = await BasicInfo.findOne({
            for_portal_user: portalUserData._id,
        })
            .populate({
                path: "in_location",
            })
            .exec();            
        const documentData = await DocumentInfo.find({
            for_portal_user: adminData.for_portal_user._id,
        }).exec();
        const locationData = await LocationInfo.findOne({
            for_portal_user: adminData.for_portal_user._id,
        }).exec();          
        const profilePicKey = adminData.profile_picture;
        if (profilePicKey) {
          adminData.profile_picture_signed_url = await generateSignedUrl(profilePicKey)
        }

        let licencePic = adminData?.licence_details?.licence_picture;
        let licencePicSignedUrl = "";
        
        if (licencePic) {
            licencePicSignedUrl = await generateSignedUrl(licencePic)
        }

        if (adminData?.centre_picture.length > 0) {
          let signedUrlArray = []
          for (const element of adminData?.centre_picture) {
              signedUrlArray.push(await generateSignedUrl(element))
          }
          adminData.centre_picture_signed_urls = signedUrlArray
        }

        return sendResponse(req, res, 200, {
            status: true,
            data: {
                portalUserData,
                adminData,
                licencePicSignedUrl,
                documentData,
                locationData,
            },
            message: `Account details fetched successfully,`,
            errorCode: null,
        });
    } catch (error) {

      console.log("error__________",error);
        
        sendResponse(req, res, 500, {
            status: false,
            data: null,
            message: `failed to fetch account details`,
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
}

  async deletePathologyTest(req, res) {
    try {
      const { for_portal_user, typeOfTest, nameOfTest } = req.body;

      const result = await PathologyTestInfoNew.findOneAndDelete({
        for_portal_user,
        typeOfTest,
        nameOfTest,
      });

      sendResponse(req, res, 200, {
        status: true,
        body: {
          data: result,
        },
        message: "Test Deleted successfully",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to Delete test",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async fourPortalAllManagementList(req, res) {
    const { hospital_portal_id, page, limit, searchKey, type } = req.query;
    let sort = req.query.sort;
    let sortingarray = {};
    if (sort != "undefined" && sort != "" && sort != undefined) {
      let keynew = sort.split(":")[0];
      let value = sort.split(":")[1];
      sortingarray[keynew] = Number(value);
    } else {
      sortingarray["for_portal_user.createdAt"] = -1;
    }
    let doctorId = req.query.doctorId;
    let filterDoctor = {};
    if (doctorId != "undefined" && doctorId != undefined && doctorId != "") {
      const doctorIdArray = doctorId.split(",");
      const doctorObjectIds = doctorIdArray.map((id) =>
        mongoose.Types.ObjectId(id)
      );

      filterDoctor["for_portal_user"] = { $in: doctorObjectIds };
    }

    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };
      let filter = {
        "for_portal_user.role": { $in: ["INDIVIDUAL"] },
        "for_portal_user.isDeleted": false,
        "for_portal_user.type": type,
        // for_hospital: mongoose.Types.ObjectId(hospital_portal_id),
        for_hospitalIds: { $in: [mongoose.Types.ObjectId(hospital_portal_id)] },
      };

      if (searchKey) {
        filter["$or"] = [
          { full_name: { $regex: searchKey || "", $options: "i" } },
        ];
      }
      let aggregate = [
        {
          $match: filterDoctor,
        },
        {
          $lookup: {
            from: "portalusers",
            localField: "for_portal_user",
            foreignField: "_id",
            as: "for_portal_user",
          },
        },
        {
          $unwind: {
            path: "$for_portal_user",
            preserveNullAndEmptyArrays: true,
          },
        },
        { $match: filter },
        {
          $project: {
            first_name: 1,
            middle_name: 1,
            last_name: 1,
            full_name: 1,
            license_details: 1,
            services: 1,
            department: 1,
            unit: 1,
            expertise: 1,
            speciality: 1,
            for_portal_user: {
              _id: "$for_portal_user._id",
              email: "$for_portal_user.email",
              country_code: "$for_portal_user.country_code",
              phone_number: "$for_portal_user.phone_number",
              lock_user: "$for_portal_user.lock_user",
              isActive: "$for_portal_user.isActive",
              createdAt: "$for_portal_user.createdAt",
              role: "$for_portal_user.role",
              type: "$for_portal_user.type",
            },
          },
        },
      ];
      const totalCount = await BasicInfo.aggregate(aggregate);
      aggregate.push(
        {
          $sort: sortingarray,
        },
        { $limit: limit * 1 },
        { $skip: (page - 1) * limit }
      );
      const result = await BasicInfo.aggregate(aggregate);

      if (result.length > 0) {
        try {
          const servicePromises = result.map((item) =>
            httpService.getStaging(
              "hospital/get-service-data",
              { data: item.services },
              headers,
              "hospitalServiceUrl"
            )
          );
          const departmentPromises = result.map((item) =>
            httpService.getStaging(
              "hospital/get-department-data",
              { data: item.department },
              headers,
              "hospitalServiceUrl"
            )
          );
          const unitPromises = result.map((item) =>
            httpService.getStaging(
              "hospital/get-unit-data",
              { data: item.unit },
              headers,
              "hospitalServiceUrl"
            )
          );
          const specialityPromises = result.map((item) =>
            httpService.getStaging(
              "hospital/get-speciality-data",
              { data: item.speciality },
              headers,
              "hospitalServiceUrl"
            )
          );

          const [serviceData, departmentData, unitData, specialityData] =
            await Promise.all([
              Promise.all(servicePromises),
              Promise.all(departmentPromises),
              Promise.all(unitPromises),
              Promise.all(specialityPromises),
            ]);

          result.forEach((item, index) => {
            item.service = serviceData[index]?.data[0]?.service;
            item.departments = departmentData[index]?.data[0]?.department;
            item.units = unitData[index]?.data[0]?.unit;
            item.specialities = specialityData[index]?.data[0]?.specilization;
          });

          sendResponse(req, res, 200, {
            status: true,
            data: {
              data: result,
              totalCount: totalCount.length,
            },
            message: `hospital ${type} fetched successfully`,
            errorCode: null,
          });
        } catch (error) {
          // Handle errors, e.g., log or send an error response
          sendResponse(req, res, 200, {
            status: true,
            data: {
              data: null,
              totalCount: 0,
            },
            message: `hospital ${type} fetched successfully`,
            errorCode: null,
          });
        }
      } else {
        sendResponse(req, res, 200, {
          status: true,
          data: {
            data: null,
            totalCount: 0,
          },
          message: `hospital ${type} not fetched successfully`,
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

  async fourportalManagementRequestList(req, res) {
    const { hospital_portal_id, page, limit, searchKey, type } = req.query;

    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };
      let sort = req.query.sort;
      let sortingarray = {};
      if (sort != "undefined" && sort != "" && sort != undefined) {
        let keynew = sort.split(":")[0];
        let value = sort.split(":")[1];
        sortingarray[keynew] = Number(value);
      } else {
        sortingarray["for_portal_user.createdAt"] = -1;
      }
      let filter = {
        "for_portal_user.role": { $in: ["INDIVIDUAL"] },
        "for_portal_user.isDeleted": false,
        "for_portal_user.type": type,
        // for_hospital: mongoose.Types.ObjectId(hospital_portal_id),
        for_hospitalIds_temp: {
          $in: [mongoose.Types.ObjectId(hospital_portal_id)],
        },
      };

      if (searchKey) {
        filter["$or"] = [
          { full_name: { $regex: searchKey || "", $options: "i" } },
        ];
      }
      let aggregate = [
        {
          $lookup: {
            from: "portalusers",
            localField: "for_portal_user",
            foreignField: "_id",
            as: "for_portal_user",
          },
        },
        {
          $unwind: {
            path: "$for_portal_user",
            preserveNullAndEmptyArrays: true,
          },
        },

        // {
        //   $lookup: {
        //     from: "services",
        //     localField: "services",
        //     foreignField: "_id",
        //     as: "services",
        //   }
        // },
        // { $unwind: { path: "$services", preserveNullAndEmptyArrays: true } },
        // {
        //   $lookup: {
        //     from: "specialties",
        //     localField: "speciality",
        //     foreignField: "_id",
        //     as: "speciality",
        //   }
        // },
        // { $unwind: { path: "$speciality", preserveNullAndEmptyArrays: true } },
        { $match: filter },
        {
          $project: {
            first_name: 1,
            middle_name: 1,
            last_name: 1,
            full_name: 1,
            license_details: 1,
            // speciality: "$speciality.specilization",
            // services: "$services.service",
            department: 1,
            speciality: 1,
            unit: 1,
            for_portal_user: {
              _id: "$for_portal_user._id",
              email: "$for_portal_user.email",
              country_code: "$for_portal_user.country_code",
              phone_number: "$for_portal_user.phone_number",
              lock_user: "$for_portal_user.lock_user",
              isActive: "$for_portal_user.isActive",
              createdAt: "$for_portal_user.createdAt",
            },
          },
        },
      ];
      const totalCount = await BasicInfo.aggregate(aggregate);
      aggregate.push(
        {
          $sort: sortingarray,
        },
        { $limit: limit * 1 },
        { $skip: (page - 1) * limit }
      );
      const result = await BasicInfo.aggregate(aggregate);

      if (result.length > 0) {
        // Create an array to store all the promises
        const promises = result.map(async (item) => {
          const unitData = httpService.getStaging(
            "hospital/get-unit-data",
            { data: item.unit },
            headers,
            "hospitalServiceUrl"
          );
          const specialityData = httpService.getStaging(
            "hospital/get-speciality-data",
            { data: item.speciality },
            headers,
            "hospitalServiceUrl"
          );

          // Use Promise.all to await both requests concurrently
          const [unitResponse, specialityResponse] = await Promise.all([
            unitData,
            specialityData,
          ]);

          // Update the result object with the data
          item.units = unitResponse?.data[0]?.unit;
          item.specialities = specialityResponse?.data[0]?.specilization;
        });

        // Wait for all promises to complete
        await Promise.all(promises);

        sendResponse(req, res, 200, {
          status: true,
          data: {
            data: result,
            totalCount: totalCount.length,
          },
          message: `hospital ${type} fetched successfully`,
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 200, {
          status: true,
          data: {
            data: [],
            totalCount: 0,
          },
          message: `hospital ${type} not fetched successfully`,
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

  async acceptOrRejectFourPortalRequest(req, res) {
    const { action, doctor_portal_id, hospital_id, type } = req.body;

    try {
      let result;

      if (action === "accept") {
        result = await BasicInfo.updateOne(
          { for_portal_user: doctor_portal_id },
          { $push: { for_hospitalIds: hospital_id } }
        );

        await BasicInfo.updateOne(
          { for_portal_user: doctor_portal_id },
          { $pull: { for_hospitalIds_temp: hospital_id } }
        );

        await HospitalLocation.updateOne(
          {
            for_portal_user: doctor_portal_id,
            "hospital_or_clinic_location.hospital_id": hospital_id,
          },
          {
            $set: {
              "hospital_or_clinic_location.$.isPermited": true,
              "hospital_or_clinic_location.$.status": "APPROVED",
            },
          }
        );
      } else {
        result = await BasicInfo.updateOne(
          { for_portal_user: doctor_portal_id },
          { $pull: { for_hospitalIds_temp: hospital_id } }
        );

        await HospitalLocation.updateOne(
          { for_portal_user: doctor_portal_id },
          {
            $pull: {
              hospital_or_clinic_location: { hospital_id: hospital_id },
            },
          },
          { multi: true }
        );
      }

      if (result) {
        sendResponse(req, res, 200, {
          status: true,
          data: null,
          message: `${type} ${action} successfully`,
          errorCode: null,
        });
      }
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        data: error,
        message: `failed to ${verify_status} doctor`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async fourportalManagementEducationalDetails(req, res) {
    const { portal_user_id, education_details, type } = req.body;
    try {
      const checkExist = await EducationalDetail.find({
        for_portal_user: portal_user_id,
      }).exec();
      if (checkExist.length > 0) {
        await EducationalDetail.findOneAndUpdate(
          { for_portal_user: { $eq: portal_user_id } },
          {
            $set: { education_details },
          }
        ).exec();
      } else {
        const eduData = new EducationalDetail({
          education_details,
          for_portal_user: portal_user_id,
          type,
        });
        const eduResult = await eduData.save();
        await BasicInfo.findOneAndUpdate(
          { for_portal_user: { $eq: portal_user_id } },
          {
            $set: { in_education: eduResult._id },
          }
        ).exec();
      }
      sendResponse(req, res, 200, {
        status: true,
        data: null,
        message: `education details ${
          checkExist.length > 0 ? "updated" : "added"
        } successfully`,
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

  async fourportalManagementHospitalLocation(req, res) {
    const { portal_user_id, hospital_or_clinic_location, type } = req.body;
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };

      const checkExist = await HospitalLocation.find({
        for_portal_user: portal_user_id,
      }).exec();

      const basicInfo = await BasicInfo.findOne(
        { for_portal_user: portal_user_id },
        { for_hospitalIds: 1, for_hospitalIds_temp: 1, for_hospital: 1 }
      );

      let permissionToHospital = [];

      if (basicInfo?.for_hospitalIds_temp.length > 0) {
        for (const previousData of basicInfo?.for_hospitalIds_temp) {
          permissionToHospital.push(previousData.toString());
        }
      }
      let getRole = "";
      if (basicInfo?.for_hospital) {
        getRole = await httpService.getStaging(
          "hospital/get-portal-user-data",
          { data: basicInfo?.for_hospital },
          headers,
          "hospitalServiceUrl"
        );
      }

      let locationArray = [];
      for (const value of hospital_or_clinic_location) {
        let status = value.locationFor == "hospital" ? "PENDING" : "APPROVED";
        if (getRole != "") {
          if (getRole?.data[0]?.role == "HOSPITAL_ADMIN") {
            status = "APPROVED";
          }
        }
        value.status = status;
        locationArray.push(value);

        if (value.locationFor === "hospital") {
          if (
            !basicInfo?.for_hospitalIds
              .map((id) => id.toString())
              .includes(value?.hospital_id)
          ) {
            if (
              !basicInfo?.for_hospitalIds_temp
                .map((id) => id.toString())
                .includes(value?.hospital_id)
            ) {
              permissionToHospital.push(value?.hospital_id);
            }
          } else {
            value.isPermited = true;
          }
        } else {
          value.isPermited = true;
        }
      }

      if (checkExist.length > 0) {
        await HospitalLocation.findOneAndUpdate(
          { for_portal_user: { $eq: portal_user_id } },
          {
            $set: { hospital_or_clinic_location },
          }
        ).exec();

        await BasicInfo.findOneAndUpdate(
          { for_portal_user: { $eq: portal_user_id } },
          {
            $set: { for_hospitalIds_temp: permissionToHospital },
          }
        ).exec();
      } else {
        const hlocData = new HospitalLocation({
          hospital_or_clinic_location,
          for_portal_user: portal_user_id,
          type,
        });

        const hlocResult = await hlocData.save();

        await BasicInfo.findOneAndUpdate(
          { for_portal_user: { $eq: portal_user_id } },
          {
            $set: {
              in_hospital_location: hlocResult._id,
              for_hospitalIds_temp: permissionToHospital,
            },
          }
        ).exec();
      }

      sendResponse(req, res, 200, {
        status: true,
        data: null,
        message: `hospital location added successfully`,
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

  async forPortalManagementAvailability(req, res) {
    const { portal_user_id, doctor_availability, type } = req.body;
    try {
      //await DoctorAvailability.deleteMany({ for_portal_user: { $eq: portal_user_id }, location_id })
      const dataArray = [];
      for (let data of doctor_availability) {
        data["for_portal_user"] = portal_user_id;
        data["type"] = type;
        if (data.existingIds === "") {
          dataArray.push(data);
        } else {
          await Availability.findOneAndUpdate(
            { _id: { $eq: data.existingIds } },
            {
              $set: {
                week_days: data.week_days,
                availability_slot: data.availability_slot,
                unavailability_slot: data.unavailability_slot,
                slot_interval: data.slot_interval,
              },
            }
          ).exec();
        }
      }
      if (dataArray.length > 0) {
        const result = await Availability.insertMany(dataArray);
        const existingInavailability = await BasicInfo.findOne(
          { for_portal_user: { $eq: portal_user_id } },
          { in_availability: 1 }
        );

        const resultArray = existingInavailability.in_availability;
        const appointmentArray = [];
        for (const data of result) {
          appointmentArray.push(data.appointment_type);
          resultArray.push(data._id);
        }
        await BasicInfo.findOneAndUpdate(
          { for_portal_user: { $eq: portal_user_id } },
          {
            $set: {
              in_availability: resultArray,
              accepted_appointment: appointmentArray,
            },
          }
        ).exec();
      }
      sendResponse(req, res, 200, {
        status: true,
        data: null,
        message: `Doctor availability added successfully`,
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

  async fourPortalManagementGetLocations(req, res) {
    try {
      const { portal_user_id, type } = req.query;
      const results = await HospitalLocation.aggregate([
        {
          $match: {
            for_portal_user: mongoose.Types.ObjectId(portal_user_id),
            type: type,
          },
        },
        { $unwind: "$hospital_or_clinic_location" },
        { $match: { "hospital_or_clinic_location.isPermited": true } },
        {
          $group: {
            _id: "$_id",
            for_portal_user: { $first: "$for_portal_user" },
            hospital_or_clinic_location: {
              $push: "$hospital_or_clinic_location",
            },
          },
        },
      ]);
      sendResponse(req, res, 200, {
        status: true,
        data: results,
        message: `hospital locations fetched successfully`,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        data: error,
        message: `Something went wrong`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async fourPortalManagementFeeManagement(req, res) {
    const { portal_user_id, location_id, online, home_visit, f2f, type } =
      req.body;
    try {
      const checkExist = await FeeManagement.find({
        for_portal_user: portal_user_id,
        location_id: location_id,
      }).exec();
      let objectData = { online, home_visit, f2f };
      if (checkExist.length > 0) {
        await FeeManagement.findOneAndUpdate(
          {
            for_portal_user: { $eq: portal_user_id },
            location_id: location_id,
          },
          {
            $set: objectData,
          }
        ).exec();
      } else {
        objectData["for_portal_user"] = portal_user_id;
        objectData["location_id"] = location_id;
        objectData["type"] = type;
        const feeData = new FeeManagement(objectData);
        const feeResult = await feeData.save();
        await BasicInfo.findOneAndUpdate(
          { for_portal_user: { $eq: portal_user_id } },
          {
            $set: { in_fee_management: feeResult._id },
          }
        ).exec();
      }
      sendResponse(req, res, 200, {
        status: true,
        data: null,
        message: `fee data ${
          checkExist.length > 0 ? "updated" : "added"
        } successfully`,
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

  async fourPortalManagementDocumentManagement(req, res) {
    const { portal_user_id, document_details, type } = req.body;
    try {
      const checkExist = await DocumentManagement.find({
        for_portal_user: portal_user_id,
      }).exec();
      if (checkExist.length > 0) {
        await DocumentManagement.findOneAndUpdate(
          { for_portal_user: { $eq: portal_user_id } },
          {
            $set: { document_details },
          }
        ).exec();
      } else {
        const docData = new DocumentManagement({
          document_details,
          for_portal_user: portal_user_id,
          type,
        });
        const docResult = await docData.save();
        await BasicInfo.findOneAndUpdate(
          { for_portal_user: { $eq: portal_user_id } },
          {
            $set: { in_document_management: docResult._id },
          }
        ).exec();
      }
      sendResponse(req, res, 200, {
        status: true,
        data: null,
        message: `document ${
          checkExist.length > 0 ? "updated" : "added"
        } successfully`,
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

  async deleteAvailability(req, res) {
    const { portal_user_id, location_id } = req.body;
    try {
      await Availability.deleteMany({
        for_portal_user: { $eq: portal_user_id },
        location_id,
      });

      sendResponse(req, res, 200, {
        status: true,
        data: null,
        message: `Location and its availability deleted successfully`,
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

  async addAppointmentReason(req, res) {
    try {
      const {
        appointmentReasonArray,
        loginPortalId,
        portalType,
        selectedlocation,
        createdBy,
      } = req.body;

      const list = appointmentReasonArray.map((singleData) => ({
        ...singleData,
        added_by_portal: loginPortalId,
        portal_type: portalType,
        selectedlocation: selectedlocation,
        createdBy: createdBy,
      }));

      for (let data of list) {
        const checkname = data.name;

        let CheckData = await ReasonForAppointment.find({
          selectedlocation: mongoose.Types.ObjectId(selectedlocation),
          is_deleted: true,
        });

        for (let ele of CheckData) {
          if (ele.name === checkname) {
            return sendResponse(req, res, 200, {
              status: false,
              body: null,
              message: `Appointment Reason ${checkname} already exists for the same location.`,
              errorCode: null,
            });
          }
        }
      }

      const result = await ReasonForAppointment.insertMany(list);

      return sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: "Successfully added appointment reason",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to add appointment reason",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async reasonForAppointmentList(req, res) {
    try {
      const {
        limit,
        page,
        searchText,
        loginPortalId,
        listFor,
        selectedlocation,
      } = req.query;
      let sort = req.query.sort;
      let sortingarray = {};
      if (sort != "undefined" && sort != "" && sort != undefined) {
        let keynew = sort.split(":")[0];
        let value = sort.split(":")[1];
        sortingarray[keynew] = Number(value);
      } else {
        sortingarray["createdAt"] = -1;
      }

      let filter = {
        added_by_portal: mongoose.Types.ObjectId(loginPortalId),
        is_deleted: false,
      };

      if (listFor === undefined) {
        filter = { ...filter, active: true };
      }

      if (searchText !== "") {
        filter.name = { $regex: searchText || "", $options: "i" };
      }

      if (selectedlocation !== "undefined" && selectedlocation !== "") {
        filter = {
          ...filter,
          selectedlocation: mongoose.Types.ObjectId(selectedlocation),
        };
      }
      let aggregate = [
        {
          $match: filter,
        },
        {
          $lookup: {
            from: "hospitallocations",
            let: { selectedlocation: "$selectedlocation" },
            pipeline: [
              {
                $unwind: "$hospital_or_clinic_location",
              },
              {
                $match: {
                  $expr: {
                    $eq: [
                      {
                        $toObjectId: "$hospital_or_clinic_location.hospital_id",
                      },
                      "$$selectedlocation",
                    ],
                  },
                },
              },
            ],
            as: "locationDetails",
          },
        },
        {
          $unwind: "$locationDetails",
        },
        {
          $group: {
            _id: "$_id", // Use the field that uniquely identifies each record
            name: { $first: "$name" }, // Using $first as an accumulator
            active: { $first: "$active" }, // Using $first as an accumulator
            added_by_portal: { $first: "$added_by_portal" }, // Using $first as an accumulator
            locationDetails: { $first: "$locationDetails" }, // Choose the document you want to keep
          },
        },
      ];

      const count = await ReasonForAppointment.aggregate(aggregate);
      aggregate.push({
        $sort: sortingarray,
      });

      if (limit != "0") {
        aggregate.push({ $skip: (page - 1) * limit }, { $limit: limit * 1 });
      }

      const result = await ReasonForAppointment.aggregate(aggregate);
      sendResponse(req, res, 200, {
        status: true,
        body: {
          totalCount: count.length,
          data: result,
        },
        message: "Successfully get reason for appointment list",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get reason for appointment list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async updateReasonForAppointment(req, res) {
    try {
      const {
        appointmentReasonId,
        name,
        active,
        loginPortalId,
        selectedlocation,
      } = req.body;
      const result = await ReasonForAppointment.findOneAndUpdate(
        { _id: appointmentReasonId },
        {
          $set: {
            name,
            active,
            added_by_portal: loginPortalId,
            selectedlocation,
          },
        },
        { new: true }
      ).exec();
      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: "Successfully updated reason for appointment",
        errorCode: null,
      });
    } catch (err) {
      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to update reason for appointment`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async actionOnReasonForAppointment(req, res) {
    try {
      const { appointmentReasonId, action_name, action_value } = req.body;

      const filter = {};
      if (action_name == "active") filter["active"] = action_value;
      if (action_name == "delete") filter["is_deleted"] = action_value;

      const result = await ReasonForAppointment.findOneAndUpdate(
        { _id: appointmentReasonId },
        filter,
        { new: true }
      ).exec();
      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: "Successfully deleted appointment reason",
        errorCode: null,
      });
    } catch (err) {
      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to action done`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async bulkUploadAppointmentReason(req, res) {
    try {
      const filePath = "./uploads/" + req.filename;
      const data = await processExcel(filePath);

      const isValidFile = validateColumnWithExcel(
        AppointmentReasonColumns,
        data[0]
      );
      fs.unlinkSync(filePath);
      if (!isValidFile) {
        sendResponse(req, res, 500, {
          status: false,
          body: isValidFile,
          message: "Invalid excel sheet! column not matched.",
          errorCode: null,
        });
        return;
      }
      const inputArray = [];
      for (const singleData of data) {
        inputArray.push({
          name: singleData.ReasonName,
          selectedlocation: req.body.selectedlocation,
          added_by_portal: req.body.loginPortalId,
          portal_type: req.body.portalType,
        });
      }

      for (let data of inputArray) {
        const checkname = data.name;

        let CheckData = await ReasonForAppointment.find({
          selectedlocation: mongoose.Types.ObjectId(req.body.selectedlocation),
          is_deleted: false,
        });

        for (let ele of CheckData) {
          if (ele.name === checkname) {
            return sendResponse(req, res, 200, {
              status: false,
              body: null,
              message: `Appointment Reason ${checkname} already exists for the same location in sheet.`,
              errorCode: null,
            });
          }
        }
      }
      const result = await ReasonForAppointment.insertMany(inputArray);

      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: "Successfully added appointment reasons",
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: error.message
          ? error.message
          : "failed to add appointment reasons",
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  //Questionnaire
  async addQuestionnaire(req, res) {
    try {
      const {
        controller,
        question,
        type,
        options,
        active,
        required,
        loginPortalId,
        portalType,
        createdBy,
      } = req.body;

      //  "body________");
      const questionnaire = new Questionnaire({
        controller,
        question,
        type,
        options,
        active,
        required,
        added_by_portal: loginPortalId,
        portal_type: portalType,
        createdBy: createdBy,
      });
      const result = await questionnaire.save();
      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: "Successfully added questionnaire",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to add questionnaire",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async QuestionnaireList(req, res) {
    try {
      const { limit, page, loginPortalId } = req.query;

      let sort = req.query.sort;
      let sortingarray = {};
      if (sort != "undefined" && sort != "" && sort != undefined) {
        let keynew = sort.split(":")[0];
        let value = sort.split(":")[1];
        sortingarray[keynew] = value;
      } else {
        sortingarray["createdAt"] = -1;
      }
      let filter = {
        is_deleted: false,
        added_by_portal: { $eq: loginPortalId },
      };

      const result = await Questionnaire.find(filter)
        .sort(sortingarray)
        .skip((page - 1) * limit)
        .limit(limit * 1)
        .exec();
      const count = await Questionnaire.countDocuments(filter);
      return sendResponse(req, res, 200, {
        status: true,
        body: {
          totalCount: count,
          data: result,
        },
        message: "Successfully get questionnaire list",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get questionnaire list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async QuestionnaireDetails(req, res) {
    try {
      const { questionnaireId } = req.query;
      const result = await Questionnaire.findOne({ _id: questionnaireId });
      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: "Successfully get questionnaire details",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get questionnaire details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async updateQuestionnaire(req, res) {
    try {
      const {
        questionnaireId,
        controller,
        question,
        type,
        options,
        active,
        required,
      } = req.body;
      const result = await Questionnaire.findOneAndUpdate(
        { _id: questionnaireId },
        {
          $set: {
            controller,
            question,
            type,
            options,
            active,
            required,
          },
        },
        { new: true }
      ).exec();
      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: "Successfully updated questionnaire",
        errorCode: null,
      });
    } catch (err) {
      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to update questionnaire`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async actionOnQuestionnaire(req, res) {
    try {
      const { questionnaireId, action_name, action_value } = req.body;

      const filter = {};
      if (action_name == "active") filter["active"] = action_value;
      if (action_name == "delete") filter["is_deleted"] = action_value;
      if (action_name == "required") filter["required"] = action_value;

      const result = await Questionnaire.findOneAndUpdate(
        { _id: questionnaireId },
        filter,
        { new: true }
      ).exec();
      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: "Successfully action done",
        errorCode: null,
      });
    } catch (err) {
      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to action done`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async listCategoryStaff(req, res) {
    try {
      const { pharmacyId, staffRoleId } = req.query;
      const staffList = await StaffInfo.find({
        creatorId: pharmacyId,
        role: staffRoleId,
      });
      sendResponse(req, res, 200, {
        status: true,
        data: staffList,
        message: `Get staff list successfully`,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        data: error,
        message: `failed to get staff list`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getPortalUserData(req, res) {
    try {
      let result = await PortalUser.find({
        _id: mongoose.Types.ObjectId(req.query.data),
      }).exec();
      sendResponse(req, res, 200, {
        status: true,
        data: result,
        message: `profile data fetch successfully`,
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

  async getBasicInfoData(req, res) {
    try {
      const result = await BasicInfo.find({ verify_status: "APPROVED" })
        .select({
          first_name: 1,
          middle_name: 1,
          last_name: 1,
          full_name: 1,
          for_portal_user: 1,
          _id: 0,
          title: 1,
          speciality_name: 1,
        })
        .populate({
          path: "for_portal_user",
          match: { isDeleted: false }, // Add this match condition
        });
      sendResponse(req, res, 200, {
        status: true,
        data: result,
        message: `basic data fetch successfully`,
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

  async fourPortalHospitalListforChat(req, res) {
    try {
      let result = await BasicInfo.find({
        for_hospitalIds: mongoose.Types.ObjectId(req.query.data),
      }).select({ for_portal_user: 1 });

      // Extract the for_portal_user values from the result array
      const forPortalUserIds = result.map((item) => item.for_portal_user);
      let portalData = await PortalUser.find({
        _id: { $in: forPortalUserIds },
        isDeleted: false,
      }).select({ _id: 1, full_name: 1, profile_picture: 1, role: 1, type: 1 });

      if (result?.length > 0) {
        sendResponse(req, res, 200, {
          status: true,
          data: portalData,
          message: `hospital FouPortal fetched successfully`,
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 200, {
          status: true,
          data: null,
          message: `hospital FouPortal fetched successfully`,
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
        for_portal_user: mongoose.Types.ObjectId(req.query.for_portal_user),
      })
        .sort({ createdAt: -1 })
        .limit(10);
      const count = await Notification.countDocuments({
        for_portal_user: mongoose.Types.ObjectId(req.query.for_portal_user),
        new: true,
      });
      const isViewcount = await Notification.countDocuments({
        for_portal_user: mongoose.Types.ObjectId(req.query.for_portal_user),
        isView: false,
      });
      const headers = {
        Authorization: req.headers["authorization"],
      };
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
            isView: element.isView,
          };
          if (element.created_by_type == "patient") {
            let ids = [element.created_by];
            let resData = await httpService.postStaging(
              "patient/get-patient-details-by-id",
              { ids: ids },
              headers,
              "patientServiceUrl"
            );
            object.name = resData.data[element.created_by].full_name;
            object.picture = resData.data[element.created_by].profile_pic;
            newnotificationlist.push(object);
          } else {
            object.name = "";
            object.picture = "";
            newnotificationlist.push(object);
          }
        }
      }
      sendResponse(req, res, 200, {
        status: true,
        body: {
          list: newnotificationlist,
          count: count,
          isViewcount: isViewcount,
        },

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
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to update notification",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async portal_fetchRoomCall(req, res) {
    try {
      const headers = {
        Authorization: req.body.authtoken,
      };

      let appintmentdetails = await httpService.getStaging(
        "labradio/four-portal-view-appointment-by-roomname",
        { roomname: req.body.roomName, portal_type: req.body.portal_type },
        headers,
        "labradioServiceUrl"
      );
      let checkavailableUser = {
        participants: appintmentdetails.data.participantsinfodetails,
      };
      const uniqueId = req.body.uid;
      let completepromise = new Promise(async (resolve, reject) => {
        if (checkavailableUser.participants.length > 0) {
          let count = 0;
          checkavailableUser.participants.forEach(async (el) => {
            if (
              el.userId.toString() == req.user._id ||
              el.userId.toString() == req.user.portalUserId
            ) {
              const headers = {
                Authorization: req.body.authtoken,
              };
              let dataPass = {
                userId: el.userId.toString(),
                userName: el.userName,
                userImage: "",
                userIdentity: uniqueId,
              };
             await httpService.postStaging(
                "labradio/four-portal-update-videocall-appointment",
                {
                  appointmentId: req.body.chatId,
                  participants: "",
                  leftparticipantsid: el.userId.toString(),
                  participantstype: "remove",
                },
                headers,
                "labradioServiceUrl"
              );
             await httpService.postStaging(
                "labradio/four-portal-update-videocall-appointment",
                {
                  appointmentId: req.body.chatId,
                  participants: dataPass,
                  participantstype: "add",
                },
                headers,
                "labradioServiceUrl"
              );
              let token = await agoraTokenGenerator(
                appintmentdetails.data.roomdetails.roomName,
                req.body.uid
              );
              return sendResponse(req, res, 200, {
                status: true,
                body: token,
                message: "Token Generated",
                errorCode: null,
              });
            } else {
              count++;
            }
          });
          if (checkavailableUser.participants.length == count) {
            resolve("");
          }
        } else {
          resolve("");
        }
      });

      Promise.all([completepromise]).then(async () => {
        const roomName = req.body.roomName;
        const uniqueId = req.body.uid;
        if (!roomName) {
          return sendResponse(req, res, 200, {
            status: false,
            body: token,
            message: "Must include roomName argument.",
            errorCode: null,
          });
        }
        let token = await agoraTokenGenerator(roomName, uniqueId);
        if (req.body.loggedInUserId) {
          let dataPass = {
            userId: req.body.loggedInUserId,
            userName: req.body.loginname,
            userImage: "",
            userIdentity: uniqueId,
          };

          const headers = {
            Authorization: req.body.authtoken,
          };
         await httpService.postStaging(
            "labradio/four-portal-update-videocall-appointment",
            {
              appointmentId: req.body.chatId,
              participants: dataPass,
              participantstype: "add",
            },
            headers,
            "labradioServiceUrl"
          );
        }

        return sendResponse(req, res, 200, {
          status: true,
          body: token,
          message: "Token Generated",
          errorCode: null,
        });
      });
    } catch (error) {
      console.error("An error occurred:", error);
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "Token Generated",
        errorCode: "Some thing went wrong",
      });
    }
  }

  async getIdbyPortalUserName(req, res) {
    try {
      const { portalId } = req.query;

      const result = await BasicInfo.findOne({ for_portal_user: mongoose.Types.ObjectId(portalId) });
  
      if (!result) {
        return sendResponse(req, res, 404, {
          status: false,
          body: null,
          message: "User not found",
          errorCode: "USER_NOT_FOUND",
        });
      }
  
      let signed_profile_picture = '';
  
      if (result.profile_picture) {
        signed_profile_picture = await generateSignedUrl(result.profile_picture);
      }
  
      return sendResponse(req, res, 200, {
        status: true,
        body: {
          signed_profile_picture: signed_profile_picture
        },
        message: "Image sent successfully",
        errorCode: null,
      });
  
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error.message || error,
        message: "Failed to fetch list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  
  

  async getAllLocationById(req, res) {
    try {
      const { portal_user_id, type } = req.query;
      let alllocation = await HospitalLocation.find({
        for_portal_user: portal_user_id,
        type: type,
      });

      if (alllocation.length > 0) {
        sendResponse(req, res, 200, {
          status: true,
          body: alllocation,
          message: "List getting successfully!",
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "Failed to fetch list",
          errorCode: "INTERNAL_SERVER_ERROR",
        });
      }
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to fetch list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getAllHospitalandClinicList(req, res) {
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };
      const { portalType } = req.query;
      const filter = {
        isDeleted: false,
        lock_user: false,
        isActive: true,
        "for_doctor_info.verify_status": "APPROVED",
        type: portalType,
        "for_location_info.type": portalType,
      };

      const locationData = await PortalUser.aggregate([
        {
          $lookup: {
            from: "basicinfos",
            localField: "_id",
            foreignField: "for_portal_user",
            as: "for_doctor_info",
          },
        },
        {
          $lookup: {
            from: "hospitallocations",
            localField: "_id",
            foreignField: "for_portal_user",
            as: "for_location_info",
          },
        },
        { $unwind: "$for_location_info" },
        {
          $match: filter,
        },
        {
          $project: {
            _id: 1,
            for_location_info: {
              $filter: {
                input: {
                  $map: {
                    input: "$for_location_info.hospital_or_clinic_location",
                    as: "location",
                    in: {
                      $cond: {
                        if: { $eq: ["$$location.locationFor", "clinic"] },
                        then: {
                          hospital_id: "$$location.hospital_id",
                          hospital_name: "$$location.hospital_name",
                          location: "$$location.location",
                          locationFor: "$$location.locationFor",
                        },
                        else: null,
                      },
                    },
                  },
                },
                as: "location",
                cond: { $ne: ["$$location", null] },
              },
            },
          },
        },
        {
          $unwind: "$for_location_info",
        },
        {
          $match: { for_location_info: { $ne: null } },
        },
      ]);

      let hospitalDataResponse = await httpService.getStaging(
        "hospital/get-hospital-admin-data",
        {},
        headers,
        "hospitalServiceUrl"
      );

      if (!hospitalDataResponse.status || !hospitalDataResponse.body) {
        throw new Error("Failed to fetch hospital data");
      }

      const hospitalData = hospitalDataResponse.body;
      // Extracting the array of hospitals from hospitalData
      const hospitalArray = Array.isArray(hospitalData) ? hospitalData : [];

      const combinedResults = [...locationData, ...hospitalArray];

      sendResponse(req, res, 200, {
        status: true,
        body: combinedResults,
        message: "Successfully fetched all hospital",
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        data: error,
        message: "Failed to fetch all hospital",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getFourPortalListforLocation(req, res) {
    try {
      const { clinic_id, type } = req.query;

      let data1 = await HospitalLocation.find({
        hospital_or_clinic_location: {
          $elemMatch: {
            hospital_id: clinic_id,
            type: type,
          },
        },
      });

      let doctorDetails = await BasicInfo.find({
        for_portal_user: data1[0]?.for_portal_user,
      }).populate({
        path: "for_portal_user",
      });

      sendResponse(req, res, 200, {
        status: true,
        body: doctorDetails,
        message: "Successfully fetched all doctors",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `Failed to fetch all hospital`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getAllFourPortalList(req, res) {
    try {

      const filter = {
        isDeleted: false,
        lock_user: false,
        isActive: true,
        "for_doctor_info.verify_status": "APPROVED",
      };

      const locationData = await PortalUser.aggregate([
        {
          $lookup: {
            from: "basicinfos",
            localField: "_id",
            foreignField: "for_portal_user",
            as: "for_doctor_info",
          },
        },
        {
          $match: filter,
        },
        {
          $lookup: {
            from: "hospitallocations",
            localField: "_id",
            foreignField: "for_portal_user",
            as: "for_location_info",
          },
        },
        { $unwind: "$for_location_info" },
        {
          $project: {
            _id: 1,
            type: 1,
            for_location_info: {
              $filter: {
                input: {
                  $map: {
                    input: "$for_location_info.hospital_or_clinic_location",
                    as: "location",
                    in: {
                      $cond: {
                        if: { $eq: ["$$location.locationFor", "clinic"] },
                        then: {
                          hospital_id: "$$location.hospital_id",
                          hospital_name: "$$location.hospital_name",
                          location: "$$location.location",
                          locationFor: "$$location.locationFor",
                        },
                        else: null,
                      },
                    },
                  },
                },
                as: "location",
                cond: { $ne: ["$$location", null] },
              },
            },
          },
        },
        {
          $unwind: "$for_location_info",
        },
        {
          $match: { for_location_info: { $ne: null } },
        },
      ]);
      sendResponse(req, res, 200, {
        status: true,
        body: locationData,
        message: "Successfully fetched all hospital",
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        data: error,
        message: "Failed to fetch all hospital",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async fourPortalAllList(req, res) {
    const { hospital_portal_id } = req.query;
    try {

      let filter = {
        "for_portal_user.role": { $in: ["INDIVIDUAL"] },
        "for_portal_user.isDeleted": false,
        // for_hospital: mongoose.Types.ObjectId(hospital_portal_id),
        for_hospitalIds: { $in: [mongoose.Types.ObjectId(hospital_portal_id)] },
      };

      let aggregate = [
        {
          $lookup: {
            from: "portalusers",
            localField: "for_portal_user",
            foreignField: "_id",
            as: "for_portal_user",
          },
        },
        {
          $unwind: {
            path: "$for_portal_user",
            preserveNullAndEmptyArrays: true,
          },
        },
        { $match: filter },
        {
          $project: {
            first_name: 1,
            middle_name: 1,
            last_name: 1,
            full_name: 1,
            license_details: 1,
            services: 1,
            department: 1,
            unit: 1,
            expertise: 1,
            speciality: 1,
            for_portal_user: {
              _id: "$for_portal_user._id",
              email: "$for_portal_user.email",
              country_code: "$for_portal_user.country_code",
              phone_number: "$for_portal_user.phone_number",
              lock_user: "$for_portal_user.lock_user",
              isActive: "$for_portal_user.isActive",
              createdAt: "$for_portal_user.createdAt",
              role: "$for_portal_user.role",
              type: "$for_portal_user.type",
            },
          },
        },
      ];

      const result = await BasicInfo.aggregate(aggregate);

      sendResponse(req, res, 200, {
        status: true,
        data: result,
        message: `list fetched successfully`,
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

  async addManualTest(req, res) {
    try {
      const { entriesArray, added_by, type } = req.body;
      const list = entriesArray.map((singleData) => ({
        ...singleData,
        for_portal_user: added_by,
        isExist: true,
        type: type,
      }));
      const typeToFind = list.map((item) => item.typeOfTest);
      const namesToFind = list.map((item) => item.nameOfTest);
      const foundItems = await PathologyTestInfoNew.find({
        typeOfTest: { $in: typeToFind },
        nameOfTest: { $in: namesToFind },
      });
      const CheckData = foundItems.map((item) => item.nameOfTest);
      if (foundItems.length == 0) {
        const savedtests = await PathologyTestInfoNew.insertMany(list);
        sendResponse(req, res, 200, {
          status: true,
          body: savedtests,
          message: "Successfully add Tests",
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 200, {
          status: false,

          message: `${CheckData} is already exist`,
          errorCode: null,
        });
      }
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to add Language",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async editManualTest(req, res) {
    try {
      const existingTest = await PathologyTestInfoNew.findOne({
        typeOfTest: req.body.typeOfTest,
        nameOfTest: req.body.nameOfTest,
        type: req.body.type,
        for_portal_user: req.body.loggedInId,
      });
      if (existingTest) {
        sendResponse(req, res, 200, {
          status: false,
          body: null,
          message:
            "Test with the same name already exists for this type of test",
          errorCode: "TEST_ALREADY_EXISTS",
        });
        return;
      }

      const data = {
        typeOfTest: req.body.typeOfTest,
        nameOfTest: req.body.nameOfTest,
      };
      const updatedtest = await PathologyTestInfoNew.findByIdAndUpdate(
        { _id: req.body.id },
        data,
        { upsert: false, new: true }
      );
      sendResponse(req, res, 200, {
        status: true,
        body: updatedtest,
        message: "Successfully updated Test",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to update test",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async updatelogsData(req, res) {
    const { currentLogID, userAddress } = req.body;
    try {
      const currentDate = new Date();
      const timeZone = process.env.TIMEZONE;
      
      const formattedDate = currentDate.toLocaleString("en-US", { timeZone });
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
    const { userId, limit, page } = req.query;
    try {
      let sort = req.query.sort;
      let sortingarray = {};
      if (sort != "undefined" && sort != "" && sort != undefined) {
        let keynew = sort.split(":")[0];
        let value = sort.split(":")[1];
        sortingarray[keynew] = value;
      } else {
        sortingarray["createdAt"] = -1;
      }
      let filter = {};

      filter = { userId: mongoose.Types.ObjectId(userId) };

      const userData = await Logs.find(filter)
        .sort(sortingarray)
        .skip((page - 1) * limit)
        .limit(limit * 1)
        .exec();

      const count = await Logs.countDocuments(filter);
      if (userData) {
        return sendResponse(req, res, 200, {
          status: true,
          body: {
            count,
            userData,
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

  async getProviderDocumentsByFilters(req, res) {
    try {
      const { portalUserId, startDate, endDate, type } = req.query;
      const filter = {
        for_portal_user: portalUserId,
        isDeleted: false,
        type: type,
      };
      if (startDate && endDate) {
        const formattedStartDate = startDate.split("-").reverse().join("/");
        const formattedEndDate = endDate.split("-").reverse().join("/");
        filter.upload_date = {
          $gte: formattedStartDate,
          $lte: formattedEndDate,
        };
      }
      const documents = await ProviderDocs.find(filter).exec();
      if (!documents || documents.length === 0) {
        return sendResponse(req, res, 201, {
          status: false,
          body: null,
          message: "No documents found",
          errorCode: "DOCUMENT_NOT_FOUND",
        });
      } else {
        return sendResponse(req, res, 200, {
          status: true,
          body: { documents },
          message: "Documents retrieved successfully",
          errorCode: null,
        });
      }
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "Failed to retrieve documents",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async inActive_isDeletedProviderDocument(req, res) {
    try {
      const { documentId, action, status } = req.body;
      if (!documentId || !action) {
        return sendResponse(req, res, 201, {
          status: false,
          body: null,
          message:
            "Both documentId and action fields are required in the request body",
          errorCode: "MISSING_PARAMETER",
        });
      }
      if (action === "inactive") {
        await ProviderDocs.findByIdAndUpdate(documentId, {
          status: status,
        }).exec();
        return sendResponse(req, res, 200, {
          status: true,
          body: null,
          message: "Document update successfully",
          errorCode: null,
        });
      } else if (action === "deleted") {
        await ProviderDocs.findByIdAndUpdate(documentId, {
          isDeleted: status,
        }).exec();
        return sendResponse(req, res, 200, {
          status: true,
          body: null,
          message: "Document deleted successfully",
          errorCode: null,
        });
      } else {
        return sendResponse(req, res, 400, {
          status: false,
          body: null,
          message: "Invalid action provided",
          errorCode: "INVALID_ACTION",
        });
      }
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "Failed to update document status",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getFourPortalList(req, res) {
    try {
      const { type } = req.query;
      const result = await PortalUser.find(
        {
          type: type,
          verified: true,
          lock_user: false,
          isDeleted: false,
          createdBy: "self",
          isActive: true,
        },
        { full_name: 1, _id: 1, profile_picture: 1 }
      );
      sendResponse(req, res, 200, {
        status: true,
        data: result,
        message: `Basic data fetched successfully`,
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

  async fourtportalDetails(req, res) {
    try {
      const { pharmacyId } = req.query;

      const portalUserData = await PortalUser.findOne({ _id: pharmacyId });
      await BasicInfo.findOne({
        for_portal_user: pharmacyId,
      }).populate({ path: "for_portal_user" });
      sendResponse(req, res, 200, {
        status: true,
        data: portalUserData,
        message: `pharmacy details fetched successfully`,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        data: error,
        message: `failed to get all pharmacy details`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getReviewAndRatinByPatient(req, res) {
    try {
      const { patientId } = req.query;
      const sort = req.query.sort;
      let sortingarray = {};

      if (sort !== undefined && sort !== "") {
        const sortParts = sort.split(":");
        const sortByField = sortParts[0];
        const sortOrder = sortParts[1];

        if (sortByField === "full_name") {
          sortingarray["portalusers.full_name"] = sortOrder === "desc" ? -1 : 1;
        } else {
          sortingarray[sortByField] = sortOrder === "desc" ? -1 : 1;
        }
      } else {
        sortingarray["createdAt"] = -1;
      }

      const { type } = req.query;
      const result = await ReviewAndRating.aggregate([
        {
          $match: {
            $and: [
              { patient_login_id: mongoose.Types.ObjectId(patientId) },
              { portal_type: type },
            ],
          },
        },

        {
          $lookup: {
            from: "portalusers",
            localField: "portal_user_id",
            foreignField: "_id",
            as: "portalusers",
          },
        },
        { $unwind: { path: "$portalusers", preserveNullAndEmptyArrays: true } },
        {
          $sort: sortingarray,
        },

        {
          $project: {
            _id: 1,
            rating: 1,
            comment: 1,
            updatedAt: 1,
            portal_user_id: 1,
            fullname: "$portalusers.full_name",
            profileUrl: "$portalusers.profile_picture",
          },
        },
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

        let filteredDate = `${year}-${month}-${day}`;
        let filteredTime = `${hours}:${minutes}:${seconds}`;
        objArray.push({
          _id: element?._id,
          rating: element?.rating,
          comment: element?.comment,
          name: element?.fullname,
          for_portal_user: element?.portal_user_id,
          date: filteredDate,
          time: filteredTime,
          profileUrl: element?.profileUrl ? element?.profileUrl : "",
        });
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
        message: error.message
          ? error.message
          : `something went wrong while fetching reviews`,
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getReviewAndRatingForSupeAdmin(req, res) {
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };
      const { page, limit, reviewBy, reviewTo } = req.query;
      let sort = req.query.sort;
      let sortingarray = {};
      if (sort != "undefined" && sort != "" && sort != undefined) {
        let keynew = sort.split(":")[0];
        let value = sort.split(":")[1];
        sortingarray[keynew] = Number(value);
      } else {
        sortingarray["createdAt"] = -1;
      }
      let aggregate = [
        {
          $match: { reviewBy, reviewTo },
        },
        {
          $lookup: {
            from: "portalusers",
            localField: "patient_login_id",
            foreignField: "_id",
            as: "basicinfos",
          },
        },
        { $unwind: { path: "$basicinfos", preserveNullAndEmptyArrays: true } },

        {
          $project: {
            rating: 1,
            comment: 1,
            createdAt: 1,
            updatedAt: 1,
            patient_login_id: 1,
            portal_user_id: 1,
            reviewBy: 1,
            doctorName: "$basicinfos.full_name",
            doctorNameArabic: "$basicinfos.full_name_arabic",
            type: "$basicinfos.type",
            profilePic: { $ifNull: ["$basicinfos.profile_picture", null] },
          },
        },
      ];

      const totalCount = await ReviewAndRating.aggregate(aggregate);
      aggregate.push({
        $sort: sortingarray,
      });
      if (limit > 0) {
        aggregate.push({ $skip: (page - 1) * limit }, { $limit: limit * 1 });
      }

      const result = await ReviewAndRating.aggregate(aggregate);

      let hospitalId = "";
      for (const value of result) {
        hospitalId = value?.portal_user_id;
      }
      let hospitalName = await httpService.getStaging(
        "hospital/get_hospital_by_id",
        { for_portal_user: hospitalId },
        headers,
        "hospitalServiceUrl"
      );

      let ratingArray = [];
      for (const value of result) {
        ratingArray.push({
          rating: value?.rating,
          comment: value?.comment,
          createdAt: value?.createdAt,
          updatedAt: value?.updatedAt,
          reviewBy: value?.reviewBy,
          doctorName: value?.doctorName,
          doctorNameArabic: value?.doctorNameArabic,
          profileUrl: value?.profilePic || "",
          hospitalName: hospitalName?.data?.hospital_name,
          _id: value?._id,
        });
      }

      sendResponse(req, res, 200, {
        status: true,
        body: {
          ratingArray,
          // getAverage,
          // ratingCount,
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
        message: error.message
          ? error.message
          : `something went wrong while fetching reviews`,
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
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
        notitype: req.body.data?.notitype,
      });
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
          body: saveData,
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

  async getAllPortal_RegisteredUser(req, res) {
    try {
      let filter = {
        "for_portal_user.isDeleted": false,
        "for_portal_user.createdBy": "self",
      };

      let aggregate = [
        {
          $lookup: {
            from: "portalusers",
            localField: "for_portal_user",
            foreignField: "_id",
            as: "for_portal_user",
          },
        },
        { $unwind: "$for_portal_user" },
        { $match: filter },

        {
          $project: {
            first_name: 1,
            middle_name: 1,
            last_name: 1,
            full_name: 1,
            _id: 0,
            for_portal_user: {
              _id: "$for_portal_user._id",
              email: "$for_portal_user.email",
              country_code: "$for_portal_user.country_code",
              phone_number: "$for_portal_user.phone_number",
            },
            updatedAt: 1,
          },
        },
      ];
      const result = await BasicInfo.aggregate(aggregate);

      sendResponse(req, res, 200, {
        status: true,
        data: result,
        message: `fetching registered user data.`,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `Failed to response`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async getTotalLabRadioCount(req, res) {
    try {
      const {fromDate, toDate} = req.query
      let filter = { isDeleted: false, role: "INDIVIDUAL" };
      if(fromDate && toDate) {
        const fromDateObj = new Date(`${fromDate} 00:00:00`);
        const toDateObj = new Date(`${toDate} 23:59:59`);
        filter.createdAt = { $gte: fromDateObj, $lte: toDateObj }
      }
      filter.type = 'Laboratory'
      const getLabCount = await PortalUser.find(filter).countDocuments()
      filter.type = 'Radiology'
      const getRadioCount = await PortalUser.find(filter).countDocuments()
      sendResponse(req, res, 200, {
        status: true,
        message: `Total count.`,
        data: {
          totalLaboratory: getLabCount,
          totalRadiology: getRadioCount
        },
        errorCode: null,
      });
    } catch (error) {
      console.log("Error while fetching total count:",error);
      sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
        body: error,
        errorCode: null,
      });
    }
  }

  async getTotalLabRadioRecords(req, res) {
    try {
      const { fromDate, toDate } = req.query;
      let filter = { isDeleted: false, role: "INDIVIDUAL" };
  
      if (fromDate && toDate) {
        const fromDateObj = new Date(`${fromDate} 00:00:00`);
        const toDateObj = new Date(`${toDate} 23:59:59`);
        filter.createdAt = { $gte: fromDateObj, $lte: toDateObj };
      }
  
      filter.type = 'Laboratory';
      const labData = await PortalUser.find(filter);
  
      filter.type = 'Radiology';
      const radioData = await PortalUser.find(filter);
      const totalLaboratory = labData.length;
      const totalRadiology = radioData.length;
  
      sendResponse(req, res, 200, {
        status: true,
        message: "Total count.",
        data: {
          totalLaboratory,
          totalRadiology,
          laboratoryData: labData, 
          radiologyData: radioData
        },
        errorCode: null,
      });
    } catch (error) {
      console.log("Error while fetching total count:", error);
      sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
        body: error,
        errorCode: null,
      });
    }
  }

  async getDashboardLabRadiologyReport(req, res) {
  try {
    const {fromDate, toDate, type, labRadioId} = req.query
    let filter = { serviceType: type };
    if(fromDate && toDate) {
      const fromDateObj = new Date(`${fromDate} 00:00:00`);
      const toDateObj = new Date(`${toDate} 23:59:59`);
      filter.createdAt = { $gte: fromDateObj, $lte: toDateObj }
    }
    if (labRadioId) {
      filter.labRadiologyId = mongoose.Types.ObjectId(labRadioId);
    }
    const getTotalAppointments = Appointment.find({...filter, status: {$in: ["PENDING", "CANCELLED", "UNDER_PROCESSED", "APPROVED", "COMPLETED"]}}).countDocuments()
    const getCompletedAppointments = Appointment.find({...filter, status: 'COMPLETED'}).countDocuments()
    const getUnderProcessAppointments = Appointment.find({...filter, status: 'UNDER_PROCESSED'}).countDocuments()
    const getPendingAppointments = Appointment.find({...filter, status: 'PENDING'}).countDocuments()
    const totalCount = await Promise.all([getTotalAppointments, getCompletedAppointments, getUnderProcessAppointments, getPendingAppointments])

      
    sendResponse(req, res, 200, {
        status: true,
        message: `Dashboard data fetched successfully`,
        body: {
          totalOrder: totalCount[0],
          totalCompletedOrder: totalCount[1],
          totalIncompletedOrder: totalCount[2],
          totalNewOrder: totalCount[3],
        },
        errorCode: null,
    });
  } catch (error) {
    console.log("Failed to get dashboard data", error);
    sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `failed to get dashboard data`,
        errorCode: "INTERNAL_SERVER_ERROR",
    });
  }
  }

  async getDashboardLabRadiologyList(req, res) {
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };
      const {page, limit, fromDate, toDate, type, labRadioId, sort, status} = req.query
      let date_filter = {}
      if(fromDate && toDate) {
        const fromDateObj = new Date(`${fromDate} 00:00:00`);
        const toDateObj = new Date(`${toDate} 23:59:59`);
        date_filter = {
          createdAt: { $gte: fromDateObj, $lte: toDateObj }
        }
      }
      let status_filter = ["PENDING", "CANCELLED", "UNDER_PROCESSED", "APPROVED", "COMPLETED"]
      if (status && status != 'ALL') {
        status_filter = [status]
      }
      let id_filter = {}
      if (labRadioId) {
        id_filter = {
          labRadiologyId: mongoose.Types.ObjectId(labRadioId)
        }
      }
      const pipeline = [
        {
          $lookup: {
            from: "portalusers",
            localField: "labRadiologyId",
            foreignField: "_id",
            as: "portalusers",
          },
        },
        { 
          $unwind: {
            path: "$portalusers",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            centre_name: "$portalusers.centre_name",
            type: "$portalusers.type",
          },
        },
        {
          $lookup: {
            from: "locationinfos",
            localField: "portalusers._id",
            foreignField: "for_portal_user",
            as: "locationinfos",
          },
        },
        { 
          $unwind: {
            path: "$locationinfos",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            centreLocation: "$locationinfos.address",
          },
        },
        {
            $match: {
                serviceType: type,
                status: { $in: status_filter },
                $and: [
                  date_filter,
                  id_filter
                ]
            }
        },
        {
          $lookup: {
            from: "labtests",
            localField: "labTestIds.testId",
            foreignField: "_id",
            as: "labtests",
          },
        },
        {
          $addFields: {
            labTestRecords: {
              $map: {
                input: "$labTestIds",
                as: "labTest",
                in: {
                  testId: "$$labTest.testId",
                  testResultId: "$$labTest.testResultId",
                  resultType: "$$labTest.resultType",
                  status: "$$labTest.status",
                  testHistory: "$$labTest.testHistory",
                  externalResults: "$$labTest.extrenalResults",
                  testName: {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: "$labtests",
                              as: "test",
                              cond: { $eq: ["$$test._id", "$$labTest.testId"] }
                            }
                          },
                          as: "matchedTest",
                          in: "$$matchedTest.testName"
                        }
                      },
                      0
                    ]
                  }
                }
              }
            }
          }
        },
        {
          $unwind: {
            path: "$labtests",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            labTestName: "$labtests.testName",
          },
        },
        {
          $lookup: {
            from: "radiologytests",
            localField: "radiologyTestIds.testId",
            foreignField: "_id",
            as: "radiologytests",
          },
        },
        {
          $addFields: {
            radiologyTestRecords: {
              $map: {
                input: "$radiologyTestIds",
                as: "radiologyTest",
                in: {
                  testId: "$$radiologyTest.testId",
                  testResultId: "$$radiologyTest.testResultId",
                  resultType: "$$radiologyTest.resultType",
                  status: "$$radiologyTest.status",
                  testHistory: "$$radiologyTest.testHistory",
                  testName: {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: "$radiologytests",
                              as: "test",
                              cond: { $eq: ["$$test._id", "$$radiologyTest.testId"] }
                            }
                          },
                          as: "matchedTest",
                          in: "$$matchedTest.testName"
                        }
                      },
                      0
                    ]
                  }
                }
              }
            }
          }
        },
        {
          $unwind: {
            path: "$radiologytests",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            radiologyTestName: "$radiologytests.testName",
          },
        },
      ]
        
      pipeline.push({
        $group: {
              _id: "$_id",
              appointmentId: { $first: "$appointment_id" },
              createdAt: { $first: "$createdAt" },
              updatedAt: { $first: "$updatedAt" },
              patientId: { $first: "$patientId" },
              doctorId: { $first: "$doctorId" },
              consultationDate: { $first: "$consultationDate" },
              consultationTime: { $first: "$consultationTime" },
              status: { $first: "$status" },
              centreName: { $first: "$centre_name" },
              labTestName: { $push: "$labTestName" },
              radiologyTestName: { $push: "$radiologyTestName" },
              type: { $first: "$type" },
              centreLocation: { $first: "$centreLocation" },
        }
      },)
      let sortKey = 'createdAt'
      let sortValue = -1
      if (sort) {
        sortKey = sort.split(':')[0]
        sortValue = sort.split(':')[1]
      }

      pipeline.push(
        { $sort: 
          {
            [sortKey]: Number(sortValue)
          } 
        },
        {
          $facet: {
          totalCount: [
              {
                  $count: 'count'
              }
          ],
          paginatedResults: limit != 0 ? [
              { $skip: (page - 1) * limit }, 
              { $limit: limit * 1 },
            ] : [
              { $skip: 0 }, 
            ],
          }
        }
      )
      const result = await Appointment.aggregate(pipeline);
      const statuses = {
        PENDING: 'Pending', 
        CANCELLED: 'Cancelled', 
        APPROVED: 'Approved', 
        UNDER_PROCESSED: 'Under Process', 
        COMPLETED: 'Completed', 
        MISSED: 'Missed'
      }
      const paginatedResults = result[0].paginatedResults
      const patientDetails = getAllPatient(paginatedResults)
      const doctorDetails = getAllDoctor(paginatedResults, headers)
      const promisesResult = await Promise.all([patientDetails,doctorDetails])
      
      for (let index = 0; index < paginatedResults.length; index++) {
        paginatedResults[index].patientName = promisesResult[0][paginatedResults[index].patientId.toString()]?.full_name
        paginatedResults[index].patientProfile = promisesResult[0][paginatedResults[index].patientId.toString()]?.profile_pic
        paginatedResults[index].doctorName = promisesResult[1][paginatedResults[index].doctorId.toString()]?.full_name
        paginatedResults[index].doctorNameArabic = promisesResult[1][paginatedResults[index].doctorId.toString()]?.full_name_arabic
        paginatedResults[index].doctorProfile = promisesResult[1][paginatedResults[index].doctorId.toString()]?.profilePicture
        paginatedResults[index].status = statuses[paginatedResults[index].status]
      }

      let totalCount = 0
      if (result[0].totalCount.length > 0) {
        totalCount = result[0].totalCount[0].count
      }

      sendResponse(req, res, 200, {
        status: true,
        message: `Data fetched successfully`,
        data: {
          totalRecords: totalCount,
          currentPage: page,
          totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
          data: result[0]?.paginatedResults,
        },
        errorCode: null,
      });
    } catch (error) {
      console.log("Failed to get dashboard data", error);
      sendResponse(req, res, 500, {
          status: false,
          body: error,
          message: `failed to get dashboard data`,
          errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getDashboardData(req, res) {
  try {    
    const {fromDate, toDate, type} = req.query
    let filter = { serviceType: type }
    if (req?.user?.role == 'INDIVIDUAL') {
      filter.labRadiologyId = mongoose.Types.ObjectId(req?.user?._id)
    }
    if(fromDate && toDate) {
      const fromDateObj = new Date(`${fromDate} 00:00:00`);
      const toDateObj = new Date(`${toDate} 23:59:59`);
      filter.createdAt = { $gte: fromDateObj, $lte: toDateObj }
    }
    const todaysDate = moment().tz(config.TIMEZONE).format("YYYY-MM-DD");
    const getTotalAppointments = Appointment.find({...filter, status: {$in: ["PENDING", "CANCELLED", "UNDER_PROCESSED", "APPROVED", "COMPLETED"]}}).countDocuments()
    const getTodaysAppointments = Appointment.find({...filter, status: 'APPROVED', consultationDate: todaysDate}).countDocuments()
    const getUnderProcessAppointments = Appointment.find({...filter, status: 'UNDER_PROCESSED'}).countDocuments()
    const getPendingAppointments = Appointment.find({...filter, status: 'PENDING'}).countDocuments()
    const getCompletedAppointments = Appointment.find({...filter, status: 'COMPLETED'}).countDocuments()
    const getCancelledAppointments = Appointment.find({...filter, status: 'CANCELLED'}).countDocuments()
    const getApprovedAppointments = Appointment.find({...filter, status: 'APPROVED'}).countDocuments()
    const totalCount = await Promise.all([getTotalAppointments, getTodaysAppointments, getUnderProcessAppointments, getPendingAppointments, getCompletedAppointments, getCancelledAppointments, getApprovedAppointments])
    
    sendResponse(req, res, 200, {
        status: true,
        message: `Dashboard data fetched successfully`,
        body: {
          totalAppointments: totalCount[0],
          totalTodaysAppointments: totalCount[1],
          totalReportUnderProcess: totalCount[2],
          totalReportPending: totalCount[3],
          totalReportCompleted: totalCount[4],
          totalReportCancelled: totalCount[5],
          totalReportApproved: totalCount[6],
        },
        errorCode: null,
    });
  } catch (error) {
    console.log("Failed to get dashboard data", error);
    sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `failed to get dashboard data`,
        errorCode: "INTERNAL_SERVER_ERROR",
    });
  }
  }

  async getDashboardDataRecords(req, res) {
    try {
      const { fromDate, toDate, type } = req.query;
      let filter = { serviceType: type };

      if (req?.user?.role == "INDIVIDUAL") {
        filter.labRadiologyId = mongoose.Types.ObjectId(req?.user?._id);
      }

      const headers = {
        Authorization: req.headers["authorization"],
      };

      if (fromDate && toDate) {
        const fromDateObj = new Date(`${fromDate} 00:00:00`);
        const toDateObj = new Date(`${toDate} 23:59:59`);
        filter.createdAt = { $gte: fromDateObj, $lte: toDateObj };
      }

      // Fetch all appointments
      const totalAppointments = await Appointment.find({
        ...filter,
        status: { $in: ["PENDING", "CANCELLED", "UNDER_PROCESSED", "APPROVED", "COMPLETED"] },
      })
        .populate("labRadiologyId")
        .lean(); // Convert to plain JSON to avoid unnecessary Mongoose hydration

      // Extract unique patientIds & parentAppointmentIds
      const patientIdsArray = [...new Set(
        totalAppointments.map(appt => appt.patientId?.toString()).filter(Boolean)
      )];

      const parentAppointmentIdArray = [...new Set(
        totalAppointments.map(appt => appt.parentAppointmentId?.toString()).filter(Boolean)
      )];

      // Fetch patient details
      let patientDetailsMap = {};
      if (patientIdsArray.length) {
        const getPatientDetails = await httpService.postStaging(
          "patient/get-patient-details-by-id",
          { ids: patientIdsArray },
          headers,
          "patientServiceUrl"
        );
        patientDetailsMap = getPatientDetails?.data || {}; // Ensure fallback
      }

      // Fetch parent appointment details
      let appointmentDetailsMap = {};
      if (parentAppointmentIdArray.length) {
        const getAppointmentDetails = await httpService.postStaging(
          "appointment/all-appointments",
          { ids: parentAppointmentIdArray },
          headers,
          "doctorServiceUrl"
        );
        appointmentDetailsMap = getAppointmentDetails?.data?.appointmentDetails || {}; // Ensure fallback
      }

      const mergedData = totalAppointments.map(appt => {
        const patientId = appt.patientId?.toString();
        const parentAppointmentId = appt.parentAppointmentId?.toString();

        const patientInfo = patientDetailsMap[patientId] || null;
        const appointmentInfo = appointmentDetailsMap.find(data => data._id.toString() === parentAppointmentId.toString()) || null;

        return {
          ...appt,
          patientDetails: patientInfo,
          appointmentDetails: appointmentInfo,
        };
      });


      sendResponse(req, res, 200, {
        status: true,
        message: `Dashboard data fetched successfully`,
        body: mergedData,
        errorCode: null,
      });
    } catch (error) {
      console.log("Failed to get dashboard data", error);
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
    const {fromDate, toDate, type} = req.query
    
    let filter = { serviceType: type, labRadiologyId: mongoose.Types.ObjectId(req?.user?._id) }
    if(fromDate && toDate) {
      filter.consultationDate = { $gte: fromDate, $lte: toDate }
    }
    
    const pipeline = [
      {
        $match: {
          ...filter,
          status: { $in: ["CANCELLED", "UNDER_PROCESSED", "COMPLETED"] }
        }
      },
      {
        $group: {
          _id: { date: "$consultationDate", status: "$status" },
          count: { $sum: 1 },
        }
      },
      {
        $project: {
          _id: 0,
          consultationDate: "$_id.date",
          status: "$_id.status",
          count: 1
        }
      },
      {
        $sort: {
          consultationDate: -1
        }
      }
    ]
    const getAppointmentCounts = await Appointment.aggregate(pipeline);

    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);

    const allDates = [];
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      allDates.push(new Date(date).toISOString().split("T")[0]);
    }

    const statusCounts = {
      UNDER_PROCESSED: [],
      COMPLETED: [],
      CANCELLED: []
    };

    allDates.forEach(date => {
      ["UNDER_PROCESSED", "COMPLETED", "CANCELLED"].forEach(status => {
        const appointment = getAppointmentCounts.find(app => app.consultationDate === date && app.status === status);
        statusCounts[status].push({
          date: date,
          count: appointment ? appointment.count : 0
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
    console.log("Failed to get dashboard data", error);
    sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `failed to get dashboard data`,
        errorCode: "INTERNAL_SERVER_ERROR",
    });
  }
  }

  async getAllLabRadio(req, res) {
    try {
      const type = req.query.type;
      const getData = await PortalUser.find({ type, role: "INDIVIDUAL", isActive: true, isDeleted: false, verified: true })
                                      .select('centre_name')
      sendResponse(req, res, 200, {
          status: true,
          message: `Lab radio list fetched successfully`,
          body: getData,
          errorCode: null,
      });
    } catch (error) {
      console.log("Failed to get labradio list", error);
      sendResponse(req, res, 500, {
          status: false,
          body: error,
          message: `failed to get labradio list`,
          errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getLabRadioDetailsById(req, res) {
    try {
      const userIds = req.query.ids
      let idsArray = userIds
      if (typeof userIds === 'string') {
        idsArray = [userIds]
      }
      const getPortalData = await PortalUser.find({ _id: {$in: userIds} })
                                      .select('centre_name centre_name_arabic full_name full_name_arabic email country_code phone_number')
      return sendResponse(req, res, 200, {
          status: true,
          message: `Lab radio list fetched successfully`,
          body: getPortalData,
          errorCode: null,
      });
    } catch (error) {
      console.log("Failed to get labradio list", error);
      sendResponse(req, res, 500, {
          status: false,
          body: error,
          message: `failed to get labradio list`,
          errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async export_getDashboardLabRadiologyList(req, res) {
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };
      const {page, limit, fromDate, toDate, type, labRadioId, sort, status} = req.query
      let date_filter = {}
      if(fromDate && toDate) {
        const fromDateObj = new Date(`${fromDate} 00:00:00`);
        const toDateObj = new Date(`${toDate} 23:59:59`);
        date_filter = {
          createdAt: { $gte: fromDateObj, $lte: toDateObj }
        }
      }
      let status_filter = ["PENDING", "CANCELLED", "UNDER_PROCESSED", "APPROVED", "COMPLETED"]
      if (status && status != 'ALL') {
        status_filter = [status]
      }
      let id_filter = {};
if (labRadioId && labRadioId !== "null" && mongoose.isValidObjectId(labRadioId)) {
  id_filter = {
    labRadiologyId: new mongoose.Types.ObjectId(labRadioId)
  };
}
      const pipeline = [
        {
          $lookup: {
            from: "portalusers",
            localField: "labRadiologyId",
            foreignField: "_id",
            as: "portalusers",
          },
        },
        {
          $unwind: {
            path: "$portalusers",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            centre_name: "$portalusers.centre_name",
            type: "$portalusers.type",
          },
        },
        {
          $lookup: {
            from: "locationinfos",
            localField: "portalusers._id",
            foreignField: "for_portal_user",
            as: "locationinfos",
          },
        },
        {
          $unwind: {
            path: "$locationinfos",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            centreLocation: "$locationinfos.address",
          },
        },
        {
            $match: {
                serviceType: type,
                status: { $in: status_filter },
                $and: [
                  date_filter,
                  id_filter
                ]
            }
        },
      ]
      pipeline.push({
        $group: {
              _id: "$_id",
              appointmentId: { $first: "$appointment_id" },
              createdAt: { $first: "$createdAt" },
              updatedAt: { $first: "$updatedAt" },
              patientId: { $first: "$patientId" },
              doctorId: { $first: "$doctorId" },
              consultationDate: { $first: "$consultationDate" },
              consultationTime: { $first: "$consultationTime" },
              status: { $first: "$status" },
              centreName: { $first: "$centre_name" },
              labTestName: { $push: "$labTestName" },
              radiologyTestName: { $push: "$radiologyTestName" },
              type: { $first: "$type" },
              centreLocation: { $first: "$centreLocation" },
        }
      },)
      let sortKey = 'createdAt'
      let sortValue = -1
      if (sort) {
        sortKey = sort.split(':')[0]
        sortValue = sort.split(':')[1]
      }
 
      pipeline.push(
        { $sort:
          {
            [sortKey]: Number(sortValue)
          }
        },
        {
          $facet: {
          totalCount: [
              {
                  $count: 'count'
              }
          ],
          paginatedResults: limit != 0 ? [
              { $skip: (page - 1) * limit },
              { $limit: limit * 1 },
            ] : [
              { $skip: 0 },
            ],
          }
        }
      )
      const result = await Appointment.aggregate(pipeline);
      const statuses = {
        PENDING: 'Pending',
        CANCELLED: 'Cancelled',
        APPROVED: 'Approved',
        UNDER_PROCESSED: 'Under Process',
        COMPLETED: 'Completed',
        MISSED: 'Missed'
      }
      const paginatedResults = result[0].paginatedResults
      const patientDetails = getAllPatient(paginatedResults)
      const doctorDetails = getAllDoctor(paginatedResults, headers)
      const promisesResult = await Promise.all([patientDetails,doctorDetails])
      
      for (let index = 0; index < paginatedResults.length; index++) {
        paginatedResults[index].patientName = promisesResult[0][paginatedResults[index].patientId.toString()]?.full_name
        paginatedResults[index].patientProfile = promisesResult[0][paginatedResults[index].patientId.toString()]?.profile_pic
        paginatedResults[index].doctorName = promisesResult[1][paginatedResults[index].doctorId.toString()]?.full_name
        paginatedResults[index].doctorNameArabic = promisesResult[1][paginatedResults[index].doctorId.toString()]?.full_name_arabic
        paginatedResults[index].doctorProfile = promisesResult[1][paginatedResults[index].doctorId.toString()]?.profilePicture
        paginatedResults[index].status = statuses[paginatedResults[index].status]
      }
 
      let totalCount = 0
      if (result[0].totalCount.length > 0) {
        totalCount = result[0].totalCount[0].count
      }
      let modifyArray = result[0]?.paginatedResults.map(obj => ({
        patientName: obj.patientName,
        centreName:obj.centreName,
        centreLocation:obj.centreLocation,
        status:obj.status,
        appointmentDate_time: `${obj.consultationDate} ${obj.consultationTime}`,
        doctorName:obj.doctorName,
        appointmentId: obj.appointmentId,
        completeDate_time: obj.updatedAt
        
      }));
      // Convert to array of arrays if needed
      let array = modifyArray.map(obj => Object.values(obj));
 
      sendResponse(req, res, 200, {
        status: true,
        message: `Data fetched successfully`,
        data: {
          totalRecords: totalCount,
          currentPage: page,
          totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
          data: result[0]?.paginatedResults,
          array
        },
        errorCode: null,
      });
    } catch (error) {
      console.log("Failed to get dashboard data", error);
      sendResponse(req, res, 500, {
          status: false,
          body: error,
          message: `failed to get dashboard data`,
          errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getSignedUrl(req, res) {
    try {     
      if (!req?.body?.path) {
        return sendResponse(req, res, 200, {
          status: false,
          message: "Path not added.",
          data: null,
          errorCode: null,
        });
      }
      const key = await generateSignedUrl(req?.body?.path)
      if(key){
        sendResponse(req, res, 200, {
          status: true,
          data: key,
          message: `getting signed url`,
          errorCode: null,
        });
      }
    } catch (err) {
      console.log("Error getting signed url", err);
      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to generate signed url`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  
}

export const getData = async (data) => {
  let result = {
    statusData: "", // You can set an appropriate default value here
    data1: null,
  };

  for (const data1 of data?.data) {
    let d = new Date();
    let g1 = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    let g2 = new Date(data1?.expiry_date);

    if (g1.getTime() < g2.getTime()) {
      result.statusData = "active";
      result.data1 = data1;
      break;
    }
  }
  return result;
};

module.exports = {
  labradio: new LabRadiology(),
};
