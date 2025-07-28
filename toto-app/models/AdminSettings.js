// toto-app/models/AdminSettings.js
const mongoose = require('mongoose');

const adminSettingsSchema = mongoose.Schema({
    minDeposit: {
        type: Number,
        default: 0,
    },
    minWithdrawal: {
        type: Number,
        default: 0,
    },
    // --- اضافه شده: درصد کمیسیون رفرال ---
    referralCommissionPercentage: {
        type: Number,
        default: 0, // پیش‌فرض 0 به معنی عدم پرداخت کمیسیون است
        min: 0,      // حداقل مقدار 0
        max: 100     // حداکثر مقدار 100 (درصد)
    },
    // --- پایان بخش اضافه شده ---
    // Add other settings here, e.g.,
    // gameCreationFee: {
    //     type: Number,
    //     default: 0
    // },
    // enableCryptoPayments: {
    //     type: Boolean,
    //     default: true
    // }
}, {
    timestamps: true, // Optional: if you want createdAt and updatedAt fields
});

const AdminSettings = mongoose.model('AdminSettings', adminSettingsSchema);

module.exports = AdminSettings;