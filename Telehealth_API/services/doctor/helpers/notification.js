"use strict";
import { sendEmail } from "./ses";
import Http from "./httpservice";
const httpService = new Http();
import { sendPushNotification } from "./firebase_notification";
import { sendSms } from "../middleware/sendSms";
const config = require("../config/constants");

export const notification = (paramsData, headers, requestData) => {
  return new Promise(async(resolve, reject) => {
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
        await httpService.postStaging( endPoint, requestData, headers, serviceUrl );
      }
      resolve(true)
    } catch (error) {
      console.error("An error occurred:", error);

      resolve(false)
    }
  })
}

const   generateNotificationMessage = (type, content, contentData) => {
    let message = ''
    switch (type) {
      case "BOOK_DOCTOR_APPOINTMENT":
      case "APPROVED_DOCTOR_APPOINTMENT":
      case "CANCELLED_DOCTOR_APPOINTMENT":
      case "REJECTED_DOCTOR_APPOINTMENT":
      case "PATIENT_CONFIRMED_APPOINTMENT":
      case "PATIENT_DECLINED_APPOINTMENT":
      case "PATIENT_CONFIRMED_NEW_APPOINTMENT":
      case "MISSED_DOCTOR_APPOINTMENT":
        message = content
          .replace(/{{consultationDate}}/g, contentData?.consultationDate)
          .replace(/{{consultationTime}}/g, contentData?.consultationTime)
          .replace(/{{doctor_name}}/g, contentData?.doctorName)
          .replace(/{{patient_name}}/g, contentData?.patientName);
        break;
    
      case "RESCHEDULE_DOCTOR_APPOINTMENT":
        message = content
          .replace(/{{consultationDate}}/g, contentData?.consultationDate)
          .replace(/{{consultationTime}}/g, contentData?.consultationTime)
          .replace(/{{newConsultationDate}}/g, contentData?.newConsultationDate)
          .replace(/{{newConsultationTime}}/g, contentData?.newConsultationTime)
          .replace(/{{doctor_name}}/g, contentData?.doctorName)
          .replace(/{{patient_name}}/g, contentData?.patientName);
        break;
    
      case "PRESCRIBE_MEDICATION":
        message = content
          .replace(/{{patient_name}}/g, contentData?.patientName)
          .replace(/{{doctor_name}}/g, contentData?.doctorName);
        break;
    
      case "PRESCRIBE_LABORATORY":
      case "PRESCRIBE_RADIOLOGY":
        message = content
          .replace(/{{patient_name}}/g, contentData?.patientName)
          .replace(/{{doctor_name}}/g, contentData?.doctorName)
          .replace(/{{test_name}}/g, contentData?.testName);
        break;
    
      case "PROFILE_CREATED":
        message = content
          .replace(/{{user_name}}/g, contentData?.doctorName)
          .replace(/{{user_password}}/g, contentData?.doctorPassword)
          .replace(/{{user_email}}/g, contentData?.doctorEmail);
        break;
    
      case "APPOINTMENT_REMINDER":
        message = content
          .replace(/{{patient_name}}/g, contentData?.patientName)
          .replace(/{{doctor_name}}/g, contentData?.doctorName)
          .replace(/{{reminder_time}}/g, contentData?.reminderTime);
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
        let getPatientDetails = await httpService.postStaging(
          "patient/get-patient-details-by-id",
          { ids: [paramsData?.patientId] },
          headers,
          "patientServiceUrl"
        );
        let getDoctorDetails =await httpService.postStaging(
          "individual-doctor/get-patient-doctors",
          { doctorIds: [paramsData?.doctorId] },
          headers,
          "doctorServiceUrl"
        );

      //Get parent patient details - Dilip -25 March
      let parentPatientDetails = null;
      if (paramsData?.parent_patient_id) {
        try {
          parentPatientDetails = await httpService.postStaging(
            "patient/get-patient-details-by-id",
            { ids: [paramsData?.parent_patient_id] },
            headers,
            "patientServiceUrl"
          );
        } catch (error) {
          console.error("Error fetching parent patient details:", error);
        }
      }

        if (paramsData?.isProfile) {
          getPatientDetails = resolve(true)
          getDoctorDetails = resolve(true)
        }
        const getContent = httpService.getStaging('superadmin/get-notification-by-condition', { condition: paramsData?.condition }, headers, 'superadminServiceUrl');
        
        const getPromiseDetails = await Promise.all([getPatientDetails, getDoctorDetails, getContent])
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
          testName: paramsData?.testName,
          consultationDate: paramsData?.consultationDate,
          consultationTime: paramsData?.consultationTime,
          newConsultationDate: paramsData?.newConsultationDate,
          newConsultationTime: paramsData?.newConsultationTime,
          reminderTime: paramsData?.reminderTime,
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
        if (paramsData?.isProfile) {
          userDetails.doctorMobile = paramsData?.user_mobile
          userDetails.doctorCountryCode = paramsData?.country_code
          userDetails.doctorEmail = paramsData?.user_email
          userDetails.doctorName = paramsData?.user_name
          userDetails.doctorPassword = paramsData?.user_password
        }
        if (getPromiseDetails[2]?.status && getPromiseDetails[2]?.data.length > 0) {
          //Send SMS notification
          const getSMSContent = getPromiseDetails[2].data.find( val => val?.notification_type == 'sms')
          // const getSMSContent = getPromiseDetails[2].data.filter( val => val?.notification_type == 'sms')
          if (getSMSContent && paramsData?.notification.includes('sms')) {
            const content = generateNotificationMessage(paramsData?.condition, getSMSContent?.content, userDetails)
            let userMobile = ''
            // if (paramsData?.sendTo == 'patient') {
            //   userMobile = userDetails?.patientCountryCode + userDetails?.patientMobile
            // }
             // Assign patient mobile (fallback to parent patient mobile if empty) - Dilip March
          if (paramsData?.sendTo == "patient") {
            userMobile = userDetails?.patientMobile
              ? userDetails?.patientCountryCode + userDetails?.patientMobile
              : parentPatientDetails?.data[paramsData?.parent_patient_id]
                  ?.country_code +
                parentPatientDetails?.data[paramsData?.parent_patient_id]
                  ?.mobile;
            }
            if (paramsData?.sendTo == 'doctor' || paramsData?.sendTo == 'staff') {
              userMobile = userDetails?.doctorCountryCode + userDetails?.doctorMobile
            }
            await sendSms(userMobile, content);
            
            // Save notification content in database
            let notificationCreator, notificationReceiver;
            if (paramsData.madeBy == "doctor") {
              notificationCreator = paramsData?.doctorId;
              notificationReceiver = paramsData?.patientId;
            } else {
              notificationCreator = paramsData?.patientId;
              notificationReceiver = paramsData?.doctorId;
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
            if (paramsData?.sendTo == 'doctor' || paramsData?.sendTo == 'staff') {

              userEmail = userDetails?.doctorEmail
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
        console.log('Error while sending notification 1', error);
        resolve(true)
      }
    })
}
  