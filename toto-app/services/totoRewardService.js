// services/totoRewardService.js

const Prediction = require('../models/Prediction');
const User = require('../models/User');

async function rewardWinners(totoGame) {
  const predictions = await Prediction.find({ totoGame: totoGame._id, isScored: false });
  let totalPot = 0;
  const correctCountArray = [];

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

  const sortedCorrects = [...new Set(correctCountArray)].sort((a, b) => b - a);
  const firstScore = sortedCorrects[0] || 0;
  const secondScore = sortedCorrects[1] || 0;
  const thirdScore = sortedCorrects[2] || 0;

  const scoredPredictions = await Prediction.find({ totoGame: totoGame._id, isScored: true });

  const firstGroup = [];
  const secondGroup = [];
  const thirdGroup = [];

  for (const prediction of scoredPredictions) {
    if (prediction.score === firstScore) firstGroup.push(prediction.user);
    else if (prediction.score === secondScore) secondGroup.push(prediction.user);
    else if (prediction.score === thirdScore) thirdGroup.push(prediction.user);
  }

  const commission = 0.15;
  const finalPrizePool = totalPot * (1 - commission);

  const firstPrize = firstGroup.length > 0 ? (finalPrizePool * 0.7) / firstGroup.length : 0;
  const secondPrize = secondGroup.length > 0 ? (finalPrizePool * 0.2) / secondGroup.length : 0;
  const thirdPrize = thirdGroup.length > 0 ? (finalPrizePool * 0.1) / thirdGroup.length : 0;

  // Update wallets
  const updateUserWallets = async (users, prizeAmount) => {
    for (const userId of users) {
      await User.findByIdAndUpdate(userId, { $inc: { wallet: prizeAmount } });
    }
  };

  await updateUserWallets(firstGroup, firstPrize);
  await updateUserWallets(secondGroup, secondPrize);
  await updateUserWallets(thirdGroup, thirdPrize);

  // Update game with prize and winner info
  totoGame.totalPot = totalPot;
  totoGame.commissionAmount = totalPot * commission;
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
