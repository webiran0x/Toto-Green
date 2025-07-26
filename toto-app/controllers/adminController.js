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

const {
    createUserByAdminSchema,
    updateUserByAdminSchema,
    createTotoGameSchema,
    setTotoGameResultsSchema,
    updateWithdrawalStatusSchema,
    updateCryptoDepositStatusSchema,
    updateAdminSettingsSchema,
} = require('../validation/adminValidation');

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

// @desc    Get all users (with filters)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    // ... کد موجود برای فیلترینگ و pagination
    try {
        // اعتبار سنجی برای فیلترها و مرتب‌سازی در اینجا می‌تواند اضافه شود
        // مثلاً Joi.object({ page: Joi.number().min(1).default(1), limit: Joi.number().min(1).max(100).default(10), ... })

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let query = {};
        if (req.query.search) {
            query.$or = [
                { username: { $regex: req.query.search, $options: 'i' } },
                { email: { $regex: req.query.search, $options: 'i' } }
            ];
        }
        if (req.query.role) {
            query.role = req.query.role;
        }
        if (req.query.status) {
            query.status = req.query.status;
        }
        // Add more filters as needed (e.g., balance range, score range)

        const users = await User.find(query)
            .select('-password') // Don't return password hash
            .limit(limit)
            .skip(skip)
            .sort({ createdAt: -1 }); // Default sort by newest

        const totalUsers = await User.countDocuments(query);

        res.status(200).json({
            users,
            totalPages: Math.ceil(totalUsers / limit),
            currentPage: page,
            totalUsers
        });

    } catch (error) {
        logger.error(`Error fetching all users: ${error.message}`);
        res.status(500).json({ message: 'خطای سرور.', error: error.message });
    }
};

// @desc    Create a new user by Admin
// @route   POST /api/admin/users
// @access  Private/Admin
const createUser = async (req, res) => {
    // Step 1: اعتبار سنجی ورودی با استفاده از Joi
    const { error } = createUserByAdminSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(err => err.message);
        logger.warn(`Validation error creating user by admin: ${errors.join(', ')}`);
        return res.status(400).json({ message: 'خطای اعتبار سنجی', errors });
    }

    const { username, email, password, role, balance, score, level } = req.body;

    try {
        const userExists = await User.findOne({ $or: [{ username }, { email }] });
        if (userExists) {
            logger.warn(`Admin tried to create user: Username '${username}' or email '${email}' already exists.`);
            return res.status(400).json({ message: 'کاربری با این نام کاربری یا ایمیل از قبل وجود دارد.' });
        }

        const newUser = await User.create({
            username,
            email,
            password, // Mongoose pre-save hook will hash this
            role,
            balance,
            score,
            level
        });

        logger.info(`Admin ${req.user.username} created new user: ${newUser.username} (${newUser.role}).`);
        res.status(201).json({
            _id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role,
            balance: newUser.balance,
            score: newUser.score,
            level: newUser.level,
            status: newUser.status,
        });

    } catch (error) {
        logger.error(`Server error creating user by admin: ${error.message}`);
        res.status(500).json({ message: 'خطای سرور.', error: error.message });
    }
};


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


