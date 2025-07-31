// toto-landing/src/components/GameDetailsModal.js
// مودال نمایش جزئیات بازی تکمیل شده با نتایج و جوایز

import React from 'react';
import { XCircleIcon, CheckCircleIcon, XMarkIcon, TrophyIcon, ClipboardDocumentListIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../contexts/LanguageContext';

function GameDetailsModal({ isOpen, onClose, game }) {
  const { t } = useLanguage();
  if (!isOpen || !game) return null;

  // تابع برای تعیین صحت پیش‌بینی
  const isPredictionCorrect = (chosenOutcome, actualResult) => {
    if (!actualResult) return null;
    return Array.isArray(chosenOutcome) && chosenOutcome.includes(actualResult);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 font-iranyekan animate-fadeIn">
      <div className="bg-clr-surface-a0 dark:bg-clr-surface-a10 p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-2xl transition-colors duration-300 relative border border-clr-surface-a20 max-h-[90vh] overflow-y-auto">
        {/* دکمه بستن مودال */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-clr-dark-a0 dark:text-clr-light-a0 hover:text-clr-primary-a0 transition-colors duration-200"
          aria-label={t('close_modal')}
        >
          <XCircleIcon className="h-7 w-7" />
        </button>

        {/* عنوان مودال */}
        <h3 className="text-2xl font-extrabold text-center text-clr-dark-a0 dark:text-clr-light-a0 mb-6">
          {t('game_details_title', { gameName: game.name })}
        </h3>

        <div className="space-y-4 mb-6">
          {/* اطلاعات خلاصه جوایز و فرم‌ها */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-clr-surface-a20 p-4 rounded-lg flex items-center shadow-sm">
              <ClipboardDocumentListIcon className="h-6 w-6 text-clr-primary-a0 mr-3" />
              <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-lg font-semibold">
                {t('submitted_forms_count')}: {game.submittedFormsCount?.toLocaleString('fa-IR') || 0}
              </p>
            </div>
            <div className="bg-clr-surface-a20 p-4 rounded-lg flex items-center shadow-sm">
              <CurrencyDollarIcon className="h-6 w-6 text-clr-primary-a0 mr-3" />
              <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-lg font-semibold">
                {t('total_pot')}: {game.totalPot?.toLocaleString('fa-IR') || 0} {t('usdt')}
              </p>
            </div>
          </div>

          {/* اطلاعات نفرات برنده و جوایز */}
          {game.status === 'completed' && game.prizes && (
            <div className="bg-clr-surface-tonal-a0 p-4 rounded-lg shadow-sm border border-clr-surface-tonal-a10">
              <h4 className="text-xl font-bold text-clr-dark-a0 dark:text-clr-light-a0 mb-3">{t('prize_details')}</h4>
              {game.prizes.firstPlace > 0 && (
                <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-sm mb-1 flex items-center">
                  <TrophyIcon className="h-4 w-4 text-yellow-600 mr-2" />
                  {t('first_place')}: <span className="font-bold ml-1">{game.prizes.firstPlace.toLocaleString('fa-IR')} {t('usdt')}</span>
                  {game.winners?.first?.length > 0 && <span className="ml-2 text-xs font-medium text-clr-surface-a40">({game.winners.first.length} {t('winners')})</span>}
                </p>
              )}
              {game.prizes.secondPlace > 0 && (
                <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-sm mb-1 flex items-center">
                  <TrophyIcon className="h-4 w-4 text-gray-400 mr-2" />
                  {t('second_place')}: <span className="font-bold ml-1">{game.prizes.secondPlace.toLocaleString('fa-IR')} {t('usdt')}</span>
                  {game.winners?.second?.length > 0 && <span className="ml-2 text-xs font-medium text-clr-surface-a40">({game.winners.second.length} {t('winners')})</span>}
                </p>
              )}
              {game.prizes.thirdPlace > 0 && (
                <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-sm mb-1 flex items-center">
                  <TrophyIcon className="h-4 w-4 text-amber-700 mr-2" />
                  {t('third_place')}: <span className="font-bold ml-1">{game.prizes.thirdPlace.toLocaleString('fa-IR')} {t('usdt')}</span>
                  {game.winners?.third?.length > 0 && <span className="ml-2 text-xs font-medium text-clr-surface-a40">({game.winners.third.length} {t('winners')})</span>}
                </p>
              )}
               {game.prizes.firstPlace === 0 && game.prizes.secondPlace === 0 && game.prizes.thirdPlace === 0 && (
                  <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-sm text-center">{t('no_prize_awarded')}</p>
              )}
            </div>
          )}
        </div>

        {/* جدول نتایج مسابقات */}
        {game.status === 'completed' && game.matches && game.matches.length > 0 && (
          <div className="bg-clr-surface-a0 rounded-lg shadow-md border border-clr-surface-a20 overflow-x-auto">
            <table className="min-w-full divide-y divide-clr-surface-a20 dark:divide-clr-surface-a30">
              <thead className="bg-clr-surface-a10">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-clr-dark-a0 dark:text-clr-light-a0 uppercase tracking-wider">
                    {t('match')}
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-clr-dark-a0 dark:text-clr-light-a0 uppercase tracking-wider">
                    {t('result')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-clr-surface-a20 dark:divide-clr-surface-a30">
                {game.matches.map((match) => (
                  <tr key={match._id} className="bg-clr-surface-a0 dark:bg-clr-surface-a10 hover:bg-clr-surface-a20 dark:hover:bg-clr-surface-a20">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-clr-dark-a0 dark:text-clr-light-a0">{match.homeTeam} vs {match.awayTeam}</div>
                      <div className="text-xs text-clr-surface-a40 dark:text-clr-surface-a50">{new Date(match.date).toLocaleDateString('fa-IR')}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {match.result ? (
                        <span className="text-sm font-semibold text-clr-primary-a0 dark:text-clr-primary-a30 flex items-center">
                          {match.result}
                          {/* آیکون برای وضعیت بازی لغو شده */}
                          {match.isCancelled && (
                            <span className="ml-2 text-red-500 dark:text-red-400">({t('cancelled')}) <XMarkIcon className="h-4 w-4 inline-block" /></span>
                          )}
                        </span>
                      ) : (
                        <span className="text-sm text-clr-surface-a40 dark:text-clr-surface-a50">{t('pending_result')}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {game.status !== 'completed' && (
            <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-center mt-6">
                {t('game_not_completed_yet')}
            </p>
        )}
      </div>
    </div>
  );
}

export default GameDetailsModal;