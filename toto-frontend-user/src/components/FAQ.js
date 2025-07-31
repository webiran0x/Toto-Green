// toto-frontend-user/src/components/FAQ.js
// کامپوننت صفحه پرسش و پاسخ (FAQ) با Tailwind CSS و پشتیبانی از حالت تیره

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  MagnifyingGlassIcon,
  UserCircleIcon,
  CurrencyDollarIcon,
  PuzzlePieceIcon,
  TrophyIcon,
  QuestionMarkCircleIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { ChevronDown } from 'lucide-react'

// داده‌های واقعی (Real Data) برای سوالات متداول مرتبط با سیستم توتو
const faqData = [
  {
    category: 'account_management',
    icon: UserCircleIcon,
    titleKey: 'faq_category_account_management',
    descriptionKey: 'faq_category_account_management_desc',
    questions: [
      { qKey: 'faq_account_q1', aKey: 'faq_account_a1' },
      { qKey: 'faq_account_q2', aKey: 'faq_account_a2' },
      { qKey: 'faq_account_q3', aKey: 'faq_account_a3' },
      { qKey: 'faq_account_q4', aKey: 'faq_account_a4' }
    ]
  },
  {
    category: 'deposits_withdrawals',
    icon: CurrencyDollarIcon,
    titleKey: 'faq_category_deposits_withdrawals',
    descriptionKey: 'faq_category_deposits_withdrawals_desc',
    questions: [
      { qKey: 'faq_deposits_q1', aKey: 'faq_deposits_a1' },
      { qKey: 'faq_deposits_q2', aKey: 'faq_deposits_a2' },
      { qKey: 'faq_deposits_q3', aKey: 'faq_deposits_a3' },
      { qKey: 'faq_deposits_q4', aKey: 'faq_deposits_a4' },
      { qKey: 'faq_deposits_q5', aKey: 'faq_deposits_a5' }
    ]
  },
  {
    category: 'playing_games',
    icon: PuzzlePieceIcon,
    titleKey: 'faq_category_playing_games',
    descriptionKey: 'faq_category_playing_games_desc',
    questions: [
      { qKey: 'faq_games_q1', aKey: 'faq_games_a1' },
      { qKey: 'faq_games_q2', aKey: 'faq_games_a2' },
      { qKey: 'faq_games_q3', aKey: 'faq_games_a3' },
      { qKey: 'faq_games_q4', aKey: 'faq_games_a4' },
      { qKey: 'faq_games_q5', aKey: 'faq_games_a5' }
    ]
  },
  {
    category: 'prizes_rewards',
    icon: TrophyIcon,
    titleKey: 'faq_category_prizes_rewards',
    descriptionKey: 'faq_category_prizes_rewards_desc',
    questions: [
      { qKey: 'faq_prizes_q1', aKey: 'faq_prizes_a1' },
      { qKey: 'faq_prizes_q2', aKey: 'faq_prizes_a2' },
      { qKey: 'faq_prizes_q3', aKey: 'faq_prizes_a3' }
    ]
  },
  {
    category: 'technical_support',
    icon: QuestionMarkCircleIcon,
    titleKey: 'faq_category_technical_support',
    descriptionKey: 'faq_category_technical_support_desc',
    questions: [
      { qKey: 'faq_support_q1', aKey: 'faq_support_a1' },
      { qKey: 'faq_support_q2', aKey: 'faq_support_a2' },
      { qKey: 'faq_support_q3', aKey: 'faq_support_a3' }
    ]
  }
];

