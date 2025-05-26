import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema(
    {
        doctorId: {
            type: String,
            
        },
        appointment_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Appointment",
        },
        minutes: {
            type: Number,
            
        },
        hours: {
            type: Number,
            
        },
        datetime: {
            type: String,
            
        },
        patientId: {
            type: String,
            
        },
        status: {
            type: Number,
            default: 0
        }

  },
  { timestamps: true }
);

export default mongoose.model("Reminder", reminderSchema);
