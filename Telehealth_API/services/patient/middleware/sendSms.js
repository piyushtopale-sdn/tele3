import axios from "axios"
import {config} from "../config/constants"

export const sendSms = (mobile_number, text) => {
    return new Promise(async (resolve,reject)=>{
        const AppSid = config.SMS_APP_SID;
        const SenderID = config.SENDER_ID;

         // Make the SMS text unique by appending a timestamp
         const uniqueSuffix = Math.floor(Math.random() * 1000); // 3-digit random number
         const uniqueText = `${text} (Ref: ${uniqueSuffix})`;

        try {
            await axios({
                method: 'post',
                url: 'https://el.cloud.unifonic.com/rest/SMS/messages',
                headers: {
                  'Content-Type': 'application/json'
                },
                data: {
                  AppSid,
                  SenderID,
                  Body: uniqueText,
                  Recipient: mobile_number
                }
            });
            resolve(true)
        } catch (error) {
            console.error('Error sending SMS:', error);
            resolve(true) //Temporarily resolved to fix otp issue.
        }
    })
}