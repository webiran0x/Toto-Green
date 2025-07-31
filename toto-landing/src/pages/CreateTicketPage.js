import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      // Replaced axios.post with fetch
      const res = await fetch('/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, description, priority })
      });
      
      const data = await res.json();

      if (!res.ok) {
          if (data.errors && Array.isArray(data.errors)) {
            setError(data.errors.map(err => err.msg || err.message).join(', '));
          } else {
            setError(data.message || 'خطا در ایجاد تیکت!');
          }
          console.error('Error creating ticket:', data);
          return;
      }
      
      setMessage(data.message || 'تیکت شما با موفقیت ایجاد شد!');
      setSubject('');
      setDescription('');
      setPriority('low');
    } catch (err) {
      setError('خطا در ارسال درخواست. لطفا دوباره تلاش کنید.');
      console.error('Error creating ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-inter transition-colors duration-300"> 
      <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md transform transition-all duration-300 hover:scale-[1.01] border border-gray-200 dark:border-gray-700"> 
        <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-4 text-center"> 
          ایجاد تیکت جدید
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6 leading-relaxed"> 
          در صورت نیاز به پشتیبانی، فرم زیر را تکمیل کنید.
        </p>

        {message && (
          <div className="bg-green-100 dark:bg-green-900 border-l-4 border-green-500 dark:border-green-700 text-green-700 dark:text-green-200 p-4 rounded-lg mb-4 animate-fadeIn">
            <div className="flex items-center">
              <CheckCircleIcon className="h-6 w-6 text-green-500 dark:text-green-400 ml-3" />
              <p className="font-medium">{message}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 dark:border-red-700 text-red-700 dark:text-red-200 p-4 rounded-lg mb-4 animate-fadeIn">
            <div className="flex items-center">
              <ExclamationCircleIcon className="h-6 w-6 text-red-500 dark:text-red-400 ml-3" />
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="subject" className="block text-sm font-semibold text-gray-800 dark:text-gray-300 mb-2"> 
              موضوع تیکت:
            </label>
            <input
              type="text"
              id="subject"
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 text-base bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 transition duration-200 ease-in-out placeholder-gray-400 dark:placeholder-gray-500" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              maxLength="100"
              placeholder="موضوع تیکت خود را وارد کنید"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-800 dark:text-gray-300 mb-2"> 
              توضیحات تیکت:
            </label>
            <textarea
              id="description"
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 text-base bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 transition duration-200 ease-in-out placeholder-gray-400 dark:placeholder-gray-500" 
              rows="5"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              maxLength="1000"
              placeholder="توضیحات کامل مربوط به تیکت را وارد کنید"
            ></textarea>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-semibold text-gray-800 dark:text-gray-300 mb-2"> 
              اولویت:
            </label>
            <div className="relative">
              <select
                id="priority"
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 text-base appearance-none bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 transition duration-200 ease-in-out pl-10" 
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">کم</option>
                <option value="medium">متوسط</option>
                <option value="high">زیاد</option>
                <option value="urgent">فوری</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300"> 
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-xl shadow-lg flex items-center justify-center" 
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <ArrowPathIcon className="animate-spin h-5 w-5 ml-3" /> در حال ارسال...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <PaperAirplaneIcon className="h-6 w-6 ml-3" /> ارسال تیکت
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// Custom alert function to replace window.alert
function alert(message) {
  const alertBox = document.createElement('div');
  alertBox.className = 'fixed inset-0 flex items-center justify-center z-50';
  alertBox.innerHTML = `
    <div class="bg-gray-900 bg-opacity-50 absolute inset-0"></div>
    <div class="bg-white p-6 rounded-lg shadow-xl z-10 max-w-sm w-full mx-4">
      <p class="text-gray-800 text-lg text-center mb-4">${message}</p>
      <button onclick="this.parentNode.parentNode.remove()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
        تایید
      </button>
    </div>
  `;
  document.body.appendChild(alertBox);
}

export default CreateTicket;