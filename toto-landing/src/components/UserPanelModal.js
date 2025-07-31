// toto-landing/src/components/UserPanelModal.js
// مودال عمومی برای نمایش بخش‌های مختلف پنل کاربری در لندینگ پیج

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { PlusCircle, Banknote, ListChecks, ReceiptText, Wallet } from 'lucide-react';

// کامپوننت‌های ساده شده محتوا (می‌توانید کدهای کامل را از toto-frontend-user کپی و ساده‌سازی کنید)
const DepositContent = ({ t }) => (
  <div className="text-center p-4">
    <PlusCircle className="h-10 w-10 text-clr-primary-a0 mx-auto mb-4" />
    <h3 className="text-xl font-bold mb-2 text-clr-dark-a0 dark:text-clr-light-a0">{t('charge_account')}</h3>
    <p className="text-sm text-clr-dark-a0 dark:text-clr-light-a0">{t('deposit_modal_desc')}</p>
    <Link to="/deposit" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-clr-primary-a0 hover:bg-clr-primary-a10">
      {t('go_to_deposit_page')}
    </Link>
  </div>
);

const WithdrawContent = ({ t }) => (
  <div className="text-center p-4">
    <Banknote className="h-10 w-10 text-red-500 mx-auto mb-4" />
    <h3 className="text-xl font-bold mb-2 text-clr-dark-a0 dark:text-clr-light-a0">{t('withdraw_account')}</h3>
    <p className="text-sm text-clr-dark-a0 dark:text-clr-light-a0">{t('withdraw_modal_desc')}</p>
    <Link to="/withdraw" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-clr-primary-a0 hover:bg-clr-primary-a10">
      {t('go_to_withdraw_page')}
    </Link>
  </div>
);

const PredictionsContent = ({ t }) => (
  <div className="text-center p-4">
    <ListChecks className="h-10 w-10 text-clr-primary-a0 mx-auto mb-4" />
    <h3 className="text-xl font-bold mb-2 text-clr-dark-a0 dark:text-clr-light-a0">{t('show_predictions')}</h3>
    <p className="text-sm text-clr-dark-a0 dark:text-clr-light-a0">{t('predictions_modal_desc')}</p>
    <Link to="/my-predictions" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-clr-primary-a0 hover:bg-clr-primary-a10">
      {t('go_to_predictions_page')}
    </Link>
  </div>
);

const TransactionsContent = ({ t }) => (
  <div className="text-center p-4">
    <ReceiptText className="h-10 w-10 text-clr-primary-a0 mx-auto mb-4" />
    <h3 className="text-xl font-bold mb-2 text-clr-dark-a0 dark:text-clr-light-a0">{t('show_transactions')}</h3>
    <p className="text-sm text-clr-dark-a0 dark:text-clr-light-a0">{t('transactions_modal_desc')}</p>
    <Link to="/my-transactions" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-clr-primary-a0 hover:bg-clr-primary-a10">
      {t('go_to_transactions_page')}
    </Link>
  </div>
);


function UserPanelModal({ isOpen, onClose, contentType }) {
  const { t } = useLanguage();
  if (!isOpen) return null;

  const renderContent = () => {
    switch(contentType) {
      case 'deposit':
        return <DepositContent t={t} />;
      case 'withdraw':
        return <WithdrawContent t={t} />;
      case 'my-predictions':
        return <PredictionsContent t={t} />;
      case 'my-transactions':
        return <TransactionsContent t={t} />;
      default:
        return (
          <div className="text-center">
            <h3 className="text-xl font-bold text-clr-dark-a0 dark:text-clr-light-a0 mb-2">{t('modal_content_error')}</h3>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 font-iranyekan animate-fadeIn">
      <div className="bg-clr-surface-a0 dark:bg-clr-surface-a10 p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-sm transition-colors duration-300 relative border border-clr-surface-a20">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-clr-dark-a0 dark:text-clr-light-a0 hover:text-clr-primary-a0 transition-colors duration-200"
          aria-label={t('close_modal')}
        >
          <XCircleIcon className="h-7 w-7" />
        </button>
        {renderContent()}
      </div>
    </div>
  );
}

export default UserPanelModal;
