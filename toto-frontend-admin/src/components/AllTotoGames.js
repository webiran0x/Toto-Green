// toto-frontend-admin/src/components/AllTotoGames.js
// کامپوننت نمایش تمام مسابقات Toto برای ادمین

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext'; // <--- اضافه شده

function AllTotoGames({ token, API_BASE_URL }) {
  const [totoGames, setTotoGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useLanguage(); // <--- استفاده از هوک زبان

  useEffect(() => {
    const fetchAllTotoGames = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/totos`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTotoGames(res.data);
      } catch (err) {
        setError(err.response?.data?.message || t('error_fetching_data'));
      } finally {
        setLoading(false);
      }
    };
    fetchAllTotoGames();
  }, [token, API_BASE_URL, t]);

  const handleDownloadPredictions = async (totoGameId, gameName) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/download-predictions/${totoGameId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob', // برای دریافت فایل به صورت باینری
      });

      // ایجاد URL برای دانلود فایل
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `predictions_${gameName.replace(/\s/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url); // آزادسازی منابع

    } catch (err) {
      setError(err.response?.data?.message || t('error_downloading_predictions'));
      console.error(err);
    }
  };

  if (loading) return <div className="text-center py-8">{t('loading')}</div>;
  if (error) return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('all_toto_games')}</h2>
      {totoGames.length === 0 ? (
        <p className="text-gray-600">{t('no_games_found')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {totoGames.map((game) => (
            <div key={game._id} className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-blue-800 mb-2">{game.name}</h3>
                <p className="text-gray-700 text-sm mb-1">
                  {t('status')}: <span className={`font-semibold ${
                    game.status === 'open' ? 'text-green-600' :
                    game.status === 'closed' ? 'text-orange-600' :
                    game.status === 'completed' ? 'text-purple-600' :
                    'text-red-600' // برای وضعیت 'cancelled'
                  }`}>
                    {t(`status_${game.status}`)}
                  </span>
                </p>
                <p className="text-gray-700 text-sm mb-1">{t('deadline_label')}: {new Date(game.deadline).toLocaleString('fa-IR')}</p>
                <p className="text-gray-700 text-sm mb-3">{t('creation_date')}: {new Date(game.createdAt).toLocaleString('fa-IR')}</p>
                <p className="text-gray-700 text-sm mb-3">{t('refunded')}: {game.isRefunded ? t('yes') : t('no')}</p>


                {/* اطلاعات جوایز */}
                {game.status !== 'open' && game.status !== 'cancelled' && ( // جوایز فقط برای بازی‌های بسته/تکمیل شده
                    <div className="mt-4 bg-blue-100 p-3 rounded-md">
                        <h4 className="font-semibold text-blue-700 mb-1">{t('prize_info')}</h4>
                        <p className="text-gray-700 text-sm">{t('total_pot_collected')} {game.totalPot?.toLocaleString('fa-IR') || 0} {t('toman')}</p>
                        <p className="text-gray-700 text-sm">{t('commission_deducted')} {game.commissionAmount?.toLocaleString('fa-IR') || 0} {t('toman')}</p>
                        <p className="text-gray-700 text-sm font-bold">{t('final_prize_amount')} {game.prizePool?.toLocaleString('fa-IR') || 0} {t('toman')}</p>
                        <p className="text-gray-700 text-sm">{t('first_place_prize')} {game.prizes?.firstPlace?.toLocaleString('fa-IR') || 0} {t('toman')}</p>
                        <p className="text-gray-700 text-sm">{t('second_place_prize')} {game.prizes?.secondPlace?.toLocaleString('fa-IR') || 0} {t('toman')}</p>
                        <p className="text-gray-700 text-sm">{t('third_place_prize')} {game.prizes?.thirdPlace?.toLocaleString('fa-IR') || 0} {t('toman')}</p>
                    </div>
                )}
                 {game.status === 'completed' && game.winners && ( // نمایش برندگان
                    <div className="mt-4 bg-green-100 p-3 rounded-md">
                        <h4 className="font-semibold text-green-700 mb-1">{t('winners')}</h4>
                        {game.winners.first && game.winners.first.length > 0 && (
                            <p className="text-gray-700 text-sm">{t('first_place')} {game.winners.first.map(w => w.username || w).join(', ')}</p>
                        )}
                        {game.winners.second && game.winners.second.length > 0 && (
                            <p className="text-gray-700 text-sm">{t('second_place')} {game.winners.second.map(w => w.username || w).join(', ')}</p>
                        )}
                        {game.winners.third && game.winners.third.length > 0 && (
                            <p className="text-gray-700 text-sm">{t('third_place')} {game.winners.third.map(w => w.username || w).join(', ')}</p>
                        )}
                        {(!game.winners.first || game.winners.first.length === 0) &&
                         (!game.winners.second || game.winners.second.length === 0) &&
                         (!game.winners.third || game.winners.third.length === 0) && (
                            <p className="text-gray-700 text-sm">{t('no_winners_found')}</p>
                        )}
                    </div>
                )}


                <h4 className="font-semibold text-gray-800 mt-3 mb-2">{t('matches_label')}</h4>
                <ul className="list-disc list-inside text-gray-600 text-sm max-h-40 overflow-y-auto">
                  {game.matches.map((match, index) => (
                    <li key={match._id || index} className="mb-1">
                      {match.homeTeam} vs {match.awayTeam} ({new Date(match.date).toLocaleDateString('fa-IR')}) - {t('result')}: {match.result || t('unknown')} {match.isCancelled && <span className="text-red-500 font-bold">{t('cancelled')}</span>}
                    </li>
                  ))}
                </ul>
              </div>
              {/* دکمه دانلود فرم‌ها */}
              {game.status !== 'open' && ( // فقط وقتی بازی بسته یا تکمیل شده باشد قابل دانلود است
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleDownloadPredictions(game._id, game.name)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-200 ease-in-out w-full disabled:opacity-50"
                  >
                    {t('download_forms_csv')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AllTotoGames;
