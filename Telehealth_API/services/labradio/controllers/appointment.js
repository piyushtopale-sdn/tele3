"use strict";

// utils
import { sendResponse } from "../helpers/transmission";
import Http from "../helpers/httpservice";
const httpService = new Http();
import mongoose from "mongoose";
import PortalUser from "../models/portal_user";
import ReviewAndRating from "../models/reviews";
import StaffProfile from "../models/staffProfile";
import BasicInfo from "../models/basic_info";
import Appointment from "../models/appointment";
import { getNextSequenceValue } from "../middleware/utils";
import moment from "moment";
import { notification } from "../helpers/notification";

export const formatDateToYYYYMMDD = async (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Add 1 to month because it's zero-based
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const formatDateAndTime = (date) => {
  const cdate = new Date(date);
  const currentdate = `0${cdate.getDate()}`;
  const month = `0${cdate.getMonth() + 1}`;
  const year = `${cdate.getFullYear()}`;

  // const newDate = `${currentdate.length > 2 ? currentdate.slice(1) : currentdate}-${month.length > 2 ? month.slice(2) : month}-${year} ${cdate.getUTCHours()}:${cdate.getUTCMinutes()}`
  const newDate = `${year}-${month.length > 2 ? month.slice(2) : month}-${
    currentdate.length > 2 ? currentdate.slice(1) : currentdate
  } ${cdate.getUTCHours()}:${cdate.getUTCMinutes()}`;
  return newDate;
};

export const updatePaymentStatusAndSlot = async (appointmentId) => {

  const appointmentDetails = await Appointment.findById(
    mongoose.Types.ObjectId(appointmentId)
  );

  let notificationReceiver = null;
  if (appointmentDetails.madeBy == "patient") {
    notificationReceiver = appointmentDetails.portalId;
  } else {
    notificationReceiver = appointmentDetails.patientId;
  }


  let timeStamp = new Date();
  let timeStampString;
  let slot = null;

  for (let index = 0; index < 3; index++) {

    const slots = [];

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

export default class appointmentController {
  async portalAppointment(req, res) {
    const headers = {
      Authorization: req.headers["authorization"],
    };

    try {
      const {
        appointmentId,
        loginId,
        portalId,
        hospital_details,
        madeBy,
        consultationFee,
        appointmentType,
        reasonForAppointment,
        consultationDate,
        consultationTime,
        consultationUserType,
        consultationFor,
        patientId,
        patientDetails,
        portal_Details,
        paymentType,
        paymentMode,
        portal_type,
        status,
      } = req.body;
      const consultationDate1 = new Date(consultationDate); // Your date object
      const consultation_date = await formatDateToYYYYMMDD(consultationDate1);

      let appointmentDetails;
      if (appointmentId != "") {
        if (
          paymentType != "" &&
          paymentType != undefined &&
          paymentMode != ""
        ) {
          appointmentDetails = await Appointment.findOneAndUpdate(
            { _id: appointmentId, portal_type },
            {
              $set: {
                paymentType,
                paymentMode,
                status: "NEW",
              },
            },

            { upsert: false, new: true }
          ).exec();

          if (paymentType == "post-payment") {
            updatePaymentStatusAndSlot(appointmentId, req);
          }
        } else {

          appointmentDetails = await Appointment.findOneAndUpdate(
            { _id: appointmentId, portal_type },
            {
              $set: {
                portalId,
                hospital_details,
                consultationFee,
                appointmentType,
                reasonForAppointment,
                consultationDate: consultation_date,
                consultationTime,
                consultationUserType,
                patientDetails,
                portal_Details,
                consultationFor,
              },
            },
            { upsert: false, new: true }
          ).exec();
        }
        let portalfullName = await PortalUser.findOne({ _id: portalId });
        let receiverId;
        let serviceurl;
        let message;
        if (madeBy === "patient") {
          receiverId = portalId;
          serviceurl = "labradioServiceUrl";
          message = `New Appointement from ${appointmentDetails?.patientDetails?.patientFullName}`;
        } else {
          receiverId = patientId;
          serviceurl = "patientServiceUrl";
          message = `New Appointement from ${portalfullName?.full_name}`;
        }
        // let message = `New Appointement from ${appointmentDetails?.patientDetails?.patientFullName}`
        let requestData = {
          created_by_type: portal_type,
          created_by: loginId,
          content: message,
          url: "",
          for_portal_user: receiverId,
          notitype: "Booked Appointment",
          appointmentId: appointmentDetails?._id,
          title: "New Appointment",
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
        sendResponse(req, res, 200, {
          status: true,
          body: appointmentDetails,
          message: `Appointment updated successfully`,
          errorCode: null,
        });
      } else {
        let portal_details = await BasicInfo.findOne({
          for_portal_user: portalId,
          portal_type,
        });
        let protal_image = "";
        let userarray = [
          {
            user_id: patientId,
            name: patientDetails.patientFullName,
            image: patientDetails.patientImage,
          },
          {
            user_id: portalId,
            name: portal_details?.full_name,
            image: protal_image ? protal_image : "",
          },
        ];
        let appointment_id = await getNextSequenceValue("appointment");
        const appointmentData = new Appointment({
          loginId,
          portalId,
          hospital_details,
          madeBy,
          consultationFee,
          appointmentType,
          reasonForAppointment,
          consultationDate: consultation_date,
          consultationTime,
          consultationUserType,
          paymentType,
          paymentMode,
          patientId,
          patientDetails,
          portal_Details,
          order_id: "APPOINTMENT-" + appointment_id,
          users: userarray,
          consultationFor,
          status,
          portal_type,
        });
        appointmentDetails = await appointmentData.save();

        let portalfullName = await PortalUser.findOne({ _id: portalId });
        let receiverId;
        let serviceurl;
        let message;
        if (madeBy === "patient") {
          receiverId = portalId;
          serviceurl = "labradioServiceUrl";
          message = `New Appointement from ${appointmentDetails?.patientDetails?.patientFullName}`;
        } else {
          receiverId = patientId;
          serviceurl = "patientServiceUrl";
          message = `New Appointement from ${portalfullName?.full_name}`;
        }

        let requestData = {
          created_by_type: portal_type,
          created_by: loginId,
          content: message,
          url: "",
          for_portal_user: receiverId,
          notitype: "Booked Appointment",
          appointmentId: appointmentDetails?._id,
          title: "New Appointment",
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
        //

        sendResponse(req, res, 200, {
          status: true,
          body: appointmentDetails,
          message: `Appointment added successfully`,
          errorCode: null,
        });
      }
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `failed to add appointment`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async portal_viewAppointment(req, res) {
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };
      const { appointment_id, portal_type } = req.query;
      const result = await Appointment.findById(appointment_id)
        .populate({
          path: "portalId",
          select: {
            email: 1,
            mobile: 1,
            country_code: 1,
          },
        })
        .populate({
          path: "reasonForAppointment",
          select: {
            name: 1,
          },
        });
      const basic_info = await BasicInfo.find({
        for_portal_user: { $eq: result.portalId._id },
        portal_type,
      })
        .select({
          for_portal_user: 1,
          full_name: 1,
          speciality: 1,
          years_of_experience: 1,
        })
        .populate({ path: "profile_picture", select: "url" })
        .populate({ path: "in_fee_management" })
        .populate({ path: "in_location" });

      let basic_info_data = [
        {
          ...basic_info[0]?._doc,
        },
      ];

      if (basic_info[0].speciality) {
        const specialityData = await httpService.getStaging(
          "hospital/get-speciality-data",
          { data: basic_info[0].speciality },
          {},
          "hospitalServiceUrl"
        );

        if (specialityData) {
          basic_info_data[0].speciality = specialityData.data[0].specilization;
        } else {
          basic_info_data[0].speciality = "";
        }
      }

      const portalUser = await PortalUser.findById(
        basic_info[0].for_portal_user,
        portal_type
      ).select("average_rating");
      const getRatingCount = await ReviewAndRating.find({
        portal_id: { $eq: result.portalId._id },
      }).countDocuments();
      const doctor_rating = {
        average_rating: portalUser.average_rating,
        total_review: getRatingCount,
      };
      let docArray = [];
      if (result.portal_Details.length > 0) {
        const resData = await httpService.postStaging(
          "patient/get-patient-documents-by-ids",
          { ids: result.portal_Details },
          headers,
          "patientServiceUrl"
        );
        const patientDoc = resData.data;
        for (const doc of patientDoc) {
          docArray.push({
            doc_name: doc.name,
            issue_date: doc.issue_date,
            expiration_date: doc.expiration_date,
            image: doc.image,
            image_url: doc.image_signed_url,
          });
        }
      }

      let patient_profile = "";
      let patient_profile_response = await httpService.getStaging(
        "patient/get-patient-profile-signed-url",
        { patientId: result.patientId },
        headers,
        "patientServiceUrl"
      );
      patient_profile = patient_profile_response?.body
        ? patient_profile_response?.body?.profile_signed_url
        : "";
      let otherinfo = {
        ANSJSON: result?.ANSJSON,
        consultationData: result?.consultationData,
        templateJSON: result?.templateJSON,
      };

      if (result.cancelledOrAcceptedBy != null) {
        if (result.cancel_by == "patient") {
          result.cancel_by = "patient";
        } else {
          const findDoc = await PortalUser.findOne({
            _id: result.cancelledOrAcceptedBy,
          });

          if (findDoc.role == "INDIVIDUAL") {
            const docName = await BasicInfo.findOne({
              for_portal_user: findDoc._id,
              type: portal_type,
            });
            result.cancel_by = docName.full_name;
          } else {
            const staffName = await StaffProfile.findOne({
              for_portal_user: findDoc._id,
              type: portal_type,
            });
            result.cancel_by = staffName.name;
          }
        }
      }

      sendResponse(req, res, 200, {
        status: true,
        data: {
          patient_profile: patient_profile,
          result,
          doctor_basic_info: basic_info_data,
          doctor_rating,
          patient_document: docArray,
          otherinfo,
        },
        message: `Appointment fetched successfully`,
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: error.message
          ? error.message
          : `something went wrong while fetching appointment`,
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async portal_updateAppointmentPaymentStatus(req, res) {
    try {
      const { data } = req.body;
      if (data?.metadata) {
        await Appointment.updateOne(
          { order_id: data?.metadata?.order_id },
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
        updatePaymentStatusAndSlot(data?.metadata?.order_id);

        sendResponse(req, res, 200, {
          status: true,
          body: null,
          message: "data updated succesfully",
          errorCode: null,
        });
      } else {
        await Appointment.updateOne(
          { order_id: data?.order_id },
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
        updatePaymentStatusAndSlot(data?.order_id);

        sendResponse(req, res, 200, {
          status: true,
          body: null,
          message: "data updated succesfully",
          errorCode: null,
        });
      }
    } catch (error) {
      console.error("An error occurred:", error);
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

  async portal_cancelAppointment(req, res) {
    try {
  
      const {
        appointment_id,
        loginId,
        cancelReason,
        status,
        cancelledOrAcceptedBy,
        fromDate,
        toDate,
        consultationType,
        cancel_by,
      } = req.body;
      if (fromDate && toDate) {
        let cancelIddoctor = cancelledOrAcceptedBy;

        let filter = {
          consultationDate: { $gte: fromDate, $lte: toDate },
          portalId: cancelIddoctor,
          status: { $in: ["NEW", "APPROVED"] },
        };

        if (!consultationType || consultationType == "all") {
          filter.appointmentType = {
            $in: ["ONLINE", "FACE_TO_FACE", "HOME_VISIT"],
          };
        } else {
          filter.appointmentType = { $in: consultationType };
        }

        await Appointment.updateMany(
          filter,
          {
            $set: {
              loginId,
              cancelReason,
              status,
              cancelledOrAcceptedBy,
              cancel_by,
            },
          },
          { new: false }
        ).exec();
      } else {
        await Appointment.findOneAndUpdate(
          { _id: { $eq: appointment_id } },
          {
            $set: {
              loginId,
              cancelReason,
              status,
              cancelledOrAcceptedBy,
              cancel_by,
            },
          },
          { new: true }
        ).exec();
      }

      const message = status == "REJECTED" ? "cancelled" : "Approved";

      sendResponse(req, res, 200, {
        status: true,
        data: null,
        message: `Patient appointment ${message} successfully!`,
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `Something went wrong while cancelling appointment.`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async portal_appointmentDetails(req, res) {
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };
      const { appointment_id, portal_type } = req.query;
      const result = await Appointment.findById(appointment_id)
        .populate({
          path: "portalId",
          select: {
            email: 1,
            mobile: 1,
            country_code: 1,
          },
        })
        .populate({
          path: "assigned_staff",
          select: {
            email: 1,
            mobile: 1,
            country_code: 1,
          },
        })
        .populate({
          path: "reasonForAppointment",
          select: {
            name: 1,
          },
        });

      let patinetDetails = {
        // patient_name: result.patientDetails.patientFullName,
        patientId: result.patientDetails.patientId,
        patient_name: `${result.patientDetails.patientFirstName} ${result.patientDetails.patientMiddleName} ${result.patientDetails.patientLastName}`,
        patient_mobile: result.patientDetails.patientMobile,
        patient_email: result.patientDetails.patientEmail,
        patient_dob: result.patientDetails.patientDob,
        patient_gender: result.patientDetails.gender,
        patient_ssn_number: "",
        patient_matital_status: "",
        address: result.patientDetails.address,
        loc: result.patientDetails.loc,
        postal_code: "",
        country: "",
        emergency_contact: {
          name: "",
          relationship: "",
          mobile: "",
          address: "",
        },
        patient_profle: "",
      };
      let assignedStaff = [];
      if (result.assigned_staff.length > 0) {
        const getStaff = await StaffProfile.find({
          for_portal_user: { $in: result.assigned_staff },
          type: portal_type,
        }).populate({
          path: "for_portal_user",
          select: { email: 1, mobile: 1, country_code: 1 },
        });

        for (const staff of getStaff) {
          let image = "";
          assignedStaff.push({
            name: staff.name,
            staff_portal_id: staff.for_portal_user._id,
            profile_picture: image,
            email: staff.for_portal_user.email,
            mobile: staff.for_portal_user.mobile,
            country_code: staff.for_portal_user.country_code,
          });
        }
      }
      const date = formatDateAndTime(new Date());
      let status = "";
      if (result.status === "NEW") status = "New";
      if (result.status === "REJECTED") status = "Rejected";
      if (result.status == "PAST") status = "Past";
      if (result.status == "MISSED") status = "Missed";
      if (result.status === "APPROVED") {
        status = date == result.consultationDate ? "Today" : "Upcoming";
      }
      const appointmentDetails = {
        appointment_id: result._id,
        date: result.consultationDate,
        time: result.consultationTime,
        consultationType: result.appointmentType,
        consultationFee: result.consultationFee,
        reasonForAppointment: result.reasonForAppointment,
        cancelReason: result.cancelReason,
        cancel_by: result.cancel_by,
        order_id: result.order_id ? result.order_id : "",
        status,
        consultationData: result.consultationData
          ? result.consultationData
          : "",
        portalId: result?.portalId?._id,
        hospital_details: result?.hospital_details,
        paymentStatus: result.isPaymentDone,
        paymentType: result.paymentType,
        paymentdetails: result?.paymentDetails,
      };
      let patientAllDetails = "";
      if (result.patientId != null) {
        const getPatientDetails = await httpService.getStaging(
          "patient/patient-details",
          { patient_id: result.patientId },
          headers,
          "patientServiceUrl"
        );
        patientAllDetails = getPatientDetails.body;

        if (patientAllDetails.personalDetails.in_location) {
          let getLocationDetails = await httpService.postStaging(
            "superadmin/get-locations-name",
            { location: patientAllDetails.locationDetails },
            headers,
            "superadminServiceUrl"
          );
          const locationDetails = getLocationDetails.body;
          patinetDetails.postal_code = locationDetails.pincode;
          patinetDetails.country = locationDetails.countryName.name;
          patinetDetails.emergency_contact.address = locationDetails.address;
        }
        patinetDetails.emergency_contact =
          patientAllDetails.personalDetails.emergency_contact;
        let patient_profile_response = await httpService.getStaging(
          "patient/get-patient-profile-signed-url",
          { patientId: result.patientId },
          headers,
          "patientServiceUrl"
        );
        patinetDetails.patient_profle = patient_profile_response?.body
          ? patient_profile_response?.body?.profile_signed_url
          : "";
      }

      //getting doctor profile signed url
      const basic_info = await BasicInfo.findOne({
        for_portal_user: result?.portalId?._id,
        type: portal_type,
      })
        .select({
          for_portal_user: 1,
          full_name: 1,
          speciality: { $slice: 1 },
          title: 1,
        })
        .populate({ path: "profile_picture", select: "url" })
        .populate({ path: "in_fee_management" })
        .populate({ path: "in_location" });

      let doctor_basic_info = {
        profile_picture: "",
        full_name: basic_info ? basic_info?.full_name : "",
        email: result?.portalId?.email,
        mobile: result?.portalId?.mobile,
        basic_info,
      };

      let specialityPromises = await httpService.getStaging(
        "hospital/get-speciality-data",
        { data: doctor_basic_info.basic_info.speciality[0] },
        headers,
        "hospitalServiceUrl"
      );
      doctor_basic_info.specialityPromises =
        specialityPromises?.data[0]?.specilization;

      doctor_basic_info.profile_picture = "";
      let otherinfo = {
        ANSJSON: result?.ANSJSON,
        consultationData: result?.consultationData,
        templateJSON: result?.templateJSON,
      };

      sendResponse(req, res, 200, {
        status: true,
        data: {
          patinetDetails,
          appointmentDetails,
          patientAllDetails,
          assignedStaff,
          doctor_basic_info,
          otherinfo,
        },
        message: `patient appointment fetched successfully`,
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: error.message,
        errorCode: error.code,
      });
    }
  }

  async appointmentList_for_patient(req, res) {
    try {
      let { patient_portal_id, consultation_type, status, date, to_date } =
        req.query;
      //For UPDATING MISSED APPOINTMENT
      const missedAppointments = await Appointment.find({
        patientId: patient_portal_id,
        status: ["NEW", "APPROVED"],
      });

      let dateToday = new Date().toISOString().split("T")[0]; //string

      const today = new Date(dateToday); //Today date
      let appointmentsToBeMissed = []; //appointment id array

      for (const appointment of missedAppointments) {
        let consultedDate = new Date(appointment?.consultationDate);

        if (consultedDate < today) {
          appointmentsToBeMissed.push(appointment?._id.toString());
        } else if (consultedDate > today) {
          console.log("Apply condition if any");
        } else {
          const now = new Date(); //current time
          const endTime = appointment?.consultationTime
            ?.split("-")[1]
            ?.split(":"); //apointment end time

          const givenTime = new Date();
          givenTime.setHours(endTime[0]);
          givenTime.setMinutes(endTime[1]);
          givenTime.setSeconds(0);

          // Compare the two times
          if (now.getTime() > givenTime.getTime()) {
            appointmentsToBeMissed.push(appointment?._id.toString());
          }
        }
      }

      if (appointmentsToBeMissed.length !== 0) {
       await Appointment.updateMany(
          { _id: { $in: appointmentsToBeMissed } },
          { $set: { status: "MISSED" } },
          { multi: true }
        );
      }

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
        if (status == "ALL") {
          statusFilter = {
            status: { $ne: "NA" },
          };
        }
        if (status == "NEW") {
          statusFilter = {
            status: "NEW",
          };
        }
        if (status == "MISSED") {
          statusFilter = {
            status: "MISSED",
          };
        }
        if (status == "TODAY") {
          statusFilter = {
            consultationDate: { $eq: new Date().toISOString().split("T")[0] },
            status: "APPROVED",
          };
        }
        if (status == "UPCOMING") {
          statusFilter = {
            consultationDate: { $gt: new Date().toISOString().split("T")[0] },
            status: "APPROVED",
          };
        }
        if (status == "PAST") {
          statusFilter = {
            consultationDate: { $lt: new Date().toISOString().split("T")[0] },
            status: "PAST",
          };
        }
        if (status == "REJECTED") {
          statusFilter = {
            status: "REJECTED",
          };
        }

        if (status == "APPROVED") {
          statusFilter = {
            status: "APPROVED",
          };
        }
      } else {
        statusFilter = {
          status: { $ne: "NA" },
        };
      }

      let dateFilter = {};

      if (date && date != "" && to_date && to_date != "") {
        dateFilter = {
          consultationDate: { $gte: date, $lte: to_date },
        };
      }
      if (date && date != "" && to_date == "") {
        dateFilter = {
          consultationDate: { $gte: date },
        };
      }

      let aggregate = [
        {
          $match: {
            patientId: mongoose.Types.ObjectId(patient_portal_id),
            $and: [appointmentTypeFilter, statusFilter, dateFilter],
          },
        },
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
          $lookup: {
            from: "basicinfos",
            localField: "portalId",
            foreignField: "for_portal_user",
            as: "portalId",
          },
        },
        { $unwind: "$portalId" },
        {
          $project: {
            patientDetails: 1,
            portalId: 1,
            madeBy: 1,
            consultationDate: 1,
            consultationTime: 1,
            appointmentType: 1,
            consultationFee: 1,
            reasonForAppointment: 1,
            status: 1,
            hospital_details: 1,
            createdAt: -1,
            order_id: 1,
            portal_type: -1,
            paymentType: 1,
            appointment_complete: 1,
          },
        },
      ];

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
        if (appointment.appointmentType == "HOME_VISIT")
          consultationType = "Home Visit";
        if (appointment.appointmentType == "ONLINE")
          consultationType = "Online";
        if (appointment.appointmentType == "FACE_TO_FACE")
          consultationType = "Face to Face";

        //getting doctor profile signed url
        const basic_info = await BasicInfo.findOne({
          for_portal_user: appointment.portalId.for_portal_user,
        })
          .select({
            for_portal_user: 1,
            full_name: 1,
            speciality: 1,
            years_of_experience: 1,
          })
          .populate({ path: "profile_picture", select: "url" })
          .populate({ path: "in_fee_management" });

        basic_info.profile_picture.url = "";

        let speciality = "";

        if (basic_info?.speciality) {
          const res = await httpService.getStaging(
            "hospital/get-speciality-data",
            { data: basic_info?.speciality },
            {},
            "hospitalServiceUrl"
          );
          if (res) {
            speciality = res.data[0].specilization;
          } else {
            speciality = "";
          }
        }
        listArray.push({
          appointment_id: appointment._id,
          patient_name: appointment.patientDetails.patientFullName,
          doctor_name: appointment.portalId.full_name,
          doctor_id: appointment.portalId.for_portal_user,
          hospital_name: appointment.hospital_details
            ? appointment.hospital_details.hospital_name
            : "N/A",
          made_by: appointment.madeBy,
          consultation_date: appointment.consultationDate,
          consultation_time: appointment.consultationTime,
          consultation_type: consultationType,
          hospital_details: appointment.hospital_details,
          reason_for_appointment: appointment.reasonForAppointment.name,
          fee: appointment.consultationFee,
          order_id: appointment.order_id ? appointment.order_id : "",
          status,
          doctor_profile_url: basic_info?.profile_picture?.url
            ? basic_info?.profile_picture?.url
            : "",
          years_of_experience: basic_info?.years_of_experience,
          speciality: speciality,
          in_fee_management: basic_info?.in_fee_management,
          portal_type: appointment.portal_type,
          createdAt: appointment.createdAt,
          paymentType: appointment.paymentType,
          patieintDetailpatientId1: appointment.patientDetails.patientId,
          appointment_complete: appointment.appointment_complete,
        });
      }
      sendResponse(req, res, 200, {
        status: true,
        data: listArray,
        message: `List fetched successfully.`,
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: error.message ? error.message : error,
        message: `something went wrong while fetching list`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async portal_assignHealthcareProvider(req, res) {
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
        message: `Healthcare provider assigned successfully.`,
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `something went wrong while assig healthcare provider`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async portal_post_updateConsulatation(req, res) {
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
        message: `Payment Recieved Successfully!`,
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `something went wrong while updating appointment`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async portal_rescheduleAppointment(req, res) {
   
    try {
      const {
        appointmentId,
        rescheduleConsultationDate,
        rescheduleConsultationTime,
        rescheduled_by,
        rescheduled_by_id,
      } = req.body;

      let newAppointmentDetails = await Appointment.findOneAndUpdate(
        { _id: appointmentId },
        {
          $set: {
            consultationDate: rescheduleConsultationDate,
            consultationTime: rescheduleConsultationTime,
            rescheduled_by,
            rescheduled_by_id,
          },
        },
        { upsert: false, new: true }
      ).exec();

      sendResponse(req, res, 200, {
        status: true,
        body: newAppointmentDetails,
        message: `Appointment rescheduled successfully`,
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `failed to rescheduled appointment`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async portal_UpdateVideocallAppointment(req, res) {

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
        message: `Appointment updated successfully`,
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `failed to add appointment`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async portal_updateVideocallchatmessage(req, res) {


    try {
      const { appointmentId, chatmessage } = req.body;
      let appointmentDetails;
      if (chatmessage != undefined) {
        appointmentDetails = await Appointment.findOneAndUpdate(
          { _id: appointmentId },
          { $push: { chatmessage: chatmessage } },
          { new: true }
        );
      }
      sendResponse(req, res, 200, {
        status: true,
        body: appointmentDetails,
        message: `Appointment updated successfully`,
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `failed to add appointment`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async portal_participantInfo(req, res) {
    try {
      let getData = await Appointment.findOne({
        roomName: req.query.roomName,
        participants: {
          $elemMatch: { userIdentity: req.query.identity },
        },
      });
      if (getData.participants) {
        getData.participants.forEach(async (ele) => {

          if (ele.userIdentity == req.query.identity) {
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
          errorCode: "Something went wrong",
        });
      }
    } catch (e) {
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: e.errorCode,
        errorCode: "Something went wrong",
      });
    }
  }

  async fetchAppointmentDetails(req, res) {
    try {
      const { for_order_id, for_portal_user } = req.body;
      const headers = {
        Authorization: req.headers["authorization"],
      };
      const orderData = await Appointment.findOne({
        _id: for_order_id,
        for_portal_user,
      }).lean();
      const patientId = orderData.patient_details.user_id;

      const patientDetails = await httpService.getStaging(
        "patient/patient-common-details",
        { patientId: patientId },
        headers,
        "patientServiceUrl"
      );
      const pharmacyDetails = await BasicInfo.findOne(
        { for_portal_user },
        {
          pharmacy_name: 1,
          address: 1,
          mobile_phone_number: 1,
          profile_picture: 1,
        }
      ).populate({
        path: "for_portal_user",
        select: "email",
      });
      let pharmacyProfile;
      if (
        pharmacyDetails.profile_picture != "" &&
        pharmacyDetails.profile_picture != undefined
      ) {
        const headers = {
          Authorization: req.headers["authorization"],
        };
        const profilePictureArray = [pharmacyDetails.profile_picture];
        const profile_picdata = await httpService.postStaging(
          "pharmacy/get-signed-url",
          { url: profilePictureArray },
          headers,
          "pharmacyServiceUrl"
        );
        pharmacyProfile = profile_picdata.data[0];
        pharmacyDetails.profile_picture = profile_picdata;
      }

      const medicineDetails = [];
      const medicineIDArray = [];
      let getMedicines = {
        body: null,
      };
      if (medicineDetails.length > 0) {
        for (const medicine of medicineDetails) {
          medicineIDArray.push(medicine.medicine_id);
        }
        getMedicines = await httpService.postStaging(
          "superadmin/get-all-medicine-byits-id",
          { medicineIds: medicineIDArray },
          headers,
          "superadminServiceUrl"
        );
      }

      sendResponse(req, res, 200, {
        status: true,
        data: {
          orderData,
          medicineDetails,
          medicineNameObject: getMedicines.body,
          patientDetails: patientDetails.body,
          pharmacyDetails,
          pharmacyProfile,
        },
        message: "successfully fetched order details",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        data: error,
        message: "failed to fetch order details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async totalCountforAppointmentHospitalDashboard(req, res) {
    let { hospital_id, dateFilter, filterDateWise, yearFilter } = req.query;
    try {
      let dateWiseFilter = {};

      if (dateFilter && !isNaN(Date.parse(dateFilter))) {
        let chooseDate = new Date(dateFilter).toISOString();
        dateWiseFilter = {
          "appointments.createdAt": {
            $lte: new Date(`${chooseDate}`),
          },
        };
      } else if (yearFilter && !isNaN(yearFilter)) {
        let chosenYear = parseInt(yearFilter);

        // Construct the start and end dates of the chosen year
        let startDate = new Date(
          `${chosenYear}-01-01T00:00:00.000Z`
        ).toISOString();
        let endDate = new Date(
          `${chosenYear + 1}-01-01T00:00:00.000Z`
        ).toISOString();

        // Assign the dateWiseFilter to filter appointments within the chosen year
        dateWiseFilter = {
          "appointments.createdAt": {
            $gte: startDate,
            $lt: endDate,
          },
        };
      }
      let currentYear = moment().year();
      if (filterDateWise !== "" && filterDateWise != undefined) {
        if (filterDateWise === "yearly") {
          dateWiseFilter = {
            "appointments.consultationDate": {
              $gte: new Date(
                `${currentYear}-01-01T00:00:00.000Z`
              ).toISOString(),
              $lt: new Date(
                `${Number(currentYear) + 1}-01-01T00:00:00.000Z`
              ).toISOString(),
            },
          };
        } else if (filterDateWise === "monthly") {
          dateWiseFilter = {
            "appointments.consultationDate": {
              $gte: moment().startOf("month").toDate().toISOString(),
              $lt: moment().endOf("month").toDate().toISOString(),
            },
          };
        } else {
          dateWiseFilter = {
            "appointments.consultationDate": {
              $gte: moment().startOf("week").toDate().toISOString(),
              $lt: moment().endOf("week").toDate().toISOString(),
            },
          };
        }
      }
      let filter = {
        "for_portal_user.role": { $in: ["INDIVIDUAL"] },
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
            foreignField: "portalId",
            as: "appointments",
          },
        },
        {
          $unwind: { path: "$appointments", preserveNullAndEmptyArrays: true },
        },
        {
          $project: {
            appointments: "$appointments",
          },
        },
      ];

      if (Object.keys(dateWiseFilter).length !== 0) {
        aggregate.push({
          $match: dateWiseFilter,
        });
      }
      const totalCount = await BasicInfo.aggregate(aggregate);
      const result = await BasicInfo.aggregate(aggregate);
      sendResponse(req, res, 200, {
        status: true,
        data: { data: result, totalFourPortalCount: totalCount.length },
        message: `hospital doctor fetched successfully`,
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Internal server error",
        errorCode: null,
      });
    }
  }

  async patientPaymentHistoryToFourPortal(req, res) {
    try {
      const {
        four_portal_id,
        searchTextP,
        searchTextD,
        appointmentStatus,
        appointmentStartDate,
        appointmentEndDate,
        limit,
        page,
        type,
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

      let FourPortalId = Array.isArray(four_portal_id)
        ? four_portal_id.map((s) => mongoose.Types.ObjectId(s))
        : [mongoose.Types.ObjectId(four_portal_id)];

      let aggregate = [
        {
          $lookup: {
            from: "basicinfos",
            localField: "portalId",
            foreignField: "for_portal_user",
            as: "doctorDetails",
          },
        },
        { $unwind: "$doctorDetails" },
        {
          $match: {
            portalId: { $in: FourPortalId },
            madeBy: { $in: ["patient", "INDIVIDUAL"] },
            appointmentType: { $in: ["ONLINE", "FACE_TO_FACE", "HOME_VISIT"] },
            isPaymentDone: true,
            portal_type: type,
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
            portalId: 1,
            hospital_details: 1,
            doctorDetails: 1,
            createdAt: 1,
            type: 1,
            order_id: 1,
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
            localField: "portalId",
            foreignField: "for_portal_user",
            as: "doctorDetails",
          },
        },
        { $unwind: "$doctorDetails" },
        {
          $match: {
            portalId: { $in: FourPortalId },
            madeBy: { $in: ["patient", "INDIVIDUAL"] },
            appointmentType: { $in: ["ONLINE", "FACE_TO_FACE", "HOME_VISIT"] },
            isPaymentDone: true,
            portal_type: type,
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
            portalId: 1,
            hospital_details: 1,
            doctorDetails: 1,
            createdAt: 1,
            type: 1,
            order_id: 1,
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
        message: "Payment History Fetched successfully!",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to Fetch Payment History.",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async hospitalPaymentHistory(req, res) {
    let {
      hospital_id,
      searchTextP,
      searchTextD,
      appointmentStatus,
      appointmentStartDate,
      appointmentEndDate,
    } = req.query;
    try {
      let filter = {
        "for_portal_user.role": { $in: ["INDIVIDUAL"] },
        "for_portal_user.isDeleted": false,
        for_hospitalIds: { $in: [mongoose.Types.ObjectId(hospital_id)] },
      };

      let searchFilter;
      if (searchTextD !== "") {
        searchFilter = {
          full_name: { $regex: searchTextD || "", $options: "i" },
        };
      }

      let searchFilterPatient;
      if (searchTextP !== "") {
        searchFilterPatient = {
          "appointments.patientDetails.patientFullName": {
            $regex: searchTextP || "",
            $options: "i",
          },
        };
      }

      let appointmentStatus_filter = {};
      if (appointmentStatus !== "") {
        appointmentStatus_filter = {
          "appointments.status": appointmentStatus,
        };
      }

      let appointment_filter = {};
      if (appointmentStartDate !== "" && appointmentEndDate !== "") {
        appointment_filter = {
          "appointments.consultationDate": {
            $gte: new Date(appointmentStartDate).toISOString(),
            $lte: new Date(appointmentEndDate).toISOString(),
          },
        };
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
            from: "appointments",
            localField: "for_portal_user._id",
            foreignField: "portalId",
            as: "appointments",
          },
        },
        {
          $unwind: { path: "$appointments", preserveNullAndEmptyArrays: true },
        },
        {
          $match: {
            appointments: { $exists: true, $ne: [] }, // Filter out records without appointments
          },
        },
        // {
        //   $match: appointment_filter
        // },
        // {
        //   $match: appointmentStatus_filter
        // },
        // {
        //   $match: searchFilterPatient || {}
        // },
        {
          $match: {
            $and: [
              appointment_filter,
              appointmentStatus_filter,
              searchFilterPatient || {}, // Filter based on searchFilterPatient
            ],
          },
        },
        {
          $project: {
            full_name: 1,
            // appointments: "$appointments",
            patientDetails: "$appointments.patientDetails",
            patientId: "$appointments.patientId",
            madeBy: "$appointments.madeBy",
            consultationDate: "$appointments.consultationDate",
            consultationTime: "$appointments.consultationTime",
            appointmentType: "$appointments.appointmentType",
            consultationFee: "$appointments.consultationFee",
            paymentDetails: "$appointments.paymentDetails",
            status: "$appointments.status",
            paymentMode: "$appointments.paymentMode",
            portalId: "$appointments.portalId",
            hospital_details: "$appointments.hospital_details",
            portal_type: "$appointments.portal_type",
            createdAt: "$appointments.createdAt",
          },
        },
        {
          $match: {
            paymentDetails: { $ne: null },
          },
        },
        {
          $match: searchFilter || {},
        },
      ];

      const totalCount = await BasicInfo.aggregate(aggregate);
      const result = await BasicInfo.aggregate(aggregate);
      sendResponse(req, res, 200, {
        status: true,
        data: { data: result, totalFourPortalCount: totalCount.length },
        message: `hospital doctor fetched successfully`,
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Internal server error",
        errorCode: null,
      });
    }
  }
}
export const portal_viewAppointmentByRoomName = async (req, res) => {
  try {
    const { roomname, appointment_id, portal_type } = req.query;
    let result = {};
    if (appointment_id == undefined) {
      result = await Appointment.findOne({ roomName: roomname, portal_type });
    } else {
      result = await Appointment.findOne({ _id: appointment_id, portal_type });
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
      message: `Appointment details Fetched!`,
      errorCode: null,
    });
  } catch (error) {
    console.error("An error occurred:", error);
    sendResponse(req, res, 500, {
      status: false,
      body: error,
      message: error.message,
      errorCode: error.code,
    });
  }
};

export const viewAppointmentByRoomName = async (req, res) => {
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
      message: `patient appointment fetched successfully`,
      errorCode: null,
    });
  } catch (error) {
    console.error("An error occurred:", error);
    sendResponse(req, res, 500, {
      status: false,
      body: error,
      message: error.message,
      errorCode: error.code,
    });
  }
};

export const viewAppointmentCheck = async (req, res) => {
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
        message: `patient appointment fetched successfully`,
        errorCode: null,
      });
    } else {
      sendResponse(req, res, 500, {
        status: false,
        body: "Appointment not found.",
        message: "Appointment not found.",
      });
    }
  } catch (error) {
    console.error("An error occurred:", error);
    sendResponse(req, res, 500, {
      status: false,
      body: error,
      message: error.message,
      errorCode: error.code,
    });
  }
};

export const updateUnreadMessage = async (req, res) => {
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
    console.error("An error occurred:", error);
    sendResponse(req, res, 500, {
      status: false,
      body: error,
      message: error.message,
      errorCode: error.code,
    });
  }
};
