// toto-app/controllers/adminController.js
// کنترلر برای عملیات‌های ادمین

const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Prediction = require('../models/Prediction');
const TotoGame = require('../models/TotoGame');
const CryptoDeposit = require('../models/CryptoDeposit');
const Withdrawal = require('../models/WithdrawalRequest');
const AdminSettings = require('../models/AdminSettings');

const logger = require('../utils/logger'); // سیستم لاگ‌گیری
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// @desc    دریافت پروفایل ادمین
// @route   GET /api/admin/profile
// @access  Private/Admin
const getAdminProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    if (user && user.role === 'admin') {
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            balance: user.balance,
            score: user.score
        });
    } else {
        res.status(404).json({ message: 'ادمین یافت نشد.' });
    }
});

// @desc    دریافت تمام کاربران (با قابلیت جستجو، فیلتر و صفحه‌بندی)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
    const { keyword, role, status, accessLevel, page = 1, limit = 10 } = req.query;

    const query = {};
    if (keyword) {
        query.$or = [
            { username: { $regex: keyword, $options: 'i' } },
            { email: { $regex: keyword, $options: 'i' } }
        ];
    }
    if (role) {
        query.role = role;
    }
    if (status) {
        query.status = status;
    }
    if (accessLevel) {
        query.accessLevel = accessLevel;
    }

    const count = await User.countDocuments(query);
    const users = await User.find(query)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select('-password')
        .sort({ createdAt: -1 });

    res.json({
        users,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalUsers: count
    });
});

// @desc    دریافت کاربر بر اساس ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ message: 'کاربر یافت نشد.' });
    }
});

// @desc    به‌روزرسانی پروفایل کاربر توسط ادمین
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUserByAdmin = asyncHandler(async (req, res) => {
    const { username, email, role, accessLevel, status, balance, score, password } = req.body;

    const user = await User.findById(req.params.id);

    if (user) {
        user.username = username || user.username;
        user.email = email || user.email;
        user.role = role || user.role;
        user.accessLevel = accessLevel || user.accessLevel;
        user.status = status || user.status;
        user.balance = balance !== undefined ? balance : user.balance; // Allow 0
        user.score = score !== undefined ? score : user.score; // Allow 0

        if (password) {
            user.password = password; // pre-save hook will hash it
        }

        const updatedUser = await user.save();
        logger.info(`Admin ${req.user.username} updated user ${updatedUser.username} (ID: ${updatedUser._id}).`);

        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role,
            accessLevel: updatedUser.accessLevel,
            status: updatedUser.status,
            balance: updatedUser.balance,
            score: updatedUser.score,
        });
    } else {
        res.status(404).json({ message: 'کاربر یافت نشد.' });
    }
});

// @desc    مسدود کردن کاربر
// @route   PUT /api/admin/users/:id/block
// @access  Private/Admin
const blockUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
        user.status = 'blocked';
        await user.save();
        logger.warn(`Admin ${req.user.username} blocked user ${user.username} (ID: ${user._id}).`);
        res.json({ message: 'کاربر با موفقیت مسدود شد.' });
    } else {
        res.status(404).json({ message: 'کاربر یافت نشد.' });
    }
});

// @desc    فعال کردن کاربر
// @route   PUT /api/admin/users/:id/activate
// @access  Private/Admin
const activateUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
        user.status = 'active';
        await user.save();
        logger.info(`Admin ${req.user.username} activated user ${user.username} (ID: ${user._id}).`);
        res.json({ message: 'کاربر با موفقیت فعال شد.' });
    } else {
        res.status(404).json({ message: 'کاربر یافت نشد.' });
    }
});

