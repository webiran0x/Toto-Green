// backend/routes/crypto.js
const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/adminMiddleware');
const cryptoController = require('../controllers/cryptoController');

// تولید یا بازیابی آدرس واریز ارز دیجیتال
router.post('/generate-address', protect, cryptoController.generateDepositAddress);

// دریافت وب‌هوک
router.post('/webhook', cryptoController.handleBlockchainWebhook);

// مسیرهای ادمین
router.get('/crypto-deposits', protect, authorize('admin'), cryptoController.getAllCryptoDeposits);
router.put('/crypto-deposits/:id/status', protect, authorize('admin'), cryptoController.updateCryptoDepositStatus);

module.exports = router;
