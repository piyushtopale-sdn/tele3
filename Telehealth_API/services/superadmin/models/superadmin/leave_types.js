import mongoose from "mongoose";
const leaveTypeSchema = new mongoose.Schema(
    {
        leave_type: {
            type: String,
            required: true,
        },
        leave_type_arabic: {
          type: String,
          required: true,
      },
        added_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Superadmin"
        },
        active_status: {
          type: Boolean,
          required: true,
          default:true
        },
        delete_status: {
          type: Boolean,
          required: true,
          default: false
        },
      },
      { timestamps: true }
);
export default mongoose.model("LeaveTypes", leaveTypeSchema);
