import { User } from "../models/user.model.js";
import { Request } from "../models/request.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Room } from "../models/room.model.js";

const createRequest = asyncHandler(async (req,res) => {
    const userId = req.user._id

    const {receiver} = req.body

    if(!receiver) {
        throw new ApiError(400,"receiver is required")
    }

    try {
        const existedRequest = await Request.findOne({
            $or:[
                {
                    sender:userId,
                    receiver:receiver
                },
                {
                    sender:receiver,
                    receiver:userId
                }
            ]
        })
        console.log("existedRequest-",existedRequest)
        
        if(existedRequest) {
            existedRequest.status = "pending"
            existedRequest.save({validateBeforeSave:false})

            res
            .status(200)
            .json(new ApiResponse(200,"Successfully update request",existedRequest))
        }

        const newRequest = await Request.create({
            receiver:receiver,
            sender:userId,
            status:"pending"
        })

        if(!newRequest) {
            throw new ApiError(400,"Can't make the Request")
        }

        res
        .status(200)
        .json(new ApiResponse(200,"Request created successfully",newRequest))
    } catch (error) {
        console.log("cant create the request", error)
        throw new ApiError(400,"cant create the request", error)
    }
})

const requestStatus = asyncHandler(async (req,res) => {
    const userId = req.user._id

    const {receiver} = req.body

    if(!receiver) {
        throw new ApiError(400,"receiver is required")
    }

    try {
        const existedRequest = await Request.findOne({
                sender:userId,
                receiver:receiver
        })
        
        if(!existedRequest) {
            throw new ApiError(401,"request not exist")
        }

        res
        .status(200)
        .json(new ApiResponse(200,"Request already exist",existedRequest.status))
    } catch (error) {
        console.log("request not exist", error)
        throw new ApiError(404,"request not exist", error)
    }
})

const acceptRequest = asyncHandler(async (req,res) => { 
    const userId = req.user._id
    const {requestId} = req.body
    console.log("restApi called")

    if(!requestId) {
        throw new ApiError(404,"Request id is required")
    }

    try {
        const request = await Request.findById(requestId)

        if(!request) {
            throw new ApiError(400,"request doesn't found")
        }

        const senderId = request.sender;

        request.status = "accepted"

        request.save({validateBeforeSave:false})

        let room = await Room.findOne({
            members:{$all:[userId,senderId]}
        })

        if(!room) {
            room = await Room.create({
                members:[userId,senderId],
                isGroupChat:false
            })
        }

        res
        .status(200)
        .json(new ApiResponse(200,"Request accepted Successfully and room created",room))

    } catch (error) {
        throw new ApiError(400,"error in accepting request",error)
    }

})

const rejectRequest = asyncHandler(async (req,res) => {
    const userId = req.user._id
    const {requestId} = req.body

    console.log("hi",requestId)

    if(!requestId) {
        throw new ApiError(404,"Request id is required")
    }

    try {
        const request = await Request.findById(requestId)
        
        console.log(request)

        if(!request) {
            throw new ApiError(400,"request doesnt found")
        }

        request.status = "rejected"

        request.save({validateBeforeSave:false})

        console.log(request)

        res
        .status(200)
        .json(new ApiResponse(200,"Request rejected Successfully",request))



    } catch (error) {
        throw new ApiError(400,"error in rejecting request",error)
    }

})

const incommingRequests = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    const requests = await Request.find({
      receiver: userId,
      status: "pending"
    });

    const senderIds = requests.map(req => req.sender);

    const users = await User.find(
      { _id: { $in: senderIds } },
      "userName email publicKey _id"
    );

    const userMap = {};
    users.forEach(user => {
      userMap[user._id] = user;
    });

    const response = requests.map(req => ({
      _id: req._id,
      status: req.status,
      sender: {
        userName: userMap[req.sender].userName,
        email: userMap[req.sender].email,
        publicKey: userMap[req.sender].publicKey,
        _id: userMap[req.sender]._id
      }
    }));

    res
      .status(200)
      .json(new ApiResponse(200, "Requests fetched successfully", response));

  } catch (error) {
    throw new ApiError(400, "Error in fetching Requests", error);
  }
});


const getAllRequests = asyncHandler(async (req,res) => {
    const userId = req.user._id
    

    try {
        const requests = await Request.find({
            $or:[{sender:userId},{receiver:userId}]
            //status:"pending"
        })
        if(requests.length === 0) {
            console.log("no Requests found")
            res
            .status(200)
            .json(new ApiResponse(200,"no Requests found",requests))
            return;
        }

        res
        .status(200)
        .json(new ApiResponse(200,"Requests fetched successfully",requests))
    } catch (error) {
        throw new ApiError(400,"Error in fetching Requests",error)
    }
})

const getRequestByUserSender = asyncHandler(async (req,res) => {

    const {friendId} = req.body
    
    if(!friendId) {
        throw new ApiError(400,"Friend id is required")
    }

    try {
        const request = await Request.findOne({sender:friendId})

        if(!request) {
            throw new ApiError(404,"No request found")
        }

        res
        .status(200)
        .json(new ApiResponse(200,"fetch requests successfully",request))
    } catch (error) {
        throw new ApiError(401,"error in fetching request",error)
    }
})



export {
    createRequest,
    requestStatus,
    rejectRequest,
    acceptRequest,
    incommingRequests,
    getRequestByUserSender,
    getAllRequests
}