// @desc    Update user by Admin
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
    // Step 1: اعتبار سنجی ورودی با استفاده از Joi
    const { error } = updateUserByAdminSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(err => err.message);
        logger.warn(`Validation error updating user by admin for ID ${req.params.id}: ${errors.join(', ')}`);
        return res.status(400).json({ message: 'خطای اعتبار سنجی', errors });
    }

    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'کاربر یافت نشد.' });
        }

        // Prevent admin from changing their own role to something other than admin
        if (req.user._id.toString() === req.params.id && req.body.role && req.body.role !== 'admin') {
            return res.status(403).json({ message: 'مدیر نمی‌تواند نقش خود را تغییر دهد.' });
        }

        // Check for duplicate username/email if changed
        if (req.body.username && req.body.username !== user.username) {
            const usernameExists = await User.findOne({ username: req.body.username });
            if (usernameExists && usernameExists._id.toString() !== user._id.toString()) {
                return res.status(400).json({ message: 'نام کاربری از قبل وجود دارد.' });
            }
        }
        if (req.body.email && req.body.email !== user.email) {
            const emailExists = await User.findOne({ email: req.body.email });
            if (emailExists && emailExists._id.toString() !== user._id.toString()) {
                return res.status(400).json({ message: 'ایمیل از قبل وجود دارد.' });
            }
        }

        // Update fields that are provided in the request body
        if (req.body.username !== undefined) user.username = req.body.username;
        if (req.body.email !== undefined) user.email = req.body.email;
        if (req.body.role !== undefined) user.role = req.body.role;
        if (req.body.status !== undefined) user.status = req.body.status;
        if (req.body.level !== undefined) user.level = req.body.level;
        // Handle balance and score carefully
        if (req.body.balance !== undefined) {
            // You might want to log this balance change in Transactions
            const oldBalance = user.balance;
            user.balance = req.body.balance;
            if (user.balance !== oldBalance) {
                 await Transaction.create({
                    user: user._id,
                    amount: user.balance - oldBalance,
                    type: 'admin_balance_adjustment',
                    status: 'completed',
                    admin: req.user._id,
                    adminNote: `Balance changed from ${oldBalance} to ${user.balance} by admin.`
                });
            }
        }
        if (req.body.score !== undefined) {
            user.score = req.body.score;
        }
        if (req.body.password) {
            user.password = req.body.password; // Mongoose pre-save hook will hash this
        }


        const updatedUser = await user.save();

        logger.info(`Admin ${req.user.username} updated user: ${updatedUser.username} (${updatedUser._id}).`);
        res.status(200).json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role,
            balance: updatedUser.balance,
            score: updatedUser.score,
            level: updatedUser.level,
            status: updatedUser.status,
        });

    } catch (error) {
        logger.error(`Server error updating user by admin for ID ${req.params.id}: ${error.message}`);
        res.status(500).json({ message: 'خطای سرور.', error: error.message });
    }
};

// @desc    Create a new Toto game
// @route   POST /api/admin/totos
// @access  Private/Admin
const createTotoGame = async (req, res) => {
    // Step 1: اعتبار سنجی ورودی با استفاده از Joi
    const { error } = createTotoGameSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(err => err.message);
        logger.warn(`Validation error creating Toto game by admin: ${errors.join(', ')}`);
        return res.status(400).json({ message: 'خطای اعتبار سنجی', errors });
    }

    const { name, deadline, matches } = req.body;

    try {
        const newGame = await TotoGame.create({
            name,
            deadline,
            matches: matches.map(match => ({
                homeTeam: match.homeTeam,
                awayTeam: match.awayTeam,
                matchDate: match.matchDate,
                // score and winner will be set later
            })),
            status: 'open',
            totalPrizePool: 0,
        });

        logger.info(`Admin ${req.user.username} created new Toto game: '${newGame.name}' (${newGame._id}).`);
        res.status(201).json(newGame);

    } catch (error) {
        logger.error(`Server error creating Toto game by admin: ${error.message}`);
        res.status(500).json({ message: 'خطای سرور.', error: error.message });
    }
};

// @desc    Set Toto game results
// @route   PUT /api/admin/totos/:id/results
// @access  Private/Admin
const setTotoGameResults = async (req, res) => {
    // Step 1: اعتبار سنجی ورودی با استفاده از Joi
    const { error } = setTotoGameResultsSchema.validate({ ...req.body, gameId: req.params.id }, { abortEarly: false });
    if (error) {
        const errors = error.details.map(err => err.message);
        logger.warn(`Validation error setting Toto game results for game ID ${req.params.id}: ${errors.join(', ')}`);
        return res.status(400).json({ message: 'خطای اعتبار سنجی', errors });
    }

    const { results } = req.body; // gameId is from params

    try {
        const game = await TotoGame.findById(req.params.id);

        if (!game) {
            return res.status(404).json({ message: 'بازی یافت نشد.' });
        }

        if (game.status === 'completed' || game.status === 'cancelled') {
            return res.status(400).json({ message: 'نتایج این بازی قبلاً ثبت شده یا بازی لغو شده است.' });
        }

        // Update each match result
        for (const result of results) {
            const matchIndex = game.matches.findIndex(m => m._id.toString() === result.matchId);
            if (matchIndex === -1) {
                logger.warn(`Match ID ${result.matchId} not found in game ${game._id} while setting results.`);
                return res.status(404).json({ message: `مسابقه با شناسه ${result.matchId} در این بازی یافت نشد.` });
            }
            game.matches[matchIndex].homeScore = result.homeScore;
            game.matches[matchIndex].awayScore = result.awayScore;
            game.matches[matchIndex].winner = result.winner;
        }

        game.status = 'completed'; // Set game status to completed
        await game.save();

        // Trigger score calculation and prize distribution
        await totoService.processTotoGameResults(game._id);

        logger.info(`Admin ${req.user.username} set results for Toto game: '${game.name}' (${game._id}).`);
        res.status(200).json({ message: 'نتایج بازی با موفقیت ثبت و پردازش شد.' });

    } catch (error) {
        logger.error(`Server error setting Toto game results for game ID ${req.params.id}: ${error.message}`);
        res.status(500).json({ message: 'خطای سرور.', error: error.message });
    }
};



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


