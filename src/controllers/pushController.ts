import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import User from '../models/User';

// @desc    Get VAPID Public Key
// @route   GET /api/push/vapidPublicKey
// @access  Private/Admin
const getVapidPublicKey = asyncHandler(async (req: Request, res: Response) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// @desc    Subscribe user to web push
// @route   POST /api/push/subscribe
// @access  Private/Admin
const subscribeUser = asyncHandler(async (req: any, res: Response) => {
    const subscription = req.body;
    
    if (!subscription || !subscription.endpoint) {
        res.status(400);
        throw new Error('Invalid subscription payload');
    }

    const user = await User.findById(req.user._id);

    if (user) {
        // Prevent duplicate subscriptions
        const exists = user.pushSubscriptions?.find(sub => sub.endpoint === subscription.endpoint);
        if (!exists) {
            user.pushSubscriptions = [...(user.pushSubscriptions || []), subscription];
            await user.save();
        }
        res.status(201).json({ message: 'Subscribed successfully' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

export { getVapidPublicKey, subscribeUser };
