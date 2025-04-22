import mongoose from "mongoose";

const familyInfoSchema = new mongoose.Schema(
  {
    family_members: [
      {
        first_name: {
          type: String,
        },
        last_name: {
          type: String,
        },
        gender: {
          type: String,
        },
        dob: {
          type: String,
        },
        relationship: {
          type: String,
        },
        profile_pic: {
          type: String,
        },
        mobile_number: {
          type: String,
        },
        country_code: {
          type: String,
        },
        mrn_number: {
          type: String,
        },
        familyMemberId: {
          type: mongoose.Schema.Types.ObjectId,
        },
        isDeleted: {
          type: Boolean,
          default: false,
        },
        isDependent: {
          type: Boolean,
          default: false,
        },
      },
    ],

    for_portal_user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "PortalUser",
      unique: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("FamilyInfo", familyInfoSchema);
