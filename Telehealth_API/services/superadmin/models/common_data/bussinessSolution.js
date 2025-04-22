import mongoose from "mongoose";

const bussinessSolutionSchema = new mongoose.Schema(
    {
        fullName : {
            type : String,
            required : true
        },
        email : {
            type : String,
            required : true
        },
        country_code:{
            type : String,
            required : true
        },
        phone: {
            type: String,
            required : true
        },
        subject : {
            type : String,
            required : true
        },
        message : {
            type : String,
            required : true
        },
    },
    { timestamps: true }
);

export default mongoose.model("BussinessSolution",bussinessSolutionSchema)