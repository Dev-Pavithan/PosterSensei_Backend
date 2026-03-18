import express from 'express';
import {
    getProducts, getProductById, createProduct, updateProduct, deleteProduct, createProductReview, getFeaturedProducts, getCategories, getCharacters, getTitles, getAllReviews, updateReviewStatus, deleteReview, getMyReviews
} from '../controllers/productController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/').get(getProducts).post(protect, admin, createProduct);
router.get('/featured', getFeaturedProducts);
router.get('/categories', getCategories);
router.get('/characters', getCharacters);
router.get('/titles', getTitles); // Added /titles route
router.route('/myreviews').get(protect, getMyReviews);
router.route('/reviews/all').get(protect, admin, getAllReviews);
router.route('/:productId/reviews/:reviewId')
    .put(protect, admin, updateReviewStatus)
    .delete(protect, admin, deleteReview); // Changed delete to include admin
router.route('/:id').get(getProductById).put(protect, admin, updateProduct).delete(protect, admin, deleteProduct);
router.route('/:id/reviews').post(protect, createProductReview);

export default router;
