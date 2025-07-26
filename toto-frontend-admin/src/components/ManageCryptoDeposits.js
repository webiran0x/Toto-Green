// toto-frontend-admin/src/components/ManageCryptoDeposits.js
// کامپوننت مدیریت واریزهای ارز دیجیتال برای ادمین

import React, { useState, useEffect, useCallback } from 'react'; // useCallback اضافه شد برای fetchDeposits
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';

// نیازی نیست token و API_BASE_URL به عنوان پراپ پاس داده شوند.
// axios.defaults.baseURL و axios.defaults.withCredentials در App.js تنظیم شده‌اند.
function ManageCryptoDeposits() { // 'token' و 'API_BASE_URL' از پراپس حذف شدند
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { t } = useLanguage();

  // تابع fetchDeposits را داخل useCallback قرار می‌دهیم تا از ایجاد مکرر آن جلوگیری شود
  const fetchDeposits = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setMessage(''); // پیام‌ها هم باید قبل از هر fetch جدید پاک شوند
      // درخواست Axios:
      // baseURL از axios.defaults.baseURL در App.js گرفته می‌شود.
      // کوکی‌ها به خاطر axios.defaults.withCredentials = true ارسال می‌شوند.
      const res = await axios.get('/admin/crypto-deposits'); // '/api' از ابتدای مسیر حذف شد
      setDeposits(res.data);
    } catch (err) {
      setError(err.response?.data?.message || t('error_fetching_crypto_deposits_admin'));
      console.error('Error fetching crypto deposits:', err.response?.data || err.message); // لاگ برای اشکال‌زدایی
    } finally {
      setLoading(false);
    }
  }, [t]); // t را به dependency array اضافه کنید

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]); // fetchDeposits را به dependency array اضافه کنید

  const handleUpdateStatus = async (depositId, newStatus, isProcessed = false, actualAmount = null) => {
    setMessage('');
    setError('');
    try {
      // درخواست Axios:
      // baseURL از axios.defaults.baseURL در App.js گرفته می‌شود.
      // کوکی‌ها به خاطر axios.defaults.withCredentials = true ارسال می‌شوند.
      await axios.put(
        `/admin/crypto-deposits/${depositId}/status`, // '/api' از ابتدای مسیر حذف شد
        { status: newStatus, isProcessed, actualAmount },
        // نیازی به هدر Authorization نیست
      );
      setMessage(t('crypto_deposit_status_updated_admin'));
      fetchDeposits(); // رفرش لیست
    } catch (err) {
      setError(err.response?.data?.message || t('error_updating_crypto_deposit_status_admin'));
      console.error('Error updating crypto deposit status:', err.response?.data || err.message); // لاگ برای اشکال‌زدایی
    }
  };

  if (loading) return <div className="text-center py-8">{t('loading')}</div>;
  if (error) return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('manage_crypto_deposits_title_admin')}</h2>
      {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">{message}</div>}

      {deposits.length === 0 ? (
        <p className="text-gray-600">{t('no_crypto_deposits_found_admin')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow-md">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold text-sm">{t('date')}</th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold text-sm">{t('user')}</th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold text-sm">{t('currency')}</th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold text-sm">{t('network')}</th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold text-sm">{t('address')}</th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold text-sm">{t('expected_amount')}</th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold text-sm">{t('actual_amount')}</th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold text-sm">{t('tx_hash')}</th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold text-sm">{t('confirmations')}</th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold text-sm">{t('status_admin')}</th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold text-sm">{t('processed_admin')}</th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold text-sm">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((deposit) => (
                <tr key={deposit._id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-800">{new Date(deposit.createdAt).toLocaleString('fa-IR')}</td>
                  <td className="py-3 px-4 text-gray-800">{deposit.userId?.username || t('unknown')}</td>
                  <td className="py-3 px-4 text-gray-800">{deposit.currency}</td>
                  <td className="py-3 px-4 text-gray-800">{deposit.network}</td>
                  <td className="py-3 px-4 text-gray-800 break-all text-xs">{deposit.depositAddress}</td>
                  <td className="py-3 px-4 text-gray-800">{deposit.expectedAmount?.toLocaleString('fa-IR') || 'N/A'}</td>
                  <td className="py-3 px-4 text-gray-800">{deposit.actualAmount?.toLocaleString('fa-IR') || 'N/A'}</td>
                  <td className="py-3 px-4 text-gray-800 break-all text-xs">{deposit.transactionHash || 'N/A'}</td>
                  <td className="py-3 px-4 text-gray-800">{deposit.confirmations}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      deposit.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      deposit.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      deposit.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {deposit.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      deposit.isProcessed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {deposit.isProcessed ? t('yes') : t('no')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {!deposit.isProcessed && deposit.status === 'confirmed' && (
                      <button
                        onClick={() => handleUpdateStatus(deposit._id, 'completed', true, deposit.actualAmount)}
                        className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded-md text-sm transition duration-200"
                      >
                        {t('mark_as_processed_admin')}
                      </button>
                    )}
                    {/* می‌توانید دکمه‌های دیگری برای تغییر وضعیت به failed/cancelled اضافه کنید */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ManageCryptoDeposits;