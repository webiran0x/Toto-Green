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

// --- اصلاح شده: فقط processTotoGameResults و handleGameCancellationAndRefunds از totoService ایمپورت می‌شوند ---
// rewardWinners دیگر از totoRewardService.js ایمپورت نمی‌شود، زیرا آن تابع تکراری است.
const { processTotoGameResults, handleGameCancellationAndRefunds } = require('../services/totoService');

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
        logger.info(`${req.user ? req.user.username : 'Admin'} updated user ${updatedUser.username} (ID: ${updatedUser._id}).`);

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
        logger.warn(`${req.user ? req.user.username : 'Admin'} blocked user ${user.username} (ID: ${user._id}).`);
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
        logger.info(`${req.user ? req.user.username : 'Admin'} activated user ${user.username} (ID: ${user._id}).`);
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
    const logFilePath = path.join(__dirname, '../logs/combined.log');
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
const createGame = asyncHandler(async (req, res) => {
    const { name, deadline, matches } = req.body;

    logger.info('Received request body for createGame:', req.body);

    if (!name || !deadline || !matches || !Array.isArray(matches) || matches.length !== 15) {
        logger.warn(`Validation failed for createGame: Missing name, deadline, or 15 matches. Received: ${JSON.stringify(req.body)}`);
        return res.status(400).json({ message: 'لطفاً نام، مهلت و دقیقاً ۱۵ بازی را وارد کنید.' });
    }

    for (const match of matches) {
        if (!match.homeTeam || !match.awayTeam || !match.date) {
            logger.warn(`Validation failed for createGame: Missing homeTeam, awayTeam, or date in a match. Received match: ${JSON.stringify(match)}`);
            return res.status(400).json({ message: 'هر بازی باید شامل تیم میزبان، تیم مهمان و تاریخ باشد.' });
        }
    }

    // بررسی نام تکراری
    const gameExists = await TotoGame.findOne({ name });
    if (gameExists) {
        return res.status(400).json({ message: 'بازی Toto با این نام قبلاً ایجاد شده است.' });
    }

    try {
        const newTotoGame = await TotoGame.create({
            name,
            deadline,
            matches,
            status: 'open',
            totalPot: 0,
            commissionAmount: 0,
            prizePool: 0,
            prizes: { firstPlace: 0, secondPlace: 0, thirdPlace: 0 },
            winners: { first: [], second: [], third: [] }
        });

        logger.info(`${req.user ? req.user.username : 'Admin'} created a new Toto game: ${newTotoGame.name} (ID: ${newTotoGame._id}).`);
        res.status(201).json({ message: 'بازی Toto با موفقیت ایجاد شد.', game: newTotoGame });

    } catch (error) {
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            logger.error(`Mongoose Validation Error during createGame: ${errors.join(', ')}. Request body: ${JSON.stringify(req.body)}`);
            return res.status(400).json({ message: errors.join(', ') });
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
// @access  Private/Admin
const setGameResults = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { results } = req.body;
  console.log(results); // نتایج ارسالی از فرانت‌اند

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
      totoGame.matches[matchIndex].isClosed = true; // نشان می‌دهد که نتیجه این بازی ثبت شده است
      updatedAnyMatch = true;
    }
  });

  if (!updatedAnyMatch) {
    return res.status(400).json({ message: 'هیچ بازی معتبری برای ثبت نتیجه یافت نشد.' });
  }

  await totoGame.save(); // نتایج بازی را ذخیره کنید

  // --- اصلاح شده: لاگ برای اشکال‌زدایی بیشتر و مدیریت وضعیت ---
  const matchesWithoutResultCount = totoGame.matches.filter(m => !(m.result && m.isClosed)).length;
  logger.info(`Toto game ${totoGame.name} (ID: ${totoGame._id}) updated. ${matchesWithoutResultCount} matches still without result.`);

  const allMatchesHaveResult = totoGame.matches.every((match) => match.result && match.isClosed);

  if (!allMatchesHaveResult) { // تغییر نام allMatchesClosed به allMatchesHaveResult برای وضوح
    // اگر همه بازی‌ها نتیجه ندارند (یعنی هنوز ناقص است)، وضعیت بازی را به 'closed' تنظیم می‌کند و ادامه نمی‌دهد
    // این بازی تا زمانی که همه نتایج ثبت نشوند، در وضعیت 'closed' باقی می‌ماند.
    totoGame.status = 'closed'; // اطمینان از اینکه وضعیت 'closed' است اگر قبلاً 'open' بوده
    await totoGame.save();
    return res.json({
      status: 'partial',
      message: 'نتایج ارسال شده ثبت شدند. هنوز برخی بازی‌ها نتیجه ندارند. بازی در وضعیت "بسته" باقی می‌ماند.',
      totoGame,
    });
  }

  // اگر همه بازی‌ها نتیجه داشتند، اینجا منطق امتیازدهی و توزیع جوایز اجرا می‌شود
  // --- اصلاح شده: فراخوانی processTotoGameResults از totoService.js ---
  const processResult = await processTotoGameResults(totoGame); 

  if (processResult.success) { // از processResult.status === 'complete' به processResult.success تغییر یافت
      logger.info(`${req.user ? req.user.username : 'Admin'} set results and successfully processed scores/rewards for Toto game: ${totoGame.name}. Game status: COMPLETED.`);
      // --- اصلاح شده: اطمینان از تغییر وضعیت به completed و بازگرداندن آبجکت به‌روز شده ---
      // processTotoGameResults خودش وضعیت را به completed تغییر داده و ذخیره می‌کند.
      // بنابراین، فقط totoGame به‌روز شده را از processResult.totoGame برمی‌گردانیم.
      return res.json({ message: 'نتایج بازی ثبت و جوایز با موفقیت توزیع شد. بازی به "تکمیل شده" تغییر یافت.', totoGame: processResult.totoGame, processResult });
  } else {
      logger.error(`${req.user ? req.user.username : 'Admin'} set results for Toto game: ${totoGame.name}, but an error occurred during processing: ${processResult.message}. Game status remains ${totoGame.status}.`);
      return res.status(500).json({ message: `نتایج بازی ثبت شد اما در پردازش جوایز خطا رخ داد: ${processResult.message}. بازی در وضعیت "${totoGame.status}" باقی می‌ماند.`, totoGame, processResult });
  }
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
    // اگر بازی باز باشد، باید ابتدا بسته شود.
    if (totoGame.status === 'open') { // Only allow closing if it's open
        totoGame.status = 'closed';
        await totoGame.save();
        logger.info(`${req.user ? req.user.username : 'Admin'} manually closed Toto game: ${totoGame.name} (ID: ${totoGame._id}).`);
        res.json({ message: 'بازی Toto با موفقیت بسته شد.', totoGame });
    } else {
        res.status(400).json({ message: 'بازی در وضعیت مناسب برای بسته شدن دستی نیست.' });
    }
});

