import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import Product from '../models/Product';
import Order from '../models/Order';

// @desc    Get all products with search, filter, pagination
// @route   GET /api/products
const getProducts = asyncHandler(async (req: Request, res: Response) => {
    const pageSize = Number(req.query.pageSize) || 20;
    const page = Number(req.query.page) || 1;

    const keyword = req.query.keyword
        ? {
            $or: [
                { title: { $regex: req.query.keyword, $options: 'i' } },
                { character: { $regex: req.query.keyword, $options: 'i' } },
                { category: { $regex: req.query.keyword, $options: 'i' } },
            ],
        }
        : {};

    const characterFilter = req.query.character ? { character: req.query.character } : {};
    const categoryFilter = req.query.category ? { category: req.query.category } : {};
    const titleExactFilter = req.query.title ? { title: req.query.title } : {}; // New exact title filter
    const featuredFilter = req.query.featured === 'true' ? { featured: true } : {};
    const priceFilter: any = {};
    if (req.query.minPrice) priceFilter.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) priceFilter.$lte = Number(req.query.maxPrice);
    
    const filter = {
        ...keyword, // Keyword now searches title, character, and category
        ...characterFilter,
        ...categoryFilter,
        ...titleExactFilter, // Add exact title filter
        ...featuredFilter,
        ...(Object.keys(priceFilter).length > 0 ? { price: priceFilter } : {}),
    };

    const sortMap: Record<string, any> = {
        newest: { createdAt: -1 },
        priceAsc: { price: 1 },
        priceDesc: { price: -1 },
        topRated: { rating: -1 },
    };
    const sort = sortMap[req.query.sort as string] || { createdAt: -1 };

    const count = await Product.countDocuments(filter as any);
    const products = await Product.find(filter as any).sort(sort).limit(pageSize).skip(pageSize * (page - 1));

    res.json({ products, page, pages: Math.ceil(count / pageSize), total: count });
});

// @desc    Get single product
// @route   GET /api/products/:id
const getProductById = asyncHandler(async (req: Request, res: Response) => {
    const product = await Product.findById(req.params.id).populate('reviews.user', 'name profilePic');
    if (product) {
        res.json(product);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Create a product (Admin)
// @route   POST /api/products
const createProduct = asyncHandler(async (req: Request, res: Response) => {
    const { title, price, discount, character, category, imageUrl, sizes, featured, description, orientation } = req.body;

    const product = new Product({
        title: title || 'New Product',
        price: price || 0,
        discount: discount || 0,
        character: character || 'Unknown Character',
        category: category || 'Posters',
        imageUrl: imageUrl || '/images/sample.jpg',
        sizes: sizes || ['A4', 'A3', 'A2'],
        featured: featured || false,
        description: description || '',
        orientation: orientation || 'Portrait',
    });

    const created = await product.save();
    res.status(201).json(created);
});

// @desc    Update a product (Admin)
// @route   PUT /api/products/:id
const updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const p = await Product.findById(req.params.id);
    if (!p) { res.status(404); throw new Error('Product not found'); }
    const { title, price, discount, character, category, imageUrl, sizes, featured, description, orientation } = req.body;
    p.title = title ?? p.title;
    p.price = price ?? p.price;
    p.discount = discount ?? p.discount;
    p.character = character ?? p.character;
    p.category = category ?? p.category;
    p.imageUrl = imageUrl ?? p.imageUrl;
    p.sizes = sizes ?? p.sizes;
    p.featured = featured ?? p.featured;
    p.description = description ?? p.description;
    p.orientation = orientation ?? p.orientation;
    const updated = await p.save();
    res.json(updated);
});

// @desc    Delete product (Admin)
// @route   DELETE /api/products/:id
const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const product = await Product.findById(req.params.id);
    if (!product) { res.status(404); throw new Error('Product not found'); }
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product removed' });
});

// @desc    Create product review
// @route   POST /api/products/:id/reviews
const createProductReview = asyncHandler(async (req: any, res: Response) => {
    const { rating, comment, image } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) { res.status(404); throw new Error('Product not found'); }

    // Check if user has a DELIVERED order with this product
    const orders = await Order.find({
        user: req.user._id,
        status: 'delivered',
        'orderItems.product': product._id
    });

    if (orders.length === 0) {
        res.status(400);
        throw new Error('You can only review products that have been delivered to you.');
    }

    // Find an order that hasn't been reviewed yet for this product
    const existingReviews = product.reviews.filter(r => r.user.toString() === req.user._id.toString());
    const unreviewedOrder = orders.find(order => 
        !existingReviews.some(r => r.orderId.toString() === order._id.toString())
    );

    if (!unreviewedOrder) {
        res.status(400);
        throw new Error('You have already reviewed this product for all your delivered orders.');
    }

    const review = { 
        user: req.user._id, 
        name: req.user.name, 
        rating: Number(rating), 
        comment,
        orderId: unreviewedOrder._id,
        image,
        status: 'pending' // Default to pending
    };

    product.reviews.push(review as any);
    // Note: numReviews and rating are only updated when the review is APPROVED by admin
    await product.save();
    res.status(201).json({ message: 'Review submitted for moderation' });
});

