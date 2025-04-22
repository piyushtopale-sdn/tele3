import mongoose from "mongoose";

const messageModel = mongoose.Schema(
  {
    senderID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PortalUser"
    },
    receiverID: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PortalUser"
      }
    ],
    appointmentID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment"
    },
    message: {
      type: String
    },
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat"
    },
    isRead: {
      type: Boolean,
      default: false
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    attachments: [
      {
        type: Object,
        path: String
      }
    ],
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      }
    ,
    type:{
      type :String
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageModel);

module.exports = Message;
