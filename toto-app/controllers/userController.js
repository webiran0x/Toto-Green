// toto-app/controllers/userController.js
// کنترلر برای عملیات‌های مربوط به کاربر (غیر از ادمین)
console.log('USERCONTROLLER.JS: Starting userController loading...');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const TotoGame = require('../models/TotoGame');
const Prediction = require('../models/Prediction');
const Transaction = require('../models/Transaction'); // استفاده از مدل جامع Transaction
const WithdrawalRequest = require('../models/WithdrawalRequest');
const CryptoDeposit = require('../models/CryptoDeposit'); // برای پیگیری واریزهای کریپتو در حال انتظار
const AdminSettings = require('../models/AdminSettings'); // اضافه شده برای حداقل/حداکثر برداشت
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs'); // احتمالا برای مقایسه رمز عبور فعلی
const axios = require('axios'); // برای فراخوانی API SHKeeper
const mongoose = require('mongoose'); // برای تولید ObjectId جدید برای external_id
const { updateUserProfileSchema, changePasswordSchema, requestWithdrawalSchema, depositSchema, submitPredictionSchema } = require('../validation/userValidation'); // اضافه شدن depositSchema و submitPredictionSchema
// --- اضافه شد: ایمپورت تابع کمکی ---
const { generateRandomString } = require('../utils/helpers'); // اطمینان حاصل کنید که این مسیر و تابع درست هستند
// --- پایان بخش اضافه شد ---


// @desc    دانلود داده‌های بازی کاربر (پیش‌بینی‌ها)
// @route   GET /api/users/games/:id/download
// @access  Private
const downloadUserGameData = asyncHandler(async (req, res) => {
    const { id } = req.params; // id بازی Toto
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'شناسه بازی Toto نامعتبر است.' });
    }

    const game = await TotoGame.findById(id);
    if (!game) {
        return res.status(404).json({ message: 'بازی Toto یافت نشد.' });
    }

    const prediction = await Prediction.findOne({ user: userId, totoGame: id });
    if (!prediction) {
        return res.status(404).json({ message: 'پیش‌بینی شما برای این بازی یافت نشد.' });
    }

    // --- تغییر موقت برای عیب‌یابی ---
    logger.info(`User ${req.user.username} (ID: ${userId}) requested download for Toto game: ${game.name} (ID: ${game._id}).`);
    res.status(200).send(`Download data for game ${game.name}, prediction by ${req.user.username}.`);
    // --- پایان تغییر موقت ---

    // TODO: پس از رفع مشکل، کد اصلی تولید فایل اکسل را اینجا بازگردانید.
});



// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        // req.user از authMiddleware می‌آید
        const user = await User.findById(req.user._id).select('-password'); // رمز عبور را انتخاب نکنید
        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ message: 'کاربر یافت نشد.' });
        }
    } catch (error) {
        logger.error(`Error fetching user profile for user ${req.user._id}: ${error.message}`);
        res.status(500).json({ message: 'خطای سرور.', error: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    // Step 1: اعتبار سنجی ورودی با استفاده از Joi
    const { error } = updateUserProfileSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(err => err.message);
        logger.warn(`Validation error updating user profile for user ${req.user._id}: ${errors.join(', ')}`);
        return res.status(400).json({ message: 'خطای اعتبار سنجی', errors });
    }

    try {
        const user = await User.findById(req.user._id);

        if (user) {
            // بررسی عدم تکراری بودن نام کاربری یا ایمیل در صورت تغییر
            if (req.body.username && req.body.username !== user.username) {
                const usernameExists = await User.findOne({ username: req.body.username });
                if (usernameExists) {
                    return res.status(400).json({ message: 'نام کاربری از قبل وجود دارد.' });
                }
            }
            if (req.body.email && req.body.email !== user.email) {
                const emailExists = await User.findOne({ email: req.body.email });
                if (emailExists) {
                    return res.status(400).json({ message: 'ایمیل از قبل وجود دارد.' });
                }
            }

            user.username = req.body.username || user.username;
            user.email = req.body.email || user.email;
            user.fullName = req.body.fullName || user.fullName; // اگر در مدل User.js وجود دارد
            user.phoneNumber = req.body.phoneNumber || user.phoneNumber; // اگر در مدل User.js وجود دارد

            const updatedUser = await user.save();

            res.status(200).json({
                _id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                fullName: updatedUser.fullName,
                phoneNumber: updatedUser.phoneNumber,
                // ... سایر فیلدهای مورد نیاز
            });
        } else {
            res.status(404).json({ message: 'کاربر یافت نشد.' });
        }
    } catch (error) {
        logger.error(`Server error updating user profile for user ${req.user._id}: ${error.message}`);
        res.status(500).json({ message: 'خطای سرور.', error: error.message });
    }
};

// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private
const changeUserPassword = async (req, res) => {
    // Step 1: اعتبار سنجی ورودی با استفاده از Joi
    const { error } = changePasswordSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(err => err.message);
        logger.warn(`Validation error changing password for user ${req.user._id}: ${errors.join(', ')}`);
        return res.status(400).json({ message: 'خطای اعتبار سنجی', errors });
    }

    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user._id);

        if (user) {
            if (!(await user.matchPassword(currentPassword))) {
                logger.warn(`Password change failed for user ${user._id}: Invalid current password.`);
                return res.status(401).json({ message: 'رمز عبور فعلی نامعتبر است.' });
            }

            user.password = newPassword; // Mongoose pre-save hook will hash this
            await user.save();

            logger.info(`User ${user._id} successfully changed password.`);
            res.status(200).json({ message: 'رمز عبور با موفقیت تغییر یافت.' });
        } else {
            res.status(404).json({ message: 'کاربر یافت نشد.' });
        }
    } catch (error) {
        logger.error(`Server error changing password for user ${req.user._id}: ${error.message}`);
        res.status(500).json({ message: 'خطای سرور.', error: error.message });
    }
};



