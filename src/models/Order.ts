import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem {
    title: string;
    qty: number;
    image: string;
    price: number;
    size: string;
    product: mongoose.Types.ObjectId;
}

export interface IShippingAddress {
    address: string;
    city: string;
    postalCode: string;
    country: string;
}

export interface IOrder extends Document {
    user: mongoose.Types.ObjectId;
    orderItems: IOrderItem[];
    shippingAddress: IShippingAddress;
    deliveryMethod: 'post' | 'local_setup';
    paymentMethod: string;
    totalPrice: number;
    discount: number;
    couponCode: string;
    isPaid: boolean;
    paidAt: Date;
    isDelivered: boolean;
    deliveredAt: Date;
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    trackingId: string;
    notes: string;
}

const orderSchema = new Schema<IOrder>(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        orderItems: [
            {
                title: { type: String, required: true },
                qty: { type: Number, required: true },
                image: { type: String, required: true },
                price: { type: Number, required: true },
                size: { type: String, default: '' },
                product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            },
        ],
        shippingAddress: {
            address: { type: String, required: true },
            city: { type: String, required: true },
            postalCode: { type: String, required: true },
            country: { type: String, required: true },
        },
        deliveryMethod: { type: String, required: true, default: 'post' },
        paymentMethod: { type: String, required: true, default: 'Cash on Delivery' },
        totalPrice: { type: Number, required: true, default: 0.0 },
        discount: { type: Number, default: 0 },
        couponCode: { type: String, default: '' },
        isPaid: { type: Boolean, default: false },
        paidAt: { type: Date },
        isDelivered: { type: Boolean, default: false },
        deliveredAt: { type: Date },
        status: { type: String, default: 'pending' },
        trackingId: { type: String, default: '' },
        notes: { type: String, default: '' },
    },
    { timestamps: true }
);

const Order = mongoose.model<IOrder>('Order', orderSchema);
export default Order;
