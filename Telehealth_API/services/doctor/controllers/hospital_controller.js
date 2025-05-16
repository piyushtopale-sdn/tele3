"use strict";

// models
import PortalUser from "../models/portal_user";
import StaffInfo from "../models/staff_info";
import DoctorAvailability from "../models/doctor_availability";
import DocumentInfo from "../models/document_info";
import Otp2fa from "../models/otp2fa";
import ForgotPasswordToken from "../models/forgot_password_token";
import Specialty from "../models/specialty_info";
import Department from "../models/department_info";
import Service from "../models/service_info";
import Expertise from "../models/expertise_info";
import BasicInfo from "../models/basic_info";
import Appointment from "../models/appointment";
import Notification from "../models/notification";
import HospitalType from "../models/hospitalType";
import ProfileInfo from "../models/profile_info";
// utils
import { sendResponse } from "../helpers/transmission";
import { hashPassword } from "../helpers/string";
import { sendSms } from "../middleware/sendSms";
import {
  checkPassword,
  formatDateAndTime,
  bcryptCompare,
  generateTenSaltHash,
  processExcel,
} from "../middleware/utils";
import {
  verifyEmail2fa,
  forgotPasswordEmail,
} from "../helpers/emailTemplate";
import { sendEmail } from "../helpers/ses";
import crypto from "crypto";
import mongoose from "mongoose";
import Http from "../helpers/httpservice";
const httpService = new Http();
const moment = require('moment-timezone');
import {
  SpecialtyColumns,
  departmentHospital,
  expertiseHospital,
  serviceHospital,
  generate6DigitOTP,
  smsTemplateOTP
} from "../config/constants";
import fs from "fs";
import HospitalLocation from "../models/hospital_location";
import Logs from "../models/logs";
import ProviderDoc from "../models/provider_documnet";

