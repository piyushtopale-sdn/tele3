"use strict";
import bcrypt from "bcrypt";

// models
import PortalUser from "../models/portal_user";
import ProfileInfo from "../models/profile_info";
import Counter from "../models/counter";
import Location_info from "../models/location_info";
import Notification from "../models/notification";
import Assessment from "../models/assessment.model";
import Otp2fa from "../models/otp2fa";
import ForgotPasswordToken from "../models/forgot_password_token";
import ProfilePermission from "../models/profile_permission";
import { sendResponse } from "../helpers/transmission";
const Http = require("../helpers/httpservice");
import { sendEmail } from "../helpers/ses";
import Vital_info from "../models/vital_info";
import PatientVital from "../models/patient_vitals";
import Medicine_info from "../models/medicine_info";
import Immunization_info from "../models/immunization_info";
import LifestyleTypeList from "../models/lifestyle_type_list";
import FamilyHistoryTypeList from "../models/family_history_type_list";
import History_info from "../models/history_info";
import Medical_document from "../models/medical_document";
import Family_info from "../models/family_info";
import {
  bcryptCompare,
  generate4DigitOTP,
  generateRefreshToken,
  generateTenSaltHash,
  generateToken,
  processExcel,
  smsTemplateOTP,
  validateEmail,
} from "../middleware/utils";
import {
  verifyEmail2fa,
  forgotPasswordEmail,
  sendMailInvitations,
} from "../helpers/emailTemplate";
import crypto from "crypto";
import { ImmunizationColumns, config, messages } from "../config/constants";
import mongoose from "mongoose";
import Invitation from "../models/email_invitation";
import ImmunizationList from "../models/immunization_list";
import { sendSms } from "../middleware/sendSms";
import {
  deleteGCSFile,
  generateSignedUrl,
  uploadSingleOrMultipleDocuments,
} from "../helpers/gcs";
import purchasehistory from "../models/subscription/purchasehistory";
import { formatString } from "../helpers/string";
const httpService = new Http();
const fs = require("fs");
const { NODE_ENV } = config;

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
const checkPassword = async (password, user) => {
  const isMatch = await bcrypt.compare(password, user.password);
  return isMatch;
};
const permissionBasedResult = async (permissionIdArray, totalResultArray) => {
  let final_result = [];
  if (permissionIdArray?.length > 0) {
    for (let index = 0; index < permissionIdArray.length; index++) {
      const permission_id = permissionIdArray[index];
      for (let index = 0; index < totalResultArray.length; index++) {
        const element = totalResultArray[index]._id;
        if (permission_id == element) {
          final_result.push(totalResultArray[index]);
        }
      }
    }
  }
  return final_result;
};
const getFieldName = (fieldName) => {
  let nameArray = fieldName.split("_");
  if (nameArray.length == 1) {
    return nameArray[0].charAt(0).toUpperCase() + nameArray[0].slice(1);
  } else {
    const firstWord =
      nameArray[0].charAt(0).toUpperCase() + nameArray[0].slice(1);
    nameArray.shift();
    nameArray.unshift(firstWord);
    return nameArray.join(" ");
  }
};


const dataBaseUpdate = async () => {
  try {
    return await purchasehistory.updateMany(
      { transactionType: "subscription" },
      [
        {
          $set: {
            planPrice: { $toString: { $divide: [{ $toDouble: "$planPrice" }, 100] } },
            amountPaid: { $toString: { $divide: [{ $toDouble: "$amountPaid" }, 100] } },
            discountedAmount: { $toString: { $divide: [{ $toDouble: "$discountedAmount" }, 100] } },

          },
        },
      ]
    );

  } catch (error) {
    console.error("Error updating records:", error.message);
  }
};

