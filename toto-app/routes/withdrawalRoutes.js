// toto-app/routes/withdrawalRoutes.js
// مسیرهای مربوط به مدیریت درخواست‌های برداشت وجه (فقط برای ادمین)

const express = require('express');
const { protect, authorize } = require('../middleware/auth-old');
const {
    getAllWithdrawalRequests,
    approveWithdrawalRequest,
    rejectWithdrawalRequest
} = require('../controllers/withdrawalController'); // اطمینان حاصل کنید که توابع به درستی اکسپورت شده‌اند

const router = express.Router();

// تمام این مسیرها نیاز به احراز هویت و نقش ادمین دارند
router.route('/')
    .get(protect, authorize('admin'), getAllWithdrawalRequests);

router.route('/:id/approve')
    .put(protect, authorize('admin'), approveWithdrawalRequest);

router.route('/:id/reject')
    .put(protect, authorize('admin'), rejectWithdrawalRequest);

module.exports = router;
