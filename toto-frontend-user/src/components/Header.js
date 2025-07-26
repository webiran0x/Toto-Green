// toto-frontend-user/src/components/Header.js
// کامپوننت هدر با طراحی مینیمال، حرفه‌ای و واکنش‌گرا

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Menu, // آیکون همبرگر
  X, // آیکون بستن
  ChevronDown, // آیکون کشویی
  Home, // آیکون داشبورد
  Gamepad2, // آیکون بازی‌ها
  ListChecks, // آیکون پیش‌بینی‌ها
  ReceiptText, // آیکون تراکنش‌ها
  Wallet, // آیکون واریز
  Banknote, // آیکون برداشت
  LifeBuoy, // آیکون پشتیبانی
  PlusCircle, // آیکون ایجاد تیکت
  Ticket, // آیکون تیکت‌های من
  LogOut, // آیکون خروج
  LogIn, // آیکون ورود/ثبت نام
  PlayIcon,
  Clock // آیکون بازی‌های گذشته
} from 'lucide-react'; // ایمپورت آیکون‌ها از lucide-react

function Header({ isAuthenticated, onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSupportDropdownOpen, setIsSupportDropdownOpen] = useState(false);
  const [isSupportMobileDropdownOpen, setIsSupportMobileDropdownOpen] = useState(false);
  // --- جدید: وضعیت برای منوی کشویی بازی‌ها ---
  const [isGamesDropdownOpen, setIsGamesDropdownOpen] = useState(false);
  const [isGamesMobileDropdownOpen, setIsGamesMobileDropdownOpen] = useState(false);
  // --- پایان جدید ---

  const { language, setLanguage, t } = useLanguage();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsSupportMobileDropdownOpen(false);
    setIsGamesMobileDropdownOpen(false); // --- جدید: بستن منوی بازی‌ها در موبایل ---
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const toggleSupportDropdown = () => {
    setIsSupportDropdownOpen(!isSupportDropdownOpen);
  };

  const toggleSupportMobileDropdown = () => {
    setIsSupportMobileDropdownOpen(!isSupportMobileDropdownOpen);
  };

  // --- جدید: توابع برای منوی کشویی بازی‌ها ---
  const toggleGamesDropdown = () => {
    setIsGamesDropdownOpen(!isGamesDropdownOpen);
  };

  const toggleGamesMobileDropdown = () => {
    setIsGamesMobileDropdownOpen(!isGamesMobileDropdownOpen);
  };
  // --- پایان جدید ---

  // تابع کمکی برای بستن منوی موبایل و دراپ‌داون‌ها پس از کلیک روی لینک
  const closeMenus = () => {
    setIsMobileMenuOpen(false);
    setIsSupportDropdownOpen(false);
    setIsSupportMobileDropdownOpen(false);
    setIsGamesDropdownOpen(false); // --- جدید: بستن منوی بازی‌ها ---
    setIsGamesMobileDropdownOpen(false); // --- جدید: بستن منوی بازی‌ها در موبایل ---
  };

  return (
    <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-lg p-4 sticky top-0 z-50 font-inter">
      <div className="container mx-auto flex justify-between items-center">
        {/* لوگو/نام سایت */}
        <Link to="/" className="text-3xl font-extrabold tracking-tight hover:text-blue-200 transition duration-300 ease-in-out">
          TotoGame
        </Link>

        {/* Hamburger menu for mobile */}
        <div className="md:hidden flex items-center space-x-4">
          {/* سوییچر زبان موبایل */}
          <select
            value={language}
            onChange={handleLanguageChange}
            className="bg-blue-600 border border-blue-500 text-white rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-400 transition duration-200"
          >
            <option value="fa">فارسی</option>
            <option value="en">English</option>
          </select>
          {/* دکمه همبرگر/بستن */}
          <button onClick={toggleMobileMenu} className="text-white focus:outline-none p-1 rounded-md hover:bg-blue-600 transition duration-200">
            {isMobileMenuOpen ? (
              <X className="w-7 h-7" /> // آیکون بستن
            ) : (
              <Menu className="w-7 h-7" /> // آیکون همبرگر
            )}
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-lg relative">
          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard" t={t} icon={Home} textKey="dashboard" onClick={closeMenus} />
              
              {/* --- جدید: دسته بازی‌ها - Dropdown برای دسکتاپ --- */}
              <div
                className="relative"
                onMouseEnter={() => setIsGamesDropdownOpen(true)}
                onMouseLeave={() => setIsGamesDropdownOpen(false)}
              >
                <button
                  onClick={toggleGamesDropdown}
                  className="hover:text-blue-200 transition duration-200 px-3 py-2 rounded-md flex items-center focus:outline-none"
                  aria-haspopup="true"
                  aria-expanded={isGamesDropdownOpen}
                >
                  <Gamepad2 className="w-5 h-5 mr-2" /> {/* آیکون بازی‌ها */}
                  {t('games')}
                  <ChevronDown className={`ml-1 w-4 h-4 transition-transform duration-200 ${isGamesDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isGamesDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg text-gray-800 ring-1 ring-black ring-opacity-5 z-50 transform origin-top-right animate-scaleIn">
                    <Link
                      to="/games"
                      className="flex items-center px-4 py-2 hover:bg-blue-100 transition duration-150 rounded-t-md"
                      onClick={closeMenus}
                    >
                      <PlayIcon className="w-4 h-4 mr-2" /> {t('active_games')} {/* استفاده از کلید ترجمه جدید */}
                    </Link>
                    <Link
                      to="/expired-games" 
                      className="flex items-center px-4 py-2 hover:bg-blue-100 transition duration-150 rounded-b-md"
                      onClick={closeMenus}
                    >
                      <Clock className="w-4 h-4 mr-2" /> {t('expired_games_title')}
                    </Link>
                  </div>
                )}
              </div>
              {/* --- پایان جدید: دسته بازی‌ها --- */}

              <NavLink to="/my-predictions" t={t} icon={ListChecks} textKey="my_predictions" onClick={closeMenus} />
              <NavLink to="/my-transactions" t={t} icon={ReceiptText} textKey="transactions" onClick={closeMenus} />
              <NavLink to="/deposit" t={t} icon={Wallet} textKey="deposit" onClick={closeMenus} />
              <NavLink to="/withdraw" t={t} icon={Banknote} textKey="withdraw" onClick={closeMenus} />

              {/* دسته پشتیبانی - Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setIsSupportDropdownOpen(true)}
                onMouseLeave={() => setIsSupportDropdownOpen(false)}
              >
                <button
                  onClick={toggleSupportDropdown}
                  className="hover:text-blue-200 transition duration-200 px-3 py-2 rounded-md flex items-center focus:outline-none"
                  aria-haspopup="true"
                  aria-expanded={isSupportDropdownOpen}
                >
                  <LifeBuoy className="w-5 h-5 mr-2" /> {/* آیکون پشتیبانی */}
                  {t('role_support')}
                  <ChevronDown className={`ml-1 w-4 h-4 transition-transform duration-200 ${isSupportDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSupportDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg text-gray-800 ring-1 ring-black ring-opacity-5 z-50 transform origin-top-right animate-scaleIn">
                    <Link
                      to="/support/create"
                      className="flex items-center px-4 py-2 hover:bg-blue-100 transition duration-150 rounded-t-md"
                      onClick={closeMenus}
                    >
                      <PlusCircle className="w-4 h-4 mr-2" /> {t('create_ticket')}
                    </Link>
                    <Link
                      to="/support/my-tickets"
                      className="flex items-center px-4 py-2 hover:bg-blue-100 transition duration-150 rounded-b-md"
                      onClick={closeMenus}
                    >
                      <Ticket className="w-4 h-4 mr-2" /> {t('my_tickets')}
                    </Link>
                  </div>
                )}
              </div>

              {/* سوییچر زبان دسکتاپ */}
              <select
                value={language}
                onChange={handleLanguageChange}
                className="bg-blue-600 border border-blue-500 text-white rounded-md px-2 py-1 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200"
              >
                <option value="fa">فارسی</option>
                <option value="en">English</option>
              </select>

              {/* دکمه خروج */}
              <button
                onClick={() => { onLogout(); closeMenus(); }}
                className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg flex items-center"
              >
                <LogOut className="w-5 h-5 mr-2" /> {t('logout')}
              </button>
            </>
          ) : (
            <>
              {/* سوییچر زبان دسکتاپ (برای کاربران مهمان) */}
              <select
                value={language}
                onChange={handleLanguageChange}
                className="bg-blue-600 border border-blue-500 text-white rounded-md px-2 py-1 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200"
              >
                <option value="fa">فارسی</option>
                <option value="en">English</option>
              </select>
              {/* دکمه ورود/ثبت نام */}
              <Link
                to="/auth"
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg flex items-center"
                onClick={closeMenus}
              >
                <LogIn className="w-5 h-5 mr-2" /> {t('login_register')}
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Mobile Menu (باز شدن با انیمیشن) */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-blue-800 mt-4 py-2 rounded-lg shadow-inner animate-slideDown">
          <ul className="flex flex-col items-start space-y-3 text-lg px-4">
            {isAuthenticated ? (
              <>
                <li><NavLinkMobile to="/dashboard" t={t} icon={Home} textKey="dashboard" onClick={closeMenus} /></li>
                
                {/* --- جدید: دسته بازی‌ها - Dropdown برای موبایل --- */}
                <li>
                  <button
                    onClick={toggleGamesMobileDropdown}
                    className="w-full flex justify-between items-center py-2 px-4 hover:bg-blue-700 rounded-md focus:outline-none"
                  >
                    <span className="flex items-center"><Gamepad2 className="w-5 h-5 mr-2" />{t('games')}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isGamesMobileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isGamesMobileDropdownOpen && (
                    <ul className="bg-blue-700 mt-1 rounded-md shadow-inner w-full animate-slideDown">
                      <li><NavLinkMobile to="/games" t={t} icon={PlayIcon} textKey="active_games" onClick={closeMenus} /></li>
                      <li><NavLinkMobile to="/expired-games" t={t} icon={Clock} textKey="expired_games_title" onClick={closeMenus} /></li>
                    </ul>
                  )}
                </li>
                {/* --- پایان جدید: دسته بازی‌ها --- */}

                <li><NavLinkMobile to="/my-predictions" t={t} icon={ListChecks} textKey="my_predictions" onClick={closeMenus} /></li>
                <li><NavLinkMobile to="/my-transactions" t={t} icon={ReceiptText} textKey="transactions" onClick={closeMenus} /></li>
                <li><NavLinkMobile to="/deposit" t={t} icon={Wallet} textKey="deposit" onClick={closeMenus} /></li>
                <li><NavLinkMobile to="/withdraw" t={t} icon={Banknote} textKey="withdraw" onClick={closeMenus} /></li>

                {/* دسته پشتیبانی موبایل */}
                <li>
                  <button
                    onClick={toggleSupportMobileDropdown}
                    className="w-full flex justify-between items-center py-2 px-4 hover:bg-blue-700 rounded-md focus:outline-none"
                  >
                    <span className="flex items-center"><LifeBuoy className="w-5 h-5 mr-2" />{t('role_support')}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSupportMobileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isSupportMobileDropdownOpen && (
                    <ul className="bg-blue-700 mt-1 rounded-md shadow-inner w-full animate-slideDown">
                      <li><NavLinkMobile to="/support/create" t={t} icon={PlusCircle} textKey="create_ticket" onClick={closeMenus} /></li>
                      <li><NavLinkMobile to="/support/my-tickets" t={t} icon={Ticket} textKey="my_tickets" onClick={closeMenus} /></li>
                    </ul>
                  )}
                </li>

                <li>
                  <button
                    onClick={() => { onLogout(); closeMenus(); }}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
                  >
                    <LogOut className="w-5 h-5 mr-2" /> {t('logout')}
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link
                  to="/auth"
                  onClick={closeMenus}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
                >
                  <LogIn className="w-5 h-5 mr-2" /> {t('login_register')}
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}

// کامپوننت کمکی برای لینک‌های ناوبری دسکتاپ
const NavLink = ({ to, t, icon: Icon, textKey, onClick }) => (
  <Link to={to} className="hover:text-blue-200 transition duration-200 px-3 py-2 rounded-md flex items-center" onClick={onClick}>
    {Icon && <Icon className="w-5 h-5 mr-2" />}
    {t(textKey)}
  </Link>
);

// کامپوننت کمکی برای لینک‌های ناوبری موبایل
const NavLinkMobile = ({ to, t, icon: Icon, textKey, onClick }) => (
  <Link to={to} onClick={onClick} className="block w-full text-left py-2 px-4 hover:bg-blue-700 rounded-md flex items-center">
    {Icon && <Icon className="w-5 h-5 mr-2" />}
    {t(textKey)}
  </Link>
);

export default Header;
