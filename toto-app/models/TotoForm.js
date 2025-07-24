// toto-app/models/TotoForm.js

const mongoose = require('mongoose');

const predictionSchema = mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  chosenOutcome: {
    type: [String], // مثلا ['1', 'X']
    required: true
  }
});

const totoFormSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  totoGame: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TotoGame',
    required: true
  },
  predictions: [predictionSchema], // آرایه پیش‌بینی‌ها برای هر مسابقه
  price: {
    type: Number,
    required: true,
    default: 0
  },
  isWinner: {
    type: Boolean,
    default: false
  },
  prizeAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const TotoForm = mongoose.model('TotoForm', totoFormSchema);

module.exports = TotoForm;
