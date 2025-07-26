// middleware/authMiddleware.js
console.log('AUTHMIDDLEWARE.JS: Starting authMiddleware loading...');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  let token;

  // --- اضافه شد: لاگ برای بررسی کوکی‌های دریافتی ---
  console.log('AuthMiddleware: Request URL:', req.originalUrl);
  console.log('AuthMiddleware: Received Headers:', req.headers);
  console.log('AuthMiddleware: Received Cookies (req.cookies):', req.cookies);
  // --- پایان لاگ اضافه شد ---

  // 1. Check for token in cookies (highest priority)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log('AuthMiddleware: Token found in cookies.');
  }
  // 2. Check for token in Authorization header (fallback for API clients)
  else if (req.header('Authorization') && req.header('Authorization').startsWith('Bearer')) {
    token = req.header('Authorization').split(' ')[1];
    console.log('AuthMiddleware: Token found in Authorization header.');
  }

  if (!token) {
    logger.warn('Auth attempt: No token found in cookies or Authorization header. Authorization denied.');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
  if (!token || typeof token !== 'string' || token === 'from-cookie' || token === 'null' || token.trim() === '') {
    throw new Error('Invalid token format');
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('AuthMiddleware: Token successfully decoded. User ID:', decoded.userId);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      logger.warn(`User not found for token ID: ${decoded.userId}. Token might be valid but user deleted.`);
      return res.status(401).json({ message: 'Token is valid but user not found' });
    }

    req.user = user;
    console.log(`AuthMiddleware: User ${user.username} (ID: ${user._id}) authenticated.`);
    next();
  } catch (err) {
    logger.error('Token verification failed:', err.message);
    // If token is invalid or expired, clear the cookie to force re-login
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Only clear securely if in production
        sameSite: 'Lax', // Must match sameSite setting when cookie was set
        domain: process.env.COOKIE_DOMAIN // Must match domain setting when cookie was set
    });
    res.status(401).json({ message: 'Token is not valid or expired' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'دسترسی غیرمجاز' });
    }
    next();
  };
};

console.log('AUTHMIDDLEWARE.JS: Exporting functions. Type of protect:', typeof protect);
module.exports = { protect, authorize };
console.log('AUTHMIDDLEWARE.JS: Finished authMiddleware loading.');
