import express from 'express';
import {
    getProducts, getProductById, createProduct, updateProduct, deleteProduct, createProductReview, getFeaturedProducts, getCategories, getAnimes
} from '../controllers/productController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/').get(getProducts).post(protect, admin, createProduct);
router.get('/featured', getFeaturedProducts);
router.get('/categories', getCategories);
router.get('/animes', getAnimes);
router.route('/:id').get(getProductById).put(protect, admin, updateProduct).delete(protect, admin, deleteProduct);
router.route('/:id/reviews').post(protect, createProductReview);

export default router;
