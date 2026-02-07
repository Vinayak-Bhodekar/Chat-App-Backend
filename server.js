import dotenv from "dotenv"
import http from "http"
import connectDB from "./config/db.js"
import { Server } from "socket.io"
import {app} from "./app.js"
import {socketHandler} from "./sockets/chat.js"
import { socketAuthMiddleware } from "./middleware/socketAuth.middleware.js"
import jwt from "jsonwebtoken"
import { ApiError } from "./utils/ApiError.js"
import { Message } from "./models/message.model.js"
import { 
    handleSendMessage,
    handleDisconnect,
    handleConnected,
    handleSendRequest,
    handleAcceptRequest,
    handleMessageSeen
} from "./controllers/socket.controller.js"
import { User } from "./models/user.model.js"

dotenv.config()
connectDB()

const server = http.createServer(app)

export const socket = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET","POST"],
        credentials:true
    }
})



socket.use((socket,next) => {
    const token = socket.handshake?.auth?.token

    if (!token) {
        console.log("⚠️ No token provided, connecting as guest");
        return next(); // allow guest
    }

    try{
        socket.userId = token
        next()
    } catch(error) {
        console.log("❌ Token verification failed:", error);
        return next();
    }
})

const onlineUsers = new Map();

socket.on("connect",(socket) => {
    //socketHandler(io,socket)

    const userId = socket.userId;

    if(!userId) return;

    socket.join(`user:${userId}`);

    if(!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
        socket.emit("user:status", {userId, status:"Online"});
    }

    onlineUsers.get(userId).add(socket.id);

    if(socket.userId) {
        handleConnected(socket.userId,socket.id)
    }

    socket.on("joinRoom",(roomId,userName) => {
        socket.join(roomId?._id);
        console.log(`${userName} joined room ${roomId?._id}`)
        socket.to(roomId?._id).emit("user:joined",{userId,userName})
    })

    socket.on("typing",({roomId,profile}) => {
        socket.to(roomId._id).emit("user:typing",{userId:profile._id})
    })

    socket.on("stopTyping",({roomId}) => {
        console.log("User stop typing")
        socket.to(roomId._id).emit("user:stopTyping",{userId:socket.userId})
    })

    socket.on("sendMessage",async ({roomId, senderId, content}) => handleSendMessage(socket,roomId, senderId,content))

    socket.on("sendRequest",async ({userId,receiverId}) => handleSendRequest(userId,receiverId))

    socket.on("acceptRequest",async ({userId,requestId,obj}) => handleAcceptRequest(userId,requestId,obj))

    socket.on("messages:seen", async ({roomId,userId}) => handleMessageSeen(roomId,userId))

    socket.on("disconnect", async () => {
        /*const userId = socket.userId;
        if (userId) {
            await handleDisconnect(userId, socket.id);
            io.emit("user:status", { userId, status: "Offline" });
        }*/
        const sockets = onlineUsers.get(userId);
        if (!sockets) return;

        sockets.delete(socket.id);

        if (sockets.size === 0) {
            onlineUsers.delete(userId);
            socket.emit("user:status", {
                userId,
                status: "Offline"
            });
        }
    });


})
