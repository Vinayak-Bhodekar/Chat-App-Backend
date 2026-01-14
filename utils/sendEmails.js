import nodemailer from "nodemailer"
import { ApiError } from "./ApiError.js";
import dotenv from "dotenv"

dotenv.config();

const transporter = nodemailer.createTransport({
        service:"gmail",
        auth: {
            user:process.env.EMAIL_USER,
            pass:process.env.EMAIL_PASS
        }
});

const sendOTP = async (to,otp) => {
    try {
        await transporter.sendMail({
            from : `"My App" <${process.env.EMAIL_USER}>`,
            to,
            subject: "Your OTP code",
            text: `Your OTP is ${otp}. It expires in 5 min`,
            html: `<h2>Your OTP code is <b>${otp}</b></h2><p>It expires in 5 minutes.</p>`
        });
        console.log("send OTP to",to)
        
    } catch (error) {
        console.log("Error in sending OTP",error)
        throw new ApiError(404,"Can't send the OTP",error)
        
    }
}

export default sendOTP;