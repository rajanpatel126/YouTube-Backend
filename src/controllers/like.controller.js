import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/likes.models.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
   const { videoId } = req.params;

   if (!isValidObjectId(videoId)) {
      throw new ApiErrors(400, "Invalid VideoId");
   }

   const likeAlready = await Like.findOne({
      video: videoId,
      likedBy: req.user?._id,
   });

   if (likeAlready) {
      await Like.findByIdAndDelete(likeAlready?._id);

      return res
         .status(200)
         .json(
            new ApiResponse(201, { liked: false }, "Video Unliked Successfully")
         );
   }

   await Like.create({
      video: videoId,
      likedBy: req.user?._id,
   });

   return res
      .status(200)
      .json(new ApiResponse(201, { liked: true }, "Video Liked Successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
   const { commentId } = req.params;

   if (!isValidObjectId(commentId)) {
      throw new ApiErrors(400, "Invalid CommentId");
   }

   const likeAlready = await Like.findOne({
      comment: commentId,
      likedBy: req.user?._id,
   });

   if (likeAlready) {
      await Like.findByIdAndDelete(likeAlready?._id);

      return res
         .status(200)
         .json(
            new ApiResponse(
               201,
               { commented: false },
               "Comment Unliked Successfully"
            )
         );
   }

   await Like.create({
      comment: commentId,
      likedBy: req.user?._id,
   });

   return res
      .status(200)
      .json(
         new ApiResponse(201, { commented: true }, "Comment Liked Successfully")
      );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
   const { tweetId } = req.params;

   if (!isValidObjectId(tweetId)) {
      throw new ApiErrors(400, "Invalid TweetId");
   }

   const likeAlready = await Like.findOne({
      tweet: tweetId,
      likedBy: req.user?._id,
   });

   if (likeAlready) {
      await Like.findByIdAndDelete(likeAlready?._id);

      return res
         .status(200)
         .json(
            new ApiResponse(
               201,
               { tweeted: false },
               "Unlike Tweet Successfully"
            )
         );
   }

   await Like.create({
      tweet: tweetId,
      likedBy: req.uer?._id,
   });

   return res
      .status(200)
      .json(
         new ApiResponse(201, { tweeted: true }, "Tweet Liked Successfully")
      );
});

const getLikedVideos = asyncHandler(async (req, res) => {
   //TODO: get all liked videos

   const likedVideos = await Like.aggregate([
      {
         $set: {
            owner: new mongoose.Types.ObjectId(req.user?._id),
         },
      },
      {
         $lookup: {
            from: "videos",
            foreignField: "_id",
            localField: "video",
            as: "videos",

            pipeline: [
               {
                  $lookup: {
                     from: "users",
                     foreignField: "_id",
                     localField: "owner",
                     as: "ownerDetails",
                  },
               },
               {
                  $unwind: "$ownerDetails",
               },
            ],
         },
      },
      {
         $unwind: "$videos",
      },
      {
         $sort: {
            createdAt: -1,
         },
      },
      {
         $project: {
            videos: {
               "videoFile.url": 1,
               "thumbnail.url": 1,
               owner: 1,
               title: 1,
               description: 1,
               views: 1,
               duration: 1,
               createdAt: 1,
               isPublished: 1,

               ownerDetails: {
                  username: 1,
                  fullName: 1,
                  "avatar?.url": 1,
               },
            },
         },
      },
   ]);

   if (!likedVideos) {
      throw new ApiErrors(500, "Failed to fetch Liked Videos");
   }

   return res
      .status(200)
      .json(
         new ApiResponse(201, likedVideos, "Liked videos fetched Successfully")
      );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
