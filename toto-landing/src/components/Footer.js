// toto-landing/src/components/Footer.js
// کامپوننت فوتر برای صفحه فرود

import React from 'react';
import { Link } from 'react-router-dom'; // NEW: ایمپورت Link
import { useLanguage } from '../contexts/LanguageContext';

function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-clr-surface-a20 dark:bg-clr-surface-a0 text-clr-dark-a0 dark:text-clr-light-a0 py-6 mt-8 shadow-inner transition-colors duration-300 font-iranyekan">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm">
          &copy; {currentYear} {t('app_name')}. {t('all_rights_reserved')}.
        </p>
        <p className="text-xs mt-2">
          {t('developed_by')}{' '}
          <a
            href="https://yourwebsite.com" // آدرس وب‌سایت شما
            target="_blank"
            rel="noopener noreferrer"
            className="text-clr-primary-a0 hover:text-clr-primary-a10 transition-colors duration-200"
          >
            Your Company Name
          </a>
        </p>
        {/* NEW: اضافه کردن لینک قوانین و مقررات */}
        <p className="text-xs mt-2">
          <Link
            to="/terms"
            className="text-clr-primary-a0 hover:text-clr-primary-a10 transition-colors duration-200"
          >
            {t('terms_and_conditions_main_title')}
          </Link>
        </p>
      </div>
    </footer>
  );
}

export default Footer;