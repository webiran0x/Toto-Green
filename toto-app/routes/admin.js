// backend/routes/admin.js
// مسیرهای API برای عملیات پنل مدیریت

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');      // احراز هویت
const { authorize } = require('../middleware/adminMiddleware');   // بررسی نقش

const {
  getPendingWithdrawalRequests,
  approveWithdrawalRequest,
  rejectWithdrawalRequest
} = require('../controllers/adminController');

// مدیریت درخواست‌های برداشت
router.get('/withdrawals/pending', protect, authorize('admin'), getPendingWithdrawalRequests);
router.put('/withdrawals/:requestId/approve', protect, authorize('admin'), approveWithdrawalRequest);
router.put('/withdrawals/:requestId/reject', protect, authorize('admin'), rejectWithdrawalRequest);

// همه مسیرهای ادمین باید توسط protect و authorize محافظت شوند
// ابتدا احراز هویت انجام شود، سپس نقش ادمین بررسی شود.

// @route GET /api/admin/profile
// @desc دریافت پروفایل ادمین
// @access Private (Admin)
router.get('/profile', protect, authorize('admin'), adminController.getAdminProfile);

// @route POST /api/admin/create-toto
// @desc ایجاد مسابقه Toto جدید
// @access Private (Admin)
router.post('/create-toto', protect, authorize('admin'), adminController.createTotoGame);

// @route PUT /api/admin/set-results/:totoGameId
// @desc ثبت نتیجه نهایی یک یا چند بازی در یک مسابقه Toto
// @access Private (Admin)
router.put('/set-results/:totoGameId', protect, authorize('admin'), adminController.setMatchResults);

// @route GET /api/admin/predictions/:totoGameId
// @desc دریافت تمام فرم‌های پیش‌بینی ثبت شده برای یک بازی Toto
// @access Private (Admin)
router.get('/predictions/:totoGameId', protect, authorize('admin'), adminController.getPredictionsForTotoGame);

// @route GET /api/admin/totos
// @desc دریافت لیست تمام بازی‌های Toto (برای پنل ادمین)
// @access Private (Admin)
router.get('/totos', protect, authorize('admin'), adminController.getAllTotoGamesAdmin);

// @route PUT /api/admin/close-toto/:totoGameId
// @desc مدیریت دستی وضعیت یک بازی Toto (بستن)
// @access Private (Admin)
router.put('/close-toto/:totoGameId', protect, authorize('admin'), adminController.closeTotoGameManually);

// @route GET /api/admin/download-predictions/:totoGameId
// @desc دانلود لیست تمام فرم‌های پیش‌بینی برای یک بازی
// @access Private (Admin)
router.get('/download-predictions/:totoGameId', protect, authorize('admin'), adminController.downloadPredictions);

// @route PUT /api/admin/cancel-game/:totoGameId
// @desc لغو یک بازی Toto و بازپرداخت مبلغ فرم‌ها
// @access Private (Admin)
router.put('/cancel-game/:totoGameId', protect, authorize('admin'), adminController.cancelTotoGame);

// @route GET /api/admin/users
// @desc دریافت لیست تمام کاربران
// @access Private (Admin)
router.get('/users', protect, authorize('admin'), adminController.getAllUsers);

// @route GET /api/admin/users/:userId
// @desc دریافت پروفایل یک کاربر خاص
// @access Private (Admin)
router.get('/users/:userId', protect, authorize('admin'), adminController.getUserById);

// @route PUT /api/admin/users/:userId
// @desc به‌روزرسانی پروفایل یک کاربر (توسط ادمین)
// @access Private (Admin)
router.put('/users/:userId', protect, authorize('admin'), adminController.updateUserProfileByAdmin);

// @route GET /api/admin/users/:userId/predictions
// @desc دریافت پیش‌بینی‌های یک کاربر خاص (توسط ادمین)
// @access Private (Admin)
router.get('/users/:userId/predictions', protect, authorize('admin'), adminController.getUserPredictionsByAdmin);

// @route GET /api/admin/financial-summary
// @desc دریافت خلاصه مالی پلتفرم
// @access Private (Admin)
router.get('/financial-summary', protect, authorize('admin'), adminController.getFinancialSummary);

// @route GET /api/admin/transactions
// @desc دریافت تمام تراکنش‌های سیستم
// @access Private (Admin)
router.get('/transactions', protect, authorize('admin'), adminController.getAllTransactions);

// @route GET /api/admin/logs
// @desc دریافت لاگ‌های سیستم
// @access Private (Admin)
router.get('/logs', protect, authorize('admin'), adminController.getSystemLogs);

module.exports = router;
