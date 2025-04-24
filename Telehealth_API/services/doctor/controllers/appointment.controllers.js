"use strict";

// models
import mongoose from "mongoose";
import BasicInfo from "../models/basic_info";
import PortalUser from "../models/portal_user";
import Specialty from "../models/specialty_info";
import Appointment from "../models/appointment";
import DoctorAvailability from "../models/doctor_availability";
import Slot from "../models/slot";
import { config, messages } from "../config/constants";
import { sendResponse } from "../helpers/transmission";
import {
  generateToken,
  getNextSequenceValue,
} from "../middleware/utils";
import Http from "../helpers/httpservice";
import { sendNotification } from "../helpers/notification";
import { generateSignedUrl } from "../helpers/gcs";
const moment = require("moment/moment")
const httpService = new Http();

const createSlot = (date, slot, providerId, isRescheduled, appointmentData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const getSlot = await Slot.find({ providerId: { $eq: providerId }, slot, date })
      if (getSlot.length > 0) {
        return reject({
          status: false,
          message: "Slot already booked",
          errorCode: "SLOT_ALREADY_BOOKED"
        })
      }
      const create = new Slot({
        date,
        slot,
        providerId
      })
      const result = await create.save()
      if (isRescheduled) {
        await Slot.deleteOne({
          date: appointmentData?.consultationDate,
          slot: appointmentData?.consultationTime,
          providerId: providerId
        })
      }
      if (result) {
        resolve({
          status: true,
          message: "Slot created successfully"
        })
      } else {
        reject({
          status: false,
          message: "Something went wrong while creating slot",
          errorCode: "SLOT_NOT_CREATED"
        })
      }
    } catch (error) {
      reject({
        status: false,
        message: error.message
      })
    }
  })
}

function generateTimeSlots(startTime, endTime, slotInterval) {
  const startHour = parseInt(startTime.slice(0, 2));
  const startMinute = parseInt(startTime.slice(2));
  const endHour = parseInt(endTime.slice(0, 2));
  const endMinute = parseInt(endTime.slice(2));

  let slots = [];
  let currentHour = startHour;
  let currentMinute = startMinute;

  while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
    let nextHour = currentHour;
    let nextMinute = currentMinute + slotInterval;

    if (nextMinute >= 60) {
      nextMinute -= 60;
      nextHour++;
    }
    let slotStart = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    let slotEnd = `${String(nextHour).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`;

    slots.push({
      slot: `${slotStart}-${slotEnd}`,
      status: 0
    });

    currentHour = nextHour;
    currentMinute = nextMinute;
  }

  return slots;
}

