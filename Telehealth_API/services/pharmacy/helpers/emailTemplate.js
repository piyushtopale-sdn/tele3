import "dotenv/config.js";

const terstFrontendUrl = process.env.terst_FRONTEND_URL || "http://localhost:4200";

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
          <p>terst</p>`
            },
        },
        Subject: {
            Charset: 'UTF-8',
            Data: `terst Pharmacy OTP Verification`,
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
          <p>terst</p>`
            },
        },
        Subject: {
            Charset: 'UTF-8',
            Data: `terst Pharmacy Staff Credential.`,
        }
    },
})

export const sendMailInvitations = (email,first_name,last_name,loggeInname) => ({
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
          <a href="${terstFrontendUrl}/pharmacy/signup" role="button">CLICK</a>
          <br/>          
          <br/>
          <p>Thanks,</p>
          <p>${loggeInname}</p>`
            },
        },
        Subject: {
            Charset: 'UTF-8',
            Data: `Mail Invitation from terst `,
        }
    },
})
