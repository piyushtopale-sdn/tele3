const FCM = require("fcm-node");
const serverKey = process.env.SERVERKEY;
const fcm = new FCM(serverKey)

export const sendNotification = async (bodyMessage, title, fcmToken, receiverId) => {
  try {
    const message = {
      to: fcmToken,
      notification: {
        title: title,
        body: bodyMessage,
        sound: "default",
        alert: "alert",
      },
      priority: "high",
      data: {
        title: "notification test",
        body: bodyMessage,
      },
    };

    // Sending notification with callback handling directly
    fcm.send(message, (error, response) => {
      if (error) {
        console.error('Error sending notification:', error);
      } else {
        console.log('Notification sent successfully:', response);
        return response;
      }
    });
  } catch (err) {
    console.error('Error in sendNotification function:', err);
  }
};
