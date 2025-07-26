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
        setError(err.response.data.errors.join(', '));
      } else {
        setError(err.response?.data?.message || t('error_creating_ticket'));
      }
      console.error('Error creating ticket:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-inter">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-3xl w-full max-w-md transform transition-all duration-300 hover:scale-[1.01] border-4 border-blue-200">
        <h2 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">
          {t('create_new_ticket')}
        </h2>

        {message && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg mb-4 animate-fadeIn">
            <div className="flex items-center">
              <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3" />
              <p className="font-medium">{message}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-4 animate-fadeIn">
            <div className="flex items-center">
              <ExclamationCircleIcon className="h-6 w-6 text-red-500 mr-3" />
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              {t('ticket_subject')}:
            </label>
            <input
              type="text"
              id="subject"
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 text-lg transition duration-200 ease-in-out"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              maxLength="100"
              placeholder={t('enter_ticket_subject_placeholder')}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              {t('ticket_description')}:
            </label>
            <textarea
              id="description"
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 text-lg transition duration-200 ease-in-out"
              rows="5"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              maxLength="1000"
              placeholder={t('enter_ticket_description_placeholder')}
            ></textarea>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              {t('ticket_priority')}:
            </label>
            <div className="relative">
              <select
                id="priority"
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 text-lg appearance-none bg-white transition duration-200 ease-in-out pr-10"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">{t('priority_low')}</option>
                <option value="medium">{t('priority_medium')}</option>
                <option value="high">{t('priority_high')}</option>
                <option value="urgent">{t('priority_urgent')}</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-xl shadow-lg flex items-center justify-center"
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
