import mongoose from "mongoose";

const basicInfoSchema = new mongoose.Schema(
  {
    
    centre_name: {
      type: String,
    },
    centre_name_arabic: {
      type: String,
    },
    slogan: {
      type: String,
    },
    main_phone_number: {
      type: String,
    },
    additional_phone_number: {
      type: String,
    },
    about_centre: {
      type: String,
    },
    profile_picture: {
      type: String,
      default: "",
    },
    profile_picture_signed_url: {
      type: String,
      default: "",
    },
    centre_picture: [
      {
        type: String,
      },
    ],
    centre_picture_signed_urls: {
      type: Array,
      default: null,
    },
    licence_details: {
      id_number: {
        type: String,
      },
      expiry_date: {
        type: String,
      },
      licence_picture: {
        type: String,
      },
    },
    verify_status: {
      type: String,
      default: "APPROVED",
      enum: ["PENDING", "APPROVED", "DELETED"],
    },
    in_location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LocationInfo",
    },
    for_portal_user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "PortalUser",
      unique: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["Radiology", "Laboratory"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("BasicInfo", basicInfoSchema);
