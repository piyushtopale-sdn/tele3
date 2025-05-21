import mongoose from "mongoose";

const locationInfoSchema = new mongoose.Schema(
  {
    address: {
      type: String,
    },
    neighborhood: {
      type: String,
    },
    country: {
      type: String,      
      default: null
    },
    region: {
     type: String,
     default: null
    },
    province: {
     type: String,
     default: null
    },
    department: {
     type: String,
     default: null
    },
    city: {
     type: String,
     default: null
    },
    village: {
     type: String,
     default: null
    },
    for_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Superadmin",
     },
    pincode: {
      type: String,
    }
  },
  { timestamps: true }
);

export default mongoose.model("LocationInfo", locationInfoSchema);
