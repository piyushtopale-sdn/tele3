const {
  RtcTokenBuilder,
  RtcRole,
} = require("agora-access-token");
import "dotenv/config";
const appIds=process.env.APP_ID;
const appcertificatekey=process.env.APP_CERTIFICATE;
  export async function   agoraTokenGenerator(roomName, uniqueId) {
    return new Promise((resolve,reject)=>{
      const appId = appIds;
      const appCertificate = appcertificatekey;
      const channelName = roomName;
      const uid = uniqueId;
      const role = RtcRole.PUBLISHER;
      const expirationTimeInSeconds = 3600;
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
      // Build token with uid

      const tokenA = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        uid,
        role,
        privilegeExpiredTs
      );
      let tokenObj = {
        uid: uid,
        token: tokenA,
      };
       resolve(tokenObj);
    })
  }