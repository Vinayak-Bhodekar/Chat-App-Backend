import {User} from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import OTPGenerator from "../utils/OTPGenerator.js";
import sendOTP from "../utils/sendEmails.js";
import { Request } from "../models/request.models.js";
import { socket } from "../server.js"
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";


let otpStore = {};

const userProfile = asyncHandler(async (req,res) => {

    const userId = req?.user._id.toString()
    
    if(!userId) {
        throw new ApiError(400,"userId is required")
    }

    const profileLocalPath = req.file?.path || null
    
    
    if(!profileLocalPath) {
        throw new ApiError(400,"profile is required")
    }

    let profile;

    try {
        profile = await uploadOnCloudinary(profileLocalPath)
        const user = await User.findById(userId)

        if(!user) {
            throw new ApiError(404,"user Not found")
        }

        if(user.profilePublicId) {
            await deleteFromCloudinary(user.profilePublicId)
        }

        user.profile = profile.url
        user.profilePublicId = profile.public_id

        await user.save({validateBeforeSave:false})

        

        return res
        .status(200)
        .json(new ApiResponse(200, "Profile updated successfully",profile));
        
    } catch (error) {
        throw new ApiError(500,"failed to load Avatar",error)
    }

    
})

const generateAccessAndRefreshToken = async (userId) => {

    try {
        const user = await User.findOne({_id:userId})
    
        if(!user) {
            throw new ApiError(404,"User not found")
        }
    
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
    
        await user.save({validateBeforeSave:false})
        return {accessToken,refreshToken}

    } catch (error) {

        console.log("error in generating access and refresh token",error)
        throw new ApiError(500,"Internal server error")
    }
}

const registerUser = asyncHandler(async (req,res) => {
    
    const {userName,password,email,firstName,lastName,publicKey} = req.body

    if([userName,password,email,firstName,lastName].some((field) => field?.trim() === "")) {
        throw new ApiError(400,"All fields are required")
    }


    const existingUser = await User.findOne({
        $or: [
            {userName: userName},
            {email: email}
        ]
    })

    if(existingUser) {
        throw new ApiError(400,"User already exists")
    }

    

    try {
        const user = await User.create({
            userName:userName,
            password:password,
            email:email,
            firstName:firstName,
            lastName:lastName,
            bio:"Hey there! I’m using the chat app ",
            publicKey:publicKey
        })
    
        if(!user) {
            throw new ApiError(400,"User not created")
        }

        res
        .status(201)
        .json(new ApiResponse(201,"User created successfully",user))

    } catch (error) {
        throw new ApiError(501,"Internal server error",error)
    }

})

const logInUser = asyncHandler(async (req,res) => {

    const {identity,password} = req.body

    if(!identity || !password) {
        throw new ApiError(400,"Email and password are required")
    }

    const user = await User.findOne({
        $or:[{email:identity},{userName:identity}]
    }).select("+password")

    if(!user) {
        throw new ApiError(401,"Invalid email or password")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if(!isPasswordCorrect) {
        throw new ApiError(401,"Invalid credentials")
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)

    user.refreshToken = refreshToken

    await user.save({validateBeforeSave:false})

    const option = {
        httpOnly:true,
        secure:process.env.NODE_ENV === "production",
        sameSite:"none"
    }

    return res.status(200)
    .cookie("refreshToken",refreshToken,option)
    .cookie("accessToken",accessToken,option)
    .json(new ApiResponse(200,"User logged in successfully",user))
})

const logOutUser = asyncHandler(async (req, res) => {
  const userId = req?.user._id;

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        refreshToken: null,
        socketId: null,
        status: "Offline",
      },
    },
    { new: true }
  );

  if (user) {
    socket.emit("user:status", { userId, status: "Offline" });
  }

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  res
    .status(200)
    .cookie("refreshToken", null, options)
    .cookie("accessToken", null, options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req,res) => {
    const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    

    if(!incommingRefreshToken) {
        throw new ApiError(401,"Unauthorized access")
    }

    try {
        
        const decodedToken = jwt.verify(incommingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        
        const user = await User.findById(decodedToken.id).select("+refreshToken")

        if(!user) {
            throw new ApiError(401,"Unauthorized access")
        }

        if(user.refreshToken !== incommingRefreshToken) {
            throw new ApiError(401,"Unauthorized access")
        }
        const {accessToken} = await generateAccessAndRefreshToken(user._id)
        
        const option = {
            httpOnly:true,
            secure:process.env.NODE_ENV === "production"
        }

        res
        .status(200)
        .cookie("accessToken",accessToken,option)
        .json(new ApiResponse(200,"Access token refreshed successfully"))

    } catch (error) {
        throw new ApiError(401,"Unauthorized access",error)
    }
})

const changePasssword = asyncHandler(async (req,res) => {
    const {oldPassword,newPassword} = req.body

    if(!oldPassword || !newPassword) {
        throw new ApiError(400,"All fields are required")
    }

    try {
        const user = await User.findById(req.user._id).select("+password")
    
        if(!user) {
            throw new ApiError(404,"User not found")
        }
    
        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
        console.log("isPasswordCorrect",isPasswordCorrect)
    
        if(!isPasswordCorrect) {
            throw new ApiError(401,"Invalid credential")
        }
    
        user.password = newPassword
    
        await user.save({validateBeforeSave:false})
    
        res.status(200).json(new ApiResponse(200,"Password changed successfully"))
    } catch (error) {
        console.log("error in changing password",error)
        throw new ApiError(500,"Internal server error")
    }
})

