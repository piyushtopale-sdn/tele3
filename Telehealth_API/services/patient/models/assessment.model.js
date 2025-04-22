import mongoose from "mongoose";

const AssessmentSchema = new mongoose.Schema(
  {
    assessments: [
      {
        questionId: {
          type: String,
        },
        question: {
          type: String,
        },
        answer: {
          type: String,
        },
      }
    ],
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PortalUser"
    },
  },
  { timestamps: true }
);
export default mongoose.model("Assessment", AssessmentSchema);