// @desc    شارژ حساب کاربر (واریز)
// @route   POST /api/users/deposit
// @access  Private (User)
const deposit = asyncHandler(async (req, res) => {
  // Step 1: اعتبار سنجی ورودی با استفاده از Joi
  const { error } = depositSchema.validate(req.body, { abortEarly: false });
  if (error) {
      const errors = error.details.map(err => err.message);
      logger.warn(`Validation error for deposit request from user ${req.user._id}: ${errors.join(', ')}`);
      return res.status(400).json({ message: 'خطای اعتبار سنجی', errors });
  }

  const { amount, method, cryptoCurrency, network } = req.body;
  const userId = req.user.id; // شناسه کاربر از توکن احراز هویت شده

  // لاگ درخواست ورودی برای اشکال‌زدایی
  console.log('--- Incoming Deposit Request ---');
  console.log('Request Body:', req.body);
  console.log('Detected Method:', method);

  if (method === 'crypto') {
    // --- منطق برای واریزهای ارز دیجیتال (فاز شروع) ---
    console.log('Processing crypto deposit initiation...');

    // SHKeeper API انتظار نام ارز/شبکه خاصی را دارد (مثلاً "ETH-USDT" یا "BNB-USDT")
    let shkeeperCryptoName;
    if (cryptoCurrency === 'USDT') {
        if (network === 'TRC20') shkeeperCryptoName = 'TRX-USDT'; // SHKeeper از TRX-USDT برای TRC20 USDT استفاده می‌کند
        else if (network === 'BEP20') shkeeperCryptoName = 'BNB-USDT'; // SHKeeper از BNB-USDT برای BEP20 USDT استفاده می‌کند
        else if (network === 'ERC20') shkeeperCryptoName = 'ETH-USDT'; // SHKeeper از ETH-USDT برای ERC20 USDT استفاده می‌کند
        else {
            // این خطا هرگز نباید رخ دهد اگر Joi validation درست باشد
            logger.error(`Unsupported USDT network detected after Joi validation for user ${userId}: ${network}`);
            return res.status(400).json({ message: 'شبکه USDT پشتیبانی نشده است.' });
        }
    } else if (cryptoCurrency === 'BTC') {
        shkeeperCryptoName = 'BTC'; // اگر بیت کوین باشد
    }
    // می‌توانید ارزهای دیگر را اینجا اضافه کنید
    else {
        // این خطا هرگز نباید رخ دهد اگر Joi validation درست باشد
        logger.error(`Unsupported cryptocurrency detected after Joi validation for user ${userId}: ${cryptoCurrency}`);
        return res.status(400).json({ message: 'ارز دیجیتال پشتیبانی نشده است.' });
    }

    // ابتدا، رکورد CryptoDeposit را ایجاد کنید تا شناسه آن به عنوان external_id به SHKeeper ارسال شود
    const cryptoDeposit = await CryptoDeposit.create({
      user: userId,
      expectedAmount: amount,
      currency: cryptoCurrency,
      network: network,
      status: 'pending' // وضعیت اولیه
    });

    try {
        // فراخوانی SHKeeper برای ایجاد اینویس پرداخت و دریافت آدرس واریز
        // استفاده از مسیر: /api/v1/{crypto_name}/payment_request
        const shkeeperResponse = await axios.post(`${process.env.SHKEEPER_BASE_URL}${shkeeperCryptoName}/payment_request`, {
            external_id: cryptoDeposit._id.toString(), // استفاده از _id رکورد CryptoDeposit خودمان به عنوان external_id
            fiat: 'USD', // بر اساس مستندات SHKeeper، فقط USD پشتیبانی می‌شود
            amount: String(amount), // SHKeeper انتظار رشته دارد
            callback_url: process.env.SHKEEPER_CALLBACK_URL
        }, {
            headers: {
                'X-Shkeeper-Api-Key': process.env.SHKEEPER_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (!shkeeperResponse.data || shkeeperResponse.data.status !== 'success') {
            console.error('SHKeeper API Error:', shkeeperResponse.data.message || shkeeperResponse.data);
            // اگر SHKeeper خطا داد، وضعیت CryptoDeposit را به failed تغییر دهید
            cryptoDeposit.status = 'failed';
            cryptoDeposit.description = `SHKeeper API failed to generate address: ${shkeeperResponse.data.message || 'Unknown error'}`;
            await cryptoDeposit.save();
            throw new Error(shkeeperResponse.data.message || 'Failed to get deposit address from SHKeeper.');
        }

        const { wallet, id: shkeeperInvoiceId } = shkeeperResponse.data;

        // به‌روزرسانی رکورد CryptoDeposit با آدرس تولید شده توسط SHKeeper و شناسه اینویس
        cryptoDeposit.depositAddress = wallet;
        cryptoDeposit.shkeeperDepositId = shkeeperInvoiceId;
        await cryptoDeposit.save();

        console.log('CryptoDeposit record created and updated with SHKeeper info:', cryptoDeposit._id);

        let qrCodeUri = '';
        if (cryptoCurrency === 'BTC') {
            qrCodeUri = `bitcoin:${wallet}?amount=${amount}`;
        } else if (cryptoCurrency === 'USDT') {
            qrCodeUri = wallet;
        }

        res.status(200).json({
            message: 'Crypto deposit initiated. Please send funds to the generated address.',
            depositInfo: {
                walletAddress: wallet,
                cryptoCurrency: `${cryptoCurrency}-${network}`,
                expectedAmount: amount,
                shkeeperInvoiceId: shkeeperInvoiceId,
                qrCodeUri: `${cryptoCurrency.toLowerCase()}:${wallet}?amount=${amount}&label=LottoGreenDeposit`
            },
            cryptoDepositId: cryptoDeposit._id
        });

    } catch (error) {
        logger.error(`Error during crypto deposit initiation for user ${userId}: ${error.message}`);
        if (cryptoDeposit && cryptoDeposit.status === 'pending') {
            cryptoDeposit.status = 'failed';
            cryptoDeposit.description = `Failed to initiate SHKeeper deposit: ${error.message}`;
            await cryptoDeposit.save();
        }
        res.status(500).json({ message: error.message || 'خطا در شروع عملیات واریز ارز دیجیتال.' });
    }

  } else {
    console.log('Processing manual/gateway deposit...');

    const transaction = await Transaction.create({
      user: userId,
      amount: amount,
      type: 'deposit',
      method: method || 'manual',
      status: 'completed',
      description: `Deposit of ${amount} USDT via ${method || 'manual'}`
    });

    console.log('General Transaction record created for manual/gateway deposit:', transaction._id);

    const user = await User.findById(userId);
    if (user) {
      user.balance += amount;
      await user.save();
      console.log('User balance updated.');
      res.status(200).json({
        message: 'Funds deposited successfully.',
        newBalance: user.balance,
        transaction: transaction,
      });
    } else {
      res.status(404);
      throw new Error('User not found.');
    }
  }
});

// @desc    ثبت یک پیش‌بینی جدید برای یک بازی Toto
// @route   POST /api/users/predict
// @access  Private
const submitPrediction = asyncHandler(async (req, res) => {
    // ... (بخش اعتبارسنجی Joi و خواندن متغیرها تغییری نمی‌کند)
    const { error } = submitPredictionSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(err => err.message);
        logger.warn(`Validation error submitting prediction for user ${req.user._id}: ${errors.join(', ')}`);
        return res.status(400).json({ message: 'خطای اعتبار سنجی', errors });
    }

    const { gameId, predictions: userPredictions, formAmount } = req.body;
    const userId = req.user.id;

    try {
        const totoGame = await TotoGame.findById(gameId);
        if (!totoGame) {
            return res.status(404).json({ message: 'بازی Toto یافت نشد.' });
        }

        if (totoGame.status !== 'open' || new Date() > totoGame.deadline) {
            return res.status(400).json({ message: 'مهلت ثبت پیش‌بینی برای این بازی به پایان رسیده است.' });
        }

        for (const userPred of userPredictions) {
            const { matchId } = userPred;
            const matchInGame = totoGame.matches.find(m => m._id.toString() === matchId);
            if (!matchInGame) {
                return res.status(400).json({ message: `بازی با شناسه ${matchId} در این مسابقه Toto یافت نشد.` });
            }
        }

        let totalCombinations = 1;
        for (const userPred of userPredictions) {
            totalCombinations *= userPred.chosenOutcome.length;
        }

        const FORM_BASE_COST = 1;
        const finalFormPrice = totalCombinations * FORM_BASE_COST;

        if (formAmount !== finalFormPrice) {
            logger.warn(`User ${userId} submitted prediction with incorrect formAmount. Expected: ${finalFormPrice}, Received: ${formAmount}`);
            return res.status(400).json({ message: `مبلغ فرم نامعتبر است. مبلغ صحیح: ${finalFormPrice} USDT.` });
        }

        const user = await User.findById(req.user._id);
        if (user.balance < finalFormPrice) {
            return res.status(400).json({ message: `موجودی شما کافی نیست. ${finalFormPrice.toLocaleString('fa-IR')} USDT مورد نیاز است.` });
        }

        // const existingPrediction = await Prediction.findOne({ user: userId, totoGame: gameId });
        // if (existingPrediction) {
        //     return res.status(400).json({ message: 'شما قبلاً برای این بازی پیش‌بینی ثبت کرده‌اید.' });
        // }

        let formId;
        let isUnique = false;
        while (!isUnique) {
            const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const randomPart = generateRandomString(6);
            formId = `FORM-${datePart}-${randomPart}`;
            const existingFormId = await Prediction.findOne({ formId });
            if (!existingFormId) {
                isUnique = true;
            }
        }

        user.balance -= finalFormPrice;
        await user.save();

        const newPrediction = new Prediction({
            user: req.user._id,
            totoGame: gameId,
            predictions: userPredictions.map(p => ({
                matchId: p.matchId, // <--- **اینجا را از `match` به `matchId` تغییر دهید**
                chosenOutcome: p.chosenOutcome
            })),
            price: finalFormPrice,
            formId
        });

        await newPrediction.save();

        totoGame.totalPot = (totoGame.totalPot || 0) + finalFormPrice;
        await totoGame.save();

        await Transaction.create({
            user: req.user._id,
            amount: -finalFormPrice,
            type: 'form_payment',
            method: 'system',
            description: `پرداخت فرم پیش‌بینی برای مسابقه ${totoGame.name}`,
            relatedEntity: newPrediction._id,
            relatedEntityType: 'Prediction',
            status: 'completed'
        });

        const userPredictionsCount = await Prediction.countDocuments({ user: req.user._id });
        if (userPredictionsCount === 1 && user.referrer) {
            logger.info(`Referral commission for user ${req.user._id} to be awarded for game ${gameId}.`);
        }

        logger.info(`User ${req.user.username} (ID: ${req.user._id}) submitted prediction for Toto Game ${totoGame.name} (ID: ${gameId}) with Form ID: ${formId}.`);

        res.status(201).json({
            message: 'پیش‌بینی شما با موفقیت ثبت شد.',
            prediction: {
                _id: newPrediction._id,
                formId: newPrediction.formId,
                user: newPrediction.user,
                totoGame: newPrediction.totoGame,
                predictions: newPrediction.predictions,
                price: newPrediction.price,
                isScored: newPrediction.isScored,
                score: newPrediction.score,
                isRefunded: newPrediction.isRefunded,
                createdAt: newPrediction.createdAt
            },
            userBalance: user.balance
        });

    } catch (error) {
        logger.error('Error submitting prediction:', error);
        res.status(500).json({ message: 'خطا در ثبت پیش‌بینی.' });
    }
});


// @desc    Request a withdrawal
// @route   POST /api/users/withdraw
// @access  Private
const requestWithdrawal = async (req, res) => {
    // ... (بخش اعتبار سنجی Joi تغییری نمی‌کند)
    const { error } = requestWithdrawalSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(err => err.message);
        logger.warn(`Validation error for withdrawal request from user ${req.user._id}: ${errors.join(', ')}`);
        return res.status(400).json({ message: 'خطای اعتبار سنجی', errors });
    }

    const { amount, currency, network, walletAddress } = req.body;

    try {
        const user = await User.findById(req.user._id);
        const adminSettings = await AdminSettings.findOne();

        if (!user) {
            return res.status(404).json({ message: 'کاربر یافت نشد.' });
        }

        if (adminSettings && amount < adminSettings.minWithdrawal) {
            logger.warn(`Withdrawal request from user ${user._id} for ${amount} failed: Below minimum withdrawal limit (${adminSettings.minWithdrawal}).`);
            return res.status(400).json({ message: `مبلغ برداشت باید حداقل ${adminSettings.minWithdrawal} باشد.` });
        }

        if (user.balance < amount) {
            logger.warn(`Withdrawal request from user ${user._id} for ${amount} failed: Insufficient balance (${user.balance}).`);
            return res.status(400).json({ message: 'موجودی کافی نیست.' });
        }

        const withdrawal = await WithdrawalRequest.create({
            user: user._id,
            amount,
            currency,
            network,
            walletAddress,
            status: 'pending'
        });

        user.balance -= amount;
        await user.save();

        // ثبت تراکنش برداشت
        await Transaction.create({
            user: user._id,
            amount: -amount,
            type: 'withdrawal', // <--- این خط باید 'withdrawal' باشد، نه 'withdrawal_request'
            status: 'pending',
            description: `درخواست برداشت ${amount} ${currency} به آدرس ${walletAddress}`, // <--- این خط (فیلد description) باید اضافه شود
            relatedEntity: withdrawal._id,
            relatedEntityType: 'WithdrawalRequest'
        });

        logger.info(`Withdrawal request created for user ${user._id}: Amount ${amount} ${currency} to ${walletAddress}.`);
        res.status(201).json({ message: 'درخواست برداشت با موفقیت ثبت شد و در انتظار تایید است.' });

    } catch (error) {
        logger.error(`Server error during withdrawal request for user ${req.user._id}: ${error.message}`);
        res.status(500).json({ message: 'خطای سرور.', error: error.message });
    }
};


// @desc    دریافت تمام پیش‌بینی‌های ثبت شده توسط کاربر فعلی
// @route   GET /api/users/my-predictions
// @access  Private (User)
const getMyPredictions = asyncHandler(async (req, res) => {
    try {
        const userId = req.user.id;
        
        // پارامترهای صفحه‌بندی
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // پارامترهای فیلتر
        let query = { user: userId }; // همیشه بر اساس کاربر فعلی فیلتر می‌شود

        if (req.query.gameStatus) {
            // فیلتر بر اساس وضعیت بازی Toto
            // باید مطمئن شوید که TotoGame مدل را populate می‌کنید و سپس فیلتر می‌کنید
            // یا ابتدا TotoGame ها را فیلتر کرده و سپس Prediction ها را بر اساس gameId فیلتر کنید.
            // روش کارآمدتر: ابتدا gameIds مربوط به وضعیت مورد نظر را پیدا کنید.
            const totoGamesWithStatus = await TotoGame.find({ status: req.query.gameStatus }).select('_id');
            const gameIds = totoGamesWithStatus.map(game => game._id);
            query.totoGame = { $in: gameIds };
        }

        const predictions = await Prediction.find(query)
            .populate('totoGame', 'name deadline status matches prizes winners') // prizes و winners اضافه شد
            .sort({ createdAt: -1 }) // جدیدترین پیش‌بینی‌ها اول
            .skip(skip)
            .limit(limit);

        const totalCount = await Prediction.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);

        res.json({
            predictions,
            totalCount,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        logger.error(`Error fetching predictions for user ${req.user.id}: ${error.message}`);
        res.status(500).json({ message: 'خطا در دریافت پیش‌بینی‌های شما.', error: error.message });
    }
});

// @desc    دریافت تمام تراکنش‌های یک کاربر
// @route   GET /api/users/my-transactions
// @access  Private
const getMyTransactions = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        
        // پارامترهای صفحه‌بندی
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // پارامترهای فیلتر
        let query = { user: userId }; // همیشه بر اساس کاربر فعلی فیلتر می‌شود

        if (req.query.type) {
            query.type = req.query.type;
        }
        if (req.query.status) {
            query.status = req.query.status;
        }
        // می‌توانید فیلترهای بیشتری مانند method, minAmount, maxAmount, startDate, endDate را اینجا اضافه کنید
        // مثال:
        // if (req.query.method) {
        //     query.method = req.query.method;
        // }
        // if (req.query.minAmount || req.query.maxAmount) {
        //     query.amount = {};
        //     if (req.query.minAmount) query.amount.$gte = parseFloat(req.query.minAmount);
        //     if (req.query.maxAmount) query.amount.$lte = parseFloat(req.query.maxAmount);
        // }
        // if (req.query.startDate || req.query.endDate) {
        //     query.createdAt = {};
        //     if (req.query.startDate) query.createdAt.$gte = new Date(req.query.startDate);
        //     if (req.query.endDate) query.createdAt.$lte = new Date(req.query.endDate);
        // }


        const transactions = await Transaction.find(query)
            .sort({ createdAt: -1 }) // جدیدترین تراکنش‌ها اول
            .skip(skip)
            .limit(limit);

        const totalCount = await Transaction.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);

        res.json({
            transactions,
            totalCount,
            totalPages,
            currentPage: page
        });
    }
    catch (error) {
        logger.error(`Error fetching user transactions for user ${req.user._id}: ${error.message}`);
        res.status(500).json({ message: 'خطا در دریافت تراکنش‌های شما.', error: error.message });
    }
});


