"use strict";

import mongoose from "mongoose";
// models
import Superadmin from "../../models/superadmin/superadmin";
import PortalUser from "../../models/superadmin/portal_user";
import LocationDetails from "../../models/superadmin/location_info";
// utils
import { sendResponse } from "../../helpers/transmission";
import { hashPassword } from "../../helpers/string";
import { sendStaffDetails } from "../../helpers/emailTemplate";
import { sendEmail } from "../../helpers/ses";

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
class StaffManagementController {

  async addStaff(req, res) {
    const { staff_name, first_name, middle_name, last_name, dob, language, address, mobile, country_code, neighborhood, country, region, province, department, city, village, pincode, email, staff_role, password, about_staff, userId, createdBy } = req.body;
  
    try {
      const selectedLanguagesArray = JSON.parse(language);
      const userExist = await Superadmin.find({ email, isDeleted:false });
      if (userExist.length > 0) {
        return sendResponse(req, res, 500, {
          status: false,
          data: null,
          message: `user email already exists`,
          errorCode: "INTERNAL_SERVER_ERROR",
        });
      }
      const passwordHash = await hashPassword(password);
      const userDetails = new Superadmin({
        email,
        fullName: first_name + " " + middle_name + " " + last_name,
        first_name, middle_name, last_name,
        password: passwordHash,
        mobile, country_code,
        role: "STAFF_USER",
      });
      const userData = await userDetails.save();

      //Location details
      const locationObject = { address, neighborhood, pincode, for_user: userData._id }
      if (department) locationObject['department'] = department
      if (country) locationObject['country'] = country
      if (region) locationObject['region'] = region
      if (province) locationObject['province'] = province
      if (city) locationObject['city'] = city
      if (village) locationObject['village'] = village
      const locationDetails = new LocationDetails(locationObject)

      const locationData = await locationDetails.save();

      // Portal user details
      const portalUserDetails = new PortalUser({
        role: "STAFF_USER", language:selectedLanguagesArray, about_staff, dob, staff_profile: '', staff_role, superadmin_id: userData._id, location_id: locationData._id, for_staff: userId, createdBy:createdBy
      })
      const portalData = await portalUserDetails.save();

      if(portalData){
        const content = sendStaffDetails(email, password, staff_name);
  
        sendEmail(content);
      }

      

      return sendResponse(req, res, 200, {
        status: true,
        data: null,
        message: `staff added successfully`,
        errorCode: null,
      });
    } catch (err) {
      return sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to add staff`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async editStaff(req, res) {
    const { id, first_name, middle_name, last_name, mobile, country_code, dob, language, address, neighborhood, country, region, province, department, city, village, pincode, staff_role, about_staff, email } = req.body;
    try {
      const selectedLanguagesArray = JSON.parse(language);
      const userExist = await PortalUser.find({ _id: { $eq: id } });
      if (userExist.length <= 0) {
        return sendResponse(req, res, 500, {
          status: false,
          data: null,
          message: `staff not exists`,
          errorCode: "INTERNAL_SERVER_ERROR",
        });
      }

      await Superadmin.findOneAndUpdate({ _id: userExist[0].superadmin_id }, { $set: { fullName: first_name + " " + middle_name + " " + last_name, first_name, middle_name, last_name, mobile, country_code,email:email } }, { new: true })

      //Location details
      const locationObject = {
        address:address,
        neighborhood,
        pincode:pincode,
        country: country == '' ? null : country,
        department: department == '' ? null : department,
        region: region == '' ? null : region,
        province: province == '' ? null : province,
        city: city == '' ? null : city,
        village: village == '' ? null : village
    }
      await LocationDetails.findOneAndUpdate(
        { _id: userExist[0]?.location_id },
        {
          $set: locationObject
         
        },
        { new: true }
      )
      let staff_profile = ''

      let infoObject = {
        language:selectedLanguagesArray, about_staff, dob, staff_role
      }
      if (staff_profile) {
        infoObject['staff_profile'] = staff_profile
      }
      // Portal user details
     await PortalUser.findOneAndUpdate(
        { _id: { $eq: id } },
        {
          $set: infoObject
        },
        { new: true }
      )

      return sendResponse(req, res, 200, {
        status: true,
        data: null,
        message: `staff updated successfully`,
        errorCode: null,
      });
    } catch (err) {
      
      return sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to update staff`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async listStaff(req, res) {
    try {
      let { page, limit, admin_id, role_id, searchKey } = req.query;

      let checkUser = await Superadmin.findOne({_id: mongoose.Types.ObjectId(admin_id)});

        if(checkUser.role === 'STAFF_USER'){
            let userFind =  await PortalUser.findOne({superadmin_id: mongoose.Types.ObjectId(admin_id)});
            admin_id = userFind?.for_staff;           
        }


      let sort = req.query.sort
      let sortingarray = {};
      if (sort != 'undefined' && sort != '' && sort != undefined)  {
          let keynew = sort.split(":")[0];
          let value = sort.split(":")[1];
          sortingarray[keynew] = Number(value);
      } else {
          sortingarray['createdAt'] = -1;
      }

      let filter = {
        role: 'STAFF_USER',
        isDeleted: false,
        for_staff: mongoose.Types.ObjectId(admin_id),
      };

      if (role_id) {
        filter.staff_role = mongoose.Types.ObjectId(role_id);
      }
      let aggregate = [
        {
          $lookup: {
            from: "roles",
            localField: "staff_role",
            foreignField: "_id",
            as: "newStaff_role",
          }
        },
        { $unwind: "$newStaff_role" },
        {
          $lookup: {
            from: "superadmins",
            localField: "superadmin_id",
            foreignField: "_id",
            as: "superadmin_id",
          }
        },
        { $unwind: "$superadmin_id" },
        {
          $addFields: {
            staff_name: "$superadmin_id.fullName",
            first_name: "$superadmin_id.first_name",
            middle_name: "$superadmin_id.middle_name",
            last_name: "$superadmin_id.last_name"
          }
        },
        { $match: filter },
        {
          $project: {
            role: {
              name: "$newStaff_role.name"
            },
            createdAt: 1,
            staff_name: 1,
            for_portal_user: {
              email: "$superadmin_id.email",
              country_code: "$superadmin_id.country_code",
              phone_number: "$superadmin_id.mobile",
              isActive: "$superadmin_id.isActive",
              lock_user: "$superadmin_id.isLocked",
            },
          }
        },
      ];

      if (searchKey != "") {
        const safeSearch = escapeRegex(searchKey);
        const regex = new RegExp(safeSearch, "i");
        aggregate.push({ $match: { staff_name: regex } });
      }

      const totalCount = await PortalUser.aggregate(aggregate);

      aggregate.push(
        { $sort: sortingarray},
        { $limit: limit * 1 },
        { $skip: (page - 1) * limit }
      );

      const result = await PortalUser.aggregate(aggregate);

      return sendResponse(req, res, 200, {
        status: true,
        data: {
          data: result,
          totalCount: totalCount.length
        },
        message: `Staff fetched successfully`,
        errorCode: null,
      });

    } catch (err) {
      
      return sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `Failed to fetch staff`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async listStaffforChat(req, res) {
    try {
      const { page, limit, admin_id, searchKey } = req.query;

      let filter = {
        role: { $in: ['STAFF_USER', "superadmin"] },
        isDeleted: false,
        "superadmin_id._id": { $ne: mongoose.Types.ObjectId(admin_id) }
      };      

      let aggregate = [     
        {
          $lookup: {
            from: "superadmins",
            localField: "superadmin_id",
            foreignField: "_id",
            as: "superadmin_id",
          }
        },
        { $unwind: "$superadmin_id" },
        {
          $addFields: {
            staff_name: "$superadmin_id.fullName"
          }
        },
        { $match: filter },
        {
          $lookup: {
            from: "documentinfos",
            localField: "staff_profile",
            foreignField: "_id",
            as: "staff_image",
          }
        },
        {
          $unwind: {
            path: "$staff_image",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            // role: {
            //   name: "$newStaff_role.name"
            // },
            createdAt: 1,
            staff_name: 1,
            staff_image: {
              $ifNull: ["$staff_image.url", null]
            },
            for_portal_user: {
              isOnline: "$superadmin_id.isOnline",
              _id: "$superadmin_id._id",
              email: "$superadmin_id.email",
              country_code: "$superadmin_id.country_code",
              phone_number: "$superadmin_id.mobile",
              isActive: "$superadmin_id.isActive",
              lock_user: "$superadmin_id.isLocked",
            },
          }
        },
      ];
      if (searchKey !== "") {
        const regex = new RegExp(searchKey, "i");
        aggregate.push({ $match: { staff_name: regex } });
      }

      const totalCount = await PortalUser.aggregate(aggregate);

      aggregate.push(
        { $sort: { createdAt: -1 } },
        { $limit: limit * 1 },
        { $skip: (page - 1) * limit }
      );

      const result = await PortalUser.aggregate(aggregate);
      let imagesObject = {};

      for (const doc of result) {
        imagesObject[doc.for_portal_user._id] = '';
      }

      const dataArray = result.map(doc => ({
        ...doc,
        staff_image: imagesObject[doc.for_portal_user._id]
      }));

      return sendResponse(req, res, 200, {
        status: true,
        data: {
          data: dataArray,
          totalCount: totalCount.length
        },
        message: `Staff fetched successfully`,
        errorCode: null,
      });
    } catch (err) {
      
      return sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `Failed to fetch staff`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async viewStaff(req, res) {
    try {
      const { userId } = req.query;
      const result = await PortalUser.find({
        _id: { $eq: userId },
        role: 'STAFF_USER',
        isDeleted: false
      })
        .populate({
          path: "superadmin_id",
          select: { fullName: 1, first_name: 1, middle_name: 1, last_name: 1, email: 1, mobile: 1, country_code: 1 }
        })
        .populate({
          path: "staff_role",
          select: { name: 1 }
        })
        .populate({
          path: "staff_profile",
          select: { url: 1 }
        })
        .exec();
      let documentURL = {}
      return sendResponse(req, res, 200, {
        status: true,
        data: {
          data: result,
          documentURL
        },
        message: `staff fetched successfully`,
        errorCode: null,
      });
    } catch (err) {
      return sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `Failed to fetch staff`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async deleteActiveLockStaff(req, res) {
    try {
      const { action, actionValue, id } = req.body
      let key;
      key = action === "delete" ? 'isDeleted' : action === "lock" ? "isLocked" : action === "active" ? "isActive" : ''
      if (key) {
        const portalData = await PortalUser.findOneAndUpdate(
          { _id: { $eq: id } },
          {
            $set: {
              [key]: actionValue
            }
          },
          { new: true },
        )
        await Superadmin.findOneAndUpdate(
          { _id: { $eq: portalData.superadmin_id } },
          {
            $set: {
              [key]: actionValue
            }
          },
          { new: true },
        )
        let actionMessage;
        if (action === "active" && actionValue) {
          actionMessage = "actived"
        } else if (action === "active" && !actionValue) {
          actionMessage = "deactived"
        }
        if (action === "delete" && actionValue) {
          actionMessage = "deleted"
        }
        if (action === "lock" && actionValue) {
          actionMessage = "locked"
        } else if (action === "lock" && !actionValue) {
          actionMessage = "unlocked"
        }
        return sendResponse(req, res, 200, {
          status: true,
          data: null,
          message: `staff ${actionMessage} successfully`,
          errorCode: null,
        });
      } else {
        return sendResponse(req, res, 500, {
          status: false,
          data: null,
          message: `Something went wrong`,
          errorCode: "INTERNAL_SERVER_ERROR",
        });
      }
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        data: error,
        message: `failed to update staff`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getAllStaff(req, res) {
    try {
      const result = await PortalUser.find({
        role: 'STAFF_USER',
        isDeleted: false,
      }).select('_id').populate({
        path: "superadmin_id",
        select: { fullName: 1, _id: 1 }
      })
      return sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: "fetched all staff",
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "failed to fetch superadmin staff",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
}
module.exports = new StaffManagementController();
