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
  LinkIcon, // آیکون لینک ارجاع (برای Referral Link)
  PlayCircleIcon, // آیکون بازی
  EnvelopeIcon, // آیکون ایمیل
  PhoneIcon, // آیکون تلفن
  StarIcon, // آیکون سطح
  ShieldCheckIcon, // آیکون وضعیت
  EllipsisVerticalIcon, // آیکون سه نقطه برای منوی بیشتر
  ChartBarIcon, // آیکون نمودار برای ویجت جدید
  ArrowTrendingUpIcon, // آیکون روند صعودی
  ArrowTrendingDownIcon, // آیکون روند نزولی
  ClipboardDocumentCheckIcon // جدید: آیکون برای تعداد فرم‌های برنده
} from '@heroicons/react/24/outline'; // ایمپورت آیکون‌ها از Heroicons

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
        setUserInfo(res.data); // res.data اکنون شامل winningFormsCount است
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

  if (loading) return <div className="text-center py-8 text-gray-700 dark:text-gray-300">{t('loading')}</div>;
  if (error) return <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-4">{error}</div>;
  if (!userInfo) return <div className="text-center py-8 text-gray-700 dark:text-gray-300">{t('user_info_unavailable')}</div>;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-300 overflow-x-hidden">
      <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-6 text-center">
        {t('dashboard')}
      </h2>

   

      {/* ویجت‌های خلاصه درآمدها، سود و هزینه‌ها */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"> {/* تغییر گرید برای اضافه کردن ویجت چهارم */}
        {/* Earnings Widget (موجودی حساب) */}
        <SummaryWidget 
          icon={CurrencyDollarIcon} 
          title={t('account_balance_widget')}
          value={`${userInfo.balance?.toLocaleString('fa-IR') || 0} ${t('usdt')}`} 
          progress={75} // Mock progress
          color="blue" 
          description={t('current_balance_desc')}
        />
        {/* Profit Widget (امتیاز کل) */}
        <SummaryWidget 
          icon={TrophyIcon} 
          title={t('total_score_widget')}
          value={userInfo.score?.toLocaleString('fa-IR') || 0} 
          progress={80} // Mock progress
          color="green" 
          description={t('total_score_desc')}
        />
        {/* Expense Widget (نام کاربری) */}
        <SummaryWidget 
          icon={UserCircleIcon} // آیکون مناسب‌تر برای نام کاربری
          title={t('username_widget')}
          value={userInfo.username} 
          progress={100} // Mock progress
          color="red" // رنگ قرمز برای تمایز
          description={t('your_username_desc')}
        />
        {/* جدید: ویجت برای "تعداد فرم‌های برنده" */}
        <SummaryWidget
          icon={ClipboardDocumentCheckIcon} // آیکون برای فرم‌های برنده
          title={t('winning_forms_count_widget')}
          value={userInfo.winningFormsCount?.toLocaleString('fa-IR') || 0} // <--- استفاده از داده واقعی (پس از تغییر بک‌اند)
          progress={50} // Mock progress
          color="purple" // رنگ بنفش
          description={t('total_winning_forms_desc')}
        />
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
        <div className="mt-8 p-6 bg-indigo-50 dark:bg-indigo-900 rounded-xl shadow-lg border border-indigo-200 dark:border-indigo-700 transition-colors duration-300">
          <h3 className="text-xl font-bold text-indigo-800 dark:text-indigo-200 mb-4 text-center">
            {t('my_referral_link')}
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="flex-grow w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors duration-300 overflow-hidden text-ellipsis"
            />
            <button
              onClick={copyToClipboard}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 flex items-center justify-center"
            >
              <LinkIcon className="h-5 w-5 mr-2" /> {t('copy_link')}
            </button>
          </div>
          {copyMessage && <p className="text-green-600 dark:text-green-400 text-sm mt-3 text-center">{copyMessage}</p>}
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-4 text-center">
            {t('share_referral_link')}
          </p>
        </div>
      )}

      <p className="text-gray-600 dark:text-gray-400 mt-8 text-center text-lg leading-relaxed">
        {t('welcome_user_panel')}
      </p>
    </div>
  );
}

// کامپوننت کمکی برای نمایش اطلاعات در قالب کارت
// این کامپوننت در حال حاضر استفاده نمی‌شود، اما برای ارجاع نگه داشته شده است.
const InfoCard = ({ icon: Icon, title, value, color }) => {
  const bgColorClass = `bg-${color}-50`;
  const borderColorClass = `border-${color}-200`;
  const textColorClass = `text-${color}-800`;
  const iconColorClass = `text-${color}-500`;
  const valueTextColorClass = `text-gray-700`;

  const darkBgColorClass = `dark:bg-${color}-900`;
  const darkBorderColorClass = `dark:border-${color}-700`;
  const darkTextColorClass = `dark:text-${color}-200`;
  const darkIconColorClass = `dark:text-${color}-400`;
  const darkValueTextColorClass = `dark:text-gray-100`;


  return (
    <div className={`${bgColorClass} ${darkBgColorClass} p-5 rounded-xl shadow-lg border ${borderColorClass} ${darkBorderColorClass} flex flex-col items-center justify-center transform transition-transform duration-300 hover:scale-105 transition-colors duration-300`}>
      <Icon className={`h-10 w-10 mb-3 ${iconColorClass} ${darkIconColorClass}`} />
      <h3 className={`text-xl font-semibold mb-2 ${textColorClass} ${darkTextColorClass}`}>{title}:</h3>
      <p className={`${valueTextColorClass} ${darkValueTextColorClass} text-2xl font-bold text-center break-words w-full px-1`}>{value}</p>
    </div>
  );
};

// کامپوننت جدید برای ویجت‌های خلاصه (Earnings, Profit, Expense)
const SummaryWidget = ({ icon: Icon, title, value, progress, color, description }) => {
  // کلاس‌های رنگی برای تم روشن
  const avatarBgClass = `bg-${color}-100`;
  const avatarIconClass = `text-${color}-600`;
  const titleClass = `text-gray-700`;
  const valueClass = `text-gray-800`;
  const progressBgClass = `bg-gray-200`;
  const progressBarClass = `bg-${color}-500`;
  const descClass = `text-gray-600`;

  // کلاس‌های رنگی برای تم تیره
  const darkAvatarBgClass = `dark:bg-${color}-900`;
  const darkAvatarIconClass = `dark:text-${color}-400`;
  const darkTitleClass = `dark:text-gray-300`;
  const darkValueClass = `dark:text-white`;
  const darkProgressBgClass = `dark:bg-gray-700`;
  const darkProgressBarClass = `dark:bg-${color}-600`;
  const darkDescClass = `dark:text-gray-400`;

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 flex flex-col items-center text-center transition-colors duration-300">
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
