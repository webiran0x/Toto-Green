// toto-frontend-user/src/components/CreateTicket.js
// کامپوننت برای ایجاد تیکت پشتیبانی جدید با UI بهبود یافته و حرفه‌ای

import React, { useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import {
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  TicketIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

function CreateTicket() {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('low');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(
        '/support/tickets',
        { subject, description, priority },
      );
      setMessage(res.data.message || t('ticket_created_success'));
      setSubject('');
      setDescription('');
      setPriority('low');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.errors && Array.isArray(err.response.data.errors)) {
        setError(err.response.data.errors.map(err => err.msg || err.message).join(', '));
      } else {
        setError(err.response?.data?.message || t('error_creating_ticket'));
      }
      console.error('Error creating ticket:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // OLD: bg-gray-50 dark:bg-gray-900
    <div className="min-h-screen bg-clr-surface-a10 dark:bg-clr-surface-a0 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-inter transition-colors duration-300"> 
      {/* OLD: bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 */}
      <div className="bg-clr-surface-a0 p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md transform transition-all duration-300 hover:scale-[1.01] border border-clr-surface-a20"> 
        {/* OLD: text-gray-800 dark:text-white */}
        <h2 className="text-3xl font-extrabold text-clr-dark-a0 dark:text-clr-light-a0 mb-4 text-center"> 
          {t('create_new_ticket')}
        </h2>

        {/* متن توضیحی جدید برای بالای فرم */}
        {/* OLD: text-gray-600 dark:text-gray-400 */}
        <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-center mb-6 leading-relaxed"> 
          {t('ticket_form_description_text')}
        </p>

        {message && (
          // Keep success message colors
          <div className="bg-green-100 dark:bg-green-900 border-l-4 border-green-500 dark:border-green-700 text-green-700 dark:text-green-200 p-4 rounded-lg mb-4 animate-fadeIn">
            <div className="flex items-center">
              <CheckCircleIcon className="h-6 w-6 text-green-500 dark:text-green-400 mr-3" />
              <p className="font-medium">{message}</p>
            </div>
          </div>
        )}

        {error && (
          // Keep error message colors
          <div className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 dark:border-red-700 text-red-700 dark:text-red-200 p-4 rounded-lg mb-4 animate-fadeIn">
            <div className="flex items-center">
              <ExclamationCircleIcon className="h-6 w-6 text-red-500 dark:text-red-400 mr-3" />
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            {/* OLD: text-gray-800 dark:text-gray-300 */}
            <label htmlFor="subject" className="block text-sm font-semibold text-clr-dark-a0 dark:text-clr-light-a0 mb-2"> 
              {t('ticket_subject')}:
            </label>
            <input
              type="text"
              id="subject"
              // OLD: border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 p-3 text-base bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500
              className="mt-1 block w-full rounded-lg border-clr-surface-a30 shadow-sm focus:border-clr-primary-a0 focus:ring-clr-primary-a0 p-3 text-base bg-clr-surface-a10 text-clr-dark-a0 dark:text-clr-light-a0 transition duration-200 ease-in-out placeholder-clr-surface-a40 dark:placeholder-clr-surface-a50" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              maxLength="100"
              placeholder={t('enter_ticket_subject_placeholder')}
            />
          </div>

          <div>
            {/* OLD: text-gray-800 dark:text-gray-300 */}
            <label htmlFor="description" className="block text-sm font-semibold text-clr-dark-a0 dark:text-clr-light-a0 mb-2"> 
              {t('ticket_description')}:
            </label>
            <textarea
              id="description"
              // OLD: border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 p-3 text-base bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500
              className="mt-1 block w-full rounded-lg border-clr-surface-a30 shadow-sm focus:border-clr-primary-a0 focus:ring-clr-primary-a0 p-3 text-base bg-clr-surface-a10 text-clr-dark-a0 dark:text-clr-light-a0 transition duration-200 ease-in-out placeholder-clr-surface-a40 dark:placeholder-clr-surface-a50" 
              rows="5"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              maxLength="1000"
              placeholder={t('enter_ticket_description_placeholder')}
            ></textarea>
          </div>

          <div>
            {/* OLD: text-gray-800 dark:text-gray-300 */}
            <label htmlFor="priority" className="block text-sm font-semibold text-clr-dark-a0 dark:text-clr-light-a0 mb-2"> 
              {t('ticket_priority')}:
            </label>
            <div className="relative">
              <select
                id="priority"
                // OLD: border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 p-3 text-base appearance-none bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200
                className="block w-full rounded-lg border-clr-surface-a30 shadow-sm focus:border-clr-primary-a0 focus:ring-clr-primary-a0 p-3 text-base appearance-none bg-clr-surface-a10 text-clr-dark-a0 dark:text-clr-light-a0 transition duration-200 ease-in-out pr-10" 
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">{t('priority_low')}</option>
                <option value="medium">{t('priority_medium')}</option>
                <option value="high">{t('priority_high')}</option>
                <option value="urgent">{t('priority_urgent')}</option>
              </select>
              {/* OLD: text-gray-700 dark:text-gray-300 */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-clr-dark-a0 dark:text-clr-light-a0"> 
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          <button
            type="submit"
            // OLD: bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 dark:from-blue-700 dark:to-indigo-800 dark:hover:from-blue-800 dark:hover:to-indigo-900 text-white
            className="w-full bg-gradient-to-r from-clr-primary-a0 to-clr-primary-a10 hover:from-clr-primary-a10 hover:to-clr-primary-a20 text-clr-light-a0 font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-xl shadow-lg flex items-center justify-center" 
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <ArrowPathIcon className="animate-spin h-5 w-5 mr-3" /> {t('submitting_ticket')}
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <PaperAirplaneIcon className="h-6 w-6 mr-3" /> {t('submit_ticket')}
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateTicket;