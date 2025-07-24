// middleware/authMiddleware.js
console.log('AUTHMIDDLEWARE.JS: Starting authMiddleware loading...');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    logger.warn('Auth attempt without Authorization header');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    logger.warn('Auth attempt with malformed Authorization header');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      logger.warn(`User not found for token ID: ${decoded.userId}`);
      return res.status(401).json({ message: 'Token is valid but user not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    logger.error('Token verification failed:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
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
