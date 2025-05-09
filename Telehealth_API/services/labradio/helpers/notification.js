"use strict";
import { sendEmail } from "./ses";
import Http from "./httpservice";
const httpService = new Http();
import { sendPushNotification } from "./firebase_notification";
import { sendSms } from "../middleware/sendSms";

export const notification = (paramsData, headers, requestData) => {
  return new Promise(async(resolve, reject) => {
    try {
      let endPoint = ''
      let serviceUrl = ''
      if (paramsData?.sendTo == 'patient') {
        endPoint = "patient/notification"
        serviceUrl = 'patientServiceUrl'
      }
      if (paramsData?.sendTo == 'laboratory' || paramsData?.sendTo == 'radiology') {
        endPoint = "lab-radio/notification"
        serviceUrl = 'labradioServiceUrl'
      }
      if (endPoint && serviceUrl) {
        await httpService.postStaging( endPoint, requestData, headers, serviceUrl );
      }
      resolve(true)
    } catch (error) {
      console.log('Error while saving notification into database', error);
      resolve(false)
    }
  })
}

const generateNotificationMessage = (type, content, contentData) => {
    let message = ''
    switch (type) {
      case "BOOK_LABORATORY_APPOINTMENT":
      case "APPROVED_LABORATORY_APPOINTMENT":
      case "REJECTED_LABORATORY_APPOINTMENT":
      case "CANCELLED_LABORATORY_APPOINTMENT":
      case "UNDER_PROCESS_LABORATORY_APPOINTMENT":
      case "COMPLETED_LABORATORY_APPOINTMENT":
      case "BOOK_RADIOLOGY_APPOINTMENT":
      case "APPROVED_RADIOLOGY_APPOINTMENT":
      case "REJECTED_RADIOLOGY_APPOINTMENT":
      case "CANCELLED_RADIOLOGY_APPOINTMENT":
      case "UNDER_PROCESS_RADIOLOGY_APPOINTMENT":
      case "COMPLETED_RADIOLOGY_APPOINTMENT":
      case "REGISTERED_EXTERNAL_LAB":  
      case "BOOK_LABORATORY_RADIOLOGY":
      case "CANCELLED_LABRADIO_APPOINTMENT":  
        message = content
          .replace(/{{consultationDate}}/g, contentData?.consultationDate || '')
          .replace(/{{consultationTime}}/g, contentData?.consultationTime || '')
          .replace(/{{test_name}}/g, contentData?.testName || '')
          .replace(/{{centre_name}}/g, contentData?.labRadioName || '')
          .replace(/{{patient_name}}/g, contentData?.patientName || '')
          .replace(/{{lab_name}}/g, contentData?.labRadioName || '')
          .replace(/{{order_number}}/g, contentData?.order_number || '')
          .replace(/{{accession_number}}/g, contentData?.accessionNumber || '')
          .replace(/{{days}}/g, 14 || '');
        break;
    
      case "PROFILE_CREATED":
        message = content
          .replace(/{{user_name}}/g, contentData?.labRadioName || '')
          .replace(/{{user_password}}/g, contentData?.labRadioPassword || '')
          .replace(/{{user_email}}/g, contentData?.labRadioEmail || '');
        break;
    
      case "RESCHEDULE_RADIOLOGY_APPOINTMENT":
      case "RESCHEDULE_LABORATORY_APPOINTMENT":
      case "RESCHEDULE_LABORATORY_RADIOLOGY":
        message = content
          .replace(/{{consultationDate}}/g, contentData?.consultationDate || '')
          .replace(/{{consultationTime}}/g, contentData?.consultationTime || '')
          .replace(/{{newConsultationDate}}/g, contentData?.newConsultationDate || '')
          .replace(/{{newConsultationTime}}/g, contentData?.newConsultationTime || '')
          .replace(/{{centre_name}}/g, contentData?.labRadioName || '')
          .replace(/{{patient_name}}/g, contentData?.patientName || '');
        break;
    
      default:
        message = content; // Fallback for unmatched types
        break;
    }
    
    return message
}

