import mongoose from "mongoose";

const staffInfoSchema = new mongoose.Schema(
    {
        in_profile: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProfileInfo",
        },
        degree: {
            type: String,
        },
        name: {
            type: String,
        },
        name_arabic: {
            type: String,
        },
        profile_picture: {
            type: String,
          },
        role: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Role",
        },
        staff_of: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PortalUser",
        },
        specialty:{
            type:Array
        },
        department: [
            {
            type: mongoose.Schema.Types.ObjectId,
                
            }
        ],
        services:[
            {
                type: mongoose.Schema.Types.ObjectId,
                
            }
        ],
        unit: [
            {
            type: mongoose.Schema.Types.ObjectId,
                
            }
        ],
        expertise: {
            type: mongoose.Schema.Types.ObjectId,
            
        },
        verify_status: {
            type: String,
            default: "APPROVED",
        },
        lock_user: {
            type: Boolean,
            required: false,
            default: false
        },
        isDeleted: {
            type: Boolean,
            required: false,
            default: false
        },
        isActive: {
            type: Boolean,
            required: false,
            default: true
        },
        for_portal_user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "PortalUser",
            unique: true
        },
        doj: {
            type: Date,
            required: true,
            default: Date.now,
        },
    },
    { timestamps: true }
);

export default mongoose.model("StaffInfo", staffInfoSchema);
