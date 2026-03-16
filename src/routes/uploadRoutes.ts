import express from 'express';
import multer from 'multer';
import { uploadImage } from '../controllers/uploadController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', protect, admin, upload.single('image'), uploadImage);
router.post('/profile', protect, upload.single('image'), uploadImage);

export default router;
