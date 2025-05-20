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
                <a href="${test_pFrontendUrl}/patient/setnewpass?token=${code}&user_id=${user_id}&role="button">RESET YOUR PASSWORD</a>
                <br/>
                <p>If you didn’t request this, you can ignore this email.</p>
                <br/>
                <p>Thanks,</p>
                <p></p>`,
                },
            },
            Subject: {
                Charset: 'UTF-8',
                Data: ` Forgot Password Link`,
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
          <p></p>`
            },
        },
        Subject: {
            Charset: 'UTF-8',
            Data: ` Patient OTP Verification`,
        }
    },
})
