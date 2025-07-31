// toto-landing/src/pages/DashboardPage.js
// کامپوننت صفحه داشبورد کاربر با UI بهبود یافته و ریسپانسیو

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  UserCircleIcon,
  DollarSign,
  TrophyIcon,
  LinkIcon,
  PlayCircleIcon,
  ClipboardCheck,
  InformationCircleIcon
} from 'lucide-react';

// کامپوننت Tooltip
const Tooltip = ({ children, text, position = 'top' }) => {
  const [show, setShow] = useState(false);
  let positionClasses = '';
  switch (position) {
    case 'top': positionClasses = '-top-8 left-1/2 -translate-x-1/2'; break;
    case 'bottom': positionClasses = 'top-full left-1/2 -translate-x-1/2 mt-2'; break;
    case 'left': positionClasses = 'right-full top-1/2 -translate-y-1/2 mr-2'; break;
    case 'right': positionClasses = 'left-full top-1/2 -translate-y-1/2 ml-2'; break;
    default: positionClasses = '-top-8 left-1/2 -translate-x-1/2';
  }
  return (
    <div className="relative flex items-center justify-center" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className={`absolute z-50 p-2 text-xs text-clr-light-a0 bg-clr-dark-a0 rounded-md shadow-lg whitespace-nowrap opacity-0 animate-fadeIn ${positionClasses}`}>
          {text}
        </div>
      )}
    </div>
  );
};

