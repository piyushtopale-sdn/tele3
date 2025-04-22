import mongoose from "mongoose";

const rangeSchema = new mongoose.Schema(
  {
    gender: {
      type: String,
    },
    age: {
      type: String,
    },
    high: {
      type: Number,
    },
    low: {
      type: Number,
    },
    criticalHigh: {
      type: Number,
    },
    criticalLow: {
      type: Number,
    },
    unit: {
      type: String,
    },
  }
)

const vitalsThresholdSchema = new mongoose.Schema(
  {
    vitalsType: {
      type: String,
      enum: ["BLOOD_PRESSURE", "HEART_RATE", "WEIGHT", "PULSE", "TEMPERATURE", "BLOOD_GLUCOSE"]
    },
    BPSystolic: rangeSchema,
    BPDiastolic: rangeSchema,
    gender: {
      type: String,
    },
    age: {
      type: String,
    },
    high: {
      type: Number,
    },
    low: {
      type: Number,
    },
    criticalHigh: {
      type: Number,
    },
    criticalLow: {
      type: Number,
    },
    unit: {
      type: String,
    },
    status: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PortalUser",
    },
  },
  { timestamps: true }
);

export default mongoose.model("VitalsThreshold", vitalsThresholdSchema);