export const formatDateToYYYYMMDD = async (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Add 1 to month because it's zero-based
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

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
const getUnavailabilityDay = async (week_days) => {
  let dayArray = [];
  for (const week_day of week_days) {
    for (const value of week_day) {
      let sunIndex = dayArray.indexOf("sun");
      let monIndex = dayArray.indexOf("mon");
      let tueIndex = dayArray.indexOf("tue");
      let wedIndex = dayArray.indexOf("wed");
      let thuIndex = dayArray.indexOf("thu");
      let friIndex = dayArray.indexOf("fri");
      let satIndex = dayArray.indexOf("sat");
      if (value.sun_start_time === "0000" && value.sun_end_time === "0000") {
        if (sunIndex === -1) {
          dayArray.push("sun");
        }
      } else {
        if (sunIndex >= -1) {
          dayArray.splice(sunIndex, 1);
        }
      }
      if (value.mon_start_time === "0000" && value.mon_end_time === "0000") {
        if (monIndex === -1) {
          dayArray.push("mon");
        }
      } else {
        if (monIndex >= -1) {
          dayArray.splice(monIndex, 1);
        }
      }
      if (value.tue_start_time === "0000" && value.tue_end_time === "0000") {
        if (tueIndex === -1) {
          dayArray.push("tue");
        }
      } else {
        if (tueIndex >= -1) {
          dayArray.splice(tueIndex, 1);
        }
      }
      if (value.wed_start_time === "0000" && value.wed_end_time === "0000") {
        if (wedIndex === -1) {
          dayArray.push("wed");
        }
      } else {
        if (wedIndex >= -1) {
          dayArray.splice(wedIndex, 1);
        }
      }
      if (value.thu_start_time === "0000" && value.thu_end_time === "0000") {
        if (thuIndex === -1) {
          dayArray.push("thu");
        }
      } else {
        if (thuIndex >= -1) {
          dayArray.splice(thuIndex, 1);
        }
      }
      if (value.fri_start_time === "0000" && value.fri_end_time === "0000") {
        if (friIndex === -1) {
          dayArray.push("fri");
        }
      } else {
        if (friIndex >= -1) {
          dayArray.splice(friIndex, 1);
        }
      }
      if (value.sat_start_time === "0000" && value.sat_end_time === "0000") {
        if (satIndex === -1) {
          dayArray.push("sat");
        }
      } else {
        if (satIndex >= -1) {
          dayArray.splice(satIndex, 1);
        }
      }
    }
  }
  return dayArray;
};
const getUnavailabilityDate = async (unavailability_dates) => {
  let dateArray = [];
  if (unavailability_dates.length > 0) {
    for (const unavailability_date of unavailability_dates) {
      if (unavailability_date.length > 0) {
        for (const value of unavailability_date) {
          if (value.date != "") {
            let date = formatDateAndTime(value.date).split(" ")[0];

            if (dateArray.indexOf(date) === -1) {
              dateArray.push(date);
            }
          }
        }
      }
    }
  }

  return dateArray;
};

export const updatePaymentStatusAndSlot = async (appointmentId, req) => {
  const appointmentDetails = await Appointment.findById(
    mongoose.Types.ObjectId(appointmentId)
  );

  let notificationCreator = null;
  let notificationReceiver = null;
  if (appointmentDetails.madeBy == "doctor") {
    notificationCreator = appointmentDetails.doctorId;
    notificationReceiver = appointmentDetails.patientId;
  } else {
    notificationCreator = appointmentDetails.patientId;
    notificationReceiver = appointmentDetails.doctorId;
  }

  let appointType = appointmentDetails.appointmentType.replace("_", " ");

  let message = `You have recevied one new appoitment for ${appointType} consulation at ${appointmentDetails.hospital_details.hospital_name} on ${appointmentDetails.consultationDate} | ${appointmentDetails.consultationTime} from ${appointmentDetails.patientDetails.patientFullName}`;
  let requestData = {
    created_by_type: appointmentDetails.madeBy,
    created_by: notificationCreator,
    content: message,
    url: "",
    for_portal_user: notificationReceiver,
    notitype: "New Appointment",
    appointmentId: appointmentId,
  };

  let timeStamp = new Date();
  let timeStampString;
  let slot = null;

  const locationResult = await HospitalLocation
    .find({
      for_portal_user: notificationReceiver,
      "hospital_or_clinic_location.status": "APPROVED",
    })
    .exec();

  const hospitalObject = locationResult[0].hospital_or_clinic_location;

  const hospitalId = hospitalObject[hospitalObject.length - 1].hospital_id;
  const headers = {
    Authorization: req.headers["authorization"],
  };

  for (let index = 0; index < 3; index++) {
    const resData = await httpService.postStaging(
      "hospital/doctor-available-slot",
      {
        locationId: hospitalId,
        doctorId: notificationReceiver,
        appointmentType: "ONLINE",
        timeStamp: timeStamp,
      },
      headers,
      "hospitalServiceUrl"
    );

    const slots = resData?.body?.allGeneralSlot;

    let isBreak = false;
    if (slots) {
      for (let index = 0; index < slots.length; index++) {
        const element = slots[index];
        if (element.status == 0) {
          slot = element;
          isBreak = true;
          break;
        }
      }
    }

    if (slot != null) {
      isBreak = true;
      break;
    }

    if (!isBreak) {
      timeStampString = moment(timeStamp, "DD-MM-YYYY").add(1, "days");
      timeStamp = new Date(timeStampString);
    }
  }

  if (slot != null) {
    await BasicInfo.findOneAndUpdate(
      { for_portal_user: { $eq: notificationReceiver } },
      {
        $set: {
          nextAvailableSlot: slot.slot,
          nextAvailableDate: timeStamp,
        },
      },

      { upsert: false, new: true }
    ).exec();
  }
};


class HospitalController {

  async sendSmsOtpFor2fa(req, res) {
    try {
      const { email } = req.body;
      const { uuid } = req.headers;
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
      const mobile = portalUserData.mobile;
      const country_code = portalUserData.country_code;
      const deviceExist = await Otp2fa.findOne({
        mobile,
        country_code,
        uuid,
        for_portal_user: portalUserData._id,
      }).lean();
      if (deviceExist && deviceExist.send_attempts >= 500000) {
        return sendResponse(req, res, 422, {
          status: false,
          body: null,
          message: "Maximum attempt exceeded",
          errorCode: "MAX ATTEMPT_EXCEEDED",
        });
      }
      const otp = generate6DigitOTP();
      const otpText = smsTemplateOTP(otp);
      const smsRes = await sendSms(country_code + mobile, otpText);
      let result = null;
      if (smsRes == 200) {
        if (deviceExist) {
          result = await Otp2fa.findOneAndUpdate(
            { mobile, country_code, uuid, for_portal_user: portalUserData._id },
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
          try {
            result = await otpData.save();
          } catch (error) {
            console.error("An error occurred:", error);
            sendResponse(req, res, 500, {
              status: false,
              body: null,
              message: "something went wrong",
              errorCode: null,
            });
          }
        }
        return sendResponse(req, res, 200, {
          status: true,
          body: {
            id: result._id,
          },
          message: "OTP sent successfully.",
          errorCode: null,
        });
      } else {
        return sendResponse(req, res, 500, {
          status: false,
          body: null,
          message: "can't sent sms",
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

  async sendEmailOtpFor2fa(req, res) {
    try {
      const { email } = req.body;
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
      const deviceExist = await Otp2fa.findOne({
        email,
        uuid,
        for_portal_user: portalUserData._id,
      }).lean();
      if (deviceExist && deviceExist.send_attempts >= 500000) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "Maximum attempt exceeded",
          errorCode: "MAX ATTEMPT_EXCEEDED",
        });
      }
      const otp = generate6DigitOTP();
      const content = verifyEmail2fa(email, otp);
      sendEmail(content);
      let result = null;
      if (deviceExist) {
        result = await Otp2fa.findOneAndUpdate(
          { email, uuid, for_portal_user: portalUserData._id },
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
      sendResponse(req, res, 500, {
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
        for_portal_user,
        verified: false,
        mobile,
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
            { uuid, for_portal_user, verified: false, mobile },
            {
              $set: {
                verified: true,
              },
            },
            { new: true }
          ).exec();
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
          sendResponse(req, res, 200, {
            status: false,
            body: null,
            message: "Incorrect OTP",
            errorCode: "INCORRECT_OTP",
          });
        }
      } else {
        sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "User not found",
          errorCode: "USER_NOT_FOUND",
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
            { uuid, email, for_portal_user, verified: false },
            {
              $set: {
                verified: true,
              },
            },
            { new: true }
          ).exec();
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
          sendResponse(req, res, 200, {
            status: false,
            body: null,
            message: "Incorrect OTP",
            errorCode: "INCORRECT_OTP",
          });
        }
      } else {
        sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "User not found",
          errorCode: "USER_NOT_FOUND",
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
      let sendEmailStatus = sendEmail(content);
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

  async changePassword(req, res) {
    const { id, old_password, new_password } = req.body;
    if (old_password === new_password) {
      return sendResponse(req, res, 200, {
        status: false,
        body: null,
        message: "new password shouldn't be same as old password",
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
      const isPasswordMatch = await checkPassword(old_password, portalUserData);
      if (!isPasswordMatch) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "This is your previous password. Please enter a new password.",
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
 
  //Specialty By Super-admin
  async addSpecialty(req, res) {
    try {
      const { specialityArray, added_by } = req.body;
      const list = specialityArray.map((singleData) => ({
        ...singleData,
        added_by,
      }));
      const namesToFind = list.map((item) => item.specilization);
      const foundItems = await Specialty.find({
        specilization: { $in: namesToFind },
        delete_status: false,
      });
      const CheckData = foundItems.map((item) => item.specilization);
      if (foundItems.length == 0) {
        const savedSpecialty = await Specialty.insertMany(list);
        sendResponse(req, res, 200, {
          status: true,
          body: savedSpecialty,
          message: "Successfully add specialty",
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
        message: "failed to add specialty",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async allSpecialty(req, res) {
    try {
      const { limit, page, searchText, fromDate, toDate } = req.query;
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
          specilization: { $regex: searchText || "", $options: "i" },
        };
      }
      if(fromDate && toDate) {
        const fromDateObj = new Date(`${fromDate} 00:00:00`);
        const toDateObj = new Date(`${toDate} 23:59:59`);
        filter.createdAt = { $gte: fromDateObj, $lte: toDateObj }
      }
      const specialityList = await Specialty.find(filter)
        .sort(sortingarray)
        .skip((page - 1) * limit)
        .limit(limit * 1)
        .exec();
      const count = await Specialty.countDocuments(filter);
      sendResponse(req, res, 200, {
        status: true,
        body: {
          totalCount: count,
          data: specialityList,
        },
        message: "Successfully get specialty list",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get specialty list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async allSpecialtyListforexport(req, res) {
    const { searchText, limit, page } = req.query;
    let filter;
    if (searchText == "") {
      filter = {
        delete_status: false,
      };
    } else {
      filter = {
        delete_status: false,
        specialization: { $regex: searchText || "", $options: "i" },
      };
    }
    try {
      let result = "";
      if (limit > 0) {
        result = await Specialty.find(filter)
          .sort([["createdAt", -1]])
          .skip((page - 1) * limit)
          .limit(limit * 1)
          .exec();
      } else {
        result = await Specialty.aggregate([
          {
            $match: filter,
          },
          { $sort: { createdAt: -1 } },
          {
            $project: {
              _id: 0,
              specilization: "$specilization",
            },
          },
        ]);
      }
      let array = result.map((obj) => Object.values(obj));
      sendResponse(req, res, 200, {
        status: true,
        data: {
          result,
          array,
        },
        message: `Speciality added successfully`,
        errorCode: null,
      });
    } catch (err) {
      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to add lab test`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async updateSpecialty(req, res) {
    try {
      const { specialityId, specilization, specilization_arabic, active_status, delete_status } =
        req.body;
      const updateSpeciality = await Specialty.updateOne(
        { _id: specialityId },
        {
          $set: {
            specilization,
            specilization_arabic,
            active_status,
            delete_status,
          },
        },
        { new: true }
      ).exec();
      sendResponse(req, res, 200, {
        status: true,
        body: updateSpeciality,
        message: "Successfully updated specialty",
        errorCode: null,
      });
    } catch (err) {
      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to update specialty`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async actionOnSpecialty(req, res) {
    try {
      const { specialityId, action_name, action_value } = req.body;
      let message = "";

      const filter = {};
      if (action_name == "active") filter["active_status"] = action_value;
      if (action_name == "delete") filter["delete_status"] = action_value;

      if (action_name == "active") {
        await Specialty.updateOne({ _id: specialityId }, filter, {
          new: true,
        }).exec();

        message =
          action_value == true
            ? "Successfully Active Speciality"
            : "Successfully In-active Speciality";
      }

      if (action_name == "delete") {
        if (specialityId == "") {
          await Specialty.updateMany(
            { delete_status: { $eq: false } },
            {
              $set: { delete_status: true },
            },
            { new: true }
          );
        } else {
          await Specialty.updateMany(
            { _id: { $in: specialityId } },
            {
              $set: { delete_status: true },
            },
            { new: true }
          );
        }
        message = "Successfully Deleted Speciality";
      }

      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: message,
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
  async uploadCSVForSpecialty(req, res) {
    try {
      const filePath = "./uploads/" + req.filename;
      const data = await processExcel(filePath);

      const isValidFile = validateColumnWithExcel(SpecialtyColumns, data[0]);
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
      const existingSpeciality = await Specialty.find(
        { delete_status: false },
        "specilization"
      );
      const existingSpecialityNames = existingSpeciality.map(
        (specilization) => specilization.specilization
      );
      const inputArray = [];
      const duplicateSpeciality = [];

      for (const singleData of data) {
        const trimmedSpeciality = singleData.specialization.trim();
        if (existingSpecialityNames.includes(trimmedSpeciality)) {
          duplicateSpeciality.push(trimmedSpeciality);
        } else {
          inputArray.push({
            specilization: singleData.specialization,
            added_by: req.body.added_by,
          });
        }
      }
      if (duplicateSpeciality.length > 0) {
        return sendResponse(req, res, 400, {
          status: false,
          body: null,
          message: `Speciality already exist: ${duplicateSpeciality.join(
            ", "
          )}`,
          errorCode: null,
        });
      }
      if (inputArray.length > 0) {
        const result = await Specialty.insertMany(inputArray);
        sendResponse(req, res, 200, {
          status: true,
          body: result,
          message: "All specialty records added successfully",
          errorCode: null,
        });
      } else {
        return sendResponse(req, res, 200, {
          status: true,
          body: null,
          message: "No new specialty added",
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
  async exportSpecialty(req, res) {
    try {
      let csv;
      const result = await Specialty.find({});
      const newPath = `./downloadCSV/specialtyExport.csv`;
      csv = result.map((row) => {
        return `"${row.specilization}","${row.active_status === true ? 1 : 0}"`;
      });
      const columns = Object.values(SpecialtyColumns).join(",");
      csv.unshift(columns);
      let csvData = csv.join("\n");
      fs.writeFile(newPath, csvData, (err, data) => {
        if (err) {
          return sendResponse(req, res, 200, {
            status: false,
            body: err,
            message: "Something went wrong while uploading file",
            errorCode: "INTERNAL_SERVER_ERROR",
          });
        }
        res.download(newPath);
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

  async bookedAppointmentsList(req, res) {
    try {
      const { doctorId } = req.body;
      const result = await Appointment.find(
        { doctorId },
        { consultationDate: 1, consultationTime: 1 }
      );
      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: `Successfully get booked appointment list`,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `failed to get booked appointment list`,
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
        message: `Failed to save notification`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async notificationlist(req, res) {
    try {
      const { page, limit } = req.query;
      const notificationData = await Notification.find({
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
          totalCount: totalCount,
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

  async updateNotification(req, res) {
    try {
      const { receiverId, isnew } = req.body;

      if (!isnew) {
        await Notification.updateMany(
          { for_portal_user: { $eq: receiverId } },
          {
            $set: {
              new: false,
            },
          },
          { upsert: false, new: true }
        ).exec();
      }
      sendResponse(req, res, 200, {
        status: true,
        body: null,
        message: `Notification updated successfully`,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `failed to update notification list`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getHospitalType(req, res) {
    try {
      const result = await HospitalType.find({});
      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: `Successfully get all hospital type`,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `failed to get all hospital type`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async filterValue(req, res) {
    try {
      let filter = {
        verify_status: "APPROVED",
        "for_portal_user.lock_user": false,
        "for_portal_user.isDeleted": false,
        "for_portal_user.isActive": true,
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
        {
          $lookup: {
            from: "feemanagements",
            localField: "in_fee_management",
            foreignField: "_id",
            as: "feemanagements",
          },
        },
        {
          $unwind: {
            path: "$feemanagements",
            preserveNullAndEmptyArrays: true,
          },
        },
        { $match: filter },
        {
          $addFields: {
            doctorOnlineBasicFee: "$feemanagements.online.basic_fee",
          },
        },
        {
          $group: {
            _id: null,
            max: { $max: "$doctorOnlineBasicFee" },
            min: { $min: "$doctorOnlineBasicFee" },
          },
        },
      ];
      const result = await BasicInfo.aggregate(aggregate);
      let filter_value = {
        online_basic_fee: {
          min_value: result[0].min,
          max_value: result[0].max,
        },
      };
      // Get Hospital Type
      const getHospitalType = await HospitalType.find({}).select({ name: 1 });
      filter_value.hospital_type = getHospitalType;
      sendResponse(req, res, 200, {
        status: true,
        body: { filter_value },
        message: `Successfully get filter value`,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: error.message ? error.message : `failed to get filter value`,
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async setDoctorAvailabilityForFilter(req, res) {
    try {
      let filter = {
        "for_portal_user_d.lock_user": false,
        "for_portal_user_d.isDeleted": false,
        "for_portal_user_d.isActive": true,
        appointment_type: "ONLINE",
      };
      let aggregate = [
        {
          $lookup: {
            from: "portalusers",
            localField: "for_portal_user",
            foreignField: "_id",
            as: "for_portal_user_d",
          },
        },
        { $unwind: "$for_portal_user_d" },
        { $match: filter },
        {
          $group: {
            _id: "$for_portal_user",
            week_days: { $addToSet: "$week_days" },
            unavailability_slot: { $addToSet: "$unavailability_slot" },
          },
        },
        { $unwind: "$_id" },
      ];
      const result = await DoctorAvailability.aggregate(aggregate);

      if (result.length > 0) {
        for (const value of result) {
          const getUnavailabilityDateArray = await getUnavailabilityDate(
            value.unavailability_slot
          );
          const getUnavailabilityDayArray = await getUnavailabilityDay(
            value.week_days
          );
          await BasicInfo.findOneAndUpdate(
            {
              for_portal_user: { $eq: value._id },
            },
            {
              $set: {
                unavailability_date_array: getUnavailabilityDateArray,
                unavailability_day_array: getUnavailabilityDayArray,
              },
            }
          ).exec();
        }
      }
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: error.message ? error.message : `failed to set availability`,
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getAllUsersForChat(req, res) {
    try {
      const { loggedInId, adminId, searchText } = req.query;

      let getData;
      const getRole = await PortalUser.findOne({
        _id: mongoose.Types.ObjectId(loggedInId),
      });

      if (
        getRole.role === "HOSPITAL_ADMIN" ||
        getRole.role === "HOSPITAL_STAFF"
      ) {
        getData = await getListforHospital(
          loggedInId,
          adminId,
          searchText,
          req
        );
      }
      if (getRole.role === "INDIVIDUAL_DOCTOR_STAFF") {
        getData = await getIndividualDoctorStaff(loggedInId, adminId);
      }
      if (getRole.role === "INDIVIDUAL_DOCTOR") {
        getData = await getLisforIndividualDoctor(loggedInId, adminId);
      }
      if (getRole.role === "HOSPITAL_DOCTOR") {
        getData = await getListforHospitalDoctor(loggedInId, adminId);
      }

      return sendResponse(req, res, 200, {
        status: true,
        body: getData,
        message: "successfully get all hospital staff",
        errorCode: null,
      });
    } catch (error) {
      console.error(error);
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get all hospital staff",
        errorCode: "INTERNAL_SERVER_ERROR",
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

  async departmentListforexport(req, res) {
    const { searchKey, limit, page, userid } = req.query;
    let filter;

    if (searchKey == "") {
      filter = {
        delete_status: false,
        added_by: mongoose.Types.ObjectId(userid),
      };
    } else {
      filter = {
        delete_status: false,
        department: { $regex: searchKey || "", $options: "i" },
        added_by: mongoose.Types.ObjectId(userid),
      };
    }

    try {
      let result = "";
      if (limit > 0) {
        result = await Department.find(filter)
          .sort([["createdAt", -1]])
          .skip((page - 1) * limit)
          .limit(limit * 1)
          .populate("department")
          .exec();
      } else {
        result = await Department.aggregate([
          {
            $match: filter,
          },
          { $sort: { createdAt: -1 } },
          {
            $lookup: {
              from: "portalusers",
              localField: "added_by",
              foreignField: "_id",
              as: "expertiseData",
            },
          },
          {
            $unwind: {
              path: "$expertiseData",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 0,
              department: "$department",
            },
          },
        ]);
      }

      let array = result.map((obj) => Object.values(obj));
      sendResponse(req, res, 200, {
        status: true,
        data: {
          result,
          array,
        },
        message: `List export successfully`,
        errorCode: null,
      });
    } catch (err) {
      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: "failed to export list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async uploadExcelforDepartment(req, res) {
    try {
      const filePath = "./uploads/" + req.filename;
      const data = await processExcel(filePath);
      let added_by = req.body.user_id;

      if (data.length === 0) {
        return sendResponse(req, res, 400, {
          status: false,
          body: null,
          message: "Excel data is empty",
          errorCode: null,
        });
      }

      const isValidFile = validateColumnWithExcel(departmentHospital, data[0]);
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
      let departmentArray = data;

      const duplicateDepartments = await Department.find({
        $and: [
          { added_by: added_by },
          { delete_status: false },
          {
            department: {
              $in: departmentArray.map((data) => data.department_name),
            },
          },
        ],
      });
      if (duplicateDepartments.length > 0) {
        departmentArray = departmentArray.filter((department) => {
          return !duplicateDepartments.some(
            (d) =>
              d.department === department.department_name &&
              d.added_by.toString() === added_by &&
              d.delete_status === false
          );
        });
      }
      const list = departmentArray.map((singleData) => ({
        department: singleData.department_name,
        active_status: true,
        added_by,
      }));
      const savedDepartment = await Department.insertMany(list);

      sendResponse(req, res, 200, {
        status: true,
        body: savedDepartment,
        message: "All department records added successfully",
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Internal server error 1",
        errorCode: null,
      });
    }
  }

  async expertiseListforexport(req, res) {
    const { searchKey, limit, page, userid } = req.query;
    let filter;

    if (searchKey == "") {
      filter = {
        delete_status: false,
        added_by: mongoose.Types.ObjectId(userid),
      };
    } else {
      filter = {
        delete_status: false,
        expertise: { $regex: searchKey || "", $options: "i" },
        added_by: mongoose.Types.ObjectId(userid),
      };
    }

    try {
      let result = "";
      if (limit > 0) {
        result = await Expertise.find(filter)
          .sort([["createdAt", -1]])
          .skip((page - 1) * limit)
          .limit(limit * 1)
          .populate("country_id", "name")
          .exec();
      } else {
        result = await Expertise.aggregate([
          {
            $match: filter,
          },
          { $sort: { createdAt: -1 } },
          {
            $lookup: {
              from: "portalusers",
              localField: "added_by",
              foreignField: "_id",
              as: "expertiseData",
            },
          },
          {
            $unwind: {
              path: "$expertiseData",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 0,
              expertise: "$expertise",
              // added_by: "$expertiseData.role"
            },
          },
        ]);
      }

      let array = result.map((obj) => Object.values(obj));
      sendResponse(req, res, 200, {
        status: true,
        data: {
          result,
          array,
        },
        message: `List export successfully`,
        errorCode: null,
      });
    } catch (err) {
      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: "failed to export list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async uploadExcelforExpertise(req, res) {
    try {
      const filePath = "./uploads/" + req.filename;
      const data = await processExcel(filePath);
      let added_by = req.body.user_id;

      if (data.length === 0) {
        return sendResponse(req, res, 400, {
          status: false,
          body: null,
          message: "Excel data is empty",
          errorCode: null,
        });
      }

      const isValidFile = validateColumnWithExcel(expertiseHospital, data[0]);
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
      let expertiseArray = data;

      const duplicateExpertise = await Expertise.find({
        $and: [
          { added_by: added_by },
          { delete_status: false },
          {
            expertise: {
              $in: expertiseArray.map((data) => data.expertise_name),
            },
          },
        ],
      });
      if (duplicateExpertise.length > 0) {
        expertiseArray = expertiseArray.filter((expertise) => {
          return !duplicateExpertise.some(
            (d) =>
              d.expertise === expertise.expertise_name &&
              d.added_by.toString() === added_by &&
              d.delete_status === false
          );
        });
      }

      const list = expertiseArray.map((singleData) => ({
        expertise: singleData.expertise_name,
        added_by,
      }));
      const savedExpertise = await Expertise.insertMany(list);

      sendResponse(req, res, 200, {
        status: true,
        body: savedExpertise,
        message: "All expertise records added successfully",
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Internal server error 1",
        errorCode: null,
      });
    }
  }

  async uploadCSVForService(req, res) {
    try {
      const filePath = "./uploads/" + req.filename;
      const data = await processExcel(filePath);
      const isValidFile = validateColumnWithExcel(serviceHospital, data[0]);
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
      if (data.length === 0) {
        return sendResponse(req, res, 400, {
          status: false,
          body: null,
          message: "Excel data is empty",
          errorCode: null,
        });
      }

      for (const element of data) {
        const department = await Department.find({
          department: element.for_department,
          delete_status: false,
          added_by: mongoose.Types.ObjectId(req.body.user_id),
        });
        if (!department) {
          return sendResponse(req, res, 200, {
            status: false,
            body: null,
            message: `Department '${element.for_department}' does not exist`,
            errorCode: null,
          });
        } else {
          let service;
          for (let data of department) {
            service = data?._id;
          }
          // Check if the combination of country name and region name already exists
          const existingRegion = await Service.findOne({
            service: element.service_name,
            for_department: mongoose.Types.ObjectId(service),
            delete_status: false,
            added_by: req.body.user_id,
          });
          if (existingRegion) {
            return sendResponse(req, res, 500, {
              status: false,
              body: null,
              message: `'${element.service_name} already exists`,
              errorCode: null,
            });
          } else {
            const payload = {
              service: element.service_name,
              for_department: service,
              added_by: req.body.user_id,
            };
            const region = new Service(payload);
            await region.save();
          }
        }
      }

      return sendResponse(req, res, 200, {
        status: true,
        body: null,
        message: "Service added successfully",
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

  async serviceListforexport(req, res) {
    const { searchKey, limit, page, userid } = req.query;
    let filter;

    if (searchKey == "") {
      filter = {
        delete_status: false,
        added_by: mongoose.Types.ObjectId(userid),
      };
    } else {
      filter = {
        delete_status: false,
        service: { $regex: searchKey || "", $options: "i" },
        added_by: mongoose.Types.ObjectId(userid),
      };
    }

    try {
      let result = "";
      if (limit > 0) {
        result = await Service.find(filter)
          .sort([["createdAt", -1]])
          .skip((page - 1) * limit)
          .limit(limit * 1)
          .populate("country_id", "name")
          .exec();
      } else {
        result = await Service.aggregate([
          {
            $match: filter,
          },
          { $sort: { createdAt: -1 } },
          {
            $lookup: {
              from: "portalusers",
              localField: "added_by",
              foreignField: "_id",
              as: "expertiseData",
            },
          },
          {
            $unwind: {
              path: "$expertiseData",
              preserveNullAndEmptyArrays: true,
            },
          },

          {
            $lookup: {
              from: "departments",
              localField: "for_department",
              foreignField: "_id",
              as: "departmentData",
            },
          },
          {
            $unwind: {
              path: "$departmentData",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 0,
              expertise: "$service",
              department: "$departmentData.department",
              // added_by: "$expertiseData.role"
            },
          },
        ]);
      }

      let array = result.map((obj) => Object.values(obj));
      sendResponse(req, res, 200, {
        status: true,
        data: {
          result,
          array,
        },
        message: `List export successfully`,
        errorCode: null,
      });
    } catch (err) {
      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: "failed to export list",
        errorCode: "INTERNAL_SERVER_ERROR",
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

  async totalHospitalforAdminDashboard(req, res) {
    try {
      const totalCount = await PortalUser.countDocuments({
        isDeleted: false,
        role: "HOSPITAL_ADMIN",
      });

      if (totalCount >= 0) {
        return sendResponse(req, res, 200, {
          status: true,
          body: { totalCount },
          message: "Hospital Count Fetch Successfully",
        });
      } else {
        return sendResponse(req, res, 400, {
          status: true,
          body: { totalCount: 0 },
          message: "Hospital Count not Fetch",
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

  async totalConsultation(req, res) {
    try {
      const totalF2FCount = await Appointment.countDocuments({
        appointmentType: "FACE_TO_FACE",
      });
      const totalHomeVisitCount = await Appointment.countDocuments({
        appointmentType: "HOME_VISIT",
      });
      const totalOnlineCount = await Appointment.countDocuments({
        appointmentType: "ONLINE",
      });

      if (
        totalF2FCount >= 0 ||
        totalHomeVisitCount >= 0 ||
        totalOnlineCount >= 0
      ) {
        return sendResponse(req, res, 200, {
          status: true,
          body: { totalF2FCount, totalHomeVisitCount, totalOnlineCount },
          message: "Consultation Count Fetch Successfully",
        });
      } else {
        return sendResponse(req, res, 400, {
          status: true,
          body: {
            totalF2FCount: 0,
            totalHomeVisitCount: 0,
            totalOnlineCount: 0,
          },
          message: "Consultation Count not Fetch",
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

  async saveFouPortalLocationData(req, res) {
    try {
      const hlocData = new HospitalLocation({
        hospital_or_clinic_location,
        for_portal_user: req.body.data.portal_user_id,
      });

      const hlocResult = await hlocData.save();

      sendResponse(req, res, 200, {
        status: true,
        data: hlocResult,
        message: `hospital location fetch successfully`,
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

  async getHospitalLocationData(req, res) {
    try {
      let result = await HospitalLocation.find({
        for_portal_user: mongoose.Types.ObjectId(req.query.data),
      }).exec();

      sendResponse(req, res, 200, {
        status: true,
        data: result,
        message: `hospital location fetch successfully`,
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

  async getServiceData(req, res) {
    try {
      let result = await Service.find({ _id: req.query.data }).exec();
      sendResponse(req, res, 200, {
        status: true,
        data: result,
        message: `hospital Service fetch successfully`,
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

  async getDepartmentData(req, res) {
    try {
      let result = await Department.find({ _id: req.query.data }).exec();
      sendResponse(req, res, 200, {
        status: true,
        data: result,
        message: `hospital Department fetch successfully`,
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

  async getSpecialityData(req, res) {
    try {
      let result = await Specialty.find({ _id: req.query.data }).exec();
      sendResponse(req, res, 200, {
        status: true,
        data: result,
        message: `hospital specility fetch successfully`,
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

  async getExpertiseData(req, res) {
    try {
      let result = await Expertise.find({ _id: req.query.data }).exec();
      sendResponse(req, res, 200, {
        status: true,
        data: result,
        message: `hospital Expertise fetch successfully`,
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

  async getPortalUserData(req, res) {
    try {
      let result = await PortalUser.find({
        _id: mongoose.Types.ObjectId(req.query.data),
        isDeleted: false,
      }).exec();
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

  async getStaffProfileData(req, res) {
    try {
      let result = await ProfileInfo.find({
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

  async getAllLocationById(req, res) {
    try {
      const { portal_user_id } = req.query;
      let alllocation = await HospitalLocation.find({
        for_portal_user: portal_user_id,
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

  async getHospitalStaffData(req, res) {
    try {
      let allresult = [];
      if (req.query?.data?.length >= 1) {
        let assign_staff_array = [];
        for (const data of req.query?.data) {
          let basicData = await ProfileInfo.findById(data)
            .select({ name: 1 })
            .populate({
              path: "for_portal_user",
              select: { email: 1, country_code: 1, mobile: 1 },
            });
          if (basicData) {
            let staff_info = await StaffInfo.find({
              for_portal_user: basicData.for_portal_user._id,
            })
              .select({ degree: 1 })
              .populate({ path: "role", select: { name: 1 } });
            assign_staff_array.push({
              _id: data,
              full_name: basicData.name,
              email: basicData.for_portal_user.email,
              country_code: basicData.for_portal_user.country_code,
              mobile: basicData.for_portal_user.mobile,
              role: staff_info[0].role.name,
            });
          }
        }
        allresult = assign_staff_array;
      }

      if (allresult.length > 0) {
        sendResponse(req, res, 200, {
          status: true,
          body: allresult,
          message: "Data getting successfully!",
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "Failed to fetch data",
          errorCode: "INTERNAL_SERVER_ERROR",
        });
      }
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        data: error,
        message: "Failed to fetch all staff data",
        errorCode: "INTERNAL_SERVER_ERROR",
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
      const documents = await ProviderDoc.find(filter).exec();
      if (!documents || documents.length === 0) {
        return sendResponse(req, res, 201, {
          status: false,
          body: documents,
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

  async getProviderDocument(req, res) {
    try {
      const dataurl = '';
      sendResponse(req, res, 200, {
        status: true,
        data: dataurl,
        message: `file fetched successfully`,
        errorCode: null,
      });
    } catch (err) {
      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to get file url`,
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
        await ProviderDoc.findByIdAndUpdate(documentId, {
          status: status,
        }).exec();
        return sendResponse(req, res, 200, {
          status: true,
          body: null,
          message: "Document update successfully",
          errorCode: null,
        });
      } else if (action === "deleted") {
        await ProviderDoc.findByIdAndUpdate(documentId, {
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

  async totalCountforHospitalDashboard(req, res) {
    let { hospital_id, dateFilter } = req.query;
    let checkUser = await PortalUser.findOne({
      _id: mongoose.Types.ObjectId(hospital_id),
    });

    if (checkUser.role === "HOSPITAL_STAFF") {
      let adminData = await StaffInfo.findOne({
        for_portal_user: mongoose.Types.ObjectId(hospital_id),
      });
      hospital_id = adminData?.in_hospital;
    }

    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };

      let dateWiseFilter = {};
      if (dateFilter !== "") {
        let chooseDate = new Date(dateFilter).toISOString();
        dateWiseFilter = {
          "appointments.createdAt": {
            $lte: new Date(`${chooseDate}`),
          },
        };
      }

      let filter = {
        "for_portal_user.role": {
          $in: ["HOSPITAL_DOCTOR", "INDIVIDUAL_DOCTOR"],
        },
        "for_portal_user.isDeleted": false,
        // for_hospital: mongoose.Types.ObjectId(hospital_portal_id),
        for_hospitalIds: { $in: [mongoose.Types.ObjectId(hospital_id)] },
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
          $lookup: {
            from: "appointments",
            localField: "for_portal_user._id",
            foreignField: "doctorId",
            as: "appointments",
          },
        },
        {
          $unwind: { path: "$appointments", preserveNullAndEmptyArrays: true },
        },
        {
          $match: dateWiseFilter,
        },

        {
          $project: {
            appointments: "$appointments",
          },
        },
      ];
      const totalCount = await BasicInfo.aggregate(aggregate);
      const result = await BasicInfo.aggregate(aggregate);
      const fourportalData = await httpService.getStaging(
        "labradio/four-portal-appointment-details-hospital-dashboard",
        { hospital_id, dateFilter },
        headers,
        "labradioServiceUrl"
      );

      // Initialize sum to 0
      let totalDoctorAppointmentFees = 0;
      let totalFourPortalAppointmentFees = 0;
      let portal_idSet = new Set();
      const promises = result.map(async (item) => {
        try {
          if (item?.appointments?.doctorId != null) {
            portal_idSet.add(String(item.appointments.doctorId)); // Convert ObjectId to string
          }
          if (item?.appointments?.paymentDetails != null) {
            totalDoctorAppointmentFees += parseFloat(
              item?.appointments?.paymentDetails?.doctorFees
            );
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      });
      try {
        await Promise.all(promises);
      } catch (error) {
        console.error("Error in one of the promises:", error);
      }

      const promises1 = fourportalData?.data?.data.map(async (item) => {
        try {
          if (item?.appointments?.portalId != null) {
            portal_idSet.add(String(item.appointments.portalId)); // Convert ObjectId to string
          }
          if (item?.appointments?.paymentDetails != null) {
            totalFourPortalAppointmentFees += parseFloat(
              item?.appointments?.paymentDetails?.doctorFees
            );
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      });
      try {
        await Promise.all(promises1);
      } catch (error) {
        console.error("Error in one of the promises:", error);
      }

      let totalRevenue = 0;
      totalRevenue =
        totalDoctorAppointmentFees + totalFourPortalAppointmentFees;

      sendResponse(req, res, 200, {
        status: true,
        data: {
          data: result,
          totaldoctorcount: totalCount?.length,
          fourportalData: fourportalData?.data,
          totalRevenue: totalRevenue,
        },
        message: `data fetched successfully`,
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

  async totalStaffDoctorHospitalDashboard(req, res) {
    let { hospital_id, dateFilter } = req.query;

    try {
      // const staffCount = await PortalUser.find({role:'HOSPITAL_STAFF',created_by_user: hospital_id})
      let filter = {
        role: "HOSPITAL_STAFF",
        created_by_user: hospital_id,
        isDeleted: false,
      };

      // Apply date filter if provided
      if (dateFilter) {
        // Construct a filter based on the provided date filter
        filter.createdAt = { $lte: new Date(dateFilter).toISOString() };
      }

      const staffCount = await PortalUser.countDocuments(filter);

      let dateWiseFilter = {};

      if (dateFilter !== "") {
        let chooseDate = new Date(dateFilter).toISOString();
        dateWiseFilter = {
          "for_portal_user.createdAt": {
            $lte: new Date(`${chooseDate}`),
          },
        };
      }

      let filter1 = {
        "for_portal_user.role": {
          $in: ["HOSPITAL_DOCTOR", "INDIVIDUAL_DOCTOR"],
        },
        "for_portal_user.isDeleted": false,
        for_hospitalIds: { $in: [mongoose.Types.ObjectId(hospital_id)] },
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
        { $match: filter1 },
        {
          $match: dateWiseFilter,
        },
      ];
      const result = await BasicInfo.aggregate(aggregate);

      sendResponse(req, res, 200, {
        status: true,
        data: { staffCount: staffCount, doctorCount: result?.length },
        message: `hospital doctor fetched successfully`,
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

}

export const getListforHospital = async (
  loggedInId,
  adminId,
  searchText,
  req
) => {
  try {
    const headers = {
      Authorization: req.headers["authorization"],
    };

    const matchFilter = {
      isDeleted: false,
      isActive: true,
    };

    let matchFilter2 = {};
    let aggregate = [];
    let query = [];
    let admininfo = [];

    matchFilter2 = {
      for_hospitalIds: mongoose.Types.ObjectId(loggedInId),
    };

    let filter = {
      isDeleted: false,
      isActive: true,
    };

    if (searchText && searchText !== "") {
      filter["$or"] = [
        {
          "hospitaladmininfos.full_name": { $regex: searchText, $options: "i" },
        },
        {
          full_name: { $regex: searchText, $options: "i" },
        },
      ];
    }

    aggregate = [
      {
        $match: matchFilter2,
      },
      // {
      //     $lookup: {
      //         from: "documentinfos",
      //         localField: "profile_picture",
      //         foreignField: "_id",
      //         as: "basicinfosImage",
      //     }
      // },
      // { $unwind: { path: "$basicinfosImage", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "portalusers",
          localField: "for_portal_user",
          foreignField: "_id",
          as: "portaluserData",
        },
      },
      {
        $unwind: { path: "$portaluserData", preserveNullAndEmptyArrays: true },
      },
      { $match: filter },
      {
        $project: {
          role: "$portaluserData.role",
          id: "$for_portal_user",
          name: "$full_name",
          profile_pic: {
            $cond: {
              if: { $eq: ["$profile_picture", null] },
              then: null,
              else: "$basicinfosImage.url",
            },
          },
        },
      },
    ];

    admininfo = [
      {
        $match: matchFilter,
      },
      {
        $lookup: {
          from: "hospitaladmininfos",
          localField: "_id",
          foreignField: "for_portal_user",
          as: "hospitaladmininfos",
        },
      },
      { $unwind: "$hospitaladmininfos" },
      {
        $match: {
          _id: mongoose.Types.ObjectId(adminId),
          "hospitaladmininfos.for_portal_user": {
            $ne: mongoose.Types.ObjectId(loggedInId),
          },
        },
      },
      { $match: filter },
      {
        $project: {
          role: 1,
          id: "$hospitaladmininfos.for_portal_user",
          name: "$hospitaladmininfos.full_name",
          profile_pic: "$hospitaladmininfos.profile_picture",
        },
      },
    ];

    query = [
      {
        $match: matchFilter,
      },
      {
        $lookup: {
          from: "staffinfos",
          localField: "_id",
          foreignField: "for_portal_user",
          as: "staffinfos",
        },
      },
      { $unwind: "$staffinfos" },
      {
        $match: {
          "staffinfos.in_hospital": mongoose.Types.ObjectId(adminId),
          "staffinfos.for_portal_user": {
            $ne: mongoose.Types.ObjectId(loggedInId),
          },
        },
      },
      {
        $project: {
          role: 1,
          id: "$staffinfos.for_portal_user",
          name: "$staffinfos.name",
          profile_pic: "$staffinfos.profile_picture",
        },
      },
    ];

    const resData = await httpService.getStaging(
      "labradio/get-fourportal-list-forchat-hosp",
      { data: loggedInId },
      headers,
      "labradioServiceUrl"
    );

    let fourPortalResults = [];

    if (resData?.data?.length > 0) {
      for (const portalData of resData.data) {
        let getfourPortalData = {
          role: portalData?.role,
          id: portalData?._id,
          name: portalData?.full_name,
          profile_pic: portalData?.profile_picture || null, // Add a default value if profile_picture is undefined
          type: portalData?.type,
        };

        fourPortalResults.push(getfourPortalData);
      }
    }

    // Execute the query and aggregate pipelines separately
    const queryResults = await PortalUser.aggregate(query);

    const aggregateResults = await BasicInfo.aggregate(aggregate);

    const admininfoResults = await PortalUser.aggregate(admininfo);

    // Combine the results
    const combinedResults = [
      ...queryResults,
      ...aggregateResults,
      ...admininfoResults,
      ...fourPortalResults,
    ];
    return combinedResults;
  } catch (error) {
    console.error(error);
  }
};

export const getLisforIndividualDoctor = async (loggedInId, adminId) => {
  try {
    const matchFilter = {
      isDeleted: false,
      isActive: true,
    };

    const getData = await BasicInfo.findOne({
      for_portal_user: mongoose.Types.ObjectId(loggedInId),
    });
    let query = [];
    let getHosp;
    let aggregateResults = [];
    if (getData) {
      for (let hospitalId of getData?.for_hospitalIds) {
        getHosp = await PortalUser.findOne({
          _id: mongoose.Types.ObjectId(hospitalId),
        });

        if (getHosp) {
          let getHospitalData = {
            role: getHosp?.role,
            id: getHosp?._id,
            name: getHosp?.full_name,
            profile_pic: getHosp?.profile_picture,
          };

          aggregateResults.push(getHospitalData);
        }
      }
    }
    query = [
      {
        $match: matchFilter,
      },
      {
        $lookup: {
          from: "staffinfos",
          localField: "_id",
          foreignField: "for_portal_user",
          as: "staffinfos",
        },
      },
      { $unwind: "$staffinfos" },
      {
        $match: {
          "staffinfos.in_hospital": mongoose.Types.ObjectId(adminId),
          "staffinfos.for_portal_user": {
            $ne: mongoose.Types.ObjectId(loggedInId),
          },
        },
      },
      {
        $project: {
          role: 1,
          id: "$staffinfos.for_portal_user",
          name: "$staffinfos.name",
          profile_pic: "$staffinfos.profile_picture",
        },
      },
    ];

    // Execute the query and aggregate pipelines separately
    const queryResults = await PortalUser.aggregate(query);

    // Combine the results
    const combinedResults = getHosp
      ? [...queryResults, ...aggregateResults]
      : queryResults;

    return combinedResults;
  } catch (error) {
    console.error(error);
  }
};

export const getIndividualDoctorStaff = async (loggedInId, adminId) => {
  try {
    const matchFilter = {
      isDeleted: false,
      isActive: true,
    };

    const getData = await StaffInfo.findOne({
      for_portal_user: mongoose.Types.ObjectId(loggedInId),
    });
    let getDocPortal = await PortalUser.findOne({
      _id: mongoose.Types.ObjectId(getData?.in_hospital),
    });
    let getDoctor = await BasicInfo.findOne({
      for_portal_user: mongoose.Types.ObjectId(getDocPortal?._id),
    });
    let getDocImage = await DocumentInfo.findOne({
      _id: mongoose.Types.ObjectId(getDoctor?.profile_picture),
    });

    let aggregateResults = [];

    let getHospitalData = {
      role: getDocPortal?.role,
      id: getDocPortal?._id,
      name: getDoctor?.full_name,
      profile_pic: getDocImage?.url,
    };
    aggregateResults.push(getHospitalData);

    let query = [];

    query = [
      {
        $match: matchFilter,
      },
      {
        $lookup: {
          from: "staffinfos",
          localField: "_id",
          foreignField: "for_portal_user",
          as: "staffinfos",
        },
      },
      { $unwind: "$staffinfos" },
      {
        $match: {
          "staffinfos.in_hospital": mongoose.Types.ObjectId(adminId),
          "staffinfos.for_portal_user": {
            $ne: mongoose.Types.ObjectId(loggedInId),
          },
        },
      },
      {
        $lookup: {
          from: "basicinfos",
          localField: "staffinfos.in_hospital",
          foreignField: "for_portal_user",
          as: "basicinfosData",
        },
      },
      { $unwind: "$basicinfosData" },
      {
        $project: {
          role: 1,
          id: "$staffinfos.for_portal_user",
          name: "$staffinfos.name",
          profile_pic: "$staffinfos.profile_picture",
        },
      },
    ];

    // Execute the query and aggregate pipelines separately
    const queryResults = await PortalUser.aggregate(query);

    // Combine the results
    const combinedResults = [...queryResults, ...aggregateResults];

    return combinedResults;
  } catch (error) {
    console.error(error);
  }
};

export const getListforHospitalDoctor = async (loggedInId, adminId) => {
  try {

    const getData = await BasicInfo.findOne({
      for_portal_user: mongoose.Types.ObjectId(loggedInId),
    });
    let getHosp = await PortalUser.findOne({
      _id: mongoose.Types.ObjectId(getData?.for_hospitalIds[0]),
    });

    let aggregateResults = [];

    let getHospitalData = {
      role: getData?.role,
      id: getHosp?._id,
      name: getHosp?.full_name,
      profile_pic: getHosp?.profile_picture,
    };
    aggregateResults.push(getHospitalData);

    // For Staff Data
    let staffInfoArray = [];
    let staffDataArray = [];
    if (getData && getData?.assign_staff && getData?.assign_staff?.length > 0) {
      for (let i = 0; i < getData?.assign_staff?.length; i++) {
        const staffId = getData?.assign_staff[i];
        // Add a check to skip empty strings
        if (staffId.trim() === "") {
          continue;
        }
        const staffInfo = await ProfileInfo.find({
          _id: mongoose.Types.ObjectId(staffId),
        }).exec();
        staffInfoArray.push(staffInfo);
      }
    }
    for (let i = 0; i < staffInfoArray.length; i++) {
      const staffInfo = staffInfoArray[i];
      if (staffInfo && staffInfo?.length > 0) {
        const staffData = {
          // role: getHosp?.data[i]?.role,
          id: staffInfo[0]?.for_portal_user,
          name: staffInfo[0]?.name,
          profile_pic: staffInfo[0]?.profile_picture,
        };
        staffDataArray.push(staffData);
      }
    }

    // Combine the results
    const combinedResults = [...aggregateResults, ...staffDataArray];

    return combinedResults;
  } catch (error) {
    console.error(error);
  }
};

module.exports = new HospitalController();
