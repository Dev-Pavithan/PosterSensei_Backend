import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAddress {
    label: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
}

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    isAdmin: boolean;
    profilePic: string;
    phone: string;
    addresses: IAddress[];
    wishlist: mongoose.Types.ObjectId[];
    resetPasswordCode?: string;
    resetPasswordExpires?: Date;
    pushSubscriptions?: any[];
    matchPassword(enteredPassword: string): Promise<boolean>;
}

const addressSchema = new Schema<IAddress>({
    label: { type: String, default: 'Home' },
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
});

const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        isAdmin: { type: Boolean, default: false },
        profilePic: { type: String, default: '' },
        phone: { type: String, default: '' },
        addresses: [addressSchema],
        wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
        resetPasswordCode: { type: String },
        resetPasswordExpires: { type: Date },
        pushSubscriptions: { type: Array, default: [] },
    },
    { timestamps: true }
);

userSchema.methods.matchPassword = async function (enteredPassword: string) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model<IUser>('User', userSchema);
export default User;
