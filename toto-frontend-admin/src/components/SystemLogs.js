// toto-frontend-admin/src/components/SystemLogs.js
// کامپوننت برای نمایش لاگ‌های سیستم

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext'; // <--- اضافه شده برای پشتیبانی از چندزبانگی

function SystemLogs({ token, API_BASE_URL }) {
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useLanguage(); // استفاده از هوک زبان برای ترجمه متن

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await axios.get(`${API_BASE_URL}/admin/logs`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setLogs(res.data);
      } catch (err) {
        setError(err.response?.data?.message || t('error_fetching_logs_admin')); // ترجمه شده
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [token, API_BASE_URL, t]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('system_logs_title_admin')}</h2> {/* ترجمه شده */}
      {loading ? (
        <div className="text-center py-8">{t('loading')}</div> // ترجمه شده
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>
      ) : (
        <div className="bg-gray-800 text-green-400 p-4 rounded-md overflow-x-auto font-mono text-sm max-h-[600px] whitespace-pre-wrap">
          {logs || t('no_logs_found_admin')} {/* ترجمه شده */}
        </div>
      )}
    </div>
  );
}

export default SystemLogs;