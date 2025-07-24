// toto-frontend-admin/src/components/AdminHeader.js
// کامپوننت هدر و نوار ناوبری پنل مدیریت

import React from 'react';
import { Link } from 'react-router-dom'; // اضافه شده
import { useLanguage } from '../contexts/LanguageContext';

function AdminHeader({ isAuthenticated, onLogout }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="bg-gradient-to-r from-teal-600 to-green-700 text-white shadow-md p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/admin/dashboard" className="text-3xl font-bold tracking-tight">{t('admin_panel_title')}</Link>
        <nav className="flex items-center space-x-6">
          {isAuthenticated ? (
            <ul className="flex space-x-6 text-lg">
              <li><Link to="/admin/dashboard" className="hover:text-teal-200 transition duration-200">{t('dashboard')}</Link></li>
              <li><Link to="/admin/users" className="hover:text-teal-200 transition duration-200">{t('manage_users')}</Link></li>
              <li><Link to="/admin/games/all" className="hover:text-teal-200 transition duration-200">{t('all_games')}</Link></li> {/* مسیر بازی‌ها */}
              <li><Link to="/admin/games/create" className="hover:text-teal-200 transition duration-200">{t('create_new_game')}</Link></li> {/* مسیر ایجاد بازی جدید */}
              <li><Link to="/admin/games/set-results" className="hover:text-teal-200 transition duration-200">{t('set_game_results')}</Link></li> {/* مسیر تنظیم نتایج */}
              <li><Link to="/admin/games/view-predictions" className="hover:text-teal-200 transition duration-200">{t('view_predictions')}</Link></li> {/* مسیر مشاهده پیش‌بینی‌ها */}
              <li><Link to="/admin/transactions" className="hover:text-teal-200 transition duration-200">{t('manage_transactions')}</Link></li>
              <li><Link to="/admin/crypto-deposits" className="hover:text-teal-200 transition duration-200">{t('manage_crypto_deposits_title_admin')}</Link></li>
              <li><Link to="/admin/manage-withdrawals" className="hover:text-teal-200 transition duration-200">{t('manage_withdrawals')}</Link></li>
              <li><Link to="/admin/external-sync" className="hover:text-teal-200 transition duration-200">{t('external_api_sync')}</Link></li>
              <li><Link to="/admin/system-logs" className="hover:text-teal-200 transition duration-200">{t('system_logs')}</Link></li>
              <li><Link to="/admin/settings" className="hover:text-teal-200 transition duration-200">{t('settings')}</Link></li>
              <li>
                <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md transition duration-200">
                  {t('logout')}
                </button>
              </li>
            </ul>
          ) : (
            <ul className="flex space-x-6 text-lg">
              <li><Link to="/admin/login" className="hover:text-teal-200 transition duration-200">{t('login_admin')}</Link></li>
            </ul>
          )}
          {/* Language Switcher for Admin Panel */}
          <select
            id="language-select-admin"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-green-600 border border-green-500 text-white py-1 px-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="fa">فارسی</option>
            <option value="en">English</option>
          </select>
        </nav>
      </div>
    </header>
  );
}

export default AdminHeader;
