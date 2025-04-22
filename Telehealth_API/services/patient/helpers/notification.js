"use strict";
import Http from "./httpservice";
const httpService = new Http();
import { sendSms } from "../middleware/sendSms";

export const notification = (paramsData, headers, requestData) => {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        let endPoint = '';
        let serviceUrl = '';

        if (paramsData?.sendTo === 'patient') {
          endPoint = 'patient/notification';
          serviceUrl = 'patientServiceUrl';
        }

        if (endPoint && serviceUrl) {
          await httpService.postStaging(endPoint, requestData, headers, serviceUrl);
        }

        resolve(true);
      } catch (error) {
        console.error('Notification error:', error);
        resolve(false);
      }
    })();
  });
};

const generateNotificationMessage = (type, content, contentData) => {
    let message = ''
    switch (type) {
      case "FAMILY_PROFILE_CREATION":
        message = content
          .replace(/{{family_member_name}}/g, contentData?.familyMemberName || '')
          .replace(/{{patient_name}}/g, contentData?.patientName || '')
          .replace(/{{family_mobile_number}}/g, contentData?.familyMobileNumber || '');
        break;
    
      default:
        message = content; // Fallback in case the type doesn't match
        break;
    }
    
    return message
}

export const sendNotification = (paramsData, headers) => {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const getContent = await httpService.getStaging(
          'superadmin/get-notification-by-condition',
          { condition: paramsData?.condition },
          headers,
          'superadminServiceUrl'
        );

        const userDetails = {
          familyMemberName: paramsData?.familyMemberName,
          patientName: paramsData?.patientName,
          familyMobileNumber: paramsData?.familyMobileNumber,
          familyCountryCode: paramsData?.familyCountryCode,
        };

        if (getContent?.status && getContent?.data?.length > 0) {
          const getSMSContent = getContent.data.filter(val => val?.notification_type === 'sms');
          if (getSMSContent.length > 0 && paramsData?.notification?.includes('sms')) {
            const content = generateNotificationMessage(
              paramsData?.condition,
              getSMSContent[0]?.content,
              userDetails
            );

            let userMobile = '';
            if (paramsData?.sendTo === 'patient') {
              userMobile = userDetails?.familyCountryCode + userDetails?.familyMobileNumber;
            }

            await sendSms(userMobile, content);
          }
        }

        resolve(true);
      } catch (error) {
        console.error('Error in sendNotification:', error);
        resolve(false);
      }
    })();
  });
};

  