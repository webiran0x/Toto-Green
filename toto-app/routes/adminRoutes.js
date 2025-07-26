// toto-app/routes/adminRoutes.js
// مسیرهای مربوط به عملیات‌های ادمین

const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware'); // استفاده از authMiddleware
const {
    getAdminProfile,
    getAllUsers,
    getUserById,
    updateUserByAdmin,
    blockUser,
    activateUser,
    getFinancialSummary,
    getAllTransactions,
    getSystemLogs,
    getUsersByRole,
    getUsersByStatus,
    getUsersByAccessLevel,
    // --- توابع جدید برای بازی‌ها، تراکنش‌ها، برداشت‌ها، و ...
    createGame,
    getAllGames,
    setGameResults,
    viewGamePredictions,
    getCryptoDeposits,
    getWithdrawalRequests,
    processWithdrawal,
    externalApiSync,
    getAdminSettings,
    updateAdminSettings,
    getUserPredictions,
    getPredictionsForTotoGame,
    closeTotoGameManually,
    downloadPredictions, // تابع دانلود را اینجا ایمپورت می‌کنیم
    cancelTotoGame,
    getPendingWithdrawalRequests,
    approveWithdrawalRequest,
    rejectWithdrawalRequest
} = require('../controllers/adminController');

const router = express.Router();

// --- مسیرهای عمومی (بدون نیاز به احراز هویت/نقش) ---
// این مسیر برای دانلود پیش‌بینی‌ها است و نیازی به لاگین یا نقش ادمین ندارد.
// این خط باید قبل از router.use(protect) و router.use(authorize) قرار گیرد.
router.get('/download-predictions/:totoGameId', downloadPredictions);

// --- تمام مسیرهای زیر نیاز به احراز هویت و نقش 'admin' دارند ---
router.use(protect); // استفاده از protect از authMiddleware
router.use(authorize('admin')); // استفاده از authorize از authMiddleware

router.get('/profile', getAdminProfile);

router.route('/users')
    .get(getAllUsers); // شامل فیلترها

router.get('/users/role/:role', getUsersByRole); // مسیر جدید
router.get('/users/status/:status', getUsersByStatus); // مسیر جدید
router.get('/users/access-level/:level', getUsersByAccessLevel); // مسیر جدید

router.route('/users/:id')
    .get(getUserById)
    .put(updateUserByAdmin);

router.put('/users/:id/block', blockUser);
router.put('/users/:id/activate', activateUser);

router.get('/users/:id/predictions', getUserPredictions); // مسیر دریافت پیش‌بینی‌های یک کاربر خاص

router.get('/financial-summary', getFinancialSummary);

// مسیر لاگ‌های سیستم
router.get('/logs', getSystemLogs);

// --- مسیرهای مدیریت Toto Games (بازی‌ها) ---
router.post('/games/create', createGame);
router.get('/games/all', getAllGames);

// مسیر جایگزین برای /api/admin/totos (در صورت نیاز فرانت‌اند)
router.get('/totos', getAllGames);

router.put('/games/set-results/:id', setGameResults); // ثبت نتایج بازی
router.get('/games/view-predictions/:id', viewGamePredictions); // مشاهده پیش‌بینی‌های یک بازی خاص

// مسیرهای اضافه شده جدید برای مدیریت بازی‌های Toto
router.get('/predictions/:totoGameId', getPredictionsForTotoGame); // دریافت پیش‌بینی‌های یک بازی Toto خاص
router.put('/close-toto/:totoGameId', closeTotoGameManually); // بستن دستی بازی Toto
// router.get('/download-predictions/:totoGameId', downloadPredictions); // این خط به بالای فایل منتقل شد
// --- اضافه شد: مسیر لغو بازی و بازپرداخت ---
router.put('/games/cancel-and-refund/:totoGameId', cancelTotoGame); // لغو بازی و بازپرداخت
// --- پایان بخش اضافه شد ---

// --- مسیرهای مربوط به تراکنش‌ها، واریزهای رمزارزی و برداشت‌ها ---
router.get('/transactions', getAllTransactions); // نمایش تمام تراکنش‌ها

router.get('/crypto-deposits', getCryptoDeposits); // GET /api/admin/crypto-deposits

// مسیرهای مدیریت برداشت‌ها
router.get('/withdrawals', getWithdrawalRequests); // GET /api/admin/withdrawals (مسیر کلی درخواست‌های برداشت)
router.get('/withdrawals/pending', getPendingWithdrawalRequests); // برداشت‌های در انتظار

router.put('/manage-withdrawals/:id/process', processWithdrawal); // PUT /api/admin/manage-withdrawals/:id/process (برای پردازش یا تأیید/رد برداشت)
router.put('/withdrawals/:requestId/approve', approveWithdrawalRequest); // تأیید برداشت
router.put('/withdrawals/:requestId/reject', rejectWithdrawalRequest); // رد برداشت


// --- مسیرهای مربوط به همگام‌سازی خارجی و تنظیمات ---
router.post('/external-sync', externalApiSync);
router.route('/settings')
    .get(getAdminSettings)
    .put(updateAdminSettings);

module.exports = router;
