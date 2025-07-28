// toto-frontend-landing/src/contexts/LanguageContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

// ایجاد Context زبان
const LanguageContext = createContext();

// کامپوننت Provider برای فراهم کردن Context زبان
export const LanguageProvider = ({ children }) => {
  // زبان پیش‌فرض را از localStorage یا 'fa' تنظیم کنید
  const [locale, setLocale] = useState(() => localStorage.getItem('locale') || 'fa');
  const [translations, setTranslations] = useState({});

  // تابع برای بارگذاری فایل‌های ترجمه
  const loadTranslations = async (selectedLocale) => {
    try {
      const response = await fetch(`/translations/${selectedLocale}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load translations for ${selectedLocale}`);
      }
      const data = await response.json();
      setTranslations(data);
    } catch (error) {
      console.error("Error loading translations:", error);
      // در صورت خطا، به زبان پیش‌فرض (مثلاً انگلیسی) برگردید
      const defaultResponse = await fetch('/translations/en.json');
      const defaultData = await defaultResponse.json();
      setTranslations(defaultData);
      setLocale('en'); // اگر بارگذاری زبان اصلی با خطا مواجه شد، زبان را به انگلیسی تغییر دهید
      localStorage.setItem('locale', 'en');
    }
  };

  // بارگذاری ترجمه‌ها هنگام تغییر locale
  useEffect(() => {
    loadTranslations(locale);
    localStorage.setItem('locale', locale); // ذخیره زبان انتخاب شده در localStorage
  }, [locale]);

  // تابع ترجمه: کلید را می‌گیرد و رشته ترجمه شده را برمی‌گرداند
  const t = (key) => {
    return translations[key] || key; // اگر ترجمه یافت نشد، خود کلید را برگردان
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// هوک سفارشی برای استفاده از Context زبان در کامپوننت‌ها
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
