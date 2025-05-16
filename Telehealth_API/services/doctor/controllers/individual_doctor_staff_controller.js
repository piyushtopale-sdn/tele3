"use strict";

import { sendResponse } from "../helpers/transmission";
import department_info from "../models/department_info";
import service_info from "../models/service_info";
import bcrypt from "bcrypt"
import mongoose from "mongoose";
import Counter from "../models/counter";
import PortalUser from "../models/portal_user";
import LocationInfo from "../models/location_info";
import StaffInfo from "../models/staff_info";
import ProfileInfo from "../models/profile_info";
import basic_info from "../models/basic_info";
import { formatString } from "../helpers/string";
import { generateSignedUrl } from "../helpers/gcs";
import { sendNotification } from "../helpers/notification";
class IndividualDoctorStaffController {
  async addStaff(req, res) {
    const headers = {
      Authorization: req.headers["authorization"],
    }
    const {
      first_name,
      middle_name,
      last_name,
      first_name_arabic,
      middle_name_arabic,
      last_name_arabic,
      dob,
      language,
      addressInfo,
      email,
      password,
      countryCode,
      mobile,
      role,
      aboutStaff,
      specialty,
      profilePic,
      creatorId,
      doj
    } = req.body;

    try {
      let userFind = await PortalUser.findOne({ email: email.toLowerCase(), isDeleted: false });
      if (userFind) {
        return sendResponse(req, res, 200, {
          status: false,
          message: "Staff already exist",
          body: null,
          errorCode: null,
        });
      }

      const salt = await bcrypt.genSalt(10);
      let newPassword = await bcrypt.hash(password, salt);
      let sequenceDocument = await Counter.findOneAndUpdate({ _id: "employeeid" }, { $inc: { sequence_value: 1 } }, { new: true });

      let userData = new PortalUser({
        full_name: formatString(`${first_name} ${middle_name} ${last_name}`),
        full_name_arabic: formatString(`${first_name_arabic} ${middle_name_arabic} ${last_name_arabic}`),
        user_id: sequenceDocument.sequence_value,
        email,
        country_code: countryCode,
        mobile,
        role: "INDIVIDUAL_DOCTOR_STAFF",
        password: newPassword,
        profile_picture: profilePic,
        created_by_user: creatorId
      });

      let userDetails = await userData.save();

      let locationData = new LocationInfo({ ...addressInfo, for_portal_user: userDetails._id });
      let locationDetails = await locationData.save();

      let profileData = new ProfileInfo({
        name: formatString(`${first_name} ${middle_name} ${last_name}`),
        name_arabic: formatString(`${first_name_arabic} ${middle_name_arabic} ${last_name_arabic}`),
        first_name,
        middle_name,
        last_name,
        first_name_arabic,
        middle_name_arabic,
        last_name_arabic,
        dob,
        language,
        about: aboutStaff,
        profile_picture: profilePic,
        in_location: locationDetails._id,
        for_portal_user: userDetails._id,
      });

      let staffProfileDetails = await profileData.save();

      let staffData = new StaffInfo({
        name: formatString(`${first_name} ${middle_name} ${last_name}`),
        name_arabic: formatString(`${first_name_arabic} ${middle_name_arabic} ${last_name_arabic}`),
        in_profile: staffProfileDetails._id,
        role,
        staff_of: creatorId,
        specialty,
        for_portal_user: userDetails._id,
        profile_picture: profilePic,
        doj: doj
      });

      let staffDetails = await staffData.save();
      await PortalUser.findOneAndUpdate(
        { _id: creatorId },
        {
          $push: { staff_ids: userDetails._id }
        }
      )
     await StaffInfo.findOne({ _id: staffDetails._id })
        .populate({
          path: "in_profile",
          populate: {
            path: 'in_location',
            populate: {
              path: "for_portal_user"
            }
          },
        });
    
      let paramsData = {
        sendTo: 'staff',
        madeBy: 'doctor',
        condition: 'PROFILE_CREATED',
        user_name: formatString(`${first_name} ${middle_name} ${last_name}`),
        user_email: email, 
        user_mobile: mobile,
        country_code: countryCode,
        user_password: password, 
        notification: ['sms', 'email'],
        isProfile: true
      }
      sendNotification(paramsData, headers)

      sendResponse(req, res, 200, {
        status: true,
        message: "Successfully created individual doctor staff",
        body: null,
        errorCode: null,
      });
    } catch (error) {
      console.error("Error adding staff:", error);
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "Failed to create individual doctor staff",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async editStaff(req, res) {
    const {
      staffId,
      first_name,
      middle_name,
      last_name,
      first_name_arabic,
      middle_name_arabic,
      last_name_arabic,
      email,
      dob,
      language,
      addressInfo,
      countryCode,
      mobile,
      role,
      assignToDoctor,
      assignToStaff,
      aboutStaff,
      specialty,
      // services,
      // department,
      // unit,
      // expertise,
      profilePic,
      doj
    } = req.body;
    try {

      const locationDetails = await LocationInfo.findOneAndUpdate(
        { for_portal_user: staffId },
        {
          $set: {
            ...addressInfo
          }
        },
        { upsert: false, new: true }
      )

      const staffProfileDetails = await ProfileInfo.findOneAndUpdate(
        { for_portal_user: staffId },
        {
          $set: {
            name: formatString(`${first_name} ${middle_name} ${last_name}`),
            name_arabic: formatString(`${first_name_arabic} ${middle_name_arabic} ${last_name_arabic}`),
            first_name_arabic,
            middle_name_arabic,
            last_name_arabic,
            first_name,
            middle_name,
            last_name,
            dob,
            language,
            about: aboutStaff,
            profile_picture: profilePic,
            in_location: locationDetails._id,

          },
        },
        { upsert: false, new: true }
      )

      await StaffInfo.findOneAndUpdate(
        { for_portal_user: staffId },
        {
          $set: {
            name: formatString(`${first_name} ${middle_name} ${last_name}`),
            name_arabic: formatString(`${first_name_arabic} ${middle_name_arabic} ${last_name_arabic}`),
            in_profile: staffProfileDetails._id,
            role,
            for_doctor: assignToDoctor,
            for_staff: assignToStaff,
            specialty,
            // services,
            // department,
            // unit,
            // expertise,mobile
            // in_hospital: creatorId,
            profile_picture: profilePic,
            doj:doj
          },
        },
        { upsert: false, new: true }
      )
      await PortalUser.findOneAndUpdate(
        { _id: staffId },
        {
          $set: {
            country_code: countryCode,
            mobile: mobile,
            full_name: formatString(`${first_name} ${middle_name} ${last_name}`),
            full_name_arabic: formatString(`${first_name_arabic} ${middle_name_arabic} ${last_name_arabic}`),
            profile_picture: profilePic,
            email:email
          },
        },
        { upsert: false, new: true }
      )
      let staffFullDetails = await StaffInfo.findOne({ for_portal_user: staffId })
        .populate({
          path: "in_profile",
          populate: {
            path: 'in_location',
            populate: {
              path: "for_portal_user"
            }
          },
        })

      sendResponse(req, res, 200, {
        status: true,
        body: staffFullDetails,
        message: "successfully updated individual doctor staff",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to update individual doctor staff",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getStaffDetails(req, res) {
    try {
      const { hospitalStaffId } = req.query
      let staffFullDetails = await StaffInfo.findOne({ for_portal_user: hospitalStaffId })
        .populate({
          path: "in_profile",
          populate: {
            path: 'in_location',
            populate: {
              path: "for_portal_user"
            }
          },
        })
        .populate({
          path: "role",
        })
        .populate({
          path: 'specialty'
        })
      let department = staffFullDetails?.department;
      let departdetails = [];
      if (department?.length > 0) {
        departdetails = await department_info.find({ _id: { $in: department } });
      }

      let service = staffFullDetails?.services;
      let servicedetails = [];
      if (service?.length > 0) {
        servicedetails = await service_info.find({ _id: { $in: service } });
      }
      let unitdetails = [];
     
      let doctorIds = staffFullDetails?.for_doctor;
      let doctorDetails = [];
      if (doctorIds?.length > 0) {
        doctorDetails = await basic_info.find({ for_portal_user: { $in: doctorIds } });
      }
      const profilePicKey = staffFullDetails?.in_profile?.profile_picture;

      if (profilePicKey) {
        staffFullDetails.in_profile.profile_picture = await generateSignedUrl(profilePicKey)
      }

      let result = {
        _id: staffFullDetails._id,
        in_profile: staffFullDetails?.in_profile,
        role: staffFullDetails?.role,
        specialty: staffFullDetails?.specialty,
        departdetails: departdetails,
        servicedetails: servicedetails,
        unitdetails: unitdetails,
        doctorDetails: doctorDetails,
        doj:staffFullDetails?.doj
      }
      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: "successfully get individual doctor staff details",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get individual doctor staff details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getAllStaff(req, res) {
    try {
      const { doctorId, limit, page, searchText, role } = req.query
      let sort = req.query.sort
      let sortingarray = {};
      if (sort != 'undefined' && sort != '' && sort != undefined)  {
        let keynew = sort.split(":")[0];
        let value = sort.split(":")[1];
        sortingarray[keynew] = Number(value);
      }else{
        sortingarray['createdAt'] = -1;
      }
      let filter = {}
      if (role != "" && searchText != "") {
        filter = {
          isDeleted: false,
          "roles._id": mongoose.Types.ObjectId(role),
          "profileinfos.name": { $regex: searchText || '', $options: "i" },
          staff_of: mongoose.Types.ObjectId(doctorId),
          "portalusers.isDeleted":false
        }
      } else if (role != "" && searchText == "") {
        filter = {
          isDeleted: false,
          "roles._id": mongoose.Types.ObjectId(role),
          staff_of: mongoose.Types.ObjectId(doctorId)
        }
      } else if (role == "" && searchText != "") {
        filter = {
          isDeleted: false,
          staff_of: mongoose.Types.ObjectId(doctorId),
          "profileinfos.name": { $regex: searchText || '', $options: "i" },
        }
      } else if (role == "" && searchText == "") {
        filter = {
          isDeleted: false,
          staff_of: mongoose.Types.ObjectId(doctorId)
        }
      }
      const query = [
        {
          $lookup: {
            from: "profileinfos",
            localField: "in_profile",
            foreignField: "_id",
            as: "profileinfos",
          }
        },
        { $unwind: "$profileinfos" },
        {
          $lookup: {
            from: "roles",
            localField: "role",
            foreignField: "_id",
            as: "roles",
          }
        },
        { $unwind: "$roles" },
        {
          $lookup: {
            from: "portalusers",
            localField: "for_portal_user",
            foreignField: "_id",
            as: "portalusers",
          }
        },
        { $unwind: "$portalusers" },
        {
          $match: filter
        },
        {
          $facet: {
            totalCount: [
              {
                $count: 'count'
              }
            ],
            paginatedResults: [{$sort: sortingarray},{ $skip: (page - 1) * limit }, { $limit: limit * 1 }],
          }
        },
      ]
      let staffFullDetails = await StaffInfo.aggregate(query)

      for (let index = 0; index < staffFullDetails[0].paginatedResults.length; index++) {
        staffFullDetails[0].paginatedResults[index].profileinfos.profilePictureSignedUrl = ""
        const profilePicKey = staffFullDetails[0].paginatedResults[index].profileinfos.profile_picture;
        if (profilePicKey) {
          staffFullDetails[0].paginatedResults[index].profileinfos.profilePictureSignedUrl = await generateSignedUrl(profilePicKey)
        }
      }
      let totalCount = 0
      if (staffFullDetails[0].totalCount.length > 0) {
        totalCount = staffFullDetails[0].totalCount[0].count
      }

      sendResponse(req, res, 200, {
        status: true,
        message: "successfully get all individual doctor staff",
        body: {
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
          totalRecords: totalCount,
          result: staffFullDetails[0].paginatedResults
      },
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get all individual doctor staff",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getAllStaffWithoutPagination(req, res) {
    try {
      const { doctorId } = req.query
      let filter = {
        staff_of: mongoose.Types.ObjectId(doctorId),
        "portalusers.isDeleted":false
      }
      const query = [
        {
          $lookup: {
            from: "profileinfos",
            localField: "in_profile",
            foreignField: "_id",
            as: "profileinfos",
          }
        },
        { $unwind: "$profileinfos" },
        {
          $lookup: {
            from: "roles",
            localField: "role",
            foreignField: "_id",
            as: "roles",
          }
        },
        { $unwind: "$roles" },
        {
          $lookup: {
            from: "portalusers",
            localField: "for_portal_user",
            foreignField: "_id",
            as: "portalusers",
          }
        },
        { $unwind: "$portalusers" },
        {
          $match: filter
        },
      ]
      let staffFullDetails = await StaffInfo.aggregate(query)

      sendResponse(req, res, 200, {
        status: true,
        body: staffFullDetails,
        message: "successfully get all individual doctor staff",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get all individual doctor staff",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async actionForStaff(req, res) {
    try {
      const { staff_id, action_name, action_value } = req.body

      const filter = {}
      if (action_name == "active") filter['isActive'] = action_value
      if (action_name == "lock") filter['lock_user'] = action_value
      if (action_name == "delete") filter['isDeleted'] = action_value
      let updatedStaffDetails = await PortalUser.updateOne(
        { _id: staff_id },
        filter,
        { new: true }
      );
     await StaffInfo.updateOne(
        { for_portal_user: staff_id },
        filter,
        { new: true }
      );
      sendResponse(req, res, 200, {
        status: true,
        body: updatedStaffDetails,
        message: `successfully ${action_name} individual doctor staff`,
        errorCode: null,
      });
    } catch (error) {

      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "failed to fetch individual doctor staff list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
}

export const getData = async (data) => {
  let result = {
    statusData: '', // You can set an appropriate default value here
    data1: null
  };

  for (const data1 of data) {
    let d = new Date();
    let g1 = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    let g2 = new Date(data1?.expiry_date);

    if (g1.getTime() < g2.getTime()) {
      result.statusData = 'active';
      result.data1 = data1;
      break;
    }
  }
  return result;
}

module.exports = new IndividualDoctorStaffController();