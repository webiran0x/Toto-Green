// toto-frontend-user/src/components/Withdraw.js
// کامپوننت برای عملیات برداشت وجه با UI بهبود یافته و مناسب پروداکشن

import React, { useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import {
  BanknotesIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

function Withdraw() {
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [network, setNetwork] = useState('TRC20');
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
      const requestBody = {
        amount: Number(amount),
        walletAddress,
        currency: 'USDT',
        network,
      };

      const res = await axios.post(
        '/users/withdraw',
        requestBody,
      );

      setMessage(
        t('withdrawal_success', {
          amount: Number(amount).toLocaleString('fa-IR'),
        })
      );
      setAmount('');
      setWalletAddress('');
      setNetwork('TRC20');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.errors && Array.isArray(err.response.data.errors)) {
        setError(err.response.data.errors.map(e => e.msg || e.message).join(', '));
      } else {
        setError(err.response?.data?.message || t('error_withdrawing_funds'));
      }
      console.error('Withdrawal error:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // OLD: bg-gray-50 dark:bg-gray-900
    <div className="min-h-screen bg-clr-surface-a10 dark:bg-clr-surface-a0 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-inter transition-colors duration-300"> 
      {/* OLD: bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 */}
      <div className="bg-clr-surface-a0 p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md transform transition-all duration-300 hover:scale-[1.01] border border-clr-surface-a20"> 
        {/* OLD: text-gray-800 dark:text-white */}
        <h2 className="text-3xl font-extrabold text-clr-dark-a0 dark:text-clr-light-a0 mb-6 text-center"> 
          {t('withdraw_funds')}
        </h2>

        {/* پیام‌های موفقیت و خطا با آیکون */}
        {message && (
          // Keep success message colors
          <div className="bg-green-100 dark:bg-green-900 border-l-4 border-green-500 dark:border-green-700 text-green-700 dark:text-green-200 p-4 rounded-lg mb-4 animate-fadeIn">
            <div className="flex items-center">
              <CheckCircleIcon className="h-6 w-6 text-green-500 dark:text-green-400 mr-3" />
              <p className="font-medium">{message}</p>
            </div>
          </div>
        )}
        {error && (
          // Keep error message colors
          <div className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 dark:border-red-700 text-red-700 dark:text-red-200 p-4 rounded-lg mb-4 animate-fadeIn">
            <div className="flex items-center">
              <ExclamationCircleIcon className="h-6 w-6 text-red-500 dark:text-red-400 mr-3" />
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Amount Input */}
          <div>
            {/* OLD: text-gray-700 dark:text-gray-300 */}
            <label htmlFor="amount" className="block text-sm font-medium text-clr-dark-a0 dark:text-clr-light-a0 mb-1"> 
              {t('withdrawal_amount')}:
            </label>
            <input
              type="number"
              id="amount"
              // OLD: border-gray-300 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500 dark:focus:ring-purple-400 p-3 text-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200
              className="mt-1 block w-full rounded-lg border-clr-surface-a30 shadow-sm focus:border-clr-primary-a0 focus:ring-clr-primary-a0 p-3 text-lg bg-clr-surface-a10 text-clr-dark-a0 dark:text-clr-light-a0 transition duration-200 ease-in-out" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="1"
              step="0.01"
              placeholder={t('enter_amount_usdt_placeholder')}
            />
          </div>

          {/* Wallet Address Input */}
          <div>
            {/* OLD: text-gray-700 dark:text-gray-300 */}
            <label htmlFor="walletAddress" className="block text-sm font-medium text-clr-dark-a0 dark:text-clr-light-a0 mb-1"> 
              {t('usdt_wallet_address')}:
            </label>
            <input
              type="text"
              id="walletAddress"
              // OLD: border-gray-300 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500 dark:focus:ring-purple-400 p-3 text-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200
              className="mt-1 block w-full rounded-lg border-clr-surface-a30 shadow-sm focus:border-clr-primary-a0 focus:ring-clr-primary-a0 p-3 text-lg bg-clr-surface-a10 text-clr-dark-a0 dark:text-clr-light-a0 transition duration-200 ease-in-out" 
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              required
              placeholder={t('enter_wallet_address_placeholder')}
            />
          </div>

          {/* Network Select */}
          <div>
            {/* OLD: text-gray-700 dark:text-gray-300 */}
            <label htmlFor="network" className="block text-sm font-medium text-clr-dark-a0 dark:text-clr-light-a0 mb-1"> 
              {t('wallet_network')}:
            </label>
            <div className="relative">
              <select
                id="network"
                // OLD: border-gray-300 dark:border-gray-600 shadow-sm focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500 dark:focus:ring-purple-400 p-3 text-lg appearance-none bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200
                className="block w-full rounded-lg border-clr-surface-a30 shadow-sm focus:border-clr-primary-a0 focus:ring-clr-primary-a0 p-3 text-lg appearance-none bg-clr-surface-a10 text-clr-dark-a0 dark:text-clr-light-a0 transition duration-200 ease-in-out pr-10" 
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                required
              >
                <option value="TRC20">TRC20</option>
                <option value="ERC20">ERC20</option>
                <option value="BEP20">BEP20</option>
              </select>
              {/* OLD: text-gray-700 dark:text-gray-300 */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-clr-dark-a0 dark:text-clr-light-a0"> 
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            // OLD: bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 dark:from-purple-700 dark:to-indigo-800 dark:hover:from-purple-800 dark:hover:to-indigo-900 text-white
            className="w-full bg-gradient-to-r from-clr-primary-a0 to-clr-primary-a10 hover:from-clr-primary-a10 hover:to-clr-primary-a20 text-clr-light-a0 font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-xl shadow-lg flex items-center justify-center" 
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <ArrowPathIcon className="animate-spin h-5 w-5 mr-3" /> {t('processing_withdrawal')}
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <BanknotesIcon className="h-6 w-6 mr-3" /> {t('submit_withdrawal_request')}
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Withdraw;