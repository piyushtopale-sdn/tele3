"use strict";

import mongoose from "mongoose";
import PortalUser from "../../models/portal_user";
import BasicInfo from "../../models/basic_info";
import PathologyTestInfoNew from "../../models/pathologyTestInfoNew";
import PortalAvailability from "../../models/availability";
import PortalFeeManagement from "../../models/fee_management";
import ReviewAndRating from "../../models/reviews";
import { sendResponse } from "../../helpers/transmission";
import Http from "../../helpers/httpservice";
import { TimeZone } from "../../config/constants";
import moment from "moment";
import Appointment from "../../models/appointment";

const httpService = new Http();

function filterBookedSlots(array1, array2) {
  array1.forEach((element, index) => {
    var xyz = array2.indexOf(element.slot);
    if (xyz != -1) {
      array1[index].status = 1;
    }
  });
  return array1;
}

const getPortalOpeningsHours = async (week_days) => {
  var Sunday = [];
  var Monday = [];
  var Tuesday = [];
  var Wednesday = [];
  var Thursday = [];
  var Friday = [];
  var Saturday = [];
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

function filterBookedSlotsToday(array1) {
  array1.forEach((element, index) => {
    var xyz =
      element.slot.split("-")[0].split(":")[0] +
      element.slot.split("-")[0].split(":")[1];

    const date = new Date();
    date.setHours(
      date.getHours() + TimeZone.hours,
      date.getMinutes() + TimeZone.minute
    );
    var hm = date.getHours().toString() + date.getMinutes().toString();
    if (parseInt(hm) > parseInt(xyz)) {
      array1[index].status = 1;
    }
  });

  return array1;
}

export const updateSlotAvailability = async (
  hospitalId,
  notificationReceiver,
  timeStamp,
  req,
  portal_type
) => {
  var timeStampString;
  var slot = null;

  const headers = {
    Authorization: req.headers["authorization"],
  };
  for (let index = 0; index < 3; index++) {
    const resData = await httpService.postStaging(
      "labradio/four-portal-management-available-slots",
      {
        locationId: hospitalId,
        portal_id: notificationReceiver,
        appointmentType: "ONLINE",
        timeStamp: timeStamp,
        portal_type: portal_type,
      },
      headers,
      "labradioServiceUrl"
    );

    // timeStampString = moment(timeStamp, "DD-MM-YYYY").add(1, 'days');
    // timeStamp = new Date(timeStampString)
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
    const basicInfo = await BasicInfo.findOneAndUpdate(
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

class advFiltersLabRadio {
  async viewFourPortalDetailsForPatient(req, res) {
    try {
      const { portal_id } = req.query;

      const headers = {
        Authorization: req.headers["authorization"],
      };

      const pathology_tests = await PathologyTestInfoNew.find({
        for_portal_user: portal_id,
      });

      const getRole = await PortalUser.findById(portal_id).select("role");
      const filter = {
        for_portal_user: mongoose.Types.ObjectId(portal_id),
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
        },
        address: "$in_location.address",
        loc: "$in_location.loc",
        education_details: "$in_education.education_details",
        services: "$services.service",
        speciality: 1,
        in_availability: 1,
        nextAvailableDate: 1,
        nextAvailableSlot: 1,
        appointment_accepted: 1,
        medicine_request: 1,
        hospital_location: "$in_hospital_location.hospital_or_clinic_location",
      };
      if (getRole.role === "INDIVIDUAL") delete project.services;
      let aggregate = [
        {
          $lookup: {
            from: "portalusers",
            localField: "for_portal_user",
            foreignField: "_id",
            as: "for_portal_user_d",
          },
        },
        {
          $unwind: {
            path: "$for_portal_user_d",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "documentinfos",
            localField: "profile_picture",
            foreignField: "_id",
            as: "profile_picture",
          },
        },
        {
          $unwind: {
            path: "$profile_picture",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "feemanagements",
            localField: "in_fee_management",
            foreignField: "_id",
            as: "in_fee_management",
          },
        },
        {
          $unwind: {
            path: "$in_fee_management",
            preserveNullAndEmptyArrays: true,
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
        { $unwind: { path: "$in_location", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "educationaldetails",
            localField: "in_education",
            foreignField: "_id",
            as: "in_education",
          },
        },
        {
          $unwind: { path: "$in_education", preserveNullAndEmptyArrays: true },
        },
        /* {
            $lookup: {
                from: 'specialties',
                localField: 'speciality',
                foreignField: '_id',
                as: 'speciality'
            }
        },
        { $unwind: { path: "$speciality", preserveNullAndEmptyArrays: true } }, */
        {
          $lookup: {
            from: "hospitallocations",
            localField: "in_hospital_location",
            foreignField: "_id",
            as: "in_hospital_location",
          },
        },
        {
          $unwind: {
            path: "$in_hospital_location",
            preserveNullAndEmptyArrays: true,
          },
        },
      ];      
      aggregate.push({ $match: filter }, { $project: project });
      let resultData = await BasicInfo.aggregate(aggregate);

      let data = {};

      if (resultData[0].speciality) {
        const speciality = await httpService.getStaging(
          "hospital/get-speciality-data",
          { data: resultData[0].speciality },
          headers,
          "hospitalServiceUrl"
        );
        data.specialityName = speciality.data[0].specilization;
        data.speciality_id = speciality.data[0]._id;
       
      }

      for (const key in resultData[0]) {
        data[key] = resultData[0][key];
      }
      let availabilityObjectIDArray = [];
      for (const id of data.in_availability) {
        availabilityObjectIDArray.push(mongoose.Types.ObjectId(id));
      }
      let availResult = await PortalAvailability.find({
        _id: { $in: availabilityObjectIDArray },
      });
      data.in_availability = availResult;

      data.nextAppointmentAvailable = resultData[0].nextAvailableDate;
      data.nextAvailableSlot = resultData[0].nextAvailableSlot;
      data.onDutyToday = true;
      data.portal_id = portal_id;

      const portalUser = await PortalUser.findById(portal_id).select(
        "average_rating"
      );
      const getRatingCount = await ReviewAndRating.find({
        portal_user_id: { $eq: portal_id },
      }).countDocuments();
      const doctor_rating = {
        average_rating: portalUser.average_rating,
        total_review: getRatingCount,
      };

      //Get Opening hours
      let hospital_location = [];
      for (const location of data.hospital_location) {
        if (location.status == "APPROVED") {
          if (location.hospital_id) {
            const getWeekDaysValue = await PortalAvailability.find({
              location_id: location.hospital_id,
              for_portal_user: { $eq: portal_id },
            }).select({ week_days: 1, appointment_type: 1 });
            let openingHoursObject = {};
            for (const week_days_value of getWeekDaysValue) {
              const getData = await getPortalOpeningsHours(
                week_days_value.week_days
              );
              openingHoursObject[week_days_value.appointment_type] = getData;
            }
            location.openingHours = openingHoursObject;
          } else {
            let openingHoursObject = {
              ONLINE: await getPortalOpeningsHours([]),
              HOME_VISIT: await getPortalOpeningsHours([]),
              FACE_TO_FACE: await getPortalOpeningsHours([]),
            };
            location.openingHours = openingHoursObject;
          }
          hospital_location.push(location);
        }
      }
      data.hospital_location = hospital_location;
      sendResponse(req, res, 200, {
        status: true,
        body: { data, doctor_rating, pathology_tests },
        message: `doctor details`,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: error.message
          ? error.message
          : `Failed to fetch hospital doctor details`,
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async portalAvailableSlot(req, res) {
    try {
      const { locationId, appointmentType, timeStamp, portal_id, portal_type } =
        req.body;

      const current_timestamp = new Date(timeStamp);
      const onlyDate = timeStamp.split("T")[0];
      var day = current_timestamp.getDay();
      var hour = current_timestamp.getHours().toString();
      var minute = current_timestamp.getMinutes().toString();
      if (hour.toString().length == 1) {
        hour = "0" + hour;
      }
      if (minute.toString().length == 1) {
        minute = "0" + minute;
      }
      const hourAndMin = hour + minute;
      var startTime;
      var startTimeH;
      var startTimeM;
      var startTimeHM;
      var endTime;
      var endTimeH;
      var endTimeM;
      var endTimeHM;
      var currentTimeH;
      var currentTimeM;
      var currentTimeHM;

      var allGeneralSlot = [];
      var allGeneralSlot2 = [];
      var afterUnavailable = [];
      var x = "";
      const result = await PortalAvailability.findOne({
        for_portal_user: portal_id,
        location_id: locationId,
        appointment_type: appointmentType,
        type: portal_type,
      });
      const allFee = await PortalFeeManagement.findOne({
        for_portal_user: portal_id,
        location_id: locationId,
        type: portal_type,
      });

      var fee;
      if (appointmentType == "ONLINE") {
        fee = allFee?.online.basic_fee;
      }
      if (appointmentType == "FACE_TO_FACE") {
        fee = allFee?.f2f.basic_fee;
      }
      if (appointmentType == "HOME_VISIT") {
        fee = allFee?.home_visit.basic_fee + allFee?.home_visit.travel_fee;
      }
      if (!result) {
        return sendResponse(req, res, 200, {
          status: true,
          body: {
            allGeneralSlot,
            fee,
          },
          message: `No Slots Available For This Location`,
          errorCode: null,
        });
      }
      const doctorAvailability = result.availability_slot;
      var availabilityArray = [];
      var availabilitySlot = [];
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
          var totalH = 0;
          var totalM = 0;
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
          var totalNumbersSlots =
            (totalH * 60) / result.slot_interval.slice(0, 2);
          startTime = element.startTime;
          startTimeH = startTime.slice(0, 2);
          startTimeM = startTime.slice(2);
          startTimeHM = startTimeH + ":" + startTimeM;
          var piece = startTimeHM;
          var piece = startTimeHM.split(":");
          var mins =
            piece[0] * 60 + +piece[1] + +result.slot_interval.slice(0, 2);
          var nextStartTimeH = ((mins % (24 * 60)) / 60) | 0;
          if (nextStartTimeH.toString().length == 1) {
            nextStartTimeH = "0" + startTimeH;
          }
          var nextStartTimeM = mins % 60;
          if (nextStartTimeM.toString().length == 1) {
            nextStartTimeM = nextStartTimeM + "0";
          }
          var nextStartTimeHM = nextStartTimeH + ":" + nextStartTimeM;

          availabilitySlot.push({
            slot: startTimeHM + "-" + nextStartTimeHM,
            status: 0,
          });
          // allGeneralSlot2.push(startTimeH + startTimeM)
          for (let index = 0; index < totalNumbersSlots - 1; index++) {
            var piece = startTimeHM;
            var piece = startTimeHM.split(":");
            var mins =
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

            var piece = startTimeHM;
            var piece = startTimeHM.split(":");
            var mins =
              piece[0] * 60 + +piece[1] + +result.slot_interval.slice(0, 2);
            var nextStartTimeH = ((mins % (24 * 60)) / 60) | 0;
            if (nextStartTimeH.toString().length == 1) {
              nextStartTimeH = "0" + startTimeH;
            }
            var nextStartTimeM = mins % 60;
            if (nextStartTimeM.toString().length == 1) {
              nextStartTimeM = nextStartTimeM + "0";
            }
            var nextStartTimeHM = nextStartTimeH + ":" + nextStartTimeM;

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
        var daysArray = [];
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
            var totalH = 0;
            var totalM = 0;
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
            var totalNumbersSlots =
              (totalH * 60) / result.slot_interval.slice(0, 2);
            startTime = element.startTime;
            startTimeH = startTime.slice(0, 2);
            startTimeM = startTime.slice(2);
            startTimeHM = startTimeH + ":" + startTimeM;
            var piece = startTimeHM;
            var piece = startTimeHM.split(":");
            var mins =
              piece[0] * 60 + +piece[1] + +result.slot_interval.slice(0, 2);
            var nextStartTimeH = ((mins % (24 * 60)) / 60) | 0;
            if (nextStartTimeH.toString().length == 1) {
              nextStartTimeH = "0" + startTimeH;
            }
            var nextStartTimeM = mins % 60;
            if (nextStartTimeM.toString().length == 1) {
              nextStartTimeM = nextStartTimeM + "0";
            }
            var nextStartTimeHM = nextStartTimeH + ":" + nextStartTimeM;

            allGeneralSlot.push({
              slot: startTimeHM + "-" + nextStartTimeHM,
              status: 0,
            });
            allGeneralSlot2.push(startTimeH + startTimeM);
            for (let index = 0; index < totalNumbersSlots - 1; index++) {
              var piece = startTimeHM;
              var piece = startTimeHM.split(":");
              var mins =
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

              var piece = startTimeHM;
              var piece = startTimeHM.split(":");
              var mins =
                piece[0] * 60 + +piece[1] + +result.slot_interval.slice(0, 2);
              var nextStartTimeH = ((mins % (24 * 60)) / 60) | 0;
              if (nextStartTimeH.toString().length == 1) {
                nextStartTimeH = "0" + startTimeH;
              }
              var nextStartTimeM = mins % 60;
              if (nextStartTimeM.toString().length == 1) {
                nextStartTimeM = nextStartTimeM + "0";
              }
              var nextStartTimeHM = nextStartTimeH + ":" + nextStartTimeM;

              allGeneralSlot.push({
                slot: startTimeHM + "-" + nextStartTimeHM,
                status: 0,
              });
              const startTimeHM2 =
                startTimeH.toString() + startTimeM.toString();
              allGeneralSlot2.push(startTimeHM2);
            }
          });
        } else {
          allGeneralSlot = [];
          allGeneralSlot2 = [];
        }
        const doctorUnavailability = result.unavailability_slot;
        var unavailabilityArray = [];
        var unavailabilitySlot = [];

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
              var totalH = 0;
              var totalM = 0;
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
              var totalNumbersSlots =
                (totalH * 60) / result.slot_interval.slice(0, 2);
              startTime = element.startTime;
              startTimeH = startTime.slice(0, 2);
              startTimeM = startTime.slice(2);
              startTimeHM = startTimeH + ":" + startTimeM;
              var piece = startTimeHM;
              var piece = startTimeHM.split(":");
              var mins =
                piece[0] * 60 + +piece[1] + +result.slot_interval.slice(0, 2);
              var nextStartTimeH = ((mins % (24 * 60)) / 60) | 0;
              if (nextStartTimeH.toString().length == 1) {
                nextStartTimeH = "0" + startTimeH;
              }
              var nextStartTimeM = mins % 60;
              if (nextStartTimeM.toString().length == 1) {
                nextStartTimeM = nextStartTimeM + "0";
              }
              var nextStartTimeHM = nextStartTimeH + ":" + nextStartTimeM;

              unavailabilitySlot.push({
                slot: startTimeHM + "-" + nextStartTimeHM,
                status: 0,
              });
              // allGeneralSlot2.push(startTimeH + startTimeM)
              for (let index = 0; index < totalNumbersSlots - 1; index++) {
                var piece = startTimeHM;
                var piece = startTimeHM.split(":");
                var mins =
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

                var piece = startTimeHM;
                var piece = startTimeHM.split(":");
                var mins =
                  piece[0] * 60 + +piece[1] + +result.slot_interval.slice(0, 2);
                var nextStartTimeH = ((mins % (24 * 60)) / 60) | 0;
                if (nextStartTimeH.toString().length == 1) {
                  nextStartTimeH = "0" + startTimeH;
                }
                var nextStartTimeM = mins % 60;
                if (nextStartTimeM.toString().length == 1) {
                  nextStartTimeM = nextStartTimeM + "0";
                }
                var nextStartTimeHM = nextStartTimeH + ":" + nextStartTimeM;

                unavailabilitySlot.push({
                  slot: startTimeHM + "-" + nextStartTimeHM,
                  status: 0,
                });
                // const startTimeHM2 = startTimeH.toString() + startTimeM.toString()
                // allGeneralSlot2.push(startTimeHM2)
              }
            });
            var filterUnavailableSlot = filterUnavailableSlotFunction(
              unavailabilitySlot,
              allGeneralSlot[0].slot,
              allGeneralSlot[allGeneralSlot.length - 1].slot
            );
            allGeneralSlot = uniqueArray(allGeneralSlot, filterUnavailableSlot);
          }
        }
      }

      var todayDate = new Date().toISOString().split("T")[0];
      if (new Date(onlyDate).getTime() === new Date(todayDate).getTime()) {
        allGeneralSlot = filterBookedSlotsToday(allGeneralSlot);
      }
      const appointment = await Appointment.find({
        portal_id,
        "hospital_details.hospital_id": locationId,
        appointmentType,
        consultationDate: onlyDate,
        portal_type,
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

      // allGeneralSlot = allGeneralSlot.filter((data) => {
      //     return data.status == 0;
      // })
      sendResponse(req, res, 200, {
        status: true,
        body: {
          allGeneralSlot,
          fee,
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

  async postReviewAndRating(req, res) {
    try {
      const {
        for_portal_user,
        patient_login_id,
        portal_type,
        rating,
        comment,
        reviewBy,
        reviewTo,
      } = req.body;
      //Store Location details
      let reviewObject = { rating, comment, reviewBy, reviewTo };
      const getReview = await ReviewAndRating.find({
        patient_login_id: { $eq: patient_login_id },
        portal_user_id: { $eq: for_portal_user },
      }).select("rating");
      if (getReview.length > 0) {
        await ReviewAndRating.findOneAndUpdate(
          {
            patient_login_id: { $eq: patient_login_id },
            portal_user_id: { $eq: for_portal_user },
          },
          {
            $set: reviewObject,
          },
          { new: true }
        ).exec();
      } else {
        reviewObject.portal_user_id = for_portal_user;
        reviewObject.patient_login_id = patient_login_id;
        //reviewObject.portal_user_id = for_portal_user
        reviewObject.reviewBy = reviewBy ? reviewBy : "";
        reviewObject.reviewTo = reviewTo ? reviewTo : "";
        reviewObject.portal_type = portal_type ? portal_type : "";
        const reviewData = new ReviewAndRating(reviewObject);
        await reviewData.save();
      }
      const getAllRatings = await ReviewAndRating.find({
        portal_id: mongoose.Types.ObjectId(for_portal_user),
      }).select("rating");
      const totalCount = getAllRatings.length;
      let count = 0;
      for (const rating of getAllRatings) {
        count += rating.rating;
      }
      const average_rating = (count / totalCount).toFixed(1);
      await PortalUser.findOneAndUpdate(
        { _id: { $eq: for_portal_user } },
        {
          $set: { average_rating },
        },
        { new: true }
      ).exec();
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
    try {
      const { portal_user_id, page, limit, reviewBy, requestFrom } = req.query;

      var sort = req.query.sort;
      var sortingarray = {};
      if (sort != "undefined" && sort != "" && sort != undefined) {
        var keynew = sort.split(":")[0];
        var value = sort.split(":")[1];
        sortingarray[keynew] = value;
      } else {
        sortingarray["createdAt"] = -1;
      }

      var result;
      var filter;
      if (requestFrom == "hospital") {
        let doctorIDs = [];
        const hospitalDoctors = await BasicInfo.find(
          { for_hospitalIds: { $in: portal_user_id } },
          { for_portal_user: 1 }
        );

        for (const doctor of hospitalDoctors) {
          doctorIDs.push(doctor?.for_portal_user);
        }

        filter = { patient_login_id: { $in: doctorIDs }, reviewBy: reviewBy };
      } else if (reviewBy == " doctor") {
        filter = {
          patient_login_id: { $in: portal_user_id },
          reviewBy: reviewBy,
        };
      } else {
        filter = {
          portal_user_id: { $in: portal_user_id },
          reviewBy: reviewBy,
        };
      }
      result = await ReviewAndRating.find(filter)
        .sort(sortingarray)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();
      let patientIDArray = [];
      for (const id of result) {
        patientIDArray.push(id.patient_login_id);
      }

      var patientDetails;

      if (reviewBy == "patient") {
        const resData = await httpService.postStaging(
          "patient/get-patient-details-by-id",
          { ids: patientIDArray },
          {},
          "patientServiceUrl"
        );
        patientDetails = resData.data;
      } else {
        const basic_info = await BasicInfo.find({
          for_portal_user: { $in: patientIDArray },
        })
          .select({
            for_portal_user: 1,
            full_name: 1,
          })
          .populate({ path: "profile_picture", select: "url" });

        let profileObject = {};
        for (const doctorData of basic_info) {
          const image_url = ''

          profileObject[doctorData.for_portal_user] = {
            full_name: doctorData?.full_name,
            profile_pic: image_url,
          };
        }

        patientDetails = profileObject;
      }

      let ratingArray = [];
      for (const value of result) {
        ratingArray.push({
          rating: value.rating,
          comment: value.comment,
          createdAt: value.createdAt,
          updatedAt: value.updatedAt,
          patientName: patientDetails[value.patient_login_id],
          _id: value?._id,
        });
      }
      const getAverage = await PortalUser.findById(portal_user_id).select(
        "average_rating"
      );

      const getAllRatings = await ReviewAndRating.find({
        portal_user_id: { $in: portal_user_id },
      }).select("rating");
      let fiveStart = 0;
      let fourStart = 0;
      let threeStart = 0;
      let twoStart = 0;
      let oneStart = 0;
      for (const rating of getAllRatings) {
        if (rating.rating === 5) fiveStart += 1;
        if (rating.rating === 4) fourStart += 1;
        if (rating.rating === 3) threeStart += 1;
        if (rating.rating === 2) twoStart += 1;
        if (rating.rating === 1) oneStart += 1;
      }
      const ratingCount = {
        fiveStart,
        fourStart,
        threeStart,
        twoStart,
        oneStart,
      };
      const totalCount = await ReviewAndRating.find({
        portal_user_id: { $in: portal_user_id },
        reviewBy,
      }).countDocuments();
      sendResponse(req, res, 200, {
        status: true,
        body: {
          ratingArray,
          getAverage,
          ratingCount,
          totalCount,
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

  async deleteReviewAndRating(req, res) {
    try {
      const { _id } = req.body;

      const result = await ReviewAndRating.deleteOne({ _id });

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
}

module.exports = {
  advFiltersLabRadio: new advFiltersLabRadio(),
};
