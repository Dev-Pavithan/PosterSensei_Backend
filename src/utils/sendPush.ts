import webPush from 'web-push';
import User from '../models/User';

let vapidConfigured = false;
const configureVapid = () => {
    if (!vapidConfigured && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.EMAIL_USER) {
        webPush.setVapidDetails(
            `mailto:${process.env.EMAIL_USER}`,
            process.env.VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        );
        vapidConfigured = true;
    }
};

export const sendPushNotificationToAdmins = async (payload: { title: string, body: string, url?: string }) => {
    try {
        configureVapid();
        if (!vapidConfigured) {
            console.warn('VAPID keys not configured, skipping push notification');
            return;
        }

        // Find all admins with push subscriptions
        const admins = await User.find({ isAdmin: true });
        
        const pushPromises: Promise<any>[] = [];

        for (const admin of admins) {
            if (admin.pushSubscriptions && admin.pushSubscriptions.length > 0) {
                for (const sub of admin.pushSubscriptions) {
                    pushPromises.push(
                        webPush.sendNotification(sub, JSON.stringify(payload)).catch(err => {
                            if (err.statusCode === 410 || err.statusCode === 404) {
                                // Subscription expired or is invalid, remove it
                                admin.pushSubscriptions = admin.pushSubscriptions?.filter(
                                    s => s.endpoint !== sub.endpoint
                                );
                            }
                        })
                    );
                }
                // Save if we removed subscriptions
                await admin.save();
            }
        }

        await Promise.all(pushPromises);
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
};
