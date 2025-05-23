import mongoose from "mongoose";
const reviewAndRatingSchema = new mongoose.Schema(
    {
        rating: {
            type: Number,
        },
        comment: {
            type: String,
        },
        patient_login_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PortalUser',
        },
        portal_user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PortalUser',
        }
    },
    { timestamps: true }
);


export default mongoose.model("ReviewAndRating", reviewAndRatingSchema);
