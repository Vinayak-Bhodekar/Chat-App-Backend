import { healthCheck } from "../controllers/healthcheck.controller.js";

import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = Router()

router.route("/").get(healthCheck)

export default router
