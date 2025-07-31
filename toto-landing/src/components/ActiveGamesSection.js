// toto-landing/src/components/ActiveGamesSection.js

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import GameCard from './GameCard'; // ایمپورت GameCard

function ActiveGamesSection({ openGames, onParticipate, currentTheme }) {
  const { t } = useLanguage();

  return (
    <section className="bg-clr-surface-a0 p-6 rounded-lg shadow-xl border border-clr-surface-a20 overflow-hidden lg:col-span-1n">
      <h2 className="text-2xl font-bold text-clr-dark-a0 dark:text-clr-light-a0 mb-4 text-center">{t('active_toto_games')}</h2>
      {openGames.length === 0 ? (
        <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-center">{t('no_active_games')}</p>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {openGames.slice(0, 5).map((game) => ( // نمایش 5 بازی اول
            <GameCard
              key={game._id}
              game={game}
              type="open"
              onParticipate={onParticipate}
              currentTheme={currentTheme}
            />
          ))}
          {openGames.length > 5 && (
              <div className="text-center mt-4">
                  <a href="/games" className="text-clr-primary-a0 hover:underline">{t('view_all_games')}</a>
              </div>
          )}
        </div>
      )}
    </section>
  );
}

export default ActiveGamesSection;