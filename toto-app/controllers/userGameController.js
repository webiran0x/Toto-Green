// toto-app/controllers/userGameController.js
const asyncHandler = require('express-async-handler');
const ExcelJS = require('exceljs');
const TotoGame = require('../models/TotoGame');
const Prediction = require('../models/Prediction');

// @desc    دانلود گزارش Excel بازی بر اساس gameId
// @route   GET /api/users/games/:gameId/download
// @access  Private
const downloadGameExcel = asyncHandler(async (req, res) => {
    const { gameId } = req.params;

    // بازی را پیدا کن
    const totoGame = await TotoGame.findById(gameId);
    if (!totoGame) {
        return res.status(404).json({ message: 'بازی یافت نشد.' });
    }

    // داده‌های پیش‌بینی‌های بازی را بگیر (اختیاری)
    const predictions = await Prediction.find({ totoGame: gameId }).populate('user', 'username email');

    // ساخت ورک‌بوک Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Predictions');

    // هدرهای جدول
    worksheet.columns = [
        { header: 'شناسه پیش‌بینی', key: 'id', width: 25 },
        { header: 'نام کاربری', key: 'username', width: 20 },
        { header: 'ایمیل', key: 'email', width: 30 },
        { header: 'تاریخ ثبت', key: 'createdAt', width: 20 },
        { header: 'جزئیات پیش‌بینی', key: 'details', width: 50 },
        { header: 'قیمت پرداخت شده', key: 'price', width: 15 },
    ];

    // داده‌ها را اضافه کن
    predictions.forEach(pred => {
        worksheet.addRow({
            id: pred._id.toString(),
            username: pred.user?.username || 'ناشناخته',
            email: pred.user?.email || 'ناشناخته',
            createdAt: pred.createdAt.toISOString().split('T')[0], // فقط تاریخ
            details: JSON.stringify(pred.predictions), // می‌تونی بهتر فرمت کنی اگر بخوای
            price: pred.price,
        });
    });

    // هدرهای پاسخ برای دانلود فایل
    res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
        'Content-Disposition',
        `attachment; filename="toto_game_${gameId}_predictions.xlsx"`
    );

    // ارسال فایل به کلاینت
    await workbook.xlsx.write(res);
    res.end();
});

module.exports = {
    downloadGameExcel
};
