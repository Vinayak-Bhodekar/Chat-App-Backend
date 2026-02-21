import { Message } from "../models/message.model.js"
import { Room } from "../models/room.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { socket } from "../server.js"
import { User } from "../models/user.model.js"
import { Request } from "../models/request.models.js"
//import socket from "../../frontend/src/socket.js"
import { RoomKey } from "../models/roomKey.model.js"

const handleJoinRoom = (socket, { roomId, userId }) => {
  socket.join(roomId)
  console.log(`${userId} joined room: ${roomId}`)
  socket.to(roomId).emit("userJoined", { userId })
}

const handleSendMessage = async (io, roomId, senderId, content) => {
  if (!content || !roomId) {
    throw new ApiError(400, "Message and roomId are required");
  }

  try {
    const message = await Message.create({
      sender: senderId,
      content,
      room: roomId
    });

    await Room.findByIdAndUpdate(roomId, {
      lastMessage: message._id
    });

    const room = await Room.findById(roomId).select("members");

    // other user (not sender)
    const receiverId = room.members.find(
      (m) => m.toString() !== senderId.toString()
    );

    const payload = {
      _id: message._id.toString(),
      sender: senderId.toString(),
      room: roomId.toString(),
      content,
      createdAt: message.createdAt
    };

    //LIVE CHAT (if user opened chat)
    io.to(roomId.toString()).emit("newMessage", payload);

    // UNREAD NOTIFICATION (even if chat closed)
    io.to(`user:${receiverId}`).emit("newMessage-notification", {
      room: roomId.toString(),
      sender: senderId.toString()
    });

  } catch (error) {
    console.log("error in sending message", error);
  }
};


const handleTyping = (roomId, userId) => {
  socket.to(roomId).emit("userTyping", { userId })
}

const handleStopTyping = (socket, { roomId, userId }) => {
  socket.to(roomId).emit("userStoppedTyping", { userId })
}

const handleDisconnect = async (userId, socketId, onlineUsers) => {
  try {
    const sockets = onlineUsers.get(userId)
    if (!sockets) return;

    sockets.delete(socket.id);

    if (sockets.size === 0) {
      onlineUsers.delete(userId)

      socket.emit("user:status", {
        userId,
        status: "Offline"
      })
    }

    console.log("❌ User disconnected:", socketId);
  } catch (error) {
    console.log("error in disconnecting", error)
  }
}

const handleConnected = async (userId, socketId) => {
  try {
    const user = await User.findByIdAndUpdate(userId, {
      status: "Online",
      socketId: socketId
    })

    socket.emit("user:status", { userId, status: "Online" })
    console.log("user connected:", socketId)
    //console.log("Total clients:", io.engine.clientsCount);



  } catch (error) {
    console.log("error in connecting", error)
  }
}

const handleSendRequest = async (userId, receiverId) => {
  console.log("Request send called")
  if (!receiverId) {
    console.log("A receiver Id is required")
    return;
  }

  if (!userId) {
    console.log("A user Id is required")
    return;
  }

  try {
    const existedRequest = await Request.findOneAndDelete({
      $or: [
        {
          sender: userId,
          receiver: receiverId
        },
        {
          sender: receiverId,
          receiver: userId
        }
      ]
    })

    console.log(existedRequest, "hiiii")

    const user = await User.findById(receiverId)

    if (!user) {
      console.log("not valid user Id")
      return;
    }

    const newRequest = await Request.create({
      sender: userId,
      receiver: receiverId,
      status: "pending"
    })

    if (!newRequest) {
      console.log("error in making request")
      return;
    }

    socket.to(user?.socketId).emit("incomming-request", { newRequest })

  } catch (error) {
    console.log("cant create the request", error)
  }

}

