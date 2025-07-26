// toto-frontend-user/src/components/Dashboard.js
// کامپوننت داشبورد کاربر با UI بهبود یافته، مینیمال، اطلاعات بیشتر و دکمه دسترسی به بازی‌ها

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom'; // برای هدایت به صفحه بازی‌ها
import ExpiredGames from './ExpiredGames'; // فرض کنید این کامپوننت هم اصلاح شده است
import {
  UserCircleIcon, // آیکون کاربر
  CurrencyDollarIcon, // آیکون موجودی
  TrophyIcon, // آیکون امتیاز
  LinkIcon, // آیکون لینک ارجاع
  PlayCircleIcon, // آیکون بازی
  EnvelopeIcon, // آیکون ایمیل
  PhoneIcon, // آیکون تلفن
  StarIcon, // آیکون سطح
  ShieldCheckIcon // آیکون وضعیت
} from '@heroicons/react/24/outline'; // ایمپورت آیکون‌ها از Heroicons

// token و API_BASE_URL از پراپس حذف شدند
function Dashboard() {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const { t } = useLanguage();
  const navigate = useNavigate(); // هوک برای ناوبری

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // درخواست Axios:
        // baseURL از axios.defaults.baseURL در App.js گرفته می‌شود.
        // کوکی‌ها به خاطر axios.defaults.withCredentials = true ارسال می‌شوند.
        const res = await axios.get('/users/profile'); // مسیر: /api/users/profile
        setUserInfo(res.data);
        // ساخت لینک ارجاع
        if (res.data.username) {
          const baseUrl = window.location.origin; // مثلا http://localhost:3001
          setReferralLink(`${baseUrl}/auth?ref=${res.data.username}`);
        }
      } catch (err) {
        setError(err.response?.data?.message || t('error_fetching_user_info'));
        console.error('Error fetching user info:', err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [t]);

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

  const handleViewOpenGames = () => {
    navigate('/games'); // هدایت کاربر به صفحه بازی‌های فعال
  };

  if (loading) return <div className="text-center py-8 text-gray-700">{t('loading')}</div>;
  if (error) return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>;
  if (!userInfo) return <div className="text-center py-8 text-gray-700">{t('user_info_unavailable')}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">
        {t('dashboard')}
      </h2>

      {/* بخش اطلاعات اصلی کاربر */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {/* Card: Username */}
        <InfoCard icon={UserCircleIcon} title={t('username')} value={userInfo.username} color="blue" />

        {/* Card: Email */}
        <InfoCard icon={EnvelopeIcon} title={t('email')} value={userInfo.email} color="green" />

        {/* Card: Phone Number (اگر موجود باشد) */}
        {userInfo.phoneNumber && (
          <InfoCard icon={PhoneIcon} title={t('phone_number')} value={userInfo.phoneNumber} color="purple" />
        )}

        {/* Card: Role */}
        <InfoCard icon={UserCircleIcon} title={t('role_label')} value={t(`role_${userInfo.role}`)} color="indigo" />

        {/* Card: Level */}
        <InfoCard icon={StarIcon} title={t('access_level')} value={t(`level_${userInfo.level}`)} color="yellow" />

        {/* Card: Status */}
        <InfoCard icon={ShieldCheckIcon} title={t('status')} value={t(`status_${userInfo.status}`)} color="teal" />

        {/* Card: Total Score */}
        <InfoCard icon={TrophyIcon} title={t('total_score')} value={userInfo.score?.toLocaleString('fa-IR') || 0} color="orange" />

        {/* Card: Account Balance */}
        <InfoCard icon={CurrencyDollarIcon} title={t('account_balance')} value={`${userInfo.balance?.toLocaleString('fa-IR') || 0} ${t('usdt')}`} color="red" />
      </div>

      {/* دکمه "مشاهده بازی‌های فعال" */}
      <div className="flex justify-center mb-8">
        <button
          onClick={handleViewOpenGames}
          className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold py-3 px-8 rounded-lg text-xl focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:scale-105 shadow-lg flex items-center"
        >
          <PlayCircleIcon className="h-7 w-7 mr-3" /> {t('view_open_games')}
        </button>
      </div>

      {/* بخش بازی‌های منقضی شده (Expired Games) */}
      <div className="mb-8">
        <ExpiredGames />
      </div>

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
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 flex items-center justify-center"
            >
              <LinkIcon className="h-5 w-5 mr-2" /> {t('copy_link')}
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

// کامپوننت کمکی برای نمایش اطلاعات در قالب کارت
const InfoCard = ({ icon: Icon, title, value, color }) => {
  const bgColorClass = `bg-${color}-50`;
  const borderColorClass = `border-${color}-200`;
  const textColorClass = `text-${color}-800`;
  const iconColorClass = `text-${color}-500`;

  return (
    <div className={`${bgColorClass} p-5 rounded-xl shadow-lg border ${borderColorClass} flex flex-col items-center justify-center transform transition-transform duration-300 hover:scale-105`}>
      <Icon className={`h-10 w-10 mb-3 ${iconColorClass}`} />
      <h3 className={`text-xl font-semibold mb-2 ${textColorClass}`}>{title}:</h3>
      <p className="text-gray-700 text-2xl font-bold text-center break-words">{value}</p>
    </div>
  );
};

export default Dashboard;
