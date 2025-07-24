// toto-app/models/Transaction.js
// مدل جامع تراکنش (قبلاً Deposit.js بود)

const mongoose = require('mongoose');

const transactionSchema = mongoose.Schema(
  {
    user: { // ارجاع به کاربر مرتبط با تراکنش
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    amount: { // مبلغ تراکنش. برای واریز مثبت، برای کسر (مثل پرداخت فرم یا برداشت) منفی
      type: Number,
      required: true,
      // min: 0, // <--- این خط حذف شد تا امکان ذخیره مبالغ منفی برای کسرها فراهم شود.
    },
    type: { // نوع تراکنش: واریز، برداشت، هزینه فرم، پرداخت جایزه، بازپرداخت، کمیسیون معرف
      type: String,
      required: true,
      enum: ['deposit', 'withdrawal', 'form_payment', 'prize_payout', 'refund', 'referral_commission'],
    },
    method: { // روش انجام تراکنش: دستی، درگاه پرداخت، کریپتو، سیستمی (برای تراکنش‌های داخلی)
      type: String,
      enum: ['manual', 'gateway', 'crypto', 'system'],
      default: 'system', // پیش‌فرض برای تراکنش‌های داخلی سیستم
    },
    status: { // وضعیت تراکنش: در انتظار، تکمیل شده، ناموفق، لغو شده، در حال پردازش
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled', 'processing'],
      default: 'completed', // پیش‌فرض برای تراکنش‌های سیستمی که بلافاصله تکمیل می‌شوند
    },
    description: { // توضیحات تراکنش
      type: String,
      required: true,
      trim: true,
    },
    // فیلدهای اختیاری برای تراکنش‌های رمزارزی یا مرتبط با SHKeeper
    cryptoDetails: {
      currency: { type: String, required: false },
      network: { type: String, required: false },
      txHash: { // هش تراکنش بلاک‌چین
        type: String,
        required: false,
        unique: true,
        sparse: true // اجازه می‌دهد مقادیر null یا undefined یکتا نباشند
      },
      shkeeperInvoiceId: { // شناسه اینویس در SHKeeper (برای واریز)
        type: String,
        required: false,
        unique: true,
        sparse: true
      },
      shkeeperTaskId: { // شناسه تسک Payout در SHKeeper (برای برداشت)
        type: String,
        required: false,
        unique: true,
        sparse: true
      },
      shkeeperPaymentStatus: { // وضعیت پرداخت از دید SHKeeper (برای واریز)
        type: String,
        enum: ['PENDING', 'PAID', 'OVERPAID', 'UNDERPAID', 'EXPIRED', 'NEW', 'CONFIRMED'],
        required: false
      },
      shkeeperPayoutStatus: { // وضعیت تسک برداشت از دید SHKeeper (برای برداشت)
        type: String,
        enum: ['PENDING', 'FAILURE', 'SUCCESS'],
        required: false
      }
    },
    relatedEntity: { // ارجاع به موجودیت مرتبط (مثلاً Prediction ID یا WithdrawalRequest ID)
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        refPath: 'relatedEntityType' // نام فیلدی که مدل ارجاع را مشخص می‌کند
    },
    relatedEntityType: { // نوع موجودیت مرتبط (مثلاً 'Prediction', 'WithdrawalRequest', 'CryptoDeposit', 'TotoGame')
        type: String,
        required: false,
        enum: ['Prediction', 'WithdrawalRequest', 'CryptoDeposit', 'TotoGame']
    }
  },
  {
    timestamps: true, // اضافه کردن فیلدهای createdAt و updatedAt به صورت خودکار
  }
);

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
