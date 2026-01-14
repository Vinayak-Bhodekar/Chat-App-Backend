import { Room } from "../models/room.model.js";
import { User } from "../models/user.model.js";
import { Message } from "../models/message.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose"
import { Request } from "../models/request.models.js";

const createRoom = asyncHandler(async (req,res) => {
    const {members,roomName} = req.body
    const loggedInUserId = req.user._id


    let updatedMember = members.filter((userId) => userId !== loggedInUserId.toString())

    const isGroupChat = updatedMember.length === 1 ? false : true

    if(!updatedMember || updatedMember.length === 0) {
        throw new ApiError(400,"Members are required to create a room")
    }
    

    if(!isGroupChat && updatedMember.length !== 1) {
        throw new ApiError(400,"Personal chat have exactly one member")
    }

    try {

        let finalMembers = updatedMember.map((item) => {

            if (typeof item === "string") {
                return new mongoose.Types.ObjectId(item);
            }
        });

        const loggedInUserObjectId = new mongoose.Types.ObjectId(loggedInUserId)

        if(!finalMembers.some(id => id.equals(loggedInUserObjectId))){
            finalMembers.push(loggedInUserObjectId)
        }
        
        if (!isGroupChat) {
    
            let room = await Room.findOne({
                isGroupChat: false,
                members: {
                  $all: [
                    loggedInUserId,
                    updatedMember[0]
                  ],
                  $size:2
                }
            });
              
            
            if(room) {
                throw new ApiError(400,"Room already exists",room)
            }
        }

        const newRoom = await Room.create({
            roomName:isGroupChat ? roomName:null,
            isGroupChat:isGroupChat,
            members:finalMembers,
            groupAdmin:isGroupChat ? loggedInUserObjectId:null
        })
    
    
        const roomInfo = await Room.findById(newRoom._id)
    
        res
        .status(200)
        .json(new ApiResponse(200,"Room created Suuccessfully",roomInfo))
    } catch (error) {
        console.log("Error: ",error)
        throw new ApiError(400,"Room not created",error)
    }
})

const getMyRooms = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const rooms = await Room.find({
    members: { $in: [userId] }
  });

  const contacts = await Promise.all(
    rooms.map(async (room) => {
      if (room.isGroupChat) {
        const lastMessage = await Message.findById(room?.lastMessage).select("content _id")
        return {
            room: room,
            name: room.roomName,
            isGroup:true,
            avatar:room.avatar
        };
      }

      const friendId = room.members.find(
        member => member.toString() !== userId.toString()
      );

      const friend = await User.findById(friendId).select("userName profile");
      const lastMessage = await Message.findById(room.lastMessage).select("content _id")

      return {
        friend: friend._id,
        room: room,
        name: friend.userName,
        avatar:friend.profile,
        isGroup:false
      };
    })
  );

  res.status(200).json(
    new ApiResponse(200, "Fetched all user rooms successfully", contacts)
  );
});


const renameGroupRoom = asyncHandler(async (req,res) => {

    const {newName,roomId} = req.body
    const userId = req.user._id

    if(!newName || !roomId) {
        throw new ApiError(400,"new name and id is required is required")
    }

    if(!mongoose.Types.ObjectId.isValid(roomId)) {
        throw new ApiError(400,"Invalid roomId")
    }

    try {
        
        const room = await Room.findById(roomId)
    
        if(!room) {
            throw new ApiError(404,"room not found")
        }
    
        if(room.isGroupChat === false) {
            throw new ApiError(400,"This is not a room chat")
        }
    
        if(room.groupAdmin.toString() !== userId.toString()) {
            throw new ApiError(401,"You are not room admin")
        }
    
        if(room.roomName === newName) {
            throw new ApiError(400,"This name is already exists")
        }
    
        room.roomName = newName
        room.save({validateBeforeSave:false})
    
        res.
        status(200).
        json(new ApiResponse(200,"Room name updated successfully",room))

    } 
    catch (error) {
        console.log("Error: ",error)
        throw new ApiError(400,"Room name not updated",error)
    }
    
})

