import mongoose from "mongoose";

const vitalInfoSchema = new mongoose.Schema(
  {
    height: {
      type: String,
    },
    weight: {
      type: String,
    },
    h_rate: {
      type: String,
    },
    bmi: {
      type: String,
    },
    bp_systolic: {
      type: String,
    },
    bp_diastolic: {
      type: String,
    },
    pulse: {
      type: String,
    },
    temp: {
      type: String,
    },
    blood_glucose: {
      type: String,
    },
    role: {
      type: String,
      enum: ["doctor", "patient"]
    },
    added_by: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    appointment_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    is_manual: {
      type: Boolean,
    },
    for_portal_user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "PortalUser",
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("VitalInfo", vitalInfoSchema);
