import mongoose from "mongoose";

const eprescriptionSchema = new mongoose.Schema(
    {
        medicineDosageIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'EprescriptionMedicineDosage',
        }],
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
        eSignature: {
            type: String,
            default:null
        },
        status: {
            type: String,
            default: 'PENDING',
            enum: ['PENDING', 'ORDERED', 'INPROGRESS', 'COMPLETED']
        },
    },
    { timestamps: true }
);

export default mongoose.model("Eprescription", eprescriptionSchema);
