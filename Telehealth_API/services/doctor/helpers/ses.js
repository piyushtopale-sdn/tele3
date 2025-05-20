import 'dotenv/config';
import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  secure: false, // true for port 465, false for other ports
  auth: {
    user: "apikey",
    pass: process?.env?.SENDGRID_PASSWORD, //SENDGRID_PASSWORD,
  },
});


let sendEmail = async (content, email) => {
  try {
    const info = await transporter.sendMail({
      from: `"Test_p" <${process?.env?.SENDGRID_EMAIL}>`,
      to: email,
      subject: content.subject,
      html: content.body,
    });
    console.log("Email sent: ", info.messageId);
  } catch (error) {
    console.error("Failed to send email:", error.message);
    // Optionally, you can log the error or handle it accordingly without crashing the app
  }
};

module.exports = {
  sendEmail,
};