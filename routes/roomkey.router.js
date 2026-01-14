import { Router } from "express";
import { verifyToken } from '../middleware/auth.middleware.js';
import { get } from 'mongoose';
import { 
    saveRoomKey,
    getRoomKey
} from "../controllers/roomKey.controller.js";

const router = Router();

router.route("/:roomId/:userId").get(getRoomKey);
router.route("/saveRoomKey").post(verifyToken,saveRoomKey);

export default router;