const editUserInfo = asyncHandler(async (req,res) => {
    const userId = req?.user._id

    console.log("hello iam called")

    const {userName,email,firstName,lastName,bio} = req.body

    try {

        const user = await User.findById(userId)

        if(!user) {
            throw new ApiError(401,"User not found")
        }

        if (userName !== user.userName) {

            const existedUserName = await User.findOne({userName: userName
            })

            if(existedUserName) {
                throw new ApiError(400,"User Name ALready existed.",existedUserName)
            }

            user.userName = userName;
        }
        if(email !== user.email) {
            user.email = email;
        }
        if(firstName !== user.firstName) {
            user.firstName = firstName
        }
        if(lastName !== user.lastName) {
            user.lastName = lastName
        }
        if(bio !== user.bio) {
            user.bio = bio
        }

        await user.save({validateBeforeSave:false})

        res
        .status(200)
        .json(new ApiResponse(200,"change Data successfully",user))

        
    } catch (error) {
        console.log("Error in updating data",error)
        throw new ApiError(400,"Error in updating data",error)
    }
})

const getLoggedInUser = asyncHandler(async (req,res) => {
    const userId = req.user._id

    if(!userId) {
        throw new ApiError(404,"User not found")
    }

    try {
        const user = await User.findById(userId)
        
        if(!user) {
            throw new ApiError(400,"User not found")
        }
    
        res
        .status(200)
        .json(new ApiResponse(200,"user found",user))
    } catch (error) {
        console.log("no user found, error:-",error)
        throw new ApiError(404,"User Not found")
    }
})

const OTPsender = asyncHandler(async (req,res) => {

    const {email} = req.body
    
    

    if(!email) {
        throw new ApiError(400,"email is required")
    }

    try {

        const existedEmail = await User.findOne({email:email});
        
        if(existedEmail) {
            throw new ApiError(401, "email already existed")
        }

        const otp = OTPGenerator()
        otpStore[email] = {otp, expires: Date.now()+5*60*1000}
        console.log(otpStore)
        await sendOTP(email,otp)

        res
        .status(200)
        .json(new ApiResponse(200,"OTP is sent to Email successfully"))


        
    } catch (error) {
        console.log("Cant Send OTP",error)
        throw new ApiError(400,"Cant Send OTP",error)
    }
})

const OTPVerification = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  const email = req.body.email;

  if (!otp) {
    throw new ApiError(400, "OTP is required");
  }

  const otpData = otpStore[email];

  if (!otpData) {
    throw new ApiError(400, "OTP not found or expired");
  }

  if (otpData.expires < Date.now()) {
    delete otpStore[email];
    throw new ApiError(400, "OTP expired");
  }
  
  if (parseInt(otp) !== otpData.otp) {
    throw new ApiError(401, "Invalid OTP");
  }

  // ✅ OTP verified
  delete otpStore[email];

  res.status(200).json(
    new ApiResponse(200, "OTP verified successfully")
  );
});


const getAllUser = asyncHandler(async (req, res) => {
  const userId = req.user?._id

  if (!userId) {
    throw new ApiError(401, "Unauthorized access")
  }

  const users = await User.find({ _id: { $ne: userId } })
    .select("userName email")
    .lean()

  const requests = await Request.find({
    $or: [{ sender: userId }, { receiver: userId }]
  }).lean()

  const usersWithStatus = users.map(user => {
    const request = requests.find(r =>
      (r.sender.toString() === userId.toString() &&
       r.receiver.toString() === user._id.toString()) ||
      (r.receiver.toString() === userId.toString() &&
       r.sender.toString() === user._id.toString())
    )

    return {
      ...user,
      status: request ? request.status : "none"
    }
  })

  res.status(200).json(
    new ApiResponse(200, "Get all users successfully", usersWithStatus)
  )
})

const getUserInfo = asyncHandler(async (req,res) => {
    const userId = (req.user?._id).toString()
    if(!userId) {
        throw new ApiError(400,"user id is required")
    }
    try {

        const user = await User.findById(userId)

        if(!user) {
            throw new ApiError(404,"User not found")
        }
        
        res
        .status(200)
        .json(new ApiResponse(200,"fetched user Info successfully",user))
        
    } catch (error) {
        throw new ApiError(400,"error in fetching user info",error)
    }
})

const getUserInfoById = asyncHandler(async (req,res) => {
    const {userId} = req.body
    if(!userId) {
        throw new ApiError(400,"user id is required")
    }
    try {

        const user = await User.findById(userId).select("_id")

        if(!user) {
            throw new ApiError(404,"User not found")
        }
        
        res
        .status(200)
        .json(new ApiResponse(200,"fetched user Info successfully",user))
        
    } catch (error) {
        throw new ApiError(400,"error in fetching user info",error)
    }
})

export {
    registerUser,
    logInUser,
    logOutUser,
    refreshAccessToken,
    changePasssword,
    getLoggedInUser,
    OTPsender,
    OTPVerification,
    editUserInfo,
    getAllUser,
    getUserInfo,
    userProfile,
    getUserInfoById
}