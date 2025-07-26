import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';

// API_BASE_URL دیگر نیازی نیست به عنوان پراپ پاس داده شود،
// زیرا axios.defaults.baseURL در App.js تنظیم می‌شود
// و یا axios.create یک baseURL خاص خود را دارد.
// اما برای وضوح بیشتر، می‌توان آن را اینجا هم تعریف کرد یا از App.js ایمپورت کرد
// اگر فقط یک baseURL کلی در axios.defaults.baseURL در App.js تنظیم شده،
// می‌توانیم const API_BASE_URL را اینجا حذف کنیم و صرفاً از axios استفاده کنیم.
// با فرض اینکه axios.defaults.baseURL در App.js تنظیم شده:
// const API_BASE_URL = 'https://lotto.green/api'; // اگر نیاز بود اینجا هم باشه

function AdminLogin({ onLoginSuccess }) { // API_BASE_URL از پراپس حذف شد
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (typeof t !== 'function') {
      console.error('Warning: t is not a function!');
    }
  }, [t]);

  // نیازی به axios.create با baseURL نیست اگر axios.defaults.baseURL در App.js تنظیم شده باشد.
  // اما اگر این کامپوننت نیاز به baseURL متفاوتی دارد یا می‌خواهید مستقل باشد،
  // می‌توانید آن را نگه دارید. با فرض اینکه از همان baseURL سراسری استفاده می‌شود:
  // const api = axios.create({
  //   baseURL: API_BASE_URL,
  //   withCredentials: true, // این در axios.defaults.withCredentials در App.js تنظیم شده
  // });

  // در این حالت، مستقیماً از 'axios' (ایمپورت شده) استفاده می‌کنیم
  // که تنظیمات سراسری 'withCredentials: true' را از App.js به ارث می‌برد.
  // اگر 'API_BASE_URL' را در App.js به 'axios.defaults.baseURL' منتقل کرده‌اید،
  // دیگر نیازی نیست اینجا آن را به درخواست‌ها اضافه کنیم.


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. ارسال درخواست ورود.
      // Axios به طور خودکار کوکی‌ها را (به خاطر axios.defaults.withCredentials = true) ارسال می‌کند
      // و مرورگر کوکی HttpOnly را از پاسخ سرور ذخیره می‌کند.
      // مسیر اصلاح شد: '/api/' از ابتدای مسیر حذف شد
      await axios.post('/auth/login', { username, password }); 

      // 2. پس از ورود موفقیت‌آمیز، اعتبار ادمین را با استفاده از کوکی دریافتی بررسی می‌کنیم.
      // این درخواست نیز به طور خودکار کوکی را ارسال می‌کند.
      // مسیر اصلاح شد: '/api/' از ابتدای مسیر حذف شد
      const profileRes = await axios.get('/admin/profile'); 

      // 3. بررسی نقش کاربر
      if (profileRes.data && profileRes.data.role === 'admin') {
        // اگر ادمین بود، فرآیند ورود موفق را اعلام کن
        // نیازی به پاس دادن توکن نیست، چون با کوکی مدیریت می‌شود
        onLoginSuccess();
      } else {
        // اگر ادمین نبود، پیام خطا نمایش بده و کاربر را خارج کن
        setError(t('not_an_admin'));
        try {
          // خروج کاربر غیر ادمین، پاک کردن کوکی
          // مسیر اصلاح شد: '/api/' از ابتدای مسیر حذف شد
          await axios.post('/auth/logout'); 
        } catch (logoutErr) {
          console.error('Error during auto-logout after failed admin check:', logoutErr);
        }
      }
    } catch (err) {
      // مدیریت خطا در صورت ورود ناموفق
      const fallbackMessage = 'Login failed';
      const errorMsg = typeof t === 'function' ? t('login_failed') : fallbackMessage;
      setError(err.response?.data?.message || errorMsg);
      console.error('Login error:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">{t('admin_login')}</h2>
        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
              role="alert"
            >
              {error}
            </div>
          )}
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">
              {t('username')}:
            </label>
            <input
              type="text"
              id="username"
              className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
              {t('password')}:
            </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-200 ease-in-out w-full disabled:opacity-50"
          >
            {loading ? t('logging_in') : t('login')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;