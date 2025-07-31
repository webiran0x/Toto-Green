// toto-landing/src/components/LoginModal.js
// یک مودال ساده برای ورود کاربران در صفحه فرود

import React, { useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import {
  UserIcon,
  LockClosedIcon,
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  XCircleIcon // آیکون بستن مودال
} from '@heroicons/react/24/outline';

function LoginModal({ isOpen, onClose, onLoginSuccess }) {

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  if (!isOpen) return null; // اگر مودال باز نیست، چیزی نمایش نده


  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/auth/login', {
        usernameOrEmail: usernameOrEmail,
        password: password
      });
      setMessage(response.data.message || t('login_success_short')); // پیام موفقیت کوتاه‌تر
      setError(''); // پاک کردن خطاهای قبلی

      // پس از موفقیت لاگین، فیلدها را پاک کرده و مودال را می‌بندیم
      setUsernameOrEmail('');
      setPassword('');
      // اعلام موفقیت لاگین به کامپوننت والد
      setTimeout(() => {
        onLoginSuccess(); // تابع والد را برای به‌روزرسانی وضعیت احراز هویت فراخوانی می‌کند
        onClose(); // مودال را می‌بندد
      }, 1000); // کمی تأخیر برای نمایش پیام موفقیت

    } catch (err) {
      if (err.response && err.response.data && err.response.data.errors && Array.isArray(err.response.data.errors)) {
        setError(err.response.data.errors.map(e => e.msg || e.message).join(', '));
      } else {
        setError(err.response?.data?.message || t('login_error_generic'));
      }
      setMessage(''); // پاک کردن پیام‌های موفقیت قبلی
      console.error('Login error:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // لایه پس‌زمینه مودال
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 font-iranyekan">
      {/* کانتینر اصلی مودال */}
      <div className="bg-clr-surface-a0 dark:bg-clr-surface-a10 p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md transition-colors duration-300 relative border border-clr-surface-a20">
        {/* دکمه بستن مودال */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-clr-dark-a0 dark:text-clr-light-a0 hover:text-clr-primary-a0 transition-colors duration-200"
          aria-label={t('close_modal')}
        >
          <XCircleIcon className="h-7 w-7" />
        </button>

        {/* عنوان مودال */}
        <h3 className="text-2xl font-extrabold text-center text-clr-dark-a0 dark:text-clr-light-a0 mb-6">
          {t('user_login')}
        </h3>

        {/* پیام‌های موفقیت و خطا */}
        {message && (
          <div className="bg-green-100 dark:bg-green-900 border-l-4 border-green-500 dark:border-green-700 text-green-700 dark:text-green-200 p-3 rounded-lg mb-4 animate-fadeIn flex items-center text-sm">
            <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
            <p className="font-medium">{message}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 dark:border-red-700 text-red-700 dark:text-red-200 p-3 rounded-lg mb-4 animate-fadeIn flex items-center text-sm">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500 dark:text-red-400 mr-2" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* فرم ورود */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-clr-dark-a0 dark:text-clr-light-a0 mb-1" htmlFor="modalUsernameOrEmail">
              {t('username_or_email')}:
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-clr-surface-a40 dark:text-clr-surface-a50" />
              </div>
              <input
                type="text"
                id="modalUsernameOrEmail"
                className="block w-full rounded-lg border-clr-surface-a30 shadow-sm focus:border-clr-primary-a0 focus:ring-clr-primary-a0 p-3 pl-10 text-lg bg-clr-surface-a0 text-clr-dark-a0 dark:text-clr-light-a0 transition duration-200 ease-in-out"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                required
                placeholder={t('username_or_email_placeholder')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-clr-dark-a0 dark:text-clr-light-a0 mb-1" htmlFor="modalPassword">
              {t('password')}:
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-clr-surface-a40 dark:text-clr-surface-a50" />
              </div>
              <input
                type="password"
                id="modalPassword"
                className="block w-full rounded-lg border-clr-surface-a30 shadow-sm focus:border-clr-primary-a0 focus:ring-clr-primary-a0 p-3 pl-10 text-lg bg-clr-surface-a0 text-clr-dark-a0 dark:text-clr-light-a0 transition duration-200 ease-in-out"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={t('password_placeholder')}
              />
            </div>
          </div>

          {/* دکمه ارسال فرم */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-clr-primary-a0 to-clr-primary-a10 hover:from-clr-primary-a10 hover:to-clr-primary-a20 text-clr-light-a0 font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-xl shadow-lg flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <ArrowPathIcon className="animate-spin h-5 w-5 mr-3" /> {t('logging_in')}
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <ArrowRightOnRectangleIcon className="h-6 w-6 mr-3" /> {t('login')}
              </span>
            )}
          </button>
        </form>

        {/* لینک به صفحه ثبت نام (در پروژه اصلی) */}
        <div className="mt-6 text-center">
          <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-sm mb-2">
            {t('no_account_yet_question')}
          </p>
          <a
            href="https://lotto.green/auth" // لینک به صفحه Auth در پروژه اصلی
            target="_blank" // در تب جدید باز شود
            rel="noopener noreferrer"
            className="text-clr-primary-a0 hover:text-clr-primary-a10 transition duration-200 ease-in-out font-semibold text-lg"
          >
            {t('register_now')}
          </a>
        </div>

      </div>
    </div>
  );
}

export default LoginModal;