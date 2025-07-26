import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom'; // اضافه شده برای هدایت پس از ورود موفق

// آدرس پایه API رو اینجا برای Axios به صورت سراسری تنظیم می‌کنیم.
// این باعث میشه نیازی به تکرار 'https://lotto.green/api' در هر درخواست نباشه.
// فرض می‌کنیم این URL از متغیر محیطی REACT_APP_API_BASE_URL میاد.
// نکته مهم: مطمئن شوید که REACT_APP_API_BASE_URL در فایل .env شما شامل "/api" باشد.
// مثال: REACT_APP_API_BASE_URL=https://lotto.green/api
axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL || 'https://lotto.green/api'; // <-- اطمینان حاصل کنید که "/api" در اینجا یا در متغیر محیطی وجود دارد.

// این خط بسیار مهمه: به Axios میگه که کوکی‌ها رو در درخواست‌ها ارسال کنه.
// با توجه به اینکه بک‌اند شما از HttpOnly cookie استفاده می‌کنه، این تنظیم لازمه.
axios.defaults.withCredentials = true;

function AdminLogin({ onLoginSuccess }) {
  const [usernameOrEmail, setUsernameOrEmail] = useState(''); // تغییر نام state برای مطابقت با بک‌اند
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const navigate = useNavigate(); // استفاده از useNavigate

  useEffect(() => {
    if (typeof t !== 'function') {
      console.error('Warning: t is not a function!');
    }
  }, [t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. ارسال درخواست ورود.
      // Axios به طور خودکار کوکی‌ها را (به خاطر axios.defaults.withCredentials = true) ارسال می‌کند
      // و مرورگر کوکی HttpOnly را از پاسخ سرور ذخیره می‌کند.
      // مهم: نام فیلد ورودی به 'usernameOrEmail' تغییر یافت تا با شمای Joi در بک‌اند مطابقت داشته باشد.
      const loginResponse = await axios.post('/auth/login', {
        usernameOrEmail: usernameOrEmail, // <-- اینجا: ارسال مقدار state به عنوان usernameOrEmail
        password: password
      });

      // 2. پس از ورود موفقیت‌آمیز، اعتبار ادمین را با استفاده از کوکی دریافتی بررسی می‌کنیم.
      // این درخواست نیز به طور خودکار کوکی را ارسال می‌کند.
      const profileRes = await axios.get('/admin/profile');

      // 3. بررسی نقش کاربر
      if (profileRes.data && profileRes.data.role === 'admin') {
        // اگر ادمین بود، فرآیند ورود موفق را اعلام کن
        onLoginSuccess();
        // کاربر رو به داشبورد هدایت می‌کنیم (این کار در App.js هم انجام می‌شود، اما اینجا برای اطمینان)
        navigate('/admin/dashboard', { replace: true });
      } else {
        // اگر ادمین نبود، پیام خطا نمایش بده و کاربر را خارج کن
        setError(t('not_an_admin'));
        try {
          // خروج کاربر غیر ادمین، پاک کردن کوکی
          await axios.post('/auth/logout');
        } catch (logoutErr) {
          console.error('Error during auto-logout after failed admin check:', logoutErr);
        }
      }
    } catch (err) {
      // مدیریت خطا در صورت ورود ناموفق
      // بهبود نمایش خطاهای اعتبارسنجی از بک‌اند
      if (err.response && err.response.data && err.response.data.errors && Array.isArray(err.response.data.errors)) {
        setError(err.response.data.errors.join(', ')); // نمایش تمام خطاهای Joi
      } else {
        setError(err.response?.data?.message || t('login_failed'));
      }
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
            <label htmlFor="usernameOrEmail" className="block text-gray-700 text-sm font-bold mb-2">
              {t('username_or_email')}: {/* تغییر متن لیبل */}
            </label>
            <input
              type="text"
              id="usernameOrEmail" // تغییر id برای مطابقت با state جدید
              className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={usernameOrEmail} // استفاده از state جدید
              onChange={(e) => setUsernameOrEmail(e.target.value)} // به‌روزرسانی state جدید
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
