import { Router } from "express";

import {
   getChannelStats,
   getChannelVideos,
} from "../controllers/dashboard.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";

const router = Router();

// Apply verifyJWT middleware to all routes in this file
router.use(verifyJWT, upload.none());

router.route("/stats").get(getChannelStats);
router.route("/videos").get(getChannelVideos);

export default router;
