import { Router } from "express";
import {
   loginUser,
   logoutUser,
   refreshAccessToken,
   registerUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

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

router.route("/login").post(loginUser);

//secure routes
router.route("/logout").post(verifyJWT, logoutUser); //next() will automatically pass on to the logout controller
router.route("/refresh-Token").post(refreshAccessToken);

export default router;
