// toto-app/controllers/userGameController.js
const asyncHandler = require('express-async-handler');
const TotoGame = require('../models/TotoGame');
const Prediction = require('../models/Prediction');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { awardReferralCommission } = require('../services/totoService'); // اطمینان حاصل کنید که این تابع در totoService.js وجود دارد
const logger = require('../utils/logger');
const { submitPredictionSchema } = require('../validation/userValidation'); // استفاده از schema از userValidation
const ExcelJS = require('exceljs'); // <--- مطمئن شوید این ایمپورت وجود دارد. اگر نیست، npm install exceljs را اجرا کنید.
// --- اضافه شد: ایمپورت تابع کمکی ---
const { generateRandomString } = require('../utils/helpers'); // اطمینان حاصل کنید که این مسیر و تابع درست هستند
// --- پایان بخش اضافه شد ---


// @desc    Submit predictions for a Toto game
// @route   POST /api/user-games/predictions
// @access  Private
const submitPrediction = async (req, res) => {
    // Step 1: اعتبار سنجی ورودی با استفاده از Joi
    const { error } = submitPredictionSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(err => err.message);
        logger.warn(`Validation error submitting prediction for user ${req.user._id}: ${errors.join(', ')}`);
        return res.status(400).json({ message: 'خطای اعتبار سنجی', errors });
    }

    const { gameId, predictions, formAmount } = req.body;

    try {
        const game = await TotoGame.findById(gameId);
        const user = await User.findById(req.user._id);

        if (!game || !user) {
            return res.status(404).json({ message: 'بازی یا کاربر یافت نشد.' });
        }

        if (game.status !== 'open') {
            return res.status(400).json({ message: 'این بازی برای ثبت پیش‌بینی باز نیست.' });
        }

        if (new Date() > game.deadline) {
            game.status = 'closed'; // بسته شدن بازی در صورت رد شدن مهلت
            await game.save();
            return res.status(400).json({ message: 'مهلت ثبت پیش‌بینی برای این بازی به پایان رسیده است.' });
        }

        if (user.balance < formAmount) {
            logger.warn(`Prediction submission failed for user ${user._id}: Insufficient balance (${user.balance} < ${formAmount}).`);
            return res.status(400).json({ message: 'موجودی کافی برای پرداخت فرم را ندارید.' });
        }

        // Check if user already submitted a prediction for this game (optional, depending on rules)
        const existingPrediction = await Prediction.findOne({ user: user._id, totoGame: game._id });
        if (existingPrediction) {
            return res.status(400).json({ message: 'شما قبلاً برای این بازی پیش‌بینی ثبت کرده‌اید.' });
        }

        // کسر مبلغ فرم از موجودی کاربر
        user.balance -= formAmount;
        await user.save();

        // ایجاد سند پیش‌بینی جدید
        const prediction = await Prediction.create({
            user: user._id,
            totoGame: game._id,
            predictions: predictions.map(p => ({
                match: p.matchId,
                predictedWinner: p.predictedWinner
            })),
            formAmount,
            score: 0, // امتیاز اولیه صفر است
            status: 'pending_result' // تا زمان اعلام نتایج
        });

        // ثبت تراکنش مربوط به پرداخت فرم
        await Transaction.create({
            user: user._id,
            amount: -formAmount,
            type: 'game_prediction',
            status: 'completed',
            relatedEntity: prediction._id,
            relatedEntityType: 'Prediction'
        });

        // افزایش مجموع جوایز بازی
        game.totalPrizePool = (game.totalPrizePool || 0) + formAmount;
        await game.save();


        logger.info(`User ${user._id} submitted prediction for game ${gameId} with amount ${formAmount}.`);
        res.status(201).json({ message: 'پیش‌بینی شما با موفقیت ثبت شد!', prediction });

    } catch (error) {
        logger.error(`Server error submitting prediction for user ${req.user._id}: ${error.message}`);
        res.status(500).json({ message: 'خطای سرور.', error: error.message });
    }
};


