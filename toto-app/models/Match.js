const mongoose = require('mongoose');

const matchSchema = mongoose.Schema({
    homeTeam: {
        type: String,
        required: true
    },
    awayTeam: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    result: { // نتیجه نهایی بازی: '1' (برد تیم میزبان), 'X' (مساوی), '2' (برد تیم میهمان)
        type: String,
        enum: ['1', 'X', '2', null], // null به معنای هنوز مشخص نشده
        default: null
    },
    isClosed: { // آیا فرم‌های این بازی بسته شده‌اند؟
        type: Boolean,
        default: false
    }
});

module.exports = matchSchema;