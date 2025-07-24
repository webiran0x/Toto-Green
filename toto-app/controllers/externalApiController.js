// toto-app/controllers/externalApiController.js
// کنترلر برای مدیریت همگام‌سازی با API خارجی

const { syncGamesWithExternalAPI, syncResultsWithExternalAPI } = require('../services/externalApiService');
const logger = require('../config/logger');

// @desc    شروع همگام‌سازی بازی‌ها با API خارجی
// @route   POST /api/external/sync-games
// @access  Private/Admin
const syncGames = async (req, res) => {
    try {
        logger.info('Admin initiated external game synchronization.');
        const result = await syncGamesWithExternalAPI();
        if (result.success) {
            res.json({ message: result.message });
        } else {
            res.status(500).json({ message: result.message });
        }
    } catch (error) {
        logger.error(`Error in syncGames controller: ${error.message}`);
        res.status(500).json({ message: 'خطا در شروع همگام‌سازی بازی‌ها.' });
    }
};

// @desc    شروع همگام‌سازی نتایج با API خارجی
// @route   POST /api/external/sync-results
// @access  Private/Admin
const syncResults = async (req, res) => {
    try {
        logger.info('Admin initiated external results synchronization.');
        const result = await syncResultsWithExternalAPI();
        if (result.success) {
            res.json({ message: result.message });
        } else {
            res.status(500).json({ message: result.message });
        }
    } catch (error) {
        logger.error(`Error in syncResults controller: ${error.message}`);
        res.status(500).json({ message: 'خطا در شروع همگام‌سازی نتایج.' });
    }
};

module.exports = {
    syncGames,
    syncResults
};