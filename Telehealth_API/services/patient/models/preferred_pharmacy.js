import mongoose from "mongoose";

const preferredPharmacySchema = new mongoose.Schema(
  {
    pharmacyName: {
      type: String,
    },
    address: {
      type: String,
    },
    email: {
      type: String,
    },
    mobile: {
      type: String,
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

export default mongoose.model("PreferredPharmacy", preferredPharmacySchema);
