// toto-frontend-user/src/components/Auth.js
// کامپوننت ورود و ثبت نام (Auth) با UI بهبود یافته و ریسپانسیو

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useLocation } from 'react-router-dom';
import {
  UserIcon, // آیکون نام کاربری
  EnvelopeIcon, // آیکون ایمیل
  LockClosedIcon, // آیکون رمز عبور
  ArrowRightOnRectangleIcon, // آیکون ورود
  UserPlusIcon, // آیکون ثبت نام
  CheckCircleIcon, // آیکون موفقیت
  ExclamationCircleIcon, // آیکون خطا
  ArrowPathIcon // آیکون پردازش
} from '@heroicons/react/24/outline'; // ایمپورت آیکون‌ها

function Auth({ onLoginSuccess, initialReferrerUsername }) {
  const [isLogin, setIsLogin] = useState(true); // true for login, false for register
  const [usernameOrEmail, setUsernameOrEmail] = useState(''); // برای فیلد ورودی نام کاربری/ایمیل در فرم لاگین
  const [usernameRegister, setUsernameRegister] = useState(''); // برای فیلد نام کاربری در فرم ثبت نام
  const [emailRegister, setEmailRegister] = useState(''); // برای فیلد ایمیل در فرم ثبت نام
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referrerUsername, setReferrerUsername] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    if (initialReferrerUsername) {
      setReferrerUsername(initialReferrerUsername);
      setIsLogin(false); // اگر لینک معرف باشد، به صورت پیش‌فرض به تب ثبت‌نام بروید
    }
  }, [initialReferrerUsername]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const response = await axios.post('/auth/login', {
          usernameOrEmail: usernameOrEmail,
          password: password
        });
        setMessage(response.data.message || t('login_success'));
        onLoginSuccess();
      } else {
        // Register
        if (password !== confirmPassword) {
          setError(t('password_mismatch_error'));
          setLoading(false);
          return;
        }
        
        // --- تغییر جدید: ارسال referrerUsername فقط در صورت وجود مقدار ---
        const registerPayload = {
          username: usernameRegister,
          email: emailRegister,
          password: password,
        };
        if (referrerUsername.trim()) { // فقط اگر referrerUsername خالی نبود، آن را اضافه کن
          registerPayload.referrerUsername = referrerUsername.trim();
        }
        // --- پایان تغییر جدید ---

        const response = await axios.post('/auth/register', registerPayload); // ارسال payload اصلاح شده
        setMessage(response.data.message || t('registration_success'));
        setIsLogin(true); // پس از ثبت نام موفق به صفحه ورود هدایت شوید
        // پاک کردن فیلدها
        setUsernameOrEmail('');
        setUsernameRegister('');
        setEmailRegister('');
        setPassword('');
        setConfirmPassword('');
        setReferrerUsername('');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.errors && Array.isArray(err.response.data.errors)) {
        setError(err.response.data.errors.map(e => e.msg || e.message).join(', ')); // اصلاح: نمایش فقط پیام خطا
      } else {
        setError(err.response?.data?.message || t('operation_error'));
      }
      console.error('Auth operation error:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  // تابع برای ریست کردن فیلدها هنگام تغییر تب
  const resetFormFields = () => {
    setUsernameOrEmail('');
    setUsernameRegister('');
    setEmailRegister('');
    setPassword('');
    setConfirmPassword('');
    setReferrerUsername('');
    setMessage('');
    setError('');
  };

  return (
    // اعمال کلاس‌های تم به کانتینر اصلی
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-inter transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md transform transition-all duration-300 hover:scale-[1.01] border border-gray-200 dark:border-gray-700">
        <h2 className="text-3xl font-extrabold text-center text-gray-800 dark:text-white mb-6">
          {isLogin ? t('user_login') : t('user_registration')}
        </h2>

        {/* پیام‌های موفقیت و خطا با آیکون */}
        {message && (
          <div className="bg-green-100 dark:bg-green-900 border-l-4 border-green-500 dark:border-green-700 text-green-700 dark:text-green-200 p-4 rounded-lg mb-4 animate-fadeIn flex items-center">
            <CheckCircleIcon className="h-6 w-6 text-green-500 dark:text-green-400 mr-3" />
            <p className="font-medium">{message}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 dark:border-red-700 text-red-700 dark:text-red-200 p-4 rounded-lg mb-4 animate-fadeIn flex items-center">
            <ExclamationCircleIcon className="h-6 w-6 text-red-500 dark:text-red-400 mr-3" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isLogin ? (
            // فیلد برای فرم لاگین (نام کاربری یا ایمیل)
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="usernameOrEmail">
                {t('username_or_email')}:
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  id="usernameOrEmail"
                  className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 p-3 pl-10 text-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 transition duration-200 ease-in-out"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  required
                  placeholder={t('username_or_email_placeholder')}
                />
              </div>
            </div>
          ) : (
            // فیلد نام کاربری برای فرم ثبت نام
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="usernameRegister">
                {t('username')}:
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  id="usernameRegister"
                  className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 p-3 pl-10 text-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 transition duration-200 ease-in-out"
                  value={usernameRegister}
                  onChange={(e) => setUsernameRegister(e.target.value)}
                  required
                  placeholder={t('username_placeholder')}
                />
              </div>
            </div>
          )}

          {!isLogin && (
            <>
              {/* فیلد ایمیل برای فرم ثبت نام */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="emailRegister">
                  {t('email')}:
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="email"
                    id="emailRegister"
                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 p-3 pl-10 text-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 transition duration-200 ease-in-out"
                    value={emailRegister}
                    onChange={(e) => setEmailRegister(e.target.value)}
                    required
                    placeholder={t('email_placeholder')}
                  />
                </div>
              </div>
              {/* فیلد معرف (اختیاری) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="referrerUsername">
                  {t('referrer_username')}:
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    id="referrerUsername"
                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 p-3 pl-10 text-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 transition duration-200 ease-in-out"
                    value={referrerUsername}
                    onChange={(e) => setReferrerUsername(e.target.value)}
                    placeholder={t('referrer_username_placeholder')}
                  />
                </div>
              </div>
            </>
          )}

          {/* فیلد رمز عبور */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="password">
              {t('password')}:
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="password"
                id="password"
                className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 p-3 pl-10 text-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 transition duration-200 ease-in-out"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={t('password_placeholder')}
              />
            </div>
          </div>

          {!isLogin && (
            // فیلد تکرار رمز عبور برای ثبت نام
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="confirmPassword">
                {t('confirm_password')}:
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="password"
                  id="confirmPassword"
                  className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 p-3 pl-10 text-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 transition duration-200 ease-in-out"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder={t('confirm_password_placeholder')}
                />
              </div>
            </div>
          )}

          {/* دکمه ارسال فرم */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-xl shadow-lg flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <ArrowPathIcon className="animate-spin h-5 w-5 mr-3" />{' '}
                {isLogin ? t('logging_in') : t('registering')}
              </span>
            ) : (
              <span className="flex items-center justify-center">
                {isLogin ? <ArrowRightOnRectangleIcon className="h-6 w-6 mr-3" /> : <UserPlusIcon className="h-6 w-6 mr-3" />}
                {isLogin ? t('login') : t('register')}
              </span>
            )}
          </button>
        </form>

        {/* دکمه جابجایی بین ورود و ثبت نام */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              resetFormFields(); // ریست کردن فیلدها هنگام تغییر تب
            }}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition duration-200 ease-in-out font-semibold text-lg"
          >
            {isLogin ? t('no_account_yet') : t('already_have_account')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Auth;
