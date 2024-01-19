import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.models.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
   const { channelId } = req.params;

   if (!isValidObjectId(channelId)) {
      throw new ApiErrors(400, "Invalid ChannelId");
   }

   const subscriberAlready = await Subscription.findOne({
      channel: channelId,
      subscriber: req.user?._id,
   });

   if (subscriberAlready) {
      await Subscription.findByIdAndDelete(subscriberAlready?._id);

      return res
         .status(200)
         .json(
            new ApiResponse(
               201,
               { subscribed: false },
               "Channel Unsubscribed Successfully"
            )
         );
   }

   await Subscription.create({
      channel: channelId,
      subscriber: req.user?._id,
   });

   return res
      .status(200)
      .json(
         new ApiResponse(
            201,
            { subscribed: true },
            "Channel Subscribed Successfully"
         )
      );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
   const { channelId } = req.params;

   if (!isValidObjectId(channelId)) {
      throw new ApiErrors(400, "Invalid ChannelId");
   }

   const subscribers = await Subscription.aggregate([
      {
         $match: {
            channel: new mongoose.Types.ObjectId(channelId),
         },
      },
      {
         $lookup: {
            from: "users",
            foreignField: "_id",
            localField: "subscriber",
            as: "subscriber",
            pipeline: [
               {
                  $lookup: {
                     from: "subscriptions",
                     foreignField: "channel",
                     localField: "_id",
                     as: "subscriberdToSubscriber",
                  },
               },
               {
                  $addFields: {
                     subscriberdToSubscriber: {
                        $cond: {
                           $if: {
                              $in: [
                                 channelId,
                                 "$subscriberdToSubscriber?.subscriber",
                              ],
                           },
                           then: true,
                           else: false,
                        },
                     },
                     subscriberCount: {
                        $sum: "$subscriberdToSubscriber",
                     },
                  },
               },
            ],
         },
      },
      {
         $unwind: "$subscriber",
      },
      {
         $project: {
            subscriber: {
               _id: 1,
               username: 1,
               fullName: 1,
               "avatar?.url": 1,
               subscriberdToSubscriber: 1,
               subscriberCount: 1,
            },
         },
      },
   ]);

   if (!subscribers) {
      throw new ApiErrors(500, "Failed to fetch Subscribers");
   }

   return res
      .status(200)
      .json(
         new ApiResponse(201, subscribers, "Subscribers fetched Successfully")
      );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
   const { subscriberId } = req.params;

   if (!isValidObjectId(subscriberId)) {
      throw new ApiErrors(400, "Invalid Subscriber Id");
   }

   const subscribedChannels = await Subscription.aggregate([
      {
         $match: {
            subscriber: new mongoose.Types.ObjectId(subscriberId),
         },
      },
      {
         $lookup: {
            from: "users",
            foreignField: "_id",
            localField: "channel",
            as: "subscribedChannels",
            pipeline: [
               {
                  $lookup: {
                     from: "videos",
                     foreignField: "owner",
                     localField: "_id",
                     as: "videos",
                  },
               },
               {
                  $addFields: {
                     latestVideo: {
                        $last: "$vidoes",
                     },
                  },
               },
            ],
         },
      },
      {
         $unwind: "$subscribedChannels",
      },
      {
         $project: {
            subscribedChannels: {
               _id: 1,
               username: 1,
               fullName: 1,
               latestVideo: {
                  _id: 1,
                  "videoFile.url": 1,
                  "thumbnail.url": 1,
                  duration: 1,
                  title: 1,
                  createdAt: 1,
                  description: 1,
                  owner: 1,
               },
            },
         },
      },
   ]);

   if (!subscribedChannels) {
      throw new ApiErrors(500, "Failed to fetch subscribed channels");
   }

   return res
      .status(200)
      .json(
         new ApiResponse(
            201,
            subscribedChannels,
            "subscribed channels fetched Successfully"
         )
      );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
