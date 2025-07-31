// toto-landing/src/contexts/LanguageContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

// ترجمه‌ها را از فایل‌های JSON مربوطه بارگذاری می‌کنیم
const loadTranslations = async (lang) => {
  try {
    const response = await fetch(`/translations/${lang}.json`); // مسیر فایل‌های ترجمه
    if (!response.ok) {
      throw new Error(`Failed to load translation for ${lang}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error loading translations:", error);
    // بازگشت به ترجمه‌های انگلیسی در صورت خطا
    const defaultResponse = await fetch('/translations/en.json');
    return await defaultResponse.json();
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // زبان را از localStorage بازیابی می‌کند یا پیش‌فرض را 'fa' قرار می‌دهد
    return localStorage.getItem('language') || 'fa';
  });
  const [translations, setTranslations] = useState({});
  const [loadingTranslations, setLoadingTranslations] = useState(true);

  useEffect(() => {
    const fetchTranslations = async () => {
      setLoadingTranslations(true);
      const loadedTranslations = await loadTranslations(language);
      setTranslations(loadedTranslations);
      setLoadingTranslations(false);
      // زبان انتخاب شده را در localStorage ذخیره می‌کند
      localStorage.setItem('language', language);
    };

    fetchTranslations();
  }, [language]); // هر زمان که زبان تغییر کرد، ترجمه‌ها را دوباره واکشی می‌کند

  // تابع `t` برای ترجمه متون
  const t = (key, params = {}) => {
    if (loadingTranslations) return key; // در طول بارگذاری، فقط کلید را برگردانید
    let translatedText = translations[key] || key;
    // جایگزینی پارامترها در متن ترجمه شده
    for (const paramKey in params) {
      translatedText = translatedText.replace(`{${paramKey}}`, params[paramKey]);
    }
    return translatedText;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, loadingTranslations }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);