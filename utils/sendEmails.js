import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
import { ApiError } from "./ApiError.js";

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendOTP = async (to, otp) => {
  console.log("is -",process.env.SENDGRID_SENDER)
  try {
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

    console.log("OTP sent to:", to);
  } catch (error) {
    throw new ApiError("Failed to send OTP",error);
  }
};

export default sendOTP;
