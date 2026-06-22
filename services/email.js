import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure:false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});


export const sendOTPEmail = async (email, otp) => {
  await transporter.sendMail({
    from: `"JobDev" <${process.env.MAIL_FROM}>`,
    to: email,
    subject: "Verify your JobDev account",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #1a1a2e;">Verify your email</h2>
        <p>Use the OTP below to verify your JobDev account. It will expire in 10 minutes.</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4f46e5; margin: 24px 0;">
          ${otp}
        </div>
        <p style="color: #666;">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
};

export const sendResetPasswordEmail = async (email, resetUrl) => {
  await transporter.sendMail({
    from: `"DevHire" <${process.env.MAIL_FROM}>`,
    to: email,
    subject: "Reset your JobDev password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #1a1a2e;">Reset your password</h2>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" 
           style="display:inline-block; background:#4f46e5; color:white; padding:12px 24px; 
                  border-radius:8px; text-decoration:none; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #666;">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
};

export const sendApplicationStatusEmail = async (email, jobTitle, status) => {
  const statusMessages = {
    reviewed: "Your application is being reviewed",
    shortlisted: "Congratulations! You've been shortlisted",
    rejected: "Application status update",
  };

  await transporter.sendMail({
    from: `"JobDev" <${process.env.MAIL_FROM}>`,
    to: email,
    subject: statusMessages[status] || "Application update",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #1a1a2e;">Application Update</h2>
        <p>Your application for <strong>${jobTitle}</strong> has been updated.</p>
        <p>Status: <strong style="color: #4f46e5; text-transform: capitalize;">${status}</strong></p>
        <a href="${process.env.CLIENT_URL}/applications" 
           style="display:inline-block; background:#4f46e5; color:white; padding:12px 24px; 
                  border-radius:8px; text-decoration:none; margin: 16px 0;">
          View Application
        </a>
      </div>
    `,
  });
};
