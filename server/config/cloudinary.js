import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Cloudinary cloud_name is typically lowercase and is sensitive to whitespace/case.
// Normalize to avoid "Invalid cloud_name ..." errors when env value has casing issues.
const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || "").trim().toLowerCase();

cloudinary.config({
  cloud_name: cloudName,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'chat_app_uploads',
    resource_type: 'auto', // Important for videos and docs
  },
});

export { cloudinary, storage };
