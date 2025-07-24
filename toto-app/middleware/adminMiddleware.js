// backend/middleware/adminMiddleware.js
// میان‌افزار برای بررسی نقش ادمین کاربر

const logger = require('../utils/logger');

const authorize = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.error('Admin middleware executed without user in request. Check middleware order.');
      return res.status(500).json({ message: 'Server error: User not authenticated properly.' });
    }

    if (req.user.role !== role) {
      logger.warn(`Access denied for user ${req.user.username} (ID: ${req.user.id}). Role is not ${role}.`);
      return res.status(403).json({ message: 'Access denied: You are not authorized.' });
    }

    next();
  };
};

module.exports = { authorize };