// @desc    درخواست دریافت جایزه بازی Toto
// @route   POST /api/users/claim-prize/:gameId
// @access  Private
const claimPrize = asyncHandler(async (req, res) => {
    const { gameId } = req.params;
    const userId = req.user._id;

    try {
        const totoGame = await TotoGame.findById(gameId);
        if (!totoGame) {
            return res.status(404).json({ message: 'بازی Toto یافت نشد.' });
        }

        if (totoGame.status !== 'completed') {
            return res.status(400).json({ message: 'این بازی هنوز تکمیل نشده یا لغو شده است.' });
        }

        // بررسی اینکه آیا کاربر در لیست برندگان است
        let prizeAmount = 0;
        let prizeType = '';

        if (totoGame.winners.first.includes(userId.toString())) {
            prizeAmount = totoGame.prizes.firstPlace;
            prizeType = 'first_place';
        } else if (totoGame.winners.second.includes(userId.toString())) {
            prizeAmount = totoGame.prizes.secondPlace;
            prizeType = 'second_place';
        } else if (totoGame.winners.third.includes(userId.toString())) {
            prizeAmount = totoGame.prizes.thirdPlace;
            prizeType = 'third_place';
        }

        if (prizeAmount <= 0) {
            return res.status(400).json({ message: 'شما برنده جایزه‌ای در این بازی نیستید یا جایزه قبلاً دریافت شده است.' });
        }

        // بررسی اینکه آیا کاربر قبلاً جایزه را دریافت کرده است
        const existingClaimTransaction = await Transaction.findOne({
            user: userId,
            type: 'prize_payout',
            relatedEntity: gameId,
            status: 'completed'
        });

        if (existingClaimTransaction) {
            return res.status(400).json({ message: 'شما قبلاً جایزه این بازی را دریافت کرده‌اید.' });
        }

        // افزودن جایزه به موجودی کاربر
        const user = await User.findById(userId);
        user.balance += prizeAmount;
        await user.save();

        // ثبت تراکنش پرداخت جایزه
        await Transaction.create({
            user: userId,
            amount: prizeAmount,
            type: 'prize_payout',
            method: 'system',
            description: `دریافت جایزه ${prizeAmount} USDT برای رتبه ${prizeType} در بازی ${totoGame.name}`,
            relatedEntity: gameId,
            relatedEntityType: 'TotoGame',
            status: 'completed'
        });

        logger.info(`User ${user.username} (ID: ${userId}) claimed ${prizeAmount} USDT prize for TotoGame ${gameId}. New balance: ${user.balance}`);
        res.json({ message: `جایزه ${prizeAmount} USDT با موفقیت به حساب شما واریز شد.`, newBalance: user.balance });

    } catch (error) {
        logger.error(`Error claiming prize for user ${userId} and game ${gameId}: ${error.message}`);
        res.status(500).json({ message: 'خطا در درخواست جایزه.' });
    }
});