class AppointmentController {
  async bookAppointment(req, res) {
    const headers = {
      Authorization: req.headers["authorization"],
    };
    try {
      const {
        reasonForAppointment,
        consultationDate,
        consultationTime,
        consultationFor,
        patientId,
        doctorId,
        patient_document_details,
        parent_patient_id,
      } = req.body;

      const findDoctorLock = await PortalUser.findOne({
        _id: mongoose.Types.ObjectId(doctorId),
      });

      if (findDoctorLock?.lock_user === true) {
        return sendResponse(req, res, 200, {
          status: false,
          message: messages.doctorCurrentlyunavailable.en,
          messageArabic: messages.doctorCurrentlyunavailable.ar,
          body: null,
          errorCode: null,
        });
      }

      //Get patient subscription details and prevent them to book an appointment if consultation count is 0
      const getData = await httpService.getStaging(`patient/get-patient-subscription-details/${patientId}`, {}, headers, 'patientServiceUrl');
      if (!getData.status) {
        return sendResponse(req, res, 500, {
          status: false,
          body: null,
          message: getData.message,
          errorCode: null,
        })
      }
      const subscriptionDetails = getData?.data?.subscriptionDetails?.subscriptionDetails
      if (subscriptionDetails?.services?.consultation <= 0) {
        return sendResponse(req, res, 200, {
          status: false,
          message: messages.consultationNotAvailable.en,
          messageArabic: messages.consultationNotAvailable.ar,
          key: "addon",
          body: null,
          errorCode: null,
        });
      }
      const getPatientAppointment = await Appointment.find({
        patientId: mongoose.Types.ObjectId(patientId),
        status: { $in: ["APPROVED"] },
        patientConfirmation: { $ne: 'declined' }
      })

      if (getPatientAppointment.length > 0) {
        return sendResponse(req, res, 200, {
          status: false,
          message: messages.cannotBookAppointment.en,
          messageArabic: messages.cannotBookAppointment.ar,
          body: null,
          errorCode: null,
        });
      }
      const requestedDate = moment(`${consultationDate} ${consultationTime.split('-')[0]}:00`)
      const currentDate = moment()
      if (requestedDate.unix() < currentDate.unix()) {
        return sendResponse(req, res, 200, {
          status: false,
          message: messages.cannotBookAppointmentforpreviousDate.en,
          messageArabic: messages.cannotBookAppointmentforpreviousDate.ar,
          body: null,
          errorCode: null,
        });
      }

      const doctorAvailability = await DoctorAvailability.findOne({
        for_portal_user: doctorId,
      });


      if (!doctorAvailability) {
        return sendResponse(req, res, 400, {
          status: false,
          message: "Doctor availability data not found.",
          errorCode: "DOCTOR_AVAILABILITY_NOT_FOUND",
        });
      }

      const consultationDay = moment(consultationDate, "YYYY-MM-DD").format("ddd").toLowerCase();
      const weekSchedule = doctorAvailability.week_days[0];
      const dayStartKey = `${consultationDay}_start_time`;
      const dayEndKey = `${consultationDay}_end_time`;

      const availableStartTime = moment(`${consultationDate} ${weekSchedule[dayStartKey]}`, "YYYY-MM-DD HHmm");
      const availableEndTime = moment(`${consultationDate} ${weekSchedule[dayEndKey]}`, "YYYY-MM-DD HHmm");
      const selectedTime = moment(`${consultationDate} ${consultationTime.replace(":", "")}`, "YYYY-MM-DD HHmm");

      if (selectedTime.isBefore(availableStartTime) || selectedTime.isAfter(availableEndTime)) {
        return sendResponse(req, res, 200, {
          status: false,
          message: `The selected time is outside the doctor's working hours (${weekSchedule[dayStartKey]} - ${weekSchedule[dayEndKey]}). Please choose a different time.`,
          errorCode: "OUTSIDE_WORKING_HOURS",
        });
      }

      if (doctorAvailability.unavailability_slot?.length) {
        for (const slot of doctorAvailability.unavailability_slot) {
          if (slot.date === consultationDate) {
            const startTime = moment(`${consultationDate} ${slot.start_time}`, "YYYY-MM-DD HHmm");
            const endTime = moment(`${consultationDate} ${slot.end_time}`, "YYYY-MM-DD HHmm");

            if (selectedTime.isBetween(startTime, endTime, null, "[)")) {
              return sendResponse(req, res, 200, {
                status: false,
                message: "This time slot is unavailable. Please select another time.",
                errorCode: "SLOT_UNAVAILABLE",
              });
            }
          }
        }
      }

      let doctordetails = await BasicInfo.findOne({
        for_portal_user: doctorId,
      });

      const getPatient = await httpService.getStaging('patient/patient-details', { patient_id: patientId }, headers, 'patientServiceUrl');
      let patientName, patientProfilePic;
      if (getPatient?.status) {
        patientName = getPatient?.body?.personalDetails?.full_name
        patientProfilePic = getPatient?.body?.personalDetails?.profile_pic
      }

      let patientUser = {
        user_id: patientId,
        name: patientName,
        image: patientProfilePic,
      }

      if (getPatient?.status && getPatient?.body?.isDependent) {
        patientUser = {
          user_id: getPatient?.body?.portalUserDetails?.parent_userid,
          name: patientName,
          image: patientProfilePic,
        }
      }

      let userarray = [
        patientUser,
        {
          user_id: doctorId,
          name: doctordetails?.full_name,
          image: "",
        },
      ];

      await createSlot(consultationDate, consultationTime, doctorId)

      let createAppointmentId = await getNextSequenceValue("appointment");
      const appointmentData = new Appointment({
        appointment_id: "APPOINTMENT-" + createAppointmentId,
        reasonForAppointment,
        consultationDate,
        consultationTime,
        consultationFor,
        patientId,
        doctorId,
        created_by: req?.user?.portalUserId,
        patient_document_details,
        parent_patient_id,
        users: userarray,
      });
      await appointmentData.save();
      let paramsData = {
        sendTo: 'doctor',
        madeBy: 'patient',
        patientId,
        doctorId,
        consultationDate,
        consultationTime,
        appointment: {
          _id: appointmentData?._id
        },
        condition: 'BOOK_DOCTOR_APPOINTMENT',
        notification: ['sms', 'email']
      }

      sendNotification(paramsData, headers)

      return sendResponse(req, res, 200, {
        status: true,
        message: messages.appointmentAdded.en,
        messageArabic: messages.appointmentAdded.ar,
        body: null,
        errorCode: null,
      });

    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: error.message ? error.message : `failed to add appointment`,
        errorCode: error.errorCode ? error.errorCode : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // 11 Feb 2025 ---- Altamash
  async listAppointment(req, res) {

    try {
      const {
        patientId,
        doctorId,
        page,
        limit,
        status,
        date,
        fromDate,
        toDate,
        consultationFor,
        sort,
        type
      } = req.query;

      // Get all patient data for requested doctor
      let patientData = {};
      if (req?.user?.role == 'INDIVIDUAL_DOCTOR' || req?.user?.role == 'INDIVIDUAL_DOCTOR_ADMIN') {
        let getAllAppointment;
        if (doctorId && doctorId == 'all') {
          getAllAppointment = await Appointment.find({}).select('patientId');
        } else {
          getAllAppointment = await Appointment.find({ doctorId: { $eq: doctorId ? doctorId : req?.user?._id } }).select('patientId');
        }
        const idsArray = getAllAppointment.map(val => val?.patientId.toString());
        const patientIdsArray = [...new Set(idsArray)];

        const getDetails = await httpService.postStaging(
          "patient/get-patient-details-by-id",
          { ids: patientIdsArray },
          {},
          "patientServiceUrl"
        );
        if (getDetails.status) {
          patientData = getDetails?.data;
        }
      }

      // Sorting logic
      let allSort = {};
      if (sort != "undefined" && sort != "" && sort != undefined) {
        let keynew = sort.split(":")[0];
        let value = sort.split(":")[1];
        allSort[keynew] = Number(value);
      } else {
        allSort["createdAt"] = -1;
      }

      let appointmentStatus;
      if (type === 'past') {
        appointmentStatus = ['COMPLETED', 'MISSED', 'CANCELLED'];
      } else {
        appointmentStatus = status === 'ALL' ? ["PENDING", "CANCELLED", "APPROVED", "COMPLETED", "MISSED"] : [status];
      }

      let date_filter = {}
      if (date) {
        date_filter['consultationDate'] = date
      }
      let patient_filter = {};
      if (patientId) {
        patient_filter['patientId'] = mongoose.Types.ObjectId(patientId);
      }
      let consultationFor_filter = {};
      if (consultationFor) {
        consultationFor_filter['consultationFor'] = consultationFor;
      }
      if (fromDate && toDate) {
        date_filter = {
          consultationDate: { $gte: fromDate, $lte: toDate }
        };
      }

      const pipeline = [
        {
          $match: {
            // status: status === 'ALL' ? {$in: appointmentStatus} : appointmentStatus,
            status: { $in: appointmentStatus },
            $and: [
              date_filter,
              patient_filter,
              consultationFor_filter
            ]
          }
        },
        {
          $lookup: {
            from: "basicinfos",
            localField: "doctorId",
            foreignField: "for_portal_user",
            as: "doctorbasicinfos",
          },
        },
        {
          $unwind: {
            path: "$doctorbasicinfos",
            preserveNullAndEmptyArrays: true,
          }
        },
        {
          $addFields: {
            doctorName: "$doctorbasicinfos.full_name",
            doctorNameArabic: "$doctorbasicinfos.full_name_arabic",
            speciality: "$doctorbasicinfos.speciality",
          },
        }
      ];

      // Patient role specific filtering
      if (req?.user?.role == 'patient') {
        if (consultationFor == 'family-member') {
          pipeline.push({ $match: { created_by: mongoose.Types.ObjectId(req?.user?.portalUserId) } });
        } else {
          pipeline.push({ $match: { patientId: mongoose.Types.ObjectId(req?.user?.portalUserId) } });
        }
      } else if (req?.user?.role == 'INDIVIDUAL_DOCTOR' && type !== 'past') {
        pipeline.push({ $match: { doctorId: mongoose.Types.ObjectId(req?.user?._id) } });
      } else if (req?.user?.role == 'INDIVIDUAL_DOCTOR_ADMIN' && doctorId != 'all') {
        pipeline.push({ $match: { doctorId: mongoose.Types.ObjectId(doctorId) } });
      }

      // Grouping appointments
      pipeline.push({
        $group: {
          _id: "$_id",
          appointmentId: { $first: "$appointment_id" },
          createdAt: { $first: "$createdAt" },
          patientId: { $first: "$patientId" },
          parent_patient_id: { $first: "$parent_patient_id" },
          doctorId: { $first: "$doctorId" },
          consultationDate: { $first: "$consultationDate" },
          consultationTime: { $first: "$consultationTime" },
          status: { $first: "$status" },
          patientConfirmation: { $first: "$patientConfirmation" },
          doctorName: { $first: "$doctorName" },
          doctorNameArabic: { $first: "$doctorNameArabic" },
          speciality: { $first: "$speciality" },
          created_by: { $first: "$created_by" }
        }
      });

      // Sorting by specific field
      if (Object.keys(allSort).length > 0) {
        pipeline.push({ $sort: allSort });
      }

      // Pagination logic
      pipeline.push(
        {
          $facet: {
            totalCount: [{ $count: 'count' }],
            paginatedResults: [
              { $skip: (page - 1) * limit },
              { $limit: limit * 1 },
            ]
          }
        }
      );

      // Run the aggregation pipeline
      const result = await Appointment.aggregate(pipeline);
      const statuses = {
        PENDING: 'Pending',
        CANCELLED: 'Cancelled',
        APPROVED: 'Upcoming',
        COMPLETED: 'Completed',
        MISSED: 'Missed'
      };

      // Process results
      const paginatedResults = result[0].paginatedResults;
      for (let index = 0; index < paginatedResults.length; index++) {
        if (req?.user?.role == 'patient') {
          // Specialties for patient
          const specialities = await Specialty.find({ active_status: true, delete_status: false });
          const specialitiesObject = {};
          for (const elem of specialities) {
            specialitiesObject[elem._id] = {
              specilization: elem?.specilization,
              specilization_arabic: elem?.specilization_arabic,
            };
          }
          const doctorSpecialty = paginatedResults[index].speciality.map(specialty => specialitiesObject[specialty.toString()].specilization);
          const doctorSpecialtyArabic = paginatedResults[index].speciality.map(specialty => specialitiesObject[specialty.toString()].specilization_arabic);
          paginatedResults[index].doctorSpecialty = doctorSpecialty;
          paginatedResults[index].doctorSpecialtyArabic = doctorSpecialtyArabic;
          delete paginatedResults[index].speciality;
        }

        if (req?.user?.role == 'INDIVIDUAL_DOCTOR' || req?.user?.role == 'INDIVIDUAL_DOCTOR_ADMIN') {
          paginatedResults[index].patientName = patientData[paginatedResults[index].patientId.toString()]?.full_name;
          paginatedResults[index].patientProfile = patientData[paginatedResults[index].patientId.toString()]?.profile_pic;
        }

        paginatedResults[index].doctorName = paginatedResults[index].doctorName;
        paginatedResults[index].doctorNameArabic = paginatedResults[index].doctorNameArabic;
        paginatedResults[index].doctorProfile = '';
        paginatedResults[index].status = statuses[paginatedResults[index].status];
        paginatedResults[index].created_by = paginatedResults[index].created_by;
      }

      let totalCount = 0;
      if (result[0].totalCount.length > 0) {
        totalCount = result[0].totalCount[0].count;
      }

      return sendResponse(req, res, 200, {
        status: true,
        message: messages.appointmentsFetched.en,
        messageArabic: messages.appointmentsFetched.ar,
        data: {
          totalRecords: totalCount,
          currentPage: page,
          totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
          data: result[0]?.paginatedResults,
        },
        errorCode: null,
      });

    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        message: error.message ? error.message : `something went wrong while fetching list`,
        body: error,
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }


  async cancelAndApproveAppointment(req, res) {
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };

      const {
        appointmentId,
        cancelReason,
        status,
        cancelledOrAcceptedBy,
        cancel_by,
        parent_patient_id
      } = req.body;
      const getAppointment = await Appointment.findById(appointmentId);
      if (!getAppointment) {
        return sendResponse(req, res, 500, {
          status: false,
          data: null,
          message: messages.appointmentNotExist.en,
          messageArabic: messages.appointmentNotExist.ar,
          errorCode: null,
        });
      }

     await Appointment.findOneAndUpdate(
        { _id: { $eq: appointmentId } },
        {
          $set: {
            cancelReason,
            status,
            cancelledOrAcceptedBy,
            cancel_by,
          },
        },
        { new: true }
      ).exec();
      if (cancel_by == 'doctor' && status === 'CANCELLED') {
        // Patient will get bonuses consultation
        await httpService.putStaging(
          "patient/update-consultation-count",
          { patient_id: parent_patient_id, serviceType: 'consultation', count: 1, isAdd: true },
          headers,
          "patientServiceUrl"
        );
      }
      if (status === 'CANCELLED') {
        const getAppointmentData = await Appointment.findById(appointmentId).select('consultationDate consultationTime doctorId')
        await Slot.deleteOne({
          date: getAppointmentData?.consultationDate,
          slot: getAppointmentData?.consultationTime,
          providerId: getAppointmentData?.doctorId
        })
      }

      let sendTo = 'patient'
      let madeBy = 'doctor'
      let condition = status == 'CANCELLED' ? `REJECTED_DOCTOR_APPOINTMENT` : `APPROVED_DOCTOR_APPOINTMENT`
      if (req?.user?.role == 'patient' && status == 'CANCELLED') {
        sendTo = 'doctor'
        madeBy = 'patient'
        condition = `CANCELLED_DOCTOR_APPOINTMENT`
      }

      let paramsData = {
        sendTo,
        madeBy,
        patientId: getAppointment?.patientId,
        doctorId: getAppointment?.doctorId,
        appointment: {
          _id: getAppointment?._id
        },
        consultationDate: getAppointment?.consultationDate,
        consultationTime: getAppointment?.consultationTime,
        condition,
        notification: status == 'CANCELLED' && req?.user?.role == 'patient' ? ['push_notification', 'sms', 'email'] : ['sms', 'email'],
      }
      sendNotification(paramsData, headers)

      const message = status == "CANCELLED" ? "cancelled" : "approved";

      return sendResponse(req, res, 200, {
        status: true,
        data: null,
        message: message == "cancelled" ? messages.appointment_cancelled.en : messages.appointment_approved.en,
        messageArabic: message == "cancelled" ? messages.appointment_cancelled.ar : messages.appointment_approved.ar,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `Something went wrong while cancelling appointment.`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /** New function created to updated status eod - Mar 12, 2024 */
  async updateAppointmentStatus(req, res) {
    try {
      // Get current time in the configured timezone
      const currentTime = moment().tz(config.TIMEZONE);

      // Ensure this logic runs only at 11:59 PM
      if (currentTime.format('HH:mm') !== '23:59') {
        return;
      }

      // Generate random token to be used for authenticating API for CRON
      const token = generateToken({ role: 'patient' });
      const headers = {
        Authorization: 'Bearer ' + token,
      };

      // Fetch appointments with 'PENDING' or 'APPROVED' status
      const appointments = await Appointment.find({
        status: { $in: ['PENDING', 'APPROVED'] },
      }).select('consultationDate consultationTime patientId doctorId');

      const missedAppointments = []; // To store IDs of missed appointments
      const processedAppointments = new Set(); // Track appointments we've already notified about

      for (const appointment of appointments) {
        const appointmentDate = moment.tz(
          `${appointment.consultationDate} ${appointment.consultationTime}`,
          "YYYY-MM-DD HH:mm",
          config.TIMEZONE
        );

        // Check if the appointment date is before the current time
        if (appointmentDate.isBefore(currentTime) && !processedAppointments.has(appointment._id.toString())) {
          missedAppointments.push(appointment._id);
          processedAppointments.add(appointment._id.toString()); // Mark this appointment as processed

          // Prepare notification parameters
          const paramsData = {
            sendTo: 'patient',
            madeBy: 'doctor',
            patientId: appointment.patientId,
            doctorId: appointment.doctorId,
            appointment: { _id: appointment._id },
            consultationDate: appointment.consultationDate,
            consultationTime: appointment.consultationTime,
            condition: 'MISSED_DOCTOR_APPOINTMENT',
            notification: ['push_notification', 'sms', 'email'],
          };

          // Send notification safely
          try {
            await sendNotification(paramsData, headers);
          } catch (notificationError) {
            console.error(
              `Failed to send notification for appointment ${appointment._id}:`,
              notificationError
            );
          }
        }
      }

      // Bulk update missed appointments
      if (missedAppointments.length > 0) {
        await Appointment.updateMany(
          { _id: { $in: missedAppointments } },
          { $set: { status: 'MISSED' } }
        );
      } else {
        console.log('No missed appointments found for today.');
      }
    } catch (error) {
      console.error('Error processing missed appointments:', error);
    }
  }


  async patientConfirmationForAppointment(req, res) {
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };

      const {
        appointmentId,
        status,
        cancelReason
      } = req.body;
      const getAppointment = await Appointment.findById(appointmentId);
      if (!getAppointment) {
        return sendResponse(req, res, 500, {
          status: false,
          data: null,
          message: messages.appointmentNotExist.en,
          messageArabic: messages.appointmentNotExist.ar,
          errorCode: null,
        });
      }
      let updateObject = {
        patientConfirmation: status,
      }
      if (status == 'declined') {
        updateObject['cancel_by'] = 'patient'
        updateObject['cancelledOrAcceptedBy'] = getAppointment?.patientId
        updateObject['declinedReason'] = cancelReason
        //Release doctor slot if patient declined appointment
        const getAppointmentData = await Appointment.findById(appointmentId).select('consultationDate consultationTime doctorId parent_patient_id')
        await Slot.deleteOne({
          date: getAppointmentData?.consultationDate,
          slot: getAppointmentData?.consultationTime,
          providerId: getAppointmentData?.doctorId
        })
      }
      await Appointment.findOneAndUpdate(
        { _id: { $eq: appointmentId } },
        {
          $set: updateObject,
        },
        { new: true }
      ).exec();

      if (status == 'confirmed') {
        await httpService.putStaging(
          "patient/update-consultation-count",
          { patient_id: getAppointment?.consultationFor == 'family-member' ? getAppointment?.parent_patient_id : getAppointment.patientId, serviceType: 'consultation', count: 1, isAdd: false },
          headers,
          "patientServiceUrl"
        );
      }

      let paramsData = {
        sendTo: 'doctor',
        madeBy: 'patient',
        patientId: getAppointment?.patientId,
        doctorId: getAppointment?.doctorId,
        appointment: {
          _id: getAppointment?._id
        },
        consultationDate: getAppointment?.consultationDate,
        consultationTime: getAppointment?.consultationTime,
        condition: status == 'declined' ? 'PATIENT_DECLINED_APPOINTMENT' : 'PATIENT_CONFIRMED_APPOINTMENT',
        notification: ['sms', 'email'],
      }
      sendNotification(paramsData, headers);

      //Dilip - Mar 25
      let paramsPatientData = {
        sendTo: 'patient',
        madeBy: 'patient',
        patientId: getAppointment?.patientId,
        parent_patient_id: getAppointment?.parent_patient_id,
        doctorId: getAppointment?.doctorId,
        appointment: {
          _id: getAppointment?._id
        },
        consultationDate: getAppointment?.consultationDate,
        consultationTime: getAppointment?.consultationTime,
        condition: status == 'declined' ? 'PATIENT_DECLINED_APPOINTMENT' : 'PATIENT_CONFIRMED_NEW_APPOINTMENT',
        notification: ['sms', 'email','push_notification'],
      }
      sendNotification(paramsPatientData, headers);

      return sendResponse(req, res, 200, {
        status: true,
        data: null,
        message: status=="declined"? messages.appointment_declined.en : messages.appointment_confirmed.en,
        messageArabic: status=="declined"? messages.appointment_declined.ar : messages.appointment_confirmed.ar,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `Something went wrong while cancelling appointment.`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async doctorAvailableSlot(req, res) {
    try {
      const { date, doctorId } = req.query
      const weekDayArray = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
      const newDate = moment(date).tz(config.TIMEZONE)
      const day = weekDayArray[newDate.day()]

      /** Set first priority to unavailability_slot (if there is data for the requested date) no slot will be return between start to end time
          Set second priority to week_days it will create and return all the slot between start and end time
        */

      //Get doctor availability data
      const availabilityData = await DoctorAvailability.find({ for_portal_user: { $eq: doctorId } })
      const { slot_interval, week_days, unavailability_slot } = availabilityData[0]

      //Generate all slots for respected day
      let allSlots = []
      for (const ele of week_days) {
        const startKey = `${day}_start_time`;
        const endKey = `${day}_end_time`;
        const timeSlots = generateTimeSlots(ele[startKey], ele[endKey], parseInt(slot_interval));
        const newSlot = [...allSlots, ...timeSlots]
        allSlots = newSlot
      }

      //Remove slot if the slot end time is greater than doctor slot end time
      const endKey = `${day}_end_time`;
      const doctorEndTime = week_days[week_days.length - 1][endKey]
      const slotEndTime = allSlots[allSlots.length - 1]?.slot.split('-')[1]?.replace(':', '')
      if (slotEndTime > doctorEndTime) {
        allSlots.pop()
      }

      //Remove slot if the requested date is current date and the time is past time
      const currentDate = moment().tz(config.TIMEZONE);
      if (currentDate.unix() > newDate.unix()) {
        // Format current time to numeric value
        const currentTime = currentDate.hours() * 100 + currentDate.minutes(); // Convert to HHMM format as a number
        const filterTime = allSlots.filter(slot => {
          // Extract slot start time, convert to HHMM format as a number
          const slotStartTime = parseInt(slot.slot.split('-')[0]?.replace(':', ''), 10);
          return slotStartTime > currentTime;
        });

        allSlots = filterTime;
      }

      //Remove booked slot for the requested date from allSlots
      const getBookedSlotData = await Slot.find({ date, providerId: { $eq: doctorId } })
      const bookedSlot = getBookedSlotData.map(slots => slots.slot)
      if (bookedSlot.length > 0) {
        const filterTime = allSlots.filter(slots => {
          return !bookedSlot.includes(slots.slot)
        })
        allSlots = filterTime
      }

      //Remove all unavailable slot for the requested date
      let allAvailableSlots = []
      const unavailableSlot = unavailability_slot.filter(slots => slots.date === date);
      /**Feb 10 Start*/
      if (unavailableSlot.length > 0) {
        for (const ele of unavailableSlot) {
          const startRemove = parseInt(ele.start_time.replace(':', ''), 10);
          const endRemove = parseInt(ele.end_time.replace(':', ''), 10);

          allSlots = allSlots.filter(slotObj => {
            const [start, end] = slotObj.slot.split('-');
            const startMinutes = parseInt(start.replace(':', ''), 10);
            const endMinutes = parseInt(end.replace(':', ''), 10);

            return !(startMinutes >= startRemove && endMinutes <= endRemove);
          });
        }
        allAvailableSlots = allSlots;
      } else {
        allAvailableSlots = allSlots;
      }

      return sendResponse(req, res, 200, {
        status: true,
        body: {
          allAvailableSlots,
        },
        message: messages.getTimeSlot.en,
        messageArabic: messages.getTimeSlot.ar,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `Failed to get time slot`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getAppointmentTimeline(req, res) {
    const headers = {
      Authorization: req.headers["authorization"],
    };

    try {
      const {
        status,
        consultationFor
      } = req.query;

      let appointmentStatus
      if (!status || status === 'ALL') {
        appointmentStatus = ["PENDING", "CANCELLED", "APPROVED", "COMPLETED", "MISSED"]
      } else {
        appointmentStatus = status.split(",")
      }

      let consultationFor_filter = {}
      if (consultationFor) {
        consultationFor_filter['consultationFor'] = consultationFor
      }

      const pipeline = [
        {
          $lookup: {
            from: "basicinfos",
            localField: "doctorId",
            foreignField: "for_portal_user",
            as: "doctorbasicinfos",
          },
        },
        {
          $unwind: {
            path: "$doctorbasicinfos",
            preserveNullAndEmptyArrays: true,
          }
        },
        {
          $addFields: {
            doctorName: "$doctorbasicinfos.full_name",
            doctorNameArabic: "$doctorbasicinfos.full_name_arabic",
            speciality: "$doctorbasicinfos.speciality",
            profile_pic_signed_url: "$doctorbasicinfos.profile_picture"
          },
        },
        {
          $match: {
            status: { $in: appointmentStatus },
            patientConfirmation: status && status == 'APPROVED' ? { $in: ['NA', 'confirmed'] } : { $in: ['NA', 'confirmed', 'declined'] }
          }
        },
      ]
      // if (consultationFor == 'family-member') {
      //   pipeline.push({ $match: { parent_patient_id: req?.user?.portalUserId } })
      // } else if (consultationFor == 'self') {
      //   pipeline.push({ $match: { patientId: mongoose.Types.ObjectId(req?.user?.portalUserId) } })
      // } else {
      //   pipeline.push({ $match: { created_by: mongoose.Types.ObjectId(req?.user?.portalUserId) } })
      // }
      //By Dilip
      if (consultationFor == 'family-member') {
        pipeline.push({ $match: { parent_patient_id: req?.user?.portalUserId } });
      } else if (consultationFor == 'self') {
        pipeline.push({ $match: { patientId: mongoose.Types.ObjectId(req?.user?.portalUserId) } });
      } else if (!consultationFor) {
        // If no filter → Show all timelines for parent
        pipeline.push({
          $match: {
            $or: [
              { parent_patient_id: req?.user?.portalUserId }, // Parent's bookings
              { patientId: mongoose.Types.ObjectId(req?.user?.portalUserId) } // Self bookings
            ]
          }
        });
      } else {
        pipeline.push({ $match: { created_by: mongoose.Types.ObjectId(req?.user?.portalUserId) } });
      }
      
      pipeline.push({
        $group: {
          _id: "$_id",
          patientId: { $first: "$patientId" },
          doctorId: { $first: "$doctorId" },
          consultationDate: { $first: "$consultationDate" },
          consultationTime: { $first: "$consultationTime" },
          consultationFor: { $first: "$consultationFor" },
          patientConfirmation: { $first: "$patientConfirmation" },
          doctorName: { $first: "$doctorName" },
          doctorNameArabic: { $first: "$doctorNameArabic" },
          profile_pic_signed_url : { $first: "$profile_pic_signed_url" },
          speciality: { $first: "$speciality" },
          status: { $first: "$status" },
          cancel_by: { $first: "$cancel_by" },
          cancelReason: { $first: "$cancelReason" },
        }
      },
        {
          $sort: {
            consultationDate: -1
          }
        })
      const result = await Appointment.aggregate(pipeline);
      const specialities = await Specialty.find({})
      const specialitiesObject = {}
      for (const elem of specialities) {
        specialitiesObject[elem._id] = {
          specilization: elem?.specilization,
          specilization_arabic: elem?.specilization_arabic,
        }
      }

      for (let index = 0; index < result.length; index++) {
        let doctorSpecialty = []
        let doctorSpecialtyArabic = []
        if (result[index].speciality.length > 0) {
          doctorSpecialty = result[index].speciality.map(specialty => specialitiesObject[specialty.toString()].specilization)
          doctorSpecialtyArabic = result[index].speciality.map(specialty => specialitiesObject[specialty.toString()].specilization_arabic)
        }
        result[index].doctorName = result[index].doctorName
        result[index].doctorNameArabic = result[index].doctorNameArabic
        result[index].doctorProfile = ''
        result[index].doctorSpecialty = doctorSpecialty
        result[index].doctorSpecialtyArabic = doctorSpecialtyArabic
        if(result[index].profile_pic_signed_url !== '') {
          result[index].profile_pic_signed_url = await generateSignedUrl(result[index].profile_pic_signed_url);
        }else{
          result[index].profile_pic_signed_url = ''
        }
        delete result[index].speciality
      }

      //Get all appointment of laboratory and radiology
      let labRadioAppointment = []
      const getAllAppointment = await httpService.getStaging(
        "appointment/all-appointment-for-timeline",
        { status, consultationFor },
        headers,
        "labradioServiceUrl"
      );
      if (getAllAppointment?.status) {
        labRadioAppointment = getAllAppointment?.data
      }

      const allAppointments = [...result, ...labRadioAppointment].sort((a, b) => new Date(b.consultationDate) - new Date(a.consultationDate))

      return sendResponse(req, res, 200, {
        status: true,
        message: messages.appointmentsFetched.en,
        messageArabic: messages.appointmentsFetched.ar,
        data: allAppointments,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        message: error.message
          ? error.message
          : `something went wrong while fetching list`,
        body: error,
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  
  async viewAppointment(req, res) {
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };
      const { appointment_id } = req.query;
      const resultData = await Appointment.findById(appointment_id)
        .populate({
          path: "doctorId",
          select: {
            email: 1,
            mobile: 1,
            country_code: 1,
            average_rating: 1
          },
        })

      let result = resultData.toObject()
      let patientDetails = {}
      //get patient details
      const getPatientDetails = await httpService.getStaging(
        "patient/patient-details",
        { patient_id: result.patientId },
        headers,
        "patientServiceUrl"
      );
      if (getPatientDetails?.status) {
        const patientAllDetails = getPatientDetails.body;
        patientDetails = {
          full_name: patientAllDetails?.personalDetails?.full_name,
          first_name: patientAllDetails?.personalDetails?.first_name,
          middle_name: patientAllDetails?.personalDetails?.middle_name,
          last_name: patientAllDetails?.personalDetails?.last_name,
          gender: patientAllDetails?.personalDetails?.gender,
          profile_pic: patientAllDetails?.personalDetails?.profile_pic,
          saudi_id: patientAllDetails?.personalDetails?.saudi_id || "",
          iqama_number: patientAllDetails?.personalDetails?.iqama_number || "",
          passport: patientAllDetails?.personalDetails?.passport || "",
          mrn_number: patientAllDetails?.personalDetails?.mrn_number || "",
          dob: patientAllDetails?.personalDetails?.dob,
          profile_pic_signed_url: patientAllDetails?.personalDetails?.profile_pic ? await generateSignedUrl(patientAllDetails?.personalDetails?.profile_pic) : "",
          patient_id: patientAllDetails?.portalUserDetails?._id,
          mobile: patientAllDetails?.portalUserDetails?.mobile,
          country_code: patientAllDetails?.portalUserDetails?.country_code,
          email: patientAllDetails?.portalUserDetails?.email,
          address: patientAllDetails?.locationDetails?.address,
          pincode: patientAllDetails?.locationDetails?.pincode,
          country: patientAllDetails?.locationDetails?.country,
          emergency_contact: patientAllDetails?.personalDetails?.emergency_contact
        }
        if (result?.parent_patient_id) {
          const getFamilyDetails = await httpService.getStaging(
            "patient/create-profile/list-family-member",
            { patientId: result?.parent_patient_id },
            headers,
            "patientServiceUrl"
          );
          if (getFamilyDetails?.status) {
            if ('familyMember' in getFamilyDetails?.data) {
              const getMember = getFamilyDetails?.data?.familyMember.filter(val => val?.familyMemberId == result.patientId)
              patientDetails.relationship = getMember[0]?.relationship
            }
          }
        }
      }
      const appointmentDetails = {
        appointment_id: result?._id,
        appointmentId: result?.appointment_id,
        consultationDate: result?.consultationDate,
        consultationTime: result?.consultationTime,
        consultationFor: result?.consultationFor,
        appointmentStatus: result?.status,
        reasonForAppointment: result?.reasonForAppointment,
        patientConfirmation: result?.patientConfirmation,
        cancelReason: result?.cancelReason,
      }
      const getBasicInfo = await BasicInfo.findOne({ for_portal_user: { $eq: result?.doctorId?._id } })
        .populate({ path: 'speciality', select: 'specilization' }).
        select('full_name')
      let doctor_basic_info = result?.doctorId
      doctor_basic_info['profile_pic'] = ''
      doctor_basic_info['speciality'] = getBasicInfo?.speciality
      doctor_basic_info['doctorName'] = getBasicInfo?.full_name
      doctor_basic_info['doctorNameArabic'] = getBasicInfo?.full_name_arabic

      return sendResponse(req, res, 200, {
        status: true,
        data: {
          patientDetails,
          appointmentDetails,
          doctor_basic_info,
        },
        message: messages.patientAppointmentFetched.en,
        messageArabic: messages.patientAppointmentFetched.ar,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: error.message,
        errorCode: error.code,
      });
    }
  }

  async viewAllAppointments(req, res) {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return sendResponse(req, res, 400, {
          status: false,
          message: "Invalid or empty appointment IDs.",
        });
      }

      // Convert string IDs to ObjectId
      const idArray = ids.map(id => mongoose.Types.ObjectId(id));

      // Fetch appointment details
      const appointmentDetails = await Appointment.find({ _id: { $in: idArray } })
        .populate({
          path: "doctorId",
          select: {
            full_name: 1,
            full_name_arabic: 1,
            email: 1,
            mobile: 1,
            country_code: 1,
            average_rating: 1,
          },
        });

      // If no appointments found
      if (!appointmentDetails || appointmentDetails.length === 0) {
        return sendResponse(req, res, 404, {
          status: false,
          message: "No appointments found.",
        });
      }

      return sendResponse(req, res, 200, {
        status: true,
        data: {
          appointmentDetails,
        },
        message: messages.patientAppointmentFetched.en,
        messageArabic: messages.patientAppointmentFetched.ar,
      });

    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        message: error.message,
        errorCode: error.code,
      });
    }
  }


  async rescheduleAppointment(req, res) {
    const headers = {
      Authorization: req.headers["authorization"],
    };
    try {
      const {
        appointmentId,
        rescheduleConsultationDate,
        rescheduleConsultationTime,
      } = req.body;

      const getAppointment = await Appointment.findById(appointmentId);
      if (!getAppointment) {
        return sendResponse(req, res, 500, {
          status: false,
          data: null,
          message: messages.appointmentNotExist.en,
          messageArabic: messages.appointmentNotExist.ar,
          errorCode: null,
        });
      }

      const requestedDate = moment(`${rescheduleConsultationDate} ${rescheduleConsultationTime.split('-')[0]}:00`)
      const currentDate = moment()
      if (requestedDate.unix() < currentDate.unix()) {
        return sendResponse(req, res, 200, {
          status: false,
          message: messages.cantRescheduleAppointment.en,
          messageArabic: messages.cantRescheduleAppointment.ar,
          body: null,
          errorCode: null,
        });
      }

      await createSlot(rescheduleConsultationDate, rescheduleConsultationTime, getAppointment?.doctorId, true, getAppointment)

      await Appointment.findOneAndUpdate(
        { _id: appointmentId },
        {
          $set: {
            consultationDate: rescheduleConsultationDate,
            consultationTime: rescheduleConsultationTime,
            is_rescheduled: true
          },
        },
        { upsert: false, new: true }
      ).exec();

      let paramsData = {
        sendTo: 'doctor',
        madeBy: 'patient',
        patientId: getAppointment?.patientId,
        doctorId: getAppointment?.doctorId,
        appointment: {
          _id: getAppointment?._id
        },
        consultationDate: getAppointment?.consultationDate,
        consultationTime: getAppointment?.consultationTime,
        newConsultationDate: rescheduleConsultationDate,
        newConsultationTime: rescheduleConsultationTime,
        condition: 'RESCHEDULE_DOCTOR_APPOINTMENT',
        notification: ['sms', 'email'],
      }
      sendNotification(paramsData, headers)

      return sendResponse(req, res, 200, {
        status: true,
        message: messages.appointmentRescheduled.en,
        messageArabic: messages.appointmentRescheduled.ar,
        body: null,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `Failed to rescheduled appointment`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getAllAppointmentByIds(req, res) {
    try {
      const {
        appointmentIds,
      } = req.query;

      const data = await Appointment.find({
        _id: { $in: appointmentIds }
      }).select('appointment_id')

      return sendResponse(req, res, 200, {
        status: true,
        message: messages.appointmentsFetched.en,
        messageArabic: messages.appointmentsFetched.ar,
        body: data,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `Failed to rescheduled appointment`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async getDoctorsCompletedAppointment(req, res) {
    try {
      const doctorId = req.params.id;
      const data = await Appointment.find({
        doctorId: { $eq: doctorId },
        patientId: { $eq: req?.user?.portalUserId },
        status: "COMPLETED",
      }).select('appointment_id')

      return sendResponse(req, res, 200, {
        status: true,
        message: messages.appointmentsFetched.en,
        messageArabic: messages.appointmentsFetched.ar,
        body: data,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `Failed to rescheduled appointment`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /** New function created to send reminder before 24 hr and 1 hr - Jan 24, 2024 */
  async sendReminderNotifications() {
    try {
      const token = generateToken({ role: "patient" });
      const headers = {
        Authorization: "Bearer " + token,
      };

      const currentDate = moment().tz(config.TIMEZONE);

      // Fetch appointments only within the relevant time range
      const getAppointment = await Appointment.find({
        status: { $in: ["APPROVED"] },
        patientConfirmation: "confirmed",
      }).select("consultationDate consultationTime patientId doctorId");

      for (const element of getAppointment) {
        const appointmentDate = moment.tz(
          `${element?.consultationDate} ${element?.consultationTime}`,
          "YYYY-MM-DD HH:mm",
          config.TIMEZONE
        );

        const reminder24HoursBeforeTime = appointmentDate
          .clone()
          .subtract(config.SEND_APPOINTMENT_REMINDER_BEFORE_24HOURS, "minutes");

        const reminder1HourBeforeTime = appointmentDate
          .clone()
          .subtract(config.SEND_APPOINTMENT_REMINDER_BEFORE_1HOUR, "minutes");

        // Check if the current time is within a minute of the reminder times
        const is24HoursBefore = currentDate.isBetween(reminder24HoursBeforeTime.clone().subtract(30, "seconds"), reminder24HoursBeforeTime.clone().add(30, "seconds"));
        const is1HourBefore = currentDate.isBetween(reminder1HourBeforeTime.clone().subtract(30, "seconds"), reminder1HourBeforeTime.clone().add(30, "seconds"));

        // Send notifications
        const notificationData = {
          sendTo: "patient",
          madeBy: "doctor",
          patientId: element?.patientId,
          doctorId: element?.doctorId,
          appointment: { _id: element?._id },
          consultationDate: element?.consultationDate,
          consultationTime: element?.consultationTime,
          notification: ["sms", "push_notification"],
        };

        try {
          
          if (is24HoursBefore) {
            await sendNotification({
              ...notificationData,
              reminderTime: config.SEND_APPOINTMENT_REMINDER_BEFORE_24HOURS,
              condition: "APPOINTMENT_REMINDER",
            }, headers);
          }

          if (is1HourBefore) {
            await sendNotification({
              ...notificationData,
              reminderTime: config.SEND_APPOINTMENT_REMINDER_BEFORE_1HOUR,
              condition: "APPOINTMENT_REMINDER",
            }, headers);
          }
        } catch (notificationError) {
          console.error(
            "Error sending notification for appointment ID:", element?._id,
            notificationError
          );
        }
      }
    } catch (error) {
      console.error("Error while sending reminder notifications:", error);
    }
  }


  async updateAppointment(req, res) {
    try {
      const { appointment_id, consultationDate, consultationTime, status } =
        req.body;

      if (!appointment_id || !consultationDate || !consultationTime || !status) {
        return sendResponse(req, res, 200, {
          status: true,
          message: "All fields are required.Field: appointment_id, consultationDate, consultationTime, status",
          errorCode: null,
        });
      }

      const updatedAppointment = await Appointment.findOneAndUpdate(
        { appointment_id: appointment_id },
        {
          consultationDate: consultationDate,
          consultationTime,
          status,
        },
        { new: true }
      );

      if (!updatedAppointment) {
        return sendResponse(req, res, 200, {
          status: false,
          message: messages.appointmentNotFound.en,
          messageArabic: messages.appointmentNotFound.ar,
          errorCode: null,
        });
      }
      return sendResponse(req, res, 200, {
        status: true,
        message: messages.appointmentUpdated.en,
        messageArabic: messages.appointmentUpdated.ar,
        errorCode: null,
      });

    } catch (error) {
      console.error("An error occurred:", error);
      return sendResponse(req, res, 500, {
        status: false,
        message: "An error occurred while updating the appointment",
        errorCode: null,
      });
    }
  }

  async patientCanChat(req, res) {
    try {
      const { patientId } = req.query;

      const getLatAppointment = await Appointment.findOne({ patientId: { $eq: patientId } })
        .select('consultationDate')
        .sort({ createdAt: -1 })
        .limit(1)

      const currentDate = moment().tz(config.TIMEZONE) // Current date

      const appointmentDate = moment.tz(
        `${getLatAppointment?.consultationDate}`,
        "YYYY-MM-DD",
        config.TIMEZONE
      );
      const dateAfterDaysAdd = moment(appointmentDate.add(config.CHAT_DAYS, 'days').format("YYYY-MM-DD")); // Add 15 days
      let patientDoctorCanCommunicate = false;
      if (currentDate.unix() <= dateAfterDaysAdd.unix()) {
        patientDoctorCanCommunicate = true
      }

      return sendResponse(req, res, 200, {
        status: true,
        data: {
          patientDoctorCanCommunicate
        },
        message: messages.recordFetched.en,
        messageArabic: messages.recordFetched.ar,
        errorCode: null,
      });

    } catch (error) {
      console.log(error);

      return sendResponse(req, res, 500, {
        status: false,
        message: "An error occurred while fetching records",
        errorCode: null,
      });
    }
  }

  async appointmentStatusMaskAsComplete(req, res) {
    try {

      const { appointmentId } = req.body;

      const getAppointment = await Appointment.findById(appointmentId);
      if (!getAppointment) {
        return sendResponse(req, res, 500, {
          status: false,
          data: null,
          message: messages.appointmentNotExist.en,
          messageArabic: messages.appointmentNotExist.ar,
          errorCode: null,
        });
      }

      await Appointment.findOneAndUpdate(
        { _id: { $eq: appointmentId } },
        {
          $set: {
            status: "COMPLETED",
          },
        },
        { new: true }
      ).exec();

      return sendResponse(req, res, 200, {
        status: true,
        data: null,
        message: messages.appointmentStatusUpdated.en,
        messageArabic: messages.appointmentStatusUpdated.ar,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `Something went wrong .`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

}

module.exports = new AppointmentController()