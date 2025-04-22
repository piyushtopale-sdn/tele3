"use strict";

// models
import mongoose from "mongoose";
import EprescriptionMedicineDosage from "../models/eprescription_medicine_dosage";
import Eprescription from "../models/eprescription";
import Diagnosis from "../models/diagnosis";
import PrescribeLabTest from "../models/prescribe_lab_test";
import PrescribeRadiologyTest from "../models/prescribe_radiology_test";
import { sendResponse } from "../helpers/transmission";
import Http from "../helpers/httpservice";
import BasicInfo from "../models/basic_info";
import { sendNotification } from "../helpers/notification";
import { config } from "../config/constants";
import axios from "axios";
const { MOYASAR_SECRET_KEY } = config
const httpService = new Http();

const getAllPatient = (patientIdsArray) => {
  return new Promise(async (resolve, reject) => {
    let patientDetails = {}
    if (patientIdsArray.length > 0) {
      const getDetails = await httpService.postStaging(
        "patient/get-patient-details-by-id",
        { ids: patientIdsArray },
        {},
        "patientServiceUrl"
      );

      if (getDetails?.status) {
        patientDetails = getDetails?.data
      }
    }
    resolve(patientDetails)
  })
}
const getAlborgeResponse = (idsArray) => {

  return new Promise(async (resolve, reject) => {
    let response = {}
    if (idsArray.length > 0) {
      const getDetails = await httpService.getStaging(
        "appointment/get-alborge-results-from-prescribed-Id",
        { ids: idsArray },
        {},
        "labradioServiceUrl"
      );

      if (getDetails?.status) {
        response = getDetails?.data
      }
    }
    resolve(response)
  })
}
const getAllLabRadioName = (headers, idsArray) => {
  return new Promise(async (resolve, reject) => {
    let details = {}
    if (idsArray.length > 0) {
      const getDetails = await httpService.getStaging(
        "lab-radio/get-labradio-details-by-id",
        { ids: idsArray },
        headers,
        "labradioServiceUrl"
      );

      if (getDetails?.status) {
        details = getDetails?.body
      }
    }
    resolve(details)
  })
}

const getPayment = (paymentId) => {
 
  return new Promise(async(resolve, reject) => {
      try {
          const getData = await axios.get(`https://api.moyasar.com/v1/payments/${paymentId}`, {
              auth: {
                username: MOYASAR_SECRET_KEY,
                password: ''
              }
            })
          resolve(getData.data)
      } catch (error) {
          reject(error);
      }
  })
}
class PatientClinicalInfoController {

  async updatePaymentInfoIntoLabRadioTests(req, res) {
    try {
      const { testPaymentInfo, _id, type, forUser, paymentId, totalAmountPaid, vatCharges, orderId, discountCoupon, labRadioId, discountedAmount, discountCouponId} = req.body;

      const headers = {
        Authorization: req.headers["authorization"],
      };

      if (!testPaymentInfo || testPaymentInfo.length === 0) {
        return sendResponse(req, res, 400, {
          status: false,
          message: "No payment information provided",
          body: null,
          errorCode: "INVALID_INPUT",
        });
      }
      if (!_id || !type) {
        return sendResponse(req, res, 400, {
          status: false,
          message: "Missing required parameters (_id or type)",
          body: null,
          errorCode: "INVALID_INPUT",
        });
      }
      let testInfo = [];
      const getPaymentData = await getPayment(paymentId);
      const paymentStatus = getPaymentData?.status;
      const model = type === "lab" ? PrescribeLabTest : PrescribeRadiologyTest;
      await Promise.all(
        testPaymentInfo.map(async (item) => {
          const paymentInfo = {
            paymentStatus: item.paymentStatus,
            discount: item.discount,
            couponCode: item.couponCode,
            couponCodeId: item.couponCodeId,
            testPrice: item.testPrice,
            paymentId: paymentId,
            labRadioId: item.labRadioId,
            centerData: item.centerData
          };
          testInfo.push({
            testPrice: item?.testPrice,
            testId: item?.testId,
            labRadioId: item?.labRadioId,
            testName: item?.testName,
            loinc: item?.loinc,
            centerDetails: {
              centre_name: item?.centerData?.labDetails?.centre_name,
              centre_name_arabic: item?.centerData?.labDetails?.centre_name_arabic,
              mobile: item?.centerData?.labDetails?.country_code + " " + item?.centerData?.labDetails?.phone_number,
              email: item?.centerData?.labDetails?.email
            },
            doctorDetails: {
              doctorName: item?.centerData?.doctorData?.item?.doctorName,
              doctorNameArabic: item?.centerData?.doctorData?.item?.doctorNameArabic
            }

          })
          let filter;
          let update;
          if (type === "lab") {
            filter = { _id: _id, "labTest.labtestId": item.labtestId };
            update = { $set: { "labTest.$.paymentInfo": paymentInfo } };
          } else {
            filter = { _id: _id, "radiologyTest.radiologyTestId": item.labtestId };
            update = { $set: { "radiologyTest.$.paymentInfo": paymentInfo } };
          }

          if(paymentStatus != "failed"){
            const updatedResult = await model.updateOne(filter, update);
          }

        })
      );

      const resData = httpService.postStaging(
        "payment/save-payment_history-labradio",
        { paymentId: paymentId, forUser: forUser, totalAmountPaid: totalAmountPaid, vatCharges: vatCharges? vatCharges: "", orderId: orderId? orderId: "", type: type, discountCoupon: discountCoupon? discountCoupon: "", labRadioId: labRadioId? labRadioId: "", testInfo: testInfo, discountedAmount: discountedAmount? discountedAmount: 0, discountCouponId:discountCouponId ? discountCouponId : null},
        headers,
        "patientServiceUrl"
      );

      return sendResponse(req, res, 200, {
        status: paymentStatus != "failed"? true: false,
        message: paymentStatus != "failed"? "Payment information updated successfully": "Failed to process payment",
        body: null,
        errorCode: null,
      });

    } catch (error) {
      console.error("Error while updating payment info:", error);
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: "Failed to update payment info",
        errorCode: error.errorCode || "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getTestsDetailsFromCenter(req, res) {

    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };
      const { labRadioId, type } = req.query;

      if (!labRadioId) {
        return sendResponse(req, res, 500, {
          status: true,
          body: {},
          message: `Please Select The Center Name`,
          errorCode: null,
        });
      }
      let labRadioTestPerformedList = [];
      if (type === "Laboratory") {
        const query = {
          labTest: { $elemMatch: { labCenterId: labRadioId } }
        };
        const results = await PrescribeLabTest.find(query);
        results.forEach((doc) => {
          const matchingTests = doc.labTest.filter(
            (test) => test.labCenterId === labRadioId
          );
          labRadioTestPerformedList = labRadioTestPerformedList.concat(matchingTests);
        });
      } else {
        const query = {
          radiologyTest: { $elemMatch: { radiologyCenterId: labRadioId } }
        };
        const results = await PrescribeRadiologyTest.find(query);

        results.forEach((doc) => {
          const matchingTests = doc.radiologyTest.filter(
            (test) => test.radiologyCenterId === labRadioId
          );
          labRadioTestPerformedList = labRadioTestPerformedList.concat(matchingTests);
        });
      }
      if (labRadioTestPerformedList.length === 0 || !labRadioTestPerformedList) {
        return sendResponse(req, res, 200, {
          status: false,
          body: {
            totalRevenuePerCenter: 0,
            mostPerformedTestPerCenter: []
          },
          message: `No records found for the given labCenterId`,
          errorCode: "NOT_FOUND",
        });
      }
      let totalRevenue = 0
      if (labRadioTestPerformedList.length > 0) {
        labRadioTestPerformedList.forEach((item) => {
          if (item.paymentInfo) {
            totalRevenue = totalRevenue + Number(item.paymentInfo.testPrice);
          }
        })
      }
      // const getMostPerformedTestPerCenter = await httpService.getStaging(
      //   `appointment/get-most-Performed-tests?labRadioId=${labRadioId}&type=${type}`,headers,
      //   "labradioServiceUrl"
      // );

      sendResponse(req, res, 200, {
        status: true,
        message: `Test data fetch fetched successfully`,
        body: {
          totalRevenuePerCenter: totalRevenue,
          mostPerformedTestPerCenter: []
        },
        errorCode: null,
      });
    } catch (error) {
      console.error("Failed fetch test data:", error);
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `Failed to fetch test data`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }


  async totalRevenuePerTest(req, res) {
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };
      const {
        testId,
        type
      } = req.query;
      let totalRevenuePerTest = 0

      if (!testId) {
        return sendResponse(req, res, 500, {
          status: true,
          body: {},
          message: `Please Select The Test`,
          errorCode: null,
        });
      }

      const model = type === "lab" ? PrescribeLabTest : PrescribeRadiologyTest;
      const filter = { "labTest.labtestId": testId };

      const updatedResult = await model.find(filter);
      const allLabTests = updatedResult.flatMap(result => result.labTest || []);

      if (allLabTests.length > 0) {
        allLabTests.forEach((item) => {
          if (item.paymentInfo && item.paymentInfo.paymentStatus === true) {
            totalRevenuePerTest = totalRevenuePerTest + Number(item.paymentInfo.testPrice)
          }
        })
      }

