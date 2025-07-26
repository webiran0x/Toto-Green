// toto-app/controllers/userGameController.js
const asyncHandler = require('express-async-handler');
const TotoGame = require('../models/TotoGame');
const Prediction = require('../models/Prediction');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { awardReferralCommission } = require('../services/totoService'); // اطمینان حاصل کنید که این تابع در totoService.js وجود دارد
const logger = require('../utils/logger');
// --- اضافه شد: ایمپورت تابع کمکی ---
const { generateRandomString } = require('../utils/helpers'); // اطمینان حاصل کنید که این مسیر و تابع درست هستند
// --- پایان بخش اضافه شد ---


// @desc    ثبت فرم پیش‌بینی در یک بازی Toto
// @route   POST /api/totos/predict
// @access  Private
exports.createPrediction = asyncHandler(async (req, res, next) => {
    const { totoGameId, predictions, price } = req.body;
    const userId = req.user.id; // از middleware احراز هویت می‌آید

    // اعتبارسنجی اولیه ورودی‌ها
    if (!totoGameId || !predictions || !Array.isArray(predictions) || predictions.length !== 15 || !price || price <= 0) {
        return res.status(400).json({ message: 'لطفاً تمام فیلدهای الزامی را پر کنید و دقیقاً ۱۵ پیش‌بینی معتبر ارائه دهید.' });
    }

    try {
        const totoGame = await TotoGame.findById(totoGameId);

        if (!totoGame) {
            return res.status(404).json({ message: 'بازی Toto یافت نشد.' });
        }

        if (totoGame.status !== 'open') {
            return res.status(400).json({ message: 'مهلت ثبت فرم برای این بازی به پایان رسیده است یا بازی بسته شده است.' });
        }

        const now = new Date();
        if (now > totoGame.deadline) {
            // بازی باید توسط cron job بسته شده باشد، اما اگر هنوز باز است، از ثبت پیش‌بینی جلوگیری کنید.
            totoGame.status = 'closed'; // وضعیت را در اینجا هم به‌روزرسانی کنید
            await totoGame.save();
            return res.status(400).json({ message: 'مهلت ثبت فرم برای این بازی به پایان رسیده است.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'کاربر یافت نشد.' });
        }

        if (user.balance < price) {
            return res.status(400).json({ message: 'موجودی کافی نیست.' });
        }

        // // بررسی اینکه کاربر قبلاً برای این بازی پیش‌بینی ثبت کرده است یا خیر
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
            // بررسی کنید که آیا formId قبلاً در دیتابیس وجود دارد
            const existingFormId = await Prediction.findOne({ formId });
            if (!existingFormId) {
                isUnique = true;
            }
        }
        // --- پایان بخش اضافه شد ---

        // کسر مبلغ فرم از موجودی کاربر
        user.balance -= price;
        await user.save();

        // ایجاد سند پیش‌بینی جدید
        const prediction = new Prediction({
            user: userId,
            totoGame: totoGameId,
            predictions,
            price,
            formId // --- اضافه شد: اختصاص formId به پیش‌بینی ---
        });

        await prediction.save();

        // افزایش totalPot بازی
        totoGame.totalPot += price; // مبلغ فرم به totalPot اضافه می‌شود
        await totoGame.save();


        // ثبت تراکنش
        await Transaction.create({
            user: userId,
            amount: -price, // منفی برای نشان دادن کسر از موجودی
            type: 'prediction_fee',
            description: `پرداخت هزینه فرم پیش‌بینی برای بازی: ${totoGame.name} (USDT)`,
            relatedEntity: totoGameId
        });

        // بررسی و اعطای کمیسیون ارجاع (اگر این اولین فرم کاربر است)
        const userPredictionsCount = await Prediction.countDocuments({ user: userId });
        if (userPredictionsCount === 1) { // اگر این اولین پیش‌بینی کاربر است
            await awardReferralCommission(userId, price);
        }

        logger.info(`User ${user.username} (ID: ${userId}) submitted prediction for Toto Game ${totoGame.name} (ID: ${totoGameId}) with Form ID: ${formId}.`);

        res.status(201).json({
            message: 'پیش‌بینی با موفقیت ثبت شد.',
            prediction: {
                _id: prediction._id,
                formId: prediction.formId, // اطمینان از ارسال formId در پاسخ
                user: prediction.user,
                totoGame: prediction.totoGame,
                predictions: prediction.predictions,
                price: prediction.price,
                isScored: prediction.isScored,
                score: prediction.score,
                isRefunded: prediction.isRefunded,
                createdAt: prediction.createdAt
            }
        });
    } catch (error) {
        logger.error(`Error creating prediction for user ${req.user.username} (ID: ${req.user.id}): ${error.message}. Stack: ${error.stack}`);
        next(error); // ارسال خطا به middleware مدیریت خطا
    }
});

// @desc    دریافت پیش‌بینی‌های یک کاربر
// @route   GET /api/users/my-predictions
// @access  Private
exports.getMyPredictions = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const predictions = await Prediction.find({ user: userId })
        .populate('totoGame')
        .sort({ createdAt: -1 });

    // فیلتر کردن مسابقات برای نمایش جزئیات لازم در فرانت‌اند
    const sanitizedPredictions = predictions.map(prediction => {
        const totoGame = prediction.totoGame ? {
            _id: prediction.totoGame._id,
            name: prediction.totoGame.name,
            status: prediction.totoGame.status,
            deadline: prediction.totoGame.deadline,
            matches: prediction.totoGame.matches, // شامل جزئیات بازی‌ها
            prizes: prediction.totoGame.prizes, // شامل جزئیات جوایز
            winners: prediction.totoGame.winners, // شامل برندگان
        } : null;

        return {
            _id: prediction._id,
            formId: prediction.formId, // اطمینان از ارسال formId
            user: prediction.user,
            totoGame: totoGame,
            predictions: prediction.predictions,
            price: prediction.price,
            isScored: prediction.isScored,
            score: prediction.score,
            isRefunded: prediction.isRefunded,
            createdAt: prediction.createdAt
        };
    });

    logger.info(`User ${req.user.username} (ID: ${userId}) fetched their predictions.`);
    res.json(sanitizedPredictions);
});


