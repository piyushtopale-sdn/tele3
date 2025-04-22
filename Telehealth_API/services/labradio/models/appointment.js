import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
    {
        status: String,
        updatedAt: String,
        updatedById: String,
        role: String
    }
)

const appointmentSchema = new mongoose.Schema(
    {   
        appointment_id: {
            type: String,
            required: true
        },
        consultationDate: {
            type: String,
        },
        consultationTime: {
            type: String,
        },
        consultationFor: {
            type: String,
            enum: ['self', 'family-member'],
        },
        parent_patient_id :{
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
        parentAppointmentId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        labRadiologyId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "PortalUser",
        }, 
        labTestIds: [
            {
                testId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "LabTest",
                },
                testResultId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "TestResult",
                },
                resultType: {
                    type: String,
                },
                status: {
                    type: String,
                    default: 'PENDING',
                    enum: ['PENDING', 'INPROGRESS', 'CANCELLED', 'COMPLETED']
                },
                testHistory: [historySchema], 
                extrenalResults: {
                    type: Object
                },
            }
        ],        
        radiologyTestIds: [
            {
                testId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "RadiologyTest",
                },
                testResultId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "TestResult",
                },
                resultType: {
                    type: String,
                },
                status: {
                    type: String,
                    default: 'PENDING',
                    enum: ['PENDING', 'INPROGRESS', 'CANCELLED', 'COMPLETED']
                },
                testHistory: [historySchema],
            }
        ],        
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },          
        patient_document_details: [
            {
                doc_id: {
                    type: mongoose.Schema.Types.ObjectId,
                },
                date: {
                    type: String,
                },
            }
        ],      
        cancelReason: {
            type: String,
            default: null
        },
        cancelledOrAcceptedBy: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },
        prescribedLabRadiologyTestId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        serviceType: {
            type: String,
            enum: ['lab', 'radiology'],
        },
        cancel_by: {
            type: String,
            enum: ['patient', 'lab', 'radiology'],
        },
        is_rescheduled: {
            type: Boolean,
            default: false,
        },
        is_delay: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            default: "PENDING",
            enum: [                
                "PENDING",
                "CANCELLED",
                "UNDER_PROCESSED",
                "APPROVED",
                "COMPLETED",
            ],
        },
        supervisorApproval: {
            type: String,
            default: "PENDING",
            enum: [                
                "PENDING",
                "CANCELLED",
                "APPROVED",
            ],
        },
        registrationData:{
            type:Array
        },
        isAlborgeResultReceived: {
            type:Boolean,
            default: false
        },
        alborgeResponse: {
            type:Object
        },
        cancelType:{
            type: String,          
            enum: ["auto","manual"],
        },
        orderHistory: [historySchema]
    },
    { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);
