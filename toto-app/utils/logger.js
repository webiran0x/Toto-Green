// backend/utils/logger.js
// یک ماژول ساده برای لاگ‌گیری به کنسول (می‌تواند به سیستم‌های لاگ‌گیری پیشرفته‌تر ارتقا یابد)

const moment = require('moment'); // برای فرمت‌بندی زمان در لاگ‌ها

const log = (level, message, ...args) => {
  const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, ...args);
};

module.exports = {
  info: (message, ...args) => log('info', message, ...args),
  warn: (message, ...args) => log('warn', message, ...args),
  error: (message, ...args) => log('error', message, ...args),
  debug: (message, ...args) => log('debug', message, ...args),
};
