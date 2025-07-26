// toto-app/services/totoService.js
// سرویس‌های منطقی اصلی بازی Toto

const TotoGame = require('../models/TotoGame');
const Prediction = require('../models/Prediction');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const calculateScore = require('../utils/calculateScore');
const logger = require('../utils/logger'); // سیستم لاگ‌گیری

const REFERRAL_COMMISSION_PERCENTAGE = 0.05; // 5% از اولین مبلغ فرم کاربر دعوت شده
const DEFAULT_COMMISSION_PERCENTAGE = 0.15; // درصد پیش‌فرض کمیسیون (15%)


/**
 * بستن بازی‌های Toto که مهلت آن‌ها گذشته است.
 * این تابع باید توسط یک زمان‌سنج (cron job) فراخوانی شود.
 */
const closeExpiredTotoGames = async () => {
    try {
        const now = new Date();
        logger.info(`Cron Job: closeExpiredTotoGames started at ${now.toISOString()}`);

        // --- لاگ‌های اشکال‌زدایی بیشتر برای زمان و بازی‌های باز ---
        logger.info(`Cron Job Debug: Current server UTC time: ${now.toISOString()}`);
        logger.info(`Cron Job Debug: Current server Local time: ${now.toLocaleString()}`);

        const allOpenGames = await TotoGame.find({ status: 'open' });
        if (allOpenGames.length > 0) {
            logger.info(`Cron Job Debug: Found ${allOpenGames.length} games with status 'open'. Details:`);
            allOpenGames.forEach(game => {
                logger.info(`  - Game ID: ${game._id}, Name: "${game.name}", Deadline: ${game.deadline.toISOString()}`);
            });
        } else {
            logger.info('Cron Job Debug: No games found with status "open".');
        }
        // --- پایان لاگ‌های اشکال‌زدایی ---

        // یافتن بازی‌هایی که status آنها 'open' است و deadline آنها گذشته است
        const expiredGames = await TotoGame.find({
            status: 'open',
            deadline: { $lte: now }
        });

        if (expiredGames.length === 0) {
            logger.info('Cron Job: No expired Toto games to close found.');
            return;
        }

        logger.info(`Cron Job: Found ${expiredGames.length} expired Toto games to close.`);

        for (const game of expiredGames) {
            logger.info(`Cron Job: Processing game "${game.name}" (ID: ${game._id}). Current status: ${game.status}, Deadline: ${game.deadline.toISOString()}`);

            game.status = 'closed';
            // همچنین، isClosed را برای تمام بازی‌های زیر-سند (matches) تنظیم کنید
            game.matches.forEach(match => {
                match.isClosed = true;
            });

            // محاسبه مجموع pot از تمام پیش‌بینی‌های ثبت شده
            const predictionsInGame = await Prediction.find({ totoGame: game._id });
            const totalPotForGame = predictionsInGame.reduce((sum, prediction) => sum + prediction.price, 0);

            const COMMISSION_PERCENTAGE = DEFAULT_COMMISSION_PERCENTAGE; 
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
            logger.info(`Cron Job: Toto Game "${game.name}" (ID: ${game._id}) successfully closed. New status: ${game.status}. Total Pot: ${game.totalPot} USDT`);
        }
        logger.info('Cron Job: closeExpiredTotoGames finished successfully.');
    } catch (error) {
        logger.error('Cron Job: Error closing expired Toto games:', error);
    }
};

/**
 * پردازش نتایج یک بازی Toto و امتیازدهی به پیش‌بینی‌های کاربران و توزیع جوایز.
 * این تابع باید پس از ثبت نتایج نهایی یک بازی توسط ادمین فراخوانی شود.
 * @param {object} totoGame - آبجکت کامل بازی Toto.
 * @returns {object} - آبجکتی شامل success, message و آبجکت totoGame به‌روز شده.
 */
