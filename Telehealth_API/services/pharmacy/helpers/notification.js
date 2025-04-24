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
      if (paramsData?.sendTo == 'pharmacy') {
        endPoint = "pharmacy/notification"
        serviceUrl = 'pharmacyServiceUrl'
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

const generateNotificationMessage = (type, content, contentData) => {
    let message = ''
    switch (type) {
      case "ORDER_MEDICINE":
      case "ACCEPTED_MEDICINE_ORDER":
      case "REJECTED_MEDICINE_ORDER":
      case "UNDER_PROCESS_MEDICINE_ORDER":
      case "COMPLETED_MEDICINE_ORDER":
        message = content
          .replace(/{{pharmacy_name}}/g, contentData?.pharmacyName || '')
          .replace(/{{patient_name}}/g, contentData?.patientName || '');
        break;
    
      case "PROFILE_CREATED":
        message = content
          .replace(/{{user_name}}/g, contentData?.pharmacyName || '')
          .replace(/{{user_password}}/g, contentData?.pharmacyPassword || '')
          .replace(/{{user_email}}/g, contentData?.pharmacyEmail || '');
        break;
    
      default:
        message = content; // Fallback if no case matches
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
        let getPharmacyDetails = httpService.getStaging(
          "pharmacy/get-PharmacyBy-Id",
          { for_portal_user: paramsData?.pharmacyId },
          headers,
          "pharmacyServiceUrl"
        );
        if (paramsData?.isProfile) {
          getPatientDetails = resolve(true)
          getDoctorDetails = resolve(true)
          getPharmacyDetails = resolve(true)
        }
        const getContent = httpService.getStaging('superadmin/get-notification-by-condition', { condition: paramsData?.condition }, headers, 'superadminServiceUrl');
        const getPromiseDetails = await Promise.all([getPatientDetails, getDoctorDetails, getContent, getPharmacyDetails])
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
          pharmacyName: '',
          pharmacyEmail: '', 
          pharmacyMobile: '', 
          pharmacyCountryCode: '',
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
          const userData = getPromiseDetails[3]?.body
          userDetails.pharmacyMobile = userData?.for_portal_user?.phone_number
          userDetails.pharmacyCountryCode = userData?.for_portal_user?.country_code
          userDetails.pharmacyEmail = userData?.for_portal_user?.email
          userDetails.pharmacyName = userData?.pharmacy_name
        }
        if (paramsData?.isProfile) {
          userDetails.pharmacyMobile = paramsData?.user_mobile
          userDetails.pharmacyCountryCode = paramsData?.country_code
          userDetails.pharmacyEmail = paramsData?.user_email
          userDetails.pharmacyName = paramsData?.user_name
          userDetails.pharmacyPassword = paramsData?.user_password
        }
        
        if (getPromiseDetails[2]?.status && getPromiseDetails[2]?.data.length > 0) {
          //Send SMS notification
          const getSMSContent = getPromiseDetails[2].data.filter( val => val?.notification_type == 'sms')
          if (getSMSContent.length > 0 && paramsData?.notification.includes('sms')) {
            const content = generateNotificationMessage(paramsData?.condition, getSMSContent[0]?.content, userDetails)
            let userMobile
            if (paramsData?.sendTo == 'patient') {
              userMobile = userDetails?.patientCountryCode + userDetails?.patientMobile
            }
            if (paramsData?.sendTo == 'pharmacy' || paramsData?.sendTo == 'staff') {
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
            if (paramsData?.sendTo == 'pharmacy' || paramsData?.sendTo == 'staff') {
              userEmail = userDetails?.pharmacyEmail
            }
            sendEmail(emailBody, userEmail);
          }
          //Send push notification
          const getPushNotiContent = getPromiseDetails[2].data.filter( val => val?.notification_type == 'push_notification')
          if (getPushNotiContent.length > 0 && paramsData.notification.includes('push_notification') && userDetails?.patientDeviceToken.length > 0) {
            const content = generateNotificationMessage(paramsData?.condition, getPushNotiContent[0]?.content, userDetails)
            const notificationData = {
              title: getPushNotiContent[0]?.notification_title,
              body: content
            }
            sendPushNotification(userDetails?.patientDeviceToken, notificationData)
          }
        }
        resolve(true)
      } catch (error) {
        console.error("An error occurred:", error);
        resolve(false)
      }
    })
}
  