const storeMedicalDocuments = (fileKey, req) => {
  return new Promise(async (resolve, reject) => {
    try {
      const {
        parentPatientId,
        patientId,
        documentName,
        expiryDate,
        issueDate,
        documentsOf,
      } = req.body;
      const addObj = {
        parentPatientId,
        patientId,
        documentName,
        expiryDate,
        issueDate,
        documentsOf,
        fileKey,
        addedBy: req?.user?.portalUserId,
      };
      const addData = new Medical_document(addObj);
      await addData.save();
      resolve(true);
    } catch (error) {
      console.error("An error occurred:", error);
      resolve(false);
    }
  });
};
const calculateHbA1c = (patientId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      // Fetch blood glucose readings for the past three months
      const readings = await PatientVital.find({
        for_portal_user: patientId,
        createdAt: { $gte: threeMonthsAgo },
        is_deleted: false,
      }).select("blood_glucose");

      // Calculate average blood glucose
      const bloodGlucoseData = readings.filter((val) => val?.blood_glucose);
      if (bloodGlucoseData.length > 0) {
        const totalGlucose = bloodGlucoseData.reduce(
          (sum, reading) =>
            reading?.blood_glucose
              ? sum + parseFloat(reading.blood_glucose.value)
              : sum,
          0
        );
        const averageBloodGlucose = totalGlucose / bloodGlucoseData.length;

        // Calculate HbA1c using the formula
        const hbA1c = ((averageBloodGlucose + 46.7) / 28.7).toFixed(2);
        resolve({
          averageBloodGlucose: averageBloodGlucose.toFixed(2),
          hbA1c,
        });
      } else {
        resolve({
          averageBloodGlucose: 0,
          hbA1c: 0,
        });
      }
    } catch (error) {
      console.error("An error occurred:", error);
      resolve({
        averageBloodGlucose: 0,
        hbA1c: 0,
      });
    }
  });
};
const generateUniqueMRN = async () => {
  let mrnNumberStart = "0000001";

  let sequenceDocument = await Counter.findOneAndUpdate(
    { _id: "mrn_number" },
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  let generatedMRN = (
    parseInt(mrnNumberStart) +
    sequenceDocument.sequence_value -
    1
  )
    .toString()
    .padStart(7, "0");

  let isDuplicate = await ProfileInfo.findOne({ mrn_number: generatedMRN });

  if (isDuplicate) {
    return generateUniqueMRN();
  }
  return generatedMRN;
};

const generateNotificationMessage = (
  type,
  content,
  patientName,
  doctorName
) => {
  let message = "";
  switch (type) {
    case "WAITING_PATIENT":
      message = content
        .replace(/{{patient_name}}/g, patientName)
        .replace(/{{doctor_name}}/g, doctorName);
      break;
    default:
      message = content; // Fallback in case the type doesn't match
      break;
  }

  return message;
};

const saveNotification = (paramsData, headers, requestData) => {
  return new Promise(async (resolve, reject) => {
    try {
      let endPoint = "";
      let serviceUrl = "";
      if (paramsData?.sendTo == "patient") {
        endPoint = "patient/notification";
        serviceUrl = "patientServiceUrl";
      }
      if (paramsData?.sendTo == "doctor") {
        endPoint = "doctor2/notification";
        serviceUrl = "doctorServiceUrl";
      }
      if (endPoint && serviceUrl) {
        await httpService.postStaging(
          endPoint,
          requestData,
          headers,
          serviceUrl
        );
      }
      resolve(true);
    } catch (error) {
      console.error("An error occurred:", error);
      resolve(false);
    }
  });
};
function convertToTimeZone(timeString) {
  if (!timeString || timeString === "N/A") return "N/A";

 
  const [hours, minutes, seconds] = timeString.split(":").map(Number);
  
  const date = new Date(Date.UTC(2025, 1, 26, hours, minutes, seconds)); 

  return date.toLocaleTimeString("en-US", {
    timeZone: config.TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false, 
  });
}

class Patient {
  async signup(req, res) {
    try {
      const {
        first_name,
        last_name,
        first_name_arabic,
        last_name_arabic,
        email,
        country_code,
        mobile,
        gender,
        dob,
        blood_group,
        marital_status,
        identityCard,
        saudi_id,
        iqama_number,
        passport,
        profile_pic,
        address,
        emergency_contact,
        nationality,
        isDependent,
      } = req.body;
      let userFind = await PortalUser.findOne({ mobile, isDeleted: false });
      if (userFind) {
        return sendResponse(req, res, 200, {
          status: false,
          body: userFind,
          message:
            "This mobile number is already registered. Please use a different mobile number.",
          errorCode: null,
        });
      }
      let sequenceDocument = await Counter.findOneAndUpdate(
        { _id: "countid" },
        { $inc: { sequence_value: 1 } },
        { new: true }
      );
      let portalUserDetails = new PortalUser({
        email,
        userId: sequenceDocument.sequence_value,
        country_code,
        mobile,
        full_name: formatString(first_name + " " + last_name),
        full_name_arabic:
          first_name_arabic || last_name_arabic
            ? formatString(first_name_arabic + " " + last_name_arabic)
            : "",
        isDependent: isDependent ? isDependent : false,
      });

      let portalUserData = await portalUserDetails.save();
      //Add address field if available
      let locationId;
      if (address) {
        const addLocationData = new Location_info({
          address,
          for_portal_user: portalUserData._id,
        });
        const savedData = await addLocationData.save();
        locationId = savedData?._id;
      }

      let mrnNumber = await generateUniqueMRN();
      let profile = new ProfileInfo({
        full_name: formatString(first_name + " " + last_name),
        full_name_arabic:
          first_name_arabic || last_name_arabic
            ? formatString(first_name_arabic + " " + last_name_arabic)
            : "",
        first_name,
        last_name,
        first_name_arabic,
        last_name_arabic,
        gender,
        dob,
        blood_group,
        marital_status,
        identityCard,
        saudi_id,
        iqama_number,
        passport,
        mrn_number: mrnNumber,
        profile_pic,
        emergency_contact,
        // nationality: nationality_val? nationality_val: "", // Client Suggested changes
        nationality,
        in_location: locationId,
        for_portal_user: portalUserData._id,
      });
      let profileData = await profile.save();

      return sendResponse(req, res, 200, {
        status: true,
        message: messages.signup_success.en,
        messageArabic: messages.signup_success.ar,
        body: {
          portalUserData,
          profileData,
        },
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        message: "Failed to Create Patient",
        body: error,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async login(req, res) {
    try {
      const { mobile, country_code } = req.body;
      const { uuid } = req.headers;
      const portalUserData = await PortalUser.findOne({
        mobile,
        country_code,
        isDeleted: false,
        $or: [{ isDependent: false }, { isDependent: { $exists: false } }],
      }).lean();
   
      if (!portalUserData) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "User not found",
          errorCode: "USER_NOT_FOUND",
        });
      }

      if (portalUserData.lock_user === true) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "User account temporarily locked.",
          errorCode: "USER_LOCKED",
        });
      }

      if (portalUserData.isDeleted === true) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "User Deleted",
          errorCode: "USER_DELETED",
        });
      }

      const profileData1 = await ProfileInfo.aggregate([
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
        },
      ]);
      let profileData = {};
      if (profileData1.length > 0) {
        profileData = profileData1[0];
      }

      const deviceExist = await Otp2fa.findOne({
        uuid,
        for_portal_user: portalUserData._id,
        verified: true,
      }).lean();

      if (!deviceExist || portalUserData.verified !== true) {
        return sendResponse(req, res, 200, {
          status: true,
          body: {
            otp_verified: false,
            token: null,
            refreshToken: null,
            user_details: {
              portalUserData,
              profileData,
            },
          },
          message: "OTP verification pending 2fa",
          errorCode: "VERIFICATION_PENDING",
        });
      }
      const tokenData = {
        portalUserId: portalUserData._id,
        uuid,
        role: "patient",
      };
      profileData.profile_pic_signed_url = await generateSignedUrl(
        profileData?.profile_pic
      );

      if (req.body.fcmToken != "" || req.body.fcmToken != undefined) {
        
        const fcmToken = req.body.fcmToken;
          // Step 1: Remove the token from ALL users where it exists
         await PortalUser.updateMany(
           { deviceToken: fcmToken }, // any user where the array contains this token
           { $pull: { deviceToken: fcmToken } }
         );

        // Step 2: Add it to the current user (replace or add as single-element array)
        await PortalUser.findByIdAndUpdate(
          portalUserData._id,
          { $set: { deviceToken: [fcmToken] } },
          { new: true }
        );
      }

      //Save audit logs
      await httpService.postStaging(
        "superadmin/add-logs",
        {
          userId: portalUserData?._id,
          userName: profileData?.full_name,
          role: "patient",
          action: `login`,
          actionDescription: `Login: Patient ${profileData?.full_name} login successfully.`,
        },
        {},
        "superadminServiceUrl"
      );

      return sendResponse(req, res, 200, {
        status: true,
        body: {
          otp_verified: true,
          token: generateToken(tokenData),
          refreshToken: generateRefreshToken(tokenData),
          user_details: {
            portalUserData,
            profileData,
          },
        },
        message: "Patient Login Successful",
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
  async logout(req, res) {
    try {
      const { mobile } = req.body;
      const portalUserData = await PortalUser.findOne({ mobile }).lean();
      const getPatientName = await ProfileInfo.findOne({
        for_portal_user: { $eq: portalUserData._id },
      }).select("full_name");

      //Save audit logs
      await httpService.postStaging(
        "superadmin/add-logs",
        {
          userId: portalUserData?._id,
          userName: getPatientName?.full_name,
          role: "patient",
          action: `logout`,
          actionDescription: `Logout: Patient ${getPatientName?.full_name} logout successfully.`,
        },
        {},
        "superadminServiceUrl"
      );

      return sendResponse(req, res, 200, {
        status: true,
        body: {
          otp_verified: true,
          token: generateToken(tokenData),
          refreshToken: generateRefreshToken(tokenData),
          user_details: {
            portalUserData,
            profileData,
          },
        },
        message: "Patient Login Successful",
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

  async sendEmailOtpFor2fa(req, res) {
    try {
      const { email, userId } = req.body;
      const { uuid } = req.headers;

      const portalUserData = await PortalUser.findOne({
        _id: userId,
        email,
      }).lean();

      const deviceExist = await Otp2fa.findOne({
        uuid,
        email,
        for_portal_user: userId,
      }).lean();
      if (!portalUserData) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "User not found",
          errorCode: "USER_NOT_FOUND",
        });
      }

      if (deviceExist && deviceExist.send_attempts >= 500000) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "Maximum attempt exceeded",
          errorCode: "MAX ATTEMPT_EXCEEDED",
        });
      }
      const otp = generate4DigitOTP();
      const content = verifyEmail2fa(email, otp);
      sendEmail(content);
      let result = null;
      if (deviceExist) {
        result = await Otp2fa.findOneAndUpdate(
          { uuid, email },
          {
            $set: {
              otp,
              send_attempts: deviceExist.send_attempts + 1,
            },
          }
        ).exec();
      } else {
        const otpData = new Otp2fa({
          email,
          otp,
          uuid,
          for_portal_user: portalUserData._id,
          send_attempts: 1,
        });
        result = await otpData.save();
      }
      return sendResponse(req, res, 200, {
        status: true,
        body: {
          id: result._id,
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

  async sendSmsOtpFor2fa(req, res) {
    try {
      const { mobile, country_code } = req.body;
      const { uuid } = req.headers;
      const headers = {
        Authorization: req.headers["authorization"],
      };
      const portalUserData = await PortalUser.findOne({
        mobile,
        country_code,
        isDeleted: false,
      }).lean();
      if (!portalUserData) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "User does not exist.",
          errorCode: "USER_NOT_EXIST",
        });
      }
      const deviceExist = await Otp2fa.findOne({
        mobile,
        country_code,
        uuid,
        verified: false,
        for_portal_user: portalUserData._id
      }).lean();
      if (deviceExist && deviceExist.send_attempts >= 500000) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "Maximum attempt exceeded",
          errorCode: "MAX ATTEMPT_EXCEEDED",
        });
      }
      let otp;

      if (process.env.NODE_ENV === "production") {
        otp = generate4DigitOTP();
      } else {
        if (mobile && mobile.length === 10) {
          otp = 1111;
        } else {
          otp = generate4DigitOTP();
        }
      }
      const getSMSContent = await httpService.getStaging(
        "superadmin/get-notification-by-condition",
        { condition: "LOGIN_OTP", type: "sms" },
        headers,
        "superadminServiceUrl"
      );
      let otpText;
      if (getSMSContent?.status && getSMSContent?.data?.length > 0) {
        otpText = getSMSContent?.data[0]?.content.replace(/{{otp}}/g, otp);
      } else {
        otpText = smsTemplateOTP(otp);
      }
      await sendSms(country_code + mobile, otpText);
      let result = null;
      if (deviceExist) {
        result = await Otp2fa.findOneAndUpdate(
          { mobile, country_code, uuid, verified: false, for_portal_user: portalUserData._id  },
          {
            $set: {
              otp,
              send_attempts: deviceExist.send_attempts + 1,
            },
          }
        ).exec();
      } else {
        const otpData = new Otp2fa({
          mobile,
          otp,
          country_code,
          uuid,
          for_portal_user: portalUserData._id,
          send_attempts: 1,
        });
        result = await otpData.save();
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
      //     message: "can't sent sms",
      //     errorCode: null,
      //   });
      // }
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

  async matchEmailOtpFor2fa(req, res) {
    try {
      const { email, otp, userId } = req.body;

      const { uuid } = req.headers;

      const data = await Otp2fa.findOne({
        uuid,
        email,
        for_portal_user: userId,
      });

      if (data) {
        const portalUserData = await PortalUser.findOne({
          email: email,
          _id: userId,
        }).lean();
        if (!portalUserData) {
          return sendResponse(req, res, 422, {
            status: false,
            body: null,
            message: "User does not exist.",
            errorCode: null,
          });
        }
        if (data.otp == otp) {
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
            { uuid, email, for_portal_user: userId },
            {
              $set: {
                verified: true,
              },
            },
            { new: true }
          ).exec();

          const checkForPersonalDetails = await ProfileInfo.findOne({
            for_portal_user: portalUserData._id,
          });
          checkForPersonalDetails.profile_pic = "";

          return sendResponse(req, res, 200, {
            status: true,
            body: {
              id: updateVerified._id,
              uuid: updateVerifiedUUID._id,
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
          message: "OTP expired",
          errorCode: null,
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

  async matchSmsOtpFor2fa(req, res) {
    try {
      const { otp, mobile } = req.body;
      const { uuid } = req.headers;
      const portalUserData = await PortalUser.findOne({
        mobile: mobile,
        isDeleted: false,
      }).lean();
      if (!portalUserData) {
        return sendResponse(req, res, 422, {
          status: false,
          body: null,
          message: "User does not exist.",
          errorCode: null,
        });
      }
      const otpResult = await Otp2fa.findOne({
        uuid,
        mobile,
        for_portal_user: portalUserData._id,
        verified: false,
      });
      if (otpResult) {
        if (otpResult.otp == otp) {
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
            { uuid, mobile, verified: false, for_portal_user: portalUserData._id },
            {
              $set: {
                verified: true,
              },
            },
            { new: true }
          ).exec();

          const checkForPersonalDetails = await ProfileInfo.findOne({
            for_portal_user: portalUserData._id,
          });
          checkForPersonalDetails.profile_pic = "";

          return sendResponse(req, res, 200, {
            status: true,
            body: {
              id: updateVerified._id,
              uuid: updateVerifiedUUID._id,
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
          message: "User not found",
          errorCode: "USER_NOT_FOUND",
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

  async personalDetails(req, res) {
    try {
      const {
        profile_pic,
        patient_id,
        email,
        first_name,
        last_name,
        first_name_arabic,
        last_name_arabic,
        gender,
        dob,
        blood_group,
        marital_status,
        emergency_contact,
        address,
        saudi_id,
        iqama_number,
        passport,
        mrn_number,
        nationality,
        notification,
        // mobile,
        // country_code
      } = req.body;

      if (email) {
        const isValidEmail = validateEmail(email);
        if (!isValidEmail && NODE_ENV == "production") {
          return sendResponse(req, res, 200, {
            status: false,
            message: `Please use a valid email address! Disposable email not allowed.`,
            data: null,
            errorCode: null,
          });
        }
      }

      let jsonDataUser = {};

      if (email !== undefined) jsonDataUser.email = email;
      if (first_name && last_name) jsonDataUser.full_name = `${first_name} ${last_name}`;
      if (first_name_arabic && last_name_arabic) jsonDataUser.full_name_arabic = `${first_name_arabic} ${last_name_arabic}`;
      if (notification !== undefined) jsonDataUser.notification = notification;

      await PortalUser.findOneAndUpdate(
        { _id: patient_id },
        {
          $set: jsonDataUser,
        }
      ).exec();

      const findLocation = await Location_info.findOne({
        for_portal_user: patient_id,
      });
      let locationData;
      if (!findLocation) {
        const locationDetails = new Location_info({
          address,
          for_portal_user: patient_id,
        });
        locationData = await locationDetails.save();
      } else {
        await Location_info.findOneAndUpdate(
          { for_portal_user: patient_id },
          {
            $set: {
              address,
            },
          },
          { new: true }
        ).exec();
      }
      let updateObject = {
        full_name: first_name + " " + last_name,
        full_name_arabic: first_name_arabic + " " + last_name_arabic,
        profile_pic,
        first_name,
        last_name,
        first_name_arabic,
        last_name_arabic,
        gender,
        dob,
        blood_group,
        marital_status,
        emergency_contact,
        saudi_id,
        iqama_number,
        passport,
        mrn_number,
        nationality,
      };
      if (locationData) {
        updateObject.in_location = locationData._id;
      }
      await ProfileInfo.findOneAndUpdate(
        { for_portal_user: patient_id },
        {
          $set: updateObject,
        },
        { new: true }
      ).exec();

      return sendResponse(req, res, 200, {
        status: true,
        body: null,
        message: messages.profileUpdated.en,
        messageArabic: messages.profileUpdated.ar,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: { error },
        message: "failed to create  personal details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async addVitals(req, res) {
    try {
      const {
        appointment_id,
        patient_id,
        vitals_data,
        role,
        added_by,
        is_manual,
      } = req.body;

      const vitalsArray = vitals_data.map((v) => {
        return {
          ...v,
          for_portal_user: patient_id,
          added_by,
          role,
          is_manual,
          appointment_id: appointment_id ? appointment_id : undefined,
        };
      });
      await Vital_info.insertMany(vitalsArray);

      return sendResponse(req, res, 200, {
        status: true,
        message: "Vital Details Saved Successfully",
        body: null,
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to saved vital details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async deleteVitals(req, res) {
    try {
      const vitalId = req.params.id;

      await Vital_info.findOneAndUpdate(
        { _id: { $eq: vitalId } },
        {
          $set: {
            is_deleted: true,
          },
        }
      );

      return sendResponse(req, res, 200, {
        status: true,
        message: "vital details deleted successfully",
        body: null,
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to delete vital details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async addPatientVitals(req, res) {
    try {
      const {
        appointment_id,
        patient_id,
        vitals_data,
        role,
        added_by,
        is_manual,
      } = req.body;
      // Check for duplicates and insert only new entries
      const startDatesMap = {}; // Map to track startDate for each type
      const keys = Object.keys(vitals_data[0]); // Extract keys (e.g., height, weight)
      // Create a batch query to fetch all existing records for the patient
      const queryConditions = keys.map((key) => ({
        [`${key}.startDate`]: {
          $in: vitals_data.map((vital) => vital[key]?.startDate),
        },
        for_portal_user: patient_id,
      }));

      // Fetch all existing records in one query
      const existingRecords = await PatientVital.find({ $or: queryConditions });

      // Build a lookup for existing records
      for (const record of existingRecords) {
        for (const key of keys) {
          if (record[key]?.startDate) {
            startDatesMap[`${key}_${record[key].startDate}`] = true;
          }
        }
      }

      // Filter vitals_data based on the lookup
      const filteredVitals = vitals_data
        .map((vital) => {
          const obj = {};
          for (const key of keys) {
            const startDateKey = `${key}_${vital[key]?.startDate}`;
            if (vital[key]?.startDate && !startDatesMap[startDateKey]) {
              obj[key] = vital[key];
              startDatesMap[startDateKey] = true; // Avoid duplicate processing
            }
          }
          if (Object.keys(obj).length > 0) {
            obj.for_portal_user = patient_id;
            obj.added_by = added_by;
            obj.role = role;
            obj.is_manual = is_manual;
            obj.appointment_id = appointment_id || undefined;
          }
          return Object.keys(obj).length > 0 ? obj : null;
        })
        .filter(Boolean); // Remove null entries
      // console.log(filteredVitals,"filteredVitals")
      // Insert filtered vitals
      let message = "No new vitals to insert.";
      if (filteredVitals.length > 0) {
        await PatientVital.insertMany(filteredVitals);
        message = "Vital details added successfully.";
      }

      return sendResponse(req, res, 200, {
        status: true,
        message,
        body: null,
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to add vital details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async editPatientVitals(req, res) {
    try {
      const { id, vitals_data } = req.body;
      const getData = await PatientVital.findById(id);
      if (!getData) {
        return sendResponse(req, res, 200, {
          status: false,
          message: "Vital records not found",
          body: null,
          errorCode: null,
        });
      }
      await PatientVital.findOneAndUpdate(
        { _id: id },
        { $set: { ...vitals_data } }
      );
      return sendResponse(req, res, 200, {
        status: true,
        message: "Vital details updated successfully",
        body: null,
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to add vital details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async deletePatientVitals(req, res) {
    try {
      const vitalId = req.params.id;

      const getData = await PatientVital.findById(vitalId);
      if (!getData) {
        return sendResponse(req, res, 200, {
          status: false,
          message: "Vital records not found",
          body: null,
          errorCode: null,
        });
      }

      await PatientVital.findOneAndUpdate(
        { _id: { $eq: vitalId } },
        {
          $set: {
            is_deleted: true,
          },
        }
      );

      return sendResponse(req, res, 200, {
        status: true,
        message: "Vital records deleted successfully",
        body: null,
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to delete vital details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async getPatientVitals(req, res) {
    const {
      patientId,
      appointmentId,
      fromDate,
      toDate,
      limit,
      page,
      isCompare,
    } = req.query;
    try {
      let date_filter = {};
      let appointment_filter = {};
      let vital_filter = { is_deleted: false };

      if (appointmentId) {
        appointment_filter = {
          appointment_id: mongoose.Types.ObjectId(appointmentId),
        };
      }

      if (isCompare && fromDate && toDate) {
        const fromDateObj = new Date(fromDate);
        const toDateObj = new Date(toDate);
        date_filter = {
          createdAt: { $in: [fromDateObj, toDateObj] },
        };
      } else if (fromDate && toDate) {
        const fromDateObj = new Date(`${fromDate} 00:00:00`);
        const toDateObj = new Date(`${toDate} 23:59:59`);
        date_filter = {
          createdAt: { $gte: fromDateObj, $lte: toDateObj },
        };
      } else if (fromDate) {
        const fromDateObj = new Date(`${fromDate} 00:00:00`);
        const toDateObj = new Date(`${fromDate} 23:59:59`);
        date_filter = {
          createdAt: { $gte: fromDateObj, $lte: toDateObj },
        };
      }

      const pipeline = [
        {
          $match: {
            for_portal_user: mongoose.Types.ObjectId(patientId),
            $and: [date_filter, appointment_filter, vital_filter],
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $facet: {
            averages: [
              {
                $group: {
                  _id: null,
                  averageHeartRate: { $avg: { $toDouble: "$h_rate.value" } },
                  averageBMI: { $avg: { $toDouble: "$bmi.value" } },
                  averageBpSystolic: {
                    $avg: { $toDouble: "$bp_systolic.value" },
                  },
                  averageBpDiastolic: {
                    $avg: { $toDouble: "$bp_diastolic.value" },
                  },
                  averagePulse: { $avg: { $toDouble: "$pulse.value" } },
                  averageTemperature: { $avg: { $toDouble: "$temp.value" } },
                  averageBloodGlucose: {
                    $avg: { $toDouble: "$blood_glucose.value" },
                  },
                  totalCount: { $sum: 1 },
                },
              },
            ],
            totalCount: [
              {
                $count: "count",
              },
            ],
            paginatedResults:
              limit && page
                ? [{ $skip: (page - 1) * limit }, { $limit: limit * 1 }]
                : [],
          },
        },
      ];

      const result = await PatientVital.aggregate(pipeline);
      let totalCount = 0;
      if (
        result[0] &&
        result[0].totalCount &&
        result[0].totalCount.length > 0
      ) {
        totalCount = result[0].totalCount[0].count;
      }
      const averageBloodGlucose = await calculateHbA1c(patientId);
      return sendResponse(req, res, 200, {
        status: true,
        data: {
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
          totalRecords: totalCount,
          result: result[0] ? result[0].paginatedResults : [],
          average: result[0] ? result[0].averages : [],
          averageBloodGlucose,
        },
        message: `Successfully fetched vitals list`,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        data: error,
        message: `Failed to fetch list`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getPatientVitalsForGraph(req, res) {
    const { patientId, limit, page, type } = req.query;
    try {
      let vital_filter = { is_deleted: false };

      const pipeline = [
        {
          $match: {
            for_portal_user: mongoose.Types.ObjectId(patientId),
            [`${type}.value`]: { $exists: true },
            $and: [vital_filter],
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $facet: {
            totalCount: [
              {
                $count: "count",
              },
            ],
            paginatedResults:
              limit && page
                ? [{ $skip: (page - 1) * limit }, { $limit: limit * 1 }]
                : [],
          },
        },
      ];

      const result = await PatientVital.aggregate(pipeline);
      let totalCount = 0;
      if (
        result[0] &&
        result[0].totalCount &&
        result[0].totalCount.length > 0
      ) {
        totalCount = result[0].totalCount[0].count;
      }
      return sendResponse(req, res, 200, {
        status: true,
        data: {
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
          totalRecords: totalCount,
          result: result[0] ? result[0].paginatedResults : [],
        },
        message: `Successfully fetched vitals list`,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        data: error,
        message: `Failed to fetch list`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async medicineDetails(req, res) {
    try {
      const { patient_id, current_medicines, past_medicines } = req.body;
      const medicine = await Medicine_info.findOne({
        for_portal_user: patient_id,
      });
      if (medicine) {
        const medicineData = await Medicine_info.findOneAndUpdate(
          { for_portal_user: patient_id },
          {
            $set: {
              current_medicines,
              past_medicines,
            },
          },
          { new: true }
        ).exec();
        return sendResponse(req, res, 200, {
          status: true,
          body: {
            medicineData,
          },
          message: "medicine details updated successfully",
          errorCode: null,
        });
      } else {
        const medicineDetails = new Medicine_info({
          current_medicines,
          past_medicines,
          for_portal_user: patient_id,
        });
        const medicineData = await medicineDetails.save();
        await ProfileInfo.findOneAndUpdate(
          { for_portal_user: patient_id },
          {
            $set: {
              in_medicine: medicineData._id,
            },
          },
          { new: true }
        ).exec();
        return sendResponse(req, res, 200, {
          status: true,
          body: {
            medicineData,
          },
          message: "medicine details added successfully",
          errorCode: null,
        });
      }
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: { error },
        message: "failed to added medicine details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async immunizationDetails(req, res) {
    try {
      const { patient_id, immunization, doctor_id } = req.body;
      if (patient_id || !patient_id) {
        if (doctor_id === undefined) {
          let insert_List = [];
          immunization.map(async (singleData) => {
            if (!singleData._id && singleData._id == "") {
              delete singleData._id;
              insert_List.push({
                ...singleData,
                added_by: "patient",
                added_by_id: patient_id,
                for_portal_user: patient_id,
              });
            } else {
              let existingData = singleData._id;
              delete singleData._id;
              await Immunization_info.findOneAndUpdate(
                { _id: existingData },
                {
                  $set: {
                    ...singleData,
                  },
                }
              );
            }
          });

         await Immunization_info.insertMany(insert_List);

          const resultAll = await Immunization_info.find({
            for_portal_user: mongoose.Types.ObjectId(patient_id),
          });

          return sendResponse(req, res, 200, {
            status: true,
            body: resultAll,
            message: "immunization details added successfully",
            errorCode: null,
          });
        } else {
          let reqData = [];
          immunization.map(async (singleData) => {
            if (!singleData._id && singleData._id == "") {
              delete singleData._id;
              reqData.push({
                ...singleData,
                added_by: "doctor",
                added_by_id: doctor_id,
                for_portal_user: patient_id,
              });
            }
          });
          const result = await Immunization_info.insertMany(reqData);
          return sendResponse(req, res, 200, {
            status: true,
            body: result,
            message: "immunization details added successfully",
            errorCode: null,
          });
        }
      }
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: { error },
        message: "failed to add immunization details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async editImmunization(req, res) {
    try {
      const { patient_id, immunization, doctor_id } = req.body;
      if (patient_id || !patient_id) {
        if (doctor_id === undefined) {
          // if doctor_id not exist
          const immunizationDetails = await Immunization_info.findOne({
            added_by: "patient",
            added_by_id: patient_id,
            for_portal_user: patient_id,
            _id: immunization._id,
          });
          const result = await Immunization_info.findOneAndUpdate(
            { _id: immunizationDetails._id },
            {
              $set: {
                name: immunization.name,
                manufactured_name: immunization.manufactured_name,
                medical_centre: immunization.medical_centre,
                batch_number: immunization.batch_number,
                next_immunization_appointment:
                  immunization.next_immunization_appointment,
                administered_date: immunization.administered_date,
                route_of_administered: immunization.route_of_administered,
                hcp_provided_immunization:
                  immunization.hcp_provided_immunization,
                allow_to_export: immunization.allow_to_export,
              },
            },
            { new: true }
          ).exec();
          return sendResponse(req, res, 200, {
            status: true,
            body: result,
            message: "Immunization details updated successfully.",
            errorCode: null,
          });
        } else {
          // if doctor_id exist
          const immunizationDetails = await Immunization_info.findOne({
            added_by: "doctor",
            added_by_id: doctor_id,
            for_portal_user: patient_id,
            _id: immunization._id,
          });
          const result = await Immunization_info.updateOne(
            { _id: immunizationDetails._id },
            {
              $set: {
                name: immunization.name,
                manufactured_name: immunization.manufactured_name,
                medical_centre: immunization.medical_centre,
                batch_number: immunization.batch_number,
                next_immunization_appointment:
                  immunization.next_immunization_appointment,
                administered_date: immunization.administered_date,
                route_of_administered: immunization.route_of_administered,
                hcp_provided_immunization:
                  immunization.hcp_provided_immunization,
                allow_to_export: immunization.allow_to_export,
              },
            },
            { new: true }
          );
          return sendResponse(req, res, 200, {
            status: true,
            body: result,
            message: "Immunization details updated successfully.",
            errorCode: null,
          });
        }
      }
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: { error },
        message: "failed to update immunization details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async deleteImmunization(req, res) {
    try {
      const { immunization_id, paitent_id } = req.body;
      const patientIdIsExist = await Immunization_info.findOne({
        for_portal_user: paitent_id,
      });

      if (patientIdIsExist) {
        const result = await Immunization_info.deleteOne({
          _id: mongoose.Types.ObjectId(immunization_id),
        });

        if (result.deletedCount > 0) {
          return sendResponse(req, res, 200, {
            status: true,
            message: "Immunization successfully deleted",
            errorCode: null,
          });
        } else {
          return sendResponse(req, res, 200, {
            status: false,
            message: "Immunization not found for deletion",
            errorCode: "NOT_FOUND",
          });
        }
      } else {
        return sendResponse(req, res, 200, {
          status: false,
          message: "Patient not exist, Immunization not found for deletion",
          errorCode: "NOT_FOUND",
        });
      }
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "failed to delete immunization",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async addpatient_historyDetails(req, res) {
    try {
      const {
        patient_id,
        allergy_name,
        allergy_type,
        allergen,
        reaction,
        severity,
        identified_date,
        note,
        allergyId,
      } = req.body;

      if (allergyId) {
        const updatedHistory = await History_info.findOneAndUpdate(
          {
            _id: mongoose.Types.ObjectId(allergyId),
            for_portal_user: mongoose.Types.ObjectId(patient_id),
            isDeleted: false,
          },
          {
            $set: {
              allergy_name,
              allergy_type,
              allergen,
              reaction,
              severity,
              identified_date,
              note,
            },
          },
          { new: true, upsert: true }
        );

        return sendResponse(req, res, 200, {
          status: true,
          data: updatedHistory,
          message: `Patient's history updated successfully.`,
          errorCode: null,
        });
      } else {
        const newHistory = new History_info({
          for_portal_user: mongoose.Types.ObjectId(patient_id),
          allergy_name,
          allergy_type,
          allergen,
          reaction,
          severity,
          identified_date,
          note,
          isDeleted: false,
        });

        const historyAdded = await newHistory.save();

        await ProfileInfo.findOneAndUpdate(
          { for_portal_user: patient_id },
          {
            $set: {
              in_history: historyAdded._id,
            },
          },
          { new: true }
        ).exec();

        return sendResponse(req, res, 200, {
          status: true,
          data: newHistory,
          message: `Patient's history added successfully.`,
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
  async medicalDocument(req, res) {
    try {
      const { patient_id, doctor_id, medical_document } = req.body;
      const list = medical_document.map((singleData) => ({
        ...singleData,
        for_portal_user: patient_id,
      }));
      let savedDocs = await Medical_document.insertMany(list);
      if (doctor_id !== undefined) {
        const data = await ProfilePermission.find({
          doctor_id: { $eq: doctor_id },
          patient_id: { $eq: patient_id },
        }).select({ permission: 1, _id: 0 });
        let medical_documents = [];
        if (data.length > 0) {
          data[0].permission.medical_documents;
        }

        if (savedDocs.length > 0) {
          savedDocs.map((singleDoc) => {
            let docId = singleDoc._id.toString();
            medical_documents.push(docId);
          });
        }
        const checkExist = await ProfilePermission.find({
          doctor_id: { $eq: doctor_id },
          patient_id: { $eq: patient_id },
        });
        if (checkExist.length > 0) {
          await ProfilePermission.findOneAndUpdate(
            { patient_id, doctor_id },
            {
              $set: {
                "permission.medical_documents": medical_documents,
              },
            },
            { new: true }
          ).exec();
        } else {
          let permission = {
            medical_documents: medical_documents,
            appointment: [],
            vital: false,
            history: {
              patient_history: [],
              alergy: [],
              lifestyle: [],
              family_history: [],
            },
            immunization: false,
            medicine: {
              current_medicine: false,
              past_medicine: false,
            },
          };
          const data = new ProfilePermission({
            doctor_id,
            patient_id,
            permission,
          });
          await data.save();
        }
      }
      return sendResponse(req, res, 200, {
        status: true,
        body: savedDocs,
        message: "Medical document added successfully.",
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: error.message
          ? error.message
          : "failed to add Medical document details ",
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async medicalDocument(req, res) {
    try {
      const { patient_id, doctor_id, medical_document } = req.body;
      const list = medical_document.map((singleData) => ({
        ...singleData,
        for_portal_user: patient_id,
      }));
      let savedDocs = await Medical_document.insertMany(list);
      if (doctor_id !== undefined) {
        const data = await ProfilePermission.find({
          doctor_id: { $eq: doctor_id },
          patient_id: { $eq: patient_id },
        }).select({ permission: 1, _id: 0 });
        let medical_documents = [];
        if (data.length > 0) {
          medical_document = data[0].permission.medical_documents;
        }

        if (savedDocs.length > 0) {
          savedDocs.map((singleDoc) => {
            let docId = singleDoc._id.toString();
            medical_documents.push(docId);
          });
        }
        const checkExist = await ProfilePermission.find({
          doctor_id: { $eq: doctor_id },
          patient_id: { $eq: patient_id },
        });
        if (checkExist.length > 0) {
          await ProfilePermission.findOneAndUpdate(
            { patient_id, doctor_id },
            {
              $set: {
                "permission.medical_documents": medical_documents,
              },
            },
            { new: true }
          ).exec();
        } else {
          let permission = {
            medical_documents: medical_documents,
            appointment: [],
            vital: false,
            history: {
              patient_history: [],
              alergy: [],
              lifestyle: [],
              family_history: [],
            },
            immunization: false,
            medicine: {
              current_medicine: false,
              past_medicine: false,
            },
          };
          const data = new ProfilePermission({
            doctor_id,
            patient_id,
            permission,
          });
          await data.save();
        }
      }
      return sendResponse(req, res, 200, {
        status: true,
        body: savedDocs,
        message: "Medical document added successfully.",
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: error.message
          ? error.message
          : "failed to add Medical document details ",
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async familyDetails(req, res) {
    try {
      const { familyMemberId, patient_id, family_members } = req.body;

      // Find the family document for the given patient
      const family = await Family_info.findOne({ for_portal_user: patient_id });

      if (family) {
        // Update existing family members
        for (let member of family_members) {
          if (familyMemberId) {
            let updateObject = {};
            let updateMedicalHistory = {};
            let updateSocialHistory = {};
            let pushMedicalHistory = {};
            let pushSocialHistory = {};

            for (let key in member) {
              if (key !== "familyMemberId" && key !== "_id") {
                if (key === "medical_history") {
                  // Check if the medical history array has an index property

                  member.medical_history.forEach((history) => {
                    if (history.index !== undefined) {
                      for (let history of member.medical_history) {
                        updateMedicalHistory[
                          `family_members.$[elem].${key}.${history.index}`
                        ] = history.data;
                      }
                    } else {
                      pushMedicalHistory[`family_members.$[elem].${key}`] = {
                        $each: member[key],
                      };
                    }
                  });
                } else if (key === "social_history") {
                  member.social_history.forEach((history) => {
                    if (history.index !== undefined) {
                      for (let history of member.social_history) {
                        updateSocialHistory[
                          `family_members.$[elem].${key}.${history.index}`
                        ] = history.data;
                      }
                    } else {
                      pushSocialHistory[`family_members.$[elem].${key}`] = {
                        $each: member[key],
                      };
                    }
                  });
                } else {
                  updateObject[`family_members.$[elem].${key}`] = member[key];
                }
              }
            }
            if (member.country_code || member.mobile) {
              await PortalUser.findOneAndUpdate(
                { _id: familyMemberId },
                {
                  $set: {
                    country_code: member.country_code,
                    mobile: member.mobile,
                  },
                },
                { new: true }
              ).exec();
            }

            if (member.first_name || member.last_name || member.gender) {
              await ProfileInfo.findOneAndUpdate(
                { for_portal_user: familyMemberId },
                {
                  $set: {
                    full_name: member.first_name + " " + member.last_name,
                    first_name: member.first_name,
                    last_name: member.last_name,
                    gender: member.gender,
                    identityCard: member.identityCard,
                  },
                },
                { new: true }
              ).exec();
            }

            if (Object.keys(updateObject)) {
              await Family_info.updateOne(
                {
                  for_portal_user: patient_id,
                  "family_members.familyMemberId": familyMemberId,
                },
                {
                  $set: updateObject,
                },
                {
                  arrayFilters: [{ "elem.familyMemberId": familyMemberId }],
                  new: true,
                }
              ).exec();
            }

            if (Object.keys(updateMedicalHistory).length > 0) {
              await Family_info.updateOne(
                {
                  for_portal_user: patient_id,
                  "family_members.familyMemberId": familyMemberId,
                },
                {
                  $set: updateMedicalHistory,
                },
                {
                  arrayFilters: [{ "elem.familyMemberId": familyMemberId }],
                  new: true,
                }
              ).exec();
            }

            if (Object.keys(pushSocialHistory).length > 0) {
              await Family_info.updateOne(
                {
                  for_portal_user: patient_id,
                  "family_members.familyMemberId": familyMemberId,
                },
                {
                  $push: pushSocialHistory,
                },
                {
                  arrayFilters: [{ "elem.familyMemberId": familyMemberId }],
                  new: true,
                }
              ).exec();
            }

            if (Object.keys(pushMedicalHistory).length > 0) {
              await Family_info.updateOne(
                {
                  for_portal_user: patient_id,
                  "family_members.familyMemberId": familyMemberId,
                },
                {
                  $push: pushMedicalHistory,
                },
                {
                  arrayFilters: [{ "elem.familyMemberId": familyMemberId }],
                  new: true,
                }
              ).exec();
            }

            if (Object.keys(updateSocialHistory).length > 0) {
              await Family_info.updateOne(
                {
                  for_portal_user: patient_id,
                  "family_members.familyMemberId": familyMemberId,
                },
                {
                  $set: updateSocialHistory,
                },
                {
                  arrayFilters: [{ "elem.familyMemberId": familyMemberId }],
                  new: true,
                }
              ).exec();
            }
          } else {
            // Add new family member
            let sequenceDocument = await Counter.findOneAndUpdate(
              { _id: "countid" },
              { $inc: { sequence_value: 1 } },
              { new: true }
            );

            let portalUserDetails = new PortalUser({
              userId: sequenceDocument.sequence_value,
              country_code: member.country_code,
              mobile: member.mobile,
              parent_userid: patient_id,
            });
            const portalUserData = await portalUserDetails.save();

            let profile = new ProfileInfo({
              full_name: member.first_name + " " + member.last_name,
              first_name: member.first_name,
              last_name: member.last_name,
              gender: member.gender,
              for_portal_user: portalUserData._id,
              identityCard: member.identityCard,
            });
            await profile.save();

            member.familyMemberId = portalUserData._id;
            family.family_members.push(member);
          }
        }
        const updatedFamily = await family.save();

        return sendResponse(req, res, 200, {
          status: true,
          body: updatedFamily,
          message: "Family details updated successfully",
          errorCode: null,
        });
      } else {
        // Create a new family document and add the family members
        let portalUserData;
        for (let data of family_members) {
          let sequenceDocument = await Counter.findOneAndUpdate(
            { _id: "countid" },
            { $inc: { sequence_value: 1 } },
            { new: true }
          );

          let portalUserDetails = new PortalUser({
            userId: sequenceDocument.sequence_value,
            country_code: data.country_code,
            mobile: data.mobile,
            parent_userid: patient_id,
          });
          portalUserData = await portalUserDetails.save();

          let profile = new ProfileInfo({
            full_name: data.first_name + " " + data.last_name,
            first_name: data.first_name,
            last_name: data.last_name,
            gender: data.gender,
            for_portal_user: portalUserData._id,
            identityCard: data.identityCard,
          });
          await profile.save();
          data.familyMemberId = portalUserData._id;
        }

        const familyDetails = new Family_info({
          family_members,
          for_portal_user: patient_id,
        });

        const familyData = await familyDetails.save();

        await ProfileInfo.findOneAndUpdate(
          { for_portal_user: patient_id },
          {
            $set: {
              in_family: familyData._id,
            },
          },
          { new: true }
        ).exec();

        return sendResponse(req, res, 200, {
          status: true,
          body: familyData,
          message: "Family Member Added Successfully",
          errorCode: null,
        });
      }
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to create patient profile",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async profileDetails(req, res) {
    try {
      const { patient_id } = req.query;
      let profileData = await ProfileInfo.findOne({
        for_portal_user: patient_id,
      })
        .populate({
          path: "for_portal_user",
          select: { password: 0 },
        })
        .populate({
          path: "in_location",
        })
        .populate({
          path: "in_vital",
        })
        .populate({
          path: "in_medicine",
        })
        .populate({
          path: "in_history",
        })
        .populate({
          path: "in_medical_document",
        })
        .populate({
          path: "in_family",
        })
        .exec();
      if (profileData.profile_pic) {
        profileData.profile_pic = await generateSignedUrl(
          profileData.profile_pic
        );
      }

      return sendResponse(req, res, 200, {
        status: true,
        body: {
          profileData,
        },
        message: "Patient profile details",
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "failed to get patient profile details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async uploadMedicalDocument(req, res) {
    try {
      req.body.userId = req.body.patientId;
      if (req?.files?.file.length > 0) {
        //Multiple files upload
        let storeDataArray = [];
        const keys = await uploadSingleOrMultipleDocuments(req);
        for (const key of keys) {
          storeDataArray.push(storeMedicalDocuments(key, req));
        }
        await Promise.all([...storeDataArray]);
      } else {
        //Single file upload
        const key = await uploadSingleOrMultipleDocuments(req);
        await storeMedicalDocuments(key[0], req);
      }

      return sendResponse(req, res, 200, {
        status: true,
        data: null,
        message: `Medical document uploaded successfully.`,
        errorCode: null,
      });
    } catch (err) {
      return sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to upload file`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async getMedicalDocuments(req, res) {
    try {
      const { page, limit, searchText, type, patientId } = req.query;
      let filter = {
        isDeleted: false,
      };
      if (type && (type == "self" || type == "family-member")) {
        filter.patientId = patientId;
      } else {
        filter.addedBy = mongoose.Types.ObjectId(req?.user?.portalUserId);
      }
      if (searchText) {
        filter["$or"] = [
          { documentName: { $regex: searchText || "", $options: "i" } },
        ];
      }

      const query = Medical_document.find(filter).sort([["createdAt", -1]]);
      if (limit && limit != 0) {
        query.limit(limit);
        query.skip((page - 1) * limit);
      }
      const getAllMedicalDocuments = await query.lean();

      for (let index = 0; index < getAllMedicalDocuments.length; index++) {
        const element = getAllMedicalDocuments[index];
        if (element?.fileKey) {
          element.signedUrl = await generateSignedUrl(element?.fileKey);
        } else {
          element.signedUrl = "";
        }
      }
      const count = await Medical_document.countDocuments(filter);
      return sendResponse(req, res, 200, {
        status: true,
        message: `Medical documents fetched successfully`,
        data: {
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          totalRecords: count,
          result: getAllMedicalDocuments,
        },
        errorCode: null,
      });
    } catch (err) {
      return sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to fetch medical documents`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async deleteMedicalDocuments(req, res) {
    try {
      const id = req.params.id;
      const getMedicalDocuments = await Medical_document.findById(id);
      if (!getMedicalDocuments) {
        return sendResponse(req, res, 200, {
          status: false,
          message: `Medical document does not exist!`,
          data: null,
          errorCode: null,
        });
      }
      await deleteGCSFile(getMedicalDocuments?.fileKey);
      await Medical_document.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            isDeleted: true,
          },
        }
      );
      return sendResponse(req, res, 200, {
        status: true,
        message: `Medical document deleted successfully.`,
        data: null,
        errorCode: null,
      });
    } catch (err) {
      return sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to fetch medical documents`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async commonAPI(req, res) {
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };
      const gender = [
        { label: "Male", value: "Male" },
        { label: "Female", value: "Female" },
      ];
      const martialStatus = [
        { label: "Married", value: "Married" },
        { label: "Single", value: "Single" },
        { label: "Divorced", value: "Divorced" },
        { label: "widow/widower", value: "widow/widower" },
      ];
      const bloodGroup = [
        { label: "A+", value: "A+" },
        { label: "A-", value: "A-" },
        { label: "B+", value: "B+" },
        { label: "B-", value: "B-" },
        { label: "AB+", value: "AB+" },
        { label: "AB-", value: "AB-" },
        { label: "O+", value: "O+" },
        { label: "O-", value: "O-" },
      ];
      const country = [
        { label: "France", value: "+33" },
        { label: "India", value: "+91" },
      ];
      const relationship = [
        { label: "Father", value: "Father" },
        { label: "Mother", value: "Mother" },
        { label: "Brother", value: "Brother" },
        { label: "Sister", value: "Sister" },
        { label: "Wife", value: "Wife" },
        { label: "Husband", value: "Husband" },
        { label: "Friend", value: "Friend" },
        { label: "Son", value: "Son" },
        { label: "Daughter", value: "Daughter" },
      ];

      const languageList = await httpService.getStaging(
        "common-api/common-language",
        {},
        headers,
        "superadminServiceUrl"
      );
      const spokenLanguage = [
        ...languageList.body.list.map((item) => ({
          label: item.language,
          value: item.language,
        })),
      ];
      return sendResponse(req, res, 200, {
        status: true,
        body: {
          gender,
          martialStatus,
          bloodGroup,
          country,
          relationship,
          spokenLanguage,
        },
        message: `Static API`,
        errorCode: null,
      });
    } catch (err) {
      return sendResponse(req, res, 500, {
        status: false,
        body: err,
        message: `failed to upload file`,
        errorCode: "INTERNAL_SERVER_ERROR",
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
      const findUser = await PortalUser.findOne({ _id: id });
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
          message:
            "This is your previous password. Please enter a new password.",
          errorCode: null,
        });
      }

      const salt = await bcrypt.genSalt(10);
      let hashPassword = await bcrypt.hash(new_password, salt);
      let changedPassword = await PortalUser.findOneAndUpdate(
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
        message: "Failed to change password.",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      let userData = await PortalUser.findOne({ email });
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
      const content = forgotPasswordEmail(
        email.toLowerCase(),
        resetToken,
        userData._id
      );
      let sendEmailStatus = await sendEmail(content);
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

  async resetForgotPassword(req, res) {
    try {
      const { user_id, resetToken, newPassword } = req.body;

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

      const passCheck = await PortalUser.findOne({ _id: user_id });

      const isPasswordCheck = await checkPassword(newPassword, passCheck);

      if (isPasswordCheck) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message:
            "This is your previous password. Please enter a new password.",
          errorCode: null,
        });
      } else {
        const hashPassword = await generateTenSaltHash(newPassword);

        await PortalUser.findOneAndUpdate(
          { _id: user_id },
          { password: hashPassword },
          { new: true }
        );
        return sendResponse(req, res, 200, {
          status: true,
          body: null,
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

  async getAllPatient(req, res) {
    try {
      const allPatient1 = await PortalUser.find({
        lock_user: false,
        isDeleted: false,
        isActive: true,
        verified: true,
      });

      const portalUserIds = allPatient1.map((user) => user._id);

      const allPatient = await ProfileInfo.find(
        { for_portal_user: { $in: portalUserIds } },
        {
          full_name: 1,
          first_name: 1,
          last_name: 1,
          gender: 1,
          dob: 1,
          for_portal_user: 1,
          _id: 0,
        }
      ).populate({
        path: "for_portal_user",
      });

      return sendResponse(req, res, 200, {
        status: true,
        body: allPatient,
        message: "All patient list",
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

  async staticImmunizationList(req, res) {
    try {
      const allImmunization = await ImmunizationList.find({
        delete_status: false,
        active_status: true,
      });
      return sendResponse(req, res, 200, {
        status: true,
        body: allImmunization,
        message: "All immunization",
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

  async patient_historyList(req, res) {
    try {
      const { patient_id } = req.query;

      const list = await History_info.find({
        for_portal_user: mongoose.Types.ObjectId(patient_id),
        isDeleted: false,
      });

      if (list) {
        return sendResponse(req, res, 200, {
          status: true,
          body: list,
          message: "Patient history list fetched successfully",
          errorCode: null,
        });
      } else {
        return sendResponse(req, res, 200, {
          status: true,
          body: [],
          message: "Patient history list not fetched successfully",
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

  async staticPatientLifestyleTypeList(req, res) {
    try {
      const list = await LifestyleTypeList.find({});
      sendResponse(req, res, 200, {
        status: true,
        body: list,
        message: "All patient lifestyle type list",
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
  async staticFamilyHistoryTypeList(req, res) {
    try {
      const list = await FamilyHistoryTypeList.find({});
      sendResponse(req, res, 200, {
        status: true,
        body: list,
        message: "All family history type list",
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

  async patientFullDetails(req, res) {
    const { patient_id ,page,limit} = req.query;

  const pageNumber = parseInt(page) 
  const pageSize = parseInt(limit)
    const headers = {
      Authorization: req.headers["authorization"],
    };
    try {
      const result = await PortalUser.aggregate([
        {
          $match: {
            _id: mongoose.Types.ObjectId(patient_id),
            // isDeleted: false,
          },
        },
        {
          $lookup: {
            from: "profileinfos",
            localField: "_id",
            foreignField: "for_portal_user",
            as: "profileinfos",
          },
        },
        { $unwind: "$profileinfos" },
        {
          $lookup: {
            from: "locationinfos",
            localField: "_id",
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
          $lookup: {
            from: "vitalinfos",
            localField: "_id",
            foreignField: "for_portal_user",
            as: "vitalinfos",
          },
        },
        {
          $lookup: {
            from: "medicalinfos",
            localField: "_id",
            foreignField: "for_portal_user",
            as: "medicalinfos",
          },
        },
        {
          $unwind: {
            path: "$medicalinfos",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $lookup: {
            from: "historyinfos",
            let: { userId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$for_portal_user", "$$userId"] },
                      { $eq: ["$isDeleted", false] },
                    ],
                  },
                },
              },
            ],
            as: "historyinfos",
          },
        },
        {
          $lookup: {
            from: "familyinfos",
            localField: "_id",
            foreignField: "for_portal_user",
            as: "familyinfos",
          },
        },
        {
          $unwind: { path: "$familyinfos", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: "preferredpharmacies",
            localField: "_id",
            foreignField: "for_portal_user",
            as: "preferredpharmacies",
          },
        },
        {
          $unwind: {
            path: "$preferredpharmacies",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "medicaldocuments",
            localField: "_id",
            foreignField: "for_portal_user",
            as: "medicaldocuments",
          },
        },
        {
          $addFields: {
            "portalUserDetails._id": "$_id",
            "portalUserDetails.email": "$email",
            "portalUserDetails.userId": "$userId",
            "portalUserDetails.country_code": "$country_code",
            "portalUserDetails.mobile": "$mobile",
            "portalUserDetails.role": "$role",
            "portalUserDetails.lock_user": "$lock_user",
            "portalUserDetails.verified": "$verified",
            "portalUserDetails.ipAddress": "$ipAddress",
            "portalUserDetails.last_update": "$last_update",
            "portalUserDetails.createdAt": "$createdAt",
            "portalUserDetails.updatedAt": "$updatedAt",
            "portalUserDetails.parent_userid": "$parent_userid",
            "portalUserDetails.notification": "$notification",
            "portalUserDetails.isDependent": "$isDependent",
            personalDetails: "$profileinfos",
            locationDetails: "$locationinfos",
            vitalsDetails: "$vitalinfos",
            medicineDetails: "$medicalinfos",
            historyDetails: "$historyinfos",
            // familyDetails: {
            //   $filter: {
            //     input: "$familyinfos.family_members",
            //     as: "familyMember",
            //     cond: { $eq: ["$$familyMember.isDeleted", false] },
            //   },
            // },
            familyDetails: "$familyinfos.family_members",
            medicalDocument: "$medicaldocuments",
            preferredPharmacy: "$preferredpharmacies",
          },
        },
        {
          $unset: [
            "_id",
            "email",
            "userId",
            "country_code",
            "mobile",
            "role",
            "lock_user",
            "verified",
            "ipAddress",
            "last_update",
            "createdAt",
            "updatedAt",
            "password",
            "notification",
            "isDependent",
            "__v",
            "profileinfos",
            "locationinfos",
            "vitalinfos",
            "medicalinfos",
            "historyinfos",
            "familyinfos",
            "medicaldocuments",
            "preferredpharmacies",
          ],
        },
      ]);
      if (result.length > 0) {
        if (result[0]?.subscriptionDetails?.subscriptionPlanId) {
          const getCurrentSubscription = await httpService.getStaging(
            `superadmin/get-subscription-plan-details`,
            { id: result[0]?.subscriptionDetails?.subscriptionPlanId },
            headers,
            "superadminServiceUrl"
          );
          if (getCurrentSubscription.status) {
            result[0].subscriptionDetails.planName =
              getCurrentSubscription?.body?.plan_name;
          } else {
            result[0].subscriptionDetails.planName = "as";
          }
        }
        if (result[0]?.personalDetails?.profile_pic) {
          result[0].personalDetails.profile_pic_signed_url =
            await generateSignedUrl(result[0]?.personalDetails?.profile_pic);
        }
        //medical History
        if (result[0]?.personalDetails?.medicalInformation?.medicalHistory) {
          let medicalHistory = result[0].personalDetails.medicalInformation.medicalHistory
            .filter(item => item.isDeleted === false)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
          const total = medicalHistory.length;
          const totalPages = Math.ceil(total / pageSize);
        
          const paginatedMedicalHistory = medicalHistory.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
        
          result[0].personalDetails.medicalInformation.medicalHistory = paginatedMedicalHistory;
          result[0].personalDetails.medicalInformation.medicalHistoryTotal = total;
          result[0].personalDetails.medicalInformation.medicalHistoryTotalPages = totalPages;
          result[0].personalDetails.medicalInformation.medicalHistoryCurrentPage = pageNumber;
        }
        //Social History
        if (result[0]?.personalDetails?.medicalInformation?.socialHistory) {
          const socialHistory = result[0].personalDetails.medicalInformation.socialHistory
              .filter(item => item.isDeleted === false)
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          
          const socialTotal = socialHistory.length;
          const paginatedSocialHistory = socialHistory.slice(
              (pageNumber - 1) * pageSize,
              pageNumber * pageSize
          );
          
          result[0].personalDetails.medicalInformation.socialHistory = paginatedSocialHistory;
          result[0].personalDetails.medicalInformation.socialHistoryTotal = socialTotal;
          result[0].personalDetails.medicalInformation.socialHistoryTotalPages = Math.ceil(socialTotal / pageSize);
          result[0].personalDetails.medicalInformation.socialHistoryCurrentPage = pageNumber;                
    }
        //Family history
        if (result[0]?.familyDetails) {
          const familyHistory = result[0].familyDetails
              .filter(item => item.isDeleted === false)
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          
          const familyTotal = familyHistory.length;
          const paginatedFamilyHistory = familyHistory.slice(
              (pageNumber - 1) * pageSize,
              pageNumber * pageSize
          );
          
          result[0].familyDetails = paginatedFamilyHistory;
          result[0].familyDetailsTotal = familyTotal;
          result[0].familyDetailsTotalPages = Math.ceil(familyTotal / pageSize);
          result[0].familyDetailsCurrentPage = pageNumber;
      }

      }

      return sendResponse(req, res, 200, {
        status: true,
        body: result[0],
        message: "Successfully get patient profile",
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

  async patientPersonalDetails(req, res) {
    const { patient_id } = req.query;
    try {
      const result = await PortalUser.aggregate([
        {
          $match: {
            _id: mongoose.Types.ObjectId(patient_id),
          },
        },
        {
          $lookup: {
            from: "profileinfos",
            localField: "_id",
            foreignField: "for_portal_user",
            as: "profileinfos",
          },
        },
        { $unwind: "$profileinfos" },
        {
          $lookup: {
            from: "locationinfos",
            localField: "_id",
            foreignField: "for_portal_user",
            as: "locationinfos",
          },
        },
        {
          $unwind: { path: "$locationinfos", preserveNullAndEmptyArrays: true },
        },
        {
          $addFields: {
            "portalUserDetails._id": "$_id",
            "portalUserDetails.email": "$email",
            "portalUserDetails.userId": "$userId",
            "portalUserDetails.country_code": "$country_code",
            "portalUserDetails.mobile": "$mobile",
            "portalUserDetails.role": "$role",
            "portalUserDetails.lock_user": "$lock_user",
            "portalUserDetails.verified": "$verified",
            "portalUserDetails.ipAddress": "$ipAddress",
            "portalUserDetails.last_update": "$last_update",
            "portalUserDetails.createdAt": "$createdAt",
            "portalUserDetails.updatedAt": "$updatedAt",
            personalDetails: "$profileinfos",
          },
        },
        {
          $unset: [
            "_id",
            "email",
            "userId",
            "country_code",
            "mobile",
            "role",
            "lock_user",
            "verified",
            "ipAddress",
            "last_update",
            "createdAt",
            "updatedAt",
            "password",
            "__v",
            "profileinfos",
          ],
        },
      ]);

      return sendResponse(req, res, 200, {
        status: true,
        body: result[0],
        message: "Successfully get patient personal details",
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

  async patientCommonDetails(req, res) {
    const { patientId } = req.query;
    try {
      const result = await PortalUser.aggregate([
        {
          $match: {
            _id: mongoose.Types.ObjectId(patientId),
          },
        },
        {
          $lookup: {
            from: "profileinfos",
            localField: "_id",
            foreignField: "for_portal_user",
            as: "profileinfos",
          },
        },
        { $unwind: "$profileinfos" },
        {
          $lookup: {
            from: "locationinfos",
            localField: "_id",
            foreignField: "for_portal_user",
            as: "locationinfos",
          },
        },
        { $unwind: "$locationinfos" },
        {
          $addFields: {
            image: "$profileinfos.profile_pic",
            fullName: "$profileinfos.full_name",
            dob: "$profileinfos.dob",
            gender: "$profileinfos.gender",
            address: "$locationinfos.address",
          },
        },
        {
          $project: {
            _id: 1,
            email: 1,
            mobile: 1,
            fullName: 1,
            dob: 1,
            gender: 1,
            address: 1,
            image: 1,
          },
        },
      ]);
      if (result[0]?.image != "" && result[0]?.image != undefined) {
        result[0].image = await generateSignedUrl(result[0].image);
      }
      return sendResponse(req, res, 200, {
        status: true,
        body: result[0],
        message: "Successfully get patient profile",
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

  async getDependentFamilyMembers(req, res) {
    const { patientId } = req.query;
    try {
      const result = await PortalUser.aggregate([
        {
          $match: {
            _id: mongoose.Types.ObjectId(patientId),
          },
        },
        {
          $lookup: {
            from: "familyinfos",
            localField: "_id",
            foreignField: "for_portal_user",
            as: "familyinfos",
          },
        },
        { $unwind: { path: "$familyinfos", preserveNullAndEmptyArrays: true } },
      ]);

      return sendResponse(req, res, 200, {
        status: true,
        body: result[0],
        message: "Successfully get patient dependent family members",
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

  async getPatientDetailsById(req, res) {
    try {
      const { ids } = req.body;
      let idArray = [];
      for (const id of ids) {
        idArray.push(mongoose.Types.ObjectId(id));
      }
      const data = await ProfileInfo.find({
        for_portal_user: { $in: idArray },
      })
        .populate({
          path: "for_portal_user",
          select: "email country_code mobile deviceToken notification",
        })
        .populate({
          path: "in_location",
          select: "address",
        })
        .select({
          first_name: 1,
          full_name_arabic: 1,
          last_name: 1,
          dob: 1,
          gender: 1,
          saudi_id: 1,
          iqama_number: 1,
          mrn_number: 1,
          passport: 1,
          for_portal_user: 1,
          profile_pic: 1,
          _id: 0,
        });
      let profileObject = {};
      for (const patientData of data) {
        profileObject[patientData.for_portal_user?._id] = {
          full_name: `${patientData.first_name} ${patientData.last_name} `,
          full_name_arabic: patientData?.full_name_arabic,
          email: patientData?.for_portal_user?.email,
          deviceToken: patientData?.for_portal_user?.deviceToken,
          dob: patientData?.dob,
          gender: patientData?.gender,
          saudi_id: patientData?.saudi_id || "",
          iqama_number: patientData?.iqama_number || "",
          passport: patientData?.passport || "",
          notification: patientData?.for_portal_user?.notification,
          mrn_number: patientData?.mrn_number || "",
          country_code: patientData?.for_portal_user?.country_code,
          mobile: patientData?.for_portal_user?.mobile,
          address: patientData?.in_location?.address,
          profile_pic: patientData?.profile_pic
            ? await generateSignedUrl(patientData.profile_pic)
            : "",
        };
      }
      return sendResponse(req, res, 200, {
        status: true,
        data: profileObject,
        message: `fetched details successfully`,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        data: error,
        message: `Failed to fetch details`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async patientExistingDocs(req, res) {
    const { patientId } = req.query;
    try {
      const result = await Medical_document.find({
        for_portal_user: patientId,
      });
      for (let index = 0; index < result.length; index++) {
        element.image_signed_url = "signedUrl";
      }
      return sendResponse(req, res, 200, {
        status: true,
        data: result,
        message: `Successfully fetched all documents`,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        data: error,
        message: `Failed to fetch documents`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async patientAddByDoctor(req, res) {
    const {
      patient_id,
      email,
      country_code,
      mobile,
      password,
      first_name,
      last_name,
      gender,
      dob,
      blood_group,
      marital_status,
      emergency_contact,
      address,
      neighborhood,
      country,
      region,
      province,
      department,
      city,
      village,
      pincode,
      added_by_doctor,
    } = req.body;
    try {
      let passwordHash;
      if (password != null) {
        const salt = await bcrypt.genSalt(10);
        passwordHash = await bcrypt.hash(password, salt);
      }

      if (patient_id == "") {
        const portalUser = await PortalUser.findOne({ mobile, country_code });
        if (portalUser) {
          return sendResponse(req, res, 200, {
            status: false,
            data: null,
            message: `Patient already exist`,
            errorCode: null,
          });
        }
        let sequenceDocument = await Counter.findOneAndUpdate(
          { _id: "countid" },
          { $inc: { sequence_value: 1 } },
          { new: true }
        );
        let portalUserDetails = new PortalUser({
          email,
          userId: sequenceDocument.sequence_value,
          password: passwordHash,
          country_code,
          mobile,
        });
        let portalUserData = await portalUserDetails.save();
        const locationDetails = new Location_info({
          address,
          neighborhood,
          country,
          region,
          province,
          department,
          city,
          village,
          pincode,
          for_portal_user: portalUserData._id,
        });
        const locationData = await locationDetails.save();
        let profile = new ProfileInfo({
          full_name: first_name + " " + last_name,
          first_name,
          last_name,
          gender,
          dob,
          blood_group,
          marital_status,
          emergency_contact,
          for_portal_user: portalUserData._id,
          added_by_doctor,
          in_location: locationData._id,
        });
        let profileData = await profile.save();
        return sendResponse(req, res, 200, {
          status: true,
          data: {
            portalUserData,
            locationData,
            profileData,
          },
          message: `Successfully added patient`,
          errorCode: null,
        });
      } else {
        const portalUserData = await PortalUser.findOneAndUpdate(
          { for_portal_user: patient_id },
          {
            $set: {
              email,
              password: passwordHash,
            },
          },
          { new: true }
        );
        const locationData = await Location_info.findOneAndUpdate(
          { for_portal_user: patient_id },
          {
            $set: {
              address,
              neighborhood,
              country,
              region,
              province,
              department,
              city,
              village,
              pincode,
            },
          },
          { new: true }
        ).exec();
        const profileData = await ProfileInfo.findOneAndUpdate(
          { for_portal_user: patient_id },
          {
            $set: {
              full_name: first_name + " " + last_name,
              first_name,
              last_name,
              gender,
              dob,
              blood_group,
              marital_status,
              emergency_contact,
            },
          },
          { new: true }
        ).exec();
        return sendResponse(req, res, 200, {
          status: true,
          data: {
            portalUserData,
            locationData,
            profileData,
          },
          message: `Successfully updated patient`,
          errorCode: null,
        });
      }
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        data: error,
        message: `Failed to fetched.`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async getPatientDetailsBasedOnRequest(req, res) {
    try {
      const { ids } = req.body;
      let idArray = [];
      for (const id of ids) {
        idArray.push(mongoose.Types.ObjectId(id));
      }
      const data = await ProfileInfo.find({
        for_portal_user: { $in: idArray },
      }).select({
        full_name: 1,
        for_portal_user: 1,
        _id: 0,
      });

      let profileObject = {};
      for (const patientData of data) {
        profileObject[patientData.for_portal_user] = patientData.full_name;
      }
      return sendResponse(req, res, 200, {
        status: true,
        data: profileObject,
        message: `fetched details successfully`,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        data: error,
        message: `Failed to fetch details`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async getPatientDocumentsById(req, res) {
    try {
      const { ids } = req.body;
      const idArray = ids.map((val) => mongoose.Types.ObjectId(val.doc_id));
      let dataArray = [];
      if (idArray.length > 0) {
        const getDocuments = await Medical_document.find({
          _id: { $in: idArray },
        });
        for (const doc of getDocuments) {
          doc.image_signed_url = "";
          dataArray.push(doc);
        }
      }
      return sendResponse(req, res, 200, {
        status: true,
        data: dataArray,
        message: `fetched details successfully`,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        data: error,
        message: `Failed to fetch details`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async patientProfileSignedUrl(req, res) {
    const { patientId } = req.query;
    try {
      let result;
      let profile_signed_url = "";

      result = await ProfileInfo.findOne(
        { for_portal_user: patientId },
        { profile_pic: 1 }
      );

      let obj = {
        ...result?._doc,
        profile_signed_url,
      };

      return sendResponse(req, res, 200, {
        status: true,
        body: obj,
        message: `fetched profile signed url`,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `Failed to fetch details`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }


  async getAllPatientAddedByDoctor(req, res) {
    const { doctorId, limit, page, searchText, sort, gender, dob, isSelf, idsToRemove } = req.query;
    const headers = {
      Authorization: req.headers["authorization"],
    };

    try {
      //get all patient id for the requested doctor with respect to appointment
      const getData = await httpService.getStaging(
        "doctor/get-patient-id-from-appointment",
        {
          doctorId,
        },
        headers,
        "doctorServiceUrl"
      );
      let patientIds = [];
      if (getData.status) {
        patientIds = getData?.data?.patientIds;
      }
      if (patientIds.length > 0 && idsToRemove?.length > 0) {
        patientIds = patientIds.filter(patientId => !idsToRemove.includes(patientId))
      }

      let sortingarray = {};
      if (sort != "undefined" && sort != "" && sort != undefined) {
        let keynew = sort.split(":")[0];
        let value = sort.split(":")[1];
        sortingarray[keynew] = Number(value);
      } else {
        sortingarray["createdAt"] = -1;
      }

      let searchText_filter = [{}];
      if (searchText != "") {
        searchText_filter = [
          { full_name: { $regex: searchText || "", $options: "i" } },
          { mrn_number: { $regex: searchText || "", $options: "i" } },
          { saudi_id: { $regex: searchText || "", $options: "i" } },
          { iqama_number: { $regex: searchText || "", $options: "i" } },
          { mobile: { $regex: searchText || "", $options: "i" } },
        ];
      }
      let gender_filter = {}
      if (gender) {
        gender_filter.gender = gender
      }
      let dob_filter = {}
      if (dob) {
        dob_filter.dob = dob
      }
      let family_filter = {}
      if (isSelf && (isSelf == "true" || isSelf)) {
        family_filter = {
          isFamilyMember: false
        }
      }

      const pipeline = [
        {
          $lookup: {
            from: "portalusers",
            localField: "for_portal_user",
            foreignField: "_id",
            as: "portalusers",
          },
        },
        { $unwind: "$portalusers" },
        {
          $addFields: {
            isDeleted: "$portalusers.isDeleted",
            mobile: "$portalusers.mobile",
            countryCode: "$portalusers.country_code",
            portalUserId: "$portalusers._id",
          },
        },
        {
          $lookup: {
            from: "locationinfos",
            localField: "for_portal_user",
            foreignField: "for_portal_user",
            as: "locationinfos",
          },
        },
        {
          $match: {
            // isDeleted: false,
            for_portal_user: {
              $in: patientIds.map((patientId) =>
                mongoose.Types.ObjectId(patientId)
              ),
            },
            $or: searchText_filter,
            $and: [
              gender_filter,
              dob_filter,
              family_filter,
            ]
          },
        },
        {
          $group: {
            _id: "$_id",
            portalUserId: { $first: "$portalUserId" },
            fullName: { $first: "$full_name" },
            profile_pic: { $first: "$profile_pic" },
            gender: { $first: "$gender" },
            dob: { $first: "$dob" },
            mrn_number: { $first: "$mrn_number" },
            mobile: { $first: "$mobile" },
            countryCode: { $first: "$countryCode" },
            address: { $first: "$locationinfos.address" },
          },
        },
      ];
      pipeline.push(
        {
          $sort: { ...sortingarray, _id: 1 },
        },
        {
          $facet: {
            totalCount: [
              {
                $count: "count",
              },
            ],
            paginatedResults: limit != 0 ? [
              { $skip: (page - 1) * limit },
              { $limit: limit * 1 },
            ] : [
              { $skip: 0 }
            ],
          },
        }
      );

      const allPatient = await ProfileInfo.aggregate(pipeline);

      if (allPatient[0]?.paginatedResults && allPatient[0]?.paginatedResults.length > 0) {
        for (let index = 0; index < allPatient[0]?.paginatedResults.length; index++) {
          const element = allPatient[0]?.paginatedResults[index];
          if (element?.profile_pic) {
            element.profile_pic = await generateSignedUrl(element?.profile_pic)
          } else {
            element.profile_pic = ''
          }
        }
      }
      let totalCount = 0;
      if (allPatient[0].totalCount.length > 0) {
        totalCount = allPatient[0].totalCount[0].count;
      }

      return sendResponse(req, res, 200, {
        status: true,
        body: {
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
          totalRecords: totalCount,
          result: allPatient[0]?.paginatedResults,
        },
        message: "All patient list",
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

  async getAllPatientForSuperAdmin(req, res) {
    try {
      const { limit, page, searchText, fromDate, toDate, sort } = req.query;

      let searchText_filter = [{}];
      if (searchText) {
        searchText_filter = [
          { full_name: { $regex: searchText || "", $options: "i" } },
          { last_name: { $regex: searchText || "", $options: "i" } },
          { email: { $regex: searchText || "", $options: "i" } },
          { mobile: { $regex: searchText || "", $options: "i" } },
          { mrn_number: { $regex: searchText, $options: "i" } },
        ];
      }
      let date_filter = {};
      if (fromDate && toDate) {
        const fromDateObj = new Date(`${fromDate} 00:00:00`);
        const toDateObj = new Date(`${toDate} 23:59:59`);
        date_filter = {
          createdAt: { $gte: fromDateObj, $lte: toDateObj },
        };
      }

      let sortKey = "createdAt";
      let sortValue = -1;
      if (sort) {
        sortKey = sort.split(":")[0];
        sortValue = sort.split(":")[1];
      }

      const pipline = [
        {
          $lookup: {
            from: "portalusers",
            localField: "for_portal_user",
            foreignField: "_id",
            as: "portalusers",
          },
        },
        { $unwind: "$portalusers" },
        {
          $addFields: {
            isDeleted: "$portalusers.isDeleted",
            email: "$portalusers.email",
            isActive: "$portalusers.isActive",
            lock_user: "$portalusers.lock_user",
            country_code: "$portalusers.country_code",
            mobile: "$portalusers.mobile",
            portalUserId: "$portalusers._id",
          },
        },
        {
          $match: {
            isDeleted: false,
            isFamilyMember: false,
            $or: searchText_filter,
            $and: [date_filter],
          },
        },
        {
          $sort: {
            [sortKey]: Number(sortValue),
          },
        },
        {
          $group: {
            _id: "$_id",
            isActive: { $first: "$isActive" },
            email: { $first: "$email" },
            lock_user: { $first: "$lock_user" },
            country_code: { $first: "$country_code" },
            mobile: { $first: "$mobile" },
            full_name: { $first: "$full_name" },
            mrn_number: { $first: "$mrn_number" },
            gender: { $first: "$gender" },
            dob: { $first: "$dob" },
            portalUserId: { $first: "$portalUserId" },
            createdAt: { $first: "$createdAt" },
          },
        },
        {
          $facet: {
            totalCount: [
              {
                $count: "count",
              },
            ],
            paginatedResults:
              limit != 0
                ? [{ $skip: (page - 1) * limit }, { $limit: limit * 1 }]
                : [{ $skip: 0 }],
          },
        },
      ];
      const result = await ProfileInfo.aggregate(pipline);

      let totalCount = 0;
      if (result[0].totalCount.length > 0) {
        totalCount = result[0].totalCount[0].count;
      }

      return sendResponse(req, res, 200, {
        status: true,
        body: {
          totalRecords: totalCount,
          currentPage: page,
          totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
          data: result[0]?.paginatedResults,
        },
        message: "All patient list",
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

  async getAllPatientForAdminDashboardReport(req, res) {
    const headers = {
      Authorization: req.headers["authorization"],
    };

    try {
      const { limit, page, searchText, fromDate, toDate, sort } = req.query;

      let searchText_filter = [{}];
      if (searchText) {
        searchText_filter = [
          { full_name: { $regex: searchText, $options: "i" } },
          { last_name: { $regex: searchText, $options: "i" } },
          { email: { $regex: searchText, $options: "i" } },
          { mobile: { $regex: searchText, $options: "i" } },
        ];
      }

      let date_filter = {};
      if (fromDate && toDate) {
        const fromDateObj = new Date(`${fromDate} 00:00:00`);
        const toDateObj = new Date(`${toDate} 23:59:59`);
        date_filter = {
          createdAt: { $gte: fromDateObj, $lte: toDateObj },
        };
      }

      let sortKey = "createdAt";
      let sortValue = -1;
      if (sort) {
        sortKey = sort.split(":")[0];
        sortValue = sort.split(":")[1];
      }

      const pipeline = [
        {
          $lookup: {
            from: "portalusers",
            localField: "for_portal_user",
            foreignField: "_id",
            as: "portalusers",
          },
        },
        { $unwind: "$portalusers" },
        {
          $addFields: {
            isDeleted: "$portalusers.isDeleted",
            email: "$portalusers.email",
            isActive: "$portalusers.isActive",
            lock_user: "$portalusers.lock_user",
            country_code: "$portalusers.country_code",
            mobile: "$portalusers.mobile",
            portalUserId: "$portalusers._id",
            subscriptionDetails: "$portalusers.subscriptionDetails",
          },
        },
        {
          $match: {
            isDeleted: false,
            isFamilyMember: false,
            $or: searchText_filter,
            $and: [date_filter],
          },
        },
        {
          $sort: { [sortKey]: Number(sortValue) },
        },
        {
          $group: {
            _id: "$_id",
            isActive: { $first: "$isActive" },
            email: { $first: "$email" },
            lock_user: { $first: "$lock_user" },
            country_code: { $first: "$country_code" },
            mobile: { $first: "$mobile" },
            full_name: { $first: "$full_name" },
            mrn_number: { $first: "$mrn_number" },
            gender: { $first: "$gender" },
            dob: { $first: "$dob" },
            portalUserId: { $first: "$portalUserId" },
            createdAt: { $first: "$createdAt" },
            subscriptionDetails: { $first: "$subscriptionDetails" },
          },
        },
        {
          $facet: {
            totalCount: [{ $count: "count" }],
            paginatedResults:
              limit != 0
                ? [
                  { $skip: searchText ? 0 : (page - 1) * limit },
                  { $limit: limit * 1 },
                ]
                : [{ $skip: 0 }],
          },
        },
      ];

      const result = await ProfileInfo.aggregate(pipeline);
      const totalCount = result[0]?.totalCount[0]?.count || 0;
      let patients = result[0]?.paginatedResults || [];

      const uniquePlanIds = [
        ...new Set(
          patients
            .filter((p) => p.subscriptionDetails?.subscriptionPlanId)
            .map((p) => p.subscriptionDetails.subscriptionPlanId)
        ),
      ];

      let planDetailsMap = {};

      if (uniquePlanIds.length > 0) {
        try {
          const plansResponse = await httpService.getStaging(
            `superadmin/get-subscription-plan/`,
            { planIds: uniquePlanIds },
            headers,
            "superadminServiceUrl"
          );

          if (plansResponse.status && Array.isArray(plansResponse.body)) {
            planDetailsMap = plansResponse.body.reduce((acc, plan) => {
              acc[plan._id] = {
                plan_name: plan.plan_name,
                services: plan.services,
                price_per_member: plan.price_per_member,
                plan_duration: plan.plan_duration,
              };
              return acc;
            }, {});
          } else {
            console.warn("Warning: Plans response is invalid or empty");
          }
        } catch (error) {
          console.error("Error fetching subscription plans:", error.message);
        }
      }

      patients = patients.map((patient) => {
        const subscription = patient.subscriptionDetails || {};

        const planId = subscription.subscriptionPlanId;
        if (planId) {
        } else {
          console.log("No Subscription Plan ID found!");
        }

        const planInfo = planDetailsMap[planId] || null;

        return {
          ...patient,
          subscriptionPlan: planInfo,
        };
      });

      return sendResponse(req, res, 200, {
        status: true,
        body: {
          totalRecords: totalCount,
          currentPage: page,
          totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
          data: patients,
        },
        message: "All patient list",
        errorCode: null,
      });
    } catch (error) {
      console.error("Error fetching patients:", error);
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Internal server error",
        errorCode: null,
      });
    }
  }


async getAllPatientForSuperAdminNew(req, res) {
  const headers = {
    Authorization: req.headers["authorization"],
  };
 
  try {
    const {
      limit,
      page,
      searchText,
      fromDate,
      toDate,
      sort,
      gender,
      mobile,
      email,
      isPlanActive,
      mrn_number,
      full_name,
      city, 
      country, 
      registeredFromDate, 
      registeredToDate, 
      lastLoginFromDate,
      lastLoginToDate,
      lastUsedFromDate,  // Add this
      lastUsedToDate,
      subscriptionPlanId
    } = req.query;
    
    let dynamicFilters = {
      isDeleted: false,
      isFamilyMember: false,
    };
    let lastUsedDateFilter = {};
    if (lastUsedFromDate && lastUsedToDate) {
      const fromDateObj = new Date(`${lastUsedFromDate} 00:00:00`);
      const toDateObj = new Date(`${lastUsedToDate} 23:59:59`);
      lastUsedDateFilter["portalusers.updatedAt"] = { $gte: fromDateObj, $lte: toDateObj };
    }
 
    if (searchText) {
      dynamicFilters["$or"] = [
        { full_name: { $regex: searchText, $options: "i" } },
        { last_name: { $regex: searchText, $options: "i" } },
        { email: { $regex: searchText, $options: "i" } },
        { mobile: { $regex: searchText, $options: "i" } },
        { mrn_number: { $regex: searchText, $options: "i" } },
      ];
    }
 
    if (fromDate && toDate) {
      const fromDateObj = new Date(`${fromDate} 00:00:00`);
      const toDateObj = new Date(`${toDate} 23:59:59`);
      dynamicFilters["createdAt"] = { $gte: fromDateObj, $lte: toDateObj };
    }
 
    if (gender) {
      if (Array.isArray(gender)) {
        dynamicFilters["gender"] = { $in: gender };
      } else if (gender === "both") {
        dynamicFilters["gender"] = { $in: ["male", "female"] };
      } else {
        dynamicFilters["gender"] = gender;
      }
    }
 
    if (mobile) {
      dynamicFilters["mobile"] = { $regex: `^${mobile}$`, $options: "i" };
    }
 
    if (email) {
      dynamicFilters["email"] = { $regex: `^${email}$`, $options: "i" };
    }
 
    if (mrn_number) {
      dynamicFilters["mrn_number"] = { $regex: `^${mrn_number}$`, $options: "i" };
    }
 
    if (full_name) {
      dynamicFilters["full_name"] = { $regex: `^${full_name}$`, $options: "i" };
    }
 
    if (isPlanActive !== undefined && isPlanActive !== "both") {
      dynamicFilters["subscriptionDetails.isPlanActive"] = isPlanActive === "true";
    }
 
    if (country) {
      dynamicFilters["nationality"] = { $regex: country, $options: "i" };
    }

    let locationFilter = {};
    if (city) {
      locationFilter = {
        "location.city": { $regex: city, $options: "i" }
      };
    }
 
    // Build the registration date filter if provided
    let registrationDateFilter = {};
    if (registeredFromDate && registeredToDate) {
      const fromDateObj = new Date(`${registeredFromDate} 00:00:00`);
      const toDateObj = new Date(`${registeredToDate} 23:59:59`);
      registrationDateFilter["portalusers.createdAt"] = { $gte: fromDateObj, $lte: toDateObj };
    }
    if (subscriptionPlanId) {
      dynamicFilters["portalusers.subscriptionDetails.subscriptionPlanId"] = subscriptionPlanId;
    }
    
 
    let sortKey = "full_name";
    let sortValue = -1;
    if (sort) {
      [sortKey, sortValue] = sort.split(":");
      sortValue = Number(sortValue);
    }
 
    const pipeline = [
      {
        $lookup: {
          from: "portalusers",
          localField: "for_portal_user",
          foreignField: "_id",
          as: "portalusers",
        },
      },
      { $unwind: "$portalusers" },
      {
        $lookup: {
          from: "locationinfos",
          localField: "in_location",
          foreignField: "_id",
          as: "location",
        },
      },
      { $unwind: { path: "$location", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "portalusers",
          localField: "subscriptionDetails.subscriptionPlanId",
          foreignField: "_id",
          as: "subscriptionPlan",
        },
      },
      {
        $addFields: {
          isDeleted: "$portalusers.isDeleted",
          email: "$portalusers.email",
          isActive: "$portalusers.isActive",
          lock_user: "$portalusers.lock_user",
          country_code: "$portalusers.country_code",
          mobile: "$portalusers.mobile",
          portalUserId: "$portalusers._id",
          subscriptionDetails: "$portalusers.subscriptionDetails",
          registrationDate: "$portalusers.createdAt", 
          lastUsedDate: "$portalusers.updatedAt",
        },
      },
      {
        $match: {
          $and: [
            dynamicFilters,
            Object.keys(locationFilter).length > 0 ? locationFilter : {},
            Object.keys(registrationDateFilter).length > 0 ? registrationDateFilter : {},
            Object.keys(lastUsedDateFilter).length > 0 ? lastUsedDateFilter : {},
          ].filter(condition => Object.keys(condition).length > 0)
        },
      },
      {
        $group: {
          _id: "$_id",
          isActive: { $first: "$isActive" },
          email: { $first: "$email" },
          lock_user: { $first: "$lock_user" },
          country_code: { $first: "$country_code" },
          mobile: { $first: "$mobile" },
          full_name: { $first: "$full_name" },
          mrn_number: { $first: "$mrn_number" },
          gender: { $first: "$gender" },
          dob: { $first: "$dob" },
          portalUserId: { $first: "$portalUserId" },
          createdAt: { $first: "$createdAt" },
          subscriptionDetails: { $first: "$subscriptionDetails" },
          city: { $first: "$location.city" }, 
          country: { $first: "$location.country" }, 
          registrationDate: { $first: "$registrationDate" }, 
          lastLoginTime: { $first: null },
          lastUsedDate: { $first: "$lastUsedDate" }
        },
      },
      {
        $sort: { [sortKey]: sortValue },
      },
      {
        $facet: {
          totalCount: [{ $count: "count" }],
          paginatedResults: limit != 0
            ? [
                { $skip: (page - 1) * limit },
                { $limit: limit * 1 },
              ]
            : [{ $skip: 0 }],
        },
      },
    ];
 
    const result = await ProfileInfo.aggregate(pipeline);
    const totalCount = result[0]?.totalCount[0]?.count || 0;
    let patients = result[0]?.paginatedResults || [];
    const uniquePatientIds = patients.map((p) => p.portalUserId.toString());
    let patientLoginMap = {};
 
    if (uniquePatientIds.length > 0) {
      try {
        const loginResponses = await Promise.all(
          uniquePatientIds.map(async (patientId) => {
            try {
              const response = await httpService.getStaging(
                `superadmin/get-latest-patient-login/`,
                { patientId },
                headers,
                "superadminServiceUrl"
              );
              return { patientId, data: response?.data || null };
            } catch (error) {
              return { patientId, data: null };
            }
          })
        );
        patientLoginMap = loginResponses.reduce((acc, { patientId, data }) => {
          acc[patientId] = data ? data.lastLoginTime : null;
          return acc;
        }, {});
      } catch (error) {
        console.error("Error fetching patient login data:", error);
      }
    }
 
    patients = patients.map((patient) => ({
      ...patient,
      lastLoginTime: patientLoginMap[patient.portalUserId?.toString()] || "No Login Data",
    }));
    
    if (lastLoginFromDate && lastLoginToDate) {
      const fromDateObj = new Date(`${lastLoginFromDate} 00:00:00`);
      const toDateObj = new Date(`${lastLoginToDate} 23:59:59`);
      
      patients = patients.filter(patient => {
        if (patient.lastLoginTime === "No Login Data") return false;
        const loginDate = new Date(patient.lastLoginTime);
        return loginDate >= fromDateObj && loginDate <= toDateObj;
      });
    }
    
    const uniquePlanIds = [...new Set(
      patients
        .filter((p) => p.subscriptionDetails?.subscriptionPlanId)
        .map((p) => p.subscriptionDetails.subscriptionPlanId)
    )];
    let planDetailsMap = {};
    if (uniquePlanIds.length > 0) {
      try {
        const plansResponse = await httpService.getStaging(
          `superadmin/get-subscription-plan/`,
          { planIds: uniquePlanIds },
          headers,
          "superadminServiceUrl"
        );
        if (plansResponse.status && Array.isArray(plansResponse.body)) {
          planDetailsMap = plansResponse.body.reduce((acc, plan) => {
            acc[plan._id] = {
              plan_name: plan.plan_name,
              services: plan.services,
              price_per_member: plan.price_per_member,
              plan_duration: plan.plan_duration,
            };
            return acc;
          }, {});
        }
      } catch (error) {
        console.error("Error fetching subscription plans:", error.message);
      }
    }
    patients = patients.map((patient) => ({
      ...patient,
      subscriptionPlan: planDetailsMap[patient.subscriptionDetails?.subscriptionPlanId] || null,
    }));
    
    return sendResponse(req, res, 200, {
      status: true,
      body: {
        totalRecords: totalCount,
        currentPage: page,
        totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
        data: patients,
      },
      message: "All patient list",
      errorCode: null,
    });
 
  } catch (error) {
    console.error(error);
    return sendResponse(req, res, 500, { status: false, message: "Internal server error", errorCode: null });
  }
}






  //A Notification Publishing Page that allows writing content and sending it as a push notification, SMS, or email to all users.
  async getAllPatientForSuperAdminNewToNotify(req, res) {

    try {
      const { searchText, fromDate, toDate, sort, gender, subscriptionPlan } =
        req.query;

      let searchText_filter = [{}];
      if (searchText) {
        searchText_filter = [
          { full_name: { $regex: searchText, $options: "i" } },
          { last_name: { $regex: searchText, $options: "i" } },
          { email: { $regex: searchText, $options: "i" } },
          { mobile: { $regex: searchText, $options: "i" } },
        ];
      }

      let date_filter = {};
      if (fromDate && toDate) {
        const fromDateObj = new Date(`${fromDate} 00:00:00`);
        const toDateObj = new Date(`${toDate} 23:59:59`);
        date_filter = { createdAt: { $gte: fromDateObj, $lte: toDateObj } };
      }

      let sortKey = "createdAt";
      let sortValue = -1;
      if (sort) {
        sortKey = sort.split(":")[0];
        sortValue = sort.split(":")[1];
      }
      

      let match_filter = {
        isDeleted: false,
        // isFamilyMember: false,
        $or: searchText_filter,
        $and: [date_filter],
      };

      // Apply gender filter
      if (gender && gender !== "Both") {
        match_filter.gender = gender;
      }

      // Apply subscription plan filter
      if (subscriptionPlan === "true") {
        match_filter["subscriptionDetails.isPlanActive"] = true;
      } else if (subscriptionPlan === "false") {
        match_filter["subscriptionDetails.isPlanActive"] = false;
      }

      const pipeline = [
        {
          $lookup: {
            from: "portalusers",
            localField: "for_portal_user",
            foreignField: "_id",
            as: "portalusers",
          },
        },
        { $unwind: "$portalusers" },
        {
          $addFields: {
            isDeleted: "$portalusers.isDeleted",
            email: "$portalusers.email",
            isActive: "$portalusers.isActive",
            lock_user: "$portalusers.lock_user",
            country_code: "$portalusers.country_code",
            mobile: "$portalusers.mobile",
            portalUserId: "$portalusers._id",
            subscriptionDetails: "$portalusers.subscriptionDetails",
            //Ensure dob is a valid date using $convert
            dobDate: {
              $convert: {
                input: "$dob",
                to: "date",
                onError: null, // If conversion fails, set to null
                onNull: null,  // If null, keep as null
              },
            },
          },
        },
        {
          $addFields: {
            age: {
              $cond: {
                if: { $ne: ["$dobDate", null] },
                then: {
                  $floor: {
                    $divide: [
                      { $subtract: [new Date(), "$dobDate"] },
                      1000 * 60 * 60 * 24 * 365.25, // Convert milliseconds to years
                    ],
                  },
                },
                else: null, // If dob is not a valid date, set age to null
              },
            },
          },
        },
        { $match: match_filter },
        { $sort: { [sortKey]: Number(sortValue) } },
      
        {
          $group: {
            _id: "$_id",
            isActive: { $first: "$isActive" },
            email: { $first: "$email" },
            lock_user: { $first: "$lock_user" },
            country_code: { $first: "$country_code" },
            mobile: { $first: "$mobile" },
            full_name: { $first: "$full_name" },
            mrn_number: { $first: "$mrn_number" },
            gender: { $first: "$gender" },
            dob: { $first: "$dobDate" },
            age: { $first: "$age" }, //Include age in output
            portalUserId: { $first: "$portalUserId" },
            createdAt: { $first: "$createdAt" },
            subscriptionDetails: { $first: "$subscriptionDetails" },
          },
        },
        {
          $facet: {
            totalCount: [{ $count: "count" }],
            paginatedResults: [{ $skip: 0 }],
          },
        },
      ];
      

      const result = await ProfileInfo.aggregate(pipeline);
      const totalCount = result[0]?.totalCount[0]?.count || 0;
      let patients = result[0]?.paginatedResults || [];

      return sendResponse(req, res, 200, {
        status: true,
        body: {
          totalRecords: totalCount,
          data: patients,
        },
        message: "Filtered patient list",
        errorCode: null,
      });
    } catch (error) {
      console.error("Error fetching patients:", error);
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Internal server error",
        errorCode: null,
      });
    }
  }

  async deletePatientDocs(req, res) {
    try {
      const { patientId, documentId } = req.body;
      await Medical_document.deleteOne({
        for_portal_user: patientId,
        _id: documentId,
      });
      return sendResponse(req, res, 200, {
        status: true,
        body: null,
        message: `successfully deleted`,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "failed to fetch hospital staff list",
        errorCode: "INTERNAL_SERVER_ERROR",
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
      } = req.body;

      const addObject = {
        created_by_type,
        created_by,
        content,
        url,
        for_portal_user,
        title,
        appointmentId,
      };
      const notificationValue = new Notification(addObject);
      await notificationValue.save();

      return sendResponse(req, res, 200, {
        status: true,
        message: `notification save in database successfully`,
        body: null,
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
  async setProfilePermission(req, res) {
    try {
      const { doctor_id, patient_id, permission } = req.body;

      const checkExist = await ProfilePermission.find({
        doctor_id: { $eq: doctor_id },
        patient_id: { $eq: patient_id },
      });
      let personalDetails;
      if (checkExist.length > 0) {
        personalDetails = await ProfilePermission.findOneAndUpdate(
          { doctor_id: { $eq: doctor_id }, patient_id: { $eq: patient_id } },
          {
            $set: {
              permission,
            },
          },
          { new: true }
        ).exec();
      } else {
        const data = new ProfilePermission({
          doctor_id,
          patient_id,
          permission,
        });
        personalDetails = await data.save();
      }

      return sendResponse(req, res, 200, {
        status: true,
        body: personalDetails,
        message: `permissions saved successfully`,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: error.message ? error.message : `failed to set permissions`,
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async getProfilePermission(req, res) {
    try {
      const { doctor_id, patient_id } = req.query;

      const data = await ProfilePermission.find({
        doctor_id: { $eq: doctor_id },
        patient_id: { $eq: patient_id },
      }).select({ permission: 1, _id: 0 });
      return sendResponse(req, res, 200, {
        status: true,
        body: data,
        message: `permissions fetched successfully`,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: error.message ? error.message : `failed to get permissions`,
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async addMedicineOnWaitingRoom(req, res) {
    const { patient_id, current_medicines } = req.body;
    try {
      const medicineData = await Medicine_info.findOneAndUpdate(
        { for_portal_user: patient_id },
        {
          $set: {
            current_medicines,
          },
        },
        { new: true }
      ).exec();
      return sendResponse(req, res, 200, {
        status: true,
        body: {
          medicineData,
        },
        message: "medicine details updated successfully",
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: error.message
          ? error.message
          : `failed to update medicine details `,
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async editMedicineOnWaitingRoom(req, res) {
    const { patient_id, medicine, medicine_id } = req.body;
    try {
      const medicineData = await Medicine_info.findOneAndUpdate(
        { for_portal_user: patient_id, "current_medicines._id": medicine_id },
        {
          $set: {
            "current_medicines.$": medicine,
          },
        },
        { new: true }
      ).exec();
      sendResponse(req, res, 200, {
        status: true,
        body: {
          medicineData,
        },
        message: "medicine details updated successfully",
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: error.message
          ? error.message
          : `failed to update medicine details `,
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getAllRatingReviewByGivenByPatient(req, res) {
    const { patientId } = req.query;
    const headers = {
      Authorization: req.headers["authorization"],
    };
    try {
      let sort = req.query.sort;
      let keynew = "";
      let value = "";
      let sortingarray = {};
      if (sort != "undefined" && sort != "" && sort != undefined) {
        keynew = sort.split(":")[0];
        value = sort.split(":")[1];
        sortingarray[keynew] = value;
      } else {
        sortingarray["createdAt"] = -1;
      }
      const hospitalData = await httpService.getStaging(
        "patient/get-rating-review-by-patient",
        { patientId },
        headers,
        "hospitalServiceUrl"
      );

      const pharmacyData = await httpService.getStaging(
        "pharmacy/get-review-and-rating-by-patient",
        { patientId },
        headers,
        "pharmacyServiceUrl"
      );

      let finalArray = [...hospitalData?.data, ...pharmacyData?.data];

      if (keynew == "date") {
        if (value == "asc") {
          finalArray.sort((a, b) => new Date(a.date) - new Date(b.date));
        } else {
          finalArray.sort((a, b) => new Date(b.date) - new Date(a.date));
        }
      }

      if (keynew == "name") {
        if (value == "asc") {
          finalArray.sort((a, b) => {
            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;
            return 0;
          });
        } else {
          finalArray.sort((a, b) => {
            if (a.name > b.name) return -1;
            if (a.name < b.name) return 1;
            return 0;
          });
        }
      }

      return sendResponse(req, res, 200, {
        status: true,
        body: finalArray,
        message: "rating & reviews fetched successfully",
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: error.message
          ? error.message
          : `Failed to fetch rating & reviews `,
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async SearchAnyPortaluserBySearchKeyword(req, res) {
    const { searchKey, lat, long } = req.query;
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };
      const pharmacydata = await httpService.postStaging(
        "pharmacy/advance-search-pharmacy-list",
        {
          pharmacy_name: searchKey,
          city: "",
          province: "",
          department: "",
          neighborhood: "",
          onDutyStatus: "",
          openingHoursStatus: "",
          long: long,
          lat: lat,
          limit: 10,
          page: 1,
          rating: "",
          medicinesOrder: "",
          medicinePrice: "",
          medicineAvailability: "",
          spokenLang: "",
          partner: "",
          currentTimeStamp: "2023-04-11T05:07:34.645Z",
        },
        headers,
        "pharmacyServiceUrl"
      );

      const searchlist = pharmacydata.data.result.map((singleData) => ({
        _id: singleData._id,
        name: singleData.pharmacy_name,
        portal_type: "Pharmacy",
        type: "pharmacy",
      }));

      pharmacydata.data.result = searchlist;

      const doctordata = await httpService.postStaging(
        "hospital-doctor/advance-doctor-filter",
        {
          searchText: searchKey,
          city: "",
          neighborhood: "",
          long: long,
          lat: lat,
          province: "",
          department: "",
          consultationFeeStart: 0,
          consultationFeeEnd: "",
          consultationFeeSort: "",
          appointmentType: [],
          doctorAvailability: "",
          ratingSort: "",
          doctorYearOfExperienceSort: "",
          doctorGender: [],
          onDutyDoctor: "",
          openNow: "",
          spokenLanguage: "",
          page: 1,
          limit: 10,
          currentTimeStamp: "",
        },
        headers,
        "hospitalServiceUrl"
      );

      doctordata.data.result.map((singleData) =>
        pharmacydata.data.result.push({
          _id: singleData._id,
          name: singleData.doctorFullName,
          portal_type: "Doctor",
          type: "doctor",
        })
      );

      const hospitaldata = await httpService.postStaging(
        "hospital/advance-hospital-filter",
        {
          searchText: searchKey,
          city: "",
          neighborhood: "",
          long: long,
          lat: lat,
          province: "",
          department: "",
          currentTimeStamp: "",
          consultationFeeStart: 0,
          consultationFeeEnd: "",
          consultationFee: "",
          appointmentType: [],
          rating: "",
          experience: "",
          Opne24Hour: "",
          hospitalType: [],
          doctorGender: [],
          spokenLanguage: "",
          partner: "",
          openNow: "",
          onDutyHospital: "",
          isAvailableDate: "",
          page: 1,
          limit: 10,
        },
        headers,
        "hospitalServiceUrl"
      );

      hospitaldata.data.result.map((singleData) =>
        pharmacydata.data.result.push({
          _id: singleData._id,
          name: singleData.hospitalName,
          portal_type: "Hospital",
          type: "hospital",
        })
      );

      const fourPortalData = await httpService.postStaging(
        "labradio/four-portal-management-advFilters",
        {
          long: long,
          lat: lat,
          searchText: searchKey,
          province: "",
          department: "",
          city: "",
          neighborhood: "",
          consultationFeeSort: "",
          ratingSort: "",
          portalYearOfExperienceSort: "",
          portalGender: [],
          spokenLanguage: "",
          appointmentType: [],
          onDutyPortal: "",
          openNow: "",
          portalAvailability: "",
          consultationFeeStart: 0,
          consultationFeeEnd: "",
          currentTimeStamp: "",
          page: 1,
          limit: 10,
          type: "",
        },
        headers,
        "labradioServiceUrl"
      );

      fourPortalData.data.result.map((singleData) =>
        pharmacydata.data.result.push({
          _id: singleData._id,
          name: singleData.portal_full_name,
          portal_type: singleData.portal_type,
          type: "fourPortal",
        })
      );

      return sendResponse(req, res, 200, {
        status: true,
        data: pharmacydata,
        message: `Successfully fetched user list`,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        data: error,
        message: `Failed to fetch list`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async vitalsList(req, res) {
    const {
      patientId,
      appointmentId,
      fromDate,
      toDate,
      limit,
      page,
      isCompare,
    } = req.query;
    try {
      let date_filter = {};
      let appointment_filter = {};
      let vital_filter = { is_deleted: false };

      if (appointmentId) {
        appointment_filter = {
          appointment_id: mongoose.Types.ObjectId(appointmentId),
        };
      }

      if (isCompare && fromDate && toDate) {
        const fromDateObj = new Date(fromDate);
        const toDateObj = new Date(toDate);
        date_filter = {
          createdAt: { $in: [fromDateObj, toDateObj] },
        };
      } else if (fromDate && toDate) {
        const fromDateObj = new Date(`${fromDate} 00:00:00`);
        const toDateObj = new Date(`${toDate} 23:59:59`);
        date_filter = {
          createdAt: { $gte: fromDateObj, $lte: toDateObj },
        };
      } else if (fromDate) {
        const fromDateObj = new Date(`${fromDate} 00:00:00`);
        const toDateObj = new Date(`${fromDate} 23:59:59`);
        date_filter = {
          createdAt: { $gte: fromDateObj, $lte: toDateObj },
        };
      }

      const pipeline = [
        {
          $match: {
            for_portal_user: mongoose.Types.ObjectId(patientId),
            $and: [date_filter, appointment_filter, vital_filter],
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $facet: {
            averages: [
              {
                $group: {
                  _id: null,
                  averageHeartRate: { $avg: { $toDouble: "$h_rate" } },
                  averageBMI: { $avg: { $toDouble: "$bmi" } },
                  averageBpSystolic: { $avg: { $toDouble: "$bp_systolic" } },
                  averageBpDiastolic: { $avg: { $toDouble: "$bp_diastolic" } },
                  averagePulse: { $avg: { $toDouble: "$pulse" } },
                  averageTemperature: { $avg: { $toDouble: "$temp" } },
                  averageBloodGlucose: {
                    $avg: { $toDouble: "$blood_glucose" },
                  },
                  totalCount: { $sum: 1 },
                },
              },
            ],
            totalCount: [
              {
                $count: "count",
              },
            ],
            paginatedResults:
              limit && page
                ? [{ $skip: (page - 1) * limit }, { $limit: limit * 1 }]
                : [],
          },
        },
      ];

      const result = await Vital_info.aggregate(pipeline);
      let totalCount = 0;
      if (
        result[0] &&
        result[0].totalCount &&
        result[0].totalCount.length > 0
      ) {
        totalCount = result[0].totalCount[0].count;
      }
      return sendResponse(req, res, 200, {
        status: true,
        data: {
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
          totalRecords: totalCount,
          result: result[0] ? result[0].paginatedResults : [],
          average: result[0] ? result[0].averages : [],
        },
        message: `Successfully fetched vitals list`,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        data: error,
        message: `Failed to fetch list`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async sendInvitation(req, res) {
    try {
      const {
        first_name,
        last_name,
        email,
        phone,
        address,
        created_By,
        portalmessage,
        portalname,
        invitationId,
        dateofcreation,
      } = req.body;
      if (invitationId) {
        const updatedUserData = await Invitation.findOneAndUpdate(
          { _id: invitationId },
          {
            $set: {
              first_name,
              last_name,
              email,
              phone,
              address,
              created_By,
              verify_status: "PENDING",
            },
          },
          { new: true }
        );

        if (updatedUserData) {
          const loggedInData = await ProfileInfo.find({
            for_portal_user: created_By,
          });
          const loggeInname = loggedInData[0].full_name;
          const content = sendMailInvitations(
            email,
            first_name,
            last_name,
            loggeInname,
            portalmessage,
            portalname
          );

          const mailSent = await sendEmail(content);

          if (mailSent) {
            updatedUserData.verify_status = "SEND";
            await updatedUserData.save();
          }
          return sendResponse(req, res, 200, {
            status: true,
            data: updatedUserData,
            message: `Invitation Send successfully`,
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
        let userData = await Invitation.findOne({
          email,
          verify_status: "PENDING",
        });

        if (!userData) {
          userData = new Invitation({
            first_name,
            last_name,
            email,
            phone,
            address,
            created_By,
            dateofcreation,
            verify_status: "PENDING",
          });
          userData = await userData.save();
        }

        const loggedInData = await ProfileInfo.find({
          for_portal_user: created_By,
        });
        const loggeInname = loggedInData[0].full_name;
        const content = sendMailInvitations(
          email,
          first_name,
          last_name,
          loggeInname,
          portalmessage,
          portalname
        );

        const mailSent = await sendEmail(content);

        if (mailSent) {
          userData.verify_status = "SEND";
          await userData.save();
        }

        if (userData) {
          return sendResponse(req, res, 200, {
            status: true,
            data: userData,
            message: `Invitation Send successfully`,
            errorCode: null,
          });
        } else {
          return sendResponse(req, res, 200, {
            status: false,
            data: null,
            message: `Invitation Not Sent`,
            errorCode: null,
          });
        }
      }
    } catch (err) {
      return sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `Failed to fetch list`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getAllInvitation(req, res) {
    try {
      const {
        for_portal_user,
        page,
        limit,
        searchKey,
        createdDate,
        updatedDate,
      } = req.query;

      let sort = req.query.sort;
      let sortingarray = {};
      if (sort != "undefined" && sort != "" && sort != undefined) {
        let keynew = sort.split(":")[0];
        let value = sort.split(":")[1];
        sortingarray[keynew] = value;
      } else {
        sortingarray["createdAt"] = -1;
      }

      const filter = {};

      if (searchKey && searchKey !== "") {
        filter.$or = [{ first_name: { $regex: searchKey } }];
      }

      let dateFilter = {};
      if (
        createdDate &&
        createdDate !== "" &&
        updatedDate &&
        updatedDate !== ""
      ) {
        const createdDateObj = new Date(createdDate);
        const updatedDateObj = new Date(updatedDate);
        dateFilter.createdAt = { $gte: createdDateObj, $lte: updatedDateObj };
      } else if (createdDate && createdDate !== "") {
        const createdDateObj = new Date(createdDate);
        dateFilter.createdAt = { $gte: createdDateObj };
      } else if (updatedDate && updatedDate !== "") {
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

  async deleteInvitation(req, res) {
    try {
      const { id } = req.body;
      const result = await Invitation.deleteOne({
        _id: mongoose.Types.ObjectId(id),
      });

      return sendResponse(req, res, 200, {
        status: true,
        data: result,
        message: `Invitation Deleted successfully`,
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

  async getInvitationById(req, res) {
    try {
      const { id } = req.query;
      const result = await Invitation.findOne({
        _id: mongoose.Types.ObjectId(id),
      });

      return sendResponse(req, res, 200, {
        status: true,
        data: result,
        message: `Invitation Send successfully`,
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

  async addImmunization_SuperAdmin(req, res) {
    try {
      const { immunizationArray, added_by } = req.body;
      const list = immunizationArray.map((singleData) => ({
        ...singleData,
        added_by,
      }));
      const namesToFind = list.map((item) => item.name);
      const foundItems = await ImmunizationList.find({
        name: { $in: namesToFind },
      });
      const CheckData = foundItems.map((item) => item.name);
      if (foundItems.length == 0) {
        const savedImmunization = await ImmunizationList.insertMany(list);
        return sendResponse(req, res, 200, {
          status: true,
          body: savedImmunization,
          message: "Successfully add ImmunizationList",
          errorCode: null,
        });
      } else {
        return sendResponse(req, res, 200, {
          status: false,
          message: `${CheckData} Already Exist`,
          errorCode: null,
        });
      }
    } catch (error) {
      console.error("An error occurred:", error);
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to add ImmunizationList",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async allImmunizationList(req, res) {
    try {
      const { limit, page, searchText } = req.query;
      let sort = req.query.sort;
      let sortingarray = {};
      if (sort != "undefined" && sort != "" && sort != undefined) {
        let keynew = sort.split(":")[0];
        let value = sort.split(":")[1];
        sortingarray[keynew] = value;
      } else {
        sortingarray["createdAt"] = -1;
      }
      let filter = { delete_status: false };
      if (searchText != "") {
        filter = {
          delete_status: false,
          name: { $regex: searchText || "", $options: "i" },
        };
      }
      const immunizationlist = await ImmunizationList.find(filter)
        .sort(sortingarray)
        .skip((page - 1) * limit)
        .limit(limit * 1)
        .exec();
      const count = await ImmunizationList.countDocuments(filter);
      return sendResponse(req, res, 200, {
        status: true,
        body: {
          totalCount: count,
          data: immunizationlist,
        },
        message: "Successfully get ImmunizationList list",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get ImmunizationList list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async updateImmunization(req, res) {
    try {
      const { immunizationId, name, active_status, delete_status } = req.body;
      const list = await ImmunizationList.find({
        name: name,
        active_status: active_status,
        _id: { $ne: mongoose.Types.ObjectId(immunizationId) },
        is_deleted: false,
      });
      if (list.length == 0) {
        const updateImmunization = await ImmunizationList.updateOne(
          { _id: immunizationId },
          {
            $set: {
              name,
              active_status,
              delete_status,
            },
          },
          { new: true }
        ).exec();
        return sendResponse(req, res, 200, {
          status: true,
          body: updateImmunization,
          message: "Successfully updated Immunization",
          errorCode: null,
        });
      } else {
        return sendResponse(req, res, 200, {
          status: false,
          message: "Immunization already exist",
          errorCode: null,
        });
      }
    } catch (err) {
      return sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to update Immunization`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async actionOnImmunization(req, res) {
    try {
      const { immunizationId, action_name, action_value } = req.body;
      let message = "";

      const filter = {};
      if (action_name == "active") filter["active_status"] = action_value;
      if (action_name == "delete") filter["delete_status"] = action_value;

      if (action_name == "active") {
        await ImmunizationList.updateOne(
          { _id: immunizationId },
          filter,
          { new: true }
        ).exec();

        message =
          action_value == true
            ? "Successfully Active Immunization"
            : "Successfully In-active Immunization";
      }

      if (action_name == "delete") {
        if (immunizationId == "") {
          await ImmunizationList.updateMany(
            { delete_status: { $eq: false } },
            {
              $set: { delete_status: true },
            },
            { new: true }
          );
        } else {
          await ImmunizationList.updateMany(
            { _id: { $in: immunizationId } },
            {
              $set: { delete_status: true },
            },
            { new: true }
          );
        }
        message = "Successfully Immunization deleted";
      }

      return sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: message,
        errorCode: null,
      });
    } catch (err) {
      return sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to Immunization done`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async allImmunizationListforexport(req, res) {
    const { searchText, limit, page } = req.query;
    let filter;
    if (searchText == "") {
      filter = {
        delete_status: false,
      };
    } else {
      filter = {
        delete_status: false,
        name: { $regex: searchText || "", $options: "i" },
      };
    }
    try {
      let result = "";
      if (limit > 0) {
        result = await ImmunizationList.find(filter)
          .sort([["createdAt", -1]])
          .skip((page - 1) * limit)
          .limit(limit * 1)
          .exec();
      } else {
        result = await ImmunizationList.aggregate([
          {
            $match: filter,
          },
          { $sort: { createdAt: -1 } },
          {
            $project: {
              _id: 0,
              name: "$name",
            },
          },
        ]);
      }
      let array = result.map((obj) => Object.values(obj));
      return sendResponse(req, res, 200, {
        status: true,
        data: {
          result,
          array,
        },
        message: `Immunization added successfully`,
        errorCode: null,
      });
    } catch (err) {
      return sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to add Immunization`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async uploadCSVForImmunization(req, res) {
    try {
      const filePath = "./uploads/" + req.filename;
      const data = await processExcel(filePath);

      const isValidFile = validateColumnWithExcel(ImmunizationColumns, data[0]);
      fs.unlinkSync(filePath);

      if (!isValidFile) {
        return sendResponse(req, res, 500, {
          status: false,
          body: isValidFile,
          message: "Invalid excel sheet! column not matched.",
          errorCode: null,
        });
        return;
      }

      const existingimmunizations = await ImmunizationList.find({}, "name");
      const existingImmunizationNames = existingimmunizations.map(
        (center) => center.name
      );

      const inputArray = [];
      const duplicateImmunization = [];

      for (const singleData of data) {
        const trimmedImmunization = singleData.name.trim();
        if (existingImmunizationNames.includes(trimmedImmunization)) {
          duplicateImmunization.push(trimmedImmunization);
        } else {
          inputArray.push({
            name: trimmedImmunization,
            added_by: req.body.added_by,
          });
        }
      }

      if (duplicateImmunization.length > 0) {
        return sendResponse(req, res, 400, {
          status: false,
          body: null,
          message: `Health centers already exist: ${duplicateImmunization.join(
            ", "
          )}`,
          errorCode: null,
        });
      }

      if (inputArray.length > 0) {
        const result = await ImmunizationList.insertMany(inputArray);
        return sendResponse(req, res, 200, {
          status: true,
          body: result,
          message: "All immunization records added successfully",
          errorCode: null,
        });
      } else {
        return sendResponse(req, res, 200, {
          status: true,
          body: null,
          message: "No new immunization added",
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

  async getPatienthavingFCMtoken(req, res) {
    try {

      const usersWithFCMToken = await PortalUser.find({
        fcmToken: { $exists: true, $ne: null },
      });

      if (usersWithFCMToken.length === 0) {
        return sendResponse(req, res, 404, {
          status: false,
          body: [],
          message: "No users with FCM tokens found",
          errorCode: null,
        });
      }

      return sendResponse(req, res, 200, {
        status: true,
        body: usersWithFCMToken,
        message: "Users with FCM tokens retrieved successfully",
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

  async getNotification(req, res) {
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };
      const { page, limit } = req.query;
      const getData = await Notification.find({
        for_portal_user: mongoose.Types.ObjectId(req.query.for_portal_user),
      })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit * 1)
        .exec();

      const count = await Notification.countDocuments({
        for_portal_user: mongoose.Types.ObjectId(req.query.for_portal_user),
        new: true,
      });

      const isViewcount = await Notification.countDocuments({
        for_portal_user: mongoose.Types.ObjectId(req.query.for_portal_user),
        isView: false,
      });

      const totalCount = await Notification.countDocuments({
        for_portal_user: mongoose.Types.ObjectId(req.query.for_portal_user),
      });

      let newnotificationlist = [];
      if (getData.length > 0) {
        for await (const element of getData) {
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
          if (element.created_by_type == "doctor") {
            let ids = element.created_by;
            let resData = await httpService.getStaging(
              "doctor2/get-portal-user-data",
              { data: ids },
              headers,
              "doctorServiceUrl"
            );
            object.name = resData?.data[0]?.full_name;
            object.picture = "";
            newnotificationlist.push(object);
          } else {
            object.name = "";
            object.picture = "";
            newnotificationlist.push(object);
          }
        }
      }

      return sendResponse(req, res, 200, {
        status: true,
        body: {
          list: newnotificationlist,
          count: count,
          isViewcount: isViewcount,
          totalCount: totalCount,
        },
        message: "List fetched successfully",
      });
    } catch (err) {
      return sendResponse(req, res, 500, {
        status: false,
        body: err,
        message: "Internal server error",
      });
    }
  }

  async updateNotification(req, res) {
    try {
      const { receiverId, isnew } = req.body;
      if (!isnew) {
        let notificationDetails = await Notification.updateMany(
          { for_portal_user: { $eq: receiverId } },
          {
            $set: {
              new: false,
            },
          },
          { upsert: false, new: true }
        ).exec();
        return sendResponse(req, res, 200, {
          status: true,
          body: notificationDetails,
          message: `Notification updated successfully`,
          errorCode: null,
        });
      }
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `failed to update notification list`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async markAllReadNotification(req, res) {
    try {
      const { sender } = req.body;
      const update = await Notification.updateMany(
        { for_portal_user: { $in: [mongoose.Types.ObjectId(sender)] } },
        { $set: { isView: true } },
        { new: true }
      );

      return sendResponse(req, res, 200, {
        status: true,
        body: update,
        message: "Mark All Read successfully",
      });
    } catch (err) {
      return sendResponse(req, res, 500, {
        status: false,
        body: err,
        message: "Internal server error",
      });
    }
  }

  async markReadNotificationByID(req, res) {
    try {
      const { _id } = req.body;
      let updateNotification = await Notification.updateOne(
        { _id: mongoose.Types.ObjectId(_id) },
        { $set: { isView: true } },
        { new: true }
      );

      return sendResponse(req, res, 200, {
        status: true,
        body: updateNotification,
        message: "Mark All Read successfully",
      });
    } catch (err) {
      return sendResponse(req, res, 500, {
        status: false,
        body: err,
        message: "Internal server error",
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
      return sendResponse(req, res, 200, {
        status: true,
        body: updatedNotification,
        message: "Successfully updated notification status",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to update notification",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getPortalData(req, res) {
    try {
      let result = await PortalUser.find({
        _id: mongoose.Types.ObjectId(req.query.data),
        isDeleted: false,
      }).exec();

      return sendResponse(req, res, 200, {
        status: true,
        data: result,
        message: `portal data fetch successfully`,
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

  async getProfileInfoData(req, res) {
    try {
      let result = await ProfileInfo.findOne({
        for_portal_user: mongoose.Types.ObjectId(req.query.data),
      }).exec();
      return sendResponse(req, res, 200, {
        status: true,
        data: result,
        message: `portal data fetch successfully`,
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

  async getIDbyImmunization(req, res) {
    try {
      let getData = await Immunization_info.findOne({
        _id: mongoose.Types.ObjectId(req.query._id),
      });

      return sendResponse(req, res, 200, {
        status: true,
        data: getData,
        message: `Immunization details.`,
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
  async getQRcodeScanData(req, res) {
    const { _id } = req.query;
    try {
      let result;
      result = await Immunization_info.findOne({
        _id: mongoose.Types.ObjectId(_id),
      });

      let environvent = process.env.NODE_ENV;
      let url = process.env.test_p_FRONTEND_URL;

      if (result) {
        if (environvent == "local") {
          res.redirect(`http://localhost:4200/patient/vaccination-card/${_id}`);
        } else {
          res.redirect(`${url}/patient/vaccination-card/${_id}`);
        }
      } else {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "Not Found!!",
          errorCode: null,
        });
      }
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to get",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getListofFamilyMember(req, res) {
    try {
      const { patient_id } = req.query;
      const getData = await Family_info.findOne({
        for_portal_user: mongoose.Types.ObjectId(patient_id),
      });

      let result = [];

      if (getData) {
        if (getData.family_members.length > 0) {
          result = getData.family_members
            .filter((ele) => !ele.isDeleted)
            .map((ele) => ({
              name: ele.first_name + " " + ele.last_name,
              userId: ele.familyMemberId,
              relation: ele.relationship,
            }));
        }

        return sendResponse(req, res, 200, {
          status: true,
          data: result,
          message: `Family Member List Fetched.`,
          errorCode: null,
        });
      } else {
        return sendResponse(req, res, 500, {
          status: false,
          message: "No Family Member Added",
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

  async deleteFamilyMember(req, res) {
    try {
      const { patient_id, familyMemberId } = req.body;
      const getData = await Family_info.findOne({
        for_portal_user: mongoose.Types.ObjectId(patient_id),
      });

      if (!getData) {
        return sendResponse(req, res, 404, {
          status: false,
          data: null,
          message: `Patient's data not found.`,
          errorCode: "PATIENT_NOT_FOUND",
        });
      }

      let familyMember = getData.family_members.find((member) =>
        member.familyMemberId.equals(mongoose.Types.ObjectId(familyMemberId))
      );

      if (!familyMember) {
        return sendResponse(req, res, 404, {
          status: false,
          data: null,
          message: `Family member not found.`,
          errorCode: "FAMILY_MEMBER_NOT_FOUND",
        });
      }

      familyMember.isDeleted = true;

      let dataUpdate = await getData.save();

      if (dataUpdate) {
        await PortalUser.findOneAndUpdate(
          { _id: mongoose.Types.ObjectId(familyMember.familyMemberId) },
          {
            $set: {
              isDeleted: true,
            },
          },
          { new: true }
        ).exec();
        return sendResponse(req, res, 200, {
          status: true,
          data: {},
          message: `Family member deleted successfully.`,
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

  async addPreferredPharmacy(req, res) {
    try {
      const { patientId, pharmacyId, assignedDate } = req.body;

      const getPatient = await ProfileInfo.find({
        for_portal_user: { $eq: patientId },
      }).select("preferredPharmacy");
      const getData = getPatient[0]?.preferredPharmacy
        ? getPatient[0]?.preferredPharmacy
        : [];
      const addPharmacy = {
        assignedDate,
        pharmacyId,
      };
      getData.push(addPharmacy);
      await ProfileInfo.findOneAndUpdate(
        { for_portal_user: patientId },
        {
          $set: {
            preferredPharmacy: getData,
          },
        }
      );
      return sendResponse(req, res, 200, {
        status: true,
        body: null,
        message: "This pharmacy added successfully as preferred pharmacy.",
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to add preferred pharmacy",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async getPreferredPharmacy(req, res) {
    try {
      const { id } = req.params;
      const headers = {
        Authorization: req.headers["authorization"],
      };
      const getPatient = await ProfileInfo.find({
        for_portal_user: { $eq: id },
      }).select("preferredPharmacy");
      const pharmacyIds = getPatient[0]?.preferredPharmacy
        ? getPatient[0]?.preferredPharmacy.map((val) => val?.pharmacyId)
        : [];
      let pharmacyDetails = [];
      if (pharmacyIds.length > 0) {
        const getData = await httpService.getStaging(
          `pharmacy/get-all-pharmacy-admin-details`,
          { pharmacyIDs: pharmacyIds.join(",") },
          headers,
          "pharmacyServiceUrl"
        );
        if (getData.status) {
          pharmacyDetails = getData?.body;
        }
      }
      return sendResponse(req, res, 200, {
        status: true,
        body: pharmacyDetails,
        message:
          pharmacyIds.length > 0
            ? "Data fetched successfully"
            : "No preferred pharmacy found",
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to fetch patient preferred pharmacy",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async removedPreferredPharmacy(req, res) {
    try {
      const { patientId, pharmacyId } = req.body;
      const getPatient = await ProfileInfo.findOne({
        for_portal_user: { $eq: patientId },
      }).select("preferredPharmacy");
      const removedData = getPatient?.preferredPharmacy.filter(
        (val) => val.pharmacyId != pharmacyId
      );
      await ProfileInfo.findOneAndUpdate(
        { for_portal_user: patientId },
        {
          $set: {
            preferredPharmacy: removedData,
          },
        }
      );
      return sendResponse(req, res, 200, {
        status: true,
        message: "Preferred pharmacy removed successfully",
        body: null,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to fetch patient preferred pharmacy",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async deletePatientHistory(req, res) {
    try {
      const { allergyId } = req.body;

      const userData = await History_info.findByIdAndUpdate(
        {
          _id: mongoose.Types.ObjectId(allergyId),
        },
        {
          $set: {
            isDeleted: true,
          },
        },
        { upsert: false, new: true }
      ).exec();
      if (userData) {
        return sendResponse(req, res, 200, {
          status: true,
          data: null,
          message: `Patient's history deleted successfully.`,
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

  async delete_medical_socail_familyHistory(req, res) {
    try {
      const { patient_id, familyMemberId, historyType, index } = req.body;
      const getData = await Family_info.findOne({
        for_portal_user: mongoose.Types.ObjectId(patient_id),
      });

      if (!getData) {
        return sendResponse(req, res, 404, {
          status: false,
          data: null,
          message: `Patient's data not found.`,
          errorCode: "PATIENT_NOT_FOUND",
        });
      }

      let familyMember = getData.family_members.find((member) =>
        member.familyMemberId.equals(mongoose.Types.ObjectId(familyMemberId))
      );

      if (!familyMember) {
        return sendResponse(req, res, 404, {
          status: false,
          data: null,
          message: `Family member not found.`,
          errorCode: "FAMILY_MEMBER_NOT_FOUND",
        });
      }

      if (historyType === "medical_history") {
        if (index < 0 || index >= familyMember.medical_history.length) {
          return sendResponse(req, res, 400, {
            status: false,
            data: null,
            message: `Invalid index for medical history.`,
            errorCode: "INVALID_INDEX",
          });
        }
        familyMember.medical_history.splice(index, 1);
      } else if (historyType === "social_history") {
        if (index < 0 || index >= familyMember.social_history.length) {
          return sendResponse(req, res, 400, {
            status: false,
            data: null,
            message: `Invalid index for social history.`,
            errorCode: "INVALID_INDEX",
          });
        }
        familyMember.social_history.splice(index, 1);
      } else {
        return sendResponse(req, res, 400, {
          status: false,
          data: null,
          message: `Invalid history type.`,
          errorCode: "INVALID_HISTORY_TYPE",
        });
      }

      await getData.save();

      return sendResponse(req, res, 200, {
        status: true,
        data: {},
        message: `Entry deleted successfully.`,
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

  async updateConsultationCount(req, res) {
    try {
      const { patient_id, serviceType, count, isAdd } = req.body;

      let patientId = patient_id;

      const getPatient = await PortalUser.find({
        _id: { $eq: patientId },
        lock_user: false,
        isDeleted: false,
        isActive: true,
        verified: true,
      });

      let existngServices = getPatient[0]?.subscriptionDetails?.services;

      if (isAdd) {
        existngServices[serviceType] =
          parseInt(existngServices[serviceType]) + parseInt(count);
      } else {
        existngServices[serviceType] =
          parseInt(existngServices[serviceType]) - parseInt(count);
      }
      await PortalUser.findOneAndUpdate(
        { _id: { $eq: patientId } },
        {
          $set: {
            subscriptionDetails: {
              ...getPatient[0]?.subscriptionDetails,
              services: existngServices,
            },
          },
        },
        { new: true }
      ).exec();

      return sendResponse(req, res, 200, {
        status: true,
        data: getPatient,
        message: `record updated successfully.`,
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
  async addAssessment(req, res) {
    try {
      const { patientId, assessments } = req.body;

      const addObject = {
        patientId,
        assessments,
      };

      const addAssessment = new Assessment(addObject);
      const result = await addAssessment.save();

      sendResponse(req, res, 200, {
        status: true,
        data: result,
        message: `record added successfully.`,
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

  async getAssessment(req, res) {
    try {
      const { page, limit, patientId, fromDate, toDate } = req.query;
      let filter = { patientId: { $eq: patientId } };
      if (fromDate && toDate) {
        const fromDateObj = new Date(`${fromDate} 00:00:00`);
        const toDateObj = new Date(`${toDate} 23:59:59`);
        filter.createdAt = { $gte: fromDateObj, $lte: toDateObj };
      }
      const getAssessment = await Assessment.find(filter)
        .limit(page && limit ? limit : 1)
        .skip(page && limit ? (page - 1) * limit : 0)
        .sort({ createdAt: -1 });
      const totalCount = await Assessment.find(filter).countDocuments();
      return sendResponse(req, res, 200, {
        status: true,
        data: {
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
          totalRecords: totalCount,
          result: getAssessment,
        },
        message: `record fetched successfully.`,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
        body: error,
        errorCode: null,
      });
    }
  }

  async assignDoctor(req, res) {
    try {
        const { patientId, doctorId, assignedDate } = req.body;
        // Fetch patient record
        const getPatient = await ProfileInfo.findOne({
            for_portal_user: patientId,
        }).select("previousAssignedDoctor");
        let previousAssignedDoctor = getPatient?.previousAssignedDoctor || [];

        previousAssignedDoctor = previousAssignedDoctor.map(doctor => {
            if (doctor.isCurrentAssignedDoctor) {
                return {
                    ...doctor.toObject(),
                    isCurrentAssignedDoctor: false,
                    leftDoctorDate: assignedDate
                };
            }
            return doctor;
        });

        // Update old doctor leftDoctorDate
        await ProfileInfo.updateOne(
            { for_portal_user: patientId, "previousAssignedDoctor.isCurrentAssignedDoctor": true },
            {
                $set: {
                    "previousAssignedDoctor.$.isCurrentAssignedDoctor": false,
                    "previousAssignedDoctor.$.leftDoctorDate": assignedDate
                }
            }
        );

        // Assign new doctor
        const updatedPatient = await ProfileInfo.findOneAndUpdate(
            { for_portal_user: patientId },
            {
                $set: { currentAssignedDoctor: doctorId },
                $push: {
                    previousAssignedDoctor: {
                        assignedDate,
                        doctorId,
                        isCurrentAssignedDoctor: true,
                        leftDoctorDate: null
                    }
                }
            },
            { new: true, runValidators: true }
        );

        return sendResponse(req, res, 200, {
            status: true,
            message: "Doctor assigned successfully.",
            data: updatedPatient,
            errorCode: null,
        });

    } catch (error) {
        console.error("Error in assignDoctor:", error);
        return sendResponse(req, res, 500, {
            status: false,
            message: "Internal server error",
            body: error,
            errorCode: null,
        });
    }
}

  async updatePatientDetails(req, res) {
    try {
      const { patientId, fieldName, fieldValue } = req.body;

      if (fieldName == "address") {
        await Location_info.findOneAndUpdate(
          { for_portal_user: patientId },
          {
            $set: {
              [fieldName]: fieldValue,
            },
          },
          {
            upsert: true, // Insert a new record if none is found
          }
        ).exec();
      } else if (fieldName == "email") {
        const isValidEmail = validateEmail(fieldValue);
        if (!isValidEmail && NODE_ENV == "production") {
          return sendResponse(req, res, 200, {
            status: false,
            message: messages.invalid_disposable_email.en,
            messageArabic: messages.invalid_disposable_email.ar,
            data: null,
            errorCode: null,
          });
        }
        await PortalUser.findOneAndUpdate(
          { _id: patientId },
          {
            $set: {
              [fieldName]: fieldValue,
            },
          }
        );
      } else {
        const result = await ProfileInfo.findOneAndUpdate(
          { for_portal_user: patientId },
          {
            $set: {
              [fieldName]: fieldValue,
            },
          },
          { new: true }
        );
        if (
          fieldName == "first_name" ||
          fieldName == "last_name" ||
          fieldName == "first_name_arabic" ||
          fieldName == "last_name_arabic"
        ) {
          await ProfileInfo.findOneAndUpdate(
            { for_portal_user: patientId },
            {
              $set: {
                full_name: formatString(
                  result?.first_name + " " + result?.last_name
                ),
                full_name_arabic:
                  result?.first_name_arabic || result?.last_name_arabic
                    ? formatString(
                      result?.first_name_arabic +
                      " " +
                      result?.last_name_arabic
                    )
                    : "",
              },
            },
            { new: true }
          );
          await PortalUser.findOneAndUpdate(
            { _id: patientId },
            {
              $set: {
                full_name: formatString(
                  result?.first_name + " " + result?.last_name
                ),
                full_name_arabic:
                  result?.first_name_arabic || result?.last_name_arabic
                    ? formatString(
                      result?.first_name_arabic +
                      " " +
                      result?.last_name_arabic
                    )
                    : "",
              },
            },
            { new: true }
          );
        }
      }

      const getPatientName = await ProfileInfo.findOne({
        for_portal_user: { $eq: patientId },
      }).select("full_name");
      await httpService.postStaging(
        "superadmin/add-logs",
        {
          userId: patientId,
          userName: getPatientName?.full_name,
          role: "patient",
          action: `update`,
          actionDescription: `Patient ${getPatientName?.full_name} updated his profile.`,
        },
        {},
        "superadminServiceUrl"
      );

      return sendResponse(req, res, 200, {
        status: true,
        // message: `${getFieldName(fieldName)} updated successfully.`,
        message: messages.profileUpdated.en,
        messageArabic: messages.profileUpdated.ar,
        data: null,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        message: messages.something_went_wrong.en,
        messageArabic: messages.something_went_wrong.ar,
        body: error,
        errorCode: null,
      });
    }
  }
  async activeLockPatient(req, res) {
    try {
      const { patientId, fieldName, fieldValue } = req.body;

    
      await PortalUser.findOneAndUpdate(
        { _id: patientId },
        {
          $set: {
            [fieldName]: fieldValue,
          },
        }
      );

      return sendResponse(req, res, 200, {
        status: true,
        message: `Patient updated successfully.`,
        data: null,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
        body: error,
        errorCode: null,
      });
    }
  }
  async getAssignedDoctors(req, res) {
    try {
      const { id } = req.params;
      const headers = {
        Authorization: req.headers["authorization"],
      };
      let assignedDoctor = [];
      let currentAssignedDoctor = {};
      const getPatientDetails = await ProfileInfo.findOne({
        for_portal_user: { $eq: id },
      })
        .select("currentAssignedDoctor previousAssignedDoctor")
        .lean();
      if (getPatientDetails?.previousAssignedDoctor) {
        const getDetails = await httpService.postStaging(
          "individual-doctor/get-patient-doctors",
          {
            doctorIds: getPatientDetails.previousAssignedDoctor.map(
              (ids) => ids.doctorId
            ),
            currentDoctorId: getPatientDetails?.currentAssignedDoctor,
          },
          headers,
          "doctorServiceUrl"
        );

        if (getDetails?.status) {
          let dataObject = {};
          for (const data of getDetails?.body?.results) {
            dataObject[data?.for_portal_user?._id] = data;
          }
          assignedDoctor = getPatientDetails?.previousAssignedDoctor.map(
            (data) => {
              data.doctorDetails = dataObject[data?.doctorId];
              return data;
            }
          );
          const getAssingedDate =
            getPatientDetails.previousAssignedDoctor.filter(
              (doctors) => doctors.isCurrentAssignedDoctor
            );
          if (getPatientDetails?.currentAssignedDoctor) {
            currentAssignedDoctor =
              dataObject[getPatientDetails?.currentAssignedDoctor];
            currentAssignedDoctor.assignedDate =
              getAssingedDate[0]?.assignedDate;
            currentAssignedDoctor.totalReview =
              getDetails?.body?.getRatingCount;
          }
        }
      }

      return sendResponse(req, res, 200, {
        status: true,
        message: `Assigned doctor fetched successfully.`,
        data: {
          allAssignedDoctor: assignedDoctor,
          currentAssignedDoctor,
        },
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
        body: error,
        errorCode: null,
      });
    }
  }

  async getAssignedDoctorForFamilyMember(req, res) {
    try {
      const { id } = req.params;
      const headers = {
        Authorization: req.headers["authorization"],
      };
      let assignedDoctor = [];
      let currentAssignedDoctor = {};

      const getPatientDetails = await ProfileInfo.findOne({
        for_portal_user: { $eq: id },
      })
        .select("currentAssignedDoctor previousAssignedDoctor")
        .lean();
      if (getPatientDetails && getPatientDetails?.previousAssignedDoctor) {
        const getDetails = await httpService.postStaging(
          "individual-doctor/get-patient-doctors",
          {
            doctorIds: getPatientDetails.previousAssignedDoctor.map(
              (ids) => ids.doctorId
            ),
            currentDoctorId: getPatientDetails?.currentAssignedDoctor,
          },
          headers,
          "doctorServiceUrl"
        );

        if (getDetails?.status) {
          let dataObject = {};
          for (const data of getDetails?.body?.results) {
            dataObject[data?.for_portal_user?._id] = data;
          }
          assignedDoctor = getPatientDetails?.previousAssignedDoctor.map(
            (data) => {
              data.doctorDetails = dataObject[data?.doctorId];
              return data;
            }
          );
          const getAssingedDate =
            getPatientDetails.previousAssignedDoctor.filter(
              (doctors) => doctors.isCurrentAssignedDoctor
            );
          if (getPatientDetails?.currentAssignedDoctor) {
            currentAssignedDoctor =
              dataObject[getPatientDetails?.currentAssignedDoctor];
            currentAssignedDoctor.assignedDate =
              getAssingedDate[0]?.assignedDate;
            currentAssignedDoctor.totalReview =
              getDetails?.body?.getRatingCount;
          }
        }
      }

      return sendResponse(req, res, 200, {
        status: true,
        message: `Assigned doctor fetched successfully.`,
        data: {
          allAssignedDoctor: assignedDoctor,
          currentAssignedDoctor,
        },
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
        body: error,
        errorCode: null,
      });
    }
  }
  async getPatientSubscriptionDetails(req, res) {
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };
      const { id } = req.params;
      const getData = await PortalUser.findById(id).select(
        "subscriptionDetails"
      );
      let upcomingPlan = {};
      let currentPlan = {};
      if (
        getData?.subscriptionDetails?.nextBillingPlanId &&
        getData?.subscriptionDetails?.subscriptionPlanId
      ) {
        //Get Upcoming subscription plan
        const getSubscription = await httpService.getStaging(
          `superadmin/get-subscription-plan-details`,
          { id: getData?.subscriptionDetails?.nextBillingPlanId },
          headers,
          "superadminServiceUrl"
        );
        if (!getSubscription.status) {
          return sendResponse(req, res, 500, {
            status: false,
            body: null,
            message: getSubscription.message,
            errorCode: null,
          });
        }
        //Get Current subscription plan
        const getCurrentSubscription = await httpService.getStaging(
          `superadmin/get-subscription-plan-details`,
          { id: getData?.subscriptionDetails?.subscriptionPlanId },
          headers,
          "superadminServiceUrl"
        );
        if (!getCurrentSubscription.status) {
          return sendResponse(req, res, 500, {
            status: false,
            body: null,
            message: getCurrentSubscription.message,
            errorCode: null,
          });
        }
        upcomingPlan = {
          planName: getSubscription?.body?.plan_name,
          nextBillingDate: getData?.subscriptionDetails?.period?.end,
        };
        currentPlan = {
          planName: getCurrentSubscription?.body?.plan_name,
          expiredOn: getData?.subscriptionDetails?.period?.end,
        };
      }

      return sendResponse(req, res, 200, {
        status: true,
        message: `Subscription details fetched successfully.`,
        data: {
          subscriptionDetails: getData,
          upcomingPlan,
          currentPlan,
        },
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
        body: error,
        errorCode: null,
      });
    }
  }
  async getPatientProfileCompletionDetails(req, res) {
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };
      const { id } = req.params;
      const getAssessment = await Assessment.findOne({
        patientId: { $eq: id },
      });
      const getPatientData = await ProfileInfo.findOne({
        for_portal_user: { $eq: id },
      })
        .populate({
          path: "for_portal_user",
          select: "email",
        })
        .select(
          "gender dob saudi_id nationality iqama_number passport medicalInformation currentAssignedDoctor"
        );

      let isProfileCompleted = false;
      const gender = getPatientData?.gender;
      const dob = getPatientData?.dob;
      const email = getPatientData?.for_portal_user?.email;
      const nationality = getPatientData?.nationality;
      const saudi_id = getPatientData?.saudi_id;
      const iqama_number = getPatientData?.iqama_number;
      const passport = getPatientData?.passport;
      if (
        getPatientData &&
        gender &&
        dob &&
        email &&
        nationality &&
        (saudi_id || iqama_number || passport)
      ) {
        isProfileCompleted = true;
      }
      //check whether assigned doctor has there any completed appointments
      let canGiveRating = false;
      if (getPatientData?.currentAssignedDoctor) {
        const getData = await httpService.getStaging(
          `appointment/get-doctor-completed-appointents/${getPatientData?.currentAssignedDoctor}`,
          {},
          headers,
          "doctorServiceUrl"
        );
        if (getData?.status && getData?.body.length > 0) {
          canGiveRating = true;
        }
      }
      return sendResponse(req, res, 200, {
        status: true,
        message: `Subscription details fetched successfully.`,
        data: {
          isProfileCompleted,
          medicalHistoryAdded:
            getPatientData &&
              getPatientData?.medicalInformation?.medicalHistory.length > 0
              ? true
              : false,
          socialHistoryAdded:
            getPatientData &&
              getPatientData?.medicalInformation?.socialHistory.length > 0
              ? true
              : false,
          isAssessmentCompleted:
            getAssessment && getAssessment?.assessments.length > 0
              ? true
              : false,
          canGiveRating,
        },
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
        body: error,
        errorCode: null,
      });
    }
  }
  async getAllPatientHavingSubscription(req, res) {
    try {
      const getAllPatient = await PortalUser.find({
        "subscriptionDetails.isPlanActive": true,
      }).select(
        "subscriptionDetails.subscriptionPlanId subscriptionDetails.nextBillingPlanId"
      );
      return sendResponse(req, res, 200, {
        status: true,
        message: `Subscription details fetched successfully.`,
        data: getAllPatient,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
        body: error,
        errorCode: null,
      });
    }
  }
  async getTotalPatientCount(req, res) {
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
            from: "portalusers", // Collection name of the referenced model
            localField: "for_portal_user",
            foreignField: "_id",
            as: "for_portal_user",
          },
        },
        {
          $unwind: "$for_portal_user",
        },
        {
          $match: {
            "for_portal_user.isDeleted": false,
            isFamilyMember: false,
            $and: [date_filter],
          },
        },
        {
          $count: "count",
        },
      ];

      const getCount = await ProfileInfo.aggregate(filterPipeline);
      return sendResponse(req, res, 200, {
        status: true,
        message: `Total Patient.`,
        data: getCount?.length > 0 ? getCount[0]?.count : 0,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
        body: error,
        errorCode: null,
      });
    }
  }

  async getTotalPatientRecords(req, res) {
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
            from: "portalusers",
            localField: "for_portal_user",
            foreignField: "_id",
            as: "for_portal_user",
          },
        },
        {
          $unwind: "$for_portal_user",
        },
        {
          $match: {
            "for_portal_user.isDeleted": false,
            isFamilyMember: false,
            $and: [date_filter],
          },
        },
      ];

      const data = await ProfileInfo.aggregate(filterPipeline);
      const countPipeline = [
        {
          $lookup: {
            from: "portalusers",
            localField: "for_portal_user",
            foreignField: "_id",
            as: "for_portal_user",
          },
        },
        {
          $unwind: "$for_portal_user",
        },
        {
          $match: {
            "for_portal_user.isDeleted": false,
            isFamilyMember: false,
            $and: [date_filter],
          },
        },
        {
          $count: "count",
        },
      ];

      const countData = await ProfileInfo.aggregate(countPipeline);
      const totalCount = countData?.length > 0 ? countData[0].count : 0;

      return sendResponse(req, res, 200, {
        status: true,
        message: `Total Patients`,
        data: {
          count: totalCount,
          patients: data,
        },
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
        body: error,
        errorCode: null,
      });
    }
  }




  async getAllRevenue(req, res) {
    try {
      const getAllPatient = await ProfileInfo.find({ isFamilyMember: false })
        .populate({ path: "for_portal_user", select: "subscriptionDetails" })
        .select("first_name");

      let totalRevenue = 0;
      let totalActiveSubscription = 0;
      let totalCancelSubscription = 0;
      for (let index = 0; index < getAllPatient.length; index++) {
        const element = getAllPatient[index]?.for_portal_user;
        if (element?.subscriptionDetails?.isPlanActive) {
          totalActiveSubscription += parseInt(1);
        }
        if (element?.subscriptionDetails?.isPlanCancelled) {
          totalCancelSubscription += parseInt(1);
        }
      }
      //Get purchase history
      const getPurchaseHistory = await purchasehistory
        .find({ status: "paid" })
        .select("amountPaid");
      for (let index = 0; index < getPurchaseHistory.length; index++) {
        const element = getPurchaseHistory[index];
        totalRevenue += parseFloat(element?.amountPaid);
      }
      const formattedAmount = new Intl.NumberFormat("en-SA", {
        style: "currency",
        currency: "SAR",
      }).format(totalRevenue);
      return sendResponse(req, res, 200, {
        status: true,
        message: `Total revenue.`,
        data: {
          getAllPatient: getAllPatient,
          totalRevenue,
          totalRevenueWithCurrency: formattedAmount,
          totalActiveSubscription,
          totalCancelSubscription,
        },
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
        body: error,
        errorCode: null,
      });
    }
  }
 
  async subscriberDashboard(req, res) {
    try {
        const headers = { Authorization: req.headers["authorization"] };
        const { fromDate, toDate } = req.query;

        // Fetch patients & all subscription plans
        const [patients, subscriptionPlans] = await Promise.all([
            ProfileInfo.find({ isFamilyMember: false })
                .populate({
                    path: "for_portal_user",
                    match: { "subscriptionDetails.isPlanActive": true }, 
                    select: "subscriptionDetails email mobile",
                })
                .select("full_name mrn_number for_portal_user")
                .lean(),

            httpService.getStaging(
                "superadmin/all-subscription-plans",
                {
                    limit: 0,
                    page: 1,
                    plan_for: "patient",
                    is_deleted: false,
                    is_activated: true,
                },
                headers,
                "superadminServiceUrl"
            ),
        ]);

        // Create a map of all plans (So they always appear in response)
        const subscribersPerPlan = {};
        if (subscriptionPlans?.status) {
            for (const plan of subscriptionPlans?.body?.allPlans || []) {
                subscribersPerPlan[plan._id] = {
                    subscribersCount: 0,
                    subscriptionPlanName: plan.plan_name,
                    subscribersNames: [],
                    phoneNumbers: [],
                    emails: [],
                    coupons: [],
                    startDates: [],
                    mrnNumbers: [],
                    amountsPaid: [],
                    paymentStatus: [],
                    currencyCodes: [],
                    totalRevenue: 0,
                };
            }
        }

        // Fetch all subscriptions from patients
        const subscriptionPlanIds = [];
        const userIds = [];
        patients.forEach((patient) => {
            const subscription = patient?.for_portal_user?.subscriptionDetails;
            if (subscription?.subscriptionPlanId) {
                subscriptionPlanIds.push(subscription.subscriptionPlanId);
                userIds.push(patient?.for_portal_user?._id);
            }
        });

        // Apply date filter only to purchase records
        let filter = { forUser: { $in: userIds }, transactionType: "subscription" };
        if (fromDate && toDate) {
            filter.createdAt = {
                $gte: new Date(fromDate),
                $lte: new Date(toDate)   
            };
        }

        const purchaseRecords = await purchasehistory
            .find(filter)
            .select("subscriptionPlanId forUser amountPaid currencyCode status")
            .lean();

        // Map purchase history for quick lookup
        const purchaseHistoryMap = {};
        purchaseRecords.forEach((record) => {
            purchaseHistoryMap[`${record.forUser}_${record.subscriptionPlanId}`] = {
                amountPaid: parseFloat(record.amountPaid) || 0,
                currencyCode: record.currencyCode || "N/A",
                status: record.status || 0,
            };
        });

        // Process patients and update plan data
        for (const patient of patients) {
            const user = patient.for_portal_user;
            if (!user?.subscriptionDetails?.subscriptionPlanId) continue;

            const planId = user.subscriptionDetails.subscriptionPlanId;
            const amountPaid = purchaseHistoryMap[`${user._id}_${planId}`]?.amountPaid || 0;
            const paymentStatus = purchaseHistoryMap[`${user._id}_${planId}`]?.status || 0;
            const startDate = user.subscriptionDetails.period?.start || null;

            // Filter by date
            if (startDate && fromDate && toDate) {
                const startDateObj = new Date(startDate);
                if (startDateObj < new Date(fromDate) || startDateObj > new Date(toDate)) {
                    continue; 
                }
            }

            const subscriberData = {
                subscriberName: patient.full_name,
                phoneNumber: user.mobile || "N/A",
                email: user.email || "N/A",
                coupon: user.subscriptionDetails.discountCoupon || "N/A",
                startDate: startDate,
                mrnNumber: patient.mrn_number,
                amountPaid: amountPaid,
                paymentStatus: paymentStatus,
                currencyCode: purchaseHistoryMap[`${user._id}_${planId}`]?.currencyCode || "N/A",
            };

            const plan = subscribersPerPlan[planId];
            if (!plan) {
              console.error(`Plan ID ${planId} not found in subscribersPerPlan`);
              continue; // Skip this iteration if the plan does not exist
          }
            plan.subscribersCount += 1;
            plan.subscribersNames.push(subscriberData.subscriberName);
            plan.phoneNumbers.push(subscriberData.phoneNumber);
            plan.emails.push(subscriberData.email);
            plan.coupons.push(subscriberData.coupon);
            plan.startDates.push(subscriberData.startDate);
            plan.mrnNumbers.push(subscriberData.mrnNumber);
            plan.amountsPaid.push(subscriberData.amountPaid);
            plan.paymentStatus.push(subscriberData.paymentStatus);
            plan.currencyCodes.push(subscriberData.currencyCode);
            plan.totalRevenue += amountPaid;
        }

        // Format total revenue
        Object.keys(subscribersPerPlan).forEach((planId) => {
            subscribersPerPlan[planId].totalRevenueFormatted = new Intl.NumberFormat("en-SA", {
                style: "currency",
                currency: "SAR",
                minimumFractionDigits: 2,  
                maximumFractionDigits: 2 
            }).format(parseFloat(subscribersPerPlan[planId].totalRevenue.toFixed(2)));
        });

        return sendResponse(req, res, 200, {
            status: true,
            message: `Subscribers dashboard.`,
            data: { subscribersPerPlan },
            errorCode: null,
        });
    } catch (error) {
      console.log(error.message,"Error")
        return sendResponse(req, res, 500, {
            status: false,
            message: "Internal server error",
            body: error,
            errorCode: null,
        });
    }
}


  /* dhiraj- using from-to date */
  async subscriberReportForDashboard(req, res) {
    try {
      let filter = {};
      const { fromDate, toDate } = req.query;

      // Validate the date inputs
      if (!fromDate || !toDate) {
        return sendResponse(req, res, 400, {
          status: false,
          message: "Both fromDate and toDate are required.",
          data: null,
          errorCode: null,
        });
      }

      const fromDateObj = new Date(fromDate);
      const toDateObj = new Date(toDate);

      if (isNaN(fromDateObj) || isNaN(toDateObj)) {
        return sendResponse(req, res, 400, {
          status: false,
          message: "Invalid date format. Please provide valid dates.",
          data: null,
          errorCode: null,
        });
      }

      // Ensure toDate includes the entire day
      toDateObj.setHours(23, 59, 59, 999);

      // Set the filter based on fromDate and toDate
      filter = {
        ["subscriptionDetails.period.start"]: {
          $gte: fromDateObj.toISOString(),
          $lte: toDateObj.toISOString(),
        },
      };

      // Perform the aggregation for active and canceled subscribers
      const statusResult = await PortalUser.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              isActive: "$subscriptionDetails.isPlanActive",
              isCancelled: "$subscriptionDetails.isPlanCancelled",
            },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            status: {
              $switch: {
                branches: [
                  {
                    case: {
                      $and: [
                        { $eq: ["$_id.isActive", true] },
                        { $eq: ["$_id.isCancelled", false] },
                      ],
                    },
                    then: "Active",
                  },
                  {
                    case: {
                      $and: [
                        { $eq: ["$_id.isActive", false] },
                        { $eq: ["$_id.isCancelled", true] },
                      ],
                    },
                    then: "Cancelled",
                  },
                ],
                default: "Cancelled",
              },
            },
            count: 1,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$count" },
            details: { $push: { status: "$status", count: "$count" } },
          },
        },
        {
          $project: {
            _id: 0,
            total: 1,
            details: 1,
            percentages: {
              $map: {
                input: "$details",
                as: "detail",
                in: {
                  status: "$$detail.status",
                  percentage: {
                    $multiply: [{ $divide: ["$$detail.count", "$total"] }, 100],
                  },
                },
              },
            },
          },
        },
      ]);

      // Perform the aggregation for month-wise results
      const monthWiseResult = await PortalUser.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              year: { $year: { $toDate: "$subscriptionDetails.period.start" } },
              month: {
                $month: { $toDate: "$subscriptionDetails.period.start" },
              },
            },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            year: "$_id.year",
            month: "$_id.month",
            count: 1,
          },
        },
        { $sort: { year: 1, month: 1 } }, // Sort results by year and month
      ]);

      // Merge the results
      const responseData = {
        total: statusResult[0]?.total || 0,
        details: statusResult[0]?.details || [],
        percentages: statusResult[0]?.percentages || [],
        monthWiseResult, // Add month-wise data to the response
      };

      // Send the response
      return sendResponse(req, res, 200, {
        status: true,
        message: "Subscriber data fetched successfully",
        data: [responseData],
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
        body: error,
        errorCode: null,
      });
    }
  }

  async subscriberDiscountUsedReport(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const selectedCouponCode = req.query.selectedCouponCode || null;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
  
        let matchCondition = { "subscriptionDetails.discountCoupon": { $exists: true, $ne: "" } };
        if (selectedCouponCode) {
            matchCondition["subscriptionDetails.discountCoupon"] = selectedCouponCode;
        }
  
        const result = await PortalUser.aggregate([
            { $match: matchCondition },
            {
                $lookup: {
                    from: 'profileinfos',
                    localField: '_id',
                    foreignField: 'for_portal_user',
                    as: 'profile'
                }
            },
            {
                $lookup: {
                    from: 'purchasehistories',
                    let: { userId: '$_id' }, 
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$forUser', '$$userId'] },
                                        { $eq: ['$transactionType', 'subscription'] },
                                        { $ne: ['$discountCoupon', ""] } // Only purchases with coupons
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                invoiceId: 1,
                                amountPaid: 1,
                                planPrice: 1,
                                discountedAmount: 1,
                                currencyCode: 1,
                                period: 1,
                                subscriptionPlanId: 1 
                            }
                        }
                    ],
                    as: 'purchaseHistory'
                }
            },
            { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
            { $unwind: '$purchaseHistory' }, // This will create a document for each purchase
            {
                $group: {
                    _id: '$subscriptionDetails.discountCoupon',
                    patients: {
                        $push: {
                            full_name: '$full_name',
                            full_name_arabic: '$full_name_arabic',
                            email: '$email',
                            mobile: '$mobile',
                            country_code: '$country_code',
                            mrn_number: { $ifNull: ['$profile.mrn_number', 'N/A'] },
                            invoice_number: { $ifNull: ['$purchaseHistory.invoiceId', 'N/A'] },
                            amountPaid: { $ifNull: ['$purchaseHistory.amountPaid', 0] },
                            planPrice: { $ifNull: ['$purchaseHistory.planPrice', 0] },
                            discounted_amount: { $ifNull: ['$purchaseHistory.discountedAmount', 0] },
                            plan_id: { $ifNull: ['$purchaseHistory.subscriptionPlanId', 'Unknown'] }, // Use planId from purchase
                            period: {
                                start_date: {
                                    $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$purchaseHistory.period.start" } }
                                },
                                start_time: {
                                    $dateToString: { format: "%H:%M:%S", date: { $toDate: "$purchaseHistory.period.start" } }
                                },
                                end_date: {
                                    $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$purchaseHistory.period.end" } }
                                },
                                end_time: {
                                    $dateToString: { format: "%H:%M:%S", date: { $toDate: "$purchaseHistory.period.end" } }
                                }
                            }
                        }
                    }
                }
            }
        ]);
  
        const totalCountPipeline = [
            { $match: matchCondition },
            {
                $lookup: {
                    from: 'purchasehistories',
                    let: { userId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$forUser', '$$userId'] },
                                        { $eq: ['$transactionType', 'subscription'] },
                                        { $ne: ['$discountCoupon', ""] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'purchaseHistory'
                }
            },
            { $unwind: '$purchaseHistory' },
            { $count: "totalCount" }
        ];
  
        const totalCountResult = await PortalUser.aggregate(totalCountPipeline);
        const totalCount = totalCountResult.length > 0 ? totalCountResult[0].totalCount : 0;
  
        const planIds = [...new Set(result.flatMap(group => group.patients.map(p => p.plan_id).filter(id => id !== 'Unknown')))];
  
        let plansResponse = { body: [] };
        if (planIds.length > 0) {
            plansResponse = await httpService.getStaging(
                `superadmin/get-subscription-plan/`,
                { planIds },
                { Authorization: req.headers.authorization },
                'superadminServiceUrl'
            );
        }
  
        const plansMap = new Map();
        if (plansResponse?.body?.length) {
            plansResponse.body.forEach(plan => plansMap.set(plan._id, plan.plan_name));
        }
  
        const updatedResult = result.map(group => ({
            _id: group._id,
            patients: group.patients
                .slice(startIndex, endIndex)
                .map(patient => ({
                    ...patient,
                    plan_name: plansMap.get(patient.plan_id) || 'Unknown',
                    start_time: patient.period?.start_time || "N/A",
                    end_time: patient.period?.end_time || "N/A"
                }))
        }));
  
        return sendResponse(req, res, 200, {
            status: true,
            message: `Subscribers discount used report.`,
            data: updatedResult,
            totalCount: totalCount,
            errorCode: null,
        });
    } catch (error) {
        console.error("Error in subscriberDiscountUsedReport: ", error);
        return sendResponse(req, res, 500, {
            status: false,
            message: "Internal server error",
            errorCode: null,
        });
    }
  }

  async patientNothavingSubscriptionPlan(req, res) {
    const { limit, page, fromDate, toDate } = req.query;

    try {
      let filter = {};

      if (fromDate && toDate) {
        const fromDateObj = new Date(`${fromDate} 00:00:00`);
        const toDateObj = new Date(`${toDate} 23:59:59`);

        filter.createdAt = { $gte: fromDateObj, $lte: toDateObj };
      }

      const query = {
        parent_userid: { $exists: false },
        "subscriptionDetails.moyasarToken": { $exists: false },
        "subscriptionDetails.subscriptionPlanId": { $exists: false },
        ...filter,
      };

      const findUser = await PortalUser.find(query)
        .sort()
        .skip((page - 1) * limit)
        .limit(limit * 1)
        .exec();
      let data = {};

      data = findUser.map((user) => ({
        _id: user._id,
        full_name: user.full_name,
        full_name_arabic: user.full_name_arabic,
        email: user.email,
        mobile: user.mobile,
        country_code: user.country_code,
        isDeleted: user.isDeleted,
        createdAt: user.createdAt       
      }));

      const totalCount = await PortalUser.countDocuments(query);

      return sendResponse(req, res, 200, {
        status: true,
        message: "Users without parent_userid fetched successfully",
        body: { usersList: data, totalCount },
      });
    } catch (error) {
      console.error("Error while fetching subscribers dashboard:", error);
      return sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
        body: error,
        errorCode: null,
      });
    }
  }

  async notifyDoctorForWaiting(req, res) {
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };

      const { userID, condition, patientId, appointment_id } = req.query;

      const patientData = await PortalUser.findOne({
        _id: mongoose.Types.ObjectId(patientId),
      });

      let patientName;
      if (patientData) {
        patientName = patientData?.full_name;
      }

      const doctorData = await httpService.getStaging(
        "doctor/get-doctor-portal-data",
        { doctorId: userID },
        headers,
        "doctorServiceUrl"
      );

      if (doctorData?.status) {
        let doctorName = doctorData?.body.full_name;
        let userContact =
          doctorData?.body.country_code + doctorData?.body.mobile;

        const getContentforsms = await httpService.getStaging(
          "superadmin/get-notification-by-condition",
          { condition: condition, type: "sms" },
          headers,
          "superadminServiceUrl"
        );
        if (getContentforsms?.status && getContentforsms?.data.length) {
          const content = generateNotificationMessage(
            condition,
            getContentforsms?.data[0].content,
            patientName,
            doctorName
          );

          sendSms(userContact, content);
          let paramsData = { sendTo: "doctor" };
          const requestData = {
            created_by_type: "patient",
            created_by: patientId,
            content: content,
            url: "",
            for_portal_user: userID,
            title: getContentforsms?.data[0].notification_title,
            appointmentId: appointment_id,
          };
          await saveNotification(
            paramsData,
            headers,
            requestData
          );
        }
      }
    } catch (error) {
      console.log("error__", error);

      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `failed to notification`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getSubscribedPatientForDoctor(req, res) {
    try {
      const headers = { Authorization: req.headers["authorization"] };
      const { doctorId } = req.query;

      const getPatientData = await httpService.getStaging(
        "doctor/get-patient-id-from-appointment",
        { doctorId },
        headers,
        "doctorServiceUrl"
      );

      if (!getPatientData.data?.patientIds?.length) {
        return sendResponse(req, res, 200, {
          status: true,
          body: { totalCount: 0, array: [] },
          message: "No subscribed patients found",
          errorCode: "NO_PATIENTS_FOUND",
        });
      }

      const patientIds = getPatientData.data.patientIds;

      // Fetch all patients in a single query
      const patients = await PortalUser.find({ _id: { $in: patientIds } }, [
        "_id",
        "full_name",
        "full_name_arabic",
        "email",
        "mobile",
        "country_code",
        "subscriptionDetails",
      ]);

      // Filter active patients
      const activePatients = patients.filter(
        (p) => p?.subscriptionDetails?.isPlanActive
      );

      if (!activePatients.length) {
        return sendResponse(req, res, 200, {
          status: true,
          body: { totalCount: 0, array: [] },
          message: "No active subscribed patients found",
          errorCode: "NO_ACTIVE_PATIENTS",
        });
      }

      // Get unique subscription plan IDs
      const planIds = [
        ...new Set(
          activePatients
            .map((p) => p.subscriptionDetails?.subscriptionPlanId)
            .filter(Boolean)
        ),
      ];

      // Fetch subscription details
      const getSubscriptionDetails = await httpService.getStaging(
        "superadmin/get-subscription-plan",
        { planIds },
        headers,
        "superadminServiceUrl"
      );

      // Create a map of subscription plan details
      const planDetailsMap = new Map(
        (getSubscriptionDetails?.body || []).map((plan) => [
          plan._id,
          {
            plan_name: plan.plan_name || "",
            plan_name_arabic: plan.plan_name_arabic || "",
          },
        ])
      );

      // Construct response array
      const modifyArray = activePatients.map((patient) => ({
        _id: patient._id,
        full_name: patient.full_name,
        full_name_arabic: patient.full_name_arabic,
        email: patient.email,
        mobile: `${patient.country_code}-${patient.mobile}`,
        subscriptionDetails: {
          planName:
            planDetailsMap.get(patient.subscriptionDetails?.subscriptionPlanId)
              ?.plan_name || null,
          planNameArabic:
            planDetailsMap.get(patient.subscriptionDetails?.subscriptionPlanId)
              ?.plan_name_arabic || null,
          startDate: patient.subscriptionDetails?.period?.start,
          endDate: patient.subscriptionDetails?.period?.end,
        },
      }));

      return sendResponse(req, res, 200, {
        status: true,
        body: { totalCount: modifyArray.length, array: modifyArray },
        message: "Subscribed patient list fetched successfully",
        errorCode: "LIST_FETCHED",
      });
    } catch (error) {
      console.error("Error fetching subscribed patients:", error);
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to fetch subscribed patients",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }


  async exportMainRevenueList(req, res) {
    const headers = { Authorization: req.headers["authorization"] };
    try {
      const getAllPatient = await ProfileInfo.find({ isFamilyMember: false })
        .populate({ path: 'for_portal_user', select: 'subscriptionDetails' })
        .select('first_name last_name full_name_arabic mrn_number');

      let __activeSubscriptionList = [];
      let __cancelSubscriptionList = [];

      let planIdsSet = new Set();
      let userIdsSet = new Set();

      getAllPatient.forEach(patient => {
        const portalUser = patient?.for_portal_user;
        if (portalUser) {
          const planId = portalUser.subscriptionDetails?.subscriptionPlanId;
          if (planId) planIdsSet.add(planId);
          userIdsSet.add(portalUser._id.toString());
        }
      });

      const uniquePlanIds = [...planIdsSet];
      const uniqueUserIds = [...userIdsSet];

      let planDetailsMap = new Map();
      if (uniquePlanIds.length > 0) {
        const plansResponse = await httpService.getStaging(
          `superadmin/get-subscription-plan/`,
          { planIds: uniquePlanIds },
          headers,
          'superadminServiceUrl'
        );

        if (plansResponse?.body) {
          plansResponse.body.forEach(plan => {
            planDetailsMap.set(plan._id, {
              plan_name: plan?.plan_name,
              plan_name_arabic: plan?.plan_name_arabic,
              plan_price: plan?.price_per_member
            });
          });
        }
      }

      const getPurchaseHistory = await purchasehistory.find({
        status: 'paid',
        forUser: { $in: uniqueUserIds },
        subscriptionPlanId: { $in: uniquePlanIds }
      }).select('amountPaid forUser subscriptionPlanId');

      let purchaseHistoryMap = new Map();
      getPurchaseHistory.forEach(purchase => {
        const key = `${purchase.forUser}_${purchase.subscriptionPlanId}`;
        purchaseHistoryMap.set(key, purchase.amountPaid);
      });

      getAllPatient.forEach(patient => {
        const portalUser = patient?.for_portal_user;
        const subscriptionDetails = portalUser?.subscriptionDetails;
        if (!subscriptionDetails) return;

        const planInfo = planDetailsMap.get(subscriptionDetails.subscriptionPlanId) || {
          plan_name: "",
          plan_name_arabic: "",
          plan_price: ""
        };

        const revenueKey = `${portalUser._id.toString()}_${subscriptionDetails.subscriptionPlanId}`;
        const amountPaid = purchaseHistoryMap.get(revenueKey) || "0.00";

        const formattedData = {
          first_name: patient.first_name ? patient.first_name : "",
          last_name: patient.last_name ? patient.last_name : "",
          full_name_arabic: patient.full_name_arabic ? patient.full_name_arabic : "",
          mrn_number: patient.mrn_number ? patient.mrn_number : "",
          subscriptionDetails: {
            plan_name: planInfo.plan_name ? planInfo.plan_name : "",
            plan_name_arabic: planInfo.plan_name_arabic ? planInfo.plan_name_arabic : "",
            plan_price: planInfo.plan_price ? planInfo.plan_price : "",
            startDate: subscriptionDetails?.period?.start ? subscriptionDetails?.period?.start : "",
            endDate: subscriptionDetails?.period?.end ? subscriptionDetails?.period?.end : "",
            amountPaid: parseFloat(amountPaid).toFixed(2)
          },
        };
        if (subscriptionDetails.isPlanActive) {
          __activeSubscriptionList.push(formattedData);
        }

        if (subscriptionDetails.isPlanCancelled) {
          __cancelSubscriptionList.push(formattedData);
        }
      });

      return sendResponse(req, res, 200, {
        status: true,
        message: `Total revenue.`,
        data: {
          __activeSubscriptionList,
          __cancelSubscriptionList,
        },
        errorCode: null,
      });

    } catch (error) {
      console.log("error__", error);

      return sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
        body: error,
        errorCode: null,
      });
    }
  }

  async getPatientTotalSubscriberList(req, res) {
    const headers = { Authorization: req.headers["authorization"] };
    const { fromDate, toDate } = req.query;

    try {
      const dateFilter = {};
      if (fromDate || toDate) {
        const fromDateObj = fromDate ? new Date(fromDate) : null;
        const toDateObj = toDate ? new Date(toDate) : null;
        if (toDateObj) toDateObj.setHours(23, 59, 59, 999);

        dateFilter.createdAt = {
          ...(fromDateObj && { $gte: fromDateObj }),
          ...(toDateObj && { $lte: toDateObj }),
        };
      }

      const activePatients = await ProfileInfo.aggregate([
        {
          $lookup: {
            from: "portalusers",
            localField: "for_portal_user",
            foreignField: "_id",
            as: "portalUser",
          },
        },
        { $unwind: { path: "$portalUser", preserveNullAndEmptyArrays: true } },
        { $match: { isFamilyMember: false } },
        {
          $project: {
            _id: 1,
            first_name: 1,
            last_name: 1,
            full_name_arabic: 1,
            mrn_number: 1,
            "portalUser._id": 1,
            "portalUser.subscriptionDetails.isPlanActive": 1,
            "portalUser.subscriptionDetails.subscriptionPlanId": 1,
            "portalUser.subscriptionDetails.period": 1,
          },
        },
      ]);

      const uniquePlanIds = [...new Set(activePatients.map(p => p.portalUser?.subscriptionDetails?.subscriptionPlanId).filter(Boolean))];
      let planDetailsMap = {};

      if (uniquePlanIds.length) {
        try {
          const planResponses = await Promise.all(
            uniquePlanIds.map(id => httpService.getStaging(
              `superadmin/get-subscription-plan-details`,
              { id },
              headers,
              "superadminServiceUrl"
            ))
          );

          planResponses.filter(res => res?.body).forEach(plan => {
            const planId = String(plan.body._id);
            planDetailsMap[planId] = {
              plan_name: plan.body.plan_name || "Unknown",
              planPrice: plan.body.plan_duration?.[0]?.price || "0",
            };
          });
        } catch (apiError) {
          console.error("Error fetching subscription plan details:", apiError);
        }
      }

      const purchaseRecords = await purchasehistory.find({
        transactionType: "subscription",
        status: "paid",
        ...dateFilter,
      });


      const purchaseRecordsMap = {};
      purchaseRecords.forEach(record => {
        const key = `${record.subscriptionPlanId}_${record.forUser}`;
        purchaseRecordsMap[key] = {
          planPrice: record.planPrice || "0",
          amountPaid: record.amountPaid || "0",
          invoiceId: record.invoiceId || "N/A",
          invoiceUrl: record.invoiceUrl || "N/A",
          paymentMode: record.paymentMode || "N/A",
          period: record.period || {},
        };
      });

      activePatients.forEach(patient => {
        const subscriptionPlanId = String(patient.portalUser?.subscriptionDetails?.subscriptionPlanId || "N/A");
        const forUser = String(patient.portalUser?._id);
        const purchaseKey = `${subscriptionPlanId}_${forUser}`;

        patient.plan_name = planDetailsMap[subscriptionPlanId]?.plan_name || "Unknown";
        patient.planPrice = purchaseRecordsMap[purchaseKey]?.planPrice || planDetailsMap[subscriptionPlanId]?.planPrice || "0";
        patient.amountPaid = purchaseRecordsMap[purchaseKey]?.amountPaid || "0";
        patient.invoiceId = purchaseRecordsMap[purchaseKey]?.invoiceId || "N/A";
        patient.invoiceUrl = purchaseRecordsMap[purchaseKey]?.invoiceUrl || "N/A";
        patient.paymentMode = purchaseRecordsMap[purchaseKey]?.paymentMode || "N/A";
        patient.subscriptionPeriod = purchaseRecordsMap[purchaseKey]?.period || {};
      });

      const monthWiseSubscriptionCount = await purchasehistory.aggregate([
        {
          $match: {
            transactionType: "subscription",
            status: "paid",
            ...dateFilter,
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $project: { _id: 0, year: "$_id.year", month: "$_id.month", count: 1 } },
        { $sort: { year: 1, month: 1 } },
      ]);

      return sendResponse(req, res, 200, {
        status: true,
        message: "Patient subscription data fetched successfully.",
        data: {
          totalSubscribers: activePatients.length,
          totalSubscriptionTransactions: purchaseRecords.length,
          monthWiseSubscriptionCount,
          patientsDetails: activePatients,
          subscriptionTransactionsDetails: purchaseRecords,
        },
        errorCode: null,
      });
    } catch (error) {
      console.error("Error fetching patient subscription data:", error);
      return sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
        body: error.stack,
        errorCode: null,
      });
    }
  }

  async getTotalRevenueWithDetails(req, res) {
    const headers = { Authorization: req.headers["authorization"] };

    try {
      const patients = await ProfileInfo.find({ isFamilyMember: false })
        .populate({ path: "for_portal_user", select: "subscriptionDetails" })
        .select("first_name last_name full_name_arabic mrn_number for_portal_user");

      if (!patients.length) {
        return sendResponse(req, res, 404, {
          status: false,
          message: "No patients found.",
          data: [],
          errorCode: null,
        });
      }

      let totalRevenue = 0;
      let totalActiveSubscription = 0;
      let totalCancelSubscription = 0;
      let planIdsSet = new Set();
      let userIdsSet = new Set();
      let __activeSubscriptionList = [];
      let __cancelSubscriptionList = [];

      patients.forEach(patient => {
          const portalUser = patient?.for_portal_user;
          if (portalUser) {
              const planId = portalUser.subscriptionDetails?.subscriptionPlanId;
              if (planId) planIdsSet.add(planId);
              userIdsSet.add(portalUser._id.toString());
              if (portalUser.subscriptionDetails?.isPlanActive) totalActiveSubscription++;
              if (portalUser.subscriptionDetails?.isPlanCancelled) totalCancelSubscription++;
          }
      });

      const uniquePlanIds = [...planIdsSet];
      const uniqueUserIds = [...userIdsSet];

      let planDetailsMap = new Map();
      if (uniquePlanIds.length > 0) {
        try {
          let planResponses = await Promise.all(
              uniquePlanIds.map(id =>
                  httpService.getStaging(
                      `superadmin/get-subscription-plan-details`,
                      { id },
                      headers,
                      "superadminServiceUrl"
                  )
              )
          );

          planResponses.forEach(({ body }) => {
              if (body && body._id) {
                  planDetailsMap.set(String(body._id), {
                      plan_name: body.plan_name || "Unknown",
                      plan_name_arabic: body.plan_name_arabic || "",
                      plan_price: body.plan_duration?.[0]?.price || "0.00",
                  });
              }
          });
      } catch (error) {
          console.error("Error fetching subscription plan details:", error);
          }
      }

      let purchaseRecordsMap = new Map();
      if (uniquePlanIds.length > 0 && uniqueUserIds.length > 0) {
        const purchaseRecords = await purchasehistory.find({
          subscriptionPlanId: { $in: uniquePlanIds },
          forUser: { $in: uniqueUserIds },
          status: "paid",
        }).select("amountPaid forUser subscriptionPlanId");

        purchaseRecords.forEach(record => {
          let key = `${record.forUser}_${record.subscriptionPlanId}`;
          purchaseRecordsMap.set(key, record.amountPaid || "0.00");
          totalRevenue += parseFloat(record.amountPaid || "0.00");
        });
      }

      const formattedTotalRevenue = new Intl.NumberFormat("en-SA", {
        style: "currency",
        currency: "SAR",
      }).format(totalRevenue / 100);

      patients.forEach(patient => {
        const portalUser = patient?.for_portal_user;
        const subscriptionDetails = portalUser?.subscriptionDetails || {};
        const planId = subscriptionDetails.subscriptionPlanId;

        const planInfo = planDetailsMap.get(planId) || {
          plan_name: "Unknown",
          plan_name_arabic: "",
          plan_price: "0.00",
        };

        const revenueKey = `${portalUser?._id}_${planId}`;
        const amountPaid = purchaseRecordsMap.get(revenueKey) || planInfo.plan_price || "0.00";

        const formattedData = {
          first_name: patient.first_name || "",
          last_name: patient.last_name || "",
          full_name_arabic: patient.full_name_arabic || "",
          mrn_number: patient.mrn_number || "",
          subscriptionDetails: {
            plan_name: planInfo.plan_name,
            plan_name_arabic: planInfo.plan_name_arabic,
            plan_price: planInfo.plan_price,
            startDate: subscriptionDetails?.period?.start || "",
            endDate: subscriptionDetails?.period?.end || "",
            amountPaid: parseFloat(amountPaid).toFixed(2),
          },
        };

        if (subscriptionDetails.isPlanActive) {
          __activeSubscriptionList.push(formattedData);
        }
        if (subscriptionDetails.isPlanCancelled) {
          __cancelSubscriptionList.push(formattedData);
        }
      });

      return sendResponse(req, res, 200, {
        status: true,
        message: "Total revenue fetched successfully.",
        data: {
          totalRevenue,
          totalRevenueWithCurrency: formattedTotalRevenue,
          totalActiveSubscription,
          totalCancelSubscription,
          __activeSubscriptionList,
          __cancelSubscriptionList,
        },
        errorCode: null,
      });
    } catch (error) {
      console.error("Error fetching total revenue with details:", error);
      return sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
        body: error.stack,
        errorCode: null,
      });
    }
  }





  //new api
  async patientParentFullDetails(req, res) {
    const { patient_id } = req.query;

    if (!patient_id) {
      return sendResponse(req, res, 400, {
        status: false,
        message: "Patient ID is required",
        errorCode: "MISSING_PATIENT_ID",
      });
    }

    try {
      // Fetch patient details
      const patient = await PortalUser.findOne({
        _id: mongoose.Types.ObjectId(patient_id),
        isDeleted: false,
      });

      if (!patient) {
        return sendResponse(req, res, 404, {
          status: false,
          message: "Patient not found",
          errorCode: "PATIENT_NOT_FOUND",
        });
      }

      // Get parent_userid
      const parentUserId = patient.parent_userid;

      if (!parentUserId) {
        return sendResponse(req, res, 404, {
          status: false,
          message: "No parent linked to this patient",
          errorCode: "NO_PARENT_FOUND",
        });
      }

      // Fetch parent details from PortalUser
      const parentDetails = await PortalUser.findOne({
        _id: mongoose.Types.ObjectId(parentUserId),
        isDeleted: false,
      }).select("country_code mobile full_name");

      if (!parentDetails) {
        return sendResponse(req, res, 404, {
          status: false,
          message: "Parent details not found",
          errorCode: "PARENT_NOT_FOUND",
        });
      }

      // Fetch parent's profile info (to get gender)
      const parentProfile = await ProfileInfo.findOne({
        for_portal_user: mongoose.Types.ObjectId(parentUserId),
      }).select("gender");

      // Prepare final response in array format
      const response = [
        {
          country_code: parentDetails.country_code,
          mobile_number: parentDetails.mobile,
          full_name: parentDetails.full_name,
          gender: parentProfile ? parentProfile.gender : null,
          _id: parentUserId
        },
      ];

      return sendResponse(req, res, 200, {
        status: true,
        body: response,
        message: "Parent details retrieved successfully",
        errorCode: null,
      });

    } catch (error) {
      console.error("Error fetching parent details:", error);
      return sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
        errorCode: "SERVER_ERROR",
      });
    }
  }
  //new api end

  async getPatientActiveCancelledList(req, res) {
    const { fromDate, toDate } = req.query;

    try {
        const dateFilter = {};
        if (fromDate || toDate) {
            const fromDateObj = fromDate ? new Date(fromDate) : null;
            const toDateObj = toDate ? new Date(toDate) : null;
            if (toDateObj) toDateObj.setHours(23, 59, 59, 999);
  
            dateFilter.createdAt = {
                ...(fromDateObj && { $gte: fromDateObj }),
                ...(toDateObj && { $lte: toDateObj }),
            };
        }
  
        const patients = await ProfileInfo.find({ isFamilyMember: false })
        .populate({ path: "for_portal_user", select: "subscriptionDetails" })
        .select("first_name last_name full_name_arabic mrn_number for_portal_user");
  
            if (!patients.length) {
              return sendResponse(req, res, 404, {
                  status: false,
                  message: "No patients found.",
                  data: [],
                  errorCode: null,
              });
          }
  
        let activeCount = 0;
        let cancelledCount = 0;
        let activePatients = [];
        let cancelledPatients = [];
        let userIdsSet = new Set();
  
        patients.forEach(patient => {
            if (patient.for_portal_user?._id) {
                userIdsSet.add(patient.for_portal_user._id.toString());
            }
        });
  
        const uniqueUserIds = [...userIdsSet];
  
        let purchaseRecordsMap = new Map();
        if (uniqueUserIds.length > 0) {
            const purchaseRecords = await purchasehistory.find({
                transactionType: "subscription",
                status: "paid",
                forUser: { $in: uniqueUserIds },
                ...dateFilter, 
            }).select("forUser subscriptionPlanId createdAt");
  
            purchaseRecords.forEach(record => {
              const key = record.forUser.toString();
              if (!purchaseRecordsMap.has(key)) {
                  purchaseRecordsMap.set(key, []);
              }
              purchaseRecordsMap.get(key).push({
                  createdAt: record.createdAt,
                  subscriptionPlanId: record.subscriptionPlanId,
              });
            });
        }
  
          patients.forEach(patient => {
            const portalUser = patient?.for_portal_user;
            const subscriptionDetails = portalUser?.subscriptionDetails || {};
            const userId = portalUser?._id?.toString();
  
            const userTransactions = purchaseRecordsMap.get(userId) || [];
          if (userTransactions.length === 0) return;
  
            const formattedData = {
                _id: patient._id,
                first_name: patient.first_name || "",
                last_name: patient.last_name || "",
                portalUser: {
                  _id: portalUser?._id || "",
                  subscriptionDetails: {
                      isPlanActive: subscriptionDetails?.isPlanActive || false,
                      isPlanCancelled: subscriptionDetails?.isPlanCancelled || false,
                      period: {
                          start: subscriptionDetails?.period?.start || "",
                          end: subscriptionDetails?.period?.end || "",
                      },
                      subscriptionPlanId: subscriptionDetails.subscriptionPlanId || "",
                  },
              },
              isPlanCancelled: subscriptionDetails?.isPlanCancelled || false,
          };
  
            if (subscriptionDetails.isPlanActive) {
                activeCount++;
                activePatients.push(formattedData);
            }
            if (subscriptionDetails.isPlanCancelled) {
                cancelledCount++;
                cancelledPatients.push(formattedData);
            }
        });
  
        return sendResponse(req, res, 200, {
            status: true,
            message: "Patient active and cancelled subscription data fetched successfully.",
            data: {
                activeCount,
                cancelledCount,
                activePatients,
                cancelledPatients,
            },
            errorCode: null,
        });
    } catch (error) {
      console.error("Error fetching patient subscription data:", error);
      return sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
        body: error.stack,
        errorCode: null,
      });
    }
  }

  async getAllRevenueWithPatientDetails(req, res) {
    const headers = { Authorization: req.headers["authorization"] };

    if (!headers.Authorization) {
        return res.status(401).json({
            status: false,
            message: "Missing Authorization Header",
        });
    }

    try {
        const getAllPatients = await ProfileInfo.find({ isFamilyMember: false })
            .populate({ path: "for_portal_user", select: "subscriptionDetails" })
            .select("first_name last_name first_name_arabic last_name_arabic mrn_number");

        let totalRevenue = 0;
        let totalActiveSubscription = 0;
        let totalCancelSubscription = 0;
        let patientDetails = [];

        const userIds = getAllPatients.map(patient => patient?.for_portal_user?._id?.toString()).filter(Boolean);

        getAllPatients.forEach(patient => {
            const subscriptionDetails = patient?.for_portal_user?.subscriptionDetails || {};
            if (subscriptionDetails.isPlanActive) totalActiveSubscription += 1;
            if (subscriptionDetails.isPlanCancelled) totalCancelSubscription += 1;
        });

        const purchaseHistories = await purchasehistory.find({ forUser: { $in: userIds }, status: "paid" })
            .select("amountPaid planPrice subscriptionPlanId forUser");


        for (let index = 0; index < purchaseHistories.length; index++) {
            const element = purchaseHistories[index];
            const amount = Number(element?.amountPaid);
            totalRevenue += amount;
        }

        const purchaseHistoryMap = new Map();
        const subscriptionPlanIds = new Set();

        purchaseHistories.forEach(history => {
            const userId = history.forUser.toString();
            if (!purchaseHistoryMap.has(userId)) {
                purchaseHistoryMap.set(userId, []);
            }
            purchaseHistoryMap.get(userId).push(history);
            if (history.subscriptionPlanId) {
                subscriptionPlanIds.add(history.subscriptionPlanId);
            }
        });

        let subscriptionPlansMap = new Map();
        if (subscriptionPlanIds.size > 0) {
            try {
                const subscriptionPlanResponse = await httpService.getStaging(
                    "superadmin/get-subscription-plan",
                    { planIds: Array.from(subscriptionPlanIds) },
                    headers,
                    "superadminServiceUrl"
                );
                if (Array.isArray(subscriptionPlanResponse?.body)) {
                    subscriptionPlanResponse.body.forEach(plan => {
                        subscriptionPlansMap.set(plan._id, plan);
                    });
                }
            } catch (error) {
                console.error("Error fetching subscription plan details:", error.message);
            }
        }

        getAllPatients.forEach(patient => {
            const user = patient?.for_portal_user;
            if (!user?._id) return;

            const userId = user._id.toString();
            const userPurchaseHistories = purchaseHistoryMap.get(userId) || [];

            userPurchaseHistories.reduce((sum, history) => sum + parseFloat(history.amountPaid || 0), 0);

            const subscriptionDetailsList = userPurchaseHistories.map(history => ({
                planName: subscriptionPlansMap.get(history.subscriptionPlanId)?.plan_name || "Plan Name Not Found",
                planPrice: history.planPrice || "N/A",
                amountPaid: history.amountPaid || "N/A",
            }));

            patientDetails.push({
                firstName: patient.first_name,
                lastName: patient.last_name,
                firstNameArabic: patient.first_name_arabic,
                lastNameArabic: patient.last_name_arabic,
                mrnNumber: patient.mrn_number,
                subscriptionDetails: subscriptionDetailsList,
            });
        });

        const formattedAmount = new Intl.NumberFormat("en-SA", {
            style: "currency",
            currency: "SAR",
        }).format(totalRevenue);

        return res.status(200).json({
            status: true,
            message: "Total revenue and patient details fetched successfully.",
            data: {
                patientDetails,
                totalRevenue,
                totalRevenueWithCurrency: formattedAmount,
                totalActiveSubscription,
                totalCancelSubscription,
            },
        });
    } catch (error) {
        console.error("Error fetching revenue details:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error.",
            error: error.message,
        });
    }
  }

  async getPatientsWithPreviousDoctors(req, res) {
    try {
        const { fromDate, toDate } = req.query;
        const headers = req.headers;

        const parseDate = (str) => {
            const [mm, dd, yyyy] = str.split("-");
            return new Date(`${yyyy}-${mm}-${dd}`);
        };

        let fromDateObj = null, toDateObjVal = null;
        if (fromDate && toDate) {
            fromDateObj = parseDate(fromDate);
            toDateObjVal = parseDate(toDate);
        }

        const patients = await ProfileInfo.find({
            previousAssignedDoctor: {
                $elemMatch: {
                    isCurrentAssignedDoctor: false,
                    leftDoctorDate: { $ne: null }
                }
            }
        }).lean();

        const finalResponse = [];

        for (const patient of patients) {
            const portalUser = await PortalUser.findOne({ _id: patient.for_portal_user }).lean();

            const previousDoctors = patient.previousAssignedDoctor.filter(doc => {
                if (!doc.leftDoctorDate || doc.isCurrentAssignedDoctor) return false;

                const docDate = new Date(doc.leftDoctorDate);
                if (fromDateObj && toDateObjVal) {
                    return docDate >= fromDateObj && docDate <= toDateObjVal;
                }
                return true;
            });

            const currentAssignedDoctorObj = patient.previousAssignedDoctor.find(doc => doc.isCurrentAssignedDoctor);
            let currentDoctorDetails = null;

            if (currentAssignedDoctorObj) {
                try {
                    const currentDocRes = await httpService.getStaging(
                        'doctor/get-doctor-portal-data',
                        { doctorId: currentAssignedDoctorObj.doctorId },
                        headers,
                        'doctorServiceUrl'
                    );
                    currentDoctorDetails = currentDocRes?.body || null;
                } catch (err) {
                    console.error('Error fetching current doctor details', err.message);
                }
            }

            for (const doctor of previousDoctors) {
                let doctorDetails = {};
                try {
                    const doctorRes = await httpService.getStaging(
                        'doctor/get-doctor-portal-data',
                        { doctorId: doctor.doctorId },
                        headers,
                        'doctorServiceUrl'
                    );
                    doctorDetails = doctorRes?.body || {};
                } catch (err) {
                    console.error(`Error fetching previous doctor details for doctorId: ${doctor.doctorId}`, err.message);
                }

                finalResponse.push({
                    patient_full_name: patient.full_name,
                    patient_full_name_arabic: patient?.full_name_arabic || '',
                    gender: patient.gender,
                    mrn_number: patient?.mrn_number || '',
                    mobile: portalUser?.country_code + " " + portalUser?.mobile || '',
                    previousAssignedDoctorCount: patient.previousAssignedDoctor?.filter(doc => !doc.isCurrentAssignedDoctor).length || 0,
                    doctor: {
                        Doctor_full_name: doctorDetails.full_name || '',
                        Doctor_full_name_arabic: doctorDetails.full_name_arabic || '',
                        Doctor_mobile: doctorDetails.country_code + " " + doctorDetails.mobile || '',
                        Doctor_email: doctorDetails.email || '',
                        assignedDate: doctor.assignedDate || '',
                        leftDoctorDate: doctor.leftDoctorDate || '',
                        isCurrentAssignedDoctor: doctor.isCurrentAssignedDoctor || false,
                    },
                    currentAssignedDoctor: currentDoctorDetails?.full_name || '',
                });
            }
        }

        return sendResponse(req, res, 200, {
            status: true,
            message: "Patient and doctor info fetched",
            data: {
                totalLeftDoctorCount: finalResponse.length,
                patientData:finalResponse
            },
            errorCode: null
        });

    } catch (error) {
        console.log("Error in getPatientsWithPreviousDoctors:", error);
        return sendResponse(req, res, 500, {
            status: false,
            message: "Internal server error",
            body: error.stack,
            errorCode: null
        });
    }
}

  async getPatientsWithCurrentAssignedDoctors(req, res) {
    try {
        const { fromDate, toDate } = req.query;
        const headers = req.headers;
        let filter = { currentAssignedDoctor: { "$exists": true, "$ne": "" } };

        const patients = await ProfileInfo.find(filter)
            .select('full_name full_name_arabic first_name last_name gender mrn_number currentAssignedDoctor for_portal_user previousAssignedDoctor');


        const portalUserIds = patients.map(patient => patient.for_portal_user).filter(Boolean);
        const portalUsers = await PortalUser.find({ _id: { $in: portalUserIds } })
            .select('full_name full_name_arabic country_code mobile');

        const portalUserMap = new Map(portalUsers.map(user => [user._id.toString(), user]));

        const doctorIds = [...new Set(patients.map(patient => patient.currentAssignedDoctor).filter(Boolean))];
        const doctorPromises = doctorIds.map(doctorId =>
            httpService.getStaging(
                'doctor/get-doctor-portal-data',
                { doctorId },
                headers,
                'doctorServiceUrl'
            ).then(response => ({
                doctorId,
                data: response?.body || {},
            }))
        );

        const doctorResults = await Promise.all(doctorPromises);
        const doctorMap = new Map(doctorResults.map(result => [result.doctorId, result.data]));

        const patientData = patients.map(patient => {
            const portalUser = portalUserMap.get(patient.for_portal_user?.toString());
            const doctorDetails = doctorMap.get(patient.currentAssignedDoctor) || {};

            // Find the assignedDate of the current assigned doctor
            const currentAssignedDoctorData = patient.previousAssignedDoctor?.find(
              doc =>
                  doc.doctorId === patient.currentAssignedDoctor &&
                  doc.isCurrentAssignedDoctor === true &&
                  doc.assignedDate &&
                  new Date(doc.assignedDate) >= new Date(`${fromDate} 00:00:00`) &&
                  new Date(doc.assignedDate) <= new Date(`${toDate} 23:59:59`)
          );
          if (!currentAssignedDoctorData) return null;
          const assignedDate = currentAssignedDoctorData ? currentAssignedDoctorData.assignedDate : null;
          
            return {
                patient_full_name: patient.full_name,
                patient_full_name_arabic: patient?.full_name_arabic || '',
                gender: patient.gender,
                mrn_number: patient?.mrn_number || '',
                mobile: portalUser?.country_code + " " + portalUser?.mobile || '',
                doctor: {
                    Doctor_full_name: doctorDetails.full_name || '',
                    Doctor_full_name_arabic: doctorDetails.full_name_arabic || '',
                    Doctor_mobile: doctorDetails.country_code + " " + doctorDetails.mobile || '',
                    Doctor_email: doctorDetails.email || '',
                    assignedDate: assignedDate  // Include the assigned date of the current assigned doctor
                }
            };
        }).filter(Boolean);

        return sendResponse(req, res, 200, {
            status: true,
            message: "Number of patients with current assigned doctor fetched successfully",
            data: {
                countOfPatientsWithCurrentAssignedDoctor : patientData.length,
                patientData
            },
            errorCode: null,
        });

    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            message: "Internal server error",
            body: error.stack,
            errorCode: null,
        });
    }
}


  

  async getTotalAmountPaid(req, res) {
    try {
      const aggregate = [
        {
          $match: {
            status: "paid",
          },
        },
        {
          $addFields: {
            month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            amount: { $toDouble: "$amountPaid" },
          },
        },
        {
          $group: {
            _id: { transactionType: "$transactionType", month: "$month" },
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { "_id.month": 1, "_id.transactionType": 1 },
        },
        {
          $project: {
            transactionType: "$_id.transactionType",
            month: "$_id.month",
            totalAmount: 1,
            count: 1,
            _id: 0,
          },
        },
      ];
  
      const result = await purchasehistory.aggregate(aggregate);
  
      const summary = {
        subscription: [],
        addon: [],
        labRadioTests: [],
        medicine: [],
      };
  
      result.forEach((item) => {
        const transactionType = item.transactionType;
        const data = {
          month: item.month,
          totalAmount: item.totalAmount,
          count: item.count,
        };
        if (transactionType === "subscription") {
          summary.subscription.push(data);
        } else if (transactionType === "addon") {
          summary.addon.push(data);
        } else if (transactionType === "labRadioTests") {
          summary.labRadioTests.push(data);
        } else if (transactionType === "medicine") {
          summary.medicine.push(data);
        }
      });
  

      return sendResponse(req,res,200,{
        
        status: true,
        message: "Number of patients with current assigned doctor fetched successfully",
        data: summary,
        errorCode: null,
      });

    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
        body: error.stack,
        errorCode: null,
      });
    }
  }

    //BY DILIP
    async logoutPatient(req, res) {
      try {
        const { mobile } = req.body;
        const {country_code} = req.body;
    
        // Find user by mobile number
        const portalUserData = await PortalUser.findOne({ mobile,country_code }).lean();
        if (!portalUserData) {
          return sendResponse(req, res, 404, {
            status: false,
            body: null,
            message: "User not found",
            errorCode: "USER_NOT_FOUND",
          });
        }
    
        // Clear deviceToken array
        await PortalUser.findByIdAndUpdate(
          portalUserData._id,
          { $set: { deviceToken: [] } },
          { new: true }
        );
    
        // Get patient name from ProfileInfo
        const getPatientName = await ProfileInfo.findOne({
          for_portal_user: { $eq: portalUserData._id },
        }).select("full_name");
    
        // Save audit logs
        await httpService.postStaging(
          "superadmin/add-logs",
          {
            userId: portalUserData?._id,
            userName: getPatientName?.full_name,
            role: "patient",
            action: `logout`,
            actionDescription: `Logout: Patient ${getPatientName?.full_name} logged out successfully.`,
          },
          {},
          "superadminServiceUrl"
        );
    
        return sendResponse(req, res, 200, {
          status: true,
          body: { token: null },
          message: "Logout successful",
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
  
  async getLabTestsByDiscountCoupon(req, res) {
    const headers = {
      Authorization: req.headers["authorization"],
    };

    const { discountCouponId, page, limit, fromDate, toDate } = req.query;
  
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
  
    try {
      const matchStage = {
        $and: [
          { transactionType: 'labRadioTests' },
          { discountCoupon: { $ne: null } },
          { discountCouponId: { $exists: true, $ne: null } }
        ]
      };
  
      if (discountCouponId) {
        matchStage.$and.push({ discountCouponId: discountCouponId });
      }
  
      if (fromDate && toDate) {
        matchStage.$and.push({
          createdAt: {
            $gte: new Date(fromDate),
            $lte: new Date(toDate)
          }
        });
      }
  
      const basePipeline = [
        { $match: matchStage },
        { $unwind: "$testInfo" },
        {
          $lookup: {
            from: "profileinfos",
            localField: "forUser",
            foreignField: "for_portal_user",
            as: "patientInfo"
          }
        },
        { $unwind: "$patientInfo" },
        {
          $project: {
            createdAt: 1,
            forUser: 1,
            discountCoupon: 1,
            discountCouponId: 1,
            patientName: "$patientInfo.full_name",
            mrnNumber: "$patientInfo.mrn_number",
            testName: "$testInfo.testName",
            testPrice: "$testInfo.testPrice",
            loincCode: "$testInfo.loinc.loincCode",
            center_name: "$testInfo.centerDetails.centre_name",
            center_mobile: "$testInfo.centerDetails.mobile",
            center_email: "$testInfo.centerDetails.email"
          }
        },
        { $sort: { createdAt: -1 } }
      ];
  
      // Paginated Results
      const paginatedResult = await purchasehistory.aggregate([
        ...basePipeline,
        {
          $facet: {
            metadata: [{ $count: "total" }],
            paginatedResults: [
              { $skip: skip },
              { $limit: limitNumber }
            ]
          }
        }
      ]);
  
      const totalCount = paginatedResult[0]?.metadata[0]?.total || 0;
      const testResults = paginatedResult[0]?.paginatedResults || [];
  
      // Full List for Export
      const exportedListData = await purchasehistory.aggregate(basePipeline);
      const uniqueDiscountCouponIds = [
        ...new Set(exportedListData.map(item => item?.discountCouponId).filter(Boolean))
      ];
      const couponMap = {};
      if(uniqueDiscountCouponIds.length > 0){
        const getCouponDetails = await httpService.getStaging(
          "subscription/get-coupon-details-by-ids",
          { couponIds:uniqueDiscountCouponIds },
          headers,
          "superadminServiceUrl"
        );
        
        if (getCouponDetails?.status && Array.isArray(getCouponDetails.body)) {
          getCouponDetails.body.forEach(coupon => {
            couponMap[coupon._id] = {
              percentOff: coupon.percentOff,
              type: coupon.type
            };
          });
        }
        
      }
      // Step 4: Merge coupon data into exportedListData
      const updatedExportedListData = exportedListData.map(item => {
        const couponInfo = couponMap[item.discountCouponId];
        return {
          ...item,
          ...(couponInfo ? {
            percentOff: couponInfo.percentOff,
            type: couponInfo.type
          } : {})
        };
      });
      
      return sendResponse(req, res, 200, {
        status: true,
        message: "Tests fetched successfully",
        body: {
          totalRecords: totalCount,
          result: testResults,
          exportedListData: updatedExportedListData
        },
        errorCode: null
      });
  
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Internal server error",
        errorCode: 'INTERNAL_SERVER_ERROR'
      });
    }
  }
  
  async getLabRadioTestInvoiceCancelDetails(req, res) {
    const { fromDate, toDate } = req.query;
  
    try {
      const matchStage = {
        status: 'refunded',
        transactionType: 'labRadioTests',
      };
  
      if (fromDate && toDate) {
        matchStage.createdAt = {
          $gte: new Date(fromDate),
          $lte: new Date(toDate),
        };
      }
  
      const basePipeline = [
        { $match: matchStage },
        { $unwind: { path: "$testInfo", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$refundedInfo", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "profileinfos",
            localField: "forUser",
            foreignField: "for_portal_user",
            as: "patientInfo",
          },
        },
        { $unwind: { path: "$patientInfo", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "portalusers",
            localField: "forUser",
            foreignField: "_id",
            as: "patientBasicInfo",
          },
        },
        { $unwind: { path: "$patientBasicInfo", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            patientMobile: {
              $concat: [
                { $ifNull: ["$patientBasicInfo.country_code", ""] },
                { $ifNull: ["$patientBasicInfo.mobile", ""] },
              ],
            },
          },
        },
        {
          $project: {
            createdAt: 1,
            forUser: 1,
            status: 1,
            patientName: "$patientInfo.full_name",
            mrnNumber: "$patientInfo.mrn_number",
            patientMobile: 1,
            testName: "$testInfo.testName",
            testPrice: "$testInfo.testPrice",
            loincCode: "$testInfo.loinc.loincCode",
            center_name: "$testInfo.centerDetails.centre_name",
            center_mobile: "$testInfo.centerDetails.mobile",
            center_email: "$testInfo.centerDetails.email",
            doctorName: "$testInfo.doctorDetails.doctorName",
            cancellation_date: "$refundedInfo.created_at",
          },
        },
        { $sort: { createdAt: -1 } },
      ];
  
      const exportedListData = await purchasehistory.aggregate(basePipeline);
  
      return sendResponse(req, res, 200, {
        status: true,
        message: "Export Data fetched successfully",
        body: {
          totalRecords: exportedListData.length,
          exportedListData,
        },
        errorCode: null,
      });
    } catch (error) {
      console.error("Error fetching lab radio test invoice cancel details:", error);
  
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Internal server error",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  
    
    
    
  
}

module.exports = {
  patient: new Patient(),
};
