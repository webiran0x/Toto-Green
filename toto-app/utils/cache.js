// toto-app/utils/cache.js
// یک سیستم کش ساده در حافظه با TTL (Time-To-Live)

const cache = new Map(); // Map برای ذخیره داده‌های کش

/**
 * ذخیره داده در کش
 * @param {string} key - کلید برای شناسایی داده
 * @param {*} value - داده‌ای که باید ذخیره شود
 * @param {number} ttl - زمان انقضا بر حسب میلی‌ثانیه (مثلاً 5 * 60 * 1000 برای 5 دقیقه)
 */
const setCache = (key, value, ttl) => {
    const now = Date.now();
    cache.set(key, {
        value,
        expiry: now + ttl
    });
    // console.log(`Cache set for key: ${key}, expires in ${ttl / 1000} seconds`);
};

/**
 * دریافت داده از کش
 * @param {string} key - کلید داده
 * @returns {*} - داده کش شده یا undefined اگر منقضی شده یا وجود ندارد
 */
const getCache = (key) => {
    const cachedItem = cache.get(key);
    if (!cachedItem) {
        return undefined;
    }

    const now = Date.now();
    if (now > cachedItem.expiry) {
        // داده منقضی شده است، آن را حذف کنید
        cache.delete(key);
        // console.log(`Cache expired for key: ${key}`);
        return undefined;
    }
    // console.log(`Cache hit for key: ${key}`);
    return cachedItem.value;
};

/**
 * حذف داده از کش
 * @param {string} key - کلید داده
 */
const deleteCache = (key) => {
    cache.delete(key);
    // console.log(`Cache deleted for key: ${key}`);
};

/**
 * پاک کردن تمام کش
 */
const clearAllCache = () => {
    cache.clear();
    console.log('All cache cleared.');
};

module.exports = {
    setCache,
    getCache,
    deleteCache,
    clearAllCache
};