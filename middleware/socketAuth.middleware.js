import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import cookie from "cookie";

const socketAuthMiddleware = async (socket, next) => {
    try {
        const rawCookies = socket.handshake.headers.cookie;

        if (!rawCookies) {
            console.log("❌ No cookies found");
            return next(); // allow guest if you want
        }

        const parsedCookies = cookie.parse(rawCookies);

        const token = parsedCookies.accessToken;

        if (!token) {
            console.log("❌ No accessToken in cookie");
            return next();
        }

        const decoded = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET
        );

        console.log("decoded", decoded)

        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            console.log("❌ User not found");
            return next();
        }

        socket.user = user;
        socket.userId = user._id;

        console.log("✅ Socket authenticated:", user._id);

        next();
    } catch (err) {
        console.log("❌ Socket auth error:", err.message);
        next(); // do NOT throw
    }
};

export { socketAuthMiddleware };