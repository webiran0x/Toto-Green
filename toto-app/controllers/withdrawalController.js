// toto-app/controllers/withdrawalController.js
// کنترلر برای مدیریت درخواست‌های برداشت وجه توسط ادمین

const asyncHandler = require('express-async-handler'); // اضافه شد
const WithdrawalRequest = require('../models/WithdrawalRequest');
const User = require('../models/User');
const Transaction = require('../models/Transaction'); // استفاده از مدل جامع Transaction
const logger = require('../utils/logger');
const shkeeperService = require('../services/shkeeperService'); // برای انجام Payout واقعی

// @desc    دریافت تمام درخواست‌های برداشت وجه (برای ادمین)
// @route   GET /api/admin/withdrawals
// @access  Private/Admin
const getAllWithdrawalRequests = asyncHandler(async (req, res) => {
    try {
        const requests = await WithdrawalRequest.find({})
            .populate('user', 'username email balance') // اطلاعات کاربر درخواست‌دهنده
            .populate('processedBy', 'username') // اطلاعات ادمین پردازش‌کننده
            .sort({ createdAt: -1 }); // جدیدترین درخواست‌ها ابتدا نمایش داده شوند
        logger.info(`Admin fetched all withdrawal requests. Found ${requests.length} requests.`);
        res.json(requests);
    } catch (error) {
        logger.error(`Error fetching all withdrawal requests: ${error.message}`);
        res.status(500).json({ message: 'خطا در دریافت درخواست‌های برداشت وجه.' });
    }
});

// @desc    تایید درخواست برداشت وجه (توسط ادمین)
// @route   PUT /api/admin/withdrawals/:id/approve
// @access  Private/Admin
const approveWithdrawalRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body; // یادداشت‌های اختیاری ادمین

    try {
        const request = await WithdrawalRequest.findById(id).populate('user');

        if (!request) {
            logger.error(`Attempt to approve non-existent withdrawal request ID: ${id}`);
            return res.status(404).json({ message: 'درخواست برداشت یافت نشد.' });
        }

        if (request.status !== 'pending') {
            logger.warn(`Admin tried to approve withdrawal request ID ${id} which is already ${request.status}.`);
            return res.status(400).json({ message: `این درخواست قبلاً ${request.status} شده است.` });
        }

        const user = request.user;
        if (!user) {
            logger.error(`User not found for withdrawal request ID: ${id}`);
            return res.status(404).json({ message: 'کاربر مرتبط با این درخواست یافت نشد.' });
        }

        // **مهم:** موجودی کاربر در زمان ثبت درخواست برداشت در userController.js کسر شده است.
        // اینجا فقط وضعیت را به 'approved' تغییر می‌دهیم و Payout را انجام می‌دهیم.

        // انجام Payout واقعی از طریق SHKeeper
        let shkeeperCryptoName;
        // فرض می‌کنیم برداشت‌ها فقط USDT هستند و شبکه از request.network می‌آید
        if (request.network === 'TRC20') shkeeperCryptoName = 'TRX-USDT';
        else if (request.network === 'BEP20') shkeeperCryptoName = 'BNB-USDT';
        else if (request.network === 'ERC20') shkeeperCryptoName = 'ETH-USDT';
        else {
            logger.error(`Unsupported network ${request.network} for SHKeeper payout for request ${id}.`);
            return res.status(400).json({ message: 'شبکه برداشت پشتیبانی نمی‌شود.' });
        }

        const payoutResponse = await shkeeperService.createPayoutTask(
            shkeeperCryptoName,
            request.amount,
            request.walletAddress,
            0 // فرض می‌کنیم SHKeeper کارمزد را خودکار تعیین می‌کند یا 0 است. باید بر اساس مستندات SHKeeper تنظیم شود.
        );

        if (!payoutResponse || payoutResponse.task_id === undefined) {
            logger.error(`SHKeeper Payout failed for request ${id}: ${JSON.stringify(payoutResponse)}`);
            // اگر Payout ناموفق بود، وضعیت درخواست را به 'failed' تغییر دهید و مبلغ را به کاربر برگردانید
            user.balance += request.amount; // بازگرداندن مبلغ
            await user.save();
            request.status = 'failed';
            request.notes = `SHKeeper Payout failed. Funds refunded. Admin notes: ${notes || 'N/A'}`;
            await request.save();

            // ثبت تراکنش بازپرداخت
            await Transaction.create({
                user: user._id,
                amount: request.amount,
                type: 'refund',
                method: 'system',
                status: 'completed',
                description: `بازپرداخت مبلغ ${request.amount} USDT به دلیل عدم موفقیت Payout SHKeeper برای درخواست برداشت ${request._id}`,
                relatedEntity: request._id,
                relatedEntityType: 'WithdrawalRequest'
            });
            return res.status(500).json({ message: 'خطا در انجام Payout توسط SHKeeper. مبلغ به حساب کاربر بازگردانده شد.' });
        }

        request.status = 'approved';
        request.processedBy = req.user._id; // ادمین فعلی
        request.processedAt = new Date();
        request.notes = notes || request.notes; // به‌روزرسانی یادداشت‌ها
        request.shkeeperTaskId = payoutResponse.task_id; // ذخیره Task ID از SHKeeper
        await request.save();

        // به‌روزرسانی تراکنش 'withdrawal' به 'completed' و اضافه کردن جزئیات SHKeeper
        const withdrawalTransaction = await Transaction.findOne({
            user: user._id,
            type: 'withdrawal',
            relatedEntity: request._id,
            status: 'pending' // پیدا کردن تراکنش pending مرتبط
        });

        if (withdrawalTransaction) {
            withdrawalTransaction.status = 'completed';
            withdrawalTransaction.cryptoDetails.shkeeperTaskId = payoutResponse.task_id;
            // shkeeperPayoutStatus را می‌توان بعداً از طریق وب‌هوک SHKeeper برای Payout به‌روز کرد (اگر SHKeeper وب‌هوک برای Payout داشته باشد)
            await withdrawalTransaction.save();
        } else {
            logger.warn(`No pending withdrawal transaction found for request ID ${request._id}. Creating new completed transaction.`);
            // اگر تراکنش پیدا نشد، یک جدید ایجاد کنید (سناریوی بعید)
            await Transaction.create({
                user: user._id,
                amount: -request.amount,
                type: 'withdrawal',
                method: 'crypto',
                status: 'completed',
                description: `برداشت ${request.amount} USDT (تایید ادمین). SHKeeper Task ID: ${payoutResponse.task_id}`,
                relatedEntity: request._id,
                relatedEntityType: 'WithdrawalRequest',
                cryptoDetails: {
                    cryptoCurrency: `USDT-${request.network}`,
                    walletAddress: request.walletAddress,
                    shkeeperTaskId: payoutResponse.task_id,
                    shkeeperPayoutStatus: 'PENDING' // وضعیت اولیه Payout
                }
            });
        }


        logger.info(`Withdrawal request ID ${id} for user ${user.username} (amount: ${request.amount} USDT) approved by admin ${req.user.username}. SHKeeper Task ID: ${payoutResponse.task_id}`);
        res.json({ message: 'درخواست برداشت با موفقیت تایید و Payout به SHKeeper ارسال شد.', request });

    } catch (error) {
        logger.error(`Error approving withdrawal request ID ${id}: ${error.message}`);
        res.status(500).json({ message: error.message || 'خطا در تایید درخواست برداشت.' });
    }
});

