"use strict";

import mongoose from "mongoose";
// models
import PortalUser from "../models/portal_user";
import ProfileInfo from "../models/profile_info";
import LocationInfo from "../models/location_info";
import HospitalLocation from "../models/hospital_location";
import PathologyTestInfoNew from "../models/pathologyTestInfoNew";
import DoctorInfo from "../models/doctor_info";
import StaffInfo from "../models/staff_info";
import BasicInfo from "../models/basic_info";
import EducationalDetail from "../models/educational_details";
import DoctorAvailability from "../models/doctor_availability";
import FeeManagement from "../models/fee_management";
import DocumentInfo from "../models/document_info";
import DocumentManagement from "../models/document_management";
import Counter from "../models/counter";
import Appointment from "../models/appointment";
import ReviewAndRating from "../models/review";
import Template from "../models/template";
import Eprescription from "../models/eprescription";
import EprescriptionMedicineDosage from "../models/eprescription_medicine_dosage";
import EprescriptionLab from "../models/eprescription_lab";
import EprescriptionImaging from "../models/eprescription_imaging";
import EprescriptionVaccination from "../models/eprescription_vaccination";
import EprescriptionEyeglass from "../models/eprescription_eyeglass";
import EprescriptionOther from "../models/eprescription_other";
import HospitalType from "../models/hospitalType";
import { sendNotification } from "../helpers/notification";
// utils
import { sendResponse } from "../helpers/transmission";
import { hashPassword, formatString } from "../helpers/string";
import Http from "../helpers/httpservice";
import {
  sendEprescriptionEmail,
} from "../helpers/emailTemplate";
const httpService = new Http();
import { sendEmail } from "../helpers/ses";

import { processExcel, getNextSequenceValue, generateSequenceNumber } from "../middleware/utils";
import { updatePaymentStatusAndSlot } from "./hospital_controller";
import moment from "moment";
import { HealthCenterColumns, config , messages} from "../config/constants";
import Notification from "../models/notification";
import Specialty from "../models/specialty_info";
import "dotenv/config.js";
import { generateSignedUrl } from "../helpers/gcs";
import Chat from "../models/Chat/ChatModel";
import Message from "../models/Chat/Message";
const fs = require("fs");

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

const saveVideoCallMessagesToChat = async (chatmessage) => {
  try {
    let isRoomExist = await Chat.findOne({
      $or: [
        {
          senderID: mongoose.Types.ObjectId(chatmessage.senderId),
          receiverID: { $in: [mongoose.Types.ObjectId(chatmessage.receiver[0].id)] },
        },
        {
          senderID: { $in: [mongoose.Types.ObjectId(chatmessage.receiver[0].id)] },
          receiverID: mongoose.Types.ObjectId(chatmessage.senderId),
        },
      ],
      isGroupChat: false,
    });

    if (isRoomExist) {
      let saveData = new Message({
        chatId: isRoomExist._id,
        senderID: chatmessage.senderId,
        receiverID: chatmessage.receiver[0].id,
        message: chatmessage.message,
        attachments: [],
        isRead: true
      });
      let saveMessage = await saveData.save();
      const jsondata = {
        latestMessage: mongoose.Types.ObjectId(saveMessage._id),
      };
      await Chat.updateOne(
        { _id: mongoose.Types.ObjectId(isRoomExist._id) },
        { $set: jsondata },
        { new: true }
      );
      return { status: true, message: "Message saved to existing room" };
    } else {
      let saveData = new Chat({
        senderID: chatmessage.senderId,
        receiverID: chatmessage.receiver[0].id,
      });
      let saveChat = await saveData.save();
      if (saveChat) {
        let saveData = new Message({
          chatId: saveChat._id,
          senderID: chatmessage.senderId,
          receiverID: chatmessage.receiver[0].id,
          message: chatmessage.message,
          attachments: [],
          isRead: true
        });
        let saveMessage = await saveData.save();
        const jsondata = {
          latestMessage: mongoose.Types.ObjectId(saveMessage._id),
        };
        await Chat.updateOne(
          { _id: mongoose.Types.ObjectId(saveChat._id) },
          { $set: jsondata },
          { new: true }
        );
        return { status: true, message: "Room created and message saved" };
      } else {
        return { status: false, message: "Failed to send message" };
      }
    }
  } catch (error) {
    return {
      status: false,
      message: "An error occurred while saving the video call message",
      error,
    };
  }
};


export const updateSlotAvailability = async (
  hospitalId,
  notificationReceiver,
  timeStamp,
  req
) => {
  let timeStampString;
  let slot = null;

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
    // update data in basic info
  }
};

export const addTestsForMngDoc = async (pathologyInfo, id) => {
  let pathologyTestData;
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
          pathologyTestData = await PathologyTestInfoNew.create({
            for_portal_user: id,
            typeOfTest: test.typeOfTest,
            nameOfTest: test.nameOfTest,
            isExist: true,
          });
        }
      }
    } catch (error) {

    }
  }
};

