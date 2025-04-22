import mongoose from "mongoose";

const profileInfoSchema = new mongoose.Schema(
    {
        full_name: {
            type: String,
        },
        first_name: {
            type: String,
        },
        middle_name: {
            type: String,
        },
        last_name: {
            type: String,
        },
        full_name_arabic: {
            type: String,
        },
        first_name_arabic: {
            type: String,
        },
        last_name_arabic: {
            type: String,
        },
        gender: {
            type: String,
        },
        dob: {
            type: String,
        },
        blood_group: {
            type: String,
        },
        marital_status: {
            type: String,
        },
        saudi_id: {
            type: String,
        },
        iqama_number: {
            type: String,
        },
        passport: {
            type: String,
        },
        mrn_number: {
            type: String,
        },
        currentAssignedDoctor: {
            type: String,
        },
        previousAssignedDoctor: [{
            assignedDate: {
                type: String
            },
            doctorId: {
                type: String
            },
            isCurrentAssignedDoctor: {
                type: Boolean,
            },
            leftDoctorDate: {
                type: String, // Store the date when doctor is unassigned
                default: null
            }
        }],
        preferredPharmacy: [{
            assignedDate: {
                type: String
            },
            pharmacyId: {
                type: String
            },
        }],
        profile_pic: {
            type: String,
        },
        profile_pic_signed_url: {
            type: String,
        },
        emergency_contact: {
            name: {
                type: String,
            },
            relationship: {
                type: String,
            },
            phone_number: {
                type: String,
            },
            country_code: {
                type: String,
            },
        },
        last_update: {
            type: Date,
            required: false,
            default: Date.now,
        },
        for_portal_user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "PortalUser",
            unique: true
        },
        in_location: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "LocationInfo",
        },
        location_details:{
            type:Object
        },
        in_vital: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "VitalInfo",
        },
        in_medicine: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MedicalInfo",
        },       
        in_history: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "HistoryInfo",
        },
        in_medical_document: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MedicalDocument",
        },
        in_family: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FamilyInfo",
        },
        in_pharmacy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PreferredPharmacy",
        },
        added_by_doctor: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },
        identityCard :{
            type: String,
            default:''
        },
        isFamilyMember: {
            type: Boolean,
            default: false,
        },
        nationality: {
            type: String,
        },
        familyMemberIds :[{
            type: String,
        }],
        medicalInformation: {
            medicalHistory: [
                {
                    allergen: {
                        type: String,
                    },
                    allergyType: {
                        type: String,
                    },
                    reaction: {
                        type: String,
                    },
                    status: {
                        type: String,
                    },
                    note: {
                        type: String,
                    },
                    createdAt: {
                        type: String,
                    },
                    isDeleted: {
                        type: Boolean,
                        default: false
                    }
                }
            ],
            socialHistory: [
                {
                    alcohol: {
                        type: Boolean,
                    },
                    tobacco: {
                        type: Boolean,
                    },
                    drugs: {
                        type: Boolean,
                    },
                    createdAt: {
                        type: String,
                    },
                    isDeleted: {
                        type: Boolean,
                        default: false
                    }
                }
            ]
        }
    },
    { timestamps: true }
);

export default mongoose.model("ProfileInfo", profileInfoSchema);
