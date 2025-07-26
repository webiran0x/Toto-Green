// toto-frontend-user/src/components/OpenTotoGames.js
// کامپوننت برای نمایش و ثبت پیش‌بینی در بازی‌های Toto فعال با UI بهبود یافته و بهینه

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import {
  ClockIcon, // آیکون ساعت برای مهلت
  PlayIcon, // آیکون بازی برای دکمه شرکت
  CheckCircleIcon, // آیکون موفقیت
  ExclamationCircleIcon, // آیکون خطا
  ArrowPathIcon, // آیکون پردازش
  XCircleIcon, // آیکون بستن
  FunnelIcon, // آیکون فیلتر (اگر اضافه شود)
  TrophyIcon // آیکون جایزه (برای اطلاعات بازی)
} from '@heroicons/react/24/outline'; // ایمپورت آیکون‌ها

function OpenTotoGames() {
  const [openGames, setOpenGames] = useState([]); // لیست بازی‌های Toto فعال
  const [selectedGame, setSelectedGame] = useState(null); // بازی انتخاب شده توسط کاربر برای پیش‌بینی
  const [predictions, setPredictions] = useState({}); // پیش‌بینی‌های کاربر: { matchId: [outcome1, outcome2] }
  const [formPrice, setFormPrice] = useState(0); // قیمت محاسبه شده برای فرم پیش‌بینی
  const [message, setMessage] = useState(''); // پیام‌های موفقیت
  const [error, setError] = useState(''); // پیام‌های خطا
  const [loading, setLoading] = useState(true); // وضعیت بارگذاری اولیه بازی‌ها
  const [submitting, setSubmitting] = useState(false); // وضعیت ارسال پیش‌بینی

  // State برای کنترل مودال خطا
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalErrorMessage, setModalErrorMessage] = useState('');

  const { t } = useLanguage(); // تابع ترجمه از Context زبان

  // هزینه پایه برای هر ترکیب پیش‌بینی (مثلاً 1 USDT)
  const FORM_BASE_COST = 1; 

  // تابع برای واکشی لیست بازی‌های Toto فعال از بک‌اند
  const fetchOpenGames = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setMessage(''); 
      const res = await axios.get('/totos/open'); 
      setOpenGames(res.data);
    } catch (err) {
      setError(err.response?.data?.message || t('error_fetching_data'));
      console.error('Error fetching open games:', err.response?.data || err.message); 
    } finally {
      setLoading(false); 
    }
  }, [t]); 

  // useEffect برای واکشی بازی‌ها هنگام بارگذاری اولیه کامپوننت
  useEffect(() => {
    fetchOpenGames();
  }, [fetchOpenGames]);

  // useEffect برای پاکسازی پیام موفقیت پس از چند ثانیه
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 5000); // پیام پس از 5 ثانیه ناپدید می‌شود
      return () => clearTimeout(timer); // پاکسازی تایمر در صورت unmount شدن کامپوننت یا تغییر پیام
    }
  }, [message]);

  // محاسبه فرمول قیمت بر اساس انتخاب‌های کاربر
  useEffect(() => {
    let calculatedCombinations = 1;
    if (selectedGame) {
      selectedGame.matches.forEach(match => {
        const outcomes = predictions[match._id];
        if (outcomes && outcomes.length > 0) {
          calculatedCombinations *= outcomes.length; 
        } else {
          calculatedCombinations *= 1; 
        }
      });
      setFormPrice(calculatedCombinations * FORM_BASE_COST);
    } else {
      setFormPrice(0); 
    }
  }, [predictions, selectedGame, FORM_BASE_COST]); 

  // هندلر برای انتخاب یک بازی جهت شرکت (این تابع جایگزین handleGameSelect قبلی می‌شود)
  const handleParticipateInGame = (game) => {
    setSelectedGame(game); // بازی را انتخاب می‌کند
    setPredictions({}); // پیش‌بینی‌های قبلی را پاک می‌کند
    setFormPrice(0); // قیمت فرم را ریست می‌کند
    setMessage(''); // پیام‌ها را پاک می‌کند
    setError(''); // خطاها را پاک می‌کند
    // می‌توانید به قسمتی از صفحه که فرم در آن است اسکرول کنید
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // هندلر برای تغییر پیش‌بینی‌های کاربر برای یک مسابقه خاص
  const handlePredictionChange = (matchId, outcome) => {
    setPredictions(prev => {
      const currentOutcomes = prev[matchId] || []; 
      let newOutcomes;

      if (currentOutcomes.includes(outcome)) {
        newOutcomes = currentOutcomes.filter(o => o !== outcome);
      } else {
        newOutcomes = [...currentOutcomes, outcome];
      }
      return { ...prev, [matchId]: newOutcomes }; 
    });
  };

  // هندلر برای ارسال فرم پیش‌بینی به بک‌اند
  const handleSubmitPrediction = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSubmitting(true); 
    setShowErrorModal(false); 
    setModalErrorMessage(''); 

    if (!selectedGame) {
      setModalErrorMessage(t('select_game_for_prediction_error'));
      setShowErrorModal(true);
      setSubmitting(false);
      return; 
    }

    try {
      const formattedPredictions = [];
      let allMatchesPredicted = true; 

      for (const match of selectedGame.matches) {
        const chosenOutcome = predictions[match._id];
        if (!chosenOutcome || chosenOutcome.length === 0) {
          setModalErrorMessage(
            t('please_select_at_least_one_outcome', { homeTeam: match.homeTeam, awayTeam: match.awayTeam })
          );
          setShowErrorModal(true);
          allMatchesPredicted = false; 
          break; 
        }
        formattedPredictions.push({
          matchId: match._id,
          chosenOutcome: chosenOutcome.sort(), 
        });
      }

      if (!allMatchesPredicted) {
        setSubmitting(false);
        return; 
      }
      
      let calculatedCombinationsFinal = 1;
      formattedPredictions.forEach(pred => {
          calculatedCombinationsFinal *= pred.chosenOutcome.length;
      });
      const finalFormPriceCalculated = calculatedCombinationsFinal * FORM_BASE_COST;

      const payload = {
        gameId: selectedGame._id, 
        predictions: formattedPredictions,
        formAmount: finalFormPriceCalculated, 
      };

      const res = await axios.post('/users/predict', payload); 

      const formId = res.data.prediction?.formId; 
      const successMessage = t('prediction_submitted_success_with_code', { formId: formId || 'N/A' });
      setMessage(successMessage); 

      setTimeout(() => {
        setSelectedGame(null); // بازی انتخاب شده را پاک می‌کند
        setPredictions({}); // پیش‌بینی‌ها را پاک می‌کند
        setFormPrice(0); // قیمت فرم را ریست می‌کند
        fetchOpenGames(); // لیست بازی‌های فعال را دوباره واکشی می‌کند تا به‌روز شود.
      }, 2000); // 2 ثانیه تأخیر

    } catch (err) {
      if (err.response && err.response.data && err.response.data.errors && Array.isArray(err.response.data.errors)) {
        setModalErrorMessage(err.response.data.errors.join('\n')); 
        setShowErrorModal(true);
      } else {
        setError(err.response?.data?.message || t('error_submitting_prediction'));
        if (!showErrorModal) {
            setModalErrorMessage(err.response?.data?.message || t('error_submitting_prediction'));
            setShowErrorModal(true);
        }
      }
      console.error('Error submitting prediction:', err.response?.data || err.message); 
    } finally {
      setSubmitting(false); 
    }
  };

  if (loading) return <div className="text-center py-8 text-gray-700">{t('loading')}</div>;
  if (error) return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-center">{error}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">{t('active_toto_games')}</h2>

      {/* پیام موفقیت یا خطا همیشه در بالای کامپوننت نمایش داده می‌شود */}
      {message && (
        <div 
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 text-center"
          style={{ position: 'sticky', top: '1rem', zIndex: 1000, backgroundColor: '#d1fae5', borderColor: '#34d399', color: '#065f46' }} 
        >
          {message}
        </div>
      )}
      {error && !showErrorModal && ( 
        <div 
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-center"
          style={{ position: 'sticky', top: '1rem', zIndex: 1000, backgroundColor: '#fee2e2', borderColor: '#ef4444', color: '#b91c1c' }} 
        >
          {error}
        </div>
      )}

      {/* نمایش بازی‌های فعال در قالب کارت‌ها */}
      {openGames.length === 0 ? (
        <p className="text-gray-600 text-center py-4">{t('no_active_games')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {openGames.map((game) => (
            <div 
              key={game._id} 
              className="bg-blue-50 p-6 rounded-xl shadow-lg border border-blue-200 flex flex-col transform transition-transform duration-300 hover:scale-[1.02] animate-fadeIn"
            >
              <h3 className="text-xl font-bold text-blue-800 mb-2">{game.name}</h3>
              <p className="text-gray-700 text-sm flex items-center mb-1">
                <ClockIcon className="h-4 w-4 mr-2 text-gray-600" />
                {t('deadline')}: {new Date(game.deadline).toLocaleString('fa-IR')}
              </p>
              <p className="text-gray-700 text-sm flex items-center mb-4">
                <TrophyIcon className="h-4 w-4 mr-2 text-yellow-600" />
                {t('total_prize_pool')}: {game.totalPrizePool?.toLocaleString('fa-IR') || 0} {t('usdt')}
              </p>
              <button
                onClick={() => handleParticipateInGame(game)}
                className="mt-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center"
              >
                <PlayIcon className="h-5 w-5 mr-2" /> {t('participate')}
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedGame && ( // فرم پیش‌بینی فقط در صورت انتخاب بازی نمایش داده می‌شود
        <div className="p-6 border border-blue-200 rounded-xl shadow-lg bg-blue-50 animate-fadeIn">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            {t('predict_for')}: {selectedGame.name}
          </h3>
          <p className="text-xl font-bold text-blue-700 mb-6 text-center">
            {t('your_form_price')}: {formPrice.toLocaleString('fa-IR')} {t('usdt')}
          </p>

          <form onSubmit={handleSubmitPrediction}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedGame.matches.map((match) => (
                <div
                  key={match._id}
                  className="bg-white p-5 rounded-lg shadow-md border border-gray-200 transform transition-transform duration-200 hover:scale-[1.02]"
                >
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">
                    {match.homeTeam} <span className="text-gray-500">vs</span> {match.awayTeam}
                    <span className="block text-sm text-gray-600 font-normal">
                      ({new Date(match.date).toLocaleDateString('fa-IR')})
                    </span>
                  </h4>
                  <div className="flex flex-col space-y-2">
                    <label className="inline-flex items-center cursor-pointer bg-blue-100 p-2 rounded-md hover:bg-blue-200 transition duration-150">
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-blue-600 rounded"
                        checked={predictions[match._id]?.includes('1') || false}
                        onChange={() => handlePredictionChange(match._id, '1')}
                      />
                      <span className="ml-2 text-gray-700">{t('home_win_abbr', { homeTeam: match.homeTeam })}</span>
                    </label>
                    <label className="inline-flex items-center cursor-pointer bg-blue-100 p-2 rounded-md hover:bg-blue-200 transition duration-150">
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-blue-600 rounded"
                        checked={predictions[match._id]?.includes('X') || false}
                        onChange={() => handlePredictionChange(match._id, 'X')}
                      />
                      <span className="ml-2 text-gray-700">{t('draw_abbr')}</span>
                    </label>
                    <label className="inline-flex items-center cursor-pointer bg-blue-100 p-2 rounded-md hover:bg-blue-200 transition duration-150">
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-blue-600 rounded"
                        checked={predictions[match._id]?.includes('2') || false}
                        onChange={() => handlePredictionChange(match._id, '2')}
                      />
                      <span className="ml-2 text-gray-700">{t('away_win_abbr', { awayTeam: match.awayTeam })}</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-green-600 to-teal-700 hover:from-green-700 hover:to-teal-800 text-white font-bold py-3 px-8 rounded-lg text-xl focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {submitting ? t('submitting_prediction') : t('submit_prediction', { price: formPrice.toLocaleString('fa-IR') })}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* مودال خطا */}
      {showErrorModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-red-600">{t('error')}</h3>
            <p className="mb-6 text-gray-700 whitespace-pre-line">{modalErrorMessage}</p> 
            <div className="flex justify-end">
              <button
                onClick={() => setShowErrorModal(false)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OpenTotoGames;
