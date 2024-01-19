import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.models.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";

const createPlaylist = asyncHandler(async (req, res) => {
   const { name, description } = req.body;

   if (!(name || description)) {
      throw new ApiErrors(400, "all fields are required");
   }

   const playlist = await Playlist.create({
      name,
      description,
      owner: req.user?._id,
   });

   if (!playlist) {
      throw new ApiErrors(500, "Failed to create a playlist");
   }

   return res
      .status(200)
      .json(new ApiResponse(201, ` ${name} Playlist created Successfully`));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
   const { userId } = req.params;

   if (!isValidObjectId(userId)) {
      throw new ApiErrors(400, "Invalid userId");
   }

   const playlists = await Playlist.aggregate([
      {
         $match: {
            owner: new mongoose.Types.ObjectId(userId),
         },
      },
      {
         $lookup: {
            from: "videos",
            localField: "videos",
            foreignField: "_id",
            as: "videos",
         },
      },
      {
         $addFields: {
            totalViwes: {
               $sum: "$videos.views",
            },
            totalVideos: {
               $size: "$videos",
            },
         },
      },
      {
         $project: {
            _id: 1,
            name: 1,
            description: 1,
            totalVideos: 1,
            totalViwes: 1,
            updatedAt: 1,
         },
      },
   ]);

   if (!playlists) {
      throw new ApiErrors(500, "Failed to fetch the user playlists");
   }

   return res
      .status(200)
      .json(
         new ApiResponse(201, playlists, "User playlist fetched Successfully")
      );
});

const getPlaylistById = asyncHandler(async (req, res) => {
   const { playlistId } = req.params;

   if (!isValidObjectId(playlistId)) {
      throw new ApiErrors(400, "Invalid PlaylistId");
   }

   const playlist = await Playlist.aggregate([
      {
         $match: {
            _id: new mongoose.Types.ObjectId(playlistId),
         },
      },
      {
         $lookup: {
            from: "videos",
            foreignField: "_id",
            localField: "videos",
            as: "videos",
         },
      },
      {
         $match: {
            "videos.isPublished": true,
         },
      },
      {
         $lookup: {
            from: "users",
            foreignField: "_id",
            localField: "owner",
            as: "owner",
         },
      },
      {
         $addFields: {
            totalViews: {
               $sum: "$videos.views",
            },
            owner: {
               $first: "$owner",
            },
            totalVideos: {
               $size: "$videos",
            },
         },
      },
      {
         $project: {
            name: 1,
            description: 1,
            createdAt: 1,
            updatedAt: 1,
            totalVideos: 1,
            totalViews: 1,
            owner: {
               username: 1,
               fullName: 1,
               "avatar.url": 1,
            },
            videos: {
               _id: 1,
               createdAt: 1,
               description: 1,
               views: 1,
               title: 1,
               "videoFile.url": 1,
               "thumbnail.url": 1,
               duration: 1,
            },
         },
      },
   ]);

   if (!playlist) {
      throw new ApiErrors(500, "Failed to fetch playlist");
   }

   return res
      .status(200)
      .json(new ApiResponse(201, playlist, "Playlist fetched Successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
   const { playlistId, videoId } = req.params;

   if (!(isValidObjectId(playlistId) || isValidObjectId(videoId))) {
      throw new ApiErrors(400, "Check PlaylistId and VideoId Once again");
   }

   const video = await Video.findById(videoId);

   if (!video) {
      throw new ApiErrors(400, "Video not found");
   }

   const playlist = await Playlist.findById(playlistId);

   if (!playlist) {
      throw new ApiErrors(400, "PlaylistId not found");
   }

   if (
      (playlist?.owner?.toString() && video?.owner?.toString()) !==
      req.user?._id.toString()
   ) {
      throw new ApiErrors(400, "Only Owner can add videos to playlist");
   }

   const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
         $addToSet: {
            videos: videoId,
         },
      },
      { new: true }
   );

   if (!updatedPlaylist) {
      throw new ApiErrors(400, "Failed to update the playlist");
   }

   return res
      .status(200)
      .json(
         new ApiResponse(
            201,
            updatedPlaylist,
            "Video has been added to playlist Successfully"
         )
      );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
   const { playlistId, videoId } = req.params;

   if (!(isValidObjectId(playlistId) || isValidObjectId(videoId))) {
      throw new ApiErrors(400, "Check PlaylistId and VideoId Once again");
   }

   const video = await Video.findById(videoId);

   if (!video) {
      throw new ApiErrors(400, "Video not found");
   }

   const playlist = await Playlist.findById(playlistId);

   if (!playlist) {
      throw new ApiErrors(400, "PlaylistId not found");
   }

   if (
      (playlist?.owner?.toString() && video?.owner?.toString()) !==
      req.user?._id.toString()
   ) {
      throw new ApiErrors(400, "Only Owner can delete videos to playlist");
   }

   const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
         $pull: {
            videos: videoId,
         },
      },
      { new: true }
   );

   if (!updatedPlaylist) {
      throw new ApiErrors(400, "Failed to update the playlist");
   }

   return res
      .status(200)
      .json(
         new ApiResponse(
            201,
            updatedPlaylist,
            "Video has been deleted from playlist Successfully"
         )
      );
});

const deletePlaylist = asyncHandler(async (req, res) => {
   const { playlistId } = req.params;

   if (!isValidObjectId(playlistId)) {
      throw new ApiErrors(400, "Check PlaylistId Once again");
   }

   const playlist = await Playlist.findById(playlistId);

   if (!playlist) {
      throw new ApiErrors(400, "PlaylistId not found");
   }

   if (playlist?.owner?.toString() !== req.user?._id.toString()) {
      throw new ApiErrors(400, "Only Owner can delete playlist");
   }

   await Playlist.findByIdAndDelete(playlistId);

   return res
      .status(200)
      .json(new ApiResponse(201, {}, "Playlist deleted Successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
   const { playlistId } = req.params;

   const { name, description } = req.body;

   if (!isValidObjectId(playlistId)) {
      throw new ApiErrors(400, "Check PlaylistId Once again");
   }

   if (!(name || description)) {
      throw new ApiErrors(400, "Name and Description both are required");
   }

   const playlist = await Playlist.findById(playlistId);

   if (!playlist) {
      throw new ApiErrors(400, "PlaylistId not found");
   }

   if (playlist?.owner?.toString() !== req.user?._id.toString()) {
      throw new ApiErrors(400, "Only Owner can update playlist");
   }

   const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
         $set: {
            name,
            description,
         },
      },
      { new: true }
   );

   if (!updatedPlaylist) {
      throw new ApiErrors(500, "Failed to update the Playlist");
   }

   return res
      .status(200)
      .json(
         new ApiResponse(
            201,
            updatedPlaylist,
            "Playlist has been Updated Successfully"
         )
      );
});

export {
   createPlaylist,
   getUserPlaylists,
   getPlaylistById,
   addVideoToPlaylist,
   removeVideoFromPlaylist,
   deletePlaylist,
   updatePlaylist,
};
