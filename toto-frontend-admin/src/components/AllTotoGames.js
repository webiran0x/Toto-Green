// toto-frontend-admin/src/components/AllTotoGames.js
// کامپوننت نمایش تمام بازی‌های Toto با قابلیت‌های ادمین

import React, { useState, useEffect, useCallback } from 'react'; // useCallback اضافه شد
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';

// نیازی نیست token و API_BASE_URL به عنوان پراپ پاس داده شوند.
// axios.defaults.baseURL و axios.defaults.withCredentials در App.js تنظیم شده‌اند.
function AllTotoGames() {
  const [totoGames, setTotoGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { t } = useLanguage();

  const fetchGames = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      const res = await axios.get('/admin/games/all'); // مسیر اصلاح شد
      setTotoGames(res.data);
    } catch (err) {
      setError(err.response?.data?.message || t('error_fetching_data'));
      console.error('Error fetching all Toto games:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const handleDeleteGame = async (gameId) => {
    if (window.confirm(t('confirm_delete_game'))) {
      try {
        await axios.delete(`/admin/totos/${gameId}`); // مسیر اصلاح شد
        setTotoGames(totoGames.filter((game) => game._id !== gameId));
        setMessage(t('game_deleted_successfully'));
      } catch (err) {
        setError(err.response?.data?.message || t('error_deleting_game'));
        console.error('Error deleting game:', err.response?.data || err.message);
      }
    }
  };

  const handleCloseGameManually = async (gameId) => {
    if (window.confirm(t('confirm_close_game_manually'))) {
      try {
        const res = await axios.put(`/admin/close-toto/${gameId}`, {}); // مسیر اصلاح شد
        setTotoGames(totoGames.map(game => game._id === gameId ? { ...game, status: res.data.totoGame.status } : game));
        setMessage(t('game_closed_successfully'));
      } catch (err) {
        setError(err.response?.data?.message || t('error_closing_game'));
        console.error('Error closing game manually:', err.response?.data || err.message);
      }
    }
  };

  const handleCancelGameAndRefund = async (gameId, gameName) => {
    if (window.confirm(t('confirm_cancel_game_and_refund', { gameName }))) {
      try {
        const res = await axios.put(`/admin/games/cancel-and-refund/${gameId}`, {}); // مسیر اصلاح شد
        setTotoGames(totoGames.map(game => game._id === gameId ? { ...game, status: 'cancelled', isRefunded: true } : game));
        setMessage(res.data.message || t('game_cancelled_and_refunded_successfully'));
      } catch (err) {
        setError(err.response?.data?.message || t('error_cancelling_game_and_refunding'));
        console.error('Error cancelling game and refunding:', err.response?.data || err.message);
      }
    }
  };

  const handleDownloadPredictions = async (totoGameId, gameName) => {
    try {
      // درخواست Axios: بدون هدر Authorization
      // مسیر اصلاح شد: '/api/' از ابتدای مسیر حذف شد
      const res = await axios.get(`/admin/download-predictions/${totoGameId}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `predictions_${gameName.replace(/\s/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      setError(err.response?.data?.message || t('error_downloading_predictions'));
      console.error('Error downloading predictions:', err.response?.data || err.message);
    }
  };

  if (loading) return <div className="text-center py-8">{t('loading')}</div>;
  if (error) return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('all_toto_games')}</h2>
      {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">{message}</div>}

      {totoGames.length === 0 ? (
        <p className="text-gray-600 text-center">{t('no_games_found')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {totoGames.map((game) => (
            <div key={game._id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{game.name}</h3>
                <p className="text-gray-600 text-sm mb-1">{t('deadline')}: {new Date(game.deadline).toLocaleString('fa-IR')}</p>
                <p className="text-gray-600 text-sm mb-1">
                  {t('status')}:{' '}
                  <span className={`font-semibold ${
                    game.status === 'open' ? 'text-green-600' :
                    game.status === 'closed' ? 'text-orange-600' :
                    game.status === 'completed' ? 'text-purple-600' :
                    'text-red-600'
                  }`}>
                    {t(`status_${game.status}`)}
                  </span>
                </p>
                <p className="text-gray-600 text-sm mb-1">{t('total_pot')}: {game.totalPot?.toLocaleString('fa-IR') || 0} {t('usdt')}</p>
                <p className="text-gray-600 text-sm mb-3">{t('prize_pool')}: {game.prizePool?.toLocaleString('fa-IR') || 0} {t('usdt')}</p>

                {game.status !== 'open' && game.status !== 'cancelled' && (
                    <div className="mt-4 bg-blue-100 p-3 rounded-md">
                        <h4 className="font-semibold text-blue-700 mb-1">{t('prize_info')}</h4>
                        <p className="text-gray-700 text-sm">{t('total_pot_collected')} {game.totalPot?.toLocaleString('fa-IR') || 0} {t('toman')}</p>
                        <p className="text-gray-700 text-sm">{game.commissionAmount !== undefined ? `${t('commission_deducted')} ${game.commissionAmount.toLocaleString('fa-IR')} ${t('toman')}` : `${t('commission_deducted')} 0 ${t('toman')}`}</p>
                        <p className="text-gray-700 text-sm font-bold">{t('final_prize_amount')} {game.prizePool?.toLocaleString('fa-IR') || 0} {t('toman')}</p>
                        <p className="text-gray-700 text-sm">{t('first_place_prize')} {game.prizes?.firstPlace?.toLocaleString('fa-IR') || 0} {t('toman')}</p>
                        <p className="text-gray-700 text-sm">{t('second_place_prize')} {game.prizes?.secondPlace?.toLocaleString('fa-IR') || 0} {t('toman')}</p>
                        <p className="text-gray-700 text-sm">{t('third_place_prize')} {game.prizes?.thirdPlace?.toLocaleString('fa-IR') || 0} {t('toman')}</p>
                    </div>
                )}
                 {game.status === 'completed' && game.winners && (
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

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => handleDeleteGame(game._id)}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition duration-200"
                >
                  {t('delete_game')}
                </button>
                {game.status === 'open' && (
                  <button
                    onClick={() => handleCloseGameManually(game._id)}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-md transition duration-200"
                  >
                    {t('close_game_manually')}
                  </button>
                )}
                {(game.status === 'closed' || game.status === 'open') && !game.isRefunded && (
                    <button
                        onClick={() => handleCancelGameAndRefund(game._id, game.name)}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition duration-200"
                    >
                        {t('cancel_game_and_refund')}
                    </button>
                )}
              </div>
              {/* --- اصلاح شده: نمایش دکمه دانلود برای وضعیت‌های 'closed' یا 'completed' --- */}
              {(game.status === 'closed' || game.status === 'completed') && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleDownloadPredictions(game._id, game.name)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-200 ease-in-out w-full disabled:opacity-50"
                  >
                    {t('download_forms_csv')}
                  </button>
                </div>
              )}
              {/* --- پایان اصلاح شده --- */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AllTotoGames;