      sendResponse(req, res, 200, {
        status: true,
        message: `Fetch Total Revenue Per Test successfully`,
        body: {
          totalRevenuePerTest: totalRevenuePerTest
        },
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: `Failed To Fetch Revenue Per Test`,
        errorCode: error.errorCode ? error.errorCode : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async mostPerformedTestPerDoctor(req, res) {
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };
      const {
        doctorId
      } = req.query;

      if (!doctorId) {
        return sendResponse(req, res, 500, {
          status: true,
          body: {},
          message: `Please Select The Doctor`,
          errorCode: null,
        });
      }
      //Most Performed LabTest Per Doctor
      const prescribedListPerDcotorLab = await PrescribeLabTest.find({ doctorId: doctorId });
      const allPrescribedLabTestsByDoctor = prescribedListPerDcotorLab.flatMap(result => result.labTest || []);

      const labtestIdFrequency = allPrescribedLabTestsByDoctor.reduce((acc, test) => {
        const { labtestId, labtestName } = test;
        if (labtestId) {
          if (!acc[labtestId]) {
            acc[labtestId] = { labtestId, labtestName, count: 0 };
          }
          acc[labtestId].count += 1;
        }
        return acc;
      }, {});
      const labTestIdCount = Object.values(labtestIdFrequency).sort((a, b) => b.count - a.count);

      //Most Performed Radiology Test Per Doctor
      const prescribedListPerDcotorRadio = await PrescribeRadiologyTest.find({ doctorId: doctorId });
      const allPrescribedRadioTestsByDoctor = prescribedListPerDcotorRadio.flatMap(result => result.radiologyTest || []);
      const raadiotestIdFrequency = allPrescribedRadioTestsByDoctor.reduce((acc, test) => {
        const { radiologyTestId, radiologyTestName } = test;
        if (radiologyTestId) {
          if (!acc[radiologyTestId]) {
            acc[radiologyTestId] = { radiologyTestId, radiologyTestName, count: 0 };
          }
          acc[radiologyTestId].count += 1;
        }
        return acc;
      }, {});
      const radioTestIdCount = Object.values(raadiotestIdFrequency).sort((a, b) => b.count - a.count);

      if (labTestIdCount.length === 0 && radioTestIdCount.length === 0) {
        return sendResponse(req, res, 200, {
          status: false,
          message: `No Test Data Present`,
          body: {},
          errorCode: null,
        });
      }

      sendResponse(req, res, 200, {
        status: true,
        message: `Fetch Most Performed LabRadio Test Per Doctor successfully`,
        body: {
          labTestIdCount: labTestIdCount[0],
          radioTestIdCount: radioTestIdCount[0]
        },
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: `Failed To Fetch Most Performed LabRadio Test Per Doctor`,
        errorCode: error.errorCode ? error.errorCode : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async totalEachTestPerformedPerDoctor(req, res) {
    try {
      const { type, doctorId } = req.query;

      if (!doctorId || !type) {
        return sendResponse(req, res, 500, {
          status: true,
          body: {},
          message: `Please Select The doctor and type`,
          errorCode: null,
        });
      }

      let testListPerDoctor;
      let testCounts;

      const collection = type === "lab" ? PrescribeLabTest : PrescribeRadiologyTest;
      const idKey = type === "lab" ? "labtestId" : "radiologyTestId";
      const nameKey = type === "lab" ? "labtestName" : "radiologyTestName";

      // Fetch data based on type
      testListPerDoctor = await collection.find({
        status: "COMPLETED",
        doctorId: mongoose.Types.ObjectId(doctorId),
      });

      const allTestsPrescribedByDoctor = testListPerDoctor.flatMap(
        (test) => test[type === "lab" ? "labTest" : "radiologyTest"] || []
      );

      const testFrequency = allTestsPrescribedByDoctor.reduce((acc, item) => {
        const testId = item[idKey];
        const testName = item[nameKey];
        if (testId) {
          if (!acc[testId]) {
            acc[testId] = { testName, count: 0 };
          }
          acc[testId].count += 1;
        }
        return acc;
      }, {});

      testCounts = Object.entries(testFrequency).map(([testId, details]) => ({
        testId,
        ...details,
      }));

      testCounts.sort((a, b) => b.count - a.count);

      if (testCounts.length === 0) {
        return sendResponse(req, res, 200, {
          status: false,
          body: {
            totalEachTestPerformedPerDoctor: []
          },
          message: `No Data Exist!`,
          errorCode: null,
        });
      }

      // Standardized response
      sendResponse(req, res, 200, {
        status: true,
        body: {
          totalEachTestPerformedPerDoctor: testCounts
        },
        message: `Successfully fetched the details`,
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `Failed to fetch the details`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async createEprescription(req, res) {
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };
      const {
        medicationInformation,
        doctorId,
        patientId,
        appointmentId
      } = req.body;

      // Create prescription medication information
      let medicationIds = []
      for (const medication of medicationInformation) {
        const addObject = {
          medicineName: medication?.medicineName,
          dose: medication?.dose,
          doseUnit: medication?.doseUnit,
          routeOfAdministration: medication?.routeOfAdministration,
          frequency: medication?.frequency,
          takeFor: medication?.takeFor,
          quantity: medication?.quantity,
          medicineId: medication?.medicineId,
          doctorId,
          patientId,
          appointmentId
        }
        const addMedicationInformation = new EprescriptionMedicineDosage(addObject)
        const saveData = await addMedicationInformation.save();
        medicationIds.push(saveData?._id)
      }

      // Create ePrescription record
      const addObject = {
        medicineDosageIds: medicationIds,
        doctorId,
        patientId,
        appointmentId
      }

      const addData = new Eprescription(addObject)
      await addData.save()

      let paramsData = {
        sendTo: 'patient',
        madeBy: 'doctor',
        patientId,
        doctorId,
        appointment: {
          _id: appointmentId
        },
        condition: 'PRESCRIBE_MEDICATION',
        notification: ['push_notification', 'sms', 'email']
      }

      sendNotification(paramsData, headers)

      sendResponse(req, res, 200, {
        status: true,
        message: `e-Prescription created successfully`,
        body: null,
        errorCode: null,
      });

    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: `failed to create eprescription`,
        errorCode: error.errorCode ? error.errorCode : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getEprescription(req, res) {
    try {
      const {
        page,
        limit,
        patientId,
        doctorId,
        appointmentId,
        status,
        fromDate,
        toDate
      } = req.query;

      let appointmentId_filter = {};
      if (appointmentId) {
        appointmentId_filter['appointmentId'] = mongoose.Types.ObjectId(appointmentId);
      }
      let patientId_filter = {};
      if (patientId) {
        patientId_filter['patientId'] = mongoose.Types.ObjectId(patientId);
      }
      let doctorId_filter = {};
      if (doctorId) {
        doctorId_filter['doctorId'] = mongoose.Types.ObjectId(doctorId);
      }
      let status_filter = ['PENDING', 'ORDERED', 'INPROGRESS', 'COMPLETED'];
      if (status && !(status == 'ALL' || status.split(',').includes("ALL"))) {
        status_filter = status.split(',');
      }
      let date_filter = {};
      if (fromDate && toDate) {
        const fromDateObj = new Date(`${fromDate} 00:00:00`);
        const toDateObj = new Date(`${toDate} 23:59:59`);
        date_filter = {
          createdAt: { $gte: fromDateObj, $lte: toDateObj }
        };
      }
      
      const pipeline = [
        {
          $lookup: {
            from: 'eprescriptionmedicinedosages',
            localField: "medicineDosageIds",
            foreignField: "_id",
            as: "eprescriptionmedicinedosages"
          }
        },
        {
          $unwind: {
            path: "$eprescriptionmedicinedosages",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'basicinfos',
            localField: "doctorId",
            foreignField: "for_portal_user",
            as: "doctordetails"
          }
        },
        {
          $unwind: {
            path: "$doctordetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'appointments',
            localField: 'appointmentId',
            foreignField: '_id',
            as: 'appointmentDetails'
          }
        },
        {
          $unwind: {
            path: '$appointmentDetails',
            preserveNullAndEmptyArrays: true,
          }
        },
        {
          $match: {
            status: { $in: status_filter },
            $and: [
              appointmentId_filter,
              patientId_filter,
              doctorId_filter,
              date_filter
            ]
          }
        },
        {
          $sort: {
            createdAt: -1
          }
        },
        {
          $group: {
            _id: "$_id",
            dosageData: { $push: "$eprescriptionmedicinedosages" },
            doctorId: { $first: "$doctorId" },
            patientId: { $first: "$patientId" },
            appointmentId: { $first: "$appointmentId" },
            eSignature: { $first: "$eSignature" },
            status: { $first: "$status" },
            doctorName: { $first: "$doctordetails.full_name" },
            doctorNameArabic: { $first: "$doctordetails.full_name_arabic" },
            createdAt: { $first: "$createdAt" },
            appointment_id: { $first: "$appointmentDetails.appointment_id" },
            consultationDate: { $first: "$appointmentDetails.consultationDate" },
            consultationTime: { $first: "$appointmentDetails.consultationTime" },
            appointmentStatus: { $first: "$appointmentDetails.status" }
          }
        }
      ];

      if (limit != 0) {
        pipeline.push({
          $facet: {
            totalCount: [
              { $count: 'count' }
            ],
            paginatedResults: [
              { $skip: (page - 1) * limit },
              { $limit: limit * 1 }
            ]
          }
        });
      }

      const result = await Eprescription.aggregate(pipeline);
      let totalCount = limit == 0 ? result.length : 0;
      if (limit != 0 && result[0].totalCount.length > 0) {
        totalCount = result[0].totalCount[0].count;
      }
      const resultArray = limit == 0 ? result : result[0].paginatedResults;
      const idsArray = resultArray.map(val => val.patientId.toString());
      const userIds = [...new Set(idsArray)];
      const getPatientData = await getAllPatient(userIds);
      
      for (let index = 0; index < resultArray.length; index++) {
        const element = resultArray[index];
        element.patientName = getPatientData[element?.patientId]?.full_name;
        element.patientNameArabic = getPatientData[element?.patientId]?.full_name_arabic || "";
        element.patientMRNNumber = getPatientData[element?.patientId]?.mrn_number || "";
      }

      sendResponse(req, res, 200, {
        status: true,
        message: `e-Prescription fetched successfully`,
        body: {
          totalPages: limit != 0 ? Math.ceil(totalCount / limit) : 1,
          currentPage: page,
          totalRecords: totalCount,
          result: resultArray
        },
        errorCode: null,
      });

    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: `Failed to fetch e-Prescription`,
        errorCode: error.errorCode ? error.errorCode : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  
  async updateEprescriptionStatus(req, res) {
    try {
      const {
        id,
        status
      } = req.body;
      await Eprescription.findOneAndUpdate(
        { _id: id },
        {
          $set: { status: status }
        }
      )

      sendResponse(req, res, 200, {
        status: true,
        message: `e-Prescription status updated successfully`,
        body: null,
        errorCode: null,
      });

    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: `failed to fetching eprescription`,
        errorCode: error.errorCode ? error.errorCode : "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async getEprescriptionByID(req, res) {
    try {
      const { id } = req.params;

      const result = await Eprescription.findById(id)
        .populate('medicineDosageIds')

      // Get patient information
      const headers = {
        Authorization: req.headers["authorization"],
      };
      let patientDetails = {
        patientName: '',
        patientMobile: '',
        patientEmail: ''
      }
      const getDetails = await httpService.getStaging(
        "patient/patient-details",
        {
          patient_id: result?.patientId,
        },
        headers,
        "patientServiceUrl"
      );
      if (getDetails?.status) {
        patientDetails.patientName = getDetails?.body?.personalDetails?.full_name || ''
        patientDetails.patientMobile = getDetails?.body?.portalUserDetails?.mobile ? `${getDetails?.body?.portalUserDetails?.country_code} ${getDetails?.body?.portalUserDetails?.mobile}` : ''
        patientDetails.patientEmail = getDetails?.body?.portalUserDetails?.email || ''
      }
      sendResponse(req, res, 200, {
        status: true,
        message: `e-Prescription fetched successfully`,
        body: {
          prescriptionDetails: result,
          patientDetails
        },
        errorCode: null,
      });

    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: `failed to fetching eprescription`,
        errorCode: error.errorCode ? error.errorCode : "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async getAllMedicineDosagesByIDs(req, res) {
    try {
      const { ids } = req.query;

      const disageIds = ids.map(id => mongoose.Types.ObjectId(id))
      const getData = await EprescriptionMedicineDosage.find({ _id: { $in: disageIds } })
      let dosagesDataObject = {}
      for (const ele of getData) {
        dosagesDataObject[ele._id] = ele
      }
      sendResponse(req, res, 200, {
        status: true,
        message: `e-Prescription fetched successfully`,
        body: dosagesDataObject,
        errorCode: null,
      });

    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: `failed to fetching eprescription`,
        errorCode: error.errorCode ? error.errorCode : "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async addDiagnosis(req, res) {
    try {
      const {
        subject,
        object,
        assessment,
        icdCode,
        plan,
        doctorId,
        patientId,
        appointmentId
      } = req.body;

      const addObject = {
        subject,
        object,
        assessment,
        icdCode,
        plan,
        doctorId,
        patientId,
        appointmentId
      }

      const addData = new Diagnosis(addObject)
      await addData.save()

      sendResponse(req, res, 200, {
        status: true,
        message: `Diagnosis added successfully`,
        body: null,
        errorCode: null,
      });

    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: `failed to add diagnosis`,
        errorCode: error.errorCode ? error.errorCode : "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async getDiagnosis(req, res) {
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };
      const {
        page,
        limit,
        patientId,
        doctorId,
        appointmentId,
        fromDate,
        toDate
      } = req.query;

      let appointmentId_filter = {}
      if (appointmentId) {
        appointmentId_filter['appointmentId'] = mongoose.Types.ObjectId(appointmentId)
      }
      let patientId_filter = {}
      if (patientId) {
        patientId_filter['patientId'] = mongoose.Types.ObjectId(patientId)
      }
      let doctorId_filter = {}
      if (doctorId) {
        doctorId_filter['doctorId'] = mongoose.Types.ObjectId(doctorId)
      }
      let date_filter = {}
      if (fromDate && toDate) {
        const fromDateObj = new Date(`${fromDate} 00:00:00`);
        const toDateObj = new Date(`${toDate} 23:59:59`);
        date_filter = {
          createdAt: { $gte: fromDateObj, $lte: toDateObj }
        }
      }
      const pipeline = [
        {
          $match: {
            $and: [
              appointmentId_filter,
              patientId_filter,
              doctorId_filter,
              date_filter
            ]
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
            paginatedResults: limit != 0 ? [
              { $skip: (page - 1) * limit },
              { $limit: limit * 1 }
            ] :
              [
                { $skip: 0 },
              ]
          }
        }
      ]

      const result = await Diagnosis.aggregate(pipeline)
      // Get All doctor details diagnosed to the patient
      const paginatedResults = result[0].paginatedResults
      const doctorIdsArray = paginatedResults.map(val => val.doctorId)
      let doctorDetails = {}
      if (doctorIdsArray.length > 0) {
        const getDetails = await httpService.postStaging(
          "individual-doctor/get-patient-doctors",
          {
            doctorIds: doctorIdsArray,
          },
          headers,
          "doctorServiceUrl"
        );
        if (getDetails?.status) {
          for (const doctor of getDetails?.body?.results) {
            doctorDetails[doctor?.for_portal_user?._id] = doctor
          }
        }
      }
      // Get all appointment by there ids
      const appointmentIdsArray = paginatedResults.map(val => val.appointmentId)
      let appointmentDetails = {}
      if (appointmentIdsArray.length > 0) {
        const getDetails = await httpService.getStaging(
          "appointment/get-all-appointment-by-ids",
          {
            appointmentIds: appointmentIdsArray,
          },
          headers,
          "doctorServiceUrl"
        );
        if (getDetails?.status) {
          for (const appointment of getDetails?.body) {
            appointmentDetails[appointment?._id] = appointment
          }
        }
      }
      for (let index = 0; index < paginatedResults.length; index++) {
        const element = paginatedResults[index];
        element.doctorDetails = {
          doctorName: doctorDetails[element?.doctorId]?.full_name,
          doctorNameArabic: doctorDetails[element?.doctorId]?.full_name_arabic,
          doctorProfilePicture: doctorDetails[element?.doctorId]?.profilePicture
        }
        element.appointment_id = appointmentDetails[element?.appointmentId?.toString()]?.appointment_id
      }
      let totalCount = 0
      if (result[0].totalCount.length > 0) {
        totalCount = result[0].totalCount[0].count
      }

      sendResponse(req, res, 200, {
        status: true,
        message: `Diagnosis fetched successfully`,
        body: {
          totalPages: limit != 0 ? Math.ceil(totalCount / limit) : 1,
          currentPage: page,
          totalRecords: totalCount,
          result: result[0].paginatedResults
        },
        errorCode: null,
      });

    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: `failed to fetching diagnosis`,
        errorCode: error.errorCode ? error.errorCode : "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async editDiagnosis(req, res) {
    try {
      const {
        id,
        subject,
        object,
        assessment,
        icdCode,
        plan,
      } = req.body;

      const updateObject = {
        subject,
        object,
        assessment,
        icdCode,
        plan,
      }

      await Diagnosis.findOneAndUpdate(
        { _id: id },
        {
          $set: updateObject
        }
      )

      sendResponse(req, res, 200, {
        status: true,
        message: `Diagnosis updated successfully`,
        body: null,
        errorCode: null,
      });

    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: `failed to edit diagnosis`,
        errorCode: error.errorCode ? error.errorCode : "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async prescribeLabTest(req, res) {
    const headers = {
      'Authorization': req.headers['authorization']
    }
    try {
      const {
        labTest,
        doctorId,
        patientId,
        appointmentId
      } = req.body;

      const date = new Date()
      const history = [
        {
          status: 'PENDING',
          updatedAt: date.toISOString(),
          updatedById: req?.user?._id,
          role: 'doctor',
        }
      ]

      const labTestRecords = labTest.map((val) => {
        val.status = 'PENDING';
        val.testHistory = history
        return val
      })

      const addObject = {
        labTest: labTestRecords,
        doctorId,
        patientId,
        appointmentId,
        orderHistory: history
      }

      const addData = new PrescribeLabTest(addObject)
      await addData.save()

      const testName = labTest.map(val => val.labtestName)

      let paramsData = {
        sendTo: 'patient',
        madeBy: 'doctor',
        patientId,
        doctorId,
        appointment: {
          _id: appointmentId
        },
        condition: 'PRESCRIBE_LABORATORY',
        notification: ['push_notification', 'sms', 'email'],
        testName: testName.join(', '),
      }

      sendNotification(paramsData, headers)

      sendResponse(req, res, 200, {
        status: true,
        message: `Lab test prescribed successfully`,
        body: null,
        errorCode: null,
      });

    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: `failed to prescribe labtest`,
        errorCode: error.errorCode ? error.errorCode : "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async getPrescribeLabTest(req, res) {
    try {
      const {
        page,
        limit,
        patientId,
        doctorId,
        appointmentId,
        status,
        startDate,  // Added startDate
        endDate   
      } = req.query;

      let appointmentId_filter = {}
      if (appointmentId) {
        appointmentId_filter['appointmentId'] = mongoose.Types.ObjectId(appointmentId)
      }
      let patientId_filter = {}
      if (patientId) {
        patientId_filter['patientId'] = mongoose.Types.ObjectId(patientId)
      }
      let doctorId_filter = {}
      if (doctorId) {
        doctorId_filter['doctorId'] = mongoose.Types.ObjectId(doctorId)
      }
      let status_filter = ['PENDING', 'BOOKED', 'INPROGRESS', 'COMPLETED']
      if (status) {
        status_filter = [status]
      }
      let date_filter = {};
      if (startDate || endDate) {
        date_filter.createdAt = {};
        if (startDate) {
          date_filter.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999); // Ensures full day is included
          date_filter.createdAt.$lte = endOfDay;
        }
      }
      const pipeline = [
        {
          $lookup: {
            from: 'basicinfos',
            localField: "doctorId",
            foreignField: "for_portal_user",
            as: "doctordetails"
          }
        },
        {
          $unwind: {
            path: "$doctordetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            status: { $in: status_filter },
            $and: [
              appointmentId_filter,
              patientId_filter,
              doctorId_filter,
              date_filter
            ]
          }
        },
        {
          $group: {
            _id: "$_id",
            labTest: { $first: "$labTest" },
            doctorId: { $first: "$doctorId" },
            patientId: { $first: "$patientId" },
            appointmentId: { $first: "$appointmentId" },
            eSignature: { $first: "$eSignature" },
            status: { $first: "$status" },
            doctorName: { $first: "$doctordetails.full_name" },
            doctorNameArabic: { $first: "$doctordetails.full_name_arabic" },
            createdAt: { $first: "$createdAt" },
          }
        },
        {
          $sort: {
            createdAt: -1
          }
        },
      ]

      if (limit != 0) {
        pipeline.push({
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
        })
      }

      const result = await PrescribeLabTest.aggregate(pipeline)
      let totalCount = limit == 0 ? result.length : 0
      if (limit != 0 && result[0].totalCount.length > 0) {
        totalCount = result[0].totalCount[0].count
      }

      const resultArray = limit == 0 ? result : result[0].paginatedResults;

      const idsArray = resultArray.map(val => val.patientId.toString())
      const userIds = [... new Set(idsArray)]
      const getPatientData = await getAllPatient(userIds);

      for (let index = 0; index < resultArray.length; index++) {
        const element = resultArray[index];
        element.patientName = getPatientData[element?.patientId]?.full_name
        element.patientNameArabic = getPatientData[element?.patientId]?.full_name_arabic || ""
        element.patientMRNNumber = getPatientData[element?.patientId]?.mrn_number || "";
      }

      return sendResponse(req, res, 200, {
        status: true,
        message: `Data fetched successfully`,
        body: {
          totalPages: limit != 0 ? Math.ceil(totalCount / limit) : 1,
          currentPage: page,
          totalRecords: totalCount,
          result: resultArray
        },
        errorCode: null,
      });

    } catch (error) {
      console.log("getPrescribeLabTest", error);

      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: `failed to fetching prescribed labtest`,
        errorCode: error.errorCode ? error.errorCode : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getPrescribeLabTestCount(req, res) {
    try {
      const { page, limit, patientId, doctorId, appointmentId, status } = req.query;

      let appointmentId_filter = {};
      if (appointmentId) {
        appointmentId_filter['appointmentId'] = mongoose.Types.ObjectId(appointmentId);
      }
      let patientId_filter = {};
      if (patientId) {
        patientId_filter['patientId'] = mongoose.Types.ObjectId(patientId);
      }
      let doctorId_filter = {};
      if (doctorId) {
        doctorId_filter['doctorId'] = mongoose.Types.ObjectId(doctorId);
      }
      let status_filter = ['PENDING', 'BOOKED', 'INPROGRESS', 'COMPLETED'];
      if (status) {
        status_filter = [status];
      }

      const pipeline = [
        {
          $lookup: {
            from: 'basicinfos',
            localField: 'doctorId',
            foreignField: 'for_portal_user',
            as: 'doctordetails'
          }
        },
        {
          $unwind: {
            path: '$doctordetails',
            preserveNullAndEmptyArrays: true,
          }
        },
        {
          $match: {
            status: { $in: status_filter },
            $and: [appointmentId_filter, patientId_filter, doctorId_filter]
          }
        },
        {
          $group: {
            _id: '$_id',
            labTest: { $first: '$labTest' },
            doctorId: { $first: '$doctorId' },
            patientId: { $first: '$patientId' },
            appointmentId: { $first: '$appointmentId' },
            eSignature: { $first: '$eSignature' },
            status: { $first: '$status' },
            doctorName: { $first: '$doctordetails.full_name' },
            doctorNameArabic: { $first: '$doctordetails.full_name_arabic' },
            createdAt: { $first: '$createdAt' }
          }
        },
        {
          $sort: { createdAt: -1 }
        }
      ];

      if (limit != 0) {
        pipeline.push({
          $facet: {
            totalCount: [{ $count: 'count' }],
            paginatedResults: [
              { $skip: (page - 1) * limit },
              { $limit: limit * 1 }
            ]
          }
        });
      }

      const result = await PrescribeLabTest.aggregate(pipeline);
      let totalCount = limit == 0 ? result.length : 0;
      if (limit != 0 && result[0].totalCount.length > 0) {
        totalCount = result[0].totalCount[0].count;
      }

      const resultArray = limit == 0 ? result : result[0].paginatedResults;

      const idsArray = resultArray.map(val => val.patientId.toString());
      const userIds = [...new Set(idsArray)];
      const getPatientData = await getAllPatient(userIds);

      let pendingLabTestCount = 0;

      for (let index = 0; index < resultArray.length; index++) {
        const element = resultArray[index];
        element.patientName = getPatientData[element?.patientId]?.full_name;
        element.patientNameArabic = getPatientData[element?.patientId]?.full_name_arabic || '';
        element.patientMRNNumber = getPatientData[element?.patientId]?.mrn_number || '';

        if (Array.isArray(element.labTest)) {
          pendingLabTestCount += element.labTest.filter(test =>
            test.status === 'PENDING' &&
            (!test.hasOwnProperty('paymentInfo') || Object.keys(test.paymentInfo).length === 0)
          ).length;
        }
      }

      return sendResponse(req, res, 200, {
        status: true,
        message: `Data fetched successfully`,
        body: {
          totalPages: limit != 0 ? Math.ceil(totalCount / limit) : 1,
          currentPage: page,
          totalRecords: totalCount,
          unpaidLabTestCount: pendingLabTestCount,
        },
        errorCode: null,
      });
    } catch (error) {
      console.log('getPrescribeLabTest', error);
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: `Failed to fetch prescribed lab tests`,
        errorCode: error.errorCode ? error.errorCode : 'INTERNAL_SERVER_ERROR',
      });
    }
  }

  async prescribeRadiologyTest(req, res) {
    const headers = {
      'Authorization': req.headers['authorization']
    }
    try {
      const {
        radiologyTest,
        doctorId,
        patientId,
        appointmentId
      } = req.body;

      const date = new Date()
      const history = [
        {
          status: 'PENDING',
          updatedAt: date.toISOString(),
          updatedById: req?.user?._id,
          role: 'doctor',
        }
      ]

      const radioTestRecords = radiologyTest.map((val) => {
        val.status = 'PENDING';
        val.testHistory = history
        return val
      })
      
      const addObject = {
        radiologyTest : radioTestRecords,
        doctorId,
        patientId,
        appointmentId,
        orderHistory: history
      }

      const addData = new PrescribeRadiologyTest(addObject)
      await addData.save()

      const testName = radiologyTest.map(val => val.radiologyTestName)

      let paramsData = {
        sendTo: 'patient',
        madeBy: 'doctor',
        patientId,
        doctorId,
        appointment: {
          _id: appointmentId
        },
        condition: 'PRESCRIBE_RADIOLOGY',
        notification: ['push_notification', 'sms', 'email'],
        testName: testName.join(', '),
      }

      sendNotification(paramsData, headers)

      return sendResponse(req, res, 200, {
        status: true,
        message: `Radiology test prescribed successfully`,
        body: null,
        errorCode: null,
      });

    } catch (error) {
      console.log("Check Error ___________",error);
      
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: `failed to prescribe radiology`,
        errorCode: error.errorCode ? error.errorCode : "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async getPrescribeRadiologyTest(req, res) {
    try {
      const {
        page,
        limit,
        patientId,
        doctorId,
        appointmentId,
        status,
        startDate,  
        endDate 
      } = req.query;

      let appointmentId_filter = {}
      if (appointmentId) {
        appointmentId_filter['appointmentId'] = mongoose.Types.ObjectId(appointmentId)
      }
      let patientId_filter = {}
      if (patientId) {
        patientId_filter['patientId'] = mongoose.Types.ObjectId(patientId)
      }
      let doctorId_filter = {}
      if (doctorId) {
        doctorId_filter['doctorId'] = mongoose.Types.ObjectId(doctorId)
      }
      let status_filter = ['PENDING', 'BOOKED', 'INPROGRESS', 'COMPLETED']
      if (status) {
        status_filter = [status]
      }
      let date_filter = {};
      if (startDate || endDate) {
        date_filter.createdAt = {};
        if (startDate) {
          date_filter.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          // Include the entire end date by setting to end of day
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          date_filter.createdAt.$lte = endOfDay;
        }
      }
      const pipeline = [
        {
          $lookup: {
            from: 'basicinfos',
            localField: "doctorId",
            foreignField: "for_portal_user",
            as: "doctordetails"
          }
        },
        {
          $unwind: {
            path: "$doctordetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            status: { $in: status_filter },
            $and: [
              appointmentId_filter,
              patientId_filter,
              doctorId_filter,
              date_filter
            ]
          }
        },
        {
          $group: {
            _id: "$_id",
            radiologyTest: { $first: "$radiologyTest" },
            doctorId: { $first: "$doctorId" },
            patientId: { $first: "$patientId" },
            appointmentId: { $first: "$appointmentId" },
            eSignature: { $first: "$eSignature" },
            status: { $first: "$status" },
            doctorName: { $first: "$doctordetails.full_name" },
            doctorNameArabic: { $first: "$doctordetails.full_name_arabic" },
            createdAt: { $first: "$createdAt" },
          }
        },
        {
          $sort: {
            createdAt: -1
          }
        }
      ]

      if (limit != 0) {
        pipeline.push({
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
        })
      }

      const result = await PrescribeRadiologyTest.aggregate(pipeline)
      let totalCount = limit == 0 ? result.length : 0
      if (limit != 0 && result[0].totalCount.length > 0) {
        totalCount = result[0].totalCount[0].count
      }

      const resultArray = limit == 0 ? result : result[0].paginatedResults
      const idsArray = resultArray.map(val => val.patientId.toString())
      const userIds = [... new Set(idsArray)]
      const getPatientData = await getAllPatient(userIds)

      for (let index = 0; index < resultArray.length; index++) {
        const element = resultArray[index];
        element.patientName = getPatientData[element?.patientId]?.full_name
        element.patientNameArabic = getPatientData[element?.patientId]?.full_name_arabic || ""
        element.patientMRNNumber = getPatientData[element?.patientId]?.mrn_number || ""
      }

      sendResponse(req, res, 200, {
        status: true,
        message: `Data fetched successfully`,
        body: {
          totalPages: limit != 0 ? Math.ceil(totalCount / limit) : 1,
          currentPage: page,
          totalRecords: totalCount,
          result: resultArray
        },
        errorCode: null,
      });

    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: `failed to fetching prescribed radiology test`,
        errorCode: error.errorCode ? error.errorCode : "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async getPrescribeRadiologyTestCount(req, res) {
    try {
      const {
        page,
        limit,
        patientId,
        doctorId,
        appointmentId,
        status
      } = req.query;
  
      let appointmentId_filter = {}
      if (appointmentId) {
        appointmentId_filter['appointmentId'] = mongoose.Types.ObjectId(appointmentId)
      }
      let patientId_filter = {}
      if (patientId) {
        patientId_filter['patientId'] = mongoose.Types.ObjectId(patientId)
      }
      let doctorId_filter = {}
      if (doctorId) {
        doctorId_filter['doctorId'] = mongoose.Types.ObjectId(doctorId)
      }
      let status_filter = ['PENDING', 'BOOKED', 'INPROGRESS', 'COMPLETED']
      if (status) {
        status_filter = [status]
      }
      const pipeline = [
        {
          $lookup: {
            from: 'basicinfos',
            localField: "doctorId",
            foreignField: "for_portal_user",
            as: "doctordetails"
          }
        },
        {
          $unwind: {
            path: "$doctordetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            status: { $in: status_filter },
            $and: [
              appointmentId_filter,
              patientId_filter,
              doctorId_filter
            ]
          }
        },
        {
          $group: {
            _id: "$_id",
            radiologyTest: { $first: "$radiologyTest" },
            doctorId: { $first: "$doctorId" },
            patientId: { $first: "$patientId" },
            appointmentId: { $first: "$appointmentId" },
            eSignature: { $first: "$eSignature" },
            status: { $first: "$status" },
            doctorName: { $first: "$doctordetails.full_name" },
            doctorNameArabic: { $first: "$doctordetails.full_name_arabic" },
            createdAt: { $first: "$createdAt" },
          }
        },
        {
          $sort: {
            createdAt: -1
          }
        }
      ]
  
      if (limit != 0) {
        pipeline.push({
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
        })
      }
  
      const result = await PrescribeRadiologyTest.aggregate(pipeline)
      let totalCount = limit == 0 ? result.length : 0
      if (limit != 0 && result[0].totalCount.length > 0) {
        totalCount = result[0].totalCount[0].count
      }
  
      const resultArray = limit == 0 ? result : result[0].paginatedResults
      const idsArray = resultArray.map(val => val.patientId.toString())
      const userIds = [... new Set(idsArray)]
      const getPatientData = await getAllPatient(userIds)
  
      let unpaidRadiologyTestCount = 0;
      for (let index = 0; index < resultArray.length; index++) {
        const element = resultArray[index];
        element.patientName = getPatientData[element?.patientId]?.full_name
        element.patientNameArabic = getPatientData[element?.patientId]?.full_name_arabic || ""
        element.patientMRNNumber = getPatientData[element?.patientId]?.mrn_number || ""
  
        if (Array.isArray(element.radiologyTest)) {
          unpaidRadiologyTestCount += element.radiologyTest.filter(test => !test.paymentInfo || Object.keys(test.paymentInfo).length === 0).length;
        }
      }
  
      sendResponse(req, res, 200, {
        status: true,
        message: `Data fetched successfully`,
        body: {
          totalPages: limit != 0 ? Math.ceil(totalCount / limit) : 1,
          currentPage: page,
          totalRecords: totalCount,
          unpaidRadiologyTestCount,
        },
        errorCode: null,
      });
  
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: `failed to fetching prescribed radiology test`,
        errorCode: error.errorCode ? error.errorCode : "INTERNAL_SERVER_ERROR",
      });
    }
  }
    
  /* prescribed-labRadiology-status-update-and-isbooked-key-update */
  async updatePrescribedLabRadiologyStatus(req, res) {
    try {
      const {
        prescribedLabRadiologyTestId,
        type,
        status,
        testResultId,
        testId,
        resultType,
        labRadioTestIdArray
      } = req.body;
      let getData
      if (type === 'lab') {
        getData = await PrescribeLabTest.findById(prescribedLabRadiologyTestId)
      } else {
        getData = await PrescribeRadiologyTest.findById(prescribedLabRadiologyTestId)
      }
      if (!getData?.status) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "Prescribed lab/radiology not found",
          errorCode: null,
        })
      }
      const date = new Date()
      let history = {
        status,
        updatedAt: date.toISOString(),
        updatedById: req?.user?.role == 'patient' ? req?.user?.portalUserId : req?.user?._id,
        role: type,
      }

      let updateObject = {
        status
      }

      if (type == 'lab') {
        if (status == 'CANCELLED' || status == 'INPROGRESS' || status == 'COMPLETED') {
          const labTestRecords = getData?.labTest ? getData?.labTest.map(val => {
            if (testResultId && testId) {
              if (val.labtestId.toString() === testId) {
                val.status = 'COMPLETED'
                val.testResultId = testResultId
                val.resultType = resultType
                val.testHistory = val.testHistory.push(history)
                return val
              }
              return val
            }
            val.status = status
            val.testHistory = val.testHistory.push(history)
            return val
          }) : []
          updateObject.labTest = labTestRecords
        }
        if (testResultId && testId) {
          await PrescribeLabTest.findOneAndUpdate(
            { _id: prescribedLabRadiologyTestId },
            {
              $set: {
                labTest: updateObject.labTest
              },
            }
          )
        } else {
          /* updating isbooked status for particulr test as per testId */
          labRadioTestIdArray.forEach((testId) => {
            const matchingTest = getData?.labTest.find((test) => test.labtestId === testId);
            if (matchingTest && matchingTest.paymentInfo && matchingTest.paymentInfo.paymentStatus === true) {
              matchingTest.paymentInfo.isBooked = true;
              matchingTest.status = 'BOOKED';
              matchingTest.testHistory.push(history);
            }
          });

          // Check if all lab tests in getData.labTest are booked
          const allTestsBooked = getData.labTest.every(
            (test) => test.paymentInfo && test.paymentInfo.isBooked === true
          );

          // Prepare the update object
          updateObject = { labTest: getData.labTest };

          // Include additional status update if all tests are booked
          if (allTestsBooked) {
            updateObject.status = 'BOOKED';
            // updateObject.orderHistory.push(history);

          }

          await PrescribeLabTest.findOneAndUpdate(
            { _id: prescribedLabRadiologyTestId },
            {
              $set: updateObject,
            }
          );

        }
      } else {
        if (status == 'CANCELLED' || status == 'INPROGRESS' || status == 'COMPLETED') {
          const radiologyTestRecords = getData?.radiologyTest ? getData?.radiologyTest.map(val => {
            if (testResultId && testId) {
              if (val.radiologyTestId.toString() === testId) {
                val.status = 'COMPLETED'
                val.testResultId = testResultId
                val.resultType = resultType
                val.testHistory = val.testHistory.push(history)
                return val
              }
              return val
            }
            val.status = status
            val.testHistory = val.testHistory.push(history)
            return val
          }) : []
          updateObject.radiologyTest = radiologyTestRecords
        }
        if (testResultId && testId) {
          await PrescribeRadiologyTest.findOneAndUpdate(
            { _id: prescribedLabRadiologyTestId },
            {
              $set: {
                radiologyTest: updateObject.radiologyTest
              },
            }
          )
        } else {

          /* updating isbooked status for particulr test as per testId */
          labRadioTestIdArray.forEach((testId) => {
            const matchingTest = getData?.radiologyTest.find((test) => test.radiologyTestId === testId);

            if (matchingTest && matchingTest.paymentInfo && matchingTest.paymentInfo.paymentStatus === true) {
              matchingTest.paymentInfo.isBooked = true;
              matchingTest.status = 'BOOKED';
              matchingTest.testHistory.push(history);
            }
          });
          // Check if all lab tests in getData.labTest are booked
          const allTestsBooked = getData.radiologyTest.every(
            (test) => test.paymentInfo && test.paymentInfo.isBooked === true
          );

          // Prepare the update object
          updateObject = { radiologyTest: getData.radiologyTest };

          // Include additional status update if all tests are booked
          if (allTestsBooked) {
            updateObject.status = 'BOOKED';
            // updateObject.orderHistory.push(history);
          }
          await PrescribeRadiologyTest.findOneAndUpdate(
            { _id: prescribedLabRadiologyTestId },
            {
              $set: updateObject,
            }
          );
        }
      }

      return sendResponse(req, res, 200, {
        status: true,
        message: `Status updated successfully`,
        body: null,
        errorCode: null,
      });

    } catch (error) {
      console.log("updatePrescribedLabRadiologyStatus", error);
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: `failed to updating prescribed lab/radiology status`,
        errorCode: error.errorCode ? error.errorCode : "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async getPrescribedTestHistory(req, res) {
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };
      const prescribedLabRadiologyTestId = req.params.id;
      let getData
      if (req.query.serviceType == 'lab') {
        getData = await PrescribeLabTest.findById(prescribedLabRadiologyTestId).lean()
      } else {
        getData = await PrescribeRadiologyTest.findById(prescribedLabRadiologyTestId).lean()
      }
      if (!getData?.status) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "Prescribed lab/radiology not found",
          errorCode: null,
        })
      }

      const getIds = getData?.orderHistory ? getData?.orderHistory.map(val => val.updatedById) : []
      let getIds1 = []
      for (const element of getData?.[req.query.serviceType == 'lab' ? 'labTest' : 'radiologyTest']) {
        const getIds = element.testHistory ? element.testHistory.map(val => val.updatedById) : []
        getIds1 = [...getIds1, ...getIds]
      }

      const userIds = [...new Set([...getIds, ...getIds1])]
      let testHistory = []
      let orderHistory = []
      if (userIds.length > 0) {

        const getDoctorName = BasicInfo.find({ for_portal_user: { $in: userIds } })
          .select('full_name full_name_arabic for_portal_user')
        const getPatientData = getAllPatient(userIds)
        const getLabRadioData = getAllLabRadioName(headers, userIds)
        const allData = await Promise.all([getDoctorName, getPatientData, getLabRadioData])
        let getNameObject = {}

        for (const ele of allData[0]) {
          getNameObject[ele?.for_portal_user] = {
            name: ele?.full_name,
            name_arabic: ele?.full_name_arabic
          }
        }
        for (const idx in allData[1]) {
          getNameObject[idx] = {
            name: allData[1][idx]?.full_name,
            name_arabic: allData[1][idx]?.full_name_arabic
          }
        }
        for (const ele of allData[2]) {
          const centre_name_arabic = 'centre_name_arabic' in ele ? `${ele.centre_name_arabic} (Owner)` : ''
          const full_name_arabic = 'full_name_arabic' in ele ? `${ele.full_name_arabic} (Staff)` : ''
          getNameObject[ele?._id] = {
            name: 'centre_name' in ele ? `${ele.centre_name} (Owner)` : `${ele?.full_name} (Staff)`,
            name_arabic: centre_name_arabic ? centre_name_arabic : full_name_arabic ? full_name_arabic : ''
          }
        }
        orderHistory = getData.orderHistory.map(val => {
          val.name = val?.updatedById in getNameObject ? getNameObject[val?.updatedById]?.name : ''
          val.name_arabic = val?.updatedById in getNameObject ? getNameObject[val?.updatedById]?.name_arabic : ''
          return val
        })

        testHistory = getData?.[req.query.serviceType == 'lab' ? 'labTest' : 'radiologyTest'].map(ele => {
          const history = ele?.testHistory ? ele?.testHistory.map(val => {
            val.name = val?.updatedById in getNameObject ? getNameObject[val?.updatedById]?.name : ''
            val.name_arabic = val?.updatedById in getNameObject ? getNameObject[val?.updatedById]?.name_arabic : ''
            return val
          }) : []
          ele.testName = ele?.testId?.testName
          ele.testHistory = history
          delete ele.testId
          return ele
        })
      }

      return sendResponse(req, res, 200, {
        status: true,
        message: `Prescribed test history fetched successfully`,
        data: {
          testHistory,
          orderHistory,
        },
        errorCode: null,
      });

    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: `failed to fetching prescribed test history`,
        errorCode: error.errorCode ? error.errorCode : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async listofDiscountCodeUsedforEachTest(req, res) {
    try {
      const { testId, type } = req.query;

      if (!testId) {
        return sendResponse(req, res, 500, {
          status: true,
          body: {},
          message: `Please Select The Test`,
          errorCode: null,
        });
      }
      let couponCodeData = []

      const model = type === "lab" ? PrescribeLabTest : PrescribeRadiologyTest;
      const filter = { "labTest.labtestId": testId };

      const updatedResult = await model.find(filter);
      const allLabTests = updatedResult.flatMap(result => result.labTest || []);

      if (allLabTests.length > 0) {
        allLabTests.forEach((item) => {

          if (item?.paymentInfo && item?.paymentInfo?.paymentStatus === true && item?.paymentInfo?.couponCodeId) {
            let data = {
              labTestId: item?.labtestId,
              couponCode: item?.paymentInfo?.couponCode,
              couponCodeId: item?.paymentInfo?.couponCodeId
            }
            couponCodeData.push(data);
          }
        })
      }

      sendResponse(req, res, 200, {
        status: true,
        message: `Fetch Coupon Code List Per Test successfully`,
        body: {
          couponCodeData: couponCodeData
        },
        errorCode: null,
      });
    } catch (error) {
      sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: `Failed To Fetch list Per Test`,
        errorCode: error.errorCode ? error.errorCode : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /* update sttaus inprogress-complete-for-prescribed-labRadio */
  async _updatePrescribedLabRadiology_Status(req, res) {
    try {
      const {
        prescribedLabRadiologyTestId,
        type,
        status,
        testResultId,
        testId,
        resultType
      } = req.body;
      let getData
      if (type === 'lab') {
        getData = await PrescribeLabTest.findById(prescribedLabRadiologyTestId)
      } else {
        getData = await PrescribeRadiologyTest.findById(prescribedLabRadiologyTestId)
      }
      if (!getData?.status) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "Prescribed lab/radiology not found",
          errorCode: null,
        })
      }
      const date = new Date()
      let history = {
        status,
        updatedAt: date.toISOString(),
        updatedById: req?.user?.role == 'patient' ? req?.user?.portalUserId : req?.user?._id,
        role: type,
      }

      let updateObject = {
        status
      }

      if (type == 'lab') {
        if (status == 'CANCELLED' || status == 'INPROGRESS' || status == 'COMPLETED') {
          const labTestRecords = getData?.labTest ? getData?.labTest.map(val => {
            if (testResultId && testId) {
              if (val.labtestId.toString() === testId) {
                val.status = 'COMPLETED'
                val.testResultId = testResultId
                val.resultType = resultType
                val.testHistory = val.testHistory.push(history)
                return val
              }
              return val
            }
            val.status = status
            val.testHistory = val.testHistory.push(history)
            return val
          }) : []
          updateObject.labTest = labTestRecords
        }
        if (testResultId && testId) {
          await PrescribeLabTest.findOneAndUpdate(
            { _id: prescribedLabRadiologyTestId },
            {
              $set: {
                labTest: updateObject.labTest
              },
            }
          )
        }
        else {
          await PrescribeLabTest.findOneAndUpdate(
            { _id: prescribedLabRadiologyTestId },
            {
              $set: updateObject,
              $push: { orderHistory: history }
            }
          )
        }
      } else {
        if (status == 'CANCELLED' || status == 'INPROGRESS' || status == 'COMPLETED') {
          const radiologyTestRecords = getData?.radiologyTest ? getData?.radiologyTest.map(val => {
            if (testResultId && testId) {
              if (val.radiologyTestId.toString() === testId) {
                val.status = 'COMPLETED'
                val.testResultId = testResultId
                val.resultType = resultType
                val.testHistory = val.testHistory.push(history)
                return val
              }
              return val
            }
            val.status = status
            val.testHistory = val.testHistory.push(history)
            return val
          }) : []
          updateObject.radiologyTest = radiologyTestRecords
        }
        if (testResultId && testId) {
          await PrescribeRadiologyTest.findOneAndUpdate(
            { _id: prescribedLabRadiologyTestId },
            {
              $set: {
                radiologyTest: updateObject.radiologyTest
              },
            }
          )
        } else {
          await PrescribeRadiologyTest.findOneAndUpdate(
            { _id: prescribedLabRadiologyTestId },
            {
              $set: updateObject,
              $push: { orderHistory: history }
            }
          )
        }
      }

      return sendResponse(req, res, 200, {
        status: true,
        message: `Status updated successfully`,
        body: null,
        errorCode: null,
      });

    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: `failed to updating prescribed lab/radiology status`,
        errorCode: error.errorCode ? error.errorCode : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /*update-prescribed-test-array-for-external-lab/radio*/
  // Mar-12 - working
//   async updatePrescribedArrayForExternalLabs(req, res) {
//     try {
//         const { _id, formattedResults, type, labAppointmentId } = req.body;
//         let getData;
 
//         // Fetch the correct document based on type
//         if (type === 'lab') {
//             getData = await PrescribeLabTest.findById(_id);
//         } else {
//             getData = await PrescribeRadiologyTest.findById(_id);
//         }
 
//         if (!getData) {
//             return sendResponse(req, res, 404, {
//                 status: false,
//                 message: "Record not found",
//                 body: null,
//                 errorCode: "NOT_FOUND",
//             });
//         }
 
//         let updatePromises = []; // Store API requests
 
//         // Iterate over formattedResults and update the corresponding labTest object
//         formattedResults.forEach(result => {
//             getData.labTest = getData.labTest.map(test => {
//                 if (test.loinc && test.loinc.loincCode === result.serviceLOINC) {
//                     let updatedTest = {
//                         ...test,
//                         externalResults: result
//                     };
                    
//                     // Update status if resultDate is present
//                     if (result.resultDate && result.resultDate.trim() !== '') {
//                         updatedTest.status = "COMPLETED";
//                     }
//                     // Call external API to update appointment status
//                     const updateLabAppointmentStatusPromise = httpService.putStaging(
//                         "appointment/update-appointment-status-for-external-results",
//                         {
//                             appointmentId: labAppointmentId,
//                             testId: test.labtestId,
//                             externalResults: updatedTest.externalResults,
//                             status: updatedTest.status
//                         },
//                         {},
//                         "labradioServiceUrl"
//                     );
 
//                     updatePromises.push(updateLabAppointmentStatusPromise);
//                     return updatedTest;
//                 }
//                 return test;
//             });
//         });
 
//         // Execute all external API calls in parallel
//         await Promise.all(updatePromises);
 
//         // Check if all labTest items have status COMPLETED
//         const allCompleted = getData.labTest.every(test => test.status === "COMPLETED");
 
//         // If all tests are completed, update the outer status
//         if (allCompleted) {
//             getData.status = "COMPLETED";
//         }
 
//         // Save the updated document
//         await getData.save();
 
//         return sendResponse(req, res, 200, {
//             status: true,
//             message: `Status updated successfully`,
//             body: getData,
//             errorCode: null,
//         });
 
//     } catch (error) {
//         console.error("Error in updatePrescribedArrayForExternalLabs:", error);
//         return sendResponse(req, res, 500, {
//             status: false,
//             body: null,
//             message: `Failed to update prescribed lab/radiology status`,
//             errorCode: error.errorCode ? error.errorCode : "INTERNAL_SERVER_ERROR",
//         });
//     }
// }

async updatePrescribedArrayForExternalLabs(req, res) {    
  try {
      const { _id, formattedResults, type, labAppointmentId } = req.body;
      let getData;

      // Fetch the correct document based on type
      if (type === 'lab') {
          getData = await PrescribeLabTest.findById(_id);
      } else {
          getData = await PrescribeRadiologyTest.findById(_id);
      }

      if (!getData) {
          return sendResponse(req, res, 404, {
              status: false,
              message: "Record not found",
              body: null,
              errorCode: "NOT_FOUND",
          });
      }

      let updatePromises = []; // Store API requests
      let date = new Date();

      // Iterate over formattedResults and update only non-completed tests
      formattedResults.forEach(result => {
          getData.labTest = getData.labTest.map(test => {
              // Skip updating if test status is already "COMPLETED"
              if (test.status === "COMPLETED") return test;

              if (test.loinc && test.loinc.loincCode === result.serviceLOINC) {
                  test.externalResults = result;

                  // Update status if resultDate is present
                  if (result.resultDate && result.resultDate.trim() !== '') {
                      test.status = "COMPLETED";

                      let history = {
                          status: "COMPLETED",
                          updatedAt: date.toISOString(),
                          role: type,
                      };

                      // Ensure history array is updated properly
                      test.testHistory.push(history);
                  }

                  // Call external API to update appointment status
                  const updateLabAppointmentStatusPromise = httpService.putStaging(
                      "appointment/update-appointment-status-for-external-results",
                      {
                          appointmentId: labAppointmentId,
                          testId: test.labtestId,
                          externalResults: test.externalResults,
                          status: test.status
                      },
                      {},
                      "labradioServiceUrl"
                  );

                  updatePromises.push(updateLabAppointmentStatusPromise);
              }
              return test;
          });
      });

      // Execute all external API calls in parallel
      await Promise.all(updatePromises);

      // Check if all labTest items have status COMPLETED
      const allCompleted = getData.labTest.every(test => test.status === "COMPLETED");

      // If all tests are completed, update the outer status
      if (allCompleted) {
          getData.status = "COMPLETED";
      }

      // Save the updated document
      await getData.save();

      return sendResponse(req, res, 200, {
          status: true,
          message: `Status updated successfully`,
          body: getData,
          errorCode: null,
      });

  } catch (error) {
      console.error("Error in updatePrescribedArrayForExternalLabs:", error);
      return sendResponse(req, res, 500, {
          status: false,
          body: null,
          message: `Failed to update prescribed lab/radiology status`,
          errorCode: error.errorCode ? error.errorCode : "INTERNAL_SERVER_ERROR",
      });
  }
}


async getUnBookedPrescribeLabTest(req, res) {
  try {
    const {
      page,
      limit,
      patientId,
      doctorId,
      appointmentId,
      status,
      fromDate,
      toDate
    } = req.query;

    let appointmentId_filter = {};
    if (appointmentId) {
      appointmentId_filter['appointmentId'] = mongoose.Types.ObjectId(appointmentId);
    }

    let patientId_filter = {};
    if (patientId) {
      patientId_filter['patientId'] = mongoose.Types.ObjectId(patientId);
    }

    let doctorId_filter = {};
    if (doctorId) {
      doctorId_filter['doctorId'] = mongoose.Types.ObjectId(doctorId);
    }

    let status_filter = ['PENDING', 'BOOKED', 'INPROGRESS', 'COMPLETED'];
    if (status) {
      status_filter = [status];
    }

    let date_filter = {};
    if (fromDate && toDate) {
      const fromDateObj = new Date(`${fromDate} 00:00:00`);
      const toDateObj = new Date(`${toDate} 23:59:59`);
      date_filter = {
        createdAt: { $gte: fromDateObj, $lte: toDateObj }
      };
    }

    const pipeline = [
      {
        $lookup: {
          from: 'basicinfos',
          localField: "doctorId",
          foreignField: "for_portal_user",
          as: "doctordetails"
        }
      },
      {
        $unwind: {
          path: "$doctordetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          status: { $in: status_filter },
          $and: [
            appointmentId_filter,
            patientId_filter,
            doctorId_filter,
            date_filter
          ]
        }
      }
    ];

    // Filter documents where no objects in `labTest` have `paymentInfo` if status is PENDING
    if (status === 'PENDING') {
      pipeline.push({
        $addFields: {
          labTest: {
            $filter: {
              input: "$labTest",
              as: "test",
              cond: {
                $or: [
                  { $and: [{ $eq: ["$$test.status", "PENDING"] }, { $eq: [{ $ifNull: ["$$test.paymentInfo", null] }, null] }] },
                  { $and: [{ $eq: ["$$test.status", "PENDING"] }, { $ne: [{ $ifNull: ["$$test.paymentInfo", null] }, null] }] }
                ]
              }
            }
          }
        }
      });
    }

    // Lookup and Project Appointment Details
    pipeline.push(
      {
        $lookup: {
          from: 'appointments',   // Appointment collection name
          localField: 'appointmentId',  // Field in prescribeLabTest collection
          foreignField: '_id',    // Field in Appointment collection
          as: 'appointmentDetails'
        }
      },
      {
        $unwind: {
          path: "$appointmentDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          labTest: 1,
          doctorId: 1,
          patientId: 1,
          appointmentId: 1,
          eSignature: 1,
          status: 1,
          doctorName: "$doctordetails.full_name",
          doctorNameArabic: "$doctordetails.full_name_arabic",
          createdAt: 1,
          appointment_id: "$appointmentDetails.appointment_id",
          consultationDate: "$appointmentDetails.consultationDate",
          consultationTime: "$appointmentDetails.consultationTime",
          appointmentStatus: "$appointmentDetails.status"
        }
      },
      {
        $sort: {
          createdAt: -1
        }
      }
    );

    if (limit != 0) {
      pipeline.push({
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
      });
    }

    const result = await PrescribeLabTest.aggregate(pipeline);
    let totalCount = limit == 0 ? result.length : 0;
    if (limit != 0 && result[0].totalCount.length > 0) {
      totalCount = result[0].totalCount[0].count;
    }

    const resultArray = limit == 0 ? result : result[0].paginatedResults;
    const idsArray = resultArray.map(val => val.patientId.toString());
    const userIds = [...new Set(idsArray)];
    const getPatientData = await getAllPatient(userIds);

    for (let index = 0; index < resultArray.length; index++) {
      const element = resultArray[index];
      element.patientName = getPatientData[element?.patientId]?.full_name;
      element.patientNameArabic = getPatientData[element?.patientId]?.full_name_arabic || "";
      element.patientMRNNumber = getPatientData[element?.patientId]?.mrn_number || "";
    }

    
    return sendResponse(req, res, 200, {
      status: true,
      message: `Data fetched successfully`,
      body: {
        totalPages: limit != 0 ? Math.ceil(totalCount / limit) : 1,
        currentPage: page,
        totalRecords: totalCount,
        result: resultArray
      },
      errorCode: null,
    });

  } catch (error) {
    console.log("getPrescribeLabTest", error);

    return sendResponse(req, res, 500, {
      status: false,
      body: null,
      message: `Failed to fetch prescribed lab tests`,
      errorCode: error.errorCode ? error.errorCode : "INTERNAL_SERVER_ERROR",
    });
  }
}


async getUnBookedPrescribeRadiologyTest(req, res) {
  try {
    const {
      page,
      limit,
      patientId,
      doctorId,
      appointmentId,
      status,
      fromDate,
      toDate
    } = req.query;

    let appointmentId_filter = {};
    if (appointmentId) {
      appointmentId_filter['appointmentId'] = mongoose.Types.ObjectId(appointmentId);
    }

    let patientId_filter = {};
    if (patientId) {
      patientId_filter['patientId'] = mongoose.Types.ObjectId(patientId);
    }

    let doctorId_filter = {};
    if (doctorId) {
      doctorId_filter['doctorId'] = mongoose.Types.ObjectId(doctorId);
    }

    let status_filter = ['PENDING', 'BOOKED', 'INPROGRESS', 'COMPLETED'];
    if (status) {
      status_filter = [status];
    }

    let date_filter = {};
    if (fromDate && toDate) {
      const fromDateObj = new Date(`${fromDate} 00:00:00`);
      const toDateObj = new Date(`${toDate} 23:59:59`);
      date_filter = {
        createdAt: { $gte: fromDateObj, $lte: toDateObj }
      };
    }

    const pipeline = [
      {
        $lookup: {
          from: 'basicinfos',
          localField: 'doctorId',
          foreignField: 'for_portal_user',
          as: 'doctordetails'
        }
      },
      {
        $unwind: {
          path: '$doctordetails',
          preserveNullAndEmptyArrays: true,
        }
      },
      {
        $match: {
          status: { $in: status_filter },
          $and: [
            appointmentId_filter,
            patientId_filter,
            doctorId_filter,
            date_filter
          ]
        }
      }
    ];

    if (status === 'PENDING') {
      pipeline.push({
        $addFields: {
          radiologyTest: {
            $filter: {
              input: "$radiologyTest",
              as: "test",
              cond: {
                $and: [
                  {
                    $or: [
                      { $eq: ["$$test.status", "PENDING"] },
                      { $not: { $ifNull: ["$$test.status", false] } }
                    ]
                  },
                  {
                    $or: [
                      { $eq: [{ $ifNull: ["$$test.paymentInfo", null] }, null] },
                      { $ne: [{ $ifNull: ["$$test.paymentInfo", null] }, null] }
                    ]
                  }
                ]
              }
            }
          }
        }
      });
    }
    
    

    pipeline.push(
      {
        $lookup: {
          from: 'appointments',
          localField: 'appointmentId',
          foreignField: '_id',
          as: 'appointmentDetails'
        }
      },
      {
        $unwind: {
          path: '$appointmentDetails',
          preserveNullAndEmptyArrays: true,
        }
      },
      {
        $project: {
          _id: 1,
          radiologyTest: 1,
          doctorId: 1,
          patientId: 1,
          appointmentId: 1,
          eSignature: 1,
          status: 1,
          doctorName: '$doctordetails.full_name',
          doctorNameArabic: '$doctordetails.full_name_arabic',
          createdAt: 1,
          appointment_id: '$appointmentDetails.appointment_id',
          consultationDate: '$appointmentDetails.consultationDate',
          consultationTime: '$appointmentDetails.consultationTime',
          appointmentStatus: '$appointmentDetails.status'
        }
      },
      {
        $sort: {
          createdAt: -1
        }
      }
    );

    if (limit != 0) {
      pipeline.push({
        $facet: {
          totalCount: [
            { $count: 'count' }
          ],
          paginatedResults: [
            { $skip: (page - 1) * limit },
            { $limit: limit * 1 }
          ]
        }
      });
    }

    const result = await PrescribeRadiologyTest.aggregate(pipeline);
    let totalCount = limit == 0 ? result.length : 0;
    if (limit != 0 && result[0].totalCount.length > 0) {
      totalCount = result[0].totalCount[0].count;
    }

    const resultArray = limit == 0 ? result : result[0].paginatedResults;
    const idsArray = resultArray.map(val => val.patientId.toString());
    const userIds = [...new Set(idsArray)];
    const getPatientData = await getAllPatient(userIds);

    for (let index = 0; index < resultArray.length; index++) {
      const element = resultArray[index];
      element.patientName = getPatientData[element?.patientId]?.full_name;
      element.patientNameArabic = getPatientData[element?.patientId]?.full_name_arabic || '';
      element.patientMRNNumber = getPatientData[element?.patientId]?.mrn_number || '';
    }

    return sendResponse(req, res, 200, {
      status: true,
      message: 'Data fetched successfully',
      body: {
        totalPages: limit != 0 ? Math.ceil(totalCount / limit) : 1,
        currentPage: page,
        totalRecords: totalCount,
        result: resultArray
      },
      errorCode: null,
    });

  } catch (error) {
    console.log('getUnBookedPrescribeRadiologyTest', error);

    return sendResponse(req, res, 500, {
      status: false,
      body: null,
      message: 'Failed to fetch prescribed radiology tests',
      errorCode: error.errorCode ? error.errorCode : 'INTERNAL_SERVER_ERROR',
    });
  }
}


async prescribedLabRadio_update_statusHistory_forEachTest(req, res) {
  try {
    const { prescribedLabRadiologyTestId, type, status, testIds } = req.body;
    let getData;

    if (type === 'lab') {
      getData = await PrescribeLabTest.findById(prescribedLabRadiologyTestId);
    } else {
      getData = await PrescribeRadiologyTest.findById(prescribedLabRadiologyTestId);
    }

    if (!getData) {
      return sendResponse(req, res, 200, { 
        status: false, 
        message: "Prescribed lab/radiology not found",
        body: null,
        errorCode: null, 
      });
    }

    const date = new Date();
    const history = {
      status,
      updatedAt: date.toISOString(),
      updatedById: req?.user?.role === 'patient' ? req?.user?.portalUserId : req?.user?._id,
      role: type,
    };

    let allStatuses = [];

    if (type === 'lab') {
      getData.labTest = getData.labTest.map((val) => {
        if (testIds.includes(val.labtestId.toString())) {
          if (val.status !== 'COMPLETED') {
            val.status = status;
            val.testHistory.push(history);
          }
        }
        allStatuses.push(val.status);
        return val;
      });
    } else {
      getData.radiologyTest = getData.radiologyTest.map((val) => {
        if (testIds.includes(val.radiologyTestId.toString())) {
          if (val.status !== 'COMPLETED') {
            val.status = status;
            val.testHistory.push(history);
          }
        }
        allStatuses.push(val.status);
        return val;
      });
    }

    if (status === 'COMPLETED' && allStatuses.every((val) => val === 'COMPLETED')) {
      getData.status = 'COMPLETED';
      getData.orderHistory.push(history);
    } 
    // else if (allStatuses.includes('INPROGRESS') || allStatuses.includes('CANCELLED')) {
    //   getData.status = allStatuses.includes('INPROGRESS') ? 'INPROGRESS' : 'CANCELLED';
    // }

    await getData.save();

    return sendResponse(req, res, 200, {
      status: true,
      message: "Status updated successfully",
      body: null,
      errorCode: null,
    });
  } catch (error) {
    return sendResponse(req, res, 500, { 
      status: false, 
      message: "Failed to update status", 
      errorCode: error.message 
    });
  }
}

async getPrescribeLabRadioTest(req, res) {
  try {
    const headers = {
      Authorization: req.headers["authorization"],
    };
    const prescribedLabRadiologyTestId = req.params.id;
    const serviceType = req.query.serviceType;
    let getData;
    if (serviceType == 'lab') {
      getData = await PrescribeLabTest.findById(mongoose.Types.ObjectId(prescribedLabRadiologyTestId)).lean()
    } else {
      getData = await PrescribeRadiologyTest.findById(mongoose.Types.ObjectId(prescribedLabRadiologyTestId)).lean()
    }
    
    if (!getData?.status) {
      return sendResponse(req, res, 200, {
        status: false,
        body: null,
        message: "Prescribed lab/radiology not found",
        errorCode: null,
      })
    }

    return sendResponse(req, res, 200, {
      status: true,
      message: `Prescribed test fetched successfully`,
      data: getData,
      errorCode: null,
    });

  } catch (error) {
    console.log(error);
    return sendResponse(req, res, 500, {
      status: false,
      body: null,
      message: `failed to fetching prescribed test`,
      errorCode: error.errorCode ? error.errorCode : "INTERNAL_SERVER_ERROR",
    });
  }
}

}

module.exports = new PatientClinicalInfoController()