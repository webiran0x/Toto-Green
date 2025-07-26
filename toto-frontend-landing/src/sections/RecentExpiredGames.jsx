// toto-frontend-landing/src/sections/RecentExpiredGames.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../src/contexts/LanguageContext';

function RecentExpiredGames() {
  const { t } = useLanguage();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecentGames = async () => {
      try {
        const res = await axios.get('/users/games/expired', {
          params: {
            page: 1,
            limit: 3, // فقط ۳ بازی آخر
          },
        });
        setGames(res.data.games);
      } catch (err) {
        setError(t('error_fetching_expired_games') || 'خطا در دریافت اطلاعات');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentGames();
  }, [t]);

  const getGameStatusIcon = (status) => {
    switch (status) {
      case 'closed': return <ClockIcon className="h-4 w-4 mr-1" />;
      case 'completed': return <CheckCircleIcon className="h-4 w-4 mr-1" />;
      case 'cancelled': return <XCircleIcon className="h-4 w-4 mr-1" />;
      default: return null;
    }
  };

  return (
    <section className="mt-10 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">{t('recent_expired_games') || 'بازی‌های اخیر پایان‌یافته'}</h2>

      {loading ? (
        <p className="text-gray-500 text-center py-4">{t('loading')}</p>
      ) : error ? (
        <div className="text-red-600 text-center">{error}</div>
      ) : games.length === 0 ? (
        <p className="text-center text-gray-500">{t('no_expired_games')}</p>
      ) : (
        <ul className="space-y-4">
          {games.map((game) => (
            <li key={game._id} className="p-4 border rounded-md shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-800">{game.name}</h3>
                <span className="flex items-center text-sm bg-gray-100 px-2 py-1 rounded-md">
                  {getGameStatusIcon(game.status)} {t(`status_${game.status}`)}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <p>{t('deadline')}: {new Date(game.deadline).toLocaleString('fa-IR')}</p>
                <p>{t('total_pot')}: {game.totalPot?.toLocaleString('fa-IR')} {t('usdt')}</p>
                <p>{t('prize_pool')}: {game.prizePool?.toLocaleString('fa-IR')} {t('usdt')}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default RecentExpiredGames;
