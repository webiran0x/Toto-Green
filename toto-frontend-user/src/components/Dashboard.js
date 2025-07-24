// toto-frontend-user/src/components/Dashboard.js
// کامپوننت داشبورد کاربر با UI بهبود یافته و ریسپانسیو

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext'; // فرض کنید LanguageContext دارید
import ExpiredGames from './ExpiredGames';

function Dashboard({ token, API_BASE_URL }) {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/users/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUserInfo(res.data);
        // ساخت لینک ارجاع
        if (res.data.username) {
          const baseUrl = window.location.origin; // مثلا http://localhost:3001
          setReferralLink(`${baseUrl}/auth?ref=${res.data.username}`);
        }
      } catch (err) {
        setError(err.response?.data?.message || t('error_fetching_user_info'));
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchUserInfo();
    }
  }, [token, API_BASE_URL, t]);

  const copyToClipboard = () => {
    if (referralLink) {
      // استفاده از document.execCommand('copy') برای سازگاری با iframe
      const el = document.createElement('textarea');
      el.value = referralLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopyMessage(t('link_copied'));
      setTimeout(() => setCopyMessage(''), 2000);
    }
  };

  if (loading) return <div className="text-center py-8 text-gray-700">{t('loading')}</div>;
  if (error) return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>;
  if (!userInfo) return <div className="text-center py-8 text-gray-700">{t('user_info_unavailable')}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">{t('dashboard')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card: Username */}
        <div className="bg-blue-50 p-5 rounded-xl shadow-lg border border-blue-200 flex flex-col items-center justify-center transform transition-transform duration-300 hover:scale-105">
          <h3 className="text-xl font-semibold text-blue-800 mb-2">{t('username_label')}:</h3>
          <p className="text-gray-700 text-2xl font-bold">{userInfo.username}</p>
        </div>

        {/* Card: Email */}
        <div className="bg-green-50 p-5 rounded-xl shadow-lg border border-green-200 flex flex-col items-center justify-center transform transition-transform duration-300 hover:scale-105">
          <h3 className="text-xl font-semibold text-green-800 mb-2">{t('email')}:</h3>
          <p className="text-gray-700 text-lg">{userInfo.email}</p>
        </div>

        {/* Card: Total Score */}
        <div className="bg-yellow-50 p-5 rounded-xl shadow-lg border border-yellow-200 flex flex-col items-center justify-center transform transition-transform duration-300 hover:scale-105">
          <h3 className="text-xl font-semibold text-yellow-800 mb-2">{t('total_score')}:</h3>
          <p className="text-gray-700 text-2xl font-bold">{userInfo.score?.toLocaleString('fa-IR') || 0}</p>
        </div>

        {/* Card: Account Balance */}
        <div className="bg-purple-50 p-5 rounded-xl shadow-lg border border-purple-200 flex flex-col items-center justify-center transform transition-transform duration-300 hover:scale-105">
          <h3 className="text-xl font-semibold text-purple-800 mb-2">{t('account_balance')}:</h3>
          <p className="text-gray-700 text-2xl font-bold">{userInfo.balance?.toLocaleString('fa-IR') || 0} {t('usdt')}</p> {/* <--- تغییر واحد */}
        </div>
      </div>

      <ExpiredGames />

      {/* Referral Link Section */}
      {referralLink && (
        <div className="mt-8 p-6 bg-indigo-50 rounded-xl shadow-lg border border-indigo-200">
          <h3 className="text-xl font-bold text-indigo-800 mb-4 text-center">{t('my_referral_link')}</h3>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="flex-grow p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={copyToClipboard}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50"
            >
              {t('copy_link')}
            </button>
          </div>
          {copyMessage && <p className="text-green-600 text-sm mt-3 text-center">{copyMessage}</p>}
          <p className="text-gray-600 text-sm mt-4 text-center">
            {t('share_referral_link')}
          </p>
        </div>
      )}

      <p className="text-gray-600 mt-8 text-center text-lg leading-relaxed">
        {t('welcome_user_panel')}
      </p>
    </div>
  );
}

export default Dashboard;
