import mongoose from "mongoose";
const slotsSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      default: false,
    },
    slot: {
      type: String,
      default: false,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "PortalUser",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Slots", slotsSchema);
