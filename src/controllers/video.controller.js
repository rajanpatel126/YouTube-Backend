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

   const pipeline = [];

   if (query) {
      pipeline.push({
         $search: {
            index: "search-videos",
            text: {
               query: query,
               path: ["title", "description"],
            },
         },
      });
   }

   if (userId) {
      if (!isValidObjectId(userId)) {
         throw new ApiErrors(400, "Invalid UserId");
      }

      pipeline.push({
         $match: {
            owner: new mongoose.Types.ObjectId(userId),
         },
      });
   }

   //fetch videos in which isPublished is true
   pipeline.push({ $match: { isPublished: true } });

   //sort by views, createdAt, duration in ascending or descending
   if (sortBy && sortType) {
      pipeline.push({
         $sort: {
            [sortBy]: sortType === "asc" ? 1 : -1,
         },
      });
   } else {
      pipeline.push({ $sort: { createdAt: -1 } });
   }

   const options = {
      page: parseInt(page, 1),
      limit: parseInt(limit, 10),
   };

   const video = await Video.aggregatePaginate(
      Video.aggregate(pipeline),
      options
   );

   return res
      .status(200)
      .json(new ApiResponse(200, video, "Videos Fetched Successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
   const { title, description } = req.body;
   // TODO: get video, upload to cloudinary, create video

   if ([title, description].some((field) => field?.trim() === "")) {
      throw new ApiErrors(401, "All feilds are required");
   }

   const videoLocalPath = await req.files?.videoFile[0].path;
   if (!videoLocalPath) {
      throw new ApiErrors(404, "Video file is required");
   }

   const thumbnailLocalPath = await req.files?.thumbnailFile[0].path;
   if (!thumbnailLocalPath) {
      throw new ApiErrors(404, "Thuubnail file is required");
   }

   const videoFile = await uploadToCloudinary(videoLocalPath);
   const thumbnailFile = await uploadToCloudinary(thumbnailLocalPath);

   if (!videoFile) {
      throw new ApiErrors(400, "Video File not found");
   }

   if (!thumbnailFile) {
      throw new ApiErrors(400, "Thumbnail File not found");
   }

   const video = await Video.create({
      title,
      description,
      duration: videoFile.duration,

      videoFile: {
         url: videoFile.url,
         public_id: videoFile.public_id,
      },

      thumbnailFile: {
         url: thumbnailFile.url,
         public_id: thumbnailFile.public_id,
      },

      isPublished: true,
      owner: req.user?._id,
   });

   const videoUploded = await Video.findById(video._id);

   if (!videoUploded) {
      throw new ApiErrors(500, "Video uploading is failed! Try again... ");
   }

   return res
      .status(200)
      .json(new ApiResponse(201, video, "Video Uploaded SuccessFully"));
});

