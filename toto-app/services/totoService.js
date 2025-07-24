// toto-app/services/totoService.js
// سرویس‌های منطقی اصلی بازی Toto

const TotoGame = require('../models/TotoGame');
const Prediction = require('../models/Prediction');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const calculateScore = require('../utils/calculateScore');
const logger = require('../utils/logger');

const REFERRAL_COMMISSION_PERCENTAGE = 0.05; // 5% از اولین مبلغ فرم کاربر دعوت شده

/**
 * بستن بازی‌های Toto که مهلت آن‌ها گذشته است.
 * این تابع باید توسط یک زمان‌بند (cron job) فراخوانی شود.
 */
const closeExpiredTotoGames = async () => {
    try {
        const now = new Date();
        // یافتن بازی‌هایی که status آنها 'open' است و deadline آنها گذشته است
        const expiredGames = await TotoGame.find({
            status: 'open',
            deadline: { $lte: now }
        });

        if (expiredGames.length === 0) {
            logger.info('No expired Toto games to close.');
            return;
        }

        for (const game of expiredGames) {
            game.status = 'closed';
            // همچنین، isClosed را برای تمام بازی‌های زیر-سند (matches) تنظیم کنید
            game.matches.forEach(match => {
                match.isClosed = true;
            });

            // محاسبه مجموع pot از تمام پیش‌بینی‌های ثبت شده
            const predictionsInGame = await Prediction.find({ totoGame: game._id });
            const totalPotForGame = predictionsInGame.reduce((sum, prediction) => sum + prediction.price, 0);

            const COMMISSION_PERCENTAGE = game.commissionPercentage;
            const FIRST_PLACE_PERCENTAGE = 0.70;
            const SECOND_PLACE_PERCENTAGE = 0.20;
            const THIRD_PLACE_PERCENTAGE = 0.10;

            game.totalPot = totalPotForGame;
            game.commissionAmount = totalPotForGame * COMMISSION_PERCENTAGE;
            game.prizePool = totalPotForGame - game.commissionAmount;

            game.prizes.firstPlace = game.prizePool * FIRST_PLACE_PERCENTAGE;
            game.prizes.secondPlace = game.prizePool * SECOND_PLACE_PERCENTAGE;
            game.prizes.thirdPlace = game.prizePool * THIRD_PLACE_PERCENTAGE;

            await game.save();
            logger.info(`Toto Game "${game.name}" (ID: ${game._id}) has been closed. Total Pot: ${game.totalPot} USDT`); // به USDT تغییر یافت
        }
    } catch (error) {
        logger.error('Error closing expired Toto games:', error);
    }
};

/**
 * پردازش نتایج یک بازی Toto و امتیازدهی به پیش‌بینی‌های کاربران و توزیع جوایز.
 * این تابع باید پس از ثبت نتایج نهایی یک بازی توسط ادمین فراخوانی شود.
 * @param {string} totoGameId - ID بازی Toto که نتایج آن ثبت شده است.
 */
