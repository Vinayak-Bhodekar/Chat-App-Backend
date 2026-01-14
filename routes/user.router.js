import Router from 'express';
import {
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
} from '../controllers/user.controller.js';

import { verifyToken } from '../middleware/auth.middleware.js';
import { get } from 'mongoose';
import { upload } from '../middleware/multer.middleware.js';

const router = Router()

router.route("/register").post(registerUser)
router.route("/login").post(logInUser)
router.route("/logout").get(verifyToken,logOutUser)
router.route("/refreshtoken").get(verifyToken,refreshAccessToken)
router.route("/changepassword").post(verifyToken,changePasssword)
router.route("/loggedUser").get(verifyToken,getLoggedInUser)
router.route("/OTPsender").post(OTPsender)
router.route("/OTPVerification").post(OTPVerification)
router.route("/editProfile").post(verifyToken,editUserInfo)
router.route("/getAllUsers").get(verifyToken,getAllUser)
router.route("/getUserInfo").post(verifyToken,getUserInfo)
router.route("/userProfile").post(verifyToken,upload.single("profile"),userProfile)
router.route("/getUserInfoByID").get(getUserInfoById)



export default router