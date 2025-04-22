import mongoose from "mongoose";

const languageSchema = new mongoose.Schema(
  {
    language: {
        type: String,
        required: true,
    },
    language_arabic: {
      type: String,
      required: true,
  },
    added_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Superadmin"
    },
    active_status: {
      type: Boolean,
      required: true,
      default:true
    },
    delete_status: {
      type: Boolean,
      required: true,
      default: false
    },
  },
  { timestamps: true }
);
export default mongoose.model("Language", languageSchema);