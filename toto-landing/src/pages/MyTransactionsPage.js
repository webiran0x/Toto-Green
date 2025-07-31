import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  CreditCardIcon,
  GiftIcon,
  ArrowLeft,
  UsersIcon,
  HelpCircle,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  Boxes,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RotateCcw,
  ReceiptText
} from 'lucide-react'; // آیکون‌های lucide-react

function MyTransactionsPage({ currentTheme, toggleTheme, isAuthenticated }) {
  const { t } = useLanguage();
  
  // State های مربوط به داده‌ها و وضعیت صفحه
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State های مربوط به صفحه‌بندی
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // State های مربوط به فیلتر
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // تابع واکشی تراکنش‌ها، داخل useCallback قرار داده شده تا از رندرهای اضافی جلوگیری شود
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
  
      // درخواست به بک‌اند برای دریافت تراکنش‌های کاربر
      const res = await axios.get('/users/my-transactions', { params });
  
      setTransactions(res.data.transactions);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      setError(err.response?.data?.message || t('error_fetching_data'));
      console.error('Error fetching my transactions:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, [t, currentPage, transactionsPerPage, filterType, filterStatus]);
  
  // اجرای واکشی داده‌ها هنگام بارگذاری اولیه و تغییر فیلتر یا صفحه
  useEffect(() => {
    // از isAuthenticated برای جلوگیری از فراخوانی API اگر کاربر لاگین نیست استفاده کنید
    if (isAuthenticated) {
      fetchMyTransactions();
    } else {
      setLoading(false);
      setTransactions([]);
      // می‌توانید یک پیام برای لاگین کردن کاربر نمایش دهید
    }
  }, [fetchMyTransactions, isAuthenticated]);

  // هندلر تغییر صفحه
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // هندلر تغییر فیلتر نوع
  const handleTypeFilterChange = (e) => {
    setFilterType(e.target.value);
    setCurrentPage(1);
  };

  // هندلر تغییر فیلتر وضعیت
  const handleStatusFilterChange = (e) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1);
  };

  // تابع برای ترجمه نوع تراکنش
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

  // تابع برای دریافت آیکون بر اساس نوع تراکنش
  const getTransactionTypeIcon = (type) => {
    switch (type) {
      case 'deposit':
      case 'crypto_deposit': return <ArrowDownCircleIcon className="h-5 w-5 text-clr-primary-a0" />;
      case 'withdrawal':
      case 'withdrawal_request': return <ArrowUpCircleIcon className="h-5 w-5 text-red-500 dark:text-red-400" />;
      case 'form_payment': return <CreditCardIcon className="h-5 w-5 text-clr-surface-a40" />;
      case 'prize_payout': return <GiftIcon className="h-5 w-5 text-clr-primary-a0" />;
      case 'refund': return <ArrowLeft className="h-5 w-5 text-clr-surface-tonal-a40" />;
      case 'referral_commission': return <UsersIcon className="h-5 w-5 text-clr-primary-a0" />;
      default: return <HelpCircle className="h-5 w-5 text-clr-surface-a40 dark:text-clr-surface-a50" />;
    }
  };

  // تابع برای دریافت کلاس‌های استایل بر اساس وضعیت تراکنش
  const getStatusClasses = (status) => {
    switch (status) {
      case 'completed': return 'bg-clr-surface-tonal-a0 text-clr-dark-a0 dark:bg-clr-surface-tonal-a10 dark:text-clr-light-a0';
      case 'pending': return 'bg-clr-surface-tonal-a20 text-clr-dark-a0 dark:bg-clr-surface-tonal-a30 dark:text-clr-light-a0';
      case 'failed':
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'processing': return 'bg-clr-primary-a50 text-clr-dark-a0 dark:bg-clr-primary-a10 dark:text-clr-light-a0';
      default: return 'bg-clr-surface-a10 text-clr-dark-a0 dark:bg-clr-surface-a20 dark:text-clr-light-a0';
    }
  };

  // تابع برای دریافت آیکون بر اساس وضعیت تراکنش
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="h-4 w-4 text-clr-primary-a0 mr-1 rtl:ml-1 rtl:mr-0" />;
      case 'pending': return <ClockIcon className="h-4 w-4 text-clr-surface-tonal-a40 mr-1 rtl:ml-1 rtl:mr-0" />;
      case 'failed':
      case 'cancelled': return <XCircleIcon className="h-4 w-4 text-red-500 dark:text-red-400 mr-1 rtl:ml-1 rtl:mr-0" />;
      case 'processing': return <RotateCcw className="h-4 w-4 text-clr-primary-a0 mr-1 rtl:ml-1 rtl:mr-0 animate-spin" />;
      default: return null;
    }
  };

  // JSX اصلی کامپوننت
  return (
    <div className="bg-clr-surface-a0 min-h-screen flex flex-col font-iranyekan">
      <Header currentTheme={currentTheme} toggleTheme={toggleTheme} isAuthenticated={isAuthenticated} />
      <main className="flex-grow container mx-auto p-4 lg:p-8">
        <div className="bg-clr-surface-a0 p-6 rounded-lg shadow-xl border border-clr-surface-a20 overflow-hidden w-full max-w-full">
          <h1 className="text-3xl font-bold text-clr-dark-a0 dark:text-clr-light-a0 mb-6 text-center">{t('show_transactions')}</h1>

          {/* بخش فیلترها */}
          <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mb-6 p-4 bg-clr-surface-a10 rounded-lg shadow-inner border border-clr-surface-a20 transition-colors duration-300 w-full overflow-x-auto">
            <FunnelIcon className="h-6 w-6 text-clr-surface-a40 dark:text-clr-surface-a50 flex-shrink-0" />
            
            <div className="w-full sm:w-auto">
              <label htmlFor="filterType" className="sr-only">{t('type')}</label>
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

          {loading && <div className="text-center py-8 text-clr-dark-a0 dark:text-clr-light-a0">{t('loading')}</div>}
          {error && !loading && <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-4 text-center">{error}</div>}
          
          {!loading && !error && transactions.length === 0 ? (
            <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-center py-4">{t('no_transactions_found')}</p>
          ) : (
            !loading && !error && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full max-w-full">
                  {transactions.map((transaction) => (
                    <div key={transaction._id} className="bg-clr-surface-a10 p-5 rounded-xl shadow-md border border-clr-surface-a20 flex flex-col transform transition-transform duration-300 hover:scale-[1.02] animate-fadeIn transition-colors duration-300">
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-clr-surface-a40 dark:text-clr-surface-a50 text-xs">{new Date(transaction.createdAt).toLocaleString('fa-IR')}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center ${getStatusClasses(transaction.status)}`}>
                          {getStatusIcon(transaction.status)} {t(transaction.status)}
                        </span>
                      </div>

                      <div className="flex items-center mb-3">
                        <div className="mr-3 rtl:mr-0 rtl:ml-3">{getTransactionTypeIcon(transaction.type)}</div>
                        <p className="text-lg font-bold text-clr-dark-a0 dark:text-clr-light-a0">
                          {getTransactionTypeTranslation(transaction.type)}
                        </p>
                      </div>

                      <p className={`text-xl font-extrabold mb-3 ${transaction.amount > 0 ? 'text-clr-primary-a0' : 'text-red-600 dark:text-red-400'}`}>
                        {transaction.amount.toLocaleString('fa-IR')} {t('usdt')}
                      </p>

                      <p className="text-clr-dark-a0 dark:text-clr-light-a0 text-sm mb-2 break-words">
                        <span className="font-medium">{t('description')}:</span> {transaction.description || t('not_available')}
                      </p>

                      {transaction.method && (
                        <p className="text-clr-surface-a40 dark:text-clr-surface-a50 text-xs mb-1 break-words">
                          <span className="font-medium">{t('method')}:</span> {t(transaction.method)}
                        </p>
                      )}

                      {transaction.relatedEntity && (
                        <p className="text-clr-surface-a40 dark:text-clr-surface-a50 text-xs mb-1 flex items-center break-words">
                          <Boxes className="h-4 w-4 text-clr-surface-a40 dark:text-clr-surface-a50 mr-1 rtl:ml-1 rtl:mr-0" />
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

                {totalPages > 1 && (
                  <div className="flex justify-center items-center mt-6 space-x-2 rtl:space-x-reverse">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 rounded-md bg-clr-surface-a20 text-clr-dark-a0 dark:text-clr-light-a0 hover:bg-clr-surface-a30 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 transition-colors duration-300"
                    >
                      <ChevronLeftIcon className="h-5 w-5 rtl:rotate-180" />
                    </button>
                    {[...Array(totalPages).keys()].map(number => (
                      <button
                        key={number + 1}
                        onClick={() => paginate(number + 1)}
                        className={`px-4 py-2 rounded-md font-semibold ${
                          currentPage === number + 1 
                            ? 'bg-clr-primary-a0 text-clr-light-a0' 
                            : 'bg-clr-surface-a20 text-clr-dark-a0 hover:bg-clr-surface-a30 dark:text-clr-light-a0'
                        } transition duration-150 transition-colors duration-300`}
                      >
                        {number + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 rounded-md bg-clr-surface-a20 text-clr-dark-a0 dark:text-clr-light-a0 hover:bg-clr-surface-a30 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 transition-colors duration-300"
                    >
                      <ChevronRightIcon className="h-5 w-5 rtl:rotate-180" />
                    </button>
                  </div>
                )}
              </>
            )
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default MyTransactionsPage;