// @desc    دریافت خلاصه مالی پلتفرم
// @route   GET /api/admin/financial-summary
// @access  Private/Admin
const getFinancialSummary = asyncHandler(async (req, res) => {
    const totalUsers = await User.countDocuments();
    const totalBalance = await User.aggregate([
        { $group: { _id: null, total: { $sum: '$balance' } } }
    ]);
    const totalPredictions = await Prediction.countDocuments();
    const totalTotoGames = await TotoGame.countDocuments();
    const totalDeposits = await Transaction.aggregate([
        { $match: { type: 'deposit', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalWithdrawals = await Transaction.aggregate([
        { $match: { type: 'withdrawal', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
        totalUsers,
        totalBalance: totalBalance.length > 0 ? totalBalance[0].total : 0,
        totalPredictions,
        totalTotoGames,
        totalDeposits: totalDeposits.length > 0 ? totalDeposits[0].total : 0,
        totalWithdrawals: totalWithdrawals.length > 0 ? totalWithdrawals[0].total : 0,
    });
});

// @desc    دریافت تمام تراکنش‌های سیستم
// @route   GET /api/admin/transactions
// @access  Private/Admin
const getAllTransactions = asyncHandler(async (req, res) => {
    const transactions = await Transaction.find({})
        .populate('user', 'username email')
        .sort({ createdAt: -1 });
    res.json(transactions);
});

// @desc    دریافت لاگ‌های سیستم
// @route   GET /api/admin/logs
// @access  Private/Admin
const getSystemLogs = asyncHandler(async (req, res) => {
    const logFilePath = path.join(__dirname, '../logs/combined.log'); // مسیر فایل لاگ
    fs.readFile(logFilePath, 'utf8', (err, data) => {
        if (err) {
            logger.error(`Error reading log file: ${err.message}`);
            return res.status(500).json({ message: 'خطا در خواندن فایل لاگ.' });
        }
        res.send(data);
    });
});

// @desc    دریافت کاربران بر اساس نقش
// @route   GET /api/admin/users/role/:role
// @access  Private/Admin
const getUsersByRole = asyncHandler(async (req, res) => {
    const { role } = req.params;
    const users = await User.find({ role }).select('-password');
    res.json(users);
});

// @desc    دریافت کاربران بر اساس وضعیت
// @route   GET /api/admin/users/status/:status
// @access  Private/Admin
const getUsersByStatus = asyncHandler(async (req, res) => {
    const { status } = req.params;
    const users = await User.find({ status }).select('-password');
    res.json(users);
});

// @desc    دریافت کاربران بر اساس سطح دسترسی
// @route   GET /api/admin/users/access-level/:level
// @access  Private/Admin
const getUsersByAccessLevel = asyncHandler(async (req, res) => {
    const { level } = req.params;
    const users = await User.find({ accessLevel: level }).select('-password');
    res.json(users);
});

// @desc    ایجاد یک بازی Toto جدید (createGame)
// @route   POST /api/admin/games/create
// @access  Private/Admin
const createGame = asyncHandler(async (req, res) => { // نام تابع در اینجا createGame است
    const { name, deadline, matches } = req.body;

    // <--- اضافه شد: لاگ کردن req.body برای اشکال‌زدایی
    logger.info('Received request body for createGame:', req.body);

    // اعتبارسنجی اولیه (این اعتبارسنجی‌ها قبل از Mongoose اجرا می‌شوند)
    if (!name || !deadline || !matches || !Array.isArray(matches) || matches.length !== 15) {
        logger.warn(`Validation failed for createGame: Missing name, deadline, or 15 matches. Received: ${JSON.stringify(req.body)}`);
        return res.status(400).json({ message: 'لطفاً نام، مهلت و دقیقاً ۱۵ بازی را وارد کنید.' });
    }

    // اعتبارسنجی جزئیات هر بازی
    for (const match of matches) {
        if (!match.homeTeam || !match.awayTeam || !match.date) {
            logger.warn(`Validation failed for createGame: Missing homeTeam, awayTeam, or date in a match. Received match: ${JSON.stringify(match)}`);
            return res.status(400).json({ message: 'هر بازی باید شامل تیم میزبان، تیم مهمان و تاریخ باشد.' });
        }
    }

    try {
        const newTotoGame = await TotoGame.create({
            name,
            deadline,
            matches,
            status: 'open', // وضعیت پیش‌فرض
            totalPot: 0,
            commissionAmount: 0,
            prizePool: 0,
            prizes: { firstPlace: 0, secondPlace: 0, thirdPlace: 0 },
            winners: { first: [], second: [], third: [] }
        });

        logger.info(`Admin ${req.user.username} created a new Toto game: ${newTotoGame.name} (ID: ${newTotoGame._id}).`);
        res.status(201).json({ message: 'بازی Toto با موفقیت ایجاد شد.', game: newTotoGame });

    } catch (error) {
        // <--- اضافه شد: لاگ کردن جزئیات خطای Mongoose Validation Error
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            logger.error(`Mongoose Validation Error during createGame: ${errors.join(', ')}. Request body: ${JSON.stringify(req.body)}`);
            return res.status(400).json({ message: errors.join(', ') }); // ارسال پیام خطای دقیق Mongoose
        }
        logger.error(`Error creating Toto game: ${error.message}. Stack: ${error.stack}. Request body: ${JSON.stringify(req.body)}`);
        res.status(500).json({ message: 'خطا در ایجاد بازی Toto.' });
    }
});

// @desc    دریافت تمام بازی‌های Toto
// @route   GET /api/admin/games/all
// @access  Private/Admin
const getAllGames = asyncHandler(async (req, res) => {
    const games = await TotoGame.find({}).sort({ deadline: -1 });
    res.json(games);
});

// @desc    ثبت نتیجه نهایی یک یا چند بازی در یک مسابقه Toto
// @route   PUT /api/admin/games/set-results/:id


// @desc    ثبت نتیجه نهایی یک یا چند بازی در یک مسابقه Toto
// @route   PUT /api/admin/games/set-results/:id
// @access  Private/Admin

const { rewardWinners } = require('../services/totoRewardService');

const setGameResults = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { results } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'شناسه بازی Toto نامعتبر است.' });
  }

  const totoGame = await TotoGame.findById(id);
  if (!totoGame) {
    return res.status(404).json({ message: 'بازی Toto یافت نشد.' });
  }

  if (!Array.isArray(results) || results.length === 0) {
    return res.status(400).json({ message: 'نتیجه‌ای برای ثبت ارسال نشده است.' });
  }

  let updatedAnyMatch = false;
  results.forEach((result) => {
    const matchIndex = totoGame.matches.findIndex((m) => m._id.toString() === result.matchId);
    if (matchIndex !== -1 && ['1', 'X', '2'].includes(result.result)) {
      totoGame.matches[matchIndex].result = result.result;
      totoGame.matches[matchIndex].isClosed = true;
      updatedAnyMatch = true;
    }
  });

  if (!updatedAnyMatch) {
    return res.status(400).json({ message: 'هیچ بازی معتبری برای ثبت نتیجه یافت نشد.' });
  }

  await totoGame.save();

  const allMatchesClosed = totoGame.matches.every((match) => match.result && match.isClosed);

  if (!allMatchesClosed) {
    return res.json({
      status: 'partial',
      message: 'نتایج ارسال شده ثبت شدند. هنوز برخی بازی‌ها نتیجه ندارند.',
      totoGame,
    });
  }

  // ✅ اجرای منطق امتیازدهی و توزیع جوایز
  const rewardResult = await rewardWinners(totoGame);

  logger.info(`Admin ${req.user.username} set results and rewarded for Toto game: ${totoGame.name}`);

  return res.json(rewardResult);
});



