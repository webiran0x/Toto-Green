// toto-frontend-user/src/components/Footer.js
// کامپوننت فوتر برای پنل کاربری با پشتیبانی از حالت تیره

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-200 dark:bg-gray-900 text-gray-700 dark:text-gray-300 py-6 mt-8 shadow-inner transition-colors duration-300">
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
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition-colors duration-200"
          >
            Your Company Name
          </a>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
