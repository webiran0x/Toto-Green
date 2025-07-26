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
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');
const axios = require('axios'); // برای فراخوانی API SHKeeper
const mongoose = require('mongoose'); // برای تولید ObjectId جدید برای external_id
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



// @desc    دریافت پروفایل کاربر
// @route   GET /api/users/profile
// @access  Private (User)
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            balance: user.balance,
            score: user.score,
            accessLevel: user.accessLevel,
            status: user.status,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            referrer: user.referrer // اگر نیاز باشد، اطلاعات معرف را populate کنید
        });
    } else {
        res.status(404).json({ message: 'کاربر یافت نشد.' });
    }
});

// @desc    به‌روزرسانی پروفایل کاربر
// @route   PUT /api/users/profile
// @access  Private (User)
const updateUserProfile = asyncHandler(async (req, res) => {
    const { username, email } = req.body; // اجازه تغییر رمز عبور از اینجا داده نمی‌شود

    const user = await User.findById(req.user._id);

    if (user) {
        user.username = username || user.username;
        user.email = email || user.email;

        // می‌توانید اعتبارسنجی‌های بیشتری اضافه کنید (مثلاً بررسی تکراری نبودن ایمیل/نام کاربری)
        const updatedUser = await user.save();

        logger.info(`User ${req.user.username} (ID: ${req.user._id}) updated their profile.`);
        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role,
            balance: updatedUser.balance,
            score: updatedUser.score,
            accessLevel: updatedUser.accessLevel,
            status: updatedUser.status,
        });
    } else {
        res.status(404).json({ message: 'کاربر یافت نشد.' });
    }
});

// @desc    تغییر رمز عبور کاربر
// @route   PUT /api/users/change-password
// @access  Private (User)
const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
        return res.status(404).json({ message: 'کاربر یافت نشد.' });
    }

    // بررسی رمز عبور قدیمی
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: 'رمز عبور فعلی اشتباه است.' });
    }

    // هش کردن رمز عبور جدید و ذخیره
    user.password = newPassword; // Pre-save hook در مدل User آن را هش می‌کند
    await user.save();

    logger.info(`User ${req.user.username} (ID: ${req.user._id}) changed their password.`);
    res.json({ message: 'رمز عبور با موفقیت تغییر یافت.' });
});


