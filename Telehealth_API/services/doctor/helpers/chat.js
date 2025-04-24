const {
  RtcTokenBuilder,
  RtcRole,
} = require("agora-access-token");
import "dotenv/config.js";
import axios from "axios";

const APP_ID = process.env.APP_ID;
const APP_CERTIFICATE = process.env.APP_CERTIFICATE;
const AGORA_ACCESS_KEY = process.env.AGORA_ACCESS_KEY;
const AGORA_SECRET_KEY = process.env.AGORA_SECRET_KEY;
const AGORA_BASE_URL = process.env.AGORA_BASE_URL;
const bucket = process.env.BUCKET_NAME || 'test_pdev';
const accessKey = process.env.CLOUD_BUCKET_ACCESS_KEY;
const secretKey = process.env.CLOUD_BUCKET_SECRET_KEY;
const AUTH_HEADER = `Basic ${Buffer.from(`${AGORA_ACCESS_KEY}:${AGORA_SECRET_KEY}`).toString('base64')}`;

export async function agoraTokenGenerator(roomName, uniqueId) {
  return new Promise((resolve, reject) => {
    const appId = APP_ID;
    const appCertificate = APP_CERTIFICATE;
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
export async function agoraStartRecording(roomName, uid, userId, appointmentId, layoutConfig) {
  return new Promise(async (resolve, reject) => {
    try {
      // Step 1: Acquire the resource ID
      const acquireUrl = `${AGORA_BASE_URL}/${APP_ID}/cloud_recording/acquire`;
      const acquirePayload = {
          cname: roomName,
          uid: String(uid),
          clientRequest: {},
      };
      
      const acquireResponse = await axios.post(acquireUrl, acquirePayload, {
          headers: {
              Authorization: AUTH_HEADER,
              'Content-Type': 'application/json',
          },
      });
      
      const resourceId = acquireResponse.data.resourceId;
      // Step 2: Start the recording using the acquired resource ID
      
      const startUrl = `${AGORA_BASE_URL}/${APP_ID}/cloud_recording/resourceid/${resourceId}/mode/mix/start`;
      const startPayload = {
        cname: roomName,
        uid: String(uid),
        clientRequest: {
          mode: "mix", // Composite Recording Mode
          transcodingConfig: {
            width: 1920, // Total video width
            height: 1080, // Total video height
            fps: 30, // Frames per second
            bitrate: 1200, // Video bitrate
            mixedVideoLayout: 0, // User-defined layout
            backgroundColor: "#000000", // Black background
            layoutConfig,
        },
          recordingFileConfig: {
              avFileType: ["hls","mp4"], // Save as both HLS and MP4
          },
          storageConfig: {
              vendor: 6, // Google Cloud Storage
              region: 0, // Adjust based on your GCS bucket region
              bucket: bucket, // Exact bucket name
              accessKey: accessKey, // Service account email
              secretKey: secretKey, // Service account private key
              fileNamePrefix: [`recordings`, `${userId}`, `${appointmentId}`], // Subfolder inside bucket
          },
        },
      };
      const startResponse = await axios.post(startUrl, startPayload, {
        headers: {
            Authorization: AUTH_HEADER,
            'Content-Type': 'application/json',
        },
      });
      if (startResponse && startResponse.data) {
        const sid = startResponse.data.sid;
        resolve({ sid, resourceId })
      } else {
        reject(false)
        console.error('Unexpected response format during start recording.');
      }
    } catch (error) {
      reject(error)
    }
  })
}
export async function agoraStopRecording(paramsData) {
  return new Promise(async (resolve, reject) => {
    try {
      const startUrl = `${AGORA_BASE_URL}/${APP_ID}/cloud_recording/resourceid/${paramsData?.resourceId}/sid/${paramsData?.sid}/mode/mix/stop`;
      const startPayload = {
          cname: paramsData?.roomName,
          uid: String(paramsData?.uid),
          clientRequest: {},
      };

      const stopResponse = await axios.post(startUrl, startPayload, {
          headers: {
              Authorization: AUTH_HEADER,
              'Content-Type': 'application/json',
          },
      });
      let url = ''
      if (stopResponse?.data?.serverResponse?.uploadingStatus && stopResponse?.data?.serverResponse?.uploadingStatus == 'uploaded') {
        const fileList = stopResponse?.data?.serverResponse?.fileList
        const fileUrl = fileList.filter(val => val.fileName.includes('.mp4'))
        url = fileUrl[0]?.fileName
      }
      resolve(url);
    } catch (error) {
      reject(error)
    }
  })

}