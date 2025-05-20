import LoincCode from "../../models/superadmin/loinc_code";
import { sendResponse } from "../../helpers/transmission";
import mongoose from "mongoose";
import { processExcel } from "../../middleware/utils";
import { LoincCodeColumns } from "../../config/constants";

import fs from "fs";

const validateColumnWithExcel = (toValidate, excelColumn) => {
  const requestBodyCount = Object.keys(toValidate).length;
  const fileColumnCount = Object.keys(excelColumn).length;
  if (requestBodyCount !== fileColumnCount) {
    return false;
  }

  let index = 1;
  for (const iterator of Object.keys(excelColumn)) {
    if (iterator !== toValidate[`col${index}`]) {
      return false;
    }
    index++;
  }
  return true;
};

class LoincCodeManagement {

  async addLoinc_code(req, res) {
    try {
      const { loincCodeArray, added_by } = req.body;
      const list = loincCodeArray.map((singleData) => ({
        ...singleData,
        added_by,
      }));
      const namesToFind = list.map((item) => item.loincCode);
      const foundItems = await LoincCode.find({
        loincCode: { $in: namesToFind },
        delete_status: false,
      });
      const CheckData = foundItems.map((item) => item.loincCode);
      if (foundItems.length === 0) {
        const savedCode = await LoincCode.insertMany(list);
        return sendResponse(req, res, 200, {
          status: true,
          body: savedCode,
          message: "Successfully Added Loinc Code",
          errorCode: null,
        });
      } else {
        return sendResponse(req, res, 200, {
          status: false,
          message: `${CheckData} already exist`,
          errorCode: null,
        });
      }
    } catch (error) {
      console.error("An error occurred:", error);
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to add LoincCode",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async allLoincCodeList(req, res) {
    try {
      const { limit, page, searchText, fromDate, toDate, sort } = req.query;
      let sortingarray = {};
  
      // Sorting logic
      if (sort && sort !== "undefined" && sort !== "") {
        let [keynew, value] = sort.split(":");
        sortingarray[keynew] = value;
      } else {
        sortingarray["createdAt"] = -1; // Default sort by createdAt
      }
  
      // Base filter
      let filter = { delete_status: false };
  
      // Search by LOINC code only
      if (searchText) {
        filter.$or = [
          { loincCode: { $regex: searchText, $options: "i" } },
          { description: { $regex: searchText, $options: "i" } }
        ];
      }
  
      // Date range filter
      if (fromDate && toDate) {
        const fromDateObj = new Date(`${fromDate} 00:00:00`);
        const toDateObj = new Date(`${toDate} 23:59:59`);
        filter.createdAt = { $gte: fromDateObj, $lte: toDateObj };
      }
  
      // Fetch data with pagination and sorting
      const codeList = await LoincCode.find(filter)
        .sort(sortingarray)
        .skip((page - 1) * limit)
        .limit(limit * 1)
        .exec();
  
      // Count total documents for pagination
      const count = await LoincCode.countDocuments(filter);
  
      // Send response
      sendResponse(req, res, 200, {
        status: true,
        body: {
          totalPages: limit != 0 ? Math.ceil(count / limit) : 1,
          currentPage: page,
          totalCount: count,
          data: codeList,
        },
        message: "Successfully fetched code list",
        errorCode: null,
      });
    } catch (error) {
      console.error("Error fetching LOINC code list:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "Failed to get list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async updateLoincCode(req, res) {
    try {
      const { loincCodeId, loincCode, description, active_status } =
        req.body;
      const list = await LoincCode.find({
        loincCode: loincCode,
        delete_status: false,
        _id: { $ne: mongoose.Types.ObjectId(loincCodeId) },
      });
      if (list.length === 0) {
        const updatedCode = await LoincCode.updateOne(
          { _id: loincCodeId },
          {
            $set: {
              loincCode,
              description,
              active_status,
            },
          },
          { new: true }
        ).exec();
        return sendResponse(req, res, 200, {
          status: true,
          body: updatedCode,
          message: "Loinc code updated successfully.",
          errorCode: null,
        });
      } else {
        return sendResponse(req, res, 200, {
          status: false,
          message: "Loinc Code Already Exist",
          errorCode: null,
        });
      }
    } catch (err) {
      return sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to update`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async actionOnLoincCode(req, res) {
    try {
      const { loincCodeId, action_name, action_value } = req.body;
      let message = "";

      const filter = {};
      if (action_name == "active") filter["active_status"] = action_value;
      if (action_name == "delete") filter["delete_status"] = action_value;
      let result;
      if (action_name == "active") {
        result = await LoincCode.updateOne({ _id: loincCodeId }, filter, {
          new: true,
        }).exec();

        message =
          action_value == true
            ? "Loinc code activated successfully"
            : "Loinc code deactivated successfully";
      }

      if (action_name == "delete") {
        if (loincCodeId == "") {
          await LoincCode.updateMany(
            { delete_status: { $eq: false } },
            {
              $set: { delete_status: true },
            },
            { new: true }
          );
        } else {
          await LoincCode.updateMany(
            { _id: { $in: loincCodeId } },
            {
              $set: { delete_status: true },
            },
            { new: true }
          );
        }
        message = "Loinc code deleted successfully";
      }

      return sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: message,
        errorCode: null,
      });
    } catch (err) {
      return sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to update status`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async allLoincCodeListforexport(req, res) {
    const { searchText, limit, page } = req.query;
    let filter;
    if (searchText == "") {
      filter = {
        delete_status: false,
      };
    } else {
      filter = {
        delete_status: false,
        $or: [
          { loincCode: { $regex: searchText || "", $options: "i" } }
        ],
      };
    }
    try {
      let result = "";
      if (limit > 0) {
        result = await LoincCode.find(filter)
          .sort([["createdAt", -1]])
          .skip((page - 1) * limit)
          .limit(limit * 1)
          .exec();
      } else {
        result = await LoincCode.aggregate([
          {
            $match: filter,
          },
          { $sort: { createdAt: -1 } },
          {
            $project: {
              _id: 0,
              loincCode: "$loincCode",
              description: "$description",
            },
          },
        ]);
      }
      let array = result.map((obj) => Object.values(obj));
      return sendResponse(req, res, 200, {
        status: true,
        data: {
          result,
          array,
        },
        message: `Loinc-Code added successfully`,
        errorCode: null,
      });
    } catch (err) {
      return sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to add Loinc-Code`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async uploadExcelforLoincCode(req, res) {
    try {
      const filePath = "./uploads/" + req.filename;
      const data = await processExcel(filePath);
      const isValidFile = validateColumnWithExcel(LoincCodeColumns, data[0]);
      fs.unlinkSync(filePath);
      if (!isValidFile) {
        return sendResponse(req, res, 500, {
          status: false,
          body: isValidFile,
          message: "Invalid excel sheet! column not matched.",
          errorCode: null,
        });
      }
 
      const existingCode = await LoincCode.distinct("loincCode", {
        delete_status: false,
      });
      const inputArray = [];
      const duplicateCodes = [];
 
      for (const singleData of data) {
        const trimmedLoincCode = singleData.loinccode.trim();
        if (existingCode.includes(trimmedLoincCode)) {
          duplicateCodes.push(trimmedLoincCode);
        } else {
          inputArray.push({
            loincCode: singleData.loinccode,
            description: singleData.description,
            added_by: req.body.added_by,
          });
        }
      }
      if (duplicateCodes.length > 0) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: `Loinc Code already exist: ${duplicateCodes.join(", ")}`,
          errorCode: null,
        });
      }
      if (inputArray.length > 0) {
        const result = await LoincCode.insertMany(inputArray);
        return sendResponse(req, res, 200, {
          status: true,
          body: result,
          message: "All Codes records added successfully",
          errorCode: null,
        });
      } else {
        return sendResponse(req, res, 200, {
          status: true,
          body: null,
          message: "No new Code added",
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


async getLonicCodeByID(req, res) {
  const { code, description } = req.body;

  try {
      let findCodeData = await LoincCode.findOne({ loincCode: code, delete_status: false }).lean();

      if (findCodeData) {
          return sendResponse(req, res, 200, {
              status: true,
              body: [findCodeData],
              message: "Loinc code fetched successfully",
              errorCode: null,
          });
      }

      // Insert new LOINC code if not found
      const savedCode = await LoincCode.create({
          loincCode: code,
          description: description,
          active_status: true,
          delete_status: false,
          added_by: req.user ? req.user._id : null,
      });

      return sendResponse(req, res, 200, {
          status: true,
          body: [savedCode],
          message: "Loinc code not found, so a new code has been added",
          errorCode: null,
      });

  } catch (error) {
      console.error("Error fetching Loinc code:", error);
      return sendResponse(req, res, 500, {
          status: false,
          body: error,
          message: "Internal server error",
          errorCode: "SERVER_ERROR",
      });
  }
}


}

module.exports = new LoincCodeManagement();