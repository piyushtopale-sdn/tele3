import mongoose from "mongoose";

const diagnosisSchema = new mongoose.Schema(
    {
        subject: {
            type: String,
        },
        object: {
            type: String,
        },
        assessment: {
            type: String,
        },
        icdCode: [{
            id: {
                type: String,
            },
            code: {
                type: String,
            }
        }],
        plan: {
            type: String,
        },
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Diagnosis", diagnosisSchema);
