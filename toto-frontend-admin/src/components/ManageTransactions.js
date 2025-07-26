// toto-frontend-admin/src/components/ManageTransactions.js
// کامپوننت مدیریت تراکنش‌ها (برای ادمین)

import React, { useState, useEffect, useCallback } from 'react'; // useCallback اضافه شد
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';

// نیازی نیست token و API_BASE_URL به عنوان پراپ پاس داده شوند.
// axios.defaults.baseURL و axios.defaults.withCredentials در App.js تنظیم شده‌اند.
function ManageTransactions() { // 'token' و 'API_BASE_URL' از پراپس حذف شدند
  const [transactions, setTransactions] = useState([]);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  // تابع fetchData را داخل useCallback قرار می‌دهیم تا از ایجاد مکرر آن جلوگیری شود
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // دریافت تمام تراکنش‌ها:
      // baseURL از axios.defaults.baseURL در App.js گرفته می‌شود.
      // کوکی‌ها به خاطر axios.defaults.withCredentials = true ارسال می‌شوند.
      const transactionsRes = await axios.get('/admin/transactions'); // '/api' از ابتدای مسیر حذف شد
      setTransactions(transactionsRes.data);

      // دریافت خلاصه مالی:
      const summaryRes = await axios.get('/admin/financial-summary'); // '/api' از ابتدای مسیر حذف شد
      setFinancialSummary(summaryRes.data);

    } catch (err) {
      setError(err.response?.data?.message || t('error_fetching_data_admin'));
      console.error('Error fetching data for transactions/summary:', err.response?.data || err.message); // لاگ برای اشکال‌زدایی
    } finally {
      setLoading(false);
    }
  }, [t]); // t را به dependency array اضافه کنید

  useEffect(() => {
    fetchData();
  }, [fetchData]); // fetchData را به dependency array اضافه کنید

  if (loading) return <div className="text-center py-8">{t('loading')}</div>;
  if (error) return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('manage_transactions_title_admin')}</h2>

      {financialSummary && (
        <div className="mb-8 p-4 bg-blue-50 rounded-lg shadow-sm border border-blue-200">
          <h3 className="text-xl font-semibold text-blue-800 mb-3">{t('financial_summary_admin')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-3 bg-white rounded-md shadow-sm">
              <p className="text-gray-600 text-sm">{t('total_deposits_admin')}</p>
              <p className="font-bold text-green-600 text-lg">{financialSummary.totalDeposits?.toLocaleString('fa-IR') || 0} {t('toman')}</p>
            </div>
            <div className="p-3 bg-white rounded-md shadow-sm">
              <p className="text-gray-600 text-sm">{t('total_form_payments_admin')}</p>
              <p className="font-bold text-purple-600 text-lg">{financialSummary.totalFormPayments?.toLocaleString('fa-IR') || 0} {t('toman')}</p>
            </div>
            <div className="p-3 bg-white rounded-md shadow-sm">
              <p className="text-gray-600 text-sm">{t('total_prize_payouts_admin')}</p>
              <p className="font-bold text-red-600 text-lg">{financialSummary.totalPrizePayouts?.toLocaleString('fa-IR') || 0} {t('toman')}</p>
            </div>
            <div className="p-3 bg-white rounded-md shadow-sm">
              <p className="text-gray-600 text-sm">{t('total_refunds_admin')}</p>
              <p className="font-bold text-orange-600 text-lg">{financialSummary.totalRefunds?.toLocaleString('fa-IR') || 0} {t('toman')}</p>
            </div>
            <div className="p-3 bg-white rounded-md shadow-sm md:col-span-2 lg:col-span-1">
              <p className="text-gray-600 text-sm">{t('platform_net_balance_admin')}</p>
              <p className={`font-bold text-xl ${financialSummary.netBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {financialSummary.netBalance?.toLocaleString('fa-IR') || 0} {t('toman')}
              </p>
            </div>
          </div>
        </div>
      )}

      <h3 className="text-xl font-bold text-gray-800 mb-4">{t('transaction_details_admin')}</h3>
      {transactions.length === 0 ? (
        <p className="text-gray-600">{t('no_transactions_found_admin')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow-md">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold text-sm">{t('date')}</th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold text-sm">{t('user')}</th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold text-sm">{t('amount')}</th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold text-sm">{t('type')}</th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold text-sm">{t('description')}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction._id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-800">{new Date(transaction.createdAt).toLocaleString('fa-IR')}</td>
                  <td className="py-3 px-4 text-gray-800">{transaction.user?.username || t('unknown')}</td>
                  <td className={`py-3 px-4 font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.amount?.toLocaleString('fa-IR')}
                  </td>
                  <td className="py-3 px-4 text-gray-800">{transaction.type}</td>
                  <td className="py-3 px-4 text-gray-800">{transaction.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ManageTransactions;