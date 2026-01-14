import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const {Schema} = mongoose

const userSchema = new Schema({
    userName : {
        type: String, 
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        },
    profile : {
        type:String,
    },
    profilePublicId : {
        type:String
    },
    bio : {
        type: String,
    },
    password : {
        type: String,
        required: true,
        },
    email : {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        },
    firstName : {
        type: String,
        required: true,
        trim: true,
        },      
    lastName : {    
        type: String,
        required: true,
        trim: true
        },
    isVarified:{
        type: Boolean,
        default: false
    },
    socketId: {
        type:String,
        default:null
        },
    refreshToken: {
        type:String
    },
    publicKey: {
        type:String,
        required:true
    }
    },
    {
        timestamps:true
    })

userSchema.pre("save",async function(next) {
    if(!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password,this.password)
}


userSchema.methods.generateAccessToken = function() {
    return jwt.sign({
        id:this._id,
        userName:this.userName,
        email:this.email,
        firstName:this.firstName,
        lastName:this.lastName,
        socketId:this.socketId
    },
    process.env.ACCESS_TOKEN_SECRET,
    {expiresIn:process.env.ACCESS_TOKEN_EXPIRES}
)
}
userSchema.methods.generateRefreshToken = function() {
    return jwt.sign({
        id:this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {expiresIn:process.env.REFRESH_TOKEN_EXPIRES}
)
}

export const User = mongoose.model("User",userSchema)