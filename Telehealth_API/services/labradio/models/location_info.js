import mongoose from "mongoose";
const geoJsonSchema = new mongoose.Schema({
  type: {
    type: String,
    default: "Point",
  },
  coordinates: {
    type: [Number],
    index: "2dsphere",
    default: [0, 0],
  },
});

const locationInfoSchema = new mongoose.Schema(
  {
    loc: geoJsonSchema,
    address: {
      type: String,
      default: null,
    },
    neighborhood: {
      type: String,
      default: null,
    },
    nationality: {
      type: String,      
      default: null,
    },
    region: {
      type: String,      
      default: null,
    },
    province: {
      type: String,     
      default: null,
    },
    department: {
      type: String,    
      default: null,
    },
    city: {
      type: String,    
      default: null,
    },
    village: {
      type: String,
      default: null,
    },
    pincode: {
      type: String,
      default: null,
    },
    for_portal_user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "PortalUser",
    },
    type: {
      type: String,
      required: true,
      enum: ["Radiology", "Laboratory"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("LocationInfo", locationInfoSchema);
