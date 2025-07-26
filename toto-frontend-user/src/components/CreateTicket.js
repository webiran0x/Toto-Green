// toto-frontend-user/src/components/CreateTicket.js
// کامپوننت ایجاد تیکت پشتیبانی جدید

import React, { useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';

// token و API_BASE_URL از پراپس حذف شدند
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
      // درخواست Axios:
      // baseURL از axios.defaults.baseURL در App.js گرفته می‌شود.
      // کوکی‌ها به خاطر axios.defaults.withCredentials = true ارسال می‌شوند.
      // بنابراین، نیازی به هدر Authorization یا تعیین کامل baseURL در اینجا نیست.
      const res = await axios.post(
        '/support/tickets', // مسیر اصلاح شد: '/api/' از ابتدای مسیر حذف شد
        { subject, description, priority },
        // نیازی به هدر Authorization نیست
      );
      setMessage(res.data.message || t('ticket_created_success'));
      setSubject('');
      setDescription('');
      setPriority('low');
    } catch (err) {
      setError(err.response?.data?.message || t('error_creating_ticket'));
      console.error('Error creating ticket:', err.response?.data || err.message); // برای اشکال‌زدایی
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto mt-10 transform transition-transform duration-300 hover:scale-105">
      <h2 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">{t('create_new_ticket')}</h2>
      {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md relative mb-4 text-center">{message}</div>}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-4 text-center">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="subject">
            {t('ticket_subject')}:
          </label>
          <input
            type="text"
            id="subject"
            className="shadow-sm appearance-none border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            maxLength="100"
            placeholder={t('enter_ticket_subject_placeholder')}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
            {t('ticket_description')}:
          </label>
          <textarea
            id="description"
            className="shadow-sm appearance-none border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            rows="5"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            maxLength="1000"
            placeholder={t('enter_ticket_description_placeholder')}
          ></textarea>
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="priority">
            {t('ticket_priority')}:
          </label>
          <select
            id="priority"
            className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="low">{t('priority_low')}</option>
            <option value="medium">{t('priority_medium')}</option>
            <option value="high">{t('priority_high')}</option>
            <option value="urgent">{t('priority_urgent')}</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:scale-105 w-full disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            disabled={loading}
          >
            {loading ? t('submitting_ticket') : t('submit_ticket')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateTicket;