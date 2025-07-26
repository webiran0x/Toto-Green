// toto-app/utils/calculateScore.js

const logger = require('./logger'); // <-- این خط را اضافه کنید تا logger در دسترس باشد

const calculateScore = (prediction, totoGame) => {
    let score = 0;
    const correctScorePerMatch = 10; // امتیاز برای هر پیش‌بینی صحیح

    if (!totoGame || !totoGame.matches || totoGame.matches.length === 0) {
        logger.warn(`calculateScore: TotoGame or its matches are missing for Prediction ID: ${prediction._id}. Returning 0.`);
        return 0;
    }

    if (prediction.predictions.length !== totoGame.matches.length) {
        logger.info(`calculateScore: Mismatch in prediction and game matches length for Prediction ID: ${prediction._id}. Returning 0.`);
        return 0;
    }

    for (const userPrediction of prediction.predictions) {
        const gameMatch = totoGame.matches.find(
            (match) => match?._id?.toString?.() === userPrediction?.matchId?.toString?.()
        );

        logger.debug(`--- Debugging calculateScore for Prediction ID: ${prediction._id}, Match ID: ${userPrediction.matchId} ---`);
        logger.debug(`User's Prediction for this match:`, userPrediction);
        logger.debug(`Actual Game Match from TotoGame:`, gameMatch);
        logger.debug(`Actual Result (gameMatch.result):`, gameMatch ? gameMatch.result : 'N/A');
        logger.debug(`Chosen Outcome (userPrediction.chosenOutcome):`, userPrediction.chosenOutcome);
        logger.debug(`Type of Chosen Outcome:`, typeof userPrediction.chosenOutcome);
        logger.debug(`Is Chosen Outcome an Array?`, Array.isArray(userPrediction.chosenOutcome));

       let parsedChosenOutcome = [];

if (typeof userPrediction.chosenOutcome === 'string') {
    try {
        const temp = JSON.parse(userPrediction.chosenOutcome);
        if (Array.isArray(temp)) {
            parsedChosenOutcome = temp;
        } else {
            logger.warn(`chosenOutcome parsed but is not an array:`, temp);
        }
    } catch (e) {
        logger.error(`Failed to parse chosenOutcome: ${e.message}`);
    }
} else if (Array.isArray(userPrediction.chosenOutcome)) {
    parsedChosenOutcome = userPrediction.chosenOutcome;
} else {
    logger.warn(`Invalid chosenOutcome format. Expected string or array. Got:`, typeof userPrediction.chosenOutcome);
}


        if (gameMatch && gameMatch.result) {
            if (Array.isArray(parsedChosenOutcome) && parsedChosenOutcome.includes(gameMatch.result)) {
                score += correctScorePerMatch;
                logger.debug(`Score added! Current score for Prediction ID ${prediction._id}: ${score}`);
            } else if (!Array.isArray(parsedChosenOutcome)) {
                logger.warn(`calculateScore: ChosenOutcome (or parsed) is NOT an array for Prediction ID: ${prediction._id}, Match ID: ${userPrediction.matchId}. Cannot use .includes().`);
            } else {
                logger.debug(`calculateScore: Chosen Outcome (${parsedChosenOutcome}) does NOT include Actual Result (${gameMatch.result}) for Prediction ID: ${prediction._id}, Match ID: ${userPrediction.matchId}.`);
            }
        } else {
            logger.warn(`calculateScore: Game match or its result is missing for Prediction ID: ${prediction._id}, Match ID: ${userPrediction.matchId}. Skipping score calculation for this match.`);
        }
        logger.debug(`-----------------------------------------------`);
    }
    logger.info(`calculateScore: Final score for Prediction ID: ${prediction._id} is ${score}.`);
    return score;
};

module.exports = calculateScore;
