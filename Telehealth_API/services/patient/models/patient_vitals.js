import mongoose from "mongoose";

const objectSchema = new mongoose.Schema(
  {
    startDate: String,
    endDate: String,
    value: String,
    unit: String
  }
)

const vitalInfoSchema = new mongoose.Schema(
  {
    height: objectSchema,
    weight: objectSchema,
    h_rate: objectSchema,
    bmi: objectSchema,
    bp_systolic: objectSchema,
    bp_diastolic: objectSchema,
    pulse: objectSchema,
    temp: objectSchema,
    blood_glucose: objectSchema,
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

export default mongoose.model("PatientVital", vitalInfoSchema);
