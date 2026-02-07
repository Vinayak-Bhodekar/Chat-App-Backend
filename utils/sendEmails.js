import { Resend } from "resend";
import { ApiError } from "./ApiError.js";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOTP = async (to, otp) => {
  try {
    await resend.emails.send({
      from: `Chat-app <${process.env.RESEND_FROM_EMAIL}>`,
      to,
      subject: "Your OTP Code",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Your OTP Code</h2>
          <p>Your OTP is:</p>
          <h1>${otp}</h1>
          <p>This OTP will expire in <b>5 minutes</b>.</p>
        </div>
      `,
    });

    console.log("OTP sent to", to);
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw new ApiError(500, "Failed to send OTP email", error);
  }
};

export default sendOTP;
