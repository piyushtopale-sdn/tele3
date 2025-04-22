import axios from "axios"
import {config} from "../config/constants"

export const sendWhatsAppMessage = (mobile_number, message) => {
    return new Promise(async (resolve,reject)=>{
        const PublicId = config.UNIFONIC_PUBLIC_ID
        const Secret = config.UNIFONIC_SECRET
        try {
            await axios({
                method: 'post',
                url: 'https://apis.unifonic.com/v1/messages',
                headers: {
                  'Content-Type': 'application/json',
                  PublicId,
                  Secret
                },
                data: {
                  "recipient": {
                    "contact": mobile_number,
                    "channel": "whatsapp"
                  },
                  "content": {
                    "type": "text",
                    "text": message 
                  }
                }
            });
            resolve(true)
        } catch (error) {
          
            reject(error);
        }
    })
}