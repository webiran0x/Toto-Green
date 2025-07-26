// services/totoRewardService.js

const Prediction = require('../models/Prediction');
const User = require('../models/User');
// نیازی به calculateScore نیست اگر منطق آن را اینجا تکرار می‌کنید، اما اگر می‌خواهید از آن استفاده کنید، باید ایمپورت شود.
// const calculateScore = require('../utils/calculateScore'); // اگر می‌خواهید از تابع calculateScore استفاده کنید، این را فعال کنید

async function rewardWinners(totoGame) {
  // این تابع احتمالاً تکراری است و نباید استفاده شود اگر processTotoGameResults در totoService.js مسئول امتیازدهی است.
  // اما اگر به هر دلیلی استفاده می‌شود، اصلاحات زیر اعمال می‌شود.

  const predictions = await Prediction.find({ totoGame: totoGame._id, isScored: false });
  let totalPot = 0;
  const correctCountArray = []; // این آرایه برای یافتن بالاترین امتیازات استفاده می‌شود

  for (const prediction of predictions) {
    let correct = 0;
    totalPot += prediction.price;

    for (const predMatch of prediction.predictions) {
      const actualMatch = totoGame.matches.find(
        (m) => m._id.toString() === predMatch.matchId.toString()
      );
      if (
        actualMatch &&
        actualMatch.result &&
        // اطمینان از اینکه chosenOutcome یک آرایه است
        Array.isArray(predMatch.chosenOutcome) &&
        predMatch.chosenOutcome.includes(actualMatch.result)
      ) {
        correct++;
      }
    }

    prediction.score = correct;
    prediction.isScored = true;
    await prediction.save();
    correctCountArray.push(correct);
  }

  // حذف امتیازات تکراری و مرتب‌سازی نزولی
  const sortedCorrects = [...new Set(correctCountArray)].sort((a, b) => b - a);
  const firstScore = sortedCorrects[0] || 0;
  const secondScore = sortedCorrects[1] || 0;
  const thirdScore = sortedCorrects[2] || 0;

  const scoredPredictions = await Prediction.find({ totoGame: totoGame._id, isScored: true });

  // گروه‌بندی کاربران بر اساس امتیازات کسب شده
  const firstGroup = [];
  const secondGroup = [];
  const thirdGroup = [];

  for (const prediction of scoredPredictions) {
    // اطمینان از مقایسه درست امتیازات و جلوگیری از تکرار در گروه‌ها
    if (prediction.score === firstScore && firstScore > 0) { // فقط امتیازات مثبت
        if (!firstGroup.includes(prediction.user)) { // جلوگیری از افزودن تکراری
            firstGroup.push(prediction.user);
        }
    } else if (prediction.score === secondScore && secondScore > 0) {
        if (!secondGroup.includes(prediction.user)) {
            secondGroup.push(prediction.user);
        }
    } else if (prediction.score === thirdScore && thirdScore > 0) {
        if (!thirdGroup.includes(prediction.user)) {
            thirdGroup.push(prediction.user);
        }
    }
  }

  const commission = 0.15;
  const finalPrizePool = totalPot * (1 - commission);

  const firstPrize = firstGroup.length > 0 ? (finalPrizePool * 0.7) / firstGroup.length : 0;
  const secondPrize = secondGroup.length > 0 ? (finalPrizePool * 0.2) / secondGroup.length : 0;
  const thirdPrize = thirdGroup.length > 0 ? (finalPrizePool * 0.1) / thirdGroup.length : 0;

  // Update user balances (اصلاح شد: wallet به balance تغییر یافت)
  const updateUserBalances = async (users, prizeAmount) => {
    for (const userId of users) {
      const user = await User.findById(userId);
      if (user) {
        user.balance += prizeAmount; // استفاده از balance
        await user.save();
        // ثبت تراکنش جایزه
        // این تراکنش‌ها باید در processTotoGameResults در totoService.js ثبت شوند تا تکراری نشوند
        // اگر این تابع استفاده می‌شود، باید لاگ و تراکنش مناسب اینجا اضافه شود
      }
    }
  };

  await updateUserBalances(firstGroup, firstPrize);
  await updateUserBalances(secondGroup, secondPrize);
  await updateUserBalances(thirdGroup, thirdPrize);

  // Update game with prize and winner info
  totoGame.totalPot = totalPot;
  totoGame.commissionAmount = totalPot * commission; // نام فیلد را به commissionAmount تغییر دهید اگر در مدل اینگونه است
  totoGame.prizePool = finalPrizePool;
  totoGame.prizes = {
    firstPlace: firstPrize,
    secondPlace: secondPrize,
    thirdPlace: thirdPrize,
  };
  totoGame.winners = {
    first: firstGroup,
    second: secondGroup,
    third: thirdGroup,
  };

  await totoGame.save();

  return {
    status: 'complete',
    message: 'امتیازدهی و توزیع جوایز انجام شد.',
    totoGame,
  };
}

module.exports = {
  rewardWinners,
};
