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
    
    // Cloudinary upload logic for memory-based files (Vercel compatible)
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'products' },
        (error, result) => {
          if (result) resolve(result);
          else reject(error);
        }
      );
      uploadStream.end(req.file!.buffer);
    });

    res.json({ imageUrl: (result as any).secure_url });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500);
    throw new Error('Image upload failed');
  }
});

export { uploadImage };
