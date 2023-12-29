Complete YouTube backend with all APIs and Schemas along with additional features

I am using sessions and cookies for better security purpose

Access token and Refresh tokens are used in this process.
Access Token is not stored in database while Refresh token is stored in Db

File Upload procedure:

1. using multer, I will store the file temperory in my local server
2. then using Cloudinary, I'll take that file and put it on its server

We can also do it like using multer we'll take the file and put it on Cloudinary
But in professional grade, we'll take the file temperorily on our server to re-upload in any chance
