// toto-frontend-landing/src/sections/UpcomingGamesSection.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useLanguage } from '../contexts/LanguageContext';
import { ClockIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'; // آیکون‌های جدید

/**
 * کامپوننت UpcomingGamesSection
 * بازی‌های آینده را نمایش می‌دهد و امکان انتخاب آن‌ها را برای نمایش فرم پیش‌بینی فراهم می‌کند.
 *
 * @param {object} props - پراپرتی‌های کامپوننت.
 * @param {function} props.onSelectGame - تابعی برای تنظیم بازی انتخاب شده در کامپوننت والد.
 */
function UpcomingGamesSection({ onSelectGame }) {
  const { t } = useLanguage();
  const [upcomingGames, setUpcomingGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // تابع برای واکشی لیست بازی‌های آینده از بک‌اند
  // توجه: این API باید بازی‌هایی را برگرداند که هنوز "open" نشده‌اند،
  // بلکه در وضعیت "created" یا "upcoming" هستند.
  // اگر بک‌اند شما چنین API ندارد، باید آن را اضافه کنید.
  const fetchUpcomingGames = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // فرض می‌کنیم یک API برای بازی‌های آینده وجود دارد
      // اگر ندارید، باید در بک‌اند آن را پیاده‌سازی کنید (مثلاً /totos/upcoming)
      // در غیر این صورت، می‌توانید از /totos/open فیلتر کنید یا یک Mock Data قرار دهید.
      const response = await axios.get('/totos/upcoming'); // فرض بر وجود این API
      if (response.data && response.data.length > 0) {
        setUpcomingGames(response.data);
      } else {
        setUpcomingGames([]);
        setError(t('no_upcoming_games_available'));
      }
    } catch (err) {
      console.error("Error fetching upcoming games data:", err);
      setError(t('error_fetching_upcoming_games'));
      setUpcomingGames([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchUpcomingGames();
  }, [fetchUpcomingGames]);

  if (loading) {
    return (
      <div className="text-center text-lg text-blue-200 py-8">
        {t('loading_upcoming_games')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-800 bg-opacity-70 border border-red-500 text-red-200 px-4 py-3 rounded relative mb-4 shadow-lg">
        {error}
      </div>
    );
  }

  if (upcomingGames.length === 0) {
    return (
      <div className="text-center text-lg text-blue-200 py-8">
        {t('no_upcoming_games_for_now')}
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-3xl font-extrabold text-white mb-6 text-center">
        {t('upcoming_toto_games')}
      </h2>
      <div className="space-y-4">
        {upcomingGames.map((game) => (
          <div
            key={game._id}
            className="bg-white bg-opacity-10 p-5 rounded-lg shadow-md border border-white border-opacity-20 cursor-pointer
                       transform transition-transform duration-200 hover:scale-105 hover:bg-opacity-20"
            onClick={() => onSelectGame(game)} // وقتی روی بازی کلیک شد، آن را به عنوان بازی انتخاب شده تنظیم می‌کند
          >
            <h3 className="text-xl font-semibold text-blue-200 mb-2">{game.name}</h3>
            <p className="text-sm text-gray-300 flex items-center mb-1">
              <CalendarDaysIcon className="h-4 w-4 mr-2 text-gray-400" />
              {t('start_date')}: {format(new Date(game.deadline), 'yyyy/MM/dd HH:mm')}
            </p>
            <p className="text-sm text-gray-300 flex items-center">
              <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
              {t('matches_count')}: {game.matches.length}
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); onSelectGame(game); }} // جلوگیری از انتشار رویداد به والد
              className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full text-sm shadow-lg
                         transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              {t('view_prediction_form')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UpcomingGamesSection;
