// toto-frontend-admin/src/contexts/LanguageContext.js
// Context API برای مدیریت زبان در پنل ادمین

import React, { createContext, useState, useContext, useEffect } from 'react';

// وارد کردن فایل‌های ترجمه
import en from '../translations/en.json';
import fa from '../translations/fa.json';

const translations = {
  en,
  fa,
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // زبان پیش‌فرض را از localStorage یا 'fa' تنظیم کنید
  const [language, setLanguage] = useState(localStorage.getItem('adminLang') || 'fa');

  useEffect(() => {
    // ذخیره زبان در localStorage هنگام تغییر
    localStorage.setItem('adminLang', language);
    // می‌توانید جهت صفحه (RTL/LTR) را بر اساس زبان تنظیم کنید
    document.documentElement.setAttribute('dir', language === 'fa' ? 'rtl' : 'ltr');
    document.documentElement.lang = language;
  }, [language]);

  // تابع ترجمه: بر اساس کلید، متن ترجمه شده را برمی‌گرداند
  const t = (key) => {
    return translations[language][key] || key; // اگر ترجمه یافت نشد، خود کلید را برمی‌گرداند
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// هوک سفارشی برای استفاده آسان از Context
export const useLanguage = () => useContext(LanguageContext);
