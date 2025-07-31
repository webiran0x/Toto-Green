// toto-landing/src/pages/MyTicketsPage.js
// کامپوننت مشاهده تیکت‌های پشتیبانی کاربر و ارسال پیام با UI بهبود یافته و حرفه‌ای

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  RefreshCw,
  TicketIcon,
  MessageCircle,
  CornerUpLeft,
  AlertTriangle,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  Send,
  UserCircleIcon,
  PlusCircleIcon
} from 'lucide-react';

function MyTicketsPage({ currentTheme, toggleTheme, isAuthenticated }) {
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
    if (isAuthenticated) {
      fetchMyTickets();
    } else {
      setLoading(false);
      setTickets([]);
    }
  }, [fetchMyTickets, isAuthenticated]);

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

  const getStatusClass = (status) => {
    switch (status) {
      case 'open': return 'bg-clr-primary-a50 text-clr-dark-a0 dark:bg-clr-primary-a10 dark:text-clr-light-a0';
      case 'in_progress': return 'bg-clr-surface-tonal-a20 text-clr-dark-a0 dark:bg-clr-surface-tonal-a30 dark:text-clr-light-a0';
      case 'resolved': return 'bg-clr-surface-tonal-a0 text-clr-dark-a0 dark:bg-clr-surface-tonal-a10 dark:text-clr-light-a0';
      case 'closed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-clr-surface-a10 text-clr-dark-a0 dark:bg-clr-surface-a20 dark:text-clr-light-a0';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <ClockIcon className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0 text-clr-primary-a0" />;
      case 'in_progress': return <ClockIcon className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0 text-clr-surface-tonal-a40" />;
      case 'resolved': return <CheckCircleIcon className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0 text-clr-primary-a0" />;
      case 'closed': return <XCircleIcon className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0 text-red-500 dark:text-red-400" />;
      default: return null;
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'low': return 'text-clr-primary-a0';
      case 'medium': return 'text-clr-surface-tonal-a40';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'urgent': return 'text-red-600 dark:text-red-400';
      default: return 'text-clr-surface-a40 dark:text-clr-surface-a50';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0 text-red-600 dark:text-red-400" />;
      case 'high': return <AlertTriangle className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0 text-orange-600 dark:text-orange-400" />;
      default: return null;
    }
  };

  return (
    <div className="bg-clr-surface-a0 min-h-screen flex flex-col font-iranyekan">
      <Header currentTheme={currentTheme} toggleTheme={toggleTheme} isAuthenticated={isAuthenticated} />
      <main className="flex-grow container mx-auto p-4 lg:p-8">
        <div className="bg-clr-surface-a0 p-6 rounded-lg shadow-xl border border-clr-surface-a20 min-h-[calc(100vh-120px)] transition-colors duration-300">
          <h2 className="text-3xl font-extrabold text-clr-dark-a0 dark:text-clr-light-a0 mb-6 text-center">{t('my_tickets')}</h2>
          {error && selectedTicket && <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-4 text-center">{error}</div>}

          {!selectedTicket ? (
            loading ? (
              <div className="text-center py-8 text-clr-dark-a0 dark:text-clr-light-a0">{t('loading')}</div>
            ) : tickets.length === 0 ? (
              <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-center py-4">{t('no_tickets_found')}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tickets.map((ticket) => (
                  <div
                    key={ticket._id}
                    className="bg-clr-surface-a10 p-6 rounded-xl shadow-lg border border-clr-surface-a20 cursor-pointer transform transition-transform duration-300 hover:scale-[1.02] flex flex-col justify-between animate-fadeIn transition-colors duration-300"
                    onClick={() => fetchTicketDetails(ticket._id)}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-bold text-clr-primary-a0">{ticket.subject}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center ${getStatusClass(ticket.status)}`}>
                          {getStatusIcon(ticket.status)} {t(`ticket_status_${ticket.status}`)}
                        </span>
                      </div>
                      <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-sm mb-1">{t('no_tickets_found')}: <span className="font-mono text-clr-surface-a40 dark:text-clr-surface-a50">{ticket._id}</span></p>
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
                    <div className="mt-4 flex items-center text-clr-primary-a0 font-semibold text-sm hover:text-clr-primary-a10 transition duration-200">
                      <MessageCircle className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" />
                      {t('click_to_view_details')}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="bg-clr-surface-a10 p-6 rounded-xl shadow-lg border border-clr-surface-a20 animate-fadeIn transition-colors duration-300">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-clr-surface-a20">
                <h3 className="text-2xl font-bold text-clr-primary-a0">{selectedTicket.subject}</h3>
                <button
                  onClick={() => {
                    setSelectedTicket(null);
                    fetchMyTickets();
                  }}
                  className="bg-clr-surface-a30 hover:bg-clr-surface-a40 text-clr-light-a0 font-bold py-2 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg flex items-center focus:outline-none focus:ring-2 focus:ring-clr-surface-a40 focus:ring-offset-2 dark:focus:ring-offset-clr-surface-a10"
                >
                  <CornerUpLeft className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" /> {t('back_to_tickets')}
                </button>
              </div>
              <div className="mb-6 p-4 bg-clr-surface-a0 rounded-lg shadow-inner border border-clr-surface-a10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-clr-dark-a0 dark:text-clr-light-a0 text-sm transition-colors duration-300">
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
              <div className="messages-box bg-clr-surface-a0 p-4 rounded-lg border border-clr-surface-a20 max-h-80 overflow-y-auto mb-4 shadow-inner transition-colors duration-300">
                {selectedTicket.messages.length === 0 ? (
                    <p className="text-center text-clr-surface-a40 dark:text-clr-surface-a50">{t('no_messages_yet')}</p>
                ) : (
                    selectedTicket.messages.map((msg) => (
                        <div key={msg._id} className={`mb-3 p-3 rounded-lg max-w-[80%] shadow-sm transition-colors duration-300 ${msg.sender.role === 'user' ? 'bg-clr-surface-tonal-a0 ml-auto text-right border border-clr-surface-tonal-a10' : 'bg-clr-surface-a10 mr-auto text-left border border-clr-surface-a20'}`}>
                            <p className="font-bold text-sm mb-1 flex items-center text-clr-dark-a0 dark:text-clr-light-a0">
                                {msg.sender.role === 'user' ? <UserCircleIcon className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 text-clr-primary-a0" /> : <TicketIcon className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 text-clr-surface-a40" />}
                                {msg.sender.username} ({t(`role_${msg.sender.role}`)}):
                            </p>
                            <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-md break-words">{msg.message}</p>
                            <p className="text-clr-surface-a40 dark:text-clr-surface-a50 text-xs mt-1">{new Date(msg.createdAt).toLocaleString('fa-IR')}</p>
                        </div>
                    ))
                )}
              </div>
              {selectedTicket.status !== 'closed' ? (
                <form onSubmit={handleSendMessage} className="flex flex-col sm:flex-row gap-3">
                  <textarea
                    className="flex-grow p-3 border border-clr-surface-a30 rounded-lg focus:outline-none focus:ring-2 focus:ring-clr-primary-a0 transition duration-200 shadow-sm bg-clr-surface-a10 text-clr-dark-a0 dark:text-clr-light-a0"
                    rows="2"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={t('type_your_message_placeholder')}
                    required
                  ></textarea>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-clr-primary-a0 to-clr-primary-a10 hover:from-clr-primary-a10 hover:to-clr-primary-a20 text-clr-light-a0 font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center"
                    disabled={sendMessageLoading}
                  >
                    {sendMessageLoading ? (
                      <span className="flex items-center"><RefreshCw className="animate-spin h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" /> {t('sending')}</span>
                    ) : (
                      <span className="flex items-center"><Send className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" /> {t('send_message')}</span>
                    )}
                  </button>
                </form>
              ) : (
                <p className="text-center text-red-600 dark:text-red-400 font-semibold mt-4 p-3 bg-red-50 dark:bg-red-900 rounded-lg border border-red-200 dark:border-red-700 flex items-center justify-center transition-colors duration-300">
                    <XCircleIcon className="h-6 w-6 mr-2 rtl:ml-2 rtl:mr-0" /> {t('ticket_is_closed_message')}
                </p>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default MyTicketsPage;