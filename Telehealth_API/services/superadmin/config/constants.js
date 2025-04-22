import "dotenv/config.js";

export const config = {
    DB: {
        HOST: process.env.MONGO_DB_HOST || "54.201.160.69",
        PORT: process.env.MONGO_DB_PORT || "58173",
        DATABASE: process.env.SUPERADMIN_MONGO_DATABASE || "",
        USERNAME: process.env.SUPERADMIN_MONGO_USER || "",
        PASSWORD: process.env.SUPERADMIN_MONGO_PASSWORD || "TYUHNg3456",
    },
    PORTS: {
        API_PORT: process.env.SUPERADMIN_SERVICE_PORT || 8006,
        EMAIL_PORT: 4200,
        APIHOST: "http://localhost",
    },
    BaseUrl: {
        labradioServiceUrl: process.env.LABRADIO_SERVICE_URL,
        superadminServiceUrl: process.env.SUPERADMIN_SERVICE_URL,
        patientServiceUrl: process.env.PATIENT_SERVICE_URL,
        pharmacyServiceUrl: process.env.PHARMACY_SERVICE_URL,
        doctorServiceUrl: process.env.DOCTOR_SERVICE_URL,
        gatewayServiceUrl: process.env.GATEWAYSERVICEURL,
    },
    API_PORT: process.env.SUPERADMIN_SERVICE_PORT || 8006,
    EMAIL: {
        HOST: "smtp.gmail.com",
        USER: "",
        PASSWORD: "",
    },
    CRYPTO_SECRET: process.env.CRYPTOSECRET || "",
    SECRET: {
        JWT: process.env.JWT_SECRET || "",
    },
    PAYMENT_CURRENCY: process.env.PAYMENT_CURRENCY || 'usd',
    NODE_ENV: process.env.NODE_ENV || "local",
    JWT_EXPIRATION_IN_MINUTES: process.env.JWT_EXPIRATION_IN_MINUTES || 1440,
    SMS_APP_SID: process.env.SMS_APP_SID,
    SENDER_ID: process.env.SENDER_ID,
    test_p_FRONTEND_URL: process.env.test_p_FRONTEND_URL,
    OTP_EXPIRATION: process.env.OTP_EXPIRATION || 10,
    OTP_LIMIT_EXCEED_WITHIN: process.env.OTP_LIMIT_EXCEED_WITHIN || 5,
    OTP_TRY_AFTER: process.env.OTP_TRY_AFTER || 60,
    SEND_ATTEMPTS: process.env.SEND_ATTEMPTS || 5,
    SENDGRID_PASSWORD: process.env.SENDGRID_PASSWORD,
    SENDGRID_EMAIL: process.env.SENDGRID_EMAIL
};

export const messages = {
    createAccount: "Your account has been created successfully.",
    failedAccount: "Account creation failed.",
    userExist: "User already exists.",
    userNotFound: "Please check your credentials.",
    dataNotFound: "No data found.",
    incorrectPassword: "Incorrect password.",
    passwordNotCreated: "Password not created.",
    loginSuccess: "Login successful.",
    listSuccess: "Data fetched successfully.",
    updateSuccess: "Data updated successfully.",
    statusUpdate: "Status updated successfully.",
    internalServerError: "Internal server error.",
    passwordChangeSuccess: "Password changed successfully.",
    profileUpdate: "Profile set up successfully.",
    authError: "Authentication error.",
    tokenExpire: "Token expired.",
    invalidToken: "Invalid token.",
    internalError: "Internal server error.",
    emailSend: "Email sent successfully.",
    add: "Data added successfully.",
    emailNotVerified: "Email not verified.",
    emailVerified: "Email verified.",
    emailAlreadyVerified: "Email already verified.",
    userAlreadyAdd: "User already added, wait for approval.",
    userAdd: "User added successfully, wait for approval.",
    notAuthorized: "Not authorized for this route.",
    contentDeleted: "content Deleted Successfully",
    contentNotFound: "content not found",
    contentDeletedFailed: "content failed to delete",
    slugExists: "Slug already exist",
    contentFetchedFailed: "Content fetch failed",
    contentupdatefailed: "content failed to update",
    contentUpdated: "Content updated successfully",
    contentFetched: "Content fetched successfully",
    contentcreated: "Content created successfully",
    contentFailed: "Content failed to create",
    successfullyCreated: {
        en: "Record has been created successfully",
        ar: ""
    },
    successfullyDeleted: {
        en: "Record has been deleted successfully",
        ar: ""
    },
    successfullyUpdated: {
        en: "Record has been updated successfully",
        ar: ""
    },
    successfullyFetched: {
        en: "Records has been fetched successfully",
        ar: ""
    },
    creationFailed: {
        en: "Failed to create the record",
        ar: ""
    },
    deletionFailed: {
        en: "Failed to delete the record",
        ar: ""
    },
    updateFailed: {
        en: "Failed to update the record",
        ar: ""
    },
    fetchFailed: {
        en: "Failed to fetch records",
        ar: ""
    },
    recordNotFound: {
        en: "Record not found",
        ar: ""
    },
    invalidRequest: {
        en: "Invalid request parameters",
        ar: ""
    },
    alreadyExists: {
        en: "Record already exists",
        ar: ""
    },
    couponAlreadyAvailable: {
        en: "This coupon is already available",
        ar: ""
    },
    percentageNotMoreThan: {
        en: "Percentage should not be more than 100% and less than 0%",
        ar: ""
    },
    durationMonth: {
        en: "Duration month should be less than 0",
        ar: ""
    },
    couponCodeGenerated: {
        en: "Coupon code generated successfully",
        ar: ""
    },
    discountCouponNotExist: {
        en: "Discount coupon not exist",
        ar: ""
    },
    dataExported: {
        en: "Data exported successfully",
        ar: ""
    },
    dataFailToExport: {
        en: "Failed to export data",
        ar: ""
    },
    otpVerificationPending: {
        en: "OTP verification pending 2fa",
        ar: ""
    },
    logoutSucceffully: {
        en: "User logged out successfully",
        ar: ""
    },
    otpSent: {
        en: "OTP has been sent successfully to your email",
        ar: ""
    },
    otpExpired: {
        en: "The OTP has expired",
        ar: ""
    },
    otpMatched: {
        en: "OTP matched successfully",
        ar: ""
    },
    otpNotMatched: {
        en: "OTP not matched",
        ar: ""
    },
    notificationListFetched: {
        en: "List fetched successfully",
        ar: ""
    },
    notificationFetchedSingle: {
        en: "Notification Fetch successfully",
        ar: ""
    },
    notificationFailedToFetch: {
        en: "Failed to fetch list",
        ar: ""
    },
    notificationDeleted: {
        en: "Notification Deleted successfully",
        ar: ""
    },
    notificationFailedToDelete: {
        en: "Notification Not Deleted",
        ar: ""
    },
    roleAdded: {
        en: "Successfully add Role",
        ar: ""
    },
    roleFailedToAdd: {
        en: "failed to add Role",
        ar: ""
    },
    roleFetchedAll: {
        en: "Successfully fetched all roles",
        ar: ""
    },
    roleFailedToFetch: {
        en: "Failed to fetch roles",
        ar: ""
    },
    roleUpdated: {
        en: "Successfully updated role",
        ar: ""
    },
    roleFailedToUpdate: {
        en: "failed to update role",
        ar: ""
    },
    discountCodeUnavailable: {
        en: "This discount code is not available",
        ar: "خطأ، كود الخصم غير متاح"
    },
    discountExpired: {
        en: "This discount code is expired",
        ar: "رمز الخصم هذا منتهي الصلاحية."
    },
    appliedCoupon: {
        en: "Coupon code is applied successfully",
        ar: "تم تطبيق رمز القسيمة بنجاح"
    },
    something_went_wrong: {
        en: "Something went wrong. Please try again later.",
        ar: "حدث خطأ ما. يرجى المحاولة مرة أخرى لاحقًا."
    },
    enquirySent: {
        en: "Thank you for reaching out to us. We have received your enquiry and will get back to you as soon as possible.",
        ar: "شكرًا لتواصلك معنا. لقد استلمنا استفسارك وسنقوم بالرد عليك في أقرب وقت ممكن."
    }
};