// @desc    دانلود پیش‌بینی‌های یک بازی Toto
// @route   GET /api/admin/download-predictions/:totoGameId
// @access  Public (بعد از انتقال مسیر در adminRoutes.js)
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

    let csvContent = "User,Match ID,Chosen Outcome,Price,Score\n";
    predictions.forEach(p => {
        p.predictions.forEach(matchPred => {
            const username = p.user ? p.user.username : 'UnknownUser';
            const chosenOutcome = Array.isArray(matchPred.chosenOutcome) ? matchPred.chosenOutcome.join(',') : '';
            csvContent += `${username},${matchPred.matchId},"${chosenOutcome}",${p.price},${p.score}\n`;
        });
    });

    res.header('Content-Type', 'text/csv');
    res.attachment(`${game.name}-predictions.csv`);
    res.send(csvContent);

    const downloaderUsername = req.user ? req.user.username : 'Public/Unknown';
    logger.info(`${downloaderUsername} downloaded predictions for Toto game: ${game.name} (ID: ${game._id}).`);
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

    const refundResult = await handleGameCancellationAndRefunds(totoGameId);

    if (refundResult.success) {
        logger.warn(`${req.user ? req.user.username : 'Admin'} cancelled Toto game: ${totoGame.name} (ID: ${totoGame._id}) and refunds processed.`);
        res.json({ message: 'بازی Toto با موفقیت لغو شد و مبالغ بازپرداخت شدند.', totoGame });
    } else {
        logger.error(`Error cancelling game ${totoGameId} and processing refunds: ${refundResult.message}`);
        res.status(500).json({ message: `خطا در لغو بازی و بازپرداخت مبالغ: ${refundResult.message}` });
    }
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
    const { status } = req.query;
    let query = {};
    if (status) {
        query.status = status;
    }
    const requests = await Withdrawal.find(query)
        .populate('user', 'username email balance')
        .populate('processedBy', 'username')
        .sort({ createdAt: -1 });
    logger.info(`${req.user ? req.user.username : 'Admin'} fetched withdrawal requests. Filtered by status: ${status || 'None'}. Found ${requests.length} requests.`);
    res.json(requests);
});

