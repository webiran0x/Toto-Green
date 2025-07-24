// toto-app/routes/adminRoutes.js
// مسیرهای مربوط به عملیات‌های ادمین

const express = require('express');
const { protect, authorize } = require('../middleware/auth-old');
const {
    getAdminProfile,
    getAllUsers,
    getUserById,
    updateUserByAdmin,
    blockUser,
    activateUser,
    getFinancialSummary,
    getAllTransactions,
    getSystemLogs, // اصلاح شده: اکنون به درستی وارد شده
    getUsersByRole,
    getUsersByStatus,
    getUsersByAccessLevel,
    // --- توابع جدید برای بازی‌ها، تراکنش‌ها، برداشت‌ها، و ...
    createGame, // <--- نام تابع به createGame تغییر یافت
    getAllGames,
    setGameResults,
    viewGamePredictions,
    getCryptoDeposits,
    getWithdrawalRequests, // <--- برای دریافت همه درخواست‌های برداشت
    processWithdrawal, // <--- برای پردازش درخواست برداشت
    externalApiSync,
    getAdminSettings,
    updateAdminSettings,
    getUserPredictions, // تابع جدید برای دریافت پیش‌بینی‌های کاربر
    // <--- توابع جدیدی که در adminController.js اضافه خواهند شد
    getPredictionsForTotoGame, // اضافه شده
    closeTotoGameManually, // اضافه شده
    downloadPredictions, // اضافه شده
    cancelTotoGame, // اضافه شده
    getPendingWithdrawalRequests, // اضافه شده
    approveWithdrawalRequest, // اضافه شده
    rejectWithdrawalRequest // اضافه شده
} = require('../controllers/adminController');

const router = express.Router();

// تمام مسیرهای ادمین نیاز به احراز هویت و نقش 'admin' دارند
router.use(protect, authorize('admin'));

router.get('/profile', getAdminProfile);

router.route('/users')
    .get(getAllUsers); // شامل فیلترها

router.get('/users/role/:role', getUsersByRole); // مسیر جدید برای فیلتر بر اساس نقش
router.get('/users/status/:status', getUsersByStatus); // مسیر جدید برای فیلتر بر اساس وضعیت
router.get('/users/access-level/:level', getUsersByAccessLevel); // مسیر جدید برای فیلتر بر اساس سطح دسترسی

router.route('/users/:id')
    .get(getUserById)
    .put(updateUserByAdmin);

router.put('/users/:id/block', blockUser);
router.put('/users/:id/activate', activateUser);

router.get('/users/:id/predictions', getUserPredictions); // مسیر دریافت پیش‌بینی‌های یک کاربر خاص

router.get('/financial-summary', getFinancialSummary);

// <--- مسیر لاگ‌های سیستم (مسیر قدیمی /system-logs حذف شد)
router.get('/logs', getSystemLogs);

// --- مسیرهای مدیریت Toto Games (بازی‌ها) ---
router.post('/games/create', createGame); // POST /api/admin/games/create (از createToto به createGame تغییر یافت)
router.get('/games/all', getAllGames); // GET /api/admin/games/all

// <--- مسیر جایگزین برای /api/admin/totos (در صورت نیاز فرانت‌اند)
router.get('/totos', getAllGames);

router.put('/games/set-results/:id', setGameResults); // PUT /api/admin/games/set-results/:id
router.get('/games/view-predictions/:id', viewGamePredictions); // GET /api/admin/games/view-predictions/:id

// <--- مسیرهای اضافه شده جدید برای مدیریت بازی‌های Toto
router.get('/predictions/:totoGameId', getPredictionsForTotoGame); // دریافت پیش‌بینی‌های یک بازی Toto خاص
router.put('/close-toto/:totoGameId', closeTotoGameManually); // بستن دستی بازی Toto
router.get('/download-predictions/:totoGameId', downloadPredictions); // دانلود پیش‌بینی‌ها
router.put('/cancel-game/:totoGameId', cancelTotoGame); // لغو بازی

// --- مسیرهای مربوط به تراکنش‌ها، واریزهای رمزارزی و برداشت‌ها ---
router.get('/transactions', getAllTransactions); // نمایش تمام تراکنش‌ها

router.get('/crypto-deposits', getCryptoDeposits); // GET /api/admin/crypto-deposits

// <--- مسیرهای مدیریت برداشت‌ها
router.get('/withdrawals', getWithdrawalRequests); // GET /api/admin/withdrawals (مسیر کلی درخواست‌های برداشت)
router.get('/withdrawals/pending', getPendingWithdrawalRequests); // برداشت‌های در انتظار

router.put('/manage-withdrawals/:id/process', processWithdrawal); // PUT /api/admin/manage-withdrawals/:id/process (برای پردازش یا تأیید/رد برداشت)
router.put('/withdrawals/:requestId/approve', approveWithdrawalRequest); // تأیید برداشت (مسیر جدید)
router.put('/withdrawals/:requestId/reject', rejectWithdrawalRequest); // رد برداشت (مسیر جدید)


// --- مسیرهای مربوط به همگام‌سازی خارجی و تنظیمات ---
router.post('/external-sync', externalApiSync); // POST /api/admin/external-sync
router.route('/settings')
    .get(getAdminSettings)
    .put(updateAdminSettings);

module.exports = router;
