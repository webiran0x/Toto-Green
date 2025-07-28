import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
  TrophyIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon, // آیکون برای وضعیت completed
  ClockIcon, // آیکون برای وضعیت closed
  XCircleIcon // آیکون برای وضعیت cancelled
} from '@heroicons/react/24/outline';
import { useLanguage } from '../contexts/LanguageContext'; // ایمپورت useLanguage

// این کامپوننت برای نمایش لیست بازی‌های تکمیل‌شده و بسته شده در یک اسلایدر طراحی شده است.
// این کامپوننت داده‌های خود را مستقیماً از یک Endpoint عمومی فچ می‌کند و نیازی به احراز هویت ندارد.
function LastGameSection() {
  const { t, locale } = useLanguage(); // استفاده از هوک useLanguage و locale
  const [completedGames, setCompletedGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0); // ایندکس اسلاید فعلی

  // تابع برای دریافت بازی‌های تکمیل شده و بسته شده از یک Endpoint عمومی
  const fetchCompletedGames = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      // مسیر API به درستی برای Endpoint عمومی در totoGameRoutes.js تنظیم شده است.
      const res = await axios.get('/totos/public/games/completed-and-closed?limit=5');
      setCompletedGames(res.data.games || []); 
    } catch (err) {
      console.error('Error fetching completed/closed games for public display:', err.response?.data?.message || err.message);
      setError(t('error_fetching_completed_closed_games')); // ترجمه شده
    } finally {
      setLoading(false);
    }
  }, [t]); // t را به وابستگی‌ها اضافه کنید

  useEffect(() => {
    fetchCompletedGames();
  }, [fetchCompletedGames]);

  // منطق ناوبری اسلایدر
  const goToNextSlide = () => {
    setCurrentSlideIndex((prevIndex) =>
      prevIndex === completedGames.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToPrevSlide = () => {
    setCurrentSlideIndex((prevIndex) =>
      prevIndex === 0 ? completedGames.length - 1 : prevIndex - 1
    );
  };

  // تابع برای دریافت آیکون بر اساس وضعیت بازی
  const getGameStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="h-4 w-4 ml-1" />;
      case 'closed': return <ClockIcon className="h-4 w-4 ml-1" />;
      case 'cancelled': return <XCircleIcon className="h-4 w-4 ml-1" />;
      default: return null;
    }
  };

  // تابع برای دریافت کلاس‌های CSS بر اساس وضعیت بازی
  const getGameStatusClasses = (status) => {
    switch (status) {
      case 'completed': return 'text-purple-800 bg-purple-100';
      case 'closed': return 'text-orange-800 bg-orange-100';
      case 'cancelled': return 'text-red-800 bg-red-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  // اگر هنوز در حال بارگذاری هستیم
  if (loading) {
    return (
      <section className="bg-white p-6 rounded-lg shadow-md flex justify-center items-center h-48">
        <p className="text-gray-700">{t('loading_completed_closed_games')}</p> {/* ترجمه شده */}
      </section>
    );
  }

  // اگر خطایی رخ داد
  if (error) {
    return (
      <section className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-center">
        {error}
      </section>
    );
  }

  // اگر هیچ بازی تکمیل شده‌ای وجود نداشت
  if (completedGames.length === 0) {
    return (
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">{t('last_completed_and_closed_games_title')}</h2> {/* ترجمه شده */}
        <p className="text-gray-600 text-center py-4">{t('no_completed_closed_games')}</p> {/* ترجمه شده */}
      </section>
    );
  }

  const currentActiveGame = completedGames[currentSlideIndex];

  // تابع دانلود اکسل اصلاح شده برای استفاده از Endpoint عمومی
  const handleDownloadPredictions = (gameId, gameName) => {
    // مسیر API جدید عمومی برای دانلود پیش‌بینی‌ها
    const downloadUrl = `${axios.defaults.baseURL}/totos/public/games/${gameId}/predictions-download`;
    // نام فایل را می‌توانید از gameName استفاده کنید یا یک نام ثابت بگذارید
    const filename = `predictions_${gameName.replace(/\s/g, '_')}.xlsx`; // نوع فایل به xlsx تغییر کرد

    // باز کردن لینک در تب جدید مرورگر
    window.open(downloadUrl, '_blank');
  };

  return (
    <section className="bg-white p-6 rounded-lg shadow-md relative">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        {t('last_completed_and_closed_games_title')} {/* ترجمه شده */}
      </h2>

      {completedGames.length > 1 && (
        <button
          onClick={goToPrevSlide}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-700 text-white p-2 rounded-full shadow-lg hover:bg-gray-800 transition z-10 focus:outline-none"
          aria-label="Previous slide"
        >
          <ChevronRightIcon className="h-6 w-6" /> {/* برای فارسی RTL */}
        </button>
      )}

      {completedGames.length > 1 && (
        <button
          onClick={goToNextSlide}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-700 text-white p-2 rounded-full shadow-lg hover:bg-gray-800 transition z-10 focus:outline-none"
          aria-label="Next slide"
        >
          <ChevronLeftIcon className="h-6 w-6" /> {/* برای فارسی RTL */}
        </button>
      )}

      <div className="overflow-hidden">
        {currentActiveGame && (
          <div className="w-full flex-shrink-0">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 text-center">
              {currentActiveGame.name}
              <span className={`inline-flex items-center mr-3 px-3 py-1 text-sm font-semibold rounded-full ${getGameStatusClasses(currentActiveGame.status)}`}>
                 {getGameStatusIcon(currentActiveGame.status)}
                 {currentActiveGame.status === 'completed' ? t('game_status_completed') : currentActiveGame.status === 'closed' ? t('game_status_closed') : t('game_status_cancelled')} {/* ترجمه شده */}
              </span>
            </h3>
            
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('host_team')}</th> {/* ترجمه شده */}
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('result')}</th> {/* ترجمه شده */}
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('away_team')}</th> {/* ترجمه شده */}
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('date')}</th> {/* ترجمه شده */}
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('time')}</th> {/* ترجمه شده */}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentActiveGame.matches && currentActiveGame.matches.length > 0 ? (
                    currentActiveGame.matches.map((match, index) => (
                      <tr key={match._id || index}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{match.homeTeam}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-center text-gray-700 font-semibold">{match.result || '---'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{match.awayTeam}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{new Date(match.date).toLocaleDateString(locale === 'fa' ? 'fa-IR' : 'en-US')}</td> {/* ترجمه تاریخ */}
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{new Date(match.date).toLocaleTimeString(locale === 'fa' ? 'fa-IR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</td> {/* ترجمه زمان */}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-4 py-2 text-center text-sm text-gray-500">{t('no_matches_to_display')}</td> {/* ترجمه شده */}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">{t('game_stats_report')} ({currentActiveGame.matches?.length || 0} {t('matches')})</h3> {/* ترجمه شده */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
              <p className="flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 text-blue-500 ml-2" />
                <strong>{t('total_pot')}:</strong> <span className="mr-auto font-semibold text-blue-600">{currentActiveGame.totalPot?.toLocaleString(locale === 'fa' ? 'fa-IR' : 'en-US') || '0'} {t('usdt')}</span> {/* ترجمه شده */}
              </p>
              <p className="flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 text-purple-500 ml-2" />
                <strong>{t('commission_deducted')}:</strong> <span className="mr-auto font-semibold text-purple-600">{currentActiveGame.commissionAmount?.toLocaleString(locale === 'fa' ? 'fa-IR' : 'en-US') || '0'} {t('usdt')}</span> {/* ترجمه شده */}
              </p>
              <p className="flex items-center">
                <TrophyIcon className="h-5 w-5 text-yellow-500 ml-2" />
                <strong>{t('total_prize')}:</strong> <span className="mr-auto font-semibold text-green-600">{currentActiveGame.prizePool?.toLocaleString(locale === 'fa' ? 'fa-IR' : 'en-US') || '0'} {t('usdt')}</span> {/* ترجمه شده */}
              </p>
              <p className="flex items-center">
                <ClipboardDocumentListIcon className="h-5 w-5 text-gray-600 ml-2" />
                <strong>{t('participants_count')}:</strong> <span className="mr-auto font-semibold text-gray-700">{currentActiveGame.submittedFormsCount?.toLocaleString(locale === 'fa' ? 'fa-IR' : 'en-US') || 0} {t('forms')}</span> {/* ترجمه شده */}
              </p>
            </div>

            <div className="mt-6">
                <h4 className="text-base font-semibold text-gray-800 mb-2">{t('winners')}:</h4> {/* ترجمه شده */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <p className="font-medium text-green-700">{t('first_place')} ({currentActiveGame.winners?.first?.length || 0} {t('forms')}):</p> {/* ترجمه شده */}
                        <p className="text-gray-700">{currentActiveGame.winners?.first?.map(w => w.username).join(', ') || '---'}</p>
                        <p className="text-gray-600">{t('prize_per_person')}: {currentActiveGame.prizes?.firstPlace?.toLocaleString(locale === 'fa' ? 'fa-IR' : 'en-US') || '0'} {t('usdt')}</p> {/* ترجمه شده */}
                    </div>
                    <div>
                        <p className="font-medium text-blue-700">{t('second_place')} ({currentActiveGame.winners?.second?.length || 0} {t('forms')}):</p> {/* ترجمه شده */}
                        <p className="text-gray-700">{currentActiveGame.winners?.second?.map(w => w.username).join(', ') || '---'}</p>
                        <p className="text-gray-600">{t('prize_per_person')}: {currentActiveGame.prizes?.secondPlace?.toLocaleString(locale === 'fa' ? 'fa-IR' : 'en-US') || '0'} {t('usdt')}</p> {/* ترجمه شده */}
                    </div>
                    <div>
                        <p className="font-medium text-orange-700">{t('third_place')} ({currentActiveGame.winners?.third?.length || 0} {t('forms')}):</p> {/* ترجمه شده */}
                        <p className="text-gray-700">{currentActiveGame.winners?.third?.map(w => w.username).join(', ') || '---'}</p>
                        <p className="text-gray-600">{t('prize_per_person')}: {currentActiveGame.prizes?.thirdPlace?.toLocaleString(locale === 'fa' ? 'fa-IR' : 'en-US') || '0'} {t('usdt')}</p> {/* ترجمه شده */}
                    </div>
                </div>
            </div>

            {currentActiveGame._id && ( 
                <div className="md:col-span-2 mt-8 pt-4 border-t border-gray-200 text-center">
                    <button
                        onClick={() => handleDownloadPredictions(currentActiveGame._id, currentActiveGame.name)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline transition duration-200 ease-in-out shadow-lg flex items-center justify-center mx-auto"
                    >
                        <ArrowDownTrayIcon className="h-5 w-5 ml-2" /> {t('download_predictions_forms')} {/* ترجمه شده */}
                    </button>
                </div>
            )}
          </div>
        )}
      </div>

      {completedGames.length > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          {completedGames.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlideIndex(index)}
              className={`h-3 w-3 rounded-full ${
                index === currentSlideIndex ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
              } transition-colors duration-200`}
              aria-label={`Go to slide ${index + 1}`}
            ></button>
          ))}
        </div>
      )}
    </section>
  );
}

export default LastGameSection;
