const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', // توکن به مدت 30 روز معتبر است
    });
};

module.exports = generateToken;