// @desc    شارژ حساب کاربر (واریز)
// @route   POST /api/users/deposit
// @access  Private (User)
const deposit = asyncHandler(async (req, res) => {
  const { amount, method, cryptoCurrency, network } = req.body;
  const userId = req.user.id; // شناسه کاربر از توکن احراز هویت شده

  // لاگ درخواست ورودی برای اشکال‌زدایی
  console.log('--- Incoming Deposit Request ---');
  console.log('Request Body:', req.body);
  console.log('Detected Method:', method);

  if (method === 'crypto') {
    // --- منطق برای واریزهای ارز دیجیتال (فاز شروع) ---
    console.log('Processing crypto deposit initiation...');

    if (!cryptoCurrency || !network) {
      res.status(400);
      throw new Error('Crypto currency and network are required for crypto deposits.');
    }

    // SHKeeper API انتظار نام ارز/شبکه خاصی را دارد (مثلاً "ETH-USDT" یا "BNB-USDT")
    let shkeeperCryptoName;
    if (cryptoCurrency === 'USDT') {
        if (network === 'TRC20') shkeeperCryptoName = 'TRX-USDT'; // SHKeeper از TRX-USDT برای TRC20 USDT استفاده می‌کند
        else if (network === 'BEP20') shkeeperCryptoName = 'BNB-USDT'; // SHKeeper از BNB-USDT برای BEP20 USDT استفاده می‌کند
        else if (network === 'ERC20') shkeeperCryptoName = 'ETH-USDT'; // SHKeeper از ETH-USDT برای ERC20 USDT استفاده می‌کند
        else {
            res.status(400);
            throw new Error('Unsupported USDT network for SHKeeper.');
        }
    } else if (cryptoCurrency === 'BTC') {
        shkeeperCryptoName = 'BTC'; // اگر بیت کوین باشد
    }
    // می‌توانید ارزهای دیگر را اینجا اضافه کنید
    else {
        res.status(400);
        throw new Error('Unsupported cryptocurrency for SHKeeper.');
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
    const { totoGameId, predictions: userPredictions } = req.body;
    console.log(userPredictions);
     // userPredictions: [{ matchId, chosenOutcome }]
    const userId = req.user.id; // شناسه کاربر از توکن احراز هویت شده

    // اعتبارسنجی اولیه ورودی‌ها
    if (!userPredictions || !Array.isArray(userPredictions) || userPredictions.length === 0) {
        return res.status(400).json({ message: 'لطفاً پیش‌بینی‌های معتبری را ارسال کنید.' });
    }

    try {
        const totoGame = await TotoGame.findById(totoGameId);
        if (!totoGame) {
            return res.status(404).json({ message: 'بازی Toto یافت نشد.' });
        }

        if (totoGame.status !== 'open' || new Date() > totoGame.deadline) {
            return res.status(400).json({ message: 'مهلت ثبت پیش‌بینی برای این بازی به پایان رسیده است.' });
        }

        if (userPredictions.length !== totoGame.matches.length) {
            return res.status(400).json({ message: `پیش‌بینی باید شامل دقیقاً ${totoGame.matches.length} بازی باشد.` });
        }

        let totalCombinations = 1;
        const validPredictions = [];

        for (const userPred of userPredictions) {
            const { matchId, chosenOutcome } = userPred;
            const matchInGame = totoGame.matches.find(m => m._id.toString() === matchId);

            if (!matchInGame) {
                return res.status(400).json({ message: `بازی با شناسه ${matchId} در این مسابقه Toto یافت نشد.` });
            }

            if (!Array.isArray(chosenOutcome) || chosenOutcome.length === 0 || !chosenOutcome.every(o => ['1', 'X', '2'].includes(o))) {
                return res.status(400).json({ message: `نتیجه انتخاب شده برای بازی ${matchId} نامعتبر است.` });
            }

            totalCombinations *= chosenOutcome.length;

            // --- اضافه شد: لاگ برای بررسی chosenOutcome قبل از push ---
            console.log(`Debug: chosenOutcome before push to validPredictions:`, chosenOutcome);
            console.log(`Debug: Type of chosenOutcome before push:`, typeof chosenOutcome);
            console.log(`Debug: Is chosenOutcome an Array before push:`, Array.isArray(chosenOutcome));
            // --- پایان لاگ اضافه شده ---

            validPredictions.push({ matchId: matchInGame._id, chosenOutcome });
        }

        const FORM_BASE_COST = 1;
        const finalFormPrice = totalCombinations * FORM_BASE_COST;

        const user = await User.findById(req.user._id);
        if (user.balance < finalFormPrice) {
            return res.status(400).json({ message: `موجودی شما کافی نیست. ${finalFormPrice.toLocaleString('fa-IR')} USDT مورد نیاز است.` });
        }

        // const existingPrediction = await Prediction.findOne({ user: userId, totoGame: totoGameId });
        // if (existingPrediction) {
        //     return res.status(400).json({ message: 'شما قبلاً برای این بازی پیش‌بینی ثبت کرده‌اید.' });
        // }
        
        // --- اضافه شد: تولید formId منحصر به فرد ---
        let formId;
        let isUnique = false;
        while (!isUnique) {
            const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
            const randomPart = generateRandomString(6); // 6 کاراکتر تصادفی
            formId = `FORM-${datePart}-${randomPart}`;
            const existingFormId = await Prediction.findOne({ formId });
            if (!existingFormId) {
                isUnique = true;
            }
        }
        // --- پایان بخش اضافه شد ---


        user.balance -= finalFormPrice;
        await user.save();

        const newPrediction = new Prediction({
            user: req.user._id,
            totoGame: totoGameId,
            predictions: validPredictions,
            price: finalFormPrice,
            formId // --- اضافه شد: اختصاص formId به پیش‌بینی ---
        });

        await newPrediction.save();

        totoGame.totalPot += finalFormPrice; // مبلغ فرم به totalPot اضافه می‌شود
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

        // بررسی و اعطای کمیسیون ارجاع (اگر این اولین فرم کاربر است)
        const userPredictionsCount = await Prediction.countDocuments({ user: req.user._id });
        if (userPredictionsCount === 1) { // اگر این اولین پیش‌بینی کاربر است
            await awardReferralCommission(req.user._id, finalFormPrice);
        }

        logger.info(`User ${req.user.username} (ID: ${req.user._id}) submitted prediction for Toto Game ${totoGame.name} (ID: ${totoGameId}) with Form ID: ${formId}.`);

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



// @desc    درخواست برداشت وجه توسط کاربر
// @route   POST /api/users/withdraw
// @access  Private
const withdrawFunds = asyncHandler(async (req, res) => {
  const { amount, walletAddress, network } = req.body;

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ message: 'مبلغ برداشتی نامعتبر است.' });
  }
  if (!walletAddress || walletAddress.trim() === '') {
    return res.status(400).json({ message: 'آدرس کیف پول مقصد الزامی است.' });
  }
  if (!network || network.trim() === '') {
    return res.status(400).json({ message: 'شبکه کیف پول الزامی است.' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      logger.error(`User ${req.user._id} not found during withdrawal attempt.`);
      return res.status(404).json({ message: 'کاربر یافت نشد.' });
    }

    // TODO: از تنظیمات ادمین برای حداقل مبلغ برداشت استفاده کنید
    // const adminSettings = await AdminSettings.findOne({});
    // if (amount < adminSettings.minWithdrawal) {
    //   return res.status(400).json({ message: `حداقل مبلغ برداشت ${adminSettings.minWithdrawal} USDT است.` });
    // }

    if (user.balance < amount) {
      logger.warn(`User ${user.username} has insufficient balance (${user.balance}) for withdrawal amount ${amount}.`);
      return res.status(400).json({ message: 'موجودی حساب شما کافی نیست.' });
    }

    // ایجاد یک درخواست برداشت (WithdrawalRequest)
    const newRequest = new WithdrawalRequest({
      user: req.user._id,
      amount,
      walletAddress,
      network,
      status: 'pending'
    });

    logger.info('Saving withdrawal request...');
    await newRequest.save();
    logger.info('Withdrawal request saved successfully.');

    // کسر مبلغ از موجودی کاربر بلافاصله پس از ثبت درخواست
    user.balance -= amount;
    await user.save();

    // ایجاد یک تراکنش با نوع 'withdrawal' و وضعیت 'pending'
    await Transaction.create({
        user: req.user._id,
        amount: -amount, // مبلغ منفی برای برداشت
        type: 'withdrawal',
        method: 'crypto', // فرض بر این است که همه برداشت‌ها کریپتو هستند
        status: 'pending', // وضعیت pending تا زمان تایید/رد ادمین و انجام Payout
        description: `درخواست برداشت ${amount} USDT به آدرس ${walletAddress} (${network})`,
        relatedEntity: newRequest._id,
        relatedEntityType: 'WithdrawalRequest',
        cryptoDetails: { // جزئیات اولیه برای نمایش در تراکنش‌ها
            cryptoCurrency: `USDT-${network}`,
            walletAddress: walletAddress,
            // txHash و shkeeperTaskId بعداً توسط ادمین در صورت تایید و Payout اضافه می‌شوند
        }
    });


    logger.info(`User ${user.username} (ID: ${user._id}) created withdrawal request of ${amount} USDT. Balance deducted.`);
    res.status(202).json({ message: 'درخواست برداشت شما با موفقیت ثبت شد و در انتظار تأیید ادمین است.', withdrawalRequest: newRequest, newBalance: user.balance });
  } catch (error) {
    logger.error(`Error creating withdrawal request for user ID ${req.user._id}: ${error.message}`);
    res.status(500).json({ message: 'خطا در ثبت درخواست برداشت وجه.' });
  }
});


// @desc    دریافت تمام پیش‌بینی‌های ثبت شده توسط کاربر فعلی
// @route   GET /api/users/my-predictions
// @access  Private (User)
const getMyPredictions = asyncHandler(async (req, res) => {
    try {
        const predictions = await Prediction.find({ user: req.user.id })
            .populate('totoGame', 'name deadline status matches prizes winners') // prizes و winners اضافه شد
            .sort({ createdAt: -1 });
        logger.info(`User ${req.user.username} (ID: ${req.user.id}) fetched their predictions.`);
        res.json(predictions);
    } catch (error) {
        logger.error(`Error fetching predictions for user ${req.user.id}:`, error);
        res.status(500).json({ message: 'خطا در دریافت پیش‌بینی‌های شما.' });
    }
});


// @desc    دریافت تمام تراکنش‌های یک کاربر
// @route   GET /api/users/my-transactions
// @access  Private
const getMyTransactions = asyncHandler(async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user._id })
            .sort({ createdAt: -1 }); // جدیدترین تراکنش‌ها اول
        res.json(transactions);
    }
    catch (error) {
        logger.error('Error fetching user transactions:', error);
        res.status(500).json({ message: 'خطا در دریافت تراکنش‌های شما.' });
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
// @route   GET /api/users/expired-games
// @access  Private (User)
const getExpiredGames = asyncHandler(async (req, res) => {
    try {
        const now = new Date();

        // بازی‌هایی که هنوز open هستند ولی زمان پایان آنها گذشته
        const expiredGames = await TotoGame.find({
            status: 'open',
            deadline: { $lt: now }
        });

        res.json(expiredGames);

    } catch (error) {
        logger.error('Error fetching expired games:', error);
        res.status(500).json({ message: 'خطا در دریافت بازی‌های منقضی شده.' });
    }
});


// اکسپورت تمام توابع کنترلر
console.log('USERCONTROLLER.JS: Exporting functions. Type of deposit:', typeof deposit);
module.exports = {
    getUserProfile,
    updateUserProfile,
    changePassword,
    submitPrediction,
    getMyPredictions,
    deposit,
    getMyTransactions,
    withdrawFunds,
    claimPrize,
    getSingleCryptoDeposit,
    getExpiredGames
};
console.log('USERCONTROLLER.JS: Finished userController loading.');
