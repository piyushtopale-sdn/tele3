"use strict";

import mongoose from "mongoose";
import PortalUser from "../../models/portal_user";
import BasicInfo from "../../models/basic_info";
import PathologyTestInfoNew from "../../models/pathologyTestInfoNew";
import PortalAvailability from "../../models/availability";
import ReviewAndRating from "../../models/reviews";
import { sendResponse } from "../../helpers/transmission";
import Http from "../../helpers/httpservice";

const httpService = new Http();

const getPortalOpeningsHours = async (week_days) => {
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
    const headers = {
      Authorization: req.headers["authorization"],
    };
    try {
      const { portal_user_id, page, limit, reviewBy, requestFrom } = req.query;

      let sort = req.query.sort;
      let sortingarray = {};
      if (sort != "undefined" && sort != "" && sort != undefined) {
        let keynew = sort.split(":")[0];
        let value = sort.split(":")[1];
        sortingarray[keynew] = value;
      } else {
        sortingarray["createdAt"] = -1;
      }

      let result;
      let filter;
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

      let patientDetails;

      if (reviewBy == "patient") {
        const resData = await httpService.postStaging(
          "patient/get-patient-details-by-id",
          { ids: patientIDArray },
          headers,
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
