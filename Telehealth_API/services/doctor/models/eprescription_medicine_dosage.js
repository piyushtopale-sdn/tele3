import mongoose from "mongoose";

const eprescriptionMedicineDosageSchema = new mongoose.Schema(
    {
        medicineName: {
            type: String
        },
        dose: {
            type: String
        },
        doseUnit: {
            type: String
        },
        routeOfAdministration: {
            type: String,
            enum: ['ORAL', 'INTRAVENOUS', 'INTRAMUSCULAR', "OTIC"]
        },
        frequency: {
            frequencyType: {
                type: String,
                default: null,
                enum: [null, 'MOMENT', 'RECURRENCE', 'ALTERNATE_TAKING']
            },
            morning: {
                type: Number,
                default: 0
            },
            midday: {
                type: Number,
                default: 0
            },
            evening: {
                type: Number,
                default: 0
            },
            night: {
                type: Number,
                default: 0
            },
        },
        takeFor: {
            quantity: {
                type: Number,
                default: 0
            },
            type: {
                type: String,
                default: null,
                enum: [null, 'DAYS', 'WEEKS', 'MONTH']
            }
        },
        quantity: {
            type: Number,
            default: 0
        },
        medicineId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PortalUser',
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

export default mongoose.model("EprescriptionMedicineDosage", eprescriptionMedicineDosageSchema);
