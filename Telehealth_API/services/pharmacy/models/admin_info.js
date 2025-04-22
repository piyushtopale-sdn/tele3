import mongoose from "mongoose";

const adminInfoSchema = new mongoose.Schema(
  {
    address: {
      type: String,
    },
    pharmacy_name: {
      type: String,
    },
    pharmacy_name_arabic: {
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

    about_pharmacy: {
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
    pharmacy_picture: [
      {
        type: String,
      },
    ],
    pharmacy_picture_signed_urls: {
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
  },
  { timestamps: true }
);

export default mongoose.model("AdminInfo", adminInfoSchema);
