import mongoose from "mongoose";
import Appointment from "../models/appointment";
import TestResult from "../models/test_results";
import LabTest from "../models/lab_test.models";
import RadiologyTest from "../models/lab_test.models";
import LocationInfo from "../models/location_info";
import PortalUser from "../models/portal_user";
import { config, messages } from "../config/constants";
import { sendResponse } from "../helpers/transmission";
import {
  generateSequenceNumber,
  generateToken,
  getDifferenceInDays,
} from "../middleware/utils";
import Http from "../helpers/httpservice";
import { generateSignedUrl, uploadSingleOrMultipleDocuments } from "../helpers/gcs";
import { sendNotification } from "../helpers/notification";
import axios from "axios";
import BasicInfo from "../models/basic_info";
import { sendSms } from "../middleware/sendSms";
import { sendPushNotification } from "../helpers/firebase_notification";
const moment = require('moment-timezone');
const httpService = new Http();

const requestBody = {
  username: config.ALBORGE.username,
  password: config.ALBORGE.password,
  clientCode: config.ALBORGE.clientCode,
};

const generateTokenForLabTest = async (requestBody) => {
  const apiUrl = config.ALBORGE.generateToken_API;
  try {
    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.log("Alborge Lab Token Creation Error >>>>>>>>>>>>", error.message);
    throw error.response ? error.response.data : error.message;
  }
};

