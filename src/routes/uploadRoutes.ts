import express from 'express';
import multer from 'multer';
import { uploadImage } from '../controllers/uploadController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/', protect, admin, upload.single('image'), uploadImage);

export default router;
