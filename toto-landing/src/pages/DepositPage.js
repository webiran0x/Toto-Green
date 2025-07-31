// toto-landing/src/pages/DepositPage.js
// کامپوننت برای عملیات واریز وجه با UI بهبود یافته و مناسب پروداکشن

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import QRCode from 'react-qr-code';
import {
  CheckCircleIcon,
  AlertCircle,
  ClockIcon,
  RefreshCcwIcon,
  XCircleIcon,
  ClipboardList,
  PlusCircle,
  Info,
  Banknote
} from 'lucide-react';

// کامپوننت Tooltip
const Tooltip = ({ children, text, position = 'top' }) => {
  const [show, setShow] = useState(false);
  let positionClasses = '';
  switch (position) {
    case 'top': positionClasses = '-top-8 left-1/2 -translate-x-1/2'; break;
    case 'bottom': positionClasses = 'top-full left-1/2 -translate-x-1/2 mt-2'; break;
    case 'left': positionClasses = 'right-full top-1/2 -translate-y-1/2 mr-2'; break;
    case 'right': positionClasses = 'left-full top-1/2 -translate-y-1/2 ml-2'; break;
    default: positionClasses = '-top-8 left-1/2 -translate-x-1/2';
  }
  return (
    <div className="relative flex items-center justify-center" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className={`absolute z-50 p-2 text-xs text-clr-light-a0 bg-clr-dark-a0 rounded-md shadow-lg whitespace-nowrap opacity-0 animate-fadeIn ${positionClasses}`}>
          {text}
        </div>
      )}
    </div>
  );
};


