import mongoose from "mongoose";

const contentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ["label", "message", "text"], required: true },
    slug: { type: String, required: true },
    content: { type: String, required: true },
    contentArabic: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);
export default mongoose.model("Content",contentSchema)