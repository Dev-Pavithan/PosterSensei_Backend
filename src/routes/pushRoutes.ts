import express from 'express';
import { getVapidPublicKey, subscribeUser } from '../controllers/pushController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/vapidPublicKey', protect, admin, getVapidPublicKey);
router.post('/subscribe', protect, admin, subscribeUser);

export default router;
