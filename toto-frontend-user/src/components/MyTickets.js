// toto-frontend-user/src/components/MyTickets.js
// کامپوننت مشاهده تیکت‌های پشتیبانی کاربر و ارسال پیام با UI بهبود یافته و حرفه‌ای

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../contexts/LanguageContext';
import {
  TicketIcon,
  ChatBubbleLeftRightIcon,
  PlusCircleIcon,
  ArrowUturnLeftIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  PaperAirplaneIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendMessageLoading, setSendMessageLoading] = useState(false);
  const { t } = useLanguage();

  const fetchMyTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get('/support/tickets/my');
      setTickets(res.data);
    } catch (err) {
      setError(err.response?.data?.message || t('error_fetching_tickets'));
      console.error('Error fetching my tickets:', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const fetchTicketDetails = useCallback(async (ticketId) => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`/support/tickets/${ticketId}`);
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
        `/support/tickets/${selectedTicket._id}/message`,
        { message: messageText },
      );
      setSelectedTicket(res.data.ticket);
      setMessageText('');
    } catch (err) {
      setError(err.response?.data?.message || t('error_sending_message'));
      console.error('Error sending message:', err.response?.data?.message || err.message);
    } finally {
      setSendMessageLoading(false);
    }
  };

  // کلاس‌های CSS برای وضعیت تیکت - UPDATED
  const getStatusClass = (status) => {
    switch (status) {
      // NEW: استفاده از رنگ‌های پالت جدید برای وضعیت‌ها
      case 'open': return 'bg-clr-primary-a50 text-clr-dark-a0 dark:bg-clr-primary-a10 dark:text-clr-light-a0'; // Previously blue
      case 'in_progress': return 'bg-clr-surface-tonal-a20 text-clr-dark-a0 dark:bg-clr-surface-tonal-a30 dark:text-clr-light-a0'; // Previously yellow
      case 'resolved': return 'bg-clr-surface-tonal-a0 text-clr-dark-a0 dark:bg-clr-surface-tonal-a10 dark:text-clr-light-a0'; // Previously green
      case 'closed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'; // Keep red for closed for clear visual cue
      default: return 'bg-clr-surface-a10 text-clr-dark-a0 dark:bg-clr-surface-a20 dark:text-clr-light-a0';
    }
  };

  // آیکون برای وضعیت تیکت - UPDATED
  const getStatusIcon = (status) => {
    switch (status) {
      // NEW: استفاده از رنگ‌های پالت جدید برای آیکون‌ها
      case 'open': return <ClockIcon className="h-4 w-4 mr-1 text-clr-primary-a0" />; // Previously blue
      case 'in_progress': return <ClockIcon className="h-4 w-4 mr-1 text-clr-surface-tonal-a40" />; // Previously yellow
      case 'resolved': return <CheckCircleIcon className="h-4 w-4 mr-1 text-clr-primary-a0" />; // Previously green
      case 'closed': return <XCircleIcon className="h-4 w-4 mr-1 text-red-500 dark:text-red-400" />; // Keep red
      default: return null;
    }
  };

  // کلاس‌های CSS برای اولویت تیکت - UPDATED
  const getPriorityClass = (priority) => {
    switch (priority) {
      // NEW: استفاده از رنگ‌های پالت جدید برای اولویت
      case 'low': return 'text-clr-primary-a0'; // Previously green
      case 'medium': return 'text-clr-surface-tonal-a40'; // Previously yellow
      case 'high': return 'text-orange-600 dark:text-orange-400'; // Keep orange for high
      case 'urgent': return 'text-red-600 dark:text-red-400'; // Keep red for urgent
      default: return 'text-clr-surface-a40 dark:text-clr-surface-a50';
    }
  };

  // آیکون برای اولویت تیکت (بدون تغییر)
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return <ExclamationTriangleIcon className="h-4 w-4 mr-1 text-red-600 dark:text-red-400" />;
      case 'high': return <ExclamationTriangleIcon className="h-4 w-4 mr-1 text-orange-600 dark:text-orange-400" />;
      default: return null;
    }
  };

  // NEW: کلاس‌های مربوط به لودینگ و خطا
  if (loading) return <div className="text-center py-8 text-clr-dark-a0 dark:text-clr-light-a0">{t('loading')}</div>; // OLD: text-gray-700 dark:text-gray-300
  if (error && !selectedTicket) return <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-4 text-center">{error}</div>;

  return (
    // OLD: bg-white dark:bg-gray-800
    <div className="bg-clr-surface-a0 p-6 rounded-lg shadow-md min-h-[calc(100vh-120px)] transition-colors duration-300"> 
      {/* OLD: text-gray-800 dark:text-white */}
      <h2 className="text-3xl font-extrabold text-clr-dark-a0 dark:text-clr-light-a0 mb-6 text-center">{t('my_tickets')}</h2> 
      {error && selectedTicket && <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-4 text-center">{error}</div>}

      {!selectedTicket ? (
        tickets.length === 0 ? (
          // OLD: text-gray-600 dark:text-gray-400
          <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-center py-4">{t('no_tickets_found')}</p> 
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tickets.map((ticket) => (
              // OLD: bg-blue-50 dark:bg-gray-700 border border-blue-200 dark:border-gray-600
              <div
                key={ticket._id}
                className="bg-clr-surface-a10 p-6 rounded-xl shadow-lg border border-clr-surface-a20 cursor-pointer transform transition-transform duration-300 hover:scale-[1.02] flex flex-col justify-between animate-fadeIn transition-colors duration-300" 
                onClick={() => fetchTicketDetails(ticket._id)}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    {/* OLD: text-blue-800 dark:text-blue-200 */}
                    <h3 className="text-xl font-bold text-clr-primary-a0">{ticket.subject}</h3> 
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center ${getStatusClass(ticket.status)}`}>
                      {getStatusIcon(ticket.status)} {t(`ticket_status_${ticket.status}`)}
                    </span>
                  </div>
                  {/* OLD: text-gray-700 dark:text-gray-300 text-gray-600 dark:text-gray-400 */}
                  <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-sm mb-1">{t('ticket_id')}: <span className="font-mono text-clr-surface-a40 dark:text-clr-surface-a50">{ticket._id}</span></p> 
                  <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-sm mb-1"> 
                    {t('priority')}:{' '}
                    <span className={`font-semibold flex items-center ${getPriorityClass(ticket.priority)}`}>
                      {getPriorityIcon(ticket.priority)} {t(`priority_${ticket.priority}`)}
                    </span>
                  </p>
                  <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-sm mb-1">{t('created_at')}: {new Date(ticket.createdAt).toLocaleString('fa-IR')}</p> 
                  <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-sm mb-1">{t('last_update')}: {new Date(ticket.updatedAt).toLocaleString('fa-IR')}</p> 
                  {ticket.assignedTo && <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-sm mb-1">{t('assigned_to')}: <span className="font-semibold">{ticket.assignedTo.username}</span></p>} 
                </div>
                {/* OLD: text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 */}
                <div className="mt-4 flex items-center text-clr-primary-a0 hover:text-clr-primary-a10 font-semibold text-sm transition duration-200"> 
                  <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                  {t('click_to_view_details')}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // نمایش جزئیات تیکت انتخاب شده
        // OLD: bg-blue-50 dark:bg-gray-700 border border-blue-200 dark:border-gray-600
        <div className="bg-clr-surface-a10 p-6 rounded-xl shadow-lg border border-clr-surface-a20 animate-fadeIn transition-colors duration-300"> 
          {/* OLD: text-blue-800 dark:text-blue-200 */}
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-clr-surface-a20"> {/* NEW: border-blue-200 dark:border-gray-600 changed to clr-surface-a20 */}
            <h3 className="text-2xl font-bold text-clr-primary-a0">{selectedTicket.subject}</h3> 
            <button
              onClick={() => {
                setSelectedTicket(null);
                fetchMyTickets();
              }}
              // OLD: bg-gray-500 hover:bg-gray-600 dark:bg-gray-700 dark:hover:bg-gray-800 text-white focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800
              className="bg-clr-surface-a30 hover:bg-clr-surface-a40 text-clr-light-a0 font-bold py-2 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg flex items-center focus:outline-none focus:ring-2 focus:ring-clr-surface-a40 focus:ring-offset-2 dark:focus:ring-offset-clr-surface-a10" 
            >
              <ArrowUturnLeftIcon className="h-5 w-5 mr-2" /> {t('back_to_tickets')}
            </button>
          </div>

          <div className="mb-6 p-4 bg-clr-surface-a0 rounded-lg shadow-inner border border-clr-surface-a10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-clr-dark-a0 dark:text-clr-light-a0 text-sm transition-colors duration-300"> {/* NEW: bg-white dark:bg-gray-800, border-gray-100 dark:border-gray-700, text-gray-700 dark:text-gray-300 */}
            <p><span className="font-medium">{t('ticket_id')}:</span> <span className="font-mono text-clr-surface-a40 dark:text-clr-surface-a50">{selectedTicket._id}</span></p> 
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

          <div className="messages-box bg-clr-surface-a0 p-4 rounded-lg border border-clr-surface-a20 max-h-80 overflow-y-auto mb-4 shadow-inner transition-colors duration-300"> {/* NEW: bg-white dark:bg-gray-800, border-gray-200 dark:border-gray-700 */}
            {selectedTicket.messages.length === 0 ? (
                // OLD: text-gray-500 dark:text-gray-400
                <p className="text-center text-clr-surface-a40 dark:text-clr-surface-a50">{t('no_messages_yet')}</p> 
            ) : (
                selectedTicket.messages.map((msg) => (
                    <div key={msg._id} className={`mb-3 p-3 rounded-lg max-w-[80%] shadow-sm transition-colors duration-300 ${msg.sender.role === 'user'
                        // OLD: bg-blue-50 dark:bg-blue-900 ml-auto text-right border border-blue-100 dark:border-blue-700
                        ? 'bg-clr-surface-tonal-a0 ml-auto text-right border border-clr-surface-tonal-a10' // NEW: User's message bubble
                        // OLD: bg-gray-100 dark:bg-gray-600 mr-auto text-left border border-gray-200 dark:border-gray-500
                        : 'bg-clr-surface-a10 mr-auto text-left border border-clr-surface-a20'}`}> {/* NEW: Admin/Support message bubble */}
                        {/* OLD: text-gray-800 dark:text-gray-100 */}
                        <p className="font-bold text-sm mb-1 flex items-center text-clr-dark-a0 dark:text-clr-light-a0"> 
                            {msg.sender.role === 'user' ? <UserCircleIcon className="h-4 w-4 mr-2 text-clr-primary-a0" /> : <TicketIcon className="h-4 w-4 mr-2 text-clr-surface-a40" />} {/* NEW: Icon colors */}
                            {msg.sender.username} ({t(`role_${msg.sender.role}`)}):
                        </p>
                        {/* OLD: text-gray-800 dark:text-gray-200 */}
                        <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-md break-words">{msg.message}</p> 
                        {/* OLD: text-gray-500 dark:text-gray-400 */}
                        <p className="text-clr-surface-a40 dark:text-clr-surface-a50 text-xs mt-1">{new Date(msg.createdAt).toLocaleString('fa-IR')}</p> 
                    </div>
                ))
            )}
          </div>

          {selectedTicket.status !== 'closed' ? (
            <form onSubmit={handleSendMessage} className="flex flex-col sm:flex-row gap-3">
              <textarea
                // OLD: border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200
                className="flex-grow p-3 border border-clr-surface-a30 rounded-lg focus:outline-none focus:ring-2 focus:ring-clr-primary-a0 transition duration-200 shadow-sm bg-clr-surface-a10 text-clr-dark-a0 dark:text-clr-light-a0" 
                rows="2"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={t('type_your_message_placeholder')}
                required
              ></textarea>
              <button
                type="submit"
                // OLD: bg-gradient-to-r from-green-600 to-teal-700 hover:from-green-700 hover:to-teal-800 dark:from-green-700 dark:to-teal-800 dark:hover:from-green-800 dark:hover:to-teal-900 text-white
                className="bg-gradient-to-r from-clr-primary-a0 to-clr-primary-a10 hover:from-clr-primary-a10 hover:to-clr-primary-a20 text-clr-light-a0 font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center" 
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
            // Keep red for closed ticket message
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