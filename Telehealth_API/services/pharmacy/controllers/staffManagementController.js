"use strict";

import mongoose from "mongoose";
// models
import PortalUser from "../models/portal_user";
import StaffInfo from "../models/staff_info";
import LocationDetails from "../models/location_info";

// utils
import { sendResponse } from "../helpers/transmission";
import { formatString, hashPassword } from "../helpers/string";
import { sendStaffDetails } from "../helpers/emailTemplate";
import { generateSignedUrl } from "../helpers/gcs";
import { sendNotification } from "../helpers/notification";
class StaffManagementController {

    async addStaff(req, res) {
        const headers = {
            Authorization: req.headers["authorization"],
        }
        const { first_name, middle_name, last_name, first_name_arabic, middle_name_arabic, last_name_arabic, staff_profile, dob, language, address, neighborhood, country, region, province, department, city, village, pincode, email, phone_number, country_code, degree, role, password, about, userId,doj } = req.body;
        try {
            const selectedLanguagesArray = JSON.parse(language);
            const userExist = await PortalUser.find({ email, isDeleted: false });
            if (userExist.length > 0) {
                sendResponse(req, res, 500, {
                    status: false,
                    data: null,
                    message: `User email already exists.`,
                    errorCode: "INTERNAL_SERVER_ERROR",
                });
                return
            }
            const passwordHash = await hashPassword(password);
            // Portal user details
            const portalUserDetails = new PortalUser({
                full_name: formatString(first_name + " " + middle_name + " " + last_name), 
                full_name_arabic: formatString(first_name_arabic + " " + middle_name_arabic + " " + last_name_arabic), 
                email, 
                phone_number, 
                country_code, 
                profile_picture: staff_profile,
                password: passwordHash, 
                role: "PHARMACY_STAFF", 
                staff_createdBy: userId
            })
            const portalData = await portalUserDetails.save();
            //Location details
            const locationObject = { 
                address, 
                neighborhood, 
                country,
                region, 
                province, 
                department,
                city, 
                village,
                pincode, 
                for_portal_user: portalData._id 
            }
          
            const locationDetails = new LocationDetails(locationObject)
            const locationData = await locationDetails.save();
            const staffDetails = new StaffInfo({
                role, 
                staff_name: formatString(first_name + " " + middle_name + " " + last_name), 
                staff_name_arabic: formatString(first_name_arabic + " " + middle_name_arabic + " " + last_name_arabic), 
                first_name, 
                middle_name, 
                last_name, 
                first_name_arabic, 
                middle_name_arabic, 
                last_name_arabic, 
                dob, 
                language: selectedLanguagesArray, 
                in_location: locationData._id, 
                degree, 
                about,
                staff_profile,
                for_staff: userId, 
                for_portal_user: portalData._id,
                doj: new Date(doj)
            })
            await staffDetails.save()
            const content = sendStaffDetails(email, password, 'Pharmacy');
            //save staff id into parent pharmacy
            await PortalUser.findOneAndUpdate(
                { _id: userId },
                {
                    $push: { staff_ids: portalData._id }
                }
            )
            let paramsData = {
                sendTo: 'staff',
                madeBy: 'pharmacy',
                condition: 'PROFILE_CREATED',
                user_name: formatString(`${first_name} ${middle_name} ${last_name}`),
                user_email: email, 
                user_mobile: phone_number,
                country_code: country_code,
                user_password: password, 
                notification: ['sms', 'email'],
                isProfile: true
            }
            sendNotification(paramsData, headers)
            sendResponse(req, res, 200, {
                status: true,
                message: `Staff added successfully.`,
                data: null,
                errorCode: null,
            });
        } catch (err) {
            sendResponse(req, res, 500, {
                status: false,
                data: err,
                message: `Failed to add staff.`,
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async editStaff(req, res) {
        const { id, first_name, middle_name, last_name, first_name_arabic, middle_name_arabic, last_name_arabic, staff_profile, dob, language, address, neighbourhood, country, region, province, department, city, village, pincode, role, about, degree, country_code, phone } = req.body;
        ;
        try {

            const selectedLanguagesArray = JSON.parse(language);
            const userExist = await StaffInfo.find({ for_portal_user: { $eq: id } });
            if (userExist.length <= 0) {
                sendResponse(req, res, 500, {
                    status: false,
                    data: null,
                    message: `Staff does not exist.`,
                    errorCode: "INTERNAL_SERVER_ERROR",
                });
                return
            }
            await PortalUser.findOneAndUpdate(
                { _id: id },
                {
                    $set: {
                        country_code: country_code,
                        phone_number: phone,
                        full_name: formatString(first_name + " " + middle_name + " " + last_name), 
                        full_name_arabic: formatString(first_name_arabic + " " + middle_name_arabic + " " + last_name_arabic), 
                        first_name, 
                        middle_name, 
                        last_name,
                        first_name_arabic, 
                        middle_name_arabic, 
                        last_name_arabic, 
                        profile_picture: staff_profile
                    },
                }
            )
            //Location details
            const locationObject = {
                address,
                neighborhood: neighbourhood,
                pincode,
                nationality: country == '' ? null : country,
                department: department == '' ? null : department,
                region: region == '' ? null : region,
                province: province == '' ? null : province,
                city: city == '' ? null : city,
                village: village == '' ? null : village
            }
            await LocationDetails.findOneAndUpdate(
                { _id: userExist[0].in_location },
                {
                    $set: locationObject
                },
                { new: true }
            )
     
            //Staff Info
            let infoObject = {
                role, 
                staff_name: formatString(first_name + " " + middle_name + " " + last_name), 
                staff_name_arabic: formatString(first_name_arabic + " " + middle_name_arabic + " " + last_name_arabic), 
                first_name, 
                middle_name, 
                last_name, 
                first_name_arabic, 
                middle_name_arabic, 
                last_name_arabic, 
                dob, 
                language:selectedLanguagesArray, 
                degree, 
                about,
                staff_profile
            }
            await StaffInfo.findOneAndUpdate(
                { for_portal_user: { $eq: id } },
                {
                    $set: infoObject
                },
                { new: true }
            )

            sendResponse(req, res, 200, {
                status: true,
                data: null,
                message: `Staff updated successfully.`,
                errorCode: null,
            });
        } catch (err) {
            sendResponse(req, res, 500, {
                status: false,
                data: err,
                message: `Failed to update staff.`,
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async listStaff(req, res) {
        try {
            let { page, limit, admin_id, role_id, searchKey } = req.query;
            let sort = req.query.sort
            let sortingarray = {};
            if (sort != 'undefined' && sort != '' && sort != undefined) {
                let keynew = sort.split(":")[0];
                let value = sort.split(":")[1];
                sortingarray[keynew] = Number(value);
            } else {
                sortingarray['createdAt'] = -1;

            }

            let checkUser = await PortalUser.findOne({_id:mongoose.Types.ObjectId(admin_id)});

            if(checkUser.role === 'PHARMACY_STAFF'){

                let adminData = await StaffInfo.findOne({for_portal_user:mongoose.Types.ObjectId(admin_id)});

                admin_id = adminData?.for_staff

            }

            let filter = {
                'for_portal_user.role': 'PHARMACY_STAFF',
                'for_portal_user.isDeleted': false,
                'for_staff': mongoose.Types.ObjectId(admin_id),
                'role.status': true,
                'role.is_delete': 'No'
            };
            if (searchKey) {
                filter['staff_name'] = { $regex: searchKey || "", $options: "i" }
            }
            if(role_id) {
                filter['role._id'] = mongoose.Types.ObjectId(role_id)
            }
            let aggregate = [
                {
                    $lookup: {
                        from: "roles",
                        localField: "role",
                        foreignField: "_id",
                        as: "role",
                    }
                },
                { $unwind: "$role" },
                {
                    $lookup: {
                        from: "portalusers",
                        localField: "for_portal_user",
                        foreignField: "_id",
                        as: "for_portal_user"
                    }
                },
                { $unwind: "$for_portal_user" },
                { $match: filter },
                {
                    $project: {
                        _id: 0,
                        doj: 1,
                        staff_name: 1,
                        role: {
                            name: "$role.name",
                            _id:"$role._id"
                        },
                        createdAt: 1,
                        for_portal_user: {
                            _id: '$for_portal_user._id',
                            country_code: '$for_portal_user.country_code',
                            email: '$for_portal_user.email',
                            isActive: '$for_portal_user.isActive',
                            lock_user: '$for_portal_user.lock_user',
                            phone_number: '$for_portal_user.phone_number',
                        }
                    }
                },
                {
                    $sort:sortingarray
                },
                {
                    $facet: {
                        totalCount: [
                            {
                                $count: 'count'
                            }
                        ],
                        paginatedResults: [
                            { $skip: (page - 1) * limit }, 
                            { $limit: limit * 1 },
                        ],
                    }
                }
            ];
            const result = await StaffInfo.aggregate(aggregate);
            let totalCount = 0
            if (result[0].totalCount.length > 0) {
              totalCount = result[0].totalCount[0].count
            }

            sendResponse(req, res, 200, {
                status: true,
                data: {
                    totalCount,
                    currentPage: page,
                    totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
                    data: result[0]?.paginatedResults,
                },
                message: `Staff fetched successfully.`,
                errorCode: null,
            });
        } catch (err) {
            
            sendResponse(req, res, 500, {
                status: false,
                data: err,
                message: `Failed to fetch staff.`,
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async getAllStaff(req, res) {
        try {
            let filter = {
                'for_portal_user.role': 'PHARMACY_STAFF',
                'for_portal_user.isDeleted': false,
                'for_staff': mongoose.Types.ObjectId(req.query.for_user),
                'role.status': true,
                'role.is_delete': 'No'
            };
            let aggregate = [
                {
                    $lookup: {
                        from: "roles",
                        localField: "role",
                        foreignField: "_id",
                        as: "role",
                    }
                },
                { $unwind: "$role" },
                {
                    $lookup: {
                        from: "portalusers",
                        localField: "for_portal_user",
                        foreignField: "_id",
                        as: "for_portal_user",
                    }
                },
                { $unwind: "$for_portal_user" },
                { $match: filter },
                {
                    $project: {
                        staff_name: 1,
                        for_portal_user: {
                            _id: '$for_portal_user._id',
                        }
                    }
                },
            ];
            const result = await StaffInfo.aggregate(aggregate);
            sendResponse(req, res, 200, {
                status: true,
                body: result,
                message: "Fetched all staff successfully.",
                errorCode: null,
            });
        } catch (error) {
            sendResponse(req, res, 500, {
                status: false,
                body: error,
                message: error.message ? error.message : "Failed to fetch staff.",
                errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async viewStaff(req, res) {
        try {
            const { userId } = req.query;
            const result = await PortalUser.find({
                _id: { $eq: userId },
                role: 'PHARMACY_STAFF',
                isDeleted: false
            })
                .select({ email: 1, country_code: 1, phone_number: 1 })
                .exec();

            const staffInfo = await StaffInfo.find({
                for_portal_user: { $eq: userId },
            })
                .populate({
                    path: "in_location",
                })
                .populate({
                    path: "role",
                    select: { name: 1 }
                })
                .exec();

            let documentURL = ''
            if (staffInfo[0]?.staff_profile) {
                documentURL = await generateSignedUrl(staffInfo[0]?.staff_profile)
            }
          
            sendResponse(req, res, 200, {
                status: true,
                data: {
                    profileData: result,
                    staffInfo: staffInfo,
                    documentURL
                },
                message: `Staff list retrieved successfully.`,
                errorCode: null,
            });
        } catch (err) {
            sendResponse(req, res, 500, {
                status: false,
                data: err,
                message: `Failed to retrieve staff details.`,
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }


    async deleteActiveLockStaff(req, res) {
        let actionMessage;
        try {
            const { action_name, action_value, staff_id } = req.body
            await PortalUser.findOneAndUpdate(
                { _id: { $eq: staff_id } },
                {
                    $set: {
                        [action_name]: action_value
                    }
                },
                { new: true },
            )
            let actionMessage = ''
            if (action_name === "isActive" && action_value) {
                actionMessage = "actived"
            } else if (action_name === "isActive" && !action_value) {
                actionMessage = "deactived"
            }
            if (action_name === "isDeleted" && action_value) {
                actionMessage = "deleted"
            }
            if (action_name === "lock_user" && action_value) {
                actionMessage = "locked"
            } else if (action_name === "lock_user" && !action_value) {
                actionMessage = "unlocked"
            }
            sendResponse(req, res, 200, {
                status: true,
                data: null,
                message: `Staff ${actionMessage} successfully`,
                errorCode: null,
            });
        } catch (error) {
            sendResponse(req, res, 500, {
                status: false,
                data: error,
                message: `Failed to ${actionMessage} staff`,
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async listCategoryStaff(req, res) {
        try {
            const { pharmacyId, staffRoleId } = req.query
            const staffList = await StaffInfo.find({ for_staff: pharmacyId, role: staffRoleId })
            // const staffInfo = await StaffInfo.aggregate([
            //     {
            //         $lookup: {
            //             from: "roles",
            //             localField: "role",
            //             foreignField: "_id",
            //             as: "roles",
            //         }
            //     },
            //     {
            //         $match: {
            //             for_staff: mongoose.Types.ObjectId(pharmacyId)
            //         }
            //     },
            //     { $unwind: "$roles" },
            //     {
            //         $addFields: {
            //             staffRole: "$roles.name",
            //         }
            //     },
            //     {
            //         $unset: "roles"
            //     },
            // ])
            sendResponse(req, res, 200, {
                status: true,
                data: staffList,
                message: `Staff list retrieved successfully.`,
                errorCode: null,
            });
        } catch (error) {
            sendResponse(req, res, 500, {
                status: false,
                data: error,
                message: `Failed to retrieve staff list.`,
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async pharmacyListForChat(req, res) {
        try {
            const { page, limit, searchKey, admin_id } = req.query;

            let matchFilter = {
                isDeleted: false,
                _id: mongoose.Types.ObjectId(admin_id)
            };
            let filter = {}

            if (searchKey && searchKey !== "") {
              filter["$or"] = [
                // {
                //   groupName: { $regex: searchKey, $options: "i" },
                // },
                {
                  user_name: { $regex: searchKey, $options: "i" },
                },
              ];
            }

            let getLoginUserData = await PortalUser.findOne(matchFilter);

            const parsedLimit = parseInt(limit);

            let aggregate;

            if (getLoginUserData?.role === 'PHARMACY_ADMIN') {
                aggregate = [
                    { $match: filter },
                    // {
                    //     $match: {
                    //       $or: [ // Include PHARMACY_ADMIN users
                    //         {isDeleted: false, role: 'PHARMACY_ADMIN' },
                    //         { isDeleted: false, staff_createdBy: admin_id }
                    //       ]
                    //     }
                    // },
                    {
                        $match: {
                            isDeleted: false,
                            staff_createdBy: admin_id
                        }
                    },
                    {
                        $sort: { createdAt: -1 },
                    },
                    {
                        $skip: (page - 1) * parsedLimit,
                    },
                    {
                        $limit: parsedLimit,
                    },
                ];
            }

            if (getLoginUserData?.role === 'PHARMACY_STAFF') {
                aggregate = [
                    { $match: filter },
                    {
                        $match: {
                            isDeleted: false,
                            $and: [
                                { _id: { $ne: mongoose.Types.ObjectId(admin_id) } },
                                {
                                    $or: [
                                        { _id: mongoose.Types.ObjectId(getLoginUserData?.staff_createdBy) },
                                        { staff_createdBy: getLoginUserData?.staff_createdBy }
                                    ]
                                }
                            ]
                        }
                    },
                    {
                        $sort: { createdAt: -1 },
                    },
                    {
                        $skip: (page - 1) * parsedLimit,
                    },
                    {
                        $limit: parsedLimit,
                    },
                ];
            }

            const result = await PortalUser.aggregate(aggregate);

            const uniqueDataObject = {}; // Object to store unique data by _id

            for (const doc of result) {
                if (!uniqueDataObject[doc?._id]) {
                    let profilePic = null;
            
                    uniqueDataObject[doc?._id] = {
                        ...doc,
                        profile_picture: profilePic || ''
                    };
                }
            }
            
            const dataArray = Object.values(uniqueDataObject); // Convert object values to an array
            
            return res.status(200).json({
                status: true,
                data: {
                    data: dataArray,
                    totalCount: dataArray.length,
                },
                message: "Users fetched successfully.",
                errorCode: null,
            });
            
        } catch (err) {
            
            return res.status(500).json({
                status: false,
                data: err,
                message: "Failed to fetch users.",
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
module.exports = new StaffManagementController();
