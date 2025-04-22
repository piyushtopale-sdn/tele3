const firebase = require("./firebase");

export const sendPushNotification =async( deviceTokens,notificationData)=>{

  const message = {
    notification: notificationData,
    tokens: deviceTokens,
  };

  try {
    if (deviceTokens?.length) { await firebase.messaging().sendEachForMulticast(message); }
  } catch (error) {
    console.log("Error sending push notification: ", error);
  }
}