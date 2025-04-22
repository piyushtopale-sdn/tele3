import mongoose from "mongoose";

const medicineDetailSchema = new mongoose.Schema(
    {
        medicineName: {
            type: String,
        },
        medicineId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        medicineDosageId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        quantityData: {
            prescribed: {
                type: Number,
            },
            delivered: {
                type: Number,
            },
        },
    },
    { timestamps: true }
);

export default mongoose.model("MedicineDetail", medicineDetailSchema);
