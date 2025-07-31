// toto-landing/src/components/GameCard.js

import React from 'react';
import { PlayIcon, TrophyIcon, ArrowDownTrayIcon, EyeIcon } from '@heroicons/react/24/outline'; // NEW: EyeIcon اضافه شد
import { useLanguage } from '../contexts/LanguageContext';
import CountdownTimer from './CountdownTimer';


const GameCard = ({ game, type, onParticipate, onDownload, currentTheme, onViewDetails }) => { // NEW: onViewDetails اضافه شد
  const { t } = useLanguage();
  const isExpired = type === 'expired';

  const getStatusClasses = (status) => {
    switch (status) {
      case 'open': return 'bg-clr-primary-a50 text-clr-dark-a0 dark:bg-clr-primary-a10 dark:text-clr-light-a0';
      case 'closed': return 'bg-clr-surface-tonal-a10 text-clr-dark-a0 dark:bg-clr-surface-tonal-a20 dark:text-clr-light-a0';
      case 'completed': return 'bg-clr-surface-tonal-a30 text-clr-dark-a0 dark:bg-clr-surface-tonal-a40 dark:text-clr-light-a0';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-clr-surface-a10 text-clr-dark-a0 dark:bg-clr-surface-a20 dark:text-clr-light-a0';
    }
  };

  return (
    <div className="bg-clr-surface-a10 p-4 rounded-xl shadow-lg border border-clr-surface-a20 flex flex-col transform transition-transform duration-300 hover:scale-[1.02] text-sm animate-fadeIn font-iranyekan">
      <h3 className="text-lg font-bold text-clr-primary-a0 mb-2">{game.name}</h3>
      {!isExpired ? (
        <CountdownTimer deadline={game.deadline} currentTheme={currentTheme} />
      ) : (
        <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-xs flex items-center mb-1">
          {t('deadline')}: {new Date(game.deadline).toLocaleString('fa-IR')}
        </p>
      )}

      {isExpired && game.status && (
        <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-xs flex items-center mb-1">
          {t('game_status')}: <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getStatusClasses(game.status)}`}>
            {t(`status_${game.status}`)}
          </span>
        </p>
      )}
      <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-xs flex items-center mb-4">
        <TrophyIcon className="h-4 w-4 mr-2 text-clr-primary-a0" />
        {t('total_prize_pool')}: {game.totalPot?.toLocaleString('fa-IR') || 0} {t('usdt')}
      </p>

      {/* NEW: دکمه‌های عملیات بر اساس نوع بازی (فعال یا منقضی) */}
      {!isExpired ? (
        <button
          onClick={() => onParticipate(game)}
          className="mt-auto bg-clr-primary-a0 hover:bg-clr-primary-a10 text-clr-light-a0 font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center shadow-md text-sm"
        >
          <PlayIcon className="h-5 w-5 mr-2" /> {t('participate')}
        </button>
      ) : (
        <div className="mt-auto flex gap-3 justify-center"> {/* فاصله بیشتر با gap-3 */}
  <button
    onClick={() => onDownload(game._id)}
    className="flex-1 bg-clr-primary-a0 hover:bg-clr-primary-a10 text-clr-light-a0 font-medium py-1.5 px-3 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center shadow-sm text-xs"
  >
    <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" /> {t('download_excel')}
  </button>
  {game.status === 'completed' && (
    <button
      onClick={() => onViewDetails(game)}
      className="flex-1 bg-clr-surface-a30 hover:bg-clr-surface-a40 text-clr-dark-a0 dark:text-clr-light-a0 font-medium py-1.5 px-3 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center shadow-sm text-xs"
    >
      <EyeIcon className="h-4 w-4 mr-1.5" /> {t('view_details')}
    </button>
  )}
</div>

      )}
    </div>
  );
};

export default GameCard;