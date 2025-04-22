import mongoose from "mongoose";

const radiologyTestSchema = new mongoose.Schema(
    {
        radiologyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PortalUser'
        },
        studyTypeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StudyType'
        },
        testName: {
            type: String
        },
        loinc: {
          loincId: {
            type: mongoose.Schema.Types.ObjectId
          },
          loincCode: {
            type: String
          }
        },
        couponCode: [],
        notes: {
            type: String
        },
        testFees:{
            type: String
        },
        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
)

export default mongoose.model('RadiologyTest', radiologyTestSchema)