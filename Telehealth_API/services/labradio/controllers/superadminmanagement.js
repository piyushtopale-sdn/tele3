import mongoose from "mongoose";
import BasicInfo from "../models/basic_info";
import { sendResponse } from "../helpers/transmission";
import PortalUser from "../models/portal_user";
import Http from "../helpers/httpservice";
const httpService = new Http();
import DocumentInfo from "../models/document_info";
import FeeManagement from "../models/fee_management";
import Availability from "../models/availability";
import LabTest from "../models/lab_test.models";
import RadiologyTest from "../models/radiology_test";
import { generateSignedUrl } from "../helpers/gcs";
export const getLab_RadioList = async (req, res) => {
  try {
    const { page, limit, status, searchText, type } = req.query;

    let sort = req.query.sort;
    let sortingarray = {};
    if (sort != undefined && sort != "") {
      let keynew = sort.split(":")[0];
      let value = sort.split(":")[1];
      sortingarray[keynew] = Number(value);
    } else {
      sortingarray["createdAt"] = -1;
    }

    let filter
    if(type){
      if(req.user.role === 'superadmin'){
        filter = {
          "for_portal_user.type": type,
          "for_portal_user.role": "INDIVIDUAL",
          "for_portal_user.isDeleted": false,
          verify_status: status,
        };

      }else{
        filter = {
          "for_portal_user.type": type,
          "for_portal_user.role": "INDIVIDUAL",
          "for_portal_user.isDeleted": false,
          "for_portal_user.lock_user":false,
          verify_status: status,
        };
      }
    }else{
      filter = {
        "for_portal_user.role": "INDIVIDUAL",
        "for_portal_user.isDeleted": false,
        "for_portal_user.lock_user":false,
         verify_status: status,
      };
    }
    if (searchText) {
      filter["$or"] = [
        { centre_name: { $regex: searchText || "", $options: "i" } },
        {
          "for_portal_user.email": { $regex: searchText || "", $options: "i" },
        },
      ];
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
      { $unwind: "$for_portal_user" },
      { $match: filter },
      {
        $lookup: {
          from: "locationinfos",
          localField: "in_location",
          foreignField: "_id",
          as: "in_location",
        },
      },
      {
        $unwind: {
          path: "$in_location",
          preserveNullAndEmptyArrays: true, // This option prevents null if there's no match
        },
      },
      {
        $project: {
          verify_status: 1,
          centre_name: 1,
          centre_name_arabic: 1,
          licence_details: 1,
          in_location: 1,
          profile_picture: 1,
          for_portal_user: {
            _id: "$for_portal_user._id",
            email: "$for_portal_user.email",
            country_code: "$for_portal_user.country_code",
            phone_number: "$for_portal_user.phone_number",
            lock_user: "$for_portal_user.lock_user",
            isActive: "$for_portal_user.isActive",
            createdAt: "$for_portal_user.createdAt",
            type: "$for_portal_user.type",
            role: "$for_portal_user.role",
            notification: "$for_portal_user.notification",
          },
          updatedAt: 1,
        },
      },
    ];
    const totalCount = await BasicInfo.aggregate(aggregate);
    aggregate.push({
      $sort: sortingarray,
    });
    if (limit !== "0") {
      aggregate.push({ $skip: searchText ? 0 : (page - 1) * limit }, { $limit: limit * 1 });
    }

    const result = await BasicInfo.aggregate(aggregate);
    /**Fetching signed url - Feb 7 */
    const signedResults = await Promise.all(
      result.map(async (item) => ({
        ...item,
        signed_profile_picture: await generateSignedUrl(item.profile_picture),
      }))
    );
    
    sendResponse(req, res, 200, {
      status: true,
      data: {
        currentPage: page,
        totalPages: Math.ceil(totalCount.length / limit),
        // data: result,
        data: signedResults,
        totalCount: totalCount.length,
      },
      message: `${type} list fetched successfully`,
      errorCode: null,
    });
  } catch (error) {
    console.log(error,"error__________");
    sendResponse(req, res, 500, {
      status: false,
      body: error,
      message: "Internal server error",
      errorCode: null,
    });
  }
};