const processTotoGameResults = async (totoGame) => { // پارامتر به آبجکت کامل totoGame تغییر یافت
    try {
        // اگر تابع از adminController فراخوانی می‌شود، totoGame قبلاً از دیتابیس لود شده است.
        // نیازی به findById مجدد نیست.
        if (!totoGame || !totoGame._id) {
            logger.error(`processTotoGameResults: Toto Game object is invalid or not provided for scoring.`);
            return { success: false, message: 'بازی Toto نامعتبر است.' };
        }

        const allMatchesHaveResults = totoGame.matches.every(match => match.result !== null || match.isCancelled);

        if (!allMatchesHaveResults) {
            logger.warn(`processTotoGameResults: Not all matches in Toto Game "${totoGame.name}" have results yet. Skipping scoring.`);
            return { success: false, message: 'هنوز نتایج همه بازی‌ها ثبت نشده است.' };
        }

        if (totoGame.status === 'completed') {
            logger.info(`processTotoGameResults: Toto Game "${totoGame.name}" (ID: ${totoGame._id}) already completed and scored.`);
            return { success: true, message: 'این بازی قبلاً امتیازدهی شده است.', totoGame }; // totoGame را برگردان
        }
        if (totoGame.status === 'cancelled') {
            logger.warn(`processTotoGameResults: Toto Game "${totoGame.name}" (ID: ${totoGame._id}) is cancelled. Skipping scoring.`);
            return { success: false, message: 'این بازی لغو شده است، امتیازدهی انجام نمی‌شود.' };
        }

        const predictionsToScore = await Prediction.find({
            totoGame: totoGame._id, // استفاده از ID بازی
            isScored: false,
            isRefunded: false
        }).populate('user');

        if (predictionsToScore.length === 0) {
            logger.info(`processTotoGameResults: No unscored predictions found for Toto Game "${totoGame.name}".`);
            totoGame.status = 'completed';
            await totoGame.save();
            return { success: true, message: 'هیچ پیش‌بینی‌ای برای امتیازدهی یافت نشد.', totoGame }; // totoGame را برگردان
        }

        let scoredPredictions = [];
        for (const prediction of predictionsToScore) {
            const userScore = calculateScore(prediction, totoGame);

            prediction.score = userScore;
            prediction.isScored = true;
            await prediction.save();
            scoredPredictions.push(prediction);

            if (prediction.user) {
                prediction.user.score += userScore;
                await prediction.user.save();
                logger.info(`processTotoGameResults: User ${prediction.user.username} scored ${userScore} for Prediction ID: ${prediction._id}`);
            }
        }

        const sortedUsersByScore = scoredPredictions
            .filter(p => p.user)
            .sort((a, b) => b.score - a.score)
            .map(p => ({ user: p.user, score: p.score }));

        const firstPlaceScore = sortedUsersByScore.length > 0 ? sortedUsersByScore[0].score : 0;
        const firstPlaceWinners = sortedUsersByScore.filter(u => u.score === firstPlaceScore && firstPlaceScore > 0).map(u => u.user._id);

        const remainingForSecond = sortedUsersByScore.filter(u => u.score < firstPlaceScore);
        const secondPlaceScore = remainingForSecond.length > 0 ? remainingForSecond[0].score : 0;
        const secondPlaceWinners = remainingForSecond.length > 0 ? remainingForSecond.filter(u => u.score === secondPlaceScore && secondPlaceScore > 0).map(u => u.user._id) : [];

        const remainingForThird = remainingForSecond.filter(u => u.score < secondPlaceScore);
        const thirdPlaceScore = remainingForThird.length > 0 ? remainingForThird[0].score : 0;
        const thirdPlaceWinners = remainingForThird.length > 0 ? remainingForThird.filter(u => u.score === thirdPlaceScore && thirdPlaceScore > 0).map(u => u.user._id) : [];

        totoGame.winners.first = firstPlaceWinners;
        totoGame.winners.second = secondPlaceWinners;
        totoGame.winners.third = thirdPlaceWinners;

        const prizePool = totoGame.prizePool;
        const firstPlacePrize = totoGame.prizes.firstPlace;
        const secondPlacePrize = totoGame.prizes.secondPlace;
        const thirdPlacePrize = totoGame.prizes.thirdPlace;

       await Promise.all(firstPlaceWinners.map(async (winnerId) => {
            const prizePerWinner = firstPlacePrize / firstPlaceWinners.length;
            for (const winnerId of firstPlaceWinners) {
                const winner = await User.findById(winnerId);
                if (winner) {
                    winner.balance += prizePerWinner;
                    await winner.save();
                    await Transaction.create({
                        user: winner._id,
                        amount: prizePerWinner,
                        type: 'prize_payout',
                        description: `جایزه نفر اول بازی: ${totoGame.name} (USDT)`,
                        relatedEntity: totoGame._id
                    });
                    logger.info(`processTotoGameResults: Awarded ${prizePerWinner} USDT to first place winner ${winner.username} (ID: ${winner._id}) for game ${totoGame.name}.`);
                }
            }
        }));

        if (secondPlaceWinners.length > 0 && secondPlacePrize > 0) {
            const prizePerWinner = secondPlacePrize / secondPlaceWinners.length;
            for (const winnerId of secondPlaceWinners) {
                const winner = await User.findById(winnerId);
                if (winner) {
                    winner.balance += prizePerWinner;
                    await winner.save();
                    await Transaction.create({
                        user: winner._id,
                        amount: prizePerWinner,
                        type: 'prize_payout',
                        description: `جایزه نفر دوم بازی: ${totoGame.name} (USDT)`,
                        relatedEntity: totoGame._id
                    });
                    logger.info(`processTotoGameResults: Awarded ${prizePerWinner} USDT to second place winner ${winner.username} (ID: ${winner._id}) for game ${totoGame.name}.`);
                }
            }
        }

        if (thirdPlaceWinners.length > 0 && thirdPlacePrize > 0) {
            const prizePerWinner = thirdPlacePrize / thirdPlaceWinners.length;
            for (const winnerId of thirdPlaceWinners) {
                const winner = await User.findById(winnerId);
                if (winner) {
                    winner.balance += prizePerWinner;
                    await winner.save();
                    await Transaction.create({
                        user: winner._id,
                        amount: prizePerWinner,
                        type: 'prize_payout',
                        description: `جایزه نفر سوم بازی: ${totoGame.name} (USDT)`,
                        relatedEntity: totoGame._id
                    });
                    logger.info(`processTotoGameResults: Awarded ${prizePerWinner} USDT to third place winner ${winner.username} (ID: ${winner._id}) for game ${totoGame.name}.`);
                }
            }
        }

        totoGame.status = 'completed';
        await totoGame.save();

        logger.info(`processTotoGameResults: Scoring and winner determination completed for Toto Game "${totoGame.name}" (ID: ${totoGame._id}). Game status: COMPLETED.`);
        return { success: true, message: 'امتیازدهی و تعیین برندگان با موفقیت انجام شد.', totoGame }; // totoGame به‌روز شده را برگردان
    } catch (error) {
        logger.error(`processTotoGameResults: Error processing Toto Game results for ID ${totoGame._id}:`, error);
        return { success: false, message: 'خطا در پردازش نتایج بازی.', error: error.message }; // پیام خطا را هم برگردان
    }
};

