import { Router } from "express";
import {
   changeUserPassword,
   getCorrectUser,
   getUserChannelProfile,
   getWatchHistory,
   loginUser,
   logoutUser,
   refreshAccessToken,
   registerUser,
   updateUserAvatar,
   updateUsercoverImage,
   updatedAccountDetails,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
   upload.fields([
      // fields because 2 images are as an input
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

router.route("/changePassword").post(verifyJWT, changeUserPassword);
router.route("/currentUser").get(verifyJWT, getCorrectUser);
router.route("/updateAccount").patch(verifyJWT, updatedAccountDetails);

router
   .route("/updateAvatar")
   .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router
   .route("/updatecoverImage")
   .patch(verifyJWT, upload.single("coverImage"), updateUsercoverImage);

//when the data comes from the params...
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);
router.route("/watchHistory").get(verifyJWT, getWatchHistory);

export default router;
