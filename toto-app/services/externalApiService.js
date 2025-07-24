// toto-app/services/externalApiService.js
// سرویس برای ادغام با API خارجی جهت دریافت بازی‌ها و نتایج

const TotoGame = require('../models/TotoGame');
const logger = require('../config/logger');

// یک URL Mock API برای تست. در واقعیت، این یک API واقعی مسابقات ورزشی خواهد بود.
const EXTERNAL_API_BASE_URL = 'https://mockapi.example.com/sports'; // Placeholder URL

/**
 * شبیه‌سازی دریافت بازی‌ها از یک API خارجی
 * @returns {Array} آرایه‌ای از بازی‌ها با فرمت { externalId, homeTeam, awayTeam, date }
 */
const fetchGamesFromExternalAPI = async () => {
    try {
        // در یک سناریوی واقعی، اینجا یک فراخوانی fetch/axios به API خارجی خواهید داشت.
        // مثال: const response = await fetch(`${EXTERNAL_API_BASE_URL}/games/upcoming`);
        // const externalGames = await response.json();

        // برای دمو، داده‌های Mock را برمی‌گردانیم
        const mockGames = [
            { externalId: 'ext_game_001', homeTeam: 'تیم آ', awayTeam: 'تیم ب', date: new Date(Date.now() + 86400000 * 2).toISOString() }, // 2 روز دیگر
            { externalId: 'ext_game_002', homeTeam: 'تیم ج', awayTeam: 'تیم د', date: new Date(Date.now() + 86400000 * 3).toISOString() }, // 3 روز دیگر
            { externalId: 'ext_game_003', homeTeam: 'تیم ه', awayTeam: 'تیم و', date: new Date(Date.now() + 86400000 * 1).toISOString() }, // 1 روز دیگر
            { externalId: 'ext_game_004', homeTeam: 'تیم ز', awayTeam: 'تیم ح', date: new Date(Date.now() - 86400000 * 1).toISOString() }, // 1 روز پیش (برای تست نتایج)
            { externalId: 'ext_game_005', homeTeam: 'تیم ط', awayTeam: 'تیم ی', date: new Date(Date.now() - 86400000 * 2).toISOString() }, // 2 روز پیش (برای تست نتایج)
        ];
        logger.info('Fetched mock games from external API.');
        return mockGames;
    } catch (error) {
        logger.error(`Error fetching games from external API: ${error.message}`);
        return [];
    }
};

/**
 * شبیه‌سازی دریافت نتایج بازی‌ها از یک API خارجی
 * @param {Array<string>} externalGameIds - آرایه‌ای از externalId بازی‌ها
 * @returns {Array} آرایه‌ای از نتایج با فرمت { externalId, result }
 */
const fetchResultsFromExternalAPI = async (externalGameIds) => {
    try {
        // در یک سناریوی واقعی، اینجا یک فراخوانی fetch/axios به API خارجی خواهید داشت.
        // مثال: const response = await fetch(`${EXTERNAL_API_BASE_URL}/results?ids=${externalGameIds.join(',')}`);
        // const externalResults = await response.json();

        // برای دمو، داده‌های Mock را برمی‌گردانیم
        const mockResults = [
            { externalId: 'ext_game_004', result: '1' }, // برد میزبان
            { externalId: 'ext_game_005', result: 'X' }, // مساوی
            // اگر بازی لغو شده باشد:
            // { externalId: 'ext_game_006', result: 'CANCELLED' }
        ];
        logger.info(`Fetched mock results for IDs: ${externalGameIds.join(', ')} from external API.`);
        return mockResults.filter(r => externalGameIds.includes(r.externalId));
    } catch (error) {
        logger.error(`Error fetching results from external API: ${error.message}`);
        return [];
    }
};

/**
 * همگام‌سازی بازی‌های Toto با داده‌های API خارجی
 * این تابع می‌تواند توسط یک cron job فراخوانی شود.
 */
