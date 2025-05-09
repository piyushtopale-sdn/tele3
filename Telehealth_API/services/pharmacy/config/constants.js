import "dotenv/config.js";
import { randomInt } from 'crypto';

export const config = {
    DB: {
        HOST: process.env.MONGO_DB_HOST || "54.201.160.69",
        PORT: process.env.MONGO_DB_PORT || "58173",
        DATABASE: process.env.PHARMACY_MONGO_DATABASE || "",
        USERNAME: process.env.PHARMACY_MONGO_USER || "",
        PASSWORD: process.env.PHARMACY_MONGO_PASSWORD || "dTYub456tD",
    },
    PORTS: {
        API_PORT: process.env.PHARMACY_SERVICE_PORT || 8001,
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
    EMAIL: {
        HOST: "smtp.gmail.com",
        USER: process.env.ADMIN_EMAIL,
        PASSWORD: process.env.ADMIN_EMAIL_PASSWORD,
    },
    CRYPTO_SECRET: process.env.CRYPTOSECRET || "",
    SECRET: {
        JWT: process.env.JWT_SECRET || "",
    },
    API_PORT: process.env.PHARMACY_SERVICE_PORT || 8001,
    NODE_ENV: process.env.NODE_ENV || "local",
    JWT_EXPIRATION_IN_MINUTES: process.env.JWT_EXPIRATION_IN_MINUTES || 1440,
    SMS_APP_SID: process.env.SMS_APP_SID,
    SENDER_ID: process.env.SENDER_ID,
    BACKEND_SERVER_URL: "http://44.211.113.36:9249",
    TIMEZONE: process.env.TIMEZONE,
    OTP_EXPIRATION: process.env.OTP_EXPIRATION || 10,
    OTP_LIMIT_EXCEED_WITHIN: process.env.OTP_LIMIT_EXCEED_WITHIN || 5,
    OTP_TRY_AFTER: process.env.OTP_TRY_AFTER || 60,
    SEND_ATTEMPTS: process.env.SEND_ATTEMPTS || 5,
    BUCKET_NAME: process.env.BUCKET_NAME || "test_pdev",
    test_p_FRONTEND_URL: process.env.test_p_FRONTEND_URL,
    LOGIN_AFTER: process.env.LOGIN_AFTER || 60,
    PASSWORD_ATTEMPTS: process.env.PASSWORD_ATTEMPTS || 3,
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
    something_went_wrong: {
        en: "Something went wrong. Please try again later.",
        ar: "حدث خطأ ما. يرجى المحاولة مرة أخرى لاحقًا."
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

export const OnDutyGroupColumns = {
    col1: 'onDutyGroupNumber',
    col2: 'city',
    col3: 'startDate',
    col4: 'startTime',
    col5: 'endDate',
    col6: 'endTime',
    col7: 'date_of_creation'

}

export const OnDutyPharmacyGroupColumns = {
    col1: 'groupNumber',
    col2: 'groupCity',
    col3: 'address',
    col4: 'lat',
    col5: 'long',
    col6: 'neighborhood',
    col7: 'country',
    col8: 'region',
    col9: 'province',
    col10: 'department',
    col11: 'city',
    col12: 'village',
    col13: 'pincode',


    col14: 'pharmacyName',
    col15: 'countryCode',
    col16: 'phoneNumber',
    col17: 'email',

    col18: 'sun_start_time',
    col19: 'sun_end_time',
    col20: 'mon_start_time',
    col21: 'mon_end_time',
    col22: 'tue_start_time',
    col23: 'tue_end_time',
    col24: 'wed_start_time',
    col25: 'wed_end_time',
    col26: 'thus_start_time',
    col27: 'thus_end_time',
    col28: 'fri_start_time',
    col29: 'fri_end_time',
    col30: 'sat_start_time',
    col31: 'sat_end_time',

    col32: 'non_opening_date',
    col33: 'non_opening_start_time',
    col34: 'non_opening_end_time',
    col35: 'date_of_creation'

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
    return randomInt(1000, 10000);
};

export const generate6DigitOTP = () => {
    return randomInt(100000, 1000000);
}

export const smsTemplateOTP = (otp2fa) => {
    return `Your verification OTP is: ${otp2fa}. Please don't share with anyone else.
  Website link- `
}

export const forgetPasswordSub = {
    subjectEmail: "Forgot Your Password"
}


export const htmlForgetPassword = (token, role) => {

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
        <a href=http://localhost:4200/create-password/${token} style="background-color: #64BD05; text-align: center; display: inline-block; padding: 8px 0px; max-width: 150px; width: 100%; font-size: 14px; font-weight: 300; margin: 15px  auto 0; color: #fff; border-radius: 35px; text-decoration: none;">Click To change Password</a>
        <p style="font-size: 15px; font-weight: 300; color: #656565; text-align: left;margin-top: 25px;">Thanks, test_p.</p>
     </div>
   </div>
   <script>
          function data(){
          window.open('http://localhost:4200/create-password/${token}?data=${role}')
          }
          </script>  
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