// @desc    دریافت پیش‌بینی‌های یک بازی Toto خاص
// @route   GET /api/admin/predictions/:totoGameId
// @access  Private/Admin
const getPredictionsForTotoGame = asyncHandler(async (req, res) => {
    const { totoGameId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(totoGameId)) {
        return res.status(400).json({ message: 'شناسه بازی Toto نامعتبر است.' });
    }

    const predictions = await Prediction.find({ totoGame: totoGameId }).populate('user', 'username email');
    if (!predictions) {
        return res.status(404).json({ message: 'پیش‌بینی برای این بازی یافت نشد.' });
    }
    res.json(predictions);
});

// @desc    بستن دستی بازی Toto
// @route   PUT /api/admin/close-toto/:totoGameId
// @access  Private/Admin
const closeTotoGameManually = asyncHandler(async (req, res) => {
    const { totoGameId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(totoGameId)) {
        return res.status(400).json({ message: 'شناسه بازی Toto نامعتبر است.' });
    }

    const totoGame = await TotoGame.findById(totoGameId);

    if (!totoGame) {
        return res.status(404).json({ message: 'بازی Toto یافت نشد.' });
    }

    if (totoGame.status === 'closed') {
        return res.status(400).json({ message: 'بازی Toto قبلاً بسته شده است.' });
    }

    totoGame.status = 'closed';
    await totoGame.save();
    logger.info(`Admin ${req.user.username} manually closed Toto game: ${totoGame.name} (ID: ${totoGame._id}).`);
    res.json({ message: 'بازی Toto با موفقیت بسته شد.', totoGame });
});

