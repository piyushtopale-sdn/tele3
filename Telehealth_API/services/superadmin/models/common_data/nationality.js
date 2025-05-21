import mongoose from 'mongoose'
 
const NationalitySchema = new mongoose.Schema(
    {
        country:{
            type: String,
            unique: true
        },
        nationality:{
            type: String
        },
        country_code: {
            type: String,
        }
    },
    {timestamps:true}
);
 
export default mongoose.model("Nationality",NationalitySchema)