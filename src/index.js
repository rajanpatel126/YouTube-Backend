// require("dotenv").config({path: "./env"});
import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";
dotenv.config({
   path: "./.env",
});

connectDB()
   .then(() => {
      app.listen(process.env.PORT || 8000, () => {
         console.log(`⚙️ Server is running at port: ${process.env.PORT}`);
      });
   })
   .catch((err) => {
      console.log("MongoDB Connection failed!", err);
   });

/*code
import { DB_NAME } from "./constants";
(async () => {
   try {
      await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
      app.on;
      "Error",
         (error) => {
            console.log(error);
            throw error;
         };
      app.listen(process.env.PORT, () => {
         console.log(`Port is listening on port ${process.env.PORT}`);
      });
   } catch (error) {
      console.error(error);
      throw error;
   }
})(); //effie
*/
