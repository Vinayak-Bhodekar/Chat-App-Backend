import mongoose, { Schema } from 'mongoose';    

const roomSchema = new mongoose.Schema({
    roomName: {
        type: String
    },
    isGroupChat: {
        type: Boolean,
        required: true
    },
    members: [
        {
        type:mongoose.Schema.Types.ObjectId,
        ref: "User"
        },
    ],
    groupAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Message"
    },
    avatar:{
        type: String
    }   
},
{
    timestamps: true
})

export const Room = mongoose.model("Room", roomSchema)