const addRegistration = async (token, registrationData) => {
  const apiUrl = config.ALBORGE.addRegistration_API;
  console.log("Alborge addRegistration", apiUrl, "==", registrationData);
  try {
    const response = await axios.post(apiUrl, registrationData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.log("Error while addRegistration >>>>>>>>>>>>", error);
    return error.response ? error.response.data : error.message;
  }
};

const getOrderResult = async (token, accession, orderId) => {
  let accessionNumber;
  if (accession) {
    accessionNumber = accession;
  } else {
    const getAppointment = await Appointment.findOne({ "appointment_id": orderId });
    if (getAppointment) {
      accessionNumber = getAppointment?.registrationData?.[0]?.accessionNumber;
    }
  }
  const apiUrl = config.ALBORGE.getResultLink_API.replace("{{accessionNumber}}", accessionNumber);

  try {
    const response = await axios.get(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.log("Alborge Lab getOrderResult Error >>>>>>>>>>>>", error.message);
    return error.response ? error.response.data : error.message;
  }
};

const responseFormation = async (results, appointmentId) => {
  try {
    const token = generateToken({ role: 'superadmin' })
    const headers = {
      Authorization: 'Bearer ' + token,
    };
    const formattedResults = results.flatMap(result =>
      result.services.map(service => ({
        ...service,
        reportName: result.reportName,
        link: result.link,
        isReviewed: result.isReviewed
      }))
    );

    const getAppointment = await Appointment.findById({ _id: appointmentId });

    await httpService.putStaging(
      "patient-clinical-info/update-prescribed-test-array",
      { _id: getAppointment?.prescribedLabRadiologyTestId, formattedResults: formattedResults, type: getAppointment?.serviceType, labAppointmentId: getAppointment?._id },
      headers,
      "doctorServiceUrl"
    );

  } catch (e) {
    console.log("responseFormation", e);

  }

}

function generateTimeSlots(startTime, endTime, slotInterval) {
  const startHour = parseInt(startTime.slice(0, 2));
  const startMinute = parseInt(startTime.slice(2));
  const endHour = parseInt(endTime.slice(0, 2));
  const endMinute = parseInt(endTime.slice(2));

  let slots = [];
  let currentHour = startHour;
  let currentMinute = startMinute;

  while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
    let nextHour = currentHour;
    let nextMinute = currentMinute + slotInterval;

    if (nextMinute >= 60) {
      nextMinute -= 60;
      nextHour++;
    }
    let slotStart = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    let slotEnd = `${String(nextHour).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`;

    slots.push({
      slot: `${slotStart}-${slotEnd}`,
      status: 0
    });

    currentHour = nextHour;
    currentMinute = nextMinute;
  }

  return slots;
}
const getAllDoctor = (paginatedResults, headers) => {
  return new Promise(async (resolve, reject) => {
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
    resolve(doctorDetails)
  })
}
const getAllPatient = (paginatedResults, ids = []) => {
  return new Promise(async (resolve, reject) => {
    const patientIdsArray = ids && ids.length > 0 ? ids : paginatedResults.map(val => val.patientId)
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

/** 
 * 
 * 1: We have two types of refund: "Refund" and "Void payment" The maximum duration for "Refund" is within 30 days from the transaction date. As for "Void payment " the timeframe ranges from one hour to a maximum of two hours to cancel the transaction and refund the amount to your customer.
 * 2: Yes, there are fees for processing refunds, and they are specified in the contract you have with Moyasar.
 * 
 */
const initiateRefund = async (getAppointment, testName) => {
  try {
    const token = generateToken({ role: 'superadmin' });
    const serviceType = getAppointment?.serviceType;
    const headers = {
      Authorization: 'Bearer ' + token,
    };

    if (getAppointment?.prescribedLabRadiologyTestId) {
      const findLabRadioPrescriptions = await httpService.getStaging(
        `patient-clinical-info/get_prescribed_labradio_test/${getAppointment?.prescribedLabRadiologyTestId}`,
        { serviceType: getAppointment?.serviceType },
        headers,
        "doctorServiceUrl"
      );

      const testIds = serviceType == 'lab'? getAppointment?.labTestIds : getAppointment?.radiologyTestIds;
      const cancelledIds = testIds
        .filter(test => test.status === "CANCELLED")
        .map(test => test.testId?.toString());

      const labRadioTests = serviceType == 'lab'? findLabRadioPrescriptions?.data?.labTest: findLabRadioPrescriptions?.data?.radiologyTest;
      let matchedTests;
      if(serviceType == 'lab'){
        matchedTests = labRadioTests.filter(test => cancelledIds.includes(test.labtestId));
      }else{
        matchedTests = labRadioTests.filter(test => cancelledIds.includes(test.radiologyTestId));
      }
      
      const refundedPaymentIds = new Set();
      // Loop through matched cancelled tests and trigger refund
      for (const test of matchedTests) {
        const paymentInfo = test?.paymentInfo;
        const paymentId = paymentInfo?.paymentId;

        if (paymentInfo?.paymentStatus && paymentId && !refundedPaymentIds.has(paymentId)) {

          try {
            const getData = await axios.get(`https://api.moyasar.com/v1/payments/${paymentId}`, {
              auth: {
                username: config.MOYASAR_SECRET_KEY,
                password: ''
              }
            })

            if (getData && getData?.data?.amount) {
              const amount = getData?.data?.amount; // testPrice is usually a string

              const refunResponse = await axios.post(
                `https://api.moyasar.com/v1/payments/${paymentId}/refund`,
                {
                  amount: amount
                },
                {
                  auth: {
                    username: config.MOYASAR_SECRET_KEY,
                    password: '' // Moyasar uses empty string as password
                  }
                }
              );

              if (refunResponse?.data?.status === "refunded") {
                console.log(`Refund successful for paymentId: ${paymentId}`, refunResponse.data);
                refundedPaymentIds.add(paymentId);
                await httpService.putStaging(
                  "payment/update-purchase-history",
                  {
                    refundedInfo: refunResponse.data,
                    paymentId: paymentId
                  },
                  headers,
                  "patientServiceUrl"
                );

                let paramsDataPatient = {
                  sendTo: 'patient',
                  madeBy: getAppointment?.serviceType == 'lab' ? 'laboratory' : 'radiology',
                  patientId: getAppointment?.patientId,
                  doctorId: getAppointment?.doctorId,
                  labRadiologyId: getAppointment?.labRadiologyId,
                  appointment: {
                    _id: getAppointment?._id
                  },
                  consultationDate: getAppointment?.consultationDate,
                  consultationTime: getAppointment?.consultationTime,
                  condition: "CANCELLED_LABRADIO_APPOINTMENT",
                  notification: ['sms', 'push_notification'],
                  testName: testName.join(', ')
                }
                sendNotification(paramsDataPatient, headers)
              }
            }

          } catch (refundError) {
            console.error(`Refund failed for paymentId: ${paymentId}`, refundError.response?.data || refundError.message);
          }
        } else if (refundedPaymentIds.has(paymentId)) {
          console.log(`PaymentId: ${paymentId} already refunded, skipping duplicate.`);
        } else {
          console.warn(`Missing or invalid payment info for testId: ${test.labtestId}`);
        }
      }
    }
  } catch (e) {
    console.log("initiateRefund failed", e);
  }
};


const notificationSaved = (paramsData, headers, requestData) => {
  return new Promise(async (resolve, reject) => {
    try {
      let endPoint = ''
      let serviceUrl = ''
      if (paramsData?.sendTo == 'patient') {
        endPoint = "patient/notification"
        serviceUrl = 'patientServiceUrl'
      }
      if (paramsData?.sendTo == 'doctor') {
        endPoint = "doctor2/notification"
        serviceUrl = 'doctorServiceUrl'
      }
      if (endPoint && serviceUrl) {
        await httpService.postStaging(endPoint, requestData, headers, serviceUrl);
      }
      resolve(true)
    } catch (error) {
      console.error("An error occurred:", error);
      resolve(false)
    }
  })
}

const notifyUsers = async (element) => {
  try {
    const patientId = element.patientId;
    const doctorId = element.doctorId;
    const orderId = element.orderId;
    const appoiintmentId = element.appointment_id;
    const labRadiologyId = element.labRadiologyId;
    const token = generateToken({ role: 'superadmin' })
    const headers = {
      Authorization: 'Bearer ' + token,
    };
    const findPatient = await httpService.getStaging("patient/get-portal-data", { data: patientId }, headers, "patientServiceUrl");
    const findDoctor = await httpService.getStaging("doctor/get-doctor-portal-data", { doctorId: doctorId }, headers, "doctorServiceUrl");
    const getSMSContent = await httpService.getStaging('superadmin/get-notification-by-condition', { condition: 'RESULT_RECEIVED', type: 'sms' }, headers, 'superadminServiceUrl');

    let contentData;
    let patintNotify;
    let doctorNotify;
    let doctor = {
      name: findDoctor?.body?.full_name,
      mobile: findDoctor?.body?.country_code + "" + findDoctor?.body?.mobile
    }
    let patient = {
      name: findPatient?.data?.[0]?.full_name,
      mobile: findPatient?.data?.[0]?.country_code + "" + findPatient?.data?.[0]?.mobile,
      deviceToken: findPatient?.data?.[0]?.deviceToken
    }
    if (getSMSContent?.status) {
      contentData = getSMSContent?.data?.[0]?.content;
      contentData
        .replace(/{{name}}/g, patient?.name)
        .replace(/{{appointment_id}}/g, orderId);

      doctorNotify = contentData
        .replace(/{{name}}/g, doctor?.name)
        .replace(/{{appointment_id}}/g, orderId);

      patintNotify = contentData
        .replace(/{{name}}/g, patient?.name)
        .replace(/{{appointment_id}}/g, orderId);
    }

    sendSms(doctor.mobile, doctorNotify);
    sendSms(patient.mobile, patintNotify);

    const notificationData = {
      title: getSMSContent?.data?.[0]?.notification_title,
      body: patintNotify
    }
    if (patient.deviceToken && patient.deviceToken.length && patient?.notification == true) {
      sendPushNotification(patient.deviceToken, notificationData);
    }


    if (patintNotify) {
      const isDependent = findPatient?.data[0]?.isDependent === true;
      const forPortalUser = isDependent ? findPatient?.data[0]?.parent_userid : patientId;

      const paramsData = { sendTo: 'patient' };
      const requestData = {
        created_by_type: 'lab',
        created_by: labRadiologyId,
        content: patintNotify,
        url: "",
        for_portal_user: forPortalUser,
        title: getSMSContent?.data[0]?.notification_title,
        appointmentId: appoiintmentId,
      };

      await notificationSaved(paramsData, headers, requestData);
    }

    if (doctorNotify) {
      let paramsData = { sendTo: 'doctor' }
      const requestData = {
        created_by_type: 'lab',
        created_by: labRadiologyId,
        content: doctorNotify,
        url: "",
        for_portal_user: doctorId,
        title: getSMSContent?.data?.[0]?.notification_title,
        appointmentId: appoiintmentId,
      };

      await notificationSaved(paramsData, headers, requestData);

    }
  } catch (error) {
    console.error("Error in notifyUsers:", error);
  }
}

//Apr 2 
const registerPatientInBackground = async (appointmentDetail, userDetail, portalDetails, servicesList, requestBody, headers, patientId, labRadiologyId, serviceType) => {
  try {
    const getPortalData = await PortalUser.findOne({ _id: labRadiologyId }).lean();

    // if(getPortalData?.identifier?.branchKey === "alborg" && getPortalData?.identifier?.branchCode){
    if (true) {
      const isTokengenerated = await generateTokenForLabTest(requestBody);
      if (!isTokengenerated.isSuccess) {
        console.log("Failed To Generate The Token");
        httpService.postStaging(
          "superadmin/add-logs",
          {
            userId: patientId,
            userName: userDetail.full_name,
            role: 'patient',
            action: `alborg`,
            actionDescription: `Token Generation failed`,
            metadata: {
              "orderID": appointmentDetail.appointment_id,
              "registrationDate": new Date().toISOString(),
              "branchCode": getPortalData?.identifier?.branchCode,
              "servicesList": servicesList,
              "labRadiologyId": labRadiologyId
            }
          },
          {},
          "superadminServiceUrl"
        );
        return;
      }

      let token = isTokengenerated.data.token;
      const countryCode = portalDetails?.portalUserDetails?.country_code;
      const mobile = portalDetails?.portalUserDetails?.mobile;
      const isDependent = portalDetails?.portalUserDetails?.isDependent;
      const cleanedCountryCode = countryCode ? countryCode.replace('+', '') : '';
      const patientNum = userDetail?.saudi_id || userDetail?.iqama_number || null;

      let registrationData = {
        "orderID": appointmentDetail.appointment_id,
        "patientDemographics": {
          "patientName": userDetail.full_name,
          "dateOfBirth": new Date(userDetail.dob).toISOString().split('T')[0],
          "sex": userDetail.gender
        },
        "registrationDate": new Date().toISOString(),
        "branchCode": config.ALBORGE.branchCode,
        // "branchCode": getPortalData?.identifier?.branchCode,
        "payerCode": config.ALBORGE.payerCode,
        "contractCode": config.ALBORGE.contractCode,
        "servicesList": servicesList
      };

      if (patientNum) {
        registrationData.patientDemographics.patientNumber = patientNum;
      }
      if (mobile) {
        registrationData.patientDemographics.patientPhoneCountryCode = cleanedCountryCode;
        registrationData.patientDemographics.patientPhone = mobile;
      }

      const registerUserToAlborgLaboratories = await addRegistration(token, registrationData);
      if (!registerUserToAlborgLaboratories.isSuccess) {
        console.log("Error while storing the registration data into the Alborg Laboratory");
        httpService.postStaging(
          "superadmin/add-logs",
          {
            userId: patientId,
            userName: userDetail.full_name,
            role: 'patient',
            action: `alborg`,
            actionDescription: `Registration failed`,
            metadata: {
              "orderID": appointmentDetail.appointment_id,
              "registrationDate": new Date().toISOString(),
              "branchCode": config.ALBORGE.branchCode,
              // "branchCode": getPortalData?.identifier?.branchCode,
              "servicesList": servicesList,
              "labRadiologyId": labRadiologyId
            }
          },
          {},
          "superadminServiceUrl"
        );
        return;
      }

      console.log(registerUserToAlborgLaboratories.data, "registerUserToAlborgLaboratories.data");
      await Appointment.updateOne(
        { appointment_id: appointmentDetail.appointment_id },
        { $push: { registrationData: registerUserToAlborgLaboratories.data } }
      );

      let paramsData = {
        sendTo: 'patient',
        madeBy: serviceType === 'lab' ? 'laboratory' : 'radiology',
        patientId: isDependent ? portalDetails?.portalUserDetails?.parent_userid : patientId,
        // doctorId,
        labRadiologyId,
        appointment: {
          _id: appointmentDetail?.appointment_id
        },
        condition: 'REGISTERED_EXTERNAL_LAB',
        notification: ['push_notification', 'sms'],
        accessionNumber: registerUserToAlborgLaboratories?.data?.accessionNumber,
        order_number: appointmentDetail?.appointment_id
      }

      sendNotification(paramsData, headers)
    }
  } catch (error) {
    console.log("Error in alborg patient registration:", error);
    httpService.postStaging(
      "superadmin/add-logs",
      {
        userId: patientId,
        userName: userDetail.full_name,
        role: 'patient',
        action: `alborg`,
        actionDescription: `Error in alborg patient registration:`,
        metadata: {
          "orderID": appointmentDetail.appointment_id,
          "registrationDate": new Date().toISOString(),
          "branchCode": config.ALBORGE.branchCode,
          // "branchCode": getPortalData?.identifier?.branchCode,
          "servicesList": servicesList,
          "labRadiologyId": labRadiologyId
        }
      },
      {},
      "superadminServiceUrl"
    );
  }
};

const updatePrescribedStatusInBackground = async (prescribedLabRadiologyTestId, serviceType, testIdsArray, headers) => {
  try {
    await httpService.putStaging(
      "patient-clinical-info/update-prescribed-lab-radiology-status",
      { prescribedLabRadiologyTestId, type: serviceType, status: 'BOOKED', labRadioTestIdArray: testIdsArray },
      headers,
      "doctorServiceUrl"
    );
  } catch (error) {
    console.log("Error updating prescribed lab/radiology status:", error);
  }
};

class AppointmentController {

  async mostFrequentlyPerformedTest(req, res) {
    try {
      const { type, labRadiologyId } = req.query
      if (!labRadiologyId) {
        return sendResponse(req, res, 500, {
          status: true,
          body: {},
          message: `Please Select The Center Name`,
          errorCode: null,
        });
      }
      const testList = await Appointment.find({ status: "COMPLETED", labRadiologyId: mongoose.Types.ObjectId(labRadiologyId) })

      const allLabTestIds = testList.flatMap(test => test.labTestIds || []);

      const testIdFrequency = allLabTestIds.reduce((acc, item) => {
        const { testId } = item;
        if (testId) {
          acc[testId] = (acc[testId] || 0) + 1;
        }
        return acc;
      }, {});
      const testIdCounts = Object.entries(testIdFrequency).map(([testId, count]) => ({
        testId,
        count,
      }));
      testIdCounts.sort((a, b) => b.count - a.count);
      let testDetail;
      if (type === "lab") {
        testDetail = await LabTest.findById(testIdCounts[0].testId)
      } else {
        testDetail = await RadiologyTest.findById(testIdCounts[0].testId)
      }
      return sendResponse(req, res, 200, {
        status: true,
        body: {
          mostPerformedTest: testDetail,
          mostPerformedTestCount: testIdCounts[0].count
        },
        message: `Successfully fetch the details`,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `failed to fetch the details`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async totalEachTestPerformedPerCenter(req, res) {
    try {
      const { type, labRadiologyId } = req.query

      if (!labRadiologyId) {
        return sendResponse(req, res, 500, {
          status: true,
          body: {},
          message: `Please Select The Center Name`,
          errorCode: null,
        });
      }
      const testList = await Appointment.find({ status: "COMPLETED", labRadiologyId: mongoose.Types.ObjectId(labRadiologyId) })

      const allLabTestIds = testList.flatMap(test => test.labTestIds || []);

      const testIdFrequency = allLabTestIds.reduce((acc, item) => {
        const { testId } = item;
        if (testId) {
          acc[testId] = (acc[testId] || 0) + 1;
        }
        return acc;
      }, {});
      let testIdCounts = Object.entries(testIdFrequency).map(([testId, count]) => ({
        testId,
        count,
      }));
      testIdCounts.sort((a, b) => b.count - a.count);
      if (type === "Laboratory") {
        const updatedTestIdCounts = await Promise.all(
          testIdCounts.map(async (item) => {
            const testDetail = await LabTest.findById(item.testId).select("testName")
            return { ...item, testDetail };
          })
        );
        testIdCounts = updatedTestIdCounts;
      } else {
        const updatedTestIdCounts = await Promise.all(
          testIdCounts.map(async (item) => {
            const testDetail = await RadiologyTest.findById(item.testId).select("testName")
            return { ...item, testDetail };
          })
        );
        testIdCounts = updatedTestIdCounts;
      }
      if (testIdCounts.length === 0) {
        return sendResponse(req, res, 200, {
          status: false,
          body: {
            totalEachTestPerformedPerCenter: []
          },
          message: `No Data Exist!`,
          errorCode: null,
        });
      }
      return sendResponse(req, res, 200, {
        status: true,
        body: {
          totalEachTestPerformedPerCenter: testIdCounts
        },
        message: `Successfully fetch the details`,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `failed to fetch the details`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async mostUsedCenter(req, res) {
    try {
      // const { labRadiologyId } = req.query;
      //Most Lab RadioCenter
      const labApptList = await Appointment.find({ serviceType: "lab" });
      const labIdFrequency = labApptList.reduce((acc, test) => {
        const { labRadiologyId } = test;
        if (labRadiologyId) {
          if (!acc[labRadiologyId]) {
            acc[labRadiologyId] = { labRadiologyId, count: 0 };
          }
          acc[labRadiologyId].count += 1;
        }
        return acc;
      }, {});
      let mostUsedLabCenter = Object.values(labIdFrequency).sort((a, b) => b.count - a.count);

      const mostUsedLabCenterDetails = await PortalUser.findById(mostUsedLabCenter[0].labRadiologyId)
        .select("centre_name centre_name_arabic");
      mostUsedLabCenter[0].mostUsedLabCenterDetails = mostUsedLabCenterDetails

      //Most Used RadioCenter
      const radioApptList = await Appointment.find({ serviceType: "radiology" });
      const radiologyIdFrequency = radioApptList.reduce((acc, test) => {
        const { labRadiologyId } = test;
        if (labRadiologyId) {
          if (!acc[labRadiologyId]) {
            acc[labRadiologyId] = { labRadiologyId, count: 0 };
          }
          acc[labRadiologyId].count += 1;
        }
        return acc;
      }, {});
      let mostUsedRadioCenter = Object.values(radiologyIdFrequency).sort((a, b) => b.count - a.count);

      const mostUsedRadioCenterDetails = await PortalUser.findById(mostUsedRadioCenter[0].labRadiologyId)
        .select("centre_name centre_name_arabic");
      mostUsedRadioCenter[0].mostUsedRadioCenterDetails = mostUsedRadioCenterDetails

      return sendResponse(req, res, 200, {
        status: true,
        body: {
          mostUsedLabCenter: mostUsedLabCenter[0],
          mostUsedRadioCenter: mostUsedRadioCenter[0]
        },
        message: `Successfully fetched the details`,
        errorCode: null,
      });
    } catch (error) {
      console.error("Error: while fetching the details", error);
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `Failed to fetch the details`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async labRadiologySlot(req, res) {
    try {
      const { date } = req.query
      const newDate = moment(date).tz(config.TIMEZONE)
      const slotInterval = 60

      //Generate all slots for respected day
      const startTime = '0900';
      const endTime = '2000';
      const timeSlots = generateTimeSlots(startTime, endTime, parseInt(slotInterval));
      let allSlots = [...timeSlots]

      //Remove slot if the requested date is current date and the time is past time
      const currentDate = moment().tz(config.TIMEZONE)
      if (currentDate.unix() > newDate.unix()) {
        const currentHour = String(currentDate.hours()).padStart(2, '0');
        const currentMinute = String(currentDate.minutes()).padStart(2, '0');
        const currentTime = `${currentHour}${currentMinute}`;
        // const currentTime = `${currentDate.hours()}${currentDate.minutes()}`
        const filterTime = allSlots.filter(slots => {
          const slotStartTime = slots.slot.split('-')[0]?.replace(':', '')
          return slotStartTime > currentTime
        })
        allSlots = filterTime
      }

      return sendResponse(req, res, 200, {
        status: true,
        body: {
          allAvailableSlots: allSlots,
        },
        message: `Successfully get time slot`,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `failed to get time slot`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async bookAppointment(req, res) {
    const headers = {
      Authorization: req.headers["authorization"],
    };
    try {
      const {
        consultationDate,
        consultationTime,
        consultationFor,
        patientId,
        doctorId,
        labRadiologyId,
        patient_document_details,
        serviceType,
        labTestIds,
        radiologyTestIds,
        parentAppointmentId,
        parent_patient_id,
        prescribedLabRadiologyTestId,
      } = req.body;

      //Get patient subscription details and prevent them to book an appointment if consultation count is 0
      const getData = await httpService.getStaging(`patient/get-patient-subscription-details/${patientId}`, {}, headers, 'patientServiceUrl');
      if (!getData.status) {
        return sendResponse(req, res, 500, {
          status: false,
          body: null,
          message: getData.message,
          errorCode: null,
        })
      }

      const requestedDate = moment(`${consultationDate} ${consultationTime.split('-')[0]}:00`)
      const currentDate = moment()
      if (requestedDate.unix() < currentDate.unix()) {
        return sendResponse(req, res, 200, {
          status: false,
          message: "You can't book appointment for previous datetime",
          body: null,
          errorCode: null,
        });
      }
      const date = new Date()
      let history = {
        status: 'PENDING',
        updatedAt: date.toISOString(),
        updatedById: req?.user?.portalUserId,
        role: 'patient',
      }
      const labTestRecords = labTestIds ? labTestIds.map(id => {
        return {
          testId: id,
          testHistory: [history]
        }
      }) : []
      const radiologyTestRecords = radiologyTestIds ? radiologyTestIds.map(id => {
        return {
          testId: id,
          testHistory: [history]
        }
      }) : []

      const appointmentData = new Appointment({
        appointment_id: await generateSequenceNumber(),
        consultationDate,
        consultationTime,
        consultationFor,
        patientId,
        doctorId,
        labRadiologyId,
        parentAppointmentId,
        labTestIds: labTestRecords,
        radiologyTestIds: radiologyTestRecords,
        serviceType,
        created_by: req?.user?.portalUserId,
        patient_document_details,
        parent_patient_id,
        prescribedLabRadiologyTestId,
        orderHistory: [history],
        status: "APPROVED"
      });
      const appointmentDetail = await appointmentData.save();

      let servicesList = [];
      if (serviceType === "lab" && labTestIds.length > 0) {
        const tests = await Promise.all(labTestIds.map((id) => LabTest.findById(id)));
        tests.forEach((test) => {
          if (test?.loinc?.loincCode) {
            servicesList.push({ LoincCode: test.loinc.loincCode });
          }
        });
      } else if (serviceType === "radiology" && radiologyTestIds.length > 0) {
        const tests = await Promise.all(radiologyTestIds.map((id) => RadiologyTest.findById(id)));
        tests.forEach((test) => {
          if (test?.loinc?.loincCode) {
            servicesList.push({ LoincCode: test.loinc.loincCode });
          }
        });
      }
      const getPatientDetails = await httpService.getStaging(
        "patient/patient-details",
        { patient_id: patientId },
        headers,
        "patientServiceUrl"
      );
      const userDetail = getPatientDetails.body.personalDetails;
      const portalDetails = getPatientDetails.body;
      const isDependent = portalDetails?.portalUserDetails?.isDependent;

      registerPatientInBackground(appointmentDetail, userDetail, portalDetails, servicesList, requestBody, headers, patientId, labRadiologyId, serviceType);

      let testIdsArray = [];
      if (serviceType === 'lab') {
        testIdsArray = labTestIds;
      } else if (serviceType === 'radiology') {
        testIdsArray = radiologyTestIds;
      }

      updatePrescribedStatusInBackground(prescribedLabRadiologyTestId, serviceType, testIdsArray, headers);

      let getTestName
      if (serviceType == 'lab') {
        getTestName = await LabTest.find({ _id: { $in: labTestIds.map(id => mongoose.Types.ObjectId(id)) } }).select('testName')
      } else {
        getTestName = await RadiologyTest.find({ _id: { $in: radiologyTestIds.map(id => mongoose.Types.ObjectId(id)) } }).select('testName')
      }
      const testName = getTestName.map(val => val?.testName)
      let paramsData = {
        sendTo: serviceType == 'lab' ? 'laboratory' : 'radiology',
        madeBy: 'patient',
        patientId,
        doctorId,
        labRadiologyId,
        appointment: {
          _id: appointmentDetail._id
        },
        consultationDate,
        consultationTime,
        condition: serviceType == 'lab' ? 'BOOK_LABORATORY_APPOINTMENT' : 'BOOK_RADIOLOGY_APPOINTMENT',
        notification: ['sms', 'email'],
        testName: testName.join(', '),
      }

      sendNotification(paramsData, headers);

      let paramsDataPatient = {
        sendTo: 'patient',
        madeBy: serviceType == 'lab' ? 'laboratory' : 'radiology',
        patientId: isDependent ? portalDetails?.portalUserDetails?.parent_userid : patientId,
        doctorId,
        labRadiologyId,
        appointment: {
          _id: appointmentDetail._id
        },
        consultationDate,
        consultationTime,
        condition: 'BOOK_LABORATORY_RADIOLOGY',
        notification: ['sms', 'push_notification'],
        testName: testName.join(', '),
        order_number: appointmentDetail.appointment_id
      }

      sendNotification(paramsDataPatient, headers);

      return sendResponse(req, res, 200, {
        status: true,
        message: `Appointment added successfully`,
        body: null,
        errorCode: null,
      });

    } catch (error) {
      console.log("Error: while creating an appointment", error);
      return sendResponse(req, res, 500, {
        status: false,
        body: null,
        message: error.message ? error.message : `failed to add appointment`,
        errorCode: error.errorCode ? error.errorCode : "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async rescheduleAppointment(req, res) {
    const headers = {
      Authorization: req.headers["authorization"],
    };
    try {
      const {
        appointmentId,
        rescheduleConsultationDate,
        rescheduleConsultationTime,
      } = req.body;

      const getAppointment = await Appointment.findById(appointmentId);
      if (!getAppointment) {
        return sendResponse(req, res, 500, {
          status: false,
          data: null,
          message: `Appointment not exist!`,
          errorCode: null,
        });
      }

      const requestedDate = moment(`${rescheduleConsultationDate} ${rescheduleConsultationTime.split('-')[0]}:00`)
      const currentDate = moment()
      if (requestedDate.unix() < currentDate.unix()) {
        return sendResponse(req, res, 200, {
          status: false,
          message: "You can't reschedule appointment for previous datetime",
          body: null,
          errorCode: null,
        });
      }

      await Appointment.findOneAndUpdate(
        { _id: appointmentId },
        {
          $set: {
            consultationDate: rescheduleConsultationDate,
            consultationTime: rescheduleConsultationTime,
            is_rescheduled: true
          },
        },
        { upsert: false, new: true }
      ).exec();

      let getTestName
      if (getAppointment?.serviceType == 'lab') {
        getTestName = await LabTest.find({ _id: { $in: getAppointment?.labTestIds.map(id => mongoose.Types.ObjectId(id?.testId)) } }).select('testName')
      } else {
        getTestName = await RadiologyTest.find({ _id: { $in: getAppointment?.radiologyTestIds.map(id => mongoose.Types.ObjectId(id?.testId)) } }).select('testName')
      }
      const testName = getTestName.map(val => val?.testName)

      let paramsData = {
        sendTo: getAppointment?.serviceType == 'lab' ? 'laboratory' : 'radiology',
        madeBy: 'patient',
        patientId: getAppointment?.patientId,
        doctorId: getAppointment?.doctorId,
        labRadiologyId: getAppointment?.labRadiologyId,
        appointment: {
          _id: getAppointment?._id
        },
        consultationDate: getAppointment?.consultationDate,
        consultationTime: getAppointment?.consultationTime,
        newConsultationDate: rescheduleConsultationDate,
        newConsultationTime: rescheduleConsultationTime,
        condition: getAppointment?.serviceType == 'lab' ? 'RESCHEDULE_LABORATORY_APPOINTMENT' : 'RESCHEDULE_RADIOLOGY_APPOINTMENT',
        notification: ['sms', 'email'],
        testName: testName.join(', '),
      }
      sendNotification(paramsData, headers);

      let paramsDataPatient = {
        sendTo: 'patient',
        madeBy: getAppointment?.serviceType == 'lab' ? 'laboratory' : 'radiology',
        patientId: getAppointment?.patientId,
        doctorId: getAppointment?.doctorId,
        labRadiologyId: getAppointment?.labRadiologyId,
        appointment: {
          _id: getAppointment?._id
        },
        consultationDate: getAppointment?.consultationDate,
        consultationTime: getAppointment?.consultationTime,
        newConsultationDate: rescheduleConsultationDate,
        newConsultationTime: rescheduleConsultationTime,
        condition: 'RESCHEDULE_LABORATORY_RADIOLOGY',
        notification: ['sms', 'push_notification'],
        testName: testName.join(', ')
      }

      sendNotification(paramsDataPatient, headers);

      return sendResponse(req, res, 200, {
        status: true,
        message: `Appointment rescheduled successfully`,
        body: null,
        errorCode: null,
      });
    } catch (error) {
      console.log('Error while rescheduling appointment', error);
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `failed to rescheduled appointment`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async listAppointment(req, res) {
    const headers = {
      Authorization: req.headers["authorization"],
    };

    try {
      const {
        serviceType,
        patientId,
        searchText,
        page,
        limit,
        status,
        date,
        sort,
        fromDate,
        toDate,
        labRadiologyId
      } = req.query;

      let appointmentStatus
      if (status === 'ALL') {
        appointmentStatus = ["PENDING", "CANCELLED", "APPROVED", "COMPLETED", "UNDER_PROCESSED", "MISSED"]
      } else {
        appointmentStatus = status
      }
      let search_filter = [{}]
      if (searchText) {
        search_filter = [
          { appointment_id: { $regex: searchText || "", $options: "i" } },
        ]
      }
      let date_filter = {}
      if (date) {
        date_filter['consultationDate'] = date
      }
      if (fromDate && toDate) {
        date_filter = {
          consultationDate: { $gte: fromDate, $lte: toDate }
        }
      }

      const pipeline = [
        {
          $lookup: {
            from: "portalusers",
            localField: "labRadiologyId",
            foreignField: "_id",
            as: "portalusers",
          },
        },
        {
          $unwind: {
            path: "$portalusers",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            centre_name: "$portalusers.centre_name",
            centre_name_arabic: "$portalusers.centre_name_arabic",
            type: "$portalusers.type",
          },
        },
        {
          $match: {
            status: status === 'ALL' ? { $in: appointmentStatus } : appointmentStatus,
            serviceType,
            $or: search_filter,
            $and: [
              date_filter,
            ]
          }
        },
        {
          $lookup: {
            from: "labtests",
            localField: "labTestIds.testId",
            foreignField: "_id",
            as: "labtests",
          },
        },
        {
          $addFields: {
            labTestRecords: {
              $map: {
                input: "$labTestIds",
                as: "labTest",
                in: {
                  testId: "$$labTest.testId",
                  testResultId: "$$labTest.testResultId",
                  resultType: "$$labTest.resultType",
                  status: "$$labTest.status",
                  testHistory: "$$labTest.testHistory",
                  externalResults: "$$labTest.extrenalResults",
                  testName: {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: "$labtests",
                              as: "test",
                              cond: { $eq: ["$$test._id", "$$labTest.testId"] }
                            }
                          },
                          as: "matchedTest",
                          in: "$$matchedTest.testName"
                        }
                      },
                      0
                    ]
                  }
                }
              }
            }
          }
        },
        {
          $unwind: {
            path: "$labtests",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            labTestName: "$labtests.testName",
          },
        },
        {
          $lookup: {
            from: "radiologytests",
            localField: "radiologyTestIds.testId",
            foreignField: "_id",
            as: "radiologytests",
          },
        },
        {
          $addFields: {
            radiologyTestRecords: {
              $map: {
                input: "$radiologyTestIds",
                as: "radiologyTest",
                in: {
                  testId: "$$radiologyTest.testId",
                  testResultId: "$$radiologyTest.testResultId",
                  resultType: "$$radiologyTest.resultType",
                  status: "$$radiologyTest.status",
                  testHistory: "$$radiologyTest.testHistory",
                  testName: {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: "$radiologytests",
                              as: "test",
                              cond: { $eq: ["$$test._id", "$$radiologyTest.testId"] }
                            }
                          },
                          as: "matchedTest",
                          in: "$$matchedTest.testName"
                        }
                      },
                      0
                    ]
                  }
                }
              }
            }
          }
        },
        {
          $unwind: {
            path: "$radiologytests",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            radiologyTestName: "$radiologytests.testName",
          },
        },
      ]
      if (req?.user?.role == 'patient') {
        pipeline.push(
          { $match: { patientId: mongoose.Types.ObjectId(patientId ? patientId : req?.user?.portalUserId) } }
        );
      } else if (req?.user?.role == 'INDIVIDUAL') {
        pipeline.push({ $match: { labRadiologyId: mongoose.Types.ObjectId(labRadiologyId ? labRadiologyId : req?.user?._id) } });
      } else if (req?.user?.role == 'ADMIN' && labRadiologyId != 'all') {
        pipeline.push({ $match: { labRadiologyId: mongoose.Types.ObjectId(labRadiologyId) } });
      }

      pipeline.push({
        $group: {
          _id: "$_id",
          appointmentId: { $first: "$appointment_id" },
          createdAt: { $first: "$createdAt" },
          patientId: { $first: "$patientId" },
          doctorId: { $first: "$doctorId" },
          consultationDate: { $first: "$consultationDate" },
          consultationTime: { $first: "$consultationTime" },
          status: { $first: "$status" },
          centreName: { $first: "$centre_name" },
          centreNameArabic: { $first: "$centre_name_arabic" },
          labTestName: { $push: "$labTestName" },
          labTestRecords: { $first: "$labTestRecords" },
          radiologyTestRecords: { $first: "$radiologyTestRecords" },
          radiologyTestName: { $push: "$radiologyTestName" },
          type: { $first: "$type" },
          registrationData: { $first: "$registrationData" },
          alborgeResponse: { $first: "$alborgeResponse" },
          isAlborgeResultReceived: { $first: "$isAlborgeResultReceived" },
        }
      },)
      let sortKey = 'createdAt'
      let sortValue = -1
      if (sort) {
        sortKey = sort.split(':')[0]
        sortValue = sort.split(':')[1]
      }

      pipeline.push(
        {
          $sort:
          {
            [sortKey]: Number(sortValue)
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
              { $skip: searchText ? 0 : (page - 1) * limit },
              { $limit: limit * 1 },
            ] : [
              { $skip: 0 },
            ],
          }
        }
      )
      const result = await Appointment.aggregate(pipeline);
      const statuses = {
        PENDING: 'Pending',
        CANCELLED: 'Cancelled',
        APPROVED: 'Approved',
        UNDER_PROCESSED: 'Under Process',
        COMPLETED: 'Completed',
        MISSED: 'Missed'
      }
      const paginatedResults = result[0].paginatedResults
      const patientDetails = getAllPatient(paginatedResults)
      const doctorDetails = getAllDoctor(paginatedResults, headers)
      const promisesResult = await Promise.all([patientDetails, doctorDetails])

      for (let index = 0; index < paginatedResults.length; index++) {
        paginatedResults[index].patientName = promisesResult[0][paginatedResults[index].patientId.toString()]?.full_name
        paginatedResults[index].patientProfile = promisesResult[0][paginatedResults[index].patientId.toString()]?.profile_pic
        paginatedResults[index].doctorName = promisesResult[1][paginatedResults[index].doctorId.toString()]?.full_name
        paginatedResults[index].doctorNameArabic = promisesResult[1][paginatedResults[index].doctorId.toString()]?.full_name_arabic
        paginatedResults[index].doctorProfile = promisesResult[1][paginatedResults[index].doctorId.toString()]?.profilePicture
        paginatedResults[index].status = statuses[paginatedResults[index].status]
        paginatedResults[index].patientMRN = promisesResult[0][paginatedResults[index].patientId.toString()]?.mrn_number
      }

      let totalCount = 0
      if (result[0].totalCount.length > 0) {
        totalCount = result[0].totalCount[0].count
      }

      return sendResponse(req, res, 200, {
        status: true,
        message: `appointment list fetched successfully`,
        data: {
          totalRecords: totalCount,
          currentPage: page,
          totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
          data: result[0]?.paginatedResults,
        },
        errorCode: null,
      });
    } catch (error) {
      console.log("Error while fetching appointment: ", error);
      return sendResponse(req, res, 500, {
        status: false,
        message: error.message
          ? error.message
          : `something went wrong while fetching list`,
        body: error,
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async labRadioTestRecordsCount(req, res) {
    const headers = {
      Authorization: req.headers["authorization"],
    };

    try {
      const {
        serviceType,
        patientId,
        searchText,
        page,
        limit,
        status,
        date,
        sort,
        fromDate,
        toDate,
        labRadiologyId
      } = req.query;

      let appointmentStatus = status === 'ALL'
        ? ["PENDING", "CANCELLED", "APPROVED", "COMPLETED", "UNDER_PROCESSED", "MISSED"]
        : status;

      let search_filter = searchText
        ? [{ appointment_id: { $regex: searchText, $options: "i" } }]
        : [{}];

      let date_filter = {};
      if (date) {
        date_filter['consultationDate'] = date;
      }
      if (fromDate && toDate) {
        date_filter = { consultationDate: { $gte: fromDate, $lte: toDate } };
      }

      const pipeline = [
        {
          $lookup: {
            from: "portalusers",
            localField: "labRadiologyId",
            foreignField: "_id",
            as: "portalusers",
          },
        },
        { $unwind: { path: "$portalusers", preserveNullAndEmptyArrays: true } },
        { $addFields: { centre_name: "$portalusers.centre_name", centre_name_arabic: "$portalusers.centre_name_arabic", type: "$portalusers.type" } },
        {
          $match: {
            status: status === 'ALL' ? { $in: appointmentStatus } : appointmentStatus,
            serviceType,
            $or: search_filter,
            $and: [date_filter]
          }
        },
        {
          $lookup: {
            from: "labtests",
            localField: "labTestIds.testId",
            foreignField: "_id",
            as: "labtests",
          },
        },
        {
          $lookup: {
            from: "radiologytests",
            localField: "radiologyTestIds.testId",
            foreignField: "_id",
            as: "radiologytests",
          },
        },
        {
          $addFields: {
            labTestRecords: {
              $map: {
                input: "$labTestIds",
                as: "labTest",
                in: {
                  testId: "$$labTest.testId",
                  status: "$$labTest.status",
                }
              }
            },
            radiologyTestRecords: {
              $map: {
                input: "$radiologyTestIds",
                as: "radiologyTest",
                in: {
                  testId: "$$radiologyTest.testId",
                  status: "$$radiologyTest.status",
                }
              }
            }
          }
        },
      ];

      if (req?.user?.role === 'patient') {
        pipeline.push({ $match: { patientId: mongoose.Types.ObjectId(patientId || req?.user?.portalUserId) } });
      } else if (req?.user?.role === 'INDIVIDUAL') {
        pipeline.push({ $match: { labRadiologyId: mongoose.Types.ObjectId(labRadiologyId || req?.user?._id) } });
      } else if (req?.user?.role === 'ADMIN' && labRadiologyId !== 'all') {
        pipeline.push({ $match: { labRadiologyId: mongoose.Types.ObjectId(labRadiologyId) } });
      }

      pipeline.push({
        $group: {
          _id: "$_id",
          appointmentId: { $first: "$appointment_id" },
          createdAt: { $first: "$createdAt" },
          patientId: { $first: "$patientId" },
          doctorId: { $first: "$doctorId" },
          consultationDate: { $first: "$consultationDate" },
          consultationTime: { $first: "$consultationTime" },
          status: { $first: "$status" },
          centreName: { $first: "$centre_name" },
          centreNameArabic: { $first: "$centre_name_arabic" },
          labTestRecords: { $first: "$labTestRecords" },
          radiologyTestRecords: { $first: "$radiologyTestRecords" },
          type: { $first: "$type" },
          registrationData: { $first: "$registrationData" },
          alborgeResponse: { $first: "$alborgeResponse" },
          isAlborgeResultReceived: { $first: "$isAlborgeResultReceived" },
        }
      });

      let sortKey = sort?.split(':')[0] || 'createdAt';
      let sortValue = Number(sort?.split(':')[1] || -1);

      pipeline.push(
        { $sort: { [sortKey]: sortValue } },
        {
          $facet: {
            totalCount: [{ $count: 'count' }],
            paginatedResults: limit != 0
              ? [{ $skip: searchText ? 0 : (page - 1) * limit }, { $limit: limit * 1 }]
              : [{ $skip: 0 }]
          }
        }
      );

      const result = await Appointment.aggregate(pipeline);
      const statuses = {
        PENDING: 'Pending',
        CANCELLED: 'Cancelled',
        APPROVED: 'Approved',
        UNDER_PROCESSED: 'Under Process',
        COMPLETED: 'Completed',
        MISSED: 'Missed'
      };

      const paginatedResults = result[0].paginatedResults;
      const patientDetails = getAllPatient(paginatedResults);
      const doctorDetails = getAllDoctor(paginatedResults, headers);
      const promisesResult = await Promise.all([patientDetails, doctorDetails]);

      let totalPendingLabTests = 0;
      let totalPendingRadiologyTests = 0;

      for (let index = 0; index < paginatedResults.length; index++) {
        let appointment = paginatedResults[index];

        appointment.patientName = promisesResult[0][appointment.patientId.toString()]?.full_name;
        appointment.patientProfile = promisesResult[0][appointment.patientId.toString()]?.profile_pic;
        appointment.doctorName = promisesResult[1][appointment.doctorId.toString()]?.full_name;
        appointment.doctorNameArabic = promisesResult[1][appointment.doctorId.toString()]?.full_name_arabic;
        appointment.doctorProfile = promisesResult[1][appointment.doctorId.toString()]?.profilePicture;
        appointment.status = statuses[appointment.status];

        // Count pending lab tests per appointment
        appointment.pendingLabTestCount = (appointment.labTestRecords || []).filter(test => test.status === "PENDING").length;
        totalPendingLabTests += appointment.pendingLabTestCount;

        // Count pending radiology tests per appointment
        appointment.pendingRadiologyTestCount = (appointment.radiologyTestRecords || []).filter(test => test.status === "PENDING").length;
        totalPendingRadiologyTests += appointment.pendingRadiologyTestCount;
      }

      let totalCount = result[0].totalCount.length > 0 ? result[0].totalCount[0].count : 0;

      return sendResponse(req, res, 200, {
        status: true,
        message: `appointment list fetched successfully`,
        data: {
          totalRecords: totalCount,
          currentPage: page,
          totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
          totalPendingLabTests,
          totalPendingRadiologyTests,
          // data: paginatedResults,
        },
        errorCode: null,
      });

    } catch (error) {
      console.log("Error while fetching appointment: ", error);
      return sendResponse(req, res, 500, {
        status: false,
        message: error.message || `Something went wrong while fetching the list`,
        body: error,
        errorCode: error.code || "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async listAppointmentForEMR(req, res) {
    const headers = {
      Authorization: req.headers["authorization"],
    };

    try {
      const {
        serviceType,
        page,
        limit,
        sort,
        fromDate,
        toDate,
        patientId
      } = req.query;

      let date_filter = {}
      if (fromDate && toDate) {
        date_filter = {
          consultationDate: { $gte: fromDate, $lte: toDate }
        }
      }

      const pipeline = [
        {
          $lookup: {
            from: "portalusers",
            localField: "labRadiologyId",
            foreignField: "_id",
            as: "portalusers",
          },
        },
        {
          $unwind: {
            path: "$portalusers",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            centre_name: "$portalusers.centre_name",
            centre_name_arabic: "$portalusers.centre_name_arabic",
            type: "$portalusers.type",
          },
        },
        {
          $match: {
            // status: 'COMPLETED',
            patientId: mongoose.Types.ObjectId(patientId),
            serviceType,
            $and: [
              date_filter,
            ]
          }
        },
      ]
      if (serviceType == 'lab') {
        pipeline.push(
          {
            $lookup: {
              from: "labtests",
              localField: "labTestIds.testId",
              foreignField: "_id",
              as: "labtests",
            },
          },
          {
            $lookup: {
              from: "testresults",
              localField: "labTestIds.testResultId",
              foreignField: "_id",
              as: "labtestsResult",
            },
          },
          {
            $addFields: {
              labTestResult: {
                $map: {
                  input: "$labTestIds",
                  as: "labTest",
                  in: {
                    testName: {
                      $arrayElemAt: [
                        {
                          $map: {
                            input: {
                              $filter: {
                                input: "$labtests",
                                cond: { $eq: ["$$this._id", "$$labTest.testId"] }
                              }
                            },
                            as: "test",
                            in: "$$test.testName"
                          }
                        },
                        0
                      ]
                    },
                    resultType: {
                      $arrayElemAt: [
                        {
                          $map: {
                            input: {
                              $filter: {
                                input: "$labtestsResult",
                                cond: { $eq: ["$$this._id", "$$labTest.testResultId"] }
                              }
                            },
                            as: "result",
                            in: "$$result.resultType"
                          }
                        },
                        0
                      ]
                    },
                    testResultId: "$$labTest.testResultId",
                    testId: "$$labTest.testId",
                    status: "$$labTest.status",
                    externalResults: "$$labTest.extrenalResults"
                  }
                }
              }
            }
          }

        );
      } else if (serviceType == 'radiology') {
        pipeline.push({
          $lookup: {
            from: "radiologytests",
            localField: "radiologyTestIds.testId",
            foreignField: "_id",
            as: "radiologytests",
          },
        },
          {
            $lookup: {
              from: "testresults",
              localField: "radiologyTestIds.testResultId",
              foreignField: "_id",
              as: "radiologyTestResult",
            },
          },
          {
            $addFields: {
              radiologyTestResult: {
                $map: {
                  input: "$radiologyTestIds",
                  as: "radiologyResult",
                  in: {
                    testName: {
                      $arrayElemAt: [
                        {
                          $map: {
                            input: {
                              $filter: {
                                input: "$radiologytests",
                                cond: { $eq: ["$$this._id", "$$radiologyResult.testId"] }
                              }
                            },
                            as: "test",
                            in: "$$test.testName"
                          }
                        },
                        0
                      ]
                    },
                    resultStatus: {
                      $arrayElemAt: [
                        {
                          $map: {
                            input: {
                              $filter: {
                                input: "$radiologyTestResult",
                                cond: { $eq: ["$$this._id", "$$radiologyResult.testResultId"] }
                              }
                            },
                            as: "result",
                            in: "$$result.resultStatus"
                          }
                        },
                        0
                      ]
                    },
                    testResultId: "$$radiologyResult.testResultId",
                    testId: "$$radiologyResult.testId",
                    status: "$$radiologyResult.status"
                  }
                }
              }
            }
          }
        );
      }

      pipeline.push({
        $group: {
          _id: "$_id",
          appointmentId: { $first: "$appointment_id" },
          createdAt: { $first: "$createdAt" },
          patientId: { $first: "$patientId" },
          doctorId: { $first: "$doctorId" },
          consultationDate: { $first: "$consultationDate" },
          consultationTime: { $first: "$consultationTime" },
          status: { $first: "$status" },
          centreName: { $first: "$centre_name" },
          labTestResult: { $first: "$labTestResult" },
          radiologyTestResult: { $first: "$radiologyTestResult" },
          type: { $first: "$type" },
          isAlborgeResultReceived: { $first: "$isAlborgeResultReceived" },
          alborgeResponse: { $first: "$alborgeResponse" },

        }
      },)
      let sortKey = 'createdAt'
      let sortValue = -1
      if (sort) {
        sortKey = sort.split(':')[0]
        sortValue = sort.split(':')[1]
      }

      pipeline.push(
        {
          $sort:
          {
            [sortKey]: Number(sortValue)
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
              { $limit: limit * 1 },
            ] : [
              { $skip: 0 },
            ],
          }
        }
      )


      const result = await Appointment.aggregate(pipeline);
      const statuses = {
        PENDING: 'Pending',
        CANCELLED: 'Cancelled',
        APPROVED: 'Approved',
        UNDER_PROCESSED: 'Under Process',
        COMPLETED: 'Completed',
        MISSED: 'Missed'
      }
      const paginatedResults = result[0].paginatedResults
      const doctorDetails = await getAllDoctor(paginatedResults, headers)

      for (let index = 0; index < paginatedResults.length; index++) {
        paginatedResults[index].doctorName = doctorDetails[paginatedResults[index].doctorId.toString()]?.full_name
        paginatedResults[index].doctorNameArabic = doctorDetails[paginatedResults[index].doctorId.toString()]?.full_name_arabic
        paginatedResults[index].doctorProfile = doctorDetails[paginatedResults[index].doctorId.toString()]?.profilePicture
        paginatedResults[index].status = statuses[paginatedResults[index].status]
      }

      let totalCount = 0
      if (result[0].totalCount.length > 0) {
        totalCount = result[0].totalCount[0].count
      }

      return sendResponse(req, res, 200, {
        status: true,
        message: `appointment list fetched successfully`,
        data: {
          totalRecords: totalCount,
          currentPage: page,
          totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
          data: result[0]?.paginatedResults,
        },
        errorCode: null,
      });
    } catch (error) {
      console.log("Error while fetching appointment: ", error);
      return sendResponse(req, res, 500, {
        status: false,
        message: error.message
          ? error.message
          : `something went wrong while fetching list`,
        body: error,
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async allAppointmentForTimeline(req, res) {

    try {
      const {
        status,
        consultationFor
      } = req.query;

      let appointmentStatus
      if (!status || status === 'ALL') {
        appointmentStatus = ["PENDING", "CANCELLED", "APPROVED", "COMPLETED", "UNDER_PROCESSED", "MISSED"]
      } else {
        appointmentStatus = status.split(',')
      }

      let consultationFor_filter = {}
      if (consultationFor) {
        consultationFor_filter['consultationFor'] = consultationFor
      }

      const pipeline = [
        {
          $lookup: {
            from: "labtests",
            localField: "labTestIds.testId",
            foreignField: "_id",
            as: "labtests",
          },
        },
        {
          $unwind: {
            path: "$labtests",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            labTestName: "$labtests.testName",
          },
        },
        {
          $lookup: {
            from: "radiologytests",
            localField: "radiologyTestIds.testId",
            foreignField: "_id",
            as: "radiologytests",
          },
        },
        {
          $unwind: {
            path: "$radiologytests",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            radiologyTestName: "$radiologytests.testName",
          },
        },
        {
          $lookup: {
            from: "portalusers",
            localField: "labRadiologyId",
            foreignField: "_id",
            as: "portalusers",
          },
        },
        {
          $unwind: {
            path: "$portalusers",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "locationinfos",
            localField: "labRadiologyId",
            foreignField: "for_portal_user",
            as: "centreLocation",
          },
        },
        {
          $unwind: {
            path: "$centreLocation",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            centre_name: "$portalusers.centre_name",
            type: "$portalusers.type",
          },
        },
        {
          $lookup: {
            from: "basicinfos",
            localField: "labRadiologyId",
            foreignField: "for_portal_user",
            as: "centreDetails",
          },
        },
        {
          $unwind: {
            path: "$centreDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            profile_pic_signed_url: "$centreDetails.profile_picture"

          },
        },
        {
          $match: {
            status: { $in: appointmentStatus }
          }
        },
      ]
      if (consultationFor == 'family-member') {
        pipeline.push({ $match: { parent_patient_id: req?.user?.portalUserId } })
      } else if (consultationFor == 'self') {
        pipeline.push({ $match: { patientId: mongoose.Types.ObjectId(req?.user?.portalUserId) } })
      } else {
        pipeline.push({ $match: { created_by: mongoose.Types.ObjectId(req?.user?.portalUserId) } })
      }
      pipeline.push({
        $group: {
          _id: "$_id",
          patientId: { $first: "$patientId" },
          appointmentId: { $first: "$appointment_id" },
          consultationDate: { $first: "$consultationDate" },
          consultationTime: { $first: "$consultationTime" },
          consultationFor: { $first: "$consultationFor" },
          centreName: { $first: "$centre_name" },
          centreNameArabic: { $first: "$centre_name_arabic" },
          labTestName: { $push: "$labTestName" },
          radiologyTestName: { $push: "$radiologyTestName" },
          type: { $first: "$type" },
          status: { $first: "$status" },
          centerLocation: { $first: "$centreLocation" },
          profile_pic_signed_url: { $first: "$profile_pic_signed_url" },
        }
      },)

      pipeline.push(
        {
          $sort:
          {
            consultationDate: -1
          }
        },
      )
      const result = await Appointment.aggregate(pipeline);


      for (const ele of result) {
        if (ele.profile_pic_signed_url !== '') {
          ele.profile_pic_signed_url = await generateSignedUrl(ele.profile_pic_signed_url);
        } else {
          ele.profile_pic_signed_url = '';
        }
      }

      return sendResponse(req, res, 200, {
        status: true,
        message: `appointment list fetched successfully`,
        data: result,
        errorCode: null,
      });
    } catch (error) {
      console.log("Error while fetching appointment: ", error);
      return sendResponse(req, res, 500, {
        status: false,
        message: error.message
          ? error.message
          : `something went wrong while fetching list`,
        body: error,
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async viewAppointment(req, res) {
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };
      const { appointment_id } = req.query;
      const result = await Appointment.findById(appointment_id)
        .populate({ path: 'labTestIds.testId', select: 'testName status resultType' })
        .populate({ path: 'labTestIds.testResultId', select: 'resultType' })
        .populate({ path: 'radiologyTestIds.testId', select: 'testName status resultType' })
        .lean()

      let patientDetails = {}
      //get patient details
      const getPatientDetails = await httpService.getStaging(
        "patient/patient-details",
        { patient_id: result.patientId },
        headers,
        "patientServiceUrl"
      );
      if (getPatientDetails?.status) {
        const patientAllDetails = getPatientDetails.body;
        patientDetails = {
          full_name: patientAllDetails?.personalDetails?.full_name,
          first_name: patientAllDetails?.personalDetails?.first_name,
          middle_name: patientAllDetails?.personalDetails?.middle_name,
          last_name: patientAllDetails?.personalDetails?.last_name,
          gender: patientAllDetails?.personalDetails?.gender,
          profile_pic: patientAllDetails?.personalDetails?.profile_pic,
          saudi_id: patientAllDetails?.personalDetails?.saudi_id || "",
          iqama_number: patientAllDetails?.personalDetails?.iqama_number || "",
          passport: patientAllDetails?.personalDetails?.passport || "",
          mrn_number: patientAllDetails?.personalDetails?.mrn_number || "",
          dob: patientAllDetails?.personalDetails?.dob,
          profile_pic_signed_url: patientAllDetails?.personalDetails?.profile_pic_signed_url,
          patient_id: patientAllDetails?.portalUserDetails?._id,
          mobile: patientAllDetails?.portalUserDetails?.mobile,
          country_code: patientAllDetails?.portalUserDetails?.country_code,
          email: patientAllDetails?.portalUserDetails?.email,
          address: patientAllDetails?.locationDetails?.address,
          pincode: patientAllDetails?.locationDetails?.pincode,
          country: patientAllDetails?.locationDetails?.country,
          emergency_contact: patientAllDetails?.personalDetails?.emergency_contact
        }
        if (result?.parent_patient_id) {
          const getFamilyDetails = await httpService.getStaging(
            "patient/create-profile/list-family-member",
            { patientId: result?.parent_patient_id },
            headers,
            "patientServiceUrl"
          );
          if (getFamilyDetails?.status) {
            if ('familyMember' in getFamilyDetails?.data) {
              const getMember = getFamilyDetails?.data?.familyMember.filter(val => val?.familyMemberId == result.patientId)
              patientDetails.relationship = getMember[0]?.relationship
            }
          }
        }
      }
      const appointmentDetails = {
        appointment_id: result?._id,
        appointmentId: result?.appointment_id,
        consultationDate: result?.consultationDate,
        consultationTime: result?.consultationTime,
        consultationFor: result?.consultationFor,
        appointmentStatus: result?.status,
        cancelReason: result?.cancelReason,
        createdAt: result?.createdAt,
        updatedAt: result?.updatedAt,
        isAlborgeResultReceived: result?.isAlborgeResultReceived,
        alborgeResponse: result?.alborgeResponse,
        testDetails: result?.serviceType == 'lab' ? result?.labTestIds : result?.radiologyTestIds
      }

      const getDetails = await httpService.postStaging(
        "individual-doctor/get-patient-doctors",
        {
          doctorIds: [result?.doctorId],
        },
        headers,
        "doctorServiceUrl"
      );
      let doctor_basic_info = {}
      if (getDetails?.status) {
        doctor_basic_info['profile_pic'] = ''
        doctor_basic_info['doctorName'] = getDetails?.body?.results[0]?.full_name
        doctor_basic_info['doctorNameArabic'] = getDetails?.body?.results[0]?.full_name_arabic
      }

      const getDetail = await LocationInfo.find({ for_portal_user: { $eq: result?.labRadiologyId } })
        .populate({ path: 'for_portal_user', select: 'centre_name' })
        .select('address')
      const labRadioProfileImage = await BasicInfo.findOne({ for_portal_user: { $eq: result?.labRadiologyId } });

      let signed_profile_picture = ''
      if (labRadioProfileImage?.profile_picture !== '') {
        signed_profile_picture = await generateSignedUrl(labRadioProfileImage?.profile_picture);
      }

      // Modify getDetail using a loop
      for (let i = 0; i < getDetail.length; i++) {
        getDetail[i] = getDetail[i].toObject();
        getDetail[i].signed_profile_picture = signed_profile_picture;
      }

      return sendResponse(req, res, 200, {
        status: true,
        data: {
          patientDetails,
          appointmentDetails,
          doctor_basic_info,
          center_details: getDetail
        },
        message: `Appointment fetched successfully`,
        errorCode: null,
      });
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: error.message,
        errorCode: error.code,
      });
    }
  }
  async cancelAndApproveAppointment(req, res) {
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };

      const {
        appointmentId,
        cancelReason,
        status,
        cancelledOrAcceptedBy,
        cancel_by,
      } = req.body;

      const getAppointment = await Appointment.findById(appointmentId)
      if (!getAppointment) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "Appointment not found",
          errorCode: null,
        })
      }

      const createdAt = new Date(getAppointment.createdAt);
      const now = new Date();

      // Calculate the difference in days between now and the created date
      const diffInDays = (now - createdAt) / (1000 * 60 * 60 * 24);

      // Check if the appointment was created more than 14 days ago
      if (diffInDays > 14) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: `Cancellation not allowed.`,
          messageArabic: ``,
          errorCode: null,
        })
      }

      let updateObject = {
        status
      }
      const date = new Date()
      let history = {
        status,
        updatedAt: date.toISOString(),
        updatedById: req?.user?._id,
        role: getAppointment?.serviceType,
      }
      if (status == 'CANCELLED') {
        const labTestRecords = getAppointment?.labTestIds ? getAppointment?.labTestIds.map(val => {
          val.status = status
          val.testHistory = val.testHistory.push(history)
          return val
        }) : []
        const radiologyTestRecords = getAppointment?.radiologyTestIds ? getAppointment?.radiologyTestIds.map(val => {
          val.status = status
          val.testHistory = val.testHistory.push(history)
          return val
        }) : []
        updateObject.labTestIds = labTestRecords;
        updateObject.radiologyTestIds = radiologyTestRecords;
        updateObject.cancelReason = cancelReason
        updateObject.cancelledOrAcceptedBy = cancelledOrAcceptedBy;
        updateObject.cancel_by = cancel_by ? cancel_by : 'patient';
        updateObject.cancelType = 'manual';
      }

      if (getAppointment?.serviceType === 'lab') {
        if (getAppointment?.labTestIds?.length) {
          const testIds = getAppointment.labTestIds.map(test => test.testId);
          await httpService.putStaging(
            "patient-clinical-info/lab-radio-update-prescribed-test-status-by-testIds",
            {
              prescribedLabRadiologyTestId: getAppointment?.prescribedLabRadiologyTestId,
              type: getAppointment?.serviceType,
              status: status === 'APPROVED' ? 'INPROGRESS' : 'CANCELLED',
              testIds,
            },
            headers,
            "doctorServiceUrl"
          );
        }
      } else {
        if (getAppointment?.radiologyTestIds?.length) {
          const testIds = getAppointment.radiologyTestIds.map(test => test.testId);
          await httpService.putStaging(
            "patient-clinical-info/lab-radio-update-prescribed-test-status-by-testIds",
            {
              prescribedLabRadiologyTestId: getAppointment?.prescribedLabRadiologyTestId,
              type: getAppointment?.serviceType,
              status: status === 'APPROVED' ? 'INPROGRESS' : 'CANCELLED',
              testIds,
            },
            headers,
            "doctorServiceUrl"
          );
        }

      }

      await Appointment.findOneAndUpdate(
        { _id: { $eq: appointmentId } },
        {
          $set: updateObject,
          $push: { orderHistory: history }
        },
        { new: true }
      ).exec();

      let sendTo = 'patient'
      let madeBy = getAppointment?.serviceType == 'lab' ? 'laboratory' : 'radiology'
      const type = getAppointment?.serviceType == 'lab' ? 'LABORATORY' : 'RADIOLOGY'
      let condition = status == 'CANCELLED' ? `REJECTED_${type}_APPOINTMENT` : `APPROVED_${type}_APPOINTMENT`
      if (req?.user?.role == 'patient' && status == 'CANCELLED') {
        sendTo = getAppointment?.serviceType == 'lab' ? 'laboratory' : 'radiology'
        madeBy = 'patient'
        condition = `CANCELLED_${type}_APPOINTMENT`
      }
      let testName
      if (getAppointment?.serviceType == 'lab') {
        const getTestName = await LabTest.find({ _id: { $in: getAppointment?.labTestIds.map(val => mongoose.Types.ObjectId(val?.testId)) } }).select('testName')
        testName = getTestName.map(val => val?.testName)
      } else {
        const getTestName = await RadiologyTest.find({ _id: { $in: getAppointment?.radiologyTestIds.map(val => mongoose.Types.ObjectId(val?.testId)) } }).select('testName')
        testName = getTestName.map(val => val?.testName)
      }

      let paramsData = {
        sendTo,
        madeBy,
        patientId: getAppointment?.patientId,
        doctorId: getAppointment?.doctorId,
        labRadiologyId: getAppointment?.labRadiologyId,
        appointment: {
          _id: getAppointment?._id
        },
        consultationDate: getAppointment?.consultationDate,
        consultationTime: getAppointment?.consultationTime,
        condition,
        notification: status == 'CANCELLED' && req?.user?.role == 'patient' ? ['sms', 'email'] : ['push_notification', 'sms', 'email'],
        testName: testName.join(', '),
      }
      sendNotification(paramsData, headers)

      if (req?.user?.role == 'patient' && status == 'CANCELLED') {

        initiateRefund(getAppointment, testName);

      }

      return sendResponse(req, res, 200, {
        status: true,
        data: null,
        message: status == "CANCELLED" ? messages.appointmentCancelled.en : messages.appointmentApproved.en,
        messageArabic: status == "CANCELLED" ? messages.appointmentCancelled.ar : messages.appointmentApproved.ar,
        errorCode: null,
      });
    } catch (error) {
      console.log(error, 'error');
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `Something went wrong while cancelling appointment.`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async addTestResults(req, res) {
    try {
      const {
        appointmentId,
        testId,
        comment,
        resultStatus,
        resultType,
        manualResultData,
        tempSave,
        testResultId
      } = req.body;
      const headers = {
        Authorization: req.headers["authorization"],
      };
      const getAppointment = await Appointment.findById(appointmentId);
      if (!getAppointment) {
        return sendResponse(req, res, 200, {
          status: false,
          data: null,
          message: `Appointment not exist!`,
          errorCode: null,
        });
      }

      let addObject = {
        appointmentId,
        testId,
        comment,
        resultStatus,
        resultType,
        resultFor: getAppointment?.serviceType,
        patientId: getAppointment?.patientId,
        doctorId: getAppointment?.doctorId,
        resultAddedBy: req?.user?._id,
      }
      if (resultType == 'manual') {
        addObject['manualResultData'] = manualResultData
        addObject['tempSave'] = tempSave
      } else if (resultType == 'upload') {
        req.body.serviceType = 'patient'
        req.body.docType = 'testresult'
        req.body.userId = getAppointment?.patientId
        const getKeys = await uploadSingleOrMultipleDocuments(req)
        addObject['uploadResultData'] = getKeys
      }
      let result
      if (testResultId) {
        result = await TestResult.findOneAndUpdate(
          { _id: testResultId },
          {
            $set: {
              manualResultData,
              tempSave
            }
          }
        )
      } else {
        const addData = new TestResult(addObject)
        result = await addData.save()
        const finalData = getAppointment?.[getAppointment?.serviceType == 'lab' ? 'labTestIds' : 'radiologyTestIds'].map(data => {
          if (data.testId.toString() === testId) {
            data.resultType = resultType
            return data
          }
          return data
        })
        await Appointment.findOneAndUpdate(
          { _id: appointmentId },
          {
            $set: {
              [getAppointment?.serviceType == 'lab' ? 'labTestIds' : 'radiologyTestIds']: finalData
            }
          }
        )
      }
      if (!tempSave || resultType == 'upload') {
        const date = new Date()
        let history = {
          status: 'COMPLETED',
          updatedAt: date.toISOString(),
          updatedById: req?.user?._id,
          role: getAppointment?.serviceType,
        }
        let finalData
        // update status and test result id in appointment
        if (getAppointment?.serviceType == 'lab') {
          finalData = getAppointment?.labTestIds.map(data => {
            if (data.testId.toString() === testId) {
              data.status = 'COMPLETED'
              data.testResultId = result?._id
              data.resultType = resultType
              data.testHistory = data.testHistory.push(history)
              return data
            }
            return data
          })
        }
        if (getAppointment?.serviceType == 'radiology') {
          finalData = getAppointment?.radiologyTestIds.map(data => {
            if (data.testId.toString() === testId) {
              data.status = 'COMPLETED'
              data.testResultId = result?._id
              data.resultType = resultType
              data.testHistory = data.testHistory.push(history)
              return data
            }
            return data
          })
        }
        await Appointment.findOneAndUpdate(
          {
            _id: appointmentId
          },
          {
            $set: {
              [getAppointment?.serviceType == 'lab' ? 'labTestIds' : 'radiologyTestIds']: finalData
            }
          }
        )

        let notifyUsersData = {
          patientId: getAppointment?.patientId,
          doctorId: getAppointment?.doctorId,
          appointment_id: getAppointment?._id,
          orderId: getAppointment?.appointment_id,
          labRadiologyId: getAppointment?.labRadiologyId
        };

        notifyUsers(notifyUsersData);
        await httpService.putStaging(
          "patient-clinical-info/update-prescribed-test-status",
          {
            prescribedLabRadiologyTestId: getAppointment?.prescribedLabRadiologyTestId,
            type: getAppointment?.serviceType,
            status: 'COMPLETED',
            testResultId: result?._id,
            testId, resultType
          },
          headers,
          "doctorServiceUrl"
        );




      }

      return sendResponse(req, res, 200, {
        status: true,
        data: null,
        message: `Test result added successfully!`,
        errorCode: null,
      });
    } catch (error) {
      console.log(error, 'error');
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `Something went wrong while uploading test result.`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async getTestResults(req, res) {
    try {
      const {
        appointmentId,
        testId,
        resultType
      } = req.query;

      const getAppointment = await Appointment.findById(appointmentId);
      if (!getAppointment) {
        return sendResponse(req, res, 200, {
          status: false,
          data: null,
          message: `Appointment not exist!`,
          errorCode: null,
        });
      }

      let getTestResult = await TestResult.find({ appointmentId, testId, resultType }).lean();

      for (let index = 0; index < getTestResult.length; index++) {
        const element = getTestResult[index];
        const labRadioId = element?.resultAddedBy;
        let resultData = []
        if (element?.resultType == 'upload' && element?.uploadResultData?.length > 0) {
          for (const val of element?.uploadResultData) {
            resultData.push({
              key: val,
              signedUrl: await generateSignedUrl(val)
            })
          }
          getTestResult[index].uploadResultData = resultData
        }
        const getCenterDetails = await LocationInfo.find({ for_portal_user: { $eq: labRadioId } })
          .populate({ path: 'for_portal_user', select: 'email phone_number centre_name country_code' })
          .select('address')

        getTestResult[index].centerDetails = getCenterDetails[0]
      }

      return sendResponse(req, res, 200, {
        status: true,
        data: getTestResult,
        message: `Test result fetched successfully!`,
        errorCode: null,
      });
    } catch (error) {
      console.log(error, 'error');
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `Something went wrong while fetching test result.`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async getTestResultsById(req, res) {
    try {
      const resultId = req.params.id

      const getTestResult = await TestResult.findById(resultId).lean();;
      if (!getTestResult) {
        return sendResponse(req, res, 200, {
          status: false,
          data: null,
          message: `Test result not exist!`,
          errorCode: null,
        });
      }

      const getCenterDetails = await LocationInfo.find({ for_portal_user: { $eq: getTestResult?.resultAddedBy } })
        .populate({
          path: 'for_portal_user',
          select: 'email phone_number centre_name country_code'
        })
        .select('address')
      getTestResult.centerDetails = getCenterDetails[0]
      let resultData = []
      if (getTestResult?.resultType === 'upload' && getTestResult?.uploadResultData?.length > 0) {
        for (const val of getTestResult?.uploadResultData) {
          resultData.push({
            key: val,
            signedUrl: await generateSignedUrl(val)
          })
        }
      }
      getTestResult.uploadResultData = resultData

      return sendResponse(req, res, 200, {
        status: true,
        data: getTestResult,
        message: `Test result fetched successfully!`,
        errorCode: null,
      });
    } catch (error) {
      console.log(error, 'error');
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `Something went wrong while fetching test result.`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async updateAppointmentStatus(req, res) {
    try {
      const {
        appointmentId,
        actionName,
        actionValue,
      } = req.body;

      const headers = {
        Authorization: req.headers["authorization"],
      };

      const getAppointment = await Appointment.findById(appointmentId)
      if (!getAppointment) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "Appointment not found",
          errorCode: null,
        })
      }
      const date = new Date()

      let history = {
        status: actionValue == 'UNDER_PROCESSED' ? 'INPROGRESS' : actionValue,
        updatedAt: date.toISOString(),
        updatedById: req?.user?.role == 'patient' ? req?.user?.portalUserId : req?.user?._id,
        role: getAppointment?.serviceType,
      }

      const labTestRecords = getAppointment?.labTestIds
        ? getAppointment?.labTestIds.map((val) => {
          if (val.status !== 'COMPLETED') {
            val.status = actionValue === 'UNDER_PROCESSED' ? 'INPROGRESS' : actionValue;
            val.testHistory = val.testHistory ? [...val.testHistory, history] : [history];
          }
          return val;
        })
        : [];

      const radiologyTestRecords = getAppointment?.radiologyTestIds
        ? getAppointment?.radiologyTestIds.map((val) => {
          if (val.status !== 'COMPLETED') {
            val.status = actionValue === 'UNDER_PROCESSED' ? 'INPROGRESS' : actionValue;
            val.testHistory = val.testHistory ? [...val.testHistory, history] : [history];
          }
          return val;
        })
        : [];

      history.status = actionValue
      await Appointment.findOneAndUpdate(
        {
          _id: appointmentId
        },
        {
          $set: {
            [actionName]: actionValue,
            labTestIds: labTestRecords,
            radiologyTestIds: radiologyTestRecords
          },
          $push: { orderHistory: history }
        }
      )

      if (actionValue === 'COMPLETED') {
        if (getAppointment?.serviceType === 'lab') {
          if (getAppointment?.labTestIds?.length) {
            const testIds = getAppointment.labTestIds.map(test => test.testId);
            await httpService.putStaging(
              "patient-clinical-info/lab-radio-update-prescribed-test-status-by-testIds",
              {
                prescribedLabRadiologyTestId: getAppointment?.prescribedLabRadiologyTestId,
                type: getAppointment?.serviceType,
                status: 'COMPLETED',
                testIds,
              },
              headers,
              "doctorServiceUrl"
            );
          }
        } else {
          if (getAppointment?.radiologyTestIds?.length) {
            const testIds = getAppointment.radiologyTestIds.map(test => test.testId);
            await httpService.putStaging(
              "patient-clinical-info/lab-radio-update-prescribed-test-status-by-testIds",
              {
                prescribedLabRadiologyTestId: getAppointment?.prescribedLabRadiologyTestId,
                type: getAppointment?.serviceType,
                status: 'COMPLETED',
                testIds,
              },
              headers,
              "doctorServiceUrl"
            );
          }

        }
      }


      let testName
      if (getAppointment?.serviceType == 'lab') {
        const getTestName = await LabTest.find({ _id: { $in: getAppointment?.labTestIds.map(val => mongoose.Types.ObjectId(val?.testId)) } }).select('testName')
        testName = getTestName.map(val => val?.testName)
      } else {
        const getTestName = await RadiologyTest.find({ _id: { $in: getAppointment?.radiologyTestIds.map(val => mongoose.Types.ObjectId(val?.testId)) } }).select('testName')
        testName = getTestName.map(val => val?.testName)
      }
      const type = getAppointment?.serviceType == 'lab' ? 'LABORATORY' : 'RADIOLOGY'
      let paramsData = {
        sendTo: 'patient',
        madeBy: getAppointment?.serviceType == 'lab' ? 'laboratory' : 'radiology',
        patientId: getAppointment?.patientId,
        doctorId: getAppointment?.doctorId,
        labRadiologyId: getAppointment?.labRadiologyId,
        appointment: {
          _id: getAppointment?._id
        },
        consultationDate: getAppointment?.consultationDate,
        consultationTime: getAppointment?.consultationTime,
        condition: actionValue == 'UNDER_PROCESSED' ? `UNDER_PROCESS_${type}_APPOINTMENT` : `COMPLETED_${type}_APPOINTMENT`,
        notification: ['push_notification', 'sms', 'email'],
        testName: testName.join(', '),
      }
      sendNotification(paramsData, headers)

      return sendResponse(req, res, 200, {
        status: true,
        data: null,
        message: `Appointment updated successfully!`,
        errorCode: null,
      });
    } catch (error) {
      console.log(error, 'error');
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `Something went wrong while updating appointment status.`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async getTestRecord(req, res) {
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };
      const {
        appointmentId,
        testId,
      } = req.query;

      const getAppointment = await Appointment.findById(appointmentId);
      //Get Patient Details
      const getPatientDetails = await httpService.getStaging(
        "patient/patient-details",
        { patient_id: getAppointment?.patientId },
        headers,
        "patientServiceUrl"
      );
      const result = await LabTest.findOne({ _id: { $eq: testId }, isDeleted: false })
        .populate({ path: 'tests.testId', select: 'referenceRange testConfiguration' }).lean()
      const testConfiguration = []
      const patientDOB = getPatientDetails?.body?.personalDetails?.dob;
      const patientGender = getPatientDetails?.body?.personalDetails?.gender;
      if (getPatientDetails.status && patientDOB && patientGender) {
        const currentDate = new Date();
        const patientAge = getDifferenceInDays(patientDOB, currentDate)
        for (const test of result?.tests ?? []) {         
            const referenceRange = test?.testId?.referenceRange.filter(val => {
              const resultAgeLow = Number(val.age.split(('-'))[0])
              const resultAgeHigh = Number(val.age.split(('-'))[1])
              return (
                val.gender.toLowerCase() === patientGender.toLowerCase() &&
                resultAgeLow <= patientAge &&
                patientAge <= resultAgeHigh
              );
              
            })
            let data = {
              procedure: test.testName,
              testConfiguration: test?.testId?.testConfiguration
            }
            if (referenceRange.length > 0) {
              data['referencerange'] = test?.testId?.testConfiguration == 'NUMERIC_RESULT' ?
                `${referenceRange[0].low} - ${referenceRange[0].high}`
                : null
            } else {
              data['referencerange'] = test?.testId?.testConfiguration == 'NUMERIC_RESULT' ?
                `${test?.testId?.referenceRange[0].low} - ${test?.testId?.referenceRange[0].high}`
                : null
            }
            testConfiguration.push(data)
        }
      } else {
        for (const test of result?.tests ?? []) {
          const data = {
            procedure: test.testName,
            testConfiguration: test?.testId?.testConfiguration,
            referencerange: test?.testId?.testConfiguration == 'NUMERIC_RESULT' ?
              `${test?.testId?.referenceRange[0].low} - ${test?.testId?.referenceRange[0].high}`
              : null
          }
          testConfiguration.push(data)
        }
      }
      // delete result.tests
      result.testConfiguration = testConfiguration
      return sendResponse(req, res, 200, {
        status: true,
        data: result,
        message: `Test records fetched successfully!`,
        errorCode: null,
      });
    } catch (error) {
      console.log(error, 'error');
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `Something went wrong while fetching test records.`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async getAppointmentReport(req, res) {
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };
      const {
        appointmentId,
      } = req.query;

      const getAppointment = await Appointment.find({ parentAppointmentId: { $eq: appointmentId }, status: { $in: ['UNDER_PROCESSED', 'COMPLETED'] } })
        .populate({ path: 'labRadiologyId', select: 'centre_name' })
        .populate({ path: 'radiologyTestIds.testId', select: 'testName' })
        .populate({ path: 'labTestIds.testId', select: 'testName' })
        .select('status serviceType');

      // Get All ordered medicine for appointment
      let orderData = []
      const getData = await httpService.getStaging(`order/get-orded-medicine-of-appointment`, { appointmentId }, headers, 'pharmacyServiceUrl');
      if (getData.status) {
        orderData = getData?.data
      }
      return sendResponse(req, res, 200, {
        status: true,
        data: {
          labRadioData: getAppointment,
          orderData
        },
        message: `Test report fetched successfully!`,
        errorCode: null,
      });
    } catch (error) {
      console.log(error, 'error');
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `Something went wrong while fetching test report.`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async delayedAppointmentCron() {
    try {
      //Generate random token to be used for authenticating API for CRON
      const token = generateToken({ role: 'superadmin' })
      const headers = {
        Authorization: 'Bearer ' + token,
      };

      const getAllAppointments = await Appointment.find({ status: "UNDER_PROCESSED", is_delay: false })
        .select('orderHistory')
      for (const element of getAllAppointments) {
        if ('orderHistory' in element && element?.orderHistory.length > 0) {
          const getUnderProcessHistory = element?.orderHistory.filter(val => val.status === "UNDER_PROCESSED")
          //Get general setting
          let getSettings = await httpService.getStaging('superadmin/general-settings', { role: 'labradio' }, headers, 'superadminServiceUrl');
          let delayTime = 24 //Default 24 hour
          if (getSettings.status) {
            const data = getSettings?.body?.filter(val => val?.settingName == 'AppointmentDelayTime')
            delayTime = parseInt(data[0]?.settingValue)

          }
          if (getUnderProcessHistory.length > 0) {
            const timeAfterAddedHours = new Date(new Date(getUnderProcessHistory[0]?.updatedAt).getTime() + 60 * 60 * delayTime * 1000);
            const currentDate = new Date()
            if (timeAfterAddedHours.getTime() < currentDate.getTime()) {
              //Update appointment and mark them as delayed
              await Appointment.findOneAndUpdate(
                { _id: element?._id },
                {
                  $set: {
                    is_delay: true,
                  }
                }
              )
            }
          }
        }
      }
    } catch (error) {
      console.log(error, 'delayedAppointmentCron');
    }
  }
  async getDelayedAppointment(req, res) {
    try {
      const headers = {
        Authorization: req.headers["authorization"],
      };
      const {
        serviceType,
        page,
        limit,
        status,
        date,
        sort,
        fromDate,
        toDate
      } = req.query;

      let appointmentStatus
      if (status === 'ALL') {
        appointmentStatus = ["UNDER_PROCESSED"]
      } else {
        appointmentStatus = status
      }

      let date_filter = {}
      if (date) {
        date_filter['consultationDate'] = date
      }
      if (fromDate && toDate) {
        date_filter = {
          consultationDate: { $gte: fromDate, $lte: toDate }
        }
      }

      const pipeline = [
        {
          $lookup: {
            from: "portalusers",
            localField: "labRadiologyId",
            foreignField: "_id",
            as: "portalusers",
          },
        },
        {
          $unwind: {
            path: "$portalusers",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            centre_name: "$portalusers.centre_name",
            centre_name_arabic: "$portalusers.centre_name_arabic",
            type: "$portalusers.type",
          },
        },
        {
          $match: {
            status: status === 'ALL' ? { $in: appointmentStatus } : appointmentStatus,
            serviceType,
            is_delay: true,
            $and: [
              date_filter,
            ]
          }
        },
      ]
      if (req?.user?.role == 'INDIVIDUAL') {
        pipeline.push({ $match: { labRadiologyId: mongoose.Types.ObjectId(req?.user?._id) } });
      }

      pipeline.push({
        $group: {
          _id: "$_id",
          appointmentId: { $first: "$appointment_id" },
          createdAt: { $first: "$createdAt" },
          patientId: { $first: "$patientId" },
          doctorId: { $first: "$doctorId" },
          consultationDate: { $first: "$consultationDate" },
          consultationTime: { $first: "$consultationTime" },
          status: { $first: "$status" },
          centreName: { $first: "$centre_name" },
          centreNameArabic: { $first: "$centre_name_arabic" },
          type: { $first: "$type" },
        }
      },)
      let sortKey = 'createdAt'
      let sortValue = -1
      if (sort) {
        sortKey = sort.split(':')[0]
        sortValue = sort.split(':')[1]
      }

      pipeline.push(
        {
          $sort:
          {
            [sortKey]: Number(sortValue)
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
              { $limit: limit * 1 },
            ] : [
              { $skip: 0 },
            ],
          }
        }
      )
      const result = await Appointment.aggregate(pipeline);
      const statuses = {
        PENDING: 'Pending',
        CANCELLED: 'Cancelled',
        APPROVED: 'Approved',
        UNDER_PROCESSED: 'Under Process',
        COMPLETED: 'Completed',
        MISSED: 'Missed'
      }
      const paginatedResults = result[0].paginatedResults
      const patientDetails = getAllPatient(paginatedResults)
      const doctorDetails = getAllDoctor(paginatedResults, headers)
      //Find all Counts
      let filter = { serviceType }
      if (req?.user?.role == 'INDIVIDUAL') {
        filter.labRadiologyId = mongoose.Types.ObjectId(req?.user?._id)
      }
      const getDelayedAppointments = Appointment.find({ ...filter, is_delay: true, status: 'UNDER_PROCESSED' }).countDocuments()
      const getTotalAppointments = Appointment.find({ ...filter }).countDocuments()
      const getCompletedAppointments = Appointment.find({ ...filter, status: 'COMPLETED' }).countDocuments()

      const promisesResult = await Promise.all([patientDetails, doctorDetails, getDelayedAppointments, getTotalAppointments, getCompletedAppointments])

      for (let index = 0; index < paginatedResults.length; index++) {
        if (req?.user?.role == 'INDIVIDUAL') {
          paginatedResults[index].patientName = promisesResult[0][paginatedResults[index].patientId.toString()]?.full_name
          paginatedResults[index].patientProfile = promisesResult[0][paginatedResults[index].patientId.toString()]?.profile_pic
          paginatedResults[index].doctorName = promisesResult[1][paginatedResults[index].doctorId.toString()]?.full_name
          paginatedResults[index].doctorNameArabic = promisesResult[1][paginatedResults[index].doctorId.toString()]?.full_name_arabic
          paginatedResults[index].doctorProfile = promisesResult[1][paginatedResults[index].doctorId.toString()]?.profilePicture
        }
        paginatedResults[index].status = statuses[paginatedResults[index].status]
      }

      let totalCount = 0
      if (result[0].totalCount.length > 0) {
        totalCount = result[0].totalCount[0].count
      }

      return sendResponse(req, res, 200, {
        status: true,
        message: `appointment list fetched successfully`,
        data: {
          countRecords: {
            delayedCount: promisesResult[2],
            totalCount: promisesResult[3],
            completedCount: promisesResult[4],
          },
          totalRecords: totalCount,
          currentPage: page,
          totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
          data: result[0]?.paginatedResults,
        },
        errorCode: null,
      });
    } catch (error) {
      console.log(error, 'error');
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `Something went wrong while fetching delayed appointment.`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async getTestHistory(req, res) {
    try {
      const appointmentId = req.params.id
      const getAppointment = await Appointment.findById(appointmentId)
        .populate({
          path: 'labTestIds.testId',
          select: 'testName'
        })
        .populate({
          path: 'radiologyTestIds.testId',
          select: 'testName'
        })
        .lean()
      if (!getAppointment) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "Appointment not found",
          errorCode: null,
        })
      }
      const getIds = getAppointment?.orderHistory ? getAppointment?.orderHistory.map(val => val.updatedById) : []
      let getIds1 = []
      for (const element of getAppointment[getAppointment?.serviceType == 'lab' ? 'labTestIds' : 'radiologyTestIds']) {
        const getIds = element.testHistory ? element.testHistory.map(val => val.updatedById) : []
        getIds1 = [...getIds1, ...getIds]
      }

      const userIds = [...new Set([...getIds, ...getIds1])]
      let testHistory = []
      let orderHistory = []
      if (userIds.length > 0) {
        const getPatientData = getAllPatient('', userIds)
        const getPortalData = PortalUser.find({ _id: { $in: userIds } }).select('centre_name centre_name_arabic full_name full_name_arabic')
        const allData = await Promise.all([getPatientData, getPortalData])
        let getNameObject = {}
        for (const idx in allData[0]) {
          getNameObject[idx] = {
            name: allData[0][idx]?.full_name,
            name_arabic: allData[0][idx]?.full_name_arabic
          }
        }
        for (const ele of allData[1]) {
          const centre_name_arabic = 'centre_name_arabic' in ele ? `${ele.centre_name_arabic} (Owner)` : ''
          const full_name_arabic = 'full_name_arabic' in ele ? `${ele.full_name_arabic} (Staff)` : ''
          getNameObject[ele?._id] = {
            name: 'centre_name' in ele ? `${ele.centre_name} (Owner)` : `${ele?.full_name} (Staff)`,
            name_arabic: centre_name_arabic ? centre_name_arabic : full_name_arabic ? full_name_arabic : ''
          }
        }
        orderHistory = getAppointment.orderHistory.map(val => {
          val.name = val?.updatedById in getNameObject ? getNameObject[val?.updatedById]?.name : ''
          val.name_arabic = val?.updatedById in getNameObject ? getNameObject[val?.updatedById]?.name_arabic : ''
          return val
        })

        testHistory = getAppointment?.[getAppointment?.serviceType == 'lab' ? 'labTestIds' : 'radiologyTestIds'].map(ele => {
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
        message: `Test history fetched successfully`,
        data: {
          testHistory,
          orderHistory,
        },
        errorCode: null,
      });
    } catch (error) {
      console.log(error, 'error');
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: `Something went wrong while fetching test history.`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async exportlistAppointment(req, res) {
    const headers = {
      Authorization: req.headers["authorization"],
    };

    try {
      const {
        serviceType,
        patientId,
        searchText,
        page,
        limit,
        status,
        date,
        sort,
        fromDate,
        toDate,
        labRadiologyId
      } = req.query;

      let appointmentStatus
      if (status === 'ALL') {
        appointmentStatus = ["PENDING", "CANCELLED", "APPROVED", "COMPLETED", "UNDER_PROCESSED", "MISSED"]
      } else {
        appointmentStatus = status
      }
      let search_filter = [{}]
      if (searchText) {
        search_filter = [
          { appointment_id: { $regex: searchText || "", $options: "i" } },
        ]
      }
      let date_filter = {}
      if (date) {
        date_filter['consultationDate'] = date
      }
      if (fromDate && toDate) {
        date_filter = {
          consultationDate: { $gte: fromDate, $lte: toDate }
        }
      }

      const pipeline = [
        {
          $lookup: {
            from: "portalusers",
            localField: "labRadiologyId",
            foreignField: "_id",
            as: "portalusers",
          },
        },
        {
          $unwind: {
            path: "$portalusers",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            centre_name: "$portalusers.centre_name",
            centre_name_arabic: "$portalusers.centre_name_arabic",
            type: "$portalusers.type",
          },
        },
        {
          $match: {
            status: status === 'ALL' ? { $in: appointmentStatus } : appointmentStatus,
            serviceType,
            $or: search_filter,
            $and: [
              date_filter,
            ]
          }
        },
        {
          $lookup: {
            from: "labtests",
            localField: "labTestIds.testId",
            foreignField: "_id",
            as: "labtests",
          },
        },
        {
          $unwind: {
            path: "$labtests",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            labTestName: "$labtests.testName",
          },
        },
        {
          $lookup: {
            from: "radiologytests",
            localField: "radiologyTestIds.testId",
            foreignField: "_id",
            as: "radiologytests",
          },
        },
        {
          $unwind: {
            path: "$radiologytests",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            radiologyTestName: "$radiologytests.testName",
          },
        },
      ]
      if (req?.user?.role == 'patient') {
        pipeline.push(
          { $match: { patientId: mongoose.Types.ObjectId(patientId ? patientId : req?.user?.portalUserId) } }
        );
      } else if (req?.user?.role == 'INDIVIDUAL' || req?.user?.role == 'ADMIN') {
        pipeline.push({ $match: { labRadiologyId: mongoose.Types.ObjectId(labRadiologyId ? labRadiologyId : req?.user?._id) } });
      }

      pipeline.push({
        $group: {
          _id: "$_id",
          appointmentId: { $first: "$appointment_id" },
          createdAt: { $first: "$createdAt" },
          patientId: { $first: "$patientId" },
          doctorId: { $first: "$doctorId" },
          consultationDate: { $first: "$consultationDate" },
          consultationTime: { $first: "$consultationTime" },
          status: { $first: "$status" },
          centreName: { $first: "$centre_name" },
          centreNameArabic: { $first: "$centre_name_arabic" },
          labTestName: { $push: "$labTestName" },
          radiologyTestName: { $push: "$radiologyTestName" },
          type: { $first: "$type" },
        }
      },)
      let sortKey = 'createdAt'
      let sortValue = -1
      if (sort) {
        sortKey = sort.split(':')[0]
        sortValue = sort.split(':')[1]
      }

      pipeline.push(
        {
          $sort:
          {
            [sortKey]: Number(sortValue)
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
              { $skip: searchText ? 0 : (page - 1) * limit },
              { $limit: limit * 1 },
            ] : [
              { $skip: 0 },
            ],
          }
        }
      )
      const result = await Appointment.aggregate(pipeline);
      const statuses = {
        PENDING: 'Pending',
        CANCELLED: 'Cancelled',
        APPROVED: 'Approved',
        UNDER_PROCESSED: 'Under Process',
        COMPLETED: 'Completed',
        MISSED: 'Missed'
      }
      const paginatedResults = result[0].paginatedResults
      const patientDetails = getAllPatient(paginatedResults)
      const doctorDetails = getAllDoctor(paginatedResults, headers)
      const promisesResult = await Promise.all([patientDetails, doctorDetails])

      for (let index = 0; index < paginatedResults.length; index++) {
        paginatedResults[index].patientName = promisesResult[0][paginatedResults[index].patientId.toString()]?.full_name
        paginatedResults[index].patientMRN = promisesResult[0][paginatedResults[index].patientId.toString()]?.mrn_number
        paginatedResults[index].patientProfile = promisesResult[0][paginatedResults[index].patientId.toString()]?.profile_pic
        paginatedResults[index].doctorName = promisesResult[1][paginatedResults[index].doctorId.toString()]?.full_name
        paginatedResults[index].doctorNameArabic = promisesResult[1][paginatedResults[index].doctorId.toString()]?.full_name_arabic
        paginatedResults[index].doctorProfile = promisesResult[1][paginatedResults[index].doctorId.toString()]?.profilePicture
        paginatedResults[index].status = statuses[paginatedResults[index].status]
      }

      let totalCount = 0
      if (result[0].totalCount.length > 0) {
        totalCount = result[0].totalCount[0].count
      }
      let modifyArray = result[0]?.paginatedResults.map(obj => ({
        patientName: obj.patientName,
        patientMRN: obj.patientMRN,
        doctorName: obj.doctorName,
        appointmentId: obj.appointmentId,
        appointmentDate_time: `${obj.consultationDate} ${obj.consultationTime}`,
        status: obj.status,
        testName: obj.labTestName.length > 0 ? obj.labTestName.join(', ') : obj.radiologyTestName.join(', '),
      }));

      // Convert to array of arrays if needed
      let array = modifyArray.map(obj => Object.values(obj));
      return sendResponse(req, res, 200, {
        status: true,
        message: `appointment list fetched successfully`,
        data: {
          totalRecords: totalCount,
          currentPage: page,
          totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
          data: result[0]?.paginatedResults,
          array
        },
        errorCode: null,
      });
    } catch (error) {
      console.log("Error while fetching appointment: ", error);
      return sendResponse(req, res, 500, {
        status: false,
        message: error.message
          ? error.message
          : `something went wrong while fetching list`,
        body: error,
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }
  async getTestProcedureHistory(req, res) {
    try {
      const { page, limit, procedure, patientId } = req.query
      const pipeline = [
        {
          $match: {
            resultType: 'manual',
            patientId: mongoose.Types.ObjectId(patientId),
            manualResultData: {
              $elemMatch: {
                procedure: procedure,
                status: { $ne: 'PENDING' }
              }
            }
          }
        },
        {
          $project: {
            manualResultData: {
              $filter: {
                input: '$manualResultData',
                as: 'item',
                cond: {
                  $and: [
                    { $eq: ['$$item.procedure', procedure] },
                    { $ne: ['$$item.status', "PENDING"] }
                  ]
                }
              }
            },
            resultType: 1,
            patientId: 1,
            updatedAt: 1
          }
        },
        {
          $sort:
          {
            updatedAt: -1
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
              { $limit: limit * 1 },
            ] : [
              { $skip: 0 },
            ],
          }
        }
      ]
      const getTestResult = await TestResult.aggregate(pipeline);
      let totalCount = 0
      if (getTestResult[0].totalCount.length > 0) {
        totalCount = getTestResult[0].totalCount[0].count
      }

      return sendResponse(req, res, 200, {
        status: true,
        message: `appointment list fetched successfully`,
        data: {
          totalRecords: totalCount,
          currentPage: page,
          totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
          data: getTestResult[0]?.paginatedResults,
        },
        errorCode: null,
      });
    } catch (error) {
      console.log("Error while fetching appointment: ", error);
      return sendResponse(req, res, 500, {
        status: false,
        message: error.message
          ? error.message
          : `something went wrong while fetching list`,
        body: error,
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**Fetch order test results from alborge lab - Feb 3 */
  async getOrderResultPdf(req, res) {
    try {
      const { accessionNumber, orderId } = req.body;
      const isTokengenerated = await generateTokenForLabTest(requestBody)
      if (isTokengenerated?.isSuccess) {
        let token = isTokengenerated.data.token;
        const result = await getOrderResult(token, accessionNumber, orderId);

        if (result?.isSuccess) {
          return sendResponse(req, res, 200, {
            status: true,
            message: `Result fetched successfully`,
            data: result?.data,
            errorCode: null,
          });
        } else {
          return sendResponse(req, res, 400, {
            status: false,
            message: `Results are not ready yet.`,
            data: {},
            errorCode: null,
          });
        }
      } else {
        return sendResponse(req, res, 400, {
          status: false,
          message: `Token is not generated`,
          data: {},
          errorCode: null,
        });
      }
    } catch (error) {
      return sendResponse(req, res, 500, {
        status: false,
        message: error.message
          ? error.message
          : `something went wrong while fetching list`,
        body: error,
        errorCode: error.code ? error.code : "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async getAlborgeTestReport() {
    try {
      const getAllAppointments = await Appointment.find({
        status: { $ne: "COMPLETED" }
      });
      for (const element of getAllAppointments) {
        if ('registrationData' in element && element?.registrationData.length > 0) {
          const accessionNumber = element?.registrationData[0].accessionNumber;
          const isTokengenerated = await generateTokenForLabTest(requestBody);
          if (isTokengenerated?.isSuccess) {
            let token = isTokengenerated.data.token;
            const result = await getOrderResult(token, accessionNumber, "");
            if (result?.isSuccess && result?.data?.length) {
              let alborgeRes = result?.data[0];
              let allServices = alborgeRes?.results.flatMap(report =>
                report.services.map(service => ({
                  ...service, // Spread the properties from the service
                  link: report.link, // Add the link from the report
                  reportName: report.reportName, // Add the report name from the report
                  isReviewed: report.isReviewed // Add the isReviewed from the report
                }))
              );
              let res = {
                patientNumber: alborgeRes?.patientNumber,
                orderId: alborgeRes?.orderId,
                accessionNumber: alborgeRes?.accessionNumber,
                isPaid: alborgeRes?.isPaid,
                results: allServices,
                allServicesLink: alborgeRes?.allServicesLink
              }

              await responseFormation(alborgeRes?.results, element._id);

              if (alborgeRes?.allServicesLink && alborgeRes?.results?.length) {
                if (element?.labTestIds?.length == alborgeRes?.results?.length) {
                  await Appointment.findOneAndUpdate(
                    { _id: element._id },
                    {
                      $set: {
                        isAlborgeResultReceived: true,
                        alborgeResponse: res
                      },
                    },
                    { upsert: false, new: true }
                  ).exec();

                } else {
                  await Appointment.findOneAndUpdate(
                    { _id: element._id },
                    {
                      $set: {
                        isAlborgeResultReceived: true,
                        alborgeResponse: res
                      },
                    },
                    { upsert: false, new: true }
                  ).exec();
                }

              } else if (element.status == "PENDING" || element.status == "APPROVED") {
                await Appointment.findOneAndUpdate(
                  { _id: element._id },
                  {
                    $set: {
                      status: "UNDER_PROCESSED"
                    },
                  },
                  { upsert: false, new: true }
                ).exec();

              }
            }
          }
        }
      }
    }
    catch (error) {
      console.log(error, 'getAlborgeTestReport');
    }
  }

  async appointmentDetailsByPrescribedId(req, res) {
    try {
      const { ids } = req.query;

      // Normalize ids to an array
      const idArray = Array.isArray(ids) ? ids : ids.split(",");

      // Convert IDs to ObjectId if needed
      const objectIds = idArray.map(id => mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id);

      // Fetch matching appointments
      const result = await Appointment.find({
        prescribedLabRadiologyTestId: { $in: objectIds },
        isAlborgeResultReceived: true,
      });

      // Prepare response data
      let reportResponse = result.map((appointment) => ({
        patientId: appointment.patientId,
        prescribedLabRadiologyTestId: appointment?.prescribedLabRadiologyTestId?.toString(),
        alborgeResponse: appointment?.alborgeResponse,
        isAlborgeResultReceived: appointment?.isAlborgeResultReceived,
        parentAppointmentId: appointment?.parentAppointmentId
      }));

      // Identify missing IDs
      const foundIds = result.map((appointment) => appointment.prescribedLabRadiologyTestId?.toString());
      const missingIds = idArray.filter((id) => !foundIds.includes(id));

      return sendResponse(req, res, 200, {
        status: true,
        data: {
          reportResponse,
          missingIds, // Show which IDs were not found
        },
        message: "Appointments fetched successfully",
        errorCode: null,
      });

    } catch (error) {
      console.error("Error fetching appointments:", error);
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: error.message,
        errorCode: error.code,
      });
    }
  }

  async updateAppointmentStatusForExternalResults(req, res) {
    try {
      const { appointmentId, testId, externalResults, status } = req.body;

      // Find the appointment
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "Appointment not found",
          errorCode: null,
        });
      }

      // Find the specific test in the appointment
      const testIndex = appointment.labTestIds.findIndex(test => test.testId.toString() === testId);
      if (testIndex === -1) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "Test ID not found in the appointment",
          errorCode: null,
        });
      }

      const previousStatus = appointment.labTestIds[testIndex].status;

      // Update the specific testId in labTestIds array
      const updatedAppointment = await Appointment.findOneAndUpdate(
        {
          _id: appointmentId,
          "labTestIds.testId": testId
        },
        {
          $set: {
            "labTestIds.$.status": status,
            "labTestIds.$.extrenalResults": externalResults
          },
          $push: {
            "labTestIds.$.testHistory": {
              status: status,
              updatedAt: new Date().toISOString(),
              role: appointment.serviceType
            }
          }
        },
        { new: true } // Return updated document
      );

      if (!updatedAppointment) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "Failed to update test status",
          errorCode: null,
        });
      }

      // Notify users only if the status changed to "COMPLETED" for the first time
      if (status === "COMPLETED" && previousStatus !== "COMPLETED") {
        let notifyUsersData = {
          patientId: appointment?.patientId,
          doctorId: appointment?.doctorId,
          appointment_id: appointment?._id,
          orderId: appointment?.appointment_id,
          labRadiologyId: appointment?.labRadiologyId
        };
        notifyUsers(notifyUsersData);
      }

      // Check if all lab tests have status "COMPLETED"
      const allTestsCompleted = updatedAppointment.labTestIds.every(test => test.status === "COMPLETED");

      // If all tests are completed, update the appointment status
      if (allTestsCompleted) {
        await Appointment.findByIdAndUpdate(
          appointmentId,
          { status: "COMPLETED" },
          { new: true }
        );
      }

      return sendResponse(req, res, 200, {
        status: true,
        data: updatedAppointment,
        message: "Appointment updated successfully!",
        errorCode: null,
      });

    } catch (error) {
      console.error("Error updating appointment status:", error);
      return sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: error.message,
        errorCode: null,
      });
    }
  }




  async getDashboardLabRadiologyReportExport(req, res) {
    const headers = {
      Authorization: req.headers["authorization"],
    };

    try {
      const { fromDate, toDate, type, labRadioId } = req.query;
      let filter = { serviceType: type };

      if (fromDate && toDate) {
        const fromDateObj = new Date(`${fromDate} 00:00:00`);
        const toDateObj = new Date(`${toDate} 23:59:59`);
        filter.createdAt = { $gte: fromDateObj, $lte: toDateObj };
      }

      if (labRadioId) {
        filter.labRadiologyId = mongoose.Types.ObjectId(labRadioId);
      }

      // **Fetch appointments**
      const getTotalAppointments = await Appointment.find({
        ...filter,
        status: { $in: ["PENDING", "CANCELLED", "UNDER_PROCESSED", "APPROVED", "COMPLETED"] }
      }).lean();

      // **Extract Unique LabRadiology IDs**
      const labRadiologyIds = [...new Set(getTotalAppointments.map(a => a.labRadiologyId?.toString()))];

      // **Fetch Centre Details**
      const centreDetails = {};
      if (labRadiologyIds.length > 0) {
        const centres = await PortalUser.find(
          { _id: { $in: labRadiologyIds } },
          { _id: 1, centre_name: 1, centre_name_arabic: 1 }
        ).lean();

        centres.forEach(centre => {
          centreDetails[centre._id.toString()] = {
            centre_name: centre.centre_name,
            centre_name_arabic: centre.centre_name_arabic
          };
        });
      }

      // **Fetch patient and doctor details in parallel**
      const [patientDetails, doctorDetails] = await Promise.all([
        getAllPatient(getTotalAppointments),
        getAllDoctor(getTotalAppointments, headers),
      ]);

      // **Format Data**
      const formattedData = getTotalAppointments.map(appointment => {
        const patientId = appointment.patientId?.toString();
        const doctorId = appointment.doctorId?.toString();
        const labRadiologyId = appointment.labRadiologyId?.toString();

        return {
          appointment_id: appointment.appointment_id,
          consultationDate: appointment.consultationDate,
          consultationTime: appointment.consultationTime,
          status: appointment.status,
          patientName: patientDetails[patientId]?.full_name || null,
          doctorName: doctorDetails[doctorId]?.full_name || null,
          centreName: centreDetails[labRadiologyId]?.centre_name || null,
          centreNameArabic: centreDetails[labRadiologyId]?.centre_name_arabic || null,
        };
      });
      return sendResponse(req, res, 200, {
        status: true,
        message: "Export data fetched successfully",
        body: formattedData,
        errorCode: null,
      });
    } catch (error) {
      console.error("Failed to get dashboard data", error);
      return sendResponse(req, res, 500, {
        status: false,
        body: error.message,
        message: "Failed to get dashboard data",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  async updateExternalLabRadioStatus(req,res){    
    try {
      console.log("15 days cron for external started__");

      const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
        
      const appointments = await Appointment.find({status: { $nin: ['CANCELLED', 'COMPLETED'] },
        createdAt: { $lte: fifteenDaysAgo },       
      });
  
      const bulkOperations = appointments.map((appointment) => {
        return {
          updateOne: {
            filter: { _id: appointment._id },
            update: {
              $set: {
                status: "CANCELLED",
                cancelReason: "External results not added.",
                cancelType: 'auto',
                cancel_by: appointments?.serviceType,
                cancelledOrAcceptedBy:appointments?.labRadiologyId
              },
            },
          },
        };
      });
  
      // Execute bulk update
      if (bulkOperations.length > 0) {
        await Appointment.bulkWrite(bulkOperations);
      }    
    
    } catch (error) {
      console.error("Failed to update external lab radio status", error)   
    }  
  }

}

module.exports = new AppointmentController()