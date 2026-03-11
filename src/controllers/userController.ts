import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import User from '../models/User';
import generateToken from '../utils/generateToken';

// @desc    Auth user & get token
// @route   POST /api/users/login
const authUser = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
        generateToken(res, user._id as any);
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            profilePic: user.profilePic,
            phone: user.phone,
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Register user
// @route   POST /api/users
const registerUser = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }
    const user = await User.create({ name, email, password });
    if (user) {
        generateToken(res, user._id as any);
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            profilePic: user.profilePic,
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Logout user
// @route   POST /api/users/logout
const logoutUser = asyncHandler(async (_req: Request, res: Response) => {
    res.cookie('jwt', '', { httpOnly: true, expires: new Date(0) });
    res.json({ message: 'Logged out' });
});

// @desc    Get user profile
// @route   GET /api/users/profile
const getUserProfile = asyncHandler(async (req: any, res: Response) => {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
        res.json(user);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
const updateUserProfile = asyncHandler(async (req: any, res: Response) => {
    const user = await User.findById(req.user._id);
    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.phone = req.body.phone || user.phone;
        user.profilePic = req.body.profilePic || user.profilePic;
        if (req.body.password) {
            user.password = req.body.password;
        }
        if (req.body.addresses) {
            user.addresses = req.body.addresses;
        }
        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin,
            profilePic: updatedUser.profilePic,
            phone: updatedUser.phone,
            addresses: updatedUser.addresses,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Add/Remove from wishlist
// @route   PUT /api/users/wishlist/:productId
const toggleWishlist = asyncHandler(async (req: any, res: Response) => {
    const user = await User.findById(req.user._id);
    if (!user) { res.status(404); throw new Error('User not found'); }
    const productId = req.params.productId;
    const idx = user.wishlist.findIndex(id => id.toString() === productId);
    if (idx > -1) {
        user.wishlist.splice(idx, 1);
    } else {
        user.wishlist.push(productId as any);
    }
    await user.save();
    res.json({ wishlist: user.wishlist });
});

// @desc    Get wishlist
// @route   GET /api/users/wishlist
const getWishlist = asyncHandler(async (req: any, res: Response) => {
    const user = await User.findById(req.user._id).populate('wishlist');
    res.json(user?.wishlist || []);
});

// @desc    Get all users (Admin)
// @route   GET /api/users
const getUsers = asyncHandler(async (_req: Request, res: Response) => {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
});

// @desc    Delete user (Admin)
// @route   DELETE /api/users/:id
const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404); throw new Error('User not found'); }
    if (user.isAdmin) { res.status(400); throw new Error('Cannot delete admin user'); }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User removed' });
});

// @desc    Update user (Admin)
// @route   PUT /api/users/:id
const updateUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404); throw new Error('User not found'); }
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.isAdmin = req.body.isAdmin !== undefined ? req.body.isAdmin : user.isAdmin;
    const updated = await user.save();
    res.json({ _id: updated._id, name: updated.name, email: updated.email, isAdmin: updated.isAdmin });
});

export { authUser, registerUser, logoutUser, getUserProfile, updateUserProfile, toggleWishlist, getWishlist, getUsers, deleteUser, updateUser };
