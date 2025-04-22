import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
    },
    categoryNameArabic: {
      type: String,
    },
    categoryDescription: {
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

export default mongoose.model("Category", CategorySchema);
