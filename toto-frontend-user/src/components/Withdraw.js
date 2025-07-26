// toto-frontend-user/src/components/Withdraw.js
import React, { useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';

// token و API_BASE_URL از پراپس حذف شدند
function Withdraw() {
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [network, setNetwork] = useState('TRC20'); // مقدار پیش‌فرض
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
        '/users/withdraw', // مسیر اصلاح شد: '/api/' از ابتدای مسیر حذف شد
        {
          amount: Number(amount),
          walletAddress,
          network,
        },
        // نیازی به هدر Authorization نیست
      );

      setMessage(
        t('withdrawal_success', {
          amount: Number(amount).toLocaleString('fa-IR'),
          newBalance: res.data.newBalance.toLocaleString('fa-IR'),
        })
      );
      setAmount('');
      setWalletAddress('');
      setNetwork('TRC20'); // ریست شبکه
    } catch (err) {
      setError(err.response?.data?.message || t('error_withdrawing_funds'));
      console.error('Withdrawal error:', err.response?.data || err.message); // برای اشکال‌زدایی
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4 text-center">{t('withdraw_funds')}</h2>

      {message && <div className="text-green-700 bg-green-100 p-3 mb-4 rounded">{message}</div>}
      {error && <div className="text-red-700 bg-red-100 p-3 mb-4 rounded">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Amount */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">{t('withdrawal_amount')}</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            min="1"
            step="0.01"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Wallet Address */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">{t('usdt_wallet_address')}</label>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Network */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">{t('wallet_network')}</label>
          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            required
            className="w-full border rounded px-3 py-2"
          >
            <option value="TRC20">TRC20</option>
            <option value="ERC20">ERC20</option>
            <option value="BEP20">BEP20</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold transition"
        >
          {loading ? t('processing_withdrawal') : t('submit_withdrawal_request')}
        </button>
      </form>
    </div>
  );
}

export default Withdraw;