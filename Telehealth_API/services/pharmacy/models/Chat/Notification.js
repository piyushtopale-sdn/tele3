import mongoose from "mongoose";

const notificationModel = new mongoose.Schema(
    {
        content: {
            type: String,
        },
        url: {
            type: String,
        },
        appointmentId: {   //used to store orderid also
            type: mongoose.Schema.Types.ObjectId,
        },
        notitype: {
            type:String,
        },
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "PortalUser"
        },
        created_by_type: {
            type: String,
            required: true,
        },
        for_portal_user: [{
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "PortalUser"
        }],
        isView:{
            type:Boolean,
            default:false
        },
        new:{
            type:Boolean,
            default:true
        },
        chatId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chat"
        },
        title: {
            type: String,
        }
    },
    { timestamps: true }
);

export default mongoose.model("Notification", notificationModel);
