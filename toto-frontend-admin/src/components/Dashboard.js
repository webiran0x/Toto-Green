// toto-frontend-admin/src/components/Dashboard.js
// کامپوننت داشبورد ادمین

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';

function Dashboard({ token, API_BASE_URL }) {
  const [adminInfo, setAdminInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        // **اصلاح: تغییر مسیر API از /users/profile به /admin/profile**
        const res = await axios.get(`${API_BASE_URL}/admin/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAdminInfo(res.data); // پاسخ بک‌اند برای admin/profile مستقیماً شامل اطلاعات ادمین است
      } catch (err) {
        // مدیریت خطاها در صورت عدم موفقیت درخواست
        setError(err.response?.data?.message || t('error_fetching_data'));
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchAdminInfo();
    }
  }, [token, API_BASE_URL, t]); // t را به dependency array اضافه کنید

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
