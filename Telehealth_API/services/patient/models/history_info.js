import mongoose from "mongoose";

const historyInfoSchema = new mongoose.Schema(
  {
    allergy_name: {
      type: String,
    },
    allergy_type: {
      type: String,
    },
    allergen: {
      type: String,
    },
    reaction: {
      type: String,
    },
    severity: {
      type: String,
      // mild, moderate, severe
    },
    identified_date: {
      type: String,
    },
    note: {
      type: String,
    },
    isDeleted: false,
    for_portal_user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "PortalUser",
    },
  },
  { timestamps: true }
);

export default mongoose.model("HistoryInfo", historyInfoSchema);
