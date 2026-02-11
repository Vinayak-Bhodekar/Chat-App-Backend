import sgMail from "@sendgrid/mail";
import { ApiError } from "./ApiError.js";
import dotenv from "dotenv";

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

await sgMail.send({
  to,
  from: {
    email: process.env.SENDGRID_SENDER,
    name: "Chat App"
  },
  subject: "Your Chat App OTP Code",
  html: `
    <div style="font-family: Arial, sans-serif;">
      <h2>Chat App Verification</h2>
      <p>Your One-Time Password (OTP) is:</p>
      <h1>${otp}</h1>
      <p>This code will expire in 5 minutes.</p>
      <hr/>
      <small>If you did not request this, please ignore this email.</small>
    </div>
  `,
});

export default sendOTP;
