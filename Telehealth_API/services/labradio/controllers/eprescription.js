"use strict";

// utils
import { sendResponse } from "../helpers/transmission";
import Http from "../helpers/httpservice"
const httpService = new Http()
import mongoose from "mongoose";
import { getNextSequenceValue } from "../middleware/utils";
import Location_info from '../models/location_info';
import Eprescription from "../models/eprescription";
import EprescriptionMedicineDosage from "../models/eprescription_medicine_dosage";
import EprescriptionLab from "../models/eprescription_lab";
import EprescriptionImaging from "../models/eprescription_imaging";
import EprescriptionVaccination from "../models/eprescription_vaccination";
import EprescriptionEyeglass from "../models/eprescription_eyeglass";
import EprescriptionOther from "../models/eprescription_other";
import { sendEmail } from "../helpers/ses";
import { sendEprescriptionEmail } from "../helpers/emailTemplate";
import ReasonForAppointment from "../models/reason_of_appointment";

class ePrescriptionController {
  async createEprescription(req, res) {
    const {
      appointmentId,
      portalId,
      ePrescriptionNumber,
      patientBiometric,
      liverFailure,
      renalFailure,
      allergies,
      medicalHistory,
      accidentRelated,
      occupationalDesease,
      freeOfCharge,
      portal_type
    } = req.body;

    try {

      if (appointmentId == "") {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "Appointment Id is required",
          errorCode: null,
        });
      }

      let result;
      let message = ""

