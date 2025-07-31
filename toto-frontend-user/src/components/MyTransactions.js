// toto-frontend-user/src/components/MyTransactions.js
// کامپوننت جدید برای نمایش تمام تراکنش‌های کاربر با UI بهبود یافته، اطلاعات کامل‌تر، فیلتر و صفحه‌بندی

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import {
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  CreditCardIcon,
  GiftIcon,
  ArrowUturnLeftIcon,
  UsersIcon,
  QuestionMarkCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  CubeTransparentIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

function MyTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(10);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const { t } = useLanguage();

  const fetchMyTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page: currentPage,
        limit: transactionsPerPage,
      };
      if (filterType) params.type = filterType;
      if (filterStatus) params.status = filterStatus;

      const res = await axios.get('/users/my-transactions', { params });

      setTransactions(prev => currentPage === 1 ? res.data.transactions : [...prev, ...res.data.transactions]);
      setTotalTransactions(res.data.totalCount);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      setError(err.response?.data?.message || t('error_fetching_data'));
      console.error('Error fetching my transactions:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, [t, currentPage, transactionsPerPage, filterType, filterStatus]);


  useEffect(() => {
    fetchMyTransactions();
  }, [fetchMyTransactions]);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleTypeFilterChange = (e) => {
    setFilterType(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1);
  };

  // ترجمه نوع تراکنش
  const getTransactionTypeTranslation = (type) => {
    switch (type) {
      case 'deposit': return t('transaction_type_deposit');
      case 'form_payment': return t('transaction_type_form_payment');
      case 'prize_payout': return t('transaction_type_prize_payout');
      case 'refund': return t('transaction_type_refund');
      case 'referral_commission': return t('transaction_type_referral_commission');
      case 'withdrawal': return t('transaction_type_withdrawal');
      case 'withdrawal_request': return t('transaction_type_withdrawal_request');
      case 'admin_balance_adjustment': return t('transaction_type_admin_adjustment');
      case 'crypto_deposit': return t('transaction_type_crypto_deposit');
      default: return t('unknown');
    }
  };

  // آیکون برای نوع تراکنش - UPDATED
  const getTransactionTypeIcon = (type) => {
    switch (type) {
      // NEW: استفاده از رنگ‌های پالت جدید برای آیکون‌ها
      case 'deposit':
      case 'crypto_deposit': return <ArrowDownCircleIcon className="h-5 w-5 text-clr-primary-a0" />; // Previously green
      case 'withdrawal':
      case 'withdrawal_request': return <ArrowUpCircleIcon className="h-5 w-5 text-red-500 dark:text-red-400" />; // Keep red for withdrawals
      case 'form_payment': return <CreditCardIcon className="h-5 w-5 text-clr-surface-a40" />; // Previously blue, now neutral surface
      case 'prize_payout': return <GiftIcon className="h-5 w-5 text-clr-primary-a0" />; // Previously yellow, now primary
      case 'refund': return <ArrowUturnLeftIcon className="h-5 w-5 text-clr-surface-tonal-a40" />; // Previously purple, now tonal surface
      case 'referral_commission': return <UsersIcon className="h-5 w-5 text-clr-primary-a0" />; // Previously indigo, now primary
      default: return <QuestionMarkCircleIcon className="h-5 w-5 text-clr-surface-a40 dark:text-clr-surface-a50" />; // Previously gray
    }
  };

  // استایل برای وضعیت تراکنش - UPDATED
  const getStatusClasses = (status) => {
    switch (status) {
      // NEW: استفاده از رنگ‌های پالت جدید برای وضعیت‌ها
      case 'completed': return 'bg-clr-surface-tonal-a0 text-clr-dark-a0 dark:bg-clr-surface-tonal-a10 dark:text-clr-light-a0'; // Previously green
      case 'pending': return 'bg-clr-surface-tonal-a20 text-clr-dark-a0 dark:bg-clr-surface-tonal-a30 dark:text-clr-light-a0'; // Previously yellow
      case 'failed':
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'; // Keep red
      case 'processing': return 'bg-clr-primary-a50 text-clr-dark-a0 dark:bg-clr-primary-a10 dark:text-clr-light-a0'; // Previously blue, now primary
      default: return 'bg-clr-surface-a10 text-clr-dark-a0 dark:bg-clr-surface-a20 dark:text-clr-light-a0';
    }
  };

  // آیکون برای وضعیت تراکنش - UPDATED
  const getStatusIcon = (status) => {
    switch (status) {
      // NEW: استفاده از رنگ‌های پالت جدید برای آیکون‌ها
      case 'completed': return <CheckCircleIcon className="h-4 w-4 text-clr-primary-a0 mr-1" />; // Previously green
      case 'pending': return <ClockIcon className="h-4 w-4 text-clr-surface-tonal-a40 mr-1" />; // Previously yellow
      case 'failed':
      case 'cancelled': return <XCircleIcon className="h-4 w-4 text-red-500 dark:text-red-400 mr-1" />; // Keep red
      case 'processing': return <ArrowPathIcon className="h-4 w-4 text-clr-primary-a0 mr-1 animate-spin" />; // Previously blue, now primary
      default: return null;
    }
  };

  // NEW: کلاس‌های مربوط به لودینگ و خطا
  if (loading) return <div className="text-center py-8 text-clr-dark-a0 dark:text-clr-light-a0">{t('loading')}</div>; // OLD: text-gray-700 dark:text-gray-300
  if (error) return <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-4 text-center">{error}</div>;

return (
  // OLD: bg-white dark:bg-gray-800
  <div className="bg-clr-surface-a0 p-4 sm:p-6 rounded-lg shadow-md transition-colors duration-300 w-full max-w-full overflow-x-hidden"> 
    {/* OLD: text-gray-800 dark:text-white */}
    <h2 className="text-3xl font-extrabold text-clr-dark-a0 dark:text-clr-light-a0 mb-6 text-center">{t('my_transactions_title')}</h2> 

    {/* بخش فیلترها */}
    {/* OLD: bg-gray-50 dark:bg-gray-700 rounded-lg shadow-inner border border-gray-200 dark:border-gray-600 */}
    <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mb-6 p-4 bg-clr-surface-a10 rounded-lg shadow-inner border border-clr-surface-a20 transition-colors duration-300 w-full overflow-x-auto"> 
      {/* OLD: text-gray-600 dark:text-gray-400 */}
      <FunnelIcon className="h-6 w-6 text-clr-surface-a40 dark:text-clr-surface-a50 flex-shrink-0" /> 
      
      <div className="w-full sm:w-auto">
        <label htmlFor="filterType" className="sr-only">{t('type')}</label>
        {/* OLD: border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 p-2 text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 */}
        <select
          id="filterType"
          value={filterType}
          onChange={handleTypeFilterChange}
          className="block w-full sm:w-48 rounded-md border-clr-surface-a30 shadow-sm focus:border-clr-primary-a0 focus:ring-clr-primary-a0 p-2 text-sm bg-clr-surface-a10 text-clr-dark-a0 dark:text-clr-light-a0 transition-colors duration-300" 
        >
          <option value="">{t('all_types')}</option>
          <option value="deposit">{t('transaction_type_deposit')}</option>
          <option value="crypto_deposit">{t('transaction_type_crypto_deposit')}</option>
          <option value="withdrawal">{t('transaction_type_withdrawal')}</option>
          <option value="withdrawal_request">{t('transaction_type_withdrawal_request')}</option>
          <option value="form_payment">{t('transaction_type_form_payment')}</option>
          <option value="prize_payout">{t('transaction_type_prize_payout')}</option>
          <option value="refund">{t('transaction_type_refund')}</option>
          <option value="referral_commission">{t('transaction_type_referral_commission')}</option>
          <option value="admin_balance_adjustment">{t('transaction_type_admin_adjustment')}</option>
        </select>
      </div>

      <div className="w-full sm:w-auto">
        <label htmlFor="filterStatus" className="sr-only">{t('status')}</label>
        {/* OLD: border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 p-2 text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 */}
        <select
          id="filterStatus"
          value={filterStatus}
          onChange={handleStatusFilterChange}
          className="block w-full sm:w-48 rounded-md border-clr-surface-a30 shadow-sm focus:border-clr-primary-a0 focus:ring-clr-primary-a0 p-2 text-sm bg-clr-surface-a10 text-clr-dark-a0 dark:text-clr-light-a0 transition-colors duration-300" 
        >
          <option value="">{t('all_statuses')}</option>
          <option value="pending">{t('status_pending')}</option>
          <option value="completed">{t('status_completed')}</option>
          <option value="failed">{t('status_failed')}</option>
          <option value="cancelled">{t('status_cancelled')}</option>
          <option value="processing">{t('status_processing')}</option>
        </select>
      </div>
    </div>

    {transactions.length === 0 && !loading ? (
      // OLD: text-gray-600 dark:text-gray-400
      <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-center py-4">{t('no_transactions_found')}</p> 
    ) : (
      <>
        {/* کارت‌ها */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full max-w-full">
          {transactions.map((transaction) => (
            // OLD: bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600
            <div key={transaction._id} className="bg-clr-surface-a10 p-5 rounded-xl shadow-md border border-clr-surface-a20 flex flex-col transform transition-transform duration-300 hover:scale-[1.02] animate-fadeIn transition-colors duration-300"> 
              
              <div className="flex items-center justify-between mb-3">
                {/* OLD: text-gray-500 dark:text-gray-400 */}
                <span className="text-clr-surface-a40 dark:text-clr-surface-a50 text-xs">{new Date(transaction.createdAt).toLocaleString('fa-IR')}</span> 
                <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center ${getStatusClasses(transaction.status)}`}>
                  {getStatusIcon(transaction.status)} {t(transaction.status)}
                </span>
              </div>

              <div className="flex items-center mb-3">
                <div className="mr-3">{getTransactionTypeIcon(transaction.type)}</div>
                {/* OLD: text-gray-800 dark:text-gray-100 */}
                <p className="text-lg font-bold text-clr-dark-a0 dark:text-clr-light-a0"> 
                  {getTransactionTypeTranslation(transaction.type)}
                </p>
              </div>

              {/* OLD: text-green-600 dark:text-green-400 : text-red-600 dark:text-red-400 */}
              <p className={`text-xl font-extrabold mb-3 ${transaction.amount > 0 ? 'text-clr-primary-a0' : 'text-red-600 dark:text-red-400'}`}> {/* NEW: Keep red for negative amounts */}
                {transaction.amount.toLocaleString('fa-IR')} {t('usdt')}
              </p>

              {/* OLD: text-gray-700 dark:text-gray-300 */}
              <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-sm mb-2 break-words text-xs"> 
                <span className="text-xs">{t('description')}:</span> {transaction.description || t('not_available')}
              </p>

              {transaction.method && (
                <p className="text-clr-surface-a40 dark:text-clr-surface-a50 text-xs mb-1 break-words"> 
                  <span className="text-xs">{t('method')}:</span> {t(transaction.method)}
                </p>
              )}

              {transaction.relatedEntity && (
                <p className="text-clr-surface-a40 dark:text-clr-surface-a50 text-xs mb-1 flex items-center break-words"> 
                  <CubeTransparentIcon className="h-4 w-4 text-clr-surface-a40 dark:text-clr-surface-a50 mr-1" /> 
                  <span className="font-medium">{t('related_to')}:</span> {t(transaction.relatedEntityType || 'unknown_entity')} ID: {transaction.relatedEntity}
                </p>
              )}

              {transaction.cryptoDetails && (
                <div className="mt-2 text-xs text-clr-surface-a40 dark:text-clr-surface-a50 border-t border-clr-surface-a20 pt-2 transition-colors duration-300"> 
                  <p><span className="font-medium">{t('currency')}:</span> {transaction.cryptoDetails.currency || 'N/A'}</p>
                  <p><span className="font-medium">{t('network')}:</span> {transaction.cryptoDetails.network || 'N/A'}</p>
                  {transaction.cryptoDetails.txHash && <p className="break-all"><span className="font-medium">{t('tx_hash')}:</span> {transaction.cryptoDetails.txHash}</p>}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* صفحه‌بندی (Load More) */}
       {currentPage < totalPages && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="px-6 py-3 rounded-lg bg-clr-primary-a0 text-clr-light-a0 hover:bg-clr-primary-a10 transition-colors duration-300 font-semibold" 
            >
              {t('load_more')}
            </button>
          </div>
        )}

      </>
    )}
  </div>
);

}

export default MyTransactions;