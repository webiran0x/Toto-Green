// toto-app/controllers/authController.js
// کنترلر برای مدیریت احراز هویت کاربر (ثبت نام، ورود و خروج)

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger'); // سیستم لاگ‌گیری

// تابع کمکی برای تنظیم کوکی JWT
const sendTokenResponse = (user, statusCode, res) => {
  // ساخت توکن JWT با اطلاعات کاربر
  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_COOKIE_EXPIRE || '1h' } // مدت اعتبار توکن
  );

  // تنظیمات کوکی
  const options = {
    expires: new Date(Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRE_MS, 10) || 60 * 60 * 1000)), // انقضا به میلی‌ثانیه
    httpOnly: true, // کوکی فقط از طریق HTTP/S قابل دسترسی است
    secure: process.env.NODE_ENV === 'production' || process.env.USE_HTTPS_FOR_DEV === 'true', // در محیط پروداکشن یا وقتی HTTPS فعال است، secure شود
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // در پروداکشن برای کراس‌سایت None، در توسعه Lax
    domain: process.env.COOKIE_DOMAIN // دامنه کوکی برای دسترسی بین ساب‌دامین‌ها
  };

  // در حالت توسعه و اگر دامنه تنظیم نشده است، domain را حذف می‌کنیم
  if (process.env.NODE_ENV === 'development' && !process.env.COOKIE_DOMAIN) {
    delete options.domain;
  }

  // ست کردن کوکی 'token'
  res.cookie('token', token, options);

  // همچنین توکن را در پاسخ JSON بازمی‌گردانیم (اختیاری)
  // ولی معمولاً فقط کوکی کافی است و ارسال توکن در بدنه لازم نیست
  res.status(statusCode).json({
    message: statusCode === 201 ? 'ثبت نام با موفقیت انجام شد.' : 'ورود موفقیت‌آمیز.',
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      balance: user.balance,
      score: user.score,
    },
    // token // اگر لازم داری توکن در بدنه بفرستی، این خط را از حالت کامنت خارج کن
  });
};

// ثبت نام کاربر جدید
exports.registerUser = async (req, res) => {
  const { username, email, password, referrerUsername } = req.body;

  try {
    // چک کردن وجود نام کاربری
    let user = await User.findOne({ username });
    if (user) {
      logger.warn(`Registration attempt with existing username: ${username}`);
      return res.status(400).json({ message: 'نام کاربری قبلاً استفاده شده است.' });
    }

    // چک کردن وجود ایمیل
    user = await User.findOne({ email });
    if (user) {
      logger.warn(`Registration attempt with existing email: ${email}`);
      return res.status(400).json({ message: 'ایمیل قبلاً استفاده شده است.' });
    }

    // پیدا کردن معرف (در صورت وجود)
    let referrer = null;
    if (referrerUsername) {
      referrer = await User.findOne({ username: referrerUsername });
      if (!referrer) {
        logger.warn(`Referrer username '${referrerUsername}' not found for new user ${username}.`);
      }
    }

    // ایجاد کاربر جدید
    user = new User({
      username,
      email,
      password,
      referrer: referrer ? referrer._id : null,
    });

    await user.save();
    logger.info(`New user registered: ${username} (ID: ${user._id}). Referrer: ${referrerUsername || 'None'}`);

    // ارسال کوکی و پاسخ موفقیت
    sendTokenResponse(user, 201, res);
  } catch (error) {
    logger.error('Error during user registration:', error);
    res.status(500).json({ message: 'خطا در ثبت نام کاربر.' });
  }
};

// ورود کاربر
exports.loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    // یافتن کاربر با نام کاربری
    const user = await User.findOne({ username });
    if (!user) {
      logger.warn(`Login attempt failed: Username not found - ${username}`);
      return res.status(400).json({ message: 'نام کاربری یا رمز عبور اشتباه است.' });
    }

    // بررسی صحت رمز عبور
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(`Login attempt failed: Incorrect password for user - ${username}`);
      return res.status(400).json({ message: 'نام کاربری یا رمز عبور اشتباه است.' });
    }

    // چک وضعیت کاربر (مسدود یا معلق)
    if (user.status === 'blocked') {
      logger.warn(`Login attempt failed: User ${username} is blocked.`);
      return res.status(403).json({ message: 'حساب کاربری شما مسدود شده است. لطفاً با پشتیبانی تماس بگیرید.' });
    }
    if (user.status === 'suspended') {
      logger.warn(`Login attempt failed: User ${username} is suspended.`);
      return res.status(403).json({ message: 'حساب کاربری شما معلق شده است. لطفاً با پشتیبانی تماس بگیرید.' });
    }

    logger.info(`User logged in: ${username} (ID: ${user._id})`);

    // ارسال کوکی و پاسخ موفقیت
    sendTokenResponse(user, 200, res);
  } catch (error) {
    logger.error('Error during user login:', error);
    res.status(500).json({ message: 'خطا در ورود کاربر.' });
  }
};

// خروج کاربر (پاک کردن کوکی)
exports.logoutUser = (req, res) => {
  const options = {
    expires: new Date(Date.now() + 10 * 1000), // انقضا کوکی در 10 ثانیه
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || process.env.USE_HTTPS_FOR_DEV === 'true',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    domain: process.env.COOKIE_DOMAIN,
  };

  if (process.env.NODE_ENV === 'development' && !process.env.COOKIE_DOMAIN) {
    delete options.domain;
  }

  // کوکی token را به 'none' تغییر و منقضی می‌کنیم
  res.cookie('token', 'none', options);
  logger.info(`User logged out (cookie cleared).`);
  res.status(200).json({ message: 'خروج موفقیت‌آمیز.' });
};
