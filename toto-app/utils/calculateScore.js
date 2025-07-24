const calculateScore = (prediction, totoGame) => {
    let score = 0;
    const correctScorePerMatch = 10; // امتیاز برای هر پیش‌بینی صحیح

    if (!totoGame || totoGame.status !== 'completed') {
        // بازی هنوز کامل نشده یا نتایج ثبت نشده‌اند
        return 0;
    }

    // اطمینان از اینکه هر دو آرایه predictions و matches وجود دارند و طول یکسانی دارند
    if (prediction.predictions.length !== totoGame.matches.length) {
        console.warn(`Mismatch in prediction and game matches length for Prediction ID: ${prediction._id}`);
        return 0;
    }

    for (const userPrediction of prediction.predictions) {
        const gameMatch = totoGame.matches.find(
            (match) => match._id.toString() === userPrediction.matchId.toString()
        );

        if (gameMatch && gameMatch.result) {
            // اگر نتیجه بازی ثبت شده باشد
            if (userPrediction.chosenOutcome.includes(gameMatch.result)) {
                score += correctScorePerMatch;
            }
        }
    }
    return score;
};

module.exports = calculateScore;