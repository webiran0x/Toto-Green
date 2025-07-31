// toto-frontend-user/src/components/ExpiredGames.js
// کامپوننت نمایش و مدیریت مسابقات پایان‌یافته کاربر با UI بهبود یافته و صفحه‌بندی

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import {
  ArrowDownTrayIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

function ExpiredGames() {
  const { t } = useLanguage();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [gamesPerPage] = useState(6);
  const [totalGames, setTotalGames] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchGames = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page: currentPage,
        limit: gamesPerPage,
      };

      const res = await axios.get('/users/games/expired', { params });
      
      setGames(res.data.games);
      setTotalGames(res.data.totalCount);
      setTotalPages(res.data.totalPages);

    } catch (err) {
      console.error('Error fetching expired games:', err.response?.data?.message || err.message);
      setError(t('error_fetching_expired_games'));
    } finally {
      setLoading(false);
    }
  }, [t, currentPage, gamesPerPage]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const downloadExcel = (gameId) => {
    const downloadUrl = `${axios.defaults.baseURL}/users/games/${gameId}/download`;
    window.open(downloadUrl, '_blank');
  };

  // تابع برای دریافت کلاس‌های CSS بر اساس وضعیت بازی - UPDATED
  const getGameStatusClasses = (status) => {
    switch (status) {
      // NEW: استفاده از رنگ‌های پالت جدید برای وضعیت‌ها
      case 'closed': return 'bg-clr-surface-tonal-a10 text-clr-dark-a0 dark:bg-clr-surface-tonal-a20 dark:text-clr-light-a0';
      case 'completed': return 'bg-clr-primary-a50 text-clr-dark-a0 dark:bg-clr-primary-a10 dark:text-clr-light-a0';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'; // Keep red for cancelled for clear visual cue
      default: return 'bg-clr-surface-a10 text-clr-dark-a0 dark:bg-clr-surface-a20 dark:text-clr-light-a0';
    }
  };

  // تابع برای دریافت آیکون بر اساس وضعیت بازی (بدون تغییر)
  const getGameStatusIcon = (status) => {
    switch (status) {
      case 'closed': return <ClockIcon className="h-4 w-4 mr-1" />;
      case 'completed': return <CheckCircleIcon className="h-4 w-4 mr-1" />;
      case 'cancelled': return <XCircleIcon className="h-4 w-4 mr-1" />;
      default: return null;
    }
  };

  // NEW: کلاس‌های مربوط به لودینگ و خطا
  if (loading) return <div className="text-center py-8 text-clr-dark-a0 dark:text-clr-light-a0">{t('loading')}</div>; // OLD: text-gray-700 dark:text-gray-300
  if (error) return <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-4 text-center">{error}</div>;

  return (
    // OLD: bg-white dark:bg-gray-800
    <div className="mt-10 p-4 bg-clr-surface-a0 rounded-lg shadow-md transition-colors duration-300 overflow-x-hidden"> {/* NEW */}
      {/* OLD: text-gray-800 dark:text-white */}
      <h2 className="text-2xl font-bold text-clr-dark-a0 dark:text-clr-light-a0 mb-6 text-center">{t('expired_games_title')}</h2> {/* NEW */}
      {games.length === 0 && !loading ? (
        // OLD: text-gray-600 dark:text-gray-400
        <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-center py-4">{t('no_expired_games')}</p> 
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              // OLD: bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600
              <div key={game._id} className="bg-clr-surface-a10 p-5 rounded-xl shadow-lg border border-clr-surface-a20 flex flex-col transform transition-transform duration-300 hover:scale-[1.02] animate-fadeIn transition-colors duration-300"> 
                <div className="flex justify-between items-center mb-3">
                  {/* OLD: text-gray-800 dark:text-white */}
                  <h3 className="text-xl font-bold text-clr-dark-a0 dark:text-clr-light-a0">{game.name}</h3> 
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center ${getGameStatusClasses(game.status)}`}>
                    {getGameStatusIcon(game.status)} {t(`status_${game.status}`)}
                  </span>
                </div>
                
                {/* OLD: text-gray-700 dark:text-gray-300 */}
                <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-sm mb-1"> {/* NEW */}
                  {t('deadline')}: {new Date(game.deadline).toLocaleString('fa-IR')}
                </p>
                
                {/* اطلاعات مالی و تعداد فرم‌ها */}
                {/* OLD: text-gray-700 dark:text-gray-300 */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-clr-dark-a0 dark:text-clr-light-a0"> {/* NEW */}
                    <div className="flex items-center">
                        {/* OLD: text-blue-500 dark:text-blue-400 */}
                        <CurrencyDollarIcon className="h-4 w-4 text-clr-primary-a0 mr-1" /> {/* NEW */}
                        <span className="font-medium">{t('total_pot')}:</span> {game.totalPot?.toLocaleString('fa-IR') || 0} {t('usdt')}
                    </div>
                    <div className="flex items-center">
                        {/* OLD: text-yellow-500 dark:text-yellow-400 */}
                        <TrophyIcon className="h-4 w-4 text-clr-primary-a0 mr-1" /> {/* NEW: از primary به جای yellow استفاده شد */}
                        <span className="font-medium">{t('prize_pool')}:</span> {game.prizePool?.toLocaleString('fa-IR') || 0} {t('usdt')}
                    </div>
                    <div className="flex items-center">
                        {/* OLD: text-purple-500 dark:text-purple-400 */}
                        <CurrencyDollarIcon className="h-4 w-4 text-clr-primary-a0 mr-1" /> {/* NEW: از primary به جای purple استفاده شد */}
                        <span className="font-medium">{t('commission_amount')}:</span> {game.commissionAmount?.toLocaleString('fa-IR') || 0} {t('usdt')}
                    </div>
                    <div className="flex items-center">
                        {/* OLD: text-gray-600 dark:text-gray-400 */}
                        <ClipboardDocumentListIcon className="h-4 w-4 text-clr-surface-a40 dark:text-clr-surface-a50 mr-1" /> {/* NEW */}
                        <span className="font-medium">{t('submitted_forms_count')}:</span> {game.submittedFormsCount?.toLocaleString('fa-IR') || 0}
                    </div>
                </div>

                <button
                  className="mt-5 bg-clr-primary-a0 hover:bg-clr-primary-a10 text-clr-light-a0 font-bold py-2 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-clr-primary-a0 focus:ring-offset-2 dark:focus:ring-offset-clr-surface-a10" 
                  onClick={() => downloadExcel(game._id)}
                >
                  <ArrowDownTrayIcon className="h-5 w-5 mr-2" /> {t('download_excel')}
                </button>
              </div>
            ))}
          </div>

          {/* بخش صفحه‌بندی */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-6 space-x-2">
              <button
                // OLD: bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-md bg-clr-surface-a20 text-clr-dark-a0 dark:text-clr-light-a0 hover:bg-clr-surface-a30 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 transition-colors duration-300" 
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              {[...Array(totalPages).keys()].map(number => (
                <button
                  key={number + 1}
                  onClick={() => paginate(number + 1)}
                  className={`px-4 py-2 rounded-md font-semibold ${
                    // OLD: bg-blue-600 text-white dark:bg-blue-700 dark:text-white
                    // OLD: bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600
                    currentPage === number + 1 
                      ? 'bg-clr-primary-a0 text-clr-light-a0' // NEW: برای صفحه فعال
                      : 'bg-clr-surface-a20 text-clr-dark-a0 hover:bg-clr-surface-a30 dark:text-clr-light-a0' // NEW: برای صفحات غیرفعال
                  } transition duration-150 transition-colors duration-300`}
                >
                  {number + 1}
                </button>
              ))}
              <button
                // OLD: bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-md bg-clr-surface-a20 text-clr-dark-a0 dark:text-clr-light-a0 hover:bg-clr-surface-a30 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 transition-colors duration-300" 
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ExpiredGames;