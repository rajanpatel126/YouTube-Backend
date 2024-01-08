import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
   deleteFromCloudinary,
   uploadToCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
   const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
   //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
   const { title, description } = req.body;
   // TODO: get video, upload to cloudinary, create video
});

const getVideoById = asyncHandler(async (req, res, next) => {
   //TODO: get video by id
   const { videoId } = req.params;
   try {
      const video = await Video.findById(videoId);

      if (!video) {
         throw new ApiErrors(404, "Video not found");
      }

      return res
         .status(200)
         .json(new ApiResponse(200, video, "Video found successfully"));
   } catch (error) {
      next(new ApiErrors(500, error?.message || "Internal Server Error"));
   }
});

const updateVideo = asyncHandler(async (req, res) => {
   const { videoId } = req.params;
   //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
   const { videoId } = req.params;
   //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
   const { videoId } = req.params;
});

export {
   getAllVideos,
   publishAVideo,
   getVideoById,
   updateVideo,
   deleteVideo,
   togglePublishStatus,
};
