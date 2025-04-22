import mongoose from "mongoose";
const settingSchema = new mongoose.Schema({
    settingName: { 
        type: String, 
    },
    settingValue: { 
        type: String, 
    },
    role: { 
        type: String, 
        enum: ['patient', 'doctor', 'superadmin', 'pharmacy', 'labradio'], 
    },
    enableCallButton:{
        type:Boolean
    }
});

export default mongoose.model("GeneralSettings", settingSchema);