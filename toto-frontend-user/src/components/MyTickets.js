// toto-frontend-user/src/components/MyTickets.js
// کامپوننت مشاهده تیکت‌های پشتیبانی کاربر و ارسال پیام

import React, { useState, useEffect, useCallback } from 'react'; // useCallback اضافه شد
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';

// token و API_BASE_URL از پراپس حذف شدند
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
      // درخواست Axios:
      // baseURL از axios.defaults.baseURL در App.js گرفته می‌شود.
      // کوکی‌ها به خاطر axios.defaults.withCredentials = true ارسال می‌شوند.
      const res = await axios.get('/support/tickets/my'); // مسیر اصلاح شد: '/api/' از ابتدای مسیر حذف شد
      setTickets(res.data);
    } catch (err) {
      setError(err.response?.data?.message || t('error_fetching_tickets'));
      console.error('Error fetching my tickets:', err.response?.data || err.message); // برای اشکال‌زدایی
    } finally {
      setLoading(false);
    }
  }, [t]); // t به dependency array اضافه شد

  // تابع fetchTicketDetails را داخل useCallback قرار می‌دهیم
  const fetchTicketDetails = useCallback(async (ticketId) => {
    try {
      setLoading(true);
      setError('');
      // درخواست Axios:
      const res = await axios.get(`/support/tickets/${ticketId}`); // مسیر اصلاح شد: '/api/' از ابتدای مسیر حذف شد
      setSelectedTicket(res.data);
    } catch (err) {
      setError(err.response?.data?.message || t('error_fetching_ticket_details'));
      console.error('Error fetching ticket details:', err.response?.data || err.message); // برای اشکال‌زدایی
    } finally {
      setLoading(false);
    }
  }, [t]); // t به dependency array اضافه شد

  useEffect(() => {
    fetchMyTickets();
  }, [fetchMyTickets]); // fetchMyTickets به dependency array اضافه شد

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedTicket) return;

    setSendMessageLoading(true);
    setError('');

    try {
      // درخواست Axios:
      const res = await axios.post(
        `/support/tickets/${selectedTicket._id}/message`, // مسیر اصلاح شد: '/api/' از ابتدای مسیر حذف شد
        { message: messageText },
        // نیازی به هدر Authorization نیست
      );
      // به‌روزرسانی تیکت انتخاب شده با پیام جدید
      setSelectedTicket(res.data.ticket);
      setMessageText(''); // پاک کردن فیلد پیام
    } catch (err) {
      setError(err.response?.data?.message || t('error_sending_message'));
      console.error('Error sending message:', err.response?.data || err.message); // برای اشکال‌زدایی
    } finally {
      setSendMessageLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'urgent': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) return <div className="text-center py-8 text-gray-700">{t('loading')}</div>;
  if (error && !selectedTicket) return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-center">{error}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">{t('my_tickets')}</h2>
      {error && selectedTicket && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-center">{error}</div>}

      {!selectedTicket ? (
        tickets.length === 0 ? (
          <p className="text-gray-600 text-center py-4">{t('no_tickets_found')}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tickets.map((ticket) => (
              <div
                key={ticket._id}
                className="bg-blue-50 p-6 rounded-xl shadow-lg border border-blue-200 cursor-pointer transform transition-transform duration-300 hover:scale-[1.02] flex flex-col justify-between"
                onClick={() => fetchTicketDetails(ticket._id)}
              >
                <div>
                  <h3 className="text-xl font-bold text-blue-800 mb-2">{ticket.subject}</h3>
                  <p className="text-gray-700 text-sm mb-1">{t('ticket_id')}: {ticket._id}</p>
                  <p className="text-gray-700 text-sm mb-1">
                    {t('status')}:{' '}
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(ticket.status)}`}>
                      {t(`ticket_status_${ticket.status}`)}
                    </span>
                  </p>
                  <p className="text-gray-700 text-sm mb-1">
                    {t('priority')}:{' '}
                    <span className={`font-semibold ${getPriorityClass(ticket.priority)}`}>
                      {t(`priority_${ticket.priority}`)}
                    </span>
                  </p>
                  <p className="text-gray-700 text-sm mb-1">{t('created_at')}: {new Date(ticket.createdAt).toLocaleString('fa-IR')}</p>
                  <p className="text-gray-700 text-sm mb-1">{t('last_update')}: {new Date(ticket.updatedAt).toLocaleString('fa-IR')}</p>
                  {ticket.assignedTo && <p className="text-gray-700 text-sm mb-1">{t('assigned_to')}: {ticket.assignedTo.username}</p>}
                </div>
                <div className="mt-4">
                  <p className="text-blue-600 font-semibold text-sm">{t('click_to_view_details')}</p>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="bg-blue-50 p-6 rounded-xl shadow-lg border border-blue-200">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-blue-200">
            <h3 className="text-2xl font-bold text-blue-800">{selectedTicket.subject}</h3>
            <button
              onClick={() => {
                setSelectedTicket(null);
                fetchMyTickets(); // رفرش لیست تیکت‌ها پس از بازگشت
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition duration-200"
            >
              {t('back_to_tickets')}
            </button>
          </div>

          <div className="mb-4 text-gray-700 text-sm">
            <p className="mb-1">
              {t('ticket_id')}: <span className="font-semibold">{selectedTicket._id}</span>
            </p>
            <p className="mb-1">
              {t('status')}:{' '}
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(selectedTicket.status)}`}>
                {t(`ticket_status_${selectedTicket.status}`)}
              </span>
            </p>
            <p className="mb-1">
              {t('priority')}:{' '}
              <span className={`font-semibold ${getPriorityClass(selectedTicket.priority)}`}>
                {t(`priority_${selectedTicket.priority}`)}
              </span>
            </p>
            <p className="mb-1">{t('created_by')}: <span className="font-semibold">{selectedTicket.user?.username || t('unknown')}</span></p>
            {selectedTicket.assignedTo && <p className="mb-1">{t('assigned_to')}: <span className="font-semibold">{selectedTicket.assignedTo.username}</span></p>}
          </div>

          <div className="messages-box bg-white p-4 rounded-lg border border-gray-200 max-h-80 overflow-y-auto mb-4">
            {selectedTicket.messages.map((msg) => (
              <div key={msg._id} className={`mb-3 p-3 rounded-lg ${msg.sender.role === 'user' ? 'bg-blue-50 ml-auto text-right' : 'bg-gray-100 mr-auto text-left'} max-w-[80%]`}>
                <p className="font-bold text-sm mb-1">
                  {msg.sender.username} ({t(`role_${msg.sender.role}`)}):
                </p>
                <p className="text-gray-800 text-md break-words">{msg.message}</p>
                <p className="text-gray-500 text-xs mt-1">{new Date(msg.createdAt).toLocaleString('fa-IR')}</p>
              </div>
            ))}
          </div>

          {selectedTicket.status !== 'closed' ? (
            <form onSubmit={handleSendMessage} className="flex flex-col sm:flex-row gap-3">
              <textarea
                className="flex-grow p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                rows="2"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={t('type_your_message_placeholder')}
                required
              ></textarea>
              <button
                type="submit"
                className="bg-gradient-to-r from-green-600 to-teal-700 hover:from-green-700 hover:to-teal-800 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                disabled={sendMessageLoading}
              >
                {sendMessageLoading ? t('sending') : t('send_message')}
              </button>
            </form>
          ) : (
            <p className="text-center text-red-600 font-semibold mt-4">{t('ticket_is_closed_message')}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default MyTickets;