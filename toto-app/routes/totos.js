// toto-app/routes/toto.js

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const TotoGame = require('../models/TotoGame');
const Prediction = require('../models/Prediction');
const Transaction = require('../models/Transaction'); // اضافه شد
const authMiddleware = require('../middleware/authMiddleware');
const logger = require('../utils/logger');
const ExcelJS = require('exceljs');

// مسیرهای استاتیک و با پارامترهای پیچیده‌تر اول:
router.get('/active', async (req, res) => {
    try {
        const activeGames = await TotoGame.find({ status: 'open', deadline: { $gt: new Date() } }).sort({ deadline: 1 });
        res.json(activeGames);
    } catch (error) {
        logger.error('Error fetching active toto games:', error);
        res.status(500).json({ message: 'Server error fetching active games.' });
    }
});

router.get('/my-predictions', authMiddleware, async (req, res) => {
    try {
        const predictions = await Prediction.find({ userId: req.user.id })
            .populate('totoGame', 'name deadline status matches')
            .sort({ createdAt: -1 });
        res.json(predictions);
    } catch (error) {
        logger.error(`Error fetching predictions for user ${req.user.id}:`, error);
        res.status(500).json({ message: 'خطا در دریافت پیش‌بینی‌های شما.' });
    }
});

router.get('/export-predictions/:gameId', authMiddleware, async (req, res) => {
    const { gameId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(gameId)) {
        logger.warn(`Invalid Toto game ID format in export: ${gameId}`);
        return res.status(400).json({ message: 'فرمت شناسه بازی Toto نامعتبر است.' });
    }

    try {
        const totoGame = await TotoGame.findById(gameId);
        if (!totoGame) {
            logger.warn(`User ${req.user.username} attempted to export predictions for non-existent game ID: ${gameId}`);
            return res.status(404).json({ message: 'بازی Toto یافت نشد.' });
        }

        if (new Date() < totoGame.deadline && totoGame.status === 'open') {
            logger.warn(`User ${req.user.username} attempted to export predictions for open game: ${totoGame.name}`);
            return res.status(400).json({ message: 'این بازی هنوز باز است و لیست پیش‌بینی‌ها آماده دانلود نیست.' });
        }

        const predictions = await Prediction.find({ totoGame: gameId })
            .populate('userId', 'username email')
            .sort({ createdAt: 1 });

        if (predictions.length === 0) {
            logger.info(`User ${req.user.username} attempted to export predictions for game ${totoGame.name}, but no predictions found.`);
            return res.status(404).json({ message: 'هیچ پیش‌بینی برای این بازی یافت نشد.' });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`پیش‌بینی‌های بازی ${totoGame.name}`);

        const columns = [
            { header: 'ردیف', key: 'rowNum', width: 10 },
            { header: 'نام کاربری', key: 'username', width: 25 },
            { header: 'ایمیل کاربر', key: 'email', width: 30 },
            { header: 'تاریخ ثبت', key: 'submissionDate', width: 20 },
            { header: 'قیمت فرم (تومان)', key: 'formPrice', width: 20 },
            { header: 'امتیاز کسب شده', key: 'score', width: 18 },
            { header: 'بازپرداخت شده', key: 'isRefunded', width: 15 }
        ];

        totoGame.matches.forEach((match, index) => {
            columns.push({ header: `پیش‌بینی بازی ${index + 1}: ${match.homeTeam} vs ${match.awayTeam}`, key: `prediction${index}`, width: 30 });
        });

        worksheet.columns = columns;

        predictions.forEach((pred, index) => {
            const rowData = {
                rowNum: index + 1,
                username: pred.userId ? pred.userId.username : 'ناشناس',
                email: pred.userId ? pred.userId.email : 'ناشناس',
                submissionDate: new Date(pred.createdAt).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' }),
                formPrice: pred.price,
                score: pred.score,
                isRefunded: pred.isRefunded ? 'بله' : 'خیر'
            };

            pred.predictions.forEach((pItem, matchIndex) => {
                rowData[`prediction${matchIndex}`] = pItem.chosenOutcome.join('/');
            });

            worksheet.addRow(rowData);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=predictions_${totoGame.name.replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

        logger.info(`User ${req.user.username} (ID: ${req.user.id}) downloaded predictions for Toto game: ${totoGame.name} (ID: ${gameId}).`);

    } catch (error) {
        logger.error(`Error exporting predictions for game ${gameId} by user ${req.user ? req.user.username : 'unknown'}:`, error);
        res.status(500).json({ message: 'خطا در تولید و دانلود فایل اکسل پیش‌بینی‌ها.' });
    }
});

router.post('/:gameId/predict', authMiddleware, async (req, res) => {
    const { gameId } = req.params;
    const { predictions } = req.body;

    if (!mongoose.Types.ObjectId.isValid(gameId)) {
        logger.warn(`Invalid Toto game ID format in prediction: ${gameId}`);
        return res.status(400).json({ message: 'فرمت شناسه بازی Toto نامعتبر است.' });
    }

    if (!predictions || !Array.isArray(predictions)) {
        return res.status(400).json({ message: 'پیش‌بینی‌ها نامعتبر است.' });
    }

    try {
        const totoGame = await TotoGame.findById(gameId);
        if (!totoGame) {
            return res.status(404).json({ message: 'بازی Toto یافت نشد.' });
        }

        if (new Date() > totoGame.deadline || totoGame.status !== 'open') {
            return res.status(400).json({ message: 'مهلت ثبت پیش‌بینی برای این بازی به پایان رسیده است.' });
        }

        if (predictions.length !== totoGame.matches.length) {
            return res.status(400).json({ message: `پیش‌بینی باید شامل دقیقاً ${totoGame.matches.length} بازی باشد.` });
        }

        const validOutcomes = ['1', 'X', '2'];

        for (const pred of predictions) {
            if (!mongoose.Types.ObjectId.isValid(pred.matchId)) {
                return res.status(400).json({ message: `فرمت شناسه بازی فرعی ${pred.matchId} نامعتبر است.` });
            }

            const match = totoGame.matches.id(pred.matchId);
            if (!match) {
                return res.status(400).json({ message: `بازی با شناسه ${pred.matchId} در این بازی Toto یافت نشد.` });
            }

            if (!Array.isArray(pred.chosenOutcome) || pred.chosenOutcome.length === 0) {
                return res.status(400).json({ message: `لطفاً حداقل یک نتیجه برای بازی ${match.homeTeam} vs ${match.awayTeam} انتخاب کنید.` });
            }

            if (!pred.chosenOutcome.every(outcome => validOutcomes.includes(outcome))) {
                return res.status(400).json({ message: `نتیجه انتخاب شده برای بازی ${match.homeTeam} vs ${match.awayTeam} نامعتبر است.` });
            }
        }

        const formPrice = 100 * predictions.length;

        const user = req.user;
        if (user.balance < formPrice) {
            return res.status(400).json({ message: `موجودی ناکافی. ${formPrice} تومان مورد نیاز است.` });
        }

        user.balance -= formPrice;
        await user.save();

        await Transaction.create({
            userId: user._id,
            amount: -formPrice,
            type: 'form_payment',
            description: `پرداخت فرم پیش‌بینی برای بازی ${totoGame.name}`,
        });

        const newPrediction = await Prediction.create({
            userId: user._id,
            totoGame: gameId,
            predictions,
            price: formPrice,
        });

        logger.info(`User ${user.username} (ID: ${user._id}) submitted prediction for Toto game ${totoGame.name} (ID: ${gameId}).`);
        res.status(201).json({ message: 'پیش‌بینی شما با موفقیت ثبت شد.', prediction: newPrediction });

    } catch (error) {
        logger.error(`Error submitting prediction for game ${gameId} by user ${req.user ? req.user.username : 'unknown'}:`, error);
        res.status(500).json({ message: 'خطا در ثبت پیش‌بینی.' });
    }
});

// در نهایت مسیر با پارامتر دینامیک (ID بازی)
router.get('/:id', async (req, res) => {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        logger.warn(`Invalid Toto game ID format: ${id}`);
        return res.status(400).json({ message: 'فرمت شناسه بازی Toto نامعتبر است.' });
    }
    try {
        const game = await TotoGame.findById(id);
        if (!game) {
            return res.status(404).json({ message: 'بازی Toto یافت نشد.' });
        }
        res.json(game);
    } catch (error) {
        logger.error(`Error fetching toto game ${id}:`, error);
        res.status(500).json({ message: 'Server error fetching game.' });
    }
});

module.exports = router;
