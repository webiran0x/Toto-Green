// toto-app/models/Prediction.js
// مدل پیش‌بینی کاربر (User Prediction Model)

const mongoose = require('mongoose');

const predictionSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' // ارجاع به مدل کاربر
    },
    totoGame: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'TotoGame' // ارجاع به مدل بازی Toto
    },
    predictions: [{ // آرایه‌ای از پیش‌بینی‌ها برای هر بازی
        matchId: { // شناسه بازی (از TotoGame.matches._id)
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        chosenOutcome: { // نتیجه انتخاب شده: ['1'], ['X'], ['2'], ['1','X'], ['1','2'], ['X','2'], ['1','X','2']
            type: [String],
            required: true,
            validate: {
                validator: function (v) {
                    return v.every(item => ['1', 'X', '2'].includes(item));
                },
                message: props => `${props.value} contains invalid outcomes! Only '1', 'X', '2' are allowed.`
            }
        }
    }],
    price: { // قیمت فرم بر اساس تعداد پیش‌بینی‌های چندگانه (اگر منطق قیمت‌گذاری دارید)
        type: Number,
        required: true,
        default: 1000 // مثال: هر فرم 1000 واحد
    },
    score: { // امتیازی که کاربر برای این پیش‌بینی کسب کرده است
        type: Number,
        default: 0
    },
    isScored: { // آیا این پیش‌بینی امتیازدهی شده است یا خیر
        type: Boolean,
        default: false
    },
    isRefunded: { // آیا این پیش‌بینی بازپرداخت شده است؟
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Prediction = mongoose.model('Prediction', predictionSchema);

module.exports = Prediction;