// @desc    دانلود پیش‌بینی‌های یک بازی Toto
// @route   GET /api/admin/download-predictions/:totoGameId
// @access  Private/Admin
const downloadPredictions = asyncHandler(async (req, res) => {
    const { totoGameId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(totoGameId)) {
        return res.status(400).json({ message: 'شناسه بازی Toto نامعتبر است.' });
    }

    const game = await TotoGame.findById(totoGameId);
    if (!game) {
        return res.status(404).json({ message: 'بازی Toto یافت نشد.' });
    }

    const predictions = await Prediction.find({ totoGame: totoGameId }).populate('user', 'username');

    // TODO: پیاده‌سازی تولید فایل CSV/Excel
    // این بخش نیاز به کتابخانه‌ای مانند 'exceljs' یا 'csv-parser' دارد.
    // به دلیل پیچیدگی تولید فایل در اینجا، این قسمت به عنوان یک TODO باقی می‌ماند.
    // مثال ساده برای CSV:
    let csvContent = "User,Match ID,Chosen Outcome,Price,Score\n";
    predictions.forEach(p => {
        p.predictions.forEach(matchPred => {
            csvContent += `${p.user.username},${matchPred.matchId},"${matchPred.chosenOutcome.join(',')}",${p.price},${p.score}\n`;
        });
    });

    res.header('Content-Type', 'text/csv');
    res.attachment(`${game.name}-predictions.csv`);
    res.send(csvContent);

    logger.info(`Admin ${req.user.username} downloaded predictions for Toto game: ${game.name} (ID: ${game._id}).`);
});

// @desc    لغو بازی Toto
// @route   PUT /api/admin/cancel-game/:totoGameId
// @access  Private/Admin
const cancelTotoGame = asyncHandler(async (req, res) => {
    const { totoGameId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(totoGameId)) {
        return res.status(400).json({ message: 'شناسه بازی Toto نامعتبر است.' });
    }

    const totoGame = await TotoGame.findById(totoGameId);

    if (!totoGame) {
        return res.status(404).json({ message: 'بازی Toto یافت نشد.' });
    }

    if (totoGame.status === 'cancelled') {
        return res.status(400).json({ message: 'بازی Toto قبلاً لغو شده است.' });
    }

    totoGame.status = 'cancelled';
    // TODO: منطق بازپرداخت پول به کاربرانی که در این بازی پیش‌بینی کرده‌اند
    // این بخش باید تمام پیش‌بینی‌های مرتبط با این بازی را پیدا کرده و مبلغ آن‌ها را به کاربران بازگرداند.
    // برای سادگی، فعلاً فقط وضعیت را تغییر می‌دهیم.
    await totoGame.save();

    logger.warn(`Admin ${req.user.username} cancelled Toto game: ${totoGame.name} (ID: ${totoGame._id}). Refund logic needs to be implemented.`);
    res.json({ message: 'بازی Toto با موفقیت لغو شد. (بازپرداخت‌ها باید پیاده‌سازی شوند).', totoGame });
});


// @desc    دریافت تمام واریزهای رمزارزی
// @route   GET /api/admin/crypto-deposits
// @access  Private/Admin
const getCryptoDeposits = asyncHandler(async (req, res) => {
    const deposits = await CryptoDeposit.find({}).populate('user', 'username email').sort({ createdAt: -1 });
    res.json(deposits);
});

// @desc    دریافت تمام درخواست‌های برداشت وجه (با فیلتر وضعیت)
// @route   GET /api/admin/withdrawals
// @access  Private/Admin
const getWithdrawalRequests = asyncHandler(async (req, res) => {
    const { status } = req.query; // می‌توانید با /api/admin/withdrawals?status=pending فیلتر کنید
    let query = {};
    if (status) {
        query.status = status;
    }
    const requests = await Withdrawal.find(query)
        .populate('user', 'username email balance')
        .populate('processedBy', 'username')
        .sort({ createdAt: -1 });
    logger.info(`Admin fetched withdrawal requests. Filtered by status: ${status || 'None'}. Found ${requests.length} requests.`);
    res.json(requests);
});

// @desc    دریافت درخواست‌های برداشت وجه در انتظار
// @route   GET /api/admin/withdrawals/pending
// @access  Private/Admin
const getPendingWithdrawalRequests = asyncHandler(async (req, res) => {
    const requests = await Withdrawal.find({ status: 'pending' })
        .populate('user', 'username email balance')
        .sort({ createdAt: 1 }); // قدیمی‌ترین‌ها ابتدا
    logger.info(`Admin fetched pending withdrawal requests. Found ${requests.length} requests.`);
    res.json(requests);
});


