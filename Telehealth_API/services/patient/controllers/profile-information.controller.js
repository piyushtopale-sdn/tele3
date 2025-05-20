import Profile_info from "../models/profile_info";
import PortalUser from "../models/portal_user";
import Counter from "../models/counter";
import Family_info from "../models/family_info";
import { sendResponse } from "../helpers/transmission";
import { generateSignedUrl } from "../helpers/gcs";
import { sendNotification } from "../helpers/notification";
import Http from "../helpers/httpservice";
const httpService = new Http();


const generateUniqueMRN = async () => {
  let mrnNumberStart = "0000001";

  let sequenceDocument = await Counter.findOneAndUpdate(
    { _id: "mrn_number" },
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  let generatedMRN = (parseInt(mrnNumberStart) + sequenceDocument.sequence_value - 1).toString().padStart(7, '0');

  let isDuplicate = await Profile_info.findOne({ mrn_number: generatedMRN });

  if (isDuplicate) {
    return generateUniqueMRN();
  }
  return generatedMRN;
};
class ProfileInformation {
  async addFamily(req, res) {
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };
      const { patientId, firstName, lastName, countryCode, mobileNumber, relationship, gender, dob, profileKey, isDependent } = req.body;

      const newUser = await PortalUser.findById({ _id: patientId })

      if (!isDependent) {
        const existingUser = await PortalUser.findOne({ country_code: countryCode, mobile: mobileNumber });
        if (existingUser) {
          return sendResponse(req, res, 400, {
            status: false,
            message: "Mobile number already exists.",
            data: null,
            errorCode: "MOBILE_ALREADY_EXISTS",
          });
        }
      }

      // Add new family member
      let sequenceDocument = await Counter.findOneAndUpdate(
        { _id: "countid" },
        { $inc: { sequence_value: 1 } },
        { new: true }
      );


      // Create a new portal user
      let portalUserDetails = new PortalUser({
        userId: sequenceDocument.sequence_value,
        country_code: isDependent ? '' : countryCode,
        mobile: isDependent ? '' : mobileNumber,
        parent_userid: patientId,
        full_name: firstName + " " + lastName,
        isDependent: isDependent
      });
      const portalUserData = await portalUserDetails.save();
      let mrnNumber = await generateUniqueMRN();

      // Create profile information
      let profile = new Profile_info({
        full_name: `${firstName} ${lastName}`,
        first_name: firstName,
        last_name: lastName,
        gender: gender,
        isFamilyMember: true,
        profile_pic: profileKey,
        for_portal_user: portalUserData._id,
        mrn_number: mrnNumber,
        dob: dob,
      });
      await profile.save();

      // Update family member ID in parent patient profile
      const getPatientDetails = await Profile_info.findOne({ for_portal_user: patientId }, { familyMemberIds: 1, full_name: 1 });
      const familyMemberIds = getPatientDetails?.familyMemberIds || [];
      const data = [...familyMemberIds, portalUserData._id];


      await Profile_info.findOneAndUpdate(
        { for_portal_user: patientId },
        {
          $set: {
            familyMemberIds: data,
          },
        }
      );

      // Store all data into family info collection
      const addObject = {
        first_name: firstName,
        last_name: lastName,
        country_code: isDependent ? '' : countryCode,
        mobile_number: isDependent ? '' : mobileNumber,
        relationship,
        gender,
        dob: dob,
        profile_pic: profileKey,
        familyMemberId: portalUserData._id,
        mrn_number: mrnNumber,
        isDependent: isDependent
      }

      const getFamilyInfo = await Family_info.findOne({ for_portal_user: patientId })

      if (getFamilyInfo) {
        const familyMembers = getFamilyInfo?.family_members || [];
        const data = [...familyMembers, addObject];
        await Family_info.findOneAndUpdate(
          { for_portal_user: patientId },
          {
            $set: {
              family_members: data,
            },
          }
        );
      } else {
        const addData = new Family_info({
          family_members: [addObject],
          for_portal_user: patientId,
        });
        await addData.save();
      }

      // Send notification to family members
      let paramsData = {
        sendTo: "patient",
        madeBy: "patient",
        condition: "FAMILY_PROFILE_CREATION",
        familyMemberName: `${firstName} ${lastName}`,
        patientName: getPatientDetails?.full_name,
        familyMobileNumber: mobileNumber,
        familyCountryCode: countryCode,
        notification: ['sms'],
        isProfile: true
      }
      if (newUser?.notification) {
        sendNotification(paramsData, headers)
      }
      return sendResponse(req, res, 200, {
        status: true,
        message: "Family member added successfully.",
        data: null,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
        body: error,
        errorCode: null,
      });
    }
  }
  async listFamilyMember(req, res) {
    try {
      const { patientId } = req.query;

      const getRecords = await Family_info.find({ for_portal_user: { $eq: patientId } }).lean();
      let familyRecords = getRecords[0]?.family_members || [];

      for (const [index, element] of familyRecords.entries()) {
        if (element?.profile_pic) {
          familyRecords[index].signedUrl = await generateSignedUrl(element.profile_pic);
        }
      }

      return sendResponse(req, res, 200, {
        status: true,
        message: `Family members fetched successfully.`,
        data: {
          familyMember: familyRecords
        },
        errorCode: null,
      });
    } catch (error) {
      console.log(error);
      return sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
        body: error,
        errorCode: null,
      });
    }
  }

  async deletedFamilyMembersList(req, res) {
    try {
      const { patientId } = req.query;

      const getRecords = await Family_info.find({ for_portal_user: { $eq: patientId } }).lean();
      let familyRecords = getRecords[0]?.family_members || [];

      familyRecords = familyRecords.filter(member => member.isDeleted);
      for (const [index, element] of familyRecords.entries()) {
        if (element?.profile_pic) {
          familyRecords[index].signedUrl = await generateSignedUrl(element.profile_pic);
        }
      }

      return sendResponse(req, res, 200, {
        status: true,
        message: `Deleted Family members fetched successfully.`,
        data: {
          deletedFamilyMember: familyRecords
        },
        errorCode: null,
      });
    } catch (error) {
      console.log(error);
      return sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
        body: error,
        errorCode: null,
      });
    }
  }

  async deleteActivateFamilyMember(req, res) {
    try {
      const { familyMemberId, patientId, actionValue } = req.body;

      const getRecords = await Family_info.find({ for_portal_user: { $eq: patientId } })
      if (getRecords.length === 0) {
        return sendResponse(req, res, 200, {
          status: false,
          message: `Record not found`,
          data: null,
          errorCode: null,
        });
      }

      const familyData = getRecords[0]?.family_members.map((val) => {
        if (val?.familyMemberId == familyMemberId) {
          val.isDeleted = actionValue
          return val
        } else {
          return val
        }
      })

      await Family_info.findOneAndUpdate(
        { for_portal_user: patientId },
        {
          $set: {
            family_members: familyData
          }
        }
      )

      return sendResponse(req, res, 200, {
        status: true,
        message: `Family member deleted successfully.`,
        data: null,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
        body: error,
        errorCode: null,
      });
    }
  }
  async editFamilyMember(req, res) {
    try {
      const { familyMemberId, patientId, firstName, lastName, countryCode, mobileNumber, relationship, gender, dob, profileKey, isDependent } = req.body;

      if (!isDependent) {
        const existingUser = await PortalUser.findOne({ country_code: countryCode, mobile: mobileNumber });
        if (existingUser && existingUser._id.toString() !== familyMemberId.toString()) {
          return sendResponse(req, res, 400, {
            status: false,
            message: "Mobile number already exists.",
            data: null,
            errorCode: "MOBILE_ALREADY_EXISTS",
          });
        }
      }

      const getRecords = await Family_info.find({ for_portal_user: { $eq: patientId } })
      if (getRecords.length === 0) {
        return sendResponse(req, res, 200, {
          status: false,
          message: `Record not found`,
          data: null,
          errorCode: null,
        });
      }
      const familyData = getRecords[0]?.family_members.map((val) => {
        if (val?.familyMemberId == familyMemberId) {
          const updateObject = {
            first_name: firstName,
            last_name: lastName,
            country_code: isDependent && isDependent === true ? '' : countryCode,
            mobile_number: isDependent && isDependent === true ? '' : mobileNumber,
            relationship,
            profile_pic: profileKey !== undefined ? profileKey : val.profile_pic,
            gender,
            dob,
            isDeleted: false,
            familyMemberId: familyMemberId,
            isDependent: isDependent
          }
          return updateObject
        } else {
          return val
        }
      })

      await Family_info.findOneAndUpdate(
        { for_portal_user: patientId },
        {
          $set: {
            family_members: familyData
          }
        }
      )

      await PortalUser.findOneAndUpdate(
        { _id: familyMemberId },
        {
          $set: {
            country_code: countryCode,
            mobile: mobileNumber,
            isDependent: isDependent
          }
        }
      )

      let jsonDataUser = {};
      if (firstName) jsonDataUser.first_name = firstName;
      if (lastName) jsonDataUser.last_name = lastName;
      if (profileKey) jsonDataUser.profile_pic = profileKey;
      if (gender) jsonDataUser.gender = gender;
      if (dob) jsonDataUser.dob = dob;
      if (firstName && lastName) jsonDataUser.full_name = `${firstName} ${lastName}`;

      const userData = await Profile_info.findOneAndUpdate(
        { for_portal_user: familyMemberId },
        {
          $set: jsonDataUser,
        },
        {
          new: true
        }
      )

      return sendResponse(req, res, 200, {
        status: true,
        message: `Family member updated successfully.`,
        data: userData,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
        body: error,
        errorCode: null,
      });
    }
  }
  async addMedicalHistory(req, res) {
    try {
      const { patientId, allergen, allergyType, reaction, status, note, createdAt } = req.body;

      const getPatientDetails = await Profile_info.findOne({ for_portal_user: patientId }, { medicalInformation: 1 })
      const addData = {
        allergen,
        allergyType,
        reaction,
        status,
        note,
        createdAt
      }
      const data = [
  ...(getPatientDetails?.medicalInformation?.medicalHistory || []),
  addData
];

      await Profile_info.findOneAndUpdate(
        { for_portal_user: patientId },
        {
          $set: {
            medicalInformation: {
              medicalHistory: data,
              socialHistory: getPatientDetails?.medicalInformation?.socialHistory || []
            }
          }
        }
      )
      //Save audit logs
      const getPatientName = await Profile_info.findOne({ for_portal_user: { $eq: patientId } })
        .select('full_name')

      await httpService.postStaging(
        "superadmin/add-logs",
        {
          userId: patientId,
          userName: getPatientName?.full_name,
          role: 'patient',
          action: `create`,
          actionDescription: `Medical history added successfully.`,
        },
        {},
        "superadminServiceUrl"
      );

      return sendResponse(req, res, 200, {
        status: true,
        message: `Medical history added successfully.`,
        data: null,
        errorCode: null,
      });
    } catch (error) {
      console.log('Error while adding medical history: ', error);
      return sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
        body: error,
        errorCode: null,
      });
    }
  }
  async listMedicalHistory(req, res) {
    try {
      const { patientId } = req.query;

      const getPatientDetails = await Profile_info.findOne({ for_portal_user: patientId }, { medicalInformation: 1, full_name: 1 }).lean()
      const patientFullName = getPatientDetails?.full_name
      let medicalHistory = []
      if (getPatientDetails?.medicalInformation?.medicalHistory) {
        const data = getPatientDetails?.medicalInformation?.medicalHistory.map(val => {
          val.patientFullName = patientFullName
          return val
        })
        medicalHistory = data
      }
      return sendResponse(req, res, 200, {
        status: true,
        message: `Medical history fetched successfully.`,
        data: medicalHistory,
        errorCode: null,
      });
    } catch (error) {
      console.log('Error while fetching medical history: ', error);
      sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
        body: error,
        errorCode: null,
      });
    }
  }
  async deleteMedicalHistory(req, res) {
    try {
      const { id, patientId } = req.body;

      const getRecords = await Profile_info.findOne({ for_portal_user: patientId }, { medicalInformation: 1 })
      if (!getRecords?.medicalInformation || getRecords?.medicalInformation?.medicalHistory.length === 0) {
        return sendResponse(req, res, 200, {
          status: false,
          message: `Record not found`,
          data: null,
          errorCode: null,
        });
      }
      const data = getRecords?.medicalInformation?.medicalHistory.map((val) => {
        if (val?._id == id) {
          val.isDeleted = true
          return val
        } else {
          return val
        }
      })

      await Profile_info.findOneAndUpdate(
        { for_portal_user: patientId },
        {
          $set: {
            'medicalInformation.medicalHistory': data
          }
        }
      )
      //Save audit logs
      const getPatientName = await Profile_info.findOne({ for_portal_user: { $eq: patientId } })
        .select('full_name')

      await httpService.postStaging(
        "superadmin/add-logs",
        {
          userId: patientId,
          userName: getPatientName?.full_name,
          role: 'patient',
          action: `delete`,
          actionDescription: `Medical history deleted successfully.`,
        },
        {},
        "superadminServiceUrl"
      );

      return sendResponse(req, res, 200, {
        status: true,
        message: `Medical history deleted successfully.`,
        data: null,
        errorCode: null,
      });
    } catch (error) {
      console.log('Error while deleting medical history: ', error);
      return sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
        body: error,
        errorCode: null,
      });
    }
  }
  async editMedicalHistory(req, res) {
    try {
      const { id, patientId, allergen, allergyType, reaction, status, note, createdAt } = req.body;

      const getRecords = await Profile_info.findOne({ for_portal_user: patientId }, { medicalInformation: 1 })
      if (!getRecords?.medicalInformation || getRecords?.medicalInformation?.medicalHistory.length === 0) {
        return sendResponse(req, res, 200, {
          status: false,
          message: `Record not found`,
          data: null,
          errorCode: null,
        });
      }

      const data = getRecords?.medicalInformation?.medicalHistory.map((val) => {
        if (val?._id == id) {
          const updateObject = {
            allergen,
            allergyType,
            reaction,
            status,
            note,
            isDeleted: false,
            createdAt
          }
          return updateObject
        } else {
          return val
        }
      })

      await Profile_info.findOneAndUpdate(
        { for_portal_user: patientId },
        {
          $set: {
            'medicalInformation.medicalHistory': data
          }
        }
      )

      //Save audit logs
      const getPatientName = await Profile_info.findOne({ for_portal_user: { $eq: patientId } })
        .select('full_name')

      await httpService.postStaging(
        "superadmin/add-logs",
        {
          userId: patientId,
          userName: getPatientName?.full_name,
          role: 'patient',
          action: `update`,
          actionDescription: `Medical history updated successfully.`,
        },
        {},
        "superadminServiceUrl"
      );

      return sendResponse(req, res, 200, {
        status: true,
        message: `Medical history updated successfully.`,
        data: null,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
        body: error,
        errorCode: null,
      });
    }
  }
  async addSocialHistory(req, res) {
    try {
      const { patientId, alcohol, tobacco, drugs, createdAt } = req.body;

      const getPatientDetails = await Profile_info.findOne({ for_portal_user: patientId }, { medicalInformation: 1 })
      const addData = {
        alcohol,
        tobacco,
        drugs,
        createdAt
      }
      const data = [...(getPatientDetails?.medicalInformation?.socialHistory || []), addData];

      await Profile_info.findOneAndUpdate(
        { for_portal_user: patientId },
        {
          $set: {
            'medicalInformation.socialHistory': data
          }
        }
      )
      //Save audit logs
      const getPatientName = await Profile_info.findOne({ for_portal_user: { $eq: patientId } })
        .select('full_name')
      await httpService.postStaging(
        "superadmin/add-logs",
        {
          userId: patientId,
          userName: getPatientName?.full_name,
          role: 'patient',
          action: `create`,
          actionDescription: `Social history added successfully.`,
        },
        {},
        "superadminServiceUrl"
      );

      return sendResponse(req, res, 200, {
        status: true,
        message: `Social history added successfully.`,
        data: null,
        errorCode: null,
      });
    } catch (error) {
      console.log('Error while adding social history: ', error);
      return sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
        body: error,
        errorCode: null,
      });
    }
  }
  async listSocialHistory(req, res) {
    try {
      const { patientId } = req.query;

      const getPatientDetails = await Profile_info.findOne({ for_portal_user: patientId }, { medicalInformation: 1, full_name: 1 }).lean()
      const patientFullName = getPatientDetails?.full_name
      let socialHistory = []
      if (getPatientDetails?.medicalInformation?.socialHistory) {
        const data = getPatientDetails?.medicalInformation?.socialHistory.map(val => {
          val.patientFullName = patientFullName
          return val
        })
        socialHistory = data
      }
      return sendResponse(req, res, 200, {
        status: true,
        message: `Social history fetched successfully.`,
        data: socialHistory,
        errorCode: null,
      });
    } catch (error) {
      console.log('Error while fetching social history: ', error);
      return sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
        body: error,
        errorCode: null,
      });
    }
  }
  async deleteSocialHistory(req, res) {
    try {
      const { id, patientId } = req.body;

      const getRecords = await Profile_info.findOne({ for_portal_user: patientId }, { medicalInformation: 1 })
      if (!getRecords?.medicalInformation || getRecords?.medicalInformation?.socialHistory.length === 0) {
        return sendResponse(req, res, 200, {
          status: false,
          message: `Record not found`,
          data: null,
          errorCode: null,
        });
      }
      const data = getRecords?.medicalInformation?.socialHistory.map((val) => {
        if (val?._id == id) {
          val.isDeleted = true
          return val
        } else {
          return val
        }
      })

      await Profile_info.findOneAndUpdate(
        { for_portal_user: patientId },
        {
          $set: {
            'medicalInformation.socialHistory': data
          }
        }
      )

      //Save audit logs
      const getPatientName = await Profile_info.findOne({ for_portal_user: { $eq: patientId } })
        .select('full_name')

      await httpService.postStaging(
        "superadmin/add-logs",
        {
          userId: patientId,
          userName: getPatientName?.full_name,
          role: 'patient',
          action: `delete`,
          actionDescription: `Social history deleted successfully.`,
        },
        {},
        "superadminServiceUrl"
      );

      return sendResponse(req, res, 200, {
        status: true,
        message: `Social history deleted successfully.`,
        data: null,
        errorCode: null,
      });
    } catch (error) {
      console.log('Error while deleting social history: ', error);
      return sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
        body: error,
        errorCode: null,
      });
    }
  }
  async editSocialHistory(req, res) {
    try {
      const { id, patientId, alcohol, tobacco, drugs, createdAt } = req.body;

      const getRecords = await Profile_info.findOne({ for_portal_user: patientId }, { medicalInformation: 1 })
      if (!getRecords?.medicalInformation || getRecords?.medicalInformation?.socialHistory.length === 0) {
        return sendResponse(req, res, 200, {
          status: false,
          message: `Record not found`,
          data: null,
          errorCode: null,
        });
      }

      const data = getRecords?.medicalInformation?.socialHistory.map((val) => {
        if (val?._id == id) {
          const updateObject = {
            alcohol,
            tobacco,
            drugs,
            isDeleted: false,
            createdAt
          }
          return updateObject
        } else {
          return val
        }
      })

      await Profile_info.findOneAndUpdate(
        { for_portal_user: patientId },
        {
          $set: {
            'medicalInformation.socialHistory': data
          }
        }
      )

      //Save audit logs
      const getPatientName = await Profile_info.findOne({ for_portal_user: { $eq: patientId } })
        .select('full_name')

      await httpService.postStaging(
        "superadmin/add-logs",
        {
          userId: patientId,
          userName: getPatientName?.full_name,
          role: 'patient',
          action: `update`,
          actionDescription: `Social history updated successfully.`,
        },
        {},
        "superadminServiceUrl"
      );

      return sendResponse(req, res, 200, {
        status: true,
        message: `Social history updated successfully.`,
        data: null,
        errorCode: null,
      });
    } catch (error) {
      console.log(error);
      return sendResponse(req, res, 500, {
        status: false,
        message: "Internal server error",
        body: error,
        errorCode: null,
      });
    }
  }
}

module.exports = new ProfileInformation()