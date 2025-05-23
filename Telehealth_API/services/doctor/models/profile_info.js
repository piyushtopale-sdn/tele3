import mongoose from "mongoose";

const profileInfoSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    first_name: {
      type: String,
    },
    middle_name: {
      type: String,
    },
    last_name: {
      type: String,
    },
    name_arabic: {
      type: String,
    },
    first_name_arabic: {
      type: String,
    },
    middle_name_arabic: {
      type: String,
    },
    last_name_arabic: {
      type: String,
    },
    dob: {
      type: Date,
    },
    language: [
      {
        type: String,
      },
    ],
    gender: {
      type: String,
    },
    address: {
      type: String,
    },
    about: {
      type: String,
    },
    profile_picture: {
      type: String,
    },
    in_location: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "LocationInfo",
    },
    for_portal_user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "PortalUser",
      unique: true
    },
  },
  { timestamps: true }
);

export default mongoose.model("ProfileInfo", profileInfoSchema);