// @desc    Get ALL reviews (Admin) - all statuses
// @route   GET /api/products/reviews/all
const getAllReviews = asyncHandler(async (_req: Request, res: Response) => {
    const products = await Product.find({ 'reviews.0': { $exists: true } }).populate('reviews.user', 'name profilePic');
    const allReviews: any[] = [];
    products.forEach(p => {
        p.reviews.forEach(r => {
            const userDoc = (r.user as any);
            allReviews.push({
                productId: p._id,
                productTitle: p.title,
                productImage: p.imageUrl,
                reviewId: r._id,
                userName: r.name,
                userProfilePic: userDoc?.profilePic || null,
                ...((r as any).toObject ? (r as any).toObject() : r)
            });
        });
    });
    // Sort newest first
    allReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(allReviews);
});

// @desc    Update review status (Admin)
// @route   PUT /api/products/:productId/reviews/:reviewId
const updateReviewStatus = asyncHandler(async (req: any, res: Response) => {
    const { status } = req.body; // 'approved' | 'rejected'
    const product = await Product.findById(req.params.productId);
    if (!product) { res.status(404); throw new Error('Product not found'); }

    const review = product.reviews.id(req.params.reviewId);
    if (!review) { res.status(404); throw new Error('Review not found'); }

    review.status = status;

    if (status === 'approved') {
        // Update product metrics only with approved reviews
        const approvedReviews = product.reviews.filter(r => r.status === 'approved');
        product.numReviews = approvedReviews.length;
        product.rating = approvedReviews.reduce((acc, r) => r.rating + acc, 0) / approvedReviews.length;
    } else {
        // If rejected or changed back, recalculate
        const approvedReviews = product.reviews.filter(r => r.status === 'approved');
        product.numReviews = approvedReviews.length;
        product.rating = approvedReviews.length > 0 
            ? approvedReviews.reduce((acc, r) => r.rating + acc, 0) / approvedReviews.length 
            : 0;
    }

    await product.save();
    res.json({ message: `Review ${status}` });
});

// @desc    Delete a review (Admin/User)
const deleteReview = asyncHandler(async (req: any, res: Response) => {
    const product = await Product.findById(req.params.productId);
    if (!product) { res.status(404); throw new Error('Product not found'); }

    const review = product.reviews.id(req.params.reviewId);
    if (!review) { res.status(404); throw new Error('Review not found'); }

    // Allow user to delete their own or admin
    if (review.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        res.status(401); throw new Error('Not authorized');
    }

    product.reviews.pull(req.params.reviewId);
    const approvedReviews = product.reviews.filter(r => r.status === 'approved');
    product.numReviews = approvedReviews.length;
    product.rating = approvedReviews.length > 0 
        ? approvedReviews.reduce((acc, r) => r.rating + acc, 0) / approvedReviews.length 
        : 0;

    await product.save();
    res.json({ message: 'Review removed' });
});

// @desc    Get featured products
// @route   GET /api/products/featured
const getFeaturedProducts = asyncHandler(async (_req: Request, res: Response) => {
    const products = await Product.find({ featured: true }).limit(8);
    res.json(products);
});

const getCategories = asyncHandler(async (_req: Request, res: Response) => {
    const categories = await Product.distinct('category');
    res.json(categories);
});

// @desc    Get all unique product titles
// @route   GET /api/products/titles
const getTitles = asyncHandler(async (_req: Request, res: Response) => {
    const titles = await Product.distinct('title');
    res.json(titles);
});

// @desc    Get character names
// @route   GET /api/products/characters
const getCharacters = asyncHandler(async (_req: Request, res: Response) => {
    const characters = await Product.distinct('character');
    res.json(characters);
});

// @desc    Get logged in user reviews
// @route   GET /api/products/myreviews
const getMyReviews = asyncHandler(async (req: any, res: Response) => {
    const products = await Product.find({ 'reviews.user': req.user._id });
    const myReviews: any[] = [];
    products.forEach(p => {
        p.reviews.forEach(r => {
            if (r.user.toString() === req.user._id.toString()) {
                myReviews.push({
                    productId: p._id,
                    productTitle: p.title,
                    productImage: p.imageUrl,
                    reviewId: r._id,
                    orderId: r.orderId,
                    name: r.name,
                    rating: r.rating,
                    comment: r.comment,
                    image: r.image,
                    status: (r as any).status || 'pending',
                    createdAt: (r as any).createdAt || new Date()
                });
            }
        });
    });
    res.json(myReviews);
});

export { getProducts, getProductById, createProduct, updateProduct, deleteProduct, createProductReview, getFeaturedProducts, getCategories, getCharacters, getTitles, getAllReviews, updateReviewStatus, deleteReview, getMyReviews };

