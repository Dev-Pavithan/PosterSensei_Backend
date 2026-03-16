import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import Contact from '../models/Contact';
import Notification from '../models/Notification';
import notificationEmitter from '../utils/notificationEmitter';
import { sendPushNotificationToAdmins } from '../utils/sendPush';

// @desc    Create contact message
// @route   POST /api/contact
const createContactMessage = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        res.status(400);
        throw new Error('Please provide name, email and message');
    }

    const contact = await Contact.create({
        name,
        email,
        message,
    });

    if (contact) {
        // Create internal notification
        await Notification.create({
            type: 'contact',
            referenceId: contact._id,
            message: `New message from ${name}: "${message.substring(0, 30)}..."`
        });

        res.status(201).json({
            message: 'Feedback received successfully. We will get back to you soon.',
            contact,
        });

        // Send push notification to admins
        sendPushNotificationToAdmins({
            title: 'New Contact Message',
            body: `From: ${name}\n${message.length > 50 ? message.substring(0, 50) + '...' : message}`,
            url: '/admin/contact'
        });
    } else {
        res.status(400);
        throw new Error('Invalid contact data');
    }
});

// @desc    Get all contact messages (Admin)
// @route   GET /api/contact
const getContacts = asyncHandler(async (req: Request, res: Response) => {
    const contacts = await Contact.find({}).sort({ createdAt: -1 });
    res.json(contacts);
});

// @desc    Delete contact message (Admin)
// @route   DELETE /api/contact/:id
const deleteContact = asyncHandler(async (req: Request, res: Response) => {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
        res.status(404);
        throw new Error('Contact message not found');
    }
    await contact.deleteOne();
    res.json({ message: 'Contact message removed' });
});

export { createContactMessage, getContacts, deleteContact };
