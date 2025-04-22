import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
    {   
        appointmentId: {
            type: String,
            required: true
        },
        testId: {
            type: String,
            required: true
        },
        comment: {
            type: String,
        },
        resultStatus: {
            type: String,
            enum: ['normal', 'abnormal']
        },
        resultType: {
            type: String,
            enum: ['manual', 'upload']
        },
        tempSave: {
            type: Boolean,
            default: true
        },
        manualResultData: [
            {
                procedure: String,
                result: String,
                flag: String,
                status: String,
                referenceRange: String,
            }
        ],
        uploadResultData: [
            {
                type: String,
            }
        ],
        resultFor: {
            type: String,
            enum: ['lab', 'radiology']
        },
        resultDocument: {
            type: String,
        },
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        resultAddedBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },          
    },
    { timestamps: true }
);

export default mongoose.model("TestResult", resultSchema);
