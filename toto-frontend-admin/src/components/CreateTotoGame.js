// toto-frontend-admin/src/components/CreateTotoGame.js
// کامپوننت برای ایجاد بازی Toto جدید

import React, { useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';

function CreateTotoGame({ token, API_BASE_URL }) {
  const [gameName, setGameName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [matches, setMatches] = useState(Array(15).fill({ homeTeam: '', awayTeam: '', date: '' }));
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  /**
   * @desc    تابعی برای تبدیل رشته تاریخ و زمان از input type="datetime-local" به فرمت ISO 8601 (UTC).
   * این فرمت برای Mongoose و ذخیره در دیتابیس مناسب‌تر است.
   * @param   {string} dateTimeString - رشته تاریخ و زمان از ورودی HTML (مثلاً "2025-07-24T09:09")
   * @returns {string} - رشته تاریخ و زمان در فرمت ISO 8601 (مثلاً "2025-07-24T09:09:00.000Z")
   */
  const formatDateTimeToISO = (dateTimeString) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    // بررسی اعتبار تاریخ
    if (isNaN(date.getTime())) {
      console.error('Invalid date string provided to formatDateTimeToISO:', dateTimeString);
      return ''; // بازگرداندن رشته خالی یا null در صورت نامعتبر بودن تاریخ
    }
    return date.toISOString(); // تبدیل به فرمت ISO 8601 (UTC)
  };

  // تابع برای به‌روزرسانی اطلاعات یک بازی خاص در آرایه matches
  const handleMatchChange = (index, field, value) => {
    const newMatches = [...matches];
    newMatches[index] = { ...newMatches[index], [field]: value };
    setMatches(newMatches);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    // اعتبارسنجی اولیه سمت کلاینت (قبل از فرمت‌بندی)
    if (!gameName || !deadline || matches.length !== 15 || matches.some(m => !m.homeTeam || !m.awayTeam || !m.date)) {
      setError(t('please_fill_all_fields'));
      setLoading(false);
      return;
    }

    // فرمت‌بندی deadline و تاریخ‌های بازی‌ها به فرمت ISO 8601
    const formattedDeadline = formatDateTimeToISO(deadline);
    const formattedMatches = matches.map(match => ({
      ...match,
      date: formatDateTimeToISO(match.date)
    }));

    // <--- اضافه شد: لاگ کردن مقادیر تاریخ فرمت شده برای اشکال‌زدایی
    console.log('Formatted Deadline for Backend:', formattedDeadline);
    console.log('Formatted Matches Dates for Backend:', formattedMatches.map(m => m.date));


    // اعتبارسنجی مجدد پس از فرمت‌بندی (برای اطمینان از اینکه فرمت‌بندی موفق بوده است)
    if (!formattedDeadline || formattedMatches.some(m => !m.date)) {
        setError(t('invalid_date_format_please_check')); // پیام خطای جدید برای فرمت تاریخ
        setLoading(false);
        return;
    }


    try {
      const res = await axios.post(
        `${API_BASE_URL}/admin/games/create`, // مسیر صحیح در بک‌اند شما
        {
          name: gameName,
          deadline: formattedDeadline, // استفاده از deadline فرمت شده
          matches: formattedMatches,   // استفاده از آرایه matches با تاریخ‌های فرمت شده
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessage(res.data.message || t('game_created_successfully'));
      // پاک کردن فرم پس از موفقیت
      setGameName('');
      setDeadline('');
      setMatches(Array(15).fill({ homeTeam: '', awayTeam: '', date: '' }));
    } catch (err) {
      // پیام خطای دریافتی از بک‌اند را نمایش می‌دهد
      setError(err.response?.data?.message || t('error_creating_game'));
      // <--- اضافه شد: لاگ کردن جزئیات خطای پاسخ از بک‌اند
      console.error('Error response from backend:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('create_new_toto_game')}</h2>

      {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">{message}</div>}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="gameName">
            {t('game_name')}:
          </label>
          <input
            type="text"
            id="gameName"
            className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="deadline">
            {t('deadline')}:
          </label>
          <input
            type="datetime-local"
            id="deadline"
            className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
          />
        </div>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('matches')} (15 {t('matches_required')}):</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {matches.map((match, index) => (
            <div key={index} className="border border-gray-200 p-4 rounded-lg shadow-sm">
              <h4 className="text-lg font-medium text-gray-700 mb-3">{t('match')} {index + 1}</h4>
              <div className="mb-3">
                <label className="block text-gray-600 text-sm font-bold mb-1" htmlFor={`homeTeam-${index}`}>
                  {t('home_team')}:
                </label>
                <input
                  type="text"
                  id={`homeTeam-${index}`}
                  className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={match.homeTeam}
                  onChange={(e) => handleMatchChange(index, 'homeTeam', e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="block text-gray-600 text-sm font-bold mb-1" htmlFor={`awayTeam-${index}`}>
                  {t('away_team')}:
                </label>
                <input
                  type="text"
                  id={`awayTeam-${index}`}
                  className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={match.awayTeam}
                  onChange={(e) => handleMatchChange(index, 'awayTeam', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-600 text-sm font-bold mb-1" htmlFor={`matchDate-${index}`}>
                  {t('match_date')}:
                </label>
                <input
                  type="datetime-local"
                  id={`matchDate-${index}`}
                  className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={match.date}
                  onChange={(e) => handleMatchChange(index, 'date', e.target.value)}
                  required
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline transition duration-200 ease-in-out disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('creating_game')}
              </>
            ) : (
              t('create_game')
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateTotoGame;
