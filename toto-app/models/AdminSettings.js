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