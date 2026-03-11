import mongoose, { Document, Schema } from 'mongoose';

export interface IReview {
    user: mongoose.Types.ObjectId;
    name: string;
    rating: number;
    comment: string;
}

export interface IProduct extends Document {
    title: string;
    anime: string;
    category: string;
    tags: string[];
    price: number;
    originalPrice: number;
    discount: number;
    imageUrl: string;
    images: string[];
    stock: number;
    sizes: string[];
    featured: boolean;
    reviews: IReview[];
    rating: number;
    numReviews: number;
    description: string;
    seller: string;
}

const reviewSchema = new Schema<IReview>(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true },
        rating: { type: Number, required: true },
        comment: { type: String, required: true },
    },
    { timestamps: true }
);

const productSchema = new Schema<IProduct>(
    {
        title: { type: String, required: true },
        anime: { type: String, required: true },
        category: { type: String, required: true, default: 'Posters' },
        tags: [{ type: String }],
        price: { type: Number, required: true, default: 0 },
        originalPrice: { type: Number, default: 0 },
        discount: { type: Number, default: 0 }, // percentage
        imageUrl: { type: String, required: true },
        images: [{ type: String }],
        stock: { type: Number, required: true, default: 0 },
        sizes: [{ type: String }],
        featured: { type: Boolean, default: false },
        description: { type: String, default: '' },
        seller: { type: String, default: 'PosterSensei' },
        reviews: [reviewSchema],
        rating: { type: Number, default: 0 },
        numReviews: { type: Number, default: 0 },
    },
    { timestamps: true }
);

const Product = mongoose.model<IProduct>('Product', productSchema);
export default Product;
