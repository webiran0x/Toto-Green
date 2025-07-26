// toto-frontend-admin/src/components/ViewPredictions.js
// کامپوننت مشاهده پیش‌بینی‌های کاربران

import React, { useState, useEffect, useCallback } from 'react'; // useCallback اضافه شد
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';

// نیازی نیست token و API_BASE_URL به عنوان پراپ پاس داده شوند.
// axios.defaults.baseURL و axios.defaults.withCredentials در App.js تنظیم شده‌اند.
function ViewPredictions() { // 'token' و 'API_BASE_URL' از پراپس حذف شدند
  const [totoGames, setTotoGames] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [gamesLoading, setGamesLoading] = useState(true);
  const { t } = useLanguage();

  // تابع fetchTotoGames را داخل useCallback قرار می‌دهیم
  const fetchTotoGames = useCallback(async () => {
    try {
      setGamesLoading(true);
      setError('');
      setMessage(''); // پیام‌ها هم باید قبل از هر fetch جدید پاک شوند
      // درخواست Axios:
      // baseURL از axios.defaults.baseURL در App.js گرفته می‌شود.
      // کوکی‌ها به خاطر axios.defaults.withCredentials = true ارسال می‌شوند.
      const res = await axios.get('/admin/totos'); // '/api' از ابتدای مسیر حذف شد
      setTotoGames(res.data);
    } catch (err) {
      setError(err.response?.data?.message || t('error_fetching_data'));
      console.error('Error fetching Toto games for ViewPredictions:', err.response?.data || err.message); // لاگ برای اشکال‌زدایی
    } finally {
      setGamesLoading(false);
    }
  }, [t]); // t را به dependency array اضافه کنید

  // تابع fetchPredictions را داخل useCallback قرار می‌دهیم
  const fetchPredictions = useCallback(async () => {
    if (!selectedGameId) {
      setPredictions([]);
      return;
    }
    setLoading(true);
    setMessage('');
    setError('');
    try {
      // درخواست Axios:
      // baseURL از axios.defaults.baseURL در App.js گرفته می‌شود.
      // کوکی‌ها به خاطر axios.defaults.withCredentials = true ارسال می‌شوند.
      const res = await axios.get(`/admin/predictions/${selectedGameId}`); // '/api' از ابتدای مسیر حذف شد
      setPredictions(res.data);
      if (res.data.length === 0) {
        setMessage(t('no_predictions_found_for_game'));
      }
    } catch (err) {
      setError(err.response?.data?.message || t('error_fetching_data'));
      console.error('Error fetching predictions for selected game:', err.response?.data || err.message); // لاگ برای اشکال‌زدایی
    } finally {
      setLoading(false);
    }
  }, [selectedGameId, t]); // selectedGameId و t را به dependency array اضافه کنید

  useEffect(() => {
    fetchTotoGames();
  }, [fetchTotoGames]); // fetchTotoGames را به dependency array اضافه کنید

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]); // fetchPredictions را به dependency array اضافه کنید

  const getMatchDetails = (matchId) => {
    const selectedGame = totoGames.find(game => game._id === selectedGameId);
    if (selectedGame) {
      const match = selectedGame.matches.find(m => m._id === matchId);
      return match ? `${match.homeTeam} vs ${match.awayTeam}` : t('match_unknown');
    }
    return t('match_unknown');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('view_user_predictions')}</h2>
      {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">{message}</div>}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="selectGame">
          {t('select_toto_game')}
        </label>
        {gamesLoading ? (
          <p>{t('loading')}</p>
        ) : (
          <select
            id="selectGame"
            className="shadow border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedGameId}
            onChange={(e) => setSelectedGameId(e.target.value)}
          >
            <option value="">{t('select_game_placeholder')}</option>
            {totoGames.map((game) => (
              <option key={game._id} value={game._id}>
                {game.name} ({t(`status_${game.status}`)})
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">{t('loading')}</div>
      ) : (
        predictions.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">{t('prediction_details')}</h3>
            <div className="grid grid-cols-1 gap-4">
              {predictions.map((prediction) => (
                <div key={prediction._id} className="bg-gray-50 p-4 rounded-md shadow-sm border border-gray-200">
                  <p className="font-bold text-lg text-blue-700 mb-2">{t('user')}: {prediction.user?.username || t('unknown')}</p>
                  <p className="text-gray-700 text-sm mb-1">
                      {t('form_id')}: {prediction.formId || prediction._id}
                  </p>
                  <p className="text-gray-700 text-sm mb-1">{t('form_price')}: {prediction.price}</p>
                  <p className="text-gray-700 text-sm mb-1">{t('score_earned')}: {prediction.score} ({t('scored')}: {prediction.isScored ? t('yes') : t('no')})</p>
                  <p className="text-gray-700 text-sm mb-2">{t('submission_date')}: {new Date(prediction.createdAt).toLocaleString('fa-IR')}</p>
                  <p className="text-gray-700 text-sm mb-2">{t('refunded')}: {prediction.isRefunded ? t('yes') : t('no')}</p>


                  <h4 className="font-semibold text-gray-800 mt-3 mb-2">{t('prediction_details')}:</h4>
                  <ul className="list-disc list-inside text-gray-600">
                    {prediction.predictions.map((predItem, index) => (
                      <li key={index} className="mb-1">
                        <span className="font-medium">{getMatchDetails(predItem.matchId)}:</span>{' '}
                        {predItem.chosenOutcome.join(', ')}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )
      )}
      {selectedGameId && !loading && predictions.length === 0 && !message && (
        <p className="text-gray-600 mt-4">{t('no_predictions_found')}</p>
      )}
    </div>
  );
}

export default ViewPredictions;