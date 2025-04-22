import mongoose from "mongoose";

const ICDCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
    },
    disease_title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    active_status: {
      type: Boolean,
      required: true,
      default: true,
    },
    delete_status: {
      type: Boolean,
      required: true,
      default: false,
    },
    added_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Superadmin",
    },
  },
  { timestamps: true }
);
export default mongoose.model("ICDCode", ICDCodeSchema);
