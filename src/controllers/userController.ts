import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import User from '../models/User';
import generateToken from '../utils/generateToken';
import sendEmail from '../utils/sendEmail';

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
        // Send Welcome Email
        const welcomeHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { margin: 0; padding: 0; background-color: #0c0c0c; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
                .wrapper { width: 100%; table-layout: fixed; background-color: #0c0c0c; padding: 40px 0; }
                .main { background-color: #161616; margin: 0 auto; width: 100%; max-width: 600px; border-radius: 24px; overflow: hidden; border: 1px solid #2a2a2a; }
                .header { background: #000000; padding: 50px 40px; text-align: center; border-bottom: 1px solid #1a1a1a; }
                .logo-text { font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: -1px; text-decoration: none; margin-left: 12px; vertical-align: middle; }
                .primary-text { color: #FF007F; }
                .content { padding: 50px 40px; color: #e0e0e0; line-height: 1.8; }
                .title { font-size: 28px; font-weight: 900; color: #ffffff; margin-bottom: 24px; text-align: center; letter-spacing: -0.5px; }
                .footer { background: #0a0a0a; padding: 40px; text-align: center; font-size: 13px; color: #666666; border-top: 1px solid #1a1a1a; }
                .cta-button { display: inline-block; background-color: #FF007F; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 800; margin-top: 20px; box-shadow: 0 4px 15px rgba(255, 0, 127, 0.3); }
            </style>
        </head>
        <body>
            <div class="wrapper">
                <div class="main">
                    <div class="header">
                        <img src="https://poster-sensei.vercel.app/assets/non_background_logo-BVboLjc2.png" alt="PosterSensei" style="width: 50px; height: 50px; vertical-align: middle;">
                        <span class="logo-text">POSTER<span class="primary-text">SENSEI</span></span>
                    </div>
                    <div class="content">
                        <h1 class="title">Welcome to the Guild, ${name}!</h1>
                        <p style="text-align: center; font-weight: 600; font-size: 16px;">Your journey into premium anime aesthetics begins now.</p>
                        <p style="text-align: center;">You've successfully joined the PosterSensei Art Guild. Prepare to explore a world of curated digital art and exclusive collections designed for the ultimate fan.</p>
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="https://poster-sensei.vercel.app" class="cta-button">Explore the Collection</a>
                        </div>
                        <p style="margin-top: 40px; text-align: center; font-weight: 800; color: #ffffff;">Stay inspired,<br>The PosterSensei Team</p>
                    </div>
                    <div class="footer">
                        <p style="margin-bottom: 10px;">&copy; 2026 PosterSensei Art Guild. All rights reserved.</p>
                        <p>You received this because you registered with PosterSensei.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Welcome to the Guild - PosterSensei',
                html: welcomeHtml
            });
        } catch (error) {
            console.error('Error sending welcome email:', error);
            // We don't want to fail registration if email fails
        }

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
    res.cookie('jwt', '', { 
        httpOnly: true, 
        expires: new Date(0),
        secure: true,
        sameSite: 'none'
    });
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

// @desc    Forgot password
// @route   POST /api/users/forgot-password
const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Generate 4-digit code
    const resetCode = Math.floor(1000 + Math.random() * 9000).toString();
    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    await user.save();

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { margin: 0; padding: 0; background-color: #0c0c0c; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
            .wrapper { width: 100%; table-layout: fixed; background-color: #0c0c0c; padding: 40px 0; }
            .main { background-color: #161616; margin: 0 auto; width: 100%; max-width: 600px; border-radius: 24px; overflow: hidden; border: 1px solid #2a2a2a; }
            .header { background: #000000; padding: 50px 40px; text-align: center; border-bottom: 1px solid #1a1a1a; }
            .logo-text { font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: -1px; text-decoration: none; margin-left: 12px; vertical-align: middle; }
            .primary-text { color: #FF007F; }
            .content { padding: 50px 40px; color: #e0e0e0; line-height: 1.8; }
            .title { font-size: 28px; font-weight: 900; color: #ffffff; margin-bottom: 24px; text-align: center; letter-spacing: -0.5px; }
            .code-container { background: #000000; border: 2px dashed #FF007F; border-radius: 16px; padding: 40px; text-align: center; margin: 36px 0; }
            .code-text { font-size: 48px; font-weight: 950; letter-spacing: 12px; color: #FF007F; margin: 0; filter: drop-shadow(0 0 10px rgba(255, 0, 127, 0.3)); }
            .footer { background: #0a0a0a; padding: 40px; text-align: center; font-size: 13px; color: #666666; border-top: 1px solid #1a1a1a; }
            .hint { color: #888888; font-size: 14px; text-align: center; margin-top: 30px; }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="main">
                <div class="header">
                    <img src="https://poster-sensei.vercel.app/assets/non_background_logo-BVboLjc2.png" alt="PosterSensei" style="width: 50px; height: 50px; vertical-align: middle;">
                    <span class="logo-text">POSTER<span class="primary-text">SENSEI</span></span>
                </div>
                <div class="content">
                    <h1 class="title">Security Verification</h1>
                    <p style="text-align: center; font-weight: 600; font-size: 16px;">Step into the light of your new identity.</p>
                    <p style="text-align: center;">We received a request to access your PosterSensei Vault. Use the unique recovery code below to proceed.</p>
                    <div class="code-container">
                        <p class="code-text">${resetCode}</p>
                    </div>
                    <p class="hint">This code is transient and will expire in <strong style="color: #ffffff;">10 minutes</strong>. If you didn't initiate this, your account is still secure. Simply stay inspired.</p>
                    <p style="margin-top: 40px; text-align: center; font-weight: 800; color: #ffffff;">The PosterSensei Art Guild</p>
                </div>
                <div class="footer">
                    <p style="margin-bottom: 10px;">&copy; 2026 PosterSensei Art Guild. Curating the finest anime aesthetics.</p>
                    <p>This is an automated security transmission. Please do not reply.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Identity Recovery Code - PosterSensei',
            html: htmlContent
        });
        const responseData: any = { message: 'Reset code sent to email' };
        if (process.env.NODE_ENV === 'development') {
            responseData.code = resetCode;
        }
        res.json(responseData);
    } catch (error) {
        console.error('Email send failed:', error);
        res.status(500);
        throw new Error('Email could not be sent');
    }
});

// @desc    Verify reset code
// @route   POST /api/users/verify-code
const verifyResetCode = asyncHandler(async (req: Request, res: Response) => {
    const { email, code } = req.body;
    const user = await User.findOne({ 
        email, 
        resetPasswordCode: code, 
        resetPasswordExpires: { $gt: new Date() } 
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired reset code');
    }

    res.json({ message: 'Code verified successfully' });
});

// @desc    Reset password
// @route   POST /api/users/reset-password
const resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email, code, password } = req.body;
    const user = await User.findOne({ 
        email, 
        resetPasswordCode: code, 
        resetPasswordExpires: { $gt: new Date() } 
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired reset code');
    }

    user.password = password;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
    res.json({ message: 'Password updated successfully' });
});

export { 
    authUser, registerUser, logoutUser, getUserProfile, updateUserProfile, 
    toggleWishlist, getWishlist, getUsers, deleteUser, updateUser,
    forgotPassword, verifyResetCode, resetPassword
};