// @desc    دریافت درخواست‌های برداشت وجه در انتظار
// @route   GET /api/admin/withdrawals/pending
// @access  Private/Admin
const getPendingWithdrawalRequests = asyncHandler(async (req, res) => {
    const requests = await Withdrawal.find({ status: 'pending' })
        .populate('user', 'username email balance')
        .sort({ createdAt: 1 });
    logger.info(`${req.user ? req.user.username : 'Admin'} fetched pending withdrawal requests. Found ${requests.length} requests.`);
    res.json(requests);
});


// @desc    پردازش درخواست برداشت وجه (تایید یا رد)
// @route   PUT /api/admin/manage-withdrawals/:id/process
// @access  Private/Admin
const processWithdrawal = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { action, adminNotes } = req.body;

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

        const transaction = await Transaction.create({
            user: request.user._id,
            amount: -request.amount,
            type: 'withdrawal',
            method: 'manual',
            status: 'completed',
            description: `برداشت ${request.amount} USDT به آدرس ${request.walletAddress}. تأیید شده توسط ادمین.`,
            relatedEntity: request._id,
            relatedEntityType: 'WithdrawalRequest'
        });

        logger.info(`${req.user ? req.user.username : 'Admin'} approved withdrawal request ${id} for user ${request.user.username}.`);
        res.json({ message: 'درخواست برداشت با موفقیت تأیید شد.', request });

    } else if (action === 'reject') {
        request.status = 'rejected';
        request.processedBy = req.user._id;
        request.processedAt = new Date();
        request.adminNotes = adminNotes || 'Rejected by admin.';

        const user = await User.findById(request.user._id);
        if (user) {
            user.balance += request.amount;
            await user.save();

            await Transaction.create({
                user: user._id,
                amount: request.amount, // Changed from withdrawal.amount to request.amount
                type: 'refund',
                method: 'system',
                status: 'completed',
                description: `بازپرداخت مبلغ ${request.amount} USDT به دلیل رد درخواست برداشت به آدرس ${request.walletAddress}. دلیل: ${adminNotes || 'نامشخص'}`,
                relatedEntity: request._id,
                relatedEntityType: 'WithdrawalRequest'
            });
            logger.info(`Admin ${req.user.username} rejected withdrawal request ${id} and refunded ${request.amount} to user ${user.username}.`);
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

    withdrawal.status = 'approved';
    withdrawal.processedBy = req.user._id;
    withdrawal.processedAt = new Date();
    withdrawal.adminNotes = adminNotes || 'تایید شده توسط ادمین.';
    await withdrawal.save();

    const transaction = await Transaction.create({
        user: withdrawal.user,
        amount: -withdrawal.amount,
        type: 'withdrawal',
        method: 'crypto',
        status: 'processing',
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

    withdrawal.status = 'rejected';
    withdrawal.processedBy = req.user._id;
    withdrawal.processedAt = new Date();
    withdrawal.adminNotes = adminNotes;
    await withdrawal.save();

    const user = await User.findById(withdrawal.user);
    if (user) {
        user.balance += withdrawal.amount;
        await user.save();

        await Transaction.create({
            user: user._id,
            amount: withdrawal.amount,
            type: 'refund',
            method: 'system',
            status: 'completed',
            description: `بازپرداخت مبلغ ${withdrawal.amount} USDT به دلیل رد درخواست برداشت به آدرس ${withdrawal.walletAddress}. دلیل: ${adminNotes}`,
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
    logger.info(`Admin ${req.user.username} initiated external API sync.`);
    res.status(200).json({ message: 'همگام‌سازی با API خارجی آغاز شد (پیاده‌سازی در دست اقدام).' });
});

// @desc    دریافت تنظیمات ادمین
// @route   GET /api/admin/settings
// @access  Private/Admin
const getAdminSettings = asyncHandler(async (req, res) => {
    const settings = await AdminSettings.findOne({});
    if (settings) {
        res.json(settings);
    } else {
        const defaultSettings = await AdminSettings.create({});
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
        const updatedSettings = await settings.save();
        logger.info(`Admin ${req.user.username} updated admin settings.`);
        res.json({ message: 'تنظیمات با موفقیت به‌روزرسانی شد.', settings: updatedSettings });
    } else {
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
            .populate('user', 'username email')
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
    createGame,
    setGameResults,
    viewGamePredictions,
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
