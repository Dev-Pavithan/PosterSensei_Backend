import express from 'express';
import { validateCoupon, createCoupon } from '../controllers/couponController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/validate', validateCoupon);
router.post('/', protect, admin, createCoupon);

export default router;
