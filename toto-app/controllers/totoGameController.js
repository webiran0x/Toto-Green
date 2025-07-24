// toto-app/controllers/totoGameController.js
// کنترلر برای مدیریت بازی‌های Toto (ایجاد، مشاهده، به‌روزرسانی، حذف)

const asyncHandler = require('express-async-handler');
const TotoGame = require('../models/TotoGame');
const Prediction = require('../models/Prediction');
const User = require('../models/User');
const Transaction = require('../models/Transaction'); // <--- استفاده از مدل جامع Transaction
const logger = require('../utils/logger');
const mongoose = require('mongoose'); // برای اعتبارسنجی ObjectId
const ExcelJS = require('exceljs');
const TotoForm = require('../models/TotoForm');




const getTotoPredictionsExcel = asyncHandler(async (req, res) => {
  const { gameId } = req.params;

  const totoGame = await TotoGame.findById(gameId);
  if (!totoGame) {
    return res.status(404).json({ message: 'بازی Toto یافت نشد.' });
  }

  const predictions = await Prediction.find({ totoGame: gameId }).populate('user', 'username email');

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Predictions');

  // هدر ستون‌ها
  worksheet.columns = [
    { header: 'شناسه کاربر', key: 'userId', width: 25 },
    { header: 'نام کاربری', key: 'username', width: 20 },
    { header: 'ایمیل', key: 'email', width: 25 },
    { header: 'تاریخ ثبت', key: 'createdAt', width: 20 },
    { header: 'قیمت فرم', key: 'price', width: 15 },
    { header: 'پیش‌بینی‌ها', key: 'predictions', width: 50 },
  ];

  predictions.forEach(pred => {
    const predText = pred.predictions.map(p => {
      return `MatchID: ${p.matchId}, Outcomes: ${p.chosenOutcome.join(', ')}`;
    }).join(' | ');

    worksheet.addRow({
      userId: pred.user._id.toString(),
      username: pred.user.username,
      email: pred.user.email,
      createdAt: pred.createdAt.toISOString().slice(0, 19).replace('T', ' '),
      price: pred.price,
      predictions: predText
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=predictions_${gameId}.xlsx`);

  await workbook.xlsx.write(res);
  res.end();
});


// @desc    ایجاد یک بازی Toto جدید
// @route   POST /api/admin/totos
// @access  Private/Admin
const createTotoGame = asyncHandler(async (req, res) => {
    const { name, deadline, matches } = req.body;

    // اعتبارسنجی اولیه
    if (!name || !deadline || !matches || !Array.isArray(matches) || matches.length !== 15) {
        return res.status(400).json({ message: 'لطفاً نام، مهلت و دقیقاً ۱۵ بازی را وارد کنید.' });
    }

    // اعتبارسنجی جزئیات هر بازی
    for (const match of matches) {
        if (!match.homeTeam || !match.awayTeam || !match.date) {
            return res.status(400).json({ message: 'هر بازی باید شامل تیم میزبان، تیم مهمان و تاریخ باشد.' });
        }
    }

    // بررسی نام تکراری
    const gameExists = await TotoGame.findOne({ name });
    if (gameExists) {
        return res.status(400).json({ message: 'بازی Toto با این نام قبلاً ایجاد شده است.' });
    }

    try {
        const totoGame = await TotoGame.create({
            name,
            deadline,
            matches,
            status: 'open', // وضعیت اولیه بازی
            totalPot: 0, // مجموع جوایز
            commissionDeducted: 0, // کمیسیون کسر شده
            finalPrizeAmount: 0, // مبلغ نهایی جایزه
        });

        logger.info(`Admin ${req.user.username} created new Toto game: ${totoGame.name} (ID: ${totoGame._id})`);
        res.status(201).json(totoGame);
    } catch (error) {
        logger.error(`Error creating Toto game: ${error.message}`);
        res.status(500).json({ message: 'خطا در ایجاد بازی Toto.' });
    }
});

// @desc    دریافت تمام بازی‌های Toto (برای ادمین یا نمایش سابقه کامل)
// @route   GET /api/totos (for public) or /api/admin/totos (for admin)
// @access  Public / Private/Admin
const getAllTotoGames = asyncHandler(async (req, res) => {
    try {
        const games = await TotoGame.find({}).sort({ createdAt: -1 }); // مرتب‌سازی بر اساس تاریخ ایجاد
        logger.info(`Fetched all Toto games. Found ${games.length} games.`);
        res.json(games);
    } catch (error) {
        logger.error(`Error fetching all Toto games: ${error.message}`);
        res.status(500).json({ message: 'خطا در دریافت تمام بازی‌های Toto.' });
    }
});

// @desc    دریافت بازی‌های Toto که "باز" هستند (مهلت نگذشته)
// @route   GET /api/totos/open
// @access  Public
const getOpenTotoGames = asyncHandler(async (req, res) => {
    try {
        const now = new Date();
        const openTotoGames = await TotoGame.find({
            status: 'open',
            deadline: { $gt: now }
        }).sort({ deadline: 1 }); // مرتب‌سازی بر اساس نزدیکترین مهلت
        logger.info(`Fetched ${openTotoGames.length} open Toto games.`);
        res.json(openTotoGames);
    } catch (error) {
        logger.error(`Error fetching open Toto games: ${error.message}`);
        res.status(500).json({ message: 'خطا در دریافت بازی‌های Toto باز.' });
    }
});

// @desc    دریافت جزئیات یک بازی Toto بر اساس ID
// @route   GET /api/totos/:id
// @access  Public
const getTotoGameById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        logger.warn(`Invalid Toto game ID format requested: ${id}`);
        return res.status(400).json({ message: 'فرمت شناسه بازی Toto نامعتبر است.' });
    }

    try {
        const game = await TotoGame.findById(id);
        if (!game) {
            return res.status(404).json({ message: 'بازی Toto یافت نشد.' });
        }
        logger.info(`Fetched Toto game by ID: ${id}`);
        res.json(game);
    } catch (error) {
        logger.error(`Error fetching Toto game by ID ${id}: ${error.message}`);
        res.status(500).json({ message: 'خطا در دریافت بازی Toto.' });
    }
});

// @desc    به‌روزرسانی یک بازی Toto (فقط برای ادمین)
// @route   PUT /api/admin/totos/:id
// @access  Private/Admin
const updateTotoGame = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, deadline, matches, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        logger.warn(`Invalid Toto game ID format for update: ${id}`);
        return res.status(400).json({ message: 'فرمت شناسه بازی Toto نامعتبر است.' });
    }

    try {
        const totoGame = await TotoGame.findById(id);

        if (!totoGame) {
            return res.status(404).json({ message: 'بازی Toto یافت نشد.' });
        }

        if (name) totoGame.name = name;
        if (deadline) totoGame.deadline = deadline;
        if (matches && Array.isArray(matches) && matches.length === 15) {
            totoGame.matches = matches;
        }
        if (status) totoGame.status = status; // ادمین می‌تواند وضعیت بازی را تغییر دهد

        await totoGame.save();
        logger.info(`Admin ${req.user.username} updated Toto game: ${totoGame.name} (ID: ${totoGame._id})`);
        res.json(totoGame);
    } catch (error) {
        logger.error(`Error updating Toto game ${id}: ${error.message}`);
        res.status(500).json({ message: 'خطا در به‌روزرسانی بازی Toto.' });
    }
});

// @desc    حذف یک بازی Toto (فقط برای ادمین)
// @route   DELETE /api/admin/totos/:id
// @access  Private/Admin
const deleteTotoGame = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        logger.warn(`Invalid Toto game ID format for deletion: ${id}`);
        return res.status(400).json({ message: 'فرمت شناسه بازی Toto نامعتبر است.' });
    }

    try {
        const totoGame = await TotoGame.findById(id);

        if (!totoGame) {
            return res.status(404).json({ message: 'بازی Toto یافت نشد.' });
        }

        await totoGame.deleteOne();
        logger.info(`Admin ${req.user.username} deleted Toto game: ${totoGame.name} (ID: ${totoGame._id})`);
        res.json({ message: 'بازی Toto با موفقیت حذف شد.' });
    } catch (error) {
        logger.error(`Error deleting Toto game ${id}: ${error.message}`);
        res.status(500).json({ message: 'خطا در حذف بازی Toto.' });
    }
});

// @desc    ثبت نتایج بازی Toto و امتیازدهی به پیش‌بینی‌ها (فقط برای ادمین)
// @route   PUT /api/admin/totos/:id/results
// @access  Private/Admin
const setTotoGameResults = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { results } = req.body; // نتایج باید آرایه‌ای از 15 نتیجه (1, X, 2) باشد

    if (!mongoose.Types.ObjectId.isValid(id)) {
        logger.warn(`Invalid Toto game ID format for setting results: ${id}`);
        return res.status(400).json({ message: 'فرمت شناسه بازی Toto نامعتبر است.' });
    }

    if (!results || !Array.isArray(results) || results.length !== 15 || !results.every(r => ['1', 'X', '2'].includes(r))) {
        return res.status(400).json({ message: 'لطفاً نتایج را به درستی و برای هر ۱۵ بازی وارد کنید (1, X, 2).' });
    }

    try {
        const totoGame = await TotoGame.findById(id);
        if (!totoGame) {
            return res.status(404).json({ message: 'بازی Toto یافت نشد.' });
        }

        if (totoGame.status !== 'closed') {
            return res.status(400).json({ message: 'فقط بازی‌های بسته شده را می‌توان نتیجه‌گیری کرد.' });
        }

        // ذخیره نتایج
        totoGame.results = results;

        // امتیازدهی به پیش‌بینی‌ها
        const predictions = await Prediction.find({ totoGame: id }).populate('user');
        let totalPot = 0; // مجموع کل مبلغ فرم‌ها
        let firstPlaceUsers = [];
        let secondPlaceUsers = [];
        let thirdPlaceUsers = [];

        for (const prediction of predictions) {
            totalPot += prediction.cost; // فرض می‌کنیم cost همان مبلغ فرم است

            let correctPredictions = 0;
            for (let i = 0; i < 15; i++) {
                if (prediction.predictions[i] === results[i]) {
                    correctPredictions++;
                }
            }
            prediction.correctPredictions = correctPredictions;
            await prediction.save();

            // تعیین رتبه و افزودن به لیست برندگان
            if (correctPredictions === 15) {
                firstPlaceUsers.push(prediction.user._id);
            } else if (correctPredictions === 14) {
                secondPlaceUsers.push(prediction.user._id);
            } else if (correctPredictions === 13) {
                thirdPlaceUsers.push(prediction.user._id);
            }
        }

        // محاسبه جوایز
        const commissionRate = 0.10; // 10% کمیسیون
        const finalPrizePool = totalPot * (1 - commissionRate);

        let firstPlacePrize = 0;
        let secondPlacePrize = 0;
        let thirdPlacePrize = 0;

        const totalFirstPlacePredictions = firstPlaceUsers.length;
        const totalSecondPlacePredictions = secondPlaceUsers.length;
        const totalThirdPlacePredictions = thirdPlaceUsers.length;

        if (totalFirstPlacePredictions > 0) {
            firstPlacePrize = (finalPrizePool * 0.70) / totalFirstPlacePredictions; // 70% برای نفرات اول
        }
        if (totalSecondPlacePredictions > 0) {
            secondPlacePrize = (finalPrizePool * 0.20) / totalSecondPlacePredictions; // 20% برای نفرات دوم
        }
        if (totalThirdPlacePredictions > 0) {
            thirdPlacePrize = (finalPrizePool * 0.10) / totalThirdPlacePredictions; // 10% برای نفرات سوم
        }

        // ذخیره اطلاعات جوایز و برندگان در TotoGame
        totoGame.totalPot = totalPot;
        totoGame.commissionDeducted = totalPot * commissionRate;
        totoGame.finalPrizeAmount = finalPrizePool;
        totoGame.prizes = {
            firstPlace: firstPlacePrize,
            secondPlace: secondPlacePrize,
            thirdPlace: thirdPlacePrize
        };
        totoGame.winners = {
            first: firstPlaceUsers,
            second: secondPlaceUsers,
            third: thirdPlaceUsers
        };
        await totoGame.save();

        res.json({ message: 'نتایج بازی ثبت و جوایز محاسبه شد.' });
    } catch (error) {
        logger.error(`Error setting results for Toto game ${id}: ${error.message}`);
        res.status(500).json({ message: 'خطا در ثبت نتایج بازی Toto.' });
    }
});

// @desc    خروجی اکسل از فرم‌های پیش‌بینی کاربران
// @route   GET /api/admin/totos/:gameId/forms/export
// @access  Private/Admin
const exportFormsExcel = asyncHandler(async (req, res) => {
    const { gameId } = req.params;
    const game = await TotoGame.findById(gameId);
    if (!game) return res.status(404).json({ message: 'مسابقه یافت نشد.' });

    if (new Date(game.deadline) > new Date()) {
        return res.status(400).json({ message: 'این مسابقه هنوز به پایان نرسیده.' });
    }

    const forms = await TotoForm.find({ game: gameId }).populate('user');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Forms');

    worksheet.columns = [
        { header: 'نام کاربر', key: 'name', width: 25 },
        { header: 'ایمیل', key: 'email', width: 30 },
        { header: 'پیش‌بینی‌ها', key: 'answers', width: 50 },
        { header: 'زمان ارسال', key: 'submittedAt', width: 25 },
    ];

    forms.forEach(form => {
        worksheet.addRow({
            name: form.user?.fullName || form.user?.name || 'نامشخص',
            email: form.user?.email || '---',
            answers: JSON.stringify(form.answers),
            submittedAt: new Date(form.createdAt).toLocaleString('fa-IR'),
        });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=toto-game-${gameId}-forms.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
});

module.exports = {
    createTotoGame,
    getAllTotoGames,
    getOpenTotoGames,
    getTotoGameById,
    updateTotoGame,
    deleteTotoGame,
    setTotoGameResults,
    exportFormsExcel,
    getTotoPredictionsExcel
};
