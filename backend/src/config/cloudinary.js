import { v2 as cloudinary } from 'cloudinary';

const configured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (configured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

export function isCloudinaryConfigured() {
  return Boolean(configured);
}

export async function uploadToCloudinary(filePath, folder = 'community-reports') {
  if (!configured) return null;
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'image'
  });
  return result.secure_url;
}
