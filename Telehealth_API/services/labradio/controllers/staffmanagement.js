"use strict";

// utils
import { sendResponse } from "../helpers/transmission";
import department_info from "../models/department_info";
import service_info from "../models/service_info";
import bcrypt from "bcrypt"
import Http from "../helpers/httpservice"
import mongoose from "mongoose";
// models
import Counter from "../models/counter";
import PortalUser from "../models/portal_user";
import LocationInfo from "../models/location_info";
import StaffInfo from "../models/staffInfo";
import StaffProfile from "../models/staffProfile";
import basic_info from "../models/basic_info";
import { generateSignedUrl } from "../helpers/gcs";
import { sendNotification } from "../helpers/notification";
import { formatString } from "../helpers/string";

class StaffController {
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
            assignToDoctor,
            assignToStaff,
            aboutStaff,
            specialty,
            profilePic,
            creatorId,
            type,
            doj
        } = req.body;

        try {
            let userFind = await PortalUser.findOne(
                {
                    email: email.toLowerCase(),
                    isDeleted: false,
                    type
                }
            );
            if (userFind) {
                return sendResponse(req, res, 200, {
                    status: false,
                    body: userFind,
                    message: "Staff already exist!",
                    errorCode: null,
                });
            }

            const salt = await bcrypt.genSalt(10);
            let newPassword = await bcrypt.hash(password, salt);
            let sequenceDocument = await Counter.findOneAndUpdate({ _id: "employeeid" }, { $inc: { sequence_value: 1 } }, { new: true })
            let userData = new PortalUser(
                {
                    full_name: formatString(`${first_name} ${middle_name} ${last_name}`),
                    full_name_arabic: formatString(`${first_name_arabic} ${middle_name_arabic} ${last_name_arabic}`),
                    user_id: sequenceDocument?.sequence_value,
                    email,
                    country_code: countryCode,
                    phone_number: mobile,
                    role: "STAFF",
                    password: newPassword,
                    profile_picture: profilePic,
                    type,
                    created_by_user: creatorId
                }
            );
            let userDetails = await userData.save();
            
            let locationData = new LocationInfo(
                {
                    ...addressInfo,
                    for_portal_user: userDetails._id,
                    type
                }
            );

            let locationDetails = await locationData.save();

            let profileData = new StaffProfile(
                {
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
                    type
                }
            );
            let staffProfileDetails = await profileData.save()
            let staffData = new StaffInfo(
                {
                    name: formatString(`${first_name} ${middle_name} ${last_name}`),
                    name_arabic: formatString(`${first_name_arabic} ${middle_name_arabic} ${last_name_arabic}`),
                    in_profile: staffProfileDetails._id,
                    role,
                    for_doctor: assignToDoctor,
                    for_staff: assignToStaff,
                    specialty,
                    creatorId: creatorId,
                    for_portal_user: userDetails._id,
                    type,
                    doj:doj
                }
            );
            let staffDetails = await staffData.save()
            await PortalUser.findOneAndUpdate(
                { _id: creatorId },
                {
                  $push: { staff_ids: userDetails._id }
                }
            )
            await StaffInfo.findOne({ _id: staffDetails._id, type })
            let paramsData = {
                sendTo: 'staff',
                madeBy: 'labradio',
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
                message: `Successfully created ${type} staff.`,
                body: null,
                errorCode: null,
            });            
        } catch (error) {
            console.log("Error creating staff: " , error);
            
            sendResponse(req, res, 500, {
                status: false,
                body: null,
                message: `Failed to create ${type} staff.`,
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
            dob,
            language,
            addressInfo,
            email,
            countryCode,
            mobile,
            role,
            assignToDoctor,
            assignToStaff,
            aboutStaff,
            specialty,
            type,
            profilePic,
            doj
        } = req.body;
        try {
            const locationDetails = await LocationInfo.findOneAndUpdate(
                { for_portal_user: staffId , type : type },
                {
                    $set: {
                        ...addressInfo
                    }
                },
                { upsert: false, new: true }
            )
            const staffProfileDetails = await StaffProfile.findOneAndUpdate(
                { for_portal_user: staffId },
                {
                    $set: {
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
                        type

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
                        // creatorId: creatorId,
                        profile_picture: profilePic,
                        // profile_pic_url:profilePicData?.url,
                        type,
                        doj:doj
                    },
                },
                { upsert: false, new: true }
            )
            await PortalUser.findOneAndUpdate(
                { _id: staffId, type },
                {
                    $set: {
                        country_code: countryCode,
                        phone_number: mobile,
                        full_name: formatString(`${first_name} ${middle_name} ${last_name}`),
                        full_name_arabic: formatString(`${first_name_arabic} ${middle_name_arabic} ${last_name_arabic}`),
                        profile_picture: profilePic,
                        email:email,
                    },
                },
                { upsert: false, new: true }
            )
            let staffFullDetails = await StaffInfo.findOne({ for_portal_user: staffId , type})
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
                message: `Successfully updated ${type} staff.`,
                errorCode: null,
            });
        } catch (error) {
            console.log('Error updating staff', error);
            sendResponse(req, res, 500, {
                status: false,
                body: null,
                message: `Failed to update ${type} staff.`,
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async getStaffDetails(req, res) {
        try {
            const { staffId , type} = req.query
            let staffFullDetails = await StaffInfo.findOne({ for_portal_user: staffId, type })
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
                }).lean()
          
            let department = staffFullDetails?.department;
            
            if (department.length > 0) {
                await department_info.find({ _id: { $in: department } });
            }

            let service = staffFullDetails?.services;
            
            if (service.length > 0) {
                await service_info.find({ _id: { $in: service } });
            }
            
            let doctorIds = staffFullDetails?.for_doctor;
            
            if (doctorIds.length > 0) {
                await basic_info.find({ for_portal_user: { $in: doctorIds } });
            }
            
            let result = {
                _id: staffFullDetails._id,
                in_profile: staffFullDetails?.in_profile,
                role: staffFullDetails?.role,
                // specialty: sepcalityId,
                speciality:staffFullDetails?.specialty,
                doj:staffFullDetails?.doj
            }
            if (result?.in_profile?.profile_picture) {
                result.in_profile.profile_picture_signed_url = await generateSignedUrl(result?.in_profile?.profile_picture)
            }

            sendResponse(req, res, 200, {
                status: true,
                body: result,
                message: "Successfully retrieved staff details",
                errorCode: null,
            });
        } catch (error) {
            console.error("An error occurred:", error);
            sendResponse(req, res, 500, {
                status: false,
                body: null,
                message: "Failed to retrieve staff details.",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async getAllStaff(req, res) {
        try {
            const { portalId, limit, page, searchText, role, type } = req.query

            let sort = req.query.sort
            let sortingarray = {};
            if (sort != 'undefined' && sort != '' && sort != undefined) {
                let keynew = sort.split(":")[0];
                let value = sort.split(":")[1];
                sortingarray[keynew] = Number(value);
            } else {
                sortingarray['createdAt'] = -1;
            }
            let filter = {}
            if (role != "" && searchText != "") {
                filter = {
                    isDeleted: false,
                    "roles._id": mongoose.Types.ObjectId(role),
                    "staffprofiles.name": { $regex: searchText || '', $options: "i" },
                    creatorId: mongoose.Types.ObjectId(portalId),
                    "portalusers.isDeleted": false,
                    type
                }
            } else if (role != "" && searchText == "") {
                filter = {
                    isDeleted: false,
                    "roles._id": mongoose.Types.ObjectId(role),
                    creatorId: mongoose.Types.ObjectId(portalId),
                    type
                }
            } else if (role == "" && searchText != "") {
                filter = {
                    isDeleted: false,
                    creatorId: mongoose.Types.ObjectId(portalId),
                    "staffprofiles.name": { $regex: searchText || '', $options: "i" },
                    type
                }
            } else if (role == "" && searchText == "") {
                filter = {
                    isDeleted: false,
                    creatorId: mongoose.Types.ObjectId(portalId),
                    type
                }
            }

            const query = [
                {
                    $lookup: {
                        from: "staffprofiles",
                        localField: "in_profile",
                        foreignField: "_id",
                        as: "staffprofiles",
                    }
                },
                { $unwind: "$staffprofiles" },
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
                        paginatedResults: [{ $sort: sortingarray }, { $skip: searchText ? 0 : (page - 1) * limit }, { $limit: limit * 1 }],
                    }
                },
            ]

            let staffFullDetails = await StaffInfo.aggregate(query)
               sendResponse(req, res, 200, {
                status: true,
                body: staffFullDetails,
                message: "Successfully retrieved all staff details.",
                errorCode: null,
            });
        } catch (error) {
            console.error("An error occurred:", error);
            sendResponse(req, res, 500, {
                status: false,
                body: null,
                message: "Failed to retrieve all staff details.",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async getAllStaffWithoutPagination(req, res) {
        try {
            const { portalId, type } = req.query

            let filter = {
                creatorId: mongoose.Types.ObjectId(portalId),
                "portalusers.isDeleted": false,
                type
            }
            const query = [
                {
                    $lookup: {
                        from: "staffprofiles",
                        localField: "in_profile",
                        foreignField: "_id",
                        as: "staffprofiles",
                    }
                },
                { $unwind: "$staffprofiles" },
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
                message: "Successfully retrieved all staff details.",
                errorCode: null,
            });
        } catch (error) {
            console.error("An error occurred:", error);
            sendResponse(req, res, 500, {
                status: false,
                body: null,
                message: "Failed to retrieve all staff details.",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async actionForStaff(req, res) {
        try {
            const { staff_id, action_name, action_value, type } = req.body

            const filter = {}
            if (action_name == "active") filter['isActive'] = action_value
            if (action_name == "lock") filter['lock_user'] = action_value
            if (action_name == "delete") filter['isDeleted'] = action_value
            let updatedStaffDetails = await PortalUser.updateOne(
                { _id: staff_id , type},
                filter,
                { new: true }
            );
           await StaffInfo.updateOne(
                { for_portal_user: staff_id, type },
                filter,
                { new: true }
            );
            sendResponse(req, res, 200, {
                status: true,
                body: updatedStaffDetails,
                message: `Successfully ${action_name} staff`,
                errorCode: null,
            });
        } catch (error) {
            
            sendResponse(req, res, 500, {
                status: false,
                body: error,
                message: "Failed to fetch staff list.",
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
module.exports = new StaffController();