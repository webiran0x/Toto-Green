// toto-app/routes/totoGameRoutes.js

const express = require('express');
const mongoose = require('mongoose');
const TotoGame = require('../models/TotoGame');
const { setCache, getCache } = require('../utils/cache');
const logger = require('../utils/logger');
const { protect } = require('../middleware/authMiddleware'); // اطمینان از استفاده از authMiddleware صحیح

// Import Toto Game related controllers
const {
    getAllTotoGames,
    getOpenTotoGames,
    getTotoGameById,
    getPublicCompletedAndClosedGames, // ایمپورت تابع جدید
    getTotoPredictionsExcel
} = require('../controllers/totoGameController');

// Import submitPrediction from userController
const { submitPrediction } = require('../controllers/userController');

const router = express.Router();

const CACHE_TTL = 5 * 60 * 1000; // 5 دقیقه کش

// --- مسیرهای عمومی (Public Routes) ---

// @desc    دریافت لیست بازی‌های Toto که "باز" هستند (مهلت نگذشته)
// @route   GET /api/totos/open
// @access  Public
// ✅ این مسیر باید قبل از /:id تعریف شود
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

// @desc    دریافت آخرین بازی بسته‌شده یا کامل‌شده (closed یا completed)
// @route   GET /api/totos/last-finished-game
// @access  Public
router.get('/last-finished-game', async (req, res) => {
    try {
        const lastFinishedGame = await TotoGame.findOne({ status: { $in: ['closed', 'completed'] } })
            .sort({ createdAt: -1 })
            .populate('winners.first', 'username')
            .populate('winners.second', 'username')
            .populate('winners.third', 'username');

        if (!lastFinishedGame) {
            return res.status(404).json({ message: 'هیچ بازی بسته‌شده یا کامل‌شده‌ای یافت نشد.' });
        }

        res.json(lastFinishedGame);
    } catch (error) {
        logger.error('Error fetching last finished Toto game:', error);
        res.status(500).json({ message: 'خطا در دریافت آخرین بازی بسته‌شده یا کامل‌شده.' });
    }
});

// @desc    دریافت بازی‌های تکمیل شده و بسته شده برای صفحه فرود (بدون نیاز به احراز هویت)
// @route   GET /api/public/games/completed-and-closed
// @access  Public
// !!! مهم: این مسیر باید قبل از مسیر عمومی /:id تعریف شود تا اولویت داشته باشد.
router.get('/public/games/completed-and-closed', getPublicCompletedAndClosedGames);

// !!! مسیر جدید برای دانلود اکسل پیش‌بینی‌ها بدون احراز هویت !!!
// @desc    خروجی اکسل از پیش‌بینی‌های یک بازی Toto با شناسه مشخص (فایل اکسل) - عمومی
// @route   GET /api/totos/public/games/:gameId/predictions-download
// @access  Public
router.get('/public/games/:gameId/predictions-download', getTotoPredictionsExcel);


// --- مسیرهای خصوصی (Private Routes) - نیاز به احراز هویت ---

// @desc    ارسال فرم پیش‌بینی توسط کاربر
// @route   POST /api/totos/predict
// @access  Private (فقط کاربران لاگین شده)
router.post('/predict', protect, submitPrediction);

// @desc    خروجی گرفتن از پیش‌بینی‌های یک بازی Toto با شناسه مشخص (فایل اکسل)
// @route   GET /api/totos/:id/predictions-excel
// @access  Private
// ✅ این مسیر نیز باید قبل از /:id عمومی تعریف شود
router.get('/:id/predictions-excel', protect, getTotoPredictionsExcel);


// @desc    دریافت جزئیات یک بازی Toto با شناسه
// @route   GET /api/totos/:id
// @access  Public
// ✅ این مسیر عمومی باید آخرین مسیر از نوع GET در این فایل باشد تا مسیرهای خاص‌تر اولویت داشته باشند.
router.get('/:id', getTotoGameById);


module.exports = router;
