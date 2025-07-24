// toto-frontend-admin/src/components/ManageWithdrawals.js
// کامپوننت مدیریت درخواست‌های برداشت وجه برای ادمین

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';

function ManageWithdrawals({ token, API_BASE_URL }) {
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [notes, setNotes] = useState('');
  const [actionType, setActionType] = useState(''); // 'approve' or 'reject'
  const { t } = useLanguage();

  const fetchWithdrawalRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`${API_BASE_URL}/admin/withdrawals`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setWithdrawalRequests(res.data);
    } catch (err) {
      setError(err.response?.data?.message || t('error_fetching_data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawalRequests();
  }, [token, API_BASE_URL, t]);

  const handleAction = (requestId, type) => {
    setCurrentRequestId(requestId);
    setActionType(type);
    setNotes(''); // Clear notes for new action
    setShowNotesModal(true);
  };

  const submitAction = async () => {
    setMessage('');
    setError('');
    setShowNotesModal(false); // Close modal immediately
    setLoading(true); // Show loading for the action

    try {
      let res;
      // <--- تغییرات در اینجا اعمال شد: ارسال adminNotes به جای notes
      if (actionType === 'approve') {
        res = await axios.put(
          `${API_BASE_URL}/admin/withdrawals/${currentRequestId}/approve`,
          { adminNotes: notes }, // تغییر از { notes } به { adminNotes: notes }
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else if (actionType === 'reject') {
        if (!notes.trim()) {
          setError(t('rejection_notes_required'));
          setLoading(false);
          return;
        }
        res = await axios.put(
          `${API_BASE_URL}/admin/withdrawals/${currentRequestId}/reject`,
          { adminNotes: notes }, // تغییر از { notes } به { adminNotes: notes }
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setMessage(res.data.message);
      fetchWithdrawalRequests(); // Refresh the list
    } catch (err) {
      setError(err.response?.data?.message || t('error_processing_request'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">{t('loading')}</div>;
  if (error && !message) return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('manage_withdrawal_requests')}</h2>
      {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">{message}</div>}

      {withdrawalRequests.length === 0 ? (
        <p className="text-gray-600">{t('no_withdrawal_requests')}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold text-sm">{t('date')}</th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold text-sm">{t('username')}</th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold text-sm">{t('amount')} ({t('usdt')})</th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold text-sm">{t('wallet_address')}</th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold text-sm">{t('status')}</th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold text-sm">{t('processed_by')}</th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold text-sm">{t('notes')}</th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold text-sm">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {withdrawalRequests.map((request) => (
                <tr key={request._id} className="border-b border-gray-100 hover:bg-gray-50 transition duration-150">
                  <td className="py-3 px-4 text-gray-800 text-sm">{new Date(request.createdAt).toLocaleString('fa-IR')}</td>
                  <td className="py-3 px-4 text-gray-800 text-sm">{request.user?.username || t('unknown')}</td>
                  <td className="py-3 px-4 text-gray-800 text-sm font-semibold">{request.amount?.toLocaleString('fa-IR')}</td>
                  <td className="py-3 px-4 text-gray-800 text-sm break-all">{request.walletAddress}</td>
                  <td className="py-3 px-4 text-gray-800 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {t(`withdrawal_status_${request.status}`)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-800 text-sm">{request.processedBy?.username || t('n_a')}</td>
                  <td className="py-3 px-4 text-gray-800 text-sm max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">{request.notes || t('no_notes')}</td>
                  <td className="py-3 px-4">
                    {request.status === 'pending' ? (
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => handleAction(request._id, 'approve')}
                          className="bg-green-500 hover:bg-green-600 text-white text-sm py-1 px-3 rounded-md transition duration-200 shadow-sm"
                        >
                          {t('approve')}
                        </button>
                        <button
                          onClick={() => handleAction(request._id, 'reject')}
                          className="bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-3 rounded-md transition duration-200 shadow-sm"
                        >
                          {t('reject')}
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">{t('action_taken')}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {actionType === 'approve' ? t('add_notes_for_approval') : t('reason_for_rejection')}
            </h3>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={actionType === 'approve' ? t('optional_notes_placeholder') : t('rejection_reason_placeholder')}
              required={actionType === 'reject'}
            ></textarea>
            {actionType === 'reject' && !notes.trim() && (
              <p className="text-red-500 text-sm mt-1">{t('rejection_notes_required')}</p>
            )}
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowNotesModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-md transition duration-200"
              >
                {t('cancel')}
              </button>
              <button
                onClick={submitAction}
                className={`py-2 px-4 rounded-md transition duration-200 ${
                  actionType === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' :
                  'bg-red-600 hover:bg-red-700 text-white'
                } disabled:opacity-50`}
                disabled={actionType === 'reject' && !notes.trim()}
              >
                {actionType === 'approve' ? t('confirm_approve') : t('confirm_reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageWithdrawals;