// @desc    پردازش درخواست برداشت وجه (تایید یا رد)
// @route   PUT /api/admin/manage-withdrawals/:id/process
// @access  Private/Admin
const processWithdrawal = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { action, adminNotes } = req.body; // 'approve' or 'reject'

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'شناسه درخواست برداشت نامعتبر است.' });
    }

    const request = await Withdrawal.findById(id).populate('user');

    if (!request) {
        return res.status(404).json({ message: 'درخواست برداشت یافت نشد.' });
    }

    if (request.status !== 'pending') {
        return res.status(400).json({ message: `درخواست برداشت قبلاً ${request.status} شده است.` });
    }

    if (action === 'approve') {
        request.status = 'approved';
        request.processedBy = req.user._id;
        request.processedAt = new Date();
        request.adminNotes = adminNotes || 'Approved by admin.';

        // TODO: در اینجا باید منطق واقعی انتقال وجه (مثلاً با SHKeeper Payout API) پیاده‌سازی شود.
        // فعلاً فقط وضعیت را در دیتابیس تغییر می‌دهیم.
        // اگر انتقال وجه واقعی ناموفق بود، باید وضعیت را به 'failed' برگردانید و مبلغ را به کاربر بازگردانید.

        // ثبت تراکنش برداشت
        const transaction = await Transaction.create({
            user: request.user._id,
            amount: -request.amount, // مبلغ منفی برای برداشت
            type: 'withdrawal',
            method: 'manual', // یا 'crypto' اگر از SHKeeper استفاده می‌کنید
            status: 'completed', // یا 'processing' تا زمان تایید SHKeeper
            description: `برداشت ${request.amount} USDT به آدرس ${request.walletAddress}. تأیید شده توسط ادمین.`,
            relatedEntity: request._id,
            relatedEntityType: 'WithdrawalRequest'
        });

        logger.info(`Admin ${req.user.username} approved withdrawal request ${id} for user ${request.user.username}.`);
        res.json({ message: 'درخواست برداشت با موفقیت تأیید شد.', request });

    } else if (action === 'reject') {
        request.status = 'rejected';
        request.processedBy = req.user._id;
        request.processedAt = new Date();
        request.adminNotes = adminNotes || 'Rejected by admin.';

        // بازگرداندن مبلغ به موجودی کاربر
        const user = await User.findById(request.user._id);
        if (user) {
            user.balance += request.amount;
            await user.save();

            // ثبت تراکنش بازپرداخت
            await Transaction.create({
                user: user._id,
                amount: request.amount,
                type: 'refund',
                method: 'system',
                status: 'completed',
                description: `بازپرداخت مبلغ ${request.amount} USDT به دلیل رد درخواست برداشت به آدرس ${request.walletAddress}. دلیل: ${adminNotes || 'نامشخص'}`,
                relatedEntity: request._id,
                relatedEntityType: 'WithdrawalRequest'
            });
            logger.info(`Admin ${req.user.username} rejected withdrawal request ${id} and refunded ${withdrawal.amount} to user ${user.username}.`);
        } else {
            logger.warn(`Rejected withdrawal ${id} but user not found for refund.`);
        }

        res.json({ message: 'درخواست برداشت با موفقیت رد شد و مبلغ به حساب کاربر برگشت.', request });
    } else {
        res.status(400).json({ message: 'عمل نامعتبر: فقط "approve" یا "reject" مجاز است.' });
    }
});

