"use strict";

// models
import HospitalAdminInfo from "../models/hospital_admin_info";
import BasicInfo from "../models/basic_info";
import ReviewAndRating from "../models/review";
import PortalUser from "../models/portal_user";
import Appointment from "../models/appointment";
import Reminder from "../models/reminder";
import Specialty from "../models/specialty_info";
import moment from "moment";

// utils
import { sendResponse } from "../helpers/transmission";
import mongoose from "mongoose";
import Http from "../helpers/httpservice";
import StaffInfo from "../models/staff_info";
import PathologyTestInfoNew from "../models/pathologyTestInfoNew";
import { generateSignedUrl } from "../helpers/gcs";
const httpService = new Http();

const getHospitalTeam = async (hospital_portal_id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const filter = {
        for_hospitalIds: { $in: [mongoose.Types.ObjectId(hospital_portal_id)] },
        "for_portal_user.isDeleted": false,
        "for_portal_user.lock_user": false,
        "for_portal_user.isActive": true,
      };
      const aggregate2 = [
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
        { $match: filter },
        {
          $project: {
            email: "$for_portal_user.email",
            portal_user_id: "$for_portal_user._id",
            speciality: 1,
            full_name: 1,
            years_of_experience: 1,
            profile_picture: "$profile_picture.url",
          },
        },
      ];
      const allHospitalDoctors2 = await BasicInfo.aggregate(aggregate2);
      let result = {
        doctorCount: allHospitalDoctors2.length,
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
            from: "specialties",
            localField: "speciality",
            foreignField: "_id",
            as: "speciality",
          },
        },
        { $unwind: { path: "$speciality", preserveNullAndEmptyArrays: true } },
        { $match: filter },
        {
          $project: {
            email: "$for_portal_user.email",
            portal_user_id: "$for_portal_user._id",
            speciality: 1,
            full_name: 1,
            years_of_experience: 1,
            profile_picture: "$profile_picture.url",
          },
        },
      ];
      const allHospitalDoctors = await BasicInfo.aggregate(aggregate);

      let teamArray = {};
      for (const doctor of allHospitalDoctors) {
        if (doctor.speciality) {
          let speciality_name = doctor.speciality.specilization;
          let experience = doctor.years_of_experience;
          let doctorData = {
            full_name: doctor.full_name,
            experience,
            doctor_profile: "",
            speciality: {
              name: speciality_name,
              id: doctor.speciality._id,
            },
          };
          if (speciality_name in teamArray) {
            teamArray[speciality_name].push(doctorData);
          } else {
            teamArray[speciality_name] = [doctorData];
          }
        }
      }
      result.our_team = teamArray;

      resolve(result);
    } catch (error) {
      console.error("An error occurred:", error);
      resolve({
        doctorCount: 0,
        our_team: {},
      });
    }
  });
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class PatientController {
  async hospitalDetailsById(req, res) {
    try {
      const { hospital_portal_id } = req.query;
      let hopitalId = mongoose.Types.ObjectId(hospital_portal_id);
      const result = await HospitalAdminInfo.find({ _id: hopitalId }).populate({
        path: "for_portal_user",
        select: {
          email: 1,
        },
      });
      let data = result[0];
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
        message: error.message
          ? error.message
          : `Failed to fetch hospital admin details`,
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async viewHospitalAdminDetailsForPatient(req, res) {
    const headers = {
      Authorization: req.headers["authorization"],
    };
    try {
      const { hospital_portal_id } = req.query;

      const pathology_tests = await PathologyTestInfoNew.find({
        for_portal_user: hospital_portal_id,
      });

      const result = await HospitalAdminInfo.find({
        for_portal_user: hospital_portal_id,
      })
        .select({
          hospitalPictures: 1,
          about_hospital: 1,
          hospital_name: 1,
          profile_picture: 1,
          opening_hours_status: 1,
          patient_portal: 1,
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

      let hospitalPicture = [];

      data.hospitalPictures = hospitalPicture;
      //Hospital Rating

      const resData = await httpService.getStaging(
        "patient/get-review-and-rating",
        {
          portal_user_id: hospital_portal_id,
          page: 1,
          limit: 10,
          reviewBy: "patient",
        },
        headers,
        "hospitalServiceUrl"
      );
      //Get Doctors count and group them by specialization
      const hospitalDoctor = await getHospitalTeam(hospital_portal_id);

      sendResponse(req, res, 200, {
        status: true,
        body: {
          data,
          doctorCount: hospitalDoctor.doctorCount,
          hospital_rating: resData.body,
          our_team: hospitalDoctor.our_team,
          pathology_tests,
        },
        message: `Hospital admin details`,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: error.message
          ? error.message
          : `Failed to fetch hospital admin details`,
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async viewHospitalDoctorsForPatient(req, res) {
    try {
      const { hospital_portal_id, doctor_name, speciality } = req.query;
      const filter = {
        "for_portal_user.role": {
          $in: ["HOSPITAL_DOCTOR", "INDIVIDUAL_DOCTOR"],
        },
        "for_portal_user.isDeleted": false,
        "for_portal_user.isActive": true,
        "for_portal_user.lock_user": false,
        for_hospitalIds: { $in: [mongoose.Types.ObjectId(hospital_portal_id)] },
      };
      if (doctor_name) {
        filter["full_name"] = { $regex: doctor_name || "", $options: "i" };
      }
      if (speciality) {
        filter["speciality1._id"] = mongoose.Types.ObjectId(speciality);
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
        {
          $lookup: {
            from: "specialties",
            localField: "speciality",
            foreignField: "_id",
            as: "speciality1",
          },
        },
        { $match: filter },
      ];

      if (speciality) {
        aggregate.push({
          $project: {
            full_name: 1,
            years_of_experience: 1,
            profile_picture: 1,
            // speciality1: { $ifNull: ["$speciality1.specilization", ""] },
            speciality1: {
              $filter: {
                input: "$speciality1",
                as: "spec",
                cond: {
                  $eq: ["$$spec._id", mongoose.Types.ObjectId(speciality)],
                },
              },
            },
            _id: "$for_portal_user._id",
          },
        });
      }
      aggregate.push({
        $project: {
          full_name: 1,
          years_of_experience: 1,
          profile_picture: 1,
          speciality1: {
            $ifNull: ["$speciality1.specilization", ""],
          },
          _id: "$for_portal_user._id",
        },
      });
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
  async viewDoctorDetailsForPatient(req, res) {
    try {
      const { doctor_portal_id } = req.query;
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
            for_portal_user: mongoose.Types.ObjectId(doctor_portal_id),
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
        }
      ]
   
      const result = await BasicInfo.aggregate(pipeline);
      const doctor = result[0]
      let finalDoctor = {}
      let doctorSpecialty = []
      let doctorSpecialtyArabic = []
      if (doctor?.speciality) {
        const specialities = await Specialty.find({})
        const specialitiesObject = {}
        for (const elem of specialities) {
          specialitiesObject[elem._id] = {
            specilization: elem?.specilization,
            specilization_arabic: elem?.specilization_arabic,
          }
        }
        doctorSpecialty = doctor.speciality.map(specialty => specialitiesObject[specialty.toString()]?.specilization)
        doctorSpecialtyArabic = doctor.speciality.map(specialty => specialitiesObject[specialty.toString()]?.specilization_arabic)
      }
      //Get All review
      const getRatingCount = await ReviewAndRating.find({ userId: { $eq: doctor.for_portal_user }}).countDocuments();
      finalDoctor['_id'] = doctor._id
      finalDoctor['for_portal_user'] = doctor.for_portal_user
      finalDoctor['doctorName'] = doctor.name
      finalDoctor['doctorArabic'] = doctor.name_arabic
      // finalDoctor['doctorProfile'] = ''
      finalDoctor['years_of_experience'] = doctor.years_of_experience
      finalDoctor['about'] = doctor.about
      finalDoctor['about_arabic'] = doctor.about_arabic
      finalDoctor['education_details'] = doctor.education_details
      finalDoctor['specialty'] = doctorSpecialty
      finalDoctor['doctorSpecialtyArabic'] = doctorSpecialtyArabic
      finalDoctor['average_rating'] = doctor.average_rating
      finalDoctor['totalReview'] = getRatingCount

      if(doctor.profile_picture != ''){
        finalDoctor['doctorProfile'] = await generateSignedUrl(doctor.profile_picture)
      }else{
        finalDoctor['doctorProfile'] = ''
      }

      return sendResponse(req, res, 200, {
        status: true,
        body: finalDoctor ,
        message: `doctor details`,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `Failed to fetch doctor details`,
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async postReviewAndRating(req, res) {
    try {
      const {
        userId,
        patient_Id,
        rating,
        comment,
        reviewBy,
        reviewTo,
      } = req.body;
      //Store Location details
      let reviewObject = { 
        rating, 
        comment, 
        reviewBy, 
        reviewTo, 
        userId, 
        patient_Id,
       };
      const reviewData = new ReviewAndRating(reviewObject);
      await reviewData.save();
      const getAllRatings = await ReviewAndRating.find({
        userId: mongoose.Types.ObjectId(userId),
      }).select("rating");

      const totalCount = getAllRatings.length;
      let count = 0;
      for (const rating of getAllRatings) {
        count += rating.rating;
      }

      const average_rating = (count / totalCount).toFixed(1);

      await PortalUser.findOneAndUpdate(
        { _id: { $eq: userId } },
        {
          $set: { average_rating },
        },
        { new: true }
      ).exec();
      return sendResponse(req, res, 200, {
        status: true,
        body: null,
        message: `Review added successfully`,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
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
      const { doctorId, page, limit } = req.query;

      let sort = req.query.sort;
      let sortingarray = {};
      if (sort != "undefined" && sort != "" && sort != undefined) {
        let keynew = sort.split(":")[0];
        let value = sort.split(":")[1];
        sortingarray[keynew] = value;
      } else {
        sortingarray["createdAt"] = -1;
      }

      const result = await ReviewAndRating.find({status: true, userId: {$eq: doctorId}})
        .sort(sortingarray)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();
     
      let patientIDArray = [];
      for (const id of result) {
        patientIDArray.push(id.patient_Id);
      }

      let patientDetails;
      if (patientIDArray.length > 0) {
        const resData = await httpService.postStaging(
          "patient/get-patient-details-by-id",
          { ids: patientIDArray },
          headers,
          "patientServiceUrl"
        );
        patientDetails = resData.data;    
      }

      let ratingArray = [];
      for (const value of result) {
        ratingArray.push({
          rating: value.rating,
          comment: value.comment,
          createdAt: value.createdAt,
          updatedAt: value.updatedAt,
          patientDetails: patientDetails[value.patient_Id],
          _id: value?._id,
          status: value?.status
        });
      }
      const getAverage = await PortalUser.findById(doctorId).select("average_rating");

      const getAllRatings = await ReviewAndRating.find({status: true, userId: {$eq: doctorId}}).select("rating");
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

      const totalCount = await ReviewAndRating.find({status: true, userId: {$eq: doctorId}}).countDocuments();
   
      return sendResponse(req, res, 200, {
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
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: error.message
          ? error.message
          : `something went wrong while fetching reviews`,
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getReviewAndRatingForSupeAdmin(req, res) {
    const headers = {
      Authorization: req.headers["authorization"],
    };
    try {
      const { page, limit, reviewBy, reviewTo } = req.query;
      let sort = req.query.sort;
      let sortingarray = {};
      if (sort != "undefined" && sort != "" && sort != undefined) {
        let keynew = sort.split(":")[0];
        let value = sort.split(":")[1];
        sortingarray[keynew] = Number(value);
      } else {
        sortingarray["createdAt"] = -1;
      }
      let aggregate = [
        {
          $match: { reviewBy, reviewTo },
        },
        {
          $lookup: {
            from: "basicinfos",
            localField: "portal_user_id",
            foreignField: "for_portal_user",
            as: "basicinfos",
          },
        },
        { $unwind: { path: "$basicinfos", preserveNullAndEmptyArrays: true } },

        {
          $lookup: {
            from: "hospitaladmininfos",
            localField: "portal_user_id",
            foreignField: "for_portal_user",
            as: "hospitaladmininfos",
          },
        },
        {
          $unwind: {
            path: "$hospitaladmininfos",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            rating: 1,
            comment: 1,
            createdAt: 1,
            updatedAt: 1,
            patient_login_id: 1,
            doctorName: "$basicinfos.full_name",
            doctorNameArabic: "$basicinfos.full_name_arabic",
            hospitalName: "$hospitaladmininfos.hospital_name",
          },
        },
      ];

      const totalCount = await ReviewAndRating.aggregate(aggregate);
      aggregate.push({
        $sort: sortingarray,
      });
      if (limit > 0) {
        aggregate.push({ $skip: (page - 1) * limit }, { $limit: limit * 1 });
      }

      const result = await ReviewAndRating.aggregate(aggregate);

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
          let image_url = '';
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
          rating: value?.rating,
          comment: value?.comment,
          createdAt: value?.createdAt,
          updatedAt: value?.updatedAt,
          patientName: patientDetails[value.patient_login_id],
          doctorName: value?.doctorName,
          doctorNameArabic: value?.doctorNameArabic,
          hospitalName: value?.hospitalName,
          _id: value?._id,
        });
      }
    
      return sendResponse(req, res, 200, {
        status: true,
        body: {
          ratingArray,
          // getAverage,
          // ratingCount,
          totalCount: totalCount?.length,
          currentPage: page,
          totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
        },
        message: `successfully fetched review and ratings`,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: error.message
          ? error.message
          : `something went wrong while fetching reviews`,
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getDoctorProfileAndName(doctorIds) {
    await BasicInfo.find({
      for_portal_user: { $in: doctorIds },
    })
      .select({
        for_portal_user: 1,
        full_name: 1,
      })
      .populate({ path: "profile_picture", select: "url" });
  }

  async deleteReviewAndRating(req, res) {
    try {
      const { _id } = req.body;

      const result = await ReviewAndRating.deleteOne({ _id });

      if (result) {
        return sendResponse(req, res, 200, {
          status: true,
          data: null,
          message: `Rating & Review Deleted Successfully`,
          errorCode: null,
        });
      }
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `something went wrong`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async sendReminderNotifications(req, res) {
    try {
      const reminders = await Reminder.find({ status: 0 });
      for (let reminder of reminders) {
        let appointmentDetails = await Appointment.findOne({
          _id: reminder?.appointment_id,
        });
        if (appointmentDetails) {
     
          // Compare notification time with current time
          // let currentTime = new Date(moment().utcOffset("+05:30").format())
          // let currentTime = "2024-04-03T09:21:53.935Z"
          let currentTime = new Date(moment());
          if (currentTime) {
            await Reminder.updateOne(
              { _id: reminder?._id },
              { status: 1 },
              { new: true }
            ).exec();
          } 
        }
      }
    } catch (error) {
      console.error("Error sending reminder notifications:", error);
    }
  }

  async getRatingReviewByPatient(req, res) {
    try {
      const { patientId } = req.query;

      const result = await ReviewAndRating.aggregate([
        {
          $match: { patient_login_id: mongoose.Types.ObjectId(patientId) },
        },
        {
          $lookup: {
            from: "portalusers",
            localField: "portal_user_id",
            foreignField: "_id",
            as: "portalusers",
          },
        },
        { $unwind: { path: "$portalusers", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "basicinfos",
            localField: "portal_user_id",
            foreignField: "for_portal_user",
            as: "basicinfos",
          },
        },
        { $unwind: { path: "$basicinfos", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "documentinfos",
            localField: "basicinfos.profile_picture",
            foreignField: "_id",
            as: "documentinfos",
          },
        },
        {
          $unwind: { path: "$documentinfos", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: "hospitaladmininfos",
            localField: "portal_user_id",
            foreignField: "for_portal_user",
            as: "hospitaladmininfos",
          },
        },
        {
          $unwind: {
            path: "$hospitaladmininfos",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $lookup: {
            from: "hospitaladmininfos",
            localField: "basicinfos.for_hospital",
            foreignField: "for_portal_user",
            as: "hospitaladmininfosForHosDoctor",
          },
        },
        {
          $unwind: {
            path: "$hospitaladmininfosForHosDoctor",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $project: {
            _id: 1,
            rating: 1,
            comment: 1,
            portal_user_id: 1,
            updatedAt: 1,
            role: "$portalusers.role",
            doctorName: "$basicinfos.full_name",
            doctorNameArabic: "$basicinfos.full_name_arabic",
            hospitalName: "$hospitaladmininfos.hospital_name",
            doctorProfileUrl: "$documentinfos.url",
            hospitalProfileUrl: "$hospitaladmininfos.profile_picture",
            for_hospital: "$hospitaladmininfosForHosDoctor.hospital_name",
          },
        },
      ]);

      let objArray = [];

      //arrange data
      for (const element of result) {
        const date = new Date(element.updatedAt);

        const year = date.getFullYear();
        const month = date.getMonth() + 1; // JavaScript months are zero-based
        const day = date.getDate();
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();

        let filteredDate = `${year}-${month}-${day}`;
        let filteredTime = `${hours}:${minutes}:${seconds}`;

        if (element.role === "HOSPITAL_ADMIN") {
          objArray.push({
            _id: element?._id,
            rating: element?.rating,
            comment: element?.comment,
            date: filteredDate,
            time: filteredTime,
            role: element?.role,
            name: element?.hospitalName,
            for_portal_user: element?.portal_user_id,
            profileUrl: element?.hospitalProfileUrl
              ? element?.hospitalProfileUrl
              : "",
          });
        } else {
          objArray.push({
            _id: element?._id,
            rating: element?.rating,
            comment: element?.comment,
            role: element?.role,
            date: filteredDate,
            time: filteredTime,
            name: element?.doctorName,
            name_arabic: element?.doctorNameArabic,
            for_portal_user: element?.portal_user_id,
            profileUrl: element?.doctorProfileUrl
              ? element?.doctorProfileUrl
              : "",
            for_hospital: element?.for_hospital,
          });
        }
      }

      //get signed profile picture url
      for (const element of objArray) {
        element.profileUrl = "";
      }

      return sendResponse(req, res, 200, {
        status: true,
        data: objArray,
        message: `Rating & Review fetched successfully`,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `something went wrong`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async listAppointmentUpcomingCount(req, res) {
    try {
      const { patient_portal_id, consultation_type, status, date } = req.query;
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
      if (date && date != "") {
        dateFilter = {
          consultationDate: date,
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
            localField: "doctorId",
            foreignField: "for_portal_user",
            as: "doctorId",
          },
        },
        { $unwind: "$doctorId" },
        {
          $project: {
            patientDetails: 1,
            doctorId: 1,
            madeBy: 1,
            consultationDate: 1,
            consultationTime: 1,
            appointmentType: 1,
            consultationFee: 1,
            reasonForAppointment: 1,
            status: 1,
            hospital_details: 1,
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
        // const doctorDetails = await BasicInfo.find({for_portal_user: {$eq: appointment.doctorId}})
        let status = "";
        if (appointment.status === "NEW") status = "New";
        if (appointment.status === "REJECTED") status = "Rejected";
        if (appointment.status == "PAST") status = "Past";
        if (appointment.status == "MISSED") status = "Missed";
        if (appointment.status === "APPROVED") {
          // status = date == appointment.consultationDate ? 'Today' : 'Upcoming'
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
          for_portal_user: appointment.doctorId.for_portal_user,
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
          const res = await Specialty.findOne({
            _id: basic_info.speciality,
          });
          if (res) {
            speciality = res.specilization;
          } else {
            speciality = "";
          }
        }

        listArray.push({
          appointment_id: appointment._id,
          patient_name: appointment.patientDetails.patientFullName,
          // doctor_name: doctorDetails[0].full_name,
          doctor_name: appointment.doctorId.full_name,
          doctor_id: appointment.doctorId.for_portal_user,
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
        });
      }
      return sendResponse(req, res, 200, {
        status: true,
        data: {
          data: listArray,
          totalCount: totalCount.length,
          // currentPage: page,
          // totalPages: limit > 0 ? Math.ceil(totalCount.length / limit) : 1,
        },
        message: `patient appointment list fetched successfully`,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error.message ? error.message : error,
        message: `something went wrong while fetching list`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getappointmentdetailDoctorName(req, res) {
    const { ids } = req.query;

    let condition = {};
    let mytext = req.query.searchText || "";
    if (mytext) {
      const regexValue = new RegExp(escapeRegex(mytext), "i");
      condition = {
        $or: [
          { firstName: { $regex: regexValue } },
          { middleName: { $regex: regexValue } },
          { lastName: { $regex: regexValue } },
        ],
      };
    }

    try {
      const query = [
        {
          $match: {
            order_id: { $in: ids },
          },
        },
        {
          $lookup: {
            from: "basicinfos",
            localField: "doctorId",
            foreignField: "for_portal_user",
            as: "DoctorData",
          },
        },

        {
          $project: {
            firstName: "$DoctorData.first_name",
            middleName: "$DoctorData.middle_name",
            lastName: "$DoctorData.last_name",
            consultationDate: "$consultationDate",
            consultationTime: "$consultationTime",
            order_id: "$order_id",
          },
        },
        { $match: condition },
      ];
      const appointmentData = await Appointment.aggregate(query);
      let dataObject = {};
      for (const value of appointmentData) {
        dataObject[value.order_id] = {
          fullName: `${value.firstName[0]} ${value.middleName[0]} ${value.lastName[0]}`,
          consultationDate: `${value.consultationDate} ${value.consultationTime}`,
        };
      }

      return sendResponse(req, res, 200, {
        status: true,
        body: dataObject,
        message: `patient appointment data fetched successfully`,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error.message ? error.message : error,
        message: `something went wrong while fetching list`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getAllPatientAddedByHospitalDoctor(req, res) {
    const headers = {
      Authorization: req.headers["authorization"],
    };

    try {
      let { hospitalId, limit, page, searchText, sort } = req.query;

      let checkUser = await PortalUser.findOne({
        _id: mongoose.Types.ObjectId(hospitalId),
      });

      if (checkUser.role === "HOSPITAL_STAFF") {
        let adminData = await StaffInfo.findOne({
          for_portal_user: mongoose.Types.ObjectId(hospitalId),
        });

        hospitalId = adminData?.in_hospital;
      }

      let filter = {
        "for_portal_user.role": {
          $in: ["HOSPITAL_DOCTOR", "INDIVIDUAL_DOCTOR"],
        },
        "for_portal_user.isDeleted": false,
        for_hospitalIds: { $in: [mongoose.Types.ObjectId(hospitalId)] },
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
          $project: {
            doctorId: "$for_portal_user._id",
          },
        },
      ];

      const result = await BasicInfo.aggregate(aggregate);
      const fourportalData = await httpService.getStaging(
        "labradio/get-all-fouportal-list-for-hospital",
        { hospital_portal_id: mongoose.Types.ObjectId(hospitalId) },
        headers,
        "labradioServiceUrl"
      );

      const responseData = [];

      if (fourportalData) {
        fourportalData?.data.forEach((item) => {
          responseData.push({
            doctorId: item.for_portal_user._id,
          });
        });
      }

      const combinedResponseData = [
        ...responseData,
        ...result.map(({ doctorId }) => ({ doctorId })),
      ];

      const doctorIds = combinedResponseData.map((item) => item.doctorId);

      const allPatientList = await httpService.getStaging(
        "patient/get-all-patient-added-by-doctor",
        {
          doctorId: doctorIds,
          limit: limit,
          page: page,
          searchText: searchText,
          sort: sort,
        },
        headers,
        "patientServiceUrl"
      );
      if (allPatientList) {
        let data = allPatientList.body;
        if (data) {
          return sendResponse(req, res, 200, {
            status: true,
            body: data,
            message: `Hospital doctor fetched successfully`,
            errorCode: null,
          });
        }
      } else {
        return sendResponse(req, res, 500, {
          status: false,
          body: null,
          message: "Internal server error",
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

  async getReviewAndRatingForAdmin(req, res) {
    const headers = {
      Authorization: req.headers["authorization"],
    };
    try {
      const { page, limit, doctorName, sort } = req.query;
     
      let sortKey = "createdAt";
      let sortValue = -1;

      if (sort) {
        const [key, value] = sort.split(":");
        const allowedSortFields = [
          "patientName",
          "createdAt",
          "doctorFullName",
          "comment",
          "rating",
        ];
        if (allowedSortFields.includes(key)) {
          sortKey = key;
          sortValue = Number(value);
        }
      }

      const pageNumber = Math.max(parseInt(page) || 1, 1);
      const pageSize = Math.max(parseInt(limit) || 10, 1);
      const skip = (pageNumber - 1) * pageSize;
      // Aggregate pipeline
      let aggregate = [
        {
          $lookup: {
            from: "portalusers",
            localField: "userId",
            foreignField: "_id",
            as: "doctorDetails",
          },
        },
        {
          $unwind: {
            path: "$doctorDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            reviewBy: "patient",
            reviewTo: "doctor",
            ...(doctorName && { "doctorDetails.full_name": doctorName })  // Filter after lookup and unwind
          },
        },
        {
          $project: {
            rating: 1,
            comment: 1,
            createdAt: 1,
            updatedAt: 1,
            patient_Id: 1,
            doctorFullName: "$doctorDetails.full_name",
            doctorFullNameArabic: "$doctorDetails.full_name_arabic",
            status: 1,
          },
        },
        { $sort: { [sortKey]: sortValue } },
      ];

  
      // Total count of records after filtering
      const totalCount = await ReviewAndRating.aggregate(aggregate);
  
      // Get the filtered results
      const result = await ReviewAndRating.aggregate(aggregate);
      let patientIDArray = result.map((item) => item.patient_Id);
      let patientDetails = [];
  
      if (patientIDArray.length > 0) {
        const resData = await httpService.postStaging(
          "patient/get-patient-details-by-id",
          { ids: patientIDArray },
          headers,
          "patientServiceUrl"
        );
        if (resData && resData.data && typeof resData.data === 'object') {
          patientDetails = resData.data;
        } else {
          console.error("Error: patientDetails data is not in the expected format:", resData.data);
          patientDetails = {};
        }
      }
  
      const patientMap = patientDetails;
      const ratingArray = result.map((review) => {
        const patientId = review.patient_Id ? review.patient_Id.toString() : null;
        const patient = patientId && patientMap[patientId];
  
        return {
          id: review._id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
          doctorFullName: review ? review.doctorFullName : "-",
          doctorFullNameArabic: review ? review.doctorFullNameArabic: "-",
          patientName: patient ? patient.full_name : "Unknown Patient",
          patientProfilePic: patient ? patient.profile_pic : "",
          patientMrn: patient ? patient.mrn_number: "-",
          status: review?.status
        };
      });
      // Sorting logic based on the key
      if (sortKey === "patientName") {
        ratingArray.sort((a, b) => {
          const nameA = a.patientName.toLowerCase();
          const nameB = b.patientName.toLowerCase();
          return sortValue === 1
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA);
        });
      }
    
      if (sortKey === "createdAt") {
        ratingArray.sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return sortValue === 1 ? dateA - dateB : dateB - dateA;
        });
      }
    
      if (sortKey === "doctorFullName") {
        ratingArray.sort((a, b) => {
          const nameA = a.doctorFullName.toLowerCase();
          const nameB = b.doctorFullName.toLowerCase();
          return sortValue === 1
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA);
        });
      }
    
      if (sortKey === "comment") {
        ratingArray.sort((a, b) => {
          const commentA = a.comment.toLowerCase();
          const commentB = b.comment.toLowerCase();
          return sortValue === 1
            ? commentA.localeCompare(commentB)
            : commentB.localeCompare(commentA);
        });
      }
    
      if (sortKey === "rating") {
        ratingArray.sort((a, b) => {
          const ratingA = a.rating;
          const ratingB = b.rating;
          return sortValue === 1 ? ratingA - ratingB : ratingB - ratingA;
        });
      }
      const paginatedResults = ratingArray.slice(skip, skip + pageSize);
  
      return sendResponse(req, res, 200, {
        status: true,
        body: {
          paginatedResults,
          totalCount: totalCount.length,
          currentPage: page,
          totalPages: limit > 0 ? Math.ceil(totalCount.length / limit) : 1,
        },
        message: "Successfully fetched reviews and ratings for doctor.",
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: error.message || "Something went wrong while fetching reviews.",
        errorCode: error.code || "INTERNAL_SERVER_ERROR",
      });
    }
  }
  

  async updateStatusReviewAndRating(req, res) {
    try {
      const { _id, status } = req.body;  
  
      if (!_id || status === undefined) {  
        return sendResponse(req, res, 400, {
          status: false,
          message: "Review ID and isDisabled value are required",
          errorCode: "BAD_REQUEST",
        });
      }
  
      const result = await ReviewAndRating.updateOne(
        { _id },
        { $set: { status } }  
      );
  
      if (result.modifiedCount > 0) {
        return sendResponse(req, res, 200, {
          status: true,
          data: null,
          message: `Rating & Review ${status ? "Activated" : "Deactivated"} Successfully`,
          errorCode: null,
        });
      } else {
        return sendResponse(req, res, 404, {
          status: false,
          message: "Review not found or already in the desired state",
          errorCode: "NOT_FOUND",
        });
      }
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Something went wrong",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  
  
  
}
module.exports = new PatientController();
