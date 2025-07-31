// toto-landing/src/components/PredictionFormSectionWrapper.js

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import PredictionFormSection from './PredictionFormSection'; // ایمپورت PredictionFormSection

function PredictionFormSectionWrapper({ selectedGameForPrediction, onSubmitPrediction, formPriceForForm, onPredictionChange, submittingPrediction, FORM_BASE_COST }) {
  const { t } = useLanguage();

  return (
    <section className="bg-clr-surface-a0 p-6 rounded-lg shadow-xl border border-clr-surface-a20 overflow-hidden lg:col-span-2">
      <h2 className="text-2xl font-bold text-clr-dark-a0 dark:text-clr-light-a0 mb-4 text-center">{t('prediction_form')}</h2>
      {selectedGameForPrediction ? (
        <PredictionFormSection
          selectedGame={selectedGameForPrediction}
          onSubmitPrediction={onSubmitPrediction}
          formPrice={formPriceForForm}
          onPredictionChange={onPredictionChange}
          submitting={submittingPrediction}
          FORM_BASE_COST={FORM_BASE_COST}
        />
      ) : (
        <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-center">{t('select_game_to_predict')}</p>
      )}
    </section>
  );
}

export default PredictionFormSectionWrapper;