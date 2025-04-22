import { sendResponse } from "../../helpers/transmission";
import Assessment from "../../models/superadmin/assessment.model";

class AssessmentController {
  async addAssessment(req, res) {
    try {
      const { questionFor, question, questionArabic, type, options, subQuestions, genderSpecific } = req.body;
      if (questionFor == 'DOCTOR_SELECTION') {
        const getRecords = await Assessment.find({ questionFor, isActivated: true, isDeleted: false })
        if (getRecords.length > 0) {
          return sendResponse(req, res, 200, {
            status: false,
            message: `You already have one active doctor selection question. Please inactive that question before adding a new one`,
            data: null,
            errorCode: "INTERNAL_SERVER_ERROR",
          });
        }
      }
      let gender;
      if (questionFor == 'ASSESSMENT' && genderSpecific) {
        gender = genderSpecific
      } else if (questionFor == 'ASSESSMENT' && !genderSpecific) {
        gender = null
      }
      const addObject = {
        question,
        questionArabic,
        questionFor,
        type,
        options,
        subQuestions,
        genderSpecific: gender,
      }

      const assessmentData = new Assessment(addObject)
      const assessmentResult = await assessmentData.save()
    
      return sendResponse(req, res, 200, {
        status: true,
        message: `Assessment question added successfully`,
        body: assessmentResult,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to add assessment questions", 
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async updateAssessment(req, res) {
    try {
      const { assessmentId, question, questionArabic, type, options, subQuestions, genderSpecific} = req.body;

      const updateObject = {
        question,
        questionArabic,
        type,
        options,
        subQuestions,
        genderSpecific
      }

      await Assessment.findOneAndUpdate(
        { _id: assessmentId},
        {
            $set: updateObject
        },
      )
    
      return sendResponse(req, res, 200, {
        status: true,
        message: `Assessment question updated successfully`,
        body: null,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "failed to update assessment questions", 
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async listAssessment(req, res) {
    try {
      const { limit, page, questionFor, status, gender, searchText } = req.query;
      let sortingarray = { orderNo: 1 };
      let filter = { isDeleted: false, genderSpecific: { $in: [null] } };
      if (questionFor) {
        filter.questionFor = questionFor
      }
      if (gender) {
        filter.genderSpecific = { $in: [null, gender] }
      }
      if (status) {
        filter.isActivated = status == 'active' ? true : false;
      }
      if (searchText) {
        filter.question = { $regex: searchText || '', $options: 'i'}
      }
      const codeList = await Assessment.find(filter)
        .sort(sortingarray)
        .skip((page - 1) * limit)
        .limit(limit * 1)
        .exec();

      const count = await Assessment.countDocuments(filter);
      return sendResponse(req, res, 200, {
        status: true,
        message: "Successfully fetched list",
        body: {
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          totalRecords: count,
          result: codeList
        },
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
  async listAssessmentForSuperadmin(req, res) {
    try {
      const { limit, page, questionFor, gender, searchText } = req.query;
      let sortingarray = { orderNo: 1 };
      let filter = { isDeleted: false, genderSpecific: { $in: [null] } };
      if (questionFor) {
        filter.questionFor = questionFor
      }
      if (gender) {
        filter.genderSpecific = { $in: [gender] }
      } else {
        filter.genderSpecific = { $in: [null, 'male', 'female', 'other'] }
      }

      if (searchText) {
        filter.question = { $regex: searchText || '', $options: 'i'}
      }
      const codeList = await Assessment.find(filter)
        .sort(sortingarray)
        .skip(searchText ? 0 : (page - 1) * limit)
        .limit(limit * 1)
        .exec();

      const count = await Assessment.countDocuments(filter);
      return sendResponse(req, res, 200, {
        status: true,
        message: "Successfully fetched list",
        body: {
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          totalRecords: count,
          result: codeList
        },
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

  async manageAssessmentStatus(req, res) {
    try {
      const { assessmentId, action_name, action_value, questionForType } = req.body;

      if (questionForType && questionForType == 'DOCTOR_SELECTION' && action_name == 'isActivated') {
        const getRecords = await Assessment.find({ questionFor: questionForType, isActivated: true, isDeleted: false, _id: { $ne: assessmentId } })
        if (getRecords.length > 0) {
          return sendResponse(req, res, 200, {
            status: false,
            message: `You already have one active doctor selection question. Please inactive that question before activating new one`,
            data: null,
            errorCode: "INTERNAL_SERVER_ERROR",
          });
        }
      }

      await Assessment.findOneAndUpdate(
        { _id: assessmentId},
        {
            $set: {
                [action_name]: action_value
            }
        },
      )

      return sendResponse(req, res, 200, {
        status: true,
        body: null,
        message: action_name == 'isDeleted' ? "Assessment deleted successfully" : "Assessment status updated successfully",
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
  
  async setAssessmentOrder(req, res) {
    try {
      const { assessmentId, orderNo } = req.body;

      await Assessment.findOneAndUpdate(
        { _id: assessmentId},
        {
            $set: {
              orderNo
            }
        },
      )

      return sendResponse(req, res, 200, {
        status: true,
        body: null,
        message: "Assessment order updated successfully",
        errorCode: null,
      });
    } catch (err) {
      return sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to update order`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getAssessmentByID(req, res) {
    try {
      const assessmentId = req.params.id;

      const getAssessment = await Assessment.findById(assessmentId);

      return sendResponse(req, res, 200, {
        status: true,
        body: getAssessment,
        message: "Assessment fetched successfully",
        errorCode: null,
      });
    } catch (err) {
      return sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to update order`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  
}

module.exports = new AssessmentController();
