import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';

// نیازی نیست API_BASE_URL به عنوان پراپ پاس داده شود،
// زیرا axios.defaults.baseURL در App.js به صورت سراسری تنظیم شده است.
// اگرچه اگر پاس داده شود مشکلی ایجاد نمی‌کند، اما دیگر ضروری نیست.
function Dashboard() { // 'token' و 'API_BASE_URL' از پراپس حذف شدند
  const [adminInfo, setAdminInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        // Axios به طور خودکار baseURL (که در App.js تنظیم شده) را اضافه می‌کند.
        // همچنین، به خاطر axios.defaults.withCredentials = true، کوکی احراز هویت را نیز ارسال می‌کند.
        // بنابراین، نیازی به تعیین دستی هدر Authorization یا baseURL در اینجا نیست.
        const res = await axios.get('/admin/profile'); 
        setAdminInfo(res.data);
      } catch (err) {
        // مدیریت خطاها در صورت عدم موفقیت درخواست (مثلاً 401 Unauthorized)
        // این می‌تواند به این معنی باشد که کوکی معتبر نیست یا منقضی شده است.
        setError(err.response?.data?.message || t('error_fetching_data'));
        console.error('Failed to fetch admin profile:', err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    // درخواست اطلاعات ادمین را به محض بارگذاری کامپوننت ارسال می‌کنیم.
    // نیازی به بررسی 'token' نیست، چون مدیریت احراز هویت بر عهده کوکی‌هاست.
    fetchAdminInfo();
  }, [t]); // 't' به عنوان تنها وابستگی باقی می‌ماند.

  if (loading) return <div className="text-center py-8">{t('loading')}</div>;
  if (error) return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>;
  if (!adminInfo) return <div className="text-center py-8">{t('admin_info_unavailable')}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('dashboard')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-md shadow-sm">
          <h3 className="text-lg font-semibold text-blue-800">{t('username_label')}</h3>
          <p className="text-gray-700">{adminInfo.username}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-md shadow-sm">
          <h3 className="text-lg font-semibold text-green-800">{t('role_label')}</h3>
          <p className="text-gray-700">{adminInfo.role === 'admin' ? t('admin_role') : adminInfo.role}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-md shadow-sm">
          <h3 className="text-lg font-semibold text-yellow-800">{t('total_score_label')}</h3>
          <p className="text-gray-700">{adminInfo.score}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-md shadow-sm">
          <h3 className="text-lg font-semibold text-purple-800">{t('account_balance_label')}</h3>
          <p className="text-gray-700">{adminInfo.balance}</p>
        </div>
      </div>
      <p className="text-gray-600 mt-6">{t('welcome_admin_panel')}</p>
    </div>
  );
}

export default Dashboard;