// @desc    دریافت جزئیات یک واریز رمزارزی خاص توسط کاربر
// @route   GET /api/users/crypto-deposits/:id
// @access  Private (User)
const getSingleCryptoDeposit = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'شناسه واریز رمزارزی نامعتبر است.' });
    }

    try {
        const cryptoDeposit = await CryptoDeposit.findOne({ _id: id, user: userId });

        if (!cryptoDeposit) {
            logger.warn(`CryptoDeposit ID ${id} not found for user ${userId} or access denied.`);
            return res.status(404).json({ message: 'واریز رمزارزی یافت نشد یا دسترسی غیرمجاز است.' });
        }

        logger.info(`User ${req.user.username} (ID: ${userId}) fetched crypto deposit details for ID: ${id}. Status: ${cryptoDeposit.status}`);
        res.json(cryptoDeposit);
    } catch (error) {
        logger.error(`Error fetching single crypto deposit ${id} for user ${userId}: ${error.message}`);
        res.status(500).json({ message: 'خطا در دریافت جزئیات واریز رمزارزی.' });
    }
});

// @desc    دریافت بازی‌های منقضی شده (deadline گذشته ولی هنوز وضعیتشان open است)
// @route   GET /api/users/games/expired
// @access  Private (User)
const getExpiredGames = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id; 
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6; 
        const skip = (page - 1) * limit;

        let query = {
            status: { $in: ['closed', 'completed', 'cancelled'] }
        };

        const games = await TotoGame.find(query)
            .sort({ deadline: -1 }) 
            .skip(skip)
            .limit(limit)
            .lean(); // اضافه شدن .lean() برای کارایی بهتر در عملیات بعدی

        // --- جدید: واکشی تعداد پیش‌بینی‌ها برای هر بازی ---
        const gameIds = games.map(game => game._id);
        const predictionCounts = await Prediction.aggregate([
            { $match: { totoGame: { $in: gameIds } } },
            { $group: { _id: '$totoGame', count: { $sum: 1 } } }
        ]);

        // تبدیل نتایج به یک Map برای دسترسی آسان
        const predictionCountMap = new Map();
        predictionCounts.forEach(item => {
            predictionCountMap.set(item._id.toString(), item.count);
        });

        // افزودن تعداد پیش‌بینی‌ها به هر شیء بازی
        const gamesWithPredictionCounts = games.map(game => ({
            ...game,
            submittedFormsCount: predictionCountMap.get(game._id.toString()) || 0 // اگر پیش‌بینی‌ای نبود، صفر باشد
        }));
        // --- پایان جدید ---

        const totalCount = await TotoGame.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);

        res.json({
            games: gamesWithPredictionCounts, // ارسال بازی‌های به‌روز شده
            totalCount,
            totalPages,
            currentPage: page
        });

    } catch (error) {
        logger.error(`Error fetching expired games for user ${req.user._id}: ${error.message}`);
        res.status(500).json({ message: 'خطا در دریافت مسابقات پایان‌یافته.', error: error.message });
    }
});


// اکسپورت تمام توابع کنترلر
console.log('USERCONTROLLER.JS: Exporting functions. Type of deposit:', typeof deposit);
module.exports = {
    getUserProfile,
    updateUserProfile,
    changeUserPassword,
    submitPrediction,
    getMyPredictions,
    deposit,
    getMyTransactions,
    requestWithdrawal,
    claimPrize,
    getSingleCryptoDeposit,
    getExpiredGames,
    downloadUserGameData

};
console.log('USERCONTROLLER.JS: Finished userController loading.');