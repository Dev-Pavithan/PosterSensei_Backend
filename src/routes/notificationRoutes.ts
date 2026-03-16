import express from 'express';
import {
    getNotifications,
    markAsRead,
    clearNotifications,
    markAllAsRead,
    getNotificationStream
} from '../controllers/notificationController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, admin, getNotifications);

router.get('/stream', protect, admin, getNotificationStream);

router.route('/clear')
    .delete(protect, admin, clearNotifications);
router.route('/read-all').put(protect, admin, markAllAsRead);
router.route('/:id/read').put(protect, admin, markAsRead);

export default router;
