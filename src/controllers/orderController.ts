import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import Order from '../models/Order';
import sendEmail from '../utils/sendEmail';
import Notification from '../models/Notification';
import notificationEmitter from '../utils/notificationEmitter';
import { sendPushNotificationToAdmins } from '../utils/sendPush';

// Status labels + messages for email
const STATUS_META: Record<string, { label: string; message: string; emoji: string }> = {
    pending:    { label: 'Pending',    emoji: '⏳', message: 'We have received your order and are preparing it.' },
    confirmed:  { label: 'Confirmed',  emoji: '✅', message: 'Great news! Your order has been confirmed and is being prepared.' },
    processing: { label: 'Processing', emoji: '⚙️', message: 'Your poster is being carefully crafted for you.' },
    shipped:    { label: 'Shipped',    emoji: '🚚', message: 'Your order is on its way! Track it using your tracking ID below.' },
    delivered:  { label: 'Delivered',  emoji: '🎉', message: 'Your premium poster has arrived. We hope you love it!' },
    cancelled:  { label: 'Cancelled',  emoji: '❌', message: 'Your order has been cancelled. Contact support if you have questions.' },
};

const buildStatusEmail = (order: any, userName: string) => {
    const meta = STATUS_META[order.status] || { label: order.status, emoji: '📦', message: 'Your order status has been updated.' };
    const itemRows = order.orderItems.map((item: any) => `
        <tr style="border-bottom:1px solid #2a2a2a">
            <td style="padding:14px 0">
                <img src="${item.image}" alt="${item.title}" style="width:56px;height:56px;border-radius:8px;object-fit:cover;vertical-align:middle;margin-right:12px">
                <span style="vertical-align:middle;color:#e0e0e0;font-weight:600">${item.title}${item.size ? ` (${item.size})` : ''}</span>
            </td>
            <td style="padding:14px;text-align:center;color:#aaaaaa">x${item.qty}</td>
            <td style="padding:14px;text-align:right;color:#FF007F;font-weight:700">₹${(item.price * item.qty).toFixed(2)}</td>
        </tr>`).join('');

    return `<!DOCTYPE html><html><head><meta charset="utf-8">
    <style>
        body{margin:0;padding:0;background:#0c0c0c;font-family:'Segoe UI',Roboto,Arial,sans-serif}
        .wrapper{background:#0c0c0c;padding:40px 0}
        .main{background:#161616;margin:0 auto;max-width:600px;border-radius:24px;overflow:hidden;border:1px solid #2a2a2a}
        .header{background:#000;padding:40px;text-align:center;border-bottom:1px solid #1a1a1a}
        .logo-text{font-size:24px;font-weight:900;color:#fff;letter-spacing:-1px;margin-left:10px;vertical-align:middle}
        .primary{color:#FF007F}
        .badge{display:inline-block;background:#FF007F;color:#fff;padding:8px 24px;border-radius:30px;font-weight:800;font-size:14px;margin:20px 0}
        .content{padding:40px;color:#e0e0e0;line-height:1.8}
        .section-title{font-size:13px;font-weight:800;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;margin-top:30px}
        .detail-box{background:#0d0d0d;border:1px solid #2a2a2a;border-radius:12px;padding:20px;font-size:14px}
        .footer{background:#0a0a0a;padding:30px;text-align:center;font-size:12px;color:#555;border-top:1px solid #1a1a1a}
    </style>
    </head><body><div class="wrapper"><div class="main">
        <div class="header">
            <img src="https://poster-sensei.vercel.app/assets/non_background_logo-BVboLjc2.png" style="width:44px;height:44px;vertical-align:middle">
            <span class="logo-text">POSTER<span class="primary">SENSEI</span></span>
        </div>
        <div class="content">
            <p style="font-size:22px;font-weight:900;color:#fff;text-align:center;margin-bottom:4px">${meta.emoji} Order ${meta.label}</p>
            <p style="text-align:center;color:#aaa">Hi <strong style="color:#fff">${userName}</strong>, ${meta.message}</p>
            <div style="text-align:center"><span class="badge">${meta.label.toUpperCase()}</span></div>

            <p class="section-title">📦 Order Details</p>
            <div class="detail-box">
                <table style="width:100%;border-collapse:collapse">${itemRows}</table>
                <div style="border-top:1px solid #2a2a2a;margin-top:16px;padding-top:16px;display:flex;justify-content:space-between">
                    <span style="color:#888">Discount</span><span style="color:#aaa">- ₹${order.discount?.toFixed(2) || '0.00'}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:8px">
                    <span style="color:#fff;font-weight:800;font-size:16px">Total</span>
                    <span style="color:#FF007F;font-weight:900;font-size:16px">₹${order.totalPrice.toFixed(2)}</span>
                </div>
            </div>

            ${order.trackingId ? `
            <p class="section-title">🚚 Tracking</p>
            <div class="detail-box">
                <div style="font-size:18px;font-weight:900;color:#FF007F;letter-spacing:2px">${order.trackingId}</div>
            </div>` : ''}

            <p class="section-title">📍 Delivery Address</p>
            <div class="detail-box" style="color:#aaa">
                ${order.shippingAddress.address}, ${order.shippingAddress.city},<br>
                ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}
            </div>

            <p class="section-title">💳 Payment</p>
            <div class="detail-box" style="color:#aaa">${order.paymentMethod}</div>

            <p style="margin-top:40px;text-align:center;font-weight:800;color:#fff">Stay inspired,<br>The PosterSensei Team</p>
        </div>
        <div class="footer">&copy; 2026 PosterSensei Art Guild. All rights reserved.</div>
    </div></div></body></html>`;
};

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

    // Create internal notification
    const newNotif = await Notification.create({
        type: 'order',
        referenceId: created._id,
        message: `New order: ₹${totalPrice.toFixed(2)} for ${orderItems.length} items.`
    });

    // Broadcast update via SSE
    notificationEmitter.emit('new_notification', newNotif);

    res.status(201).json(created);

    // Send push notification to admins
    sendPushNotificationToAdmins({
        title: 'New Order Received! 🛍️',
        body: `Order Amount: LKR ${totalPrice.toLocaleString()}\nItems: ${orderItems.length}`,
        url: '/admin/orders'
    });
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
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) { res.status(404); throw new Error('Order not found'); }
    order.isDelivered = true;
    order.deliveredAt = new Date();
    order.status = 'delivered';
    const updated = await order.save();
    // Send email notification
    try {
        const user = order.user as any;
        await sendEmail({
            email: user.email,
            subject: `🎉 Your Order has been Delivered – PosterSensei`,
            html: buildStatusEmail(order, user.name)
        });
    } catch (e) { console.error('Order email error:', e); }
    res.json(updated);
});

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
const updateOrderStatus = asyncHandler(async (req: any, res: Response) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) { res.status(404); throw new Error('Order not found'); }

    const newStatus = req.body.status;
    if (newStatus && newStatus !== order.status) {
        const ALLOWED: Record<string, string[]> = {
            pending:    ['confirmed', 'processing', 'shipped', 'cancelled'],
            confirmed:  ['processing', 'shipped', 'cancelled'],
            processing: ['shipped', 'cancelled'],
            shipped:    ['delivered', 'cancelled'],
            delivered:  [],
            cancelled:  [],
        };
        const allowed = ALLOWED[order.status] || [];
        if (!allowed.includes(newStatus)) {
            res.status(400);
            throw new Error(`Cannot change order status from "${order.status}" to "${newStatus}"`);
        }
    }

    order.status = newStatus || order.status;
    order.trackingId = req.body.trackingId || order.trackingId;
    if (order.status === 'delivered') {
        order.isDelivered = true;
        order.deliveredAt = new Date();
    }
    const updated = await order.save();
    // Send email notification
    try {
        const user = order.user as any;
        const statusLabel = STATUS_META[order.status]?.label || order.status;
        await sendEmail({
            email: user.email,
            subject: `Order Update: ${statusLabel} – PosterSensei`,
            html: buildStatusEmail(order, user.name)
        });
    } catch (e) { console.error('Order status email error:', e); }
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
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) { res.status(404); throw new Error('Order not found'); }
    if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        res.status(401); throw new Error('Not authorized');
    }
    if (order.status === 'delivered' || order.status === 'shipped') {
        res.status(400); throw new Error('Cannot cancel a shipped/delivered order');
    }
    order.status = 'cancelled';
    const updated = await order.save();
    // Send email notification
    try {
        const user = order.user as any;
        await sendEmail({
            email: user.email,
            subject: `Order Cancelled – PosterSensei`,
            html: buildStatusEmail(order, user.name)
        });
    } catch (e) { console.error('Order cancel email error:', e); }
    res.json(updated);
});

// @desc    Get order stats (Admin)
// @route   GET /api/orders/stats
const getOrderStats = asyncHandler(async (_req: Request, res: Response) => {
    const totalOrders = await Order.countDocuments();
    const totalRevenueResult = await Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });

    // Revenue by day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const revenueByDay = await Order.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo }, status: { $ne: 'cancelled' } } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                revenue: { $sum: '$totalPrice' },
                orders: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // Top Selling Products
    const topProducts = await Order.aggregate([
        { $unwind: '$orderItems' },
        {
            $group: {
                _id: '$orderItems.product',
                title: { $first: '$orderItems.title' },
                image: { $first: '$orderItems.image' },
                totalQty: { $sum: '$orderItems.qty' },
                totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.qty'] } }
            }
        },
        { $sort: { totalQty: -1 } },
        { $limit: 5 }
    ]);

    // Status Distribution
    const statusDistribution = await Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
        totalOrders,
        totalRevenue,
        pendingOrders,
        deliveredOrders,
        revenueByDay,
        topProducts,
        statusDistribution,
    });
});

export { addOrderItems, getOrderById, updateOrderToDelivered, updateOrderStatus, getMyOrders, getOrders, cancelOrder, getOrderStats };
