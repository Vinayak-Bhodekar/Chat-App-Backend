import {ApiResponse} from "../utils/ApiResponse.js";
import {ApiError} from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Message } from "../models/message.model.js";
import { Room } from "../models/room.model.js";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";



const sendMessage = asyncHandler(async (req, res) => {
  const {content,roomId} = req.body;
  if(!content || !roomId) {
    throw new ApiError(400,"Message and roomId are required")
  }

  const message = await Message.create({
    sender: req.user._id,
    content,
    room:roomId
  });

  await Room.findByIdAndUpdate(
    roomId,
    {
      lastMessage: message._id,
  })

  res
  .status(201)
  .json(new ApiResponse(201,"Message Sent",message))
})

const getMessagesForRoom = asyncHandler(async (req, res) => {
  const {roomId} = req.params

  if(!roomId) {
    throw new ApiError(400,"roomId is required");
  }

  try {
    const messages = await Message.find({room: roomId})
  
    if(!messages || messages.length === 0) {
      return res.status(404).json(new ApiResponse(404,"No messages found for this room"));
    }
  
    res
    .status(200)
    .json(new ApiResponse(200,"Message retrieve successfully", messages));
    
  } catch (error) {
    console.log("error in getMessagesForRoom:", error);
  }
})

const deleteMessage = asyncHandler(async (req, res) => {
  const {messageId} = req.params

  if(!messageId) {
    throw new ApiError(400,"messageId is required")
  }

  try {
    const message = await Message.findByIdAndDelete(messageId);
  
    if(!message) {
      throw new ApiError(404,"Message not found");
    }
  
    res
    .status(200)
    .json(new ApiResponse(200,"Message deleted successfully", message));
    
  } catch (error) {
    console.log("error in deleteMessage:", error);
    throw new ApiError(500, "Internal Server Error");
  }
})

const editMessage = asyncHandler(async (req, res) => {
  const {messageId} = req.params;
  const {newContent} = req.body;

  if(!messageId || !newContent) {
    throw new ApiError(400,"messageId and newContent are required");
  }

  try {
    const message = await Message.findByIdAndUpdate(
      messageId,
      {content: newContent},
      {new: true}
    )
  
    if(!message) {
      throw new ApiError(404,"Message not found");
    }
  
    // Update the lastMessage field in the Room model
    await Room.findByIdAndUpdate(
      message.room,
      {
        lastMessage: message._id
      }
    )
  
    res
    .status(200)
    .json(new ApiResponse(200, "Message updated successfully", message));
  
  } catch (error) {
    console.log("error in editmessage:", error);
    throw new ApiError(500, "Internal Server Error");
  }
})

const getMessageById = asyncHandler(async (req, res) => {
  const {messageId} = req.params

  console.log(messageId,"he;;")
  if(!messageId) {
    throw new ApiError(400,"messageId is reuired")
  }

  try {
    const message = await Message.findById(messageId)
  
    if(!message) {
      throw new ApiError(404,"Message not found");
    }
  
    res
    .status(200)
    .json(new ApiResponse(200,"Message retrieved successfully", message));
    
  } catch (error) {
    console.log("error in getMessageById:", error);
    throw new ApiError(500, "Internal Server Error");
  }
})

const markMessagesAsRead = asyncHandler(async (req, res) => {

  const { roomId } = req.params;

  if (!roomId) {
    throw new ApiError(400, "roomId is required");
  }

  try {
    const result = await Message.updateMany(
      { room: roomId, isRead: false }, 
      { $set: { isRead: true } }
    );

    if (result.modifiedCount === 0) {
      throw new ApiError(404, "No unread messages found for this room");
    }

    res.status(200).json(
      new ApiResponse(200, result, "Messages marked as read successfully")
    );
  } catch (error) {
    console.log("Error in markMessagesAsRead:", error);

    if (error instanceof mongoose.Error) {
      throw new ApiError(500, "Database Error");
    } else {
      throw new ApiError(500, "Internal Server Error1");
    }
  }
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const {roomId} = req.params;

  if(!roomId) {
    throw new ApiError(400, "roomId is required");
  }
  try {
    
    const unreadCount = await Message.countDocuments(
      {
        room: roomId,
        isRead: false
      }
    )
  
    res
    .status(200)
    .json(new ApiResponse(200, "Unread messages count retrieved successfully", unreadCount));
    
  } catch (error) {

    console.log("error in getUnreadCount:", error);
    throw new ApiError(500, "Internal Server Error");
    
  }
})

