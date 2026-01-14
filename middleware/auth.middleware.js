import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import {ApiError} from '../utils/ApiError.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import cookieParser from 'cookie-parser';



const verifyToken = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.header("authorization")?.replace("Bearer ","")
    if(!token) {
        throw new ApiError(401,"Unauthorized! Please login to access this resource.")
    }

    try {
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken.id).select("-password")

        if(!user) {
            throw new ApiError(401,"Unauthorized! Please login to access this resource.")
        }

        req.user = user

        next()


    } catch (error) {
        throw new ApiError(401,"Unauthorized! Please login to access this resource.")
    }
})


export {verifyToken}