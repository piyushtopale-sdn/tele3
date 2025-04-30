import mongoose from "mongoose";
import Http from "../helpers/httpservice";
const httpService = new Http();
import BasicInfo from "../models/basic_info";
import PortalUser from "../models/portal_user";
import Chat from "../models/Chat/ChatModel";
import Message from "../models/Chat/Message";
import Notification from "../models/notification";
import { sendResponse } from "../helpers/transmission";
import StaffInfo from "../models/staffInfo";
import DocumentInfo from "../models/document_info"

export const getAllUsersForChat = async (req, res) => {
    try {
        const { loggedInId, adminId,portalType } = req.query;

        let getData;
        const getRole = await PortalUser.findOne({ _id: mongoose.Types.ObjectId(loggedInId) });

        if (getRole.role === "STAFF" && getRole.type === portalType) {
            getData = await getIndividualFourPortalStaff(loggedInId, adminId);
        }
        if (getRole.role === "INDIVIDUAL" && getRole.type === portalType) {
            getData = await getLisforIndividualFourPortal(loggedInId, adminId,req);
        }
        
        return sendResponse(req, res, 200, {
            status: true,
            body: getData,
            message: "successfully get all hospital staff",
            errorCode: null,
        });

    } catch (error) {
        console.error(error);
        return sendResponse(req, res, 500, {
            status: false,
            body: null,
            message: "failed to get all hospital staff",
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
}

export const getLisforIndividualFourPortal = async (loggedInId, adminId, req) => {
    try {

        const headers = {
          'Authorization': req.headers['authorization']
        }
        const matchFilter = {
            isDeleted: false,
            isActive: true
        };

        const getData = await BasicInfo.findOne({ for_portal_user: mongoose.Types.ObjectId(loggedInId) });
        let getHosp = await httpService.getStaging('hospital/get-portal-user-data', { data: getData?.for_hospitalIds[0] }, headers, 'hospitalServiceUrl');

        let query = [];
        let aggregateResults = [];

        if (getHosp?.data.length > 0) {
          let getHospitalData = {
            role: getHosp?.data[0]?.role,
            id: getHosp?.data[0]?._id,
            name: getHosp?.data[0]?.full_name,
            profile_pic: getHosp?.data[0]?.profile_picture,
          };
          aggregateResults.push(getHospitalData);
        }

        query = [
            {
                $match: matchFilter,
            },
            {
                $lookup: {
                    from: "staffinfos",
                    localField: "_id",
                    foreignField: "for_portal_user",
                    as: "staffinfos",
                },
            },
            { $unwind: "$staffinfos" },
            {
                $match: {
                    "staffinfos.creatorId": mongoose.Types.ObjectId(adminId),
                    "staffinfos.for_portal_user": { $ne: mongoose.Types.ObjectId(loggedInId) }
                }
            },
            {
                $project: {
                    role: 1,
                    id: "$staffinfos.for_portal_user",
                    name: "$staffinfos.name",
                    profile_pic: "$staffinfos.profile_picture",
                },
            },
        ];

        // Execute the query and aggregate pipelines separately
        const queryResults = await PortalUser.aggregate(query);

        // Combine the results 
        const combinedResults = getHosp ? [...queryResults, ...aggregateResults] : queryResults;

        return combinedResults;

    } catch (error) {
        console.error(error);
    }
}

export const getIndividualFourPortalStaff = async (loggedInId, adminId) => {
    try {
        const matchFilter = {
            isDeleted: false,
            isActive: true
        };

        const getData = await StaffInfo.findOne({ for_portal_user: mongoose.Types.ObjectId(loggedInId) });
        let getDocPortal = await PortalUser.findOne({ _id: mongoose.Types.ObjectId(getData?.creatorId) });

        let getDoctor = await BasicInfo.findOne({ for_portal_user: mongoose.Types.ObjectId(getDocPortal?._id) });

        let getDocImage = await DocumentInfo.findOne({ _id: mongoose.Types.ObjectId(getDoctor?.profile_picture) });

        let aggregateResults = [];

        let getHospitalData = {
            role: getDocPortal?.role,
            id: getDocPortal?._id,
            name: getDoctor?.full_name,
            profile_pic: getDocImage?.url
        }
        aggregateResults.push(getHospitalData)

        let query = [];

        query = [
            {
                $match: matchFilter,
            },
            {
                $lookup: {
                    from: "staffinfos",
                    localField: "_id",
                    foreignField: "for_portal_user",
                    as: "staffinfos",
                }
            },
            { $unwind: "$staffinfos" },
            {
                $match: {
                    "staffinfos.creatorId": mongoose.Types.ObjectId(adminId),
                    "staffinfos.for_portal_user": { $ne: mongoose.Types.ObjectId(loggedInId) }
                }
            },
            {
                $lookup: {
                    from: "basicinfos",
                    localField: "staffinfos.creatorId",
                    foreignField: "for_portal_user",
                    as: "basicinfosData",
                }
            },
            { $unwind: "$basicinfosData" },
            {
                $project: {
                    role: 1,
                    id: "$staffinfos.for_portal_user",
                    name: "$staffinfos.name",
                    profile_pic: "$staffinfos.profile_picture",
                },
            },
        ];

        // Execute the query and aggregate pipelines separately
        const queryResults = await PortalUser.aggregate(query);

        // Combine the results 
        const combinedResults = [...queryResults, ...aggregateResults];

        return combinedResults;

    } catch (error) {
        console.error(error);
    }
}

export const getListforHospitalFourPortal = async (loggedInId, adminId,req) => {
    try {
        const headers = {
         'Authorization': req.headers['authorization']
        }

        const getData = await BasicInfo.findOne({ for_portal_user: mongoose.Types.ObjectId(loggedInId) });

        // Get Hospital Data
        let getHosp =await httpService.getStaging('hospital/get-portal-user-data', { data: getData?.for_hospitalIds[0] }, headers, 'hospitalServiceUrl');
        let aggregateResults = [];
        let getHospitalData = {
            role: getHosp?.data[0]?.role,
            id: getHosp?.data[0]?._id,
            name: getHosp?.data[0]?.full_name,
            profile_pic: getHosp?.data[0]?.profile_picture,
        }
        aggregateResults.push(getHospitalData)

        // For Staff Data
        let staffInfoArray = [];
        let staffDataArray = [];
        if (getData && getData?.assign_staff && getData?.assign_staff?.length > 0) {
            for (let i = 0; i < getData?.assign_staff?.length; i++) {
                const staffId = getData?.assign_staff[i];
                 // Add a check to skip empty strings
                if (staffId.trim() === '') {
                  continue;
                }
                const staffInfo = await httpService.getStaging('hospital/get-staff-profile-data', { data: staffId }, headers, 'hospitalServiceUrl');
                staffInfoArray.push(staffInfo);
            }
        }
        for (let i = 0; i < staffInfoArray.length; i++) {
          const staffInfo = staffInfoArray[i];
          if (staffInfo?.data && staffInfo?.data?.length > 0) {
              const staffData = {
                  // role: getHosp?.data[i]?.role,
                  id: staffInfo?.data[0]?.for_portal_user,
                  name: staffInfo?.data[0]?.name,
                  profile_pic: staffInfo?.data[0]?.profile_picture,
              };
              staffDataArray.push(staffData);
          }
        }


        // Combine the results 
        const combinedResults = [...aggregateResults, ...staffDataArray];

        return combinedResults;

    } catch (error) {
        console.error(error);
    }
}

export const createdChat = async (req, res) => {
    try {

      let newData = await Chat.findOne({
        $or: [
          {
            senderID: mongoose.Types.ObjectId(req.body?.data?.sender),
            receiverID: { $in: [mongoose.Types.ObjectId(req.body?.data?.receiver)] },
          },
          {
            senderID: { $in: [mongoose.Types.ObjectId(req.body?.data?.receiver)] },
            receiverID: mongoose.Types.ObjectId(req.body?.data?.sender),
          },
        ],
        isGroupChat:false
      });
  
  
      if (newData) {
        return sendResponse(req, res, 200, {
          status: false,
          body: null,
          message: "Already exist",
        });
      } else {
        let saveData = new Chat({
          senderID: req.body?.data?.sender,
          receiverID: req.body?.data?.receiver,
          type: req.body?.data?.type
        });
  
        let saveChat = await saveData.save();
  
        if (saveChat) {
          let saveData = new Message({
            chatId: saveChat?._id,
            senderID: saveChat?.senderID,
            receiverID: saveChat?.receiverID,
            message: "Hi",
            attachments: []
          });
  
          let saveMessage = await saveData.save();
  
          const jsondata = {
            latestMessage: mongoose.Types.ObjectId(saveMessage?._id)
          }
  
          await Chat.updateOne(
            { _id: mongoose.Types.ObjectId(saveChat?._id) },
            { $set: jsondata },
            { new: true }
          )
  
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
  
export const getCreatedChats = async (req, res) => {
    const { id, searchQuery } = req.query;
    try {
      const headers = {
        'Authorization': req.headers['authorization']
      }
      let filter = {}
  
      if (searchQuery && searchQuery !== "") {
        filter["$or"] = [
          {
            groupName: { $regex: searchQuery, $options: "i" },
          },
         {
            "receiverDetails.full_name": { $regex: searchQuery, $options: "i" },
          },
          {
            "senderDetails.full_name": { $regex: searchQuery, $options: "i" },
          },
        ];
      }
  
      const result = await Chat.aggregate([
        { $sort: { updatedAt: -1 } },
        {
          $match: {
            $or: [
              {
                senderID: mongoose.Types.ObjectId(id)
              },
              {
                receiverID: mongoose.Types.ObjectId(id)
              }
            ]
          }
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
        { $match: filter },
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
            preserveNullAndEmptyArrays: true
          }
        },
      ]);
      const receiverData = await httpService.getStaging('hospital/get-portal-user-data', { data: result[0]?.receiverID[0] }, headers, 'hospitalServiceUrl');
      const senderData = await httpService.getStaging('hospital/get-portal-user-data', { data: result[0]?.senderID }, headers, 'hospitalServiceUrl');

      const modifiedResult = await Promise.all(result.map(async (chat) => {
        // Use find to match the corresponding receiver and sender data for each chat
        const receiver = receiverData?.data.find(user => user?._id === chat?.receiverID[0].toString());
        const sender = senderData?.data.find(user => user?._id === chat?.senderID.toString());

        if (receiver?.role === 'HOSPITAL_ADMIN' || receiver?.role === 'HOSPITAL_STAFF') {
          chat.receiverDetails = [receiver];
        }
          
        if (sender?.role === 'HOSPITAL_ADMIN' || sender?.role === 'HOSPITAL_STAFF') {
          chat.senderDetails = sender;
        }
  
        return chat;
      }));
  
      if (modifiedResult.length > 0) {
        return sendResponse(req, res, 200, {
          status: true,
          body: modifiedResult, // Use the modified dataArray instead of the original result
          message: "Fetched data successfully",
          errorCode: null,
        });
      } else {
        return sendResponse(req, res, 200, {
          status: false,
          body: [], // Use the modified dataArray instead of the original result
          message: "No room list found",
          errorCode: null,
        });
      }
    } catch (error) {
      
      sendResponse(req, res, 500, {
        status: false,
        body: error,
        message: "Internal server error",
        errorCode: null,
      });
    }
};
  
export const sendMessage = async (req, res) => {
    try {

      let chcekRoom = await Chat.findOne({ _id: mongoose.Types.ObjectId(req.body?.data?.chatId) });
      const receivers = req.body?.data?.receiverID == req.body?.data?.senderID ? chcekRoom?.senderID : chcekRoom?.receiverID;
  
      let saveData = new Message({
        chatId: req.body?.data?.chatId,
        senderID: req.body?.data?.senderID,
        receiverID: receivers,
        message: req.body?.data?.message,
        attachments: req.body?.data?.attachments,
        type : req.body?.data?.type
      });
  
      let saveChat = await saveData.save();
  
      const jsondata = {
        latestMessage: mongoose.Types.ObjectId(saveChat?._id)
      }
  
      await Chat.updateOne(
        { _id: mongoose.Types.ObjectId(saveChat?.chatId) },
        { $set: jsondata },
        { new: true }
      )
  
  
      if (saveChat) {
  
        let condition = {
          _id: saveChat?._id
        };
  
  
        const getData = await Message.aggregate([
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
              preserveNullAndEmptyArrays: true
            }
          }
        ]);
  
        return sendResponse(req, res, 200, {
          status: true,
          body: getData[0],
          message: "Message send successfully",
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
  
export const allMessage = async (req, res) => {
    try {
      const chatId = mongoose.Types.ObjectId(req.query.chatId);
      const page = req.query.page ? parseInt(req.query.page) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit) : 500000;
      const loggedINId = mongoose.Types.ObjectId(req.query.loggedINId);
  
      let condition = {
        chatId: chatId,
        "deletedBy.user_Id": { $ne: loggedINId }
      };
  
      const count = await Message.countDocuments(condition);
  
      const getData = await Message.aggregate([
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
            from: "hospitaladmininfos",
            let: { senderId: "$senderID", receiverId: "$receiverID" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ["$for_portal_user", "$$senderId"] },
                      { $eq: ["$for_portal_user", "$$receiverId"] },
                    ],
                  },
                },
              },
              {
                $project: {
                  full_name: 1,
                  profile_picture: 1,
                },
              },
            ],
            as: "hospitaladmin",
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
            preserveNullAndEmptyArrays: true
          }
        },
        { $sort: { createdAt: 1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ]);
  
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
          status: false,
          body: [],
          message: "No data found",
        });
      }
    } catch (error) {
      
      sendResponse(req, res, 500, {
        status: false,
        data: error,
        message: "failed to update staff",
        errorCode: "INTERNAL_SERVER_ERROR"
      });
    }
};
  
