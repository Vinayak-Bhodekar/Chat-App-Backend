import mongoose, {Schema} from "mongoose"

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },

    content: {
      cipherText: {
        type: [Number],
        required: true,
      },
      iv: {
        type: [Number],
        required: true,
      },
    },

    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        reaction: {
          type: String,
          enum: ["like", "dislike", "love", "laugh", "sad", "angry"],
          required: true,
        },
      },
    ],

    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message",messageSchema)