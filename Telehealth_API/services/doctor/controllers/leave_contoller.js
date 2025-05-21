"use strict";

import LeaveManagement from "../models/leave_management";
import mongoose from "mongoose";
import { sendResponse } from "../helpers/transmission";
import StaffInfo from "../models/staff_info";


const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Add leave
export const addLeave = async (req, res) => {
  const {
    role_type,
    leave_typeId,
    subject,
    reason,
    from_date,
    to_date,
    created_by,
    for_user,
    status,
    sent_to,
  } = req.body;

  try {
    let result = new LeaveManagement({
      role_type,
      leave_typeId,
      subject,
      reason,
      from_date,
      to_date,
      created_by,
      for_user,
      status,
      sent_to,
    });

    const resObject = await result.save();
    
    sendResponse(req, res, 200, {
      status: true,
      message: "Add leave successfully",
      errorCode: null,
      result: resObject,
    });
  } catch (error) {
    console.error(error);
    sendResponse(req, res, 500, {
      status: false,
      body: null,
      message: "Failed to add leave",
      errorCode: "INTERNAL_SERVER_ERROR",
    });
  }
};

export const getAllselfLeave = async (req, res) => {
  try {
    const { created_by, page = 1, limit = 10, fromDate, toDate, leaveType } = req.query;

    let leaves_type_filter = {}
    if (leaveType) {
      leaves_type_filter = {
        leave_typeId: mongoose.Types.ObjectId(leaveType),
      };
    }

    let date_filter = {};
    if(fromDate && toDate) {
      const fromDateObj = new Date(`${fromDate} 00:00:00`);
      const toDateObj = new Date(`${toDate} 23:59:59`);
      date_filter = {
        createdAt: { $gte: fromDateObj, $lte: toDateObj }
      }
    } else if (fromDate) {
      const fromDateObj = new Date(`${fromDate} 00:00:00`);
      const toDateObj = new Date(`${fromDate} 23:59:59`);
      date_filter = {
        createdAt: { $gte: fromDateObj, $lte: toDateObj }
      }
    }
    
    const pipeline = [
      {
        $lookup: {
          from: "leave_types",
          localField: "leave_typeId",
          foreignField: "_id",
          as: "leave_types"
        }
      },
      { $unwind: { path: "$leave_types", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          leave_type: "$leave_types.leave_type"
        }
      },
      {
        $match: {
          created_by: mongoose.Types.ObjectId(created_by),
          $and: [
            leaves_type_filter,
            date_filter
        ],
        }
      },
      {
        $group: {
          _id: "$_id",
          leave_typeId: { $first: "$leave_typeId" },
          subject: { $first: "$subject" },
          reason: { $first: "$reason" },
          from_date: { $first: "$from_date" },
          to_date: { $first: "$to_date" },
          role_type: { $first: "$role_type" },
          created_by: { $first: "$created_by" },
          for_user: { $first: "$for_user" },
          status: { $first: "$status" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          leave_type: { $first: "$leave_type" }
        }
      },
      {
        $sort: {
          createdAt: -1
        }
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
            { $limit: limit * 1 }
          ]
        }
      }
    ];

    const result = await LeaveManagement.aggregate(pipeline);

    let totalCount = 0;
    if (result[0] && result[0].totalCount && result[0].totalCount.length > 0) {
      totalCount = result[0].totalCount[0].count;
    }

    sendResponse(req, res, 200, {
      status: true,
      body: {
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        totalRecords: totalCount,
        listdata: result[0] ? result[0].paginatedResults : [],
      },
      message: "List fetched successfully",
      errorCode: null
    });
  } catch (err) {
    console.error(err, 'error');
    sendResponse(req, res, 500, {
      status: false,
      body: err,
      message: "Failed to fetch list",
      errorCode: "INTERNAL_SERVER_ERROR"
    });
  }
};

