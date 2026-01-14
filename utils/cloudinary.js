import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import dotenv from "dotenv"

dotenv.config()

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_API_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret:process.env.CLOUDINARY_API_SECRET
})


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null

        const response = await cloudinary.uploader.upload(
            localFilePath,
            {
                resource_type: "auto"
            }
        )

        console.log("file uploaded on cloudinary. file sources ",response.url)

        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath)
        }

        return response
    } catch (error) {
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath)
        }

        return null   
    }
}

const deleteFromCloudinary = async (publicId, resourceType = "image") => {
    try {
        const result = await cloudinary.uploader.destroy(publicId,{resource_type:resourceType})
        console.log("file deleted from cloudinary. public id:",publicId)
    } catch (error) {
        console.log("Error detecting from cloudinary ",error)
    }
}

export {uploadOnCloudinary,deleteFromCloudinary,cloudinary}