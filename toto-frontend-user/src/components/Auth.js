// toto-frontend-user/src/components/Auth.js
// کامپوننت ورود و ثبت نام (Auth) با UI بهبود یافته و ریسپانسیو

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext'; // فرض کنید LanguageContext دارید
import { useLocation } from 'react-router-dom'; // برای خواندن پارامترهای URL

function Auth({ onLoginSuccess, API_BASE_URL }) {
  const [isLogin, setIsLogin] = useState(true); // true for login, false for register
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referrerUsername, setReferrerUsername] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    // خواندن پارامتر 'ref' از URL هنگام بارگذاری کامپوننت
    const queryParams = new URLSearchParams(location.search);
    const ref = queryParams.get('ref');
    if (ref) {
      setReferrerUsername(ref);
      setIsLogin(false); // اگر لینک معرف باشد، به صورت پیش‌فرض به تب ثبت‌نام بروید
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const res = await axios.post(`${API_BASE_URL}/auth/login`, { username, password });
        onLoginSuccess(res.data.token);
      } else {
        // Register
        if (password !== confirmPassword) {
          setError(t('password_mismatch_error'));
          setLoading(false);
          return;
        }
        const res = await axios.post(`${API_BASE_URL}/auth/register`, { username, email, password, referrerUsername });
        setMessage(t('registration_success'));
        setIsLogin(true); // پس از ثبت نام موفق به صفحه ورود هدایت شوید
        // پاک کردن فیلدها
        setUsername('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setReferrerUsername('');
      }
    } catch (err) {
      setError(err.response?.data?.message || t('operation_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 hover:scale-105">
        <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-6">
          {isLogin ? t('user_login') : t('user_registration')}
        </h2>
        {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md relative mb-4 text-center">{message}</div>}
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-4 text-center" role="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              {t('username')}:
            </label>
            <input
              type="text"
              id="username"
              className="shadow-sm appearance-none border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {!isLogin && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                  {t('email')}:
                </label>
                <input
                  type="email"
                  id="email"
                  className="shadow-sm appearance-none border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="referrerUsername">
                  {t('referrer_username')}:
                </label>
                <input
                  type="text"
                  id="referrerUsername"
                  className="shadow-sm appearance-none border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                  value={referrerUsername}
                  onChange={(e) => setReferrerUsername(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              {t('password')}:
            </label>
            <input
              type="password"
              id="password"
              className="shadow-sm appearance-none border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {!isLogin && (
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
                {t('confirm_password')}:
              </label>
              <input
                type="password"
                id="confirmPassword"
                className="shadow-sm appearance-none border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:scale-105 w-full disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (isLogin ? t('logging_in') : t('registering')) : (isLogin ? t('login') : t('register'))}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setMessage('');
              setUsername('');
              setEmail('');
              setPassword('');
              setConfirmPassword('');
              setReferrerUsername(''); // Reset referrer username when switching forms
            }}
            className="text-blue-600 hover:text-blue-800 transition duration-200 ease-in-out font-semibold"
          >
            {isLogin ? t('no_account_yet') : t('already_have_account')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Auth;
