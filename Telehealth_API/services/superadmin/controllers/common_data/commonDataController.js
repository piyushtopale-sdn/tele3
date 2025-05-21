import { sendResponse } from "../../helpers/transmission";
import mongoose from "mongoose";
import {DesignationColumns, LanguageColumns, messages } from "../../config/constants";
import { processExcel } from "../../middleware/utils";
import Designation from "../../models/designation";
import Language from "../../models/language";
import StudyType from "../../models/studytype";
import BussinessSolution from "../../models/common_data/bussinessSolution";
import Nationality from "../../models/common_data/nationality";
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

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class CommonDataController {

  // Designation by Super-admin
  async addDesignation_SuperAdmin(req, res) {
    try {
      const { designationArray, added_by } = req.body
      const list = designationArray.map((singleData) => ({
        ...singleData,
        added_by
      }));
      const namesToFind = list.map((item) => item.designation);
      const foundItems = await Designation.find({
        designation: { $in: namesToFind },
      });
      const CheckData = foundItems.map((item) => item.designation);
      if (foundItems.length === 0) {
        const savedDesignation = await Designation.insertMany(list)
        sendResponse(req, res, 200, {
          status: true,
          body: savedDesignation,
          message: "Successfully add designation",
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 200, {
          status: false,

          message: `${CheckData} Already Exist`,
          errorCode: null,
        });
      }

    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to add designation",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async allDesignationList(req, res) {
    try {
      const { limit, page, searchText, fromDate, toDate } = req.query
      let sort = req.query.sort
      let sortingarray = {};
      if (sort != 'undefined' && sort != '' && sort != undefined) {
        let keynew = sort.split(":")[0];
        let value = sort.split(":")[1];
        sortingarray[keynew] = value;
      } else {
        sortingarray["createdAt"] = -1;

      }
      let filter = { delete_status: false }
      if (searchText != "") {
        filter = {
          delete_status: false,
          designation: { $regex: searchText || '', $options: "i" }
        }
      }
      if (fromDate && toDate) {
        const fromDateObj = new Date(`${fromDate} 00:00:00`);
        const toDateObj = new Date(`${toDate} 23:59:59`);
        filter.createdAt = { $gte: fromDateObj, $lte: toDateObj }
      }
      const designationList = await Designation.find(filter)
        .sort(sortingarray)
        .skip((page - 1) * limit)
        .limit(limit * 1)
        .exec();
      const count = await Designation.countDocuments(filter);
      sendResponse(req, res, 200, {
        status: true,
        body: {
          totalCount: count,
          data: designationList,
        },
        message: "Successfully get Designation list",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get designation list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async updateDesignation(req, res) {
    try {
      const {
        designationId,
        designation,
        designation_arabic,
        active_status,
        delete_status
      } = req.body
      const list = await Designation.find({ designation: designation, active_status: active_status, _id: { $ne: mongoose.Types.ObjectId(designationId) } });
      if (list.length === 0) {
        const updateDesignation = await Designation.updateOne(
          { _id: designationId },
          {
            $set: {
              designation,
              designation_arabic,
              active_status,
              delete_status
            }
          },
          { new: true }
        ).exec();
        sendResponse(req, res, 200, {
          status: true,
          body: updateDesignation,
          message: "Successfully updated Designation",
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 200, {
          status: false,

          message: "Designation Already Exist",
          errorCode: null,
        });
      }

    } catch (err) {

      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to update Designation`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async actionOnDesignation(req, res) {
    try {
      const { designationId, action_name, action_value } = req.body
      let message = ''

      const filter = {}
      if (action_name == "active") filter['active_status'] = action_value
      if (action_name == "delete") filter['delete_status'] = action_value

      if (action_name == "active") {
        await Designation.updateOne(
          { _id: designationId },
          filter,
          { new: true }
        ).exec();

        message = action_value == true ? 'Successfully Active Designation' : 'Successfully In-active Designation'
      }

      if (action_name == "delete") {
        if (designationId == '') {
          await Designation.updateMany(
            { delete_status: { $eq: false } },
            {
              $set: { delete_status: true }
            },
            { new: true }
          )
        }
        else {
          await Designation.updateMany(
            { _id: { $in: designationId } },
            {
              $set: { delete_status: true }
            },
            { new: true }
          )
        }
        message = 'Successfully Designation deleted'
      }

      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: message,
        errorCode: null,
      });
    } catch (err) {

      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to action done`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async allDesignatonListforexport(req, res) {
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
        result = await Designation.find(filter)
          .sort([["createdAt", -1]])
          .skip((page - 1) * limit)
          .limit(limit * 1)
          .exec();
      }
      else {
        result = await Designation.aggregate([{
          $match: filter
        },
        { $sort: { "createdAt": -1 } },
        {
          $project: {
            _id: 0,
            designation: "$designation"
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
        message: `Designation added successfully`,
        errorCode: null,
      });
    } catch (err) {

      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to add Designation`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async uploadCSVForDesignation(req, res) {
    try {
      const filePath = './uploads/' + req.filename;
      const data = await processExcel(filePath);

      const isValidFile = validateColumnWithExcel(DesignationColumns, data[0]);
      fs.unlinkSync(filePath);

      if (!isValidFile) {
        sendResponse(req, res, 500, {
          status: false,
          body: isValidFile,
          message: "Invalid excel sheet! column not matched.",
          errorCode: null,
        });
        return;
      }

      const existingDesignations = await Designation.find({}, 'designation');
      const existingDesignationNames = existingDesignations.map(designation => designation.designation);

      const inputArray = [];
      const duplicateDesignations = [];

      for (const singleData of data) {
        const trimmedDesignation = singleData.designation.trim();
        if (existingDesignationNames.includes(trimmedDesignation)) {
          duplicateDesignations.push(trimmedDesignation);
        } else {
          inputArray.push({
            designation: trimmedDesignation,
            added_by: req.body.added_by,
          });
        }
      }

      if (duplicateDesignations.length > 0) {
        return sendResponse(req, res, 400, {
          status: false,
          body: null,
          message: `Designations already exist: ${duplicateDesignations.join(', ')}`,
          errorCode: null,
        });
      }

      if (inputArray.length > 0) {
        const result = await Designation.insertMany(inputArray);
        return sendResponse(req, res, 200, {
          status: true,
          body: result,
          message: "All designation records added successfully",
          errorCode: null,
        });
      } else {
        return sendResponse(req, res, 200, {
          status: true,
          body: null,
          message: "No new designations added",
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


  async designationById(req, res) {
    const { _id } = req.query;

    try {
      const list = await Designation.find({ _id: _id });
      sendResponse(req, res, 200, {
        status: true,
        body: { list },
        message: `All Designation list`,
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get Language list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // Type of language by superadmin
  async addLanguage_SuperAdmin(req, res) {
    try {
      const { languageArray, added_by } = req.body
      const list = languageArray.map((singleData) => ({
        ...singleData,
        added_by
      }));
      const namesToFind = list.map((item) => item.language);
      const foundItems = await Language.find({
        language: { $in: namesToFind },
      });
      const CheckData = foundItems.map((item) => item.language);
      if (foundItems.length === 0) {
        const savedLanguage = await Language.insertMany(list)
        sendResponse(req, res, 200, {
          status: true,
          body: savedLanguage,
          message: "Language Added Successfully",
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 200, {
          status: false,

          message: `${CheckData} is already exist`,
          errorCode: null,
        });
      }

    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to add Language",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async allLanguageList(req, res) {
    try {
      const { limit, page, searchText } = req.query
      let sort = req.query.sort
      let sortingarray = {};
      if (sort != 'undefined' && sort != '' && sort != undefined) {
        let keynew = sort.split(":")[0];
        let value = sort.split(":")[1];
        sortingarray[keynew] = value;
      } else {
        sortingarray["createdAt"] = -1;

      }
      let filter = { delete_status: false }
      if (searchText != "") {
        filter = {
          delete_status: false,
          language: { $regex: searchText || '', $options: "i" }
        }
      }
      const languageList = await Language.find(filter)
        .sort(sortingarray)
        .skip((page - 1) * limit)
        .limit(limit * 1)
        .exec();
      const count = await Language.countDocuments(filter);
      sendResponse(req, res, 200, {
        status: true,
        body: {
          totalCount: count,
          data: languageList,
        },
        message: "Successfully get Language list",
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get HealthCentre list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async updateLanguage(req, res) {
    try {
      const {
        languageId,
        language,
        language_arabic,
        active_status,
        delete_status
      } = req.body
      const list = await Language.find({ language: language, active_status: active_status, _id: { $ne: mongoose.Types.ObjectId(languageId) }, is_deleted: false });
      if (list.length === 0) {
        const updateLanguage = await Language.updateOne(
          { _id: languageId },
          {
            $set: {
              language,
              language_arabic,
              active_status,
              delete_status
            }
          },
          { new: true }
        ).exec();
        sendResponse(req, res, 200, {
          status: true,
          body: updateLanguage,
          message: "Language Updated Successfully",
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 200, {
          status: false,

          message: "Language already exist",
          errorCode: null,
        });
      }

    } catch (err) {

      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to update Language`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async actionOnLanguage(req, res) {
    try {
      const { languageId, action_name, action_value } = req.body
      let message = ''

      const filter = {}
      if (action_name == "active") filter['active_status'] = action_value
      if (action_name == "delete") filter['delete_status'] = action_value

      if (action_name == "active") {
        await Language.updateOne(
          { _id: languageId },
          filter,
          { new: true }
        ).exec();

        message = action_value == true ? 'Successfully Active Language' : 'Successfully In-active Language'
      }

      if (action_name == "delete") {
        if (languageId == '') {
          await Language.updateMany(
            { delete_status: { $eq: false } },
            {
              $set: { delete_status: true }
            },
            { new: true }
          )
        }
        else {
          await Language.updateMany(
            { _id: { $in: languageId } },
            {
              $set: { delete_status: true }
            },
            { new: true }
          )
        }
        message = 'Successfully Language deleted'
      }

      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: message,
        errorCode: null,
      });
    } catch (err) {

      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to Language done`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async allLanguageListforexport(req, res) {
    const { searchText, limit, page } = req.query
    let filter
    if (searchText == "") {
      filter = {
        delete_status: false
      }
    } else {
      filter = {
        delete_status: false,
        language: { $regex: searchText || '', $options: "i" },
      }
    }
    try {
      let result = '';
      if (limit > 0) {
        result = await Language.find(filter)
          .sort([["createdAt", -1]])
          .skip((page - 1) * limit)
          .limit(limit * 1)
          .exec();
      }
      else {
        result = await Language.aggregate([{
          $match: filter
        },
        { $sort: { "createdAt": -1 } },
        {
          $project: {
            _id: 0,
            language: "$language"
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
        message: `Language added successfully`,
        errorCode: null,
      });
    } catch (err) {

      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to add Language`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async uploadCSVForLanguage(req, res) {
    try {
      const filePath = './uploads/' + req.filename;
      const data = await processExcel(filePath);

      const isValidFile = validateColumnWithExcel(LanguageColumns, data[0]);
      fs.unlinkSync(filePath);

      if (!isValidFile) {
        sendResponse(req, res, 500, {
          status: false,
          body: isValidFile,
          message: "Invalid excel sheet! column not matched.",
          errorCode: null,
        });
        return;
      }

      const existingLanguages = await Language.find({}, 'language');
      const existingLanguageNames = existingLanguages.map(lang => lang.language);

      const inputArray = [];
      const duplicateLanguages = [];

      for (const singleData of data) {
        const trimmedLanguage = singleData.language.trim();
        if (existingLanguageNames.includes(trimmedLanguage)) {
          duplicateLanguages.push(trimmedLanguage);
        } else {
          inputArray.push({
            language: trimmedLanguage,
            added_by: req.body.added_by,
          });
        }
      }

      if (duplicateLanguages.length > 0) {
        return sendResponse(req, res, 400, {
          status: false,
          body: null,
          message: `Languages already exist: ${duplicateLanguages.join(', ')}`,
          errorCode: null,
        });
      }

      if (inputArray.length > 0) {
        const result = await Language.insertMany(inputArray);
        return sendResponse(req, res, 200, {
          status: true,
          body: result,
          message: "All language records added successfully",
          errorCode: null,
        });
      } else {
        return sendResponse(req, res, 200, {
          status: true,
          body: null,
          message: "No new languages added",
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


  async commmonDesignationList(req, res) {
    try {
      const list = await Designation.find({ delete_status: false, active_status: true });
      sendResponse(req, res, 200, {
        status: true,
        body: { list },
        message: `All Designation list`,
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get Designation list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async commmonLanguageList(req, res) {
    try {
      const list = await Language.find({ delete_status: false, active_status: true });
      sendResponse(req, res, 200, {
        status: true,
        body: { list },
        message: `All Language list`,
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to get Language list",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
 
  /** Oct 08 */
  async addStudyType(req, res) {
    try {
      const { studyTypes } = req.body
      let existingStudyType = []
      for (const data of studyTypes) {
        const studyTypeName = data.studyTypeName.trim();

        const getStudyType = await StudyType.findOne({
          studyTypeName: { $regex: `^${studyTypeName}$`, $options: 'i' },
          isDeleted: false,
        });

        if (getStudyType) {
          existingStudyType.push(studyTypeName);
        } else {
          const addStudyType = new StudyType(data);
          await addStudyType.save();
        }
      }
      let message;
      let status;
      if (studyTypes.length == existingStudyType.length) {
        message = `This study type already exists.`
        status = false
      } else if (existingStudyType.length > 0 && studyTypes.length != existingStudyType.length) {
        status = false
        message = `This study type already exists. Remaining are added successfully`
      } else {
        status = true
        message = `Study Type added successfully.`
      }

      sendResponse(req, res, 200, {
        status: status,
        message,
        body: null,
        errorCode: null,
      })
    }
    catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 200, {
        status: false,
        body: {},
        message: `Something went wrong`,
        errorCode: null,
      });
    }
  }

  async getStudyType(req, res) {
    try {
      const { page, limit, searchText, status, sort, fromDate, toDate } = req.query

      let search_filter = [{}]
      if (searchText) {
        search_filter = [
          { studyTypeName: { $regex: searchText || '', $options: "i" } }
        ]
      }

      let match = {
        isDeleted: false,
        $or: search_filter
      }
      if (status && status != 'all') {
        match.status = status == 'active' ? true : false
      }

      let fieldName = 'createdAt'
      let sortOrder = '-1'
      if (sort) {
        fieldName = sort.split(':')[0]
        sortOrder = sort.split(':')[1]
      }
      if (fromDate && toDate) {
        const fromDateObj = new Date(`${fromDate} 00:00:00`);
        const toDateObj = new Date(`${toDate} 23:59:59`);
        match['$and'] = [{
          createdAt: { $gte: fromDateObj, $lte: toDateObj }
        }]
      }

      const pipeline = [
        {
          $match: match
        },
        {
          $group: {
            _id: "$_id",
            studyTypeName: { $first: "$studyTypeName" },
            studyTypeNameArabic: { $first: "$studyTypeNameArabic" },
            description: { $first: "$description" },
            status: { $first: "$status" },
            createdAt: { $first: "$createdAt" }
          }
        },
        {
          $sort: {
            [fieldName]: parseInt(sortOrder)
          }
        },
        {
          $facet: {
            totalCount: [
              {
                $count: 'count'
              }
            ]
          }
        }
      ]
      if (limit != 0) {
        pipeline[pipeline.length - 1]['$facet']['paginatedResults'] = [
          { $skip: searchText ? 0 : (page - 1) * limit },
          { $limit: limit * 1 }
        ]
      } else {
        pipeline[pipeline.length - 1]['$facet']['paginatedResults'] = [
          { $skip: 0 },
          // { $limit: 1000 },
        ]
      }

      const result = await StudyType.aggregate(pipeline)
      let totalCount = 0
      if (result[0].totalCount.length > 0) {
        totalCount = result[0].totalCount[0].count
      }


      sendResponse(req, res, 200, {
        status: true,
        message: "Study Type fetched successfully",
        body: {
          totalPages: limit != 0 ? Math.ceil(totalCount / limit) : 1,
          currentPage: page,
          totalRecords: totalCount,
          result: result[0].paginatedResults
        },
        errorCode: null,
      })
    }
    catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 200, {
        status: false,
        body: {},
        message: `Something went wrong`,
        errorCode: null,
      });
    }
  }

  async updateStudyType(req, res) {
    try {
      const { studyTypeId, studyTypeName, studyTypeNameArabic, description, status } = req.body

      const getStudyType = await StudyType.find({
        studyTypeName: { $regex: `^${studyTypeName}$`, $options: 'i' },
        isDeleted: false,
        _id: { $ne: studyTypeId },
      });
      if (getStudyType.length > 0) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "Study Type already exist",
          errorCode: null,
        })
      }


      await StudyType.findOneAndUpdate(
        {
          _id: studyTypeId,
        },
        {
          $set: {
            studyTypeName,
            studyTypeNameArabic,
            description,
            status
          }
        }
      )
      sendResponse(req, res, 200, {
        status: true,
        body: null,
        message: `Study Type updated successfully`,
        errorCode: null,
      })
    }
    catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 200, {
        status: false,
        body: {},
        message: `Something went wrong`,
        errorCode: null,
      });
    }
  }

  async updateStudyTypeByAction(req, res) {
    try {
      const { studyTypeId, actionName, actionValue, studyTypeIds } = req.body

      if (actionName == 'isDeleted' && studyTypeIds.length > 0) {
        await StudyType.updateMany(
          {
            _id: { $in: studyTypeIds },
          },
          {
            $set: {
              [actionName]: actionValue
            }
          }
        )
      } else {
        await StudyType.findOneAndUpdate(
          {
            _id: studyTypeId,
          },
          {
            $set: {
              [actionName]: actionValue
            }
          }
        )
      }
      sendResponse(req, res, 200, {
        status: true,
        body: null,
        message: `Study Type ${actionName == 'isDeleted' ? 'deleted' : 'updated'} successfully`,
        errorCode: null,
      })
    }
    catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 200, {
        status: false,
        body: {},
        message: `Something went wrong`,
        errorCode: null,
      });
    }
  }

  async getStudyTypeById(req, res) {
    try {
      const { id } = req.params;

      let getStudyType = await StudyType.findOne({
        _id: mongoose.Types.ObjectId(id),
      });

      sendResponse(req, res, 200, {
        status: true,
        message: "Study Type fetched successfully",
        body: getStudyType,
        errorCode: null,
      })
    }
    catch (error) {
      console.error("An error occurred:", error);
      sendResponse(req, res, 200, {
        status: false,
        body: {},
        message: `Something went wrong`,
        errorCode: null,
      });
    }
  }

  async allStudyTypeforexport(req, res) {
    const { searchText, limit, page } = req.query
    let filter
    if (searchText == "") {
      filter = {
        isDeleted: false
      }
    } else {
      filter = {
        isDeleted: false,
        team: { $regex: searchText || '', $options: "i" },
      }
    }
    try {
      let result = '';
      if (limit > 0) {
        result = await StudyType.find(filter)
          .sort([["createdAt", -1]])
          .skip((page - 1) * limit)
          .limit(limit * 1)
          .exec();
      }
      else {
        result = await StudyType.aggregate([{
          $match: filter
        },
        { $sort: { "createdAt": -1 } },
        {
          $project: {
            _id: 0,
            studyTypeName: "$studyTypeName",
            description: "$description"
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

  //Fetching Nationality
  async getAllUsersNationality(req, res) {
    try {
      const Countries = await Nationality.find();
      sendResponse(req, res, 200, {
        status: true,
        body: { Countries },
        message: 'Nationalities fetched successfully',
        errorCode: null,
      });
    } catch (error) {
      console.error(error);
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: 'Failed to fetch nationalities',
        errorCode: 'INTERNAL_SERVER_ERROR',
      });
    }
  }

  async AddBusssinesSolutiondetails(req, res) {
    const { fullName, email, phone, country_code, subject, message } = req.body;

    try {
      const data = new BussinessSolution({
        fullName,
        email,
        phone,
        country_code,
        subject,
        message
      });

      const result = await data.save();
      return sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: messages.enquirySent.en,
        messageArabic: messages.enquirySent.ar,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: error.message ? error.message : "failed to process request",
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async findOrCreateStudyType(req, res) {
    try {
      const { studyTypeName } = req.body;

      if (!studyTypeName) {
        return sendResponse(req, res, 400, {
          status: false,
          message: "studyTypeName is required",
          body: {},
          errorCode: null,
        });
      }

      // Normalize the input for consistency (e.g., lowercase)
      const normalizedStudyTypeName = studyTypeName.trim().toLowerCase();

      // Check if studyTypeName already exists (case-insensitive)
      const existingStudyType = await StudyType.findOne({
        studyTypeName: { $regex: `^${normalizedStudyTypeName}$`, $options: "i" },
        isDeleted: false,
      });

      if (existingStudyType) {
        return sendResponse(req, res, 200, {
          status: true,
          message: "Study Type found",
          body: existingStudyType,
          errorCode: null,
        });
      }

      // Save only normalized lowercase version
      const newStudyType = new StudyType({
        studyTypeName: normalizedStudyTypeName,
        studyTypeNameArabic: "-",
        description: "-"
      });

      await newStudyType.save();

      return sendResponse(req, res, 201, {
        status: true,
        message: "New Study Type created",
        body: newStudyType,
        errorCode: null,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      return sendResponse(req, res, 500, {
        status: false,
        message: "Something went wrong",
        body: {},
        errorCode: null,
      });
    }
  }


}

module.exports = new CommonDataController();
