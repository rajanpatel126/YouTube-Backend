import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(
   cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
   })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//Routes import and declaration
import userRoute from "./routes/user.routes.js"; //any name can only be assign if export default is used
app.use("/api/v1/users", userRoute); //.use because we need to call middleware in order to use controllers

export { app };