function FAQ() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('account_management');
  const [searchTerm, setSearchTerm] = useState('');
  const [openAccordions, setOpenAccordions] = useState({});

  const filteredQuestions = faqData.find(cat => cat.category === activeTab)
    ?.questions.filter(q =>
      t(q.qKey).toLowerCase().includes(searchTerm.toLowerCase()) ||
      t(q.aKey).toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const handleAccordionToggle = (qKey) => {
    setOpenAccordions(prev => ({
      ...prev,
      [qKey]: !prev[qKey]
    }));
  };

  return (
    <div className="min-h-screen bg-clr-surface-a10 dark:bg-clr-surface-a0 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-inter transition-colors duration-300"> 
      <div className="bg-clr-surface-a0 p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-3xl text-center mb-8 transition-colors duration-300"> 
        <h2 className="text-3xl font-extrabold text-clr-dark-a0 dark:text-clr-light-a0 mb-4">{t('faq_main_title')}</h2> 
        <p className="text-clr-dark-a0 dark:text-clr-light-a0 mb-6 leading-relaxed">{t('faq_main_description')}</p> 

        <div className="relative w-full max-w-md mx-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-clr-surface-a40 dark:text-clr-surface-a50" /> 
          </div>
          <input
            type="text"
            placeholder={t('search_question_placeholder')}
            className="block w-full rounded-lg border-clr-surface-a30 shadow-sm focus:border-clr-primary-a0 focus:ring-clr-primary-a0 p-3 pl-10 text-lg bg-clr-surface-a10 text-clr-dark-a0 dark:text-clr-light-a0 transition duration-200 ease-in-out placeholder-clr-surface-a40 dark:placeholder-clr-surface-a50" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <p className="text-clr-dark-a0 dark:text-clr-light-a0 mt-4 text-sm">{t('or_choose_category')}</p> 
      <div className="flex flex-col lg:flex-row w-full max-w-5xl gap-6">
        <div className="flex-shrink-0 w-full lg:w-1/4 bg-clr-surface-a0 rounded-2xl shadow-xl p-4 transition-colors duration-300"> 
          <div className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2 overflow-x-auto lg:overflow-x-hidden pb-2 lg:pb-0">
            {faqData.map(category => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.category}
                  onClick={() => {
                    setActiveTab(category.category);
                    setSearchTerm('');
                    setOpenAccordions({});
                  }}
                  className={`flex items-center justify-center lg:justify-start p-3 rounded-lg font-medium text-sm whitespace-nowrap transition-colors duration-200
                    ${activeTab === category.category
                      ? 'bg-clr-primary-a0 text-clr-light-a0 shadow-md' 
                      : 'bg-clr-surface-a10 text-clr-dark-a0 hover:bg-clr-surface-a20 dark:text-clr-light-a0 dark:bg-clr-surface-a20 dark:hover:bg-clr-surface-a30' 
                    }`}
                >
                  <IconComponent className="h-5 w-5 mr-2" />
                  {t(category.titleKey)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-grow bg-clr-surface-a0 rounded-2xl shadow-xl p-6 transition-colors duration-300"> 
          {faqData.map(category => (
            activeTab === category.category && (
              <div key={category.category}>
                <div className="flex items-center mb-6">
                  <div className="p-1 rounded-full mr-4"> 
                    <category.icon className="h-8 w-8 text-clr-primary-a0" /> 
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-clr-dark-a0 dark:text-clr-light-a0">{t(category.titleKey)}</h3> 
                    <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-sm">{t(category.descriptionKey)}</p> 
                  </div>
                </div>

                {filteredQuestions.length === 0 && searchTerm !== '' ? (
                    <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-center py-8">{t('no_results_found')}</p> 
                ) : (
                    <div className="space-y-4">
                        {filteredQuestions.map(q => (
                            <div key={q.qKey} className="border border-clr-surface-a20 rounded-lg overflow-hidden shadow-sm transition-colors duration-300"> 
                                <button
                                    className="flex justify-between items-center w-full p-4 bg-clr-surface-a10 hover:bg-clr-surface-a20 focus:outline-none transition-colors duration-200" 
                                >
                                    <span className="font-semibold text-clr-dark-a0 dark:text-clr-light-a0 text-left">{t(q.qKey)}</span> 
                                    <ChevronDown className={`h-5 w-5 text-clr-surface-a40 dark:text-clr-surface-a50 transition-transform duration-200 ${openAccordions[q.qKey] ? 'rotate-180' : ''}`} /> 
                                </button>
                                {openAccordions[q.qKey] && (
                                    <div className="p-4 bg-clr-surface-a0 text-clr-dark-a0 dark:text-clr-light-a0 border-t border-clr-surface-a20"> 
                                        <p>{t(q.aKey)}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
              </div>
            )
          ))}
        </div>
      </div>

      <div className="bg-clr-surface-a0 p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-3xl text-center mt-8 transition-colors duration-300"> 
        <span className="inline-block bg-clr-primary-a50 text-clr-primary-a0 text-xs font-semibold px-3 py-1 rounded-full mb-4"> 
          {t('question_chip')}
        </span>
        <h3 className="text-2xl font-bold text-clr-dark-a0 dark:text-clr-light-a0 mb-3">{t('still_have_question')}</h3> 
        <p className="text-clr-dark-a0 dark:text-clr-light-a0 mb-6">{t('contact_us_description')}</p> 

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col items-center p-4 bg-clr-surface-a10 rounded-lg shadow-sm border border-clr-surface-a20 transition-colors duration-300"> 
            <div className="p-3 rounded-full mb-3"> 
              <PhoneIcon className="h-7 w-7 text-clr-primary-a0" /> 
            </div>
            <a href="tel:+123456789" className="text-xl font-bold text-clr-primary-a0 hover:underline">{t('phone_number_contact')}</a> 
            <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-sm mt-1">{t('always_happy_to_help')}</p> 
          </div>
          <div className="flex flex-col items-center p-4 bg-clr-surface-a10 rounded-lg shadow-sm border border-clr-surface-a20 transition-colors duration-300"> 
            <div className="p-3 rounded-full mb-3"> 
              <EnvelopeIcon className="h-7 w-7 text-clr-primary-a0" /> 
            </div>
            <a href="mailto:support@example.com" className="text-xl font-bold text-clr-primary-a0 hover:underline">{t('email_contact')}</a> 
            <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-sm mt-1">{t('best_way_for_faster_answer')}</p> 
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default FAQ;