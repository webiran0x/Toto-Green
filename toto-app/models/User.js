// toto-app/models/User.js
// مدل کاربر (User Model)

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: { // اضافه شده: ایمیل کاربر
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+\@.+\..+/, 'لطفاً یک ایمیل معتبر وارد کنید.'] // اعتبارسنجی فرمت ایمیل
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin','support'],
        default: 'user'
    },
    accessLevel: { // اضافه شده: سطح دسترسی کاربر (برای VIP و غیره)
        type: String,
        enum: ['normal', 'vip', 'moderator'],
        default: 'normal'
    },
    status: { // اضافه شده: وضعیت کاربر (فعال، مسدود، معلق)
        type: String,
        enum: ['active', 'blocked', 'suspended'],
        default: 'active'
    },
    score: {
        type: Number,
        default: 0
    },
    balance: {
        type: Number,
        default: 0
    },
    wallet: {
  type: Number,
  default: 0
},
    referrer: { // اضافه شده: ارجاع دهنده (کاربری که این کاربر را دعوت کرده)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true // اضافه کردن createdAt و updatedAt به صورت خودکار
});

// رمزنگاری رمز عبور قبل از ذخیره
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) { // فقط در صورت تغییر رمز عبور آن را هش کنید
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

// متد برای مقایسه رمز عبور
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
