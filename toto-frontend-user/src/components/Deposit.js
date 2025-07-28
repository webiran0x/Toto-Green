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
  XCircleIcon, // آیکون لغو
  ClipboardDocumentListIcon, // آیکون برای کپی
  InformationCircleIcon // آیکون جدید برای تولتیپ
} from '@heroicons/react/24/outline'; // استفاده از Heroicons برای آیکون‌ها

// کامپوننت Tooltip جدید و بهینه شده
const Tooltip = ({ children, text, position = 'top' }) => {
  const [show, setShow] = useState(false);
  let positionClasses = '';

  // تعیین موقعیت تولتیپ
  switch (position) {
    case 'top':
      positionClasses = '-top-8 left-1/2 -translate-x-1/2';
      break;
    case 'bottom':
      positionClasses = 'top-full left-1/2 -translate-x-1/2 mt-2';
      break;
    case 'left':
      positionClasses = 'right-full top-1/2 -translate-y-1/2 mr-2';
      break;
    case 'right':
      positionClasses = 'left-full top-1/2 -translate-y-1/2 ml-2';
      break;
    default:
      positionClasses = '-top-8 left-1/2 -translate-x-1/2';
  }

  return (
    <div className="relative flex items-center justify-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className={`absolute z-50 p-2 text-xs text-white bg-gray-800 rounded-md shadow-lg whitespace-nowrap opacity-0 animate-fadeIn ${positionClasses}`}>
          {text}
        </div>
      )}
    </div>
  );
};


