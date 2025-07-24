// toto-app/routes/authRoutes.js
// مسیرهای API برای احراز هویت کاربر (ثبت نام و ورود)

const express = require('express');

// وارد کردن توابع کنترلر صحیح
const { registerUser, loginUser } = require('../controllers/authController'); // <-- اصلاح شده: authUser به loginUser تغییر یافت

const router = express.Router();

// @route   POST /api/auth/register
// @desc    ثبت نام کاربر جدید
// @access  Public
router.post('/register', registerUser);

// @route   POST /api/auth/login
// @desc    ورود کاربر
// @access  Public
router.post('/login', loginUser); // <-- اصلاح شده: authUser به loginUser تغییر یافت

module.exports = router;
