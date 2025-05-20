import "dotenv/config.js";
import { config } from "../config/constants";

const test_pFrontendUrl = config.TEST_P_FRONTEND_URL || "http://localhost:4200";

export const forgotPasswordEmail = (email, code, user_id) => {
    return {
        Source: '<no-reply@yopmail.com>',
        Destination: {
            ToAddresses: [
                email
            ],
        },
        ReplyToAddresses: ['no-reply@yopmail.com'],
        Message: {
            Body: {
                Html: {
                    Charset: 'UTF-8',
                    Data: `
                <h3>Password Reset</h3>
                <br/>
                <p>Click the below button to reset your password</p>
                <br/>
                <a href="${test_pFrontendUrl}/hospital/setpassword?token=${code}&user_id=${user_id}&role="button">RESET YOUR PASSWORD</a>
                <br/>
                <p>If you didn’t request this, you can ignore this email.</p>
                <br/>
                <p>Thanks,</p>
                <p>Tele-Medicine</p>`,
                },
            },
            Subject: {
                Charset: 'UTF-8',
                Data: `Forgot Password Link`,
            }
        },
    };
}

export const forgotPasswordEmailForIndividualDoctor = (email, code, user_id) => {
    return {
        Source: '<no-reply@yopmail.com>',
        Destination: {
            ToAddresses: [
                email
            ],
        },
        ReplyToAddresses: ['no-reply@yopmail.com'],
        Message: {
            Body: {
                Html: {
                    Charset: 'UTF-8',
                    Data: `
                <h3>Password Reset</h3>
                <br/>
               
                <a href="${test_pFrontendUrl}/individual-doctor/newpassword?token=${code}&user_id=${user_id}&role="button">RESET YOUR PASSWORD</a>
                <br/>
                <p>Click the below button to reset your password</p>
                <br/>
                <p>Thanks,</p>
                <p>/p>`,
                },
            },
            Subject: {
                Charset: 'UTF-8',
                Data: `Forgot Password Link`,
            }
        },
    };
}

export const verifyEmail2fa = (email, code) => ({
    Source: '<no-reply@yopmail.com>',
    Destination: {
        ToAddresses: [
            email
        ],
    },
    ReplyToAddresses: ['no-reply@yopmail.com'],
    Message: {
        Body: {
            Html: {
                Charset: 'UTF-8',
                Data: `
          <h3>Verification Code</h3>
          <br/>
          <p>Please use the verification code below to sign in.</p>
          <br/>
          <p>${code}</p>
          <br/>
          <p>If you didn’t request this, you can ignore this email.</p>
          <br/>
          <p>Thanks,</p>
          <p>/p>`
            },
        },
        Subject: {
            Charset: 'UTF-8',
            Data: `OTP Verification`,
        }
    },
})


export const sendStaffDetails = (email, password, type) => ({
    Source: '<no-reply@yopmail.com>',
    Destination: {
        ToAddresses: [
            email
        ],
    },
    ReplyToAddresses: ['no-reply@yopmail.com'],
    Message: {
        Body: {
            Html: {
                Charset: 'UTF-8',
                Data: `
          <h3>${type} Staff Credential</h3>
          <br/>
          <p>Please use below credential to login with ${type} portal.</p>
          <br/>
          <p><b>Login Email:</b> ${email}</p>
          <p><b>Login Password:</b> ${password}</p>
          <br/>
          <br/>
          <p>Thanks,</p>
          <p>/p>`
            },
        },
        Subject: {
            Charset: 'UTF-8',
            Data: `${type} Staff Credential.`,
        }
    },
})

export const sendEprescriptionEmail = (patient_email, doctor_email, appointmentId,patient_name,doctor_name) => ({
    Source: doctor_email,
    Destination: {
        ToAddresses: [
            patient_email
        ],
    },
    ReplyToAddresses: [doctor_email],
    Message: {
        Body: {
            Html: {
                Charset: 'UTF-8',
                Data: `
                <p>Hello ${patient_name},</p>
                <br/>
                <p>Please find below attachment of your EPrescription by Dr. ${doctor_name}.</p>
                <br/>
                <a href="${test_pFrontendUrl}/individual-doctor/eprescription-viewpdf?id=${appointmentId}">Link to Download PDF</a>           
                <br/>
                <br/>
                <p>Thanks & Regards</p>
                <p>Dr. ${doctor_name}</p>`
            }
        },

        Subject: {
            Charset: 'UTF-8',
            Data: `EPrescription Document.`,
        }
    },
})

export const externalUserAddEmail = (email, link) => ({
    Source: '<no-reply@yopmail.com>',
    Destination: {
        ToAddresses: [
            email
        ],
    },
    ReplyToAddresses: ['no-reply@yopmail.com'],
    Message: {
        Body: {
            Html: {
                Charset: 'UTF-8',
                Data: `
          <h3>JOIN CALL</h3>
          <br/>
          <p>Please click on link to join the call.</p>
          <br/>
          <a>${link}</a>
          <br/>
          <p>If you didn’t join, you can ignore this email.</p>
          <br/>
          <p>Thanks,</p>
          <p>/p>`
            },
        },
        Subject: {
            Charset: 'UTF-8',
            Data: `Join Call`,
        }
    },
})
