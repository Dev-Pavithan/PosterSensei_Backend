import mongoose, { Document, Schema } from 'mongoose';

export interface IReview {
    user: mongoose.Types.ObjectId;
    name: string;
    rating: number;
    comment: string;
    orderId: mongoose.Types.ObjectId;
    image?: string;
    status: 'pending' | 'approved' | 'rejected';
}

export interface IProduct extends Document {
    title: string;
    character: string;
    category: string;
    price: number;
    discount: number;
    imageUrl: string;
    sizes: string[];
    featured: boolean;
    reviews: mongoose.Types.DocumentArray<IReview>;
    rating: number;
    numReviews: number;
    description: string;
    orientation: string;
}

const reviewSchema = new Schema<IReview>(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true },
        rating: { type: Number, required: true },
        comment: { type: String, required: true },
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
        image: { type: String },
        status: { type: String, required: true, default: 'pending', enum: ['pending', 'approved', 'rejected'] },
    },
    { timestamps: true }
);

const productSchema = new Schema<IProduct>(
    {
        title: { type: String, required: true },
        character: { type: String, required: true },
        category: { type: String, required: true, default: 'Posters' },
        price: { type: Number, required: true, default: 0 },
        discount: { type: Number, default: 0 }, // percentage
        imageUrl: { type: String, required: true },
        sizes: [{ type: String }],
        featured: { type: Boolean, default: false },
        description: { type: String, default: '' },
        orientation: { type: String, required: true, default: 'Portrait' },
        reviews: [reviewSchema],
        rating: { type: Number, default: 0 },
        numReviews: { type: Number, default: 0 },
    },
    { timestamps: true }
);

const Product = mongoose.model<IProduct>('Product', productSchema);
export default Product;
