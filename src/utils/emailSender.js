const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendOtpEmail = async (toEmail, otpCode) => {
  const mailOptions = {
    from: '"Fresh Sabji Hub" <security@freshsabjihub.com>',
    to: toEmail,
    subject: 'Your Login OTP - Fresh Sabji Hub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #4CAF50; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Fresh Sabji Hub</h1>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: #333333; margin-top: 0;">Login OTP Verification</h2>
          <p style="color: #555555; font-size: 16px; line-height: 1.5;">
            Hello,
          </p>
          <p style="color: #555555; font-size: 16px; line-height: 1.5;">
            Thank you for choosing Fresh Sabji Hub! To securely log into your account, please use the One-Time Password (OTP) below:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="display: inline-block; background-color: #f4f4f4; border: 1px dashed #4CAF50; padding: 15px 30px; font-size: 28px; font-weight: bold; color: #4CAF50; letter-spacing: 5px; border-radius: 8px;">
              ${otpCode}
            </span>
          </div>
          <p style="color: #555555; font-size: 16px; line-height: 1.5;">
            This OTP is valid for the next 5 minutes. Please do not share this code with anyone.
          </p>
          <p style="color: #555555; font-size: 16px; line-height: 1.5; margin-bottom: 0;">
            If you did not request this, please ignore this email or contact our support team.
          </p>
        </div>
        <div style="background-color: #f9f9f9; padding: 15px; text-align: center; border-top: 1px solid #e0e0e0;">
          <p style="color: #888888; font-size: 12px; margin: 0;">
            &copy; ${new Date().getFullYear()} Fresh Sabji Hub. All rights reserved.
          </p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
};

const supportTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: true,
  auth: {
    user: process.env.SUPPORT_SMTP_USER || 'support@freshsabjihub.com',
    pass: process.env.SUPPORT_SMTP_PASS || 'Support@1430',
  },
});

const sendSupportQueryEmail = async ({ userId, name, email, phone, subject, description }) => {
  const supportEmail = process.env.SUPPORT_SMTP_USER || 'support@freshsabjihub.com';
  
  const mailOptions = {
    from: `"Fresh Sabji Hub Support Portal" <${supportEmail}>`,
    to: supportEmail,
    replyTo: email && email !== 'No email provided' ? email : undefined,
    subject: `[Support Query] - ${subject}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">Fresh Sabji Hub</h1>
          <p style="color: #D1FAE5; margin: 4px 0 0 0; font-size: 14px;">Customer Support Request</p>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: #1E293B; margin-top: 0; font-size: 18px; font-weight: 600; border-bottom: 2px solid #F1F5F9; padding-bottom: 12px;">Query Details</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr>
              <td style="padding: 8px 0; color: #64748B; font-weight: 600; width: 30%; font-size: 14px;">Subject:</td>
              <td style="padding: 8px 0; color: #0F172A; font-weight: 700; font-size: 14px;">${subject}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748B; font-weight: 600; font-size: 14px;">Customer Name:</td>
              <td style="padding: 8px 0; color: #1E293B; font-size: 14px;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748B; font-weight: 600; font-size: 14px;">Phone Number:</td>
              <td style="padding: 8px 0; color: #1E293B; font-size: 14px;">${phone}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748B; font-weight: 600; font-size: 14px;">Email Address:</td>
              <td style="padding: 8px 0; color: #1E293B; font-size: 14px;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748B; font-weight: 600; font-size: 14px;">User ID:</td>
              <td style="padding: 8px 0; color: #1E293B; font-size: 13px; font-family: monospace;">${userId || 'Guest User'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748B; font-weight: 600; font-size: 14px;">Submitted At:</td>
              <td style="padding: 8px 0; color: #1E293B; font-size: 14px;">${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} (IST)</td>
            </tr>
          </table>

          <div style="background-color: #F8FAFC; border-left: 4px solid #10B981; padding: 16px; border-radius: 0 8px 8px 0;">
            <h3 style="color: #475569; margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Message Description</h3>
            <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${description}</p>
          </div>
        </div>
        <div style="background-color: #F8FAFC; padding: 16px; text-align: center; border-top: 1px solid #E2E8F0;">
          <p style="color: #94A3B8; font-size: 11px; margin: 0;">
            This query was submitted via the contact form in the Fresh Sabji Hub mobile app.
          </p>
        </div>
      </div>
    `
  };

  try {
    const info = await supportTransporter.sendMail(mailOptions);
    console.log('Support email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending support email:', error);
    throw error;
  }
};

module.exports = {
  sendOtpEmail,
  sendSupportQueryEmail
};
