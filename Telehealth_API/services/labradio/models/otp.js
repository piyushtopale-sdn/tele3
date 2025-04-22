import mongoose from "mongoose";

const otp2faSchema = new mongoose.Schema(
    {
        country_code: {
            type: String
        },
        phone_number: {
            type: String
        },
        uuid: {
            type: String,
            required: true
        },
        otp: {
            type: String,
            required: true,
        },
        email: {
            type: String,
        },
        otpExpiration: {
            type: Number,
        },
        limitExceedWithin: {
            type: Number,
        },
        isTimestampLocked: {
            type: Boolean,
            default: false,
        },
        send_attempts: {
            type: Number,
            default: 1
        },
        verified: {
            type: Boolean,
            default: false
        },
        for_portal_user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "PortalUser"
        },
        type: {
            type: String,
            required: true,
            enum: ["Radiology", "Laboratory"],
        },

    },
    { timestamps: true }
);

export default mongoose.model("Otp2fa", otp2faSchema);
