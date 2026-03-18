import express from 'express';
import { getActiveDeliveryMethods, getAllDeliveryMethods, createDeliveryMethod, updateDeliveryMethod, deleteDeliveryMethod } from '../controllers/deliveryController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(getActiveDeliveryMethods)
    .post(protect, admin, createDeliveryMethod);

router.route('/admin')
    .get(protect, admin, getAllDeliveryMethods);

router.route('/:id')
    .put(protect, admin, updateDeliveryMethod)
    .delete(protect, admin, deleteDeliveryMethod);

export default router;
