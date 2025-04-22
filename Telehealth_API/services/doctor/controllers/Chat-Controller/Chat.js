import Chat from "../../models/Chat/ChatModel";
import mongoose from "mongoose";
import { sendResponse } from "../../helpers/transmission";
import Message from "../../models/Chat/Message";
import Notification from "../../models/notification";
import PortalUser from "../../models/portal_user";
import Http from "../../helpers/httpservice";
import { generateSignedUrl } from "../../helpers/gcs";
import appointment from "../../models/appointment";
import { sendPushNotification } from "../../helpers/firebase_notification";
import { sendSms } from "../../middleware/sendSms";
import BasicInfo from "../../models/basic_info";

const httpService = new Http();
const notification = (paramsData, headers, requestData) => {
  return new Promise(async (resolve, reject) => {
    try {
      let endPoint = ''
      let serviceUrl = ''
      if (paramsData?.sendTo == 'patient') {
        endPoint = "patient/notification"
        serviceUrl = 'patientServiceUrl'
      }
      if (paramsData?.sendTo == 'doctor') {
        endPoint = "doctor2/notification"
        serviceUrl = 'doctorServiceUrl'
      }
      if (endPoint && serviceUrl) {
        await httpService.postStaging(endPoint, requestData, headers, serviceUrl);
      }
      resolve(true)
    } catch (error) {
      console.error("An error occurred:", error);
      resolve(false)
    }
  })
}

const generateNotificationMessage = (type, content, patient_name, doctorName) => {
  let message = ''
  switch (type) {
    case "DOCTOR_INITIATED_CALL":
      message = content
        .replace(/{{patient_name}}/g, patient_name)
        .replace(/{{doctor_name}}/g, doctorName)

      break;
    case "MISSED_CALL":
      message = content
        .replace(/{{patient_name}}/g, patient_name, doctorName)
        .replace(/{{doctor_name}}/g, doctorName)

      break;
    default:
      message = content; // Fallback in case the type doesn't match
      break;
  }

  return message
}

