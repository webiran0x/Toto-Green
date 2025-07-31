// toto-frontend-user/src/components/Dashboard.js
// کامپوننت داشبورد کاربر با UI بهبود یافته، مینیمال، اطلاعات بیشتر و دکمه دسترسی به بازی‌ها

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import ExpiredGames from './ExpiredGames';
import {
  UserCircleIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  LinkIcon,
  PlayCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  StarIcon,
  ShieldCheckIcon,
  EllipsisVerticalIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';

function Dashboard() {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await axios.get('/users/profile');
        setUserInfo(res.data);
        if (res.data.username) {
          const baseUrl = window.location.origin;
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
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(referralLink)
          .then(() => {
            setCopyMessage(t('link_copied'));
            setTimeout(() => setCopyMessage(''), 2000);
          })
          .catch(err => {
            console.error('Failed to copy text using navigator.clipboard:', err);
            const el = document.createElement('textarea');
            el.value = referralLink;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            setCopyMessage(t('link_copied'));
            setTimeout(() => setCopyMessage(''), 2000);
          });
      } else {
        const el = document.createElement('textarea');
        el.value = referralLink;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setCopyMessage(t('link_copied'));
        setTimeout(() => setCopyMessage(''), 2000);
      }
    }
  };

  const handleViewOpenGames = () => {
    navigate('/games');
  };

  // NEW: استفاده از کلاس‌های تم به جای رنگ‌های مستقیم
  if (loading) return <div className="text-center py-8 text-clr-dark-a0 dark:text-clr-light-a0">{t('loading')}</div>; // OLD: text-gray-700 dark:text-gray-300
  // NEW: برای پیام خطا، رنگ‌های Red را حفظ می‌کنیم چون معمولاً برای هشدارها ثابت هستند
  if (error) return <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-4">{error}</div>;
  // NEW: استفاده از کلاس‌های تم
  if (!userInfo) return <div className="text-center py-8 text-clr-dark-a0 dark:text-clr-light-a0">{t('user_info_unavailable')}</div>; // OLD: text-gray-700 dark:text-gray-300

  return (
    // NEW: استفاده از کلاس‌های تم برای پس‌زمینه و متن اصلی
    <div className="bg-clr-surface-a0 text-clr-dark-a0 dark:text-clr-light-a0 p-6 rounded-lg shadow-md transition-colors duration-300 overflow-x-hidden"> {/* OLD: bg-white dark:bg-gray-800 */}
      {/* NEW: استفاده از کلاس‌های تم برای عنوان */}
      <h2 className="text-3xl font-extrabold text-clr-dark-a0 dark:text-clr-light-a0 mb-6 text-center"> {/* OLD: text-gray-800 dark:text-white */}
        {t('dashboard')}
      </h2>

      {/* ویجت‌های خلاصه درآمدها، سود و هزینه‌ها */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {/* Earnings Widget (موجودی حساب) */}
        <SummaryWidget
          icon={CurrencyDollarIcon}
          title={t('account_balance_widget')}
          value={`${userInfo.balance?.toLocaleString('fa-IR') || 0} ${t('usdt')}`}
          progress={75} // Mock progress
          color="primary" // NEW: استفاده از primary بجای blue برای همخوانی با پالت جدید
          description={t('current_balance_desc')}
        />
        {/* Profit Widget (امتیاز کل) */}
        <SummaryWidget
          icon={TrophyIcon}
          title={t('total_score_widget')}
          value={userInfo.score?.toLocaleString('fa-IR') || 0}
          progress={80} // Mock progress
          color="primary" // NEW: استفاده از primary بجای green
          description={t('total_score_desc')}
        />
        {/* Expense Widget (نام کاربری) */}
        <SummaryWidget
          icon={UserCircleIcon}
          title={t('username_widget')}
          value={userInfo.username}
          progress={100} // Mock progress
          color="primary" // NEW: استفاده از primary بجای red
          description={t('your_username_desc')}
        />
        {/* جدید: ویجت برای "تعداد فرم‌های برنده" */}
        <SummaryWidget
          icon={ClipboardDocumentCheckIcon}
          title={t('winning_forms_count_widget')}
          value={userInfo.winningFormsCount?.toLocaleString('fa-IR') || 0}
          progress={50} // Mock progress
          color="primary" // NEW: استفاده از primary بجای purple
          description={t('total_winning_forms_desc')}
        />
      </div>

      {/* دکمه "مشاهده بازی‌های فعال" */}
      <div className="flex justify-center mb-8">
        {/* OLD: bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white */}
        <button
          onClick={handleViewOpenGames}
          className="bg-gradient-to-r from-clr-primary-a0 to-clr-primary-a10 hover:from-clr-primary-a10 hover:to-clr-primary-a20 text-clr-light-a0 font-bold py-3 px-8 rounded-lg text-xl focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:scale-105 shadow-lg flex items-center" // NEW
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
        // OLD: bg-indigo-50 dark:bg-indigo-900 rounded-xl shadow-lg border border-indigo-200 dark:border-indigo-700
        <div className="mt-8 p-6 bg-clr-surface-tonal-a0 rounded-xl shadow-lg border border-clr-surface-tonal-a10 transition-colors duration-300"> {/* NEW */}
          {/* OLD: text-indigo-800 dark:text-indigo-200 */}
          <h3 className="text-xl font-bold text-clr-dark-a0 dark:text-clr-light-a0 mb-4 text-center"> {/* NEW */}
            {t('my_referral_link')}
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* OLD: border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 */}
            <input
              type="text"
              readOnly
              value={referralLink}
              className="flex-grow w-full p-3 border border-clr-surface-a30 rounded-lg bg-clr-surface-a10 text-clr-dark-a0 dark:text-clr-light-a0 text-base focus:outline-none focus:ring-2 focus:ring-clr-primary-a0 transition-colors duration-300 overflow-hidden text-ellipsis" // NEW
            />
            {/* OLD: bg-indigo-600 hover:bg-indigo-700 text-white */}
            <button
              onClick={copyToClipboard}
              className="bg-clr-primary-a0 hover:bg-clr-primary-a10 text-clr-light-a0 font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 flex items-center justify-center" // NEW
            >
              <LinkIcon className="h-5 w-5 mr-2" /> {t('copy_link')}
            </button>
          </div>
          {/* OLD: text-green-600 dark:text-green-400 */}
          {copyMessage && <p className="text-green-600 dark:text-green-400 text-sm mt-3 text-center">{copyMessage}</p>} {/* Keep green for success message */}
          {/* OLD: text-gray-600 dark:text-gray-400 */}
          <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-sm mt-4 text-center"> {/* NEW */}
            {t('share_referral_link')}
          </p>
        </div>
      )}

      {/* OLD: text-gray-600 dark:text-gray-400 */}
      <p className="text-clr-dark-a0 dark:text-clr-light-a0 mt-8 text-center text-lg leading-relaxed"> {/* NEW */}
        {t('welcome_user_panel')}
      </p>
    </div>
  );
}

