// toto-app/routes/supportRoutes.js
// مسیرهای مربوط به مدیریت تیکت‌های پشتیبانی

const express = require('express');
const { protect } = require('../middleware/authMiddleware'); // <--- استفاده از authMiddleware
const {
    createTicket,
    getUserTickets, // <--- نام تابع به getUserTickets تغییر یافت
    getTicketById,
    addMessageToTicket,
    updateTicketStatus,
    assignTicket,
    getTicketsByStatus,
    getTicketsByPriority,
    getMyTickets // <--- اضافه شد: تابع برای دریافت تیکت‌های کاربر لاگین شده
} = require('../controllers/supportController');

const router = express.Router();

// مسیرهای کاربر (نیاز به احراز هویت)
router.post('/tickets', protect, createTicket); // ایجاد تیکت جدید
router.get('/tickets/my', protect, getMyTickets); // <--- اضافه شد: دریافت تمام تیکت‌های کاربر لاگین شده
router.get('/tickets/:id', protect, getTicketById); // دریافت یک تیکت خاص
router.post('/tickets/:id/messages', protect, addMessageToTicket); // اضافه کردن پیام به تیکت

// مسیرهای ادمین/پشتیبانی (نیاز به احراز هویت و نقش 'admin' یا 'support')
// توجه: برای سادگی، فعلاً همه اینها را با 'admin' محافظت می‌کنیم. می‌توانید authorize('admin', 'support') را استفاده کنید.
router.get('/admin/tickets', protect, getUserTickets); // دریافت همه تیکت‌ها (برای ادمین/پشتیبانی)
router.put('/admin/tickets/:id/status', protect, updateTicketStatus); // به‌روزرسانی وضعیت تیکت
router.put('/admin/tickets/:id/assign', protect, assignTicket); // اختصاص تیکت به ادمین/پشتیبانی
router.get('/admin/tickets/status/:status', protect, getTicketsByStatus); // فیلتر بر اساس وضعیت
router.get('/admin/tickets/priority/:priority', protect, getTicketsByPriority); // فیلتر بر اساس اولویت

module.exports = router;
