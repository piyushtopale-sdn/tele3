import mongoose from "mongoose";

const portalUserSchema = new mongoose.Schema(
  {
    pharmacy_name: {
      type: String,
    },
    pharmacy_name_arabic: {
      type: String,
    },
    full_name: {
      type: String,
    },
    full_name_arabic: {
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
    date_of_creation: {
      type: String,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: String      
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
      enum: ["PHARMACY_ADMIN", "PHARMACY_STAFF"],
    },
    permissions: {
      type: Array,
      default: null,
    },
    average_rating: {
      type: String,
      default: 0,
    },
    staff_createdBy: {
      type: String,
      ref: "PortalUser",
    },
    staff_ids: [{
      type: String,
    }],
    isOnline: {
      type: Boolean,
      default: false,
    },
    socketId: {
      type: String,
    },
    fcmToken: {
      type: String,
      default: null,
    },
    profile_picture: {
      type: String,
    },
    notification: {
      type: Boolean,
      default: true,
    },
    activeToken:{
      type: String      
  }
  },
  { timestamps: true }
);

export default mongoose.model("PortalUser", portalUserSchema);
