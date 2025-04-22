import mongoose from "mongoose";
const documentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
        },
        code: {
            type: String,
        },
        e_tag: {
            type: String,
        },
        url: {
            type: String,
        },
        is_deleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);
export default mongoose.model("DocumentInfo", documentSchema);
