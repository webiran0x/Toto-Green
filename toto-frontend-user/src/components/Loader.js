// toto-frontend-user/src/components/Loader.js
// کامپوننت نمایش لودینگ با انیمیشن اسپینر و تم رنگی جدید

import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline'; // یا هر آیکون چرخان دیگری
import { useLanguage } from '../contexts/LanguageContext'; // برای ترجمه پیام لودینگ

function Loader({ message }) {
  const { t } = useLanguage();

  return (
    // از رنگ‌های تم جدید استفاده می‌شود
    <div className="flex flex-col items-center justify-center min-h-[200px] py-8 bg-clr-surface-a0 text-clr-dark-a0 dark:text-clr-light-a0 transition-colors duration-300 rounded-lg shadow-inner">
      <ArrowPathIcon className="h-12 w-12 text-clr-primary-a0 animate-spin mb-4" />
      <p className="text-xl font-semibold">{message || t('loading')}</p>
    </div>
  );
}

export default Loader;