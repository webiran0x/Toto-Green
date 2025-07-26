// toto-app/routes/authRoutes.js
const express = require('express');
const { registerUser, loginUser, logoutUser } = require('../controllers/authController'); // اضافه شدن logoutUser
const { protect } = require('../middleware/authMiddleware'); // اضافه شدن protect برای مسیر خروج

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', protect, logoutUser); // مسیر خروج، محافظت شده تا فقط کاربران لاگین شده بتوانند خارج شوند

module.exports = router;
