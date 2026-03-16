import express from 'express';
import {
    authUser, registerUser, logoutUser, getUserProfile, updateUserProfile, toggleWishlist, getWishlist,
    getUsers, deleteUser, updateUser, forgotPassword, verifyResetCode, resetPassword
} from '../controllers/userController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/').get(protect, admin, getUsers).post(registerUser);
router.post('/auth', authUser);
router.post('/login', authUser);
router.post('/logout', logoutUser);
router.post('/forgot-password', forgotPassword);
router.post('/verify-code', verifyResetCode);
router.post('/reset-password', resetPassword);
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router.route('/wishlist').get(protect, getWishlist);
router.route('/wishlist/:productId').put(protect, toggleWishlist);
router.route('/:id').put(protect, admin, updateUser).delete(protect, admin, deleteUser);

export default router;
