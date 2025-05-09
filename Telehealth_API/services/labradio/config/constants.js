import "dotenv/config";
import { randomInt } from 'crypto';

export const TimeZone = {
    hours: 0,
    minute: 0
}

export const config = {
    DB: {
        HOST: process.env.MONGO_DB_HOST || "54.201.160.69",
        PORT: process.env.MONGO_DB_PORT || "58173",
        DATABASE: process.env.LABRADIO_MONGO_DATABASE || "labimaging",
        USERNAME: process.env.LABRADIO_MONGO_USER || "labimaging",
        PASSWORD: process.env.LABRADIO_MONGO_PASSWORD || "RJMtygb22sdfd",
    },
    PORTS: {
        API_PORT: process.env.LABRADIO_SERVICE_PORT || 8008,
        EMAIL_PORT: 4200,
        APIHOST: "http://localhost",
    },
    API_PORT: process.env.LABRADIO_SERVICE_PORT || 8008,
    BaseUrl: {
        doctorServiceUrl: process.env.DOCTOR_SERVICE_URL,
        superadminServiceUrl: process.env.SUPERADMIN_SERVICE_URL,
        patientServiceUrl: process.env.PATIENT_SERVICE_URL,
        pharmacyServiceUrl: process.env.PHARMACY_SERVICE_URL,
        labradioServiceUrl: process.env.LABRADIO_SERVICE_URL,
        gatewayServiceUrl: process.env.GATEWAYSERVICEURL,

    },
    EMAIL: {
        host: "smtp.gmail.com",
        user: process.env.ADMIN_EMAIL || "youremail@gmail.com",
        password: process.env.ADMIN_PASSWORD || "password",
    },
    cryptoSecret: process.env.CRYPTOSECRET || "",
    CRYPTO_SECRET: process.env.CRYPTOSECRET || "",
    secret: {
        JWT: process.env.JWT_SECRET || "",
    },
    JWT_EXPIRATION_IN_MINUTES: process.env.JWT_EXPIRATION_IN_MINUTES || 1440,
    SMS_API_KEY: process.env.SMS_API_KEY,
    NODE_ENV: process.env.NODE_ENV || "local",
    test_p_Backend_url: process.env.test_p_Backend_url,
    TIMEZONE: process.env.TIMEZONE,
    OTP_EXPIRATION: process.env.OTP_EXPIRATION || 10,
    OTP_LIMIT_EXCEED_WITHIN: process.env.OTP_LIMIT_EXCEED_WITHIN || 5,
    OTP_TRY_AFTER: process.env.OTP_TRY_AFTER || 60,
    SEND_ATTEMPTS: process.env.SEND_ATTEMPTS || 5,
    BUCKET_NAME: process.env.BUCKET_NAME || "test_pdev",
    test_p_FRONTEND_URL: process.env.test_p_FRONTEND_URL,
    LOGIN_AFTER: process.env.LOGIN_AFTER || 60,
    PASSWORD_ATTEMPTS: process.env.PASSWORD_ATTEMPTS || 3,
    ALBORGE: {
        "username": process.env.ALBORGE_USERNAME || "test_pAPI",
        "password": process.env.ALBORGE_PASSWORD || "MBJYRC6Xgd8p",
        "clientCode": process.env.ALBORGE_CLIENTCODE || "test_pAPI",
        "branchCode": process.env.ALBORGE_BRANCH_CODE || "205",
        "payerCode": process.env.ALBORGE_PAYER_CODE || "5645",
        "contractCode": process.env.ALBORGE_CONTRACT_CODE || "5645",
        "generateToken_API": process.env.ALBORGE_TOKEN_API || "https://ldm.alborglaboratories.com/LDM/Api/Integration/NT/Authentication/V2/GenerateToken",
        "addRegistration_API": process.env.ALBORGE_REGISTRATION || "https://ldm.alborglaboratories.com/LDM/api/integration/AlBorg/GeneralAPIs/AddRegistration",
        "getResultLink_API": process.env.ALBORGE_GET_RESULT_LINK || `https://ldm.alborglaboratories.com/LDM/api/Integration/AlBorg/GeneralAPIs/GetAccessionResultLink?orderID=&accessionNumber={{accessionNumber}}&reviewDateFrom=&reviewDateTo=&`
    },
    SENDGRID_PASSWORD: process.env.SENDGRID_PASSWORD,
    SENDGRID_EMAIL: process.env.SENDGRID_EMAIL,
    MOYASAR_SECRET_KEY: process.env.MOYASAR_SECRET_KEY
};

export const messages = {
    createAccount: "Your account has been created successfully.",
    failedAccount: "Account creation failed.",
    userExist: "User already exists.",
    userNotFound: "Please check your credentials.",
    dataNotFound: "No data found.",
    incorrectPassword: "Incorrect password.",
    userPasswordError: "Password not created.",
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
    unableToBook: {
        en: "Unable to book appointment: The consultation is not available with your current subscription plan.",
        ar: "لايمكن حجز موعد نظراً لأنك استفذت جميع الاستشارات في باقتك الحاليه، بامكانك شراء استشارات اضافيه"
    },
    something_went_wrong: {
        en: "Something went wrong. Please try again later.",
        ar: "حدث خطأ ما. يرجى المحاولة مرة أخرى لاحقًا."
    },
    appointmentCancelled: {
        en: "Appointment cancelled successfully",
        ar: "تم إلغاء الموعد بنجاح"
    },
    appointmentApproved: {
        en: "Appointment approved successfully",
        ar: "تمت الموافقة على الموعد بنجاح"
    },
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

export const AppointmentReasonColumns = {
    col1: 'ReasonName',
}

export const LabSubTestColumns = {
    col1: 'testName',
    col2: 'unit',
    col3: 'testConfiguration',
    col4: 'serviceCode'
}

export const LabMainTestColumns = {
    col1: 'testName',
    col2: 'fees',
    col3: 'lonicCode',
}

export const RadioTestColumns = {
    col1: 'testName',
    col2: 'fees',
    col3: 'lonicCode',
    col4: 'studyType'
}

export const generate4DigitOTP = () => {
    return randomInt(1000, 10000);
};

export const emailText = {
    subjectEmail: "Email Verificaion",
    subjectEmailProfile: "Profile Setup"
}

export const responseCodes = {
    successStatus: "Success",
    failedStatus: "Failed",
};

export const smsTemplateOTP = (otp2fa) => {
    return `Your verification OTP is: ${otp2fa}. Please don't share with anyone else.
  Website link- `
}

export const generate6DigitOTP = () => {
    return randomInt(100000, 1000000);
}

export const forgetPasswordSub = {
    subjectEmail: "Forgot Your Password"
}