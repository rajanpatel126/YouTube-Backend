import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import {
   getVideoComments,
   addComment,
   updateComment,
   deleteComment,
} from "../controllers/comment.controller.js";

const router = Router();

// Apply verifyJWT middleware to all routes in this file
router.use(verifyJWT);

router.route("/:videoId").get(getVideoComments).post(addComment);
router.route("/c/:commentId").delete(deleteComment).patch(updateComment);

export default router;
