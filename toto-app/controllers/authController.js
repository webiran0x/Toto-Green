// toto-app/controllers/authController.js
// کنترلر برای مدیریت احراز هویت کاربر (ثبت نام، ورود و خروج)

const User = require('../models/User');
const bcrypt = require('bcryptjs'); // برای مقایسه رمز عبور
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { registerSchema, loginSchema } = require('../validation/authValidation');
const asyncHandler = require('express-async-handler'); // ایمپورت asyncHandler برای مدیریت خطاهای async/await

// ثبت کوکی JWT در پاسخ
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '1h' } // از JWT_EXPIRE در .env استفاده کنید
  );

  // محاسبه تاریخ انقضا کوکی بر اساس JWT_COOKIE_EXPIRE_MS
  // اگر JWT_COOKIE_EXPIRE_MS تعریف نشده باشد، پیش‌فرض 1 ساعت (3600000 میلی‌ثانیه) است.
  const cookieExpireMs = parseInt(process.env.JWT_COOKIE_EXPIRE_MS, 10) || 3600000; // 1 hour in ms
  
  const options = {
    // مدت زمان انقضا کوکی باید با مدت زمان انقضا JWT هماهنگ باشد
    expires: new Date(Date.now() + cookieExpireMs),
    httpOnly: true, // کوکی فقط از طریق HTTP/S قابل دسترسی است، نه JavaScript سمت کلاینت
    secure: process.env.NODE_ENV === 'production' || process.env.USE_HTTPS_FOR_DEV === 'true', // فقط در HTTPS ارسال شود
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // SameSite policy برای SSO، در production باید 'None' باشد
    
    // تنظیم دامنه کوکی برای Single Sign-On (SSO)
    // این دامنه باید دامنه اصلی شما باشد (مثلاً '.yourdomain.com')
    // اگر در توسعه هستید و COOKIE_DOMAIN تنظیم نشده، آن را حذف می‌کنیم تا روی localhost کار کند.
    domain: process.env.COOKIE_DOMAIN,
  };

  // در محیط توسعه، اگر COOKIE_DOMAIN تعریف نشده باشد، آن را حذف کنید تا روی localhost کار کند
  if (process.env.NODE_ENV === 'development' && !process.env.COOKIE_DOMAIN) {
    delete options.domain;
  }

  res.cookie('token', token, options);
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
  });
};

// @desc    ثبت نام کاربر جدید
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = asyncHandler(async (req, res) => { // استفاده از asyncHandler
  // Step 1: اعتبار سنجی ورودی با استفاده از Joi
  const { error } = registerSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(err => err.message);
    logger.warn(`Validation error during registration: ${errors.join(', ')}`);
    return res.status(400).json({ message: 'خطای اعتبار سنجی', errors });
  }

  const { username, email, password, referrerUsername } = req.body;

  // Check if user already exists by username or email
  const userExists = await User.findOne({ $or: [{ username }, { email }] });
  if (userExists) {
    logger.warn(`Registration failed: username '${username}' or email '${email}' already exists.`);
    return res.status(400).json({ message: 'کاربری با این نام کاربری یا ایمیل از قبل وجود دارد.' });
  }

  let referrer = null;
  if (referrerUsername) {
    referrer = await User.findOne({ username: referrerUsername });
    if (!referrer) {
      logger.warn(`Referrer not found: ${referrerUsername}`);
      return res.status(400).json({ message: 'نام کاربری ارجاع‌دهنده یافت نشد.' });
    }
  }

  const user = new User({
    username,
    email,
    password, // هش کردن رمز عبور در pre-save hook مدل User انجام می‌شود
    referrer: referrer ? referrer._id : null,
  });

  await user.save();
  logger.info(`User registered: ${user.username} (ID: ${user._id})`);

  sendTokenResponse(user, 201, res);
});

// @desc    ورود کاربر
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = asyncHandler(async (req, res) => { // استفاده از asyncHandler
  // Step 1: اعتبار سنجی ورودی با استفاده از Joi
  const { error } = loginSchema.validate(req.body);
  if (error) {
    const errors = error.details.map(err => err.message);
    logger.warn(`Validation error during login: ${errors.join(', ')}`);
    return res.status(400).json({ message: 'خطای اعتبار سنجی', errors });
  }

  const { usernameOrEmail, password } = req.body;

  let user;
  // Check if input is email or username
  if (usernameOrEmail.includes('@')) {
    user = await User.findOne({ email: usernameOrEmail });
  } else {
    user = await User.findOne({ username: usernameOrEmail });
  }

  if (!user) {
    logger.warn(`Login failed: No user found for '${usernameOrEmail}'`);
    return res.status(401).json({ message: 'نام کاربری/ایمیل یا رمز عبور نامعتبر است.' });
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    logger.warn(`Login failed: Incorrect password for ${user.username}`);
    return res.status(401).json({ message: 'نام کاربری/ایمیل یا رمز عبور نامعتبر است.' });
  }

  if (user.status === 'blocked') {
    logger.warn(`Login failed: User ${user.username} is blocked.`);
    return res.status(403).json({ message: 'حساب کاربری شما مسدود شده است.' });
  }

  logger.info(`User logged in: ${user.username}`);
  sendTokenResponse(user, 200, res);
});

// @desc    خروج کاربر
// @route   POST /api/auth/logout
// @access  Public
exports.logoutUser = asyncHandler((req, res) => { // استفاده از asyncHandler
  const options = {
    expires: new Date(Date.now() + 10 * 1000), // کوکی بلافاصله منقضی شود (10 ثانیه)
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || process.env.USE_HTTPS_FOR_DEV === 'true',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    
    // مهم: دامنه را برای پاک کردن کوکی نیز تنظیم کنید تا SSO logout کار کند.
    // باید با دامنه‌ای که کوکی با آن تنظیم شده بود، مطابقت داشته باشد.
    domain: process.env.COOKIE_DOMAIN,
  };

  if (process.env.NODE_ENV === 'development' && !process.env.COOKIE_DOMAIN) {
    delete options.domain;
  }

  res.cookie('token', 'none', options); // توکن را به 'none' تغییر دهید و کوکی را با تاریخ انقضای کوتاه تنظیم کنید
  logger.info(`User logged out`);
  res.status(200).json({ message: 'خروج موفقیت‌آمیز.' });
});