export const doctorStaffLeavesList = async (req, res) => {
  try {
    const { page = 1, limit = 10, searchKey, fromDate, toDate, doctorId, leaveType } = req.query;
    const sort = req.query.sort;
    const sortingarray = {};

    if (sort) {
      const [key, value] = sort.split(":");
      sortingarray[key] = value === "asc" ? 1 : -1;
    } else {
      sortingarray['createdAt'] = -1;
    }

    let searchText_filter = [{}];
    if (searchKey && searchKey.trim() !== "") {
      searchText_filter = [
        {
          staffName: { $regex: searchKey, $options: "i" },
        },
      ];
    }

    let leaves_type_filter = {}
    if (leaveType) {
      leaves_type_filter = {
        leave_typeId: mongoose.Types.ObjectId(leaveType),
      };
    }

    let date_filter = {};
    if(fromDate && toDate) {
      const fromDateObj = new Date(`${fromDate} 00:00:00`);
      const toDateObj = new Date(`${toDate} 23:59:59`);
      date_filter = {
        createdAt: { $gte: fromDateObj, $lte: toDateObj }
      }
    } else if (fromDate) {
      const fromDateObj = new Date(`${fromDate} 00:00:00`);
      const toDateObj = new Date(`${fromDate} 23:59:59`);
      date_filter = {
        createdAt: { $gte: fromDateObj, $lte: toDateObj }
      }
    }

    const getDoctorAllStaff = await StaffInfo.find({staff_of: {$eq: doctorId}}).select('for_portal_user')
    const staffId = getDoctorAllStaff.map(ids => ids.for_portal_user)
    const pipeline = [
      {
        $lookup: {
          from: "leave_types",
          localField: "leave_typeId",
          foreignField: "_id",
          as: "leave_types"
        }
      },
      { $unwind: { path: "$leave_types", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          leave_type: "$leave_types.leave_type"
        }
      },
      {
        $lookup: {
          from: "portalusers",
          localField: "created_by",
          foreignField: "_id",
          as: "portalusers"
        }
      },
      { $unwind: { path: "$portalusers", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          staffName: "$portalusers.full_name",
        }
      },
      {
        $match: {
          created_by: {$in: staffId},
          $or: searchText_filter,
          $and: [
            leaves_type_filter,
            date_filter
        ],
        }
      },
      {
        $group: {
          _id: "$_id",
          staffName: { $first: "$staffName" },
          leave_typeId: { $first: "$leave_typeId" },
          subject: { $first: "$subject" },
          reason: { $first: "$reason" },
          from_date: { $first: "$from_date" },
          to_date: { $first: "$to_date" },
          role_type: { $first: "$role_type" },
          created_by: { $first: "$created_by" },
          for_user: { $first: "$for_user" },
          status: { $first: "$status" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          leave_type: { $first: "$leave_type" }
        }
      },
      {
        $sort: sortingarray
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
            { $limit: limit * 1 }
          ]
        }
      }
    ];

    const result = await LeaveManagement.aggregate(pipeline);

    let totalCount = 0;
    if (result[0] && result[0].totalCount && result[0].totalCount.length > 0) {
      totalCount = result[0].totalCount[0].count;
    }

    sendResponse(req, res, 200, {
      status: true,
      body: {
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        totalRecords: totalCount,
        listdata: result[0] ? result[0].paginatedResults : [],
      },
      message: "List fetched successfully",
      errorCode: null
    });
  } catch (err) {
    console.error(err, 'error');
    sendResponse(req, res, 500, {
      status: false,
      body: err,
      message: "Failed to fetch list",
      errorCode: "INTERNAL_SERVER_ERROR"
    });
  }
};

// Update leave 
export const updateLeave = async (req, res) => {
  try {
    const {
      role_type,
      leave_typeId,
      subject,
      reason,
      from_date,
      to_date,
      created_by,
      for_user,
      status,
      sent_to,
    } = req.body;
    const { id } = req.params;

    const leave = await LeaveManagement.findById(id);
    if (!leave) {
      return sendResponse(req, res, 404, {
        status: false,
        body: null,
        message: "Leave not found",
        errorCode: "NOT_FOUND",
      });
    }

    leave.role_type = role_type;
    leave.leave_typeId = leave_typeId;
    leave.subject = subject;
    leave.reason = reason;
    leave.from_date = from_date;
    leave.to_date = to_date;
    leave.created_by = created_by;
    leave.for_user = for_user;
    leave.status = status;
    leave.sent_to = sent_to;

    const updatedLeave = await leave.save();

    sendResponse(req, res, 200, {
      status: true,
      body: updatedLeave,
      message: "Successfully updated leave",
      errorCode: null,
    });
  } catch (error) {
    console.error(error);
    sendResponse(req, res, 500, {
      status: false,
      body: null,
      message: "Failed to update leave",
      errorCode: "INTERNAL_SERVER_ERROR",
    });
  }
};

