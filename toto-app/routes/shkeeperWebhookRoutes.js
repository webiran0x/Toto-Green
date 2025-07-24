// toto-app/routes/shkeeperWebhookRoutes.js
// مسیرهای مربوط به وب‌هوک‌های SHKeeper

const express = require('express');
const { shkeeperPaymentCallback } = require('../controllers/shkeeperWebhookController');

const router = express.Router();

// این مسیر برای دریافت اطلاع‌رسانی‌های پرداخت از SHKeeper است
// توجه: این مسیر نباید توسط protect middleware محافظت شود، اما باید مکانیزم احراز هویت خاص خود را داشته باشد (مثل Secret Key)
router.route('/callback')
    .post(shkeeperPaymentCallback);

module.exports = router;