export const createdChat = async (req, res) => {
  try {

    let newData = await Chat.findOne({
      $or: [
        {
          senderID: mongoose.Types.ObjectId(req.body.data.sender),
          receiverID: {
            $in: [mongoose.Types.ObjectId(req.body.data.receiver)],
          },
        },
        {
          senderID: { $in: [mongoose.Types.ObjectId(req.body.data.receiver)] },
          receiverID: mongoose.Types.ObjectId(req.body.data.sender),
        },
      ],
      isGroupChat: false,
    });

    if (newData) {
      // return newData;
      return sendResponse(req, res, 200, {
        status: false,
        body: null,
        message: "Already exist",
      });
    } else {
      let saveData = new Chat({
        senderID: req.body.data.sender,
        receiverID: req.body.data.receiver,
        type: req?.body?.data?.type,
      });

      let saveChat = await saveData.save();

      if (saveChat) {
        let saveData = new Message({
          chatId: saveChat._id,
          senderID: saveChat.senderID,
          receiverID: saveChat.receiverID,
          message: "Hi",
          attachments: [],
        });

        let saveMessage = await saveData.save();

        const jsondata = {
          latestMessage: mongoose.Types.ObjectId(saveMessage._id),
        };

        await Chat.updateOne(
          { _id: mongoose.Types.ObjectId(saveChat._id) },
          { $set: jsondata },
          { new: true }
        );

        return sendResponse(req, res, 200, {
          status: true,
          body: saveChat,
          message: "Room Created successfully",
        });
      } else {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "Failed to send message",
        });
      }
    }
  } catch (err) {
    return sendResponse(req, res, 500, {
      status: false,
      body: err,
      message: "Failed ",
    });
  }
};
/* Akash-Mishra-Chat-changing - 27-02-2025 */
export const getCreatedChats = async (req, res) => {
  const { id, searchQuery } = req.query;
  try {
    const headers = {
      Authorization: req.headers["authorization"],
    };

    let result = await Chat.aggregate([
      { $sort: { updatedAt: -1 } },
      {
        $match: {
          $or: [
            {
              senderID: mongoose.Types.ObjectId(id),
            },
            {
              receiverID: mongoose.Types.ObjectId(id),
            },
          ],
        },
      },
      {
        $lookup: {
          from: "portalusers",
          localField: "senderID",
          foreignField: "_id",
          as: "senderDetails",
        },
      },
      {
        $unwind: {
          path: "$senderDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "portalusers",
          localField: "receiverID",
          foreignField: "_id",
          as: "receiverDetails",
        },
      },
      {
        $lookup: {
          from: "messages",
          localField: "latestMessage",
          foreignField: "_id",
          as: "latestMessage",
        },
      },
      {
        $unwind: {
          path: "$latestMessage",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    const unReadMessages = await Message.find({
      receiverID: { $in: [mongoose.Types.ObjectId(id)] },
      isRead: false,
      isDeleted: false
    }); 
       

     result = result.map(chat => {      
      // Check if there are any unread messages for this chat
      const unreadMessagesForChat = unReadMessages.filter((unread) => 
        String(chat?._id) === String(unread?.chatId)
      );
      
    
      // If there are unread messages, add the unreadCount property
      if (unreadMessagesForChat.length > 0) {
        chat.unreadCount = unreadMessagesForChat.length;
      } else {
        chat.unreadCount = 0;
      }
    
      return chat;
    });  
      
    
    const modifiedResult = await Promise.all(
      result.map(async (chat) => {
        const receiverPatientDetails = await httpService.getStaging(
          "patient/patient-details",
          { patient_id: chat?.receiverID[0] },
          headers,
          "patientServiceUrl"
        );
        let disableChatOption = false;

        let patientID = receiverPatientDetails?.body?.portalUserDetails?._id;

        if (patientID === chat?.receiverID[0]?.toString()) {
          const currentDate = new Date();
          if (receiverPatientDetails?.body?.portalUserDetails?.role === "PATIENT") {
            const latestAppointmentDate = await appointment
              .find({ patientId: mongoose.Types.ObjectId(patientID) })
              .sort({ consultationDate: -1 })
              .limit(1)
              .select("consultationDate");
            if (latestAppointmentDate.length > 0) {
              const appointmentDate = new Date(
                latestAppointmentDate[0].consultationDate
              );
              const differenceInTime = currentDate - appointmentDate;
              const differenceInDays = Math.floor(
                differenceInTime / (1000 * 60 * 60 * 24)
              );
              differenceInDays > 15
                ? (disableChatOption = true)
                : (disableChatOption = false);
              chat.disableChatOption = disableChatOption;
            } else {
              disableChatOption = false;
            }
          }

          let receiver = {
            mrn_number: receiverPatientDetails?.body?.personalDetails?.mrn_number,
            email: receiverPatientDetails?.body?.portalUserDetails?.email,
            full_name: receiverPatientDetails?.body?.personalDetails?.full_name,
            phone_number: receiverPatientDetails?.body?.portalUserDetails?.mobile,
            profile_picture:
              receiverPatientDetails?.body?.personalDetails?.profile_pic_signed_url,
            country_code: receiverPatientDetails?.body?.portalUserDetails?.country_code,
            _id: receiverPatientDetails?.body?.portalUserDetails?._id,
            full_name_arabic: receiverPatientDetails?.body?.personalDetails?.full_name_arabic,

          };
          chat.receiverDetails = [receiver];

        } else {
          const senderPatientDetails = await httpService.getStaging(
            "patient/patient-details",
            { patient_id: chat?.senderID },
            headers,
            "patientServiceUrl"
          );

          let patientID = senderPatientDetails?.body?.portalUserDetails?._id;
          if (patientID === chat?.senderID?.toString()) {
            const currentDate = new Date();
            if (senderPatientDetails?.body?.portalUserDetails?.role === "PATIENT") {
              const latestAppointmentDate = await appointment
                .find({ patientId: mongoose.Types.ObjectId(patientID) })
                .sort({ consultationDate: -1 })
                .limit(1)
                .select("consultationDate");
              if (latestAppointmentDate.length > 0) {
                const appointmentDate = new Date(
                  latestAppointmentDate[0].consultationDate
                );
                const differenceInTime = currentDate - appointmentDate;
                const differenceInDays = Math.floor(
                  differenceInTime / (1000 * 60 * 60 * 24)
                );
                differenceInDays > 15
                  ? (disableChatOption = true)
                  : (disableChatOption = false);
                chat.disableChatOption = disableChatOption;
              } else {
                disableChatOption = false;
              }
            }

            let sender = {
              mrn_number: senderPatientDetails?.body?.personalDetails?.mrn_number,
              email: senderPatientDetails?.body?.portalUserDetails?.email,
              full_name: senderPatientDetails?.body?.personalDetails?.full_name,
              full_name_arabic: senderPatientDetails?.body?.personalDetails?.full_name_arabic,
              phone_number: senderPatientDetails?.body?.portalUserDetails?.mobile,
              profile_picture:
                senderPatientDetails?.body?.personalDetails?.profile_pic_signed_url,
              country_code: senderPatientDetails?.body?.portalUserDetails?.country_code,
              _id: senderPatientDetails?.body?.portalUserDetails?._id,

            };
            chat.senderDetails = sender;
          }
          else {
            chat.senderDetails = chat.senderDetails;
          }

        }
        return chat;
      })
    );
    // let filteredResult = [];

    // filteredResult = modifiedResult.filter((chat) => {
    //   if (type && type === "doctor") {
    //     const receiverFullName = chat.receiverDetails?.[0]?.full_name || "";
    //     return searchQuery
    //       ? receiverFullName.toLowerCase().includes(searchQuery.toLowerCase())
    //       : true;
    //   } else {
    //     const senderFullName = chat.senderDetails?.full_name || "";
    //     return searchQuery
    //       ? senderFullName.toLowerCase().includes(searchQuery.toLowerCase())
    //       : true;
    //   }
    // });

    const enrichedResult = await Promise.all(
      modifiedResult.map(async (chat) => {
        let doctor = null;
    
        // Check where the doctor is: in sender or receiver
        if (chat.senderDetails?.role === "INDIVIDUAL_DOCTOR") {
          doctor = chat.senderDetails;
        } else if (chat.receiverDetails[0]?.role === "INDIVIDUAL_DOCTOR") {
          doctor = chat.receiverDetails[0];
        }
    
        let profile_picture = "";
    
        if (doctor) {
          const findProfile = await BasicInfo.findOne({ for_portal_user: doctor?._id }).select("profile_picture");
          if (findProfile?.profile_picture) {
            profile_picture = await generateSignedUrl(findProfile?.profile_picture);
          }
          doctor.profile_picture = profile_picture;
        }
    
        return {
          ...chat,
          doctorDetails: doctor, 
        };
      })
    );
    const filteredResult = enrichedResult.filter((chat) => {
      const doctor = chat.doctorDetails;
    
      if (doctor) {
        const doctorName = doctor.full_name || "";
        return searchQuery
          ? doctorName.toLowerCase().includes(searchQuery.toLowerCase())
          : true;
      }
    
      return false;
    });
    

    if (filteredResult?.length > 0) {
      return sendResponse(req, res, 200, {
        status: true,
        body: filteredResult, // Use the modified dataArray instead of the original result
        message: "Fetched data successfully",
        errorCode: null,
      });
    } else {
      return sendResponse(req, res, 200, {
        status: false,
        body: [], // Use the modified dataArray instead of the original result
        message: "No user list found",
        errorCode: null,
      });
    }
  } catch (error) {
    console.log("error_________________",error);
    
    return sendResponse(req, res, 500, {
      status: false,
      body: error,
      message: "Internal server error",
      errorCode: null,
    });
  }
};


/* exisiting-working-function */
// export const getCreatedChats = async (req, res) => {
//   // const id = req.query['0'];
//   // const searchQuery = req.query.searchQuery; // Assuming the search query parameter is 'search'
//   const {id,searchQuery} =req.query;
//   try {
//     const headers = {
//       'Authorization': req.headers['authorization']
//     }
//     let filter = {}
 
//     if (searchQuery && searchQuery !== "") {
//       filter["$or"] = [
//         {
//           groupName: { $regex: searchQuery, $options: "i" },
//         },
//         {
//           "receiverDetails.fullName": { $regex: searchQuery, $options: "i" },
//         },
//       ];
//     }
 
//     // const matchQuery = {
//     //   $or: [
//     //     { senderID: mongoose.Types.ObjectId(id) },
//     //     { receiverID: mongoose.Types.ObjectId(id) }
//     //   ]
//     // };
 
//     const result = await Chat.aggregate([
//       // { $match: matchQuery },
//       { $sort: { updatedAt: -1 } },
//       {
//         $match: {
//           $or: [
//             {
//               senderID: mongoose.Types.ObjectId(id)
//             },
//             {
//               receiverID: mongoose.Types.ObjectId(id)
//             }
//           ]
//         }
//       },
//       {
//         $lookup: {
//           from: "superadmins",
//           localField: "senderID",
//           foreignField: "_id",
//           as: "senderDetails",
//         },
//       },
//       {
//         $unwind: {
//           path: "$senderDetails",
//           preserveNullAndEmptyArrays: true
//         }
//       },
//       {
//         $lookup: {
//           from: 'superadmins',
//           let: { receiverIDnew: '$receiverID' },
//           pipeline: [
//             {
//               $match: {
//                 $expr: { $in: ['$_id', '$$receiverIDnew'] }
//               }
//             },
//             {
//               $lookup: {
//                 from: "portalusers",
//                 localField: "_id",
//                 foreignField: "superadmin_id",
//                 as: "portaluserReceiverDetailsnew",
//               }
//             },
//             {
//               $addFields: {
//                 portaluserReceiverDetails: '$portaluserReceiverDetailsnew'
//               }
//             },
//             {
//               $lookup: {
//                 from: "documentinfos",
//                 localField: "portaluserReceiverDetails.staff_profile",
//                 foreignField: "_id",
//                 as: "documentInfoReceiverDetailsnew",
//               },
//             },
//             {
 
//               $addFields: {
//                 'portaluserReceiverDetails': {
//                   $map: {
//                     input: '$portaluserReceiverDetails',
//                     as: 'portaluserReceiverDetailsItem',
//                     in: {
//                       $mergeObjects: [
//                         '$$portaluserReceiverDetailsItem',
//                         {
//                           documentInfoReceiverDetails: {
//                             $filter: {
//                               input: '$documentInfoReceiverDetailsnew',
//                               as: 'documentInfoReceiverDetailsnewItem',
//                               cond: {
//                                 $eq: ['$$documentInfoReceiverDetailsnewItem._id', '$$portaluserReceiverDetailsItem.staff_profile']
//                               }
//                             }
//                           }
//                         }
//                       ]
//                     }
//                   }
//                 }
//               }
//             },
//             {
//               $project: {
//                 portaluserReceiverDetailsnew: 0,
//                 documentInfoReceiverDetailsnew: 0
//               }
//             },
//           ],
//           as: "receiverDetails",
 
//         }
//       },
//       { $match: filter },
//       {
//         $lookup: {
//           from: "messages",
//           localField: "latestMessage",
//           foreignField: "_id",
//           as: "latestMessage",
//         },
//       },
//       {
//         $unwind: {
//           path: "$latestMessage",
//           preserveNullAndEmptyArrays: true
//         }
//       },
 
//     ]);
 
 
//     if (result.length > 0) {
//       let i = 0;
//       for (const doc of result) {
//         if (doc.isGroupChat) {
//           let imagesObject = {};
//           imagesObject[doc._id] = '';
 
//           // Add profile_pic to the document
//           doc.profile_pic = imagesObject[doc._id];
//         }
//         else {
//           let j = 0;
//           for await (const item of doc.receiverDetails) {
//             let recieveimage = await approveOrRejectMedicine(item);
//             if (recieveimage != '') {
//               result[i].receiverDetails[j].portaluserReceiverDetails[0].documentInfoReceiverDetails[0].receiverImage = recieveimage;
//             }
//             j++;
//           }
 
//         }
//         i++;
//       }
 
//       return sendResponse(req, res, 200, {
//         status: true,
//         body: result, // Use the modified dataArray instead of the original result
//         message: "Fetched data successfully",
//         errorCode: null,
//       });
//     } else {
//       return sendResponse(req, res, 200, {
//         status: false,
//         body: [], // Use the modified dataArray instead of the original result
//         message: "No room list found",
//         errorCode: null,
//       });
//     }
 
//   } catch (error) {
//     sendResponse(req, res, 500, {
//       status: false,
//       body: error,
//       message: "Internal server error",
//       errorCode: null,
//     });
//   }
// };


export const sendMessage = async (req, res) => {
  
  try {
    const headers = {
      Authorization: req.headers["authorization"],
    };

    let chcekRoom = await Chat.findOne({
      _id: mongoose.Types.ObjectId(req.body.data.chatId),
    });
    
    const receivers =
      req.body.data.receiverID == req.body.data.senderID
        ? chcekRoom?.senderID
        : chcekRoom?.receiverID;
    // let chatPicture = {}
    // if(req.body.data.attachments && req.body.data.attachments !== undefined){
    //   chatPicture =  {
    //     type : req.body.data.attachments.type,
    //     path : await generateSignedUrl(req.body.data.attachments.path)
    //   }
    // }
    
    let saveData = new Message({
      chatId: req.body.data.chatId,
      senderID: req.body.data.senderID,
      receiverID: req.body.data.receiverID,
      appointmentID: req.body.data.appointmentID,
      message: req.body.data.message,
      attachments: req.body.data.attachments,
      type: req.body.data.type,
    });

    let savedMessage = await saveData.save();

    const jsondata = {
      latestMessage: mongoose.Types.ObjectId(savedMessage._id),
    };

    const newUpdate = await Chat.updateOne(
      { _id: mongoose.Types.ObjectId(savedMessage.chatId) },
      { $set: jsondata },
      { new: true }
    );

    // if (saveChat) {

    //   let condition = {
    //     _id: saveChat._id
    //   };

    //   const getData = await Message.aggregate([
    //     { $match: condition },
    //     {
    //       $lookup: {
    //         from: "portalusers",
    //         localField: "senderID",
    //         foreignField: "_id",
    //         as: "senderDetails",
    //       },
    //     },
    //     {
    //       $unwind: {
    //         path: "$senderDetails",
    //         preserveNullAndEmptyArrays: true
    //       }
    //     }
    //   ]);

    //   return sendResponse(req, res, 200, {
    //     status: true,
    //     body: getData[0],
    //     message: "Message send successfully",
    //   });
    // } else {
    //   return sendResponse(req, res, 200, {
    //     status: false,
    //     body: null,
    //     message: "Failed to send message",
    //   });
    // }
    if (savedMessage) {
      const condition = { _id: savedMessage._id };
      const sender = await PortalUser.findOne({
        _id: mongoose.Types.ObjectId(req.body.data.senderID),
      });
      let messageDetails = {};
      if (sender !== null && sender?.role === "INDIVIDUAL_DOCTOR") {
        // Doctor's details
        messageDetails = await Message.aggregate([
          { $match: condition },
          {
            $lookup: {
              from: "portalusers",
              localField: "senderID",
              foreignField: "_id",
              as: "senderDetails",
            },
          },
          {
            $unwind: {
              path: "$senderDetails",
              preserveNullAndEmptyArrays: true,
            },
          },
        ]);
      } else if (sender === null) {
        // Patient's details
        const patientData = await httpService.getStaging(
          "patient/patient-details",
          { patient_id: req.body?.data?.senderID },
          headers,
          "patientServiceUrl"
        );
        if (patientData?.body) {
          messageDetails = [
            {
              ...savedMessage.toObject(),
              senderDetails: {
                country_code:
                  patientData?.body?.portalUserDetails?.country_code,
                mobile: patientData?.body?.portalUserDetails?.mobile,
                full_name: patientData?.body?.personalDetails?.full_name,
                full_name_arabic: patientData?.body?.personalDetails?.full_name_arabic,
                profile_pic_signed_url: patientData?.body?.personalDetails?.profile_pic ? await generateSignedUrl(patientData?.body?.personalDetails?.profile_pic) : "",
                _id: patientData?.body?.portalUserDetails?._id,
              },
            },
          ];
        }
      }
      return sendResponse(req, res, 200, {
        status: true,
        body: messageDetails[0],
        message: "Message saved & sent successfully",
      });
    } else {
      return sendResponse(req, res, 200, {
        status: false,
        body: null,
        message: "Failed to send message",
      });
    }
  } catch (err) {
    return sendResponse(req, res, 500, {
      status: false,
      body: err,
      message: "Internal server error",
    });
  }
};

export const totalMessageCount = async (req, res) => {
  try {
    const { userID } = req.body;
    
    const totalMessages = await Message.countDocuments({
      isRead: false,
      receiverID: { $in: [userID] }
    });

    if (totalMessages) {
      return sendResponse(req, res, 200, {
        status: true,
        body: totalMessages,
        message: "Message count fetch successfully",
      });
    } else {
      return sendResponse(req, res, 200, {
        status: false,
        body: null,
        message: "Failed to fetch message count",
      });
    }
  } catch (err) {
    return sendResponse(req, res, 500, {
      status: false,
      body: err,
      message: "Internal server error",
    });
  }
};

export const readMessageCount = async (req, res) => {
  try {
    const { chatID } = req.body;    

    if (!chatID) {
      return sendResponse(req, res, 400, {
        status: false,
        message: "Chat ID is required",
      });
    }

    const readMessages = await Message.updateMany(
      { chatId: new mongoose.Types.ObjectId(chatID), isRead: false },
      { $set: { isRead: true } }
    );

    if (readMessages) {
      return sendResponse(req, res, 200, {
        status: true,
        body: readMessages,
        message: "Message read successfully",
      });
    } else {
      return sendResponse(req, res, 200, {
        status: false,
        body: null,
        message: "Failed to read message",
      });
    }
  } catch (err) {
    return sendResponse(req, res, 500, {
      status: false,
      body: err,
      message: "Internal server error",
    });
  }
};

// export const sendMessage = async (req, res) => {
//   try {
//     const headers = {
//       'Authorization': req.headers['authorization'],
//     };

//     // Check if the chat room exists
//     const chatRoom = await Chat.findOne({ _id: mongoose.Types.ObjectId(req.body.data.chatId) });
//     const receivers =
//       req.body.data.receiverID === req.body.data.senderID
//         ? chatRoom?.senderID
//         : chatRoom?.receiverID;

//     // Save the message
//     const newMessage = new Message({
//       chatId: req.body.data.chatId,
//       senderID: req.body.data.senderID,
//       receiverID: receivers,
//       appointmentID: req.body.data.appointmentID,
//       message: req.body.data.message,
//       attachments: req.body.data.attachments,
//       type: req.body.data.type,
//     });

//     const savedMessage = await newMessage.save();

//     // Update the chat's latest message
//     await Chat.updateOne(
//       { _id: mongoose.Types.ObjectId(savedMessage.chatId) },
//       { $set: { latestMessage: mongoose.Types.ObjectId(savedMessage._id) } },
//       { new: true }
//     );

//     if (savedMessage) {
//       const condition = { _id: savedMessage._id };
//       const sender = await PortalUser.findOne({
//         _id: mongoose.Types.ObjectId(req.body.data.senderID),
//       });
//       let messageDetails = {};

//       if (sender?.role === 'INDIVIDUAL_DOCTOR') {
//         // Doctor's details
//         messageDetails = await Message.aggregate([
//           { $match: condition },
//           {
//             $lookup: {
//               from: 'portalusers',
//               localField: 'senderID',
//               foreignField: '_id',
//               as: 'senderDetails',
//             },
//           },
//           {
//             $unwind: {
//               path: '$senderDetails',
//               preserveNullAndEmptyArrays: true,
//             },
//           },
//         ]);
//       } else if (sender) {
//         // Patient's details
//         const patientData = await httpService.getStaging(
//           'patient/patient-details',
//           { patient_id: req.body.data.senderID },
//           headers,
//           'patientServiceUrl'
//         );

//         messageDetails = [
//           {
//             ...savedMessage.toObject(),
//             senderDetails: patientData,
//           },
//         ];
//       }
//       return sendResponse(req, res, 200, {
//         status: true,
//         body: messageDetails[0],
//         message: 'Message sent successfully',
//       });
//     } else {
//       return sendResponse(req, res, 200, {
//         status: false,
//         body: null,
//         message: 'Failed to send message',
//       });
//     }
//   } catch (err) {
//     console.error('Error sending message:', err);
//     return sendResponse(req, res, 500, {
//       status: false,
//       body: err,
//       message: 'Internal server error',
//     });
//   }
// };

export const allMessage = async (req, res) => {
  try {
    const chatId = mongoose.Types.ObjectId(req.query.chatId);
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 500000;
    const loggedINId = mongoose.Types.ObjectId(req.query.loggedINId);

    let condition = {
      chatId: chatId,
      // deletedBy: { $ne: loggedINId },
      // isDeleted: false,
    };

    const count = await Message.countDocuments(condition);

    const pipeline = [
      { $match: condition },
      {
        $lookup: {
          from: "profileinfos",
          let: { senderId: "$senderID", receiverIds: "$receiverID" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$for_portal_user", "$$senderId"] },
                    { $in: ["$for_portal_user", "$$receiverIds"] },
                  ],
                },
              },
            },
            {
              $project: {
                name: 1,
                profile_picture: 1,
              },
            },
          ],
          as: "userDetails",
        },
      },
      {
        $lookup: {
          from: "portalusers",
          localField: "senderID",
          foreignField: "_id",
          as: "senderDetails",
        },
      },
      {
        $unwind: {
          path: "$senderDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $sort: { createdAt: 1 } },
      { $skip: (page - 1) * limit },
    ];

    // Add $limit only if limit > 0
    if (limit > 0) {
      pipeline.push({ $limit: limit });
    }

    const getData = await Message.aggregate(pipeline);

    if (getData && getData.length > 0) {
      return sendResponse(req, res, 200, {
        status: true,
        body: getData,
        message: "Fetched data successfully",
        totalMessages: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      });
    } else {
      return sendResponse(req, res, 200, {
        status: true,
        body: [],
        message: "No data found",
      });
    }
  } catch (error) {
    sendResponse(req, res, 500, {
      status: false,
      data: error,
      message: "Failed to fetch messages",
      errorCode: "INTERNAL_SERVER_ERROR",
    });
  }
};

// export const allMessage = async (req, res) => {
//   try {
//     const chatId = mongoose.Types.ObjectId(req.query.chatId);
//     const page = req.query.page ? parseInt(req.query.page) : 1;
//     const limit = req.query.limit ? parseInt(req.query.limit) : 500000;
//     const loggedINId = mongoose.Types.ObjectId(req.query.loggedINId);

//     let condition = {
//       chatId: chatId,
//       deletedBy: { $ne: loggedINId },
//       isDeleted: false,
//     };

//     const count = await Message.countDocuments(condition);

//     const getData = await Message.aggregate([
//       { $match: condition },
//       {
//         $lookup: {
//           from: "profileinfos",
//           let: { senderId: "$senderID", receiverIds: "$receiverID" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $or: [
//                     { $eq: ["$for_portal_user", "$$senderId"] },
//                     { $in: ["$for_portal_user", "$$receiverIds"] },
//                   ],
//                 },
//               },
//             },
//             {
//               $project: {
//                 name: 1,
//                 profile_picture: 1,
//               },
//             },
//           ],
//           as: "userDetails",
//         },
//       },
//       {
//         $lookup: {
//           from: "portalusers",
//           localField: "senderID",
//           foreignField: "_id",
//           as: "senderDetails",
//         },
//       },
//       {
//         $unwind: {
//           path: "$senderDetails",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       { $sort: { createdAt: 1 } },
//       { $skip: (page - 1) * limit },
//       { $limit: limit },
//     ]);

//     if (getData && getData.length > 0) {
//       return sendResponse(req, res, 200, {
//         status: true,
//         body: getData,
//         message: "Fetched data successfully",
//         totalMessages: count,
//         totalPages: Math.ceil(count / limit),
//         currentPage: page,
//       });
//     } else {
//       return sendResponse(req, res, 200, {
//         status: true,
//         body: [],
//         message: "No data found",
//       });
//     }
//   } catch (error) {
//     sendResponse(req, res, 500, {
//       status: false,
//       data: error,
//       message: "failed to update staff",
//       errorCode: "INTERNAL_SERVER_ERROR",
//     });
//   }
// };

export const createGroupChat = async (req, res) => {
  try {
    const headers = {
      Authorization: req.headers["authorization"],
    };

    let saveData = new Chat({
      senderID: req.body.data.sender,
      receiverID: req.body.data.receiver,
      groupName: req.body.data.groupName,
      profile_pic: req.body.data.profile_pic,
      isGroupChat: req.body.data.isGroupChat,
    });

    let saveChat = await saveData.save();

    if (saveChat) {
      let saveData = new Message({
        chatId: saveChat._id,
        senderID: saveChat.senderID,
        receiverID: saveChat.receiverID,
        message: "Hi",
        attachments: [],
      });

      let saveMessage = await saveData.save();

      const jsondata = {
        latestMessage: mongoose.Types.ObjectId(saveMessage._id),
      };

      const newUpdate = await Chat.updateOne(
        { _id: mongoose.Types.ObjectId(saveChat._id) },
        { $set: jsondata },
        { new: true }
      );

      return sendResponse(req, res, 200, {
        status: true,
        body: saveChat,
        message: "Group Room Created successfully",
      });
    } else {
      return sendResponse(req, res, 200, {
        status: false,
        body: null,
        message: "Failed to create room",
      });
    }
  } catch (err) {
    return sendResponse(req, res, 500, {
      status: true,
      body: err,
      message: "Internal server error",
    });
  }
};

export const addMembersToGroupChat = async (req, res) => {
  try {
    const headers = {
      Authorization: req.headers["authorization"],
    };

    const chatroomId = req.body.data.chatroomId;
    const newMembers = req.body.data.newMembers;

    const existingChat = await Chat.findOne({ _id: chatroomId });

    if (!existingChat) {
      return sendResponse(req, res, 404, {
        status: false,
        body: null,
        message: "Group chat not found",
      });
    }

    // Convert newMembers to Mongoose ObjectIds
    const memberObjectIds = newMembers.map((id) => mongoose.Types.ObjectId(id));

    // Filter out existing IDs from memberObjectIds
    const uniqueMemberObjectIds = memberObjectIds.filter(
      (id) => !existingChat.receiverID.includes(id)
    );

    // Push uniqueMemberObjectIds into existingChat.receiverID
    existingChat.receiverID.push(...uniqueMemberObjectIds);

    // Update existingChat.receiverID in the database
    const updateResult = await Chat.updateOne(
      { _id: chatroomId },
      { $push: { receiverID: { $each: uniqueMemberObjectIds } } }
    );

    return sendResponse(req, res, 200, {
      status: true,
      body: existingChat,
      message: "Members added successfully to the group chat",
    });
  } catch (err) {
    return sendResponse(req, res, 500, {
      status: false,
      body: err,
      message: "Internal server error",
    });
  }
};

export const saveNotification = async (req, res) => {
  try {
    const headers = {
      Authorization: req.headers["authorization"],
    };
    const chatData = await Chat.findOne({
      _id: mongoose.Types.ObjectId(req?.body?.chatId),
    });

    const receiverData =
      req.body?.for_portal_user == req.body?.created_by
        ? chatData?.senderID
        : req.body?.for_portal_user;

    const permiResult = await httpService.getStaging(
      "menu/all-user-menu",
      { module_name: "superadmin", user_id: receiverData },
      headers,
      "superadminServiceUrl"
    );
    if (permiResult?.body.length > 0) {
      const menuNames = ["Communication"];
      const hasAccess = permiResult?.body.some((ele) =>
        menuNames.includes(ele?.menu_id?.name)
      );
      if (hasAccess) {
        let saveNotify = new Notification({
          chatId: req.body.chatId,
          created_by: req.body.created_by,
          for_portal_user: receiverData,
          content: req.body.content,
          notitype: req.body.notitype,
          created_by_type: req.body.created_by_type,
        });
        let saveData = await saveNotify.save();
        if (saveData) {
          return sendResponse(req, res, 200, {
            status: true,
            body: saveNotify,
            message: "Notification Saved Successfully",
          });
        } else {
          return sendResponse(req, res, 400, {
            status: true,
            body: saveChat,
            message: "Notification not Saved",
          });
        }
      }
    }
    else {
      let data = {
        chatId: req.body.chatId,
        created_by: req.body.created_by,
        for_portal_user: receiverData,
        content: req.body.content,
        notitype: req.body.notitype,
        created_by_type: req.body.created_by_type,
      };
      const saveNotiInPatient = await httpService.postStaging(
        "patient/save-superadmin-notification",
        { data },
        headers,
        "patientServiceUrl"
      );
      if (saveNotiInPatient) {
        return sendResponse(req, res, 200, {
          status: true,
          body: saveNotiInPatient,
          message: "Notification Saved Successfully",
        });
      } else {
        return sendResponse(req, res, 400, {
          status: true,
          body: null,
          message: "Notification not Saved",
        });
      }
    }
  } catch (err) {
    return sendResponse(req, res, 500, {
      status: false,
      body: err,
      message: "Internal server error",
    });
  }
};

export const getNotification = async (req, res) => {
  try {
    let matchFilter = {
      for_portal_user: mongoose.Types.ObjectId(req.query.for_portal_user),
    };
    // const getData = await Notification.find({
    //   for_portal_user: mongoose.Types.ObjectId(req.query.for_portal_user)
    // }).sort({ createdAt: -1 });

    const count = await Notification.countDocuments({
      for_portal_user: mongoose.Types.ObjectId(req.query.for_portal_user),
      new: true,
    });

    const isViewcount = await Notification.countDocuments({
      for_portal_user: mongoose.Types.ObjectId(req.query.for_portal_user),
      isView: false,
    });

    const notificationData = await Notification.aggregate([
      { $match: matchFilter },
      {
        $lookup: {
          from: "portalusers",
          localField: "created_by",
          foreignField: "_id",
          as: "receiverDetails",
        },
      },
      {
        $unwind: {
          path: "$receiverDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    return sendResponse(req, res, 200, {
      status: true,
      body: { list: notificationData, count: count, isViewcount: isViewcount },
      message: "List fetched successfully",
    });
  } catch (err) {
    return sendResponse(req, res, 500, {
      status: false,
      body: err,
      message: "Internal server error",
    });
  }
};

export const updateNotification = async (req, res) => {
  try {
    const { receiverId, isnew } = req.body;
    if (!isnew) {
      let notificationDetails = await Notification.updateMany(
        { for_portal_user: { $eq: receiverId } },
        {
          $set: {
            new: false,
          },
        },
        { upsert: false, new: true }
      ).exec();
    }
    sendResponse(req, res, 200, {
      status: true,
      body: notificationDetails,
      message: `Notification updated successfully`,
      errorCode: null,
    });
  } catch (error) {
    sendResponse(req, res, 500, {
      status: false,
      body: error,
      message: `failed to update notification list`,
      errorCode: "INTERNAL_SERVER_ERROR",
    });
  }
};

export const markAllReadNotification = async (req, res) => {
  try {
    const { sender } = req.body;
    const update = await Notification.updateMany(
      { for_portal_user: { $in: [mongoose.Types.ObjectId(sender)] } },
      { $set: { isView: true } },
      { new: true }
    );

    return sendResponse(req, res, 200, {
      status: true,
      body: update,
      message: "Mark All Read successfully",
    });
  } catch (err) {
    return sendResponse(req, res, 500, {
      status: false,
      body: err,
      message: "Internal server error",
    });
  }
};

export const markReadNotificationByID = async (req, res) => {
  try {
    const { _id } = req.body;
    let updateNotification = await Notification.updateOne(
      { _id: mongoose.Types.ObjectId(_id) },
      { $set: { isView: true } },
      { new: true }
    );

    return sendResponse(req, res, 200, {
      status: true,
      body: updateNotification,
      message: "Mark All Read successfully",
    });
  } catch (err) {
    return sendResponse(req, res, 500, {
      status: false,
      body: err,
      message: "Internal server error",
    });
  }
};

export const clearAllmessages = async (req, res) => {
  try {
    const { chatId, deletedBy } = req.body;
    const deleteData = await Message.updateMany(
      { chatId: mongoose.Types.ObjectId(chatId) },
      { $push: { deletedBy: { user_Id: mongoose.Types.ObjectId(deletedBy) } } },
      { new: true }
    );

    return sendResponse(req, res, 200, {
      status: true,
      body: deleteData,
      message: "Delete messages successfully",
    });
  } catch (err) {
    return sendResponse(req, res, 500, {
      status: false,
      body: err,
      message: "Internal server error",
    });
  }
};

export const clearSinglemessages = async (req, res) => {
  try {
    const { chatId, deletedBy, messageId } = req.body;
    

    const updatedMessage = await Message.findByIdAndUpdate(
      mongoose.Types.ObjectId(messageId),
      {
        deletedBy: mongoose.Types.ObjectId(deletedBy),
        isDeleted: true,
      },
      { new: true }
    );

    if (!updatedMessage) {
      return sendResponse(req, res, 404, {
        status: false,
        message: "Message not found",
      });
    }

    return sendResponse(req, res, 200, {
      status: true,
      body: updatedMessage,
      message: "Message deleted successfully",
    });
  } catch (err) {
    console.error("Error in clearSinglemessages:", err);
    return sendResponse(req, res, 500, {
      status: false,
      body: err,
      message: "Internal server error",
    });
  }
};

export const updateOnlineStatus = async (req, res) => {
  const { id, isOnline, socketId } = req.body;
  try {
    const userExist = await PortalUser.find({ _id: { $eq: id } });
    if (userExist.length <= 0) {
      sendResponse(req, res, 500, {
        status: false,
        data: null,
        message: `User not exists`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
      return;
    }
    const updateSuperadmin = await PortalUser.findOneAndUpdate(
      { _id: userExist[0]._id },
      { $set: { isOnline, socketId } },
      { new: true }
    );
    if (updateSuperadmin) {
      return sendResponse(req, res, 200, {
        status: true,
        data: updateSuperadmin,
        message: `Status updated successfully`,
        errorCode: null,
      });
    } else {
      return sendResponse(req, res, 400, {
        status: false,
        data: null,
        message: `Status not updated successfully`,
        errorCode: null,
      });
    }
  } catch (err) {
    sendResponse(req, res, 500, {
      status: false,
      data: err,
      message: `failed to update Status`,
      errorCode: "INTERNAL_SERVER_ERROR",
    });
  }
};

export const updateSocketId = async (req, res) => {
  const { socketId } = req.body;
  try {
    const updateSuperadmin = await PortalUser.findOneAndUpdate(
      { socketId: socketId },
      { $set: { isOnline: false } },
      { new: true }
    );
    if (updateSuperadmin) {
      return sendResponse(req, res, 200, {
        status: true,
        data: updateSuperadmin,
        message: `Status updated successfully`,
        errorCode: null,
      });
    } else {
      return sendResponse(req, res, 200, {
        status: false,
        data: null,
        message: `Status not updated successfully`,
        errorCode: null,
      });
    }
  } catch (err) {
    sendResponse(req, res, 500, {
      status: false,
      data: err,
      message: `failed to update staff`,
      errorCode: "INTERNAL_SERVER_ERROR",
    });
  }
};

export const sendPushNotificattionToPatient = async (req, res) => {
  try {
    const headers = {
      Authorization: req.headers["authorization"],
    };

    const { userID, condition, doctorId, appointment_id, doctorName } = req.query;


    const findUser = await PortalUser.findOne({ _id: mongoose.Types.ObjectId(userID) });

    if (findUser === null) {
      const findPatient = await httpService.getStaging("patient/get-portal-data", { data: userID }, headers, "patientServiceUrl");

      if (findPatient?.status) {
        let fcmToken = findPatient?.data[0].deviceToken;
        let patient_name = findPatient?.data[0].full_name;
        let userContact = findPatient?.data[0].country_code + findPatient?.data[0].mobile;
        const isNotification = findPatient?.data[0].notification;


        const getContent = await httpService.getStaging('superadmin/get-notification-by-condition', { condition: condition, type: 'push_notification' }, headers, 'superadminServiceUrl');
        if (getContent?.status && getContent?.data.length) {
          const notificationData = {
            title: getContent?.data[0].notification_title,
            body: generateNotificationMessage(condition, getContent?.data[0].content, patient_name, doctorName)
          };
          if (isNotification == true) {
            sendPushNotification(fcmToken, notificationData);
          }
        }

        const getContentforsms = await httpService.getStaging('superadmin/get-notification-by-condition', { condition: condition, type: 'sms' }, headers, 'superadminServiceUrl');
        const content = generateNotificationMessage(condition, getContentforsms?.data[0].content, patient_name, doctorName);
        if (getContentforsms?.status && getContentforsms?.data.length) {
          sendSms(userContact, content);
        }

        let paramsData = { sendTo: 'patient' }
        const requestData = {
          created_by_type: 'doctor',
          created_by: doctorId,
          content: content,
          url: "",
          for_portal_user: userID,
          title: getContent?.data[0].notification_title,
          appointmentId: appointment_id,
        };

        await notification(paramsData, headers, requestData);

      }
    }
  } catch (error) {
    console.log("error___1", error);

    return sendResponse(req, res, 500, {
      status: false,
      body: error,
      message: `failed to notification`,
      errorCode: "INTERNAL_SERVER_ERROR",
    });
  }
};