// toto-landing/src/pages/TermsAndConditionsPage.js
// کامپوننت صفحه قوانین و مقررات با Tailwind CSS و پشتیبانی از حالت تیره

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header'; // ایمپورت هدر
import Footer from '../components/Footer'; // ایمپورت فوتر


function TermsAndConditionsPage({ currentTheme, toggleTheme }) {
  const { t } = useLanguage();

  // داده‌های قوانین و مقررات
  // شما می‌توانید این داده‌ها را پیچیده‌تر کنید یا از یک فایل JSON جداگانه بخوانید.
  // در اینجا برای سادگی، مستقیماً از کلیدهای ترجمه استفاده شده است.
  const sections = [
    {
      titleKey: 'terms_section_introduction_title',
      contentKeys: [
        'terms_section_introduction_p1',
        'terms_section_introduction_p2',
      ],
    },
    {
      titleKey: 'terms_section_account_title',
      contentKeys: [
        'terms_section_account_p1',
        'terms_section_account_p2',
        'terms_section_account_p3',
      ],
    },
    {
      titleKey: 'terms_section_conduct_title',
      contentKeys: [
        'terms_section_conduct_p1',
        'terms_section_conduct_p2',
      ],
    },
    {
      titleKey: 'terms_section_disclaimer_title',
      contentKeys: [
        'terms_section_disclaimer_p1',
        'terms_section_disclaimer_p2',
      ],
    },
    {
      titleKey: 'terms_section_changes_title',
      contentKeys: [
        'terms_section_changes_p1',
      ],
    },
    {
      titleKey: 'terms_section_contact_title',
      contentKeys: [
        'terms_section_contact_p1',
      ],
    },
  ];

  return (
    <div className="bg-clr-surface-a0 min-h-screen flex flex-col font-iranyekan">
      <Header currentTheme={currentTheme} toggleTheme={toggleTheme} /> {/* هدر را اضافه می‌کنیم */}

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-clr-surface-a0 p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-4xl mx-auto mb-8 transition-colors duration-300">
          <h1 className="text-3xl font-extrabold text-center text-clr-dark-a0 dark:text-clr-light-a0 mb-6">
            {t('terms_and_conditions_main_title')}
          </h1>
          <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-sm text-center mb-8">
            {t('terms_last_updated', { date: '۱۴ تیر ۱۴۰۳' })} {/* تاریخ را به صورت دستی یا پویا اضافه کنید */}
          </p>

          <div className="space-y-8">
            {sections.map((section, index) => (
              <div key={index} className="bg-clr-surface-a10 p-6 rounded-lg shadow-md border border-clr-surface-a20 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-clr-primary-a0 mb-4 text-left rtl:text-right">
                  {t(section.titleKey)}
                </h2>
                <div className="space-y-4 text-clr-dark-a0 dark:text-clr-light-a0 text-base text-justify rtl:text-right"> {/* text-justify برای تراز متن */}
                  {section.contentKeys.map((contentKey, pIndex) => (
                    <p key={pIndex}>{t(contentKey)}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer /> {/* فوتر را اضافه می‌کنیم */}
    </div>
  );
}

export default TermsAndConditionsPage;