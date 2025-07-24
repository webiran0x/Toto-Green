// toto-frontend-user/src/components/MyTransactions.js
// کامپوننت جدید برای نمایش تمام تراکنش‌های کاربر

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext'; // فرض کنید LanguageContext دارید

function MyTransactions({ token, API_BASE_URL }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    const fetchMyTransactions = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/users/my-transactions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTransactions(res.data);
      } catch (err) {
        setError(err.response?.data?.message || t('error_fetching_data'));
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchMyTransactions();
    }
  }, [token, API_BASE_URL, t]);

  const getTransactionTypeTranslation = (type) => {
    switch (type) {
      case 'deposit':
        return t('transaction_type_deposit');
      case 'form_payment':
        return t('transaction_type_form_payment');
      case 'prize_payout':
        return t('transaction_type_prize_payout');
      case 'refund':
        return t('transaction_type_refund');
      case 'referral_commission':
        return t('transaction_type_referral_commission');
      case 'withdrawal': // <--- اضافه شده
        return t('transaction_type_withdrawal');
      default:
        return t('unknown');
    }
  };

  if (loading) return <div className="text-center py-8 text-gray-700">{t('loading')}</div>;
  if (error) return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-center">{error}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">{t('my_transactions_title')}</h2>
      {transactions.length === 0 ? (
        <p className="text-gray-600 text-center py-4">{t('no_transactions_found')}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold text-sm">{t('date')}</th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold text-sm">{t('amount')} ({t('usdt')})</th> {/* <--- تغییر واحد */}
                <th className="py-3 px-4 text-right text-gray-600 font-semibold text-sm">{t('type')}</th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold text-sm">{t('description')}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction._id} className="border-b border-gray-100 hover:bg-gray-50 transition duration-150">
                  <td className="py-3 px-4 text-gray-800 text-sm">{new Date(transaction.createdAt).toLocaleString('fa-IR')}</td>
                  <td className={`py-3 px-4 text-sm font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.amount.toLocaleString('fa-IR')}
                  </td>
                  <td className="py-3 px-4 text-gray-800 text-sm">{getTransactionTypeTranslation(transaction.type)}</td>
                  <td className="py-3 px-4 text-gray-800 text-sm">{transaction.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default MyTransactions;
