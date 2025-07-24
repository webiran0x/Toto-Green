// toto-app/models/CryptoDeposit.js
// مدل Mongoose برای ذخیره اطلاعات واریزهای ارز دیجیتال در حال انتظار

const mongoose = require('mongoose');

const CryptoDepositSchema = new mongoose.Schema({
  user: { // ارجاع به کاربر ایجادکننده درخواست واریز
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  currency: { // نام ارز دیجیتال (مثلاً USDT)
    type: String,
    required: true,
    enum: ['USDT', 'BTC'], // می‌توانید ارزهای دیگر را اینجا اضافه کنید
  },
  network: { // شبکه مورد استفاده (مثلاً TRC20, BEP20, ERC20)
    type: String,
    required: true,
    enum: ['TRC20', 'BEP20', 'ERC20'],
  },
  depositAddress: { // آدرس کیف پول تولید شده توسط SHKeeper برای این واریز
    type: String,
    required: false, // در ابتدا ممکن است خالی باشد تا پس از فراخوانی SHKeeper پر شود
    unique: true,
    sparse: true, // اجازه می‌دهد مقادیر null یا undefined یکتا نباشند
  },
  expectedAmount: { // مبلغ مورد انتظار واریز توسط کاربر (به USDT)
    type: Number,
    required: true,
    min: 0,
  },
  actualAmount: { // مبلغ واقعی واریز شده و تأیید شده توسط SHKeeper (به USDT)
    type: Number,
    default: 0,
  },
  transactionHash: { // هش تراکنش بلاک‌چین (پس از تأیید SHKeeper)
    type: String,
    unique: true,
    sparse: true,
  },
  shkeeperDepositId: { // شناسه اینویس SHKeeper برای این واریز
    type: String,
    unique: true,
    sparse: true,
    required: false, // در ابتدا ممکن است خالی باشد
  },
  status: { // وضعیت درخواست واریز: در انتظار، تأیید شده، ناموفق، لغو شده
    type: String,
    required: true,
    enum: ['pending', 'confirmed', 'failed', 'cancelled'],
    default: 'pending',
  },
  shkeeperPaymentStatus: { // وضعیت پرداخت از دید SHKeeper (NEW, PAID, UNDERPAID, etc.)
    type: String,
    required: false,
  },
  confirmations: { // تعداد تأییدیه‌های بلاک‌چین (توسط SHKeeper گزارش می‌شود)
    type: Number,
    default: 0,
  },
  isProcessed: { // آیا این واریز کریپتو به موجودی کاربر اضافه شده است؟
    type: Boolean,
    default: false,
  },
}, {
    timestamps: true, // اضافه کردن فیلدهای createdAt و updatedAt به صورت خودکار
});

const CryptoDeposit = mongoose.model('CryptoDeposit', CryptoDepositSchema);

module.exports = CryptoDeposit;
