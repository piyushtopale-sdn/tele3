import "dotenv/config.js";

const test_pFrontendUrl = process.env.test_p_FRONTEND_URL || "http://localhost:4200";

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

export const sendMailInvitations = (email, first_name, last_name, loggeInname, portalmessage, portalname) => ({
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
          <p>Please register yourself on this portal</p>
          <br/>
          <a href="${test_pFrontendUrl}/${portalname}/signup" role="button">CLICK HERE</a>
          <br/>
          <p>${portalmessage}</p>
          <br/>
          <p>Thanks,</p>
          <p>${loggeInname}</p>`
            },
        },
        Subject: {
            Charset: 'UTF-8',
            Data: `Mail Invitation from  `,
        }
    },
})