// Leave List
export const getAllMyLeave = async (req, res) => {
  try {
    const {
      for_portal_user,
      page,
      limit,
      searchKey,
      createdDate,
      updatedDate,
    } = req.query;
    let sort = req.query.sort
    let sortingarray = {};
    if (sort != 'undefined' && sort != '' && sort != undefined) {
      let keynew = sort.split(":")[0];
      let value = sort.split(":")[1];
      sortingarray[keynew] = value;
    } else {
      sortingarray['createdAt'] = -1;
    }
    const filter = {};

    if (searchKey != "") {
      filter["$or"] = [
        {
          leave_type: { $regex: searchKey, $options: "i" },
        },
      ];
    }
    let dateFilter = {};
    if (createdDate && createdDate !== "") {
      const createdDateObj = new Date(createdDate);
      const updatedDateObj = new Date(updatedDate);
      dateFilter.createdAt = { $gte: createdDateObj, $lte: updatedDateObj };
    }

    const listdata = await LeaveManagement.find({
      created_by: for_portal_user,
      ...filter,
      ...dateFilter,
    })
      .sort(sortingarray)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await LeaveManagement.countDocuments({
      created_by: for_portal_user,
      ...filter,
      ...dateFilter,
    });

    sendResponse(req, res, 200, {
      status: true,
      body: {
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalRecords: count,
        listdata,
      },
      message: `List Fetch successfully`,
      errorCode: null,
    });
  } catch (err) {

    sendResponse(req, res, 500, {
      status: false,
      data: err,
      message: `Failed to fetch list`,
      errorCode: "INTERNAL_SERVER_ERROR",
    });
  }
};


export const LeaveAccept = async (req, res) => {
  try {
    let jsondata = {
      status: req.body.status,
    };
    const result = await LeaveManagement.updateOne(
      { _id: mongoose.Types.ObjectId(req.body._id) },
      { $set: jsondata },
      { new: true }
    );
    if (!result) {
      sendResponse(req, res, 400, {
        status: false,
        message: "Do not Successfully Leave Updated",
        errorCode: null,
        result: result,
      });
    } else {
      sendResponse(req, res, 200, {
        status: true,
        message: "Successfully Leave Accepted",
        errorCode: null,
        result: result,
      });
    }
  } catch (error) {
    console.error("An error occurred:", error);
    res.send({
      status: false,
      messgae: "Oops!! something went wrong",
    });
  }
};

export const LeaveReject = async (req, res) => {
  try {
    let jsondata = {
      status: req.body.status,
    };
    const result = await LeaveManagement.updateOne(
      { _id: mongoose.Types.ObjectId(req.body._id) },
      { $set: jsondata },
      { new: true }
    );
    if (!result) {
      sendResponse(req, res, 400, {
        status: false,
        message: "Do not Successfully Leave Reject",
        errorCode: null,
        result: result,
      });
    } else {
      sendResponse(req, res, 200, {
        status: true,
        message: "Successfully Leave Reject",
        errorCode: null,
        result: result,
      });
    }
  } catch (error) {
    console.error("An error occurred:", error);
    res.send({
      status: false,
      messgae: "Oops!! something went wrong",
    });
  }
};

