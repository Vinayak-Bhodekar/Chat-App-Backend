import mongoose from "mongoose";

const roomKeySchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required:true,
    },

    encryptedRoomKeys: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        encryptedAESKey: {
          type: [Number], // RSA-encrypted AES key
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

export const RoomKey = mongoose.model("RoomKey", roomKeySchema);
