import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import cloudinary from '../config/cloudinary';

// @desc    Upload image to Cloudinary
// @route   POST /api/upload
const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('No file uploaded');
    }
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'products',
    });
    res.json({ imageUrl: result.secure_url });
  } catch (error) {
    res.status(500);
    throw new Error('Image upload failed');
  }
});

export { uploadImage };
