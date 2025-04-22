import mongoose from "mongoose";

const portalUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
    },
    userId: {
      type: String,
    },
    user_name: {
      type: String,
    },
    country_code: {
      type: String,
      default: "+966",
    },
    mobile: {
      type: String,
    },
    last_update: {
      type: Date,
      required: false,
      default: Date.now,
    },
    role: {
      type: String,
      default: "PATIENT",
    },
    lock_user: {
      type: Boolean,
      required: false,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      required: false,
      default: false,
    },
    isActive: {
      type: Boolean,
      required: false,
      default: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    ipAddress: {
      type: String,
      default: "ip",
    },
    deviceToken: [{
      type: String,
    }],
    notification: {
      type: Boolean,
      default: true,
    },
    full_name: {
      type: String,
    },
    full_name_arabic: {
      type: String,
    },
    subscriptionDetails: {
      isPlanActive: {
        type: Boolean,
        default: false,
      },
      isPlanCancelled: {
        type: Boolean,
        default: false,
      },
      moyasarToken: {
        type: String,
      },
      subscriptionPlanId: {
        type: String,
      },
      nextBillingPlanId: {
        type: String,
      },
      subscriptionDuration: {
        type: String,
      },
      services: {
        type: Object
      },
      addonServices: {
        type: Object
      },
      discountCoupon: {
        type: String
      },
      discountUsedCount: {
        type: Number,
        default: 0
      },
      trialDays: {
        type: Number,
        default: 0
      },
      paymentRetried: {
        type: Number,
        default: 0
      },
      period:{
        start: {
            type: String,
        },
        end: {
            type: String,
        }
    },
    },
    parent_userid: {
      type: String,
    },
    isDependent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("PortalUser", portalUserSchema);