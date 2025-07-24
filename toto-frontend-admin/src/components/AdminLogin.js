// toto-frontend-admin/src/components/AdminLogin.js
// کامپوننت ورود ادمین

import React, { useState } from 'react';
import axios from 'axios';
// import { useNavigate } from 'react-router-dom'; // حذف شد: useNavigate دیگر در اینجا استفاده نمی‌شود
import { useLanguage } from '../contexts/LanguageContext';

// onLoginSuccess دوباره به props اضافه شد
function AdminLogin({ onLoginSuccess, API_BASE_URL }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  // const navigate = useNavigate(); // حذف شد

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { username, password });

      // بررسی نقش کاربر از پاسخ بک‌اند
      if (res.data && res.data.user && res.data.user.role !== 'admin') {
        setError(t('login_error_admin_permission'));
        setLoading(false);
        return;
      }

      // توکن را به کامپوننت والد (App.js) ارسال کنید
      onLoginSuccess(res.data.token);
      localStorage.setItem('adminToken', res.data.token);
      // localStorage.setItem('adminToken', res.data.token); // حذف شد: والد مسئول ذخیره‌سازی است
      // navigate('/admin/dashboard', { replace: true }); // حذف شد: والد مسئول مسیریابی است

    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError(t('login_error_generic'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">{t('admin_login')}</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              {t('username')}:
            </label>
            <input
              type="text"
              id="username"
              className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              {t('password')}:
            </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-200 ease-in-out w-full disabled:opacity-50"
              disabled={loading}
            >
              {loading ? t('logging_in') : t('login')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
