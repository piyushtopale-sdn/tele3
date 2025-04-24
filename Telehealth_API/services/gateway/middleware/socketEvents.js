import { SocketChat } from "./chat-middleware";
import HttpService from "./httpservice";
import { joinRoom, muteAndUnmute } from "./chat"

exports = module.exports = function (io) {
  io.sockets.on("connection", (socket) => {
    SocketChat(socket, io)
    socket.on('disconnect', async function () {
      console.log('connection disconnected');
      
    });

    socket.on("join", (data) => {
      socket.join(data.room);
    });

    socket.on("leave", (data) => {
      socket.leave(data.room);
    });

    socket.on("track-mute", async (data) => {
      console.log("track-mute >>>>>>>> Start")
      let updateMuteAndUmute = await muteAndUnmute(
        data.roomName,
        data.userId,
        data.isAudioMuted,
        data.isVideoMuted,
        data.authtoken,
        data.portal_type
      );
      let newObj = { ...data, identity: updateMuteAndUmute.userIdentity };

      console.log(updateMuteAndUmute?.data?.data?.participantsinfodetails, "track-mute >>>>>>>>")
      console.log("track-mute >>>>>>>> End")
      updateMuteAndUmute.data.data.participantsinfodetails.forEach(async (el) => {
        await io.in(el.userId.toString()).emit("track-mute-on", newObj);
      });
    });

    socket.on("call-user", async (data) => {
      console.log("call-user >>>>>>>> Start")
      const headers = {
        'Authorization': data.token
      }
      let authtoken = data.token;
      let appintmentdetails = await HttpService.getStaging('doctor/view-appointment-by-roomname', { appointment_id: data.chatId }, headers, 'doctorServiceUrl');
    
      
      let data1 = {
        _id: data.chatId,
        users: appintmentdetails.data.userinfodetails
      }

      let uniqueName = (Math.random() + 1).toString(36).substring(7);
      let roomData = uniqueName;

      let findingToken = await joinRoom(
        roomData,
        data1,
        data.type,
        data1._id,
        data.loggedInUserId,
        data.token,
        data.portal_type ? data.portal_type : '',
      );

      let grpname = '';
      let grpimg = '';
      
      let senderUserDAta = {
        status: "success",
        messageID: 200,
        message: "Fetched Successfully",
        data: {},
      }

      let receiverUserDAta = {
        status: "success",
        messageID: 200,
        message: "Fetched Successfully",
        data: {},
      }

      if (data1.users.length > 2) {
        
        data1.users.forEach(element => {
          grpname += element.name + " ,"
        });
        senderUserDAta.data = {
          userData: {
            name: grpname,
            ownname: data.loggedInUserName,
            image: grpimg,
            chatId: data1._id,
            roomName: uniqueName,
            token: findingToken,
            authtoken: authtoken,
            type: data.type,
            isGroup: true,
            portal_type: data.portal_type ? data.portal_type : ''
          },
        }
        console.log('before emmiting caller-info', data.loggedInUserId);
        
        await io.in(data.loggedInUserId).emit("caller-info", senderUserDAta);
        console.log('after emmiting caller-info');
        
        data1.users.forEach(async (el) => {
          if (el.user_id.toString() != data.loggedInUserId) {
            receiverUserDAta.data = {
              userData: {
                name: grpname,
                ownname: el.name,
                image: grpimg,
                chatId: data1._id,
                roomName: uniqueName,
                token: findingToken,
                authtoken: authtoken,
                type: data.type,
                isGroup: true,
                portal_type: data.portal_type ? data.portal_type : ''
              },
            }
            await io.in(el.user_id.toString()).emit("notify-call", receiverUserDAta);
          }
        });
      }
      else {
        console.log('else user');
        
        data1.users.forEach((element, index) => {
          if (element.user_id == data.loggedInUserId) {
            let ownname = '';
            if (index == 0) {
              ownname = data1.users[1].name;
            }
            if (index == 1) {
              ownname = data1.users[0].name;
            }
            receiverUserDAta.data = {
              userData: {
                name: element.name,
                ownname: ownname,
                image: element.image,
                chatId: data1._id,
                roomName: uniqueName,
                token: findingToken,
                authtoken: authtoken,
                type: data.type,
                isGroup: true,
                portal_type: data.portal_type ? data.portal_type : ''
              },
            }
          }
          else {
            let ownname = '';
            if (index == 0) {
              ownname = data1.users[1].name;
            }
            if (index == 1) {
              ownname = data1.users[0].name;
            }
            senderUserDAta.data = {
              userData: {
                name: element.name,
                ownname: ownname,
                image: element.image,
                chatId: data1._id,
                roomName: uniqueName,
                token: findingToken,
                authtoken: authtoken,
                type: data.type,
                isGroup: true,
                portal_type: data.portal_type ? data.portal_type : ''
              },
            }
          }
        });
        await io.in(data.loggedInUserId).emit("caller-info", senderUserDAta);
        let doctorName; let doctorId;
        for (const el of data1.users) {
          if (el.user_id === data.loggedInUserId) {
            doctorId = el?.user_id;
            doctorName = el?.name;
            break;
          }
        }  
        console.log("call-user >>>>>>>> End", data1.users)
        data1.users.forEach(async (el) => {
          if (el.user_id.toString() != data.loggedInUserId) {
            await io.in(el.user_id.toString()).emit("notify-call", receiverUserDAta);
            await HttpService.getStaging('doctor2/send-push-notificattion-to-patient', { userID: el.user_id, condition:"DOCTOR_INITIATED_CALL", doctorId: doctorId, doctorName: doctorName}, headers, 'doctorServiceUrl');       
          }
        });
      }
    });

    socket.on("ringing-start", async (data) => {
      console.log("ringing-start >>>>>>>> Start")
      try {
        const headers = {
          'Authorization': data.authtoken
        }
        let appintmentdetails = {}
        appintmentdetails = await HttpService.getStaging('doctor/view-appointment-by-roomname', { appointment_id: data.chatId }, headers, 'doctorServiceUrl');
   
        console.log("ringing-start >>>>>>>> End", appintmentdetails.data.userinfodetails)
        appintmentdetails.data.userinfodetails.map(async (el) => {
          if (el.user_id != data.senderId) {            
            await io.in(el.user_id.toString()).emit("ringing-started", data);
          }
        });
      } catch (e) {
        console.error("An error occurred:", e);
       }
    });

    socket.on("call-pick-emit", async (data) => {
      console.log("call-pick-emit >>>>>>>> Start")
      const headers = {
        'Authorization': data.authtoken
      }

      let appintmentdetails = {}
      appintmentdetails = await HttpService.getStaging('doctor/view-appointment-by-roomname', { appointment_id: data.chatId }, headers, 'doctorServiceUrl');
  
      if (appintmentdetails.status) {
        let getting_userData = {
          users: appintmentdetails.data.userinfodetails
        };
        console.log("call-pick-emit >>>>>>>> End")
        getting_userData.users.map(async (el) => {
          await io
            .in(el.user_id.toString())
            .emit("call-picked", "call has been picked");
        });
      }
    });

    socket.on("close-ringer", async (data) => {
      console.log("close-ringer >>>>>>>> Start")
      try {
        console.log("close-ringer >>>>>>>> End", data)
        await io.in(data.loggedInUserId).emit("close-ringer-dialog", data);
      } catch (error) {
        console.error("An error occurred:", error);
        throw error
        
      }
    });

    socket.on("message", async (data) => {
      const headers = {
        'Authorization': data.authtoken
      }

      let appintmentdetails = {}
      appintmentdetails = await HttpService.getStaging('doctor/view-appointment-by-roomname', { appointment_id: data.chatId }, headers, 'doctorServiceUrl');
   
      if (appintmentdetails.data.participantsinfodetails.length > 0) {
        let receiver = [];
        appintmentdetails.data.participantsinfodetails.map((e1) => {
          if (data.senderId != e1.userId) {
            receiver.push({
              id: e1.userId
            })
          }
        })

        let chatmessage = {
          senderId: data.senderId,
          message: data.message,
          receiver: receiver,
          createdAt: data.createdAt
        }

        let appintmentdetails1111 = {}
        appintmentdetails1111 = await HttpService.postStaging('doctor/update-videocall-chatmessage',
          { appointmentId: data.chatId, chatmessage: chatmessage }, headers, 'doctorServiceUrl');

        appintmentdetails.data.participantsinfodetails.forEach((element) => {
          if (element.userId != data.senderId) {
            let count = 0;
            appintmentdetails1111.body.chatmessage.forEach(message => {
              message.receiver.forEach(receiver => {
                if ((receiver.id === element.userId) && receiver.read) {
                  count++;
                }
              });
            });
            io.in(element.userId).emit("new message", {
              message: data.message,
              room: element.userId,
              createdAt: data.createdAt,
              type: data.type,
              chatId: data.chatId,
              unread_count: count
            });
          }
        })
      }
    });


    socket.on("end-call-emit", async (data) => {
      console.log("end-call-emit >>>>>> Start", data);
      try {
        const headers = {
          'Authorization': data.authtoken
        }
        let appintmentdetails = {}
        
        appintmentdetails = await HttpService.getStaging('doctor/view-appointment-by-roomname', { roomname: data.roomName }, headers, 'doctorServiceUrl');
        // }
 
        let getting_userData = {
          chatId: appintmentdetails.data.roomdetails.appointmentId,
          participants: appintmentdetails.data.participantsinfodetails,
          callerId: appintmentdetails.data.roomdetails.callerId
        }
        let roomData = {
          roomName: data.roomName,
        };
        let chatUsers = {
          users: appintmentdetails.data.userinfodetails
        };
        let info;
 
        getting_userData.participants.forEach((element1) => {
          if (element1.userId.toString() == data.loggedInUserId) {
            info = element1.userIdentity;
          }
        });
        getting_userData.participants.forEach(async (element) => {
          if (element.userId.toString() != data.loggedInUserId) {
            await io.in(element.userId.toString()).emit("participant-left", {
              roomName: data.roomName,
              identity: info,
            });
 
              await HttpService.postStaging('doctor/update-videocall-appointment',
                {
                  appointmentId: appintmentdetails.data.roomdetails.appointmentId,
                  participants: "",
                  leftparticipantsid: element.userId,
                  participantstype: "remove",
                }
                , headers, 'doctorServiceUrl');
          }
        });
        await HttpService.postStaging('doctor/update-videocall-appointment',
          {
            appointmentId: appintmentdetails.data.roomdetails.appointmentId,
            participants: "",
            leftparticipantsid: data.loggedInUserId,
            participantstype: "remove",
          }
          , headers, 'doctorServiceUrl');
       
          console.log("end-call-emit >>>>>> End", chatUsers.users);
          chatUsers.users.forEach(async (el) => {
            await io.in(el.user_id.toString()).emit("end-call", roomData);
          });
         
          /** Jan 31 - Stop Video Recording */
          if (process.env.NODE_ENV === "production") {
          HttpService.putStaging(
            `individual-doctor/stop-recordings/${appintmentdetails.data.roomdetails.appointmentId}`,
            {},
            headers,
            "doctorServiceUrl"
          )
            .then((response) => {
              if (response.status) {
                console.log("Video recording:", response.message);
              }
            })
            .catch((err) => console.error("Error stopping recording:", err));
          }
            /** Jan 31 - Stop Video Recording */
        // }
      } catch (e) {
        console.error("An error occurred:", e);
      }
    });


    socket.on("call-missed", async (data) => {
      try {
        const headers = { 'Authorization': data.authtoken };
        const appointmentID = data.chatId;
    
        const appointmentDetails = await HttpService.getStaging(
          'doctor/view-appointment-by-roomname',
          { appointment_id: appointmentID },
          headers,
          'doctorServiceUrl'
        );    
    
        const callerId = appointmentDetails.data.roomdetails?.callerId;
    
        let doctorName;    
       
        for (const el of appointmentDetails.data.userinfodetails) {
          if (el.user_id === callerId) {
            doctorName = el?.name;
            break;
          }
        }   
    
        for (const el of appointmentDetails.data.userinfodetails) {
          if (el.user_id !== callerId) {
            await HttpService.getStaging(
              'doctor2/send-push-notificattion-to-patient',
              {
                userID: el.user_id,
                condition: "MISSED_CALL",
                doctorId: callerId,
                appointment_id: appointmentID,
                doctorName: doctorName
              },
              headers,
              'doctorServiceUrl'
            );
          }
        }
      } catch (error) {
        console.error("Error in call-missed event:", error);
      }
    });
    
    socket.on("notify-patient-waiting", async (data) => {      
      try {
        const headers = {
          'Authorization': data.authtoken
        }
        await HttpService.getStaging('patient/notify-doctor-for-waiting', { userID: data.doctorId, patientId:data.userId, condition:"WAITING_PATIENT", appointment_id:data.appointmentId}, headers, 'patientServiceUrl');
      
      } catch (e) {
        console.log("noti____error:",e);
        
      }
    });
    
  })
 
}