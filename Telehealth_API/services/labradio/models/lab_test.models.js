import mongoose from "mongoose";

const testSchema = new mongoose.Schema(
    {
        labId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PortalUser",
        },
        testName: {
            type: String
        },
        loinc: 
          {
            loincId: {
              type: mongoose.Schema.Types.ObjectId
            },
            loincCode: {
              type: String
            }
          },
        tests: [
          {
            testId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "LabTestConfiguration"
            },
            testName: {
              type: String
            }
          }
        ], 
        testFees:{
          type: String
        },
        couponCode:[],
        notes: {
            type: String,
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
    },
    { timestamps: true }
);

export default mongoose.model("LabTest", testSchema);
