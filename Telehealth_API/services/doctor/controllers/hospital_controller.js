"use strict";

// models
import Counter from "../models/counter";
import PortalUser from "../models/portal_user";
import HospitalAdminInfo from "../models/hospital_admin_info";
import LocationInfo from "../models/location_info";
import PathologyTestInfo from "../models/pathology_test_info";
import PathologyTestInfoNew from "../models/pathologyTestInfoNew";
import BankDetailInfo from "../models/bank_detail";
import MobilePayInfo from "../models/mobile_pay";
import StaffInfo from "../models/staff_info";
import DoctorAvailability from "../models/doctor_availability";
import DocumentInfo from "../models/document_info";
import Otp2fa from "../models/otp2fa";
import ForgotPasswordToken from "../models/forgot_password_token";
import Specialty from "../models/specialty_info";
import Department from "../models/department_info";
import Service from "../models/service_info";
import Unit from "../models/unit_info";
import Expertise from "../models/expertise_info";
import BasicInfo from "../models/basic_info";
import Appointment from "../models/appointment";
import ReasonForAppointment from "../models/reason_for_appointment";
import HospitalOpeningHours from "../models/hospital_opening_hours";
import Notification from "../models/notification";
import HospitalType from "../models/hospitalType";
import Questionnaire from "../models/questionnaire";
import Assessment from "../models/assessment";
import Team from "../models/team";
import ProfileInfo from "../models/profile_info";
// utils
import { sendResponse } from "../helpers/transmission";
import { hashPassword } from "../helpers/string";
import { sendSms } from "../middleware/sendSms";
import {
  checkPassword,
  formatDateAndTime,
  bcryptCompare,
  generateRefreshToken,
  generateTenSaltHash,
  generateToken,
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
import { notification } from "../helpers/notification";
import {
  SpecialtyColumns,
  TimeZone,
  AppointmentReasonColumns,
  departmentHospital,
  expertiseHospital,
  serviceHospital,
  unitHospital,
  TeamColumns,
  generate6DigitOTP,
  smsTemplateOTP
} from "../config/constants";
const csv = require("fast-csv");
const fs = require("fs");
import HospitalLocation from "../models/hospital_location";
import Logs from "../models/logs";
import ProviderDoc from "../models/provider_documnet";

export const formatDateToYYYYMMDD = async (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Add 1 to month because it's zero-based
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};


function uniqueArray(array1, array2) {
  let a = array1;
  let b = array2;
  const isSameUser = (a, b) => a.slot === b.slot && a.status === b.status;

  // Get items that only occur in the left array,
  // using the compareFunction to determine equality.
  const onlyInLeft = (left, right, compareFunction) =>
    left.filter(
      (leftValue) =>
        !right.some((rightValue) => compareFunction(leftValue, rightValue))
    );

  const onlyInA = onlyInLeft(a, b, isSameUser);
  const onlyInB = onlyInLeft(b, a, isSameUser);

  const result = [...onlyInA, ...onlyInB];
  return result;
}
function filterUnavailableSlotFunction(array1, value, lastValue) {
  let startTime = value.split("-")[0];
  let endTime = lastValue.split("-")[0];
  let arr = [];
  array1.forEach((element, index) => {
    let start = element.slot.split("-")[0];

    if (
      start.split(":")[0] + start.split(":")[1] <
      startTime.split(":")[0] + startTime.split(":")[1]
    ) {
    } else {
      if (
        endTime.split(":")[0] + endTime.split(":")[1] <
        start.split(":")[0] + start.split(":")[1]
      ) {
      } else {
        arr.push(array1[index]);
      }
    }
  });
  return arr;
}
function filterBookedSlots(array1, array2) {
  array1.forEach((element, index) => {
    let xyz = array2.indexOf(element.slot);
    if (xyz != -1) {
      array1[index].status = 1;
    }
  });
  return array1;
}
function filterBookedSlotsToday(array1) {
  array1.forEach((element, index) => {
    let xyz =
      element.slot.split("-")[0].split(":")[0] +
      element.slot.split("-")[0].split(":")[1];

    const date = new Date();
    date.setHours(
      date.getHours() + TimeZone.hours,
      date.getMinutes() + TimeZone.minute
    );
    if (date.getMinutes().length == 1) {
      date.setMinutes("0" + date.getMinutes());
    }

    let hm =
      date.getHours().toString() + String(date.getMinutes()).padStart(2, "0");
    if (parseInt(hm) > parseInt(xyz)) {
      array1[index].status = 1;
    }
  });

  return array1;
}
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
const getDoctorCount = async (hospital_portal_id) => {
  let filter = {
    "for_portal_user.role": { $in: ["HOSPITAL_DOCTOR", "INDIVIDUAL_DOCTOR"] },
    "for_portal_user.isDeleted": false,
    "for_portal_user.isActive": true,
    "for_portal_user.lock_user": false,
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
    { $unwind: { path: "$for_portal_user", preserveNullAndEmptyArrays: true } },
    { $match: filter },
    {
      $project: {
        _id: 1,
      },
    },
  ];
  const totalData = await BasicInfo.aggregate(aggregate);
  return totalData.length;
};

export const updateSlotAvailability = async (
  hospitalId,
  notificationReceiver,
  timeStamp
) => {
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
     let timeStampString = moment(timeStamp, "DD-MM-YYYY").add(1, "days");
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

function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}
class HospitalController {
  async signup(req, res) {
    try {
      const {
        email,
        password,
        first_name,
        middle_name,
        last_name,
        hospital_name,
        mobile,
        country_code,
      } = req.body;
      const passwordHash = await hashPassword(password);
      let sequenceDocument = await Counter.findOneAndUpdate(
        { _id: "employeeid" },
        { $inc: { sequence_value: 1 } },
        { new: true }
      );
      const userExist = await PortalUser.findOne({ email, isDeleted: false });
      if (userExist) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "User already exist",
          errorCode: "USER_EXIST",
        });
      }
      const userDetails = new PortalUser({
        full_name: first_name + " " + middle_name + " " + last_name,
        email,
        country_code,
        mobile,
        user_id: sequenceDocument.sequence_value,
        password: passwordHash,
        verified: false,
        role: "HOSPITAL_ADMIN",
        isFirstTime: 0,
      });
      const userData = await userDetails.save();
      const hospitalAdmin = new HospitalAdminInfo({
        full_name: first_name + " " + middle_name + " " + last_name,
        first_name,
        middle_name,
        last_name,
        hospital_name,
        verify_status: "PENDING",
        for_portal_user: userData._id,
      });
      const adminData = await hospitalAdmin.save();

      let superadminData = await httpService.getStaging(
        "superadmin/get-super-admin-data",
        {},
        {},
        "superadminServiceUrl"
      );

      let requestData = {
        created_by_type: "hospital",
        created_by: userData?._id,
        content: `New Registration From ${userData?.full_name}`,
        url: "",
        for_portal_user: superadminData?.body?._id,
        notitype: "New Registration",
        appointmentId: adminData?._id,
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
          userData,
          adminData,
        },
        message: "successfully created hospital admin",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to create hospital admin",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const { uuid } = req.headers;
      const portalUserData = await PortalUser.findOne({
        email: email.toLowerCase(),
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

      let restrictUser = [
        "INDIVIDUAL_DOCTOR",
        "INDIVIDUAL_DOCTOR_STAFF",
        "HOSPITAL_DOCTOR",
      ];
      if (restrictUser.includes(portalUserData.role)) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "Please Login via Individual Doctor Portal",
          errorCode: "USER_NOT_FOUND",
        });
      }

      const isPasswordMatch = await checkPassword(password, portalUserData);
      portalUserData.password = undefined;
      if (!isPasswordMatch) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "Credential not matched",
          errorCode: "INCORRECT_PASSWORD",
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
      if (portalUserData.lock_user === true) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "User account temporarily locked.",
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

      let userDetails;
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
              userDetails,
            },
          },
          message: "OTP verification pending 2fa",
          errorCode: "VERIFICATION_PENDING",
        });
      }

      if (portalUserData.role == "HOSPITAL_ADMIN") {
        let adminData1 = await HospitalAdminInfo.aggregate([
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

        if (adminData1.length > 0) {
          userDetails = adminData1[0];
        }

        if (userDetails?.locationinfos.length > 0) {
          try {
            let locationids = {
              country_id: userDetails?.locationinfos[0]?.country,
              region_id: userDetails?.locationinfos[0]?.region,
              province_id: userDetails?.locationinfos[0]?.province,
              village_id: userDetails?.locationinfos[0]?.village,
              city_id: userDetails?.locationinfos[0]?.city,
              department_id: userDetails?.locationinfos[0]?.department,
            };

            const locationdata = await httpService.postStaging(
              "common-api/get-location-name",
              { locationids: locationids },
              {},
              "superadminServiceUrl"
            );

            if (locationdata.status) {
              userDetails.locationinfos[0].country = {
                countryname: locationdata.body.country_name,
                country_iso_code: locationdata.body.country_iso_code,
              };
              userDetails.locationinfos[0].region =
                locationdata.body.region_name;
              userDetails.locationinfos[0].province =
                locationdata.body.province_name;
              userDetails.locationinfos[0].village =
                locationdata.body.village_name;
              userDetails.locationinfos[0].city = locationdata.body.city_name;
              userDetails.locationinfos[0].department =
                locationdata.body.department_name;
            }
          } catch (error) {
            console.error("An error occurred:", error);
          }
        }

        userDetails.profile_picture = "";
      }

      const forUserData = await StaffInfo.find({
        for_portal_user: mongoose.Types.ObjectId(portalUserData._id),
      });
      let staffData = {};
      if (portalUserData.role == "HOSPITAL_STAFF") {
        if (
          forUserData[0].department?.length ||
          forUserData[0].unit?.length ||
          forUserData[0].service?.length
        ) {
          return sendResponse(req, res, 200, {
            status: false,
            body: null,
            message: "Please Login via Individual Doctor Portal",
            errorCode: "USER_NOT_FOUND",
          });
        } else {
          userDetails = await StaffInfo.findOne({
            for_portal_user: portalUserData._id,
          }).lean();
        }

        staffData = await ProfileInfo
          .findOne({ for_portal_user: portalUserData._id })
          .lean();
      }
      if (userDetails.verify_status !== "APPROVED") {
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString();
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
              userDetails,
              staffData,
              savedLogId,
            },
          },
          message: "Superadmin not approved yet",
          errorCode: "PROFILE_NOT_APPROVED",
        });
      }

      const tokenData = {
        portalUserId: portalUserData._id,
        uuid,
      };
      const findFirstLogin = await PortalUser.findOne({
        _id: mongoose.Types.ObjectId(portalUserData._id),
      });
      if (findFirstLogin && findFirstLogin.isFirstTime == 0) {
        findFirstLogin.isFirstTime = 1;
        await findFirstLogin.save();
      }

      // logs
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString();
      let addLogs = {};
      let saveLogs = {};
      if (portalUserData.role == "HOSPITAL_ADMIN") {
        addLogs = new Logs({
          userName: portalUserData?.full_name,
          userId: portalUserData?._id,
          loginDateTime: formattedDate,
          ipAddress:
            req?.headers["x-forwarded-for"] || req?.connection?.remoteAddress,
        });
        saveLogs = await addLogs.save();
      } else {
        let checkAdmin = await HospitalAdminInfo.findOne({
          for_portal_user: mongoose.Types.ObjectId(
            portalUserData?.created_by_user
          ),
        });
        addLogs = new Logs({
          userName: portalUserData?.full_name,
          userId: portalUserData?._id,
          adminData: {
            adminId: portalUserData?.created_by_user,
            adminName: checkAdmin?.full_name,
            hospitalName: checkAdmin?.hospital_name,
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
          otp_verified: portalUserData.verified,
          token: generateToken(tokenData),
          refreshToken: generateRefreshToken(tokenData),
          user_details: {
            portalUserData,
            userDetails,
            staffData,
          },
          savedLogId,
        },
        message: "User logged in successfully",
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
  async createHospitalProfile(req, res) {
    try {
      const {
        hospitalAdminId,
        profile_picture,
        email,
        first_name,
        middle_name,
        last_name,
        hospital_name,
        type_of_health_center,
        category_of_health_center,
        main_phone_number,
        mobile_phone_number,
        category_phone_number,
        fax_number,
        about_hospital,
        patient_portal,
        hospitalPictures,
        ifu_number,
        rccm_number,
        licence,
        addressInfo,
        pathologyInfo,
        bankInfo,
        mobilePay,
        country_code,
      } = req.body;
      const isExist = await PortalUser.findOne({
        email: email,
        _id: { $ne: hospitalAdminId },
        isDeleted: false,
      });
      if (isExist) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "Email Already Exist",
          errorCode: "INTERNAL_SERVER_ERROR",
        });
      }
      if (hospitalAdminId) {
        await PortalUser.findOneAndUpdate(
          { _id: { $eq: hospitalAdminId } },
          {
            $set: {
              email,
              country_code,
              main_phone_number,
              profile_picture,
              full_name: `${first_name} ${middle_name} ${last_name}`,
            },
          }
        ).exec();
      }

      let locationData;
      const findLocation = await LocationInfo.findOne({
        for_portal_user: mongoose.Types.ObjectId(hospitalAdminId),
      });

      if (findLocation) {
        locationData = await LocationInfo.findOneAndUpdate(
          { for_portal_user: mongoose.Types.ObjectId(hospitalAdminId) },
          {
            $set: {
              loc: addressInfo.loc == "" ? null : addressInfo.loc,
              address: addressInfo.address == "" ? null : addressInfo.address,
              neighborhood:
                addressInfo.neighborhood == ""
                  ? null
                  : addressInfo.neighborhood,
              country: addressInfo.country == "" ? null : addressInfo.country,
              region: addressInfo.region == "" ? null : addressInfo.region,
              province:
                addressInfo.province == "" ? null : addressInfo.province,
              department:
                addressInfo.department == "" ? null : addressInfo.department,
              city: addressInfo.city == "" ? null : addressInfo.city,
              village: addressInfo.village == "" ? null : addressInfo.village,
              pincode: addressInfo.pincode == "" ? null : addressInfo.pincode,
            },
          },
          { new: true }
        );
      } else {
        const locationInfo = new LocationInfo({
          loc: addressInfo.loc == "" ? null : addressInfo.loc,
          address: addressInfo.address == "" ? null : addressInfo.address,
          neighborhood:
            addressInfo.neighborhood == "" ? null : addressInfo.neighborhood,
          country: addressInfo.country == "" ? null : addressInfo.country,
          region: addressInfo.region == "" ? null : addressInfo.region,
          province: addressInfo.province == "" ? null : addressInfo.province,
          department:
            addressInfo.department == "" ? null : addressInfo.department,
          city: addressInfo.city == "" ? null : addressInfo.city,
          village: addressInfo.village == "" ? null : addressInfo.village,
          pincode: addressInfo.pincode == "" ? null : addressInfo.pincode,

          for_portal_user: hospitalAdminId,
        });
        locationData = await locationInfo.save();
      }

      if (pathologyInfo) {
        for (const test of pathologyInfo) {
          try {
            const existingTest = await PathologyTestInfoNew.findOne({
              for_portal_user: hospitalAdminId,
              typeOfTest: test.typeOfTest,
              nameOfTest: test.nameOfTest,
            });

            if (existingTest) {
              if (test.isExist === false) {
                await PathologyTestInfoNew.create({
                  for_portal_user: hospitalAdminId,
                  typeOfTest: test.typeOfTest,
                  nameOfTest: test.nameOfTest,
                  isExist: true,
                });
              }
            }
          } catch (error) {
            console.error("Erroroccurreddddd:", error);
            // Handle the error as needed
          }
        }
      }

      const findBankInfo = await BankDetailInfo.findOne({
        for_portal_user: hospitalAdminId,
      });
      let bankData;
      if (findBankInfo) {
        bankData = await BankDetailInfo.findOneAndUpdate(
          { for_portal_user: hospitalAdminId },
          {
            $set: {
              ...bankInfo,
            },
          },
          { new: true }
        );
      } else {
        const bankDetailInfo = new BankDetailInfo({
          ...bankInfo,
          for_portal_user: hospitalAdminId,
        });
        bankData = await bankDetailInfo.save();
      }

      const findMobilePay = await MobilePayInfo.findOne({
        for_portal_user: hospitalAdminId,
      });
      let mobilePayData = {
        _id: null,
      };
      if (req.body.mobilePay) {
        if (req.body.mobilePay.length > 0) {
          if (findMobilePay) {
            mobilePayData = await MobilePayInfo.findOneAndUpdate(
              { for_portal_user: hospitalAdminId },
              {
                $set: {
                  mobilePay,
                },
              },
              { new: true }
            );
          } else {
            const mobilePayInfoInfo = new MobilePayInfo({
              mobilePay,
              for_portal_user: hospitalAdminId,
            });
            mobilePayData = await mobilePayInfoInfo.save();
          }
        }
      }

      const hospitalAdminData = await HospitalAdminInfo.findOneAndUpdate(
        { for_portal_user: hospitalAdminId },
        {
          $set: {
            profile_picture,
            full_name: first_name + " " + middle_name + " " + last_name,
            first_name,
            middle_name,
            last_name,
            hospital_name,
            type_of_health_center,
            category_of_health_center,
            main_phone_number,
            mobile_phone_number,
            category_phone_number,
            fax_number,
            about_hospital,
            patient_portal,
            hospitalPictures,
            ifu_number,
            rccm_number,
            license: licence,
            in_location: locationData._id,
            //in_pathology_test: pathologyTestData._id,
            in_bank: bankData._id,
            in_mobile_pay: mobilePayData._id,
            for_portal_user: hospitalAdminId,
          },
        },
        { new: true }
      );

      const locationinfos = await LocationInfo.find({
        for_portal_user: mongoose.Types.ObjectId(hospitalAdminId),
      });

      const hospitalAdminInfo = {
        ...hospitalAdminData.toObject(), // Convert to plain JavaScript object
        locationinfos: locationinfos.map((location) => location.toObject()),
      };

      if (hospitalAdminInfo?.locationinfos.length > 0) {
        try {
          let locationids = {
            country_id: locationinfos[0]?.country,
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
            hospitalAdminInfo.locationinfos[0].country = {
              countryname: locationdata?.body?.country_name,
              country_iso_code: locationdata?.body?.country_iso_code,
            };
            hospitalAdminInfo.locationinfos[0].region =
              locationdata?.body?.region_name;
            hospitalAdminInfo.locationinfos[0].province =
              locationdata?.body?.province_name;
            hospitalAdminInfo.locationinfos[0].village =
              locationdata?.body?.village_name;
            hospitalAdminInfo.locationinfos[0].city =
              locationdata?.body?.city_name;
            hospitalAdminInfo.locationinfos[0].department =
              locationdata?.body?.department_name;
          }
        } catch (error) {
          console.error("An error occurred:", error);
        }
      }

      hospitalAdminInfo.profile_picture = "";

      sendResponse(req, res, 200, {
        status: true,
        body: { hospitalAdminInfo, PortalUserDetails },
        message: "successfully created hospital profile",
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "failed to create hospital admin",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getHospitalDetails(req, res) {
    try {
      const { hospital_portal_id } = req.query;
      const headers = {
        Authorization: req.headers["authorization"],
      };
      const portalDetails = await PortalUser.findOne({
        _id: hospital_portal_id,
      });
      const pathology_tests = await PathologyTestInfoNew.find({
        for_portal_user: hospital_portal_id,
      });
      const lab_tests = await PathologyTestInfo.find({
        for_portal_user: hospital_portal_id,
      });
      const userDetails = await HospitalAdminInfo.findOne({
        for_portal_user: portalDetails._id,
      })
        .populate({
          path: "in_bank",
        })
        .populate({
          path: "in_mobile_pay",
        })
        .populate({
          path: "in_pathology_test",
        })
        .populate({
          path: "in_location",
        })
        .populate({
          path: "type_of_health_center",
        });

      const licensePicKey = userDetails.license.image;
      const licensePictureArray = [licensePicKey];
      if (licensePicKey != null) {
        const resData = await httpService.postStaging(
          "hospital/get-signed-url",
          { url: licensePictureArray },
          headers,
          "hospitalServiceUrl"
        );
        userDetails.license.image = resData.data[0];
      } else {
        userDetails.license.image = "";
      }

      const profilePicKey = userDetails.profile_picture;
      const profilePictureArray = [profilePicKey];
      if (profilePicKey != null) {
        const resData = await httpService.postStaging(
          "hospital/get-signed-url",
          { url: profilePictureArray },
          headers,
          "hospitalServiceUrl"
        );
        userDetails.profile_picture = resData.data[0];
      } else {
        userDetails.profile_picture = "";
      }

      const hospitalPictures = userDetails.hospitalPictures;
      if (hospitalPictures.length > 0) {
        const resData = await httpService.postStaging(
          "hospital/get-signed-url",
          { url: hospitalPictures },
          headers,
          "hospitalServiceUrl"
        );

        userDetails.hospitalPictures = resData.data;
      } else {
        userDetails.hospitalPictures = [];
      }

      sendResponse(req, res, 200, {
        status: true,
        body: {
          portalDetails,
          userDetails,
          pathology_tests,
          lab_tests,
        },
        message: "successfully fetched hospital details",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get hospital details",
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

  async listHospitalAdminUser(req, res) {
    try {
      const { page, limit, name } = req.query;
      const result = await HospitalAdminInfo.find({
        $or: [
          {
            name: { $regex: name || "", $options: "i" },
          },
        ],
      })
        .populate({
          path: "for_portal_user",
          // match: { email: { $regex: email || '', $options: "i" } },
          select: { email: 1 },
        })
        .sort([["createdAt", -1]])
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();
      await HospitalAdminInfo.countDocuments({
        $or: [
          {
            name: { $regex: name || "", $options: "i" },
          },
        ],
      });
      sendResponse(req, res, 200, {
        status: true,
        body: {
          data: result,
          totalCount: result.length,
        },
        message: "successfully fetched hospital admin user",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to list hospital admin user",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async approveOrRejectHospital(req, res) {
    const { action, id, approved_or_rejected_by } = req.body;
    let status;
    let statusAction;
    let date = null;
    if (action === "APPROVED") {
      status = "Approved";
      statusAction = "APPROVED";
      const cdate = new Date();
      date = `${cdate.getFullYear()}-${
        cdate.getMonth() + 1
      }-${cdate.getDate()}`;
    } else {
      status = "Rejected";
      statusAction = "DECLINED";
      const cdate = new Date();
      date = `${cdate.getFullYear()}-${
        cdate.getMonth() + 1
      }-${cdate.getDate()}`;
    }

    try {
      const updatedAdminData = await HospitalAdminInfo.findOneAndUpdate(
        { for_portal_user: id },
        {
          $set: {
            verify_status: statusAction,
            approved_at: date,
            approved_or_rejected_by,
          },
        },
        { upsert: false, new: true }
      ).exec();

      sendResponse(req, res, 200, {
        status: true,
        body: updatedAdminData,
        message: `${status} hospital`,
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: `failed to ${status} hospital request`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async viewHospitalAdminDetails(req, res) {
    try {
      const { hospital_admin_id } = req.query;

      const result = await HospitalAdminInfo.find({ _id: hospital_admin_id })
        .populate({
          path: "for_portal_user",
          select: { email: 1, country_code: 1, mobile: 1 },
        })
        .populate({
          path: "in_bank",
        })
        .populate({
          path: "in_mobile_pay",
        })
        .populate({
          path: "in_location",
        })
        .populate({
          path: "type_of_health_center",
        });

      let data = { ...result[0]?._doc, subscriptionPlans: [] };

      let hospitalPicture = [];

      data.profile_picture = "";

      delete data.hospitalPictures;
      data.hospitalPictures = hospitalPicture;
      data.subscriptionPlans = [];

      sendResponse(req, res, 200, {
        status: true,
        body: data,
        message: `Hospital admin details`,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `Failed to fetch hospital admin details`,
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
  async getAllHospitalListForSuperAdmin(req, res) {
    try {
      const { page, limit, status, searchKey } = req.query;
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
        "for_portal_user.role": "HOSPITAL_ADMIN",
        verify_status: status,
        // 'for_portal_user.createdBy': 'self',
        "for_portal_user.isDeleted": false,
      };

      if (searchKey != "") {
        filter.hospital_name = { $regex: searchKey || "", $options: "i" };
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
        { $unwind: "$for_portal_user" },
        {
          $lookup: {
            from: "locationinfos",
            localField: "in_location",
            foreignField: "_id",
            as: "in_location",
          },
        },
        { $unwind: { path: "$in_location", preserveNullAndEmptyArrays: true } },
        { $match: filter },
        {
          $project: {
            hospital_name: 1,
            ifu_number: 1,
            license: 1,
            rccm_number: 1,
            fax_number: 1,
            main_phone_number: 1,
            location: "$in_location.address",
            for_portal_user: {
              _id: "$for_portal_user._id",
              email: "$for_portal_user.email",
              country_code: "$for_portal_user.country_code",
              phone_number: "$for_portal_user.mobile",
              lock_user: "$for_portal_user.lock_user",
              createdAt: "$for_portal_user.createdAt",
              isActive: "$for_portal_user.isActive",
              fcmToken: "$for_portal_user.fcmToken",
              notification: "$for_portal_user.notification",
            },
            updatedAt: 1,
          },
        },
      ];
      const totalCount = await HospitalAdminInfo.aggregate(aggregate);
      aggregate.push({
        $sort: sortingarray,
      });

      if (limit != 0) {
        aggregate.push({ $skip: (page - 1) * limit }, { $limit: limit * 1 });
      }

      const result = await HospitalAdminInfo.aggregate(aggregate);

      sendResponse(req, res, 200, {
        status: true,
        data: {
          data: result,
          totalCount: totalCount.length,
        },
        message: `hospital fetched successfully`,
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

  async getAllHospitalListUnderDoctor(req, res) {
    try {
      const { for_hospitalIds } = req.query;
      const result = await HospitalAdminInfo.find(
        { for_portal_user: { $in: for_hospitalIds } },
        { for_portal_user: 1, hospital_name: 1 }
      );

      sendResponse(req, res, 200, {
        status: true,
        data: result,
        message: `hospital list fetched successfully`,
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

  // async specialtyDetails(req, res) {
  //     try {
  //         const { specialtyId } = req.query
  //         const specialtyDetails = await Specialty.findOne({ _id: specialtyId })
  //         sendResponse(req, res, 200, {
  //             status: true,
  //             body: specialtyDetails,
  //             message: "Successfully get specialty details",
  //             errorCode: null,
  //         });
  //     } catch (error) {
  //
  //         sendResponse(req, res, 500, {
  //             status: false,
  //             body: null,
  //             message: "failed to get specialty details",
  //             errorCode: "INTERNAL_SERVER_ERROR",
  //         });
  //     }
  // }

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

  //Hospital Department
  async addDepartment(req, res) {
    try {
      let { departmentArray, added_by } = req.body;

      const duplicateDepartments = await Department.find({
        $and: [
          { added_by: added_by },
          { delete_status: false },
          {
            department: { $in: departmentArray.map((data) => data.department) },
          },
        ],
      });
      if (duplicateDepartments.length > 0) {
        departmentArray = departmentArray.filter((department) => {
          return !duplicateDepartments.some(
            (d) =>
              d.department === department.department &&
              d.added_by.toString() === added_by &&
              d.delete_status === false
          );
        });
      }
      const list = departmentArray.map((singleData) => ({
        ...singleData,
        added_by,
      }));
      const savedDepartment = await Department.insertMany(list);
      sendResponse(req, res, 200, {
        status: true,
        body: savedDepartment,
        message: "Successfully add department",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to add department",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async allDepartment(req, res) {
    try {
      const { limit, page, added_by, searchText } = req.query;
      let sort = req.query.sort;
      let sortingarray = {};
      if (sort != "undefined" && sort != "" && sort != undefined) {
        let keynew = sort.split(":")[0];
        let value = sort.split(":")[1];
        sortingarray[keynew] = value;
      } else {
        sortingarray["createdAt"] = -1;
      }
      let filter = { delete_status: false, added_by };
      if (searchText != "") {
        filter = {
          delete_status: false,
          added_by,
          department: { $regex: searchText || "", $options: "i" },
        };
      }
      const departmentList = await Department.find(filter)
        .populate({
          path: "added_by",
          select: {
            role: 1,
          },
        })
        .sort(sortingarray)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();
      const count = await Department.countDocuments(filter);
      sendResponse(req, res, 200, {
        status: true,
        body: {
          totalCount: count,
          data: departmentList,
        },
        message: "Successfully get department list",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get department list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async departmentDetails(req, res) {
    try {
      const { departmentId } = req.query;
      const departmentDetails = await Department.findOne({
        _id: departmentId,
      }).populate({
        path: "added_by",
        select: {
          role: 1,
        },
      });
      sendResponse(req, res, 200, {
        status: true,
        body: departmentDetails,
        message: "Successfully get department details",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get department details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async updateDepartment(req, res) {
    try {
      const {
        departmentId,
        department,
        active_status,
        delete_status,
        addedBy,
      } = req.body;

      const checkData = await Department.find({
        $and: [
          { delete_status: false },
          { department: department },
          { _id: { $ne: departmentId } },
          { added_by: mongoose.Types.ObjectId(addedBy) },
        ],
      });

      if (checkData.length > 0) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "Department already exits.",
          errorCode: null,
        });
      }

      const updateDepartment = await Department.updateOne(
        { _id: departmentId },
        {
          $set: {
            department,
            active_status,
            delete_status,
          },
        },
        { new: true }
      ).exec();
      sendResponse(req, res, 200, {
        status: true,
        body: updateDepartment,
        message: "Successfully updated department",
        errorCode: null,
      });
    } catch (err) {
      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to update department`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async actionOnDepartment(req, res) {
    try {
      const { departmentId, action_name, action_value } = req.body;

      const filter = {};
      if (action_name == "active") filter["active_status"] = action_value;
      if (action_name == "delete") filter["delete_status"] = action_value;

      const updatedDepartment = await Department.updateOne(
        { _id: departmentId },
        filter,
        { new: true }
      ).exec();
      sendResponse(req, res, 200, {
        status: true,
        body: updatedDepartment,
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

  //Hospital Service
  async addService(req, res) {
    try {
      let { serviceArray, added_by } = req.body;

      const duplicateService = await Service.find({
        $and: [
          { added_by: added_by },
          { delete_status: false },
          { service: { $in: serviceArray.map((data) => data.service) } },
        ],
      });

      if (duplicateService.length > 0) {
        serviceArray = serviceArray.filter((service) => {
          return !duplicateService.some(
            (d) =>
              d.for_department.toString() === service.for_department &&
              d.service === service.service &&
              d.added_by.toString() === added_by &&
              d.delete_status === false
          );
        });
      }

      const list = serviceArray.map((singleData) => ({
        ...singleData,
        added_by,
      }));
      const savedService = await Service.insertMany(list);
      sendResponse(req, res, 200, {
        status: true,
        body: savedService,
        message: "Successfully add service",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to add service",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async allService(req, res) {
    try {
      const { limit, page, searchText, added_by, for_department } = req.query;
      let sort = req.query.sort;
      let sortingarray = {};
      if (sort != "undefined" && sort != "" && sort != undefined) {
        let keynew = sort.split(":")[0];
        let value = sort.split(":")[1];
        sortingarray[keynew] = value;
      } else {
        sortingarray["createdAt"] = -1;
      }
      let filter = { delete_status: false, added_by, for_department };
      if (searchText != "") {
        filter = {
          delete_status: false,
          added_by,
          for_department,
          service: { $regex: searchText || "", $options: "i" },
        };
      }
      if (for_department == "") {
        filter = {
          delete_status: false,
          added_by,
          service: { $regex: searchText || "", $options: "i" },
        };
      }
      const serviceList = await Service.find(filter)
        .populate({
          path: "added_by",
          select: {
            role: 1,
          },
        })
        .populate({
          path: "for_department",
          select: {
            department: 1,
          },
        })
        .sort(sortingarray)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();
      const count = await Service.countDocuments(filter);
      sendResponse(req, res, 200, {
        status: true,
        body: {
          totalCount: count,
          data: serviceList,
        },
        message: "Successfully get service list",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get service list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async serviceDetails(req, res) {
    try {
      const { serviceId } = req.query;
      const serviceDetails = await Service.findOne({ _id: serviceId })
        .populate({
          path: "added_by",
          select: {
            role: 1,
          },
        })
        .populate({
          path: "for_department",
          select: {
            department: 1,
          },
        });
      sendResponse(req, res, 200, {
        status: true,
        body: serviceDetails,
        message: "Successfully get service details",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get service details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async updateService(req, res) {
    try {
      const {
        serviceId,
        service,
        for_department,
        active_status,
        delete_status,
        added_by,
      } = req.body;
      const checkData = await Service.find({
        $and: [
          { delete_status: false },
          { service: service },
          { _id: { $ne: serviceId } },
          { added_by: mongoose.Types.ObjectId(added_by) },
          { for_department: mongoose.Types.ObjectId(for_department) },
        ],
      });
      if (checkData.length > 0) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "Service already exits.",
          errorCode: null,
        });
      }

      const updateService = await Service.updateOne(
        { _id: serviceId },
        {
          $set: {
            service,
            for_department,
            active_status,
            delete_status,
          },
        },
        { new: true }
      ).exec();
      sendResponse(req, res, 200, {
        status: true,
        body: updateService,
        message: "Successfully updated service",
        errorCode: null,
      });
    } catch (err) {
      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to update service`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async actionOnService(req, res) {
    try {
      const { serviceId, action_name, action_value } = req.body;

      const filter = {};
      if (action_name == "active") filter["active_status"] = action_value;
      if (action_name == "delete") filter["delete_status"] = action_value;

      const updatedService = await Service.updateOne(
        { _id: serviceId },
        filter,
        { new: true }
      ).exec();
      sendResponse(req, res, 200, {
        status: true,
        body: updatedService,
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

  //Hospital Unit
  async addUnit(req, res) {
    try {
      let { unitArray, added_by } = req.body;

      const duplicateUnits = await Unit.find({
        $and: [
          { added_by: added_by },
          { delete_status: false },
          { unit: { $in: unitArray.map((data) => data.unit) } },
        ],
      });
      if (duplicateUnits.length > 0) {
        unitArray = unitArray.filter((unit) => {
          return !duplicateUnits.some(
            (d) =>
              d.for_department.toString() === unit.for_department &&
              d.for_service.toString() === unit.for_service &&
              d.unit === unit.unit &&
              d.added_by.toString() === added_by &&
              d.delete_status === false
          );
        });
      }
      const list = unitArray.map((singleData) => ({
        ...singleData,
        added_by,
      }));
      const savedUnit = await Unit.insertMany(list);
      sendResponse(req, res, 200, {
        status: true,
        body: savedUnit,
        message: "Successfully add unit",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to add unit",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async allUnit(req, res) {
    try {
      const { limit, page, searchText, added_by, for_service } = req.query;
      let sort = req.query.sort;
      let sortingarray = {};
      if (sort != "undefined" && sort != "" && sort != undefined) {
        let keynew = sort.split(":")[0];
        let value = sort.split(":")[1];
        sortingarray[keynew] = value;
      } else {
        sortingarray["createdAt"] = -1;
      }
      let filter = { delete_status: false, added_by, for_service };
      if (searchText != "") {
        filter = {
          delete_status: false,
          added_by,
          for_service,
          unit: { $regex: searchText || "", $options: "i" },
        };
      }
      if (for_service == "") {
        filter = {
          delete_status: false,
          added_by,
          unit: { $regex: searchText || "", $options: "i" },
        };
      }
      const unitList = await Unit.find(filter)
        .populate({
          path: "added_by",
          select: {
            role: 1,
          },
        })
        .populate({
          path: "for_service",
          select: {
            service: 1,
            for_department: 1,
          },
          populate: {
            path: "for_department",
            select: {
              department: 1,
            },
          },
        })
        .sort(sortingarray)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();
      const count = await Unit.countDocuments(filter);
      sendResponse(req, res, 200, {
        status: true,
        body: {
          totalCount: count,
          data: unitList,
        },
        message: "Successfully get unit list",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get unit list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async unitDetails(req, res) {
    try {
      const { unitId } = req.query;
      const unitDetails = await Unit.findOne({ _id: unitId })
        .populate({
          path: "added_by",
          select: {
            role: 1,
          },
        })
        .populate({
          path: "for_service",
          select: {
            service: 1,
            for_department: 1,
          },
          populate: {
            path: "for_department",
            select: {
              department: 1,
            },
          },
        })
        .populate({
          path: "for_department",
        });
      sendResponse(req, res, 200, {
        status: true,
        body: unitDetails,
        message: "Successfully get unit details",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get unit details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async updateUnit(req, res) {
    try {
      const {
        unitId,
        unit,
        for_service,
        for_department,
        active_status,
        delete_status,
        added_by,
      } = req.body;

      const checkData = await Service.find({
        $and: [
          { delete_status: false },
          { unit: unit },
          { _id: { $ne: unitId } },
          { added_by: mongoose.Types.ObjectId(added_by) },
          { for_department: mongoose.Types.ObjectId(for_department) },
          { for_service: mongoose.Types.ObjectId(for_service) },
        ],
      });
      if (checkData.length > 0) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "Unit already exits.",
          errorCode: null,
        });
      }

      const updateUnit = await Unit.updateOne(
        { _id: unitId },
        {
          $set: {
            unit,
            for_service,
            for_department,
            active_status,
            delete_status,
          },
        },
        { new: true }
      ).exec();
      sendResponse(req, res, 200, {
        status: true,
        body: updateUnit,
        message: "Successfully updated unit",
        errorCode: null,
      });
    } catch (err) {
      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to update unit`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async actionOnUnit(req, res) {
    try {
      const { unitId, action_name, action_value } = req.body;

      const filter = {};
      if (action_name == "active") filter["active_status"] = action_value;
      if (action_name == "delete") filter["delete_status"] = action_value;

      const updatedUnit = await Unit.updateOne({ _id: unitId }, filter, {
        new: true,
      }).exec();
      sendResponse(req, res, 200, {
        status: true,
        body: updatedUnit,
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

  //Get Department, Service, Unit
  async listOfDepartmentServiceUnit(req, res) {
    try {
      const { inputType, inputValue, added_by } = req.body;

      let departmentDetails;
      let serviceDetails;
      let unitDetails;
      let serviceIdArray = [];
      let departmentIdArray = [];

      if (inputType == "department") {
        departmentDetails = await Department.find(
          { _id: { $in: inputValue }, added_by },
          { _id: 1, department: 1 }
        );
        serviceDetails = await Service.find(
          { for_department: { $in: inputValue }, added_by },
          { _id: 1, service: 1, for_department: 1 }
        );
        for (let index = 0; index < serviceDetails.length; index++) {
          serviceIdArray.push(serviceDetails[index]._id);
        }
        unitDetails = await Unit.find(
          { for_service: { $in: serviceIdArray }, added_by },
          { _id: 1, unit: 1, for_service: 1 }
        );
      }

      if (inputType == "service") {
        serviceDetails = await Service.find(
          { _id: { $in: inputValue }, added_by },
          { _id: 1, service: 1, for_department: 1 }
        );
        for (let index = 0; index < serviceDetails.length; index++) {
          serviceIdArray.push(serviceDetails[index]._id);
          departmentIdArray.push(serviceDetails[index].for_department);
        }
        departmentDetails = await Department.find(
          { _id: { $in: departmentIdArray }, added_by },
          { _id: 1, department: 1 }
        );
        unitDetails = await Unit.find(
          { for_service: { $in: serviceIdArray }, added_by },
          { _id: 1, unit: 1, for_service: 1 }
        );
      }

      if (inputType == "unit") {
        unitDetails = await Unit.find(
          { _id: { $in: inputValue }, added_by },
          { _id: 1, unit: 1, for_service: 1 }
        );
        for (let index = 0; index < unitDetails.length; index++) {
          serviceIdArray.push(unitDetails[index].for_service);
        }
        serviceDetails = await Service.find(
          { _id: { $in: serviceIdArray }, added_by },
          { _id: 1, service: 1, for_department: 1 }
        );
        for (let index = 0; index < serviceDetails.length; index++) {
          departmentIdArray.push(serviceDetails[index].for_department);
        }
        departmentDetails = await Department.find(
          { _id: { $in: departmentIdArray }, added_by },
          { _id: 1, department: 1 }
        );
      }

      sendResponse(req, res, 200, {
        status: true,
        body: {
          departmentDetails,
          serviceDetails,
          unitDetails,
        },
        message: "Successfully get list",
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

  //Hospital Expertise
  async addExpertise(req, res) {
    try {
      let { expertiseArray, added_by } = req.body;

      const duplicateExpertise = await Expertise.find({
        $and: [
          { added_by: added_by },
          { delete_status: false },
          { expertise: { $in: expertiseArray.map((data) => data.expertise) } },
        ],
      });
      if (duplicateExpertise.length > 0) {
        expertiseArray = expertiseArray.filter((expertise) => {
          return !duplicateExpertise.some(
            (d) =>
              d.expertise === expertise.expertise &&
              d.added_by.toString() === added_by &&
              d.delete_status === false
          );
        });
      }

      const list = expertiseArray.map((singleData) => ({
        ...singleData,
        added_by,
      }));
      const savedExpertise = await Expertise.insertMany(list);
      sendResponse(req, res, 200, {
        status: true,
        body: savedExpertise,
        message: "Successfully add expertise",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to add expertise",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async allExpertise(req, res) {
    try {
      const { limit, page, added_by, searchText } = req.query;
      let sort = req.query.sort;
      let sortingarray = {};
      if (sort != "undefined" && sort != "" && sort != undefined) {
        let keynew = sort.split(":")[0];
        let value = sort.split(":")[1];
        sortingarray[keynew] = value;
      } else {
        sortingarray["createdAt"] = -1;
      }
      let filter = { delete_status: false, added_by };
      if (searchText != "") {
        filter = {
          delete_status: false,
          added_by,
          expertise: { $regex: searchText || "", $options: "i" },
        };
      }
      const expertiseList = await Expertise.find(filter)
        .populate({
          path: "added_by",
          select: {
            role: 1,
          },
        })
        .sort(sortingarray)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();
      const count = await Expertise.countDocuments(filter);
      sendResponse(req, res, 200, {
        status: true,
        body: {
          totalCount: count,
          data: expertiseList,
        },
        message: "Successfully get expertise list",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get expertise list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async expertiseDetails(req, res) {
    try {
      const { expertiseId } = req.query;
      const expertiseDetails = await Expertise.findOne({
        _id: expertiseId,
      }).populate({
        path: "added_by",
        select: {
          role: 1,
        },
      });
      sendResponse(req, res, 200, {
        status: true,
        body: expertiseDetails,
        message: "Successfully get expertise details",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get expertise details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async updateExpertise(req, res) {
    try {
      const { expertiseId, expertise, active_status, delete_status, added_by } =
        req.body;

      const checkData = await Expertise.find({
        $and: [
          { delete_status: false },
          { expertise: expertise },
          { _id: { $ne: expertiseId } },
          { added_by: mongoose.Types.ObjectId(added_by) },
        ],
      });

      if (checkData.length > 0) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "Expertise already exits.",
          errorCode: null,
        });
      }

      const updateExpertise = await Expertise.updateOne(
        { _id: expertiseId },
        {
          $set: {
            expertise,
            active_status,
            delete_status,
          },
        },
        { new: true }
      ).exec();
      sendResponse(req, res, 200, {
        status: true,
        body: updateExpertise,
        message: "Successfully updated expertise",
        errorCode: null,
      });
    } catch (err) {
      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to update expertise`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async actionOnExpertise(req, res) {
    try {
      const { expertiseId, action_name, action_value } = req.body;

      const filter = {};
      if (action_name == "active") filter["active_status"] = action_value;
      if (action_name == "delete") filter["delete_status"] = action_value;

      const updatedExpertise = await Expertise.updateOne(
        { _id: expertiseId },
        filter,
        { new: true }
      ).exec();
      sendResponse(req, res, 200, {
        status: true,
        body: updatedExpertise,
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

  //Reason For Appointment
  // async addAppointmentReason(req, res) {
  //     try {
  //         const { appointmentReasonArray, doctorId } = req.body
  //         const list = appointmentReasonArray.map((singleData) => ({
  //             ...singleData,
  //             added_by: doctorId
  //         }));
  //         const result = await ReasonForAppointment.insertMany(list)
  //         sendResponse(req, res, 200, {
  //             status: true,
  //             body: result,
  //             message: "Successfully add appointment reason",
  //             errorCode: null,
  //         });
  //     } catch (error) {
  //
  //         sendResponse(req, res, 500, {
  //             status: false,
  //             body: null,
  //             message: "failed to add appointment reason",
  //             errorCode: "INTERNAL_SERVER_ERROR",
  //         });
  //     }
  // }

  async addAppointmentReason(req, res) {
    try {
      const { appointmentReasonArray, doctorId, selectedlocation } = req.body;

      const list = appointmentReasonArray.map((singleData) => ({
        ...singleData,
        added_by: doctorId,
        selectedlocation: selectedlocation,
      }));

      for (let data of list) {
        const checkname = data.name;

        let CheckData = await ReasonForAppointment.find({
          selectedlocation: mongoose.Types.ObjectId(selectedlocation),
          is_deleted: false,
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
          added_by: req.body.user_id,
          selectedlocation: req.body.selectedlocation,
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
      // const result = await ReasonForAppointment.insertMany(list)
      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: "Successfully add appointment reasons",
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

  async reasonForAppointmentList(req, res) {
    try {
      const { limit, page, searchText, doctorId, listFor, selectedlocation } =
        req.query;
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
        added_by: mongoose.Types.ObjectId(doctorId),
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
            name: { $first: "$name" },
            active: { $first: "$active" },
            added_by: { $first: "$added_by" },
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

  async reasonForAppointmentDetails(req, res) {
    try {
      const { appointmentReasonId } = req.query;
      const result = await ReasonForAppointment.findOne({
        _id: mongoose.Types.ObjectId(appointmentReasonId),
      });
      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: "Successfully get reason for appointment details",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get reason for appointment details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async updateReasonForAppointment(req, res) {
    try {
      const { appointmentReasonId, name, active, doctorId, selectedlocation } =
        req.body;
      const result = await ReasonForAppointment.findOneAndUpdate(
        { _id: appointmentReasonId },
        {
          $set: {
            name,
            active,
            added_by: doctorId,
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

  //Questionnairee
  async addQuestionnaire(req, res) {
    try {
      const {
        controller,
        question,
        type,
        options,
        active,
        required,
        doctorId,
      } = req.body;
      const questionnaire = new Questionnaire({
        controller,
        question,
        type,
        options,
        active,
        required,
        added_by: doctorId,
      });
      const result = await questionnaire.save();
      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: "Successfully add questionnaire",
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
      const { limit, page, doctorId } = req.query;
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
        added_by: { $eq: doctorId },
      };

      const result = await Questionnaire.find(filter)
        .sort(sortingarray)
        .skip((page - 1) * limit)
        .limit(limit * 1)
        .exec();
      const count = await Questionnaire.countDocuments(filter);
      sendResponse(req, res, 200, {
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

  //Assessment
  async addAssessment(req, res) {
    try {
      const { assessments, appointmentId } = req.body;
      let result;
      const assessmentDetails = await Assessment.findOne({ appointmentId });
      if (assessmentDetails) {
        result = await Assessment.findOneAndUpdate(
          { _id: assessmentDetails._id },
          {
            $set: {
              assessments,
            },
          },
          { new: true }
        );
      } else {
        const assessment = new Assessment({
          assessments,
          appointmentId,
        });
        result = await assessment.save();
      }
      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: "Successfully add assessment",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to add assessment",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async assessmentList(req, res) {
    try {
      const { appointmentId } = req.query;
      const result = await Assessment.findOne({ appointmentId });
      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: "Successfully get assessment",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get assessment",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getAllHospital(req, res) {
    try {
      const { searchKey } = req.query;
      const filter = {
        "for_portal_user.isDeleted": false,
        "for_portal_user.lock_user": false,
        "for_portal_user.isActive": true,
      };
      if (searchKey) {
        filter["hospital_name"] = { $regex: searchKey || "", $options: "i" };
      }
      const hospitalData = await HospitalAdminInfo.aggregate([
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
            _id: 0,
            portal_user_id: "$for_portal_user._id",
            hospital_name: 1,
          },
        },
      ]);
      sendResponse(req, res, 200, {
        status: true,
        body: hospitalData,
        message: "Successfully fetched all hospital",
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
  async getAllHospitalDetailsByID(req, res) {
    try {
      const allIds = req.query.hospitalIDs;
      let ObjectIdArray = [];
      for (const id of allIds.split(",")) {
        ObjectIdArray.push(mongoose.Types.ObjectId(id));
      }
      const filter = {
        verify_status: "APPROVED",
        "for_portal_user_d.isDeleted": false,
        "for_portal_user_d.isActive": true,
        "for_portal_user_d.lock_user": false,
        for_portal_user: { $in: ObjectIdArray },
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
          $project: {
            hospital_name: 1,
            profile_picture: 1,
          },
        },
      ];
      const result = await HospitalAdminInfo.aggregate(aggregate);
      const dataArray = [];
      for (let data of result) {
        data["name"] = data.hospital_name;
        dataArray.push(data);
      }
      sendResponse(req, res, 200, {
        status: true,
        body: dataArray,
        message: "Successfully fetched all hospital",
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        data: error,
        message: `Failed to fetch all hospital`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async activeLockDeleteHospital(req, res) {
    try {
      const { action_name, action_value } = req.body;
      let key;
      key =
        action_name === "delete"
          ? "isDeleted"
          : action_name === "lock"
          ? "lock_user"
          : action_name === "active"
          ? "isActive"
          : "";
      if (key) {
        const portalData = await PortalUser.findOneAndUpdate(
          { _id: { $eq: hosaction_valuepital_portal_id } },
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

        sendResponse(req, res, 200, {
          status: true,
          data: portalData,
          message: `Hospital ${actionMessage} Successfully.`,
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 500, {
          status: false,
          data: null,
          message: `Something went wrong`,
          errorCode: "INTERNAL_SERVER_ERROR",
        });
      }
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        data: error,
        message: `Something went wrong`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async readHospitalLocations(req, res) {
    try {
      const { hospital_id } = req.query;
      const headers = {
        Authorization: req.headers["authorization"],
      };

      const location = await LocationInfo.findOne({
        for_portal_user: { $eq: hospital_id },
      }).exec();
      const hospitalData = await HospitalAdminInfo.findOne({
        for_portal_user: hospital_id,
      });
      let resData = {};
      let resLocationData = "";
      if (location !== null) {
        resData = await httpService.postStaging(
          "superadmin/get-locations-name",
          { location },
          headers,
          "superadminServiceUrl"
        );
        resLocationData = { ...resData, loc: location?.loc };
      }

      sendResponse(req, res, 200, {
        status: true,
        data: { resLocationData, hospitalData },
        message: `hospital location fetched successfully`,
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

  async openingHours(req, res) {
    try {
      const {
        hospital_id,
        week_days,
        open_date_and_time,
        close_date_and_time,
        getDetails,
      } = req.body;
      const openingHoursDetails = await HospitalOpeningHours.findOne({
        for_portal_user: hospital_id,
      });
      if (getDetails != "") {
        return sendResponse(req, res, 200, {
          status: true,
          data: { openingHoursDetails },
          message: "successfully get details hospital opening hours",
          errorCode: null,
        });
      }

      let newObject;
      let newArray = [];
      let newArray2 = [];
      if (open_date_and_time.length > 0) {
        open_date_and_time.map((singleData) => {
          newObject = {
            start_time_with_date: new Date(
              singleData.date + "T" + singleData.start_time + ":15.215Z"
            ),
            end_time_with_date: new Date(
              singleData.date + "T" + singleData.end_time + ":15.215Z"
            ),
          };
          newArray.push(newObject);
        });
      } else {
        newArray = [
          {
            start_time_with_date: new Date(),
            end_time_with_date: new Date(),
          },
        ];
      }

      if (close_date_and_time.length > 0) {
        close_date_and_time.map((singleData) => {
          newObject = {
            start_time_with_date: new Date(
              singleData.date + "T" + singleData.start_time + ":15.215Z"
            ),
            end_time_with_date: new Date(
              singleData.date + "T" + singleData.end_time + ":15.215Z"
            ),
          };
          newArray2.push(newObject);
        });
      } else {
        newArray2 = [
          {
            start_time_with_date: new Date(),
            end_time_with_date: new Date(),
          },
        ];
      }

      let openingHoursData;
      if (openingHoursDetails) {
        openingHoursData = await HospitalOpeningHours.findOneAndUpdate(
          { for_portal_user: hospital_id },
          {
            $set: {
              week_days,
              open_date_and_time: newArray,
              close_date_and_time: newArray2,
            },
          },
          { new: true }
        ).exec();
      } else {
        const openingHoursInfo = new HospitalOpeningHours({
          week_days,
          open_date_and_time: newArray,
          close_date_and_time: newArray2,
          for_portal_user: hospital_id,
        });
        openingHoursData = await openingHoursInfo.save();
      }
      sendResponse(req, res, 200, {
        status: true,
        data: { openingHoursData },
        message: "successfully added hospital opening hours",
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        data: error,
        message: "failed to add hospital opening hours",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async viewHospitalAdminDetailsForPatient(req, res) {
    try {
      const { hospital_portal_id } = req.query;

      const result = await HospitalAdminInfo.find({
        for_portal_user: hospital_portal_id,
      })
        .select({
          hospitalPictures: 1,
          about_hospital: 1,
          hospital_name: 1,
        })
        .populate({
          path: "for_portal_user",
          select: { email: 1, country_code: 1, mobile: 1 },
          match: { "for_portal_user.isDeleted": false },
        })
        .populate({
          path: "in_location",
        });

      let data = result[0];
      //Get Doctors count
      const filter = {
        for_hospital: { $eq: data.for_portal_user._id },
        "for_portal_user.isDeleted": false,
      };
      const aggregate = [
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
            email: "$for_portal_user.email",
          },
        },
      ];
      const countData = await BasicInfo.aggregate(aggregate);
      let hospitalPicture = [];
      delete data.hospitalPictures;
      data.hospitalPictures = hospitalPicture;
      sendResponse(req, res, 200, {
        status: true,
        body: { data, doctorCount: countData.length },
        message: `Hospital admin details`,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `Failed to fetch hospital admin details`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async viewHospitalDoctorsForPatient(req, res) {
    try {
      const { hospital_portal_id, doctor_name, speciality } = req.query;
      const filter = {
        for_hospital: mongoose.Types.ObjectId(hospital_portal_id),
        "for_portal_user.isDeleted": false,
      };
      if (doctor_name) {
        filter["full_name"] = { $regex: doctor_name || "", $options: "i" };
      }
      if (speciality) {
        filter["speciality"] = mongoose.Types.ObjectId(speciality);
      }
      const aggregate = [
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
            full_name: 1,
            years_of_experience: 1,
            profile_picture: 1,
          },
        },
      ];
      const resultData = await BasicInfo.aggregate(aggregate);
      let result = [];
      for (const data of resultData) {
        data.profile_picture = "";
        result.push(data);
      }
      sendResponse(req, res, 200, {
        status: true,
        body: { result },
        message: `Hospital doctor list`,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `Failed to fetch hospital doctor`,
        errorCode: "INTERNAL_SERVER_ERROR",
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

    async doctorAvailableSlot1(req, res) {
        try {
            const {
                timeStamp,
                doctorId,
            } = req.body
            const current_timestamp = new Date(timeStamp)
            const onlyDate = timeStamp.split("T")[0]
            let day = current_timestamp.getDay()
           
            let startTime
            let startTimeH
            let startTimeM
            let startTimeHM
            let endTime
            let endTimeH
            let endTimeM
            let endTimeHM

      let allGeneralSlot = [];
      let allGeneralSlot2 = [];
      const result = await DoctorAvailability.findOne({
        for_portal_user: doctorId,
      });

      if (!result) {
        return sendResponse(req, res, 200, {
          status: true,
          body: {
            allGeneralSlot,
          },
          message: `No Slots Available For This Location`,
          errorCode: null,
        });
      }
      const doctorAvailability = result.availability_slot;
      let availabilityArray = [];
      let availabilitySlot = [];
      for (let index = 0; index < doctorAvailability.length; index++) {
        const element = doctorAvailability[index];
        const availabilityDate = element.date.split("T")[0];
        const d1 = new Date(onlyDate);
        const d2 = new Date(availabilityDate);
        if (d1.getTime() === d2.getTime()) {
          if (element.start_time != "0000" && element.end_time != "0000") {
            availabilityArray.push({
              startTime: element.start_time,
              endTime: element.end_time,
            });
          }
        }
      }

      if (availabilityArray.length > 0) {
        availabilityArray.forEach((element, index) => {
          let totalH = 0;
          let totalM = 0;
          startTimeH = element.startTime.slice(0, 2);
          startTimeM = element.startTime.slice(2);
          startTimeHM = startTimeH + ":" + startTimeM;
          endTimeH = element.endTime.slice(0, 2);
          endTimeM = element.endTime.slice(2);
          endTimeHM = endTimeH + ":" + endTimeM;
          let valueStart = moment.duration(startTimeHM, "HH:mm");
          let valueStop = moment.duration(endTimeHM, "HH:mm");
          let difference = valueStop.subtract(valueStart);
          totalH = totalH + difference.hours();
          totalM = totalM + difference.minutes();
          totalH = totalH + totalM / 60;
          let totalNumbersSlots =
            (totalH * 60) / result.slot_interval.slice(0, 2);
          startTime = element.startTime;
          startTimeH = startTime.slice(0, 2);
          startTimeM = startTime.slice(2);
          startTimeHM = startTimeH + ":" + startTimeM;
          let piece = startTimeHM;
          startTimeHM.split(":");
          let mins =
            piece[0] * 60 + +piece[1] + +result.slot_interval.slice(0, 2);
          let nextStartTimeH = ((mins % (24 * 60)) / 60) | 0;
          if (nextStartTimeH.toString().length == 1) {
            nextStartTimeH = "0" + startTimeH;
          }
          let nextStartTimeM = mins % 60;
          if (nextStartTimeM.toString().length == 1) {
            nextStartTimeM = nextStartTimeM + "0";
          }
          let nextStartTimeHM = nextStartTimeH + ":" + nextStartTimeM;

          availabilitySlot.push({
            slot: startTimeHM + "-" + nextStartTimeHM,
            status: 0,
          });
          // allGeneralSlot2.push(startTimeH + startTimeM)
          for (let index = 0; index < totalNumbersSlots - 1; index++) {
            piece = startTimeHM.split(":");
            let mins =
              piece[0] * 60 + +piece[1] + +result.slot_interval.slice(0, 2);
            startTimeH = ((mins % (24 * 60)) / 60) | 0;
            if (startTimeH.toString().length == 1) {
              startTimeH = "0" + startTimeH;
            }
            startTimeM = mins % 60;
            if (startTimeM.toString().length == 1) {
              startTimeM = startTimeM + "0";
            }
            startTimeHM = startTimeH + ":" + startTimeM;

            piece = startTimeHM.split(":");
            mins =
              piece[0] * 60 + +piece[1] + +result.slot_interval.slice(0, 2);
            nextStartTimeH = ((mins % (24 * 60)) / 60) | 0;
            if (nextStartTimeH.toString().length == 1) {
              nextStartTimeH = "0" + startTimeH;
            }
            nextStartTimeM = mins % 60;
            if (nextStartTimeM.toString().length == 1) {
              nextStartTimeM = nextStartTimeM + "0";
            }
            nextStartTimeHM = nextStartTimeH + ":" + nextStartTimeM;

            availabilitySlot.push({
              slot: startTimeHM + "-" + nextStartTimeHM,
              status: 0,
            });

            // const startTimeHM2 = startTimeH.toString() + startTimeM.toString()
            // allGeneralSlot2.push(startTimeHM2)
          }
        });
      }

      if (availabilitySlot.length > 0) {
        allGeneralSlot = availabilitySlot;
      } else {
        let daysArray = [];
        for (let index = 0; index < result.week_days.length; index++) {
          if (day == 0) {
            startTime = result.week_days[index].sun_start_time;
            endTime = result.week_days[index].sun_end_time;
          }
          if (day == 1) {
            startTime = result.week_days[index].mon_start_time;
            endTime = result.week_days[index].mon_end_time;
          }
          if (day == 2) {
            startTime = result.week_days[index].tue_start_time;
            endTime = result.week_days[index].tue_end_time;
          }
          if (day == 3) {
            startTime = result.week_days[index].wed_start_time;
            endTime = result.week_days[index].wed_end_time;
          }
          if (day == 4) {
            startTime = result.week_days[index].thu_start_time;
            endTime = result.week_days[index].thu_end_time;
          }
          if (day == 5) {
            startTime = result.week_days[index].fri_start_time;
            endTime = result.week_days[index].fri_end_time;
          }
          if (day == 6) {
            startTime = result.week_days[index].sat_start_time;
            endTime = result.week_days[index].sat_end_time;
          }
          if (startTime != "0000" && endTime != "0000") {
            daysArray.push({
              startTime: startTime,
              endTime: endTime,
            });
          }
        }

        if (daysArray.length > 0) {
          daysArray.forEach((element, index) => {
            let totalH = 0;
            let totalM = 0;
            startTimeH = element.startTime.slice(0, 2);
            startTimeM = element.startTime.slice(2);
            startTimeHM = startTimeH + ":" + startTimeM;

            endTimeH = element.endTime.slice(0, 2);
            endTimeM = element.endTime.slice(2);
            endTimeHM = endTimeH + ":" + endTimeM;

            let valueStart = moment.duration(startTimeHM, "HH:mm");
            let valueStop = moment.duration(endTimeHM, "HH:mm");

            let difference = valueStop.subtract(valueStart);

            totalH = totalH + difference.hours();
            totalM = totalM + difference.minutes();
            totalH = totalH + totalM / 60;

            let totalNumbersSlots =
              (totalH * 60) / result.slot_interval.slice(0, 2);

            startTime = element.startTime;
            startTimeH = startTime.slice(0, 2);
            startTimeM = startTime.slice(2);
            startTimeHM = startTimeH + ":" + startTimeM;
            let piece = startTimeHM.split(":");

            let mins =
              parseInt(parseInt(piece[0]) * 60) +
              +parseInt(piece[1]) +
              +result.slot_interval.slice(0, 2);

            let nextStartTimeH = ((mins % (24 * 60)) / 60) | 0;

            if (nextStartTimeH.toString().length == 1) {
              nextStartTimeH = "0" + startTimeH;
            }
            let nextStartTimeM = mins % 60;
            if (nextStartTimeM.toString().length == 1) {
              nextStartTimeM = nextStartTimeM + "0";
            }
            let nextStartTimeHM = nextStartTimeH + ":" + nextStartTimeM;

            allGeneralSlot.push({
              slot: startTimeHM + "-" + nextStartTimeHM,
              status: 0,
            });
            allGeneralSlot2.push(startTimeH + startTimeM);

            for (
              let index = 0;
              index < parseInt(totalNumbersSlots) - 1;
              index++
            ) {
              piece = startTimeHM.split(":");

              mins =
                parseInt(parseInt(piece[0]) * 60) +
                +parseInt(piece[1]) +
                +result.slot_interval.slice(0, 2);

              startTimeH = ((mins % (24 * 60)) / 60) | 0;
              if (startTimeH.toString().length == 1) {
                startTimeH = "0" + startTimeH;
              }
              startTimeM = mins % 60;
              if (startTimeM.toString().length == 1) {
                startTimeM = startTimeM + "0";
              }
              startTimeHM = startTimeH + ":" + startTimeM;

              piece = startTimeHM.split(":");
              mins =
                parseInt(parseInt(piece[0]) * 60) +
                +parseInt(piece[1]) +
                +result.slot_interval.slice(0, 2);
                nextStartTimeH = ((mins % (24 * 60)) / 60) | 0;
              if (nextStartTimeH.toString().length == 1) {
                nextStartTimeH = "0" + startTimeH;
              }
              nextStartTimeM = mins % 60;
              if (nextStartTimeM.toString().length == 1) {
                nextStartTimeM = nextStartTimeM + "0";
              }
              nextStartTimeHM = nextStartTimeH + ":" + nextStartTimeM;

              if (startTimeHM <= endTimeHM && nextStartTimeHM <= endTimeHM) {
                allGeneralSlot.push({
                  slot: startTimeHM + "-" + nextStartTimeHM,
                  status: 0,
                });
                const startTimeHM2 =
                  startTimeH.toString() + startTimeM.toString();
                allGeneralSlot2.push(startTimeHM2);
              }
            }
          });
        } else {
          allGeneralSlot = [];
          allGeneralSlot2 = [];
        }
        const doctorUnavailability = result.unavailability_slot;
        let unavailabilityArray = [];
        let unavailabilitySlot = [];

        if (allGeneralSlot.length > 0) {
          for (let index = 0; index < doctorUnavailability.length; index++) {
            const element = doctorUnavailability[index];
            const unavailabilityDate = element.date.split("T")[0];
            const d1 = new Date(onlyDate);
            const d2 = new Date(unavailabilityDate);
            if (d1.getTime() === d2.getTime()) {
              if (element.start_time != "0000" && element.end_time != "0000") {
                unavailabilityArray.push({
                  startTime: element.start_time,
                  endTime: element.end_time,
                });
              }
            }
          }
          if (unavailabilityArray.length > 0) {
            unavailabilityArray.forEach((element, index) => {
              let totalH = 0;
              let totalM = 0;
              startTimeH = element.startTime.slice(0, 2);
              startTimeM = element.startTime.slice(2);
              startTimeHM = startTimeH + ":" + startTimeM;
              endTimeH = element.endTime.slice(0, 2);
              endTimeM = element.endTime.slice(2);
              endTimeHM = endTimeH + ":" + endTimeM;
              let valueStart = moment.duration(startTimeHM, "HH:mm");
              let valueStop = moment.duration(endTimeHM, "HH:mm");
              let difference = valueStop.subtract(valueStart);
              totalH = totalH + difference.hours();
              totalM = totalM + difference.minutes();
              totalH = totalH + totalM / 60;
              let totalNumbersSlots =
                (totalH * 60) / result.slot_interval.slice(0, 2);
              startTime = element.startTime;
              startTimeH = startTime.slice(0, 2);
              startTimeM = startTime.slice(2);
              startTimeHM = startTimeH + ":" + startTimeM;
              let piece = startTimeHM.split(":");
              let mins =
                piece[0] * 60 + +piece[1] + +result.slot_interval.slice(0, 2);
              let nextStartTimeH = ((mins % (24 * 60)) / 60) | 0;
              if (nextStartTimeH.toString().length == 1) {
                nextStartTimeH = "0" + startTimeH;
              }
              let nextStartTimeM = mins % 60;
              if (nextStartTimeM.toString().length == 1) {
                nextStartTimeM = nextStartTimeM + "0";
              }
              let nextStartTimeHM = nextStartTimeH + ":" + nextStartTimeM;

              unavailabilitySlot.push({
                slot: startTimeHM + "-" + nextStartTimeHM,
                status: 0,
              });
              // allGeneralSlot2.push(startTimeH + startTimeM)
              for (let index = 0; index < totalNumbersSlots - 1; index++) {
                piece = startTimeHM.split(":");
                mins =
                  piece[0] * 60 + +piece[1] + +result.slot_interval.slice(0, 2);
                startTimeH = ((mins % (24 * 60)) / 60) | 0;
                if (startTimeH.toString().length == 1) {
                  startTimeH = "0" + startTimeH;
                }
                startTimeM = mins % 60;
                if (startTimeM.toString().length == 1) {
                  startTimeM = startTimeM + "0";
                }
                startTimeHM = startTimeH + ":" + startTimeM;

                piece = startTimeHM.split(":");
                mins =
                  piece[0] * 60 + +piece[1] + +result.slot_interval.slice(0, 2);
                nextStartTimeH = ((mins % (24 * 60)) / 60) | 0;
                if (nextStartTimeH.toString().length == 1) {
                  nextStartTimeH = "0" + startTimeH;
                }
                nextStartTimeM = mins % 60;
                if (nextStartTimeM.toString().length == 1) {
                  nextStartTimeM = nextStartTimeM + "0";
                }
                nextStartTimeHM = nextStartTimeH + ":" + nextStartTimeM;

                unavailabilitySlot.push({
                  slot: startTimeHM + "-" + nextStartTimeHM,
                  status: 0,
                });
              }
            });
            let filterUnavailableSlot = filterUnavailableSlotFunction(
              unavailabilitySlot,
              allGeneralSlot[0].slot,
              allGeneralSlot[allGeneralSlot.length - 1].slot
            );
            allGeneralSlot = uniqueArray(allGeneralSlot, filterUnavailableSlot);
          }
        }
      }

      let todayDate = new Date().toISOString().split("T")[0];
      if (new Date(onlyDate).getTime() === new Date(todayDate).getTime()) {
        allGeneralSlot = filterBookedSlotsToday(allGeneralSlot);
      }
      const appointment = await Appointment.find({
        doctorId,
        consultationDate: onlyDate,
      });

      if (appointment.length > 0) {
        const appointmentTimeArray = [];
        appointment.forEach((element) => {
          appointmentTimeArray.push(element.consultationTime);
        });
        allGeneralSlot = filterBookedSlots(
          allGeneralSlot,
          appointmentTimeArray
        );
      }
      sendResponse(req, res, 200, {
        status: true,
        body: {
          allGeneralSlot,
        },
        message: `Successfully get time slot`,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `failed to get time slot`,
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

  async nextAvailableSlot(req, res) {
    try {
      const { appointmentId } = req.query;
      const headers = {
        Authorization: req.headers["authorization"],
      };
      let appointment = await Appointment.findOne({ _id: appointmentId });
      const doctorId = appointment.doctorId;
      const hospitalId = appointment.hospital_details.hospital_id;
      const appointmentType = appointment.appointmentType;
      let timeStamp = new Date();
      let timeStampString;
      let slot = null;

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      for (let index = 0; index < 3; index++) {
        const resData = await httpService.postStaging(
          "hospital/doctor-available-slot",
          {
            locationId: hospitalId,
            doctorId: doctorId,
            appointmentType: appointmentType,
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
      if (slot == null) {
        return sendResponse(req, res, 200, {
          status: true,
          body: null,
          message: `Choose appointment from calender`,
          errorCode: null,
        });
      }

      sendResponse(req, res, 200, {
        status: true,
        body: {
          slot,
          timeStamp,
        },
        message: `Nearest available slot`,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `failed to get nearest available slot`,
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

  async uploadCSVForUnitHospital(req, res) {
    try {
      const filePath = "./uploads/" + req.filename;
      const data = await processExcel(filePath);
      const isValidFile = validateColumnWithExcel(unitHospital, data[0]);
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
        const service = await Service.find({
          service: element.for_service,
          delete_status: false,
          added_by: req.body.user_id,
        });

        const department = await Department.find({
          department: element.for_department,
          delete_status: false,
          added_by: req.body.user_id,
        });
        if (!service && !department) {
          return sendResponse(req, res, 400, {
            status: false,
            body: null,
            message: `does not exist`,
            errorCode: null,
          });
        } else {
          const serviceId = service[0]?._id;
          const departmentId = department[0]?._id;

          // Check if the combination of country name and region name already exists
          const existingRegion = await Unit.findOne({
            unit: element.unit_name,
            for_service: serviceId,
            for_department: departmentId,
            delete_status: false,
            added_by: req.body.user_id,
          });

          if (existingRegion) {
            return sendResponse(req, res, 500, {
              status: false,
              body: null,
              message: `'${element.unit_name} already exists`,
              errorCode: null,
            });
          } else {
            const payload = {
              unit: element.unit_name,
              for_service: serviceId,
              for_department: departmentId,
              added_by: req.body.user_id,
            };
            const region = new Unit(payload);
            await region.save();
          }
        }
      }

      return sendResponse(req, res, 200, {
        status: true,
        body: null,
        message: "Unit added successfully",
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

  async unitListforexport(req, res) {
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
        unit: { $regex: searchKey || "", $options: "i" },
        added_by: mongoose.Types.ObjectId(userid),
      };
    }

    try {
      let result = "";
      if (limit > 0) {
        result = await Unit.find(filter)
          .sort([["createdAt", -1]])
          .skip((page - 1) * limit)
          .limit(limit * 1)
          .populate("country_id", "name")
          .exec();
      } else {
        result = await Unit.aggregate([
          {
            $match: filter,
          },
          { $sort: { createdAt: -1 } },
          {
            $lookup: {
              from: "portalusers",
              localField: "added_by",
              foreignField: "_id",
              as: "unitData",
            },
          },
          {
            $unwind: {
              path: "$unitData",
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
            $lookup: {
              from: "services",
              localField: "for_service",
              foreignField: "_id",
              as: "serviceData",
            },
          },
          {
            $unwind: {
              path: "$serviceData",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 0,
              unit: "$unit",
              department: "$departmentData.department",
              service: "$serviceData.service",
              // added_by: "$unitData.role"
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

  //Master-Team
  async addTeam_SuperAdmin(req, res) {
    try {
      const { teamArray, added_by } = req.body;

      const list = teamArray.map((singleData) => ({
        ...singleData,
        added_by,
      }));
      const namesToFind = list.map((item) => item.team);
      const foundItems = await Team.find({
        team: { $in: namesToFind },
        added_by: mongoose.Types.ObjectId(added_by),
      });
      const CheckData = foundItems.map((item) => item.team);
      if (foundItems.length == 0) {
        const savedTeam = await Team.insertMany(list);
        sendResponse(req, res, 200, {
          status: true,
          body: savedTeam,
          message: "Successfully add team",
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
        message: "failed to add team",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async allTeamList(req, res) {
    try {
      const { limit, page, searchText, userId } = req.query;
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
        added_by: mongoose.Types.ObjectId(userId),
        delete_status: false,
      };
      if (searchText != "") {
        filter = {
          added_by: mongoose.Types.ObjectId(userId),
          delete_status: false,
          team: { $regex: searchText || "", $options: "i" },
        };
      }
      const teamList = await Team.find(filter)
        .sort(sortingarray) // Use an object for sorting
        .skip((page - 1) * limit)
        .limit(limit)
        // No need for .exec() when using await
        .exec();

      const count = await Team.countDocuments(filter);
      sendResponse(req, res, 200, {
        status: true,
        body: {
          totalCount: count,
          data: teamList,
        },
        message: "Successfully get Team list",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get team list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async updateTeam(req, res) {
    try {
      const { teamId, team, active_status, delete_status } = req.body;
      const list = await Team.find({
        team: team,
        active_status: active_status,
      });
      if (list.length == 0) {
        const updateTeam = await Team.updateOne(
          { _id: teamId },
          {
            $set: {
              team,
              active_status,
              delete_status,
            },
          },
          { new: true }
        ).exec();
        sendResponse(req, res, 200, {
          status: true,
          body: updateTeam,
          message: "Successfully updated Team",
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 200, {
          status: false,

          message: "Team Already Exist",
          errorCode: null,
        });
      }
    } catch (err) {
      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to update Team`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async actionOnTeam(req, res) {
    try {
      const { teamId, action_name, action_value } = req.body;

      let message = "";

      const filter = {};
      if (action_name == "active") filter["active_status"] = action_value;
      if (action_name == "delete") filter["delete_status"] = action_value;

      if (action_name == "active") {
        await Team.updateOne({ _id: teamId }, filter, {
          new: true,
        }).exec();

        message =
          action_value == true
            ? "Successfully Active Team"
            : "Successfully In-active Team";
      }

      if (action_name == "delete") {
        if (teamId == "") {
          await Team.updateMany(
            { delete_status: { $eq: false } },
            {
              $set: { delete_status: true },
            },
            { new: true }
          );
        } else {
          await Team.updateMany(
            { _id: { $in: teamId } },
            {
              $set: { delete_status: true },
            },
            { new: true }
          );
        }
        message = "Successfully Team deleted";
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

  async allTeamListforexport(req, res) {
    const { searchText, limit, page, userId } = req.query;
    let filter;
    if (searchText == "") {
      filter = {
        added_by: mongoose.Types.ObjectId(userId),
        delete_status: false,
      };
    } else {
      filter = {
        delete_status: false,
        added_by: mongoose.Types.ObjectId(userId),
        team: { $regex: searchText || "", $options: "i" },
      };
    }
    try {
      let result = "";
      if (limit > 0) {
        result = await Team.find(filter)
          .sort([["createdAt", -1]])
          .skip((page - 1) * limit)
          .limit(limit * 1)
          .exec();
      } else {
        result = await Team.aggregate([
          {
            $match: filter,
          },
          { $sort: { createdAt: -1 } },
          {
            $project: {
              _id: 0,
              team: "$team",
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
        message: `Team added successfully`,
        errorCode: null,
      });
    } catch (err) {
      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to add team`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async uploadCSVForTeam(req, res) {
    try {
      const filePath = "./uploads/" + req.filename;
      const data = await processExcel(filePath);

      const isValidFile = validateColumnWithExcel(TeamColumns, data[0]);
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
      const duplicateTeams = [];

      for (const singleData of data) {
        const trimmedTeam = singleData.team.trim();
        const existingTeam = await Team.findOne({
          added_by: req.body.added_by,
          team: trimmedTeam,
          delete_status: false,
        });
        if (existingTeam) {
          duplicateTeams.push(trimmedTeam);
        } else {
          inputArray.push({
            team: trimmedTeam,
            added_by: req.body.added_by,
          });
        }
      }

      if (duplicateTeams.length > 0) {
        return sendResponse(req, res, 400, {
          status: false,
          body: null,
          message: `Teams already exist: ${duplicateTeams.join(", ")}`,
          errorCode: null,
        });
      }
      if (inputArray.length > 0) {
        const result = await Team.insertMany(inputArray);
        return sendResponse(req, res, 200, {
          status: true,
          body: result,
          message: "All team records added successfully",
          errorCode: null,
        });
      } else {
        return sendResponse(req, res, 200, {
          status: true,
          body: null,
          message: "No new teams added",
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

  async commmonTeamList(req, res) {
    const { hospitalId } = req.query;
    try {
      const list = await Team.find({
        added_by: mongoose.Types.ObjectId(hospitalId),
        delete_status: false,
        active_status: true,
      });
      sendResponse(req, res, 200, {
        status: true,
        body: { list },
        message: `All Team list`,
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get Team list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async TeamById(req, res) {
    try {
      const { _id, hospitalId } = req.query;
      let filter = {};
      filter = {
        _id: mongoose.Types.ObjectId(_id),
        added_by: mongoose.Types.ObjectId(hospitalId),
        delete_status: false,
        active_status: true,
      };
      const list = await Team.findOne(filter);
      sendResponse(req, res, 200, {
        status: true,
        body: { list },
        message: `All Team list`,
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get Team list",
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
        type,
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

  async getUnitData(req, res) {
    try {
      let result = await Unit.find({ _id: req.query.data }).exec();

      sendResponse(req, res, 200, {
        status: true,
        data: result,
        message: `hospital Unit fetch successfully`,
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

  async getTeamsData(req, res) {
    try {
      let result = await Team.find({ _id: req.query.data }).exec();
      sendResponse(req, res, 200, {
        status: true,
        data: result,
        message: `hospital team fetch successfully`,
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

  async getAllHospitalList(req, res) {
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };
      const filter = {
        isDeleted: false,
        lock_user: false,
        isActive: true,
        // 'for_hospital_info.verify_status':"APPROVED",
        "for_doctor_info.verify_status": "APPROVED",
      };

      const filter1 = {
        "for_portal_user.isDeleted": false,
        "for_portal_user.lock_user": false,
        "for_portal_user.isActive": true,
        verify_status: "APPROVED",
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
            type: "Doctor",
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

      const hospitalData = await HospitalAdminInfo.aggregate([
        {
          $lookup: {
            from: "portalusers",
            localField: "for_portal_user",
            foreignField: "_id",
            as: "for_portal_user",
          },
        },
        { $unwind: "$for_portal_user" },
        { $match: filter1 },
        {
          $project: {
            for_location_info: {
              hospital_id: "$for_portal_user._id",
              hospital_name: "$hospital_name",
            },
            type: "Hospital",
          },
        },
      ]);

      let hospitalDataResponse = await httpService.getStaging(
        "labradio/get-all-fouportal-list-per-loc",
        {},
        headers,
        "labradioServiceUrl"
      );
      if (!hospitalDataResponse.status || !hospitalDataResponse.body) {
        throw new Error("Failed to fetch hospital data");
      }

      const fourPortal = hospitalDataResponse.body;
      // Extracting the array of hospitals from fourPortal
      const fourPortalArray = Array.isArray(fourPortal) ? fourPortal : [];

      const combinedResults = [
        ...locationData,
        ...hospitalData,
        ...fourPortalArray,
      ];
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

  async getDoctorListforLocation(req, res) {
    try {
      const { clinic_id } = req.query;

      let data1 = await HospitalLocation.find({
        hospital_or_clinic_location: {
          $elemMatch: {
            hospital_id: clinic_id, // Replace clinic_id with the specific value you are looking for
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
      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `Failed to fetch all hospital`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getAllHospitalAdmin(req, res) {
    try {
      const filter1 = {
        "for_portal_user.isDeleted": false,
        "for_portal_user.lock_user": false,
        "for_portal_user.isActive": true,
        verify_status: "APPROVED",
      };

      const hospitalData = await HospitalAdminInfo.aggregate([
        {
          $lookup: {
            from: "portalusers",
            localField: "for_portal_user",
            foreignField: "_id",
            as: "for_portal_user",
          },
        },
        { $unwind: "$for_portal_user" },
        { $match: filter1 },
        {
          $project: {
            for_location_info: {
              hospital_id: "$for_portal_user._id",
              hospital_name: "$hospital_name",
            },
          },
        },
      ]);

      sendResponse(req, res, 200, {
        status: true,
        body: hospitalData,
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

  async unRegisteredHospitalUpdate(req, res) {
    try {
      const {
        hospitalAdminId,
        main_phone_number,
        fax_number,
        ifu_number,
        rccm_number,
        addressInfo,
        first_name,
        middle_name,
        hospital_name,
        last_name,
        email,
      } = req.body;

      let userFind = await PortalUser.findOne({
        _id: mongoose.Types.ObjectId(hospitalAdminId),
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

        if (req.body.first_name && req.body.last_name) {
          portaldata = await PortalUser.findOneAndUpdate(
            { _id: hospitalAdminId },
            {
              $set: {
                full_name: first_name + " " + middle_name + " " + last_name,
                email,
              },
            },
            { upsert: false, new: true }
          );
        }

        let locationData;

        const findLocation = await LocationInfo.findOne({
          for_portal_user: mongoose.Types.ObjectId(hospitalAdminId),
        });

        if (findLocation) {
          locationData = await LocationInfo.findOneAndUpdate(
            { for_portal_user: mongoose.Types.ObjectId(hospitalAdminId) },
            {
              $set: {
                // loc: addressInfo.loc == '' ? null : addressInfo.loc,
                address: addressInfo.address == "" ? null : addressInfo.address,
                // neighborhood: addressInfo.neighborhood == '' ? null : addressInfo.neighborhood,
                // country: addressInfo.country == '' ? null : addressInfo.country,
                // region: addressInfo.region == '' ? null : addressInfo.region,
                // province: addressInfo.province == '' ? null : addressInfo.province,
                // department: addressInfo.department == '' ? null : addressInfo.department,
                // city: addressInfo.city == '' ? null : addressInfo.city,
                // village: addressInfo.village == '' ? null : addressInfo.village,
                // pincode: addressInfo.pincode == '' ? null : addressInfo.pincode
              },
            },
            { new: true }
          );
        } else {
          const locationInfo = new LocationInfo({
            // loc: addressInfo.loc == '' ? null : addressInfo.loc,
            address: addressInfo.address == "" ? null : addressInfo.address,
            // neighborhood: addressInfo.neighborhood == '' ? null : addressInfo.neighborhood,
            // country: addressInfo.country == '' ? null : addressInfo.country,
            // region: addressInfo.region == '' ? null : addressInfo.region,
            // province: addressInfo.province == '' ? null : addressInfo.province,
            // department: addressInfo.department == '' ? null : addressInfo.department,
            // city: addressInfo.city == '' ? null : addressInfo.city,
            // village: addressInfo.village == '' ? null : addressInfo.village,
            // pincode: addressInfo.pincode == '' ? null : addressInfo.pincode,

            for_portal_user: hospitalAdminId,
          });
          locationData = await locationInfo.save();
        }

        const basicInfo = await HospitalAdminInfo.findOneAndUpdate(
          { for_portal_user: mongoose.Types.ObjectId(hospitalAdminId) },
          {
            $set: {
              first_name: first_name,
              last_name: last_name,
              middle_name: middle_name,
              main_phone_number: main_phone_number,
              fax_number: fax_number,
              ifu_number: ifu_number,
              rccm_number: rccm_number,
              hospital_name: hospital_name,
              in_location: locationData._id,
            },
          },
          { upsert: false, new: true }
        );
        if (basicInfo || portaldata) {
          return sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: "Hospital Details Upadte Sucessfully!",
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