export const createGroupChat = async (req, res) => {
    try {

      let saveData = new Chat({
        senderID: req.body.data.sender,
        receiverID: req.body.data.receiver,
        groupName: req.body.data.groupName,
        profile_pic: req.body.data.profile_pic,
        isGroupChat: req.body.data.isGroupChat
      });
  
      let saveChat = await saveData.save();
  
      if (saveChat) {
        let saveData = new Message({
          chatId: saveChat._id,
          senderID: saveChat.senderID,
          receiverID: saveChat.receiverID,
          message: "Hi",
          attachments: []
        });
  
        let saveMessage = await saveData.save();
  
        const jsondata = {
          latestMessage: mongoose.Types.ObjectId(saveMessage._id)
        }
  
        await Chat.updateOne(
          { _id: mongoose.Types.ObjectId(saveChat._id) },
          { $set: jsondata },
          { new: true }
        )
  
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
      const memberObjectIds = newMembers.map(id => mongoose.Types.ObjectId(id));
  
      // Filter out existing IDs from memberObjectIds
      const uniqueMemberObjectIds = memberObjectIds.filter(id => !existingChat.receiverID.includes(id));
  
      // Push uniqueMemberObjectIds into existingChat.receiverID
      existingChat.receiverID.push(...uniqueMemberObjectIds);
  
  
      // Update existingChat.receiverID in the database
      await Chat.updateOne(
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

      const chatData = await Chat.findOne({ _id: mongoose.Types.ObjectId(req.body.chatId) });
  
      const receiverData = req.body?.for_portal_user == req.body?.created_by ? chatData?.senderID : req.body?.for_portal_user;

      for(let receiverid of receiverData){
        const permiResult = await httpService.getStaging('menu/all-user-menu', { module_name: 'superadmin',user_id: receiverid }, {}, 'superadminServiceUrl');

        const menuNames = ['Communication'];
        const hasAccess = permiResult?.body.some(ele => menuNames.includes(ele?.menu_id?.name));   
 
        if(hasAccess){
          let saveNotify = new Notification({
            chatId: req.body.chatId,
            created_by: req.body.created_by,
            for_portal_user: receiverData,
            content: req.body.content,
            notitype: req.body.notitype,
            created_by_type: req.body.created_by_type
          })
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
              body: null,
              message: "Notification not Saved",
            });
          }
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

      const {page,limit}=req.query;
      const getData = await Notification.find({
        for_portal_user: mongoose.Types.ObjectId(req.query.for_portal_user)
      }).sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit * 1)
      .exec();
  
      const count = await Notification.countDocuments({
        for_portal_user: mongoose.Types.ObjectId(req.query.for_portal_user),
        new: true
      });
  
      const isViewcount = await Notification.countDocuments({
        for_portal_user: mongoose.Types.ObjectId(req.query.for_portal_user),
        isView: false
      });
  
      const totalCount = await Notification.countDocuments({
        for_portal_user: mongoose.Types.ObjectId(req.query.for_portal_user)});
      
      return sendResponse(req, res, 200, {
        status: true,
        body: { list: getData, count: count, isViewcount: isViewcount,totalCount:totalCount },
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
      const {
        receiverId,
        isnew
      } = req.body; 
      
      if (!isnew) {
        await Notification.updateMany(
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
        body: null,
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
        { new: true });
  
      return sendResponse(req, res, 200, {
        status: true,
        body: updateNotification,
        message: "Mark All Read successfully",
      });
    } catch (err) {
      ;
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
      ;
      return sendResponse(req, res, 500, {
        status: false,
        body: err,
        message: "Internal server error",
      });
    }
};
  
export const clearSinglemessages = async (req, res) => {
    try {
      const { deletedBy,messageId } = req.body;
      const deleteData = await Message.updateOne(
        { _id: mongoose.Types.ObjectId(messageId) },
        { $push: { deletedBy: { user_Id: mongoose.Types.ObjectId(deletedBy) } } },
        { new: true }
      );
  
      return sendResponse(req, res, 200, {
        status: true,
        body: deleteData,
        message: "Delete messages successfully",
      });
    } catch (err) {
      ;
      return sendResponse(req, res, 500, {
        status: false,
        body: err,
        message: "Internal server error",
      });
    }
}
  
export const updateOnlineStatus = async (req, res) => {
    const { id, isOnline,socketId } = req.body;
    try {
      const userExist = await PortalUser.find({ _id: { $eq: id } });
      if (userExist.length <= 0) {
        sendResponse(req, res, 500, {
          status: false,
          data: null,
          message: `User not exists`,
          errorCode: "INTERNAL_SERVER_ERROR",
        });
        return
      }
      const updateSuperadmin = await PortalUser.findOneAndUpdate({ _id:userExist[0]._id }, { $set: { isOnline ,socketId} }, { new: true })
      if (updateSuperadmin) {
        return sendResponse(req, res, 200, {
          status: true,
          data: updateSuperadmin,
          message: `Status updated successfully`,
          errorCode: null,
        })
      } else {
        return sendResponse(req, res, 400, {
          status: false,
          data: null,
          message: `Status not updated successfully`,
          errorCode: null,
        })
      }
  
    } catch (err) {
      
      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to update Status`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
}
  
export const updateSocketId = async (req, res) => {
    const { socketId } = req.body;
    try {
      const updateSuperadmin = await PortalUser.findOneAndUpdate({ socketId: socketId }, { $set: { isOnline: false} },{ new: true })
      if (updateSuperadmin) {
        return sendResponse(req, res, 200, {
          status: true,
          data: updateSuperadmin,
          message: `Status updated successfully`,
          errorCode: null,
        })
      } else {
        return sendResponse(req, res, 200, {
          status: false,
          data: null,
          message: `Status not updated successfully`,
          errorCode: null,
        })
      }
  
    } catch (err) {
      
      sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to update staff`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
}