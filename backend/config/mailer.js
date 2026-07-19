import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: { 
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS 
  },
  tls: { rejectUnauthorized: false }
});

export async function sendOTPEmail(email, name, otp) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'IRIS Bot — Verify Your Email',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0a0a0a; color: #fff; border-radius: 12px; border: 2px solid #7c3aed;">
        <h1 style="color: #7c3aed; margin-bottom: 8px; font-size: 28px;">IRIS Bot</h1>
        <p style="color: #a3a3a3; margin-bottom: 24px; font-size: 13px;">Intelligent Routing &amp; Injection-Safe System</p>
        <p style="margin-bottom: 8px;">Hi <strong>${name}</strong>,</p>
        <p style="margin-bottom: 16px;">Your verification code is:</p>
        <div style="font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #7c3aed; margin: 24px 0; font-family: monospace; text-align: center;">${otp}</div>
        <p style="color: #a3a3a3; font-size: 13px; margin-top: 24px;">Valid for 10 minutes. Do not share this code.</p>
        <hr style="border: none; border-top: 1px solid #2a2a2a; margin: 24px 0;" />
        <p style="color: #525252; font-size: 11px;">If you didn't request this, ignore this email.</p>
      </div>
    `,
    text: `Hi ${name},\n\nYour IRIS Bot verification code is: ${otp}\n\nValid for 10 minutes. Do not share this code.`,
  });
}
