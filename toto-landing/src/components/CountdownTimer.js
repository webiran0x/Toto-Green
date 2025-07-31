// toto-landing/src/components/CountdownTimer.js
// کامپوننت زمان‌سنج شمارش معکوس برای مهلت بازی‌ها

import React, { useState, useEffect } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline'; // آیکون ساعت
import { useLanguage } from '../contexts/LanguageContext';

function CountdownTimer({ deadline, currentTheme }) {
  const { t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState(0); // زمان باقیمانده به میلی‌ثانیه

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(deadline).getTime() - new Date().getTime();
      setTimeLeft(difference > 0 ? difference : 0);
    };

    // محاسبه اولیه زمان بلافاصله پس از mount شدن
    calculateTimeLeft();

    // به‌روزرسانی زمان هر ثانیه
    const timerInterval = setInterval(calculateTimeLeft, 1000);

    // پاکسازی اینتروال در صورت unmount شدن کامپوننت
    return () => clearInterval(timerInterval);
  }, [deadline]);

  // فرمت کردن زمان برای نمایش
  const formatTime = (ms) => {
    if (ms <= 0) return t('game_closed'); // اگر زمان تمام شده

    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    const parts = [];
    if (days > 0) parts.push(`${days} ${t('days_abbr')}`);
    if (hours > 0 || days > 0) parts.push(`${hours.toString().padStart(2, '0')}${t('hours_abbr')}`);
    parts.push(`${minutes.toString().padStart(2, '0')}${t('minutes_abbr')}`);
    parts.push(`${seconds.toString().padStart(2, '0')}${t('seconds_abbr')}`);

    return parts.join(' ');
  };

  // کلاس‌های رنگی بر اساس تم و زمان باقیمانده
  const textColorClass = timeLeft <= 3600000 && timeLeft > 0 ? 'text-orange-500 dark:text-orange-400' : 'text-clr-dark-a0 dark:text-clr-light-a0'; // اگر کمتر از 1 ساعت باقی مانده
  const iconColorClass = timeLeft <= 3600000 && timeLeft > 0 ? 'text-orange-500 dark:text-orange-400' : 'text-clr-surface-a40 dark:text-clr-surface-a50';

  if (timeLeft <= 0) {
    return (
      <p className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center">
        <ClockIcon className="h-4 w-4 mr-2" /> {t('game_closed')}
      </p>
    );
  }

  return (
    <p className={`text-xs flex items-center ${textColorClass}`}>
      <ClockIcon className={`h-4 w-4 mr-2 ${iconColorClass}`} /> 
      {t('time_remaining')}: {formatTime(timeLeft)}
    </p>
  );
}

export default CountdownTimer;