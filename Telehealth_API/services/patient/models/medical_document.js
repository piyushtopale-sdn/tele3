import mongoose from "mongoose";

const medicalDocumentSchema = new mongoose.Schema(
    {
        documentName: {
            type: String,
        },
        issueDate: {
            type: String,
        },
        expiryDate: {
            type: String,
        },
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "PortalUser",
        },
        parentPatientId: {
            type: String,
            default: ""
        },
        documentsOf: {
            type: String,
            enum: ['self', 'family-member']
        },
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PortalUser",
        },
        fileKey: {
            type: String,
            default: ""
        },
        isDeleted: {
            type: Boolean,
            default: false,
          },
    },
    { timestamps: true }
);

export default mongoose.model("MedicalDocument", medicalDocumentSchema);
