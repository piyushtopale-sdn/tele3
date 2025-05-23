"use strict";

// utils
import { sendResponse } from "../helpers/transmission";
import { sendStaffDetails } from "../helpers/emailTemplate";
import { sendEmail } from "../helpers/ses";
import bcrypt from "bcrypt"
import Http from "../helpers/httpservice"
const httpService = new Http()

// models
import Counter from "../models/counter";
import PortalUser from "../models/portal_user";
import LocationInfo from "../models/location_info";
import StaffInfo from "../models/staff_info";
import ProfileInfo from "../models/profile_info";
import mongoose from "mongoose";

class HospitalStaffController {
    async addStaff(req, res) {
        const {

            first_name,
            middle_name,
            last_name,
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
            // services,
            // department,
            // unit,
            // expertise,
            profilePic,
            creatorId,
            doj
        } = req.body;

        try {
            const checkUser = await PortalUser.findOne({_id:creatorId});
            let staffCount = {};
            let checkPlan={};
            if (checkUser?.role === 'HOSPITAL_STAFF') {
                staffCount = await PortalUser.countDocuments({ role:"HOSPITAL_STAFF", created_by_user: checkUser?.created_by_user, isDeleted: false });
            } else {
                staffCount = await PortalUser.countDocuments({ role:"HOSPITAL_STAFF",created_by_user: creatorId, isDeleted: false });
            }
            let checkCondition;
            checkCondition = await getData(checkPlan);

            if (checkCondition?.statusData === "active") {
                let shouldAddStaff = false;
                for (const data12 of checkCondition?.data1?.services) {
                    if (data12?.name === 'staff' && data12?.is_unlimited === false) {
                        if (staffCount < data12?.max_number) {
                            shouldAddStaff = true;
                            break; // Exit the inner loop if conditions are satisfied
                        } else {
                            return sendResponse(req, res, 200, {
                                status: false,
                                body: null,
                                message: "Unable to add Staff. As Staff Maximum limit has exceeded as per your purchased plan.",
                                errorCode: null,
                            });
                        }
                    }
                }

                if (shouldAddStaff) {
                    let userFind = await PortalUser.findOne(
                        {
                            email: email.toLowerCase(),
                            isDeleted: false
                        }
                    );
                    if (userFind) {
                        return sendResponse(req, res, 200, {
                            status: false,
                            body: userFind,
                            message: "Staff already exist",
                            errorCode: null,
                        });
                    }
                    const salt = await bcrypt.genSalt(10);
                    let newPassword = await bcrypt.hash(password, salt);
                    let sequenceDocument = await Counter.findOneAndUpdate({ _id: "employeeid" }, { $inc: { sequence_value: 1 } }, { new: true })
                    let userData = new PortalUser(
                        {
                            user_id: sequenceDocument.sequence_value,
                            email,
                            country_code: countryCode,
                            mobile,
                            role: "HOSPITAL_STAFF",
                            password: newPassword,
                            full_name: first_name + ' ' + middle_name + ' ' + last_name,
                            profile_picture: profilePic,
                            created_by_user: creatorId
                        }
                    );
                    let userDetails = await userData.save();
                    let locationData = new LocationInfo(
                        {
                            ...addressInfo,                            
                            for_portal_user: userDetails._id
                        }
                    );
                    let locationDetails = await locationData.save();
                    let profileData = new ProfileInfo(
                        {
                            name: first_name + ' ' + middle_name + ' ' + last_name,
                            first_name,
                            middle_name,
                            last_name,
                            dob,
                            language,
                            about: aboutStaff,
                            profile_picture: profilePic,
                            in_location: locationDetails._id,
                            for_portal_user: userDetails._id,
                        }
                    );
                    let staffProfileDetails = await profileData.save()
                    let staffData = new StaffInfo(
                        {
                            name: first_name + ' ' + middle_name + ' ' + last_name,
                            in_profile: staffProfileDetails._id,
                            role,
                            for_doctor: assignToDoctor,
                            for_staff: assignToStaff,
                            specialty,
                            // services,
                            // department,
                            // unit,
                            // expertise,
                            profile_picture: profilePic,
                            in_hospital: creatorId,
                            for_portal_user: userDetails._id,
                            doj:doj
                        }
                    );
                    let staffDetails = await staffData.save()
                    let staffFullDetails = await StaffInfo.findOne({ _id: staffDetails._id })
                        .populate({
                            path: "in_profile",
                            populate: {
                                path: 'in_location',
                                populate: {
                                    path: "for_portal_user"
                                }
                            },
                        })
                    const content = sendStaffDetails(email, password, 'Hospital');

                    await sendEmail(content);
                    return sendResponse(req, res, 200, {
                        status: true,
                        body: staffFullDetails,
                        message: "successfully created hospital staff",
                        errorCode: null,
                    });
                } else {
                    let userFind = await PortalUser.findOne(
                        {
                            email: email.toLowerCase(),
                            isDeleted: false
                        }
                    );
                    if (userFind) {
                        return sendResponse(req, res, 200, {
                            status: false,
                            body: userFind,
                            message: "Staff already exist",
                            errorCode: null,
                        });
                    }
                    const salt = await bcrypt.genSalt(10);
                    let newPassword = await bcrypt.hash(password, salt);
                    let sequenceDocument = await Counter.findOneAndUpdate({ _id: "employeeid" }, { $inc: { sequence_value: 1 } }, { new: true })
                    let userData = new PortalUser(
                        {
                            user_id: sequenceDocument.sequence_value,
                            email,
                            country_code: countryCode,
                            mobile,
                            role: "HOSPITAL_STAFF",
                            password: newPassword,
                            full_name: first_name + ' ' + middle_name + ' ' + last_name,
                            profile_picture: profilePic,
                            created_by_user: creatorId
                        }
                    );
                    let userDetails = await userData.save();
                    let locationData = new LocationInfo(
                        {
                            ...addressInfo,
                            
                            for_portal_user: userDetails._id
                        }
                    );
                    let locationDetails = await locationData.save();
                    let profileData = new ProfileInfo(
                        {
                            name: first_name + ' ' + middle_name + ' ' + last_name,
                            first_name,
                            middle_name,
                            last_name,
                            dob,
                            language,
                            about: aboutStaff,
                            profile_picture: profilePic,
                            in_location: locationDetails._id,
                            for_portal_user: userDetails._id,
                        }
                    );
                    let staffProfileDetails = await profileData.save()
                    let staffData = new StaffInfo(
                        {
                            name: first_name + ' ' + middle_name + ' ' + last_name,
                            in_profile: staffProfileDetails._id,
                            role,
                            for_doctor: assignToDoctor,
                            for_staff: assignToStaff,
                            specialty,
                            // services,
                            // department,
                            // unit,
                            // expertise,
                            profile_picture: profilePic,
                            in_hospital: creatorId,
                            for_portal_user: userDetails._id,
                            doj:doj
                        }
                    );
                    let staffDetails = await staffData.save()
                    let staffFullDetails = await StaffInfo.findOne({ _id: staffDetails._id })
                        .populate({
                            path: "in_profile",
                            populate: {
                                path: 'in_location',
                                populate: {
                                    path: "for_portal_user"
                                }
                            },
                        })
                    const content = sendStaffDetails(email, password, 'Hospital');

                    await sendEmail(content);
                    return sendResponse(req, res, 200, {
                        status: true,
                        body: staffFullDetails,
                        message: "successfully created hospital staff",
                        errorCode: null,
                    });
                }

            } 
            
        } catch (error) {
            console.error("An error occurred:", error);
            return sendResponse(req, res, 500, {
                status: false,
                body: null,
                message: "failed to create hospital staff",
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
            services,
            department,
            unit,
            expertise,
            profilePic,
            doj
        } = req.body;
        try {
            await bcrypt.genSalt(10);

            await PortalUser.findOneAndUpdate(
                { _id: staffId },
                {
                    $set: {
                        email:email,
                        country_code: countryCode,
                        mobile,
                        profile_picture: profilePic
                    },
                },
                { upsert: false, new: true }
            )

            const locationDetails = await LocationInfo.findOneAndUpdate(
                { for_portal_user: staffId },
                {
                    $set: {
                        ...addressInfo,
                    },
                },
                { upsert: false, new: true }
            )

            const staffProfileDetails = await ProfileInfo.findOneAndUpdate(
                { for_portal_user: staffId },
                {
                    $set: {
                        name: first_name + ' ' + middle_name + ' ' + last_name,
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
                        name: first_name + ' ' + middle_name + ' ' + last_name,
                        in_profile: staffProfileDetails._id,
                        role,
                        for_doctor: assignToDoctor,
                        for_staff: assignToStaff,
                        specialty,
                        services,
                        department,
                        unit,
                        expertise,
                        profile_picture: profilePic,
                        doj:doj

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
                message: "successfully updated hospital staff",
                errorCode: null,
            });
        } catch (error) {
            console.error("An error occurred:", error);
            sendResponse(req, res, 500, {
                status: false,
                body: null,
                message: "failed to update hospital staff",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async getStaffDetails(req, res) {
        try {
            const { hospitalStaffId } = req.query
            const staffFullDetails = await StaffInfo.findOne({ for_portal_user: hospitalStaffId })
                .populate({
                    path: "in_profile",
                    populate: {
                        path: 'in_location',
                        populate: {
                            path: "for_portal_user"
                        }
                    },
                })

            const profilePicKey = staffFullDetails.in_profile.profile_picture;
            const profilePictureArray = [profilePicKey]
            if (profilePicKey != "") {
                const resData = await httpService.postStaging('hospital/get-signed-url', { url: profilePictureArray }, {}, 'hospitalServiceUrl');
                staffFullDetails.in_profile.profile_picture = resData.data[0]
            } else {
                staffFullDetails.in_profile.profile_picture = ""
            }



            sendResponse(req, res, 200, {
                status: true,
                body: staffFullDetails,
                message: "successfully get hospital staff details",
                errorCode: null,
            });
        } catch (error) {
            console.error("An error occurred:", error);
            sendResponse(req, res, 500, {
                status: false,
                body: null,
                message: "failed to get hospital staff details",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async getAllStaff(req, res) {
        try {
            let { hospitalId, limit, page, searchText, role } = req.query
            
            let sort = req.query.sort
            let sortingarray = {};
            if (sort != 'undefined' && sort != '' && sort != undefined)  {
                let keynew = sort.split(":")[0];
                let value = sort.split(":")[1];
                sortingarray[keynew] = Number(value);
            }else{
                sortingarray['createdAt'] = -1;
            }
            let checkUser = await PortalUser.findOne({_id:mongoose.Types.ObjectId(hospitalId)});

            if(checkUser.role === "HOSPITAL_STAFF"){

                let adminData = await StaffInfo.findOne({for_portal_user:mongoose.Types.ObjectId(hospitalId)})

                hospitalId = adminData?.in_hospital;
            }
            
            let filter = {}
            if (role != "" && searchText != "") {
                filter = {
                    'portalusers.isDeleted': false,
                    "roles._id": mongoose.Types.ObjectId(role),
                    "profileinfos.name": { $regex: searchText || '', $options: "i" },
                    in_hospital: mongoose.Types.ObjectId(hospitalId)
                }
            } else if (role != "" && searchText == "") {
                filter = {
                    'portalusers.isDeleted': false,
                    "roles._id": mongoose.Types.ObjectId(role),
                    in_hospital: mongoose.Types.ObjectId(hospitalId)
                }
            } else if (role == "" && searchText != "") {
                filter = {
                    'portalusers.isDeleted': false,
                    in_hospital: mongoose.Types.ObjectId(hospitalId),
                    "profileinfos.name": { $regex: searchText || '', $options: "i" },
                }
            } else if (role == "" && searchText == "") {
                filter = {
                    'portalusers.isDeleted': false,
                    in_hospital: mongoose.Types.ObjectId(hospitalId)
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
                        paginatedResults: [{$sort:sortingarray},{ $skip: (page - 1) * limit }, { $limit: limit * 1 }],
                    }
                },
            ]
            let staffFullDetails = await StaffInfo.aggregate(query)

            for (let index = 0; index < staffFullDetails[0].paginatedResults.length; index++) {
                staffFullDetails[0].paginatedResults[index].profileinfos.profilePictureSignedUrl = ""
                const profilePicKey = staffFullDetails[0].paginatedResults[index].profileinfos.profile_picture;
                if (profilePicKey != "") {
                    const profilePictureArray = [profilePicKey]
                    const pharmacyLogo = await httpService.postStaging('pharmacy/get-signed-url', { url: profilePictureArray }, {}, 'pharmacyServiceUrl');
                    staffFullDetails[0].paginatedResults[index].profileinfos.profilePictureSignedUrl = pharmacyLogo.data[0]
                }
            }


            sendResponse(req, res, 200, {
                status: true,
                body: staffFullDetails,
                message: "successfully get all hospital staff",
                errorCode: null,
            });
        } catch (error) {
            console.error("An error occurred:", error);
            sendResponse(req, res, 500, {
                status: false,
                body: null,
                message: "failed to get all hospital staff",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async getAllStaffWithoutPagination(req, res) {
        try {
            const { hospitalId } = req.query
            let staffFullDetails = await StaffInfo.find({ in_hospital: hospitalId }, { in_profile: 1, _id: 0 })
                .populate({
                    path: "in_profile",
                    select: { name: 1, for_portal_user: 1, _id: 0 },
                }).populate({
                    path: "for_portal_user",
                    match: { isDeleted: false } // Add this match condition
                })
                 // Filter out any documents where for_portal_user is null
            const filteredResult = staffFullDetails.filter(item => item.for_portal_user);
            sendResponse(req, res, 200, {
                status: true,
                body: filteredResult,
                message: "successfully get all hospital staff",
                errorCode: null,
            });
        } catch (error) {
            console.error("An error occurred:", error);
            sendResponse(req, res, 500, {
                status: false,
                body: null,
                message: "failed to get all hospital staff",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }

    async actionForStaff(req, res) {
        try {
            const { staff_id, action_name, action_value } = req.body
            ;
            let key;
            let actionMessage;

            key = action_name === "delete" ? 'isDeleted' : action_name === "lock" ? "lock_user" : action_name === "active" ? "isActive" : ''
            if (key) {
                const portalData = await PortalUser.findOneAndUpdate(
                    { _id: { $eq: staff_id } },
                    {
                        $set: {
                            [key]: action_value
                        }
                    },
                    { new: true },

                )
                 await StaffInfo.findOneAndUpdate(
                    { for_portal_user: { $eq: staff_id } },
                    {
                        $set: {
                            [key]: action_value
                        }
                    },
                    { new: true },
               
            );
                if (action_name === "active" && action_value) {
                    actionMessage = "actived"
                } else if (action_name === "active" && !action_value) {
                    actionMessage = "deactived"
                }
                if (action_name === "delete" && action_value) {
                    actionMessage = "deleted"
                }
                if (action_name === "lock" && action_value) {
                    actionMessage = "locked"
                } else if (action_name === "lock" && !action_value) {
                    actionMessage = "unlocked"
                }
                sendResponse(req, res, 200, {
                    status: true,
                    data: portalData,
                    message: `Staff ${actionMessage} successfully`,
                    errorCode: null,
                });
            }

          
        } catch (error) {
            
            sendResponse(req, res, 500, {
                status: false,
                body: error,
                message: "failed to fetch hospital staff list",
                errorCode: "INTERNAL_SERVER_ERROR",
            });
        }
    }
}

module.exports = new HospitalStaffController();

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