export const getAllMyStaffLeaves = async (req, res) => {

  try {
    const { page, limit, searchKey, createdDate, updatedDate } = req.query;
    let sort = req.query.sort
    let sortingarray = {};
    if (sort != 'undefined' && sort != '' && sort != undefined) {
      let keynew = sort.split(":")[0];
      let value = sort.split(":")[1];
      sortingarray[keynew] = Number(value);
    } else {
      sortingarray['createdAt'] = -1;
    }
    let dateFilter = {};
    if (createdDate && createdDate !== "") {
      const createdDateObj = new Date(createdDate);
      const updatedDateObj = new Date(updatedDate);
      dateFilter.createdAt = { $gte: createdDateObj, $lte: updatedDateObj };
    }
    const filter = {
      sent_to: mongoose.Types.ObjectId(req.query.sent_to),
      ...dateFilter,
      // status:"0"
    };

    let aggregate = [
      { $match: filter },
      {
        $lookup: {
          from: "profileinfos",
          localField: "created_by",
          foreignField: "for_portal_user",
          as: "StaffData",
        },
      },
      { $unwind: "$StaffData" },
    ];
    
    if (searchKey && searchKey !== "") {
      const safeSearch = escapeRegex(searchKey);
      const regex = new RegExp(safeSearch, "i");
      aggregate.push({ $match: { leave_type: regex } });
    }

    const totalCount = await LeaveManagement.aggregate(aggregate);

    aggregate.push(
      { $sort: sortingarray },
      { $skip: (page - 1) * limit },
      { $limit: limit * 1 }
    );
    const listdata = await LeaveManagement.aggregate(aggregate);
    sendResponse(req, res, 200, {
      status: true,
      body: {
        totalPages: Math.ceil(totalCount.length / limit),
        currentPage: page,
        totalRecords: totalCount.length,
        listdata,
      },
      message: `List Fetch successfully`,
      errorCode: null,
    });
  } catch (err) {

    sendResponse(req, res, 500, {
      status: false,
      data: err,
      message: `Failed to fetch list`,
      errorCode: "INTERNAL_SERVER_ERROR",
    });
  }
};

export const StaffLeaveAccept = async (req, res) => {
  try {
    let jsondata = {
      status: req.body.status,
    };
    const result = await LeaveManagement.updateOne(
      { _id: mongoose.Types.ObjectId(req.body._id) },
      { $set: jsondata },
      { new: true }
    );
    if (!result) {
      sendResponse(req, res, 400, {
        status: false,
        message: "Do not Successfully Leave Updated",
        errorCode: null,
        result: result,
      });
    } else {
      sendResponse(req, res, 200, {
        status: true,
        message: "Successfully Leave Accepted",
        errorCode: null,
        result: result,
      });
    }
  } catch (error) {
    console.error("An error occurred:", error);
    res.send({
      status: false,
      messgae: "Oops!! something went wrong",
    });
  }
};

export const StaffLeaveReject = async (req, res) => {
  try {
    let jsondata = {
      status: req.body.status,
    };
    const result = await LeaveManagement.updateOne(
      { _id: mongoose.Types.ObjectId(req.body._id) },
      { $set: jsondata },
      { new: true }
    );
    if (!result) {
      sendResponse(req, res, 400, {
        status: false,
        message: "Do not Successfully Leave Reject",
        errorCode: null,
        result: result,
      });
    } else {
      sendResponse(req, res, 200, {
        status: true,
        message: "Successfully Leave Reject",
        errorCode: null,
        result: result,
      });
    }
  } catch (error) {
    console.error("An error occurred:", error);
    res.send({
      status: false,
      messgae: "Oops!! something went wrong",
    });
  }
};

export const getAllMyHospitalStaffLeave = async (req, res) => {
  try {
    const { page, limit, searchKey, createdDate, updatedDate } = req.query;
    let sort = req.query.sort
    let sortingarray = {};
    if (sort != 'undefined' && sort != '' && sort != undefined) {
      let keynew = sort.split(":")[0];
      let value = sort.split(":")[1];
      sortingarray[keynew] = value;
    } else {
      sortingarray['createdAt'] = -1;
    }
    const filter = {};

    if (searchKey && typeof searchKey === "string" && searchKey.trim() !== "") {
      filter["$or"] = [
        {
          leave_type: { $regex: searchKey, $options: "i" },
        },
      ];
    }

    let dateFilter = {};
    if (createdDate && createdDate !== "") {
      const createdDateObj = new Date(createdDate);
      const updatedDateObj = new Date(updatedDate);
      dateFilter.createdAt = { $gte: createdDateObj, $lte: updatedDateObj };
    }

    const listdata = await LeaveManagement.find({
      created_by: mongoose.Types.ObjectId(req.query.created_by),
      ...filter,
      ...dateFilter,
    })
      .sort(sortingarray)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await LeaveManagement.countDocuments({});
    sendResponse(req, res, 200, {
      status: true,
      body: {
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalRecords: listdata.length,
        listdata,
      },
      message: `List Fetch successfully`,
      errorCode: null,
    });
  } catch (err) {

    sendResponse(req, res, 500, {
      status: false,
      data: err,
      message: `Failed to fetch list`,
      errorCode: "INTERNAL_SERVER_ERROR",
    });
  }
};