const processTotoGameResults = async (totoGameId) => {
    try {
        const totoGame = await TotoGame.findById(totoGameId);

        if (!totoGame) {
            logger.error(`Toto Game with ID ${totoGameId} not found for scoring.`);
            return { success: false, message: 'بازی Toto یافت نشد.' };
        }

        // بررسی کنید که همه بازی‌های زیر-سند دارای نتیجه هستند
        const allMatchesHaveResults = totoGame.matches.every(match => match.result !== null || match.isCancelled);

        if (!allMatchesHaveResults) {
            logger.warn(`Not all matches in Toto Game "${totoGame.name}" have results yet. Skipping scoring.`);
            return { success: false, message: 'هنوز نتایج همه بازی‌ها ثبت نشده است.' };
        }

        if (totoGame.status === 'completed') {
            logger.info(`Toto Game "${totoGame.name}" (ID: ${totoGame._id}) already completed and scored.`);
            return { success: true, message: 'این بازی قبلاً امتیازدهی شده است.' };
        }
        if (totoGame.status === 'cancelled') {
            logger.warn(`Toto Game "${totoGame.name}" (ID: ${totoGame._id}) is cancelled. Skipping scoring.`);
            return { success: false, message: 'این بازی لغو شده است، امتیازدهی انجام نمی‌شود.' };
        }

        // یافتن تمام پیش‌بینی‌های مرتبط با این بازی Toto که هنوز امتیازدهی نشده‌اند
        const predictionsToScore = await Prediction.find({
            totoGame: totoGameId,
            isScored: false,
            isRefunded: false
        }).populate('user');

        if (predictionsToScore.length === 0) {
            logger.info(`No unscored predictions found for Toto Game "${totoGame.name}".`);
            totoGame.status = 'completed';
            await totoGame.save();
            return { success: true, message: 'هیچ پیش‌بینی‌ای برای امتیازدهی یافت نشد.' };
        }

        let scoredPredictions = [];
        for (const prediction of predictionsToScore) {
            const userScore = calculateScore(prediction, totoGame);

            // به‌روزرسانی امتیاز در مدل Prediction
            prediction.score = userScore;
            prediction.isScored = true;
            await prediction.save();
            scoredPredictions.push(prediction);

            // به‌روزرسانی امتیاز کلی کاربر
            if (prediction.user) {
                prediction.user.score += userScore;
                await prediction.user.save();
                logger.info(`User ${prediction.user.username} scored ${userScore} for Prediction ID: ${prediction._id}`);
            }
        }

        // تعیین برندگان و توزیع جوایز
        const sortedUsersByScore = scoredPredictions
            .filter(p => p.user)
            .sort((a, b) => b.score - a.score)
            .map(p => ({ user: p.user, score: p.score }));

        // یافتن برندگان نفر اول
        const firstPlaceScore = sortedUsersByScore.length > 0 ? sortedUsersByScore[0].score : 0;
        const firstPlaceWinners = sortedUsersByScore.filter(u => u.score === firstPlaceScore && firstPlaceScore > 0).map(u => u.user._id);

        // یافتن برندگان نفر دوم
        const remainingForSecond = sortedUsersByScore.filter(u => u.score < firstPlaceScore);
        const secondPlaceScore = remainingForSecond.length > 0 ? remainingForSecond[0].score : 0;
        const secondPlaceWinners = remainingForSecond.filter(u => u.score === secondPlaceScore && secondPlaceScore > 0).map(u => u.user._id);

        // یافتن برندگان نفر سوم
        const remainingForThird = remainingForSecond.filter(u => u.score < secondPlaceScore);
        const thirdPlaceScore = remainingForThird.length > 0 ? remainingForThird[0].score : 0;
        const thirdPlaceWinners = remainingForThird.filter(u => u.score === thirdPlaceScore && thirdPlaceScore > 0).map(u => u.user._id);

        // ذخیره برندگان در مدل TotoGame
        totoGame.winners.first = firstPlaceWinners;
        totoGame.winners.second = secondPlaceWinners;
        totoGame.winners.third = thirdPlaceWinners;

        // پس از امتیازدهی همه پیش‌بینی‌ها، وضعیت بازی را به 'completed' تغییر دهید
        totoGame.status = 'completed';
        await totoGame.save();

        logger.info(`Scoring and winner determination completed for Toto Game "${totoGame.name}" (ID: ${totoGame._id}).`);
        return { success: true, message: 'امتیازدهی و تعیین برندگان با موفقیت انجام شد.' };
    } catch (error) {
        logger.error(`Error processing Toto Game results for ID ${totoGameId}:`, error);
        return { success: false, message: 'خطا در پردازش نتایج بازی.' };
    }
};

/**
 * مدیریت لغو بازی و بازپرداخت مبالغ فرم‌ها به کاربران.
 * @param {string} totoGameId - ID بازی Toto که لغو شده است.
 */
