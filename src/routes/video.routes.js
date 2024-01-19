import { Router } from "express";

import {
   deleteVideo,
   getAllVideos,
   getVideoById,
   publishAVideo,
   togglePublishStatus,
   updateVideo,
} from "../controllers/video.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Apply verifyJWT middleware to all routes in this file
router.use(verifyJWT);

router
   .route("/allVideos")
   .get(getAllVideos)
   .post(
      upload.fields([
         {
            name: "videoFile",
            maxCount: 1,
         },
         {
            name: "thumbnail",
            maxCount: 1,
         },
      ]),
      publishAVideo
   );

router
   .route("/:videoId")
   .patch(upload.single("thumbnail"), updateVideo)
   .delete(deleteVideo)
   .get(getVideoById);

router.route("/togglePublish/:videoId").patch(togglePublishStatus);

export default router;
