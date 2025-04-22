import mongoose from "mongoose";

const purchaseHistorySchema = new mongoose.Schema(
    {
        invoiceId: {
            type: String,
        },
        invoiceUrl: {
            type: String,
        },
        planPrice: {
            type: String,
        },
        vatCharges: {
            type: String,
        },
        amountPaid: {
            type: String,
        },
        discountedAmount: {
            type: String,
        },
        paymentMode: {
            type: String,
            enum: ['ApplePay', 'creditcard', 'applepay', 'amazonpay']
        },
        paymentType: {
            type: String,
        },
        currencyCode: {
            type: String,
        },
        status: {
            type: String,
        },
        subscriptionStatus: {
            type: String,
            default:null,
            enum: [null, 'active', 'cancelled', 'expired', 'upgraded']
        },
        transactionType: {
            type: String,
            enum: ['subscription', 'medicine', 'addon','labRadioTests']
        },
        forUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PortalUser",
        },
        period:{
            start: {
                type: String,
            },
            end: {
                type: String,
            }
        },
        subscriptionPlanId:{
            type: String,
        },
        addonCount: {
            type: String
        },
        addonIndividualPrice: {
            type: String
        },
        orderId: {
            type: String
        },
        paymentGateway: {
            type: String
        },
        amazonResponse: {
            type: Object
        },
        paymentId: {
            type: String
        },
        ip: {
            type: String
        },
        paymentFor: {
            type: String
        },
        discountCoupon: {
            type: String
        },
        discountCouponId:{
            type: String
        },
        labRadioId: {
            type: String
        },
        testInfo: {
            type: Array
        },
        refundedInfo: {
            type: Object
        }
    },
    { timestamps: true }
);

export default mongoose.model("PurchaseHistory", purchaseHistorySchema);