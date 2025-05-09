import "dotenv/config.js";
import { randomInt } from 'crypto';
export const config = {
    DB: {
        HOST: process.env.MONGO_DB_HOST || "54.201.160.69",
        PORT: process.env.MONGO_DB_PORT || "58173",
        DATABASE: process.env.DOCTOR_MONGO_DATABASE || "doctor",
        USERNAME: process.env.DOCTOR_MONGO_USER || "doctor",
        PASSWORD: process.env.DOCTOR_MONGO_PASSWORD || "RJMtygb22sdfd",
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
    MOYASAR_SECRET_KEY: process.env.MOYASAR_SECRET_KEY,
    test_p_FRONTEND_URL: process.env.test_p_FRONTEND_URL,
    JWT_EXPIRATION_IN_MINUTES: process.env.JWT_EXPIRATION_IN_MINUTES || 1440,
    SMS_APP_SID: process.env.SMS_APP_SID,
    SENDER_ID: process.env.SENDER_ID,
    NODE_ENV: process.env.NODE_ENV || "local",
    test_p_Backend_url: process.env.test_p_Backend_url,
    TIMEZONE: process.env.TIMEZONE,
    OTP_EXPIRATION: process.env.OTP_EXPIRATION || 10,
    OTP_LIMIT_EXCEED_WITHIN: process.env.OTP_LIMIT_EXCEED_WITHIN || 5,
    OTP_TRY_AFTER: process.env.OTP_TRY_AFTER || 60,
    LOGIN_AFTER: process.env.LOGIN_AFTER || 60,
    PASSWORD_ATTEMPTS: process.env.PASSWORD_ATTEMPTS || 3,
    SEND_ATTEMPTS: process.env.SEND_ATTEMPTS || 5,
    UNIFONIC_PUBLIC_ID: process.env.UNIFONIC_PUBLIC_ID,
    UNIFONIC_SECRET: process.env.UNIFONIC_SECRET,
    BUCKET_NAME: process.env.BUCKET_NAME || "test_pdev",
    SEND_APPOINTMENT_REMINDER_BEFORE: process.env.SEND_APPOINTMENT_REMINDER_BEFORE || 5,
    SEND_APPOINTMENT_REMINDER_BEFORE_24HOURS: process.env.SEND_APPOINTMENT_REMINDER_BEFORE_24HOURS || 1440,
    SEND_APPOINTMENT_REMINDER_BEFORE_1HOUR: process.env.SEND_APPOINTMENT_REMINDER_BEFORE_1HOUR || 60,
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
    cannotBookAppointment: {
        en: "Can't book new appointment! You already have one upcoming appointment",
        ar: "لا يمكن حجز موعد جديد! لديك بالفعل موعد قاد"
    },
    consultationNotAvailable: {
        en: "Unable to book appointment: The consultation is not available with your current subscription plan.",
        ar: `لايمكن حجز موعد نظراً لأنك استفذت جميع الاستشارات في باقتك الحاليه، بامكانك شراء استشارات اضافيه`
    },
    doctorCurrentlyunavailable: {
        en: "This doctor is currently unavailable for appointments.",
        ar: "هذا الطبيب غير متاح حاليًا للمواعيد."
    },
    cannotBookAppointmentforpreviousDate: {
        en: "You can't book appointment for previous datetime",
        ar: ""
    },
    appointmentAdded: {
        en: `Appointment added successfully`,
        ar: ""
    },
    appointmentUpdated: {
        en: "Appointment updated successfully",
        ar: ""
    },
    appointmentStatusUpdated: {
        en: "Appointment status updated successfully!!",
        ar: ""
    },
    appointmentNotFound: {
        en: "Appointment not found",
        ar: ""
    },
    appointmentsFetched: {
        en: `Appointments fetched successfully`,
        ar: ""
    },
    appointmentIdRequired: {
        en: "Appointment Id is required",
        ar: ""
    },
    patientAppointmentFetched: {
        en: `Patient appointment fetched successfully`,
        ar: ""
    },
    cantRescheduleAppointment: {
        en: "You can't reschedule appointment for previous datetime",
        ar: ""
    },
    appointmentRescheduled: {
        en: `Appointment rescheduled successfully`,
        ar: ""
    },
    appointmentNotExist: {
        en: `Appointment not exist!`,
        ar: ""
    },
    getTimeSlot: {
        en: `Successfully get time slot`,
        ar: ""
    },
    recordNotFound: {
        en: "No Record Found",
        ar: ""
    },
    recordFetched: {
        en: "Records fetched successfully",
        ar: ""
    },
    hospitalStaffAdded: {
        en: "successfully created hospital staff",
        ar: ""
    },
    hospitalStaffUpdated: {
        en: "successfully updated hospital staff",
        ar: ""
    },
    hospitalStaffDeleted: {
        en: "successfully deleted hospital staff",
        ar: ""
    },
    hospitalDoctorFetched: {
        en: `hospital doctor fetched successfully`,
        ar: ""
    },
    hospitalLocationFetched: {
        en: `hospital locations fetched successfully`,
        ar: ""
    },
    getAllDoctor: {
        en: `Successfully get all doctors`,
        ar: ""
    },
    getRelatedDoctor: {
        en: `Successfully get related doctors`,
        ar: ""
    },
    doctorsFetched: {
        en: `Doctors fetched successfully`,
        ar: ""
    },
    doctorDetailsFetched: {
        en: `doctor details fetched successfully`,
        ar: ""
    },
    doctorBasicInfo: {
        en: `doctor basic info fetched successfully`,
        ar: ""
    },
    doctorCreated: {
        en: "successfully created doctor",
        ar: ""
    },
    doctorUpdated: {
        en: "successfully updated doctor details",
        ar: ""
    },
    doctorDeleted: {
        en: "successfully deleted hospital doctor",
        ar: ""
    },
    doctorEducationAdded: {
        en: "successfully added doctor educational details",
        ar: ""
    },
    doctorEducationUpdated: {
        en: "successfully updated doctor educational details",
        ar: ""
    },
    doctorEducationDeleted: {
        en: "successfully deleted doctor educational details",
        ar: ""
    },
    doctorAvailabilityAdded: {
        en: "successfully added doctor availability details",
        ar: ""
    },
    doctorAvailabilityUpdated: {
        en: "Successfully updated doctor availability details",
        ar: ""
    },
    doctorAvailabilityDeleted: {
        en: "successfully deleted doctor availability details",
        ar: ""
    },
    doctorConsultationUpdated: {
        en: "successfully updated doctor consultation details",
        ar: ""
    },
    doctorConsultationDeleted: {
        en: "successfully deleted doctor consultation details",
        ar: ""
    },
    documentAdded: {
        en: "successfully added document details",
        ar: ""
    },
    documentDeleted: {
        en: "successfully deleted document details",
        ar: ""
    },
    documentsFetched: {
        en: "successfully fetched document list",
        ar: ""
    },
    emailExist: {
        en: "Email already exists",
        ar: ""
    },
    locationandAvailabilityDeleted: {
        en: `Location and its availability deleted successfully`,
        ar: ""
    },
    locationInfoFetched: {
        en: "Location info fetched succesfully",
        ar: ""
    },
    healthcareProviderAssign: {
        en: `healthcare provider assigned successfully`,
        ar: ""
    },
    templateNameTaken: {
        en: "Template name already taken",
        ar: ""
    },
    templateUnique: {
        en: "Template name should be unique",
        ar: ""
    },
    templateUpdate: {
        en: "successfully updated template",
        ar: ""
    },
    getTemplateList: {
        en: "Successfully get template list",
        ar: ""
    },
    getTemplateDetail: {
        en: "Successfully get template details",
        ar: ""
    },
    templateDetailDeleted: {
        en: "Successfully deleted template details",
        ar: ""
    },
    EprescriptionUpdate: {
        en: "Successfully Updated E-prescription",
        ar: ""
    },
    EprescriptionFetched: {
        en: "E-prescription fetched successfully",
        ar: ""
    },
    EprescriptionNotFound: {
        en: "E-prescription Not Found!!",
        ar: ""
    },
    EprescriptionValidated: {
        en: "Eprescription validated successfully",
        ar: ""
    },
    recentEprescriptionFetched: {
        en: "Recent prescribes fetched succesfully",
        ar: ""
    },
    dosageAdd: {
        en: "Dosage added successfully",
        ar: ""
    },
    labTestAdd: {
        en: "Lab Test added successfully",
        ar: ""
    },
    labTestFetched: {
        en: "Lab Tests fetched successfully",
        ar: ""
    },
    labTestNotFound: {
        en: "No Lab Tests Found!!",
        ar: ""
    },
    imageTestUpdate: {
        en: "Imaging Test Updated successfully",
        ar: ""
    },
    imageTestFetched: {
        en: "Imaging Tests fetched successfully",
        ar: ""
    },
    imageTestNotFound: {
        en: "No Imaging Tests Found!!",
        ar: ""
    },
    vaccinationTestUpdate: {
        en: "Vaccination Test Updated successfully",
        ar: ""
    },
    vaccinationTestFetched: {
        en: "Vaccination Tests fetched successfully",
        ar: ""
    },
    vaccinationTestNotFound: {
        en: "No Vaccination Tests Found!!",
        ar: ""
    },
    allTestFetched: {
        en: "All Tests fetched successfully",
        ar: ""
    },
    noTestFound: {
        en: "No Tests Found!!",
        ar: ""
    },
    addTest: {
        en: "Successfully add Tests",
        ar: ""
    },
    updateTest: {
        en: "Successfully updated Test",
        ar: ""
    },
    medicineDosageFetched: {
        en: "Medicine Dosage fetched successfully",
        ar: ""
    },
    medicineDosageDeleted: {
        en: "Medicine Dose Deleted successfully",
        ar: ""
    },
    dataUpdated: {
        en: "data updated succesfully",
        ar: ""
    },
    dataFetched: {
        en: "Successfully fetched data",
        ar: ""
    },
    hospitalTypeAdd: {
        en: "Successfully add HospitalType",
        ar: ""
    },
    hospitalTypeListGet: {
        en: "Successfully get HospitalType list",
        ar: ""
    },
    hospitalTypeUpdate: {
        en: "Successfully updated HospitalType",
        ar: ""
    },
    hospitalTypeDelete: {
        en: "Successfully HospitalType deleted",
        ar: ""
    },
    healthTypeExist: {
        en: "HealthType already exist",
        ar: ""
    },
    healthCenterAdd: {
        en: "All health centre records added successfully",
        ar: ""
    },
    noHealthCenter: {
        en: "No new health centers added",
        ar: ""
    },
    allHealthCenter: {
        en: `All HealthCentre list`,
        ar: ""
    },
    notificationSaved: {
        en: "Notification Saved Successfully",
        ar: ""
    },
    notificationNotSaved: {
        en: "Notification not Saved",
        ar: ""
    },
    paymentHistoryFetched: {
        en: "Payment History Fetched successfully!",
        ar: ""
    },
    hospitalAdminDetail: {
        en: `Hospital admin details`,
        ar: ""
    },
    something_went_wrong: {
        en: "Something went wrong. Please try again later.",
        ar: "حدث خطأ ما. يرجى المحاولة مرة أخرى لاحقًا."
    },
    appointment_cancelled: {
        en: "Appointment cancelled successfully",
        ar: "تم إلغاء الموعد بنجاح."
    },
    appointment_approved: {
        en: "Appointment approved successfully",
        ar: "تمت الموافقة على الموعد بنجاح."
    },
    appointment_declined: {
        en: "Appointment declined successfully",
        ar: "تم رفض الموعد بنجاح."
    },
    appointment_confirmed: {
        en: "Appointment confirmed successfully",
        ar: "تم تأكيد الموعد بنجاح."
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

export const LabTestColumns = {
    col1: 'category',
    col2: 'lab_test',
    col3: 'description',
    col4: 'contributing_factors_to_abnormal_values',
    col5: 'normal_value_blood',
    col6: 'normal_value_urine',
    col7: 'possible_interpretation_of_abnormal_blood_value_high_levels',
    col8: 'possible_interpretation_of_abnormal_blood_value_low_levels',
    col9: 'possible_interpretation_of_abnormal_urine_value_high_levels',
    col10: 'possible_interpretation_of_abnormal_urine_value_low_levels',
    col11: 'blood_procedure_before',
    col12: 'blood_procedure_during',
    col13: 'blood_procedure_after',
    col14: 'urine_procedure_before',
    col15: 'urine_procedure_during',
    col16: 'urine_procedure_after',
    col17: 'clinical_warning',
    col18: 'other',
    col19: 'link'
}
export const ImagingTestColumns = {
    col1: 'category',
    col2: 'imaging',
    col3: 'description',
    col4: 'clinical_consideration',
    col5: 'normal_values',
    col6: 'abnormal_values',
    col7: 'contributing_factors_to_abnormal',
    col8: 'procedure_before',
    col9: 'procedure_during',
    col10: 'procedure_after',
    col11: 'clinical_warning',
    col12: 'contraindications',
    col13: 'other',
    col14: 'link'
}
export const OthersTestColumns = {
    col1: 'category',
    col2: 'others',
    col3: 'description',
    col4: 'clinical_consideration',
    col5: 'normal_values',
    col6: 'abnormal_values',
    col7: 'contributing_factors_to_abnormal',
    col8: 'procedure_before',
    col9: 'procedure_during',
    col10: 'procedure_after',
    col11: 'clinical_warning',
    col12: 'contraindications',
    col13: 'other',
    col14: 'link'
}
export const VaccinationColumns = {
    col1: 'name'
}

export const SpecialtyColumns = {
    col1: 'specialization',
}

export const AppointmentReasonColumns = {
    col1: 'ReasonName',
}

export const TimeZone = {
    hours: 0,
    minute: 0
}

export const MedicineColumns = {
    col1: 'MedicineNumber',
    col2: 'MedicineName',
    col3: 'INN',
    col4: 'Dosage',
    col5: 'PharmaceuticalFormulation',
    col6: 'AdministrationRoute',
    col7: 'TherapeuticClass',
    col8: 'Manufacturer',
    col9: 'ConditionOfPrescription',
    col10: 'Other',
    col11: 'Link',
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
export const HealthCenterColumns = {
    col1: 'name',
}
export const LanguageColumns = {
    col1: 'language',
}

export const departmentHospital = {
    col1: 'department_name',
    // col2: 'country_code',
    // col3: 'iso_code'
}

export const expertiseHospital = {
    col1: 'expertise_name',
    // col2: 'added_by'
    // col2: 'country_code',
    // col3: 'iso_code'
}

export const serviceHospital = {
    col1: 'service_name',
    col2: 'for_department',
    // col3: 'added_by',

    // col3: 'iso_code'
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
