import { sendResponse } from "../../helpers/transmission";
import mongoose from "mongoose";
import ICDcode from "../../models/superadmin/icdcode";
import { processExcel } from "../../middleware/utils";
import { ICDCodeColumns } from "../../config/constants";

const fs = require("fs");

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

class ICDCodeManagement {
  async addICD_code(req, res) {
    try {
      const { icdCodeArray, added_by } = req.body;
      const list = icdCodeArray.map((singleData) => ({
        ...singleData,
        added_by,
      }));
      const namesToFind = list.map((item) => item.code);
      const foundItems = await ICDcode.find({
        code: { $in: namesToFind },
        delete_status: false,
      });
      const CheckData = foundItems.map((item) => item.code);
      if (foundItems.length == 0) {
        const savedCode = await ICDcode.insertMany(list);
        return sendResponse(req, res, 200, {
          status: true,
          body: savedCode,
          message: "Successfully ICD Code Added",
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
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to add ICDcode",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async allCodeList(req, res) {
    try {
      const { limit, page, searchText, fromDate, toDate } = req.query;
      let sort = req.query.sort;
      let sortingarray = {};
      if (sort != "undefined" && sort != "" && sort != undefined) {
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
          $or: [
            { code: { $regex: searchText || "", $options: "i" } },
            { disease_title: { $regex: searchText || "", $options: "i" } },
          ],
        };
      }
      if(fromDate && toDate) {
        const fromDateObj = new Date(`${fromDate} 00:00:00`);
        const toDateObj = new Date(`${toDate} 23:59:59`);
        filter.createdAt = { $gte: fromDateObj, $lte: toDateObj }
      }
      const codeList = await ICDcode.find(filter)
        .sort(sortingarray)
        .skip((page - 1) * limit)
        .limit(limit * 1)
        .exec();
      const count = await ICDcode.countDocuments(filter);
      return sendResponse(req, res, 200, {
        status: true,
        body: {
          totalPages: limit != 0 ? Math.ceil(count / limit) : 1,
          currentPage: page,
          totalCount: count,
          data: codeList,
        },
        message: "Successfully code list fetched",
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async updateICDCOde(req, res) {
    try {
      const { codeId, code, disease_title, description, active_status } =
        req.body;
      const list = await ICDcode.find({
        code: code,
        delete_status: false,
        _id: { $ne: mongoose.Types.ObjectId(codeId) },
      });
      if (list.length == 0) {
        const updatedCode = await ICDcode.updateOne(
          { _id: codeId },
          {
            $set: {
              code,
              disease_title,
              description,
              active_status,
            },
          },
          { new: true }
        ).exec();
        return sendResponse(req, res, 200, {
          status: true,
          body: updatedCode,
          message: "Successfully updated ICD.",
          errorCode: null,
        });
      } else {
        return sendResponse(req, res, 200, {
          status: false,
          message: "ICD Code Already Exist",
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

  async actionOnICDCode(req, res) {
    try {
      const { codeId, action_name, action_value } = req.body;
      let message = "";

      const filter = {};
      if (action_name == "active") filter["active_status"] = action_value;
      if (action_name == "delete") filter["delete_status"] = action_value;

      if (action_name == "active") {
        await ICDcode.updateOne({ _id: codeId }, filter, {
          new: true,
        }).exec();

        message =
          action_value == true
            ? "Successfully Active ICD Code"
            : "Successfully In-active ICD Code";
      }

      if (action_name == "delete") {
        if (codeId == "") {
          await ICDcode.updateMany(
            { delete_status: { $eq: false } },
            {
              $set: { delete_status: true },
            },
            { new: true }
          );
        } else {
          await ICDcode.updateMany(
            { _id: { $in: codeId } },
            {
              $set: { delete_status: true },
            },
            { new: true }
          );
        }
        message = "Successfully ICD Code deleted";
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

  async allICDListforexport(req, res) {
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
          { code: { $regex: searchText || "", $options: "i" } },
          { disease_title: { $regex: searchText || "", $options: "i" } },
        ],
      };
    }
    try {
      let result = "";
      if (limit > 0) {
        result = await ICDcode.find(filter)
          .sort([["createdAt", -1]])
          .skip((page - 1) * limit)
          .limit(limit * 1)
          .exec();
      } else {
        result = await ICDcode.aggregate([
          {
            $match: filter,
          },
          { $sort: { createdAt: -1 } },
          {
            $project: {
              _id: 0,
              code: "$code",
              disease_title: "$disease_title",
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
        message: `ICD-Code added successfully`,
        errorCode: null,
      });
    } catch (err) {
      return sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to add ICD-Code`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async uploadExcelforICDCode(req, res) {
    try {
      const filePath = "./uploads/" + req.filename;
      const data = await processExcel(filePath);
      const isValidFile = validateColumnWithExcel(ICDCodeColumns, data[0]);
      fs.unlinkSync(filePath);
      if (!isValidFile) {
        return sendResponse(req, res, 500, {
          status: false,
          body: isValidFile,
          message: "Invalid excel sheet! column not matched.",
          errorCode: null,
        });
      }

      const existingCode = await ICDcode.distinct("code", {
        delete_status: false,
      });

      const inputArray = [];
      const duplicateCodes = [];

      for (const singleData of data) {
        const trimmedICD = singleData.code.trim();
        if (existingCode.includes(trimmedICD)) {
          duplicateCodes.push(trimmedICD);
        } else {
          inputArray.push({
            code: singleData.code,
            disease_title: singleData.disease_title,
            description: singleData.description,
            added_by: req.body.added_by,
          });
        }
      }
      if (duplicateCodes.length > 0) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: `ICDCode already exist: ${duplicateCodes.join(", ")}`,
          errorCode: null,
        });
      }
      if (inputArray.length > 0) {
        const result = await ICDcode.insertMany(inputArray);
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

  async allCodeListFilter(req, res) {
    try {
      const { limit, page, searchText, fromDate, toDate } = req.query;
      let sort = req.query.sort;
      let sortingarray = {};
      if (sort != "undefined" && sort != "" && sort != undefined) {
        let keynew = sort.split(":")[0];
        let value = sort.split(":")[1];
        sortingarray[keynew] = value;
      } else {
        sortingarray["createdAt"] = -1;
      }

      let filter = { delete_status: false };
       function escapeRegex(text) {
        return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      }
  
      if (searchText) {
        let safeSearchText = escapeRegex(searchText);
        filter.$or = [
          { code: { $regex: safeSearchText, $options: "i" } },
          { disease_title: { $regex: safeSearchText, $options: "i" } }
        ];
      }
      if(fromDate && toDate) {
        const fromDateObj = new Date(`${fromDate} 00:00:00`);
        const toDateObj = new Date(`${toDate} 23:59:59`);
        filter.createdAt = { $gte: fromDateObj, $lte: toDateObj }
      }
      const codeList = await ICDcode.find(filter)
        .sort(sortingarray)
        .limit(30) // Fetch only the first 5 records
        .exec();
      const count = await ICDcode.countDocuments(filter);
      return sendResponse(req, res, 200, {
        status: true,
        body: {
          totalPages: limit != 0 ? Math.ceil(count / limit) : 1,
          currentPage: page,
          totalCount: count,
          data: codeList,
        },
        message: "Successfully code list fetched",
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
}

module.exports = new ICDCodeManagement();