// @desc    تأیید درخواست برداشت (مسیر جدید)
// @route   PUT /api/admin/withdrawals/:requestId/approve
// @access  Private/Admin
const approveWithdrawalRequest = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { adminNotes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
        return res.status(400).json({ message: 'شناسه درخواست برداشت نامعتبر است.' });
    }

    const withdrawal = await Withdrawal.findById(requestId);
    if (!withdrawal) {
        return res.status(404).json({ message: 'درخواست برداشت یافت نشد.' });
    }

    if (withdrawal.status !== 'pending') {
        return res.status(400).json({ message: `درخواست برداشت قبلاً ${withdrawal.status} شده است.` });
    }

    // به‌روزرسانی وضعیت درخواست برداشت
    withdrawal.status = 'approved';
    withdrawal.processedBy = req.user._id;
    withdrawal.processedAt = new Date();
    withdrawal.adminNotes = adminNotes || 'تایید شده توسط ادمین.';
    await withdrawal.save();

    // کسر مبلغ از موجودی کاربر (اگر هنوز کسر نشده باشد)
    // این منطق باید با دقت بررسی شود که آیا مبلغ قبلاً هنگام درخواست کسر شده یا خیر.
    // فرض بر این است که مبلغ هنگام درخواست کسر شده و اینجا فقط وضعیت نهایی می‌شود.
    // اگر مبلغ هنگام درخواست کسر نشده، باید اینجا کسر شود.

    // TODO: فراخوانی API سرویس پرداخت (مثل SHKeeper) برای انجام Payout واقعی
    // اگر Payout موفق بود، وضعیت تراکنش را 'completed' کنید.
    // اگر ناموفق بود، وضعیت را 'failed' و مبلغ را به کاربر بازگردانید.

    // ثبت تراکنش در سیستم
    const transaction = await Transaction.create({
        user: withdrawal.user,
        amount: -withdrawal.amount, // مبلغ منفی برای برداشت
        type: 'withdrawal',
        method: 'crypto', // یا 'manual' بسته به روش واقعی
        status: 'processing', // تا زمانی که SHKeeper تایید کند
        description: `درخواست برداشت ${withdrawal.amount} USDT به آدرس ${withdrawal.walletAddress} در شبکه ${withdrawal.network}.`,
        relatedEntity: withdrawal._id,
        relatedEntityType: 'WithdrawalRequest'
    });

    logger.info(`Admin ${req.user.username} approved withdrawal request ${requestId} for user ${withdrawal.user}. Transaction ID: ${transaction._id}.`);
    res.json({ message: 'درخواست برداشت با موفقیت تأیید شد و در حال پردازش است.', withdrawal });
});

// @desc    رد درخواست برداشت (مسیر جدید)
// @route   PUT /api/admin/withdrawals/:requestId/reject
// @access  Private/Admin
const rejectWithdrawalRequest = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { adminNotes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
        return res.status(400).json({ message: 'شناسه درخواست برداشت نامعتبر است.' });
    }
    if (!adminNotes || adminNotes.trim() === '') {
        return res.status(400).json({ message: 'دلیل رد درخواست الزامی است.' });
    }

    const withdrawal = await Withdrawal.findById(requestId);
    if (!withdrawal) {
        return res.status(404).json({ message: 'درخواست برداشت یافت نشد.' });
    }

    if (withdrawal.status !== 'pending') {
        return res.status(400).json({ message: `درخواست برداشت قبلاً ${withdrawal.status} شده است.` });
    }

    // به‌روزرسانی وضعیت درخواست برداشت
    withdrawal.status = 'rejected';
    withdrawal.processedBy = req.user._id;
    withdrawal.processedAt = new Date();
    withdrawal.adminNotes = adminNotes;
    await withdrawal.save();

    // بازگرداندن مبلغ به موجودی کاربر
    const user = await User.findById(withdrawal.user);
    if (user) {
        user.balance += withdrawal.amount;
        await user.save();

        // ثبت تراکنش بازپرداخت
        await Transaction.create({
            user: user._id,
            amount: withdrawal.amount,
            type: 'refund',
            method: 'system',
            status: 'completed',
            description: `بازپرداخت مبلغ ${withdrawal.amount} USDT به دلیل رد درخواست برداشت. دلیل: ${adminNotes}`,
            relatedEntity: withdrawal._id,
            relatedEntityType: 'WithdrawalRequest'
        });
        logger.info(`Admin ${req.user.username} rejected withdrawal request ${requestId} and refunded ${withdrawal.amount} to user ${user.username}.`);
    } else {
        logger.warn(`Rejected withdrawal ${requestId} but user not found for refund.`);
    }

    res.json({ message: 'درخواست برداشت با موفقیت رد شد و مبلغ به حساب کاربر برگشت.', withdrawal });
});


// @desc    همگام‌سازی با API خارجی
// @route   POST /api/admin/external-sync
// @access  Private/Admin
const externalApiSync = asyncHandler(async (req, res) => {
    // این تابع باید منطق فراخوانی سرویس همگام‌سازی را داشته باشد
    // فعلاً به عنوان یک placeholder است.
    logger.info(`Admin ${req.user.username} initiated external API sync.`);
    res.status(200).json({ message: 'همگام‌سازی با API خارجی آغاز شد (پیاده‌سازی در دست اقدام).' });
});

