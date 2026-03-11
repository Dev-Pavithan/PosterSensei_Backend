import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import Order from '../models/Order';

// @desc    Create new order
// @route   POST /api/orders
const addOrderItems = asyncHandler(async (req: any, res: Response) => {
    const { orderItems, shippingAddress, deliveryMethod, paymentMethod, totalPrice, discount, couponCode, notes } = req.body;
    if (!orderItems || orderItems.length === 0) {
        res.status(400); throw new Error('No order items');
    }
    const order = new Order({
        user: req.user._id, orderItems, shippingAddress, deliveryMethod: deliveryMethod || 'post',
        paymentMethod: paymentMethod || 'Cash on Delivery', totalPrice, discount: discount || 0,
        couponCode: couponCode || '', notes: notes || '', status: 'pending',
    });
    const created = await order.save();
    res.status(201).json(created);
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
const getOrderById = asyncHandler(async (req: any, res: Response) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) { res.status(404); throw new Error('Order not found'); }
    if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        res.status(401); throw new Error('Not authorized');
    }
    res.json(order);
});

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
const updateOrderToDelivered = asyncHandler(async (req: any, res: Response) => {
    const order = await Order.findById(req.params.id);
    if (!order) { res.status(404); throw new Error('Order not found'); }
    order.isDelivered = true;
    order.deliveredAt = new Date();
    order.status = 'delivered';
    const updated = await order.save();
    res.json(updated);
});

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
const updateOrderStatus = asyncHandler(async (req: any, res: Response) => {
    const order = await Order.findById(req.params.id);
    if (!order) { res.status(404); throw new Error('Order not found'); }
    order.status = req.body.status || order.status;
    order.trackingId = req.body.trackingId || order.trackingId;
    if (req.body.status === 'delivered') {
        order.isDelivered = true;
        order.deliveredAt = new Date();
    }
    const updated = await order.save();
    res.json(updated);
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
const getMyOrders = asyncHandler(async (req: any, res: Response) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
});

// @desc    Get all orders (Admin)
// @route   GET /api/orders
const getOrders = asyncHandler(async (_req: Request, res: Response) => {
    const orders = await Order.find({}).populate('user', 'id name email').sort({ createdAt: -1 });
    res.json(orders);
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
const cancelOrder = asyncHandler(async (req: any, res: Response) => {
    const order = await Order.findById(req.params.id);
    if (!order) { res.status(404); throw new Error('Order not found'); }
    if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        res.status(401); throw new Error('Not authorized');
    }
    if (order.status === 'delivered' || order.status === 'shipped') {
        res.status(400); throw new Error('Cannot cancel a shipped/delivered order');
    }
    order.status = 'cancelled';
    const updated = await order.save();
    res.json(updated);
});

// @desc    Get order stats (Admin)
// @route   GET /api/orders/stats
const getOrderStats = asyncHandler(async (_req: Request, res: Response) => {
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ] as any);
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
    res.json({
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingOrders,
        deliveredOrders,
    });
});

export { addOrderItems, getOrderById, updateOrderToDelivered, updateOrderStatus, getMyOrders, getOrders, cancelOrder, getOrderStats };
