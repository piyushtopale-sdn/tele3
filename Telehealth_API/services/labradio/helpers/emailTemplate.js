import "dotenv/config";

const terstFrontendUrl = process.env.terst_FRONTEND_URL || "http://localhost:4200";

export const forgotPasswordEmailForIndividualDoctor = (email, code, user_id, type) => {
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
                <h3>Password Reset for ${type} portal.</h3>
                <br/>
               
                <a href="${terstFrontendUrl}/portals/newpassword/${type}?token=${code}&user_id=${user_id}&type=${type}&role="button">RESET YOUR PASSWORD</a>
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
            Data: `Hospital OTP Verification`,
        }
    },
})

export const sendMailInvitations = (email, first_name, last_name, loggeInname) => ({
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
          <h3>Mail Invitation</h3>
          <br/>
          <p>Hello ${first_name} ${last_name},</p>
          <br/>
          <p>Please register yourself on this</p>
          <br/>
          <a href="${terstFrontendUrl}/patient/signup" role="button">CLICK</a>
          <br/>
          <br/>
          <p>Thanks</p>
          <p>${loggeInname}</p>`
            },
        },
        Subject: {
            Charset: 'UTF-8',
            Data: `Mail Invitation from `,
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

export const sendEprescriptionEmail = (patient_email, portal_email, appointmentId,patient_name,portal_name,portal_type) => ({
    Source: portal_email,
    Destination: {
        ToAddresses: [
            patient_email
        ],
    },
    ReplyToAddresses: [portal_email],
    Message: {
        Body: {
            Html: {
                Charset: 'UTF-8',
                Data: `
                <p>Hello ${patient_name},</p>
                <br/>
                <p>Please find below attachment of your EPrescription by Dr. ${portal_name}.</p>
                <br/>
                <a href="${terstFrontendUrl}/portals/eprescription-viewpdf?id=${appointmentId}&portal_type=${portal_type}">Link to Download PDF</a>           
                <br/>
                <br/>
                <p>Thanks & Regards</p>
                <p>Dr. ${portal_name}</p>`
            }
        },

        Subject: {
            Charset: 'UTF-8',
            Data: `EPrescription Document.`,
        }
    },
})
