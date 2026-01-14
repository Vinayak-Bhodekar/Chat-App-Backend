/*import {
    handleJoinRoom,
    handleSendMessage,  
    handleTyping,
    handleStopTyping,
    handleDisconnect
} from "../controllers/socket.controller.js";

const socketHandler = (io) => {
    io.on("connection", (socket) => {
        console.log("New client connected:", socket.id)

        socket.on("joinRoom", (data) => handleJoinRoom(socket,data))

        socket.on("sendMessage", (data) => handleSendMessage(io,socket,data));
        
        socket.on("typing", (data) => handleTyping(socket,data));

        socket.on("stopTyping", (data) => handleStopTyping(socket,data));

        socket.on("disconnected", () => handleDisconnect(socket));
    });
}

export {socketHandler};*/

export const socketHandler = (io,socket) => {

    socket.join(socket.user.id.toString())
    console.log(`User connected: ${socket?.user?.userName},RoomId: ${socket.user.id.toString()}`)

    socket.broadcast.emit("user:online",socket.user.id)

    socket.on("send_message",({to, message}) => {
        io.to(to).emit("message:receive",{
            from:socket.user.id,
            message
        })
    })

    socket.on("disconnect",() => {
        console.log(`user Disconnected: ${socket.user.username}`)
        socket.broadcast.emit("user:offline",socket.user.id)
    })
}