export const getLabRadioListByPortalUser = async (req, res) => {
  try {
    const { page, limit, status, searchText, type } = req.query;

    let sort = req.query.sort;
    let sortingarray = {};
    if (sort != undefined && sort != "") {
      let keynew = sort.split(":")[0];
      let value = sort.split(":")[1];
      sortingarray[keynew] = Number(value);
    } else {
      sortingarray["createdAt"] = -1;
    }

    let filter
    if(type){
      if(req.user.role === 'superadmin'){
        filter = {
          "for_portal_user.type": type,
          "for_portal_user.role": "INDIVIDUAL",
          "for_portal_user.isDeleted": false,
          verify_status: status,
        };

      }else{
        filter = {
          "for_portal_user.type": type,
          "for_portal_user.role": "INDIVIDUAL",
          "for_portal_user.isDeleted": false,
          "for_portal_user.lock_user":false,
          verify_status: status,
        };
      }
    }else{
      filter = {
        "for_portal_user.role": "INDIVIDUAL",
        "for_portal_user.isDeleted": false,
        "for_portal_user.lock_user":false,
         verify_status: status,
      };
    }
    if (searchText) {
      filter["$or"] = [
        { centre_name: { $regex: searchText || "", $options: "i" } },
        {
          "for_portal_user.email": { $regex: searchText || "", $options: "i" },
        },
      ];
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
      { $unwind: "$for_portal_user" },
      { $match: filter },
      {
        $lookup: {
          from: "locationinfos",
          localField: "in_location",
          foreignField: "_id",
          as: "in_location",
        },
      },
      {
        $unwind: {
          path: "$in_location",
          preserveNullAndEmptyArrays: true, // This option prevents null if there's no match
        },
      },
      {
        $project: {
          verify_status: 1,
          centre_name: 1,
          centre_name_arabic: 1,
          licence_details: 1,
          in_location: 1,
          profile_picture: 1,
          for_portal_user: {
            _id: "$for_portal_user._id",
            centre_name: "$for_portal_user.centre_name",
            centre_name_arabic: "$for_portal_user.centre_name_arabic",
            email: "$for_portal_user.email",
            country_code: "$for_portal_user.country_code",
            phone_number: "$for_portal_user.phone_number",
            lock_user: "$for_portal_user.lock_user",
            isActive: "$for_portal_user.isActive",
            createdAt: "$for_portal_user.createdAt",
            type: "$for_portal_user.type",
            role: "$for_portal_user.role",
            notification: "$for_portal_user.notification",
          },
          updatedAt: 1,
        },
      },
    ];
    const totalCount = await BasicInfo.aggregate(aggregate);
    aggregate.push({
      $sort: sortingarray,
    });
    if (limit !== "0") {
      aggregate.push({ $skip: searchText ? 0 : (page - 1) * limit }, { $limit: limit * 1 });
    }

    const result = await BasicInfo.aggregate(aggregate);
    /**Fetching signed url - Feb 7 */
    const signedResults = await Promise.all(
      result.map(async (item) => ({
        ...item,
        signed_profile_picture: await generateSignedUrl(item.profile_picture),
      }))
    );
    
    sendResponse(req, res, 200, {
      status: true,
      data: {
        currentPage: page,
        totalPages: Math.ceil(totalCount.length / limit),
        // data: result,
        data: signedResults,
        totalCount: totalCount.length,
      },
      message: `${type} list fetched successfully`,
      errorCode: null,
    });
  } catch (error) {
    console.log(error,"error__________");
    sendResponse(req, res, 500, {
      status: false,
      body: error,
      message: "Internal server error",
      errorCode: null,
    });
  }
};