// @desc    ثبت فرم پیش‌بینی در یک بازی Toto
// @route   POST /api/totos/predict
// @access  Private
exports.createPrediction = asyncHandler(async (req, res, next) => {
    // اعتبارسنجی با Joi
    const { error } = submitPredictionSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(err => err.message);
        logger.warn(`Validation error for user ${req.user.id}: ${errors.join(', ')}`);
        return res.status(400).json({ message: 'خطای اعتبارسنجی', errors });
    }

    const { gameId, predictions, formAmount } = req.body;
    const userId = req.user.id;

    try {
        const game = await TotoGame.findById(gameId);
        if (!game) return res.status(404).json({ message: 'بازی یافت نشد.' });

        if (game.status !== 'open' || new Date() > game.deadline) {
            game.status = 'closed';
            await game.save();
            return res.status(400).json({ message: 'مهلت ثبت فرم به پایان رسیده است.' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'کاربر یافت نشد.' });

        if (user.balance < formAmount) {
            logger.warn(`User ${userId} has insufficient balance (${user.balance} < ${formAmount})`);
            return res.status(400).json({ message: 'موجودی کافی نیست.' });
        }

        const existingPrediction = await Prediction.findOne({ user: userId, totoGame: gameId });
        if (existingPrediction) {
            return res.status(400).json({ message: 'شما قبلاً برای این بازی پیش‌بینی ثبت کرده‌اید.' });
        }

        // تولید formId یکتا
        let formId;
        let isUnique = false;
        while (!isUnique) {
            const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const randomPart = generateRandomString(6);
            formId = `FORM-${datePart}-${randomPart}`;
            const exists = await Prediction.findOne({ formId });
            if (!exists) isUnique = true;
        }

        // کسر موجودی و ذخیره
        user.balance -= formAmount;
        await user.save();

        // ایجاد پیش‌بینی
        const prediction = await Prediction.create({
            user: userId,
            totoGame: gameId,
            predictions: predictions.map(p => ({
                match: p.matchId,
                predictedWinner: p.predictedWinner
            })),
            formAmount,
            score: 0,
            status: 'pending_result',
            formId
        });

        // افزایش totalPrizePool
        game.totalPrizePool = (game.totalPrizePool || 0) + formAmount;
        await game.save();

        // ثبت تراکنش فرم
        await Transaction.create({
            user: userId,
            amount: -formAmount,
            type: 'prediction_fee',
            status: 'completed',
            description: `پرداخت فرم بازی ${game.name} (USDT)`,
            relatedEntity: prediction._id,
            relatedEntityType: 'Prediction'
        });

        // بررسی اولین فرم برای کمیسیون ارجاعی
        const userPredictionCount = await Prediction.countDocuments({ user: userId });
        if (userPredictionCount === 1) {
            await awardReferralCommission(userId, formAmount);
        }

        logger.info(`User ${user.username} submitted prediction for Game ${game.name} with Form ID ${formId}`);
        res.status(201).json({
            message: 'پیش‌بینی با موفقیت ثبت شد.',
            prediction: {
                _id: prediction._id,
                formId,
                user: prediction.user,
                totoGame: prediction.totoGame,
                predictions: prediction.predictions,
                formAmount: prediction.formAmount,
                isScored: prediction.isScored,
                score: prediction.score,
                isRefunded: prediction.isRefunded,
                createdAt: prediction.createdAt
            }
        });
    } catch (error) {
        logger.error(`Error submitting prediction for user ${req.user.username}: ${error.message}`);
        next(error);
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



// @desc    دانلود فایل اکسل پیش‌بینی‌های یک بازی خاص برای کاربر
// @route   GET /api/users/games/:gameId/download
// @access  Private
exports.downloadGameExcel = asyncHandler(async (req, res) => {
    const { gameId } = req.params;
    const userId = req.user._id; // شناسه کاربری که درخواست دانلود داده است.

    if (!gameId.match(/^[0-9a-fA-F]{24}$/)) {
        res.status(400);
        throw new Error('شناسه بازی نامعتبر است.');
    }

    const game = await TotoGame.findById(gameId);
    if (!game) {
        res.status(404);
        throw new Error('بازی یافت نشد.');
    }

    // واکشی تمام پیش‌بینی‌ها برای این بازی و populate کردن کاربر و اطلاعات کامل بازی Toto
    const predictions = await Prediction.find({ totoGame: gameId })
        .populate('user', 'username email') // اطلاعات کاربر را populate می‌کنیم
        .populate('totoGame'); // اطلاعات کامل TotoGame را populate می‌کنیم تا به matches دسترسی داشته باشیم

    if (!predictions || predictions.length === 0) {
        res.status(404);
        throw new Error('هیچ پیش‌بینی‌ای برای این بازی یافت نشد.');
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Predictions for ${game.name}`);

    // --- تعریف ستون‌ها ---
    // ستون‌های اصلی
    let columns = [
        { header: 'نام کاربری', key: 'username', width: 20 },
        { header: 'ایدی فرم', key: 'formId', width: 25 },
        { header: 'تاریخ ثبت فرم', key: 'submissionDate', width: 25 },
        { header: 'هزینه فرم (USDT)', key: 'price', width: 20 },
        { header: 'امتیاز', key: 'score', width: 10 },
        { header: 'تایید امتیاز', key: 'isScored', width: 15 },
    ];

    // افزودن ستون‌ها برای هر 15 بازی
    // فرض می‌کنیم game.matches دارای 15 آیتم معتبر است
    if (game.matches && game.matches.length === 15) {
        game.matches.forEach((match, index) => {
            columns.push({ header: `پیش‌بینی بازی ${index + 1}: ${match.homeTeam} vs ${match.awayTeam}`, key: `prediction_match_${index}`, width: 40 });
            columns.push({ header: `نتیجه واقعی بازی ${index + 1}`, key: `result_match_${index}`, width: 25 });
        });
    } else {
        // در صورتی که تعداد مسابقات 15 تا نباشد، یک ستون کلی اضافه می‌کنیم
        columns.push({ header: 'جزئیات پیش‌بینی‌ها', key: 'all_predictions_detail', width: 100 });
    }

    worksheet.columns = columns;
    // --- پایان تعریف ستون‌ها ---

    // --- افزودن ردیف‌ها ---
    predictions.forEach(p => {
        let rowData = {
            username: p.user ? p.user.username : 'ناشناس',
            formId: p.formId,
            submissionDate: new Date(p.createdAt).toLocaleString('fa-IR'), // تاریخ شمسی
            price: p.price,
            isScored: p.isScored ? 'بله' : 'خیر',
            score: p.score
        };

        if (game.matches && game.matches.length === 15) {
            game.matches.forEach((gameMatch, index) => {
                // پیدا کردن پیش‌بینی کاربر برای این مسابقه خاص
                const userPredictionForMatch = p.predictions.find(up => up.matchId.toString() === gameMatch._id.toString());
                
                let predictionText = '';
                if (userPredictionForMatch && userPredictionForMatch.chosenOutcome) {
                    predictionText = userPredictionForMatch.chosenOutcome.join('/');
                } else {
                    predictionText = 'N/A';
                }
                
                let actualResultText = gameMatch.result || 'هنوز مشخص نشده';
                
                rowData[`prediction_match_${index}`] = predictionText;
                rowData[`result_match_${index}`] = actualResultText;
            });
        } else {
            // برای حالتی که تعداد مسابقات 15 تا نیست یا مشکل دارد
            rowData['all_predictions_detail'] = p.predictions.map(up => {
                const gameMatch = game.matches.find(gm => gm._id.toString() === up.matchId.toString());
                const matchName = gameMatch ? `${gameMatch.homeTeam} vs ${gameMatch.awayTeam}` : 'بازی نامشخص';
                const chosen = up.chosenOutcome ? up.chosenOutcome.join('/') : 'N/A';
                const result = gameMatch ? (gameMatch.result || 'N/A') : 'N/A';
                return `[${matchName}] پیش‌بینی: ${chosen}, نتیجه: ${result}`;
            }).join('; ');
        }

        worksheet.addRow(rowData);
    });
    // --- پایان افزودن ردیف‌ها ---

    // تنظیم هدرهای پاسخ برای دانلود فایل
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=predictions_${game.name.replace(/\s/g, '_')}_${gameId}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();

    logger.info(`User ${req.user.username} (ID: ${userId}) downloaded predictions for game ${game.name} (ID: ${gameId}).`);
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