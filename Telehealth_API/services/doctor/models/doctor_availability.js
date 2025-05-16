import mongoose from "mongoose";

const doctorAvailabilitySchema = new mongoose.Schema(
  {
    week_days: [
      {
        sun_start_time: {
          type: String,
        },
        sun_end_time: {
          type: String,
        },
        mon_start_time: {
          type: String,
        },
        mon_end_time: {
          type: String,
        },
        tue_start_time: {
          type: String,
        },
        tue_end_time: {
          type: String,
        },
        wed_start_time: {
          type: String,
        },
        wed_end_time: {
          type: String,
        },
        thu_start_time: {
          type: String,
        },
        thu_end_time: {
          type: String,
        },
        fri_start_time: {
          type: String,
        },
        fri_end_time: {
          type: String,
        },
        sat_start_time: {
          type: String,
        },
        sat_end_time: {
          type: String,
        },
      },
    ],
    slot_interval: {
      type: String,
    },   
    // unavailability_slot: [
    //   {
    //     date: {
    //       type: String,
    //     },
    //     start_time: {
    //       type: String,
    //     },
    //     end_time: {
    //       type: String,
    //     },
    //   },
    // ],
    unavailability_slot: [
      {
        start_date: {
          type: String,
        },
        end_date: {
          type: String,
        },
        start_time: {
          type: String,
        },
        end_time: {
          type: String,
        },
      },
    ],
    available_slots:
      {
        start_date: { type: String },  
        end_date: { type: String },   
      },   
    for_portal_user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "PortalUser",
    },
  },
  { timestamps: true }
);

export default mongoose.model("DoctorAvailability", doctorAvailabilitySchema);