// @desc    دریافت تنظیمات ادمین
// @route   GET /api/admin/settings
// @access  Private/Admin
const getAdminSettings = asyncHandler(async (req, res) => {
    const settings = await AdminSettings.findOne({}); // فرض بر این است که فقط یک سند تنظیمات وجود دارد
    if (settings) {
        res.json(settings);
    } else {
        // اگر تنظیماتی وجود نداشت، یک مقدار پیش‌فرض برگردانید یا ایجاد کنید
        const defaultSettings = await AdminSettings.create({}); // ایجاد تنظیمات پیش‌فرض
        res.json(defaultSettings);
    }
});

// @desc    به‌روزرسانی تنظیمات ادمین
// @route   PUT /api/admin/settings
// @access  Private/Admin
const updateAdminSettings = asyncHandler(async (req, res) => {
    const { minDeposit, minWithdrawal } = req.body;

    let settings = await AdminSettings.findOne({});
    if (settings) {
        settings.minDeposit = minDeposit !== undefined ? minDeposit : settings.minDeposit;
        settings.minWithdrawal = minWithdrawal !== undefined ? minWithdrawal : settings.minWithdrawal;
        // سایر تنظیمات را اینجا اضافه کنید
        const updatedSettings = await settings.save();
        logger.info(`Admin ${req.user.username} updated admin settings.`);
        res.json({ message: 'تنظیمات با موفقیت به‌روزرسانی شد.', settings: updatedSettings });
    } else {
        // اگر سندی وجود نداشت، یکی جدید ایجاد کنید
        const newSettings = await AdminSettings.create({ minDeposit, minWithdrawal });
        logger.info(`Admin ${req.user.username} created initial admin settings.`);
        res.status(201).json({ message: 'تنظیمات اولیه با موفقیت ایجاد شد.', settings: newSettings });
    }
});

// @desc    دریافت پیش‌بینی‌های یک کاربر خاص (توسط ادمین)
// @route   GET /api/admin/users/:id/predictions
// @access  Private/Admin
const getUserPredictions = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'شناسه کاربر نامعتبر است.' });
    }

    const predictions = await Prediction.find({ user: id })
        .populate('totoGame', 'name deadline status matches')
        .sort({ createdAt: -1 });

    res.json(predictions);
});

// @desc    دریافت پیش‌بینی‌های یک بازی Toto خاص (viewGamePredictions)
// @route   GET /api/admin/games/view-predictions/:id
// @access  Private/Admin
const viewGamePredictions = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'شناسه بازی Toto نامعتبر است.' });
    }

    try {
        const totoGame = await TotoGame.findById(id);
        if (!totoGame) {
            return res.status(404).json({ message: 'بازی Toto یافت نشد.' });
        }

        const predictions = await Prediction.find({ totoGame: id })
            .populate('user', 'username email') // اطلاعات کاربر را نیز بارگذاری کنید
            .sort({ createdAt: -1 });

        logger.info(`Admin ${req.user.username} viewed predictions for Toto game: ${totoGame.name} (ID: ${totoGame._id}). Found ${predictions.length} predictions.`);
        res.json({ totoGame, predictions });

    } catch (error) {
        logger.error(`Error viewing predictions for Toto game ${id}: ${error.message}. Stack: ${error.stack}`);
        res.status(500).json({ message: 'خطا در دریافت پیش‌بینی‌های بازی.' });
    }
});


module.exports = {
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
    // --- توابع مربوط به بازی‌ها ---
    getAllGames,
    createGame, // <--- نام تابع به createGame تغییر یافت
    setGameResults,
    viewGamePredictions, // <--- اضافه شد: تابع viewGamePredictions
    // --- توابع مدیریت توتو بازی‌ها ---
    getPredictionsForTotoGame,
    closeTotoGameManually,
    downloadPredictions,
    cancelTotoGame,
    // --- توابع مربوط به واریزها و برداشت‌ها ---
    getCryptoDeposits,
    getWithdrawalRequests,
    processWithdrawal,
    getPendingWithdrawalRequests,
    approveWithdrawalRequest,
    rejectWithdrawalRequest,
    // --- توابع عمومی ادمین ---
    externalApiSync,
    getAdminSettings,
    updateAdminSettings,
    getUserPredictions,
};
