import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";

import {
   uploadToCloudinary,
   deleteFromCloudinary,
} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
   try {
      const user = await User.findById(userId);
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();

      user.refreshToken = refreshToken; //token saved in user

      await user.save({ validateBeforeSave: false }); //token saved in Db.
      //validateBeforeSave is used because using save method, all fields of model will be kick-in as we are changing only one field, so we need this validateBeforeSave=false
      return { accessToken, refreshToken };
   } catch (error) {
      throw new ApiErrors(
         500,
         "Something went wrong while generating Access and Refresh tokens"
      );
   }
};

const registerUser = asyncHandler(async (req, res) => {
   //get the user details
   //check weather empty or not
   //check weather user already exist? username, email
   //check for images and avatar
   //upload them to cloudinary ,
   //create a user object- store in db
   //check for creation
   //encrypted password and refresh token field removal
   //return the response

   const { username, email, fullName, password } = req.body;
   console.log("body", req.body);
   if (
      [username, email, fullName, password].some(
         (field) => field?.trim() === ""
      )
   ) {
      throw new ApiErrors(400, "All fields are required");
   }
   const existedUser = await User.findOne({
      $or: [{ username }, { email }],
   });
   if (existedUser) {
      throw new ApiErrors(409, "User with Email or username already exist");
   }
   console.log("files", req.files); //middleware accessibilty through req.files

   const avatarLocalFilePath = req.files?.avatar[0]?.path;
   //why files? because we are taking more than one file avatar and coverImage

   // let avatarLocalFilePath;
   // if (
   //    req.files &&
   //    Array.isArray(req.files.avatar) &&
   //    req.files.avatar.length > 0
   // ) {
   //    avatarLocalFilePath = req.files.avatar[0]?.path;
   // }

   // const coverLocalFilePath = req.files?.coverImage[0]?.path;
   //we might get the undefined error at this point, mistake of Js not Node
   let coverLocalFilePath;
   if (
      req.files &&
      Array.isArray(req.files.coverImage) &&
      req.files.coverImage.length > 0
   ) {
      coverLocalFilePath = req.files.coverImage[0]?.path;
   }
   if (!avatarLocalFilePath) {
      throw new ApiErrors(400, "Avatar file is required");
   }

   const avatar = await uploadToCloudinary(avatarLocalFilePath);
   const coverImage = await uploadToCloudinary(coverLocalFilePath);

   if (!avatar) {
      throw new ApiErrors(400, "Avatar file is required");
   }

   const user = await User.create({
      email,
      password,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      username: username.toLowerCase(),
      fullName,
   });

   const createdUser = await User.findById(user._id).select(
      "-password -refreshToken" //to remove such fields, this is the syntax
   );

   if (!createdUser) {
      throw new ApiErrors(
         500,
         "Internal Server Error while Registering the User"
      );
   }

   return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
   //getting data from req.body
   //username or email
   //check weather user exist or not
   //if exist, then check for the password correction
   //access and refreshtoken
   //send via cookies

   const { username, email, password } = req.body;

   if (!(username || email)) {
      throw new ApiErrors(400, "Username or Email is required");
   }

   const user = await User.findOne({
      $or: [{ username }, { email }],
   });

   if (!user) {
      throw new ApiErrors(404, "User doesnot exist");
   }

   const isPasswordValid = await user.isPasswordCorrect(password);

   if (!isPasswordValid) {
      throw new ApiErrors(401, "Invalid User credentials");
   }

   const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
   );
   //now method is defined somewhere else, we have the refrence of 125 user, which has nothing
   //either we can update it or else we can once again call the database to save those details

   const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
   );

   const options = {
      httpOnly: true,
      secure: true,
   };

   return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, { httpOnly: true, secure: true })
      .json(
         new ApiResponse(
            200,
            {
               user: loggedInUser,
               accessToken,
               refreshToken, // why again sending the tokens to the user? in case if user wants to save it into local-storage, or in mobile application where cookies won't work, so better to send
            },
            "User Logged in Successfully"
         )
      );
});

