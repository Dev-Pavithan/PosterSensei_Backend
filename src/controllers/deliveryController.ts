import asyncHandler from 'express-async-handler';
import DeliveryMethod from '../models/DeliveryMethod';

// @desc    Get all active delivery methods
// @route   GET /api/delivery
// @access  Public
export const getActiveDeliveryMethods = asyncHandler(async (req, res) => {
    const methods = await DeliveryMethod.find({ isActive: true }).sort({ createdAt: 1 });
    res.json(methods);
});

// @desc    Get all delivery methods (including inactive)
// @route   GET /api/delivery/admin
// @access  Private/Admin
export const getAllDeliveryMethods = asyncHandler(async (req, res) => {
    const methods = await DeliveryMethod.find({}).sort({ createdAt: 1 });
    res.json(methods);
});

// @desc    Create a delivery method
// @route   POST /api/delivery
// @access  Private/Admin
export const createDeliveryMethod = asyncHandler(async (req, res) => {
    const { title, description, price, priceType, iconType, badge, isActive } = req.body;
    
    const method = new DeliveryMethod({
        title: title || 'New Delivery Method',
        description: description || 'Delivery description',
        price: price || 0,
        priceType: priceType || 'fixed',
        iconType: iconType || 'Truck',
        badge: badge || '',
        isActive: isActive !== undefined ? isActive : true
    });

    const createdMethod = await method.save();
    res.status(201).json(createdMethod);
});

// @desc    Update a delivery method
// @route   PUT /api/delivery/:id
// @access  Private/Admin
export const updateDeliveryMethod = asyncHandler(async (req, res) => {
    const { title, description, price, priceType, iconType, badge, isActive } = req.body;

    const method = await DeliveryMethod.findById(req.params.id);

    if (method) {
        method.title = title !== undefined ? title : method.title;
        method.description = description !== undefined ? description : method.description;
        method.price = price !== undefined ? price : method.price;
        method.priceType = priceType !== undefined ? priceType : method.priceType;
        method.iconType = iconType !== undefined ? iconType : method.iconType;
        method.badge = badge !== undefined ? badge : method.badge;
        method.isActive = isActive !== undefined ? isActive : method.isActive;

        const updatedMethod = await method.save();
        res.json(updatedMethod);
    } else {
        res.status(404);
        throw new Error('Delivery method not found');
    }
});

// @desc    Delete a delivery method
// @route   DELETE /api/delivery/:id
// @access  Private/Admin
export const deleteDeliveryMethod = asyncHandler(async (req, res) => {
    const method = await DeliveryMethod.findById(req.params.id);

    if (method) {
        await method.deleteOne();
        res.json({ message: 'Delivery method removed' });
    } else {
        res.status(404);
        throw new Error('Delivery method not found');
    }
});
