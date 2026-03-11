import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import Product from '../models/Product';

// @desc    Get all products with search, filter, pagination
// @route   GET /api/products
const getProducts = asyncHandler(async (req: Request, res: Response) => {
    const pageSize = Number(req.query.pageSize) || 12;
    const page = Number(req.query.page) || 1;

    const keyword = req.query.keyword
        ? { $or: [
            { title: { $regex: req.query.keyword, $options: 'i' } },
            { anime: { $regex: req.query.keyword, $options: 'i' } },
            { category: { $regex: req.query.keyword, $options: 'i' } },
            { tags: { $in: [new RegExp(req.query.keyword as string, 'i')] } },
          ] }
        : {};

    const animeFilter = req.query.anime ? { anime: req.query.anime } : {};
    const categoryFilter = req.query.category ? { category: req.query.category } : {};
    const featuredFilter = req.query.featured === 'true' ? { featured: true } : {};
    const priceFilter: any = {};
    if (req.query.minPrice) priceFilter.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) priceFilter.$lte = Number(req.query.maxPrice);
    
    const filter = {
        ...keyword,
        ...animeFilter,
        ...categoryFilter,
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
    const product = await Product.findById(req.params.id);
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
    const { title, price, originalPrice, discount, anime, category, imageUrl, stock, sizes, featured, description } = req.body;

    const product = new Product({
        title: title || 'New Product',
        price: price || 0,
        originalPrice: originalPrice || 0,
        discount: discount || 0,
        anime: anime || 'Unknown Anime',
        category: category || 'Posters',
        imageUrl: imageUrl || '/images/sample.jpg',
        stock: stock || 0,
        sizes: sizes || ['A4', 'A3', 'A2'],
        featured: featured || false,
        description: description || '',
    });

    const created = await product.save();
    res.status(201).json(created);
});

// @desc    Update a product (Admin)
// @route   PUT /api/products/:id
const updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const p = await Product.findById(req.params.id);
    if (!p) { res.status(404); throw new Error('Product not found'); }
    const { title, price, originalPrice, discount, anime, category, tags, imageUrl, images, stock, sizes, featured, description, seller } = req.body;
    p.title = title ?? p.title;
    p.price = price ?? p.price;
    p.originalPrice = originalPrice ?? p.originalPrice;
    p.discount = discount ?? p.discount;
    p.anime = anime ?? p.anime;
    p.category = category ?? p.category;
    p.tags = tags ?? p.tags;
    p.imageUrl = imageUrl ?? p.imageUrl;
    p.images = images ?? p.images;
    p.stock = stock ?? p.stock;
    p.sizes = sizes ?? p.sizes;
    p.featured = featured ?? p.featured;
    p.description = description ?? p.description;
    p.seller = seller ?? p.seller;
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
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) { res.status(404); throw new Error('Product not found'); }
    const alreadyReviewed = product.reviews.find(r => r.user.toString() === req.user._id.toString());
    if (alreadyReviewed) { res.status(400); throw new Error('Product already reviewed'); }
    const review = { user: req.user._id, name: req.user.name, rating: Number(rating), comment };
    product.reviews.push(review as any);
    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((acc, r) => r.rating + acc, 0) / product.reviews.length;
    await product.save();
    res.status(201).json({ message: 'Review added' });
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

// @desc    Get anime names
// @route   GET /api/products/animes
const getAnimes = asyncHandler(async (_req: Request, res: Response) => {
    const animes = await Product.distinct('anime');
    res.json(animes);
});

export { getProducts, getProductById, createProduct, updateProduct, deleteProduct, createProductReview, getFeaturedProducts, getCategories, getAnimes };
