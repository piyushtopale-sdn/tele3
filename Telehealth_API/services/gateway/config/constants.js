import "dotenv/config.js";

export const config = {
    DB: {
        HOST: process.env.MONGO_DB_HOST || "54.201.160.69",
        PORT: process.env.MONGO_DB_PORT || "58173",
        DATABASE: process.env.DOCTOR_MONGO_DATABASE || "",
        USERNAME: process.env.DOCTOR_MONGO_USER || "",
        PASSWORD: process.env.DOCTOR_MONGO_PASSWORD || "SDFTg345",
    },
    PORTS: {
        API_PORT: process.env.DOCTOR_SERVICE_PORT || 8004,
        EMAIL_PORT: 4200,
        APIHOST: "http://localhost",
    },
    API_PORT: process.env.DOCTOR_SERVICE_PORT || 8004,
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
