import mongoose from "mongoose";
import LeaveTypes from "../../models/superadmin/leave_types";
import { sendResponse } from "../../helpers/transmission";

class LeaveTypeManagementController {
  async addLeaveTypes(req, res) {
    try {
      const { leaveTypesArray, added_by } = req.body;
      const list = leaveTypesArray.map((singleData) => ({
        ...singleData,
        added_by,
      }));
      const namesToFind = list.map((item) => item.leave_type);
      const foundItems = await LeaveTypes.find({
        leave_type: { $in: namesToFind },
        delete_status: false,
      });
      const existingLeaveTypes = new Set(
        foundItems.map((item) => item.leave_type)
      );

      const newLeaveTypes = list.filter(
        (item) => !existingLeaveTypes.has(item.leave_type)
      );

      if (newLeaveTypes.length > 0) {
        const savedLeaveTypes = await LeaveTypes.insertMany(newLeaveTypes);
        sendResponse(req, res, 200, {
          status: true,
          body: savedLeaveTypes,
          message: "Successfully added new leave types.",
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 200, {
          status: false,
          message: `${[...existingLeaveTypes]} already exist`,
          errorCode: null,
        });
      }
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "Failed to add leave types.",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async allLeaveTypesList(req, res) {
    try {
      const { limit, page, searchText, fromDate, toDate } = req.query;
      let sort = req.query.sort;
      let sortingarray = {};
      if (sort != undefined && sort != "") {
        let keynew = sort.split(":")[0];
        let value = sort.split(":")[1];
        sortingarray[keynew] = value;
      } else {
        sortingarray["createdAt"] = -1;
      }
      let filter = { delete_status: false };
      if (searchText != "") {
        filter = {
          delete_status: false,
          leave_type: { $regex: searchText || "", $options: "i" },
        };
      }
      if(fromDate && toDate) {
        const fromDateObj = new Date(`${fromDate} 00:00:00`);
        const toDateObj = new Date(`${toDate} 23:59:59`);
        filter.createdAt = { $gte: fromDateObj, $lte: toDateObj }
      }
      const typesList = await LeaveTypes.find(filter)
        .sort(sortingarray)
        .skip((page - 1) * limit)
        .limit(limit * 1)
        .exec();
      const count = await LeaveTypes.countDocuments(filter);
      sendResponse(req, res, 200, {
        status: true,
        body: {
          totalCount: count,
          data: typesList,
        },
        message: "Successfully get LeaveTypes list",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get LeaveTypes list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async updateLeaveTypes(req, res) {
    try {
      const { leaveTypesId, leave_type, leave_type_arabic, active_status, delete_status } =
        req.body;
      const list = await LeaveTypes.find({
        leave_type: leave_type,
        active_status: active_status,
        _id: { $ne: mongoose.Types.ObjectId(leaveTypesId) },
        is_deleted: false,
      });
      if (list.length === 0) {
        const updateLeaveTypes = await LeaveTypes.updateOne(
          { _id: leaveTypesId },
          {
            $set: {
              leave_type,
              leave_type_arabic,
              active_status,
              delete_status,
            },
          },
          { new: true }
        ).exec();
        sendResponse(req, res, 200, {
          status: true,
          body: updateLeaveTypes,
          message: "Successfully updated LeaveTypes",
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 200, {
          status: false,
          message: "Leave Type already exist",
          errorCode: null,
        });
      }
    } catch (err) {
      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to update LeaveTypes`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async actionOnLeaveTypes(req, res) {
    try {
      const { leaveTypesId, action_name, action_value } = req.body;
      let message = "";

      const filter = {};
      if (action_name == "active") filter["active_status"] = action_value;
      if (action_name == "delete") filter["delete_status"] = action_value;

      if (action_name == "active") {
        await LeaveTypes.updateOne({ _id: leaveTypesId }, filter, {
          new: true,
        }).exec();

        message =
          action_value == true
            ? "Successfully Active LeaveTypes"
            : "Successfully In-active LeaveTypes";
      }

      if (action_name == "delete") {
        if (leaveTypesId == "") {
          await LeaveTypes.updateMany(
            { delete_status: { $eq: false } },
            {
              $set: { delete_status: true },
            },
            { new: true }
          );
        } else {
          await LeaveTypes.updateMany(
            { _id: { $in: leaveTypesId } },
            {
              $set: { delete_status: true },
            },
            { new: true }
          );
        }
        message = "Successfully LeaveTypes deleted";
      }

      sendResponse(req, res, 200, {
        status: true,
        body: null,
        message: message,
        errorCode: null,
      });
    } catch (err) {
      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to LeaveTypes done`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async allLeaveTypeforexport(req, res) {
    const { searchText, limit, page } = req.query
    let filter
    if (searchText == "") {
      filter = {
        delete_status: false
      }
    } else {
      filter = {
        delete_status: false,
        team: { $regex: searchText || '', $options: "i" },
      }
    }
    try {
      let result = '';
      if (limit > 0) {
        result = await LeaveTypes.find(filter)
          .sort([["createdAt", -1]])
          .skip((page - 1) * limit)
          .limit(limit * 1)
          .exec();
      }
      else {
        result = await LeaveTypes.aggregate([{
          $match: filter
        },
        { $sort: { "createdAt": -1 } },
        {
          $project: {
            _id: 0,
            leave_type: "$leave_type"
          }
        }
        ])
      }
      let array = result.map(obj => Object.values(obj));
      sendResponse(req, res, 200, {
        status: true,
        data: {
          result,
          array
        },
        message: `Data exported successfully`,
        errorCode: null,
      });
    } catch (err) {
      
      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to export data`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
}

module.exports = new LeaveTypeManagementController();
