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
        },
        portal_type: {
            type: String
        },
        reviewBy: {
            type: String,
            default: null,
            enum: [null, 'patient', 'Radiology', 'Laboratory']
        },
        reviewTo: {
            type: String,
            default: null,
            enum: [null, 'Radiology', 'Laboratory-Imaging', ]
        },
    },
    { timestamps: true }
);


export default mongoose.model("ReviewAndRating", reviewAndRatingSchema);
