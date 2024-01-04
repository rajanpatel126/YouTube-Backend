import mongoose from "mongoose";

import { DB_NAME } from "../constants.js";

const connectDB = async () => {
   try {
      const connectionInstance = await mongoose.connect(
         `${process.env.MONGODB_URI}/${DB_NAME}`
      );
      console.log(`MongoDb Connected..!`);
      // console.log(`Db Host: ${connectionInstance.connection.host}`);
   } catch (error) {
      console.log("Connection failed...", error);
      process.exit(1);
   }
   //this asynchronus function will return promises which needs to be handeled with .then and .catch in main file
};

export default connectDB;
