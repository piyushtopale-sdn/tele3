import mongoose from "mongoose";

const basicInfoSchema = new mongoose.Schema(
    {
        first_name: {
            type: String,
        },
        first_name_arabic: {
            type: String,
        },
        middle_name: {
            type: String,
        },
        middle_name_arabic: {
            type: String,
        },
        last_name: {
            type: String,
        },
        last_name_arabic: {
            type: String,
        },
        full_name: {
            type: String,
        },
        full_name_arabic: {
            type: String,
        },
        dob: {
            type: String,
        },
        designation: {
            type: String,
        },
        title: {
            type: String,
        },
        years_of_experience: {
            type: String,
        },       
        gender: {
            type: String,
        },
        gender_arabic: {
            type: String,
        },
        spoken_language: {
            type: Array,
        },
        profile_picture: {
            type: String,
            default: ""
        },        
        about: {
            type: String,
        },
        about_arabic: {
            type: String,
        },
        license_details: {
            license_number: {
                type: String,
            },
            license_expiry_date: {
                type: Date,
            },
            license_image: {
                type: String,
                default: ""
            },
        },
        speciality: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Specialty',
                default: null
            }
        ],       
        categoryIds: [
            {
                type: String,
            }
        ],       
        main_phone_number: {
            type: String,
        },        
        verify_status: {
            type: String,
            default: "APPROVED",           
        },
        approved_at: {
            type: String,
            default: null
        },
        approved_or_rejected_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PortalUser",
            default: null
        },
        in_location: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "LocationInfo",
        },       
        in_education: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "EducationalDetail",
            default: null
        },        
        in_availability: {
            type: Array,
            default: []
        },       
        in_document_management: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DocumentManagement",
            default: null
        },
        for_portal_user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "PortalUser",

        },
        isInfoCompleted: {
            type: Boolean,
            default: true
        },       
        doctorfees:{
            type: String,
        } 
    },
    { timestamps: true }
);

export default mongoose.model("BasicInfo", basicInfoSchema);
