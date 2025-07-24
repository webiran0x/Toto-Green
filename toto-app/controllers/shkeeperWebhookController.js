const Transaction = require('../models/Transaction');
const CryptoDeposit = require('../models/CryptoDeposit');
const User = require('../models/User');
const logger = require('../utils/logger');

const shkeeperPaymentCallback = async (req, res) => {
    // <--- اصلاح شد: بررسی هدر 'x-shkeeper-api-key' به جای 'x-shkeeper-webhook-secret'
    const providedApiKey = req.headers['x-shkeeper-api-key'];
    // <--- اصلاح شد: مقایسه با SHKEEPER_API_KEY که برای ارسال درخواست‌ها استفاده می‌شود
    if (!providedApiKey || providedApiKey !== process.env.SHKEEPER_API_KEY) {
        logger.warn('SHKeeper Webhook: Unauthorized access attempt or invalid API Key.');
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const payload = req.body;
    logger.info(`SHKeeper Webhook: Received callback for external_id: ${payload.external_id}, status: ${payload.status}`);

    const externalId = payload.external_id; // این همان _id سند CryptoDeposit شماست
    const shkeeperStatus = payload.status; // وضعیت پرداخت از دید SHKeeper (PAID, PARTIAL, OVERPAID, etc.)
    const cryptoAmount = parseFloat(payload.balance_crypto); // مبلغ واقعی واریز شده
    // استفاده از .find() با .trigger: true برای یافتن تراکنش اصلی
    const triggeringTransaction = payload.transactions ? payload.transactions.find(tx => tx.trigger === true) : null;
    const transactionHash = triggeringTransaction ? triggeringTransaction.txid : null;


    try {
        logger.info(`SHKeeper Webhook: Attempting to find CryptoDeposit with ID: ${externalId}`);
        // استفاده از findById به جای findOne({ _id: externalId }) برای کارایی بهتر
        const cryptoDeposit = await CryptoDeposit.findById(externalId);
        logger.info(`SHKeeper Webhook: CryptoDeposit find result - ${cryptoDeposit ? 'Found' : 'Not Found'}. Current Status: ${cryptoDeposit ? cryptoDeposit.status : 'N/A'}. Is Processed: ${cryptoDeposit ? cryptoDeposit.isProcessed : 'N/A'}`);

        if (!cryptoDeposit) {
            logger.error(`SHKeeper Webhook: CryptoDeposit with external ID ${externalId} not found in DB.`);
            return res.status(404).json({ message: 'CryptoDeposit not found.' });
        }

        // اگر قبلاً پردازش شده، از پردازش مجدد جلوگیری کنید
        if (cryptoDeposit.isProcessed) {
            logger.warn(`SHKeeper Webhook: CryptoDeposit ${externalId} already processed. Skipping.`);
            // <--- اصلاح شد: بازگرداندن 202 Accepted حتی برای پردازش‌های تکراری
            return res.status(202).json({ message: 'Callback received and already processed.' });
        }

        // منطق پردازش بر اساس وضعیت SHKeeper
        if (shkeeperStatus === 'PAID' || shkeeperStatus === 'OVERPAID') {
            // فقط اگر وضعیت فعلی pending یا processing باشد، آن را تأیید کنید
            if (cryptoDeposit.status === 'pending' || cryptoDeposit.status === 'processing') {
                const user = await User.findById(cryptoDeposit.user);
                if (user) {
                    // اطمینان از اینکه مبلغ فقط یک بار به موجودی اضافه شود
                    user.balance += cryptoAmount;
                    await user.save();

                    // ثبت تراکنش
                    await Transaction.create({
                        user: user._id,
                        amount: cryptoAmount,
                        type: 'deposit',
                        method: 'crypto',
                        status: 'completed',
                        description: `واریز رمزارز ${cryptoAmount} ${payload.crypto} از طریق SHKeeper.`,
                        cryptoDetails: {
                            currency: payload.crypto,
                            network: cryptoDeposit.network, // شبکه از سند CryptoDeposit اصلی
                            txHash: transactionHash,
                            shkeeperInvoiceId: externalId,
                            shkeeperPaymentStatus: shkeeperStatus
                        },
                        relatedEntity: cryptoDeposit._id,
                        relatedEntityType: 'CryptoDeposit'
                    });

                    cryptoDeposit.status = 'confirmed';
                    cryptoDeposit.actualAmount = cryptoAmount;
                    cryptoDeposit.transactionHash = transactionHash;
                    cryptoDeposit.shkeeperPaymentStatus = shkeeperStatus;
                    cryptoDeposit.isProcessed = true; // علامت‌گذاری به عنوان پردازش شده
                    logger.info(`SHKeeper Webhook: User ${user.username} (ID: ${user._id}) balance updated. New balance: ${user.balance}. CryptoDeposit ${externalId} confirmed.`);
                } else {
                    logger.error(`SHKeeper Webhook: User ${cryptoDeposit.user} not found for CryptoDeposit ${externalId}. Deposit confirmed but user balance not updated.`);
                    cryptoDeposit.status = 'confirmed_user_not_found'; // وضعیت خاص برای پیگیری
                    cryptoDeposit.actualAmount = cryptoAmount;
                    cryptoDeposit.transactionHash = transactionHash;
                    cryptoDeposit.shkeeperPaymentStatus = shkeeperStatus;
                    cryptoDeposit.isProcessed = true; // هنوز هم به عنوان پردازش شده علامت‌گذاری کنید
                }
            } else {
                logger.warn(`SHKeeper Webhook: CryptoDeposit ${externalId} is already in status '${cryptoDeposit.status}'. Not updating balance.`);
            }
        } else if (shkeeperStatus === 'UNDERPAID' || shkeeperStatus === 'EXPIRED' || shkeeperStatus === 'PARTIAL') {
            logger.warn(`SHKeeper Webhook: Payment for CryptoDeposit ${externalId} failed/expired/partial. SHKeeper Status: ${shkeeperStatus}.`);
            cryptoDeposit.status = 'failed';
            cryptoDeposit.shkeeperPaymentStatus = shkeeperStatus;
            cryptoDeposit.description = `پرداخت از SHKeeper ناموفق/منقضی شد یا جزئی بود. وضعیت SHKeeper: ${shkeeperStatus}`;
            cryptoDeposit.isProcessed = true; // علامت‌گذاری به عنوان پردازش شده (حتی اگر شکست خورده باشد)
        } else if (shkeeperStatus === 'NEW') {
            logger.info(`SHKeeper Webhook: Payment for CryptoDeposit ${externalId} is new and pending. SHKeeper Status: ${shkeeperStatus}.`);
            cryptoDeposit.status = 'pending'; // یا 'processing' اگر می‌خواهید وضعیت جدیدی برای آن داشته باشید
            cryptoDeposit.shkeeperPaymentStatus = shkeeperStatus;
        } else {
            logger.info(`SHKeeper Webhook: Payment for CryptoDeposit ${externalId} is processing. SHKeeper Status: ${shkeeperStatus}.`);
            cryptoDeposit.status = 'processing';
            cryptoDeposit.shkeeperPaymentStatus = shkeeperStatus;
            cryptoDeposit.description = `پرداخت در حال پردازش توسط SHKeeper. وضعیت: ${shkeeperStatus}`;
        }

        await cryptoDeposit.save();
        // <--- اصلاح شد: بازگرداندن 202 Accepted برای موفقیت‌آمیز بودن
        res.status(202).json({ message: 'Callback received and processed' });

    } catch (error) {
        logger.error(`SHKeeper Webhook: Critical Error processing callback for external ID ${externalId}: ${error.message}. Stack: ${error.stack}`);
        res.status(500).json({ message: 'Error processing callback' });
    }
};

module.exports = {
    shkeeperPaymentCallback,
};