class DoctorController {
  async addStaff(req, res) {
    try {
      const {
        first_name,
        middle_name,
        last_name,
        email,
        password,
        phone_number,
        dob,
        language,
        gender,
        address,
        about,
        profile_picture,
        nationality,
        country,
        state,
        city,
        zip,
        degree,
        role,
        for_doctor,
      } = req.body;

 
      const passwordHash = await hashPassword(password);
      let sequenceDocument = await Counter.findOneAndUpdate(
        { _id: "employeeid" },
        { $inc: { sequence_value: 1 } },
        { new: true }
      );
      const userDetails = new PortalUser({
        email,
        userId: sequenceDocument.sequence_value,
        password: passwordHash,
        phone_number,
        verified: false,
        role: "HOSPITAL_STAFF",
      });
      const userData = await userDetails.save();
      const locationInfo = new LocationInfo({
        nationality: nationality == "" ? null : nationality,
        country: country == "" ? null : country,
        state: state == "" ? null : state,
        city: city == "" ? null : city,
        zip,
        for_portal_user: userData._id,
      });
      const locationData = await locationInfo.save();
      const profileInfo = new ProfileInfo({
        name: first_name + " " + middle_name + " " + last_name,
        first_name,
        middle_name,
        last_name,
        dob,
        language,
        gender,
        address,
        about,
        profile_picture,
        in_location: locationData._id,
        for_portal_user: userData._id,
      });
      const profileData = await profileInfo.save();
      const staffInfo = new StaffInfo({
        degree,
        role,
        for_doctor,
        in_profile: profileData._id,
        for_portal_user: userData._id,
      });
      const staffData = await staffInfo.save();
      sendResponse(req, res, 200, {
        status: true,
        body: { staffData },
        message: messages.hospitalStaffAdded.en,
        messageArabic: messages.hospitalStaffAdded.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to create hospital staff",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async updateStaffDetails(req, res) {
    try {
      const {
        for_portal_user,
        user_name,
        phone_number,
        name,
        dob,
        language,
        gender,
        address,
        about,
        profile_picture,
        nationality,
        country,
        state,
        city,
        zip,
        degree,
        role,
        for_doctor,
      } = req.body;
 
      const userData = PortalUser.updateOne(
        { _id: for_portal_user },
        {
          $set: {
            user_name,
            phone_number,
            role: "HOSPITAL_STAFF",
          },
        },
        { new: true }
      ).exec();

      const locationData = LocationInfo.updateOne(
        { for_portal_user },
        {
          $set: {
            nationality,
            country,
            state,
            city,
            zip,
          },
        },
        { new: true }
      ).exec();

      const profileData = ProfileInfo.updateOne(
        { for_portal_user },
        {
          $set: {
            name,
            dob,
            language,
            gender,
            address,
            about,
            profile_picture,
          },
        },
        { new: true }
      ).exec();

      const staffData = StaffInfo.updateOne(
        { for_portal_user },
        {
          $set: {
            degree,
            role,
            for_doctor,
          },
        },
        { new: true }
      ).exec();

      await Promise.all([userData, locationData, profileData, staffData]);

      sendResponse(req, res, 200, {
        status: true,
        body: { staffData },
        message: messages.hospitalStaffUpdated.en,
        messageArabic: messages.hospitalStaffUpdated.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "failed to updated hospital staff",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async deleteStaff(req, res) {
    try {
      const { for_portal_user } = req.body;
      const portalUser = PortalUser.deleteOne(
        { _id: for_portal_user },
        { new: true }
      ).exec();
      const locationData = LocationInfo.deleteOne(
        { for_portal_user },
        { new: true }
      ).exec();
      const profileData = ProfileInfo.deleteOne(
        { for_portal_user },
        { new: true }
      ).exec();
      const staffData = StaffInfo.deleteOne(
        { for_portal_user },
        { new: true }
      ).exec();
      const DocumentData = DocumentInfo.deleteMany(
        { for_portal_user },
        { new: true }
      ).exec();
      await Promise.all([
        portalUser,
        locationData,
        profileData,
        staffData,
        DocumentData,
      ]);
      sendResponse(req, res, 200, {
        status: true,
        body: { staffData },
        message: messages.hospitalStaffDeleted.en,
        messageArabic: messages.hospitalStaffDeleted.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "failed to delete hospital staff",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async addDoctor(req, res) {
    try {
      const {
        user_name,
        email,
        password,
        phone_number,
        name,
        dob,
        language,
        gender,
        address,
        about,
        profile_picture,
        nationality,
        country,
        state,
        city,
        zip,
        title,
        exp_years,
        unite,
        licence_number,
        as_staff,
        specilaization,
        act,
      } = req.body;

      const passwordHash = await hashPassword(password);
      const userDetails = new PortalUser({
        user_name,
        email,
        password: passwordHash,
        phone_number,
        verified: false,
        role: "HOSPITAL_DOCTOR",
      });
      const userData = await userDetails.save();
      const locationInfo = new LocationInfo({
        nationality,
        country,
        state,
        city,
        zip,
        for_portal_user: userData._id,
      });
      const locationData = await locationInfo.save();
      const profileInfo = new ProfileInfo({
        name,
        dob,
        language,
        gender,
        address,
        about,
        profile_picture,
        in_location: locationData._id,
        for_portal_user: userData._id,
      });
      const profileData = await profileInfo.save();
      const doctorInfo = new DoctorInfo({
        in_profile: profileData._id,
        title,
        exp_years,
        unite,
        licence_number,
        as_staff,
        specilaization,
        act,
        for_portal_user: userData._id,
      });
      const doctorDetails = await doctorInfo.save();
      sendResponse(req, res, 200, {
        status: true,
        body: { doctorDetails },
        message: messages.doctorCreated.en,
        messageArabic: messages.doctorCreated.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "failed to create doctor",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async updateDoctorDetails(req, res) {
    try {
      const {
        for_portal_user,
        user_name,
        phone_number,
        name,
        dob,
        language,
        gender,
        address,
        about,
        profile_picture,
        nationality,
        country,
        state,
        city,
        zip,
        title,
        exp_years,
        unite,
        licence_number,
        as_staff,
        specilaization,
        act,
      } = req.body;
      const userData = PortalUser.updateOne(
        { _id: for_portal_user },
        {
          $set: {
            user_name,
            phone_number,
            role: "HOSPITAL_DOCTOR",
          },
        },
        { new: true }
      ).exec();

      const locationData = LocationInfo.updateOne(
        { for_portal_user },
        {
          $set: {
            nationality,
            country,
            state,
            city,
            zip,
          },
        },
        { new: true }
      ).exec();

      const profileData = ProfileInfo.updateOne(
        { for_portal_user },
        {
          $set: {
            name,
            dob,
            language,
            gender,
            address,
            about,
            profile_picture,
          },
        },
        { new: true }
      ).exec();

      const doctorDetails = DoctorInfo.updateOne(
        { for_portal_user },
        {
          $set: {
            title,
            exp_years,
            unite,
            licence_number,
            as_staff,
            specilaization,
            act,
          },
        },
        { new: true }
      ).exec();

      await Promise.all([userData, locationData, profileData, doctorDetails]);
      sendResponse(req, res, 200, {
        status: true,
        body: { doctorDetails },
        message: messages.doctorUpdated.en,
        messageArabic: messages.doctorUpdated.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "failed to update doctor details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async deleteDoctor(req, res) {
    try {
      const { for_portal_user } = req.body;
      const portalUser = PortalUser.deleteOne(
        { _id: for_portal_user },
        { new: true }
      ).exec();
      const locationData = LocationInfo.deleteOne(
        { for_portal_user },
        { new: true }
      ).exec();
      const profileData = ProfileInfo.deleteOne(
        { for_portal_user },
        { new: true }
      ).exec();
      const doctorData = DoctorInfo.deleteOne(
        { for_portal_user },
        { new: true }
      ).exec();
      const doctorAvailabilityData = DoctorAvailability.deleteOne(
        { for_portal_user },
        { new: true }
      ).exec();
      const educationalData = EducationalDetail.deleteMany(
        { for_portal_user },
        { new: true }
      ).exec();
      const DocumentData = DocumentInfo.deleteMany(
        { for_portal_user },
        { new: true }
      ).exec();
      await Promise.all([
        portalUser,
        locationData,
        profileData,
        doctorData,
        doctorAvailabilityData,
        educationalData,
        DocumentData,
      ]);
      sendResponse(req, res, 200, {
        status: true,
        body: { doctorData },
        message: messages.doctorDeleted.en,
        messageArabic: messages.doctorDeleted.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "failed to delete hospital doctor",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async addDoctorEducation(req, res) {
    try {
      const educationalData = await EducationalDetail.insertMany(req.body);
      sendResponse(req, res, 200, {
        status: true,
        body: { educationalData },
        message: messages.doctorEducationAdded.en,
        messageArabic: messages.doctorEducationAdded.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "failed to update doctor educational details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async deleteDoctorEducation(req, res) {
    try {
      const { _id, for_portal_user } = req.body;
      const educationalData = await EducationalDetail.deleteOne(
        { _id, for_portal_user },
        { new: true }
      ).exec();
      sendResponse(req, res, 200, {
        status: true,
        body: { educationalData },
        message: messages.doctorEducationDeleted.en,
        messageArabic: messages.doctorEducationDeleted.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to delete doctor educational details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async updateDoctorEducation(req, res) {
    try {
      const { _id, for_portal_user, course, university, start_date, end_date } =
        req.body;
      const educationalData = await EducationalDetail.updateOne(
        { _id, for_portal_user },
        {
          $set: {
            course,
            university,
            start_date,
            end_date,
          },
        },
        { new: true }
      ).exec();
      sendResponse(req, res, 200, {
        status: true,
        body: { educationalData },
        message: messages.doctorEducationUpdated.en,
        messageArabic: messages.doctorEducationUpdated.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to update doctor educational details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async addDoctorAvailability(req, res) {
    try {
      const {
        week_days,
        slot_interval,
        appointment_type,
        unavailability_slot,
        for_portal_user,
      } = req.body;
      const doctorAvailability = new DoctorAvailability({
        week_days,
        slot_interval,
        appointment_type,
        unavailability_slot,
        for_portal_user,
      });
      const doctorAvailableDetails = await doctorAvailability.save();
      sendResponse(req, res, 200, {
        status: true,
        body: { doctorAvailableDetails },
        message: messages.doctorAvailabilityAdded.en,
        messageArabic: messages.doctorAvailabilityAdded.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to add doctor availability details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async deleteDoctorAvailability(req, res) {
    try {
      const { _id, for_portal_user } = req.body;
      const availabilityData = await DoctorAvailability.deleteOne(
        { _id, for_portal_user },
        { new: true }
      ).exec();
      sendResponse(req, res, 200, {
        status: true,
        body: { availabilityData },
        message: messages.doctorAvailabilityDeleted.en,
        messageArabic: messages.doctorAvailabilityDeleted.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to delete doctor availability details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async updateDoctorAvailability(req, res) {
    try {
      const {
        _id,
        week_days,
        slot_interval,
        appointment_type,
        unavailability_slot,
        for_portal_user,
      } = req.body;
      const doctorAvailableDetails = await DoctorAvailability.updateOne(
        { _id, for_portal_user },
        {
          $set: {
            week_days,
            slot_interval,
            appointment_type,
            unavailability_slot,
            for_portal_user,
          },
        },
        { new: true }
      ).exec();
      sendResponse(req, res, 200, {
        status: true,
        body: { doctorAvailableDetails },
        message: messages.doctorAvailabilityUpdated.en,
        messageArabic: messages.doctorAvailabilityUpdated.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to update doctor availability details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async updateDoctorConsultation(req, res) {
    try {
      const { for_portal_user, consultation_fee } = req.body;
      const consultationFee = await DoctorInfo.updateOne(
        { for_portal_user },
        { $set: { consultation_fee } },
        { new: true }
      ).exec();
      sendResponse(req, res, 200, {
        status: true,
        body: { consultationFee },
        message: messages.doctorConsultationUpdated.en,
        messageArabic: messages.doctorConsultationUpdated.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to update doctor consultation details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async deleteDoctorConsultation(req, res) {
    try {
      const { for_portal_user } = req.body;
      const consultationFee = await DoctorInfo.updateOne(
        { for_portal_user },
        { $set: { consultation_fee: [] } },
        { new: true }
      ).exec();
      sendResponse(req, res, 200, {
        status: true,
        body: { consultationFee },
        message: messages.doctorConsultationDeleted.en,
        messageArabic: messages.doctorConsultationDeleted.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to delete doctor consultation details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async saveDocumentMetadata(req, res) {
    try {
      const {
        name,
        e_tag,
        code,
        issued_date,
        expiry_date,
        url,
        for_portal_user,
      } = req.body;
      const documentMetadata = new DocumentInfo({
        name,
        e_tag,
        code,
        issued_date,
        expiry_date,
        url,
        is_deleted: false,
        for_portal_user,
      });
      const documentDetail = await documentMetadata.save();
      sendResponse(req, res, 200, {
        status: true,
        body: { documentDetail },
        message: messages.documentAdded.en,
        messageArabic: messages.documentAdded.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to add document details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async deleteDocumentMetadata(req, res) {
    try {
      const { _id, code, for_portal_user } = req.body;
      const documentDetail = await DocumentInfo.updateOne(
        {
          _id,
          code,
          for_portal_user,
        },
        {
          $set: { is_deleted: true },
        },
        { new: true }
      ).exec();
      sendResponse(req, res, 200, {
        status: true,
        body: { documentDetail },
        message: messages.documentDeleted.en,
        messageArabic: messages.documentDeleted.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to delete document details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async listDocumentMetadata(req, res) {
    try {
      const { for_portal_user, limit, page, code } = req.body;
      const result = await DocumentInfo.find({
        for_portal_user: { $eq: for_portal_user },
        code: { $eq: code },
      })
        .sort([["createdAt", -1]])
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();
      const count = await DoctorInfo.countDocuments({
        for_portal_user: { $eq: for_portal_user },
      });
      sendResponse(req, res, 200, {
        status: true,
        body: {
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          totalRecords: count,
          result,
        },
        message: messages.documentsFetched.en,
        messageArabic: messages.documentsFetched.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to fetch document list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async doctorManagementBasicInfo(req, res) {
    const headers = {
      Authorization: req.headers["authorization"],
    }
    //Add or update document
    const {
      id,
      first_name,
      first_name_arabic,
      middle_name,
      middle_name_arabic,
      last_name,
      last_name_arabic,
      loc,
      address,
      neighborhood,
      country,
      region,
      province,
      location_department,
      city,
      village,
      pincode,
      mobile,
      country_code,
      dob,
      designation,
      title,
      years_of_experience,     
      email,
      gender,
      gender_arabic,
      spoken_language,
      password,
      about,
      about_arabic,
      license_number,
      license_expiry_date,
      speciality,
      categoryIds,
      profile_picture,
      licence_image,
      user_picture,
      doctorfees
    } = req.body;

    try {
        //Create account for doctor
        let portal_user_id = ''
        let portalUserDataObject = {
          email: email,
          country_code,
          role: 'INDIVIDUAL_DOCTOR',
          created_by_user: req?.user?._id,
          mobile,
          full_name: formatString(`Dr. ${first_name} ${middle_name} ${last_name}`),
          full_name_arabic: formatString(`د. ${first_name_arabic} ${middle_name_arabic} ${last_name_arabic}`)
        };
        //Check email exist
        let filter_data = { email: email, isDeleted: false }
        if (id) {
          portal_user_id = id;
          filter_data['_id'] = { $ne: id }

        }
        const CheckEmail = await PortalUser.findOne(filter_data)
        if (CheckEmail) {
          return sendResponse(req, res, 200, {
            status: false,
            body: null,
            message: messages.emailExist.en,
            messageArabic: messages.emailExist.ar,
            errorCode: "INTERNAL_SERVER_ERROR",
          })
        }
        let PortalUserDetails
        if (id) {
          PortalUserDetails = await PortalUser.findOneAndUpdate(
            { _id: { $eq: id } },
            { $set: { country_code, email, mobile, full_name: portalUserDataObject.full_name, full_name_arabic: portalUserDataObject.full_name_arabic } },
            { new: true }
          ).exec();
        } else {
          const doctorId = await generateSequenceNumber()
          const passwordHash = await hashPassword(password);
          portalUserDataObject['password'] = passwordHash
          portalUserDataObject['doctorId'] = doctorId
 
          const portal_user = new PortalUser(portalUserDataObject)
          PortalUserDetails = await portal_user.save()
          portal_user_id = PortalUserDetails._id
        }
        //Store Location details
        let locationObject = {
          loc: loc == '' ? null : loc,
          address: address == '' ? null : address,
          neighborhood: neighborhood == '' ? null : neighborhood,
          country: country == '' ? null : country,
          region: region == '' ? null : region,
          province: province == '' ? null : province,
          department: location_department == '' ? null : location_department,
          city: city == '' ? null : city,
          village: village == '' ? null : village,
          pincode: pincode == '' ? null : pincode

        }
        let locationResult
        const getLocationInfo = await LocationInfo.find({ for_portal_user: { $eq: portal_user_id } }).select('address');
        if (id && getLocationInfo.length > 0) {
          locationResult = await LocationInfo.findOneAndUpdate({ for_portal_user: { $eq: id } }, {
            $set: locationObject
          }, { new: true }).exec();
        } else {
          locationObject.for_portal_user = portal_user_id
          const locationData = new LocationInfo(locationObject);
          locationResult = await locationData.save()
        }
        const location_object_id = locationResult._id;

        // Store Basic Info of doctor
        let license_details_object = {
          license_number,
          license_expiry_date,
          license_image: licence_image
        }
        let basicInfoData = {
          first_name, middle_name, last_name, full_name: formatString(`Dr. ${first_name} ${middle_name} ${last_name}`), full_name_arabic: formatString(`د. ${first_name_arabic} ${middle_name_arabic} ${last_name_arabic}`),
          main_phone_number: mobile, first_name_arabic, middle_name_arabic, last_name_arabic, gender_arabic, about_arabic, dob, designation, title, years_of_experience,gender, spoken_language, about, 
          license_details: license_details_object, speciality, categoryIds, in_location: location_object_id,  isInfoCompleted: true,doctorfees,
          profile_picture, user_picture
        }

        if (id) {
          basicInfoData.isInfoCompleted = true
          await BasicInfo.findOneAndUpdate({ for_portal_user: { $eq: id } }, {
            $set: basicInfoData
          }).exec();
        } else {
          basicInfoData['approved_at'] = new Date()
          basicInfoData['for_portal_user'] = portal_user_id
          const basicInfoDataResult = new BasicInfo(basicInfoData)
          await basicInfoDataResult.save()

          //Send notification to doctor
          let paramsData = {
            sendTo: 'doctor',
            madeBy: 'superadmin',
            condition: 'PROFILE_CREATED',
            user_name: portalUserDataObject.full_name,
            user_email: email, 
            user_mobile: mobile,
            country_code: country_code,
            user_password: password, 
            notification: ['sms', 'email'],
            isProfile: true
          }
          sendNotification(paramsData, headers)
        }
        sendResponse(req, res, 200, {
          status: true,
          data: { PortalUserDetails, portal_user_id },
          message: `doctor basic info ${id ? 'updated' : 'added'} successfully`,
          errorCode: null,
        });
      
    } catch (error) {
      const CheckEmail = await PortalUser.find({ email: req.body.email });
      if (CheckEmail.length > 0) {
        await PortalUser.deleteOne({ _id: { $eq: CheckEmail[0]._id } });
      }
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: error.message ? error.message : "Something went wrong",
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async doctorManagementEducationalDetails(req, res) {
    const { portal_user_id, education_details } = req.body;
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

  async doctorManagementDoctorAvailability(req, res) {
    const { portal_user_id, doctor_availability } = req.body;
    try {
      const dataArray = [];
      for (let data of doctor_availability) {
        data["for_portal_user"] = portal_user_id;
        if (data.existingIds === "") {
          dataArray.push(data);
        } else {
          await DoctorAvailability.findOneAndUpdate(
            { _id: { $eq: data.existingIds } },
            {
              $set: {
                week_days: data.week_days,
                unavailability_slot: data.unavailability_slot,
                slot_interval: data.slot_interval,
              },
            }
          ).exec();
        }
      }
      if (dataArray.length > 0) {
        const result = await DoctorAvailability.insertMany(dataArray);
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
        message: messages.doctorAvailabilityAdded.en,
        messageArabic: messages.doctorAvailabilityAdded.ar,
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

  async deleteAvailability(req, res) {
    const { portal_user_id, location_id } = req.body;
    try {
      await DoctorAvailability.deleteMany({
        for_portal_user: { $eq: portal_user_id },
        location_id,
      });

      sendResponse(req, res, 200, {
        status: true,
        data: null,
        message: messages.locationandAvailabilityDeleted.en,
        messageArabic: messages.locationandAvailabilityDeleted.ar,
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

  async doctorManagementFeeManagement(req, res) {
    const { portal_user_id, location_id, online, home_visit, f2f } = req.body;
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
  async doctorManagementDocumentManagement(req, res) {
    const { portal_user_id, document_details } = req.body;
    try {
      const checkExist = await DocumentManagement.find({
        for_portal_user: portal_user_id,
      }).exec();
      if (checkExist.length > 0) {

        await DocumentManagement.findOneAndUpdate(
          { for_portal_user: portal_user_id },
          { $set: { document_details: document_details } },
          { new: true } // to return the updated document
        ).exec();
      } else {
        const docData = new DocumentManagement({
          document_details,
          for_portal_user: portal_user_id,
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

  async doctorManagementViewDoctorProfile(req, res) {
    const { portal_user_id } = req.query;
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };
      let result = await BasicInfo.find({
        for_portal_user: mongoose.Types.ObjectId(portal_user_id),
      })
      .populate({
        path: "for_portal_user",
        select: {
          email: 1,
          country_code: 1,
          mobile: 1,
          role: 1,
          notification: 1,
        },
      })
      .populate({
        path: "speciality",        
      })        
      .populate({
        path: "in_location",
      })
      .populate({
        path: 'in_education'
      })       
      .lean();
     
      if (result.length > 0) {
        const specialityIds = result[0].speciality; // Assuming there's only one document in the result
        const specializations = await Specialty.find({
          _id: { $in: specialityIds },
        })
          .select("specilization")
          .exec();
        let specilizationValues = specializations.map(
          (spec) => spec.specilization
        );

        let availabilityArray = [];
        availabilityArray = await DoctorAvailability.find({
          for_portal_user: portal_user_id,
        });

        const getLicenseData = result[0]?.license_details
        if (getLicenseData && getLicenseData?.license_image) {
          result[0].license_details.license_image_signed_url = await generateSignedUrl(getLicenseData?.license_image)
        }

        if (result[0]?.profile_picture) {
          result[0].profile_picture_signed_url = await generateSignedUrl(result[0]?.profile_picture)
        }

        if (result[0]?.user_picture && result[0]?.user_picture.length > 0) {
          let signedUrlArray = []
          for (const element of result[0]?.user_picture) {
              signedUrlArray.push(await generateSignedUrl(element))
          }
          adminData.user_picture_signed_urls = signedUrlArray
        }

        let categories = []
        if (result[0]?.categoryIds.length > 0) {
          const getAllCategories = await httpService.getStaging(
            "category/get-category?page=1&limit=0&searchText=&status=active",
            "",
            headers,
            "superadminServiceUrl"
          );
          if (getAllCategories?.status) {
            let categoryData = {}
            getAllCategories?.body?.result.map(category => {
              categoryData[category._id] = category
            })
            categories = result[0]?.categoryIds.map(category => categoryData[category])
          }
        }

        sendResponse(req, res, 200, {
          status: true,
          data: {
            result,
            availabilityArray,
            specilizationValues,
            categories
          },
          message: messages.doctorDetailsFetched.en,
          messageArabic: messages.doctorDetailsFetched.ar,
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 200, {
          status: false,
          data: null,
          message: messages.doctorDetailsFetched.en,
          messageArabic: messages.doctorDetailsFetched.ar,
          errorCode: null,
        });
      }
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: error.message ? error.message : "Something went wrong",
        errorCode: error.code ? error.code : "Internal server error",
      });
    }
  }

// This code is for add off days for doctor 26 Feb Altamash

async doctorManagementUpdateAvailability(req, res) {
  const { portal_user_id, availability } = req.body;

  try {
    if (!portal_user_id || !availability) {
      return sendResponse(req, res, 400, {
        status: false,
        data: null,
        message: "Missing required fields",
        errorCode: "MISSING_FIELDS",
      });
    }

    // Doctor availability find k liye
    let doctorAvailability = await DoctorAvailability.findOne({
      for_portal_user: mongoose.Types.ObjectId(portal_user_id),
    });

    if (!doctorAvailability) {
      return sendResponse(req, res, 404, {
        status: false,
        data: null,
        message: "Doctor availability not found",
        errorCode: "NOT_FOUND",
      });
    }

    // Agar week_days nahi hai ya empty hai
    if (!doctorAvailability.week_days || doctorAvailability.week_days.length === 0) {
      return sendResponse(req, res, 400, {
        status: false,
        data: null,
        message: "Doctor week_days not configured",
        errorCode: "NO_WEEK_DAYS",
      });
    }

    // Update sirf jo days false/true diye gaye hain
    let updatedWeekDays = doctorAvailability.week_days.map((day) => {
      let updatedDay = { ...day._doc }; 

      Object.keys(availability).forEach((key) => {
        if (availability[key] === false) {
          // Agar false bheja hai to empty string kar do
          updatedDay[`${key}_start_time`] = "";
          updatedDay[`${key}_end_time`] = "";
        } else if (availability[key] === true) {
          // Agar true bheja hai to koi default ya previous value assign karo
          updatedDay[`${key}_start_time`] = updatedDay[`${key}_start_time`] || "1000"; // Default: 10:00 AM
          updatedDay[`${key}_end_time`] = updatedDay[`${key}_end_time`] || "1800"; // Default: 6:00 PM
        }
      });

      return updatedDay;
    });

    // MongoDB me sirf required update apply karo
    await DoctorAvailability.updateOne(
      { for_portal_user: mongoose.Types.ObjectId(portal_user_id) },
      { $set: { week_days: updatedWeekDays } }
    );

    // Updated data wapas fetch karlo
    let updatedDoctorAvailability = await DoctorAvailability.findOne({
      for_portal_user: mongoose.Types.ObjectId(portal_user_id),
    });

    return sendResponse(req, res, 200, {
      status: true,
      data: updatedDoctorAvailability,
      message: "Doctor availability updated successfully",
      errorCode: null,
    });

  } catch (error) {
    return sendResponse(req, res, 500, {
      status: false,
      body: error,
      message: error.message ? error.message : "Something went wrong",
      errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
    });
  }
}


  async doctorManagementViewBasicInfo(req, res) {
    const { portal_user_id } = req.query;
    try {
      const pathology_tests = await PathologyTestInfoNew.find({
        for_portal_user: portal_user_id,
      });
      const result = await BasicInfo.find({
        for_portal_user: { $eq: portal_user_id },
      })
        .populate({
          path: "for_portal_user",
          select: { email: 1, country_code: 1, mobile: 1, notification: 1 },
        })
        .populate({
          path: "speciality",
          select: { specilization: 1 },
        })
        .populate({
          path: "in_location",
        })
        .populate({
          path: "profile_picture",
          select: "url",
        })
        .exec();

      sendResponse(req, res, 200, {
        status: true,
        data: { result, pathology_tests },
        message: messages.doctorBasicInfo.en,
        messageArabic: messages.doctorBasicInfo.ar,
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

  async doctorManagementListDoctor(req, res) {
    let { hospital_portal_id, page, limit, searchKey } = req.query;
    let sort = req.query.sort;
    let sortingarray = {};
    if (sort != "undefined" && sort != "" && sort != undefined) {
      let keynew = sort.split(":")[0];
      let value = sort.split(":")[1];
      sortingarray[keynew] = Number(value);
    } else {
      sortingarray["for_portal_user.createdAt"] = -1;
    }

    let checkUser = await PortalUser.findOne({
      _id: mongoose.Types.ObjectId(hospital_portal_id),
    });

    if (checkUser.role === "HOSPITAL_STAFF") {
      await StaffInfo.findOne({
        for_portal_user: mongoose.Types.ObjectId(hospital_portal_id),
      });
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
      let filter = {
        "for_portal_user.role": {
          $in: ["HOSPITAL_DOCTOR", "INDIVIDUAL_DOCTOR"],
        },
        "for_portal_user.isDeleted": false,
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
        {
          $lookup: {
            from: "services",
            localField: "services",
            foreignField: "_id",
            as: "services",
          },
        },
        { $unwind: { path: "$services", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "departments",
            localField: "department",
            foreignField: "_id",
            as: "departments",
          },
        },
        { $unwind: { path: "$departments", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "specialties",
            localField: "speciality",
            foreignField: "_id",
            as: "speciality1",
          },
        },
        {
          $lookup: {
            from: "units",
            localField: "unit",
            foreignField: "_id",
            as: "unit",
          },
        },
        { $unwind: { path: "$unit", preserveNullAndEmptyArrays: true } },
        { $match: filter },
        {
          $project: {
            first_name: 1,
            middle_name: 1,
            last_name: 1,
            full_name: 1,
            license_details: 1,
            speciality: { $ifNull: ["$speciality1.specilization", ""] },
            services: "$services.service",
            department: "$departments.department",
            unit: "$unit.unit",
            for_portal_user: {
              _id: "$for_portal_user._id",
              email: "$for_portal_user.email",
              country_code: "$for_portal_user.country_code",
              phone_number: "$for_portal_user.mobile",
              lock_user: "$for_portal_user.lock_user",
              isActive: "$for_portal_user.isActive",
              createdAt: "$for_portal_user.createdAt",
              role: "$for_portal_user.role",
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
      sendResponse(req, res, 200, {
        status: true,
        data: {
          data: result,
          totalCount: totalCount.length,
        },
        message: messages.hospitalDoctorFetched.en,
        messageArabic: messages.hospitalDoctorFetched.ar,
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

  async doctorManagementRequestList(req, res) {
    let { hospital_portal_id, page, limit, searchKey } = req.query;
    try {
      let sort = req.query.sort;
      let sortingarray = {};
      if (sort != "undefined" && sort != "" && sort != undefined) {
        let keynew = sort.split(":")[0];
        let value = sort.split(":")[1];
        sortingarray[keynew] = Number(value);
      } else {
        sortingarray["for_portal_user.createdAt"] = -1;
      }

      let checkUser = await PortalUser.findOne({
        _id: mongoose.Types.ObjectId(hospital_portal_id),
      });

      if (checkUser.role === "HOSPITAL_STAFF") {
        await StaffInfo.findOne({
          for_portal_user: mongoose.Types.ObjectId(hospital_portal_id),
        });
      }
      let filter = {
        "for_portal_user.role": { $in: ["INDIVIDUAL_DOCTOR"] },
        "for_portal_user.isDeleted": false,
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
        { $match: filter },
        {
          $lookup: {
            from: "services",
            localField: "services",
            foreignField: "_id",
            as: "services",
          },
        },
        { $unwind: { path: "$services", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "specialties",
            localField: "speciality",
            foreignField: "_id",
            as: "speciality",
          },
        },
        { $unwind: { path: "$speciality", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: "$_id", // Group by the unique identifier (document _id)
            first_document: { $first: "$$ROOT" }, // Select the first document in each group
          },
        },
        {
          $replaceRoot: { newRoot: "$first_document" }, // Replace the root with the grouped document
        },
        {
          $project: {
            first_name: 1,
            middle_name: 1,
            last_name: 1,
            full_name: 1,
            license_details: 1,
            speciality: "$speciality.specilization",
            services: "$services.service",
            department: 1,
            unit: 1,
            for_portal_user: {
              _id: "$for_portal_user._id",
              email: "$for_portal_user.email",
              country_code: "$for_portal_user.country_code",
              phone_number: "$for_portal_user.mobile",
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
      sendResponse(req, res, 200, {
        status: true,
        data: {
          data: result,
          totalCount: totalCount.length,
        },
        message: messages.hospitalDoctorFetched.en,
        messageArabic: messages.hospitalDoctorFetched.ar,
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

  async acceptOrRejectDoctorRequest(req, res) {
    const { action, doctor_portal_id, hospital_id } = req.body;

    try {
      let result;

      if (action === "accept") {
        result = await BasicInfo.updateOne(
          { for_portal_user: doctor_portal_id },
        );

        await BasicInfo.updateOne(
          { for_portal_user: doctor_portal_id },
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
          message: `Doctor ${action} successfully`,
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

  async doctorManagementActiveLockDeleteDoctor(req, res) {
    try {
      const { action_name, action_value, doctor_portal_id } = req.body;
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
        await PortalUser.findOneAndUpdate(
          { _id: { $eq: doctor_portal_id } },
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
          data: null,
          message: `staff ${actionMessage} successfully`,
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
        body: error,
        message: "Internal server error",
        errorCode: null,
      });
    }
  }

  async getDoctorList(req, res) {
    try {
      const { page, limit, status, searchText } = req.query;
  
      // Get sort parameter
      let sort = req.query.sort;
      let sortingArray = {};
  
      // Check if sort is provided, otherwise default to descending by createdAt
      if (sort && sort !== "") {
        let key = sort.split(":")[0];
        let value = sort.split(":")[1];
        sortingArray[key] = Number(value); // -1 for descending, 1 for ascending
      } else {
        sortingArray["createdAt"] = -1; // Default sorting
      }
  
      // Role filter
      let docRoleChange = req.query.docRole === "" ? ["INDIVIDUAL_DOCTOR"] : ["INDIVIDUAL_DOCTOR", "HOSPITAL_DOCTOR"];
  
      // Base filter
      let filter = {
        "for_portal_user.role": { $in: docRoleChange },
        "for_portal_user.isDeleted": false,
        "for_portal_user.createdBy": "self",
        verify_status: status,
      };
  
      // Search filter
      if (searchText) {
        filter["$or"] = [
          { full_name: { $regex: new RegExp(searchText, "i") } },
          { "for_portal_user.email": { $regex: new RegExp(searchText, "i") } },
        ];
      }
  
      // Aggregation pipeline
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
          $lookup: {
            from: "specialties",
            localField: "speciality",
            foreignField: "_id",
            as: "speciality1",
          },
        },
        {
          $lookup: {
            from: "locationinfos",
            localField: "in_location",
            foreignField: "_id",
            as: "in_location",
          },
        },
        {
          $unwind: {
            path: "$in_location",
            preserveNullAndEmptyArrays: true, // Preserve even if no match
          },
        },
        {
          $project: {
            verify_status: 1,
            full_name: { $toLower: "$full_name" },
            license_details: 1,
            speciality: { $ifNull: ["$speciality1.specilization", ""] },
            years_of_experience: 1,
            department: 1,
            services: 1,
            unit: 1,
            in_location: 1,
            for_portal_user: {
              _id: "$for_portal_user._id",
              email: "$for_portal_user.email",
              country_code: "$for_portal_user.country_code",
              phone_number: "$for_portal_user.mobile",
              lock_user: "$for_portal_user.lock_user",
              isActive: "$for_portal_user.isActive",
              createdAt: "$for_portal_user.createdAt",
              fcmToken: "$for_portal_user.fcmToken",
            },
            updatedAt: 1,
          },
        },
      ];
  
      // Get total count before pagination
      const totalCountResult = await BasicInfo.aggregate([...aggregate, { $count: "total" }]);
      const totalCount = totalCountResult.length > 0 ? totalCountResult[0].total : 0;
  
      // Sorting
      aggregate.push({ $sort: sortingArray });
  
      // Pagination
      const numLimit = parseInt(limit, 10);
      if (numLimit !== 0) {
        const skipValue = (page - 1) * numLimit;
        aggregate.push({ $skip: skipValue }, { $limit: numLimit });
      }
  
      // Execute query
      const result = await BasicInfo.aggregate(aggregate);
  
      // Send response
      sendResponse(req, res, 200, {
        status: true,
        data: {
          data: result,
          totalCount: totalCount,
        },
        message: messages.doctorsFetched.en,
        messageArabic: messages.doctorsFetched.ar,
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
  
  
  async approveOrRejectDoctor(req, res) {
    const { verify_status, doctor_portal_id, approved_or_rejected_by } =
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
        { for_portal_user: doctor_portal_id },
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
          data: null,
          message: `${verify_status} doctor successfully`,
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
  async activeLockDeleteDoctor(req, res) {
    try {
      const { action_name, action_value, doctor_portal_id } = req.body;
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
        await PortalUser.findOneAndUpdate(
          { _id: { $eq: doctor_portal_id } },
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
          data: null,
          message: `Doctor ${actionMessage} successfully`,
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

  async doctorManagementGetLocations(req, res) {
    try {
      const { portal_user_id } = req.query;
      const results = await HospitalLocation.aggregate([
        {
          $match: { for_portal_user: mongoose.Types.ObjectId(portal_user_id) },
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
        message: messages.hospitalLocationFetched.en,
        messageArabic: messages.hospitalLocationFetched.ar,
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

  async advanceDoctorFilter(req, res) {
    try {
      const {
       gender,
       previousDoctor
      } = req.body;

      const pipeline = [
        {
          $lookup: {
            from: 'educationaldetails',
            localField: 'in_education',
            foreignField: '_id',
            as: 'educationaldetails'
          }
        },
        {
          $unwind: { path: '$educationaldetails', preserveNullAndEmptyArrays: true}
        },
        {
          $lookup: {
            from: 'portalusers',
            localField: 'for_portal_user',
            foreignField: '_id',
            as: 'portalusers'
          }
        },
        {
          $unwind: { path: '$portalusers', preserveNullAndEmptyArrays: true }
        },
        {
          $addFields: {
            isDeleted: '$portalusers.isDeleted',
            verified: '$portalusers.verified',
            lock_user: '$portalusers.lock_user',
            isActive: '$portalusers.isActive',
            average_rating: '$portalusers.average_rating',
          }
        },
        {
          $match: {
            gender,
            isDeleted: false,
            verified: true,
            isActive: true,
            lock_user: false,
          }
        },
        {
          $lookup: {
              from: 'appointments',
              let: { userId: '$for_portal_user' },
              pipeline: [
                  { $match: 
                    { $expr: 
                      { $and: 
                        [
                          { $eq: ['$doctorId', '$$userId'] }, 
                          { $in: ['$status', ['PENDING', 'APPROVED']] }
                        ] 
                      } 
                    } 
                  },
                  { $count: 'appointmentCount' }
              ],
              as: 'completedAppointments'
          }
        },
        {
            $addFields: {
                appointments_count: { $ifNull: [{ $arrayElemAt: ['$completedAppointments.appointmentCount', 0] }, 0] }
            }
        },
        {
          $group: {
            _id: "$_id",
            name: { $first: "$full_name" },
            name_arabic: { $first: "$full_name_arabic" },
            years_of_experience: { $first: "$years_of_experience" },
            for_portal_user: { $first: "$for_portal_user" },
            about: { $first: "$about" },
            about_arabic: { $first: "$about_arabic" },
            speciality: { $first: "$speciality" },
            average_rating: { $first: "$average_rating" },
            education_details: { $first: "$educationaldetails.education_details" },
            appointments_count: { $first: "$appointments_count" },
            createdAt: { $first: "$createdAt" },
            profile_picture: {$first: "$profile_picture" }
          }
        },
        {
          $sort: {
            appointments_count: 1
          }
        },
        {
          $facet: {
              totalCount: [
                  {
                      $count: 'count'
                  }
              ],
              paginatedResults: [
                { $skip: 0 }, 
                { $limit: 1000 },
              ],
          }
        }
      ]
   
      const result = await BasicInfo.aggregate(pipeline);

      let finalDoctor = {}
      for (const doctor of result[0]?.paginatedResults) {
        if (previousDoctor.includes(doctor.for_portal_user.toString())) {
          continue;
        } else {
          //Get all specialities
          const specialities = await Specialty.find({active_status: true, delete_status: false})
          const specialitiesObject = {}
          for (const elem of specialities) {
            specialitiesObject[elem._id] = {
              specilization: elem?.specilization,
              specilization_arabic: elem?.specilization_arabic,
            }
          }
          let doctorSpecialty = []
          let doctorSpecialtyArabic = []
          if (doctor.speciality.length > 0) {
            doctorSpecialty = doctor.speciality.map(specialty => specialitiesObject[specialty.toString()]?.specilization)
            doctorSpecialtyArabic = doctor.speciality.map(specialty => specialitiesObject[specialty.toString()]?.specilization_arabic)
          }
          //Get All review
          const getRatingCount = await ReviewAndRating.find({ userId: { $eq: doctor.for_portal_user }}).countDocuments();
          finalDoctor['_id'] = doctor._id
          finalDoctor['for_portal_user'] = doctor.for_portal_user
          finalDoctor['doctorName'] = doctor.name
          finalDoctor['doctorNameArabic'] = doctor.name_arabic
          // finalDoctor['doctorProfile'] = ''
          finalDoctor['years_of_experience'] = doctor.years_of_experience
          finalDoctor['about'] = doctor.about
          finalDoctor['about_arabic'] = doctor.about_arabic
          finalDoctor['education_details'] = doctor.education_details
          finalDoctor['specialty'] = doctorSpecialty
          finalDoctor['specialtyArabic'] = doctorSpecialtyArabic
          finalDoctor['average_rating'] = doctor.average_rating
          finalDoctor['totalReview'] = getRatingCount
          if(doctor.profile_picture != ''){
            finalDoctor['doctorProfile'] = await generateSignedUrl(doctor.profile_picture)
          }else{
            finalDoctor['doctorProfile'] = ''
          }
          break;
        }
      }

      return sendResponse(req, res, 200, {
        status: true,
        message: Object.values(finalDoctor).length > 0 ? `Successfully get doctor list` : "No more doctor available",
        data: {
          doctorDetails: finalDoctor,
        },
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        data: error,
        message: error.message ? error.message : `Failed to get doctor list`,
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }
  
  async viewAppointmentByRoomName(req, res) {
    try {

      const { roomname, appointment_id } = req.query;
      let result = {};
      if (appointment_id == undefined) {
        result = await Appointment.findOne({ roomName: roomname });
      } else {
        result = await Appointment.findOne({ _id: appointment_id });
      }
      let userinfodetails = [];
      if (result?.users) {
        userinfodetails = result.users;
      }
      let participantsinfodetails = [];
      if (result?.participants) {
        participantsinfodetails = result.participants;
      }
      let roomdetails = {
        roomName: result.roomName,
        callstatus: result.callstatus,
        callerId: result.callerId,
        roomDate: result.roomDate,
        appointmentId: result._id,
      };

      sendResponse(req, res, 200, {
        status: true,
        data: { roomdetails, userinfodetails, participantsinfodetails },
        message: messages.patientAppointmentFetched.en,
        messageArabic: messages.patientAppointmentFetched.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: error.message,
        errorCode: error.code,
      });
    }
  }

  async updateUnreadMessage(req, res) {
    try {
      const user_id = req.query.id;
      const chatId = req.query.chatId;

      const result = await Appointment.findOneAndUpdate(
        {
          _id: chatId,
          "chatmessage.receiver.id": user_id,
          "chatmessage.receiver.read": true,
        },
        { $set: { "chatmessage.$[elem].receiver.$[innerElem].read": false } },
        {
          new: true,
          arrayFilters: [
            { "elem.receiver.id": user_id },
            { "innerElem.read": true },
          ],
        }
      );

      sendResponse(req, res, 200, {
        status: true,
        data: { result: result },
        message: `Message field updated fetched successfully`,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: error.message,
        errorCode: error.code,
      });
    }
  }

  async viewAppointmentCheck(req, res) {
    try {
      const { appointment_id } = req.query;
      let result = {};

      result = await Appointment.findOne({
        _id: appointment_id,
        status: "APPROVED",
      });
      if (result) {
        sendResponse(req, res, 200, {
          status: true,
          data: { appointment_id: appointment_id },
          message: messages.patientAppointmentFetched.en,
          messageArabic: messages.patientAppointmentFetched.ar,
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 500, {
          status: false,
          body: "Appointment not found.",
          message: messages.appointmentNotFound.en,
          messageArabic: messages.appointmentNotFound.ar,
        });
      }
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: error.message,
        errorCode: error.code,
      });
    }
  }

  async UpdateVideocallAppointment(req, res) {

    try {
      const {
        appointmentId,
        callstatus,
        roomName,
        callerId,
        roomDate,
        participants,
        participantstype,
        leftparticipantsid,
        participantuserId,
        isAudioMuted,
        isVideoMuted,
      } = req.body;
      let appointmentDetails;
      if (participantuserId != undefined) {
        appointmentDetails = await Appointment.findOneAndUpdate(
          { "participants.userId": participantuserId },
          {
            $set: {
              "participants.$.isAudioMuted": isAudioMuted,
              "participants.$.isVideoMuted": isVideoMuted,
            },
          },
          { new: true }
        );
      } else {
        if (participants != undefined) {
          if (participantstype == "add") {

            appointmentDetails = await Appointment.findOneAndUpdate(
              { _id: appointmentId },
              { $push: { participants: participants } },
              { new: true }
            );
          } else {
            appointmentDetails = await Appointment.findOneAndUpdate(
              { _id: appointmentId },
              {
                $pull: {
                  participants: {
                    userId: mongoose.Types.ObjectId(leftparticipantsid),
                  },
                },
              },
              { new: true }
            );
          }
        } else {
          appointmentDetails = await Appointment.findOneAndUpdate(
            { _id: appointmentId },
            {
              $set: {
                callstatus,
                roomName,
                callerId,
                roomDate,
              },
            },

            { upsert: false, new: true }
          ).exec();
        }
      }

      sendResponse(req, res, 200, {
        status: true,
        body: appointmentDetails,
        message: messages.appointmentUpdated.en,
        messageArabic: messages.appointmentUpdated.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `failed to add appointment`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async UpdateVideocallchatmessage(req, res) {

    try {
      const { appointmentId, chatmessage } = req.body;
      let appointmentDetails;

      if (chatmessage != undefined) {
        appointmentDetails = await Appointment.findOneAndUpdate(
          { _id: appointmentId },
          { $push: { chatmessage: chatmessage } },
          { new: true }
        );

        const messageSavedToChat = await saveVideoCallMessagesToChat(chatmessage)
        if(messageSavedToChat){
          console.log("Message Updated To Chat Successfully!");
        }else{
          sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: `failed to updated messages Into Chat`,
            errorCode: "INTERNAL_SERVER_ERROR",
          });
        }

        // }
        // else {
        //   appointmentDetails = await Appointment.findOneAndUpdate(
        //     { _id: appointmentId },
        //     {
        //       $pull: {
        //         participants: {
        //           userId: mongoose.Types.ObjectId(leftparticipantsid),
        //         },
        //       },
        //     },
        //     { new: true }
        //   );
        // }
      }

      sendResponse(req, res, 200, {
        status: true,
        body: appointmentDetails,
        message: messages.appointmentUpdated.en,
        messageArabic: messages.appointmentUpdated.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `failed to add appointment`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async updateAppointmentData(req, res) {
    try {
      const { appointment_id, columnData } = req.body;

      await Appointment.findOneAndUpdate(
        { _id: { $eq: appointment_id } },
        {
          $set: columnData,
        },
        { new: true }
      ).exec();

      sendResponse(req, res, 200, {
        status: true,
        data: null,
        message: messages.updateSuccess,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `something went wrong while updating appointment`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async assignHealthcareProvider(req, res) {
    try {
      const { appointment_id, staff_id } = req.body;
      await Appointment.updateOne(
        { _id: { $eq: appointment_id } },
        {
          $set: {
            assigned_staff: staff_id,
          },
        },
        { new: true }
      ).exec();
      sendResponse(req, res, 200, {
        status: true,
        data: null,
        message: messages.healthcareProviderAssign.en,
        messageArabic: messages.healthcareProviderAssign.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `something went wrong while assig healthcare provider`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async allDoctors(req, res) {
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };

      let filter = {
        "for_portal_user.isDeleted": false,
        "for_portal_user.createdBy": "self",
        verify_status: "APPROVED",
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
            for_portal_user: 1,
            _id: 0,
            for_portal_user: {
              _id: "$for_portal_user._id",
              email: "$for_portal_user.email",
              country_code: "$for_portal_user.country_code",
              phone_number: "$for_portal_user.mobile",
            },
            updatedAt: 1,
          },
        },
      ];
      const alldoctors = await BasicInfo.aggregate(aggregate);

      let fourPortalData = await httpService.getStaging(
        "labradio/get-fourportal-registered-user",
        {},
        headers,
        "labradioServiceUrl"
      );

      let fourPortalDataResponse;

      if (fourPortalData.data) {
        fourPortalDataResponse = fourPortalData.data;
      }

      let allResult = [...alldoctors, ...fourPortalDataResponse];

      sendResponse(req, res, 200, {
        status: true,
        data: allResult,
        message: messages.getAllDoctor.en,
        messageArabic: messages.getAllDoctor.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `Failed to get all doctors`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async allDoctorsHopitalizationList(req, res) {
    try {

      const result = await BasicInfo.find({ verify_status: "APPROVED" })
        .select({
          first_name: 1,
          middle_name: 1,
          last_name: 1,
          full_name: 1,
          for_portal_user: 1,
          _id: 0,
        })
        .populate({
          path: "for_portal_user",
          match: { isDeleted: false }, // Add this match condition
        });

      sendResponse(req, res, 200, {
        status: true,
        data: result,
        message: messages.getAllDoctor.en,
        messageArabic: messages.getAllDoctor.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `Failed to get all doctors`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getRelatedDoctors(req, res) {
    try {
      const { speciality, limit, current_doctor_id } = req.query;

      const filter = {
        speciality: mongoose.Types.ObjectId(speciality),
        for_portal_user: { $ne: mongoose.Types.ObjectId(current_doctor_id) },
        "for_portal_user_d.isDeleted": false,
        "for_portal_user_d.lock_user": false,
        "for_portal_user_d.isActive": true,
      };
      const project = {
        full_name: 1,
        years_of_experience: 1,
        profile_picture: "$profile_picture.url",
        fee_management: {
          online: "$in_fee_management.online",
          home_visit: "$in_fee_management.home_visit",
          f2f: "$in_fee_management.f2f",
        },
        about: 1,
        portal_user_data: {
          mobile: "$for_portal_user_d.mobile",
          email: "$for_portal_user_d.email",
          country_code: "$for_portal_user_d.country_code",
          portal_user_id: "$for_portal_user_d._id",
          average_rating: "$for_portal_user_d.average_rating",
        },
        services: "$services.service",
        speciality: "$specialties.specilization",
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
        /*  {
          $lookup: {
            from: 'documentinfos',
            localField: 'profile_picture',
            foreignField: '_id',
            as: 'profile_picture'
          }
        },
        { $unwind: "$profile_picture" }, */
        {
          $lookup: {
            from: "feemanagements",
            localField: "in_fee_management",
            foreignField: "_id",
            as: "in_fee_management",
          },
        },
        { $unwind: "$in_fee_management" },
        {
          $lookup: {
            from: "specialties",
            localField: "speciality",
            foreignField: "_id",
            as: "specialties",
          },
        },
        { $unwind: "$specialties" },
        { $match: filter },
        //{ $project: project },
        // { $limit: limit * 1 }
      ];
      let result = await BasicInfo.aggregate(aggregate);

      let relatedDataArray = [];

      for (const data of result) {
        try {
          const fullImageUrl = "";
          const getRatingCount = await ReviewAndRating.find({
            portal_user_id: { $eq: data.for_portal_user_d._id },
          }).countDocuments();

          const doctor_rating = {
            average_rating: data.for_portal_user_d.average_rating
              ? data.for_portal_user_d.average_rating
              : 0,
            total_review: getRatingCount,
          };

          // Update the doctor_rating and profile_picture with the updated URL
          const updatedData = {
            ...data,
            doctor_rating,
            profile_picture: fullImageUrl,
          };

          relatedDataArray.push(updatedData);
        } catch (error) {
          console.error("Error getting full image URL:", error);
        }
      }

      sendResponse(req, res, 200, {
        status: true,
        data: { result: relatedDataArray },
        message: messages.getRelatedDoctor.en,
        messageArabic: messages.getRelatedDoctor.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: error.message
          ? error.message
          : `Failed to get related doctors`,
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getRelatedDoctorsForFourPortals(req, res) {
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };

      const { speciality, limit } = req.query;

      const filter = {
        speciality: mongoose.Types.ObjectId(speciality),
        "for_portal_user_d.isDeleted": false,
        "for_portal_user_d.lock_user": false,
        "for_portal_user_d.isActive": true,
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
        {
          $lookup: {
            from: "feemanagements",
            localField: "in_fee_management",
            foreignField: "_id",
            as: "in_fee_management",
          },
        },
        { $unwind: "$in_fee_management" },
        { $match: filter },
        { $limit: limit * 1 },
      ];
      let result = await BasicInfo.aggregate(aggregate);

      let relatedDataArray = [];

      for (const data of result) {
        try {
          const fullImageUrl = "";

          const speciality = await httpService.getStaging(
            "hospital/get-speciality-data",
            { data: data.speciality },
            headers,
            "hospitalServiceUrl"
          );

          const getRatingCount = await ReviewAndRating.find({
            portal_user_id: { $eq: data.for_portal_user_d._id },
          }).countDocuments();

          const doctor_rating = {
            average_rating: data.for_portal_user_d.average_rating
              ? data.for_portal_user_d.average_rating
              : 0,
            total_review: getRatingCount,
          };

          // Update the doctor_rating and profile_picture with the updated URL
          const updatedData = {
            ...data,
            doctor_rating,
            profile_picture: fullImageUrl,
            specialityInfo: speciality.data[0],
          };

          relatedDataArray.push(updatedData);
        } catch (error) {
          console.error("Error getting full image URL:", error);
        }
      }

      sendResponse(req, res, 200, {
        status: true,
        data: { result: relatedDataArray },
        message: messages.getRelatedDoctor.en,
        messageArabic: messages.getRelatedDoctor.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: error.message
          ? error.message
          : `Failed to get related doctors`,
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  //Template Builder
  async addTemplate(req, res) {
    try {
      const {
        templateId,
        templateName,
        templateCategory,
        templateJSON,
        doctorId,
      } = req.body;

      const templateNameExist = await Template.findOne({
        template_name: templateName,
        isDeleted: false,
        for_portal_user: doctorId,
      });

      if (templateNameExist) {
        if (templateId != "") {
          const checkForEdit = await Template.findOne({ _id: templateId });

          if (checkForEdit?.template_name != templateName) {
            return sendResponse(req, res, 200, {
              status: false,
              body: null,
              message: messages.templateNameTaken.en,
              messageArabic: messages.templateNameTaken.ar,
              errorCode: null,
            });
          }
        } else {
          return sendResponse(req, res, 200, {
            status: false,
            body: null,
            message: messages.templateUnique.en,
            messageArabic: messages.templateUnique.ar,
            errorCode: null,
          });
        }
      }

      let result;

      if (templateId == "") {
        const templateInfo = new Template({
          template_name: templateName,
          template_category: templateCategory,
          template_json: templateJSON,
          for_portal_user: doctorId,
        });
        result = await templateInfo.save();
      } else {
        result = await Template.findOneAndUpdate(
          { _id: templateId },
          {
            $set: {
              template_name: templateName,
              template_category: templateCategory,
              template_json: templateJSON,
            },
          },
          { new: true }
        );

      }
      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: messages.templateUpdate.en,
        messageArabic: messages.templateUpdate.ar,
        errorCode: null,
      });
    } catch (error) {
      if ((error.code = 11000)) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: messages.templateUnique.en,
          messageArabic: messages.templateUnique.ar,
          errorCode: "UNIQUE_KEY",
        });
      }
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "failed to create template",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async templateList(req, res) {
    try {
      const { doctorId, page, limit, searchText } = req.query;
      let sort = req.query.sort;
      let sortingarray = {};
      if (sort != "undefined" && sort != "" && sort != undefined) {
        let keynew = sort.split(":")[0];
        let value = sort.split(":")[1];
        sortingarray[keynew] = value;
      } else {
        sortingarray["createdAt"] = -1;
      }
      let filter;
      if (searchText == "") {
        filter = {
          for_portal_user: doctorId,
          isDeleted: false,
        };
      } else {
        filter = {
          for_portal_user: doctorId,
          isDeleted: false,
          $or: [
            { template_name: { $regex: searchText || "", $options: "i" } },
            { template_category: { $regex: searchText || "", $options: "i" } },
          ],
        };
      }
      let result;
      if (limit == 0) {
        result = await Template.find(filter).sort(sortingarray).exec();
      } else {
        result = await Template.find(filter)
          .sort(sortingarray)
          .skip((page - 1) * limit)
          .limit(limit * 1)
          .exec();
      }
      const count = await Template.countDocuments(filter);
      sendResponse(req, res, 200, {
        status: true,
        body: {
          result,
          count,
        },
        message: messages.getTemplateList.en,
        messageArabic: messages.getTemplateList.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "failed to get template list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async templateDetails(req, res) {
    try {
      const { templateId } = req.query;
      const result = await Template.findOne({ _id: templateId });
      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: messages.getTemplateDetail.en,
        messageArabic: messages.getTemplateDetail.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "failed to get template details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async templateDelete(req, res) {
    try {
      const { templateId } = req.body;
      let result;
      result = await Template.findOneAndUpdate(
        { _id: templateId },
        {
          $set: {
            isDeleted: true,
          },
        },
        { new: true }
      );
      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: messages.templateDetailDeleted.en,
        messageArabic: messages.templateDetailDeleted.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "failed to deleted template details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async createEprescription(req, res) {
    const {
      appointmentId,
      doctorId,
      ePrescriptionNumber,
      patientBiometric,
      liverFailure,
      renalFailure,
      allergies,
      medicalHistory,
      accidentRelated,
      occupationalDesease,
      freeOfCharge,
    } = req.body;

    try {
      if (appointmentId == "") {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: messages.appointmentIdRequired.en,
          messageArabic: messages.appointmentIdRequired.ar,
          errorCode: null,
        });
      }

      let result;

      if (ePrescriptionNumber == "") {
        const ePrescNumber = await getNextSequenceValue("ePrescriptionNumber"); //Create New ePrescription Number

        const prescriptionInfo = new Eprescription({
          appointmentId,
          doctorId,
          ePrescriptionNumber: "PRESC-" + ePrescNumber,
          patientBiometric,
          liverFailure,
          renalFailure,
          allergies,
          medicalHistory,
          accidentRelated,
          occupationalDesease,
          freeOfCharge,
        });

        result = await prescriptionInfo.save();
      } else {
        result = await Eprescription.findOneAndUpdate(
          { ePrescriptionNumber, appointmentId: appointmentId },
          {
            $set: {
              patientBiometric,
              liverFailure,
              renalFailure,
              allergies,
              medicalHistory,
              accidentRelated,
              occupationalDesease,
              freeOfCharge,
            },
          },
          { new: true }
        ).exec();


      }

      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: messages.EprescriptionUpdate.en,
        messageArabic: messages.EprescriptionUpdate.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to create eprescription",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async addEprescriptionMedicineDosage(req, res) {
    const { dosages } = req.body;

    try {
      dosages.forEach(async (element) => {
        await EprescriptionMedicineDosage.findOneAndUpdate(
          {
            ePrescriptionId: element.ePrescriptionId,
            dose_no: element.dose_no,
            medicineId: element.medicineId,
          },
          { $set: element },
          { upsert: true, new: true }
        );
      });
      sendResponse(req, res, 200, {
        status: true,
        body: null,
        message: messages.dosageAdd.en,
        messageArabic: messages.dosageAdd.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to add medicine dosages",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async addEprescriptionLabTest(req, res) {
    const {
      _id,
      ePrescriptionId,
      doctorId,
      labId,
      lab_name,
      reason_for_lab,
      relevant_clinical_information,
      specific_instruction,
      comment,
    } = req.body;

    try {
      let result;

      if (_id == "" || _id == null) {
        const labData = new EprescriptionLab({
          ePrescriptionId,
          doctorId,
          labId,
          lab_name,
          reason_for_lab,
          relevant_clinical_information,
          specific_instruction,
          comment,
        });

        await labData.save();
      } else {
        let obj = {
          reason_for_lab,
          relevant_clinical_information,
          specific_instruction,
          comment,
        };

        result = await EprescriptionLab.findOneAndUpdate(
          { _id: _id },
          { $set: obj },
          { new: true }
        );

        if (result == null) {
          return sendResponse(req, res, 200, {
            status: false,
            body: result,
            message: messages.recordNotFound.en,
            messageArabic: messages.recordNotFound.ar,
            errorCode: null,
          });
        }
      }

      sendResponse(req, res, 200, {
        status: true,
        body: null,
        message:messages.labTestAdd.en,
        messageArabic:messages.labTestAdd.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to add Lab Test",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async addEprescriptionImagingTest(req, res) {
    const {
      _id,
      ePrescriptionId,
      doctorId,
      imagingId,
      imaging_name,
      reason_for_imaging,
      relevant_clinical_information,
      specific_instruction,
      comment,
    } = req.body;

    try {
      let result;

      if (_id == "" || _id == null) {
        const labData = new EprescriptionImaging({
          ePrescriptionId,
          imagingId,
          doctorId,
          imaging_name,
          reason_for_imaging,
          relevant_clinical_information,
          specific_instruction,
          comment,
        });

        result = await labData.save();
      } else {
        let obj = {
          reason_for_imaging,
          relevant_clinical_information,
          specific_instruction,
          comment,
        };

        result = await EprescriptionImaging.findOneAndUpdate(
          { _id: _id },
          { $set: obj },
          { new: true }
        );
        if (result == null) {
          return sendResponse(req, res, 200, {
            status: false,
            body: result,
            message: messages.recordNotFound.en,
            messageArabic: messages.recordNotFound.ar,
            errorCode: null,
          });
        }

      }

      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: messages.imageTestUpdate.en,
        messageArabic: messages.imageTestUpdate.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed To Imaging Test",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async addEprescriptionVaccination(req, res) {
    const {
      _id,
      ePrescriptionId,
      doctorId,
      vaccinationId,
      vaccination_name,
      dosage,
      comment,
    } = req.body;

    try {
      let result;

      if (_id == "" || _id == null) {
        const labData = new EprescriptionVaccination({
          ePrescriptionId,
          vaccinationId,
          doctorId,
          vaccination_name,
          dosage,
          comment,
        });

        result = await labData.save();
      } else {
        let obj = {
          dosage,
          comment,
        };

        result = await EprescriptionVaccination.findOneAndUpdate(
          { _id: _id },
          { $set: obj },
          { new: true }
        );
        if (result == null) {
          return sendResponse(req, res, 200, {
            status: false,
            body: result,
            message: messages.recordNotFound.en,
            messageArabic: messages.recordNotFound.ar,
            errorCode: null,
          });
        }
      }

      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: messages.vaccinationTestUpdate.en,
        messageArabic: messages.vaccinationTestUpdate.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed To Imaging Test",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async addEprescriptionEyeglass(req, res) {
    const {
      _id,
      ePrescriptionId,
      eyeglassId,
      doctorId,
      eyeglass_name,
      left_eye,
      right_eye,
      treatments,
      visual_acuity,
      comment,
    } = req.body;

    try {
      let result;

      if (_id == "" || _id == null) {
        const labData = new EprescriptionEyeglass({
          ePrescriptionId,
          eyeglassId,
          doctorId,
          eyeglass_name,
          left_eye,
          right_eye,
          treatments,
          visual_acuity,
          comment,
        });

        result = await labData.save();
      } else {
        let obj = {
          left_eye,
          right_eye,
          treatments,
          visual_acuity,
          comment,
        };

        result = await EprescriptionEyeglass.findOneAndUpdate(
          { _id: _id },
          { $set: obj },
          { new: true }
        );
        if (result == null) {
          return sendResponse(req, res, 200, {
            status: false,
            body: result,
            message: messages.recordNotFound.en,
            messageArabic: messages.recordNotFound.ar,
            errorCode: null,
          });
        }
      }

      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: messages.eyeGlassTestUpdate.en,
        messageArabic: messages.eyeGlassTestUpdate.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed To Imaging Test",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async addEprescriptionOther(req, res) {
    const {
      _id,
      ePrescriptionId,
      doctorId,
      otherId,
      other_name,
      reason_for_other,
      relevant_clinical_information,
      specific_instruction,
      comment,
    } = req.body;

    try {
      let result;
      let message;

      if (_id == "" || _id == null) {
        const labData = new EprescriptionOther({
          ePrescriptionId,
          otherId,
          doctorId,
          other_name,
          reason_for_other,
          relevant_clinical_information,
          specific_instruction,
          comment,
        });

        await labData.save();
      } else {
        let obj = {
          reason_for_other,
          relevant_clinical_information,
          specific_instruction,
          comment,
        };

        result = await EprescriptionOther.findOneAndUpdate(
          { _id: _id },
          { $set: obj },
          { new: true }
        );
        message = "Other Test Updated Successfully";

        if (result == null) {
          return sendResponse(req, res, 200, {
            status: false,
            body: result,
            message: messages.recordNotFound.en,
            messageArabic: messages.recordNotFound.ar,
            errorCode: null,
          });
        }
      }

      sendResponse(req, res, 200, {
        status: true,
        body: null,
        message: message,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to add Other Test",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getEprescription(req, res) {
    const { appointmentId } = req.query;

    try {
      let result;

      result = await Eprescription.findOne({ appointmentId });

      let environvent = process.env.NODE_ENV;

      // result.eSignature = `http://localhost:8005/hospital/esignature-for-e-prescription/${result.eSignature}`

      if (environvent == "local") {
        result.eSignature = `http://localhost:8005/hospital/esignature-for-e-prescription/${result.eSignature}`;
      } else {
        result.eSignature = `${config.test_p_Backend_url}/hospital/esignature-for-e-prescription/${result.eSignature}`;
      }

      if (result) {
        sendResponse(req, res, 200, {
          status: true,
          body: result,
          message:messages.EprescriptionFetched.en,
          messageArabic:messages.EprescriptionFetched.ar,
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: messages.EprescriptionNotFound.en,
          messageArabic: messages.EprescriptionNotFound.ar,
          errorCode: null,
        });
      }
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to get E-prescription",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getEprescriptionMedicineDosage(req, res) {
    const { ePrescriptionId, medicineId } = req.query;

    try {
      let result;

      if (medicineId) {
        result = await EprescriptionMedicineDosage.find({
          ePrescriptionId,
          medicineId,
        });
      } else {
        result = await EprescriptionMedicineDosage.find({ ePrescriptionId });
      }

      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message:messages.medicineDosageFetched.en,
        messageArabic:messages.medicineDosageFetched.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to get medicine dosage",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async deleteEprescriptionMedicineDosage(req, res) {
    const { doseId } = req.body;

    try {

      await EprescriptionMedicineDosage.findOneAndDelete({
        _id: doseId,
      });

      sendResponse(req, res, 200, {
        status: true,
        body: null,
        message: messages.medicineDosageDeleted.en,
        messageArabic: messages.medicineDosageDeleted.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to get medicine dosage",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getEprescriptionLabTest(req, res) {
    const { ePrescriptionId, labId } = req.query;

    try {
      let result;

      if (labId) {
        result = await EprescriptionLab.findOne({ ePrescriptionId, labId });
      } else {
        result = await EprescriptionLab.find({ ePrescriptionId });
      }

      if (result) {
        sendResponse(req, res, 200, {
          status: true,
          body: result,
          message: messages.labTestFetched.en,
          messageArabic: messages.labTestFetched.ar,
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: messages.labTestNotFound.en,
          messageArabic: messages.labTestNotFound.ar,
          errorCode: null,
        });
      }
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to get lab test",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getEprescriptionImagingTest(req, res) {
    const { ePrescriptionId, imagingId } = req.query;

    try {
      let result;

      if (imagingId) {
        result = await EprescriptionImaging.findOne({
          ePrescriptionId,
          imagingId,
        });
      } else {
        result = await EprescriptionImaging.find({ ePrescriptionId });
      }

      if (result) {
        sendResponse(req, res, 200, {
          status: true,
          body: result,
          message: messages.imageTestFetched.en,
          messageArabic: messages.imageTestFetched.ar,
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: messages.imageTestNotFound.en,
          messageArabic: messages.imageTestNotFound.ar,
          errorCode: null,
        });
      }
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to get imaging test",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getEprescriptionVaccinationTest(req, res) {
    const { ePrescriptionId, vaccinationId } = req.query;

    try {
      let result;

      if (vaccinationId) {
        result = await EprescriptionVaccination.findOne({
          ePrescriptionId,
          vaccinationId,
        });
      } else {
        result = await EprescriptionVaccination.find({ ePrescriptionId });
      }

      if (result) {
        sendResponse(req, res, 200, {
          status: true,
          body: result,
          message:messages.vaccinationTestFetched.en,
          messageArabic:messages.vaccinationTestFetched.ar,
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: messages.vaccinationTestNotFound.en,
          messageArabic: messages.vaccinationTestNotFound.ar,
          errorCode: null,
        });
      }
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to get vaccination test",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getEprescriptionOtherTest(req, res) {
    const { ePrescriptionId, otherId } = req.query;

    try {
      let result;

      if (otherId) {
        result = await EprescriptionOther.findOne({ ePrescriptionId, otherId });
      } else {
        result = await EprescriptionOther.find({ ePrescriptionId });
      }

      if (result) {
        sendResponse(req, res, 200, {
          status: true,
          body: result,
          message: "Other Tests fetched successfully",
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "No Other Tests Found!!",
          errorCode: null,
        });
      }
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to get other test",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getEprescriptionEyeglassTest(req, res) {
    const { ePrescriptionId, eyeglassId } = req.query;

    try {
      let result;

      if (eyeglassId) {
        result = await EprescriptionEyeglass.findOne({
          ePrescriptionId,
          eyeglassId,
        });
      } else {
        result = await EprescriptionEyeglass.find({ ePrescriptionId });
      }

      if (result) {
        sendResponse(req, res, 200, {
          status: true,
          body: result,
          message:messages.eyeGlassTestFetched.en,
          messageArabic:messages.eyeGlassTestFetched.ar,
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: messages.eyeGlassTestNotFound.en,
          messageArabic: messages.eyeGlassTestNotFound.ar,
          errorCode: null,
        });
      }
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to get eyeglass test",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getAllTests(req, res) {
    const { appointmentId } = req.query;

    try {
      let result;

      result = await Eprescription.aggregate([
        {
          $match: { appointmentId: mongoose.Types.ObjectId(appointmentId) },
        },
        {
          $lookup: {
            from: "eprescriptionmedicinedosages",
            localField: "_id",
            foreignField: "ePrescriptionId",
            as: "dosages",
          },
        },
        {
          $lookup: {
            from: "eprescriptionlabs",
            localField: "_id",
            foreignField: "ePrescriptionId",
            as: "labs",
          },
        },
        {
          $lookup: {
            from: "eprescriptionimagings",
            localField: "_id",
            foreignField: "ePrescriptionId",
            as: "imaging",
          },
        },
        {
          $lookup: {
            from: "eprescriptionvaccinations",
            localField: "_id",
            foreignField: "ePrescriptionId",
            as: "vaccinations",
          },
        },
        {
          $lookup: {
            from: "eprescriptioneyeglasses",
            localField: "_id",
            foreignField: "ePrescriptionId",
            as: "eyeglasses",
          },
        },
        {
          $lookup: {
            from: "eprescriptionothers",
            localField: "_id",
            foreignField: "ePrescriptionId",
            as: "others",
          },
        },
      ]);

      if (result) {
        sendResponse(req, res, 200, {
          status: true,
          body: result,
          message:messages.allTestFetched.en,
          messageArabic:messages.allTestFetched.ar,
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 200, {
          status: false,
          body: null,
          message:messages.noTestFound.en,
          messageArabic:messages.noTestFound.ar,
          errorCode: null,
        });
      }
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to get eyeglass test",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async addEprescriptionEsignature(req, res) {
    const { ePrescriptionId, previewTemplate, appointmentId } = req.body;
    try {
      const fileName = req.filename;

      let result;

      result = await Eprescription.findOneAndUpdate(
        { _id: ePrescriptionId },
        {
          $set: {
            eSignature: fileName,
            isValidate: true,
            previewTemplate: previewTemplate,
          },
        },
        { new: true }
      );

      if (result) {
        if (appointmentId) {
          await Appointment.findOneAndUpdate(
            { _id: mongoose.Types.ObjectId(appointmentId) },
            { $set: { isPrescriptionValidate: true } },
            { new: true }
          );
        }

        sendResponse(req, res, 200, {
          status: true,
          body: result,
          message:messages.EprescriptionValidated.en,
          messageArabic:messages.EprescriptionValidated.ar,
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: messages.EprescriptionNotFound.en,
          messageArabic: messages.EprescriptionNotFound.ar,
          errorCode: "NOT_FOUND",
        });
      }
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to validate eprescription",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async listAllEprescription(req, res) {
    const { doctorId, page, limit, appointmentType } = req.body;

    try {
      let sort = req.body.sort;
      let sortingarray = {};
      if (sort != "undefined" && sort != "" && sort != undefined) {
        let keynew = sort.split(":")[0];
        let value = sort.split(":")[1];
        sortingarray[keynew] = Number(value);
      } else {
        sortingarray["createdAt"] = -1;
      }
      let result;
      let matchFilter = {};

      if (appointmentType == "ALL") {
        matchFilter = {
          $match: {
            "appointment.appointmentType": {
              $in: ["ONLINE", "FACE_TO_FACE", "HOME_VISIT"],
            },
          },
        };
      } else {
        matchFilter = {
          $match: { "appointment.appointmentType": { $in: [appointmentType] } },
        };
      }

      result = await Eprescription.aggregate([
        {
          $match: { doctorId: mongoose.Types.ObjectId(doctorId) },
        },
        {
          $lookup: {
            from: "appointments",
            localField: "appointmentId",
            foreignField: "_id",
            as: "appointment",
          },
        },
        { $unwind: "$appointment" },
        {
          $lookup: {
            from: "reasonforappointments",
            localField: "appointment.reasonForAppointment",
            foreignField: "_id",
            as: "reasonforappointments",
          },
        },
        {
          $set: {
            "appointment.reasonForAppointment": "$reasonforappointments.name",
          },
        },
        matchFilter,
        { $sort: sortingarray },
        { $skip: (page - 1) * limit },
        { $limit: limit * 1 },
      ]);

      const count = await Eprescription.aggregate([
        {
          $match: {
            doctorId: mongoose.Types.ObjectId(doctorId),
            isValidate: true,
          },
        },
        {
          $lookup: {
            from: "appointments",
            localField: "appointmentId",
            foreignField: "_id",
            as: "appointment",
          },
        },
        { $unwind: "$appointment" },
        matchFilter,
      ]);

      if (result) {
        sendResponse(req, res, 200, {
          status: true,
          body: {
            totalPages: Math.ceil(count.length / limit),
            currentPage: page,
            totalRecords: count.length,
            result,
          },
          message:messages.EprescriptionFetched.en,
          messageArabic:messages.EprescriptionFetched.ar,
          errorCode: null,
        });
      }
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to fetched eprescription",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async listRecentMedicinesPrescribed(req, res) {
    const { doctorId, recentItemsFor } = req.query;

    try {
      let result;

      if (recentItemsFor == "Medicines") {
        result = await EprescriptionMedicineDosage.find({ doctorId })
          .sort({ createdAt: -1 })
          .limit(10);
      } else if (recentItemsFor == "Labs") {
        result = await EprescriptionLab.find({ doctorId })
          .sort({ createdAt: -1 })
          .limit(10);
      } else if (recentItemsFor == "Imaging") {
        result = await EprescriptionImaging.find({ doctorId })
          .sort({ createdAt: -1 })
          .limit(10);
      } else if (recentItemsFor == "Vaccination") {
        result = await EprescriptionVaccination.find({ doctorId })
          .sort({ createdAt: -1 })
          .limit(10);
      } else if (recentItemsFor == "Eyeglass") {
        result = await EprescriptionEyeglass.find({ doctorId })
          .sort({ createdAt: -1 })
          .limit(10);
      } else {
        result = await EprescriptionOther.find({ doctorId })
          .sort({ createdAt: -1 })
          .limit(10);
      }

      if (result) {
        sendResponse(req, res, 200, {
          status: true,
          body: result,
          message:messages.recentEprescriptionFetched.en,
          messageArabic:messages.recentEprescriptionFetched.ar,
          errorCode: null,
        });
      }
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to recent prescribes",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getDoctorLocationInfo(req, res) {
    const { doctorId } = req.query;

    try {
      let result;

      result = await LocationInfo.findOne({ for_portal_user: doctorId });

      if (result) {
        sendResponse(req, res, 200, {
          status: true,
          body: result,
          message:messages.locationInfoFetched.en,
          messageArabic:messages.locationInfoFetched.ar,
          errorCode: null,
        });
      }
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to fetched lacation info ",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async updateAppointmentPaymentStatus(req, res) {
    try {
      const { data } = req.body;
      if (data?.metadata) {
        await Appointment.updateOne(
          { order_id: data.metadata.order_id },
          {
            $set: {
              isPaymentDone: true,
              paymentDetails: {
                doctorFees: data.metadata.plan_price,
                transactionID: data.id,
              },
            },
          }
        );
        updatePaymentStatusAndSlot(data.metadata.order_id);

        sendResponse(req, res, 200, {
          status: true,
          body: null,
          message: messages.dataUpdated.en,
          messageArabic: messages.dataUpdated.ar,
          errorCode: null,
        });
      } else {
        await Appointment.updateOne(
          { order_id: data.order_id },
          {
            $set: {
              isPaymentDone: true,
              paymentDetails: {
                doctorFees: data?.plan_price,
                transactionID: data?.transaction_id,
              },
            },
          }
        );
        updatePaymentStatusAndSlot(data.order_id);

        sendResponse(req, res, 200, {
          status: true,
          body: null,
          message: messages.dataUpdated.en,
          messageArabic: messages.dataUpdated.ar,
          errorCode: null,
        });
      }
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: error.message
          ? error.message
          : "Failed to update appointment payment status",
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getAllEprescriptionDetailsForMedicine(req, res) {
    const { ePrescriptionNumber } = req.query;

    try {
      let result;

      result = await Eprescription.aggregate([
        {
          $match: { ePrescriptionNumber: ePrescriptionNumber },
        },
        {
          $lookup: {
            from: "eprescriptionmedicinedosages",
            localField: "_id",
            foreignField: "ePrescriptionId",
            as: "dosages",
          },
        },
        // { $unwind: { path: "$dosages", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "appointments",
            localField: "appointmentId",
            foreignField: "_id",
            as: "appointment",
          },
        },
        { $unwind: { path: "$appointment", preserveNullAndEmptyArrays: true } },

        {
          $lookup: {
            from: "basicinfos",
            localField: "appointment.doctorId",
            foreignField: "for_portal_user",
            as: "basicinfos",
          },
        },
        { $unwind: { path: "$basicinfos", preserveNullAndEmptyArrays: true } },

        {
          $lookup: {
            from: "specialties",
            localField: "basicinfos.speciality",
            foreignField: "_id",
            as: "specialties",
          },
        },
        { $unwind: { path: "$specialties", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            ePrescriptionNumber: 1,
            appointmentId: 1,
            medicines: "$dosages",
            reasonForAppointment: "$appointment.reasonForAppointment",
            prescriberCenterDetails: {
              prescriberCenter: "$appointment.hospital_details.hospital_name",
              prescriberFirstName: "$basicinfos.first_name",
              prescriberMiddleName: "$basicinfos.middle_name",
              prescriberLastName: "$basicinfos.last_name",
              prescriberTitle: "$basicinfos.title",
              prescriberSpeciality: "$specialties.specilization",
            },
          },
        },
      ]);

      let wrapResult = { ...result[0] };

      if (result?.length > 0) {
        sendResponse(req, res, 200, {
          status: true,
          body: wrapResult,
          message: "Eprescription Data Fetched Successfully",
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "No Details Found!! Please Enter Valid ePrescription Number",
          errorCode: null,
        });
      }
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to get eprescription details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async checkEprescriptionAvailability(req, res) {
    try {
      const getData = await Eprescription.find({
        ePrescriptionNumber: req.query.eprescription_number,
      });
      if (getData.length > 0) {
        const eprescriptionID = getData[0]._id;

        let getAllMedicine = {};
        if (req.query.test_type === "Laboratory") {
          getAllMedicine = await EprescriptionImaging.find({
            ePrescriptionId: { $eq: eprescriptionID },
          });
        } else if (req.query.test_type === "Radiology") {
          getAllMedicine = await EprescriptionLab.find({
            ePrescriptionId: { $eq: eprescriptionID },
          });
        } else if (req.query.test_type === "Medicine") {
          getAllMedicine = await EprescriptionMedicineDosage.find({
            ePrescriptionId: { $eq: eprescriptionID },
          });
        } else {
          getAllMedicine = await EprescriptionMedicineDosage.find({
            ePrescriptionId: { $eq: eprescriptionID },
          });
        }

        sendResponse(req, res, 200, {
          status: true,
          body: {
            medicineDosageData: getAllMedicine,
          },
          message: messages.dataFetched.en,
          messageArabic: messages.dataFetched.ar,
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "No Details Found!! Please Enter Valid ePrescription Number",
          errorCode: null,
        });
      }
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        data: error,
        message: error.message ? error.message : "Something went wrong",
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // get-data-Asper-assign-Doctor-for-hospital-staff
  async getdataAsperHospitalDoctor(req, res) {
    try {
      const {
        doctor_list,
        departmentArray,
        unitArray,
        serviceArray,
      } = req.body;

      const filter = {
        $or: [
          {
            department: {
              $in: departmentArray.map((id) => mongoose.Types.ObjectId(id)),
            },
          },
          { unit: { $in: unitArray.map((id) => mongoose.Types.ObjectId(id)) } },
          {
            services: {
              $in: serviceArray.map((id) => mongoose.Types.ObjectId(id)),
            },
          },
          {
            for_portal_user: {
              $in: doctor_list.map((id) => mongoose.Types.ObjectId(id)),
            },
          },
        ],
      };
      const findData = await BasicInfo.aggregate([
        {
          $match: filter,
        },
        {
          $lookup: {
            from: "portalusers",
            localField: "for_portal_user",
            foreignField: "_id",
            as: "for_portal_userData",
          },
        },
        {
          $unwind: {
            path: "$for_portal_userData",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: { "for_portal_userData.isDeleted": false },
        },
      ]);

      sendResponse(req, res, 200, {
        status: true,
        body: {
          count: findData.length,
          data: findData,
        },
        message: messages.dataFetched.en,
        messageArabic: messages.dataFetched.ar,
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

  // get-assign-doctor-details-for -hospital-staff
  async postAssignDoctor(req, res) {
    try {
      const { doctor_ids } = req.body;

      const findData = await BasicInfo.find({
        for_portal_user: { $in: doctor_ids },
      });
      sendResponse(req, res, 200, {
        status: true,
        body: {
          data: findData,
        },
        message: "Get individual doctor list",
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get individual doctor details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async onlineConsultationCount(req, res) {

    try {
      const { doctor_portal_id, consultation_type, status, date } = req.query;
      let doctorPortalId = Array.isArray(doctor_portal_id)
        ? doctor_portal_id.map((s) => mongoose.Types.ObjectId(s))
        : [mongoose.Types.ObjectId(doctor_portal_id)];
      let appointmentTypeFilter = {};
      if (consultation_type && consultation_type != "") {
        if (consultation_type == "ALL") {
          appointmentTypeFilter = {
            appointmentType: { $in: ["ONLINE", "FACE_TO_FACE", "HOME_VISIT"] },
          };
        } else {
          appointmentTypeFilter = {
            appointmentType: consultation_type,
          };
        }
      }

      let statusFilter = {};
      if (status && status != "") {
        if (status == "ALL") {
          statusFilter = {
            status: { $ne: "NA" },
          };
        }
      }

      let dateFilter = {};
      if (date && date != "") {
        dateFilter = {
          consultationDate: date,
        };
      }

      let aggregate = [
        {
          $lookup: {
            from: "reasonforappointments",
            localField: "reasonForAppointment",
            foreignField: "_id",
            as: "reasonForAppointment",
          },
        },
        { $unwind: "$reasonForAppointment" },
        {
          $set: {
            reasonForAppointment: "$reasonForAppointment.name",
          },
        },
        {
          $lookup: {
            from: "basicinfos",
            localField: "doctorId",
            foreignField: "for_portal_user",
            as: "doctorDetails",
          },
        },
        { $unwind: "$doctorDetails" },
        {
          $match: {
            doctorId: { $in: doctorPortalId },
            $and: [appointmentTypeFilter, statusFilter, dateFilter],
          },
        },

        {
          $project: {
            patientDetails: 1,
            patientId: 1,
            madeBy: 1,
            consultationDate: 1,
            consultationTime: 1,
            appointmentType: 1,
            consultationFee: 1,
            reasonForAppointment: 1,
            status: 1,
            doctorId: 1,
            hospital_details: 1,
            doctorDetails: 1,
            createdAt: 1,
          },
        },
      ];
      const totalCount = await Appointment.aggregate(aggregate);

      aggregate.push({
        $sort: {
          createdAt: -1,
        },
      });

      const result = await Appointment.aggregate(aggregate);

      let listArray = [];
      for (const appointment of result) {
        const todayDate = new Date().toISOString().split("T")[0];
        let status = "";
        if (appointment.status === "NEW") status = "New";
        if (appointment.status === "REJECTED") status = "Rejected";
        if (appointment.status == "PAST") status = "Past";
        if (appointment.status == "MISSED") status = "Missed";
        if (appointment.status === "APPROVED") {
          status =
            todayDate == appointment.consultationDate ? "Today" : "Upcoming";
        }
 
        listArray.push({
        
          fee: appointment.consultationFee,
          // order_id: appointment.order_id ? appointment.order_id : '',
          status,
        });
      }
      sendResponse(req, res, 200, {
        status: true,
        data: {
          data: listArray,
          totalCount: totalCount.length,
          // currentPage: page,
          // totalPages: limit > 0 ? Math.ceil(totalCount.length / limit) : 1,
        },
        message: messages.patientAppointmentFetched.en,
        messageArabic: messages.patientAppointmentFetched.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: error.message
          ? error.message
          : `something went wrong while fetching list`,
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async facetofaceConsultationCount(req, res) {

    try {
      const { doctor_portal_id, consultation_type, status, date } = req.query;
      let doctorPortalId = Array.isArray(doctor_portal_id)
        ? doctor_portal_id.map((s) => mongoose.Types.ObjectId(s))
        : [mongoose.Types.ObjectId(doctor_portal_id)];
      let appointmentTypeFilter = {};
      if (consultation_type && consultation_type != "") {
        if (consultation_type == "ALL") {
          appointmentTypeFilter = {
            appointmentType: { $in: ["ONLINE", "FACE_TO_FACE", "HOME_VISIT"] },
          };
        } else {
          appointmentTypeFilter = {
            appointmentType: consultation_type,
          };
        }
      }

      let statusFilter = {};
      if (status && status != "") {
        if (status == "ALL") {
          statusFilter = {
            status: { $ne: "NA" },
          };
        }
      }

      let dateFilter = {};
      if (date && date != "") {
        dateFilter = {
          consultationDate: date,
        };
      }

      let aggregate = [
        {
          $lookup: {
            from: "reasonforappointments",
            localField: "reasonForAppointment",
            foreignField: "_id",
            as: "reasonForAppointment",
          },
        },
        { $unwind: "$reasonForAppointment" },
        {
          $set: {
            reasonForAppointment: "$reasonForAppointment.name",
          },
        },
        {
          $lookup: {
            from: "basicinfos",
            localField: "doctorId",
            foreignField: "for_portal_user",
            as: "doctorDetails",
          },
        },
        { $unwind: "$doctorDetails" },
        {
          $match: {
            doctorId: { $in: doctorPortalId },
            $and: [appointmentTypeFilter, statusFilter, dateFilter],
          },
        },

        {
          $project: {
            patientDetails: 1,
            patientId: 1,
            madeBy: 1,
            consultationDate: 1,
            consultationTime: 1,
            appointmentType: 1,
            consultationFee: 1,
            reasonForAppointment: 1,
            status: 1,
            doctorId: 1,
            hospital_details: 1,
            doctorDetails: 1,
            createdAt: 1,
          },
        },
      ];
      const totalCount = await Appointment.aggregate(aggregate);
      aggregate.push({
        $sort: {
          createdAt: -1,
        },
      });

      const result = await Appointment.aggregate(aggregate);

      let listArray = [];
      for (const appointment of result) {
        const todayDate = new Date().toISOString().split("T")[0];
        let status = "";
        if (appointment.status === "NEW") status = "New";
        if (appointment.status === "REJECTED") status = "Rejected";
        if (appointment.status == "PAST") status = "Past";
        if (appointment.status == "MISSED") status = "Missed";
        if (appointment.status === "APPROVED") {
          status =
            todayDate == appointment.consultationDate ? "Today" : "Upcoming";
        }
        let consultationType = "";
        if (appointment.appointmentType == "FACE_TO_FACE")
          consultationType = "Face to Face";

        listArray.push({
          // appointment_id: appointment._id,
          // patient_name: appointment.patientDetails.patientFullName,
          // patient_id: appointment.patientId,
          // doctor_name: appointment.doctorDetails.full_name,
          // doctorId: appointment.doctorId,
          // hospital_details: appointment.hospital_details,
          // hospital_name: appointment.hospital_details ? appointment.hospital_details.hospital_name : 'N/A',
          // made_by: appointment.madeBy,
          // consultation_date: appointment.consultationDate,
          // consultation_time: appointment.consultationTime,
          // consultation_type: consultationType,
          // reason_for_appointment: appointment.reasonForAppointment,
          fee: appointment.consultationFee,
          // order_id: appointment.order_id ? appointment.order_id : '',
          status,
        });
      }
      sendResponse(req, res, 200, {
        status: true,
        data: {
          data: listArray,
          totalCount: totalCount.length,
        },
        message: messages.patientAppointmentFetched.en,
        messageArabic: messages.patientAppointmentFetched.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: error.message
          ? error.message
          : `something went wrong while fetching list`,
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async homeConsultationCount(req, res) {

    try {
      const { doctor_portal_id, consultation_type, status, date } = req.query;
      let doctorPortalId = Array.isArray(doctor_portal_id)
        ? doctor_portal_id.map((s) => mongoose.Types.ObjectId(s))
        : [mongoose.Types.ObjectId(doctor_portal_id)];
      let appointmentTypeFilter = {};
      if (consultation_type && consultation_type != "") {
        if (consultation_type == "ALL") {
          appointmentTypeFilter = {
            appointmentType: { $in: ["ONLINE", "FACE_TO_FACE", "HOME_VISIT"] },
          };
        } else {
          appointmentTypeFilter = {
            appointmentType: consultation_type,
          };
        }
      }

      let statusFilter = {};
      if (status && status != "") {
        if (status == "ALL") {
          statusFilter = {
            status: { $ne: "NA" },
          };
        }
      }

      let dateFilter = {};
      if (date && date != "") {
        dateFilter = {
          consultationDate: date,
        };
      }

      let aggregate = [
        {
          $lookup: {
            from: "reasonforappointments",
            localField: "reasonForAppointment",
            foreignField: "_id",
            as: "reasonForAppointment",
          },
        },
        { $unwind: "$reasonForAppointment" },
        {
          $set: {
            reasonForAppointment: "$reasonForAppointment.name",
          },
        },
        {
          $lookup: {
            from: "basicinfos",
            localField: "doctorId",
            foreignField: "for_portal_user",
            as: "doctorDetails",
          },
        },
        { $unwind: "$doctorDetails" },
        {
          $match: {
            doctorId: { $in: doctorPortalId },
            $and: [appointmentTypeFilter, statusFilter, dateFilter],
          },
        },

        {
          $project: {
            patientDetails: 1,
            patientId: 1,
            madeBy: 1,
            consultationDate: 1,
            consultationTime: 1,
            appointmentType: 1,
            consultationFee: 1,
            reasonForAppointment: 1,
            status: 1,
            doctorId: 1,
            hospital_details: 1,
            doctorDetails: 1,
            createdAt: 1,
          },
        },
      ];
      const totalCount = await Appointment.aggregate(aggregate);
      aggregate.push({
        $sort: {
          createdAt: -1,
        },
      });

      const result = await Appointment.aggregate(aggregate);

      let listArray = [];
      for (const appointment of result) {
        const todayDate = new Date().toISOString().split("T")[0];
        let status = "";
        if (appointment.status === "NEW") status = "New";
        if (appointment.status === "REJECTED") status = "Rejected";
        if (appointment.status == "PAST") status = "Past";
        if (appointment.status == "MISSED") status = "Missed";
        if (appointment.status === "APPROVED") {
          status =
            todayDate == appointment.consultationDate ? "Today" : "Upcoming";
        }
        if (appointment.appointmentType == "HOME_VISIT")

        listArray.push({
          // appointment_id: appointment._id,
          // patient_name: appointment.patientDetails.patientFullName,
          // patient_id: appointment.patientId,
          // doctor_name: appointment.doctorDetails.full_name,
          // doctorId: appointment.doctorId,
          // hospital_details: appointment.hospital_details,
          // hospital_name: appointment.hospital_details ? appointment.hospital_details.hospital_name : 'N/A',
          // made_by: appointment.madeBy,
          // consultation_date: appointment.consultationDate,
          // consultation_time: appointment.consultationTime,
          // consultation_type: consultationType,
          // reason_for_appointment: appointment.reasonForAppointment,
          fee: appointment.consultationFee,
          // order_id: appointment.order_id ? appointment.order_id : '',
          status,
        });
      }
      sendResponse(req, res, 200, {
        status: true,
        data: {
          data: listArray,
          totalCount: totalCount.length,
        },
        message: messages.patientAppointmentFetched.en,
        messageArabic: messages.patientAppointmentFetched.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: error.message
          ? error.message
          : `something went wrong while fetching list`,
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async allConsultationCount(req, res) {

    try {
      const { doctor_portal_id, consultation_type, status, date } = req.query;
      let doctorPortalId = Array.isArray(doctor_portal_id)
        ? doctor_portal_id.map((s) => mongoose.Types.ObjectId(s))
        : [mongoose.Types.ObjectId(doctor_portal_id)];
      let appointmentTypeFilter = {};
      if (consultation_type && consultation_type != "") {
        if (consultation_type == "ALL") {
          appointmentTypeFilter = {
            appointmentType: { $in: ["ONLINE", "FACE_TO_FACE", "HOME_VISIT"] },
          };
        } else {
          appointmentTypeFilter = {
            appointmentType: consultation_type,
          };
        }
      }

      let statusFilter = {};
      if (status && status != "") {
        if (status == "ALL") {
          statusFilter = {
            status: { $ne: "NA" },
          };
        }
      }

      let dateFilter = {};
      if (date && date != "") {
        dateFilter = {
          consultationDate: date,
        };
      }

      let aggregate = [
        {
          $lookup: {
            from: "reasonforappointments",
            localField: "reasonForAppointment",
            foreignField: "_id",
            as: "reasonForAppointment",
          },
        },
        { $unwind: "$reasonForAppointment" },
        {
          $set: {
            reasonForAppointment: "$reasonForAppointment.name",
          },
        },
        {
          $lookup: {
            from: "basicinfos",
            localField: "doctorId",
            foreignField: "for_portal_user",
            as: "doctorDetails",
          },
        },
        { $unwind: "$doctorDetails" },
        {
          $match: {
            doctorId: { $in: doctorPortalId },
            $and: [appointmentTypeFilter, statusFilter, dateFilter],
          },
        },

        {
          $project: {
            // patientDetails: 1,
            // patientId: 1,
            // madeBy: 1,
            // consultationDate: 1,
            // consultationTime: 1,
            // appointmentType: 1,
            consultationFee: 1,
            // reasonForAppointment: 1,
            status: 1,
            // doctorId: 1,
            // hospital_details: 1,
            // doctorDetails: 1,
            // createdAt: 1,
          },
        },
      ];
      const totalCount = await Appointment.aggregate(aggregate);
      aggregate.push({
        $sort: {
          createdAt: -1,
        },
      });

      const result = await Appointment.aggregate(aggregate);

      let listArray = [];
      for (const appointment of result) {
        const todayDate = new Date().toISOString().split("T")[0];
        let status = "";
        if (appointment.status === "NEW") status = "New";
        if (appointment.status === "REJECTED") status = "Rejected";
        if (appointment.status == "PAST") status = "Past";
        if (appointment.status == "MISSED") status = "Missed";
        if (appointment.status === "APPROVED") {
          status =
            todayDate == appointment.consultationDate ? "Today" : "Upcoming";
        }
        if (appointment.appointmentType == "HOME_VISIT")

        listArray.push({
          fee: appointment.consultationFee,
          status,
        });
      }
      sendResponse(req, res, 200, {
        status: true,
        data: {
          data: listArray,
          totalCount: totalCount.length,
        },
        message: messages.patientAppointmentFetched.en,
        messageArabic: messages.patientAppointmentFetched.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: error.message
          ? error.message
          : `something went wrong while fetching list`,
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async graphListHospital(req, res) {

    try {
      const { doctor_portal_id, consultation_type, status, date } = req.query;

      let doctorPortalId = Array.isArray(doctor_portal_id)
        ? doctor_portal_id.map((s) => mongoose.Types.ObjectId(s))
        : [mongoose.Types.ObjectId(doctor_portal_id)];

      let appointmentTypeFilter = {};
      if (consultation_type && consultation_type != "") {
        if (consultation_type == "ALL") {
          appointmentTypeFilter = {
            appointmentType: { $in: ["ONLINE", "FACE_TO_FACE", "HOME_VISIT"] },
          };
        } else {
          appointmentTypeFilter = {
            appointmentType: consultation_type,
          };
        }
      }

      let statusFilter = {};
      if (status && status != "") {
        statusFilter = {
          status: { $ne: "NA" },
        };
        if (status == "NEW") {
          statusFilter = {
            status: "NEW",
          };
        }
        if (status == "ALL") {
          statusFilter = {
            status: { $ne: "NA" },
          };
        }
        if (status == "APPROVED") {
          statusFilter = {
            // consultationDate: { $eq: new Date().toISOString().split('T')[0] },
            status: "APPROVED",
          };
        }

        if (status == "REJECTED") {
          statusFilter = {
            status: "REJECTED",
          };
        }
        if (status == "PAST") {
          statusFilter = {
            consultationDate: { $lt: new Date().toISOString().split("T")[0] },
            status: "PAST",
          };
        }

        if (status == "MISSED") {
          statusFilter = {
            status: "MISSED",
          };
        }
      }

      let dateFilter = {};
      if (date && date != "") {
        dateFilter = {
          consultationDate: date,
        };
      }

      let aggregate = [
        {
          $lookup: {
            from: "reasonforappointments",
            localField: "reasonForAppointment",
            foreignField: "_id",
            as: "reasonForAppointment",
          },
        },
        { $unwind: "$reasonForAppointment" },
        {
          $set: {
            reasonForAppointment: "$reasonForAppointment.name",
          },
        },
        {
          $lookup: {
            from: "basicinfos",
            localField: "doctorId",
            foreignField: "for_portal_user",
            as: "doctorDetails",
          },
        },
        { $unwind: "$doctorDetails" },
        {
          $match: {
            doctorId: { $in: doctorPortalId },
            $and: [appointmentTypeFilter, statusFilter, dateFilter],
          },
        },

        {
          $project: {
            consultationDate: 1,
            consultationTime: 1,
            appointmentType: 1,
            reasonForAppointment: 1,
            status: 1,
            doctorId: 1,
            createdAt: 1,
          },
        },
      ];
      const totalCount = await Appointment.aggregate(aggregate);
      aggregate.push({
        $sort: {
          createdAt: -1,
        },
      });
      const result = await Appointment.aggregate(aggregate);

      // For graph purpose
      let monthlyCount = {};
      let currentYear = moment().year();
      moment.months().forEach((month) => {
        monthlyCount[month] = 0;
      });

      result.forEach((item) => {
        if (item) {
          let createDate = moment(item.createdAt);
          let year = createDate.year();
          if (year === currentYear) {
            let month = createDate.format("MMMM");
            if (!monthlyCount[month]) {
              monthlyCount[month] = 1;
            } else {
              monthlyCount[month]++;
            }
          }
        }
      });
      let listArray = [];
      for (const appointment of result) {
        const todayDate = new Date().toISOString().split("T")[0];
        let status = "";
        if (appointment.status === "NEW") status = "New";
        if (appointment.status === "REJECTED") status = "Rejected";
        if (appointment.status == "PAST") status = "Past";
        if (appointment.status == "MISSED") status = "Missed";
        if (appointment.status === "APPROVED") {
          status =
            todayDate == appointment.consultationDate ? "Today" : "Upcoming";
        }
       

        listArray.push({
          appointment_id: appointment._id,
          doctorId: appointment.doctorId,
          status,
          createdAt: appointment.createdAt,
        });
      }
      sendResponse(req, res, 200, {
        status: true,
        data: {
          data: listArray,
          graphData: monthlyCount,
          totalCount: totalCount.length,
        },
        message: messages.patientAppointmentFetched.en,
        messageArabic: messages.patientAppointmentFetched.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: error.message
          ? error.message
          : `something went wrong while fetching list`,
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // Type of Health Type
  async addHealthCentre_SuperAdmin(req, res) {
    try {
      const { healthcentreArray, added_by } = req.body;
      const list = healthcentreArray.map((singleData) => ({
        ...singleData,
        added_by,
      }));
      const namesToFind = list.map((item) => item.name);
      const foundItems = await HospitalType.find({
        name: { $in: namesToFind },
      });
      const CheckData = foundItems.map((item) => item.name);
      if (foundItems.length == 0) {
        const savedHealthCentre = await HospitalType.insertMany(list);
        sendResponse(req, res, 200, {
          status: true,
          body: savedHealthCentre,
          message: messages.hospitalTypeAdd.en,
          messageArabic: messages.hospitalTypeAdd.ar,
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
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to add HospitalType",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async allHealthCentreList(req, res) {
    try {
      const { limit, page, searchText } = req.query;
      let sort = req.query.sort;
      let sortingarray = {};
      if (sort != undefined && sort != "") {
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
      const healthList = await HospitalType.find(filter)
        .sort(sortingarray)
        .skip((page - 1) * limit)
        .limit(limit * 1)
        .exec();
      const count = await HospitalType.countDocuments(filter);
      sendResponse(req, res, 200, {
        status: true,
        body: {
          totalCount: count,
          data: healthList,
        },
        message:messages.hospitalTypeListGet.en,
        messageArabic:messages.hospitalTypeListGet.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get HospitalType list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async updateHealthCentre(req, res) {
    try {
      const { healthcentreId, name, active_status, delete_status } = req.body;
      const list = await HospitalType.find({
        name: name,
        active_status: active_status,
        _id: { $ne: mongoose.Types.ObjectId(healthcentreId) },
        is_deleted: false,
      });
      if (list.length == 0) {
        const updateHealthCentre = await HospitalType.updateOne(
          { _id: healthcentreId },
          {
            $set: {
              name,
              active_status,
              delete_status,
            },
          },
          { new: true }
        ).exec();
        sendResponse(req, res, 200, {
          status: true,
          body: updateHealthCentre,
          message: messages.hospitalTypeUpdate.en,
          messageArabic: messages.hospitalTypeUpdate.ar,
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 200, {
          status: false,
          message:messages.healthTypeExist.en,
          messageArabic:messages.healthTypeExist.ar,
          errorCode: null,
        });
      }
    } catch (err) {
      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to update HospitalType`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async actionOnHealthCentre(req, res) {
    try {
      const { healthcentreId, action_name, action_value } = req.body;
      let message = "";

      const filter = {};
      if (action_name == "active") filter["active_status"] = action_value;
      if (action_name == "delete") filter["delete_status"] = action_value;

      if (action_name == "active") {
        await HospitalType.updateOne(
          { _id: healthcentreId },
          filter,
          { new: true }
        ).exec();

      }

      if (action_name == "delete") {
        if (healthcentreId == "") {
          await HospitalType.updateMany(
            { delete_status: { $eq: false } },
            {
              $set: { delete_status: true },
            },
            { new: true }
          );
        } else {
          await HospitalType.updateMany(
            { _id: { $in: healthcentreId } },
            {
              $set: { delete_status: true },
            },
            { new: true }
          );
        }
      }

      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: messages.hospitalTypeDelete.en,
        messageArabic: messages.hospitalTypeDelete.ar,
        errorCode: null,
      });
    } catch (err) {
      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to HospitalType done`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async allHealthCentreListforexport(req, res) {
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
        result = await HospitalType.find(filter)
          .sort([["createdAt", -1]])
          .skip((page - 1) * limit)
          .limit(limit * 1)
          .exec();
      } else {
        result = await HospitalType.aggregate([
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
      sendResponse(req, res, 200, {
        status: true,
        data: {
          result,
          array,
        },
        message: messages.hospitalTypeAdd.en,
        messageArabic: messages.hospitalTypeAdd.ar,
        errorCode: null,
      });
    } catch (err) {
      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to add HospitalType`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async uploadCSVForHealthCentre(req, res) {
    try {
      const filePath = "./uploads/" + req.filename;
      const data = await processExcel(filePath);

      const isValidFile = validateColumnWithExcel(HealthCenterColumns, data[0]);
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

      const existingHealthCentres = await HospitalType.find({}, "name");
      const existingHealthCentreNames = existingHealthCentres.map(
        (center) => center.name
      );

      const inputArray = [];
      const duplicateHealthCentres = [];

      for (const singleData of data) {
        const trimmedHealthCentre = singleData.name.trim();
        if (existingHealthCentreNames.includes(trimmedHealthCentre)) {
          duplicateHealthCentres.push(trimmedHealthCentre);
        } else {
          inputArray.push({
            name: trimmedHealthCentre,
            added_by: req.body.added_by,
          });
        }
      }

      if (duplicateHealthCentres.length > 0) {
        return sendResponse(req, res, 400, {
          status: false,
          body: null,
          message: `Health centers already exist: ${duplicateHealthCentres.join(
            ", "
          )}`,
          errorCode: null,
        });
      }

      if (inputArray.length > 0) {
        const result = await HospitalType.insertMany(inputArray);
        return sendResponse(req, res, 200, {
          status: true,
          body: result,
          message: messages.healthCenterAdd.en,
          messageArabic: messages.healthCenterAdd.ar,
          errorCode: null,
        });
      } else {
        return sendResponse(req, res, 200, {
          status: true,
          body: null,
          message:messages.noHealthCenter.en,
          messageArabic:messages.noHealthCenter.ar,
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

  async commmonHealthCentreList(req, res) {
    try {
      const list = await HospitalType.find({
        delete_status: false,
        active_status: true,
      });
      sendResponse(req, res, 200, {
        status: true,
        body: { list },
        message: messages.allHealthCenter.en,
        messageArabic: messages.allHealthCenter.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get HealthCentre list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getEprescriptionTemplateUrl(req, res) {
    const { appointmentId } = req.query;
    try {
      let result;
      result = await Eprescription.findOne({ appointmentId });
      let previewTemplate = "";

      let environvent = process.env.NODE_ENV;
      let url = process.env.test_p_FRONTEND_URL;
      if (result) {
        if (previewTemplate != "") {
          if (environvent == "local") {
            res.redirect(
              `http://localhost:4200/individual-doctor/eprescription-viewpdf?id=${appointmentId}`
            );
          } else {
            res.redirect(
              `${url}/individual-doctor/eprescription-viewpdf?id=${appointmentId}`
            );
          }
        } else {
          res.redirect();
        }
      } else {
        sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: messages.EprescriptionNotFound.en,
          messageArabic: messages.EprescriptionNotFound.ar,
          errorCode: null,
        });
      }
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to get E-prescription",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getIdbyDoctorName(req, res) {
    try {
      const { doctorId } = req.query;

      const matchStage = {
        $match: {
          _id: mongoose.Types.ObjectId(doctorId),
          verified: true,
          isActive: true,
          isDeleted: false,
          lock_user: false,
        },
      };

      const pipeline = [
        matchStage,
        {
          $lookup: {
            from: "basicinfos",
            localField: "_id",
            foreignField: "for_portal_user",
            as: "doctorData",
          },
        },
        {
          $unwind: "$doctorData",
        },
        {
          $project: {
            full_name: "$doctorData.full_name",
          },
        },
      ];
      const result = await PortalUser.aggregate(pipeline);

      sendResponse(req, res, 200, {
        status: true,
        body: result[0]?.full_name,
        message: "List getting successfully!",
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to fetch list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async sendMailTOPatient(req, res) {
    try {
      const { patient_data, doctor_email, doctor_name, appointment_Id } =
        req.body;
      let patient_email = patient_data?.patient_email;
      let patient_name = patient_data?.patient_name;

      const content = sendEprescriptionEmail(
        patient_email,
        doctor_email,
        appointment_Id,
        patient_name,
        doctor_name
      );
      sendEmail(content);
      return sendResponse(req, res, 200, {
        status: true,
        body: null,
        message: messages.emailSend,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to Send Email.",
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

          message:messages.notificationSaved.en,
          messageArabic:messages.notificationSaved.ar,
        });
      } else {
        return sendResponse(req, res, 400, {
          status: true,

          body: [],

          message: messages.notificationNotSaved.en,
          messageArabic: messages.notificationNotSaved.ar,
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

  async patientPaymentHistoryToDoctor(req, res) {
    try {
      const {
        doctor_portal_id,
        searchTextP,
        searchTextD,
        appointmentStatus,
        appointmentStartDate,
        appointmentEndDate,
        limit,
        page,
      } = req.query;

      let filter = [{}];
      let appointmentStatus_filter = {};
      let appointment_filter = {};

      if (searchTextD !== "") {
        filter = [
          {
            "doctorDetails.full_name": {
              $regex: searchTextD || "",
              $options: "i",
            },
          },
        ];
      }
      if (searchTextP !== "") {
        filter = [
          {
            "patientDetails.patientFullName": {
              $regex: searchTextP || "",
              $options: "i",
            },
          },
        ];
      }

      if (appointmentStatus !== "") {
        appointmentStatus_filter = {
          status: appointmentStatus,
        };
      }

      if (appointmentStartDate !== "" && appointmentEndDate !== "") {
        appointment_filter = {
          consultationDate: {
            $gte: new Date(appointmentStartDate).toISOString(),
            $lte: new Date(appointmentEndDate).toISOString(),
          },
        };
      }

      let doctorPortalId = Array.isArray(doctor_portal_id)
        ? doctor_portal_id.map((s) => mongoose.Types.ObjectId(s))
        : [mongoose.Types.ObjectId(doctor_portal_id)];

      let aggregate = [
        {
          $lookup: {
            from: "basicinfos",
            localField: "doctorId",
            foreignField: "for_portal_user",
            as: "doctorDetails",
          },
        },
        { $unwind: "$doctorDetails" },
        {
          $match: {
            doctorId: { $in: doctorPortalId },
            madeBy: { $in: ["patient", "INDIVIDUAL_DOCTOR"] },
            appointmentType: { $in: ["ONLINE", "FACE_TO_FACE", "HOME_VISIT"] },
            isPaymentDone: true,
          },
        },
        {
          $project: {
            patientDetails: 1,
            patientId: 1,
            madeBy: 1,
            consultationDate: 1,
            consultationTime: 1,
            appointmentType: 1,
            consultationFee: 1,
            paymentDetails: 1,
            reasonForAppointment: 1,
            status: 1,
            paymentMode: 1,
            doctorId: 1,
            hospital_details: 1,
            doctorDetails: 1,
            createdAt: 1,
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit * 1 },
        {
          $match: {
            $and: [
              appointmentStatus_filter,
              { $or: filter },
              appointment_filter,
            ],
          },
        },
      ];

      const totalResult = await Appointment.aggregate([
        {
          $lookup: {
            from: "basicinfos",
            localField: "doctorId",
            foreignField: "for_portal_user",
            as: "doctorDetails",
          },
        },
        { $unwind: "$doctorDetails" },
        {
          $match: {
            doctorId: { $in: doctorPortalId },
            madeBy: { $in: ["patient", "INDIVIDUAL_DOCTOR"] },
            appointmentType: { $in: ["ONLINE", "FACE_TO_FACE", "HOME_VISIT"] },
            isPaymentDone: true,
          },
        },
        {
          $project: {
            patientDetails: 1,
            patientId: 1,
            madeBy: 1,
            consultationDate: 1,
            consultationTime: 1,
            appointmentType: 1,
            consultationFee: 1,
            paymentDetails: 1,
            reasonForAppointment: 1,
            status: 1,
            paymentMode: 1,
            doctorId: 1,
            hospital_details: 1,
            doctorDetails: 1,
            createdAt: 1,
          },
        },
        { $sort: { createdAt: -1 } },
        {
          $match: {
            $and: [
              appointmentStatus_filter,
              { $or: filter },
              appointment_filter,
            ],
          },
        },
      ]);
      let totalCount = totalResult.length;
      let totalAmount = 0;

      for (let totalRevenue of totalResult) {
        totalAmount =
          totalAmount + Number(totalRevenue.paymentDetails.doctorFees);
      }

      const paymentHistory = await Appointment.aggregate(aggregate);

      sendResponse(req, res, 200, {
        status: true,
        data: {
          paymentHistory: paymentHistory,
          totalCount: totalCount,
          totalAmount: totalAmount,
        },
        message:messages.paymentHistoryFetched.en,
        messageArabic:messages.paymentHistoryFetched.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to Fetch Payment History.",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getAllDoctorData(req, res) {
    try {
      const { for_portal_user } = req.query;
      const doctorData = await BasicInfo.find({
        for_portal_user: mongoose.Types.ObjectId(for_portal_user),
      });

      sendResponse(req, res, 200, {
        status: true,
        data: doctorData,
        message:messages.getAllDoctor.en,
        messageArabic:messages.getAllDoctor.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        data: error,
        message: "failed to get doctor list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async doctorFourPortalListForHospital(req, res) {
    try {
      const { hospital_portal_id } = req.query;
      const headers = {
        Authorization: req.headers["authorization"],
      };
      let filter = {
        "for_portal_user.role": {
          $in: ["HOSPITAL_DOCTOR", "INDIVIDUAL_DOCTOR"],
        },
        "for_portal_user.isDeleted": false,
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
        {
          $lookup: {
            from: "services",
            localField: "services",
            foreignField: "_id",
            as: "services",
          },
        },
        { $unwind: { path: "$services", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "departments",
            localField: "department",
            foreignField: "_id",
            as: "departments",
          },
        },
        { $unwind: { path: "$departments", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "specialties",
            localField: "speciality",
            foreignField: "_id",
            as: "speciality",
          },
        },
        { $unwind: { path: "$speciality", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "units",
            localField: "unit",
            foreignField: "_id",
            as: "unit",
          },
        },
        { $unwind: { path: "$unit", preserveNullAndEmptyArrays: true } },
        { $match: filter },
        {
          $project: {
            first_name: 1,
            middle_name: 1,
            last_name: 1,
            full_name: 1,
            license_details: 1,
            speciality: "$speciality.specilization",
            services: "$services.service",
            department: "$departments.department",
            unit: "$unit.unit",
            for_portal_user: {
              _id: "$for_portal_user._id",
              email: "$for_portal_user.email",
              country_code: "$for_portal_user.country_code",
              phone_number: "$for_portal_user.mobile",
              lock_user: "$for_portal_user.lock_user",
              isActive: "$for_portal_user.isActive",
              createdAt: "$for_portal_user.createdAt",
              role: "$for_portal_user.role",
            },
          },
        },
      ];
      const result = await BasicInfo.aggregate(aggregate);

      let fourPortalDataResponse = await httpService.getStaging(
        "labradio/get-all-fouportal-list-for-hospital",
        { hospital_portal_id },
        headers,
        "labradioServiceUrl"
      );

      if (!fourPortalDataResponse.status || !fourPortalDataResponse.data) {
        throw new Error("Failed to fetch hospital data");
      }

      const fourPortal = fourPortalDataResponse.data;
      // Extracting the array of hospitals from fourPortal
      const fourPortalArray = Array.isArray(fourPortal) ? fourPortal : [];

      const combinedResults = [...result, ...fourPortalArray];

      sendResponse(req, res, 200, {
        status: true,
        data: {
          data: combinedResults,
        },
        message: messages.hospitalDoctorFetched.en,
        messageArabic: messages.hospitalDoctorFetched.ar,
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
      const { entriesArray, added_by } = req.body;
      const list = entriesArray.map((singleData) => ({
        ...singleData,
        for_portal_user: added_by,
        isExist: true,
      }));
      const typeToFind = list.map((item) => item.typeOfTest);
      const namesToFind = list.map((item) => item.nameOfTest);
      const foundItems = await PathologyTestInfoNew.find({
        for_portal_user: added_by,
        typeOfTest: { $in: typeToFind },
        nameOfTest: { $in: namesToFind },
      });
      const CheckData = foundItems.map((item) => item.nameOfTest);
      if (foundItems.length == 0) {
        const savedtests = await PathologyTestInfoNew.insertMany(list);
        sendResponse(req, res, 200, {
          status: true,
          body: savedtests,
          message: messages.addTest.en,
          messageArabic: messages.addTest.ar,
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
        message:messages.updateTest.en,
        messageara:messages.updateTest.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to update test",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async alldoctor_fourportal(req, res) {
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };
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
          match: { isDeleted: false },
        })
        .populate({
          path: "speciality",
        });
      let filteredResult = result.map((item) => ({
        first_name: item.first_name,
        middle_name: item.middle_name,
        last_name: item.last_name,
        full_name: item.full_name,
        title: item.title,
        speciality:
          item.speciality && item.speciality.length > 0
            ? item.speciality.map((spec) => spec.specilization)
            : [],
        for_portal_user: item?.for_portal_user,
        speciality_name: item?.speciality_name,
      }));

      let fourPortalData = await httpService.getStaging(
        "labradio/get-fourportal-basicinfo-data",
        {},
        headers,
        "labradioServiceUrl"
      );

      let fourPortalfilteredResult = [];

      for (let data1 of fourPortalData?.data) {
        if (data1.for_portal_user) {
          fourPortalfilteredResult.push(data1);
        }
      }
      let allResult = fourPortalfilteredResult.concat(filteredResult);

      sendResponse(req, res, 200, {
        status: true,
        data: allResult,
        message: messages.getAllDoctor.en,
        messageArabic: messages.getAllDoctor.ar,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `Failed to get all doctors`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async getPatientIdFromAppointment(req, res) {
    try {
      const { doctorId } = req.query
      const getAppointmentData = await Appointment.find({doctorId: {$eq: doctorId}}).select('patientId')
      const idsArray = getAppointmentData.map(ids => ids.patientId.toString())
      const patientIds = new Set(idsArray)
      
      sendResponse(req, res, 200, {
        status: true,
        message: `Successfully get all patient IDs`,
        data: {
          patientIds: Array.from(patientIds) 
        },
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        message: `Failed to get all patient IDs from Appointment`,
        body: error,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }


  async getDoctorIdFromAppointment(req, res) {
    try {
      const { patientId , idsToRemove} = req.query;
  
      if (patientId) {
        // Fetch completed appointments
        const getAppointmentData = await Appointment.find({
          patientId: { $eq: patientId },
          // status: "COMPLETED",
        }).select('doctorId appointment_id consultationDate consultationTime');
  
        const doctorAppointmentsMap = {};
  
        const doctorIds = getAppointmentData.map(appointment => appointment.doctorId);
  
        const doctorData = await BasicInfo.find({ 'for_portal_user': { $in: doctorIds } }).select('for_portal_user full_name full_name_arabic profile_picture');
  
        const doctorMap = doctorData.reduce((map, doctor) => {
          map[doctor?.for_portal_user.toString()] = doctor;         
          return map;
        }, {});
  
        getAppointmentData.forEach(appointment => {
          const doctorId = appointment.doctorId.toString();
          const consultationDate = new Date(appointment.consultationDate);
          const consultationTime = appointment.consultationTime;    
  
          if (
            !doctorAppointmentsMap[doctorId] || new Date(doctorAppointmentsMap[doctorId].consultationDate) < consultationDate ||
            (new Date(doctorAppointmentsMap[doctorId].consultationDate) < consultationDate && doctorAppointmentsMap[doctorId].consultationTime < consultationTime)
          ) {
            doctorAppointmentsMap[doctorId] = appointment; 
          }
        });
  
        let finalAppointments = await Promise.all(
          Object.values(doctorAppointmentsMap).map(async appointment => {
            const doctorId = appointment.doctorId.toString();
            const doctor = doctorMap[doctorId] || {};
            let profilePic = "";

            if (doctor?.profile_picture) {
              profilePic = await generateSignedUrl(doctor?.profile_picture); // Await the promise here
            }   
            return {
              ...appointment.toObject(),
              doctorName: doctor?.full_name || '',
              doctorArabicName: doctor?.full_name_arabic || '',
              profilePicture: profilePic, // Use the resolved URL
            };
          })
        );

        if (idsToRemove) {
          const idsToRemoveArray = Array.isArray(idsToRemove) ? idsToRemove : [idsToRemove];
          finalAppointments = finalAppointments.filter(appointment => 
            !idsToRemoveArray.includes(appointment.doctorId.toString())
          );
        }
  
        sendResponse(req, res, 200, {
          status: true,
          message: messages.dataFetched.en,
          messageArabic: messages.dataFetched.ar,
          data: finalAppointments,
          errorCode: null,
        });
      }
  
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        message: `Failed to get data.`,
        body: error,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  
  
  async getDoctorPortalData(req, res) {
    try {
      const { doctorId } = req.query;

      let finduser = await PortalUser.findOne({_id: mongoose.Types.ObjectId(doctorId)})
    
      if(finduser){  
        return sendResponse(req, res, 200, {
          status: true,
          body:finduser,
          message: "List getting successfully!",
          errorCode: null,
        });
      }
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to fetch list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }


  async getAppointmentsWithDoctorPatientDetails(req, res) {
    try {
      const {startDate,endDate} = req.query;
      let filter = {};
      if (startDate) {
          let start = new Date(startDate);
          let end = endDate ? new Date(endDate) : new Date(); // Default endDate to today if not provided
          end.setHours(23, 59, 59, 999); // Ensure end time includes the full day
          filter.createdAt = { $gte: start, $lte: end };
      }



        const appointments = await Appointment.find(filter).select('doctorId patientId appointment_id consultationDate consultationTime status');
        const doctorIds = appointments.map(appt => appt.doctorId.toString());
        const patientIds = appointments.map(appt => appt.patientId.toString());


        const doctorData = await BasicInfo.find({ for_portal_user: { $in: doctorIds } })
            .select('for_portal_user full_name full_name_arabic');
        const getDetails = await httpService.postStaging(
            "patient/get-patient-details-by-id",
            { ids: patientIds },
            {},
            "patientServiceUrl"
        );

        const doctorMap = doctorData.reduce((map, doctor) => {
            map[doctor?.for_portal_user.toString()] = doctor;
            return map;
        }, {});
        const finalAppointments = await Promise.all(
            appointments.map(async appointment => {
                const doctorId = appointment.doctorId.toString();
                const patientId = appointment.patientId.toString();
                const doctor = doctorMap[doctorId] || {};
                const patient = getDetails.data[patientId] || {};

                return {
                    ...appointment.toObject(),
                    doctorName: doctor?.full_name || '',
                    doctorArabicName: doctor?.full_name_arabic || '',
                    patientName: patient?.full_name || '',
                    patientGender: patient?.gender || '',
                    mrnNuber: patient?.mrn_number || '',
                };
            })
        );

        return sendResponse(req, res, 200, {
            status: true,
            message: "Data fetched successfully",
            data: finalAppointments,
            totalAppointments: finalAppointments.length,
            errorCode: null,
        });
    } catch (error) {
      console.log(error.message)
        return sendResponse(req, res, 500, {
            status: false,
            message: "Failed to get data.",
            body: error,
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

  for (const data1 of data) {
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
  doctorController: new DoctorController(),
};