const getVideoById = asyncHandler(async (req, res, next) => {
   //TODO: get video by id
   const { videoId } = req.params;

   if (!isValidObjectId(videoId)) {
      throw new ApiErrors(400, "Invalid User ID");
   }

   const video = await Video.aggregate([
      {
         $match: {
            _id: new mongoose.Types.ObjectId(videoId),
         },
      },
      {
         $lookup: {
            from: "likes",
            localField: "_id",
            foreignField: "video",
            as: "Likes",
         },
      },
      {
         $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "Owner",
            pipeline: [
               {
                  $lookup: {
                     from: "subscriptions",
                     localField: "_id",
                     foreignField: "channel",
                     as: "subscribers",
                  },
               },
               {
                  $addFields: {
                     subscribersCount: {
                        $size: "$subscribers",
                     },
                     isSubscribed: {
                        $cond: {
                           $if: {
                              $in: [req.user?._id, "$subscribers.subsciber"],
                           },
                           then: true,
                           else: false,
                        },
                     },
                  },
               },
               {
                  $project: {
                     username: 1,
                     "avatar.url": 1,
                     subscribersCount: 1,
                     isSubscribed: 1,
                  },
               },
            ],
         },
      },
      {
         $addFields: {
            likesCount: {
               $size: "$likes",
            },
            owner: {
               $first: "$Owner",
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
            "videoFile.url": 1,
            owner: 1,
            title: 1,
            description: 1,
            views: 1,
            createdAt: 1,
            duration: 1,
            comments: 1,
            likesCount: 1,
            isLiked: 1,
         },
      },
   ]);

   if (!video) {
      throw new ApiErrors(500, "Failed To Fetch Video");
   }

   //increment the view count by 1
   await Video.findByIdAndUpdate(videoId, {
      $inc: {
         views: 1,
      },
   });

   //add this video to user's watch history
   await User.findByIdAndUpdate(req.user?._id, {
      $addToSet: {
         watchHistory: videoId,
      },
   });

   return res
      .status(200)
      .json(new ApiResponse(201, video[0], "Video Fetched Successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
   //TODO: update video details like title, description, thumbnail
   const { videoId } = req.params;
   const { title, description } = req.body;

   if (!isValidObjectId(videoId)) {
      throw new ApiErrors(400, "Invalid VideoId");
   }

   if (!(title && description)) {
      throw new ApiErrors(400, "Title and Description are required");
   }

   const video = await Video.findById(videoId);
   if (!video) {
      throw new ApiErrors(404, "Video does not exist");
   }

   if (video?.owner.toString() !== req.user._id.toString()) {
      throw new ApiErrors(400, "Only Owner can Update the video");
   }

   const thumbnailToDelete = video.thumbnail.public_id;
   const thumbnailToUpdate = req.files?.path;

   if (!thumbnailToUpdate) {
      throw new ApiErrors(400, "Thumbnail is Required");
   }

   const thumbnail = await uploadToCloudinary(thumbnailToUpdate);
   if (!thumbnail) {
      throw new ApiErrors(400, "Thumbnail not found");
   }

   const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      {
         $set: {
            title,
            description,
            thumbnail: {
               public_id: thumbnail.public_id,
               url: thumbnail.url,
            },
         },
      },
      { new: true }
   );

   if (!updatedVideo) {
      throw new ApiErrors(500, "Failed to update the video");
   }

   await deleteFromCloudinary(thumbnailToDelete);

   return res
      .status(200)
      .json(new ApiResponse(201, updatedVideo, "Video Updated Successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
   const { videoId } = req.params;
   //TODO: delete video
   if (!isValidObjectId(videoId)) {
      throw new ApiErrors(400, "Invalid videoId");
   }

   const video = await Video.findById(videoId);
   if (!video) {
      throw new ApiErrors(400, "Video does not exist");
   }

   if (video?.owner.toString() !== req.user?.public_id.toString()) {
      throw new ApiErrors(
         400,
         "You can not delete the video as you are not the owner of the video"
      );
   }

   const videoDeleted = await Video.findByIdAndDelete(video?._id);
   if (!videoDeleted) {
      throw new ApiErrors(500, "Failed to delete the video");
   }

   await deleteFromCloudinary(video.thumbnail.public_id);
   await deleteFromCloudinary(video.videoFile.public_id, "video"); //specifying the type of the file

   return res
      .status(200)
      .json(new ApiResponse(201, {}, "Video deleted Successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
   const { videoId } = req.params;

   if (!isValidObjectId(videoId)) {
      throw new ApiErrors(400, "Invalid videoId");
   }

   const video = await Video.findById(videoId);
   if (!video) {
      throw new ApiErrors(400, "Video does not exist");
   }

   if (video?.owner.toString() !== req.user?.public_id.toString()) {
      throw new ApiErrors(
         400,
         "You can not toggle publish the video as you are not the owner of the video"
      );
   }

   const togglePublish = await Video.findByIdAndUpdate(
      videoId,
      {
         $set: {
            isPublished: !video?.isPublished,
         },
      },
      { new: true }
   );

   if (!togglePublish) {
      throw new ApiErrors(500, "Failed to Toggle publish Video");
   }

   return res
      .status(200)
      .json(
         new ApiResponse(
            201,
            { isPublished: togglePublish.isPublished },
            "Video Toggle Publish Successfully"
         )
      );
});

export {
   getAllVideos,
   publishAVideo,
   getVideoById,
   updateVideo,
   deleteVideo,
   togglePublishStatus,
};
