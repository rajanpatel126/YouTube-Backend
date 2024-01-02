import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

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
   if (
      [username, email, fullName, password].some(
         (field) => field?.trim() === ""
      )
   ) {
      throw new ApiErrors(400, "All fields are required");
   }
   const existedUser = User.findOne({
      $or: [{ username }, { email }],
   });
   if (existedUser) {
      throw new ApiErrors(409, "User with Email or username already exist");
   }
   console.log(req.files); //middleware accessibilty through req.files

   const avatarLocalFilePath = req.files?.avatar[0]?.path;
   const coverLocalFilePath = req.files?.coverImage[0]?.path;

   if (!avatarLocalFilePath) {
      throw new ApiErrors(400, "Avatar file is required");
   }
   const avatar = await uploadToCloudinary(avatarLocalFilePath);
   const coverImage = await uploadToCloudinary(coverLocalFilePath);

   if (!avatar) {
      throw new ApiErrors(400, "Avatar file is required");
   }

   const user = User.create({
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

export { registerUser };