// کامپوننت SummaryWidget
const SummaryWidget = ({ icon: Icon, title, value, progress, color, description, t }) => {
  const avatarBgClass = `bg-clr-surface-a10`;
  const avatarIconClass = `text-clr-primary-a0`;
  const titleClass = `text-clr-dark-a0`;
  const valueClass = `text-clr-dark-a0`;
  const progressBgClass = `bg-clr-surface-a20`;
  const progressBarClass = `bg-clr-primary-a0`;
  const descClass = `text-clr-dark-a0`;

  const darkAvatarBgClass = `dark:bg-clr-surface-a10`;
  const darkAvatarIconClass = `dark:text-clr-primary-a30`;
  const darkTitleClass = `dark:text-clr-light-a0`;
  const darkValueClass = `dark:text-clr-light-a0`;
  const darkProgressBgClass = `dark:bg-clr-surface-a20`;
  const darkProgressBarClass = `dark:bg-clr-primary-a0`;
  const darkDescClass = `dark:text-clr-light-a0`;

  return (
    <div className="bg-clr-surface-a0 p-5 rounded-xl shadow-md border border-clr-surface-a20 flex flex-col items-center text-center transition-colors duration-300">
      <div className={`p-3 rounded-full mb-3 ${avatarBgClass} ${darkAvatarBgClass}`}>
        <Icon className={`h-7 w-7 ${avatarIconClass} ${darkAvatarIconClass}`} />
      </div>
      <h3 className={`text-lg font-semibold ${titleClass} ${darkTitleClass} mb-1`}>{title}</h3>
      <p className={`text-2xl font-bold ${valueClass} ${darkValueClass} mb-3`}>{value}</p>
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

function DashboardPage({ currentTheme, toggleTheme, isAuthenticated }) {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const { t } = useLanguage();
  const navigate = useNavigate();

  const fetchUserInfo = useCallback(async () => {
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
  }, [t]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserInfo();
    } else {
      setLoading(false);
      setUserInfo(null);
    }
  }, [isAuthenticated, fetchUserInfo]);

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
  

  if (loading) return <div className="text-center py-8 text-clr-dark-a0 dark:text-clr-light-a0">{t('loading')}</div>;
  if (error) return <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-4">{error}</div>;
  if (!userInfo) return <div className="text-center py-8 text-clr-dark-a0 dark:text-clr-light-a0">{t('user_info_unavailable')}</div>;

  return (
    <div className="bg-clr-surface-a0 min-h-screen flex flex-col font-iranyekan">
      <Header currentTheme={currentTheme} toggleTheme={toggleTheme} isAuthenticated={isAuthenticated} />
      <main className="flex-grow container mx-auto p-4 lg:p-8">
        <div className="bg-clr-surface-a0 p-6 rounded-lg shadow-md transition-colors duration-300 overflow-x-hidden">
          <h2 className="text-3xl font-extrabold text-clr-dark-a0 dark:text-clr-light-a0 mb-6 text-center">
            {t('dashboard')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            <SummaryWidget 
              icon={DollarSign} 
              title={t('account_balance_widget')}
              value={`${userInfo.balance?.toLocaleString('fa-IR') || 0} ${t('usdt')}`} 
              progress={75}
              color="primary" 
              description={t('current_balance_desc')}
              t={t}
            />
            <SummaryWidget 
              icon={TrophyIcon} 
              title={t('total_score_widget')}
              value={userInfo.score?.toLocaleString('fa-IR') || 0} 
              progress={80}
              color="primary" 
              description={t('total_score_desc')}
              t={t}
            />
            <SummaryWidget 
              icon={UserCircleIcon}
              title={t('username_widget')}
              value={userInfo.username} 
              progress={100}
              color="primary"
              description={t('your_username_desc')}
              t={t}
            />
            <SummaryWidget
              icon={ClipboardCheck}
              title={t('winning_forms_count_widget')}
              value={userInfo.winningFormsCount?.toLocaleString('fa-IR') || 0}
              progress={50}
              color="primary"
              description={t('total_winning_forms_desc')}
              t={t}
            />
          </div>
          <div className="flex justify-center mb-8">
            <button
              onClick={handleViewOpenGames}
              className="bg-gradient-to-r from-clr-primary-a0 to-clr-primary-a10 hover:from-clr-primary-a10 hover:to-clr-primary-a20 text-clr-light-a0 font-bold py-3 px-8 rounded-lg text-xl focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:scale-105 shadow-lg flex items-center"
            >
              <PlayCircleIcon className="h-7 w-7 mr-3 rtl:ml-3 rtl:mr-0" /> {t('view_open_games')}
            </button>
          </div>
          {/* بخش بازی‌های منقضی شده (Expired Games) */}
          <div className="mb-8">
            {/* <ExpiredGames /> */} {/* اینجا می‌توانید یک کامپوننت ExpiredGames را به صورت فانکشنال شده قرار دهید */}
          </div>
          {referralLink && (
            <div className="mt-8 p-6 bg-clr-surface-tonal-a0 rounded-xl shadow-lg border border-clr-surface-tonal-a10 transition-colors duration-300">
              <h3 className="text-xl font-bold text-clr-dark-a0 dark:text-clr-light-a0 mb-4 text-center">
                {t('my_referral_link')}
              </h3>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="flex-grow w-full p-3 border border-clr-surface-a30 rounded-lg bg-clr-surface-a10 text-clr-dark-a0 dark:text-clr-light-a0 text-base focus:outline-none focus:ring-2 focus:ring-clr-primary-a0 transition-colors duration-300 overflow-hidden text-ellipsis"
                />
                <button
                  onClick={copyToClipboard}
                  className="bg-clr-primary-a0 hover:bg-clr-primary-a10 text-clr-light-a0 font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 flex items-center justify-center"
                >
                  <LinkIcon className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" /> {t('copy_link')}
                </button>
              </div>
              {copyMessage && <p className="text-green-600 dark:text-green-400 text-sm mt-3 text-center">{copyMessage}</p>}
              <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-sm mt-4 text-center">
                {t('share_referral_link')}
              </p>
            </div>
          )}
          <p className="text-clr-dark-a0 dark:text-clr-light-a0 mt-8 text-center text-lg leading-relaxed">
            {t('welcome_user_panel')}
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default DashboardPage;