const handleGameCancellationAndRefunds = async (totoGameId) => {
    try {
        const totoGame = await TotoGame.findById(totoGameId);
        if (!totoGame) {
            logger.error(`handleGameCancellationAndRefunds: Toto Game with ID ${totoGameId} not found for cancellation/refund.`);
            return { success: false, message: 'بازی Toto یافت نشد.' };
        }

        if (totoGame.isRefunded) {
            logger.warn(`handleGameCancellationAndRefunds: Refunds for Toto Game "${totoGame.name}" (ID: ${totoGame._id}) already processed.`);
            return { success: false, message: 'بازپرداخت این بازی قبلاً انجام شده است.' };
        }

        const predictionsToRefund = await Prediction.find({ totoGame: totoGameId, isRefunded: false }).populate('user');

        if (predictionsToRefund.length === 0) {
            logger.info(`handleGameCancellationAndRefunds: No predictions to refund for Toto Game "${totoGame.name}".`);
            totoGame.isRefunded = true;
            totoGame.status = 'cancelled'; // اطمینان از تغییر وضعیت به cancelled
            await totoGame.save();
            return { success: true, message: 'هیچ پیش‌بینی‌ای برای بازپرداخت یافت نشد.' };
        }

        for (const prediction of predictionsToRefund) {
            if (prediction.user) {
                prediction.user.balance += prediction.price;
                await prediction.user.save();

                prediction.isRefunded = true;
                await prediction.save();

                await Transaction.create({
                    user: prediction.user._id,
                    amount: prediction.price,
                    type: 'refund',
                    description: `بازپرداخت مبلغ فرم برای بازی لغو شده: ${totoGame.name} (USDT)`,
                    relatedEntity: totoGame._id
                });
                logger.info(`handleGameCancellationAndRefunds: Refunded ${prediction.price} USDT to user ${prediction.user.username} for prediction ID: ${prediction._id}.`);
            } else {
                logger.warn(`handleGameCancellationAndRefunds: Prediction ID ${prediction._id} has no associated user for refund.`);
            }
        }

        totoGame.isRefunded = true;
        totoGame.status = 'cancelled'; // اطمینان از تغییر وضعیت به cancelled
        await totoGame.save();
        logger.info(`handleGameCancellationAndRefunds: Refunds and cancellation completed for Toto Game "${totoGame.name}" (ID: ${totoGame._id}).`);
        return { success: true, message: 'بازپرداخت مبالغ با موفقیت انجام شد.' };
    } catch (error) {
        logger.error(`handleGameCancellationAndRefunds: Error handling game cancellation and refunds for ID ${totoGameId}: ${error.message}`);
        return { success: false, message: 'خطا در بازپرداخت مبالغ فرم.' };
    }
};

