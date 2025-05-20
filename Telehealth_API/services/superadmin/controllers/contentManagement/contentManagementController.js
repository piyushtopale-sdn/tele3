import { sendResponse } from "../../helpers/transmission";
import FAQ from "../../models/contentManagement/faq";
import PrivacyAndCondition from "../../models/contentManagement/privacyAndCondition";
import TermsAndCondition from "../../models/contentManagement/termsAndCondition";
import mongoose from "mongoose";
import Content from "../../models/contentManagement/content";
import { messages } from "../../config/constants";
import Http from "../../helpers/httpservice";
const httpService = new Http()
import { sendSms } from "../../middleware/sendSms";
import { sendEmail } from "../../helpers/ses";
import { sendPushNotification } from "../../helpers/firebase_notification";


const notificationSaved = (paramsData, headers, requestData) => {
  return new Promise((resolve, reject) => {
    try {
      let endPoint = '';
      let serviceUrl = '';

      if (paramsData?.sendTo === 'patient') {
        endPoint = 'patient/notification';
        serviceUrl = 'patientServiceUrl';
      }

      if (endPoint && serviceUrl) {
        httpService
          .postStaging(endPoint, requestData, headers, serviceUrl)
          .then(() => resolve(true))
          .catch((error) => {
            console.log('error in notificationSaved', error.message);
            resolve(false); // or reject(error) if you want to propagate it
          });
      } else {
        resolve(true); // or false, depending on your logic
      }
    } catch (error) {
      console.log('error in notificationSaved', error.message);
      resolve(false);
    }
  });
};

