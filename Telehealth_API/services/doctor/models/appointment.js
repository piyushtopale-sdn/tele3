import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
    {   
        appointment_id: {
            type: String,
            required: true
        },
        reasonForAppointment: {
            type: String,
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
            default: ""
        },
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PortalUser',
            required: true
        },
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "PortalUser",
        },        
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
        declinedReason: {
            type: String,
            default: null
        },
        cancelledOrAcceptedBy: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },
        cancel_by: {
            type: String,
            enum: ['patient', 'doctor'],
        },
        is_rescheduled: {
            type: Boolean,
            default: false,
        },
        patientConfirmation: {
            type: String,
            default: 'NA',
            enum: ['NA', 'confirmed', 'declined'],
        },
        status: {
            type: String,
            default: "APPROVED",
            enum: [                
                "PENDING",
                "CANCELLED",
                "APPROVED",
                "COMPLETED",
                "MISSED",
            ],
        },
        users: [
            {
                user_id: {
                    type: mongoose.Schema.Types.ObjectId,
                },
                name: {
                    type: String,
                },
                image: {
                    type: String,
                },
            }
        ],
        participants: [{
            userId: { type: mongoose.Schema.Types.ObjectId },
            userName: { type: String },
            userImage: { type: String },
            userIdentity: { type: String },
            isAudioMuted: { type: Boolean, default: false },
            isVideoMuted: { type: Boolean, default: false }
        }],
        chatmessage: [{
            senderId: { type: mongoose.Schema.Types.ObjectId },
            message: { type: String },
            receiver: [{
                id: { type: mongoose.Schema.Types.ObjectId },
                read: { type: Boolean, default: true }
            }],
            createdAt: {type: Date}
        }],
        callstatus: {
            type: String,
        },
        roomName: { type: String },
        uid: { type: String },
        sid: { type: String },
        resourceId: { type: String },
        recordingUrls: [{ type: String }],
        callerId: { type: mongoose.Schema.Types.ObjectId },
        roomDate: {
            type: Date
        },
        isPrescriptionValidate: {
            type: Boolean,
            default: false
        },
        appointment_complete: {
            type: String,
            default: false
        },
        medicinePrescription: {
           type: String,
            // type: mongoose.Schema.Types.ObjectId,
            default: false
        },
        laboratoryTest: {
           type: String,
            // type: mongoose.Schema.Types.ObjectId,
            default: false
        },
        radiologyTest: {
           type: String,
            // type: mongoose.Schema.Types.ObjectId,
            default: false
        },
        consultationNotes: {
           type: String,
            // type: mongoose.Schema.Types.ObjectId,
            default: false 
        }
        
    },
    { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);
