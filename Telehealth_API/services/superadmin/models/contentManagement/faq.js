import mongoose from "mongoose";

const FAQSchema = new mongoose.Schema(
    {
      _id: {
        type: String,
      },
      order: {
        type: Number, // Top-level order for the entire FAQ document
        required: true,
      },
      // type:{
      //     type:String
      // },
      faqs: [
        {
          question: {
            type: String,
          },
          answer: {
            type: String,
          },
          questionArabic: {
            type: String,
          },
          answerArabic: {
            type: String,
          },
          language: {
            type: String,
            enum: ["en", "fr"],
          },
          active: {
            type: Boolean,
            required: true,
            default: true,
          },
          is_deleted: {
            type: Boolean,
            required: true,
            default: false,
          },
        },
      ],
    },
    { timestamps: true }
  );
  
export default mongoose.model("FAQ", FAQSchema);
