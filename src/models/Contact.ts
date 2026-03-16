import mongoose, { Document, Schema } from 'mongoose';

export interface IContact extends Document {
    name: string;
    email: string;
    message: string;
    status: string;
}

const contactSchema = new Schema<IContact>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true },
        message: { type: String, required: true },
        status: { type: String, default: 'Pending' },
    },
    { timestamps: true }
);

const Contact = mongoose.model<IContact>('Contact', contactSchema);
export default Contact;
