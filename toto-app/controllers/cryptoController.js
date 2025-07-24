// backend/controllers/cryptoController.js
// کنترلر برای مدیریت واریزهای ارز دیجیتال

const User = require('../models/User');
const CryptoDeposit = require('../models/CryptoDeposit');
const Transaction = require('../models/Transaction');
const logger = require('../config/logger'); // <--- مسیر logger اصلاح شد
const axios = require('axios'); // برای فراخوانی API SHKeeper

// تولید آدرس ساختگی برای تست (در محیط واقعی باید به سرویس بلاکچین متصل شوید)
const generateMockAddress = (network) => {
  switch (network) {
    case 'TRC20':
      return `TVf${Math.random().toString(36).substring(2, 42)}`;
    case 'BEP20':
      return `0x${Math.random().toString(36).substring(2, 42).padEnd(40, '0')}`;
    case 'ERC20':
      return `0x${Math.random().toString(36).substring(2, 42).padEnd(40, '0')}`;// Corrected padEnd length
    default:
      return '';
  }
};

exports.generateDepositAddress = async (req, res) => {
  const { currency, network, expectedAmount } = req.body; // اضافه شدن expectedAmount
  const userId = req.user.id;

  if (!currency || !network || !expectedAmount) {
    return res.status(400).json({ message: 'Currency, network, and expected amount are required.' });
  }

  if (currency !== 'USDT' || !['TRC20', 'BEP20', 'ERC20'].includes(network)) {
    return res.status(400).json({ message: 'Unsupported currency or network.' });
  }

  try {
    let cryptoDeposit = await CryptoDeposit.findOne({
      user: userId,
      currency,
      network,
      status: 'pending' // فقط درخواست‌های در انتظار را پیدا کند
    });

    if (cryptoDeposit && cryptoDeposit.depositAddress) {
      // اگر یک درخواست در انتظار موجود است، همان آدرس را برگردانید
      logger.info(`User ${req.user.username} (ID: ${userId}) retrieved existing pending deposit address for ${currency} on ${network}.`);
      return res.status(200).json({
        message: 'Existing deposit address retrieved.',
        depositAddress: cryptoDeposit.depositAddress,
        expectedAmount: cryptoDeposit.expectedAmount,
        shkeeperDepositId: cryptoDeposit.shkeeperDepositId,
        status: cryptoDeposit.status
      });
    }

    // اگر درخواست در انتظاری وجود ندارد یا آدرس ندارد، یک درخواست جدید به SHKeeper ارسال کنید
    const shkeeperApiUrl = `${process.env.SHKEEPER_BASE_URL}invoices`;
    const shkeeperApiKey = process.env.SHKEEPER_API_KEY;
    const shkeeperCallbackUrl = process.env.SHKEEPER_CALLBACK_URL; // <--- این آدرس را از .env می‌خوانیم

    // <--- اضافه شد: لاگ کردن آدرس کال‌بکی که به SHKeeper ارسال می‌شود
    logger.info(`Sending SHKeeper invoice creation request with callback_url: ${shkeeperCallbackUrl}`);

    if (!shkeeperApiKey || !shkeeperCallbackUrl) {
      logger.error('SHKEEPER_API_KEY or SHKEEPER_CALLBACK_URL is not set in environment variables.');
      return res.status(500).json({ message: 'Server configuration error: SHKeeper API keys not set.' });
    }

    const shkeeperPayload = {
      external_id: new mongoose.Types.ObjectId(), // یک ID منحصر به فرد برای SHKeeper
      crypto_name: currency, // نام ارز دیجیتال
      fiat: 'USD', // فرض می‌کنیم همیشه USD است
      amount: expectedAmount.toString(), // مبلغ به صورت رشته
      callback_url: shkeeperCallbackUrl // آدرس کال‌بک
    };

    logger.info(`Sending payload to SHKeeper: ${JSON.stringify(shkeeperPayload)}`);

    const shkeeperResponse = await axios.post(shkeeperApiUrl, shkeeperPayload, {
      headers: {
        'X-Shkeeper-Api-Key': shkeeperApiKey,
        'Content-Type': 'application/json'
      }
    });

    const shkeeperData = shkeeperResponse.data;

    if (shkeeperData.status === 'success' && shkeeperData.wallet) {
      // ذخیره اطلاعات در دیتابیس خودمان
      cryptoDeposit = await CryptoDeposit.create({
        user: userId,
        currency,
        network,
        depositAddress: shkeeperData.wallet,
        expectedAmount,
        shkeeperDepositId: shkeeperData.id, // شناسه اینویس SHKeeper
        status: 'pending',
        description: `Waiting for ${expectedAmount} ${currency} deposit on ${network}.`
      });

      logger.info(`SHKeeper invoice created successfully for user ${req.user.username} (ID: ${userId}). Deposit ID: ${cryptoDeposit._id}, Address: ${shkeeperData.wallet}`);
      res.status(201).json({
        message: 'Deposit address generated.',
        depositAddress: shkeeperData.wallet,
        expectedAmount: cryptoDeposit.expectedAmount,
        shkeeperDepositId: shkeeperData.id,
        status: cryptoDeposit.status
      });
    } else {
      logger.error(`Failed to generate SHKeeper deposit address for user ${userId}. SHKeeper response: ${JSON.stringify(shkeeperData)}`);
      res.status(500).json({ message: 'Failed to generate deposit address from SHKeeper.' });
    }

  } catch (error) {
    logger.error(`Error in generateDepositAddress for user ${req.user.username} (ID: ${userId}): ${error.message}. Stack: ${error.stack}`);
    // اگر خطای Axios باشد، جزئیات پاسخ را لاگ کنید
    if (error.response) {
      logger.error(`SHKeeper API Error Response: Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
    }
    res.status(500).json({ message: 'Server error generating deposit address.' });
  }
};

// @desc    هندل کردن وب‌هوک بلاک‌چین از SHKeeper
// @route   POST /api/crypto/webhook
// @access  Public (فقط توسط SHKeeper فراخوانی می‌شود)
exports.handleBlockchainWebhook = async (req, res) => {
  // این تابع باید منطق پردازش وب‌هوک SHKeeper را داشته باشد
  // این تابع در shkeeperWebhookController.js پیاده‌سازی شده است.
  // این مسیر به shkeeperWebhookRoutes.js منتقل شده است.
  res.status(400).json({ message: 'This endpoint is deprecated. Use /api/shkeeper/webhook/callback instead.' });
};


// @desc    دریافت تمام واریزهای رمزارزی (برای ادمین)
// @route   GET /api/crypto-deposits
// @access  Private/Admin
exports.getAllCryptoDeposits = async (req, res) => {
  try {
    const deposits = await CryptoDeposit.find({}).populate('user', 'username email').sort({ createdAt: -1 });
    res.json(deposits);
  } catch (error) {
    logger.error(`Error fetching all crypto deposits: ${error.message}`);
    res.status(500).json({ message: 'Server error fetching crypto deposits.' });
  }
};

// @desc    به‌روزرسانی وضعیت واریز رمزارزی (توسط ادمین)
// @route   PUT /api/crypto-deposits/:id/status
// @access  Private/Admin
exports.updateCryptoDepositStatus = async (req, res) => {
  const { id } = req.params;
  const { status, isProcessed, actualAmount } = req.body;

  try {
    const deposit = await CryptoDeposit.findById(id);
    if (!deposit) {
      return res.status(404).json({ message: 'Crypto deposit not found.' });
    }

    // فقط ادمین می‌تواند وضعیت را تغییر دهد
    if (status) deposit.status = status;
    if (typeof isProcessed === 'boolean') deposit.isProcessed = isProcessed;
    if (actualAmount) deposit.actualAmount = actualAmount;

    // اگر ادمین آن را به عنوان پردازش شده و تأیید شده علامت‌گذاری کند و قبلاً پردازش نشده باشد
    if (isProcessed === true && !deposit.isProcessed && deposit.status === 'confirmed') {
      const user = await User.findById(deposit.user); // از deposit.user استفاده کنید
      if (user) {
        user.balance += deposit.actualAmount;
        await user.save();

        const transaction = new Transaction({
          user: user._id,
          amount: deposit.actualAmount,
          type: 'deposit',
          method: 'crypto', // یا 'manual'
          status: 'completed',
          description: `Crypto Deposit (Admin Confirmed) - ${deposit.currency} on ${deposit.network}`,
          relatedEntity: deposit._id,
          relatedEntityType: 'CryptoDeposit'
        });
        await transaction.save();

        logger.info(`Admin manually processed crypto deposit ${id} for user ${user.username}. New balance: ${user.balance}`);
      } else {
        logger.error(`User ${deposit.user} not found when admin processing deposit ${id}`);
      }
    }

    await deposit.save();
    return res.status(200).json({ message: 'Crypto deposit updated successfully', deposit });
  } catch (error) {
    logger.error(`Error updating crypto deposit ${id} status:`, error);
    return res.status(500).json({ message: 'Server error updating crypto deposit status.' });
  }
};
