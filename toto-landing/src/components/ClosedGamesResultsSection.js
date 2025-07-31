// toto-landing/src/components/ClosedGamesResultsSection.js

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import GameCard from './GameCard'; // ایمپورت GameCard

function ClosedGamesResultsSection({ expiredGames, onDownload, currentTheme, onViewDetails }) {
  const { t } = useLanguage();

  return (
    <section className="bg-clr-surface-a0 p-6 rounded-lg shadow-xl border border-clr-surface-a20 overflow-hidden lg:col-span-1">
      <h2 className="text-2xl font-bold text-clr-dark-a0 dark:text-clr-light-a0 mb-4 text-center">{t('closed_games_results')}</h2>
      {expiredGames.length === 0 ? (
        <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-center">{t('no_closed_games_found')}</p>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {expiredGames.map((game) => (
            <GameCard
              key={game._id}
              game={game}
              type="expired"
              onDownload={onDownload}
              currentTheme={currentTheme}
              onViewDetails={onViewDetails}
            />
          ))}
          <div className="text-center mt-4">
              <a href="/expired-games" className="text-clr-primary-a0 hover:underline">{t('view_all_closed_games')}</a>
          </div>
        </div>
      )}
    </section>
  );
}

export default ClosedGamesResultsSection;