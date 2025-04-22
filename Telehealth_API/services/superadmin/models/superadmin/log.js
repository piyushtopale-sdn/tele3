import mongoose from "mongoose";
const logSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true 
    },  // ID of the user performing the action
    userName: { 
        type: String, 
        required: true 
    },  // Name of the user performing the action (e.g. patient or doctor)
    role: { 
        type: String, 
        enum: ['patient', 'doctor', 'superadmin', 'pharmacy', 'labradio'], 
        required: true 
    },  // Role of the user
    action: { 
        type: String, 
        required: true 
    },  // login, logout, create, update, delete, access
    actionDescription: { 
        type: String, 
        required: true 
    },  // Description of the action performed
    targetUserId: { 
        type: mongoose.Schema.Types.ObjectId 
    },  // ID of the target (e.g. doctor for an appointment)
    targetUserName: { 
        type: String 
    },  // Name of the target (e.g. doctor or patient)
    timestamp: { 
        type: Date, 
        default: Date.now 
    },  // When the action occurred
    metadata: { 
        type: Object 
    },  // Any additional data (appointment ID, patient data, etc.)
    ipAddress: { 
        type: String 
    },  // IP address from which the action was taken
    status: { 
        type: String, 
        enum: ['success', 'failure'], 
        default: 'success' 
    }  // Status of the action
});

export default mongoose.model("Log", logSchema);