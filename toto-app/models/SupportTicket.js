// toto-app/models/SupportTicket.js
// مدل تیکت پشتیبانی (Support Ticket Model)

const mongoose = require('mongoose');

// زیر-سند برای پیام‌ها در داخل تیکت
const messageSchema = mongoose.Schema({
    sender: { // کاربری که پیام را ارسال کرده است
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    message: { // متن پیام
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true // createdAt برای هر پیام
});

const supportTicketSchema = mongoose.Schema({
    user: { // کاربری که تیکت را ایجاد کرده است
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    subject: { // موضوع تیکت
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: { // توضیحات اولیه تیکت
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    status: { // وضعیت تیکت: 'open', 'in_progress', 'resolved', 'closed'
        type: String,
        enum: ['open', 'in_progress', 'resolved', 'closed'],
        default: 'open'
    },
    priority: { // اولویت تیکت: 'low', 'medium', 'high', 'urgent'
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'low'
    },
    assignedTo: { // ادمین/پشتیبانی که تیکت به او اختصاص داده شده است (اختیاری)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    messages: [messageSchema] // آرایه‌ای از پیام‌ها (زیر-سند)
}, {
    timestamps: true // createdAt و updatedAt برای تیکت
});

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

module.exports = SupportTicket;