// کامپوننت کمکی برای نمایش اطلاعات در قالب کارت (اصلاح شده برای تم)
const InfoCard = ({ icon: Icon, title, value, color }) => {
  // این کامپوننت در حال حاضر استفاده نمی‌شود، اما در صورت نیاز به استفاده، کلاس‌ها اصلاح شده‌اند.
  // کلاس‌های رنگی برای تم روشن (با استفاده از متغیرهای CSS)
  const bgColorClass = `bg-clr-surface-a10`; // NEW: از surface-a10 برای پس‌زمینه کارت استفاده می‌کنیم
  const borderColorClass = `border-clr-surface-a30`; // NEW: از surface-a30 برای بردر
  const textColorClass = `text-clr-dark-a0`; // NEW: رنگ متن از پالت دارک
  const iconColorClass = `text-clr-primary-a0`; // NEW: رنگ آیکون از پالت primary

  // کلاس‌های رنگی برای تم تیره (با استفاده از متغیرهای CSS)
  const darkBgColorClass = `dark:bg-clr-surface-a10`; // NEW
  const darkBorderColorClass = `dark:border-clr-surface-a30`; // NEW
  const darkTextColorClass = `dark:text-clr-light-a0`; // NEW
  const darkIconColorClass = `dark:text-clr-primary-a30`; // NEW

  return (
    <div className={`${bgColorClass} ${darkBgColorClass} p-5 rounded-xl shadow-lg border ${borderColorClass} ${darkBorderColorClass} flex flex-col items-center justify-center transform transition-transform duration-300 hover:scale-105 transition-colors duration-300`}>
      <Icon className={`h-10 w-10 mb-3 ${iconColorClass} ${darkIconColorClass}`} />
      <h3 className={`text-xl font-semibold mb-2 ${textColorClass} ${darkTextColorClass}`}>{title}:</h3>
      <p className={`${textColorClass} ${darkTextColorClass} text-2xl font-bold text-center break-words w-full px-1`}>{value}</p> {/* NEW: valueTextColorClass حذف شد و از textColorClass استفاده شد */}
    </div>
  );
};

