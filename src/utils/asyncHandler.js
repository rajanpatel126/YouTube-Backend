const asyncHandler = (requestHandler) => {
   return (req, res, next) => {
      //we are returning it as a function
      Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
   };
};

export { asyncHandler };

// const asyncHandler = (fn) => async (req, res, next) => {
//    try {
//       await fn(req, res, next);
//    } catch (error) {
//       res.status(error.code || 500).json({
//          success: false,
//          message: error.message,
//       });
//    }
// };
// higher order functions: which accept functions as higher order or can return as well
//in short they treted it as a parameter
