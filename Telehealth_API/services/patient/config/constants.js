import "dotenv/config.js";
import { randomInt } from 'crypto';
export const config = {
    DB: {
        HOST: process.env.MONGO_DB_HOST || "54.201.160.69",
        PORT: process.env.MONGO_DB_PORT || "58173",
        DATABASE: process.env.PATIENT_MONGO_DATABASE || "patient",
        USERNAME: process.env.PATIENT_MONGO_USER || "patient",
        PASSWORD: process.env.PATIENT_MONGO_PASSWORD || "RJMtygb22sod",
    },
    PORTS: {
        API_PORT: process.env.PATIENT_SERVICE_PORT || 8007,
        EMAIL_PORT: 4200,
        APIHOST: "http://localhost",
    },
    BaseUrl: {
        doctorServiceUrl: process.env.DOCTOR_SERVICE_URL,
        superadminServiceUrl: process.env.SUPERADMIN_SERVICE_URL,
        patientServiceUrl: process.env.PATIENT_SERVICE_URL,
        pharmacyServiceUrl: process.env.PHARMACY_SERVICE_URL,
        labradioServiceUrl: process.env.LABRADIO_SERVICE_URL,
        gatewayServiceUrl: process.env.GATEWAYSERVICEURL,

    },
    API_PORT: process.env.PATIENT_SERVICE_PORT || 8007,
    EMAIL: {
        HOST: "smtp.gmail.com",
        USER: "",
        PASSWORD: "",
    },
    CRYPTO_SECRET: process.env.CRYPTOSECRET || "",
    secret: {
        JWT: process.env.JWT_SECRET || "",
    },
    MOYASAR_SECRET_KEY: process.env.MOYASAR_SECRET_KEY,
    PAYMENT_CURRENCY: process.env.PAYMENT_CURRENCY || 'usd',
    JWT_EXPIRATION_IN_MINUTES: process.env.JWT_EXPIRATION_IN_MINUTES || 1440,
    NODE_ENV: process.env.NODE_ENV || "local",
    SMS_APP_SID: process.env.SMS_APP_SID,
    SENDER_ID: process.env.SENDER_ID,
    BUCKET_NAME: process.env.BUCKET_NAME || "test_pdev",
    TIMEZONE: process.env.TIMEZONE,
    test_p_FRONTEND_URL: process.env.test_p_FRONTEND_URL,
    AMAZONPAY: {
        "merchant_identifier": process.env.AMAZON_MERCHANT_IDENTIFIER || "OguwiAEM",
        "access_code": process.env.AMAZON_ACCESS_CODE || "mLIoC7o8DticuCwZD8AG",
        "sha_request_phrase": process.env.AMAZON_REQUEST_PHRASE || "98PehSma/uTDkLNulKeA85#[",
        "sha_response_phrase": process.env.AMAZON_RESPONSE_PHRASE || "48gkXLAaAsk4YD5qDJolFa[)",
        "test_payment_page_url": process.env.AMAZON_PAYMENT_PAGE_URL || "https://sbcheckout.payfort.com/FortAPI/paymentPage",
        "live_payment_page_url": process.env.AMAZON_PAYMENT_PAGE_URL || "https://checkout.payfort.com/FortAPI/paymentPage",
        "test_payment_process_api": process.env.AMAZON_PAYMENT_CHARGE_API || "https://sbpaymentservices.payfort.com/FortAPI/paymentApi",
        "live_payment_process_api": process.env.AMAZON_PAYMENT_CHARGE_API || "https://paymentservices.payfort.com/FortAPI/paymentApi",
        "paymentSession": process.env.AMAZON_PAYMENT_SESSION || "https://apple-pay-gateway.apple.com/paymentservices/startSession",
        "domain": process.env.test_p_DOMAIN || 'dev.test_papp.com'
    },
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
    profileUpdated: {
        en: "The profile has been updated successfully.",
        ar: "تم تحديث الملف الشخصي بنجاح"
    },
    mobileExist: {
        en: "This mobile number is already registered. Please use a different mobile number",
        ar: ""
    },
    invalid_disposable_email: {
        en: "Please use a valid email address! Disposable email not allowed.",
        ar: "يرجى استخدام عنوان بريد إلكتروني صالح! لا يُسمح بالبريد الإلكتروني المؤقت."
    },
    something_went_wrong: {
        en: "Something went wrong. Please try again later.",
        ar: "حدث خطأ ما. يرجى المحاولة مرة أخرى لاحقًا."
    },
    signup_success: {
        en: "Successfully signed up",
        ar: "تم التسجيل بنجاح"
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

export const ImmunizationColumns = {
    col1: 'name',
}

export const testEmailDomains = [
    "10minutemail.com",
    "10minutemail.co.uk",
    "10minutemail.net",
    "20minutemail.com",
    "dispostable.com",
    "fakeinbox.com",
    "guerrillamail.com",
    "guerrillamailblock.com",
    "maildrop.cc",
    "mailinator.com",
    "mohmal.com",
    "my10minutemail.com",
    "nada.email",
    "nowmymail.com",
    "spambog.com",
    "spambog.de",
    "spamgourmet.com",
    "temp-mail.org",
    "temp-mail.io",
    "tempmail.us",
    "tempr.email",
    "throwawaymail.com",
    "trashmail.com",
    "trashmail.net",
    "yopmail.com",
    "yopmail.fr",
    "yopmail.net",
    "example.com",
    "example.org",
    "example.net",
    "test.com",
    "test.org",
    "test.net",
    "fakeemail.com",
    "noemail.com",
    "mailinator.org",
    "mailinator.net",
    "fakemail.net",
    "getnada.com",
    "emailondeck.com",
    "instantemailaddress.com",
    "easytrashmail.com",
    "anonymmail.de",
    "mailnesia.com",
    "sharklasers.com",
    "trashmail.ws",
    "discard.email",
    "burnermail.io",
    "mail1a.de",
    "mail7.io",
    "moakt.com",
    "openmailbox.org",
    "owlymail.com",
    "spamfree24.org",
    "spamfree24.com",
    "spamfree24.de"
];

export const emailText = {
    subjectEmail: "Email Verificaion",
    subjectEmailProfile: "Profile Setup"
}

export const responseCodes = {
    successStatus: "Success",
    failedStatus: "Failed",
};

export const generate4DigitOTP = () => {
    return randomInt(1000, 10000);
};

export const generate6DigitOTP = () => {
    return randomInt(100000, 1000000);
}

export const forgetPasswordSub = {
    subjectEmail: "Forgot Your Password"
}

export const htmlForgetPassword = (token, user_id) => {

    return `<!DOCTYPE html>
  <html lang="en">
  <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dock Nock Email Template</title>
        <style>
            @media (max-width: 576px){
                section{
                    width: auto !important;
                }
                .box{
                    max-width: none !important;
                    width: 100% !important;
                }
                .innerBox{
                    max-width: 255px !important;
                }
            }
        </style>
    </head>
  <body style="background-color: #F9F9F9; width: 100% !important; margin: 0; padding: 0;">
  <div class="box" style="max-width: 500px; margin: 0 auto; background-color: #F9F9F9;">
   <div class="innerBox" style="max-width: 300px; width: 100%; margin: auto; background-color: #fff; border-radius: 10px; padding: 20px; position: absolute; left: 50%; transform: translateX(-50%);">
       <h1 style="font-size: 32px; color: #272727; font-weight: 600; margin-top: 0; margin-bottom: 0;">Hello</h1>
      <p style="font-size: 15px; font-weight: 300; color: #656565; margin-top: 25px;">To reset your password, click on the below link:</p>
      <a href= patient/setnewpass?token=${token}&user_id=${user_id} style="background-color: #64BD05; text-align: center; display: inline-block; padding: 8px 0px; max-width: 150px; width: 100%; font-size: 14px; font-weight: 300; margin: 15px  auto 0; color: #fff; border-radius: 35px; text-decoration: none;">Click To change Password</a>
      <p style="font-size: 15px; font-weight: 300; color: #656565; text-align: left;margin-top: 25px;">Thanks, test_p.</p>
   </div>
  </div>
  </body>
</html > `

}


export const htmlEmailVerify = (token, name, role) => {

    return `<!DOCTYPE html>
                  <html lang="en">
                  <head>
                      <meta charset="UTF-8">
                      <meta http-equiv="X-UA-Compatible" content="IE=edge">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <title>Dock Nock Email Template</title>
                      <style>
                          @media (max-width: 576px){
                              section{
                                  width: auto !important;
                              }
                              .box{
                                  max-width: none !important;
                                  width: 100% !important;
                              }
                              .innerBox{
                                  max-width: 255px !important;
                              }
                          }
                      </style>
                  </head>
                  <body style="background-color: #F9F9F9; width: 100% !important; margin: 0; padding: 0;">
                  <div class="box" style="max-width: 500px; margin: 0 auto; background-color: #F9F9F9;">
                  <div class="innerBox" style="max-width: 300px; width: 100%; margin: auto; background-color: #fff; border-radius: 10px; padding: 20px; position: absolute; left: 50%; transform: translateX(-50%);">
                      <h1 style="font-size: 32px; color: #272727; font-weight: 600; margin-top: 0; margin-bottom: 0;">Welcome ${name}</h1>
                      <p style="font-size: 15px; font-weight: 300; color: #656565; margin-top: 25px;">Your account is created please verify your Email using click below.</p>
                      <a href=http://localhost:4200/email-verify/${token}?data=${role} style="background-color: #64BD05; text-align: center; display: inline-block; padding: 8px 0px; max-width: 150px; width: 100%; font-size: 14px; font-weight: 300; margin: 15px  auto 0; color: #fff; border-radius: 35px; text-decoration: none;">Verify Email</a>
                      <p style="font-size: 15px; font-weight: 300; color: #656565; text-align: left;margin-top: 25px;">Thanks, test_p.</p>
                  </div>
          </div>
                  </body>
                  </html>
  `
}
