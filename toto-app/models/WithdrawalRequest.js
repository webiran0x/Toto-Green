// toto-app/models/WithdrawalRequest.js
// مدل درخواست برداشت وجه

const mongoose = require('mongoose');

const withdrawalRequestSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    amount: { // مبلغ درخواست برداشت
        type: Number,
        required: true,
        min: 0.01 // حداقل مبلغ برداشت
    },
    currency: { // واحد پولی (مثلاً USDT)
        type: String,
        required: true,
        default: 'USDT' // پیش‌فرض USDT
    },
    walletAddress: { // آدرس کیف پول مقصد (برای ارز دیجیتال)
        type: String,
        required: true,
        trim: true
    },
    network: { // شبکه (مثلاً TRC20, ERC20)
        type: String,
        required: true,
        trim: true
    },
    status: { // وضعیت درخواست: 'pending', 'approved', 'rejected'
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    adminNotes: { // یادداشت‌های ادمین
        type: String,
        default: ''
    },
    processedBy: { // ادمینی که درخواست را پردازش کرده
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // ارجاع به مدل User (نقش ادمین)
        default: null
    },
    processedAt: { // زمان پردازش درخواست
        type: Date,
        default: null
    }
}, {
    timestamps: true // createdAt و updatedAt
});

const WithdrawalRequest = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);

module.exports = WithdrawalRequest;
