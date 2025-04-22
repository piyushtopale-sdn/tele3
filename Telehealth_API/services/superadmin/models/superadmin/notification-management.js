import mongoose from "mongoose";
const notificationManagementSchema = new mongoose.Schema(
    {

        notification_title: {
            type: String,
        },
        notification_type:{
            type: String,
            enum: ['email', 'sms', 'whatsapp', 'push_notification']
        },
        condition:{
            type: String,
        },
        content: {
            type: String,
        },
        content_arabic: {
            type: String,
        },
        created_by:{
            type: String,
        },
        is_deleted: {
            type: Boolean,
            default: false
        }

    },
    { timestamps: true }
);
export default mongoose.model("NotificationManagement", notificationManagementSchema);
