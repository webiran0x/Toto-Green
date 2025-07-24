//toto-frontend-user/src/components/OpenTotoGames.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';

function OpenTotoGames({ token, API_BASE_URL }) {
  const [openGames, setOpenGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [predictions, setPredictions] = useState({}); // { matchId: [outcome1, outcome2] }
  const [formPrice, setFormPrice] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // State برای کنترل مودال خطا
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalErrorMessage, setModalErrorMessage] = useState('');

  const { t } = useLanguage();

  const FORM_BASE_COST = 1;

  useEffect(() => {
    const fetchOpenGames = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/totos/open`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOpenGames(res.data);
      } catch (err) {
        setError(err.response?.data?.message || t('error_fetching_data'));
      } finally {
        setLoading(false);
      }
    };
    fetchOpenGames();
  }, [token, API_BASE_URL, t]);

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

  const handleGameSelect = (gameId) => {
    const game = openGames.find(g => g._id === gameId);
    setSelectedGame(game);
    setPredictions({});
    setFormPrice(0);
    setMessage('');
    setError('');
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

    if (!selectedGame) {
      setError(t('select_game_for_prediction_error'));
      setSubmitting(false);
      return;
    }

    try {
      const formattedPredictions = selectedGame.matches.map(match => {
        const chosenOutcome = predictions[match._id];
        if (!chosenOutcome || chosenOutcome.length === 0) {
          // به جای throw کردن خطا، مودال را باز می‌کنیم:
          setModalErrorMessage(
            t('please_select_at_least_one_outcome', { homeTeam: match.homeTeam, awayTeam: match.awayTeam })
          );
          setShowErrorModal(true);
          setSubmitting(false);
          throw new Error('Not all matches predicted');
        }
        return {
          matchId: match._id,
          chosenOutcome: chosenOutcome.sort(),
        };
      });

      await axios.post(
        `${API_BASE_URL}/totos/predict`,
        { totoGameId: selectedGame._id, predictions: formattedPredictions },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage(t('prediction_submitted_success'));
      setSelectedGame(null);
      setPredictions({});
      setFormPrice(0);

    } catch (err) {
      if (err.message === 'Not all matches predicted') {
        // خطا را در مودال مدیریت کردیم، فقط از تابع خارج می‌شویم.
        return;
      }
      setError(err.response?.data?.message || t('error_submitting_prediction'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-8">{t('loading')}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">{t('active_toto_games')}</h2>

      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 text-center">
          {message}
        </div>
      )}
      {error && !showErrorModal && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-center">
          {error}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="selectGame">
          {t('select_game_for_prediction')}:
        </label>
        {openGames.length === 0 ? (
          <p className="text-gray-600 text-center py-4">{t('no_active_games')}</p>
        ) : (
          <select
            id="selectGame"
            className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            value={selectedGame ? selectedGame._id : ''}
            onChange={(e) => handleGameSelect(e.target.value)}
          >
            <option value="">{t('select_game_placeholder')}</option>
            {openGames.map((game) => (
              <option key={game._id} value={game._id}>
                {game.name} ({t('deadline')}: {new Date(game.deadline).toLocaleString('fa-IR')})
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedGame && (
        <form onSubmit={handleSubmitPrediction} className="p-6 border border-blue-200 rounded-xl shadow-lg bg-blue-50">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            {t('predict_for')}: {selectedGame.name}
          </h3>
          <p className="text-xl font-bold text-blue-700 mb-6 text-center">
            {t('your_form_price')}: {formPrice.toLocaleString('fa-IR')} {t('usdt')}
          </p>

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
      )}

      {/* مودال خطا */}
      {showErrorModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-red-600">{t('error')}</h3>
            <p className="mb-6 text-gray-700">{modalErrorMessage}</p>
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
