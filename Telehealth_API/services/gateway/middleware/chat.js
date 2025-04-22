
import HttpService from "./httpservice";

export async function joinRoom(roomNamedata, data, type, chatId, callerId, authtoken, portal_type) {

  const roomName = roomNamedata;
  findOrCreateRoom(roomName, data, type, chatId, callerId, authtoken, portal_type);
}

export const findOrCreateRoom = async (roomName, data, type, chatId, callerId, authtoken, portal_type) => {
  try {
    if (type === "video") {
      const headers = {
        'Authorization': authtoken
      }
      
      await HttpService.postStaging('doctor/update-videocall-appointment',
        {
          appointmentId: chatId,
          callstatus: "InProgress",
          roomName: roomName,
          callerId: callerId,
          roomDate: new Date()
        }
        , headers, 'doctorServiceUrl');
    }
  } catch (err) {
    console.error("Something went wrong:", err);
    throw err
  }
};

export async function muteAndUnmute(roomName, userId, isAudioMuted, isVideoMuted, authtoken, portal_type) {
  const headers = {
    'Authorization': authtoken
  }
  let appintmentdetails = {}
  appintmentdetails = await HttpService.getStaging('doctor/view-appointment-by-roomname', { roomname: roomName }, headers, 'doctorServiceUrl');
  let identity;
  appintmentdetails.data.participantsinfodetails.forEach(async (el) => {
    if (userId == el.userId.toString()) {
      identity = el.userIdentity;

      await HttpService.postStaging('doctor/update-videocall-appointment',
        {
          participantuserId: el.userId,
          isAudioMuted: isAudioMuted,
          isVideoMuted: isVideoMuted,
        }
        , headers, 'doctorServiceUrl');

    }
  });

  let obj = {
    data: appintmentdetails,
    userIdentity: identity,
  };

  return obj;
}