// @desc    Update withdrawal request status
// @route   PUT /api/admin/withdrawals/:id/status
// @access  Private/Admin
const updateWithdrawalStatus = async (req, res) => {
    // Step 1: اعتبار سنجی ورودی با استفاده از Joi
    const { error } = updateWithdrawalStatusSchema.validate({ ...req.body, withdrawalId: req.params.id }, { abortEarly: false });
    if (error) {
        const errors = error.details.map(err => err.message);
        logger.warn(`Validation error updating withdrawal status for ID ${req.params.id}: ${errors.join(', ')}`);
        return res.status(400).json({ message: 'خطای اعتبار سنجی', errors });
    }

    const { status, adminNote } = req.body; // withdrawalId is from params

    try {
        const withdrawal = await WithdrawalRequest.findById(req.params.id).populate('user');

        if (!withdrawal) {
            return res.status(404).json({ message: 'درخواست برداشت یافت نشد.' });
        }

        // Prevent status changes if already completed or cancelled
        if (['completed', 'cancelled'].includes(withdrawal.status)) {
            return res.status(400).json({ message: `این درخواست برداشت قبلاً با وضعیت '${withdrawal.status}' به پایان رسیده است.` });
        }

        const oldStatus = withdrawal.status;
        withdrawal.status = status;
        withdrawal.adminNote = adminNote || withdrawal.adminNote;
        await withdrawal.save();

        // If status changes to rejected, refund the user's balance
        if (status === 'rejected' && oldStatus !== 'rejected') {
            const user = await User.findById(withdrawal.user._id);
            if (user) {
                user.balance += withdrawal.amount;
                await user.save();
                await Transaction.create({
                    user: user._id,
                    amount: withdrawal.amount,
                    type: 'withdrawal_rejection_refund',
                    status: 'completed',
                    relatedEntity: withdrawal._id,
                    relatedEntityType: 'WithdrawalRequest',
                    admin: req.user._id,
                    adminNote: adminNote || 'Refunded due to withdrawal rejection.'
                });
                logger.info(`Refunded ${withdrawal.amount} to user ${user._id} due to rejected withdrawal request ${withdrawal._id}.`);
            } else {
                logger.error(`User for rejected withdrawal ${withdrawal._id} not found for refund.`);
            }
        }
        // If status changes to completed, and the balance was not already deducted
        // Or handle the actual crypto payout logic here
        // If the balance was already deducted (as implemented in userController.js), no further balance change is needed here.

        logger.info(`Admin ${req.user.username} updated withdrawal request ${withdrawal._id} status from '${oldStatus}' to '${status}'.`);
        res.status(200).json({ message: `وضعیت درخواست برداشت به ${status} تغییر یافت.`, withdrawal });

    } catch (error) {
        logger.error(`Server error updating withdrawal status for ID ${req.params.id}: ${error.message}`);
        res.status(500).json({ message: 'خطای سرور.', error: error.message });
    }
};


