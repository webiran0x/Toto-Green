// toto-frontend-user/src/components/MyPredictions.js
// کامپوننت نمایش پیش‌بینی‌های کاربر با UI بهبود یافته و ریسپانسیو
// شامل نمایش نتایج درست/غلط و جزئیات جوایز

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';

function MyPredictions({ token, API_BASE_URL }) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    const fetchMyPredictions = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/users/my-predictions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setPredictions(res.data);
      } catch (err) {
        setError(err.response?.data?.message || t('error_fetching_data'));
      } finally {
        setLoading(false);
      }
    };
    fetchMyPredictions();
  }, [token, API_BASE_URL, t]);

  const getPredictionOutcomeText = (outcomeArray) => {
    return outcomeArray.join('/');
  };

  const getMatchDetails = (totoGameMatches, matchId) => {
    const match = totoGameMatches.find(m => m._id === matchId);
    return match ? `${match.homeTeam} vs ${match.awayTeam}` : t('match_unknown');
  };

  const isPredictionCorrect = (chosenOutcome, actualResult) => {
    if (!actualResult) return null; // نتیجه هنوز ثبت نشده
    return chosenOutcome.includes(actualResult);
  };

  const handleClaimPrize = async (gameId, gameName) => {
    // از window.confirm استفاده نمی‌کنیم، یک مودال سفارشی جایگزین می‌کنیم
    // در اینجا برای سادگی، فرض می‌کنیم یک کامپوننت مودال برای تایید دارید
    // یا می‌توانید مستقیماً درخواست را ارسال کنید و پیام موفقیت/خطا را نمایش دهید.
    // برای این مثال، از یک تایید ساده استفاده می‌کنیم.
    if (window.confirm(t('confirm_claim_prize', { gameName }))) {
      try {
        const res = await axios.post(
          `${API_BASE_URL}/users/claim-prize/${gameId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        alert(res.data.message); // می‌توانید این را به یک مودال زیباتر تغییر دهید
        // رفرش کردن لیست پیش‌بینی‌ها برای به‌روزرسانی وضعیت
        setLoading(true);
        setError('');
        const updatedRes = await axios.get(`${API_BASE_URL}/users/my-predictions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPredictions(updatedRes.data);
      } catch (err) {
        alert(err.response?.data?.message || t('error_claiming_prize')); // می‌توانید این را به یک مودال زیباتر تغییر دهید
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) return <div className="text-center py-8 text-gray-700">{t('loading')}</div>;
  if (error) return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-center">{error}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">{t('my_predictions_title')}</h2>
      {predictions.length === 0 ? (
        <p className="text-gray-600 text-center py-4">{t('no_predictions_yet')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {predictions.map((prediction) => {
            const totoGame = prediction.totoGame;
            const isGameCompleted = totoGame?.status === 'completed';
            const isGameCancelled = totoGame?.status === 'cancelled';

            // محاسبه تعداد پیش‌بینی‌های درست
            let correctPredictionsCount = 0;
            if (isGameCompleted) {
                prediction.predictions.forEach(predItem => {
                    const actualMatch = totoGame.matches.find(m => m._id === predItem.matchId);
                    if (actualMatch && actualMatch.result && predItem.chosenOutcome.includes(actualMatch.result)) {
                        correctPredictionsCount++;
                    }
                });
            }

            // بررسی اینکه آیا کاربر برنده شده است
            const isWinner = isGameCompleted && prediction.score > 0 &&
                             (totoGame.winners.first.includes(prediction.user) ||
                              totoGame.winners.second.includes(prediction.user) ||
                              totoGame.winners.third.includes(prediction.user));

            return (
              <div key={prediction._id} className="bg-blue-50 p-6 rounded-xl shadow-lg border border-blue-200 flex flex-col transform transition-transform duration-300 hover:scale-[1.02]">
                <h3 className="text-xl font-bold text-blue-800 mb-3">{t('game')}: {totoGame?.name || t('unknown')}</h3>
                <p className="text-gray-700 text-sm mb-1">
                  {t('game_status')}:{' '}
                  <span className={`font-semibold ${
                    totoGame?.status === 'open' ? 'text-green-600' :
                    totoGame?.status === 'closed' ? 'text-orange-600' :
                    totoGame?.status === 'completed' ? 'text-purple-600' :
                    'text-red-600'
                  }`}>
                    {t(`status_${totoGame?.status}`)}
                  </span>
                </p>
                <p className="text-gray-700 text-sm mb-1">{t('form_submission_date')}: {new Date(prediction.createdAt).toLocaleString('fa-IR')}</p>
                <p className="text-gray-700 text-sm mb-1">{t('form_cost')}: {prediction.price?.toLocaleString('fa-IR') || 0} {t('usdt')}</p>
                <p className="text-gray-700 text-sm font-bold mb-3">
                  {t('score_earned')}: {prediction.isScored ? prediction.score : t('awaiting_scoring')}
                </p>
                <p className="text-gray-700 text-sm mb-3">{t('refunded')}: {prediction.isRefunded ? t('yes') : t('no')}</p>

                {isGameCompleted && (
                    <p className="text-gray-700 text-sm font-bold mb-3">
                        {t('correct_predictions_count')}: {correctPredictionsCount} {t('out_of')} 15
                    </p>
                )}

                {isGameCompleted && isWinner && (
                    <div className="mt-2 mb-3 bg-yellow-100 p-3 rounded-md border border-yellow-300">
                        <p className="text-yellow-800 font-bold text-md">{t('congratulations_you_won')}</p>
                        {totoGame.winners.first.includes(prediction.user) && (
                            <p className="text-yellow-700 text-sm">{t('prize_amount')}: {totoGame.prizes.firstPlace?.toLocaleString('fa-IR')} {t('usdt')} ({t('first_place')})</p>
                        )}
                        {totoGame.winners.second.includes(prediction.user) && (
                            <p className="text-yellow-700 text-sm">{t('prize_amount')}: {totoGame.prizes.secondPlace?.toLocaleString('fa-IR')} {t('usdt')} ({t('second_place')})</p>
                        )}
                        {totoGame.winners.third.includes(prediction.user) && (
                            <p className="text-yellow-700 text-sm">{t('prize_amount')}: {totoGame.prizes.thirdPlace?.toLocaleString('fa-IR')} {t('usdt')} ({t('third_place')})</p>
                        )}
                    </div>
                )}

                <h4 className="font-semibold text-gray-800 mt-3 mb-2">{t('your_predictions')}:</h4>
                <ul className="list-disc list-inside text-gray-600 text-sm max-h-32 overflow-y-auto pr-2">
                  {prediction.predictions.map((predItem, index) => {
                    const actualMatch = totoGame?.matches.find(m => m._id === predItem.matchId);
                    const actualResult = actualMatch?.result;
                    const correct = isPredictionCorrect(predItem.chosenOutcome, actualResult);

                    return (
                      <li key={index} className="mb-1 flex items-center">
                        <span className="font-medium">
                          {getMatchDetails(totoGame?.matches || [], predItem.matchId)}:
                        </span>{' '}
                        <span className="font-bold text-blue-600">{getPredictionOutcomeText(predItem.chosenOutcome)}</span>
                        {actualResult && (
  <span className="ml-2 text-gray-500">
    ({t('result_label')}: {actualResult})
    {correct !== null && (
      <span className={`ml-1 ${correct ? 'text-green-600' : 'text-red-600'}`}>
        {correct ? ' ✔' : ' ✖'}
      </span>
    )}
  </span>
)}

                        {isGameCancelled && actualMatch?.isCancelled && (
                            <span className="ml-2 text-red-500 font-bold">({t('cancelled')})</span>
                        )}
                      </li>
                    );
                  })}
                </ul>

                {/* دکمه درخواست جایزه */}
                {isGameCompleted && isWinner && !prediction.isRefunded && (
                  <button
                    onClick={() => handleClaimPrize(totoGame._id, totoGame.name)}
                    className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-md transition duration-200 w-full shadow-md hover:shadow-lg"
                  >
                    {t('claim_prize')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyPredictions;
