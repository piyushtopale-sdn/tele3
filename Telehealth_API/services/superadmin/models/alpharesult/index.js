import mongoose from "mongoose";

const alphaResultSchema = new mongoose.Schema(
  {
    alphaResultName: {
      type: String,
    },
    alphaResultNameArabic: {
      type: String,
    },
    isMarkedAsCritical: {
      type: Boolean,
    },
    status: {
      type: Boolean,
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

export default mongoose.model("AlphaResult", alphaResultSchema);
