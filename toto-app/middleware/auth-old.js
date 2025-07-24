// middleware/auth.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.userId).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'کاربر یافت نشد' });
            }

            next();
        } catch (error) {
            return res.status(401).json({ message: 'توکن نامعتبر است' });
        }
    } else {
        return res.status(401).json({ message: 'توکن ارسال نشده است' });
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

module.exports = { protect, authorize };