      if (ePrescriptionNumber == "") {
        const ePrescNumber = await getNextSequenceValue("ePrescriptionNumber"); //Create New ePrescription Number

        const prescriptionInfo = new Eprescription({
          appointmentId,
          portalId,
          ePrescriptionNumber: "PRESC-" + ePrescNumber,
          patientBiometric,
          liverFailure,
          renalFailure,
          allergies,
          medicalHistory,
          accidentRelated,
          occupationalDesease,
          freeOfCharge,
          portal_type
        });

        result = await prescriptionInfo.save();
        message = "Successfully Saved E-prescription"
      } else {
        result = await Eprescription.findOneAndUpdate(
          { ePrescriptionNumber, appointmentId: appointmentId },
          {
            $set: {
              patientBiometric,
              liverFailure,
              renalFailure,
              allergies,
              medicalHistory,
              accidentRelated,
              occupationalDesease,
              freeOfCharge
            }
          },
          { new: true }
        ).exec();

        message = "Successfully Updated E-prescription"
      }

      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: message,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to create eprescription",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async addEprescriptionMedicineDosage(req, res) {
    const { dosages, portal_type } = req.body;
    try {
      dosages.forEach(async (element) => {
        await EprescriptionMedicineDosage.findOneAndUpdate(
          { ePrescriptionId: element.ePrescriptionId, dose_no: element.dose_no, medicineId: element.medicineId, portal_type },
          { $set: element },
          { upsert: true, new: true }
        )
      });
      sendResponse(req, res, 200, {
        status: true,
        body: null,
        message: "Dosage added successfully",
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to add medicine dosages",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async addEprescriptionLabTest(req, res) {
    const {
      _id,
      ePrescriptionId,
      portalId,
      labId, lab_name,
      reason_for_lab,
      relevant_clinical_information,
      specific_instruction,
      comment,
      portal_type
    } = req.body;

    try {

      let result;

      if (_id == "" || _id == null) {
        const labData = new EprescriptionLab({
          ePrescriptionId,
          portalId,
          labId, lab_name,
          reason_for_lab,
          relevant_clinical_information,
          specific_instruction,
          comment,
          portal_type
        })

        await labData.save()

      } else {
        let obj = {
          reason_for_lab,
          relevant_clinical_information,
          specific_instruction,
          comment
        }

        result = await EprescriptionLab.findOneAndUpdate({ _id: _id, portal_type }, { $set: obj }, { new: true })

        if (result == null) {
          return sendResponse(req, res, 200, {
            status: false,
            body: result,
            message: 'No Record Found',
            errorCode: null,
          });
        }
      }

      sendResponse(req, res, 200, {
        status: true,
        body: null,
        message: "Lab Test added successfully",
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to add Lab Test",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async addEprescriptionImagingTest(req, res) {
    const {
      _id,
      ePrescriptionId,
      portalId,
      imagingId,
      imaging_name,
      reason_for_imaging,
      relevant_clinical_information,
      specific_instruction,
      comment,
      portal_type
    } = req.body;

    try {

      let result;
      let message;

      if (_id == "" || _id == null) {
        const labData = new EprescriptionImaging({
          ePrescriptionId,
          imagingId,
          portalId,
          imaging_name,
          reason_for_imaging,
          relevant_clinical_information,
          specific_instruction,
          comment,
          portal_type
        })

        result = await labData.save()
        message = "Imaging Test added successfully"

      } else {
        let obj = {
          reason_for_imaging,
          relevant_clinical_information,
          specific_instruction,
          comment
        }

        result = await EprescriptionImaging.findOneAndUpdate({ _id: _id, portal_type }, { $set: obj }, { new: true })
        if (result == null) {
          return sendResponse(req, res, 200, {
            status: false,
            body: result,
            message: 'No Record Found',
            errorCode: null,
          });
        }
        message = "Imaging Test Updated successfully"
      }

      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: message,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed To Imaging Test",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async addEprescriptionVaccination(req, res) {
    const {
      _id,
      ePrescriptionId,
      portalId,
      vaccinationId,
      vaccination_name,
      dosage,
      comment,
      portal_type
    } = req.body;

    try {

      let result;
      let message;

      if (_id == "" || _id == null) {
        const labData = new EprescriptionVaccination({
          ePrescriptionId,
          vaccinationId,
          portalId,
          vaccination_name,
          dosage,
          comment,
          portal_type
        })

        result = await labData.save()
        message = "Vaccination Test added successfully"

      } else {
        let obj = {
          dosage,
          comment
        }

        result = await EprescriptionVaccination.findOneAndUpdate({ _id: _id, portal_type }, { $set: obj }, { new: true })
        if (result == null) {
          return sendResponse(req, res, 200, {
            status: false,
            body: result,
            message: 'No Record Found',
            errorCode: null,
          });
        }
        message = "Vaccination Test Updated successfully"
      }

      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: message,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed To Imaging Test",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async addEprescriptionEyeglass(req, res) {
    const {
      _id,
      ePrescriptionId,
      eyeglassId,
      portalId,
      eyeglass_name,
      left_eye,
      right_eye,
      treatments,
      visual_acuity,
      comment,
      portal_type
    } = req.body;

    try {

      let result;
      let message;

      if (_id == "" || _id == null) {
        const labData = new EprescriptionEyeglass({
          ePrescriptionId,
          eyeglassId,
          portalId,
          eyeglass_name,
          left_eye,
          right_eye,
          treatments,
          visual_acuity,
          comment,
          portal_type
        })

        result = await labData.save()
        message = "Eyeglass Test added successfully"

      } else {
        let obj = {
          left_eye,
          right_eye,
          treatments,
          visual_acuity,
          comment
        }

        result = await EprescriptionEyeglass.findOneAndUpdate({ _id: _id, portal_type }, { $set: obj }, { new: true })
        if (result == null) {
          return sendResponse(req, res, 200, {
            status: false,
            body: result,
            message: 'No Record Found',
            errorCode: null,
          });
        }
        message = "Eyeglass Test Updated successfully"
      }

      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: message,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed To Imaging Test",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async addEprescriptionOther(req, res) {
    const {
      _id,
      ePrescriptionId,
      portalId,
      otherId, other_name,
      reason_for_other,
      relevant_clinical_information,
      specific_instruction,
      comment,
      portal_type
    } = req.body;

    try {

      let result;
      let message;

      if (_id == "" || _id == null) {
        const labData = new EprescriptionOther({
          ePrescriptionId,
          otherId,
          portalId,
          other_name,
          reason_for_other,
          relevant_clinical_information,
          specific_instruction,
          comment,
          portal_type
        })

        await labData.save()
        message = "Other Test added successfully"

      } else {
        let obj = {
          reason_for_other,
          relevant_clinical_information,
          specific_instruction,
          comment
        }

        result = await EprescriptionOther.findOneAndUpdate({ _id: _id, portal_type }, { $set: obj }, { new: true })
        message = "Other Test Updated Successfully"

        if (result == null) {
          return sendResponse(req, res, 200, {
            status: false,
            body: result,
            message: 'No Record Found',
            errorCode: null,
          });
        }
      }

      sendResponse(req, res, 200, {
        status: true,
        body: null,
        message: message,
        errorCode: null,
      });
    } catch (error) {

      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to add Other Test",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async listRecentMedicinesPrescribed(req, res) {
    const {
      portalId, portal_type,
      recentItemsFor
    } = req.query;

    try {
      let result;

      if (recentItemsFor == 'Medicines') {
        result = await EprescriptionMedicineDosage.find({ portalId, portal_type }).sort({ "createdAt": -1 }).limit(10);
      } else if (recentItemsFor == 'Labs') {
        result = await EprescriptionLab.find({ portalId, portal_type }).sort({ "createdAt": -1 }).limit(10);
      } else if (recentItemsFor == 'Imaging') {
        result = await EprescriptionImaging.find({ portalId, portal_type }).sort({ "createdAt": -1 }).limit(10);
      } else if (recentItemsFor == 'Vaccination') {
        result = await EprescriptionVaccination.find({ portalId, portal_type }).sort({ "createdAt": -1 }).limit(10);
      } else if (recentItemsFor == 'Eyeglass') {
        result = await EprescriptionEyeglass.find({ portalId, portal_type }).sort({ "createdAt": -1 }).limit(10);
      } else {
        result = await EprescriptionOther.find({ portalId, portal_type }).sort({ "createdAt": -1 }).limit(10);
      }

      if (result) {
        sendResponse(req, res, 200, {
          status: true,
          body: result,
          message: 'Recent prescribes fetched succesfully',
          errorCode: null,
        });
      }
    } catch (error) {

      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to recent prescribes",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }



  async deleteEprescriptionMedicineDosage(req, res) {
    const {
      doseId
    } = req.body;

    try {

      await EprescriptionMedicineDosage.findOneAndDelete({
        _id: doseId
      })

      sendResponse(req, res, 200, {
        status: true,
        body: null,
        message: 'Medicine Dose Deleted successfully',
        errorCode: null,
      });

    } catch (error) {

      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to get medicine dosage",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getEprescriptionMedicineDosage(req, res) {
    const {
      ePrescriptionId,
      portal_type,
      medicineId
    } = req.query;
    try {
      let result;

      if (medicineId) {
        result = await EprescriptionMedicineDosage.find({ ePrescriptionId, medicineId, portal_type })
      } else {
        result = await EprescriptionMedicineDosage.find({ ePrescriptionId, portal_type })
      }

      sendResponse(req, res, 200, {
        status: true,
        body: result,
        message: 'Medicine Dosage fetched successfully',
        errorCode: null,
      });

    } catch (error) {

      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to get medicine dosage",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getEprescriptionLabTest(req, res) {
    const {
      ePrescriptionId,
      portal_type,
      labId
    } = req.query;

    try {
      let result;

      if (labId) {
        result = await EprescriptionLab.findOne({ ePrescriptionId, labId, portal_type })
      } else {
        result = await EprescriptionLab.find({ ePrescriptionId, portal_type })
      }


      if (result) {
        sendResponse(req, res, 200, {
          status: true,
          body: result,
          message: 'Lab Tests fetched successfully',
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: 'No Lab Tests Found!!',
          errorCode: null,
        });
      }

    } catch (error) {

      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to get lab test",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getEprescriptionImagingTest(req, res) {
    const {
      ePrescriptionId,
      portal_type,
      imagingId
    } = req.query;

    try {
      let result;

      if (imagingId) {
        result = await EprescriptionImaging.findOne({ ePrescriptionId, imagingId, portal_type })
      } else {
        result = await EprescriptionImaging.find({ ePrescriptionId, portal_type })
      }


      if (result) {
        sendResponse(req, res, 200, {
          status: true,
          body: result,
          message: 'Imaging Tests fetched successfully',
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: 'No Imaging Tests Found!!',
          errorCode: null,
        });
      }

    } catch (error) {

      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to get imaging test",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getEprescriptionVaccinationTest(req, res) {
    const {
      ePrescriptionId,
      portal_type,
      vaccinationId
    } = req.query;

    try {
      let result;

      if (vaccinationId) {
        result = await EprescriptionVaccination.findOne({ ePrescriptionId, vaccinationId, portal_type })
      } else {
        result = await EprescriptionVaccination.find({ ePrescriptionId, portal_type })
      }


      if (result) {
        sendResponse(req, res, 200, {
          status: true,
          body: result,
          message: 'Vaccination Tests fetched successfully',
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: 'No Vaccination Tests Found!!',
          errorCode: null,
        });
      }

    } catch (error) {

      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to get vaccination test",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getEprescriptionOtherTest(req, res) {
    const {
      ePrescriptionId,
      portal_type,
      otherId
    } = req.query;

    try {
      let result;

      if (otherId) {
        result = await EprescriptionOther.findOne({ ePrescriptionId, otherId, portal_type })
      } else {
        result = await EprescriptionOther.find({ ePrescriptionId, portal_type })
      }


      if (result) {
        sendResponse(req, res, 200, {
          status: true,
          body: result,
          message: 'Other Tests fetched successfully',
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: 'No Other Tests Found!!',
          errorCode: null,
        });
      }

    } catch (error) {

      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to get other test",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getEprescriptionEyeglassTest(req, res) {
    const {
      ePrescriptionId,
      portal_type,
      eyeglassId
    } = req.query;

    try {
      let result;

      if (eyeglassId) {
        result = await EprescriptionEyeglass.findOne({ ePrescriptionId, eyeglassId, portal_type })
      } else {
        result = await EprescriptionEyeglass.find({ ePrescriptionId, portal_type })
      }


      if (result) {
        sendResponse(req, res, 200, {
          status: true,
          body: result,
          message: 'Eyeglass Tests fetched successfully',
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: 'No Eyeglass Tests Found!!',
          errorCode: null,
        });
      }

    } catch (error) {

      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to get eyeglass test",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }


  async getAllTests(req, res) {
    const {
      appointmentId, portal_type
    } = req.query;

    try {
      let result;

      result = await Eprescription.aggregate([
        {
          $match: { appointmentId: mongoose.Types.ObjectId(appointmentId), portal_type }
        },
        {
          $lookup: {
            from: 'eprescriptionmedicinedosages',
            localField: '_id',
            foreignField: 'ePrescriptionId',
            as: 'dosages'
          }
        },
        {
          $lookup: {
            from: 'eprescriptionlabs',
            localField: '_id',
            foreignField: 'ePrescriptionId',
            as: 'labs'
          }
        },
        {
          $lookup: {
            from: 'eprescriptionimagings',
            localField: '_id',
            foreignField: 'ePrescriptionId',
            as: 'imaging'
          }
        },
        {
          $lookup: {
            from: 'eprescriptionvaccinations',
            localField: '_id',
            foreignField: 'ePrescriptionId',
            as: 'vaccinations'
          }
        },
        {
          $lookup: {
            from: 'eprescriptioneyeglasses',
            localField: '_id',
            foreignField: 'ePrescriptionId',
            as: 'eyeglasses'
          }
        },
        {
          $lookup: {
            from: 'eprescriptionothers',
            localField: '_id',
            foreignField: 'ePrescriptionId',
            as: 'others'
          }
        }


      ])

      if (result) {
        sendResponse(req, res, 200, {
          status: true,
          body: result,
          message: 'All Tests fetched successfully',
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: 'No Tests Found!!',
          errorCode: null,
        });
      }

    } catch (error) {

      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to get eyeglass test",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }


  async getLocationInfoById(req, res) {
    const {
      portalId
    } = req.query;

    try {
      let result;

      result = await Location_info.findOne({ for_portal_user: portalId })


      if (result) {
        sendResponse(req, res, 200, {
          status: true,
          body: result,
          message: 'Location info fetched succesfully',
          errorCode: null,
        });
      }
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to fetched lacation info ",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async listAllEprescription(req, res) {
    const {
      portalId,
      page,
      limit,
      appointmentType,
      portal_type
    } = req.body;
    try {
      let sort = req.body.sort
      let sortingarray = {};
      if (sort != 'undefined' && sort != '' && sort != undefined) {
        let keynew = sort.split(":")[0];
        let value = sort.split(":")[1];
        sortingarray[keynew] = Number(value);
      } else {
        sortingarray['createdAt'] = -1;
      }
      let result;
      let matchFilter = {};

      if (appointmentType == "ALL") {
        matchFilter = { $match: { 'appointment.appointmentType': { $in: ['ONLINE', 'FACE_TO_FACE', 'HOME_VISIT'] } } }
      } else {
        matchFilter = { $match: { 'appointment.appointmentType': { $in: [appointmentType] } } }

      }


      result = await Eprescription.aggregate([
        {
          $match: { portalId: mongoose.Types.ObjectId(portalId), portal_type }
        },
        {
          $lookup: {
            from: 'appointments',
            localField: 'appointmentId',
            foreignField: '_id',
            as: 'appointment'
          }
        },
        { $unwind: "$appointment" },
        {
          $lookup: {
            from: 'reasonforappointments',
            localField: 'appointment.reasonForAppointment',
            foreignField: '_id',
            as: 'reasonforappointments'
          }
        },
        {

          $set: {

            "appointment.reasonForAppointment": "$reasonforappointments.name",

          }

        },
        matchFilter,
        { $sort: sortingarray },
        { $skip: (page - 1) * limit },
        { $limit: limit * 1 },


      ])
      const count = await Eprescription.aggregate([
        {
          $match: { portalId: mongoose.Types.ObjectId(portalId), isValidate: true }
        },
        {
          $lookup: {
            from: 'appointments',
            localField: 'appointmentId',
            foreignField: '_id',
            as: 'appointment'
          }
        },
        { $unwind: "$appointment" },
        matchFilter
      ])


      if (result) {
        sendResponse(req, res, 200, {
          status: true,
          body: {
            totalPages: Math.ceil(count.length / limit),
            currentPage: page,
            totalRecords: count.length,
            result,
          },
          message: 'Eprescriptions fetched succesfully',
          errorCode: null,
        });
      }
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to fetched eprescription",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }



  async sendMailTOPatient(req, res) {
    try {
      const { patient_data, portal_email, portal_name, appointment_Id, portal_type } = req.body;
      let patient_email = patient_data?.patient_email
      let patient_name = patient_data?.patient_name

      const content = sendEprescriptionEmail(patient_email, portal_email, appointment_Id, patient_name, portal_name, portal_type)
      sendEmail(content);
      return sendResponse(req, res, 200, {
        status: true,
        body: null,
        message: "Email Send successfully!",
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to Send Email.",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }


  async getAllEprescriptionDetailsForFourPortal(req, res) {
    const {
      ePrescriptionNumber,
    } = req.query;

    const headers = {
      'Authorization': req.headers['authorization']
    }

    try {
      let result;

      result = await Eprescription.aggregate([
        {
          $match: { ePrescriptionNumber: ePrescriptionNumber }
        },
        {
          $lookup: {
            from: 'eprescriptionmedicinedosages',
            localField: '_id',
            foreignField: 'ePrescriptionId',
            as: 'dosages'
          }
        },
        // { $unwind: { path: "$dosages", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'appointments',
            localField: 'appointmentId',
            foreignField: '_id',
            as: 'appointment'
          }
        },
        { $unwind: { path: "$appointment", preserveNullAndEmptyArrays: true } },

        {
          $lookup: {
            from: 'basicinfos',
            localField: 'appointment.portalId',
            foreignField: 'for_portal_user',
            as: 'basicinfos'
          }
        },
        { $unwind: { path: "$basicinfos", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            ePrescriptionNumber: 1,
            appointmentId: 1,
            medicines: "$dosages",
            reasonForAppointment: "$appointment.reasonForAppointment",
            consultationFee: "$appointment.consultationFee",
            portalId: "$appointment.portalId",
            prescriberCenterDetails: {
              prescriberCenter: '$appointment.hospital_details.hospital_name',
              prescriberCenterId: '$appointment.hospital_details.hospital_id',
              prescriberFirstName: '$basicinfos.first_name',
              prescriberMiddleName: '$basicinfos.middle_name',
              prescriberLastName: '$basicinfos.last_name',
              prescriberTitle: '$basicinfos.title',
              prescriberSpeciality: '$basicinfos.speciality'
            }
          }
        },

      ])

      let wrapResult = { ...result[0] }
     
      let appointmentReasonId = result[0]?.reasonForAppointment
      const reasondata = await ReasonForAppointment.findOne({ _id: mongoose.Types.ObjectId(appointmentReasonId) })
      if (reasondata) {
        wrapResult = { ...wrapResult, reasonData: reasondata.name }
      }

      if (result[0]?.prescriberCenterDetails?.prescriberSpeciality) {
        let specialityPromises = await httpService.getStaging('hospital/get-speciality-data', { data: result[0]?.prescriberCenterDetails?.prescriberSpeciality[0] }, headers, 'hospitalServiceUrl');
        if (specialityPromises) {
          wrapResult = { ...wrapResult, specialityname: specialityPromises?.data[0]?.specilization }
        }
      }


      if (result?.length > 0) {
        sendResponse(req, res, 200, {
          status: true,
          body: wrapResult,
          message: 'Eprescription Data Fetched Successfully',
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: 'No Details Found!! Please Enter Valid ePrescription Number',
          errorCode: null,
        });
      }

    } catch (error) {
      
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Failed to get eprescription details",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }


  async checkEprescriptionAvailability(req, res) {
    try {
      const getData = await Eprescription.find({ ePrescriptionNumber: req.query.eprescription_number })
      let checkEprescriptionNumberExist ={};
      if (getData.length > 0) {
        const eprescriptionID = getData[0]._id;
        if (req.query.portal_type === "Laboratory") {
          checkEprescriptionNumberExist = await EprescriptionImaging.find({ ePrescriptionId: { $eq: eprescriptionID } });
        } 
        else if (req.query.portal_type === "Radiology") {
            checkEprescriptionNumberExist = await EprescriptionLab.find({ ePrescriptionId: { $eq: eprescriptionID } });
        }
        else{
          checkEprescriptionNumberExist= await EprescriptionMedicineDosage.find({ ePrescriptionId: { $eq: eprescriptionID } });
        }

        sendResponse(req, res, 200, {
          status: true,
          body: {
            medicineDosageData: checkEprescriptionNumberExist
          },
          message: 'Successfully fetched data',
          errorCode: null,
        });
      } else {
        sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: 'No Details Found!! Please Enter Valid ePrescription Number',
          errorCode: null,
        });
      }
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        data: error,
        message: error.message ? error.message : "Something went wrong",
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }


}
module.exports = new ePrescriptionController();