//we don't know who the user is, we'll verify it by middleware and from there we'll check the tokens from cookes or header and take the id with us
const logoutUser = asyncHandler(async (req, res) => {
   //req.user._id; // my user id, I will access the whole object and delete the refreshtoken
   await User.findByIdAndUpdate(
      req.user._id,
      {
         $unset: {
            refreshToken: 1, //this will remove the field from the document
         },
      },
      {
         new: true,
      } // in response, we will get the new updated value, not the old
   );

   const options = {
      httpOnly: true,
      secure: true,
   };

   return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User LoggedOut"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
   const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

   if (!incomingRefreshToken) {
      throw new ApiErrors(401, "Unauthorized Request");
   }

   try {
      const decodedToken = jwt.verify(
         incomingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET
      );

      const user = await User.findById(decodedToken._id);

      if (!user) {
         throw new ApiErrors(401, "Invalid Refresh Token");
      }

      if (incomingRefreshToken !== user?.refreshToken) {
         throw new ApiErrors(401, "Refresh Token is used or Expired");
      }

      const { newrefreshToken, accessToken } =
         await generateAccessAndRefreshToken(user._id);

      const options = {
         httpOnly: true,
         secure: true,
      };
      return res
         .status(200)
         .cookie("refreshToken", newrefreshToken, options)
         .cookie("accessToken", accessToken, options)
         .json(
            new ApiResponse(201, accessToken, newrefreshToken),
            "Access Token Refreshed Successfully"
         );
   } catch (error) {
      throw new ApiErrors(401, error?.message || "Invalid Refresh Token");
   }
});

const changeUserPassword = asyncHandler(async (req, res) => {
   const { oldPassword, newPassword } = req.body;
   const user = await User.findById(req.user?._id);

   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

   if (!isPasswordCorrect) {
      throw new ApiErrors(400, "Password is Incorrect");
   }

   user.password = newPassword;
   await user.save((validateBeforeSave = false));

   return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password Change Successfully"));
});

const getCorrectUser = asyncHandler(async (req, res) => {
   return res
      .status(200)
      .json(200, req.user, "Current user fetched Successfully");
});

const updatedAccountDetails = asyncHandler(async (req, res) => {
   const { fullName, email } = req.body;

   if (!(fullName || email)) {
      throw new ApiErrors(400, "All fields are required");
   }

   const user = User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            fullName: fullName,
            email: email,
         },
      },
      { new: true }
   ).select("-password");

   return res
      .status(200)
      .json(new ApiResponse(201, user, "Account details updated Successfully"));
   //while changing the file(avatar), try to hit different end point for updating the file so that text data should not be repeted again and again
});

const updateUserAvatar = asyncHandler(async (req, res) => {
   const avatarLocalPath = req.file?.path;

   if (!avatarLocalPath) {
      throw new ApiErrors(400, "File is missing");
   }

   const avatar = uploadToCloudinary(avatarLocalPath);

   if (!avatar?.url) {
      throw new ApiErrors(400, "Error while uploading Avatar File");
   }

   const user = await User.findById(req.user._id).select("avatar");

   const oldAvatarUrl = user.avatar.public_id;

   const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            avatar: avatar.url,
         },
      },
      { new: true }
   ).select("-password");

   //deleting the old url of avatar file
   if (oldAvatarUrl && updatedUser.avatar.public_id) {
      await deleteFromCloudinary(oldAvatarUrl);
   }

   await deleteFromCloudinary(oldAvatarUrl);

   return res
      .status(200)
      .json(
         new ApiResponse(201, updatedUser, "Avatar file updated Successfully")
      );
});