// @desc    رد درخواست برداشت وجه (توسط ادمین)
// @route   PUT /api/admin/withdrawals/:id/reject
// @access  Private/Admin
const rejectWithdrawalRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body; // یادداشت‌های ادمین (الزامی برای رد کردن)

    if (!notes || notes.trim() === '') {
        return res.status(400).json({ message: 'لطفاً دلیل رد درخواست را در یادداشت‌ها ذکر کنید.' });
    }

    try {
        const request = await WithdrawalRequest.findById(id).populate('user');

        if (!request) {
            logger.error(`Attempt to reject non-existent withdrawal request ID: ${id}`);
            return res.status(404).json({ message: 'درخواست برداشت یافت نشد.' });
        }

        if (request.status !== 'pending') {
            logger.warn(`Admin tried to reject withdrawal request ID ${id} which is already ${request.status}.`);
            return res.status(400).json({ message: `این درخواست قبلاً ${request.status} شده است.` });
        }

        const user = request.user;
        if (!user) {
            logger.error(`User not found for withdrawal request ID: ${id}`);
            return res.status(404).json({ message: 'کاربر مرتبط با این درخواست یافت نشد.' });
        }

        // بازگرداندن مبلغ به موجودی کاربر
        user.balance += request.amount;
        await user.save();

        request.status = 'rejected';
        request.processedBy = req.user._id; // ادمین فعلی
        request.processedAt = new Date();
        request.notes = notes; // ذخیره دلیل رد
        await request.save();

        // به‌روزرسانی تراکنش 'withdrawal' به 'cancelled' یا 'failed'
        const withdrawalTransaction = await Transaction.findOne({
            user: user._id,
            type: 'withdrawal',
            relatedEntity: request._id,
            status: 'pending' // پیدا کردن تراکنش pending مرتبط
        });

        if (withdrawalTransaction) {
            withdrawalTransaction.status = 'cancelled'; // یا 'failed'
            withdrawalTransaction.description = `درخواست برداشت رد شد. مبلغ ${request.amount} USDT به حساب بازگردانده شد. دلیل: ${notes}`;
            await withdrawalTransaction.save();
        } else {
            logger.warn(`No pending withdrawal transaction found for request ID ${request._id} during rejection. Creating new refund transaction.`);
            // اگر تراکنش پیدا نشد، یک تراکنش بازپرداخت جدید ایجاد کنید
            await Transaction.create({
                user: user._id,
                amount: request.amount,
                type: 'refund',
                method: 'system',
                status: 'completed',
                description: `بازپرداخت مبلغ ${request.amount} USDT به دلیل رد درخواست برداشت به آدرس ${request.walletAddress}. دلیل: ${notes}`,
                relatedEntity: request._id,
                relatedEntityType: 'WithdrawalRequest'
            });
        }

        logger.info(`Withdrawal request ID ${id} for user ${user.username} (amount: ${request.amount} USDT) rejected by admin ${req.user.username}. Funds refunded.`);
        res.json({ message: 'درخواست برداشت با موفقیت رد و مبلغ به حساب کاربر بازگردانده شد.', request });

    } catch (error) {
        logger.error(`Error rejecting withdrawal request ID ${id}: ${error.message}`);
        res.status(500).json({ message: 'خطا در رد درخواست برداشت.' });
    }
});

module.exports = {
    getAllWithdrawalRequests,
    approveWithdrawalRequest,
    rejectWithdrawalRequest
};
