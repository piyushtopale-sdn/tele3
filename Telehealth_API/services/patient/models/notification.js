import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            
        },
        url: {
            type: String,
            
        },
        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            
        },
        title: {
            type:String,
            
        },
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        created_by_type: {
            type: String,
            required: true,
        },
        for_portal_user: [{
            type: mongoose.Schema.Types.ObjectId,
            // required: true,
            ref: "PortalUser",
        }],
        isView:{
            type:Boolean,
            default:false
        },
        new:{
            type:Boolean,
            default:true
        },
    },
    { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
