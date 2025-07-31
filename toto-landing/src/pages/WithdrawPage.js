// toto-landing/src/pages/WithdrawPage.js

import React, { useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  DollarSign,
  CheckCircleIcon,
  AlertTriangle,
  Loader2
} from 'lucide-react'; // آیکون‌های lucide-react

function WithdrawPage({ currentTheme, toggleTheme, isAuthenticated }) {
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

      const res = await axios.post('/users/withdraw', requestBody);

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
    <div className="bg-clr-surface-a0 min-h-screen flex flex-col font-iranyekan">
      <Header currentTheme={currentTheme} toggleTheme={toggleTheme} isAuthenticated={isAuthenticated} />
      <main className="flex-grow container mx-auto p-4 lg:p-8">
        <div className="min-h-screen bg-clr-surface-a10 dark:bg-clr-surface-a0 flex items-center justify-center p-4 sm:p-6 lg:p-8 transition-colors duration-300">
          <div className="bg-clr-surface-a0 p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md transform transition-all duration-300 hover:scale-[1.01] border border-clr-surface-a20">
            <h2 className="text-3xl font-extrabold text-clr-dark-a0 dark:text-clr-light-a0 mb-6 text-center">
              {t('withdraw_funds')}
            </h2>
            {message && (
              <div className="bg-green-100 dark:bg-green-900 border-l-4 border-green-500 dark:border-green-700 text-green-700 dark:text-green-200 p-4 rounded-lg mb-4 animate-fadeIn">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-6 w-6 text-green-500 dark:text-green-400 mr-3 rtl:ml-3 rtl:mr-0" />
                  <p className="font-medium">{message}</p>
                </div>
              </div>
            )}
            {error && (
              <div className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 dark:border-red-700 text-red-700 dark:text-red-200 p-4 rounded-lg mb-4 animate-fadeIn">
                <div className="flex items-center">
                  <AlertTriangle className="h-6 w-6 text-red-500 dark:text-red-400 mr-3 rtl:ml-3 rtl:mr-0" />
                  <p className="font-medium">{error}</p>
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-clr-dark-a0 dark:text-clr-light-a0 mb-1">
                  {t('withdrawal_amount')}:
                </label>
                <input
                  type="number"
                  id="amount"
                  className="mt-1 block w-full rounded-lg border-clr-surface-a30 shadow-sm focus:border-clr-primary-a0 focus:ring-clr-primary-a0 p-3 text-lg bg-clr-surface-a10 text-clr-dark-a0 dark:text-clr-light-a0 transition duration-200 ease-in-out"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min="1"
                  step="0.01"
                  placeholder={t('enter_amount_usdt_placeholder')}
                />
              </div>
              <div>
                <label htmlFor="walletAddress" className="block text-sm font-medium text-clr-dark-a0 dark:text-clr-light-a0 mb-1">
                  {t('usdt_wallet_address')}:
                </label>
                <input
                  type="text"
                  id="walletAddress"
                  className="mt-1 block w-full rounded-lg border-clr-surface-a30 shadow-sm focus:border-clr-primary-a0 focus:ring-clr-primary-a0 p-3 text-lg bg-clr-surface-a10 text-clr-dark-a0 dark:text-clr-light-a0 transition duration-200 ease-in-out"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  required
                  placeholder={t('enter_wallet_address_placeholder')}
                />
              </div>
              <div>
                <label htmlFor="network" className="block text-sm font-medium text-clr-dark-a0 dark:text-clr-light-a0 mb-1">
                  {t('wallet_network')}:
                </label>
                <div className="relative">
                  <select
                    id="network"
                    className="block w-full rounded-lg border-clr-surface-a30 shadow-sm focus:border-clr-primary-a0 focus:ring-clr-primary-a0 p-3 text-lg appearance-none bg-clr-surface-a10 text-clr-dark-a0 dark:text-clr-light-a0 transition duration-200 ease-in-out pr-10 rtl:pr-auto rtl:pl-10"
                    value={network}
                    onChange={(e) => setNetwork(e.target.value)}
                    required
                  >
                    <option value="TRC20">TRC20</option>
                    <option value="ERC20">ERC20</option>
                    <option value="BEP20">BEP20</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 rtl:left-0 rtl:right-auto flex items-center px-2 text-clr-dark-a0 dark:text-clr-light-a0">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-clr-primary-a0 to-clr-primary-a10 hover:from-clr-primary-a10 hover:to-clr-primary-a20 text-clr-light-a0 font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-xl shadow-lg flex items-center justify-center"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="animate-spin h-5 w-5 mr-3 rtl:ml-3 rtl:mr-0" /> {t('processing_withdrawal')}
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <DollarSign className="h-6 w-6 mr-3 rtl:ml-3 rtl:mr-0" /> {t('submit_withdrawal_request')}
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default WithdrawPage;
