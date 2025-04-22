import mongoose from "mongoose";

const SubscriptionPlanSchema = new mongoose.Schema(
  {
    plan_for: {
      type: String,
      required: true
    },
    plan_name: {
      type: String,
      required: true
    },
    plan_name_arabic: {
      type: String,
      required: true
    },
    description:{
      type: String,
    },
    descriptionArabic:{
      type: String
    },
    services: [{
      name: {
        type: String,
      },
      max_number: {
        type: Number,
      },
    }],
    price_per_member: {
      type: Number,
    },
    plan_duration: [
      {
        price: {
          type: String   
        },
        duration: {
          type: String   
        }
      }
    ],
    is_activated: {
      type: Boolean,
      default:true
    },
    trial_period: {
      type: Number
    },
    trial_period_description: {
      type: String
    },
    is_deleted: {
      type: Boolean,
      default:false
    },
    createdBy:{
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    }
  },
  { timestamps: true }
);

export default mongoose.model("SubscriptionPlan", SubscriptionPlanSchema);