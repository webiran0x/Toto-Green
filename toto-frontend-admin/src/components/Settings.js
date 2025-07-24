// toto-frontend-admin/src/components/Settings.js
// کامپوننت تنظیمات برای پنل مدیریت

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

function Settings() {
  const { t } = useLanguage();

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('settings')}</h2>
      <p className="text-gray-700">
        {t('settings_page_content')}
      </p>
      {/* می‌توانید فرم‌ها و گزینه‌های تنظیمات واقعی را اینجا اضافه کنید */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-800 text-sm">
          {t('settings_placeholder_note')}
        </p>
      </div>
    </div>
  );
}

export default Settings;
