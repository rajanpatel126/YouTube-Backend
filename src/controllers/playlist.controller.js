import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.models.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";

const createPlaylist = asyncHandler(async (req, res) => {
   const { name, description } = req.body;

   //TODO: create playlist

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
   //TODO: get user playlists
});

const getPlaylistById = asyncHandler(async (req, res) => {
   const { playlistId } = req.params;
   //TODO: get playlist by id
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
   // TODO: remove video from playlist
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
   // TODO: delete playlist

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
   //TODO: update playlist

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
