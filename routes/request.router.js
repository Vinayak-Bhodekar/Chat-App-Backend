import Router from "express";
import {
    createRequest,
    requestStatus,
    acceptRequest,
    rejectRequest,
    incommingRequests,
    getRequestByUserSender,
    getAllRequests
} from "../controllers/request.controller.js"
import { verifyToken } from "../middleware/auth.middleware.js";

const router = Router()

router.route("/createRequest").post(verifyToken,createRequest)
router.route("/requestStatus").post(verifyToken,requestStatus)
router.route("/acceptRequest").post(verifyToken,acceptRequest)
router.route("/rejectRequest").post(verifyToken,rejectRequest)
router.route("/incomingRequests").get(verifyToken,incommingRequests)
router.route("/getRequestBySender").post(getRequestByUserSender)
router.route("/getAllRequest").get(verifyToken,getAllRequests)

export default router;