class ContentManagementController {
  // Create content
  async createContent(req, res) {
    try {
      const { title, type, slug, content } = req.body;
      const existingContent = await Content.findOne({ slug });
      if (existingContent) {
        return sendResponse(req, res, 400, {
          status: false,
          body: null,
          message: messages.slugExists
        })
      }
      const newContent = new Content({
        title,
        type,
        slug,
        content,
        contentArabic: content, //Arabic is same as content now. Taken key for future reference
      });
      await newContent.save();
      return sendResponse(req, res, 201, {
        status: true,
        body: { content: newContent },
        message: messages.contentcreated,
        errorCode: null,
      });

    } catch (error) {
      console.error(error);
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: messages.contentFailed,
      });
    }
  }

  // Get all content
  async getAllContent(req, res) {
    try {
      const { limit, page, searchText, type = "All" } = req.query;
      const pageNumber = parseInt(page);
      const pageSize = parseInt(limit);

      // Search filter
      let searchFilter = [{}];
      if (searchText) {
        searchFilter = [
          { title: { $regex: searchText, $options: "i" } },
          { description: { $regex: searchText, $options: "i" } }
        ];
      }

      // Type filter (Only apply if type is not 'All')
      let typeFilter = {};
      if (type !== "All") {
        typeFilter['type'] = type;
      }

      // Aggregation pipeline
      const pipeline = [
        {
          $match: {
            $or: searchFilter,
            ...typeFilter
          }
        },
        {
          $facet: {
            totalCount: [
              { $count: "count" }
            ],
            paginatedResults: [
              { $skip: (pageNumber - 1) * pageSize },
              { $limit: pageSize }
            ]
          }
        }
      ];

      const result = await Content.aggregate(pipeline);

      // Get total count
      let totalRecords = 0;
      if (result[0].totalCount.length > 0) {
        totalRecords = result[0].totalCount[0].count;
      }

      return sendResponse(req, res, 200, {
        status: true,
        body: {
          contents: result[0]?.paginatedResults || [],
         
            totalRecords,
            totalPages: Math.ceil(totalRecords / pageSize),
            currentPage: pageNumber,
            pageSize
          
        },
        message: messages.contentFetched,
        errorCode: null
      });

    } catch (error) {
      console.error("Error fetching content:", error);
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: messages.contentFetchedFailed
      });
    }
  }


  // Get content by ID
  async getById(req, res) {
    try {
      const content = await Content.findById(req.params.id);
      if (!content) {
        return sendResponse(req, res, 404, {
          status: true,
          body: null,
          message: messages.contentNotFound
        })
      }
      return sendResponse(req, res, 200, {
        status: true,
        body: { content },
        message: messages.contentFetched
      })
    } catch (error) {
      console.error("An error occurred:", error);
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: messages.contentFetchedFailed
      })
    }
  }

  // Update content by ID
  async updateContent(req, res) {
    try {
      const { title, type, slug, content } = req.body;

      const updatedContent = await Content.findByIdAndUpdate(
        req.params.id,
        { title, type, slug, content, contentArabic: content },
        { new: true }
      );

      if (!updatedContent) {
        return sendResponse(req, res, 404, {
          status: true,
          message: messages.contentNotFound
        })
      }
      return sendResponse(req, res, 200, {
        status: true,
        body: { updatedContent },
        message: messages.contentUpdated
      })
    } catch (error) {
      console.error("An error occurred:", error);
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: messages.contentupdatefailed
      })

    }
  }

  // Delete content by ID
  async deleteContent(req, res) {
    try {
      const content = await Content.findByIdAndDelete(req.params.id);
      if (!content) {
        return sendResponse(req, res, 404, {
          status: true,
          message: messages.contentNotFound
        })
      }
      return sendResponse(req, res, 200, {
        status: true,
        body: { content },
        message: messages.contentDeleted
      })
    } catch (error) {
      console.error("An error occurred:", error);
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: messages.contentDeletedFailed
      })
    }
  }

  async allFAQ(req, res) {
    const { language } = req.query;

    try {
      const result = await FAQ.find({ type: language });
      return sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: `All FAQ list`,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: error.message ? error.message : "failed to get FAQ list",
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async addFAQ(req, res) {
    const { faqs } = req.body;
    try {
      // Find the last order number and increment it
      const lastFAQ = await FAQ.findOne().sort({ order: -1 }).select("order");
      const newOrder = lastFAQ ? lastFAQ.order + 1 : 1;

      // Create new FAQ record
      const result = await FAQ.create({
        _id: mongoose.Types.ObjectId(),
        order: newOrder, // Assign the auto-incremented order
        faqs,

      });

      return sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: "FAQ added successfully",
        errorCode: null,
      });
    } catch (error) {
      console.error("Error adding FAQ:", error);
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: error.message || "Failed to add FAQ",
        errorCode: error.code || "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**Feb 6 AP */
  async updateFAQ(req, res) {

    try {
      const { faqId, questionId } = req.params;
      const updateFields = {};

      // Add only provided fields to the update object
      ["question", "answer", "language", "active", "is_deleted"].forEach(field => {
        if (req.body[field] !== undefined) {
          updateFields[`faqs.$.${field}`] = req.body[field];
        }
      });

      if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ message: "No valid fields provided for update" });
      }

      const updatedFAQ = await FAQ.findOneAndUpdate(
        { _id: faqId, "faqs._id": questionId },
        { $set: updateFields },
        { new: true }
      );

      if (!updatedFAQ) {
        return res.status(404).json({ message: "FAQ or question not found" });
      }

      res.status(200).json({ message: "FAQ question updated successfully", updatedFAQ });
    } catch (error) {
      res.status(500).json({ message: "Error updating FAQ question", error: error.message });
    }
  }

  //Privacy conditions
  async editPrivacyConditionEn(req, res) {
    const { text, langType } = req.body;
    try {
      const result = await PrivacyAndCondition.findOneAndUpdate(
        { type: langType },
        { text },
        { new: true }
      );
      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: `added privacy and condition`,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: error.message
          ? error.message
          : "failed to add privacy and condition ",
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }
  // async getPrivacyConditionEn(req, res) {
  //     try {
  //         const result = await PrivacyAndCondition.findOne({ _id: "privacyAndConditionEn" })
  //         sendResponse(req, res, 200, {
  //             status: true,
  //             body: result,
  //             message: `get privacy and condition us`,
  //             errorCode: null,
  //         });
  //     } catch (error) {
  //         sendResponse(req, res, 500, {
  //             status: false,
  //             body: null,
  //             message: error.message ? error.message : "failed to get privacy and condition us ",
  //             errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
  //         });
  //     }
  // }
  async editPrivacyConditionFr(req, res) {
    const { text, langType } = req.body;
    try {
      const result = await PrivacyAndCondition.findOneAndUpdate(
        { type: langType },
        { text },
        { new: true }
      );
      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: `added privacy and condition`,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: error.message
          ? error.message
          : "failed to add privacy and condition ",
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }
  // async getPrivacyConditionFr(req, res) {
  //     try {
  //         const result = await PrivacyAndCondition.findOne({ _id: "privacyAndConditionFr" })
  //         sendResponse(req, res, 200, {
  //             status: true,
  //             body: result,
  //             message: `get privacy and condition`,
  //             errorCode: null,
  //         });
  //     } catch (error) {
  //         sendResponse(req, res, 500, {
  //             status: false,
  //             body: null,
  //             message: error.message ? error.message : "failed to get privacy and condition ",
  //             errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
  //         });
  //     }
  // }

  async getPrivacyCondition(req, res) {
    const { langType } = req.query;
    try {
      const result = await PrivacyAndCondition.findOne({ type: langType });
      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: `get privacy and condition`,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: error.message
          ? error.message
          : "failed to get privacy and condition ",
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  //Terms and conditions
  async editTermsConditionEn(req, res) {
    const { text, langType } = req.body;
    try {
      const result = await TermsAndCondition.findOneAndUpdate(
        { type: langType },
        { text },
        { new: true }
      );
      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: `added terms and condition`,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: error.message
          ? error.message
          : "failed to add terms and condition ",
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }
  // async getTermsConditionEn(req, res) {
  //     try {
  //         const result = await TermsAndCondition.findOne({ _id: "termsAndConditionEn" })
  //         sendResponse(req, res, 200, {
  //             status: true,
  //             body: result,
  //             message: `get terms and condition`,
  //             errorCode: null,
  //         });
  //     } catch (error) {
  //         sendResponse(req, res, 500, {
  //             status: false,
  //             body: null,
  //             message: error.message ? error.message : "failed to get terms and condition",
  //             errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
  //         });
  //     }
  // }
  async editTermsConditionFr(req, res) {
    const { text, langType } = req.body;
    try {
      const result = await TermsAndCondition.findOneAndUpdate(
        { type: langType },
        { text },
        { new: true }
      );
      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: `added terms and condition`,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: error.message
          ? error.message
          : "failed to add terms and condition ",
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }
  // async getTermsConditionFr(req, res) {
  //     try {
  //         const result = await TermsAndCondition.findOne({ _id: "termsAndConditionFr" })
  //         sendResponse(req, res, 200, {
  //             status: true,
  //             body: result,
  //             message: `get terms and condition`,
  //             errorCode: null,
  //         });
  //     } catch (error) {
  //         sendResponse(req, res, 500, {
  //             status: false,
  //             body: null,
  //             message: error.message ? error.message : "failed to get terms and condition ",
  //             errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
  //         });
  //     }
  // }

  async getTermsCondition(req, res) {
    const { langType } = req.query;
    try {
      const result = await TermsAndCondition.findOne({ type: langType });
      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: `get terms and condition`,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: error.message
          ? error.message
          : "failed to get terms and condition ",
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  //Send Notification                         

  async sendNotification(req, res) {
    try {
      const { contentid, patientids, sharevia } = req.body;
      const headers = {
        Authorization: req.headers["authorization"],
      };
      let getData = await httpService.postStaging(
        "patient/get-patient-details-by-id",
        { ids: patientids },
        headers,
        "patientServiceUrl"
      );

      if (getData?.data) {
        // Iterate over the keys (patient IDs) in the returned data
        const patientDetails = Object.keys(getData.data).map(patientId => {
          const patient = getData.data[patientId];
          return {
            _id: patientId,  // Using the patient ID from the key
            full_name: patient.full_name,
            email: patient.email,
            deviceToken: patient.deviceToken,
            country_code: patient.country_code,
            mobile: patient.mobile,
            notification: patient.notification
          };
        });

        const contentData = await Content.findOne({ _id: contentid });
        if (!contentData) {
          return sendResponse(req, res, 404, {
            status: false,
            body: null,
            message: `Content Not Found`,
            errorCode: "DATA_NOT_FOUND",
          });
        }

        for (const patient of patientDetails) {
          if (sharevia.includes('push') && patient.deviceToken && patient.deviceToken.length) {
            const validTokens = Array.isArray(patient.deviceToken)
              ? patient.deviceToken.filter(token => token)
              : [];
            const notificationData = {
              title: contentData.title,
              body: contentData.content,
            };
            if(validTokens.length && patient?.notification == true){
              sendPushNotification(patient.deviceToken, notificationData);
              console.log(`Push notification sent to ${patient.full_name}`);
            }
          }

          if (sharevia.includes('sms') && patient.mobile) {
            const text = contentData.content;
            const mobileNumber = `${patient.country_code}${patient.mobile}`;
            sendSms(mobileNumber, text);
            console.log(`SMS sent to ${patient.full_name}`, text, mobileNumber);
          }

          if (sharevia.includes('email') && patient.email) {
            const content = {
              subject: contentData.title,
              body: contentData.content,
            };
            sendEmail(content, patient.email);
          }
         // 🔹 Save Notification ONLY for Patient
        const paramsData = { sendTo: 'patient' };
        const requestData = {
          created_by_type: 'superadmin', 
          created_by: req.user?._id ||"", 
          content: contentData.content,
          url: "",
          for_portal_user: [patient._id],
          title: contentData.title,
          appointmentId: null,
        };

        await notificationSaved(paramsData, headers, requestData);
        }
        return sendResponse(req, res, 200, {
          status: true,
          body: patientDetails,
          message: `Notifications sent successfully`,
          errorCode: null,
        });
      } else {
        return sendResponse(req, res, 404, {
          status: false,
          body: null,
          message: `No Patient data found`,
          errorCode: "DATA_NOT_FOUND",
        });
      }

    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: error.message ? error.message : "Failed to Send Notification",
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }


}

module.exports = new ContentManagementController();