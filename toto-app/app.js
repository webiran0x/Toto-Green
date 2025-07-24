// toto-app/app.js
// فایل اصلی اپلیکیشن Express
console.log('APP.JS: Starting app loading...');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose'); // اضافه شده: برای اتصال مستقیم به MongoDB
const cron = require('node-cron'); // برای زمان‌بندی وظایف
const path = require('path'); // اضافه شده: برای کار با مسیرها
const fs = require('fs'); // اضافه شده: برای کار با فایل‌ها
const shkeeperWebhookRoutes = require('./routes/shkeeperWebhookRoutes');
const totoRoutes = require('./routes/totoGameRoutes');



// بارگذاری متغیرهای محیطی از فایل .env
dotenv.config();

// وارد کردن ابزارهای سفارشی
const logger = require('./config/logger'); // <--- اصلاح شد: مسیر logger به config/logger
const connectDB = require('./config/db'); // تابع اتصال به دیتابیس
const errorHandler = require('./middleware/errorHandler'); // میان‌افزار مدیریت خطا
const { closeExpiredTotoGames } = require('./services/totoService'); // سرویس بستن بازی‌های منقضی شده
const { clearAllCache } = require('./utils/cache'); // سرویس پاکسازی کش

// اتصال به دیتابیس MongoDB
connectDB();

const app = express();

// لیست آدرس‌های مجاز برای CORS
const allowedOrigins = [
  process.env.FRONTEND_USER_URL,
  process.env.FRONTEND_ADMIN_URL,
  'http://localhost:3000',
  'http://localhost:5001',
  'http://localhost:3001'
]; // پورت‌های فرانت‌اند کاربر و ادمین

// <--- اصلاح شد: پیکربندی CORS برای امنیت بیشتر در پروداکشن
app.use(cors({
    origin: function (origin, callback) {
        // اجازه دادن به درخواست‌هایی که مبدأ (origin) ندارند (مثل Postman یا درخواست‌های هم‌مبدأ)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
}));


// Middleware ها
app.use(express.json()); // برای تجزیه درخواست‌های JSON

// وارد کردن مسیرهای API
// مسیرهای API باید با نام فایل‌هایشان در پوشه 'routes' مطابقت داشته باشند
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const totoGameRoutes = require('./routes/totoGameRoutes');
const adminRoutes = require('./routes/adminRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const externalApiRoutes = require('./routes/externalApiRoutes');
const cryptoRoutes = require('./routes/crypto');
const supportRoutes = require('./routes/supportRoutes'); // <--- اضافه شد: وارد کردن مسیرهای پشتیبانی


// تعریف مسیرهای API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/totos', totoGameRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/external', externalApiRoutes);
app.use('/api/crypto', cryptoRoutes);
app.use('/api/shkeeper/webhook', shkeeperWebhookRoutes);
app.use('/api/support', supportRoutes); // <--- اضافه شد: استفاده از مسیرهای پشتیبانی
app.use('/api/users', userRoutes); // ✅ برای درخواست‌هایی مثل /api/users/games/:id/download
app.use('/api/totos', totoRoutes); // در حال حاضر داری اینو



// مسیر اصلی (اختیاری، برای تست)
app.get('/', (req, res) => {
    res.send('Toto Game API is running...');
});

// --- زمان‌بندی Cron Job برای بستن بازی‌های منقضی شده ---
// این cron job هر 5 دقیقه یکبار اجرا می‌شود (می‌توانید زمان‌بندی را تغییر دهید)
cron.schedule('*/5 * * * *', () => {
    logger.info('Running cron job: Checking for expired Toto games to close...');
    closeExpiredTotoGames();
});
// --------------------------------------------------------

// پاکسازی کش (مثلاً هر 30 دقیقه)
cron.schedule('*/30 * * * *', () => {
    logger.info('Running cron job: Clearing all application cache...');
    clearAllCache();
});
// --------------------------------------------------------

// Middleware مدیریت خطا (باید بعد از همه مسیرها قرار گیرد)
app.use(errorHandler);

// مدیریت خطاهای 404 - اگر هیچ مسیری با درخواست مطابقت نداشت
app.use((req, res, next) => {
  res.status(404).json({ message: 'API Endpoint Not Found' });
});


const PORT = process.env.PORT || 5001; // پورت پیش‌فرض 5001

app.listen(PORT, () => logger.info(`Server running on port ${PORT}`)); // استفاده از لاگر
