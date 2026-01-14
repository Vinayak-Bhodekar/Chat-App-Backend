import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import cookie from "cookie"


const socketAuthMiddleware = async (socket,next) => {
    console.log("hi")
    try {
        
        const token = socket?.handshake?.auth?.token;

        console.log("socket token",token)

        if(!token) {
            throw new ApiError(400,"Authentication token missing");
        }

        const decoded = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)

        console.log("decoded token",decoded)

        const user = await User.findById(decoded.id).select("-password")

        if(!user) {
            throw new ApiError(404,"User not found");
        }

        socket.user = user

        next()
    }

    catch(err) {
        console.log("error found",err)
        throw new ApiError(400,"Error found",err)
    }
}


/*
const socketAuthMiddleware = async (socket,next) => {
    console.log("hi")
    try {
        const cookies = cookie.parse(socket.handshake.headers.cookie || "")
        console.log(cookies)

        const token = cookie.accessToken;

        //const token = socket?.handshake?.auth?.token

        console.log(token)

        if(!token) {
            throw new ApiError(400,"Authentication token missing");
        }

        const decoded = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)

        console.log("decoded token",decoded)

        const user = await User.findById(decoded.id).select("-password")

        if(!user) {
            throw new ApiError(404,"User not found");
        }

        socket.user = user

        next()
    }

    catch (err) {
    console.log("❌ Socket auth error:", err.message);
    throw new ApiError(400,"error in connection",err)
    }
    next()
}
*/

export {socketAuthMiddleware}