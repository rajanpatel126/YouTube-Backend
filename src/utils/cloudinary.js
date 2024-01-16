import { v2 as cloudinary } from "cloudinary";
import fs from "fs"; //default file system provided by NodeJs
import { asyncHandler } from "./asyncHandler";

cloudinary.config({
   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
   api_key: process.env.CLOUDINARY_API_KEY,
   api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (localFilePath) => {
   try {
      if (!localFilePath) return null;
      //upload the file on cloudinary
      const response = await cloudinary.uploader.upload(localFilePath, {
         resource_type: "auto", //automatically identify the uploaded file type
      });
      //file has been uploaded
      // console.log("File uploaded Successfully", response.url);
      fs.unlinkSync(localFilePath); // only after the unlink we will proceed further
      return response;
   } catch (error) {
      fs.unlinkSync(localFilePath); //remove the locally saved temperory file as the operation failed
   }
};

const deleteFromCloudinary = async (public_id, resource_type = "image") => {
   try {
      if (!public_id) return null;

      const response = await cloudinary.uploader.destroy(public_id, {
         resource_type: `${resource_type}`,
      });

      console.log("file deleted from Cloudinary");
      return response;
   } catch (error) {
      console.log("Failed while deleting the file from Cloudinary", error);
   }
};

// cloudinary.v2.uploader.upload(
//    "https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
//    { public_id: "olympic_flag" },
//    function (error, result) {
//       console.log(result);
//    }
// );

export { uploadToCloudinary, deleteFromCloudinary };
