"use strict";

// models
import PortalUser from "../models/portal_user";
import StaffInfo from "../models/staff_info";
import DoctorAvailability from "../models/doctor_availability";
import DocumentInfo from "../models/document_info";
import Otp2fa from "../models/otp2fa";
import ForgotPasswordToken from "../models/forgot_password_token";
import Specialty from "../models/specialty_info";
import BasicInfo from "../models/basic_info";
import Appointment from "../models/appointment";
import Notification from "../models/notification";
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
import {
  SpecialtyColumns,
  generate6DigitOTP,
  smsTemplateOTP
} from "../config/constants";
import fs from "fs";
import Logs from "../models/logs";

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
      if (smsRes === 200) {
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
      if (foundItems.length === 0) {
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
        body: null,
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
      fs.writeFile(newPath, csvData, (err) => {
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


}

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
      for (let hospitalId of getData?.for_hospitalIds ?? []) {
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



module.exports = new HospitalController();
