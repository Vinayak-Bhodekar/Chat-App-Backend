import mongoose, {Mongoose, Schema} from "mongoose"
import { User } from "./user.model.js"
const requestSchema = new mongoose.Schema({
    receiver : {
        type:mongoose.Schema.Types.ObjectId,
        ref:User,
        required:true
    },

    sender : {
        type:mongoose.Schema.Types.ObjectId,
        ref:User,
        required:true
    },

    status : {
        type : String,
        enum : ["pending","accepted","rejected"],
        required: true
    }
})

export const Request = mongoose.model("Request",requestSchema)