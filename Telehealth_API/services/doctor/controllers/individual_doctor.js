"use strict";

// models
import PortalUser from "../models/portal_user";
import BasicInfo from "../models/basic_info";
import HospitalAdminInfo from "../models/hospital_admin_info";
import Appointment from "../models/appointment";
import PrescribeLabTest from "../models/prescribe_lab_test";
import PrescribeRadiologyTest from "../models/prescribe_radiology_test";
import Eprescription from "../models/eprescription";
import ProfileInfo from "../models/profile_info";
import LocationInfo from "../models/location_info";
import IndividualDoctorInfo from "../models/individual_doctor_info";
import StaffInfo from "../models/staff_info";
import ReviewAndRating from "../models/review";
import Counter from "../models/counter";
import ForgotPasswordToken from "../models/forgot_password_token";
import Otp2fa from "../models/otp2fa";
import Logs from "../models/logs";

import {
  externalUserAddEmail,
  sendMailInvitations,
} from "../helpers/emailTemplate";
import Invitation from "../models/email_invitation";

// utils
import { sendResponse } from "../helpers/transmission";
import { hashPassword } from "../helpers/string";
import {
  bcryptCompare,
  checkPassword,
  generateRefreshToken,
  generateTenSaltHash,
  generateToken,
} from "../middleware/utils";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { sendEmail } from "../helpers/ses";
import { config, generate4DigitOTP, smsTemplateOTP } from "../config/constants";
const {
  OTP_EXPIRATION,
  OTP_LIMIT_EXCEED_WITHIN,
  OTP_TRY_AFTER,
  SEND_ATTEMPTS,
  test_p_FRONTEND_URL,
  LOGIN_AFTER,
  PASSWORD_ATTEMPTS,
} = config;
import { sendSms } from "../middleware/sendSms";
import {
  agoraStartRecording,
  agoraStopRecording,
  agoraTokenGenerator,
} from "../helpers/chat";
import Http from "../helpers/httpservice";
import mongoose from "mongoose";
import GuestUser from "../models/guestuser";
import { notification } from "../helpers/notification";
import { generateSignedUrl } from "../helpers/gcs";
const moment = require("moment/moment")
const httpService = new Http();

const canSendOtp = (deviceExist, currentTime) => {
  return new Promise((resolve, reject) => {
    const limitExceedWithin1 = new Date(
      currentTime.getTime() + OTP_LIMIT_EXCEED_WITHIN * 60000
    );
    let returnData = { status: false, limitExceedWithin: limitExceedWithin1 };
    if (!deviceExist) resolve({ status: true }); // First time sending
    const { send_attempts, limitExceedWithin, isTimestampLocked } = deviceExist;
    const limitExceedTimestamp = new Date(limitExceedWithin);
    if (send_attempts <= SEND_ATTEMPTS && currentTime > limitExceedTimestamp) {
      resolve({
        status: true,
        limitExceedWithin: limitExceedWithin1,
        send_attempts: 1,
        reset: true,
        isTimestampLocked: false,
      }); // Reset attempts if time has exceeded
    } else if (send_attempts < SEND_ATTEMPTS) {
      resolve({ status: true }); // Allow sending if below SEND_ATTEMPTS attempts
    }
    const addMinutes = new Date(currentTime.getTime() + OTP_TRY_AFTER * 60000);
    if (send_attempts == SEND_ATTEMPTS && !isTimestampLocked) {
      returnData.limitExceedWithin = addMinutes;
      returnData.isTimestampLocked = true;
    }
    resolve(returnData); // Otherwise, do not allow sending
  });
};

