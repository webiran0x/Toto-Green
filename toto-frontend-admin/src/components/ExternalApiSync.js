// toto-frontend-admin/src/components/ExternalApiSync.js
// کامپوننت برای همگام‌سازی دستی با API خارجی

import React, { useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext'; // <--- اضافه شده برای پشتیبانی از چندزبانگی

function ExternalApiSync({ token, API_BASE_URL }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loadingGames, setLoadingGames] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const { t } = useLanguage(); // استفاده از هوک زبان برای ترجمه متن

  const handleSyncGames = async () => {
    setMessage('');
    setError('');
    setLoadingGames(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/external/sync-games`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || t('error_syncing_games_admin')); 
    } finally {
      setLoadingGames(false);
    }
  };

  const handleSyncResults = async () => {
    setMessage('');
    setError('');
    setLoadingResults(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/external/sync-results`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || t('error_syncing_results_admin')); 
    } finally {
      setLoadingResults(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('external_api_sync_admin')}</h2> 
      {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">{message}</div>}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}

      <div className="mb-6">
        <p className="text-gray-700 mb-4">
          {t('external_api_sync_description_admin')} 
        </p>
        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={handleSyncGames}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-200 ease-in-out disabled:opacity-50 flex items-center justify-center"
            disabled={loadingGames}
          >
            {loadingGames ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('syncing_games_admin')} 
              </>
            ) : (
              t('sync_games_admin')
            )}
          </button>
          <button
            onClick={handleSyncResults}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-200 ease-in-out disabled:opacity-50 flex items-center justify-center"
            disabled={loadingResults}
          >
            {loadingResults ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('syncing_results_admin')} 
              </>
            ) : (
              t('sync_results_admin')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExternalApiSync;