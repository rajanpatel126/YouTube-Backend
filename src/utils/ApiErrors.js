class ApiErrors extends Error {
   constructor(
      statusCode,
      message = "Something went wrong",
      errors = [],
      stack = null
   ) {
      super(message);
      this.statusCode = statusCode;
      this.data = null;
      this.message = message;
      this.success = false;
      //Success code is not going to transfer. because we are handling api errors not api response
      this.errors = errors;

      if (stack) {
         this.stack = stack;
      } else {
         Error.captureStackTrace(this, this.constructor);
      }
   }
}

export { ApiErrors };
