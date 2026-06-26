import path from 'path';
import { uploadToCloudinary } from '../config/cloudinary.js';

export async function resolveImageUrl(req, file, folder) {
  if (!file) return null;
  const cloudinaryUrl = await uploadToCloudinary(file.path, folder);
  if (cloudinaryUrl) return cloudinaryUrl;
  return `${req.protocol}://${req.get('host')}/uploads/${path.basename(file.path)}`;
}
