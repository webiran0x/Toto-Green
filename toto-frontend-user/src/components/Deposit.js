// toto-frontend-user/src/components/Deposit.js
// کامپوننت برای عملیات واریز وجه

import React, { useState, useEffect, useRef, useCallback } from 'react'; // useCallback اضافه شد
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import QRCode from 'react-qr-code';

// token و API_BASE_URL از پراپس حذف شدند
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
  const [depositInitiated, setDepositInitiated] = useState(false);
  const [depositInfo, setDepositInfo] = useState(null); // شامل walletAddress, expectedAmount, shkeeperInvoiceId
  const [cryptoDepositId, setCryptoDepositId] = useState(null); // ID رکورد CryptoDeposit در دیتابیس شما
  const [depositStatus, setDepositStatus] = useState('pending'); // 'pending', 'confirmed', 'failed', 'expired'
  const [countdown, setCountdown] = useState(0); // ثانیه‌های باقی‌مانده
  const countdownIntervalRef = useRef(null); // برای نگهداری مرجع اینتروال

  // زمان پیش‌فرض برای انقضای پرداخت (مثلاً 15 دقیقه)
  const PAYMENT_EXPIRATION_SECONDS = 15 * 60;

  // تابع پولینگ را داخل useCallback قرار می‌دهیم تا از ایجاد مکرر آن جلوگیری شود
  const pollDepositStatus = useCallback(async (depositId) => {
    try {
      const res = await axios.get(`/users/crypto-deposits/${depositId}`); // مسیر اصلاح شد
      const fetchedDeposit = res.data;

      if (fetchedDeposit && fetchedDeposit.status === 'confirmed') {
        setDepositStatus('confirmed');
        setMessage(t('deposit_confirmed_success'));
        clearInterval(countdownIntervalRef.current); // توقف شمارش معکوس
        return true; // نشان می‌دهد که پولینگ باید متوقف شود
      } else if (fetchedDeposit && fetchedDeposit.status === 'failed' || fetchedDeposit.status === 'expired') { // اضافه شدن 'expired' برای توقف پولینگ
        setDepositStatus('failed');
        setError(t('deposit_failed_message'));
        clearInterval(countdownIntervalRef.current); // توقف شمارش معکوس
        return true; // نشان می‌دهد که پولینگ باید متوقف شود
      }
      return false; // پولینگ ادامه یابد
    } catch (err) {
      console.error('Error polling crypto deposit status:', err.response?.data || err.message);
      // در صورت خطای شبکه یا سرور، پولینگ را می‌توان متوقف کرد یا با تاخیر بیشتری ادامه داد
      // برای سادگی، در اینجا پولینگ را متوقف نمی‌کنیم تا به خطاهای موقت پاسخ دهد.
      return false;
    }
  }, [t]);

  useEffect(() => {
    if (depositInitiated && cryptoDepositId) {
      // پاکسازی اینتروال قبلی در صورت وجود
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }

      // شروع شمارش معکوس
      setCountdown(PAYMENT_EXPIRATION_SECONDS);
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            setDepositStatus('expired'); // یا 'failed' بسته به منطق شما
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // شروع پولینگ برای بررسی وضعیت واریز
      const pollingInterval = setInterval(async () => {
        const stopPolling = await pollDepositStatus(cryptoDepositId);
        if (stopPolling) {
          clearInterval(pollingInterval);
        }
      }, 10000); // هر 10 ثانیه یک بار بررسی کنید

      // پاکسازی اینتروال‌ها هنگام unmount شدن کامپوننت یا تغییر وضعیت
      return () => {
        clearInterval(pollingInterval);
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
        }
      };
    }
    // پاکسازی اینتروال شمارش معکوس در صورتی که depositInitiated به false تغییر کند
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [depositInitiated, cryptoDepositId, PAYMENT_EXPIRATION_SECONDS, pollDepositStatus]); // pollDepositStatus به dependency array اضافه شد

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
      // درخواست Axios: بدون هدر Authorization و با مسیر اصلاح شده
      const res = await axios.post(
        '/users/deposit', // مسیر اصلاح شد: '/api/' از ابتدای مسیر حذف شد
        { amount: parseFloat(amount), method, cryptoCurrency, network },
        // نیازی به هدر Authorization نیست
      );

      if (method === 'crypto') {
        setDepositInitiated(true);
        setDepositInfo(res.data.depositInfo);
        setCryptoDepositId(res.data.cryptoDepositId);
        setDepositStatus('pending'); // وضعیت اولیه پس از شروع واریز
        setMessage(t('crypto_deposit_initiated'));
      } else {
        setMessage(res.data.message);
        setAmount(''); // پاک کردن فرم پس از موفقیت
      }
    } catch (err) {
      setError(err.response?.data?.message || t('deposit_error'));
      console.error('Deposit submission error:', err.response?.data || err.message); // برای اشکال‌زدایی
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto my-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('deposit_funds')}</h2>

      {message && !depositInitiated && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}

      {!depositInitiated ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              {t('amount')}:
            </label>
            <input
              type="number"
              id="amount"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="0.01"
              step="0.01"
            />
          </div>

          <div>
            <label htmlFor="method" className="block text-sm font-medium text-gray-700">
              {t('deposit_method')}:
            </label>
            <select
              id="method"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="crypto">{t('cryptocurrency')}</option>
              {/* <option value="manual">{t('manual_deposit')}</option> */}
            </select>
          </div>

          {method === 'crypto' && (
            <>
              <div>
                <label htmlFor="cryptoCurrency" className="block text-sm font-medium text-gray-700">
                  {t('currency')}:
                </label>
                <select
                  id="cryptoCurrency"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={cryptoCurrency}
                  onChange={(e) => setCryptoCurrency(e.target.value)}
                >
                  <option value="USDT">USDT</option>
                  <option value="BTC">BTC</option>
                </select>
              </div>
              <div>
                <label htmlFor="network" className="block text-sm font-medium text-gray-700">
                  {t('network')}:
                </label>
                <select
                  id="network"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-200 ease-in-out disabled:opacity-50"
            disabled={loading}
          >
            {loading ? t('processing') : t('deposit')}
          </button>
        </form>
      ) : (
        // نمایش اطلاعات واریز رمزارزی و وضعیت
        <div className="mt-6 p-4 border rounded-lg shadow-sm bg-gray-50">
          {depositStatus === 'pending' && (
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-800 mb-2">{t('waiting_for_payment')}</p>
              <p className="text-sm text-gray-600 mb-4">{t('send_exact_amount_to_address')}</p>
              
              <div className="bg-white p-4 rounded-md shadow-inner mb-4">
                <p className="text-gray-700">
                  <span className="font-medium">{t('expected_amount')}:</span>{' '}
                  <span className="font-bold text-blue-600">
                    {depositInfo.expectedAmount} {depositInfo.cryptoCurrency.split('-')[0]}
                  </span>
                </p>
                <p className="text-gray-700 break-all mt-2">
                  <span className="font-medium">{t('deposit_address')}:</span>{' '}
                  <span className="font-bold text-blue-600">{depositInfo.walletAddress}</span>
                </p>


            {/* --- اضافه کردن کد QR اینجا --- */}
            {depositInfo.qrCodeUri && (
              <div className="mt-4 flex justify-center p-2 bg-white rounded-md shadow-sm">
                <QRCode
                  value={depositInfo.qrCodeUri}
                  size={180}
                  level="H"
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
              </div>
            )}
            {/* --- پایان اضافه کردن کد QR --- */}
                <p className="text-gray-700 mt-2">
                  <span className="font-medium">{t('network')}:</span>{' '}
                  <span className="font-bold text-blue-600">{depositInfo.cryptoCurrency.split('-')[1]}</span>
                </p>
                <button
                  onClick={() => navigator.clipboard.writeText(depositInfo.walletAddress)}
                  className="mt-3 bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded-md text-sm transition duration-200"
                >
                  {t('copy_address')}
                </button>
              </div>

              {countdown > 0 && (
                <p className="text-red-500 text-lg font-bold">
                  {t('time_remaining')}: {formatTime(countdown)}
                </p>
              )}
              {countdown === 0 && depositStatus === 'expired' && (
                <p className="text-red-600 text-lg font-bold">{t('payment_expired')}</p>
              )}
            </div>
          )}

          {depositStatus === 'confirmed' && (
            <div className="text-center text-green-700 font-bold text-xl">
              <p>{t('deposit_confirmed_success')}</p>
              <p className="text-sm text-gray-600 mt-2">{t('balance_updated_shortly')}</p>
            </div>
          )}

          {depositStatus === 'failed' && (
            <div className="text-center text-red-700 font-bold text-xl">
              <p>{t('deposit_failed_message')}</p>
              <p className="text-sm text-gray-600 mt-2">{t('please_try_again')}</p>
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
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition duration-200"
            >
              {t('start_new_deposit')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Deposit;