// toto-frontend-admin/src/components/SystemLogs.js
// کامپوننت برای نمایش لاگ‌های سیستم

import React, { useState, useEffect, useCallback } from 'react'; // useCallback اضافه شد
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';

// نیازی نیست token و API_BASE_URL به عنوان پراپ پاس داده شوند.
// axios.defaults.baseURL و axios.defaults.withCredentials در App.js تنظیم شده‌اند.
function SystemLogs() { // 'token' و 'API_BASE_URL' از پراپس حذف شدند
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  // تابع fetchLogs را داخل useCallback قرار می‌دهیم
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      // درخواست Axios:
      // baseURL از axios.defaults.baseURL در App.js گرفته می‌شود.
      // کوکی‌ها به خاطر axios.defaults.withCredentials = true ارسال می‌شوند.
      // بنابراین، نیازی به هدر Authorization یا تعیین کامل baseURL در اینجا نیست.
      const res = await axios.get('/admin/logs'); // '/api' از ابتدای مسیر حذف شد
      setLogs(res.data);
    } catch (err) {
      setError(err.response?.data?.message || t('error_fetching_logs_admin'));
      console.error('Error fetching system logs:', err.response?.data || err.message); // لاگ برای اشکال‌زدایی
    } finally {
      setLoading(false);
    }
  }, [t]); // t را به dependency array اضافه کنید

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]); // fetchLogs را به dependency array اضافه کنید

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('system_logs_title_admin')}</h2>
      {loading ? (
        <div className="text-center py-8">{t('loading')}</div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>
      ) : (
        <div className="bg-gray-800 text-green-400 p-4 rounded-md overflow-x-auto font-mono text-sm max-h-[600px] whitespace-pre-wrap">
          {logs || t('no_logs_found_admin')}
        </div>
      )}
    </div>
  );
}

export default SystemLogs;