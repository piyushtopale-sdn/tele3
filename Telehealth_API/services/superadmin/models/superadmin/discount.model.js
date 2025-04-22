import mongoose from "mongoose";
const couponSchema = new mongoose.Schema(
    {
        couponCode: {
            type: String,
        },
        description: {
            type: String,
        },
        type: {
            type: String,
            enum: ['FIXED_COST', 'PERCENTAGE']
        },
        amountOff: {
            type: Number,
        },
        percentOff: {
            type: Number,
        },
        duration: {
            type: String,
            enum: ['FOREVER', 'ONCE', 'MULTIPLE_MONTH']
        },
        numberOfMonths: {
            type: Number
        },
        redemptionLimit: {
            type: String,
        },
        redeemBefore: {
            type: String,
        },
        lab: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'PortalUser',
                default: null
            }
        ],
        isLabCoupon: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);
export default mongoose.model("DiscountCoupon", couponSchema);