// @desc    Update crypto deposit status (Manual Confirmation/Rejection by Admin)
// @route   PUT /api/admin/deposits/:id/status
// @access  Private/Admin
const updateCryptoDepositStatus = async (req, res) => {
    // Step 1: اعتبار سنجی ورودی با استفاده از Joi
    const { error } = updateCryptoDepositStatusSchema.validate({ ...req.body, depositId: req.params.id }, { abortEarly: false });
    if (error) {
        const errors = error.details.map(err => err.message);
        logger.warn(`Validation error updating deposit status for ID ${req.params.id}: ${errors.join(', ')}`);
        return res.status(400).json({ message: 'خطای اعتبار سنجی', errors });
    }

    const { status, adminNote } = req.body;

    try {
        const deposit = await CryptoDeposit.findById(req.params.id).populate('user');

        if (!deposit) {
            return res.status(404).json({ message: 'واریز رمزارز یافت نشد.' });
        }

        if (deposit.status === 'confirmed' || deposit.status === 'rejected') {
            return res.status(400).json({ message: `وضعیت این واریز قبلاً به '${deposit.status}' تغییر یافته است.` });
        }

        const oldStatus = deposit.status;
        deposit.status = status;
        deposit.adminNote = adminNote || deposit.adminNote;
        await deposit.save();

        // If status changes to confirmed and it wasn't already confirmed
        if (status === 'confirmed' && oldStatus !== 'confirmed') {
            const user = await User.findById(deposit.user._id);
            if (user) {
                user.balance += deposit.amount; // Add deposited amount to user balance
                await user.save();
                // Update related transaction status if it exists, or create a new one
                const transaction = await Transaction.findOne({ relatedEntity: deposit._id, relatedEntityType: 'CryptoDeposit' });
                if (transaction) {
                    transaction.status = 'completed';
                    await transaction.save();
                } else {
                    await Transaction.create({
                        user: user._id,
                        amount: deposit.amount,
                        type: 'crypto_deposit',
                        status: 'completed',
                        relatedEntity: deposit._id,
                        relatedEntityType: 'CryptoDeposit',
                        admin: req.user._id,
                        adminNote: adminNote || 'Manually confirmed by admin.'
                    });
                }
                logger.info(`User ${user._id} balance increased by ${deposit.amount} for confirmed deposit ${deposit._id}.`);
            } else {
                logger.error(`User for confirmed deposit ${deposit._id} not found.`);
            }
        } else if (status === 'rejected' && oldStatus !== 'rejected') {
            // If deposit is rejected, no balance change unless it was already added (which it shouldn't be for pending)
             await Transaction.create({
                user: deposit.user._id,
                amount: 0, // No balance change for rejection
                type: 'crypto_deposit',
                status: 'rejected',
                relatedEntity: deposit._id,
                relatedEntityType: 'CryptoDeposit',
                admin: req.user._id,
                adminNote: adminNote || 'Rejected by admin.'
            });
        }

        logger.info(`Admin ${req.user.username} updated crypto deposit ${deposit._id} status from '${oldStatus}' to '${status}'.`);
        res.status(200).json({ message: `وضعیت واریز به ${status} تغییر یافت.`, deposit });

    } catch (error) {
        logger.error(`Server error updating crypto deposit status for ID ${req.params.id}: ${error.message}`);
        res.status(500).json({ message: 'خطای سرور.', error: error.message });
    }
};


// @desc    Update Admin Settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
const updateAdminSettings = async (req, res) => {
    // Step 1: اعتبار سنجی ورودی با استفاده از Joi
    const { error } = updateAdminSettingsSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(err => err.message);
        logger.warn(`Validation error updating admin settings: ${errors.join(', ')}`);
        return res.status(400).json({ message: 'خطای اعتبار سنجی', errors });
    }

    try {
        // Find existing settings or create if not present
        let settings = await AdminSettings.findOne();
        if (!settings) {
            settings = new AdminSettings();
        }

        // Update fields that are provided
        if (req.body.minDeposit !== undefined) settings.minDeposit = req.body.minDeposit;
        if (req.body.minWithdrawal !== undefined) settings.minWithdrawal = req.body.minWithdrawal;
        if (req.body.referralCommissionPercentage !== undefined) settings.referralCommissionPercentage = req.body.referralCommissionPercentage;
        // Add other settings fields here as per your AdminSettings model

        await settings.save();

        logger.info(`Admin ${req.user.username} updated admin settings.`);
        res.status(200).json({ message: 'تنظیمات مدیر با موفقیت به‌روزرسانی شد.', settings });

    } catch (error) {
        logger.error(`Server error updating admin settings: ${error.message}`);
        res.status(500).json({ message: 'خطای سرور.', error: error.message });
    }
};


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
