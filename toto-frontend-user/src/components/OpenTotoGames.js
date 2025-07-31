// toto-frontend-user/src/components/OpenTotoGames.js
// کامپوننت برای نمایش و ثبت پیش‌بینی در بازی‌های Toto فعال با UI بهبود یافته و بهینه

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import {
  ClockIcon,
  PlayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  XCircleIcon,
  FunnelIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

function OpenTotoGames() {
  const [openGames, setOpenGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [predictions, setPredictions] = useState({});
  const [formPrice, setFormPrice] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalErrorMessage, setModalErrorMessage] = useState('');

  const { t } = useLanguage();

  const FORM_BASE_COST = 1;

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

  useEffect(() => {
    fetchOpenGames();
  }, [fetchOpenGames]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

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

  const handleParticipateInGame = (game) => {
    setSelectedGame(game);
    setPredictions({});
    setFormPrice(0);
    setMessage('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
        setSelectedGame(null);
        setPredictions({});
        setFormPrice(0);
        fetchOpenGames();
      }, 2000);

    } catch (err) {
      if (err.response && err.response.data && err.response.data.errors && Array.isArray(err.response.data.errors)) {
        setModalErrorMessage(err.response.data.errors.map(e => e.msg || e.message).join('\n'));
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

  // NEW: کلاس‌های مربوط به لودینگ و خطا
  if (loading) return <div className="text-center py-8 text-clr-dark-a0 dark:text-clr-light-a0">{t('loading')}</div>; // OLD: text-gray-700 dark:text-gray-300
  if (error) return <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-4 text-center">{error}</div>;

  return (
    // OLD: bg-white dark:bg-gray-800
    <div className="bg-clr-surface-a0 p-6 rounded-lg shadow-md transition-colors duration-300"> 
      {/* OLD: text-gray-800 dark:text-white */}
      <h2 className="text-3xl font-extrabold text-clr-dark-a0 dark:text-clr-light-a0 mb-6 text-center">{t('active_toto_games')}</h2> 

      {/* پیام موفقیت یا خطا همیشه در بالای کامپوننت نمایش داده می‌شود */}
      {message && (
        <div 
          // Keep success message colors
          className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 px-4 py-3 rounded relative mb-4 text-center transition-colors duration-300"
          style={{ position: 'sticky', top: '1rem', zIndex: 1000 }}
        >
          {message}
        </div>
      )}
      {error && !showErrorModal && (
        <div 
          // Keep error message colors
          className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-4 text-center transition-colors duration-300"
          style={{ position: 'sticky', top: '1rem', zIndex: 1000 }}
        >
          {error}
        </div>
      )}

      {/* نمایش بازی‌های فعال در قالب کارت‌ها */}
      {openGames.length === 0 ? (
        // OLD: text-gray-600 dark:text-gray-400
        <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-center py-4">{t('no_active_games')}</p> 
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {openGames.map((game) => (
            <div 
              key={game._id} 
              // OLD: bg-blue-50 dark:bg-gray-700 border border-blue-200 dark:border-gray-600
              className="bg-clr-surface-a10 p-6 rounded-xl shadow-lg border border-clr-surface-a20 flex flex-col transform transition-transform duration-300 hover:scale-[1.02] animate-fadeIn transition-colors duration-300" 
            >
              {/* OLD: text-blue-800 dark:text-blue-200 */}
              <h3 className="text-xl font-bold text-clr-primary-a0 mb-2">{game.name}</h3> 
              {/* OLD: text-gray-700 dark:text-gray-300 text-gray-600 dark:text-gray-400 */}
              <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-sm flex items-center mb-1"> 
                <ClockIcon className="h-4 w-4 mr-2 text-clr-surface-a40 dark:text-clr-surface-a50" /> 
                {t('deadline')}: {new Date(game.deadline).toLocaleString('fa-IR')}
              </p>
              {/* OLD: text-gray-700 dark:text-gray-300 text-yellow-600 dark:text-yellow-400 */}
              <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-sm flex items-center mb-4"> 
                <TrophyIcon className="h-4 w-4 mr-2 text-clr-primary-a0" /> 
                {t('total_prize_pool')}: {game.totalPrizePool?.toLocaleString('fa-IR') || 0} {t('usdt')}
              </p>
              <button
                onClick={() => handleParticipateInGame(game)}
                // OLD: bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white
                className="mt-auto bg-clr-primary-a0 hover:bg-clr-primary-a10 text-clr-light-a0 font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center shadow-md" 
              >
                <PlayIcon className="h-5 w-5 mr-2" /> {t('participate')}
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedGame && (
        <div className="p-6 border border-clr-surface-a20 rounded-xl shadow-lg bg-clr-surface-a10 animate-fadeIn transition-colors duration-300"> {/* NEW: border-blue-200 dark:border-gray-600 bg-blue-50 dark:bg-gray-700 */}
          {/* OLD: text-gray-800 dark:text-white */}
          <h3 className="text-2xl font-bold text-clr-dark-a0 dark:text-clr-light-a0 mb-4 text-center"> 
            {t('predict_for')}: {selectedGame.name}
          </h3>
          {/* OLD: text-blue-700 dark:text-blue-400 */}
          <p className="text-xl font-bold text-clr-primary-a0 mb-6 text-center"> 
            {t('your_form_price')}: {formPrice.toLocaleString('fa-IR')} {t('usdt')}
          </p>

          <form onSubmit={handleSubmitPrediction}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedGame.matches.map((match) => (
                <div
                  key={match._id}
                  // OLD: bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                  className="bg-clr-surface-a0 p-5 rounded-lg shadow-md border border-clr-surface-a20 transform transition-transform duration-200 hover:scale-[1.02] transition-colors duration-300" 
                >
                  {/* OLD: text-gray-800 dark:text-white text-gray-500 dark:text-gray-400 text-gray-600 dark:text-gray-400 */}
                  <h4 className="text-lg font-semibold text-clr-dark-a0 dark:text-clr-light-a0 mb-3"> 
                    {match.homeTeam} <span className="text-clr-surface-a40 dark:text-clr-surface-a50">vs</span> {match.awayTeam} 
                    <span className="block text-sm text-clr-dark-a0 dark:text-clr-light-a0 font-normal"> 
                      ({new Date(match.date).toLocaleDateString('fa-IR')})
                    </span>
                  </h4>
                  <div className="flex flex-col space-y-2">
                    <label
                      // OLD: bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800
                      className="inline-flex items-center cursor-pointer bg-clr-surface-tonal-a0 p-2 rounded-md hover:bg-clr-surface-tonal-a10 transition duration-150 transition-colors duration-300"> 
                      <input
                        type="checkbox"
                        // OLD: text-blue-600 dark:text-blue-400 rounded focus:ring-blue-500 dark:focus:ring-blue-400
                        className="form-checkbox h-5 w-5 text-clr-primary-a0 rounded focus:ring-clr-primary-a0" 
                        checked={predictions[match._id]?.includes('1') || false}
                        onChange={() => handlePredictionChange(match._id, '1')}
                      />
                      {/* OLD: text-gray-700 dark:text-gray-200 */}
                      <span className="ml-2 text-clr-dark-a0 dark:text-clr-light-a0">{t('home_win_abbr', { homeTeam: match.homeTeam })}</span> 
                    </label>
                    <label
                      // OLD: bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800
                      className="inline-flex items-center cursor-pointer bg-clr-surface-tonal-a0 p-2 rounded-md hover:bg-clr-surface-tonal-a10 transition duration-150 transition-colors duration-300"> 
                      <input
                        type="checkbox"
                        // OLD: text-blue-600 dark:text-blue-400 rounded focus:ring-blue-500 dark:focus:ring-blue-400
                        className="form-checkbox h-5 w-5 text-clr-primary-a0 rounded focus:ring-clr-primary-a0" 
                        checked={predictions[match._id]?.includes('X') || false}
                        onChange={() => handlePredictionChange(match._id, 'X')}
                      />
                      {/* OLD: text-gray-700 dark:text-gray-200 */}
                      <span className="ml-2 text-clr-dark-a0 dark:text-clr-light-a0">{t('draw_abbr')}</span> 
                    </label>
                    <label
                      // OLD: bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800
                      className="inline-flex items-center cursor-pointer bg-clr-surface-tonal-a0 p-2 rounded-md hover:bg-clr-surface-tonal-a10 transition duration-150 transition-colors duration-300"> 
                      <input
                        type="checkbox"
                        // OLD: text-blue-600 dark:text-blue-400 rounded focus:ring-blue-500 dark:focus:ring-blue-400
                        className="form-checkbox h-5 w-5 text-clr-primary-a0 rounded focus:ring-clr-primary-a0" 
                        checked={predictions[match._id]?.includes('2') || false}
                        onChange={() => handlePredictionChange(match._id, '2')}
                      />
                      {/* OLD: text-gray-700 dark:text-gray-200 */}
                      <span className="ml-2 text-clr-dark-a0 dark:text-clr-light-a0">{t('away_win_abbr', { awayTeam: match.awayTeam })}</span> 
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <button
                type="submit"
                disabled={submitting}
                // OLD: bg-gradient-to-r from-green-600 to-teal-700 hover:from-green-700 hover:to-teal-800 dark:from-green-700 dark:to-teal-800 dark:hover:from-green-800 dark:hover:to-teal-900 text-white
                className="bg-gradient-to-r from-clr-primary-a0 to-clr-primary-a10 hover:from-clr-primary-a10 hover:to-clr-primary-a20 text-clr-light-a0 font-bold py-3 px-8 rounded-lg text-xl focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg" 
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
          {/* OLD: bg-white dark:bg-gray-800 */}
          <div className="bg-clr-surface-a0 rounded-lg shadow-lg max-w-md w-full p-6 transition-colors duration-300"> 
            {/* Keep red for error modal title */}
            <h3 className="text-xl font-bold mb-4 text-red-600 dark:text-red-400">{t('error')}</h3>
            {/* OLD: text-gray-700 dark:text-gray-300 */}
            <p className="mb-6 text-clr-dark-a0 dark:text-clr-light-a0 whitespace-pre-line">{modalErrorMessage}</p> 
            <div className="flex justify-end">
              <button
                onClick={() => setShowErrorModal(false)}
                // Keep red for error modal close button
                className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
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