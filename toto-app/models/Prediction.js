// toto-app/models/Prediction.js
// مدل پیش‌بینی کاربر (Prediction Model)

const mongoose = require('mongoose');

// تعریف یک زیر-اسکیما برای هر پیش‌بینی بازی در داخل پیش‌بینی اصلی
const matchPredictionSchema = mongoose.Schema({
    matchId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Match' // ارجاع به مدل Match یا زیر-سند Match در TotoGame
    },
    chosenOutcome: { // آرایه‌ای از نتایج انتخاب شده برای این بازی خاص (مثلاً ['1'], ['X'], ['1', 'X'])
        type: [String],
        validate: {
            validator: function (v) {
                // اطمینان از اینکه هر انتخاب معتبر است ('1', 'X', '2')
                return v.every(p => ['1', 'X', '2'].includes(p));
            },
            message: props => `${props.value} is not a valid outcome. Must be '1', 'X', or '2'.`
        },
        required: true
    }
});

const predictionSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    totoGame: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'TotoGame'
    },
    predictions: { // این باید آرایه‌ای از matchPredictionSchema باشد
        type: [matchPredictionSchema], // <--- اصلاح شد: تغییر به آرایه‌ای از matchPredictionSchema
        validate: {
            validator: function (v) {
                // اطمینان از اینکه دقیقاً ۱۵ پیش‌بینی بازی وجود دارد
                return v.length === 15;
            },
            message: props => `${props.value.length} match predictions provided, but exactly 15 are required!`
        },
        required: true
    },
    price: { // مبلغ فرم (مثلاً 10 USDT)
        type: Number,
        required: true
    },
    isScored: { // آیا این پیش‌بینی امتیازدهی شده است؟
        type: Boolean,
        default: false
    },
    score: { // امتیاز کاربر برای این پیش‌بینی
        type: Number,
        default: 0
    },
    isRefunded: { // آیا این پیش‌بینی به دلیل لغو بازی بازپرداخت شده است؟
        type: Boolean,
        default: false
    },
    formId: { // شناسه منحصر به فرد برای هر فرم پیش‌بینی
        type: String,
        required: true,
        unique: true,
        trim: true
    }
}, {
    timestamps: true
});

const Prediction = mongoose.model('Prediction', predictionSchema);

module.exports = Prediction;
