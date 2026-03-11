import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import Coupon from '../models/Coupon';

// @desc    Validate a coupon code
// @route   POST /api/coupons/validate
const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
    const { code, cartTotal } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) {
        res.status(404); throw new Error('Invalid or expired coupon code');
    }

    if (coupon.expiryDate && coupon.expiryDate < new Date()) {
        res.status(400); throw new Error('Coupon has expired');
    }

    if (cartTotal < coupon.minPurchase) {
        res.status(400); throw new Error(`Minimum purchase of ₹${coupon.minPurchase} required for this coupon`);
    }

    res.json({
        code: coupon.code,
        discountType: coupon.discountType,
        discountAmount: coupon.discountAmount,
    });
});

// @desc    Create a new coupon (Admin)
// @route   POST /api/coupons
const createCoupon = asyncHandler(async (req: Request, res: Response) => {
    const { code, discountType, discountAmount, minPurchase, expiryDate } = req.body;
    const exists = await Coupon.findOne({ code: code.toUpperCase() });
    if (exists) { res.status(400); throw new Error('Coupon code already exists'); }

    const coupon = await Coupon.create({
        code: code.toUpperCase(), discountType, discountAmount, minPurchase, expiryDate
    });
    res.status(201).json(coupon);
});

export { validateCoupon, createCoupon };