const reactToMessage = asyncHandler(async (req, res) => {
  const {messageId} = req.params
  const {reaction} = req.body

  if(!messageId || !reaction) {
    throw new ApiError(400,"messageId and reaction are required");
  }
  try {
    
    const message = await Message.findById(messageId);
  
    if(!message) {
      throw new ApiError(404,"Message not found");
    }
  
    // Check if the user has already reacted to the message
  
    const existingReaction = message.reactions.find(
      (r) => r.user.toString() === req.user._id.toString()
    );
  
    if(existingReaction) {
      existingReaction.reaction = reaction
    }
    else {
      message.reactions.push({
        user: req.user._id,
        reaction:reaction
      })
    }
  
    await message.save({validateBeforeSave: false});
  
    res
    .status(200)
    .json(new ApiResponse(200, "Reaction added successfully", message));
      
  } catch (error) {
    console.log("error in reactToMessage:", error);
    throw new ApiError(500, "Internal Server Error");
  }
})

const uploadMediaMessage = asyncHandler(async (req, res) => {
  // Handle media upload logic here
})   

const pinMessage = asyncHandler(async (req, res) => {
  // Handle pinning message logic here
  const {messageId} = req.params;

  if(!messageId) {
    throw new ApiError(400,"messageId is required");
  }
  try {
    
    const message = await Message.findById(messageId);
  
    if(!message) {
      throw new ApiError(404,"Message not found")
    }
  
    message.isPinned = !message.isPinned;
  
    await message.save({validateBeforeSave: false});
  
    res
    .status(200)
    .json(new ApiResponse(200, "Message pin status updated successfully", message));
    
  } catch (error) {
    console.log("error in pinMessage:", error);
    throw new ApiError(500, "Internal Server Error");
  }
})

const getAllMessageByRoom = asyncHandler(async (req,res) => {
  const {roomId} = req.body

  if(!roomId) {
    throw new ApiError(400,"room id is required")
  }

  try {
    const room = await Room.findById(roomId)

    if(!room) {
      throw new ApiError(404,"Room is not found")
    }

    const messages = await Message.find({
      room:roomId
    })

    if(messages.length > 0) {
      res
      .status(200)
      .json(new ApiResponse(200,"Message fetched Succefully",messages))
    } 
    else {
      res
      .status(200)
      .json(new ApiResponse(200,"There is no error in database",messages))
    }

    
  } catch (error) {
    throw new ApiError(400,"Error in fetching Message",error)
  }
})

const deleteAllMessage = asyncHandler(async (req,res) => {
  const {roomId} = req.body;

  if(!roomId) {
    throw new ApiError(400,"friend Id is required")
  }

  try {
    const result = await Message.deleteMany({room: roomId})

    return res.
    status(200).
    json(new ApiResponse(200,"Delete message Successfully",result))
  } catch (error) {
    throw new ApiError(400,"error in deleting message",error)
    
  }
})


const markMessagesAsSeen = async (req, res) => {
  const { roomId } = req.body;
  const userId = req.user._id;

  await Message.updateMany(
    {
      room: roomId,
      sender: { $ne: userId },
      readBy: { $ne: userId },
    },
    {
      $addToSet: { readBy: userId },
    }
  );

  res.status(200).json({ success: true });
};

const getUnreadMessages = async (req, res) => {
  const userId = req.user._id;

  try {
    // 1️⃣ Get all DM rooms of the user
    const rooms = await Room.find({
      isGroupChat: false,
      members: userId,
      $expr: { $eq: [{ $size: "$members" }, 2] }
    }).select("_id");

    const roomIds = rooms.map(r => r._id);

    if (!roomIds.length) {
      return res
        .status(200)
        .json(new ApiResponse(200, "No unread messages", []));
    }

    // 2️⃣ Count unread messages per room
    const unread = await Message.aggregate([
      {
        $match: {
          room: { $in: roomIds },
          sender: { $ne: userId },
          readBy: { $not: { $elemMatch: { $eq: userId } } }
        }
      },
      {
        $group: {
          _id: "$room",
          count: { $sum: 1 }
        }
      }
    ]);

    res
      .status(200)
      .json(new ApiResponse(200, "Unread messages fetched", unread));

  } catch (error) {
    throw new ApiError(500, "Error in getting unread messages", error);
  }
};



export {
  sendMessage,
  getMessagesForRoom,
  deleteMessage,
  editMessage,
  getMessageById,
  markMessagesAsRead,
  getUnreadCount,
  reactToMessage,
  uploadMediaMessage,
  pinMessage,
  getAllMessageByRoom,
  deleteAllMessage,
  markMessagesAsSeen,
  getUnreadMessages
};
