import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import Notification from '../models/Notification';
import notificationEmitter from '../utils/notificationEmitter';

// Keep track of connected admin clients for SSE
let clients: Response[] = [];

// @desc    Get notification stream (SSE)
// @route   GET /api/notifications/stream
// @access  Private/Admin
const getNotificationStream = (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Establish the connection

    // Ping every 30 seconds to keep connection alive
    const keepAlive = setInterval(() => {
        res.write(': keep-alive\n\n');
    }, 30000);

    const onNotification = (data: any) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    notificationEmitter.on('new_notification', onNotification);
    clients.push(res);

    req.on('close', () => {
        clearInterval(keepAlive);
        notificationEmitter.off('new_notification', onNotification);
        clients = clients.filter(client => client !== res);
    });
};

// @desc    Get all notifications (Admin)
// @route   GET /api/notifications
// @access  Private/Admin
const getNotifications = asyncHandler(async (req: Request, res: Response) => {
    const notifications = await Notification.find({}).sort({ createdAt: -1 });
    res.json(notifications);
});

// @desc    Mark a notification as read (Admin)
// @route   PUT /api/notifications/:id/read
// @access  Private/Admin
const markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const notification = await Notification.findById(req.params.id);

    if (notification) {
        notification.isRead = true;
        const updatedNotification = await notification.save();
        res.json(updatedNotification);
    } else {
        res.status(404);
        throw new Error('Notification not found');
    }
});

// @desc    Clear all notifications (Admin)
// @route   DELETE /api/notifications/clear
// @access  Private/Admin
const clearNotifications = asyncHandler(async (req: Request, res: Response) => {
    await Notification.deleteMany({});
    res.json({ message: 'All notifications cleared' });
});

// @desc    Mark all as read (Admin)
// @route   PUT /api/notifications/read-all
// @access  Private/Admin
const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
});

export { getNotifications, markAsRead, clearNotifications, markAllAsRead, getNotificationStream };
