// toto-app/models/TotoGame.js
// مدل بازی Toto (TotoGame Model)

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
    },
    isCancelled: { // آیا این بازی لغو شده یا به تعویق افتاده است؟
        type: Boolean,
        default: false
    }
});

const totoGameSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    matches: { // آرایه‌ای از ۱۵ بازی
        type: [matchSchema],
        validate: {
            validator: function (v) {
                return v.length === 15; // اطمینان از اینکه دقیقا ۱۵ بازی وجود دارد
            },
            message: props => `${props.value.length} matches provided, but exactly 15 are required!`
        }
    },
    deadline: { // مهلت نهایی برای ثبت فرم‌ها
        type: Date,
        required: true
    },
    status: { // وضعیت بازی: 'open', 'closed', 'completed', 'cancelled'
        type: String,
        enum: ['open', 'closed', 'completed', 'cancelled'],
        default: 'open'
    },
    totalPot: { // مجموع کل مبالغ جمع شده از پیش‌بینی‌ها برای این بازی
        type: Number,
        default: 0
    },
    commissionAmount: { // میزان کمیسیون کسر شده (۱۵ درصد)
        type: Number,
        default: 0
    },
    prizePool: { // مبلغ نهایی قابل توزیع بین برندگان (کل مبلغ - کمیسیون)
        type: Number,
        default: 0
    },
    prizes: { // ساختار جوایز (درصدی)
        firstPlace: { type: Number, default: 0 }, // 70% از prizePool
        secondPlace: { type: Number, default: 0 }, // 20% از prizePool
        thirdPlace: { type: Number, default: 0 }  // 10% از prizePool
    },
    winners: { // اطلاعات برندگان پس از محاسبه نهایی
        first: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        second: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        third: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    },
    isRefunded: { // آیا مبلغ فرم‌های این بازی به کاربران بازگردانده شده است؟
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const TotoGame = mongoose.model('TotoGame', totoGameSchema);

module.exports = TotoGame;