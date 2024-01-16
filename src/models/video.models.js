import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"; //storing watch history

const videoSchema = new Schema(
   {
      videoFile: {
         type: {
            url: String,
            public_id: String,
         }, //cloudinary Url,
         required: true,
      },
      thumbnail: {
         type: {
            url: String,
            public_id: String,
         },
         required: true,
      },
      title: {
         type: String,
         required: true,
      },
      description: {
         type: String,
         required: true,
      },
      duration: {
         type: Number, //cloudinary will provide the duration in video details
         required: true,
      },
      views: {
         type: Number,
         default: 0,
      },
      isPublished: {
         type: Boolean,
         default: true,
      },
      owner: {
         type: Schema.Types.ObjectId,
         ref: "User",
      },
   },
   { timestamps: true }
);

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);
