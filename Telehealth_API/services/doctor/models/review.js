import mongoose from "mongoose";
const reviewAndRatingSchema = new mongoose.Schema(
    {
        rating: {
            type: Number,
        },
        comment: {
            type: String,
        },
        patient_Id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PortalUser',
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PortalUser',
        },
        reviewBy:{
            type:String,
            default:null,
            enum:[null,'doctor','patient']
        },
        reviewTo:{
            type:String,
            default:null,
            enum:[null,'doctor','hospital']
        },
        status: {
            type: Boolean,
            default: true, 
        }
    },
    { timestamps: true }
);


export default mongoose.model("ReviewAndRating", reviewAndRatingSchema);
