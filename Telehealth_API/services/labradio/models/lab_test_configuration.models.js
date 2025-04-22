import mongoose from "mongoose";

const rangeSchema = new mongoose.Schema(
    {
      gender: {
        type: String,
      },
      age: {
        type: String,
      },
      high: {
        type: Number,
      },
      low: {
        type: Number,
      },
      criticalHigh: {
        type: Number,
      },
      criticalLow: {
        type: Number,
      },
      unit: {
        type: String,
      },
    }
)

const testSchema = new mongoose.Schema(
    {
        labId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PortalUser",
        },
        testName: {
            type: String
        },
        testConfiguration: {
            type: String,
            enum: ["NUMERIC_RESULT", "ALPHA_RESULT"]
        },
        referenceRange: [rangeSchema],
        alphaResult: [
            {
                type: String,
            }
        ],
        notes: {
            type: String,
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        serviceCode :{
          type: String,
        }
    },
    { timestamps: true }
);

export default mongoose.model("LabTestConfiguration", testSchema);
