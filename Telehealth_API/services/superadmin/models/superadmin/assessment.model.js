import mongoose from "mongoose";

const AssessmentSchema = new mongoose.Schema(
  {
    question: {
      type: String,
    },
    questionArabic: {
      type: String,
    },
    questionFor: {
      type: String,
      enum: ["DOCTOR_SELECTION", "ASSESSMENT"]
    },
    genderSpecific: {
      type: String,
      enum: ['male', 'female', 'other', null],
    },
    type: {
      type: String,
    },
    options: [{
      option: {
        type: String,
      },
      optionArabic: {
        type: String,
      }
    }],
    subQuestions: [{
      selectedOption: {
        type: String,
      },
      question: {
        type: String,
      },
      type: {
        type: String,
      },
      optionsSQ: [{
        option: {
          type: String,
        }
      }]
    }],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isActivated: {
      type: Boolean,
      default: true,
    },
    orderNo: {
      type: Number,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Superadmin",
    },
  },
  { timestamps: true }
);
export default mongoose.model("Assessment", AssessmentSchema);
