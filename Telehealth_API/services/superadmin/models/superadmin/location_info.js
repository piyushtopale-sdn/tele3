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