const addToGroup = asyncHandler(async (req,res) => {
    const {groupId,participateId} = req.body
    const userId = req.user._id

    if(!groupId || !participateId) {
        throw new ApiError(400,"groupId and participantId is required")
    }

    try {
        const userExisted = await User.findById(participateId)
        
    
        if(!userExisted) {
            throw new ApiError(404,"Participate Id doesn't found")
        }
    
        const groupExisted = await Room.findById(groupId)

        if(groupExisted.isGroupChat === false) {
            throw new ApiError(400,"this is not a group chat")
        }

        if(groupExisted.groupAdmin.toString() !== userId.toString()) {
            throw new ApiError(401,"You are not room admin")
        }
    
        if(!groupExisted) {
            throw new ApiError(404,"Group not exists")
        }

        if(groupExisted.members.some((member) => member.toString() === participateId.toString())) {
            throw new ApiError(401,"This ParticipateId already exists in room")
        }
    
        groupExisted.members.push(participateId)
        
        groupExisted.save({validateBeforeSave:false})
    
        res
        .status(200)
        .json(new ApiResponse(200,"Successfully add to group"))
    } catch (error) {
        throw new ApiError(400,"Cant add participate in the room")
    }
})

const removeToGroup = asyncHandler(async (req,res) => {
    const {groupId,participateId} = req.body
    const userId = req.user._id

    if(!groupId || !participateId) {
        throw new ApiError(400,"groupId and participantId is required")
    }

    try {
        const userExisted = await User.findById(participateId)
        
    
        if(!userExisted) {
            throw new ApiError(404,"Participate Id doesn't found")
        }
    
        const groupExisted = await Room.findById(groupId)

        if(groupExisted.isGroupChat === false) {
            throw new ApiError(400,"this is not a group chat")
        }

        if(groupExisted.groupAdmin.toString() !== userId.toString()) {
            throw new ApiError(401,"You are not room admin")
        }
    
        if(!groupExisted) {
            throw new ApiError(404,"Group not exists")
        }

        if(!(groupExisted.members.some((member) => member !== participateId))) {
            throw new ApiError(401,"This ParticipateId not in group")
        }        
    
        const updatedMember = groupExisted.members

        const updatedMembers = updatedMember.filter((member) => member.toString()!==participateId)

        groupExisted.members = updatedMembers
        
        groupExisted.save({validateBeforeSave:false})

        console.log("updatedMembers",updatedMembers)
        console.log("groupExisted.members",groupExisted.members)
    
        res
        .status(200)
        .json(new ApiResponse(200,"Successfully removed participateId from group"))
    } catch (error) {
        console.log("Error: ",error)
        throw new ApiError(400,"Cant remove participate from the room")
    }
})

const deleteRoom = asyncHandler(async (req,res) => {
    const {roomId} = req.body
    const userId = req.user._id

    if(!roomId) {
        throw new ApiError(400,"roomId is required")
    }

    if(!mongoose.Types.ObjectId.isValid(roomId)) {
        throw new ApiError(400,"Invalid roomId")
    }

    try {
        const room = await Room.findById(roomId)

        if(!room) {
            throw new ApiError(404,"Room not found")
        }

        if(!room.isGroupChat) {
            await Message.deleteMany({room:room._id})
            await Room.findByIdAndDelete(room._id)

            const user1 = room.members[0],user2 = room.members[1]
            const request = await Request.findOne({
                $or:[
                    {
                        sender:user1,
                        receiver:user2
                    },
                    {
                        sender:user2,
                        receiver:user1
                    }
                ]
            })

            request.status = "rejected"

            request.save({validateBeforeSave:false})
        }

        if(room.isGroupChat) {
            if(room.groupAdmin.toString() !== userId.toString()) {
                throw new ApiError(401,"You are not room admin")
            }
            await Message.deleteMany({room:room._id})
            await Room.findByIdAndDelete(room._id)
        }

        res
        .status(200)
        .json(new ApiResponse(200,"Room deleted successfully"))
    } catch (error) {
        console.log("Error: ",error)
        throw new ApiError(400,"Room not deleted",error)
    }
})

export {
    createRoom,
    getMyRooms,
    renameGroupRoom,
    addToGroup,
    removeToGroup,
    deleteRoom
}