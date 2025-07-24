// toto-app/controllers/authController.js
// کنترلر برای مدیریت احراز هویت کاربر (ثبت نام و ورود)

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger'); // سیستم لاگ‌گیری

// @desc    ثبت نام کاربر جدید
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  const { username, email, password, referrerUsername } = req.body;

  try {
    // بررسی وجود کاربر
    let user = await User.findOne({ username });
    if (user) {
      logger.warn(`Registration attempt with existing username: ${username}`);
      return res.status(400).json({ message: 'نام کاربری قبلاً استفاده شده است.' });
    }

    user = await User.findOne({ email });
    if (user) {
      logger.warn(`Registration attempt with existing email: ${email}`);
      return res.status(400).json({ message: 'ایمیل قبلاً استفاده شده است.' });
    }

    // پیدا کردن معرف (اگر وجود دارد)
    let referrer = null;
    if (referrerUsername) {
      referrer = await User.findOne({ username: referrerUsername });
      if (!referrer) {
        logger.warn(`Referrer username '${referrerUsername}' not found for new user ${username}.`);
        // می‌توانید تصمیم بگیرید که آیا ثبت نام را متوقف کنید یا بدون معرف ادامه دهید
        // در اینجا، ثبت نام بدون معرف ادامه پیدا می‌کند
      }
    }

    // هش کردن رمز عبور
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(password, salt);

    // ایجاد کاربر جدید
    user = new User({
      username,
      email,
      password,
      referrer: referrer ? referrer._id : null, // ذخیره ID معرف
    });

    await user.save();
    logger.info(`New user registered: ${username} (ID: ${user._id}). Referrer: ${referrerUsername || 'None'}`);

    // ایجاد توکن JWT (اختیاری: می‌توانید پس از ثبت نام بلافاصله لاگین کنید)
    const token = jwt.sign(
      { userId: user._id, role: user.role }, // <--- اطمینان حاصل کنید که 'userId' در اینجا وجود دارد
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      message: 'ثبت نام با موفقیت انجام شد.',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Error during user registration:', error);
    res.status(500).json({ message: 'خطا در ثبت نام کاربر.' });
  }
};

// @desc    ورود کاربر
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    // بررسی وجود کاربر
    const user = await User.findOne({ username });
    if (!user) {
      logger.warn(`Login attempt failed: Username not found - ${username}`);
      return res.status(400).json({ message: 'نام کاربری یا رمز عبور اشتباه است.' });
    }

    // بررسی رمز عبور
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(`Login attempt failed: Incorrect password for user - ${username}`);
      return res.status(400).json({ message: 'نام کاربری یا رمز عبور اشتباه است.' });
    }

    // بررسی وضعیت کاربر (فعال/مسدود/معلق)
    if (user.status === 'blocked') {
      logger.warn(`Login attempt failed: User ${username} is blocked.`);
      return res.status(403).json({ message: 'حساب کاربری شما مسدود شده است. لطفاً با پشتیبانی تماس بگیرید.' });
    }
    if (user.status === 'suspended') {
      logger.warn(`Login attempt failed: User ${username} is suspended.`);
      return res.status(403).json({ message: 'حساب کاربری شما معلق شده است. لطفاً با پشتیبانی تماس بگیرید.' });
    }

    // ایجاد توکن JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role }, // <--- اطمینان حاصل کنید که 'userId' در اینجا وجود دارد
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // توکن به مدت 1 ساعت معتبر است
    );

    logger.info(`User logged in: ${username} (ID: ${user._id})`);

    res.status(200).json({
      message: 'ورود موفقیت‌آمیز.',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        balance: user.balance,
        score: user.score,
      },
    });
  } catch (error) {
    logger.error('Error during user login:', error);
    res.status(500).json({ message: 'خطا در ورود کاربر.' });
  }
};
