import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

const healthcheck = asyncHandler(async (req, res) => {
   return res
      .status(200)
      .json(new ApiResponse(201, { message: "Everything is Ok" }, "Done"));
});

export { healthcheck };