export const getLabRadioTestsList = async (req, res) => {
  try {
    const labTests = await LabTest.find({ isDeleted: false }).select("testName labId");
    const radioTests = await RadiologyTest.find({ isDeleted: false }).select("testName radiologyId");

    const combinedTests = [
      ...labTests.map(test => ({
        testName: test.testName,
        labTestId: test._id,
        labRadioId:test.labId,
        type: "lab",
      })),
      ...radioTests.map(test => ({
        testName: test.testName,
        radiologyTestId: test._id,
        labRadioId:test.radiologyId,
        type: "radio",
      })),
    ];

    sendResponse(req, res, 200, {
      status: true,
      body: {
        labRadioTests: combinedTests,
      },
      message: `List fetched successfully`,
      errorCode: null,
    });
  } catch (error) {
    console.log(error,"error__________");
    sendResponse(req, res, 500, {
      status: false,
      body: error,
      message: "Internal server error",
      errorCode: null,
    });
  }
};

export const approveOrRejectLabRadio = async (req, res) => {
  const { verify_status, doctor_portal_id, approved_or_rejected_by } = req.body;
  let date = null;
  if (verify_status == "APPROVED") {
    const cdate = new Date();
    date = `${cdate.getFullYear()}-${cdate.getMonth() + 1}-${cdate.getDate()}`;
  }

  try {
    const result = await BasicInfo.findOneAndUpdate(
      { for_portal_user: doctor_portal_id },
      {
        $set: {
          verify_status,
          approved_at: date,
          approved_or_rejected_by,
        },
      },
      { upsert: false, new: true }
    ).exec();
    if (result) {
      sendResponse(req, res, 200, {
        status: true,
        data: null,
        message: `${verify_status} doctor successfully`,
        errorCode: null,
      });
    }
  } catch (error) {
    sendResponse(req, res, 500, {
      status: false,
      data: error,
      message: `failed to ${verify_status} doctor`,
      errorCode: "INTERNAL_SERVER_ERROR",
    });
  }
};

