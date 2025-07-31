// toto-app/controllers/totoGameController.js

const asyncHandler = require('express-async-handler');
const TotoGame = require('../models/TotoGame');
const Prediction = require('../models/Prediction');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const TotoForm = require('../models/TotoForm'); // اگر از این مدل استفاده می‌کنید


const getTotoPredictionsExcel = asyncHandler(async (req, res) => {
  const { gameId } = req.params;

  const totoGame = await TotoGame.findById(gameId);
  if (!totoGame) {
    return res.status(404).json({ message: 'بازی Toto یافت نشد.' });
  }

  // اطمینان از اینکه Prediction مدل صحیح را populate می‌کند
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
    { header: 'شناسه فرم', key: 'formId', width: 20 }, // اضافه شد: شناسه فرم
    { header: 'پیش‌بینی‌ها', key: 'predictions', width: 50 },
  ];

  predictions.forEach(pred => {
    // اطمینان از اینکه pred.predictions یک آرایه از اشیاء است
    const predText = pred.predictions.map(p => {
      // فرض می‌کنیم p.matchId یک ObjectId است که باید به رشته تبدیل شود
      return `MatchID: ${p.matchId.toString().slice(-6)}, Outcomes: ${p.chosenOutcome.join(', ')}`; // نمایش 6 کاراکتر آخر MatchID برای خوانایی
    }).join(' | ');

    worksheet.addRow({
      userId: pred.user._id.toString(),
      username: pred.user.username,
      email: pred.user.email,
      createdAt: pred.createdAt.toISOString().slice(0, 19).replace('T', ' '),
      price: pred.price,
      formId: pred.formId, // اضافه شد: شناسه فرم
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
            // اطمینان از اینکه فیلدهای prizes و winners در مدل TotoGame وجود دارند
            prizes: { firstPlace: 0, secondPlace: 0, thirdPlace: 0 },
            winners: { first: [], second: [], third: [] }
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

// @desc    دریافت بازی‌های تکمیل شده و بسته شده برای صفحه فرود (بدون نیاز به احراز هویت)
// @route   GET /api/public/games/completed-and-closed
// @access  Public
const getPublicCompletedAndClosedGames = asyncHandler(async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5; // تعداد بازی‌های مورد نیاز برای اسلایدر

        // کوئری برای یافتن بازی‌هایی با وضعیت 'completed' یا 'closed'
        const games = await TotoGame.find({
            status: { $in: ['completed', 'closed'] }
        })
        .sort({ deadline: -1 }) // از جدیدترین به قدیمی‌ترین
        .limit(limit)
        .lean(); // برای کارایی بهتر

        // --- جدید: واکشی تعداد پیش‌بینی‌ها برای هر بازی (همانند getExpiredGames) ---
        const gameIds = games.map(game => game._id);
        const predictionCounts = await Prediction.aggregate([
            { $match: { totoGame: { $in: gameIds } } },
            { $group: { _id: '$totoGame', count: { $sum: 1 } } }
        ]);

        const predictionCountMap = new Map();
        predictionCounts.forEach(item => {
            predictionCountMap.set(item._id.toString(), item.count);
        });

        const gamesWithPredictionCounts = games.map(game => ({
            ...game,
            submittedFormsCount: predictionCountMap.get(game._id.toString()) || 0
        }));
        // --- پایان جدید ---

        res.json({
            games: gamesWithPredictionCounts,
            totalCount: await TotoGame.countDocuments({ status: { $in: ['completed', 'closed'] } }) // تعداد کل برای اطلاع
        });

    } catch (error) {
        logger.error(`Error fetching public completed and closed games: ${error.message}`);
        res.status(500).json({ message: 'خطا در دریافت اطلاعات بازی‌ها.' });
    }
});

// // NEW: متد جدید برای دریافت بازی‌های منقضی شده عمومی (بدون نیاز به احراز هویت)
// const getPublicExpiredGames = async (req, res, next) => {
//         try {
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 10;
//         const skip = (page - 1) * limit;

//         // فقط بازی‌هایی را که وضعیت 'completed' یا 'closed' یا 'cancelled' دارند، واکشی می‌کنیم
//         const query = { status: { $in: ['completed', 'closed', 'cancelled'] } };

//         const games = await TotoGame.find(query)
//             .sort({ deadline: -1 }) // بر اساس مهلت به صورت نزولی (جدیدترین به قدیمی‌ترین)
//             .skip(skip)
//             .limit(limit)
//             .select('-matches'); // اطلاعات مسابقات را برای API عمومی ارسال نمی‌کنیم تا پاسخ سبک‌تر باشد

//         const totalCount = await TotoGame.countDocuments(query);
//         const totalPages = Math.ceil(totalCount / limit);

//         res.json({
//             games,
//             totalCount,
//             totalPages,
//             currentPage: page,
//         });
//     } catch (error) {
//         next(error);
//     }
// };


// @desc    دریافت بازی‌های منقضی شده عمومی (بدون نیاز به احراز هویت)
// @route   GET /api/totos/public-expired
// @access  Public
const getPublicExpiredGames = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = { status: { $in: ['completed', 'closed', 'cancelled'] } };

        // NEW: انتخاب فیلدها به صورت پویا بر اساس وضعیت بازی
        // برای بازی‌های completed، فیلد matches را نیز برمی‌گردانیم
        const games = await TotoGame.find(query)
            .sort({ deadline: -1 })
            .skip(skip)
            .limit(limit)
            .lean(); // از lean() استفاده می‌کنیم برای کارایی بهتر

        // NEW: افزودن تعداد فرم‌های برنده و نتایج بازی‌ها برای بازی‌های تکمیل‌شده
        const gameIds = games.map(game => game._id);
        const predictionCounts = await Prediction.aggregate([
            { $match: { totoGame: { $in: gameIds } } },
            { $group: { _id: '$totoGame', count: { $sum: 1 } } }
        ]);

        const predictionCountMap = new Map();
        predictionCounts.forEach(item => {
            predictionCountMap.set(item._id.toString(), item.count);
        });

        const gamesWithDetails = games.map(game => {
            const gameObj = {
                ...game,
                submittedFormsCount: predictionCountMap.get(game._id.toString()) || 0
            };
            // اگر بازی تکمیل شده است، فیلد matches را نگه می‌داریم
            if (game.status === 'completed') {
                // نیازی به حذف matches نیست، چون در .lean() کل شیء برگردانده می‌شود.
                // اگر می‌خواهید مطمئن شوید که matches فقط برای 'completed' هست، این منطق را اینجا اضافه کنید:
                // در غیر این صورت، این بخش نیازی به تغییر ندارد.
            } else {
                // برای بازی‌های غیر از 'completed'، فیلد matches را حذف می‌کنیم
                delete gameObj.matches;
            }
            return gameObj;
        });

        const totalCount = await TotoGame.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);

        res.json({
            games: gamesWithDetails, // ارسال بازی‌ها با جزئیات بیشتر
            totalCount,
            totalPages,
            currentPage: page,
        });
    } catch (error) {
        next(error);
    }
};

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
    // setTotoGameResults, // این خط حذف شد
    exportFormsExcel,
    getPublicExpiredGames,
    getTotoPredictionsExcel,
    getPublicCompletedAndClosedGames // اضافه شده
};
