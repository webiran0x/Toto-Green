// toto-landing/src/pages/MyPredictionsPage.js

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  TrophyIcon,
  ArrowPathIcon
} from 'lucide-react';

function MyPredictionsPage({ currentTheme, toggleTheme, isAuthenticated }) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [predictionsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [filterGameStatus, setFilterGameStatus] = useState('');

  const { t } = useLanguage();

  const fetchMyPredictions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page: currentPage,
        limit: predictionsPerPage,
      };
      if (filterGameStatus) {
        params.gameStatus = filterGameStatus;
      }

      const res = await axios.get('/users/my-predictions', { params });
      setPredictions(res.data.predictions);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      setError(err.response?.data?.message || t('error_fetching_data'));
      console.error('Error fetching my predictions:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, [t, currentPage, predictionsPerPage, filterGameStatus]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyPredictions();
    } else {
      setLoading(false);
      setPredictions([]);
      // می‌توانید یک پیام برای لاگین کردن کاربر نمایش دهید
    }
  }, [fetchMyPredictions, isAuthenticated]);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleGameStatusFilterChange = (e) => {
    setFilterGameStatus(e.target.value);
    setCurrentPage(1);
  };

  const getPredictionOutcomeText = (outcomeArray) => {
    return outcomeArray && outcomeArray.length > 0 ? outcomeArray.join('/') : 'N/A';
  };

  const getMatchDetails = (totoGameMatches, matchId) => {
    const match = totoGameMatches.find(m => m._id === matchId);
    return match ? `${match.homeTeam} vs ${match.awayTeam}` : t('match_unknown');
  };

  const isPredictionCorrect = (chosenOutcome, actualResult) => {
    if (!actualResult) return null;
    return Array.isArray(chosenOutcome) && chosenOutcome.includes(actualResult);
  };
  
  const getGameStatusClasses = (status) => {
    switch (status) {
      case 'open': return 'bg-clr-primary-a50 text-clr-dark-a0 dark:bg-clr-primary-a10 dark:text-clr-light-a0';
      case 'closed': return 'bg-clr-surface-tonal-a10 text-clr-dark-a0 dark:bg-clr-surface-tonal-a20 dark:text-clr-light-a0';
      case 'completed': return 'bg-clr-surface-tonal-a30 text-clr-dark-a0 dark:bg-clr-surface-tonal-a40 dark:text-clr-light-a0';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-clr-surface-a10 text-clr-dark-a0 dark:bg-clr-surface-a20 dark:text-clr-light-a0';
    }
  };

  const [showClaimConfirmModal, setShowClaimConfirmModal] = useState(false);
  const [claimGameId, setClaimGameId] = useState(null);
  const [claimGameName, setClaimGameName] = useState('');
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');

  const handleClaimPrizeClick = (gameId, gameName) => {
    setClaimGameId(gameId);
    setClaimGameName(gameName);
    setShowClaimConfirmModal(true);
  };

  const confirmClaimPrize = async () => {
    setShowClaimConfirmModal(false);
    try {
      const res = await axios.post(`/users/claim-prize/${claimGameId}`);
      setAlertMessage(res.data.message);
      setAlertType('success');
      setShowAlertModal(true);
      fetchMyPredictions();
    } catch (err) {
      setAlertMessage(err.response?.data?.message || t('error_claiming_prize'));
      setAlertType('error');
      setShowAlertModal(true);
      console.error('Error claiming prize:', err.response?.data || err.message);
    } finally {
      setClaimGameId(null);
      setClaimGameName('');
    }
  };

  return (
    <div className="bg-clr-surface-a0 min-h-screen flex flex-col font-iranyekan">
      <Header currentTheme={currentTheme} toggleTheme={toggleTheme} isAuthenticated={isAuthenticated} />
      <main className="flex-grow container mx-auto p-4 lg:p-8">
        <div className="bg-clr-surface-a0 p-6 rounded-lg shadow-xl border border-clr-surface-a20 overflow-hidden w-full max-w-full">
          <h1 className="text-3xl font-bold text-clr-dark-a0 dark:text-clr-light-a0 mb-6 text-center">{t('show_predictions')}</h1>
          <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mb-6 p-4 bg-clr-surface-a10 rounded-lg shadow-inner border border-clr-surface-a20 transition-colors duration-300 w-full overflow-x-auto">
            <FunnelIcon className="h-6 w-6 text-clr-surface-a40 dark:text-clr-surface-a50 flex-shrink-0" />
            <div className="w-full sm:w-auto">
              <label htmlFor="filterGameStatus" className="sr-only">{t('game_status')}</label>
              <select
                id="filterGameStatus"
                value={filterGameStatus}
                onChange={handleGameStatusFilterChange}
                className="block w-full sm:w-48 rounded-md border-clr-surface-a30 shadow-sm focus:border-clr-primary-a0 focus:ring-clr-primary-a0 p-2 text-sm bg-clr-surface-a10 text-clr-dark-a0 dark:text-clr-light-a0 transition-colors duration-300"
              >
                <option value="">{t('all_statuses')}</option>
                <option value="open">{t('status_open')}</option>
                <option value="closed">{t('status_closed')}</option>
                <option value="completed">{t('status_completed')}</option>
                <option value="cancelled">{t('status_cancelled')}</option>
              </select>
            </div>
          </div>
          {loading && <div className="text-center py-8 text-clr-dark-a0 dark:text-clr-light-a0">{t('loading')}</div>}
          {error && !loading && <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-4 text-center">{error}</div>}
          {!loading && !error && predictions.length === 0 ? (
            <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-center py-4">{t('no_predictions_yet')}</p>
          ) : (
            !loading && !error && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {predictions.map((prediction) => {
                    const totoGame = prediction.totoGame;
                    const isGameCompleted = totoGame?.status === 'completed';
                    const isGameCancelled = totoGame?.status === 'cancelled';
                    let correctPredictionsCount = 0;
                    if (isGameCompleted && totoGame?.matches) {
                        prediction.predictions.forEach(predItem => {
                            const actualMatch = totoGame.matches.find(m => m._id === predItem.matchId);
                            if (actualMatch && actualMatch.result && predItem.chosenOutcome.includes(actualMatch.result)) {
                                correctPredictionsCount++;
                            }
                        });
                    }
                    const isWinner = isGameCompleted && prediction.score > 0 &&
                                    (totoGame?.winners?.first?.includes(prediction.user?.toString() || prediction.user) ||
                                     totoGame?.winners?.second?.includes(prediction.user?.toString() || prediction.user) ||
                                     totoGame?.winners?.third?.includes(prediction.user?.toString() || prediction.user));
                    return (
                      <div key={prediction._id} className="bg-clr-surface-a10 p-4 rounded-xl shadow-lg border border-clr-surface-a20 flex flex-col transform transition-transform duration-300 hover:scale-[1.02] text-sm animate-fadeIn transition-colors duration-300">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-bold text-clr-primary-a0">{t('game')}: {totoGame?.name || t('unknown')}</h3>
                            <span className="text-xs text-clr-surface-a40 bg-clr-surface-a20 px-2 py-1 rounded-full border border-clr-surface-a30">
                                ID: {prediction.formId || 'N/A'}
                            </span>
                        </div>
                        <p className="text-clr-dark-a0 dark:text-clr-light-a0 mb-1">
                          {t('game_status')}:{' '}
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getGameStatusClasses(totoGame?.status)}`}>
                            {t(`status_${totoGame?.status}`)}
                          </span>
                        </p>
                        <p className="text-clr-dark-a0 dark:text-clr-light-a0 mb-1">{t('form_submission_date')}: {new Date(prediction.createdAt).toLocaleString('fa-IR')}</p>
                        <p className="text-clr-dark-a0 dark:text-clr-light-a0 mb-1">{t('form_cost')}: {prediction.price?.toLocaleString('fa-IR') || 0} {t('usdt')}</p>
                        <p className="text-clr-dark-a0 dark:text-clr-light-a0 font-bold mb-1">
                          {t('score_earned')}: {prediction.isScored ? prediction.score : t('awaiting_scoring')}
                        </p>
                        <p className="text-clr-dark-a0 dark:text-clr-light-a0 mb-1">{t('refunded')}: {prediction.isRefunded ? t('yes') : 'no'}</p>
                        {isGameCompleted && (
                            <p className="text-clr-dark-a0 dark:text-clr-light-a0 font-bold mb-2">
                                {t('correct_predictions_count')}: {correctPredictionsCount} {t('out_of')} 15
                            </p>
                        )}
                        {isGameCompleted && isWinner && (
                            <div className="mt-2 mb-3 p-2 rounded-md border border-clr-primary-a40 bg-clr-surface-tonal-a20 flex items-center transition-colors duration-300">
                                <TrophyIcon className="h-5 w-5 text-clr-primary-a0 mr-2 rtl:ml-2 rtl:mr-0" />
                                <p className="text-clr-dark-a0 dark:text-clr-light-a0 font-bold text-sm">{t('congratulations_you_won')}</p>
                                {totoGame.winners?.first?.includes(prediction.user?.toString() || prediction.user) && (
                                    <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-xs ml-auto">{t('prize_amount')}: {totoGame.prizes?.firstPlace?.toLocaleString('fa-IR')} {t('usdt')} ({t('first_place')})</p>
                                )}
                                {totoGame.winners?.second?.includes(prediction.user?.toString() || prediction.user) && (
                                    <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-xs ml-auto">{t('prize_amount')}: {totoGame.prizes?.secondPlace?.toLocaleString('fa-IR')} {t('usdt')} ({t('second_place')})</p>
                                )}
                                {totoGame.winners?.third?.includes(prediction.user?.toString() || prediction.user) && (
                                    <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-xs ml-auto">{t('prize_amount')}: {totoGame.prizes?.thirdPlace?.toLocaleString('fa-IR')} {t('usdt')} ({t('third_place')})</p>
                                )}
                            </div>
                        )}
                        <h4 className="font-semibold text-clr-dark-a0 dark:text-clr-light-a0 mt-2 mb-1">{t('your_predictions')}:</h4>
                        <ul className="list-disc list-inside text-clr-dark-a0 dark:text-clr-light-a0 text-xs max-h-24 overflow-y-auto pr-2 rtl:pl-2 rtl:pr-0">
                          {prediction.predictions.map((predItem, index) => {
                            const actualMatch = totoGame?.matches?.find(m => m._id === predItem.matchId);
                            const actualResult = actualMatch?.result;
                            const correct = isPredictionCorrect(predItem.chosenOutcome, actualResult);
                            return (
                              <li key={index} className="mb-0.5 flex items-center">
                                <span className="font-medium">
                                  {getMatchDetails(totoGame?.matches || [], predItem.matchId)}:
                                </span>{' '}
                                <span className="font-bold text-clr-primary-a0">{getPredictionOutcomeText(predItem.chosenOutcome)}</span>
                                {actualResult && (
                                  <span className="ml-1 rtl:mr-1 rtl:ml-0 text-clr-surface-a40 dark:text-clr-surface-a50">
                                    ({t('result_label')}: {actualResult})
                                    {correct !== null && (
                                      <span className={`ml-0.5 rtl:mr-0.5 rtl:ml-0 ${correct ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {correct ? ' ✔' : ' ✖'}
                                      </span>
                                    )}
                                  </span>
                                )}
                                {isGameCancelled && actualMatch?.isCancelled && (
                                  <span className="ml-1 rtl:mr-1 rtl:ml-0 text-red-500 dark:text-red-400 font-bold">({t('cancelled')})</span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                        {isGameCompleted && isWinner && !prediction.isRefunded && (
                          <button
                            onClick={() => handleClaimPrizeClick(totoGame._id, totoGame.name)}
                            className="mt-3 bg-clr-primary-a0 hover:bg-clr-primary-a10 text-clr-light-a0 font-bold py-2 px-4 rounded-md transition duration-200 w-full shadow-md hover:shadow-lg text-sm flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-clr-primary-a0 focus:ring-offset-2 dark:focus:ring-offset-clr-surface-a10"
                          >
                            <TrophyIcon className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" /> {t('claim_prize')}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-center items-center mt-6 space-x-2 rtl:space-x-reverse">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 rounded-md bg-clr-surface-a20 text-clr-dark-a0 dark:text-clr-light-a0 hover:bg-clr-surface-a30 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 transition-colors duration-300"
                    >
                      <ChevronLeftIcon className="h-5 w-5 rtl:rotate-180" />
                    </button>
                    {[...Array(totalPages).keys()].map(number => (
                      <button
                        key={number + 1}
                        onClick={() => paginate(number + 1)}
                        className={`px-4 py-2 rounded-md font-semibold ${
                          currentPage === number + 1 
                            ? 'bg-clr-primary-a0 text-clr-light-a0' 
                            : 'bg-clr-surface-a20 text-clr-dark-a0 hover:bg-clr-surface-a30 dark:text-clr-light-a0'
                        } transition duration-150 transition-colors duration-300`}
                      >
                        {number + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 rounded-md bg-clr-surface-a20 text-clr-dark-a0 dark:text-clr-light-a0 hover:bg-clr-surface-a30 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 transition-colors duration-300"
                    >
                      <ChevronRightIcon className="h-5 w-5 rtl:rotate-180" />
                    </button>
                  </div>
                )}
              </>
            )
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default MyPredictionsPage;