export const activeLockDeleteLabRadio = async (req, res) => {
  try {
    const { action_name, action_value, doctor_portal_id, type } = req.body;
    let key;
    key =
      action_name === "delete"
        ? "isDeleted"
        : action_name === "lock"
        ? "lock_user"
        : action_name === "active"
        ? "isActive"
        : "";
    if (key) {
      const portalData = await PortalUser.findOneAndUpdate(
        { _id: { $eq: doctor_portal_id } },
        {
          $set: {
            [key]: action_value,
          },
        },
        { new: true }
      );
      let actionMessage;
      if (action_name === "active" && action_value) {
        actionMessage = "activated";
      } else if (action_name === "active" && !action_value) {
        actionMessage = "deactivated";
      }
      if (action_name === "delete" && action_value) {
        actionMessage = "deleted";
      }
      if (action_name === "lock" && action_value) {
        actionMessage = "locked";
      } else if (action_name === "lock" && !action_value) {
        actionMessage = "unlocked";
      }
      sendResponse(req, res, 200, {
        status: true,
        data: null,
        message: `${type} ${actionMessage} successfully`,
        errorCode: null,
      });
    } else {
      sendResponse(req, res, 500, {
        status: false,
        data: null,
        message: `Something went wrong`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  } catch (error) {
    sendResponse(req, res, 500, {
      status: false,
      data: error,
      message: `Something went wrong`,
      errorCode: "INTERNAL_SERVER_ERROR",
    });
  }
};

export const labRadioViewBasicInfo = async (req, res) => {
  const { portal_user_id, type } = req.query;
  try {
    const headers = {
      Authorization: req.headers["authorization"],
    };
    let filter = {
      for_portal_user: mongoose.Types.ObjectId(portal_user_id),
      type: type,
    };

    let aggregate = [
      { $match: filter },
      {
        $lookup: {
          from: "portalusers",
          localField: "for_portal_user",
          foreignField: "_id",
          as: "for_portal_user",
        },
      },
      {
        $unwind: { path: "$for_portal_user", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "locationinfos",
          localField: "in_location",
          foreignField: "_id",
          as: "in_location",
        },
      },
      {
        $unwind: {
          path: "$in_location",
          preserveNullAndEmptyArrays: true, // This option prevents null if there's no match
        },
      },
      {
        $lookup: {
          from: "bankdetails",
          localField: "in_bank",
          foreignField: "_id",
          as: "in_bank",
        },
      },
      { $unwind: { path: "$in_bank", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "mobilepays",
          localField: "in_mobile_pay",
          foreignField: "_id",
          as: "in_mobile_pay",
        },
      },
      { $unwind: { path: "$in_mobile_pay", preserveNullAndEmptyArrays: true } },
      // {
      //   $lookup: {
      //     from: "feemanagements",
      //     localField: "in_fee_management",
      //     foreignField: "_id",
      //     as: "feeMAnagementArray",
      //   }
      // },
      // { $unwind: { path: "$feeMAnagementArray", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "educationaldetails",
          localField: "in_education",
          foreignField: "_id",
          as: "in_education",
        },
      },
      { $unwind: { path: "$in_education", preserveNullAndEmptyArrays: true } },
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
      {
        $lookup: {
          from: "documentmanagements",
          localField: "in_document_management",
          foreignField: "_id",
          as: "in_document_management",
        },
      },
      {
        $unwind: {
          path: "$in_document_management",
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
        $unwind: { path: "$profile_picture", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "documentinfos",
          localField: "license_details.image",
          foreignField: "_id",
          as: "license_image",
        },
      },
      { $unwind: { path: "$license_image", preserveNullAndEmptyArrays: true } },
    ];

    const result = await BasicInfo.aggregate(aggregate);

    if (result.length > 0) {
      const specialityPromises = result.map((item) =>
        httpService.getStaging(
          "hospital/get-speciality-data",
          { data: item.speciality },
          headers,
          "hospitalServiceUrl"
        )
      );
      const teamPromises = result.map((item) =>
        httpService.getStaging(
          "hospital/get-team-data",
          { data: item.team },
          headers,
          "hospitalServiceUrl"
        )
      );
      const [specialityData, teamData] = await Promise.all([
        Promise.all(specialityPromises),
        Promise.all(teamPromises),
      ]);

      result.forEach((item, index) => {
        item.specialities = specialityData[index]?.data;
        item.speciality = specialityData[index]?.data;
        item.team = teamData[index]?.data;
      });
      // For Profile Picture
      const profilePicture = await Promise.all(
        result.map(async (chat) => {
          // For Profile Picture
          if (chat?.profile_picture?.url) {
            chat.profile_picture.url = await getDocument(
              chat?.profile_picture?.url
            );
          }

          if (chat?.license_image?.url) {
            chat.license_details.image = await getDocument(
              chat?.license_image?.url
            );
          }

          // For Document Management
          const documents = chat?.in_document_management;
          const documentsArray = [];
          if (documents) {
            for (const data of documents.document_details) {
              let image = "";
              if (data?.image_url) {
                try {
                  let data1 = await DocumentInfo.findOne({
                    _id: data?.image_url,
                  });
                  if (data1) {
                    image = await getDocument(data1.url);
                  }
                } catch (error) {
                  console.error("Error fetching document info:", error);
                }
              }
              data.image_url = image;
              documentsArray.push(data);
            }
            documents.document_details = documentsArray;
          }
        })
      );
      let feeMAnagementArray = [];
      feeMAnagementArray = await FeeManagement.find({
        for_portal_user: portal_user_id,
        type: type,
      });

      let availabilityArray = [];
      availabilityArray = await Availability.find({
        for_portal_user: portal_user_id,
        type: type,
      });
      sendResponse(req, res, 200, {
        status: true,
        data: {
          result,
          feeMAnagementArray,
          availabilityArray,
        },
        message: `${type} basic info fetched successfully`,
        errorCode: null,
      });
    } else {
      sendResponse(req, res, 200, {
        status: true,
        data: null,
        message: `${type} basic info not fetched successfully`,
        errorCode: null,
      });
    }
  } catch (error) {
    sendResponse(req, res, 500, {
      status: false,
      body: error,
      message: error.message ? error.message : "Something went wrong",
      errorCode: error.code ? error.code : "Internal server error",
    });
  }
};
