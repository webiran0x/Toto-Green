// toto-frontend-user/src/components/Deposit.js
// کامپوننت برای عملیات واریز وجه با UI بهبود یافته و مناسب پروداکشن

import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import QRCode from 'react-qr-code'; // برای تولید کد QR
import {
  CheckCircleIcon, // آیکون موفقیت
  ExclamationCircleIcon, // آیکون خطا
  ClockIcon, // آیکون در انتظار
  ArrowPathIcon, // آیکون پردازش
  XCircleIcon // آیکون لغو
} from '@heroicons/react/24/outline'; // استفاده از Heroicons برای آیکون‌ها

// token و API_BASE_URL از پراپس حذف شدند، زیرا axios.defaults.baseURL در App.js تنظیم شده است.
function Deposit() {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('crypto'); // پیش‌فرض: رمزارز
  const [cryptoCurrency, setCryptoCurrency] = useState('USDT');
  const [network, setNetwork] = useState('TRC20');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  // وضعیت‌های جدید برای مدیریت واریز رمزارزی
  const [depositInitiated, setDepositInitiated] = useState(false); // آیا فرآیند واریز رمزارزی شروع شده است؟
  const [depositInfo, setDepositInfo] = useState(null); // اطلاعات واریز از SHKeeper (walletAddress, expectedAmount, shkeeperInvoiceId)
  const [cryptoDepositId, setCryptoDepositId] = useState(null); // ID رکورد CryptoDeposit در دیتابیس بک‌اند
  const [depositStatus, setDepositStatus] = useState('pending'); // 'pending', 'confirmed', 'failed', 'expired', 'cancelled'
  const [countdown, setCountdown] = useState(0); // ثانیه‌های باقی‌مانده برای انقضای پرداخت
  const countdownIntervalRef = useRef(null); // برای نگهداری مرجع اینتروال شمارش معکوس

  // زمان پیش‌فرض برای انقضای پرداخت (مثلاً 15 دقیقه)
  const PAYMENT_EXPIRATION_SECONDS = 15 * 60;

  // تابع پولینگ (polling) برای بررسی وضعیت واریز رمزارزی
  const pollDepositStatus = useCallback(async (depositId) => {
    try {
      // درخواست به بک‌اند برای دریافت وضعیت واریز رمزارزی خاص
      // مسیر: /api/users/crypto-deposits/:id
      const res = await axios.get(`/users/crypto-deposits/${depositId}`);
      const fetchedDeposit = res.data;

      if (fetchedDeposit && fetchedDeposit.status === 'confirmed') {
        setDepositStatus('confirmed');
        setMessage(t('deposit_confirmed_success'));
        clearInterval(countdownIntervalRef.current); // توقف شمارش معکوس
        return true; // نشان می‌دهد که پولینگ باید متوقف شود
      } else if (fetchedDeposit && ['failed', 'expired', 'cancelled'].includes(fetchedDeposit.status)) {
        setDepositStatus(fetchedDeposit.status); // وضعیت را به failed/expired/cancelled تغییر می‌دهد
        setError(t('deposit_failed_message')); // پیام خطای عمومی
        clearInterval(countdownIntervalRef.current); // توقف شمارش معکوس
        return true; // نشان می‌دهد که پولینگ باید متوقف شود
      }
      return false; // پولینگ ادامه یابد
    } catch (err) {
      console.error('Error polling crypto deposit status:', err.response?.data?.message || err.message);
      return false;
    }
  }, [t]);

  useEffect(() => {
    if (depositInitiated && cryptoDepositId) {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }

      setCountdown(PAYMENT_EXPIRATION_SECONDS);
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            setDepositStatus('expired');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      const pollingInterval = setInterval(async () => {
        const stopPolling = await pollDepositStatus(cryptoDepositId);
        if (stopPolling) {
          clearInterval(pollingInterval);
        }
      }, 10000);

      return () => {
        clearInterval(pollingInterval);
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
      };
    }
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [depositInitiated, cryptoDepositId, PAYMENT_EXPIRATION_SECONDS, pollDepositStatus]);

  // فرمت کردن زمان برای نمایش
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    // ریست وضعیت‌های واریز قبل از درخواست جدید
    setDepositInitiated(false);
    setDepositInfo(null);
    setCryptoDepositId(null);
    setDepositStatus('pending');
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setCountdown(0);

    try {
      let requestBody = {
        amount: parseFloat(amount),
        method: method,
      };

      if (method === 'crypto') {
        requestBody.cryptoCurrency = cryptoCurrency;
        requestBody.network = network;
      }

      const res = await axios.post('/users/deposit', requestBody);

      if (method === 'crypto') {
        setDepositInitiated(true);
        setDepositInfo(res.data.depositInfo);
        setCryptoDepositId(res.data.cryptoDepositId);
        setDepositStatus('pending');
        setMessage(t('crypto_deposit_initiated'));
      } else {
        setMessage(res.data.message);
        setAmount('');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.errors && Array.isArray(err.response.data.errors)) {
        setError(err.response.data.errors.join(', '));
      } else {
        setError(err.response?.data?.message || t('deposit_error'));
      }
      console.error('Deposit submission error:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-inter">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-3xl w-full max-w-md transform transition-all duration-300 hover:scale-[1.01] border-4 border-blue-200">
        <h2 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">
          {t('deposit_funds')}
        </h2>

        {message && !depositInitiated && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg mb-4 animate-fadeIn">
            <div className="flex items-center">
              <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3" />
              <p className="font-medium">{message}</p>
            </div>
          </div>
        )}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-4 animate-fadeIn">
            <div className="flex items-center">
              <ExclamationCircleIcon className="h-6 w-6 text-red-500 mr-3" />
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}

        {!depositInitiated ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                {t('amount')}:
              </label>
              <input
                type="number"
                id="amount"
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 text-lg transition duration-200 ease-in-out"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="0.01"
                step="0.01"
                placeholder={t('enter_amount_usdt_placeholder')}
              />
            </div>

            <div>
              <label htmlFor="method" className="block text-sm font-medium text-gray-700 mb-1">
                {t('deposit_method')}:
              </label>
              <div className="relative">
                <select
                  id="method"
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 text-lg appearance-none bg-white transition duration-200 ease-in-out pr-10"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  <option value="crypto">{t('cryptocurrency')}</option>
                  {/* <option value="manual">{t('manual_deposit')}</option> */}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            {method === 'crypto' && (
              <>
                <div>
                  <label htmlFor="cryptoCurrency" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('currency')}:
                  </label>
                  <div className="relative">
                    <select
                      id="cryptoCurrency"
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 text-lg appearance-none bg-white transition duration-200 ease-in-out pr-10"
                      value={cryptoCurrency}
                      onChange={(e) => {
                        setCryptoCurrency(e.target.value);
                        if (e.target.value === 'USDT') {
                          setNetwork('TRC20');
                        } else if (e.target.value === 'BTC') {
                          setNetwork('BTC');
                        }
                      }}
                    >
                      <option value="USDT">USDT</option>
                      <option value="BTC">BTC</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="network" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('network')}:
                  </label>
                  <div className="relative">
                    <select
                      id="network"
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 text-lg appearance-none bg-white transition duration-200 ease-in-out pr-10"
                      value={network}
                      onChange={(e) => setNetwork(e.target.value)}
                    >
                      {cryptoCurrency === 'USDT' && (
                        <>
                          <option value="TRC20">TRC20 (Tron)</option>
                          <option value="BEP20">BEP20 (BSC)</option>
                          <option value="ERC20">ERC20 (Ethereum)</option>
                        </>
                      )}
                      {cryptoCurrency === 'BTC' && (
                        <option value="BTC">Bitcoin</option>
                      )}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-xl shadow-lg"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <ArrowPathIcon className="animate-spin h-5 w-5 mr-3" /> {t('processing')}
                </span>
              ) : (
                t('deposit')
              )}
            </button>
          </form>
        ) : (
          <div className="mt-6 p-6 rounded-xl shadow-inner border-2 border-blue-100 bg-blue-50 animate-fadeIn">
            {depositStatus === 'pending' && (
              <div className="text-center">
                <ClockIcon className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-pulse" />
                <p className="text-xl font-semibold text-gray-800 mb-2">{t('waiting_for_payment')}</p>
                <p className="text-md text-gray-600 mb-4">{t('send_exact_amount_to_address')}</p>

                <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200 mb-4">
                  <p className="text-gray-700 text-lg mb-2">
                    <span className="font-medium">{t('expected_amount')}:</span>{' '}
                    <span className="font-bold text-blue-600">
                      {depositInfo.expectedAmount} {depositInfo.cryptoCurrency.split('-')[0]}
                    </span>
                  </p>
                  <p className="text-gray-700 break-all text-md mb-3">
                    <span className="font-medium">{t('deposit_address')}:</span>{' '}
                    <span className="font-bold text-blue-600">{depositInfo.walletAddress}</span>
                  </p>

                  {depositInfo.qrCodeUri && (
                    <div className="mt-4 flex justify-center p-2 bg-white rounded-md shadow-sm">
                      <QRCode
                        value={depositInfo.qrCodeUri}
                        size={180}
                        level="H"
                        bgColor="#FFFFFF"
                        fgColor="#000000"
                        className="rounded-lg shadow-inner"
                      />
                    </div>
                  )}
                  <p className="text-gray-700 text-md mt-3">
                    <span className="font-medium">{t('network')}:</span>{' '}
                    <span className="font-bold text-blue-600">{depositInfo.cryptoCurrency.split('-')[1]}</span>
                  </p>
                  <button
                    onClick={() => {
                      const el = document.createElement('textarea');
                      el.value = depositInfo.walletAddress;
                      document.body.appendChild(el);
                      el.select();
                      document.execCommand('copy');
                      document.body.removeChild(el);
                      setMessage(t('address_copied'));
                    }}
                    className="mt-4 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold py-2 px-4 rounded-lg text-sm transition duration-200 shadow-sm hover:shadow-md"
                  >
                    {t('copy_address')}
                  </button>
                </div>

                {countdown > 0 && (
                  <p className="text-red-500 text-lg font-bold animate-pulse">
                    {t('time_remaining')}: {formatTime(countdown)}
                  </p>
                )}
                {countdown === 0 && depositStatus === 'expired' && (
                  <p className="text-red-600 text-lg font-bold">{t('payment_expired')}</p>
                )}
              </div>
            )}

            {depositStatus === 'confirmed' && (
              <div className="text-center text-green-700 font-bold text-xl animate-scaleIn">
                <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <p>{t('deposit_confirmed_success')}</p>
                <p className="text-md text-gray-600 mt-2">{t('balance_updated_shortly')}</p>
              </div>
            )}

            {depositStatus === 'failed' && (
              <div className="text-center text-red-700 font-bold text-xl animate-scaleIn">
                <ExclamationCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <p>{t('deposit_failed_message')}</p>
                <p className="text-md text-gray-600 mt-2">{t('please_try_again')}</p>
              </div>
            )}
            {depositStatus === 'expired' && (
              <div className="text-center text-red-700 font-bold text-xl animate-scaleIn">
                <ClockIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <p>{t('payment_expired')}</p>
                <p className="text-md text-gray-600 mt-2">{t('please_try_again')}</p>
              </div>
            )}
            {depositStatus === 'cancelled' && (
              <div className="text-center text-red-700 font-bold text-xl animate-scaleIn">
                <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <p>{t('deposit_cancelled_message')}</p>
                <p className="text-md text-gray-600 mt-2">{t('please_try_again')}</p>
              </div>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setDepositInitiated(false);
                  setDepositInfo(null);
                  setCryptoDepositId(null);
                  setDepositStatus('pending');
                  setAmount('');
                  setMessage('');
                  setError('');
                  clearInterval(countdownIntervalRef.current);
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg text-xl"
              >
                {t('start_new_deposit')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Deposit;
