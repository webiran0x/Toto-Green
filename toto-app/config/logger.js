// toto-app/config/logger.js
// پیکربندی Winston Logger

const winston = require('winston');
const path = require('path');

const logDir = 'logs'; // پوشه برای ذخیره فایل‌های لاگ

// تعریف فرمت لاگ
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(info => `${info.timestamp} ${info.level.toUpperCase()}: ${info.message}`)
);

const logger = winston.createLogger({
    level: 'info', // حداقل سطح لاگ برای ذخیره
    format: logFormat,
    transports: [
        // ذخیره لاگ‌های خطا در فایل error.log
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error'
        }),
        // ذخیره تمام لاگ‌ها (از سطح info به بالا) در فایل combined.log
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log')
        }),
        // نمایش لاگ‌ها در کنسول (فقط در محیط توسعه)
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                logFormat
            )
        })
    ]
});

module.exports = logger;