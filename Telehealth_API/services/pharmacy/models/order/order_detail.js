import mongoose from "mongoose";

const orderDetailSchema = new mongoose.Schema(
    {
        orderId: {
            type: String,
        },
        medicineDetailIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "MedicineDetail",
        }],
        status: {
            type: String,
            enum: [
                "new",
                "accepted",
                "scheduled",
                "completed",
                "cancelled",
            ],
            default: "new",
        },
        cancelledBy: {
            type: String,
            enum: ["patient", "pharmacy", "NA"],
            default: "NA",
        },
        cancelReason: {
            type: String,
        },
        cancelledOrAcceptedBy: {
            type: String,
        },
        orderFor: {
            type: String,
            enum: ["self", "family-member"]
        },
        deliveryType: {
            type: String,
            enum: ["delivery", "pickup"]
        },
        deliveryStatus: {
            type: String,
            enum: ["pending", "under-process", "completed"],
            default: "pending",
        },
        parentPatientId: {
            type: String,
            default: ""
        },
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        forPortalUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PortalUser'
        },
    },
    { timestamps: true }
);

export default mongoose.model("OrderDetail", orderDetailSchema);