export const getAllMyHospitalStaffLeaves = async (req, res) => {

  try {
    const { page, limit, searchKey, createdDate, updatedDate } = req.query;
    let sort = req.query.sort
    let sortingarray = {};
    if (sort != 'undefined' && sort != '' && sort != undefined) {
      let keynew = sort.split(":")[0];
      let value = sort.split(":")[1];
      sortingarray[keynew] = Number(value);
    } else {
      sortingarray['for_portal_user.createdAt'] = -1;
    }
    let dateFilter = {};
    if (createdDate && createdDate !== "") {
      const createdDateObj = new Date(createdDate);
      const updatedDateObj = new Date(updatedDate);
      dateFilter.createdAt = { $gte: createdDateObj, $lte: updatedDateObj };
    }
    const filter = {
      sent_to: mongoose.Types.ObjectId(req.query.sent_to),
      role_type: "HOSPITAL_STAFF",
      ...dateFilter,
      // status:"0"
    };

    let aggregate = [
      { $match: filter },
      {
        $lookup: {
          from: "profileinfos",
          localField: "created_by",
          foreignField: "_id",
          as: "StaffData",
        },
      },
      { $unwind: "$StaffData" },
    ];

    if (searchKey && searchKey !== "") {
      filter["$or"] = [
        { leave_type: { $regex: searchKey || "", $options: "i" } },
        { "StaffData.name": { $regex: `.*${searchKey}.*`, $options: "i" } },
        { subject: { $regex: searchKey || "", $options: "i" } },
        { reason: { $regex: searchKey || "", $options: "i" } }
      ];
    }

    const totalCount = await LeaveManagement.aggregate(aggregate);

    aggregate.push(
      { $sort: sortingarray },
      { $skip: (page - 1) * limit },
      { $limit: limit * 1 }
    );
    const listdata = await LeaveManagement.aggregate(aggregate);
    sendResponse(req, res, 200, {
      status: true,
      body: {
        totalPages: Math.ceil(totalCount.length / limit),
        currentPage: page,
        totalRecords: totalCount.length,
        listdata,
      },
      message: `List Fetch successfully`,
      errorCode: null,
    });
  } catch (err) {

    sendResponse(req, res, 500, {
      status: false,
      data: err,
      message: `Failed to fetch list`,
      errorCode: "INTERNAL_SERVER_ERROR",
    });
  }
};

export const HospitalStaffLeaveAccept = async (req, res) => {
  try {
    let jsondata = {
      status: req.body.status,
    };
    const result = await LeaveManagement.updateOne(
      { _id: mongoose.Types.ObjectId(req.body._id) },
      { $set: jsondata },
      { new: true }
    );
    if (!result) {
      sendResponse(req, res, 400, {
        status: false,
        message: "Do not Successfully Leave Updated",
        errorCode: null,
        result: result,
      });
    } else {
      sendResponse(req, res, 200, {
        status: true,
        message: "Successfully Leave Accepted",
        errorCode: null,
        result: result,
      });
    }
  } catch (error) {
    console.error("An error occurred:", error);
    res.send({
      status: false,
      messgae: "Oops!! something went wrong",
    });
  }
};

export const HospitalStaffLeaveReject = async (req, res) => {
  try {
    let jsondata = {
      status: req.body.status,
    };
    const result = await LeaveManagement.updateOne(
      { _id: mongoose.Types.ObjectId(req.body._id) },
      { $set: jsondata },
      { new: true }
    );
    if (!result) {
      sendResponse(req, res, 400, {
        status: false,
        message: "Do not Successfully Leave Reject",
        errorCode: null,
        result: result,
      });
    } else {
      sendResponse(req, res, 200, {
        status: true,
        message: "Successfully Leave Reject",
        errorCode: null,
        result: result,
      });
    }
  } catch (error) {
    console.error("An error occurred:", error);
    res.send({
      status: false,
      messgae: "Oops!! something went wrong",
    });
  }
};