const updateUsercoverImage = asyncHandler(async (req, res) => {
   const coverImageLocalPath = req.file?.path;

   if (!coverImageLocalPath) {
      throw new ApiErrors(400, "File is missing");
   }

   const coverImage = uploadToCloudinary(coverImageLocalPath);

   if (!coverImage?.url) {
      throw new ApiErrors(400, "Error while uploading coverImage File");
   }

   const user = await User.findById(req.user._id).select("coverImage");

   const coverImageToDelete = user.coverImage.public_id;

   const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            coverImage: coverImage.url,
         },
      },
      { new: true }
   ).select("-password");

   if (coverImageToDelete && updatedUser.coverImage.public_id) {
      await deleteFromCloudinary(coverImageToDelete);
   }
   return res
      .status(200)
      .json(
         new ApiResponse(
            201,
            updatedUser,
            "cover Image file updated Successfully"
         )
      );
});

//aggregation pipelines controllers
const getUserChannelProfile = asyncHandler(async (req, res) => {
   const { username } = req.params; //any channel name can be access by url

   if (!username?.trim()) {
      throw new ApiErrors(400, "Username is Missing");
   }

   //the whole pipeline is send to server without interrution of mongoose, directly used for processing
   const channel = await User.aggregate([
      //pipeline will return an array
      {
         $match: {
            username: username?.toLowerCase(),
         },
      },
      {
         //count of number of subscribers
         $lookup: {
            from: "subscriptions",
            // Subscription -> subscriptions, as the mongoDb change the name to lowecase and plural
            localField: "_id",
            foreignField: "channel",
            as: "Subscribers",
         },
      },
      {
         //count of number of users I have subscribed to
         $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "Subscribered To",
         },
      },
      {
         $addFields: {
            //these two fields will be added to user schema
            subscribersCount: {
               $size: "$Subscribers", //$ sign because now Subscribers has become field now
            },
            channelSubscribedToCount: {
               $size: "$Subscribered To",
            },
            isSubscribed: {
               $cond: {
                  //$in can look into the arrays and objects as well
                  if: { $in: [req.user?._id, "$Subscribers.subscriber"] },
                  then: true,
                  else: false,
               },
            },
         },
      },
      {
         //this is for to pass on selected fields in return
         $project: {
            fullName: 1,
            username: 1,
            subscribersCount: 1,
            channelSubscribedToCount: 1,
            isSubscribed: 1,
            avatar: 1,
            email: 1,
            coverImage: 1,
         },
      },
   ]);
   console.log(channel);

   if (!channel?.length) {
      throw new ApiErrors(400, "Channel Does not exist");
   }

   return res
      .status(200)
      .json(
         new ApiResponse(201, channel[0], "User Channel fetched Successfully")
      );
});

const getWatchHistory = asyncHandler(async (req, res) => {
   //we need user id, but because there is no mongoose here
   // req.user._id is a string, mongoose convert the id to string automatically
   //so we need to convert the string id to actual mongoose ID

   const user = await User.aggregate([
      {
         $match: {
            _id: new mongoose.Types.ObjectId(req.user._id),
         },
      },
      {
         $lookup: {
            from: "videos",
            localField: "watchHistory",
            foreignField: "_id",
            as: "Watch History",

            pipeline: [
               {
                  $lookup: {
                     from: "users",
                     localField: "owner",
                     foreignField: "_id",
                     as: "Owner",

                     pipeline: [
                        {
                           $match: {
                              fullName: 1,
                              username: 1,
                              avatar: 1,
                           },
                        },
                     ],
                  },
               },
               {
                  $addFields: {
                     owner: {
                        $first: "$Owner", //the field name which is defined as Owner
                     },
                  },
               },
            ],
         },
      },
   ]);

   return res.status(
      200,
      new ApiResponse(
         201,
         user[0].watchHistory,
         "Watch History fetched Successfully"
      )
   );
});

//User -> this one is a mongoose object so all the methods like findById, findOne will be accessed by User
//but userdefine method will not be accessed by this object
//accesstoken, refreshtoken will be with the user that we have accessed through mongoDb which is 'user'

export {
   registerUser,
   loginUser,
   logoutUser,
   refreshAccessToken,
   getCorrectUser,
   changeUserPassword,
   updatedAccountDetails,
   updateUserAvatar,
   updateUsercoverImage,
   getUserChannelProfile,
   getWatchHistory,
};
