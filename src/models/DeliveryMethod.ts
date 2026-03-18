import mongoose from 'mongoose';

const deliveryMethodSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    priceType: { type: String, enum: ['fixed', 'from'], default: 'fixed' },
    iconType: { type: String, required: true, default: 'Truck' },
    badge: { type: String },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

const DeliveryMethod = mongoose.model('DeliveryMethod', deliveryMethodSchema);

export default DeliveryMethod;
