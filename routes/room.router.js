import { Room } from "../models/room.model.js";
import Router from "express";
import {verifyToken} from "../middleware/auth.middleware.js"

import {
    createRoom,
    getMyRooms,
    renameGroupRoom,
    addToGroup,
    removeToGroup,
    deleteRoom
} from "../controllers/room.controller.js"

const router = Router();

router.route("/createRoom").post(verifyToken,createRoom)
router.route("/getMyRooms").get(verifyToken,getMyRooms)
router.route("/renameGroup").patch(verifyToken,renameGroupRoom)
router.route("/addToGroup").patch(verifyToken,addToGroup)
router.route("/removeToGroup").patch(verifyToken,removeToGroup)
router.route("/deleteRoom").delete(verifyToken,deleteRoom)

export default router;