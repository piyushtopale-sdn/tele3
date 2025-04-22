import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
    {
        registerNumber: {
            type: String,
        },
        registerYear: {
            type: String,
        },
        productType: {
            type: String,
        },
        drugType: {
            type: String,
        },
        subType: {
            type: String,
        },
        scientificName: {
            type: String,
        },
        scientificNameArabic: {
            type: String,
        },
        tradeName: {
            type: String,
        },
        tradeNameArabic: {
            type: String,
        },
        strength: {
            type: String,
        },
        strengthUnit: {
            type: String,
        },
        pharmaceuticalForm: {
            type: String,
        },
        administrationRoute: {
            type: String,
        },
        ATCCode1: {
            type: String,
        },
        ATCCode2: {
            type: String,
        },
        size: {
            type: String,
        },
        sizeUnit: {
            type: String,
        },
        packageType: {
            type: String,
        },
        packageSize: {
            type: String,
        },
        legalStatus: {
            type: String,
        },
        productControlDistributeArea: {
            type: String,
        },
        publicPrice: {
            type: String,
        },
        pricingDate: {
            type: String,
        },
        shelfLife: {
            type: String,
        },
        storageConditions: {
            type: String,
        },
        marketingCompany: {
            type: String,
        },
        marketingCountry: {
            type: String,
        },
        manufactureName: {
            type: String,
        },
        manufactureCountry: {
            type: String,
        },
        manufactureName2: {
            type: String,
        },
        manufactureCountry2: {
            type: String,
        },
        secondaryPackageManufacture: {
            type: String,
        },
        mainAgent: {
            type: String,
        },
        secondAgent: {
            type: String,
        },
        thirdAgent: {
            type: String,
        },
        marketingStatus: {
            type: String,
        },
        authorizationStatus: {
            type: String,
        },
        isActive: {
            type: Boolean,
            default: true
        },    
        isDeleted: {
            type: Boolean,
            default: false
        },    
        addedBy:{
            type: mongoose.Schema.Types.ObjectId,
        }
    },
    { timestamps: true }
);
export default mongoose.model("Medicine", medicineSchema);
