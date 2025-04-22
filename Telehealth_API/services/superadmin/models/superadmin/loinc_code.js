import mongoose from "mongoose";

const loincCodeSchema = new mongoose.Schema(
  {
    loincCode: {
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
export default mongoose.model("LoincCode", loincCodeSchema);