// کامپوننت جدید برای ویجت‌های خلاصه (Earnings, Profit, Expense) (اصلاح شده برای تم)
const SummaryWidget = ({ icon: Icon, title, value, progress, color, description }) => {
  // NEW: با توجه به اینکه color را به "primary" تغییر دادیم، این کلاس‌ها مستقیماً از متغیرهای primary استفاده می‌کنند.
  // کلاس‌های رنگی برای تم روشن
  const avatarBgClass = `bg-clr-surface-a10`; // از سطح رنگی روشن برای آواتار
  const avatarIconClass = `text-clr-primary-a0`; // رنگ اصلی برای آیکون
  const titleClass = `text-clr-dark-a0`; // رنگ متن اصلی (تیره)
  const valueClass = `text-clr-dark-a0`; // رنگ متن مقدار (تیره)
  const progressBgClass = `bg-clr-surface-a20`; // رنگ پس‌زمینه نوار پیشرفت
  const progressBarClass = `bg-clr-primary-a0`; // رنگ نوار پیشرفت
  const descClass = `text-clr-dark-a0`; // رنگ متن توضیحات (تیره)

  // کلاس‌های رنگی برای تم تیره
  const darkAvatarBgClass = `dark:bg-clr-surface-a10`; // از سطح رنگی تیره برای آواتار
  const darkAvatarIconClass = `dark:text-clr-primary-a30`; // رنگ اصلی روشن‌تر برای آیکون
  const darkTitleClass = `dark:text-clr-light-a0`; // رنگ متن اصلی (روشن)
  const darkValueClass = `dark:text-clr-light-a0`; // رنگ متن مقدار (روشن)
  const darkProgressBgClass = `dark:bg-clr-surface-a20`; // رنگ پس‌زمینه نوار پیشرفت
  const darkProgressBarClass = `dark:bg-clr-primary-a0`; // رنگ نوار پیشرفت
  const darkDescClass = `dark:text-clr-light-a0`; // رنگ متن توضیحات (روشن)

  return (
    // OLD: bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md border border-gray-200 dark:border-gray-700
    <div className="bg-clr-surface-a0 p-5 rounded-xl shadow-md border border-clr-surface-a20 flex flex-col items-center text-center transition-colors duration-300"> {/* NEW */}
      <div className={`p-3 rounded-full mb-3 ${avatarBgClass} ${darkAvatarBgClass}`}>
        <Icon className={`h-7 w-7 ${avatarIconClass} ${darkAvatarIconClass}`} />
      </div>
      <h3 className={`text-lg font-semibold ${titleClass} ${darkTitleClass} mb-1`}>{title}</h3>
      <p className={`text-2xl font-bold ${valueClass} ${darkValueClass} mb-3`}>{value}</p>
      
      {/* Linear Progress Bar */}
      <div className={`w-full h-2 rounded-full ${progressBgClass} ${darkProgressBgClass} mb-2`}>
        <div
          className={`h-full rounded-full ${progressBarClass} ${darkProgressBarClass}`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className={`text-xs ${descClass} ${darkDescClass}`}>{description}</p>
    </div>
  );
};

export default Dashboard;