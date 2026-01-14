import { RoomKey } from "../models/roomKey.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getRoomKey = asyncHandler(async (req, res) => {
  const { roomId, userId } = req.params;


  if (!roomId || !userId) {
    throw new ApiError(400, "roomId and userId are required");
  }

  // Find room key document
  try {
    const roomKey = await RoomKey.findOne({roomId:roomId}).select("encryptedRoomKeys");

    if (!roomKey) {
        throw new ApiError(404, "RoomKey not found");
    }
    // Find encrypted AES key for this user
    const userRoomKey = roomKey.encryptedRoomKeys.find(
        (key) => key.user.toString() === userId.toString()
    );

    if (!userRoomKey) {
        throw new ApiError(404, "No encrypted key found for this user");
    }

    

    // Respond ONLY what client needs
    res.status(200).json(
        new ApiResponse(200, "Room key found", {
        roomId,
        encryptedAESKey: userRoomKey.encryptedAESKey,
        })
    );
  } catch (error) {
        throw new ApiError(400,"error in getting roomKey",error)
  }


});


const saveRoomKey = asyncHandler(async (req,res) => {
    const {roomId,encryptedAESKey} = req.body;
    const user = req?.user?._id

    if(!roomId) {
        throw new ApiError(400,"roomId is Required");
    }
    if(!encryptedAESKey) {
        throw new ApiError(400,"encryptedAESKey is Required");
    }

    try {
        const roomKey = await RoomKey.create({
            roomId:roomId,
            userId:user,
            encryptedAESKey:encryptedAESKey
        })

        if(!roomKey) {
            throw new ApiError(400,"roomKey cant be created");
        }

        res.status(200).json(200,"roomKey created successfully",roomKey)
    } catch (error) {
        throw new ApiError(400,"error in creating roomKey",error);
    }
})

export {
    saveRoomKey,
    getRoomKey
}