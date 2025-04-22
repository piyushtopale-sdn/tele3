import mongoose from "mongoose";

const StudyTypeSchema = new mongoose.Schema(
  {
    studyTypeName: {
      type: String,
    },
    studyTypeNameArabic: {
      type: String,
    },
    description: {
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

export default mongoose.model("StudyType", StudyTypeSchema);
