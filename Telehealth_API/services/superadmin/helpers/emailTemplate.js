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
                <a href="${test_pFrontendUrl}/super-admin/newpassword?token=${code}&user_id=${user_id}&role="button">RESET YOUR PASSWORD</a>
                <br/>
                <p>If you didn’t request this, you can ignore this email.</p>
                <br/>
                <p>Thanks,</p>
                <p>Tele-medicine</p>`,
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
          <p>Tele-medicine</p>`
            },
        },
        Subject: {
            Charset: 'UTF-8',
            Data: `Super-admin OTP Verification`,
        }
    },
})

export const sendStaffDetails = (email, password,staff_name) => ({
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
          <h3> Superadmin Staff Credential</h3>
          <br/>
          <p>Hello ${staff_name},</p>

          <p>Please use below credential to login with Superadmin portal.</p>
          <br/>
          <p>Click the below button to login</p>
          <br/>
          <a href="${test_pFrontendUrl}/super-admin/login" role="button">LOGIN</a>
          <br/>
          <p><b>Login Email:</b> ${email}</p>
          <p><b>Login Password:</b> ${password}</p>
          <br/>
          <br/>
          <p>Thanks,</p>
          <p>Tele-Medicine</p>`
            },
        },
        Subject: {
            Charset: 'UTF-8',
            Data: `Superadmin Staff Credential.`,
        }
    },
})