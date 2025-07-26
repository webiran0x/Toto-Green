// toto-frontend-user/src/components/MyTransactions.js
// کامپوننت جدید برای نمایش تمام تراکنش‌های کاربر با UI بهبود یافته، اطلاعات کامل‌تر، فیلتر و صفحه‌بندی

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import {
  ArrowDownCircleIcon, // برای واریز
  ArrowUpCircleIcon, // برای برداشت
  CreditCardIcon, // برای پرداخت فرم
  GiftIcon, // برای جایزه
  ArrowUturnLeftIcon, // برای بازپرداخت
  UsersIcon, // برای کمیسیون معرف
  QuestionMarkCircleIcon, // برای نامشخص
  CheckCircleIcon, // برای وضعیت تکمیل شده
  ClockIcon, // برای وضعیت در انتظار
  XCircleIcon, // برای وضعیت ناموفق/لغو شده
  CubeTransparentIcon, // برای Entity مرتبط
  FunnelIcon, // برای آیکون فیلتر
  ChevronLeftIcon, // برای صفحه‌بندی
  ChevronRightIcon // برای صفحه‌بندی
} from '@heroicons/react/24/outline'; // ایمپورت آیکون‌ها

function MyTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State های مربوط به صفحه‌بندی
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(10); // تعداد تراکنش در هر صفحه
  const [totalTransactions, setTotalTransactions] = useState(0); // کل تراکنش‌ها (از بک‌اند)
  const [totalPages, setTotalPages] = useState(1); // کل صفحات (از بک‌اند)

  // State های مربوط به فیلتر
  const [filterType, setFilterType] = useState(''); // فیلتر بر اساس نوع تراکنش
  const [filterStatus, setFilterStatus] = useState(''); // فیلتر بر اساس وضعیت تراکنش
  // می‌توانید فیلترهای بیشتری مانند filterMethod, filterMinAmount, filterMaxAmount, filterStartDate, filterEndDate را اضافه کنید

  const { t } = useLanguage();

  // تابع fetchMyTransactions را داخل useCallback قرار می‌دهیم
  const fetchMyTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // ساخت URL کوئری با پارامترهای صفحه‌بندی و فیلتر
      const params = {
        page: currentPage,
        limit: transactionsPerPage,
      };
      if (filterType) {
        params.type = filterType;
      }
      if (filterStatus) {
        params.status = filterStatus;
      }
      // افزودن سایر پارامترهای فیلتر به params در صورت نیاز

      const res = await axios.get('/users/my-transactions', { params }); // ارسال پارامترها
      
      setTransactions(res.data.transactions);
      setTotalTransactions(res.data.totalCount);
      setTotalPages(res.data.totalPages);

    } catch (err) {
      setError(err.response?.data?.message || t('error_fetching_data'));
      console.error('Error fetching my transactions:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, [t, currentPage, transactionsPerPage, filterType, filterStatus]); // وابستگی‌ها به‌روزرسانی شدند

  useEffect(() => {
    fetchMyTransactions();
  }, [fetchMyTransactions]); // fetchMyTransactions به dependency array اضافه شد

  // هندلر تغییر صفحه
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // هندلر تغییر فیلتر نوع
  const handleTypeFilterChange = (e) => {
    setFilterType(e.target.value);
    setCurrentPage(1); // با تغییر فیلتر، به صفحه اول برگرد
  };

  // هندلر تغییر فیلتر وضعیت
  const handleStatusFilterChange = (e) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1); // با تغییر فیلتر، به صفحه اول برگرد
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

  // آیکون برای نوع تراکنش
  const getTransactionTypeIcon = (type) => {
    switch (type) {
      case 'deposit':
      case 'crypto_deposit': return <ArrowDownCircleIcon className="h-5 w-5 text-green-500" />;
      case 'withdrawal':
      case 'withdrawal_request': return <ArrowUpCircleIcon className="h-5 w-5 text-red-500" />;
      case 'form_payment': return <CreditCardIcon className="h-5 w-5 text-blue-500" />;
      case 'prize_payout': return <GiftIcon className="h-5 w-5 text-yellow-500" />;
      case 'refund': return <ArrowUturnLeftIcon className="h-5 w-5 text-purple-500" />;
      case 'referral_commission': return <UsersIcon className="h-5 w-5 text-indigo-500" />;
      default: return <QuestionMarkCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // استایل برای وضعیت تراکنش
  const getStatusClasses = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // آیکون برای وضعیت تراکنش
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />;
      case 'pending': return <ClockIcon className="h-4 w-4 text-yellow-500 mr-1" />;
      case 'failed':
      case 'cancelled': return <XCircleIcon className="h-4 w-4 text-red-500 mr-1" />;
      case 'processing': return <ArrowPathIcon className="h-4 w-4 text-blue-500 mr-1 animate-spin" />;
      default: return null;
    }
  };

  if (loading) return <div className="text-center py-8 text-gray-700">{t('loading')}</div>;
  if (error) return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-center">{error}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">{t('my_transactions_title')}</h2>
      
      {/* بخش فیلترها */}
      <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg shadow-inner border border-gray-200">
        <FunnelIcon className="h-6 w-6 text-gray-600" />
        <div className="w-full sm:w-auto">
          <label htmlFor="filterType" className="sr-only">{t('type')}</label>
          <select
            id="filterType"
            value={filterType}
            onChange={handleTypeFilterChange}
            className="block w-full sm:w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-sm"
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
          <select
            id="filterStatus"
            value={filterStatus}
            onChange={handleStatusFilterChange}
            className="block w-full sm:w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-sm"
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
        <p className="text-gray-600 text-center py-4">{t('no_transactions_found')}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"> {/* نمایش در قالب کارت‌ها */}
            {transactions.map((transaction) => (
              <div key={transaction._id} className="bg-gray-50 p-5 rounded-xl shadow-md border border-gray-200 flex flex-col transform transition-transform duration-300 hover:scale-[1.02] animate-fadeIn">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-500 text-xs">{new Date(transaction.createdAt).toLocaleString('fa-IR')}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center ${getStatusClasses(transaction.status)}`}>
                    {getStatusIcon(transaction.status)} {t(transaction.status)}
                  </span>
                </div>

                <div className="flex items-center mb-3">
                  <div className="mr-3">{getTransactionTypeIcon(transaction.type)}</div>
                  <p className="text-lg font-bold text-gray-800">
                    {getTransactionTypeTranslation(transaction.type)}
                  </p>
                </div>

                <p className={`text-xl font-extrabold mb-3 ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.amount.toLocaleString('fa-IR')} {t('usdt')}
                </p>

                <p className="text-gray-700 text-sm mb-2">
                  <span className="font-medium">{t('description')}:</span> {transaction.description || t('not_available')}
                </p>

                {transaction.method && (
                  <p className="text-gray-600 text-xs mb-1">
                    <span className="font-medium">{t('method')}:</span> {t(transaction.method)}
                  </p>
                )}

                {transaction.relatedEntity && (
                  <p className="text-gray-600 text-xs mb-1 flex items-center">
                    <CubeTransparentIcon className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="font-medium">{t('related_to')}:</span> {t(transaction.relatedEntityType || 'unknown_entity')} ID: {transaction.relatedEntity}
                  </p>
                )}

                {transaction.cryptoDetails && (
                  <div className="mt-2 text-xs text-gray-500 border-t border-gray-200 pt-2">
                    <p><span className="font-medium">{t('currency')}:</span> {transaction.cryptoDetails.currency || 'N/A'}</p>
                    <p><span className="font-medium">{t('network')}:</span> {transaction.cryptoDetails.network || 'N/A'}</p>
                    {transaction.cryptoDetails.txHash && <p className="break-all"><span className="font-medium">{t('tx_hash')}:</span> {transaction.cryptoDetails.txHash}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* بخش صفحه‌بندی */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-6 space-x-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              {[...Array(totalPages).keys()].map(number => (
                <button
                  key={number + 1}
                  onClick={() => paginate(number + 1)}
                  className={`px-4 py-2 rounded-md font-semibold ${
                    currentPage === number + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } transition duration-150`}
                >
                  {number + 1}
                </button>
              ))}
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default MyTransactions;
