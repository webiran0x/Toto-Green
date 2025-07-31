import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const PredictionFormSection = ({ selectedGame, onSubmitPrediction, formPrice, onPredictionChange, submitting }) => {
  const { t } = useLanguage();

  const [visibleMatches, setVisibleMatches] = useState(new Set());
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleMatches((prev) => {
          const newSet = new Set(prev);
          entries.forEach((entry) => {
            const id = entry.target.getAttribute('data-id');
            if (entry.isIntersecting) {
              newSet.add(id);
            } else {
              newSet.delete(id);
            }
          });
          return newSet;
        });
      },
      {
        root: containerRef.current, // مهم: کانتینر اسکرول رو روت میذاریم
        threshold: 0.1,
      }
    );

    const items = containerRef.current.querySelectorAll('.match-item');
    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [selectedGame.matches]);

  const getPredictionOutcomeText = (outcome) => {
    switch(outcome) {
      case '1': return t('home_win_abbr');
      case 'X': return t('draw_abbr');
      case '2': return t('away_win_abbr');
      default: return outcome;
    }
  };

  return (
    <div className="relative p-6 rounded-xl shadow-lg border border-clr-surface-a20 animate-fadeIn font-iranyekan overflow-hidden">
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-clr-surface-a10 to-transparent z-10 rounded-t-xl" />

      <div className="relative z-20">
        <h3 className="text-2xl font-bold text-clr-dark-a0 dark:text-clr-light-a0 mb-4 text-center">
          {t('predict_for')}: {selectedGame.name}
        </h3>
        <p className="text-xl font-bold text-clr-primary-a0 mb-6 text-center">
          {t('your_form_price')}: {formPrice.toLocaleString('fa-IR')} {t('usdt')}
        </p>
      </div>

      <form onSubmit={onSubmitPrediction}>
        <div
          ref={containerRef}
          className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto pr-2 relative"
          style={{ position: 'relative' }} // تضمین position برای root observer
        >
          {selectedGame.matches.map((match) => {
            const isVisible = visibleMatches.has(match._id);

            return (
              <div
                key={match._id}
                data-id={match._id}
                className={`match-item bg-clr-surface-a0 p-2 rounded-lg shadow-md border border-clr-surface-a20 transition duration-500
                  ${isVisible ? 'backdrop-blur-none bg-opacity-100' : 'backdrop-blur-sm bg-opacity-40'}
                `}
                style={{ transitionProperty: 'background-color, backdrop-filter' }}
              >
                <h4 className="text-lg font-semibold text-clr-dark-a0 dark:text-clr-light-a0 mb-2 text-center">
                  {match.homeTeam} <span className="text-clr-surface-a40 dark:text-clr-surface-a50">vs</span> {match.awayTeam}
                  <span className="block text-xs text-clr-dark-a0 dark:text-clr-light-a0 font-normal">
                    ({new Date(match.date).toLocaleDateString('fa-IR')})
                  </span>
                </h4>
                <div className="flex flex-row justify-center items-center gap-2">
                  {['1', 'X', '2'].map(outcome => {
                    const selected = onPredictionChange.predictions[match._id]?.includes(outcome);
                    return (
                      <button
                        key={outcome}
                        type="button"
                        onClick={() => onPredictionChange.handler(match._id, outcome)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition duration-150
                          ${selected
                            ? 'bg-clr-primary-a0 text-white'
                            : 'bg-clr-surface-tonal-a0 text-clr-dark-a0 dark:text-clr-light-a0 hover:bg-clr-surface-tonal-a10'}
                        `}
                      >
                        {getPredictionOutcomeText(outcome)}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="submit"
            disabled={submitting}
            className="bg-gradient-to-r from-clr-primary-a0 to-clr-primary-a10 hover:from-clr-primary-a10 hover:to-clr-primary-a20 text-clr-light-a0 font-bold py-3 px-8 rounded-lg text-xl focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {submitting
              ? t('submitting_prediction')
              : t('submit_prediction', {
                  price: formPrice.toLocaleString('fa-IR'),
                })}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PredictionFormSection;
