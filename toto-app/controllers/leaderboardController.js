const User = require('../models/User');

// @desc    دریافت جدول برترین‌ها (Leaderboard)
// @route   GET /api/leaderboard
// @access  Public
const getLeaderboard = async (req, res) => {
    // یافتن کاربران بر اساس امتیاز (score) به صورت نزولی
    const leaderboard = await User.find({})
        .select('username score') // فقط نام کاربری و امتیاز را انتخاب کنید
        .sort({ score: -1 }) // مرتب‌سازی بر اساس امتیاز از بالا به پایین
        .limit(10); // محدود کردن به 10 کاربر برتر

    res.json(leaderboard);
};

module.exports = {
    getLeaderboard
};
