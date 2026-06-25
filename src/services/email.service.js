// services/email.service.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App Password مش الباسورد العادي
  },
});

const sendOTPEmail = async (toEmail, otp) => {
  await transporter.sendMail({
    from: `"Planet AI" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Reset Password OTP",
    html: `
      <h2>Reset Your Password</h2>
      <p>Your OTP code is: <strong>${otp}</strong></p>
      <p>This code expires in 10 minutes.</p>
    `,
  });
};

module.exports = { sendOTPEmail };
