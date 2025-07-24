// toto-app/routes/totoGameRoutes.js

const express = require('express');
const mongoose = require('mongoose');
const TotoGame = require('../models/TotoGame');
const { setCache, getCache } = require('../utils/cache');
const logger = require('../utils/logger');
const { protect } = require('../middleware/authMiddleware');

// Import Toto Game related controllers
const {
    getAllTotoGames,
    getOpenTotoGames,
    getTotoGameById,
    getTotoPredictionsExcel
} = require('../controllers/totoGameController');

// Import submitPrediction from userController
const { submitPrediction } = require('../controllers/userController');

const router = express.Router();

const CACHE_TTL = 5 * 60 * 1000; // 5 دقیقه کش

// @desc    دریافت لیست بازی‌های Toto که "باز" هستند (مهلت نگذشته)
// @route   GET /api/totos/open
// @access  Public
router.get('/open', async (req, res) => {
    const cacheKey = 'openTotoGames';
    const cachedGames = getCache(cacheKey);

    if (cachedGames) {
        logger.info('Serving open Toto games from cache.');
        return res.json(cachedGames);
    }

    try {
        const now = new Date();
        const openTotoGames = await TotoGame.find({
            status: 'open',
            deadline: { $gt: now }
        }).sort({ deadline: 1 });

        setCache(cacheKey, openTotoGames, CACHE_TTL);
        logger.info(`Fetched and cached ${openTotoGames.length} open Toto games.`);
        res.json(openTotoGames);
    } catch (error) {
        logger.error('Error fetching open Toto games:', error);
        res.status(500).json({ message: 'خطا در دریافت بازی‌های Toto باز.' });
    }
});

// @desc    دریافت آخرین بازی کامل‌شده
// @route   GET /api/totos/last-completed-game
// @access  Public
router.get('/last-completed-game', async (req, res) => {
    try {
        const lastCompletedGame = await TotoGame.findOne({ status: 'completed' }).sort({ completedAt: -1 });
        if (!lastCompletedGame) {
            return res.status(404).json({ message: 'هیچ بازی کامل‌شده‌ای یافت نشد.' });
        }
        res.json(lastCompletedGame);
    } catch (error) {
        logger.error('Error fetching last completed Toto game:', error);
        res.status(500).json({ message: 'خطا در دریافت آخرین بازی کامل‌شده.' });
    }
});

// @desc    دریافت جزئیات یک بازی Toto با شناسه
// @route   GET /api/totos/:id
// @access  Public
router.get('/:id', getTotoGameById);

// @desc    ارسال فرم پیش‌بینی توسط کاربر
// @route   POST /api/totos/predict
// @access  Private (فقط کاربران لاگین شده)
router.post('/predict', protect, submitPrediction);

// @desc    خروجی گرفتن از پیش‌بینی‌های یک بازی Toto با شناسه مشخص (فایل اکسل)
// @route   GET /api/totos/:id/predictions-excel
// @access  Private
router.get('/:id/predictions-excel', protect, getTotoPredictionsExcel);

module.exports = router;