// کامپوننت Deposit با دریافت currentTheme به عنوان پراپ
function Deposit({ currentTheme }) { // <--- currentTheme به پراپس اضافه شد
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
      }, 10000); // هر 10 ثانیه یک بار پولینگ

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
        setError(err.response.data.errors.map(e => e.msg || e.message).join(', '));
      } else {
        setError(err.response?.data?.message || t('deposit_error'));
      }
      console.error('Deposit submission error:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAddress = () => {
    if (depositInfo && depositInfo.walletAddress) {
      // استفاده از navigator.clipboard.writeText برای مدرن‌ترین روش کپی
      navigator.clipboard.writeText(depositInfo.walletAddress)
        .then(() => {
          setMessage(t('address_copied'));
          setTimeout(() => setMessage(''), 2000);
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
          // Fallback برای مرورگرهای قدیمی‌تر
          const el = document.createElement('textarea');
          el.value = depositInfo.walletAddress;
          document.body.appendChild(el);
          el.select();
          document.execCommand('copy');
          document.body.removeChild(el);
          setMessage(t('address_copied'));
          setTimeout(() => setMessage(''), 2000);
        });
    }
  };

  return (
    // اعمال کلاس‌های تم به کانتینر اصلی
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 font-inter overflow-hidden transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 p-6 sm:p-7 rounded-2xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-4 text-center">
          {t('deposit_funds')}
        </h2>

        {/* توضیحات در بالای فرم */}
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6 leading-relaxed text-sm">
          {t('deposit_form_description')}
        </p>

        {message && !depositInitiated && (
          <div className="bg-green-50 dark:bg-green-900 border-l-4 border-green-400 dark:border-green-700 text-green-800 dark:text-green-200 p-3 rounded-lg mb-4 animate-fadeIn flex items-center text-sm">
            <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
            <p className="font-medium">{message}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 dark:bg-red-900 border-l-4 border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 p-3 rounded-lg mb-4 animate-fadeIn flex items-center text-sm">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500 dark:text-red-400 mr-2" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {!depositInitiated ? (
          <form onSubmit={handleSubmit} className="space-y-5"> 
            <div>
              <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"> 
                {t('amount')}:
              </label>
              <input
                type="number"
                id="amount"
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 p-2.5 text-sm bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 transition duration-200 ease-in-out placeholder-gray-400 dark:placeholder-gray-500" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="0.01"
                step="0.01"
                placeholder={t('enter_amount_usdt_placeholder')}
              />
            </div>

            <div>
              <label htmlFor="method" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {t('deposit_method')}:
              </label>
              <div className="relative">
                <select
                  id="method"
                  className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 p-2.5 text-sm appearance-none bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 transition duration-200 ease-in-out pr-10"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  <option value="crypto">{t('cryptocurrency')}</option>
                  {/* <option value="manual">{t('manual_deposit')}</option> */}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            {method === 'crypto' && (
              <>
                <div>
                  <label htmlFor="cryptoCurrency" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('currency')}:
                  </label>
                  <div className="relative">
                    <select
                      id="cryptoCurrency"
                      className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 p-2.5 text-sm appearance-none bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 transition duration-200 ease-in-out pr-10"
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
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="network" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                    {t('network')}:
                    {/* اضافه کردن تولتیپ به کنار Label شبکه */}
                    <Tooltip text={t('network_tooltip_text')} position="right">
                      <InformationCircleIcon className="h-4 w-4 ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition duration-200 cursor-help" />
                    </Tooltip>
                  </label>
                  <div className="relative">
                    <select
                      id="network"
                      className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 p-2.5 text-sm appearance-none bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 transition duration-200 ease-in-out pr-10"
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
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-bold py-2.5 px-5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition duration-300 ease-in-out transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-md" 
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" /> {t('processing')}
                </span>
              ) : (
                t('deposit')
              )}
            </button>
          </form>
        ) : (
          <div className="mt-6 p-5 rounded-xl shadow-md border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900 animate-fadeIn text-sm transition-colors duration-300">
            {depositStatus === 'pending' && (
              <div className="text-center">
                <ClockIcon className="h-10 w-10 text-blue-500 dark:text-blue-400 mx-auto mb-3 animate-pulse" />
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1.5">{t('waiting_for_payment')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{t('send_exact_amount_to_address')}</p>

                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 mb-3 transition-colors duration-300">
                  <p className="text-gray-700 dark:text-gray-200 text-base mb-1.5">
                    <span className="font-medium">{t('expected_amount')}:</span>{' '}
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {depositInfo.expectedAmount} {depositInfo.cryptoCurrency.split('-')[0]}
                    </span>
                  </p>
                  <div className="flex items-center justify-between text-gray-700 dark:text-gray-200 break-all text-sm mb-2">
                    <span className="font-medium">{t('deposit_address')}:</span>{' '}
                    <span className="font-bold text-blue-600 dark:text-blue-400 ml-1 break-words">{depositInfo.walletAddress}</span>
                  </div>

                  {depositInfo.qrCodeUri && (
                    <div className="mt-3 flex justify-center p-2 bg-white dark:bg-gray-600 rounded-md shadow-inner transition-colors duration-300">
                      <QRCode
                        value={depositInfo.qrCodeUri}
                        size={160}
                        level="H"
                        bgColor={currentTheme === 'dark' ? '#374151' : '#FFFFFF'} // رنگ پس‌زمینه QR در دارک مود
                        fgColor={currentTheme === 'dark' ? '#FFFFFF' : '#000000'} // رنگ پیش‌زمینه QR در دارک مود
                        className="rounded-lg shadow-inner"
                      />
                    </div>
                  )}
                  <p className="text-gray-700 dark:text-gray-200 text-sm mt-3">
                    <span className="font-medium">{t('network')}:</span>{' '}
                    <span className="font-bold text-blue-600 dark:text-blue-400">{depositInfo.cryptoCurrency.split('-')[1]}</span>
                  </p>
                  {/* اضافه کردن تولتیپ به دکمه کپی آدرس */}
                  <Tooltip text={t('copy_address_tooltip')} position="bottom">
                    <button
                      onClick={handleCopyAddress}
                      className="mt-3 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-800 dark:text-blue-200 font-bold py-1.5 px-3 rounded-lg text-xs transition duration-200 shadow-sm hover:shadow-md flex items-center justify-center mx-auto" 
                    >
                      <ClipboardDocumentListIcon className="h-4 w-4 mr-1.5" /> {t('copy_address')}
                    </button>
                  </Tooltip>
                </div>

                {countdown > 0 && (
                  <p className="text-red-500 dark:text-red-400 text-base font-bold animate-pulse"> 
                    {t('time_remaining')}: {formatTime(countdown)}
                  </p>
                )}
                {countdown === 0 && depositStatus === 'expired' && (
                  <p className="text-red-600 dark:text-red-500 text-base font-bold">{t('payment_expired')}</p> 
                )}
              </div>
            )}

            {depositStatus === 'confirmed' && (
              <div className="text-center text-green-700 dark:text-green-200 font-bold text-lg animate-scaleIn">
                <CheckCircleIcon className="h-14 w-14 text-green-500 dark:text-green-400 mx-auto mb-3" />
                <p>{t('deposit_confirmed_success')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1.5">{t('balance_updated_shortly')}</p>
              </div>
            )}

            {depositStatus === 'failed' && (
              <div className="text-center text-red-700 dark:text-red-200 font-bold text-lg animate-scaleIn">
                <ExclamationCircleIcon className="h-14 w-14 text-red-500 dark:text-red-400 mx-auto mb-3" />
                <p>{t('deposit_failed_message')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1.5">{t('please_try_again')}</p>
              </div>
            )}
            {depositStatus === 'expired' && (
              <div className="text-center text-red-700 dark:text-red-200 font-bold text-lg animate-scaleIn">
                <ClockIcon className="h-14 w-14 text-red-500 dark:text-red-400 mx-auto mb-3" />
                <p>{t('payment_expired')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1.5">{t('please_try_again')}</p>
              </div>
            )}
            {depositStatus === 'cancelled' && (
              <div className="text-center text-red-700 dark:text-red-200 font-bold text-lg animate-scaleIn">
                <XCircleIcon className="h-14 w-14 text-red-500 dark:text-red-400 mx-auto mb-3" />
                <p>{t('deposit_cancelled_message')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1.5">{t('please_try_again')}</p>
              </div>
            )}

            <div className="mt-5 text-center">
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
                className="bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-800 text-white font-bold py-2.5 px-5 rounded-lg transition duration-200 shadow-md hover:shadow-lg text-base focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800" 
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