const handleAcceptRequest = async (userId, requestId, obj) => {

  try {
    const request = await Request.findById(requestId)

    const friendId = request.sender
    if (!request) {
      console.log("no such request found");
      return;
    }

    request.status = "accepted"

    await request.save({ validateBeforeSave: false })

    let room = await Room.findOne({
      members: { $all: [userId, friendId] }
    })

    if (!room) {
      room = await Room.create({
        members: [userId, friendId],
        isGroupChat: false
      })
    }

    const friendUser = await User.findById(friendId).select(
      "_id userName firstName lastName profile socketId"
    );

    const user = await User.findById(userId)

    let roomKey = await RoomKey.create({
      participants: [friendUser?._id, user?._id],
      roomId: room?._id,
      encryptedRoomKeys: [{
        user: obj[0]?.user,
        encryptedAESKey: obj[0].encryptedAESKey
      }, {
        user: obj[1]?.user,
        encryptedAESKey: obj[1].encryptedAESKey
      }
      ]
    })

    if (!roomKey) {
      console.log("error in roomKey Creation")
    }

    socket.to(user.socketId).emit("friend-added", {
      contact: {
        friend: friendUser,
        room: room,
        name: friendUser.userName,
        avatar: friendUser.profile,
        isGroup: false
      }
    })

    socket.to(friendUser.socketId).emit("friend-added", {
      contact: {
        friend: await User.findById(userId).select(
          "_id userName firstName lastName profile"
        ),
        room: room,
        name: user.userName,
        avatar: user.profile,
        isGroup: false
      }
    })

    console.log("Request accepted Successfully")

  } catch (error) {
    console.log("error in accept request", error)
  }
}

const handleMessageSeen = async (roomId, userId) => {
  if (!roomId) {
    throw new ApiError(400, "roomId is required");
  }
  if (!userId) {
    throw new ApiError(400, "userId is required");
  }

  try {
    const result = await Message.updateMany(
      {
        room: roomId,
        sender: { $ne: userId },
        readBy: { $ne: userId },
      },
      {
        $addToSet: { readBy: userId },
      }
    );

    socket.to(roomId).emit("message-read", {
      roomId,
      seenBy: userId,
    });

  } catch (error) {
    console.error("Error while marking messages as read:", error);
    throw error;
  }
};

const handleDeleteContact = async (roomId) => {
  console.log("🔥 Delete contact called");
  console.log("roomId received:", roomId);

  if (!roomId) {
    console.log("❌ roomId missing");
    throw new ApiError(400, "roomId is required");
  }

  try {
    const room = await Room.findById(roomId);
    console.log("Room found:", room);

    if (!room) {
      console.log("❌ Room not found in DB");
      return;
    }

    console.log("Room members:", room.members);

    const [user1Id, user2Id] = room.members;

    console.log("User1:", user1Id);
    console.log("User2:", user2Id);

    const deletedMessages = await Message.deleteMany({ room: roomId });
    console.log("Messages deleted:", deletedMessages.deletedCount);

    const deletedKeys = await RoomKey.deleteMany({ roomId });
    console.log("RoomKeys deleted:", deletedKeys.deletedCount);

    const deletedRequest = await Request.deleteOne({
      $or: [
        { sender: user1Id, receiver: user2Id },
        { sender: user2Id, receiver: user1Id }
      ]
    });

    console.log("Request deleted:", deletedRequest.deletedCount);

    const deletedRoom = await Room.findByIdAndDelete(roomId);
    console.log("Room deleted:", deletedRoom);

    const user1 = await User.findById(user1Id);
    const user2 = await User.findById(user2Id);

    console.log("User1 socketId:", user1?.socketId);
    console.log("User2 socketId:", user2?.socketId);

    if (user1?.socketId) {
      console.log("📡 Emitting to user1");
      socket.to(user1.socketId).emit("contact-delete", { roomId });
    }

    if (user2?.socketId) {
      console.log("📡 Emitting to user2");
      socket.to(user2.socketId).emit("contact-delete", { roomId });
    }

    console.log("✅ Delete flow finished");

  } catch (error) {
    console.error("❌ Error while deleting contact:", error);
    throw error;
  }
};

export {
  handleJoinRoom,
  handleSendMessage,
  handleTyping,
  handleStopTyping,
  handleDisconnect,
  handleConnected,
  handleSendRequest,
  handleAcceptRequest,
  handleMessageSeen,
  handleDeleteContact
};
