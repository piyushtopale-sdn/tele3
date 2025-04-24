import mongoose from "mongoose";

const portalUserSchema = new mongoose.Schema(
  {
    centre_name: {
      type: String,
      // required: true,
    },
    centre_name_arabic: {
      type: String,
    },
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
    },
    phone_number: {
      type: String,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    last_update: {
      type: Date,
      required: false,
      default: Date.now,
    },
    lock_user: {
      type: Boolean,
      required: false,
      default: false,
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
      default: false,
    },
    isActive: {
      type: Boolean,
      required: false,
      default: true,
    },
    role: {
      type: String,
      required: true,
      enum: [
        "INDIVIDUAL", //Admin
        "STAFF","ADMIN"
      ],
    },
    type: {
      type: String,
      required: true,
      enum: ["Radiology", "Laboratory"],
    },
    createdBy: {
      type: String,
    },
    permissions: {
      type: Array,
      default: null,
    },
    average_rating: {
      type: String,
      default: 0,
    },
    full_name: {
      type: String,
    },
    full_name_arabic: {
      type: String,
    },
    profile_picture: {
      type: String,
    },
    created_by_user: {
      type: mongoose.Schema.Types.ObjectId,
    },
    staff_ids: [{
      type: String,
    }],
    fcmToken: {
      type: String,
      default: null,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    socketId: {
      type: String,
    },
    notification: {
      type: Boolean,
      default: true,
    },
    activeToken:{
      type: String      
    },
    identifier :{
      branchCode: {
        type: String,
      },
      branchKey: {
        type: String,
      }
    }
  },
  { timestamps: true }
);

export default mongoose.model("PortalUser", portalUserSchema);
