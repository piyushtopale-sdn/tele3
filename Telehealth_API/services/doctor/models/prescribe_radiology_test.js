import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
    {
        status: String,
        updatedAt: String,
        updatedById: String,
        role: String
    }
)

const paymentInfoSchema = new mongoose.Schema(
    {
        paymentStatus: Boolean,
        discount: String,
        testPrice: String,
        paymentId: String,
        labRadioId:String,
        couponCode: String,
        couponCodeId: String,
        centerData:Object,
        isBooked:{ type: Boolean, default: false }

    }
)


const prescribeSchema = new mongoose.Schema(
    {
        radiologyTest: [
            {
                radiologyTestName: String,
                radiologyTestId: String,
                radiologyCenterName: String,
                radiologyCenterId: String,
                resultType: String,
                testResultId: String,
                couponCode: Array,
                testFees: String,
                loinc: Object,
                testHistory: [historySchema],
                paymentInfo:paymentInfoSchema,
                status: {
                    type: String,
                    enum: ['PENDING', 'INPROGRESS', 'CANCELLED', 'COMPLETED', 'BOOKED']
                }   
            }
        ],
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
        },
        radiologyTestAppointmentId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        eSignature: {
            type: String,
            default:null
        },
        status: {
            type: String,
            default: 'PENDING',
            enum: ['PENDING', 'BOOKED', 'CANCELLED', 'INPROGRESS', 'COMPLETED']
        },
        orderHistory: [historySchema]
    },
    { timestamps: true }
);

export default mongoose.model("PrescribeRadiologyTest", prescribeSchema);