export const messageID = {
    //to be used when no new record is inserted but to display success message
    successCode: 200,
    //to be used when new record is inserted
    newResourceCreated: 201,
    //to be used if database query return empty record
    nocontent: 204,
    //to be used if the request is bad e.g. if we pass record id which does not exits
    badRequest: 400,
    //to be used when the user is not authorized to access the API e.g. invalid access token. "jwtTokenExpired": 401
    unAuthorizedUser: 401,
    //to be used when access token is not valid
    forbidden: 403,
    //to be used if something went wrong
    failureCode: 404,
    //to be used when error occured while accessing the API
    internalServerError: 500,
    //to be used if record already axists
    conflictCode: 409,

}

export const MedicineColumns = {
    col1: 'scientific_name',
    col2: 'commercial_name',
    col3: 'manufacturer',
    col4: 'pharmaceutical_formulation',
    col5: 'indication',
    col6: 'storage_information',
    col7: 'note'
}
export const CountryColumns = {
    col1: 'name',
    col2: 'country_code',
    col3: 'iso_code'
}

export const VillageColumns = {
    col1: 'country_name',
    col2: 'region_name',
    col3: 'province_name',
    col4: 'department_name',
    col5: 'name',

}
export const CityColumns = {
    col1: 'country_name',
    col2: 'region_name',
    col3: 'province_name',
    col4: 'department_name',
    col5: 'name',

}
export const DepartmentColumns = {
    col1: 'country_name',
    col2: 'region_name',
    col3: 'province_name',
    col4: 'name',

}
export const ProvinceColumns = {
    col1: 'country_name',
    col2: 'region_name',
    col3: 'province_name',


}
export const RegionColumns = {
    col1: 'country_name',
    col2: 'name',


}
export const TeamColumns = {
    col1: 'team',
}

export const DesignationColumns = {
    col1: 'designation',
}
export const TitleColumns = {
    col1: 'title',
}
export const ICDCodeColumns = {
    col1: 'code',
    col2: 'disease_title',
    col3: 'description'
}
export const LoincCodeColumns = {
    col1: 'loinccode',
    col2: 'description'
}
export const LanguageColumns = {
    col1: 'language',
}

export const emailText = {
    subjectEmail: "Email Verificaion",
    subjectEmailProfile: "Profile Setup"
}

export const responseCodes = {
    successStatus: "Success",
    failedStatus: "Failed",
};

export const generate4DigitOTP = () => {
    return Math.floor(1000 + Math.random() * 9000);
};

export const generate6DigitOTP = () => {
    return Math.floor(100000 + Math.random() * 900000);
}

export const smsTemplateOTP = (otp2fa) => {
    return `Your verification OTP is: ${otp2fa}. Please don't share with anyone else.
  Website link- `
}

export const forgetPasswordSub = {
    subjectEmail: "Forgot Your Password"
}