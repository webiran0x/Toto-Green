// toto-frontend-user/src/components/MyTickets.js
// کامپوننت مشاهده تیکت‌های پشتیبانی کاربر و ارسال پیام با UI بهبود یافته و حرفه‌ای

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../contexts/LanguageContext';
import {
  TicketIcon, // آیکون تیکت اصلی
  ChatBubbleLeftRightIcon, // آیکون پیام
  PlusCircleIcon, // آیکون ایجاد تیکت
  ArrowUturnLeftIcon, // آیکون بازگشت
  ExclamationTriangleIcon, // آیکون اولویت بالا
  CheckCircleIcon, // آیکون وضعیت حل شده
  ClockIcon, // آیکون وضعیت در حال بررسی/باز
  XCircleIcon, // آیکون وضعیت بسته
  PaperAirplaneIcon, // آیکون ارسال پیام
  UserCircleIcon // آیکون فرستنده پیام
} from '@heroicons/react/24/outline'; // ایمپورت آیکون‌ها

function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendMessageLoading, setSendMessageLoading] = useState(false);
  const { t } = useLanguage();

  // تابع fetchMyTickets را داخل useCallback قرار می‌دهیم
  const fetchMyTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get('/support/tickets/my'); // مسیر: /api/support/tickets/my
      setTickets(res.data);
    } catch (err) {
      setError(err.response?.data?.message || t('error_fetching_tickets'));
      console.error('Error fetching my tickets:', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  // تابع fetchTicketDetails را داخل useCallback قرار می‌دهیم
  const fetchTicketDetails = useCallback(async (ticketId) => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`/support/tickets/${ticketId}`); // مسیر: /api/support/tickets/:id
      setSelectedTicket(res.data);
    } catch (err) {
      setError(err.response?.data?.message || t('error_fetching_ticket_details'));
      console.error('Error fetching ticket details:', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchMyTickets();
  }, [fetchMyTickets]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedTicket) return;

    setSendMessageLoading(true);
    setError('');

    try {
      const res = await axios.post(
        `/support/tickets/${selectedTicket._id}/message`, // مسیر: /api/support/tickets/:id/message
        { message: messageText },
      );
      setSelectedTicket(res.data.ticket); // به‌روزرسانی تیکت انتخاب شده با پیام جدید
      setMessageText(''); // پاک کردن فیلد پیام
    } catch (err) {
      setError(err.response?.data?.message || t('error_sending_message'));
      console.error('Error sending message:', err.response?.data?.message || err.message);
    } finally {
      setSendMessageLoading(false);
    }
  };

  // کلاس‌های CSS برای وضعیت تیکت
  const getStatusClass = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'closed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  // آیکون برای وضعیت تیکت
  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <ClockIcon className="h-4 w-4 mr-1 text-blue-500 dark:text-blue-400" />;
      case 'in_progress': return <ClockIcon className="h-4 w-4 mr-1 text-yellow-500 dark:text-yellow-400" />;
      case 'resolved': return <CheckCircleIcon className="h-4 w-4 mr-1 text-green-500 dark:text-green-400" />;
      case 'closed': return <XCircleIcon className="h-4 w-4 mr-1 text-red-500 dark:text-red-400" />;
      default: return null;
    }
  };

  // کلاس‌های CSS برای اولویت تیکت
  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'low': return 'text-green-600 dark:text-green-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'urgent': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  // آیکون برای اولویت تیکت (می‌توانید بر اساس نیاز آیکون‌های بیشتری اضافه کنید)
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return <ExclamationTriangleIcon className="h-4 w-4 mr-1 text-red-600 dark:text-red-400" />;
      case 'high': return <ExclamationTriangleIcon className="h-4 w-4 mr-1 text-orange-600 dark:text-orange-400" />;
      default: return null;
    }
  };

  if (loading) return <div className="text-center py-8 text-gray-700 dark:text-gray-300">{t('loading')}</div>;
  if (error && !selectedTicket) return <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-4 text-center">{error}</div>;

  return (
    // اعمال کلاس‌های تم به کانتینر اصلی
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md min-h-[calc(100vh-120px)] transition-colors duration-300">
      <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-6 text-center">{t('my_tickets')}</h2>
      {error && selectedTicket && <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-4 text-center">{error}</div>}

      {!selectedTicket ? (
        tickets.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 text-center py-4">{t('no_tickets_found')}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tickets.map((ticket) => (
              <div
                key={ticket._id}
                className="bg-blue-50 dark:bg-gray-700 p-6 rounded-xl shadow-lg border border-blue-200 dark:border-gray-600 cursor-pointer transform transition-transform duration-300 hover:scale-[1.02] flex flex-col justify-between animate-fadeIn transition-colors duration-300"
                onClick={() => fetchTicketDetails(ticket._id)}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200">{ticket.subject}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center ${getStatusClass(ticket.status)}`}>
                      {getStatusIcon(ticket.status)} {t(`ticket_status_${ticket.status}`)}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-1">{t('ticket_id')}: <span className="font-mono text-gray-600 dark:text-gray-400">{ticket._id}</span></p> {/* font-mono برای ID */}
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-1">
                    {t('priority')}:{' '}
                    <span className={`font-semibold flex items-center ${getPriorityClass(ticket.priority)}`}>
                      {getPriorityIcon(ticket.priority)} {t(`priority_${ticket.priority}`)}
                    </span>
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-1">{t('created_at')}: {new Date(ticket.createdAt).toLocaleString('fa-IR')}</p>
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-1">{t('last_update')}: {new Date(ticket.updatedAt).toLocaleString('fa-IR')}</p>
                  {ticket.assignedTo && <p className="text-gray-700 dark:text-gray-300 text-sm mb-1">{t('assigned_to')}: <span className="font-semibold">{ticket.assignedTo.username}</span></p>}
                </div>
                <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 font-semibold text-sm hover:text-blue-800 dark:hover:text-blue-300 transition duration-200">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                  {t('click_to_view_details')}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // نمایش جزئیات تیکت انتخاب شده
        <div className="bg-blue-50 dark:bg-gray-700 p-6 rounded-xl shadow-lg border border-blue-200 dark:border-gray-600 animate-fadeIn transition-colors duration-300">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-blue-200 dark:border-gray-600">
            <h3 className="text-2xl font-bold text-blue-800 dark:text-blue-200">{selectedTicket.subject}</h3>
            <button
              onClick={() => {
                setSelectedTicket(null);
                fetchMyTickets(); // رفرش لیست تیکت‌ها پس از بازگشت
              }}
              className="bg-gray-500 hover:bg-gray-600 dark:bg-gray-700 dark:hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg flex items-center focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              <ArrowUturnLeftIcon className="h-5 w-5 mr-2" /> {t('back_to_tickets')}
            </button>
          </div>

          <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-inner border border-gray-100 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-700 dark:text-gray-300 text-sm transition-colors duration-300">
            <p><span className="font-medium">{t('ticket_id')}:</span> <span className="font-mono text-gray-600 dark:text-gray-400">{selectedTicket._id}</span></p>
            <p><span className="font-medium">{t('created_by')}:</span> <span className="font-semibold">{selectedTicket.user?.username || t('unknown')}</span></p>
            <p><span className="font-medium">{t('status')}:</span>{' '}
              <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center justify-center ${getStatusClass(selectedTicket.status)}`}>
                {getStatusIcon(selectedTicket.status)} {t(`ticket_status_${selectedTicket.status}`)}
              </span>
            </p>
            <p><span className="font-medium">{t('priority')}:</span>{' '}
              <span className={`font-semibold flex items-center justify-center ${getPriorityClass(selectedTicket.priority)}`}>
                {getPriorityIcon(selectedTicket.priority)} {t(`priority_${selectedTicket.priority}`)}
              </span>
            </p>
            <p><span className="font-medium">{t('created_at')}:</span> {new Date(selectedTicket.createdAt).toLocaleString('fa-IR')}</p>
            <p><span className="font-medium">{t('last_update')}:</span> {new Date(selectedTicket.updatedAt).toLocaleString('fa-IR')}</p>
            {selectedTicket.assignedTo && <p><span className="font-medium">{t('assigned_to')}:</span> <span className="font-semibold">{selectedTicket.assignedTo.username}</span></p>}
          </div>

          <div className="messages-box bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto mb-4 shadow-inner transition-colors duration-300">
            {selectedTicket.messages.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400">{t('no_messages_yet')}</p>
            ) : (
                selectedTicket.messages.map((msg) => (
                    <div key={msg._id} className={`mb-3 p-3 rounded-lg max-w-[80%] shadow-sm transition-colors duration-300 ${msg.sender.role === 'user' ? 'bg-blue-50 dark:bg-blue-900 ml-auto text-right border border-blue-100 dark:border-blue-700' : 'bg-gray-100 dark:bg-gray-600 mr-auto text-left border border-gray-200 dark:border-gray-500'}`}>
                        <p className="font-bold text-sm mb-1 flex items-center text-gray-800 dark:text-gray-100">
                            {msg.sender.role === 'user' ? <UserCircleIcon className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" /> : <TicketIcon className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />} {/* آیکون فرستنده */}
                            {msg.sender.username} ({t(`role_${msg.sender.role}`)}):
                        </p>
                        <p className="text-gray-800 dark:text-gray-200 text-md break-words">{msg.message}</p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{new Date(msg.createdAt).toLocaleString('fa-IR')}</p>
                    </div>
                ))
            )}
          </div>

          {selectedTicket.status !== 'closed' ? (
            <form onSubmit={handleSendMessage} className="flex flex-col sm:flex-row gap-3">
              <textarea
                className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition duration-200 shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                rows="2"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={t('type_your_message_placeholder')}
                required
              ></textarea>
              <button
                type="submit"
                className="bg-gradient-to-r from-green-600 to-teal-700 hover:from-green-700 hover:to-teal-800 dark:from-green-700 dark:to-teal-800 dark:hover:from-green-800 dark:hover:to-teal-900 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center"
                disabled={sendMessageLoading}
              >
                {sendMessageLoading ? (
                    <span className="flex items-center"><ArrowPathIcon className="animate-spin h-5 w-5 mr-2" /> {t('sending')}</span>
                ) : (
                    <span className="flex items-center"><PaperAirplaneIcon className="h-5 w-5 mr-2" /> {t('send_message')}</span>
                )}
              </button>
            </form>
          ) : (
            <p className="text-center text-red-600 dark:text-red-400 font-semibold mt-4 p-3 bg-red-50 dark:bg-red-900 rounded-lg border border-red-200 dark:border-red-700 flex items-center justify-center transition-colors duration-300">
                <XCircleIcon className="h-6 w-6 mr-2" /> {t('ticket_is_closed_message')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default MyTickets;