const awardReferralCommission = async (referredUserId, firstFormPrice) => {
    try {
        const referredUser = await User.findById(referredUserId).populate('referrer');

        if (!referredUser || !referredUser.referrer) {
            logger.info(`awardReferralCommission: User ${referredUserId} has no referrer, skipping referral commission.`);
            return { success: false, message: 'کاربر معرف ندارد.' };
        }

        const userPredictionsCount = await Prediction.countDocuments({ user: referredUserId });
        if (userPredictionsCount > 1) {
            logger.info(`awardReferralCommission: User ${referredUser.username} (ID: ${referredUserId}) has already submitted forms. Skipping referral commission.`);
            return { success: false, message: 'این اولین فرم کاربر دعوت شده نیست.' };
        }

        const referrerUser = await User.findById(referredUser.referrer._id);
        if (!referrerUser) {
            logger.error(`awardReferralCommission: Referrer user with ID ${referredUser.referrer._id} not found for awarding commission.`);
            return { success: false, message: 'کاربر معرف یافت نشد.' };
        }

        const commissionAmount = firstFormPrice * REFERRAL_COMMISSION_PERCENTAGE;

        referrerUser.balance += commissionAmount;
        await referrerUser.save();

        await Transaction.create({
            user: referrerUser._id,
            amount: commissionAmount,
            type: 'referral_commission',
            description: `دریافت کمیسیون ارجاع از اولین فرم ${referredUser.username} (USDT)`,
            relatedEntity: referredUser._id
        });
        logger.info(`awardReferralCommission: Awarded ${commissionAmount} USDT referral commission to ${referrerUser.username} (ID: ${referrerUser._id}) from ${referredUser.username}'s first form.`);
        return { success: true, message: 'کمیسیون ارجاع با موفقیت پرداخت شد.' };

    } catch (error) {
        logger.error(`awardReferralCommission: Error awarding referral commission for user ${referredUserId}: ${error.message}`);
        return { success: false, message: 'خطا در پرداخت کمیسیون ارجاع.' };
    }
};


module.exports = {
    closeExpiredTotoGames,
    processTotoGameResults,
    handleGameCancellationAndRefunds,
    awardReferralCommission
};
