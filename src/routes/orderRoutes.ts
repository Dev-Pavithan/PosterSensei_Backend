import express from 'express';
import {
    addOrderItems, getOrderById, updateOrderToDelivered, updateOrderStatus, getMyOrders, getOrders, cancelOrder, getOrderStats
} from '../controllers/orderController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/').get(protect, admin, getOrders).post(protect, addOrderItems);
router.get('/myorders', protect, getMyOrders);
router.get('/stats', protect, admin, getOrderStats);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered);
router.route('/:id/status').put(protect, admin, updateOrderStatus);
router.route('/:id/cancel').put(protect, cancelOrder);

export default router;