const startVideoRecording = async (roomName, uid, appointmentId, userId) => {
  try {
    const getAppointment = await Appointment.findById(appointmentId);

    let layoutConfig = [];
    if (getAppointment?.participants) {
      for (const ele of getAppointment?.participants) {
        layoutConfig.push({
          x_axis: 0, // Top-left corner
          y_axis: 0, // Top-left corner
          width: 960, // Half the canvas width
          height: 1080, // Full canvas height
          uid: ele?.userIdentity,
        });
      }
    }
    if (layoutConfig.length > 0) {
      const result = await agoraStartRecording(
        roomName,
        uid,
        userId,
        appointmentId,
        layoutConfig
      );

      await Appointment.findOneAndUpdate(
        { _id: appointmentId },
        {
          $set: {
            uid,
            sid: result?.sid,
            resourceId: result?.resourceId,
          },
        }
      );
      return {
        success: true,
        message: "Recording started successfully",
        data: result,
      };
    }

    return { success: false, message: "No participants found for recording" };
  } catch (e) {
    console.error("Error while recording initiating:", e);
    return {
      success: false,
      message: "Error while recording initiating",
      error: e,
    };
  }
};
class IndividualDoctor {
  async CreateGuestUser(req, res) {
    try {
      const { name } = req.body;
      if (name == "") {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "Please enter Name",
          errorCode: null,
        });
      }
      let token = generateToken({ name: name });
      let guestData = new GuestUser({
        name: name,
        token: token,
      });
      let response = await guestData.save();
      if (response) {
        return sendResponse(req, res, 200, {
          status: true,
          body: response,
          message: "successfully created",
          errorCode: null,
        });
      } else {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "Something went wrong",
          errorCode: null,
        });
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

  async signUp(req, res) {
    try {
      const {
        first_name,
        middle_name,
        last_name,
        email,
        password,
        country_code,
        mobile,
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
        mobile,
        password: newPassword,
        role: "INDIVIDUAL_DOCTOR",
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
        main_phone_number: mobile,
      });
      let adminDetails = await adminData.save();

      let superadminData = await httpService.getStaging(
        "superadmin/get-super-admin-data",
        {},
        {},
        "superadminServiceUrl"
      );

      let requestData = {
        created_by_type: "individual-doctor",
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
        message: "successfully Sign Up",
        errorCode: null,
      });
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
  async listIndividualDoctor(req, res) {
    try {
      const { in_hospital, limit, page } = req.body;
      const result = await IndividualDoctorInfo.find({
        in_hospital: { $eq: in_hospital },
      })
        .select({
          specilaization: 1,
          _id: 1,
          exp_years: 1,
          unite: 1,
          licence_number: 1,
        })
        .populate({
          path: "in_profile",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "for_portal_user",
          select: { _id: 1, email: 1, user_name: 1, phone_number: 1 },
        })
        .sort([["createdAt", -1]])
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();
      const count = await IndividualDoctorInfo.countDocuments({
        in_hospital: { $eq: in_hospital },
      });
      sendResponse(req, res, 200, {
        status: true,
        body: {
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          totalRecords: count,
          result,
        },
        message: "successfully fetched individual doctor list",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to fetch doctor list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async individualDoctor(req, res) {
    try {
      const { individual_doctor_id } = req.body;
      const result = await IndividualDoctorInfo.find({
        _id: individual_doctor_id,
      })
        .select({
          specilaization: 1,
          _id: 1,
          exp_years: 1,
          unite: 1,
          licence_number: 1,
        })
        .populate({
          path: "in_profile",
          select: { _id: 1, name: 1 },
        })
        .populate({
          path: "for_portal_user",
          select: { _id: 1, email: 1, user_name: 1, phone_number: 1 },
        })
        .exec();
      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: "successfully fetched doctor details",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to fetch doctor list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const { uuid } = req.headers;

      const portalUserData = await PortalUser.findOne({
        email,
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

      const currentTime = new Date();
      const isPasswordMatch = await checkPassword(password, portalUserData);
      if (!isPasswordMatch) {
        let data;
        if (
          !portalUserData?.lock_details ||
          portalUserData.lock_details?.passwordAttempts != PASSWORD_ATTEMPTS
        ) {
          data = await PortalUser.findOneAndUpdate(
            { _id: portalUserData._id },
            { $inc: { "lock_details.passwordAttempts": 1 } },
            { new: true }
          );
        }
        if (data?.lock_details?.passwordAttempts == PASSWORD_ATTEMPTS) {
          const addMinutes = new Date(
            currentTime.getTime() + LOGIN_AFTER * 60000
          );
          await PortalUser.findOneAndUpdate(
            { _id: portalUserData._id },
            {
              $set: {
                lock_user: true,
                "lock_details.timestamps": addMinutes,
                "lock_details.lockedReason": "Incorrect password attempt",
                "lock_details.lockedBy": "doctor",
              },
            }
          );
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
      const lock_details = portalUserData?.lock_details;
      //Unlock doctor account if locked by doctor itself
      if (
        portalUserData?.lock_details &&
        portalUserData.lock_details?.lockedBy == "doctor"
      ) {
        const getTimestamp = new Date(portalUserData.lock_details?.timestamps);
        if (currentTime.getTime() > getTimestamp.getTime()) {
          await PortalUser.findOneAndUpdate(
            { _id: portalUserData._id },
            {
              $set: { lock_user: false },
              $unset: { lock_details: "" },
            }
          );
          isAccountLocked = false;
        }
      }
      if (isAccountLocked) {
        let message = "User account temporarily locked.";
        if (
          lock_details &&
          lock_details?.timestamps &&
          lock_details?.passwordAttempts == PASSWORD_ATTEMPTS
        ) {
          const timeLeft = new Date(lock_details?.timestamps) - currentTime;
          message = `User account temporarily locked. Try again after ${Math.ceil(
            timeLeft / 60000
          )} minutes.`;
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
          { _id: portalUserData._id },
          {
            $unset: { lock_details: "" },
          }
        );
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

      const tokenData = {
        _id: portalUserData._id,
        email: portalUserData.email,
        role: portalUserData.role,
        uuid,
      };

      if (
        adminData?.isInfoCompleted === false &&
        (portalUserData.role == "INDIVIDUAL_DOCTOR" ||
          portalUserData.role == "INDIVIDUAL_DOCTOR_ADMIN")
      ) {
        return sendResponse(req, res, 200, {
          status: true,
          body: {
            otp_verified: portalUserData.verified,
            user_details: {
              portalUserData,
              adminData,
            },
          },
          message: "Please fill in the basic information.",
          errorCode: "FILL BASIC INFO!!",
        });
      }
      // logs
      const currentDate = new Date();
      const timeZone = process.env.TIMEZONE
      const formattedDate = currentDate.toLocaleString("en-US", { timeZone });
      
      let addLogs = {};
      let saveLogs = {};
      if (
        portalUserData.role == "INDIVIDUAL_DOCTOR" ||
        portalUserData.role == "INDIVIDUAL_DOCTOR_ADMIN"
      ) {
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
      let activeToken = generateToken(tokenData);
      await PortalUser.findOneAndUpdate(
        { _id: portalUserData._id },
        {
          $set: { activeToken: activeToken },
        }
      );
      const savedLogId = saveLogs ? saveLogs._id : null;
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

      await Otp2fa.updateMany(
        { uuid },
        {
          $set: {
            verified: false,
          },
        }
      );
      const getData = await Otp2fa.findOne({ uuid });
      
      if (getData) {
        const getDoctor = await BasicInfo.findOne({
          for_portal_user: req.user._id,
        }).select("full_name for_portal_user");        
        //Save audit logs
        await httpService.postStaging(
          "superadmin/add-logs",
          {
            userId: req.user._id,
            userName: getDoctor?.full_name,
            role: "doctor",
            action: `logout`,
            actionDescription: `Logout: Doctor ${getDoctor?.full_name} logout successfully.`,
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
  async getIndividualDoctorsByStatus(req, res) {
    try {
      const { status } = req.query;
      const findUsers = await IndividualDoctorProfile.find({
        verify_status: status,
      }).populate({
        path: "for_portal_user",
      });
      sendResponse(req, res, 200, {
        status: true,
        body: findUsers,
        message: "Get individual doctor list",
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get individual doctor list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async approveOrRejectIndividualDoctor(req, res) {
    const { verify_status, individualDoctorId, approved_or_rejected_by } =
      req.body;
    let date = null;
    if (verify_status == "APPROVED") {
      const cdate = new Date();
      date = `${cdate.getFullYear()}-${
        cdate.getMonth() + 1
      }-${cdate.getDate()}`;
    }

    try {
      const result = await BasicInfo.findOneAndUpdate(
        { for_portal_user: individualDoctorId },
        {
          $set: {
            verify_status,
            approved_at: date,
            approved_or_rejected_by,
          },
        },
        { upsert: false, new: true }
      ).exec();
      if (result) {
        sendResponse(req, res, 200, {
          status: true,
          data: result,
          message: `${verify_status} individual doctor successfully`,
          errorCode: null,
        });
      }
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        data: error,
        message: `individual doctor request ${verify_status}`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async forgotPassword(req, res) {
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };
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

      const link = `${test_p_FRONTEND_URL}/individual-doctor/newpassword?token=${resetToken}&user_id=${userData._id}`;
      const getEmailContent = await httpService.getStaging(
        "superadmin/get-notification-by-condition",
        { condition: "FORGOT_PASSWORD", type: "email" },
        headers,
        "superadminServiceUrl"
      );
      let emailContent;
      if (getEmailContent?.status && getEmailContent?.data?.length > 0) {
        emailContent = getEmailContent?.data[0]?.content.replace(
          "{{link}}",
          link
        );
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
        body: emailContent,
      };
      let sendEmailStatus = sendEmail(content, email);
      if (sendEmailStatus) {
        return sendResponse(req, res, 200, {
          status: true,
          message: "A password reset link has been sent to your email.",
          body: null,
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

  async sendSmsOtpFor2fa(req, res) {
    try {
      const { email } = req.body;
      const { uuid } = req.headers;
      const headers = {
        Authorization: req.headers["authorization"],
      };
      const portalUserData = await PortalUser.findOne({
        email,
        isDeleted: false,
      }).lean();
      if (!portalUserData) {
        return sendResponse(req, res, 422, {
          status: false,
          body: null,
          message: "User does not exist.",
          errorCode: "USER_NOT_EXIST",
        });
      }
      await Otp2fa.updateMany(
        { uuid },
        {
          $set: {
            verified: false,
          },
        }
      );
      const mobile = portalUserData.mobile;
      const country_code = portalUserData.country_code;
      const deviceExist = await Otp2fa.findOne({
        mobile,
        country_code,
        uuid,
        for_portal_user: portalUserData._id,
      }).lean();

      const currentTime = new Date();

      const canOtpSend = await canSendOtp(deviceExist, currentTime);

      // Check if the OTP can be sent
      if (!canOtpSend.status) {
        const timeLeft =
          new Date(
            deviceExist.isTimestampLocked
              ? deviceExist.limitExceedWithin
              : canOtpSend.limitExceedWithin
          ) - currentTime;
        if (!deviceExist.isTimestampLocked) {
          await Otp2fa.findOneAndUpdate(
            { mobile, country_code, uuid, for_portal_user: portalUserData._id },
            {
              $set: {
                limitExceedWithin: canOtpSend.limitExceedWithin,
                isTimestampLocked: canOtpSend.isTimestampLocked,
              },
            }
          ).exec();
        }

        return sendResponse(req, res, 200, {
          status: false,
          message: `Maximum limit exceeded. Try again after ${Math.ceil(
            timeLeft / 60000
          )} minutes.`,
          errorCode: null,
        });
      }

      let otp = 1111;

      if (process.env.NODE_ENV === "production") {
        otp = generate4DigitOTP();
      }

      const otpExpiration = new Date(
        currentTime.getTime() + OTP_EXPIRATION * 60000
      ); //This will add 10 minutes time for otp expiration
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
      let updateObject = {
        otp,
        otpExpiration,
        send_attempts: (deviceExist ? deviceExist.send_attempts : 0) + 1,
      };
      let result = null;
      if (deviceExist) {
        updateObject.limitExceedWithin = canOtpSend.limitExceedWithin;
        if (canOtpSend?.reset) {
          updateObject.send_attempts = 1;
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
          send_attempts: 1,
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

  async sendEmailOtpFor2fa(req, res) {
    try {
      const { email } = req.body;
      const { uuid } = req.headers;
      const headers = {
        Authorization: req.headers["authorization"],
      };
      const portalUserData = await PortalUser.findOne({
        email,
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
      await Otp2fa.updateMany(
        { uuid },
        {
          $set: {
            verified: false,
          },
        }
      );
      const deviceExist = await Otp2fa.findOne({
        email,
        uuid,
        for_portal_user: portalUserData._id,
      }).lean();

      const currentTime = new Date();

      const canOtpSend = await canSendOtp(deviceExist, currentTime);

      // Check if the OTP can be sent
      if (!canOtpSend.status) {
        const timeLeft =
          new Date(
            deviceExist.isTimestampLocked
              ? deviceExist.limitExceedWithin
              : canOtpSend.limitExceedWithin
          ) - currentTime;
        if (!deviceExist.isTimestampLocked) {
          await Otp2fa.findOneAndUpdate(
            { email, uuid, for_portal_user: portalUserData._id },
            {
              $set: {
                limitExceedWithin: canOtpSend.limitExceedWithin,
                isTimestampLocked: canOtpSend.isTimestampLocked,
              },
            }
          ).exec();
        }

        return sendResponse(req, res, 200, {
          status: false,
          message: `Maximum limit exceeded. Try again after ${Math.ceil(
            timeLeft / 60000
          )} minutes.`,
          errorCode: null,
        });
      }

      const otp = generate4DigitOTP();
      const otpExpiration = new Date(
        currentTime.getTime() + OTP_EXPIRATION * 60000
      ); //This will add 10 minutes time for otp expiration
      const getEmailContent = await httpService.getStaging(
        "superadmin/get-notification-by-condition",
        { condition: "LOGIN_OTP", type: "email" },
        headers,
        "superadminServiceUrl"
      );
      let emailContent;
      if (getEmailContent?.status && getEmailContent?.data?.length > 0) {
        emailContent = getEmailContent?.data[0]?.content.replace(
          "{{otp}}",
          otp
        );
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
        body: emailContent,
      };
      sendEmail(content, email);
      let updateObject = {
        otp,
        otpExpiration,
        send_attempts: (deviceExist ? deviceExist.send_attempts : 0) + 1,
      };
      let result = null;
      if (deviceExist) {
        updateObject.limitExceedWithin = canOtpSend.limitExceedWithin;
        if (canOtpSend?.reset) {
          updateObject.send_attempts = 1;
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
          send_attempts: 1,
        }).save();
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

  async matchOtpFor2fa(req, res) {
    try {
      const { mobile, otp, for_portal_user } = req.body;
      const { uuid } = req.headers;
      const otpResult = await Otp2fa.findOne({
        uuid,
        mobile,
        for_portal_user,
        verified: false,
      });
      if (otpResult) {
        const portalUserData = await PortalUser.findOne({
          _id: for_portal_user,
        }).lean();
        if (!portalUserData) {
          return sendResponse(req, res, 422, {
            status: false,
            body: null,
            message: "User does not exist.",
            errorCode: null,
          });
        }
        //Check OTP expiry
        const timestamp1 = new Date(); // First timestamp
        const timestamp2 = new Date(otpResult?.otpExpiration); // Second timestamp

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
            { uuid, mobile, for_portal_user, verified: false },
            {
              $set: {
                verified: true,
              },
            },
            { new: true }
          ).exec();


          let adminData;

          if (
            portalUserData.role === "INDIVIDUAL_DOCTOR" ||
            portalUserData.role === "INDIVIDUAL_DOCTOR_ADMIN"
          ) {
            adminData = await BasicInfo.findOne({
              for_portal_user: portalUserData._id,
            })
              .populate({
                path: "profile_picture",
                select: "url",
              })
              .exec();
          } else {
            adminData = await StaffInfo.findOne({
              for_portal_user: portalUserData._id,
            })
              .populate({
                path: "in_profile",
              })
              .exec();
          }

          if (portalUserData.role == "INDIVIDUAL_DOCTOR") {
            await BasicInfo.findOne({
              for_portal_user: portalUserData._id,
            })
              .populate({
                path: "profile_picture",
                select: "url",
              })
              .exec();
          }

          if (
            adminData?.isInfoCompleted === false &&
            portalUserData?.role == "INDIVIDUAL_DOCTOR"
          ) {
            return sendResponse(req, res, 200, {
              status: true,
              body: {
                otp_verified: portalUserData.verified,
                user_details: {
                  portalUserData,
                  adminData,
                },
              },
              message: "OTP matched successfully.",
              errorCode: "FILL BASIC INFO!!",
            });
          }
          //Save audit logs
          await httpService.postStaging(
            "superadmin/add-logs",
            {
              userId: portalUserData?._id,
              userName: adminData?.full_name,
              role: "doctor",
              action: `login`,
              actionDescription: `Login: Doctor ${adminData?.full_name} login successfully.`,
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
          // logs
          const currentDate = new Date();
          const timeZone = process.env.TIMEZONE
          const formattedDate = currentDate.toLocaleString("en-US", { timeZone });
          
            let addLogs = {};
            let saveLogs = {};
            if (portalUserData.role == "INDIVIDUAL_DOCTOR" || portalUserData.role == "INDIVIDUAL_DOCTOR_ADMIN") {
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
                  fullName: adminData?.full_name,
                  email: portalUserData?.email,
                  mobile: portalUserData?.mobile,
                  country_code: portalUserData?.country_code,
                  role: portalUserData?.role,
                },
                adminData: {
                  _id: portalUserData?._id,
                  role: portalUserData?.role,
                },
                savedLogId
              }
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
      console.log("error___", error);

      sendResponse(req, res, 500, {
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
      const otpResult = await Otp2fa.findOne({
        uuid,
        email,
        for_portal_user,
        verified: false,
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
        const timestamp1 = new Date(); // First timestamp
        const timestamp2 = new Date(otpResult?.otpExpiration); // Second timestamp

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
            { uuid, email, for_portal_user, verified: false },
            {
              $set: {
                verified: true,
              },
            },
            { new: true }
          ).exec();

          let adminData;

          if (
            portalUserData.role === "INDIVIDUAL_DOCTOR" ||
            portalUserData.role === "INDIVIDUAL_DOCTOR_ADMIN"
          ) {
            adminData = await BasicInfo.findOne({
              for_portal_user: portalUserData._id,
            })
              .populate({
                path: "profile_picture",
                select: "url",
              })
              .exec();
          } else {
            adminData = await StaffInfo.findOne({
              for_portal_user: portalUserData._id,
            })
              .populate({
                path: "in_profile",
              })
              .exec();
          }

          if (
            adminData?.isInfoCompleted === false &&
            portalUserData?.role == "INDIVIDUAL_DOCTOR"
          ) {
            return sendResponse(req, res, 200, {
              status: true,
              body: {
                otp_verified: portalUserData.verified,
                user_details: {
                  portalUserData,
                  adminData,
                },
              },
              message: "OTP matched successfully.",
              errorCode: "FILL BASIC INFO!!",
            });
          }
          //Save audit logs
          await httpService.postStaging(
            "superadmin/add-logs",
            {
              userId: portalUserData?._id,
              userName: adminData?.full_name,
              role: "doctor",
              action: `login`,
              actionDescription: `Login: Doctor ${adminData?.full_name} login successfully.`,
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
           // logs
           const currentDate = new Date();
           const timeZone = process.env.TIMEZONE;
           
           const formattedDate = currentDate.toLocaleString("en-US", { timeZone });
           
           
           let addLogs = {};
           let saveLogs = {};
           if (portalUserData.role == "INDIVIDUAL_DOCTOR" || portalUserData.role == "INDIVIDUAL_DOCTOR_ADMIN") {
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
                  fullName: adminData?.full_name,
                  email: portalUserData?.email,
                  mobile: portalUserData?.mobile,
                  country_code: portalUserData?.country_code,
                  role: portalUserData?.role,
                },
                adminData: {
                  _id: portalUserData?._id,
                  role: portalUserData?.role,
                },
                savedLogId
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
      sendResponse(req, res, 500, {
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
      const portalUserData = await PortalUser.findOne({ _id: id }).lean();
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
          message:
            "This is your previous password. Please enter a new password.",
          errorCode: "INCORRECT_PASSWORD",
        });
      }
      const result = await PortalUser.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            password: passwordHash,
          },
        },
        { new: true }
      ).exec();
      sendResponse(req, res, 200, {
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

  async resetForgotPassword(req, res) {
    const { user_id, resetToken, newPassword } = req.body;
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
          //DELETE the token after successful reset
      await ForgotPasswordToken.deleteOne({ user_id });
        sendResponse(req, res, 200, {
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

  async fetchRoomCall(req, res) {
    try {
      const headers = {
        Authorization: req.body.authtoken,
      };
      let appintmentdetails = await httpService.getStaging(
        "doctor/view-appointment-by-roomname",
        { roomname: req?.body?.roomName },
        headers,
        "doctorServiceUrl"
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
                "doctor/update-videocall-appointment",
                {
                  appointmentId: req.body.chatId,
                  participants: "",
                  leftparticipantsid: el.userId.toString(),
                  participantstype: "remove",
                },
                headers,
                "doctorServiceUrl"
              );
              await httpService.postStaging(
                "doctor/update-videocall-appointment",
                {
                  appointmentId: req.body.chatId,
                  participants: dataPass,
                  participantstype: "add",
                },
                headers,
                "doctorServiceUrl"
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
            "doctor/update-videocall-appointment",
            {
              appointmentId: req.body.chatId,
              participants: dataPass,
              participantstype: "add",
            },
            headers,
            "doctorServiceUrl"
          );
        }
        /** Enabled recording for prod env */
        if (process.env.NODE_ENV === "production") {
          let checking = startVideoRecording(
            roomName,
            uniqueId,
            req.body.chatId,
            req.body.loggedInUserId
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
        message: "Token Not Generated",
        errorCode: "Some thing went wrong",
      });
    }
  }
  async startRecordings(req, res) {
    try {
      const { roomName, uid, appointmentId, userId } = req.body;
      const getAppintment = await Appointment.findById(appointmentId);
      let layoutConfig = [];
      if (getAppintment?.participants) {
        let obj = {
          x_axis: 0, // Top-left corner
          y_axis: 0, // Top-left corner
          width: 960, // Half the canvas width
          height: 1080, // Full canvas height
        };
        for (const ele of getAppintment?.participants) {
          obj.uid = ele?.userIdentity;
          layoutConfig.push(obj);
        }
      }
      if (layoutConfig.length > 0) {
        const result = await agoraStartRecording(
          roomName,
          uid,
          userId,
          appointmentId,
          layoutConfig
        );

        await Appointment.findOneAndUpdate(
          { _id: appointmentId },
          {
            $set: {
              uid,
              sid: result?.sid,
              resourceId: result?.resourceId,
            },
          }
        );
      }
      sendResponse(req, res, 200, {
        status: true,
        body: null,
        message: "Recording started successfully",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "Error while recording initiating",
        errorCode: "Something went wrong",
      });
    }
  }

  async stopRecordings(req, res) {
    try {
      const { id } = req.params;
      const getAppointment = await Appointment.findById(id).select(
        "resourceId sid uid roomName"
      );
      const dataObj = {
        resourceId: getAppointment?.resourceId,
        sid: getAppointment?.sid,
        uid: getAppointment?.uid,
        roomName: getAppointment?.roomName,
      };
      const result = await agoraStopRecording(dataObj);
      if (result) {
        await Appointment.findOneAndUpdate(
          { _id: id },
          {
            $push: {
              recordingUrls: result,
            },
          }
        );
      }
      sendResponse(req, res, 200, {
        status: true,
        body: null,
        message: "Recording stop successfully",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "Error while stop recording",
        errorCode: "Something went wrong",
      });
    }
  }

  async sendEmailtojoinexternaluser(req, res) {
    try {
      const { email, appointment, portaltype, dec_appointment } = req.body;
      const headers = {
        Authorization: req.headers["authorization"],
      };
      let portalinfo = portaltype != "" ? `&portal=${portaltype}` : "";
      const link = `${process.env.test_p_FRONTEND_URL}/external-video?id=${appointment}${portalinfo}`;

      let result = await PortalUser.findOne({ email: email });

      if (result) {
        let receiverId = result._id;
        let serviceurl = "doctorServiceUrl";
        let message = `Join Meeting to open the given link`;

        let requestData = {
          created_by_type: "doctor",
          created_by: req.user._id,
          content: message,
          url: "",
          for_portal_user: receiverId,
          notitype: "External Meeting Join",
          appointmentId: dec_appointment,
          title: "External Meeting",
        };

        await notification(
          "",
          "",
          serviceurl,
          "",
          "",
          "",
          headers,
          requestData
        );
      }
      // return;
      const content = externalUserAddEmail(email, link);

      sendEmail(content);
      return sendResponse(req, res, 200, {
        status: true,
        body: {},
        message: "Email Sent successfully",
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

  async participantInfo(req, res) {
    try {
      let getData = await Appointment.findOne({
        roomName: req.query.roomName,
        participants: {
          $elemMatch: { userIdentity: req.query.identtity },
        },
      });
      if (getData.participants) {
        getData.participants.forEach(async (ele) => {

          if (ele.userIdentity == req.query.identtity) {
            return sendResponse(req, res, 200, {
              status: true,
              body: ele,
              message: "Data Done",
              errorCode: null,
            });
          }
        });
      } else {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "Data Failed",
          errorCode: "Some thing went wrong",
        });
      }
    } catch (e) {
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: e.errorCode,
        errorCode: "Some thing went wrong",
      });
    }
  }

  async getIndividualDoctorsById(req, res) {
    const { for_portal_user, forUser } = req.query;
    try {
      let findUsers;
      if (forUser == "doctor") {
        findUsers = await BasicInfo.findOne(
          { for_portal_user },
          { for_portal_user: 1, full_name: 1 }
        ).populate({
          path: "profile_picture",
          select: "url",
        });
      } else {
        findUsers = await HospitalAdminInfo.findOne(
          { for_portal_user },
          {
            for_portal_user: 1,
            hospital_name: 1,
            profile_picture: 1,
          }
        );
      }
      sendResponse(req, res, 200, {
        status: true,
        body: findUsers,
        message: "Get individual doctor list",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get individual doctor details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async sendInvitation(req, res) {
    try {
      const {
        first_name,
        middle_name,
        last_name,
        email,
        phone,
        address,
        created_By,
        invitationId,
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
            },
          },
          { new: true }
        );

        if (updatedUserData) {
          const loggedInData = await PortalUser.find({
            for_portal_user: created_By,
          });
          const loggeInname = loggedInData[0].full_name;
          const content = sendMailInvitations(
            email,
            first_name,
            last_name,
            loggeInname
          );
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
        let userData = await Invitation.findOne({
          email,
          verify_status: "PENDING",
        });

        if (!userData) {
          userData = new Invitation({
            first_name,
            middle_name,
            last_name,
            email,
            phone,
            address,
            created_By,
            verify_status: "PENDING",
          });
          userData = await userData.save();
        }

        const loggedInData = await PortalUser.find({
          for_portal_user: created_By,
        });
        const loggeInname = loggedInData[0].full_name;
        const content = sendMailInvitations(
          email,
          first_name,
          last_name,
          loggeInname
        );
        const mailSent = await sendEmail(content);

        if (mailSent) {
          userData.verify_status = "SEND";
          await userData.save();
        }

        if (userData) {
          sendResponse(req, res, 200, {
            status: true,
            data: userData,
            message: `Invitation sent successfully`,
            errorCode: null,
          });
        } else {
          sendResponse(req, res, 200, {
            status: false,
            data: null,
            message: `Invitation Send successfully`,
            errorCode: null,
          });
        }
      }
    } catch (err) {
      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `Failed to send invitation`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getAllInvitation(req, res) {
    try {
      let {
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

      let checkUser = await PortalUser.findOne({
        _id: mongoose.Types.ObjectId(for_portal_user),
      });

      if (checkUser.role === "HOSPITAL_STAFF") {
        let adminData = await StaffInfo.findOne({
          for_portal_user: mongoose.Types.ObjectId(for_portal_user),
        });

        for_portal_user = adminData?.in_hospital;
      }

      if (checkUser.role === "INDIVIDUAL_DOCTOR_STAFF") {
        let adminData = await StaffInfo.findOne({
          for_portal_user: mongoose.Types.ObjectId(for_portal_user),
        });

        for_portal_user = adminData?.in_hospital;
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

      sendResponse(req, res, 200, {
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
      sendResponse(req, res, 500, {
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

      sendResponse(req, res, 200, {
        status: true,
        data: result,
        message: `Invitation Send successfully`,
        errorCode: null,
      });
    } catch (err) {
      sendResponse(req, res, 500, {
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

      sendResponse(req, res, 200, {
        status: true,
        data: result,
        message: `Invitation Deleted successfully`,
        errorCode: null,
      });
    } catch (err) {
      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `Failed to fetch list`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async totalIndividualDoctorforAdminDashboard(req, res) {
    try {
      const totalCount = await PortalUser.countDocuments({
        isDeleted: false,
        role: "INDIVIDUAL_DOCTOR",
      });

      if (totalCount >= 0) {
        return sendResponse(req, res, 200, {
          status: true,
          body: { totalCount },
          message: "Individual Doctor Count Fetch Successfully",
        });
      } else {
        return sendResponse(req, res, 400, {
          status: true,
          body: { totalCount: 0 },
          message: "Individual Doctor Count not Fetch",
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

  async unregisterDoctor(req, res) {
    try {
      const {
        first_name,
        middle_name,
        last_name,
        email,
        password,
        country_code,
        mobile,
        verified,
        role,
        createdBy,
        created_by_user,
        creator_name,
      } = req.body;

      let dummyEmail = "sapphire.lok82@example.com";

      let finalemail;

      if (email == "" || email == null) {
        finalemail = dummyEmail;
      } else {
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
        finalemail = email;
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
        email: finalemail,
        password: newPassword,
        country_code,
        mobile,
        verified,
        role,
        createdBy,
        created_by_user,
        user_id: sequenceDocument.sequence_value,
        creator_name,
      });
      let userDetails = await userData.save();
      let adminData = new BasicInfo({
        full_name: first_name + " " + middle_name + " " + last_name,
        first_name,
        middle_name,
        last_name,
        for_portal_user: userDetails._id,
        main_phone_number: mobile,
        verify_status: "APPROVED",
      });
      let adminDetails = await adminData.save();

      sendResponse(req, res, 200, {
        status: true,
        body: {
          adminDetails,
          userDetails,
        },
        message: "Doctor Registered Sucessfully!",
        errorCode: null,
      });
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
  async unregisterDoctorStaff(req, res) {
    try {
      const {
        first_name,
        middle_name,
        last_name,
        email,
        password,
        country_code,
        mobile,
        verified,
        createdBy,
        created_by_user,
        role,
        creator_name,
      } = req.body;

      let dummyEmail = "sapphire.lok82@example.com";

      let finalemail;

      if (email == "" || email == null) {
        finalemail = dummyEmail;
      } else {
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
        finalemail = email;
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
        user_id: sequenceDocument.sequence_value,
        email: finalemail,
        country_code,
        mobile,
        role: "INDIVIDUAL_DOCTOR_STAFF",
        password: newPassword,
        created_by_user: created_by_user,
        createdBy,
        verified,
        creator_name,
      });
      let userDetails = await userData.save();
      let locationData = new LocationInfo({
        for_portal_user: userDetails._id,
      });
      let locationDetails = await locationData.save();

      let profileData = new ProfileInfo({
        name: first_name + " " + middle_name + " " + last_name,
        first_name,
        middle_name,
        last_name,
        in_location: locationDetails._id,
        for_portal_user: userDetails._id,
      });
      let staffProfileDetails = await profileData.save();
      let staffData = new StaffInfo({
        name: first_name + " " + middle_name + " " + last_name,
        role,
        in_profile: staffProfileDetails._id,
        in_hospital: created_by_user,
        for_portal_user: userDetails._id,
      });
      let staffDetails = await staffData.save();
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
  async get_unregisterDoctor(req, res) {
    try {
      const { docID } = req.query;

      const portalUserData = await PortalUser.findOne({
        _id: mongoose.Types.ObjectId(docID),
      });

      if (!portalUserData) {
        return sendResponse(req, res, 200, {
          status: false,
          body: userFind,
          message: "User not found",
          errorCode: null,
        });
      }

      if (portalUserData) {
        const basic_infoData = await BasicInfo.findOne({
          for_portal_user: mongoose.Types.ObjectId(docID),
        });

        const data = {
          first_name: basic_infoData?.first_name,
          middle_name: basic_infoData?.middle_name,
          last_name: basic_infoData?.last_name,
          email: portalUserData?.email,
        };
        if (basic_infoData) {
          sendResponse(req, res, 200, {
            status: true,
            body: data,
            message: "Getting doctorData successfully!",
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
  async updateUnregisterDoctor(req, res) {
    try {
      const {
        doctorId,
        first_name,
        middle_name,
        last_name,
        email,
        title,
        speciality,
      } = req.body;
      let userFind = await PortalUser.findOne({
        _id: mongoose.Types.ObjectId(doctorId),
        isDeleted: false,
      });
      if (!userFind) {
        return sendResponse(req, res, 200, {
          status: false,
          body: userFind,
          message: "User not exist",
          errorCode: null,
        });
      } else {
        let portaldata;
        let basicInfo;
        if (
          req.body.first_name ||
          req.body.last_name ||
          req.body.middle_name ||
          req.body.email
        ) {
          portaldata = await PortalUser.findOneAndUpdate(
            { _id: doctorId },
            {
              $set: {
                full_name: first_name + " " + middle_name + " " + last_name,
                first_name,
                middle_name,
                last_name,
                email,
              },
            },
            { upsert: false, new: true }
          );

          basicInfo = await BasicInfo.findOneAndUpdate(
            { for_portal_user: mongoose.Types.ObjectId(doctorId) },
            {
              $set: {
                full_name: first_name + " " + middle_name + " " + last_name,
                first_name,
                middle_name,
                last_name,
              },
            },
            { upsert: false, new: true }
          );
        }
        const basicInfo1 = await BasicInfo.findOneAndUpdate(
          { for_portal_user: mongoose.Types.ObjectId(doctorId) },
          {
            $set: {
              title: title ? title : "",
              speciality_name: speciality ? speciality : null,
            },
          },
          { upsert: false, new: true }
        );

        if (portaldata && basicInfo) {
          sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: "Doctor Upadte Sucessfully!",
            errorCode: null,
          });
        }

        if (basicInfo1) {
          sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: "Doctor Upadte Sucessfully!",
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
  async getPatientDoctors(req, res) {
    try {
      const { doctorIds, currentDoctorId } = req.body;

      const results = await BasicInfo.find({
        for_portal_user: { $in: doctorIds },
      })
        .populate({
          path: "for_portal_user",
          select: "average_rating email mobile country_code",
        })
        .populate({
          path: "speciality",
          select: "specilization specilization_arabic",
        })
        .select(
          "full_name full_name_arabic years_of_experience profile_picture"
        )
        .lean();

      for (let index = 0; index < results.length; index++) {
        const element = results[index];
        element.profilePicture = element?.profile_picture
          ? await generateSignedUrl(element?.profile_picture)
          : "";
      }
      const getRatingCount = await ReviewAndRating.find({
        userId: { $eq: currentDoctorId },
      }).countDocuments();
      sendResponse(req, res, 200, {
        status: true,
        message: "Doctor details fetched Sucessfully!",
        body: {
          results,
          getRatingCount,
        },
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get doctor details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async getTotalDoctorCount(req, res) {
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
            "for_portal_user.role": "INDIVIDUAL_DOCTOR",
            "for_portal_user.createdBy": "self",
            "for_portal_user.isDeleted": false,
            $and: [date_filter],
          },
        },
        {
          $count: "count",
        },
      ];

      const getCount = await BasicInfo.aggregate(filterPipeline);
      sendResponse(req, res, 200, {
        status: true,
        message: `Total count.`,
        data: {
          activeCount: getCount?.length > 0 ? getCount[0]?.count : 0,
          onlineCount: 0,
        },
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

  async getTotalDoctorRecents(req, res) {
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
            "for_portal_user.role": "INDIVIDUAL_DOCTOR",
            "for_portal_user.createdBy": "self",
            "for_portal_user.isDeleted": false,
            $and: [date_filter],
          },
        },
      ];
      const data = await BasicInfo.aggregate(filterPipeline);

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
            "for_portal_user.role": "INDIVIDUAL_DOCTOR",
            "for_portal_user.createdBy": "self",
            "for_portal_user.isDeleted": false,
            $and: [date_filter],
          },
        },
        {
          $count: "count",
        },
      ];

      const countData = await BasicInfo.aggregate(countPipeline);
      const totalCount = countData?.length > 0 ? countData[0].count : 0;

      return sendResponse(req, res, 200, {
        status: true,
        message: `Total Doctors`,
        data: {
          activeCount: totalCount,
          onlineCount: 0,
          doctors: data,
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

  async getDashboardData(req, res) {
    try {
      const { fromDate, toDate } = req.query;
      let filter = {};
      if (req.user?.role == "INDIVIDUAL_DOCTOR") {
        filter.doctorId = mongoose.Types.ObjectId(req?.user?._id);
      }
      if (fromDate && toDate) {
        const fromDateObj = new Date(`${fromDate} 00:00:00`);
        const toDateObj = new Date(`${toDate} 23:59:59`);
        filter.createdAt = { $gte: fromDateObj, $lte: toDateObj };
      }
      const labData = PrescribeLabTest.find(filter).select("labTest ");
      const radioData =
        PrescribeRadiologyTest.find(filter).select("radiologyTest ");
      const eprescriptionData = Eprescription.find({
        ...filter,
        status: "INPROGRESS",
      }).countDocuments();
      const getAllAppointment = Appointment.find(filter).select("patientId");
      const getPatientConfirmedAppointment = Appointment.find({
        ...filter,
        patientConfirmation: "confirmed",
      }).countDocuments();
      const getCompletedAppointment = Appointment.find({
        ...filter,
        status: "COMPLETED",
      }).countDocuments();
      const promisesData = await Promise.all([
        labData,
        radioData,
        eprescriptionData,
        getAllAppointment,
        getPatientConfirmedAppointment,
        getCompletedAppointment,
      ]);
      const totalPatient = [
        ...new Set(promisesData[3].map((p) => p.patientId.toString())),
      ];
      let prescribedLabCount = 0;
      for (const element of promisesData[0]) {
        prescribedLabCount += parseInt(element?.labTest?.length);
      }
      let prescribedRadiologyCount = 0;
      for (const element of promisesData[1]) {
        prescribedRadiologyCount += parseInt(element?.radiologyTest?.length);
      }
      sendResponse(req, res, 200, {
        status: true,
        message: `Dashboard data fetched successfully`,
        body: {
          totalAppointment: promisesData[3].length,
          totalConfirmedAppointment: promisesData[4],
          totalPatient: totalPatient.length,
          totalConsultationDone: promisesData[5],
          totalPrescribedLabTest: prescribedLabCount,
          totalPrescribedRadiologyTest: prescribedRadiologyCount,
          totalIncompleteOrders: promisesData[2],
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

  async getLabTestAppointmentDetails(req, res) {
    try {
      const { appointmentId, fromDate, toDate } = req.query;
      let filter = {};
      if (!appointmentId) {
        return res.status(400).json({ message: "Appointment ID is required" });
      }

      if (fromDate && toDate) {
        const fromDateObj = new Date(`${fromDate} 00:00:00`);
        const toDateObj = new Date(`${toDate} 23:59:59`);
        filter.createdAt = { $gte: fromDateObj, $lte: toDateObj };
      }

      // Fetching all relevant data instead of just counts
      await PrescribeLabTest.find(filter).select("labTest");
      await PrescribeRadiologyTest.find(filter).select(
        "radiologyTest"
      );
      const eprescriptionData = await Eprescription.find({
        ...filter,
        status: "INPROGRESS",
      });
      const allAppointments = await Appointment.find(filter)
        .select("patientId doctorId status patientConfirmation")
        .populate("doctorId")
        .lean();
      const patientIdsArray = allAppointments.map((appt) => appt.patientId);
      const getPatientDetails = await httpService.postStaging(
        "patient/get-patient-details-by-id",
        { ids: patientIdsArray },
        {},
        "patientServiceUrl"
      );
      const patientDetailsMap = getPatientDetails?.data || {};
      const mergedAppointments = allAppointments.map((appt) => ({
        ...appt,
        patientDetails: patientDetailsMap[appt.patientId.toString()] || null,
      }));

      const confirmedAppointments = mergedAppointments.filter(
        (appt) => appt.patientConfirmation === "confirmed"
      );
      const completedAppointments = mergedAppointments.filter(
        (appt) => appt.status === "COMPLETED"
      );

      // Extract unique patient IDs
      const totalPatients = [
        ...new Set(mergedAppointments.map((p) => p.patientId.toString())),
      ];

      return sendResponse(req, res, 200, {
        status: true,
        message: `Dashboard data fetched successfully`,
        body: {
          totalAppointments: mergedAppointments, // Returning full appointment data
          totalConfirmedAppointments: confirmedAppointments, // Full confirmed appointments
          totalPatients: totalPatients.length,
          totalConsultationDone: completedAppointments, // Full completed appointments
          totalPrescribedLabTests: prescribedLabTests || 0,
          totalPrescribedRadiologyTests: prescribedRadiologyTests || 0,
          totalIncompleteOrders: eprescriptionData, // Full incomplete orders data
        },
        errorCode: null,
      });
    } catch (error) {
      console.log("error", error);

      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `Failed to get dashboard data`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getDoctorAdminDashboardData(req, res) {
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };
      const { fromDate, toDate } = req.query;
      let filter = {};
      if (fromDate && toDate) {
        const fromDateObj = new Date(`${fromDate} 00:00:00`);
        const toDateObj = new Date(`${toDate} 23:59:59`);
        filter.createdAt = { $gte: fromDateObj, $lte: toDateObj };
      }
      const getAllAppointment = Appointment.find(filter).select('patientId')
      const labData = httpService.getStaging("lab-radio/dashboard-labradio-report", { fromDate, toDate, type: 'lab' }, headers, "labradioServiceUrl");
      const radioData = httpService.getStaging("lab-radio/dashboard-labradio-report", { fromDate, toDate, type: 'radiology' }, headers, "labradioServiceUrl");
      const unbookedLabData = await PrescribeLabTest.find({
        ...filter,
        status: "PENDING",
        labTest: {
          $elemMatch: {
            $or: [
              { paymentInfo: { $exists: false } },  // Condition 1: paymentInfo key is missing
              { "paymentInfo.isBooked": false }    // Condition 2: paymentInfo exists but isBooked is false
            ]
          }
        }
      }).select('patientId');
      const unbookedRadioData = PrescribeRadiologyTest.find({ ...filter, status: "PENDING" , "radiologyTest": {
        $elemMatch: {
          $or: [
            { paymentInfo: { $exists: false } },  // Condition 1: paymentInfo key is missing
            { "paymentInfo.isBooked": false }    // Condition 2: paymentInfo exists but isBooked is false
          ]
        }
      }}).select('patientId ')
      const unbookedMedicineData = Eprescription.find({ ...filter, status: "PENDING" }).select('patientId ')
      //dilip----- Fetch all doctors (non-deleted, individual doctors)
      const doctors = await PortalUser.find({
        isDeleted: false,
        role: "INDIVIDUAL_DOCTOR",
      })
        .select("_id")
        .lean();

      // Parallelize last login fetching
      const doctorLoginPromises = doctors.map(async (doctor) => {
        const lastLoginData = await Logs.findOne({
          userId: doctor._id,
          createdAt: { // Apply the date filter on createdAt
            ...(fromDate && { $gte: new Date(`${fromDate} 00:00:00`) }),
            ...(toDate && { $lte: new Date(`${toDate} 23:59:59`) }),
          },
        })
          .sort({ createdAt: -1 }) // Sort by createdAt
          .select("createdAt")
          .lean();
      
        return lastLoginData ? doctor._id : null;
      });
      const doctorLogins = await Promise.all(doctorLoginPromises);

      // Filter out doctors with no login data
      const validDoctorLogins = doctorLogins.filter((id) => id !== null);
      const totalLastLoginByDoctors = validDoctorLogins.length;

      const promisesData = await Promise.all([getAllAppointment, labData, radioData, unbookedLabData, unbookedRadioData, unbookedMedicineData])

      sendResponse(req, res, 200, {
        status: true,
        message: `Dashboard data fetched successfully`,
        body: {
          totalAppointment: promisesData[0].length,
          totalLabOrders: promisesData[1].status
            ? promisesData[1]?.body?.totalOrder
            : 0,
          totalRadiologyOrders: promisesData[2].status
            ? promisesData[2]?.body?.totalOrder
            : 0,
          totalUnbookedLabOrders: promisesData[3].length,
          totalUnbookedRadiologyOrders: promisesData[4].length,
          totalUnbookedMedicineOrders: promisesData[5].length,
          totalLastLoginByDoctors:totalLastLoginByDoctors
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

  async getAllDoctor(req, res) {
    try {
      const pipeline = [
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
            "for_portal_user.role": "INDIVIDUAL_DOCTOR",
            "for_portal_user.isDeleted": false,
            "for_portal_user.isActive": true,
            "for_portal_user.lock_user": false,
          },
        },
        {
          $group: {
            _id: "$_id",
            for_portal_user: { $first: "$for_portal_user._id" },
            full_name: { $first: "$full_name" },
            full_name_arabic: { $first: "$full_name_arabic" },
          },
        },
      ];
      const result = await BasicInfo.aggregate(pipeline);
      sendResponse(req, res, 200, {
        status: true,
        message: `All doctors fetched successfully`,
        body: result,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `failed to get all doctors data`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }


  
  async getRadiologyTestAppointmentDetails(req, res) {
      try {
          const { appointmentId } = req.query;
  
          if (!appointmentId) {
              return res.status(400).json({ message: "Appointment ID is required" });
          }
  
          const pipeline = [
              {
                  $match: { appointmentId: new mongoose.Types.ObjectId(appointmentId) }
              },
              {
                  $lookup: {
                      from: "portalusers",
                      localField: "doctorId",
                      foreignField: "_id",
                      as: "doctorDetails"
                  }
              },
              { $unwind: "$doctorDetails" },
              {
                  $lookup: {
                      from: "appointments",
                      localField: "appointmentId",
                      foreignField: "_id",
                      as: "appointmentDetails"
                  }
              },
              { $unwind: "$appointmentDetails" },
              {
                  $unwind: {
                      path: "$radiologyTest",
                      preserveNullAndEmptyArrays: true
                  }
              },
              {
                  $group: {
                      _id: "$_id",
                      doctorName: { $first: "$doctorDetails.full_name" },
                      doctorNameArabic: { $first: "$doctorDetails.full_name_arabic" },
                      appointmentId: { $first: "$appointmentDetails.appointment_id" },
                      patientId: { $first: "$patientId" },
                      consultationDate: { $first: "$appointmentDetails.consultationDate" },
                      consultationTime: { $first: "$appointmentDetails.consultationTime" },
                      appointmentStatus: { $first: "$appointmentDetails.status" },
                      radiologyTests: {
                          $push: {
                              testName: "$radiologyTest.radiologyTestName",
                              centerName: "$radiologyTest.radiologyCenterName",
                              resultType: "$radiologyTest.resultType",
                              testFees: "$radiologyTest.testFees",
                              status: "$radiologyTest.status"
                          }
                      }
                  }
              }
          ];
  
          const radiologyTestDetails = await PrescribeRadiologyTest.aggregate(pipeline);
          if (!radiologyTestDetails.length) {
              return res.status(404).json({ message: "No radiology test found for this appointment" });
          }
  
          const result = radiologyTestDetails[0];
  
          // Fetch patient details using the staging API
          const patientResponse = await httpService.postStaging(
              "patient/get-patient-details-by-id",
              { ids: [result.patientId] },
              {},
              "patientServiceUrl"
          );
  
          const patientDetails = patientResponse?.data?.[result.patientId] || {};
  
          // Final Response
          const responseData = {
              appointmentId: result.appointmentId,
              doctorName: result.doctorName,
              doctorNameArabic: result.doctorNameArabic,
              patientName: patientDetails.full_name || "N/A",
              patientNameArabic: patientDetails.full_name_arabic || "N/A",
              consultationDate: result.consultationDate,
              consultationTime: result.consultationTime,
              appointmentStatus: result.appointmentStatus,
              radiologyTests: result.radiologyTests.filter(test => test.testName) // Remove null test names
          };
          
          res.status(200).json(responseData);
  
      } catch (error) {
          console.error("Error fetching radiology test appointment details:", error);
          res.status(500).json({ message: "Internal server error" });
      }
  }
  async getDashboardDataExport(req, res) {
    const headers = {
      Authorization: req.headers["authorization"],
    };

    try {
      const { fromDate, toDate, status } = req.query;
      let filter = {};

      if (req.user?.role === "INDIVIDUAL_DOCTOR") {
        filter.doctorId = mongoose.Types.ObjectId(req?.user?._id);
      }

      if (fromDate && toDate) {
        const fromDateObj = new Date(`${fromDate} 00:00:00`);
        const toDateObj = new Date(`${toDate} 23:59:59`);
        filter.createdAt = { $gte: fromDateObj, $lte: toDateObj };
      }

      if (status) {
        filter.status = status;
      } else {
        // If status is blank, fetch all statuses but only for confirmed patients
        filter.status = {
          $in: ["PENDING", "CANCELLED", "APPROVED", "COMPLETED", "MISSED"],
        };
        filter.patientConfirmation = "confirmed";
      }

      // Fetch appointments
      const getAppointment = await Appointment.find(filter, {
        appointment_id: 1,
        consultationDate: 1,
        consultationTime: 1,
        status: 1,
        patientId: 1,
      }).populate({
        path: "doctorId",
        select: {
          full_name_arabic: 1,
          full_name: 1,
        },
      });

      // Extract unique patient IDs
      const patientIds = [
        ...new Set(getAppointment.map((appt) => appt.patientId.toString())),
      ];

      if (patientIds.length === 0) {
        return sendResponse(req, res, 200, {
          status: true,
          message: "No appointments found",
          body: [],
          errorCode: null,
        });
      }

      // Fetch patient details
      let resData = await httpService.postStaging(
        "patient/get-patient-details-by-id",
        { ids: patientIds },
        headers,
        "patientServiceUrl"
      );

      // Ensure resData is valid
      if (!resData?.data) {
        return sendResponse(req, res, 500, {
          status: false,
          message: "Failed to fetch patient details",
          body: [],
          errorCode: "PATIENT_FETCH_ERROR",
        });
      }

      // Convert patient data into a Map
      const patientMap = new Map();
      Object.keys(resData.data).forEach((patientId) => {
        const patient = resData.data[patientId];
        patientMap.set(patientId, {
          full_name: patient.full_name || "",
          full_name_arabic: patient.full_name_arabic || "",
          mobile: patient.mobile || "",
          email: patient.email || "",
          contry_code: patient.contry_code || "",
          mrn_number: patient.mrn_number || "",
        });
      });

      // Merge appointment and patient data
      const finalArray = getAppointment.map((appt) => ({
        doctor_name_arabic: appt.doctorId.full_name_arabic || "",
        doctor_name: appt.doctorId.full_name || "", // Ensure doctor data is properly mapped
        appointment_id: appt.appointment_id,
        consultationDate: appt.consultationDate,
        consultationTime: appt.consultationTime,
        status: appt.status,
        patient: patientMap.get(appt.patientId.toString()) || {}, // Ensure patient data is properly mapped
      }));

      return sendResponse(req, res, 200, {
        status: true,
        message: "Export file successfully",
        body: finalArray,
        errorCode: null,
      });
    } catch (error) {
      console.log("error___", error);
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to get data",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getDashboardPatientDataExport(req, res) {
    const headers = {
      Authorization: req.headers["authorization"],
    };

    try {
      const { fromDate, toDate } = req.query;
      let filter = {};

      if (req.user?.role === "INDIVIDUAL_DOCTOR") {
        filter.doctorId = mongoose.Types.ObjectId(req?.user?._id);
      }

      if (fromDate && toDate) {
        const fromDateObj = new Date(`${fromDate} 00:00:00`);
        const toDateObj = new Date(`${toDate} 23:59:59`);
        filter.createdAt = { $gte: fromDateObj, $lte: toDateObj };
      }

      // Fetch appointments
      const getAppointment = await Appointment.find(filter, {
        patientId: 1,
      }).populate({
        path: "doctorId",
        select: { full_name_arabic: 1, full_name: 1 },
      });

      // Extract unique patient IDs
      const patientIds = [
        ...new Set(
          getAppointment
            .map((appt) => appt.patientId?.toString())
            .filter(Boolean)
        ),
      ];

      if (patientIds.length === 0) {
        return sendResponse(req, res, 200, {
          status: true,
          message: "No appointments found",
          body: [],
          errorCode: null,
        });
      }

      // Fetch patient details
      let resData = await httpService.postStaging(
        "patient/get-patient-details-by-id",
        { ids: patientIds },
        headers,
        "patientServiceUrl"
      );

      // Ensure resData is valid
      if (!resData?.data) {
        return sendResponse(req, res, 500, {
          status: false,
          message: "Failed to fetch patient details",
          body: [],
          errorCode: "PATIENT_FETCH_ERROR",
        });
      }

      // Convert patient data into a Map
      const patientMap = new Map();
      for (const [patientId, patient] of Object.entries(resData.data)) {
        patientMap.set(patientId, {
          full_name: patient.full_name || "",
          full_name_arabic: patient.full_name_arabic || "",
          mobile: patient.mobile || "",
          email: patient.email || "",
          country_code: patient.country_code || "",
          mrn_number: patient.mrn_number || "",
        });
      }

      // Merge appointment and patient data
      const finalArray = patientIds.map((patientId) => {
        // Find one appointment for the patient to extract doctor details.
        // Note: If a patient can have multiple doctors, you may need a different strategy.
        const appointment = getAppointment.find(
          (appt) => appt.patientId?.toString() === patientId
        );
        return {
          doctor_name_arabic: appointment?.doctorId?.full_name_arabic || "",
          doctor_name: appointment?.doctorId?.full_name || "",
          patient: patientMap.get(patientId) || {},
        };
      });

      return sendResponse(req, res, 200, {
        status: true,
        message: "Export file successfully",
        body: finalArray,
        errorCode: null,
      });
    } catch (error) {
      console.error("Error fetching patient data export:", error);
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to fetch data",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getLabTestAppointmentList(req, res) {
    try {
      const { fromDate, toDate, limit, page, sort } = req.query;
      let filter = {};
  
      if (req.user?.role === "INDIVIDUAL_DOCTOR") {
        filter.doctorId = mongoose.Types.ObjectId(req.user._id);
      }
      if (fromDate && toDate) {
        const fromDateObj = new Date(`${fromDate} 00:00:00`);
        const toDateObj = new Date(`${toDate} 23:59:59`);
        filter.createdAt = { $gte: fromDateObj, $lte: toDateObj };
      }
  
      let sortKey = "createdAt";
      let sortValue = -1;
      const allowedSortFields = [
        "appointmentId",
        "consultationDate",
        "consultationTime",
        "patientName",
        "labName",
        "testName",
      ];
  
      if (sort) {
        const [key, value] = sort.split(":");
        if (allowedSortFields.includes(key)) {
          sortKey = key;
          sortValue = Number(value);
        }
      }
  
      const pageNumber = Math.max(parseInt(page) || 1, 1);
      const pageSize = Math.max(parseInt(limit) || 10, 1);
      const skip = (pageNumber - 1) * pageSize;
  
      const pipeline = [
        { $match: filter },
        {
          $lookup: {
            from: "portalusers",
            localField: "doctorId",
            foreignField: "_id",
            as: "doctorDetails",
          },
        },
        { $unwind: { path: "$doctorDetails", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "appointments",
            localField: "appointmentId",
            foreignField: "_id",
            as: "appointmentDetails",
          },
        },
        { $unwind: { path: "$appointmentDetails", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$labTest", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            appointmentId: "$appointmentDetails.appointment_id",
            appointment_id: "$appointmentDetails._id",
            doctorName: "$doctorDetails.full_name",
            doctorNameArabic: "$doctorDetails.full_name_arabic",
            patientId: "$patientId",
            consultationDate: "$appointmentDetails.consultationDate",
            consultationTime: "$appointmentDetails.consultationTime",
            appointmentStatus: "$appointmentDetails.status",
            prescribeStatus: "$status",
            testName: { $ifNull: ["$labTest.labtestName", "N/A"] },
            labName: { $ifNull: ["$labTest.labCenterName", "N/A"] },
            testStatus: { $ifNull: ["$labTest.status", "N/A"] },
          },
        },
      ];
  
      // Get data and count
      const result = await PrescribeLabTest.aggregate(pipeline);
      const totalRecords = result.length;
  
      const patientIds = [...new Set(result.map((item) => item.patientId?.toString()))];
      const patientResponse = await httpService.postStaging(
        "patient/get-patient-details-by-id",
        { ids: patientIds },
        {},
        "patientServiceUrl"
      );
      const patientDetailsMap = patientResponse?.data || {};
  
      let labTestDetails = result.map((item) => ({
        appointmentId: item.appointmentId,
        appointment_id: item.appointment_id,
        doctorName: item.doctorName,
        doctorNameArabic: item.doctorNameArabic,
        patientId: item.patientId,
        patientName: patientDetailsMap[item.patientId]?.full_name || "N/A",
        patientNameArabic:
          patientDetailsMap[item.patientId]?.full_name_arabic || "N/A",
        consultationDate: item.consultationDate,
        consultationTime: item.consultationTime,
        appointmentStatus: item.appointmentStatus,
        prescribeStatus: item.prescribeStatus || "N/A",
        testName: item.testName,
        labName: item.labName,
        testStatus: item.testStatus,
      }));
  
      // Sorting by appointmentId
      if (sortKey === "appointmentId") {
        labTestDetails.sort((a, b) => {
          const numA = parseInt(a.appointmentId.replace(/\D/g, "")); 
          const numB = parseInt(b.appointmentId.replace(/\D/g, ""));
          return sortValue === 1 ? numA - numB : numB - numA;
        });
      }
  
      // Sorting by patientName
      if (sortKey === "patientName") {
        labTestDetails.sort((a, b) => {
          const nameA = a.patientName.toLowerCase();
          const nameB = b.patientName.toLowerCase();
          return sortValue === 1
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA);
        });
      }
  
      // Sorting by testName
      if (sortKey === "testName") {
        labTestDetails.sort((a, b) => {
          const nameA = a.testName.toLowerCase();
          const nameB = b.testName.toLowerCase();
          return sortValue === 1
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA);
        });
      }
  
      // Sorting by labName
      if (sortKey === "labName") {
        labTestDetails.sort((a, b) => {
          const nameA = a.labName.toLowerCase();
          const nameB = b.labName.toLowerCase();
          return sortValue === 1
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA);
        });
      }
  
      // Sorting by consultationDate and consultationTime (combine to Date)
      if (sortKey === "consultationDate" || sortKey === "consultationTime") {
        labTestDetails.sort((a, b) => {
          const dateA = new Date(`${a.consultationDate} ${a.consultationTime}`);
          const dateB = new Date(`${b.consultationDate} ${b.consultationTime}`);
          return sortValue === 1 ? dateA - dateB : dateB - dateA;
        });
      }
  
      // Pagination
      const paginatedResults = labTestDetails.slice(skip, skip + pageSize);
  
      if (!paginatedResults.length) {
        return sendResponse(req, res, 200, {
          status: true,
          message: "Lab test not found",
          body: [],
          totalRecords,
          totalPages: Math.ceil(totalRecords / pageSize),
          currentPage: pageNumber,
        });
      }
  
      return sendResponse(req, res, 200, {
        status: true,
        body: paginatedResults,
        message: "Successfully fetched lab test appointment details",
        totalRecords,
        totalPages: Math.ceil(totalRecords / pageSize),
        currentPage: pageNumber,
      });
    } catch (error) {
      console.error("Error fetching lab test appointment details:", error);
      return sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
      });
    }
  }
  

  async getRadiologyTestAppointmentList(req, res) {
    try {
      const { fromDate, toDate, limit, page, sort } = req.query;
      let filter = {};
  
      if (req.user?.role === "INDIVIDUAL_DOCTOR") {
        filter.doctorId = mongoose.Types.ObjectId(req.user._id);
      }
  
      if (fromDate && toDate) {
        const fromDateObj = new Date(`${fromDate} 00:00:00`);
        const toDateObj = new Date(`${toDate} 23:59:59`);
        filter.createdAt = { $gte: fromDateObj, $lte: toDateObj };
      }
  
      let sortKey = "createdAt";
      let sortValue = -1;
  
      if (sort) {
        const [key, value] = sort.split(":");
        const allowedSortFields = [
          "appointmentId",
          "consultationDate",
          "consultationTime",
          "patientName",
          "radioName",
          "testName",
        ];
        if (allowedSortFields.includes(key)) {
          sortKey = key;
          sortValue = Number(value);
        }
      }
  
      const pageNumber = Math.max(parseInt(page) || 1, 1);
      const pageSize = Math.max(parseInt(limit) || 10, 1);
      const skip = (pageNumber - 1) * pageSize;
  
      const pipeline = [
        { $match: filter },
        {
          $lookup: {
            from: "portalusers",
            localField: "doctorId",
            foreignField: "_id",
            as: "doctorDetails",
          },
        },
        { $unwind: { path: "$doctorDetails", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "appointments",
            localField: "appointmentId",
            foreignField: "_id",
            as: "appointmentDetails",
          },
        },
        { $unwind: { path: "$appointmentDetails", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$radiologyTest", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            appointmentId: "$appointmentDetails.appointment_id",
            appointment_id: "$appointmentDetails._id",
            doctorName: "$doctorDetails.full_name",
            doctorNameArabic: "$doctorDetails.full_name_arabic",
            patientId: "$patientId",
            consultationDate: "$appointmentDetails.consultationDate",
            consultationTime: "$appointmentDetails.consultationTime",
            appointmentStatus: "$appointmentDetails.status",
            prescribeStatus: "$status",
            testName: { $ifNull: ["$radiologyTest.radiologyTestName", "N/A"] },
            radioName: { $ifNull: ["$radiologyTest.radiologyCenterName", "N/A"] },
            testStatus: { $ifNull: ["$radiologyTest.status", "N/A"] },
          },
        },
        { $sort: { [sortKey]: sortValue } }, // Sorting applied here
      ];
  
      // Get data
      const result = await PrescribeRadiologyTest.aggregate(pipeline);
      const totalRecords = result.length;
  
      const patientIds = [
        ...new Set(result.map((item) => item.patientId?.toString())),
      ];
  
      // Fetch patient details
      const patientResponse = await httpService.postStaging(
        "patient/get-patient-details-by-id",
        { ids: patientIds },
        {},
        "patientServiceUrl"
      );
  
      const patientDetailsMap = patientResponse?.data || {};
  
      // Now map the results with patient details
      let radiologyTestDetails = result.map((item) => ({
        appointmentId: item.appointmentId,
        appointment_id: item.appointment_id,
        doctorName: item.doctorName,
        doctorNameArabic: item.doctorNameArabic,
        patientId: item.patientId,
        patientName: patientDetailsMap[item.patientId]?.full_name || "N/A",
        patientNameArabic:
          patientDetailsMap[item.patientId]?.full_name_arabic || "N/A",
        consultationDate: item.consultationDate,
        consultationTime: item.consultationTime,
        appointmentStatus: item.appointmentStatus,
        prescribeStatus: item.prescribeStatus || "N/A",
        testName: item.testName,
        radioName: item.radioName,
        testStatus: item.testStatus,
      }));
  
      // Apply sorting after patient name extraction
      if (sortKey === "appointmentId") {
        radiologyTestDetails.sort((a, b) => {
          const numA = parseInt(a.appointmentId.replace(/\D/g, ""));
          const numB = parseInt(b.appointmentId.replace(/\D/g, ""));
          return sortValue === 1 ? numA - numB : numB - numA;
        });
      }
  
      // Sorting by patientName
      if (sortKey === "patientName") {
        radiologyTestDetails.sort((a, b) => {
          const nameA = a.patientName.toLowerCase();
          const nameB = b.patientName.toLowerCase();
          return sortValue === 1
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA);
        });
      }
  
      // Sorting by testName
      if (sortKey === "testName") {
        radiologyTestDetails.sort((a, b) => {
          const nameA = a.testName.toLowerCase();
          const nameB = b.testName.toLowerCase();
          return sortValue === 1
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA);
        });
      }
  
      // Sorting by radioName
      if (sortKey === "radioName") {
        radiologyTestDetails.sort((a, b) => {
          const nameA = a.radioName.toLowerCase();
          const nameB = b.radioName.toLowerCase();
          return sortValue === 1
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA);
        });
      }
  
      // Sorting by consultationDate and consultationTime
      if (sortKey === "consultationDate" || sortKey === "consultationTime") {
        radiologyTestDetails.sort((a, b) => {
          const dateA = new Date(`${a.consultationDate} ${a.consultationTime}`);
          const dateB = new Date(`${b.consultationDate} ${b.consultationTime}`);
          return sortValue === 1 ? dateA - dateB : dateB - dateA;
        });
      }
  
      // Pagination: Apply after sorting
      const paginatedResults = radiologyTestDetails.slice(skip, skip + pageSize);
  
      if (!paginatedResults.length) {
        return sendResponse(req, res, 200, {
          status: true,
          message: "Radiology test not found",
          body: [],
          totalRecords,
          totalPages: Math.ceil(totalRecords / pageSize),
          currentPage: pageNumber,
        });
      }
  
      return sendResponse(req, res, 200, {
        status: true,
        body: paginatedResults,
        message: "Successfully fetched radiology test appointment details",
        totalRecords,
        totalPages: Math.ceil(totalRecords / pageSize),
        currentPage: pageNumber,
      });
    } catch (error) {
      console.error("Error fetching radiology test appointment details:", error);
      return sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
      });
    }
  }
  
  

  async getDashboardRecords(req, res) {
    try {
      const { fromDate, toDate } = req.query;
      let filter = {};

      if (req.user?.role == "INDIVIDUAL_DOCTOR") {
        filter.doctorId = mongoose.Types.ObjectId(req?.user?._id);
      }

      if (fromDate && toDate) {
        const fromDateObj = new Date(`${fromDate} 00:00:00`);
        const toDateObj = new Date(`${toDate} 23:59:59`);
        filter.createdAt = { $gte: fromDateObj, $lte: toDateObj };
      }

      // Fetching all relevant data instead of just counts
      const labData = await PrescribeLabTest.find(filter).select("labTest");
      const radioData = await PrescribeRadiologyTest.find(filter).select(
        "radiologyTest"
      );
      const eprescriptionData = await Eprescription.find({
        ...filter,
        status: "INPROGRESS",
      });
      const allAppointments = await Appointment.find(filter)
        .select("patientId doctorId status patientConfirmation")
        .populate("doctorId")
        .lean();
      const patientIdsArray = allAppointments.map((appt) => appt.patientId);
      const getPatientDetails = await httpService.postStaging(
        "patient/get-patient-details-by-id",
        { ids: patientIdsArray },
        {},
        "patientServiceUrl"
      );
      const patientDetailsMap = getPatientDetails?.data || {};
      const mergedAppointments = allAppointments.map((appt) => ({
        ...appt,
        patientDetails: patientDetailsMap[appt.patientId.toString()] || null,
      }));

      const confirmedAppointments = mergedAppointments.filter(
        (appt) => appt.patientConfirmation === "confirmed"
      );
      const completedAppointments = mergedAppointments.filter(
        (appt) => appt.status === "COMPLETED"
      );

      // Extract unique patient IDs
      const totalPatients = [
        ...new Set(mergedAppointments.map((p) => p.patientId.toString())),
      ];

      // Counting prescribed lab tests and radiology tests
      let prescribedLabTests = labData.reduce(
        (count, item) => count + (item.labTest?.length || 0),
        0
      );
      let prescribedRadiologyTests = radioData.reduce(
        (count, item) => count + (item.radiologyTest?.length || 0),
        0
      );

      sendResponse(req, res, 200, {
        status: true,
        message: `Dashboard data fetched successfully`,
        body: {
          totalAppointments: mergedAppointments, // Returning full appointment data
          totalConfirmedAppointments: confirmedAppointments, // Full confirmed appointments
          totalPatients: totalPatients.length,
          totalConsultationDone: completedAppointments, // Full completed appointments
          totalPrescribedLabTests: prescribedLabTests,
          totalPrescribedRadiologyTests: prescribedRadiologyTests,
          totalIncompleteOrders: eprescriptionData, // Full incomplete orders data
        },
        errorCode: null,
      });
    } catch (error) {
      console.log("error", error);

      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `Failed to get dashboard data`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
  }
}

async getExportAllDoctorLastLogin(req, res) {
  try {
    let { fromDate, toDate } = req.query;
    
    const dateFilter = {};
    if (fromDate) {
      fromDate = moment(fromDate, "MM-DD-YYYY").startOf("day").toISOString(); 
      dateFilter["createdAt"] = { $gte: new Date(fromDate) };
    }
    if (toDate) {
      toDate = moment(toDate, "MM-DD-YYYY").endOf("day").toISOString(); 
      dateFilter["createdAt"] = { 
        ...dateFilter["createdAt"], 
        $lte: new Date(toDate) 
      };
    }
    const doctors = await PortalUser.find({
      isDeleted: false,
      role: "INDIVIDUAL_DOCTOR",
    })
      .select("email mobile full_name country_code")
      .lean();

    if (!doctors || doctors.length === 0) {
      return sendResponse(req, res, 200, {
        status: false,
        message: `No doctors found.`,
        errorCode: "NO_DOCTORS_FOUND",
      });
    }
    const doctorLogs = await Promise.all(
      doctors.map(async (doctor) => {
        try {
 
          const [lastLoginData, basicInfoData, totalLoginCount] =
            await Promise.all([
              Logs.findOne({ userId: doctor._id, ...dateFilter })
                .sort({ loginDateTime: -1 })
                .select("loginDateTime createdAt")
                .lean(),
              BasicInfo.findOne({ for_portal_user: doctor._id })
                .select("full_name full_name_arabic gender dob")
                .lean(),
              Logs.countDocuments({ userId: doctor._id, ...dateFilter }),
            ]);

   
          if (!lastLoginData || !basicInfoData) return null;

      
          return {
            "Full Name": basicInfoData?.full_name || "N/A",
            "Full Name Arabic": basicInfoData?.full_name_arabic || "N/A",
            Email: doctor.email,
            "Mobile Number": doctor.country_code+" - "+doctor.mobile,
            Gender: basicInfoData?.gender || "N/A",
            DOB: basicInfoData?.dob
              ? moment(basicInfoData.dob).format("DD-MM-YYYY") 
              : "N/A",
            "Last Login": lastLoginData.loginDateTime,
            "Total Login Count": totalLoginCount,
          };
        } catch (err) {
          console.error(
            `Error fetching logs for doctor ID: ${doctor._id}`,
            err
          );
          return null;
        }
      })
    );
    const validDoctorLogs = doctorLogs.filter((log) => log !== null);

    if (validDoctorLogs.length === 0) {
      return sendResponse(req, res, 200, {
        status: false,
        message: `No login logs found for any doctor within the specified date range.`,
        errorCode: "NO_LOGS_FOUND",
      });
    }


    return sendResponse(req, res, 200, {
      status: true,
      message: `Doctor logs fetched successfully`,
      totalLastLoginByDoctors: validDoctorLogs.length,
      body: validDoctorLogs,
      errorCode: null,
    });
  } catch (error) {
    console.error("Error fetching doctor logs:", error);
    return sendResponse(req, res, 500, {
      status: false,
      body: error.message || error,
      message: `Failed to get doctor logs`,
      errorCode: "INTERNAL_SERVER_ERROR",
    });
  }
}

async getPendingLabTests(req, res) {
  try {
    const { doctorId } = req.params;
    const { fromDate, toDate } = req.query;

    if (!doctorId) {
      return sendResponse(req, res, 200, {
        status: false,
        message: "Doctor ID is required",
      });
    }

    const filter = {
      doctorId: mongoose.Types.ObjectId(doctorId),
      status: "PENDING",
    };

    const pipeline = [
      { $match: filter },

      // Lookup doctor details
      {
        $lookup: {
          from: "portalusers",
          localField: "doctorId",
          foreignField: "_id",
          as: "doctorDetails",
        },
      },
      { $unwind: { path: "$doctorDetails", preserveNullAndEmptyArrays: true } },

      // Lookup appointment details
      {
        $lookup: {
          from: "appointments",
          localField: "appointmentId",
          foreignField: "_id",
          as: "appointmentDetails",
        },
      },
      { $unwind: { path: "$appointmentDetails", preserveNullAndEmptyArrays: true } },

      // ✅ Convert consultationDate string to Date
      {
        $addFields: {
          consultationDate: {
            $dateFromString: {
              dateString: "$appointmentDetails.consultationDate",
              format: "%Y-%m-%d", // Adjust format if needed
              onError: null,
              onNull: null,
            },
          },
        },
      },

      // ✅ Filter by consultationDate after conversion
      ...(fromDate && toDate
        ? [
            {
              $match: {
                consultationDate: {
                  $gte: moment(fromDate, "MM-DD-YYYY").startOf("day").toDate(),
                  $lte: moment(toDate, "MM-DD-YYYY").endOf("day").toDate(),
                },
              },
            },
          ]
        : []),

      // Project the output
      {
        $project: {
          appointmentId: "$appointmentDetails.appointment_id",
          appointment_id: "$appointmentDetails._id",
          doctorName: "$doctorDetails.full_name",
          doctorNameArabic: "$doctorDetails.full_name_arabic",
          patientId: "$patientId",
          consultationDate: {
            $dateToString: {
              format: "%d-%m-%Y",
              date: "$consultationDate",
            },
          },
          consultationTime: "$appointmentDetails.consultationTime",
          appointmentStatus: "$appointmentDetails.status",
          prescribeStatus: "$status",
          testName: {
            $ifNull: [{ $arrayElemAt: ["$labTest.labtestName", 0] }, "N/A"],
          },
          labName: {
            $ifNull: [{ $arrayElemAt: ["$labTest.labCenterName", 0] }, "N/A"],
          },
          testStatus: {
            $ifNull: [{ $arrayElemAt: ["$labTest.status", 0] }, "N/A"],
          },
        },
      },
    ];

    let pendingLabTests = await PrescribeLabTest.aggregate(pipeline);

    if (!pendingLabTests.length) {
      return sendResponse(req, res, 200, {
        status: false,
        message: "No pending lab tests found",
        body: [],
      });
    }

    // Get Patient Details
    const patientIds = [
      ...new Set(pendingLabTests.map((item) => item.patientId?.toString())),
    ];

    const patientResponse = await httpService.postStaging(
      "patient/get-patient-details-by-id",
      { ids: patientIds },
      {},
      "patientServiceUrl"
    );

    const patientDetailsMap = patientResponse?.data || {};

    // Map and format the response
    pendingLabTests = pendingLabTests.map((test) => ({
      appointmentId: test.appointmentId,
      appointment_id: test.appointment_id,
      doctorName: test.doctorName || "N/A",
      doctorNameArabic: test.doctorNameArabic || "N/A",
      patientId: test.patientId,
      patientName: patientDetailsMap[test.patientId]?.full_name || "N/A",
      patientNameArabic:
        patientDetailsMap[test.patientId]?.full_name_arabic || "N/A",
      consultationDate: test.consultationDate || "N/A",
      consultationTime: test.consultationTime || "N/A",
      appointmentStatus: test.appointmentStatus || "N/A",
      prescribeStatus: test.prescribeStatus || "N/A",
      testName: test.testName || "N/A",
      labName: test.labName || "N/A",
      testStatus: test.testStatus || "N/A",
    }));

    return sendResponse(req, res, 200, {
      status: true,
      message: "Pending lab tests retrieved successfully",
      totalPendingPrescribedLabTestCount: pendingLabTests.length,
      body: pendingLabTests,
      errorCode: null,
    });
  } catch (error) {
    console.error("Error fetching pending lab tests:", error);
    return sendResponse(req, res, 500, {
      status: false,
      message: "Internal server error",
      body: error.message,
      errorCode: "INTERNAL_SERVER_ERROR",
    });
  }
}


async getPendingRadiologyTests(req, res) {
  try {
    const { doctorId } = req.params;
    const { fromDate, toDate } = req.query;

    if (!doctorId) {
      return sendResponse(req, res, 200, {
        status: false,
        message: "Doctor ID is required",
      });
    }

    const filter = {
      doctorId: mongoose.Types.ObjectId(doctorId),
      status: "PENDING",
    };

    // Convert MM-DD-YYYY to DD-MM-YYYY and filter by date if both fromDate and toDate are present
    if (fromDate && toDate) {
      const fromDateParts = fromDate.split('-'); // MM-DD-YYYY → [MM, DD, YYYY]
      const toDateParts = toDate.split('-');
    
      const fromDateFormatted = `${fromDateParts[1]}-${fromDateParts[0]}-${fromDateParts[2]}`; // DD-MM-YYYY
      const toDateFormatted = `${toDateParts[1]}-${toDateParts[0]}-${toDateParts[2]}`; // DD-MM-YYYY
    
      filter.createdAt = {
        $gte: moment(fromDateFormatted, 'DD-MM-YYYY').startOf('day').toDate(),
        $lte: moment(toDateFormatted, 'DD-MM-YYYY').endOf('day').toDate(),
      };
    }

    const pipeline = [
      { $match: filter },
      
      // Lookup doctor details
      {
        $lookup: {
          from: "portalusers",
          localField: "doctorId",
          foreignField: "_id",
          as: "doctorDetails",
        },
      },
      { $unwind: { path: "$doctorDetails", preserveNullAndEmptyArrays: true } },

      // Lookup appointment details
      {
        $lookup: {
          from: "appointments",
          localField: "appointmentId",
          foreignField: "_id",
          as: "appointmentDetails",
        },
      },
      { $unwind: { path: "$appointmentDetails", preserveNullAndEmptyArrays: true } },

      // ✅ Convert consultationDate string to Date for filtering
      {
        $addFields: {
          consultationDate: {
            $dateFromString: {
              dateString: "$appointmentDetails.consultationDate",
              format: "%Y-%m-%d", // Ensure this format matches how the date is stored
              onError: null,
              onNull: null,
            },
          },
        },
      },

      // ✅ Filter by consultationDate after conversion
      ...(fromDate && toDate
        ? [
            {
              $match: {
                consultationDate: {
                  $gte: moment(fromDate, "MM-DD-YYYY").startOf("day").toDate(),
                  $lte: moment(toDate, "MM-DD-YYYY").endOf("day").toDate(),
                },
              },
            },
          ]
        : []),

      {
        $project: {
          appointmentId: "$appointmentDetails.appointment_id",
          appointment_id: "$appointmentDetails._id",
          doctorName: "$doctorDetails.full_name",
          doctorNameArabic: "$doctorDetails.full_name_arabic",
          patientId: "$patientId",
          consultationDate: "$appointmentDetails.consultationDate",
          consultationTime: "$appointmentDetails.consultationTime",
          appointmentStatus: "$appointmentDetails.status",
          prescribeStatus: "$status",
          testName: {
            $ifNull: [{ $arrayElemAt: ["$radiologyTest.radiologyTestName", 0] }, "N/A"],
          },
          radioName: {
            $ifNull: [{ $arrayElemAt: ["$radiologyTest.radiologyCenterName", 0] }, "N/A"],
          },
          testStatus: "$status",
        },
      },
    ];

    let pendingRadiologyTests = await PrescribeRadiologyTest.aggregate(pipeline);

    if (!pendingRadiologyTests.length) {
      return sendResponse(req, res, 200, {
        status: false,
        message: "No pending radiology tests found",
        body: [],
      });
    }

    // Get Patient Details
    const patientIds = [
      ...new Set(pendingRadiologyTests.map((item) => item.patientId?.toString())),
    ];

    const patientResponse = await httpService.postStaging(
      "patient/get-patient-details-by-id",
      { ids: patientIds },
      {},
      "patientServiceUrl"
    );

    const patientDetailsMap = patientResponse?.data || {};

    // Map and format the response
    pendingRadiologyTests = pendingRadiologyTests.map((test) => ({
      appointmentId: test.appointmentId,
      appointment_id: test.appointment_id,
      doctorName: test.doctorName || "N/A",
      doctorNameArabic: test.doctorNameArabic || "N/A",
      patientId: test.patientId,
      patientName: patientDetailsMap[test.patientId]?.full_name || "N/A",
      patientNameArabic:
        patientDetailsMap[test.patientId]?.full_name_arabic || "N/A",
      consultationDate: test.consultationDate
        ? moment(test.consultationDate).format("DD-MM-YYYY") // Format to DD-MM-YYYY
        : "N/A",
      consultationTime: test.consultationTime || "N/A",
      appointmentStatus: test.appointmentStatus || "N/A",
      prescribeStatus: test.prescribeStatus || "N/A",
      testName: test.testName || "N/A",
      radioName: test.radioName || "N/A",
      testStatus: test.testStatus || "N/A",
    }));

    return sendResponse(req, res, 200, {
      status: true,
      message: "Pending radiology tests retrieved successfully",
      totalPendingPrescribedRadioTestCount: pendingRadiologyTests.length,
      body: pendingRadiologyTests,
      errorCode: null,
    });
  } catch (error) {
    console.error("Error fetching pending radiology tests:", error);
    return sendResponse(req, res, 500, {
      status: false,
      message: "Internal server error",
      body: error.message,
      errorCode: "INTERNAL_SERVER_ERROR",
    });
  }
}


async findOnlineDoctors(req, res) {        
  try {

    const findOnlineDoc = await PortalUser.find({ activeToken: { $ne: "" } }, 
      { country_code :1, mobile: 1, email: 1, full_name: 1, full_name_arabic: 1 }).lean();
      if(findOnlineDoc){
        const updatedDocs = [];
        for (const user of findOnlineDoc) {
          const loginData = await Logs.findOne({ userId: user?._id.toString() }).sort({ loginDateTime: -1 }).lean();
          updatedDocs.push({
            ...user,
            loginTime: loginData?.loginDateTime || "Not Available",
          });
        }

        return sendResponse(req, res, 200, {
          status: true,
          body: {
            count : findOnlineDoc.length,
            data: updatedDocs
          },
          message: "Online doctort data fetched!",
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

}




module.exports = {
  individualDoctor: new IndividualDoctor(),
};
