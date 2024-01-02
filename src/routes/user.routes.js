import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register").post(
   upload.fields([
      // not array because it will store all details in one. Here, different arrays depend upon different users
      {
         name: "avatar",
         maxCount: 1,
      },
      {
         name: "coverImage",
         maxCount: 1,
      },
   ]), //this is multer middleware which is for file handling of images
   registerUser
);

export default router;