const syncGamesWithExternalAPI = async () => {
    logger.info('Starting game synchronization with external API...');
    try {
        const externalGames = await fetchGamesFromExternalAPI();
        let newGamesCount = 0;
        let updatedGamesCount = 0;

        for (const extGame of externalGames) {
            // هر بازی خارجی را به عنوان یک بازی Toto جدید در نظر می‌گیریم
            // یا اگر قبلاً وجود دارد، آن را به‌روز می‌کنیم.
            // برای سادگی، فرض می‌کنیم هر بازی خارجی یک TotoGame جداگانه است.
            // در سناریوی واقعی، ممکن است بخواهید بازی‌های خارجی را به عنوان زیر-سند به یک TotoGame موجود اضافه کنید.
            // اینجا ما یک TotoGame جدید برای هر بازی خارجی ایجاد می‌کنیم (یا آن را بر اساس نام/externalId پیدا می‌کنیم).

            let existingTotoGame = await TotoGame.findOne({ name: `External Game: ${extGame.homeTeam} vs ${extGame.awayTeam}` });

            if (!existingTotoGame) {
                // اگر بازی Toto با این نام وجود ندارد، یک بازی جدید ایجاد کنید
                existingTotoGame = await TotoGame.create({
                    name: `External Game: ${extGame.homeTeam} vs ${extGame.awayTeam}`,
                    deadline: new Date(extGame.date), // مهلت را تاریخ بازی قرار می‌دهیم
                    matches: [{
                        homeTeam: extGame.homeTeam,
                        awayTeam: extGame.awayTeam,
                        date: new Date(extGame.date),
                        // externalId: extGame.externalId // می‌توانید externalId را در matchSchema ذخیره کنید
                    }],
                    status: 'open' // به صورت پیش‌فرض باز است
                });
                newGamesCount++;
                logger.info(`Created new Toto Game from external API: ${existingTotoGame.name}`);
            } else {
                // اگر بازی Toto وجود دارد، آن را به‌روز کنید (مثلاً تاریخ یا تیم‌ها)
                // و مطمئن شوید که match مربوطه نیز به‌روز شده است
                const matchIndex = existingTotoGame.matches.findIndex(m => m.homeTeam === extGame.homeTeam && m.awayTeam === extGame.awayTeam);
                if (matchIndex !== -1) {
                    existingTotoGame.matches[matchIndex].date = new Date(extGame.date);
                    // می‌توانید فیلدهای دیگر را نیز به‌روز کنید
                } else {
                    // اگر بازی در TotoGame موجود نیست، آن را اضافه کنید (اگر TotoGame شامل چندین بازی باشد)
                    // در این مثال، هر TotoGame یک بازی دارد، پس این بخش پیچیده‌تر می‌شود اگر بخواهیم 15 بازی را از یک API بگیریم.
                    // برای سادگی، فرض می‌کنیم هر TotoGame فقط یک بازی دارد که از API می‌آید.
                    logger.warn(`Match ${extGame.homeTeam} vs ${extGame.awayTeam} not found in existing Toto Game ${existingTotoGame.name}. Skipping update.`);
                }
                await existingTotoGame.save();
                updatedGamesCount++;
                logger.info(`Updated existing Toto Game from external API: ${existingTotoGame.name}`);
            }
        }
        logger.info(`Game synchronization completed. New games: ${newGamesCount}, Updated games: ${updatedGamesCount}`);
        return { success: true, message: `همگام‌سازی بازی‌ها با موفقیت انجام شد. ${newGamesCount} بازی جدید، ${updatedGamesCount} بازی به‌روزرسانی شد.` };
    } catch (error) {
        logger.error(`Error during game synchronization: ${error.message}`);
        return { success: false, message: `خطا در همگام‌سازی بازی‌ها: ${error.message}` };
    }
};

/**
 * همگام‌سازی نتایج بازی‌های Toto با داده‌های API خارجی
 * این تابع می‌تواند توسط یک cron job فراخوانی شود.
 */
const syncResultsWithExternalAPI = async () => {
    logger.info('Starting result synchronization with external API...');
    try {
        // یافتن بازی‌های Toto که بسته شده‌اند و هنوز نتایجشان ثبت نشده است
        const gamesToUpdate = await TotoGame.find({
            status: 'closed', // یا 'open' اگر می‌خواهید نتایج را زودتر بگیرید
            'matches.result': null, // بازی‌هایی که هنوز نتیجه ندارند
            'matches.isCancelled': false // بازی‌هایی که لغو نشده‌اند
        });

        if (gamesToUpdate.length === 0) {
            logger.info('No Toto games found requiring result updates from external API.');
            return { success: true, message: 'هیچ بازی برای به‌روزرسانی نتیجه یافت نشد.' };
        }

        let updatedResultsCount = 0;
        let cancelledMatchesCount = 0;

        for (const game of gamesToUpdate) {
            const externalGameIds = game.matches
                .filter(match => match.result === null && !match.isCancelled)
                .map(match => `ext_game_${match.homeTeam.toLowerCase().replace(/\s/g, '_')}_vs_${match.awayTeam.toLowerCase().replace(/\s/g, '_')}`); // ساخت externalId فرضی

            if (externalGameIds.length === 0) continue;

            const externalResults = await fetchResultsFromExternalAPI(externalGameIds);

            for (const extResult of externalResults) {
                const matchIndex = game.matches.findIndex(
                    m => `ext_game_${m.homeTeam.toLowerCase().replace(/\s/g, '_')}_vs_${m.awayTeam.toLowerCase().replace(/\s/g, '_')}` === extResult.externalId
                );

                if (matchIndex !== -1 && game.matches[matchIndex].result === null) {
                    if (['1', 'X', '2'].includes(extResult.result)) {
                        game.matches[matchIndex].result = extResult.result;
                        updatedResultsCount++;
                        logger.info(`Updated result for match ${game.matches[matchIndex].homeTeam} vs ${game.matches[matchIndex].awayTeam} to ${extResult.result}`);
                    } else if (extResult.result === 'CANCELLED') {
                        game.matches[matchIndex].isCancelled = true;
                        cancelledMatchesCount++;
                        logger.info(`Marked match ${game.matches[matchIndex].homeTeam} vs ${game.matches[matchIndex].awayTeam} as cancelled.`);
                    }
                }
            }
            await game.save();
            // پس از به‌روزرسانی نتایج، می‌توانید منطق امتیازدهی را فراخوانی کنید
            // اما بهتر است این کار در یک cron job جداگانه یا توسط ادمین انجام شود تا کنترل بیشتری داشته باشید.
            // await processTotoGameResults(game._id); // این را اینجا فراخوانی نکنید، در کنترلر ادمین یا یک cron job جداگانه
        }
        logger.info(`Result synchronization completed. Updated results: ${updatedResultsCount}, Cancelled matches: ${cancelledMatchesCount}`);
        return { success: true, message: `همگام‌سازی نتایج با موفقیت انجام شد. ${updatedResultsCount} نتیجه به‌روزرسانی شد، ${cancelledMatchesCount} بازی لغو شد.` };
    } catch (error) {
        logger.error(`Error during result synchronization: ${error.message}`);
        return { success: false, message: `خطا در همگام‌سازی نتایج: ${error.message}` };
    }
};

module.exports = {
    syncGamesWithExternalAPI,
    syncResultsWithExternalAPI
};