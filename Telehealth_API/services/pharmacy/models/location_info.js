import mongoose from "mongoose";
const geoJsonSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            default: "Point"
        },
        coordinates: {
            type: [Number],
            index: "2dsphere",
            default: [0, 0]
        }
    }
)


const locationInfoSchema = new mongoose.Schema(
    {
        nationality: {
            type: String,
        },
        neighborhood: {
            type: String,
        },
        region: {
             type: String,           
        },
        province: {
             type: String,            
        },
        department: {
             type: String,           
        },
        city: {
             type: String,            
        },
        village: {
             type: String,            
        },
        pincode: {
            type: String,
        },        
        address: {
            type: String,
        },
        loc: geoJsonSchema,
        for_portal_user: {
             type: String,
            required: true,
            ref: "PortalUser",
        },
    },
    { timestamps: true }
);

export default mongoose.model("LocationInfo", locationInfoSchema);
