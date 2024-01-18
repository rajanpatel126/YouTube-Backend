import mongoose, { isValidObjectId } from "mongoose";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";
import { Comment } from "../models/comment.models.js";

const getVideoComments = asyncHandler(async (req, res) => {
   const { videoId } = req.params;

   const { page = 1, limit = 10 } = req.query;

   if (!isValidObjectId(videoId)) {
      throw new ApiErrors(400, "Invaid videoId");
   }

   const video = await Video.findById(videoId);

   if (!video) {
      throw new ApiErrors(400, "failed to find the video");
   }

   const commentsAggregated = await Comment.aggregate([
      {
         $match: {
            owner: new mongoose.Types.ObjectId(videoId),
         },
      },
      {
         $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner",
         },
      },
      {
         $lookup: {
            from: "likes",
            foreignField: "comment",
            localField: "_id",
            as: "likes",
         },
      },
      {
         $addFields: {
            likesCount: {
               $sum: "$likes",
            },
            owner: {
               $first: "$owner",
            },
            isLiked: {
               $cond: {
                  $if: {
                     $in: [req.user?._id, "$likes.likedBy"],
                  },
                  then: true,
                  else: false,
               },
            },
         },
      },
      {
         $project: {
            content: 1,
            createdAt: 1,
            likesCount: 1,
            owner: {
               username: 1,
               "avatar.url": 1,
            },
            isLiked: 1,
         },
      },
   ]);

   const options = {
      page: parseInt(page, 1),
      limit: parseInt(limit, 10),
   };

   const comments = await Comment.aggregatePaginate(
      commentsAggregated,
      options
   );

   if (!comments) {
      throw new ApiErrors(500, "Failed to fetch the comments");
   }

   return res
      .status(200)
      .json(new ApiResponse(201, comments, "Comments fetched Successfully"));
});

const addComment = asyncHandler(async (req, res) => {
   const { videoId } = req.params;

   const { content } = req.body;

   if (!content) {
      throw new ApiErrors(400, "Comment is required");
   }

   const video = await Video.findById(videoId);

   if (!video) {
      throw new ApiErrors(400, "Video not found");
   }

   const comment = await Comment.create({
      content,
      video: videoId,
      owner: req.user?._id,
   });

   if (!comment) {
      throw new ApiErrors(500, "Failed to create comment");
   }

   return res
      .status(200)
      .json(new ApiResponse(201, comment, "Comment added Successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
   const { commentId } = req.params;

   const { content } = req.body;

   if (!content) {
      throw new ApiErrors(400, "Content is required");
   }

   const comment = await Comment.findById(commentId);

   if (!comment) {
      throw new ApiErrors(400, "Failed to find the comment");
   }

   if (comment?.owner?.toString() !== req.user?._id.toString()) {
      throw new ApiErrors(400, "Only Comment Owner can edit the Comment");
   }

   const updatedComment = Comment.findByIdAndUpdate(
      commentId,
      {
         $set: { content },
      },
      { new: true }
   );

   if (!updatedComment) {
      throw new ApiErrors(500, "Failed to update the comment");
   }

   return res
      .status(200)
      .json(
         new ApiResponse(201, updatedComment, "Comment Updated Successfully")
      );
});

const deleteComment = asyncHandler(async (req, res) => {
   const { commentId } = req.params;

   const comment = await Comment.findById(commentId);

   if (!comment) {
      throw new ApiErrors(400, "Failed to find the comment");
   }

   if (comment?.owner?.toString() !== req.user?._id.toString()) {
      throw new ApiErrors(400, "Only Comment Owner can delete the Comment");
   }

   await Comment.findByIdAndUpdate(commentId);

   return res
      .status(200)
      .json(new ApiResponse(201, {}, "Comment Updated Successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