export const sendNotification = (paramsData, headers) => {
    return new Promise(async (resolve, reject) => {
      try {
        let getPatientDetails = httpService.postStaging(
          "patient/get-patient-details-by-id",
          { ids: [paramsData?.patientId] },
          headers,
          "patientServiceUrl"
        );
        let getDoctorDetails = httpService.postStaging(
          "individual-doctor/get-patient-doctors",
          { doctorIds: [paramsData?.doctorId] },
          headers,
          "doctorServiceUrl"
        );
        let getLabRadioDetails = httpService.getStaging(
          "lab-radio/get-labradio-details-by-id",
          { ids: paramsData?.labRadiologyId },
          headers,
          "labradioServiceUrl"
        );
        if (paramsData?.isProfile) {
          getPatientDetails = resolve(true)
          getDoctorDetails = resolve(true)
          getLabRadioDetails = resolve(true)
        }
        const getContent = httpService.getStaging('superadmin/get-notification-by-condition', { condition: paramsData?.condition }, headers, 'superadminServiceUrl');
        const getPromiseDetails = await Promise.all([getPatientDetails, getDoctorDetails, getContent, getLabRadioDetails])
        let userDetails = {
          patientEmail: '', 
          patientMobile: '', 
          patientCountryCode: '',
          patientName: '',
          patientDeviceToken: [],
          doctorEmail: '', 
          doctorMobile: '', 
          doctorCountryCode: '',
          doctorName: '',
          labRadioEmail: '', 
          labRadioMobile: '', 
          labRadioCountryCode: '',
          labRadioName: '',
          testName: paramsData?.testName,
          consultationDate: paramsData?.consultationDate,
          consultationTime: paramsData?.consultationTime,
          newConsultationDate: paramsData?.newConsultationDate,
          newConsultationTime: paramsData?.newConsultationTime,
          accessionNumber: paramsData?.accessionNumber,
          order_number:paramsData?.order_number
        }
        if (getPromiseDetails[0]?.status) {
          const userData = getPromiseDetails[0].data
          userDetails.patientMobile = userData[paramsData?.patientId]?.mobile
          userDetails.patientCountryCode = userData[paramsData?.patientId]?.country_code
          userDetails.patientEmail = userData[paramsData?.patientId]?.email
          userDetails.patientName = userData[paramsData?.patientId]?.full_name
          userDetails.patientDeviceToken = userData[paramsData?.patientId]?.deviceToken || []
        }
        if (getPromiseDetails[1]?.status) {
          const userData = getPromiseDetails[1].body?.results[0]
          userDetails.doctorMobile = userData?.for_portal_user?.mobile
          userDetails.doctorCountryCode = userData?.for_portal_user?.country_code
          userDetails.doctorEmail = userData?.for_portal_user?.email
          userDetails.doctorName = userData?.full_name
        }
        if (getPromiseDetails[3]?.status) {
          const userData = getPromiseDetails[3].body
          userDetails.labRadioMobile = userData[0]?.phone_number
          userDetails.labRadioCountryCode = userData[0]?.country_code
          userDetails.labRadioEmail = userData[0]?.email
          userDetails.labRadioName = userData[0]?.centre_name
        }
        if (paramsData?.isProfile) {
          userDetails.labRadioMobile = paramsData?.user_mobile
          userDetails.labRadioCountryCode = paramsData?.country_code
          userDetails.labRadioEmail = paramsData?.user_email
          userDetails.labRadioName = paramsData?.user_name
          userDetails.labRadioPassword = paramsData?.user_password
        }
        if (getPromiseDetails[2]?.status && getPromiseDetails[2]?.data.length > 0) {
          //Send SMS notification
          const getSMSContent = getPromiseDetails[2].data.filter( val => val?.notification_type == 'sms')
          if (getSMSContent.length > 0 && paramsData?.notification.includes('sms')) {
            const content = generateNotificationMessage(paramsData?.condition, getSMSContent[0]?.content, userDetails)
            let userMobile = ''
            if (paramsData?.sendTo == 'patient') {
              userMobile = userDetails?.patientCountryCode + userDetails?.patientMobile
            }
            if (paramsData?.sendTo == 'laboratory' || paramsData?.sendTo == 'radiology' || paramsData?.sendTo == 'staff') {
              userMobile = userDetails?.labRadioCountryCode + userDetails?.labRadioMobile
            }
            await sendSms(userMobile, content);
            
            // Save notification content in database
            let notificationCreator, notificationReceiver;
            if (paramsData?.madeBy == 'laboratory' || paramsData?.madeBy == 'radiology') {
              notificationCreator = paramsData?.labRadiologyId;
              notificationReceiver = paramsData?.patientId;
            } else {
              notificationCreator = paramsData?.patientId;
              notificationReceiver = paramsData?.labRadiologyId;
            }
  
            const requestData = {
              created_by_type: paramsData?.madeBy,
              created_by: notificationCreator,
              content,
              url: "",
              for_portal_user: notificationReceiver,
              title: getSMSContent[0]?.notification_title,
              appointmentId: paramsData?.appointment?._id,
            };
            if (!paramsData?.isProfile) {
              await notification(paramsData, headers, requestData);
            }
          }
          const getEmailContent = getPromiseDetails[2].data.filter( val => val?.notification_type == 'email')
          if (getEmailContent.length > 0 && paramsData.notification.includes('email')) {
            const content = generateNotificationMessage(paramsData?.condition, getEmailContent[0]?.content, userDetails)
            const emailBody = {
              subject: getEmailContent[0]?.notification_title,
              body: content
            }
            let userEmail = ''
            if (paramsData?.sendTo == 'patient') {
              userEmail = userDetails?.patientEmail
            }
            if (paramsData?.sendTo == 'laboratory' || paramsData?.sendTo == 'radiology' || paramsData?.sendTo == 'staff') {
              userEmail = userDetails?.labRadioEmail
            }
            sendEmail(emailBody, userEmail);
          }
          //Send push notification
          const patientData = getPatientDetails?.data;
          const firstPatientKey = Object.keys(patientData || {})[0];
          const notificationValue = firstPatientKey ? patientData[firstPatientKey]?.notification : true;

          const getPushNotiContent = getPromiseDetails[2].data.filter( val => val?.notification_type == 'push_notification')
          if (getPushNotiContent.length > 0 && paramsData.notification.includes('push_notification') && userDetails?.patientDeviceToken.length > 0) {
            const content = generateNotificationMessage(paramsData?.condition, getPushNotiContent[0]?.content, userDetails)
            const notificationData = {
              title: getPushNotiContent[0]?.notification_title,
              body: content
            }
            if (notificationValue) {
              sendPushNotification(userDetails?.patientDeviceToken, notificationData)
            }
          }
        }
        resolve(true)
      } catch (error) {
        console.log('Error while sending notification 2', error);
        resolve(true)
      }
    })
}
  