const handleGameCancellationAndRefunds = async (totoGameId) => {
    try {
        const totoGame = await TotoGame.findById(totoGameId);
        if (!totoGame) {
            logger.error(`Toto Game with ID ${totoGameId} not found for cancellation/refund.`);
            return { success: false, message: 'بازی Toto یافت نشد.' };
        }

        if (totoGame.isRefunded) {
            logger.warn(`Refunds for Toto Game "${totoGame.name}" (ID: ${totoGame._id}) already processed.`);
            return { success: false, message: 'بازپرداخت این بازی قبلاً انجام شده است.' };
        }

        // یافتن تمام پیش‌بینی‌های ثبت شده برای این بازی
        const predictionsToRefund = await Prediction.find({ totoGame: totoGameId, isRefunded: false }).populate('user');

        if (predictionsToRefund.length === 0) {
            logger.info(`No predictions to refund for Toto Game "${totoGame.name}".`);
            totoGame.isRefunded = true;
            await totoGame.save();
            return { success: true, message: 'هیچ پیش‌بینی‌ای برای بازپرداخت یافت نشد.' };
        }

        for (const prediction of predictionsToRefund) {
            if (prediction.user) {
                prediction.user.balance += prediction.price;
                await prediction.user.save();

                prediction.isRefunded = true;
                await prediction.save();

                // ثبت تراکنش بازپرداخت
                await Transaction.create({
                    user: prediction.user._id,
                    amount: prediction.price,
                    type: 'refund',
                    description: `بازپرداخت مبلغ فرم برای بازی لغو شده: ${totoGame.name} (USDT)`, // به USDT تغییر یافت
                    relatedEntity: totoGame._id
                });
                logger.info(`Refunded ${prediction.price} USDT to user ${prediction.user.username} for prediction ID: ${prediction._id}.`); // به USDT تغییر یافت
            } else {
                logger.warn(`Prediction ID ${prediction._id} has no associated user for refund.`);
            }
        }

        totoGame.isRefunded = true;
        await totoGame.save();
        logger.info(`Refunds completed for Toto Game "${totoGame.name}" (ID: ${totoGame._id}).`);
        return { success: true, message: 'بازپرداخت مبالغ با موفقیت انجام شد.' };
    } catch (error) {
        logger.error(`Error handling game cancellation and refunds for ID ${totoGameId}: ${error.message}`);
        return { success: false, message: 'خطا در بازپرداخت مبالغ فرم.' };
    }
};

/**
 * اعطای کمیسیون ارجاع به معرف.
 * این تابع باید پس از اولین ثبت فرم توسط کاربر دعوت شده فراخوانی شود.
 * @param {string} referredUserId - ID کاربر دعوت شده.
 * @param {number} firstFormPrice - قیمت اولین فرمی که کاربر دعوت شده ثبت کرده است.
 */
const awardReferralCommission = async (referredUserId, firstFormPrice) => {
    try {
        const referredUser = await User.findById(referredUserId).populate('referrer');

        if (!referredUser || !referredUser.referrer) {
            logger.info(`User ${referredUserId} has no referrer, skipping referral commission.`);
            return { success: false, message: 'کاربر معرف ندارد.' };
        }

        // بررسی کنید که این اولین فرم کاربر است
        const userPredictionsCount = await Prediction.countDocuments({ user: referredUserId });
        if (userPredictionsCount > 1) {
            logger.info(`User ${referredUser.username} (ID: ${referredUserId}) has already submitted forms. Skipping referral commission.`);
            return { success: false, message: 'این اولین فرم کاربر دعوت شده نیست.' };
        }

        const referrerUser = await User.findById(referredUser.referrer._id);
        if (!referrerUser) {
            logger.error(`Referrer user with ID ${referredUser.referrer._id} not found for awarding commission.`);
            return { success: false, message: 'کاربر معرف یافت نشد.' };
        }

        const commissionAmount = firstFormPrice * REFERRAL_COMMISSION_PERCENTAGE;

        // واریز کمیسیون به حساب معرف
        referrerUser.balance += commissionAmount;
        await referrerUser.save();

        // ثبت تراکنش کمیسیون ارجاع
        await Transaction.create({
            user: referrerUser._id,
            amount: commissionAmount,
            type: 'referral_commission',
            description: `دریافت کمیسیون ارجاع از اولین فرم ${referredUser.username} (USDT)`, // به USDT تغییر یافت
            relatedEntity: referredUser._id
        });
        logger.info(`Awarded ${commissionAmount} USDT referral commission to ${referrerUser.username} (ID: ${referrerUser._id}) from ${referredUser.username}'s first form.`); // به USDT تغییر یافت
        return { success: true, message: 'کمیسیون ارجاع با موفقیت پرداخت شد.' };

    } catch (error) {
        logger.error(`Error awarding referral commission for user ${referredUserId}: ${error.message}`);
        return { success: false, message: 'خطا در پرداخت کمیسیون ارجاع.' };
    }
};


module.exports = {
    closeExpiredTotoGames,
    processTotoGameResults,
    handleGameCancellationAndRefunds,
    awardReferralCommission
};