// @desc    درخواست دریافت جایزه بازی
// @route   POST /api/users/claim-prize/:gameId
// @access  Private
exports.claimPrize = asyncHandler(async (req, res) => {
    const { gameId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(gameId)) {
        return res.status(400).json({ message: 'شناسه بازی نامعتبر است.' });
    }

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: 'کاربر یافت نشد.' });
    }

    const totoGame = await TotoGame.findById(gameId);
    if (!totoGame) {
        return res.status(404).json({ message: 'بازی یافت نشد.' });
    }

    if (totoGame.status !== 'completed') {
        return res.status(400).json({ message: 'نتایج این بازی هنوز مشخص نشده یا بازی کامل نشده است.' });
    }

    const prediction = await Prediction.findOne({ user: userId, totoGame: gameId });
    if (!prediction) {
        return res.status(404).json({ message: 'پیش‌بینی شما برای این بازی یافت نشد.' });
    }

    // بررسی اینکه آیا کاربر برنده شده است
    let prizeAmount = 0;
    let prizeCategory = '';

    if (totoGame.winners.first.includes(userId)) {
        prizeAmount = totoGame.prizes.firstPlace / totoGame.winners.first.length; // تقسیم جایزه بین برندگان مشترک
        prizeCategory = 'first_place';
    } else if (totoGame.winners.second.includes(userId)) {
        prizeAmount = totoGame.prizes.secondPlace / totoGame.winners.second.length;
        prizeCategory = 'second_place';
    } else if (totoGame.winners.third.includes(userId)) {
        prizeAmount = totoGame.prizes.thirdPlace / totoGame.winners.third.length;
        prizeCategory = 'third_place';
    } else {
        return res.status(400).json({ message: 'شما برنده این بازی نیستید.' });
    }

    // بررسی اینکه آیا جایزه قبلاً دریافت شده است
    const existingPrizeTransaction = await Transaction.findOne({
        user: userId,
        relatedEntity: gameId,
        type: 'prize'
    });
    if (existingPrizeTransaction) {
        return res.status(400).json({ message: 'جایزه این بازی قبلاً به شما پرداخت شده است.' });
    }

    if (prizeAmount <= 0) {
        return res.status(400).json({ message: 'مبلغ جایزه نا‌معتبر است.' });
    }

    // واریز مبلغ جایزه به موجودی کاربر
    user.balance += prizeAmount;
    await user.save();

    // ثبت تراکنش جایزه
    await Transaction.create({
        user: userId,
        amount: prizeAmount,
        type: 'prize',
        description: `دریافت جایزه ${prizeCategory} برای بازی: ${totoGame.name} (USDT)`,
        relatedEntity: gameId
    });

    logger.info(`User ${user.username} (ID: ${userId}) claimed prize of ${prizeAmount} USDT for Toto Game ${totoGame.name} (ID: ${gameId}).`);
    res.json({ message: 'جایزه با موفقیت به حساب شما واریز شد.', prizeAmount });
});