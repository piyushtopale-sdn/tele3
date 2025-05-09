import mongoose from "mongoose";

const portalUserSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            
        },
        password: {
            type: String,
            required: true,
        },
        country_code: {
            type: String,
            required: true,
            default: "+966"
        },
        mobile: {
            type: String,
        },
        verified: {
            type: Boolean,
            default: true,
        },
        lock_user: {
            type: Boolean,
            default: false
        },
        lock_details: {
            passwordAttempts: Number,
            timestamps: Number,
            lockedReason: String,
            lockedBy: String,
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
        role: {
            type: String,
            required: true,
            enum: [                
                "INDIVIDUAL_DOCTOR",
                "INDIVIDUAL_DOCTOR_STAFF",
                "INDIVIDUAL_DOCTOR_ADMIN",
            ],
        },
        createdBy: {
            type: String,
            default: "self",
            enum: [
                "self",
                "super-admin",
                
            ],
        },
        average_rating: {
            type: String,
            default: 0
        },
        socketId:{
             type:String
        },
        full_name:{
            type:String
        },
        full_name_arabic:{
            type:String
        },
        profile_picture: {
            type: String,
        },
        created_by_user:{
            type: mongoose.Schema.Types.ObjectId   
        },
        staff_ids: [
            {
                type: String,
            }
        ],
        fcmToken: {
            type: String,
            default: null,
        },
        notification:{
            type:Boolean,
            default:true
        },
        doctorId: {
            type: String,
        },
        activeToken:{
            type: String      
        },
        isAdmin:{
            type:Boolean,
            default:false
        },
        
    },
    { timestamps: true }
);

export default mongoose.model("PortalUser", portalUserSchema);
