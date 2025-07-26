// toto-frontend-user/src/components/MyPredictions.js
// کامپوننت نمایش پیش‌بینی‌های کاربر با UI بهبود یافته، ریسپانسیو، فیلتر و صفحه‌بندی
// شامل نمایش نتایج درست/غلط و جزئیات جوایز

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import {
  FunnelIcon, // آیکون فیلتر
  ChevronLeftIcon, // برای صفحه‌بندی
  ChevronRightIcon, // برای صفحه‌بندی
  CheckCircleIcon, // آیکون موفقیت
  ExclamationCircleIcon, // آیکون خطا
  ClockIcon, // آیکون در انتظار
  XCircleIcon, // آیکون لغو
  TrophyIcon // آیکون جایزه
} from '@heroicons/react/24/outline'; // ایمپورت آیکون‌ها

function MyPredictions() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State های مربوط به صفحه‌بندی
  const [currentPage, setCurrentPage] = useState(1);
  const [predictionsPerPage] = useState(10); // تعداد پیش‌بینی در هر صفحه
  const [totalPredictions, setTotalPredictions] = useState(0); // کل پیش‌بینی‌ها (از بک‌اند)
  const [totalPages, setTotalPages] = useState(1); // کل صفحات (از بک‌اند)

  // State های مربوط به فیلتر
  const [filterGameStatus, setFilterGameStatus] = useState(''); // فیلتر بر اساس وضعیت بازی

  const { t } = useLanguage();

  // State برای مدیریت مودال تأیید جایزه
  const [showClaimConfirmModal, setShowClaimConfirmModal] = useState(false);
  const [claimGameId, setClaimGameId] = useState(null);
  const [claimGameName, setClaimGameName] = useState('');

  // State برای مدیریت مودال پیام (موفقیت یا خطا)
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success'); // 'success' or 'error'

  // تابع fetchMyPredictions را داخل useCallback قرار می‌دهیم
  const fetchMyPredictions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // ساخت URL کوئری با پارامترهای صفحه‌بندی و فیلتر
      const params = {
        page: currentPage,
        limit: predictionsPerPage,
      };
      if (filterGameStatus) {
        params.gameStatus = filterGameStatus;
      }

      const res = await axios.get('/users/my-predictions', { params }); // ارسال پارامترها
      
      setPredictions(res.data.predictions);
      setTotalPredictions(res.data.totalCount);
      setTotalPages(res.data.totalPages);

    } catch (err) {
      setError(err.response?.data?.message || t('error_fetching_data'));
      console.error('Error fetching my predictions:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, [t, currentPage, predictionsPerPage, filterGameStatus]); // وابستگی‌ها به‌روزرسانی شدند

  useEffect(() => {
    fetchMyPredictions();
  }, [fetchMyPredictions]);

  // هندلر تغییر صفحه
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // هندلر تغییر فیلتر وضعیت بازی
  const handleGameStatusFilterChange = (e) => {
    setFilterGameStatus(e.target.value);
    setCurrentPage(1); // با تغییر فیلتر، به صفحه اول برگرد
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

  // هندلر برای باز کردن مودال تأیید جایزه
  const handleClaimPrizeClick = (gameId, gameName) => {
    setClaimGameId(gameId);
    setClaimGameName(gameName);
    setShowClaimConfirmModal(true);
  };

  // هندلر برای عملیات نهایی درخواست جایزه پس از تأیید کاربر
  const confirmClaimPrize = async () => {
    setShowClaimConfirmModal(false);
    try {
      const res = await axios.post(`/users/claim-prize/${claimGameId}`);
      setAlertMessage(res.data.message);
      setAlertType('success');
      setShowAlertModal(true);
      fetchMyPredictions(); // رفرش کردن لیست پیش‌بینی‌ها برای به‌روزرسانی وضعیت
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

  // کلاس‌های CSS برای وضعیت بازی
  const getGameStatusClasses = (status) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="text-center py-8 text-gray-700">{t('loading')}</div>;
  if (error) return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-center">{error}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">{t('my_predictions_title')}</h2>
      
      {/* بخش فیلترها */}
      <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg shadow-inner border border-gray-200">
        <FunnelIcon className="h-6 w-6 text-gray-600" />
        <div className="w-full sm:w-auto">
          <label htmlFor="filterGameStatus" className="sr-only">{t('game_status')}</label>
          <select
            id="filterGameStatus"
            value={filterGameStatus}
            onChange={handleGameStatusFilterChange}
            className="block w-full sm:w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-sm"
          >
            <option value="">{t('all_statuses')}</option>
            <option value="open">{t('status_open')}</option>
            <option value="closed">{t('status_closed')}</option>
            <option value="completed">{t('status_completed')}</option>
            <option value="cancelled">{t('status_cancelled')}</option>
          </select>
        </div>
      </div>

      {predictions.length === 0 && !loading ? (
        <p className="text-gray-600 text-center py-4">{t('no_predictions_yet')}</p>
      ) : (
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
                <div key={prediction._id} className="bg-blue-50 p-4 rounded-xl shadow-lg border border-blue-200 flex flex-col transform transition-transform duration-300 hover:scale-[1.02] text-sm animate-fadeIn">
                  <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-blue-800">{t('game')}: {totoGame?.name || t('unknown')}</h3>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full border border-gray-200">
                          ID: {prediction.formId || 'N/A'}
                      </span>
                  </div>
                  
                  <p className="text-gray-700 mb-1">
                    {t('game_status')}:{' '}
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getGameStatusClasses(totoGame?.status)}`}>
                      {t(`status_${totoGame?.status}`)}
                    </span>
                  </p>
                  <p className="text-gray-700 mb-1">{t('form_submission_date')}: {new Date(prediction.createdAt).toLocaleString('fa-IR')}</p>
                  <p className="text-gray-700 mb-1">{t('form_cost')}: {prediction.price?.toLocaleString('fa-IR') || 0} {t('usdt')}</p>
                  <p className="text-gray-700 font-bold mb-1">
                    {t('score_earned')}: {prediction.isScored ? prediction.score : t('awaiting_scoring')}
                  </p>
                  <p className="text-gray-700 mb-1">{t('refunded')}: {prediction.isRefunded ? t('yes') : 'no'}</p>

                  {isGameCompleted && (
                      <p className="text-gray-700 font-bold mb-2">
                          {t('correct_predictions_count')}: {correctPredictionsCount} {t('out_of')} 15
                      </p>
                  )}

                  {isGameCompleted && isWinner && (
                      <div className="mt-2 mb-3 p-2 rounded-md border border-yellow-300 bg-yellow-50 flex items-center">
                          <TrophyIcon className="h-5 w-5 text-yellow-600 mr-2" />
                          <p className="text-yellow-800 font-bold text-sm">{t('congratulations_you_won')}</p>
                          {/* جزئیات جایزه */}
                          {totoGame.winners?.first?.includes(prediction.user?.toString() || prediction.user) && (
                              <p className="text-yellow-700 text-xs ml-auto">{t('prize_amount')}: {totoGame.prizes?.firstPlace?.toLocaleString('fa-IR')} {t('usdt')} ({t('first_place')})</p>
                          )}
                          {totoGame.winners?.second?.includes(prediction.user?.toString() || prediction.user) && (
                              <p className="text-yellow-700 text-xs ml-auto">{t('prize_amount')}: {totoGame.prizes?.secondPlace?.toLocaleString('fa-IR')} {t('usdt')} ({t('second_place')})</p>
                          )}
                          {totoGame.winners?.third?.includes(prediction.user?.toString() || prediction.user) && (
                              <p className="text-yellow-700 text-xs ml-auto">{t('prize_amount')}: {totoGame.prizes?.thirdPlace?.toLocaleString('fa-IR')} {t('usdt')} ({t('third_place')})</p>
                          )}
                      </div>
                  )}

                  <h4 className="font-semibold text-gray-800 mt-2 mb-1">{t('your_predictions')}:</h4>
                  <ul className="list-disc list-inside text-gray-600 text-xs max-h-24 overflow-y-auto pr-2">
                    {prediction.predictions.map((predItem, index) => {
                      const actualMatch = totoGame?.matches?.find(m => m._id === predItem.matchId);
                      const actualResult = actualMatch?.result;
                      const correct = isPredictionCorrect(predItem.chosenOutcome, actualResult);

                      return (
                        <li key={index} className="mb-0.5 flex items-center">
                          <span className="font-medium">
                            {getMatchDetails(totoGame?.matches || [], predItem.matchId)}:
                          </span>{' '}
                          <span className="font-bold text-blue-600">{getPredictionOutcomeText(predItem.chosenOutcome)}</span>
                          {actualResult && (
                            <span className="ml-1 text-gray-500">
                              ({t('result_label')}: {actualResult})
                              {correct !== null && (
                                <span className={`ml-0.5 ${correct ? 'text-green-600' : 'text-red-600'}`}>
                                  {correct ? ' ✔' : ' ✖'}
                                </span>
                              )}
                            </span>
                          )}
                          {isGameCancelled && actualMatch?.isCancelled && (
                              <span className="ml-1 text-red-500 font-bold">({t('cancelled')})</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  {/* دکمه درخواست جایزه */}
                  {isGameCompleted && isWinner && !prediction.isRefunded && (
                    <button
                      onClick={() => handleClaimPrizeClick(totoGame._id, totoGame.name)}
                      className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-md transition duration-200 w-full shadow-md hover:shadow-lg text-sm flex items-center justify-center"
                    >
                      <TrophyIcon className="h-5 w-5 mr-2" /> {t('claim_prize')}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* بخش صفحه‌بندی */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-6 space-x-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              {[...Array(totalPages).keys()].map(number => (
                <button
                  key={number + 1}
                  onClick={() => paginate(number + 1)}
                  className={`px-4 py-2 rounded-md font-semibold ${
                    currentPage === number + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } transition duration-150`}
                >
                  {number + 1}
                </button>
              ))}
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Confirmation Modal for Claim Prize */}
      {showClaimConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">{t('confirm_action')}</h3>
            <p className="mb-6 text-gray-700">
              {t('confirm_claim_prize', { gameName: claimGameName })}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowClaimConfirmModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded transition"
              >
                {t('cancel')}
              </button>
              <button
                onClick={confirmClaimPrize}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition"
              >
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal for Success/Error Messages */}
      {showAlertModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
            <h3 className={`text-xl font-bold mb-4 ${alertType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {alertType === 'success' ? t('success') : t('error')}
            </h3>
            <p className="mb-6 text-gray-700">{alertMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowAlertModal(false)}
                className={`py-2 px-4 rounded transition ${alertType === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
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

export default MyPredictions;