function DepositPage({ currentTheme, toggleTheme, isAuthenticated,userBalance }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('crypto');
  const [cryptoCurrency, setCryptoCurrency] = useState('USDT');
  const [network, setNetwork] = useState('TRC20');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const [depositInitiated, setDepositInitiated] = useState(false);
  const [depositInfo, setDepositInfo] = useState(null);
  const [cryptoDepositId, setCryptoDepositId] = useState(null);
  const [depositStatus, setDepositStatus] = useState('pending');
  const [countdown, setCountdown] = useState(0);
  const countdownIntervalRef = useRef(null);

  const PAYMENT_EXPIRATION_SECONDS = 15 * 60;

  const pollDepositStatus = useCallback(async (depositId) => {
    try {
      const res = await axios.get(`/users/crypto-deposits/${depositId}`);
      const fetchedDeposit = res.data;

      if (fetchedDeposit && fetchedDeposit.status === 'confirmed') {
        setDepositStatus('confirmed');
        setMessage(t('deposit_confirmed_success'));
        clearInterval(countdownIntervalRef.current);
        return true;
      } else if (fetchedDeposit && ['failed', 'expired', 'cancelled'].includes(fetchedDeposit.status)) {
        setDepositStatus(fetchedDeposit.status);
        setError(t('deposit_failed_message'));
        clearInterval(countdownIntervalRef.current);
        return true;
      }
      return false;
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
      navigator.clipboard.writeText(depositInfo.walletAddress)
        .then(() => {
          setMessage(t('address_copied'));
          setTimeout(() => setMessage(''), 2000);
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
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
    <div className="bg-clr-surface-a0 min-h-screen flex flex-col font-iranyekan">
      <Header currentTheme={currentTheme} toggleTheme={toggleTheme} isAuthenticated={isAuthenticated} />
      <main className="flex-grow container mx-auto p-4 lg:p-8">
        <div className="min-h-screen bg-clr-surface-a10 dark:bg-clr-surface-a0 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 overflow-hidden transition-colors duration-300">
          <div className="bg-clr-surface-a0 p-6 sm:p-7 rounded-2xl shadow-xl w-full max-w-md border border-clr-surface-a20 transition-colors duration-300">
            <h2 className="text-3xl font-extrabold text-clr-dark-a0 dark:text-clr-light-a0 mb-4 text-center">
              {t('deposit_funds')}
            </h2>
            <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-center mb-6 leading-relaxed text-sm">
              {t('deposit_form_description')}
            </p>
            {message && !depositInitiated && (
              <div className="bg-green-100 dark:bg-green-900 border-l-4 border-green-400 dark:border-green-700 text-green-800 dark:text-green-200 p-3 rounded-lg mb-4 animate-fadeIn flex items-center text-sm">
                <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 rtl:ml-2 rtl:mr-0" />
                <p className="font-medium">{message}</p>
              </div>
            )}
            {error && (
              <div className="bg-red-100 dark:bg-red-900 border-l-4 border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 p-3 rounded-lg mb-4 animate-fadeIn flex items-center text-sm">
                <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-2 rtl:ml-2 rtl:mr-0" />
                <p className="font-medium">{error}</p>
              </div>
            )}
            {!depositInitiated ? (
              <form onSubmit={handleSubmit} className="space-y-5"> 
                <div>
                  <label htmlFor="amount" className="block text-sm font-semibold text-clr-dark-a0 dark:text-clr-light-a0 mb-1"> 
                    {t('amount')}:
                  </label>
                  <input
                    type="number"
                    id="amount"
                    className="mt-1 block w-full rounded-lg border-clr-surface-a30 shadow-sm focus:border-clr-primary-a0 focus:ring-clr-primary-a0 p-2.5 text-sm bg-clr-surface-a10 text-clr-dark-a0 dark:text-clr-light-a0 transition duration-200 ease-in-out placeholder-clr-surface-a40 dark:placeholder-clr-surface-a50" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="0.01"
                    step="0.01"
                    placeholder={t('enter_amount_usdt_placeholder')}
                  />
                </div>
                <div>
                  <label htmlFor="method" className="block text-sm font-semibold text-clr-dark-a0 dark:text-clr-light-a0 mb-1">
                    {t('deposit_method')}:
                  </label>
                  <div className="relative">
                    <select
                      id="method"
                      className="block w-full rounded-lg border-clr-surface-a30 shadow-sm focus:border-clr-primary-a0 focus:ring-clr-primary-a0 p-2.5 text-sm appearance-none bg-clr-surface-a10 text-clr-dark-a0 dark:text-clr-light-a0 transition duration-200 ease-in-out pr-10 rtl:pr-auto rtl:pl-10"
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                    >
                      <option value="crypto">{t('cryptocurrency')}</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 rtl:left-0 rtl:right-auto flex items-center px-2 text-clr-dark-a0 dark:text-clr-light-a0">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>
                {method === 'crypto' && (
                  <>
                    <div>
                      <label htmlFor="cryptoCurrency" className="block text-sm font-semibold text-clr-dark-a0 dark:text-clr-light-a0 mb-1">
                        {t('currency')}:
                      </label>
                      <div className="relative">
                        <select
                          id="cryptoCurrency"
                          className="block w-full rounded-lg border-clr-surface-a30 shadow-sm focus:border-clr-primary-a0 focus:ring-clr-primary-a0 p-2.5 text-sm appearance-none bg-clr-surface-a10 text-clr-dark-a0 dark:text-clr-light-a0 transition duration-200 ease-in-out pr-10 rtl:pr-auto rtl:pl-10"
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
                        <div className="pointer-events-none absolute inset-y-0 right-0 rtl:left-0 rtl:right-auto flex items-center px-2 text-clr-dark-a0 dark:text-clr-light-a0">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="network" className="block text-sm font-semibold text-clr-dark-a0 dark:text-clr-light-a0 mb-1 flex items-center">
                        {t('network')}:
                        <Tooltip text={t('network_tooltip_text')} position="right">
                          <Info className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 text-clr-surface-a40 dark:text-clr-surface-a50 hover:text-clr-dark-a0 dark:hover:text-clr-light-a0 transition duration-200 cursor-help" />
                        </Tooltip>
                      </label>
                      <div className="relative">
                        <select
                          id="network"
                          className="block w-full rounded-lg border-clr-surface-a30 shadow-sm focus:border-clr-primary-a0 focus:ring-clr-primary-a0 p-2.5 text-sm appearance-none bg-clr-surface-a10 text-clr-dark-a0 dark:text-clr-light-a0 transition duration-200 ease-in-out pr-10 rtl:pr-auto rtl:pl-10"
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
                        <div className="pointer-events-none absolute inset-y-0 right-0 rtl:left-0 rtl:right-auto flex items-center px-2 text-clr-dark-a0 dark:text-clr-light-a0">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                <button
                  type="submit"
                  className="w-full bg-clr-primary-a0 hover:bg-clr-primary-a10 text-clr-light-a0 font-bold py-2.5 px-5 rounded-lg focus:outline-none focus:ring-2 focus:ring-clr-primary-a0 focus:ring-offset-2 dark:focus:ring-offset-clr-surface-a10 transition duration-300 ease-in-out transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-md" 
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <RefreshCcwIcon className="animate-spin h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" /> {t('processing')}
                    </span>
                  ) : (
                    t('deposit')
                  )}
                </button>
              </form>
            ) : (
              <div className="mt-6 p-5 rounded-xl shadow-md border border-clr-primary-a20 bg-clr-surface-tonal-a0 animate-fadeIn text-sm transition-colors duration-300">
                {depositStatus === 'pending' && (
                  <div className="text-center">
                    <ClockIcon className="h-10 w-10 text-clr-primary-a0 mx-auto mb-3 animate-pulse" />
                    <p className="text-lg font-semibold text-clr-dark-a0 dark:text-clr-light-a0 mb-1.5">{t('waiting_for_payment')}</p>
                    <p className="text-sm text-clr-dark-a0 dark:text-clr-light-a0 mb-3">{t('send_exact_amount_to_address')}</p>
                    <div className="bg-clr-surface-a0 p-4 rounded-lg shadow-sm border border-clr-surface-a20 mb-3 transition-colors duration-300">
                      <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-base mb-1.5 text-right rtl:text-left">
                        <span className="font-medium">{t('expected_amount')}:</span>{' '}
                        <span className="font-bold text-clr-primary-a0">
                          {depositInfo.expectedAmount} {depositInfo.cryptoCurrency.split('-')[0]}
                        </span>
                      </p>
                      <div className="flex items-center justify-between text-clr-dark-a0 dark:text-clr-light-a0 break-all text-sm mb-2">
                        <span className="font-medium text-right rtl:text-left">{t('deposit_address')}:</span>{' '}
                        <span className="font-bold text-clr-primary-a0 ml-1 rtl:mr-1 rtl:ml-0 break-words">{depositInfo.walletAddress}</span>
                      </div>
                      {depositInfo.qrCodeUri && (
                        <div className="mt-3 flex justify-center p-2 bg-clr-surface-a0 dark:bg-clr-surface-a20 rounded-md shadow-inner transition-colors duration-300">
                          <QRCode
                            value={depositInfo.qrCodeUri}
                            size={160}
                            level="H"
                            bgColor={currentTheme === 'dark' ? 'var(--clr-surface-a30)' : 'var(--clr-light-a0)'}
                            fgColor={currentTheme === 'dark' ? 'var(--clr-light-a0)' : 'var(--clr-dark-a0)'}
                            className="rounded-lg shadow-inner"
                          />
                        </div>
                      )}
                      <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-sm mt-3 text-right rtl:text-left">
                        <span className="font-medium">{t('network')}:</span>{' '}
                        <span className="font-bold text-clr-primary-a0">{depositInfo.cryptoCurrency.split('-')[1]}</span>
                      </p>
                      <Tooltip text={t('copy_address_tooltip')} position="bottom">
                        <button
                          onClick={handleCopyAddress}
                          className="mt-3 bg-clr-primary-a50 hover:bg-clr-primary-a40 dark:bg-clr-primary-a10 dark:hover:bg-clr-primary-a0 text-clr-dark-a0 dark:text-clr-light-a0 font-bold py-1.5 px-3 rounded-lg text-xs transition duration-200 shadow-sm hover:shadow-md flex items-center justify-center mx-auto"
                        >
                          <ClipboardList className="h-4 w-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" /> {t('copy_address')}
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
                    <p className="text-sm text-clr-dark-a0 dark:text-clr-light-a0 mt-1.5">{t('balance_updated_shortly')}</p>
                  </div>
                )}
                {depositStatus === 'failed' && (
                  <div className="text-center text-red-700 dark:text-red-200 font-bold text-lg animate-scaleIn">
                    <AlertCircle className="h-14 w-14 text-red-500 dark:text-red-400 mx-auto mb-3" />
                    <p>{t('deposit_failed_message')}</p>
                    <p className="text-sm text-clr-dark-a0 dark:text-clr-light-a0 mt-1.5">{t('please_try_again')}</p>
                  </div>
                )}
                {depositStatus === 'expired' && (
                  <div className="text-center text-red-700 dark:text-red-200 font-bold text-lg animate-scaleIn">
                    <ClockIcon className="h-14 w-14 text-red-500 dark:text-red-400 mx-auto mb-3" />
                    <p>{t('payment_expired')}</p>
                    <p className="text-sm text-clr-dark-a0 dark:text-clr-light-a0 mt-1.5">{t('please_try_again')}</p>
                  </div>
                )}
                {depositStatus === 'cancelled' && (
                  <div className="text-center text-red-700 dark:text-red-200 font-bold text-lg animate-scaleIn">
                    <XCircleIcon className="h-14 w-14 text-red-500 dark:text-red-400 mx-auto mb-3" />
                    <p>{t('deposit_cancelled_message')}</p>
                    <p className="text-sm text-clr-dark-a0 dark:text-clr-light-a0 mt-1.5">{t('please_try_again')}</p>
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
                    className="bg-clr-surface-a30 hover:bg-clr-surface-a40 text-clr-light-a0 font-bold py-2.5 px-5 rounded-lg transition duration-200 shadow-md hover:shadow-lg text-base focus:outline-none focus:ring-2 focus:ring-clr-surface-a40 focus:ring-offset-2 dark:focus:ring-offset-clr-surface-a10"
                  >
                    {t('start_new_deposit')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default DepositPage;
