import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken"; //bearer token
import bcrypt from "bcrypt";

const userSchema = new Schema(
   {
      username: {
         type: String,
         required: true,
         unique: true,
         lowercase: true,
         trim: true,
         index: true, //for enabling search field
      },
      email: {
         type: String,
         required: true,
         unique: true,
         lowercase: true,
         trim: true,
      },
      fullName: {
         type: String,
         required: true,
         trim: true,
         index: true, //for enabling search field, without it we can do it but just for better practise
      },
      avatar: {
         type: String,
         required: true,
      },
      coverImage: {
         type: String,
      },
      watchHistory: [
         {
            type: Schema.Types.ObjectId,
            ref: "Video",
         },
      ],
      password: {
         type: String,
         required: [true, "Password is required"],
      },
      refreshToken: {
         type: String,
      },
   },
   { timestamps: true }
);
//this is "Middleware"
// ()={} we can not write arrow function, because we can't have this(context) refrence
//we want apply this event on the schema so we have to write function instead
userSchema.pre("save", async function (next) {
   if (!this.isModified("password")) return next();
   //whenver there is a change in any one field, the password will going to be encrypt everytime weather there is a change in avatar field. So need to tell this function, only run when there is a change in password field
   this.password = await bcrypt.hash(this.password, 10);
   next();
});

//user defined method
userSchema.methods.isPasswordCorrect = async function (password) {
   return await bcrypt.compare(password, this.password);
};
//both are JWT token
userSchema.methods.generateAccessToken = function () {
   return jwt.sign(
      {
         _id: this._id,
         email: this.email,
         username: this.username,
         fullName: this.fullName,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
         expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
      }
   );
};

userSchema.methods.generateRefreshToken = function () {
   return jwt.sign(
      {
         _id: this._id,
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
         expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
      }
   );
};

export const User = mongoose.model("User", userSchema);
