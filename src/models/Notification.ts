import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
    type: 'order' | 'contact';
    referenceId: mongoose.Types.ObjectId;
    message: string;
    isRead: boolean;
    createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
    {
        type: { type: String, required: true, enum: ['order', 'contact'] },
        referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
        message: { type: String, required: true },
        isRead: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const Notification = mongoose.model<INotification>('Notification', notificationSchema);
export default Notification;
