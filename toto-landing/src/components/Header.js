import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Menu,
  X,
  ChevronDown,
  Sun,
  Moon,
  LogIn,
  HelpCircle,
  Globe,
  Home,
  LogOut,
  Wallet,
  ListChecks,
  ReceiptText,
  Banknote,
  PlusCircle,
  Ticket, // added for new ticket icon
  ListTodo // added for viewing tickets
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

function Header({ currentTheme, toggleTheme, isAuthenticated, userBalance, onShowLoginModal, onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileNavDropdownOpen, setIsMobileNavDropdownOpen] = useState(false);
  const [isBalanceDropdownOpenMobile, setIsBalanceDropdownOpenMobile] = useState(false);
  // State for the new mobile support dropdown
  const [isSupportDropdownOpenMobile, setIsSupportDropdownOpenMobile] = useState(false);

  const { language, setLanguage, t } = useLanguage();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsMobileNavDropdownOpen(false);
    setIsBalanceDropdownOpenMobile(false);
    setIsSupportDropdownOpenMobile(false); // Close new dropdown
  };

  const closeMenus = () => {
    setIsMobileMenuOpen(false);
    setIsMobileNavDropdownOpen(false);
    setIsBalanceDropdownOpenMobile(false);
    setIsSupportDropdownOpenMobile(false); // Close new dropdown
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    closeMenus();
  };

  const handleLogoutClick = () => {
    onLogout();
    closeMenus();
  };

  const toggleBalanceDropdownMobile = () => {
    setIsBalanceDropdownOpenMobile(prev => !prev);
  };
  
  // New toggle function for mobile support dropdown
  const toggleSupportDropdownMobile = () => {
    setIsSupportDropdownOpenMobile(prev => !prev);
  };

  return (
    <header className="w-full sticky top-0 z-50 font-iranyekan shadow-md bg-clr-surface-a0 text-clr-dark-a0 dark:text-clr-light-a0 transition-colors duration-300">
      <div className="container mx-auto flex justify-between items-center h-16 px-4">
  <Link to="/" className="text-3xl font-extrabold tracking-tight text-clr-primary-a0 hover:text-clr-primary-a10 transition duration-300 ease-in-out">
    TotoGame
  </Link>
  <Link to="/" className="hover:text-clr-primary-a30 transition duration-200 px-3 py-2 rounded-md">
        {t('home_page')}
      </Link>

  <div className="flex items-center space-x-4">
    {/* تغییر زبان */}
    <div className="hidden md:block relative group">
      <button className="text-clr-dark-a0 dark:text-clr-light-a0 focus:outline-none p-2 rounded-full hover:bg-clr-surface-a10 dark:hover:bg-clr-surface-a20 transition duration-200 flex items-center">
        <Globe className="w-6 h-6" />
        <ChevronDown className="ml-1 rtl:mr-1 rtl:ml-0 w-4 h-4 transition-transform duration-200 group-hover:rotate-180" />
      </button>
      <div className="absolute right-0 rtl:left-0 rtl:right-auto mt-2 w-32 bg-clr-surface-a0 dark:bg-clr-surface-a10 rounded-md shadow-lg ring-1 ring-clr-dark-a0 ring-opacity-5 dark:ring-clr-surface-a30 z-50 invisible group-hover:visible group-hover:animate-scaleIn transition-all duration-300 transform origin-top-right rtl:origin-top-left">
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); handleLanguageChange('en'); }}
          className={`block px-4 py-2 text-sm text-clr-dark-a0 dark:text-clr-light-a0 hover:bg-clr-surface-a20 dark:hover:bg-clr-surface-a30 rounded-t-md ${language === 'en' ? 'bg-clr-primary-a50 dark:bg-clr-primary-a10 text-clr-primary-a0 dark:text-clr-light-a0' : ''}`}
        >
          English
        </a>
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); handleLanguageChange('fa'); }}
          className={`block px-4 py-2 text-sm text-clr-dark-a0 dark:text-clr-light-a0 hover:bg-clr-surface-a20 dark:hover:bg-clr-surface-a30 rounded-b-md ${language === 'fa' ? 'bg-clr-primary-a50 dark:bg-clr-primary-a10 text-clr-primary-a0 dark:text-clr-light-a0' : ''}`}
        >
          فارسی
        </a>
      </div>
    </div>

    {/* دارک/لایت مود */}
    <button
      onClick={toggleTheme}
      className="hidden md:block text-clr-dark-a0 dark:text-clr-light-a0 focus:outline-none p-2 rounded-full hover:bg-clr-surface-a10 dark:hover:bg-clr-surface-a20 transition duration-200"
      aria-label="Toggle theme"
    >
      {currentTheme === 'light' ? (
        <Moon className="w-6 h-6" />
      ) : (
        <Sun className="w-6 h-6" />
      )}
    </button>

    {/* منوهای ورود، حساب و غیره */}
    <nav className="hidden md:flex items-center space-x-4 text-sm">

      {isAuthenticated ? (
        <>
          {/* موجودی کاربر */}
          {userBalance !== null && (
            <div className="relative group">
              <button className="flex items-center text-clr-dark-a0 dark:text-clr-light-a0 text-base font-semibold px-3 py-2 rounded-md bg-clr-surface-a10 dark:bg-clr-surface-a20 whitespace-nowrap hover:bg-clr-surface-a20 dark:hover:bg-clr-surface-a30 transition-colors duration-200">
                <Wallet className="w-5 h-5 mr-1 rtl:ml-1 rtl:mr-0 text-clr-primary-a0" />
                {userBalance?.toLocaleString('fa-IR')} {t('usdt')}
                <ChevronDown className="ml-1 rtl:mr-1 rtl:ml-0 w-4 h-4 transition-transform duration-200 group-hover:rotate-180" />
              </button>
              <div className="absolute left-0 rtl:right-0 rtl:left-auto mt-2 w-48 bg-clr-surface-a0 dark:bg-clr-surface-a10 rounded-md shadow-lg ring-1 ring-clr-dark-a0 ring-opacity-5 dark:ring-clr-surface-a30 z-50 invisible group-hover:visible group-hover:animate-scaleIn transition-all duration-300 transform origin-top-left rtl:origin-top-right">
                <Link to="/deposit" onClick={closeMenus} className="flex items-center w-full px-4 py-2 text-sm hover:bg-clr-surface-a20 dark:hover:bg-clr-surface-a30">
                  <PlusCircle className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> {t('charge_account')}
                </Link>
                <Link to="/withdraw" onClick={closeMenus} className="flex items-center w-full px-4 py-2 text-sm hover:bg-clr-surface-a20 dark:hover:bg-clr-surface-a30">
                  <Banknote className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> {t('withdraw_account')}
                </Link>
                <Link to="/dashboard" className="hover:text-clr-primary-a30 transition duration-200 px-3 py-2 rounded-md flex items-center">
            <Home className="w-5 h-5 mr-1 rtl:ml-1 rtl:mr-0" /> {t('dashboard')}
          </Link>
                <Link to="/my-predictions" onClick={closeMenus} className="flex items-center w-full px-4 py-2 text-sm hover:bg-clr-surface-a20 dark:hover:bg-clr-surface-a30">
                  <ListChecks className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> {t('show_predictions')}
                </Link>
                <Link to="/my-transactions" onClick={closeMenus} className="flex items-center w-full px-4 py-2 text-sm hover:bg-clr-surface-a20 dark:hover:bg-clr-surface-a30">
                  <ReceiptText className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> {t('show_transactions')}
                </Link>
                <button className="flex items-center text-base font-semibold px-3 py-2 rounded-md hover:bg-clr-surface-a20 transition-colors duration-200">
              <HelpCircle className="w-5 h-5 mr-1 rtl:ml-1 rtl:mr-0" />
              {t('support')}
              <ChevronDown className="ml-1 rtl:mr-1 rtl:ml-0 w-4 h-4 transition-transform duration-200 group-hover:rotate-180" />
            </button>
              <Link to="/support/create-ticket" onClick={closeMenus} className="flex items-center w-full px-4 py-2 text-sm hover:bg-clr-surface-a20 dark:hover:bg-clr-surface-a30">
                <Ticket className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> ساخت تیکت
              </Link>
              <Link to="/support/my-tickets" onClick={closeMenus} className="flex items-center w-full px-4 py-2 text-sm hover:bg-clr-surface-a20 dark:hover:bg-clr-surface-a30">
                <ListTodo className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> مشاهده تیکت‌ها
              </Link>
             <button onClick={handleLogoutClick} className="hover:text-red-600 transition duration-200 px-3 py-2 rounded-md flex items-center text-red-500">
            <LogOut className="w-5 h-5 mr-1 rtl:ml-1 rtl:mr-0" /> {t('logout')}
          </button>
              </div>
            </div>
          )}
        
        </>
      ) : (
        <button
          onClick={() => onShowLoginModal(true)}
          className="hover:text-clr-primary-a30 transition duration-200 px-3 py-2 rounded-md flex items-center"
        >
          <LogIn className="w-5 h-5 mr-1 rtl:ml-1 rtl:mr-0" /> {t('login_register')}
        </button>
      )}
    </nav>

    {/* منوی موبایل */}
    <button onClick={toggleMobileMenu} className="md:hidden text-clr-dark-a0 dark:text-clr-light-a0 focus:outline-none p-1 rounded-md hover:bg-clr-surface-a10 dark:hover:bg-clr-surface-a20 transition duration-200">
      {isMobileMenuOpen ? (
        <X className="w-7 h-7" />
      ) : (
        <Menu className="w-7 h-7" />
      )}
    </button>
  </div>
</div>


      {isMobileMenuOpen && (
        <div className="md:hidden bg-clr-surface-a10 dark:bg-clr-surface-a0 py-2 shadow-inner animate-slideDown transition-colors duration-300">
          <ul className="flex flex-col items-start space-y-3 text-lg px-4">
            <li className="w-full">
              <div className="relative w-full">
                <button
                  onClick={() => setIsMobileNavDropdownOpen(!isMobileNavDropdownOpen)}
                  className="w-full text-left py-2 px-4 hover:bg-clr-surface-a20 rounded-md text-clr-dark-a0 dark:text-clr-light-a0 flex items-center justify-between"
                >
                  <span className="flex items-center">
                    <Globe className="w-6 h-6 mr-2 rtl:ml-2 rtl:mr-0" /> {t('language')}
                  </span>
                  <ChevronDown className={`ml-1 rtl:mr-1 rtl:ml-0 w-4 h-4 transition-transform duration-200 ${isMobileNavDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMobileNavDropdownOpen && (
                  <ul className="bg-clr-surface-a20 dark:bg-clr-surface-a30 mt-1 rounded-md shadow-inner w-full animate-slideDown">
                    <li>
                      <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); handleLanguageChange('en'); }}
                        className={`block px-4 py-2 text-sm text-clr-dark-a0 dark:text-clr-light-a0 hover:bg-clr-surface-a40 rounded-t-md ${language === 'en' ? 'bg-clr-primary-a50 dark:bg-clr-primary-a10 text-clr-primary-a0 dark:text-clr-light-a0' : ''}`}
                      >
                        English
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); handleLanguageChange('fa'); }}
                        className={`block px-4 py-2 text-sm text-clr-dark-a0 dark:text-clr-light-a0 hover:bg-clr-surface-a40 rounded-b-md ${language === 'fa' ? 'bg-clr-primary-a50 dark:bg-clr-primary-a10 text-clr-primary-a0 dark:text-clr-light-a0' : ''}`}
                      >
                        فارسی
                      </a>
                    </li>
                  </ul>
                )}
              </div>
            </li>

            <button
                onClick={toggleTheme}
                className="w-full text-left p-2 rounded-md hover:bg-clr-surface-a20 text-clr-dark-a0 dark:text-clr-light-a0 transition duration-200 flex items-center"
                aria-label="Toggle theme"
            >
                {currentTheme === 'light' ? (
                    <Moon className="w-6 h-6 mr-2 rtl:ml-2 rtl:mr-0" />
                ) : (
                    <Sun className="w-6 h-6 mr-2 rtl:ml-2 rtl:mr-0" />
                )}
                {currentTheme === 'light' ? t('dark_mode') : t('light_mode')}
            </button>

            <li>
              <Link
                to="/"
                onClick={closeMenus}
                className="block w-full text-left py-2 px-4 hover:bg-clr-surface-a20 rounded-md text-clr-dark-a0 dark:text-clr-light-a0"
              >
                {t('home_page')}
              </Link>
            </li>
            {isAuthenticated ? (
                <>
                    {userBalance !== null && (
                      <li className="w-full">
                        <div className="relative w-full">
                          <button
                            onClick={toggleBalanceDropdownMobile}
                            className="w-full text-left py-2 px-4 hover:bg-clr-surface-a20 rounded-md text-clr-dark-a0 dark:text-clr-light-a0 flex items-center justify-between"
                          >
                            <span className="flex items-center">
                              <Wallet className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0 text-clr-primary-a0" />
                              {userBalance?.toLocaleString('fa-IR')} {t('usdt')}
                            </span>
                            <ChevronDown className={`ml-1 rtl:mr-1 rtl:ml-0 w-4 h-4 transition-transform duration-200 ${isBalanceDropdownOpenMobile ? 'rotate-180' : ''}`} />
                          </button>
                          {isBalanceDropdownOpenMobile && (
                            <ul className="bg-clr-surface-a20 dark:bg-clr-surface-a30 mt-1 rounded-md shadow-inner w-full animate-slideDown">
                              <li>
                                <Link
                                  to="/deposit"
                                  onClick={closeMenus}
                                  className="flex items-center w-full px-4 py-2 text-sm text-clr-dark-a0 dark:text-clr-light-a0 hover:bg-clr-surface-a40 rounded-t-md"
                                >
                                  <PlusCircle className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> {t('charge_account')}
                                </Link>
                              </li>
                              <li>
                                <Link
                                  to="/withdraw"
                                  onClick={closeMenus}
                                  className="flex items-center w-full px-4 py-2 text-sm text-clr-dark-a0 dark:text-clr-light-a0 hover:bg-clr-surface-a40"
                                >
                                  <Banknote className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> {t('withdraw_account')}
                                </Link>
                              </li>
                              <li>
                                <Link
                                  to="/my-predictions"
                                  onClick={closeMenus}
                                  className="flex items-center w-full px-4 py-2 text-sm text-clr-dark-a0 dark:text-clr-light-a0 hover:bg-clr-surface-a40"
                                >
                                  <ListChecks className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> {t('show_predictions')}
                                </Link>
                              </li>
                              <li>
                                <Link
                                  to="/my-transactions"
                                  onClick={closeMenus}
                                  className="flex items-center w-full px-4 py-2 text-sm text-clr-dark-a0 dark:text-clr-light-a0 hover:bg-clr-surface-a40 rounded-b-md"
                                >
                                  <ReceiptText className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> {t('show_transactions')}
                                </Link>
                              </li>
                            </ul>
                          )}
                        </div>
                      </li>
                    )}
                    {/* New Mobile Support Dropdown */}
                    <li className="w-full">
                        <div className="relative w-full">
                          <button
                            onClick={toggleSupportDropdownMobile}
                            className="w-full text-left py-2 px-4 hover:bg-clr-surface-a20 rounded-md text-clr-dark-a0 dark:text-clr-light-a0 flex items-center justify-between"
                          >
                            <span className="flex items-center">
                              <HelpCircle className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
                              پشتیبانی
                            </span>
                            <ChevronDown className={`ml-1 rtl:mr-1 rtl:ml-0 w-4 h-4 transition-transform duration-200 ${isSupportDropdownOpenMobile ? 'rotate-180' : ''}`} />
                          </button>
                          {isSupportDropdownOpenMobile && (
                            <ul className="bg-clr-surface-a20 dark:bg-clr-surface-a30 mt-1 rounded-md shadow-inner w-full animate-slideDown">
                              <li>
                                <Link
                                  to="/support/create-ticket"
                                  onClick={closeMenus}
                                  className="flex items-center w-full px-4 py-2 text-sm text-clr-dark-a0 dark:text-clr-light-a0 hover:bg-clr-surface-a40 rounded-t-md"
                                >
                                  <Ticket className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> ساخت تیکت جدید
                                </Link>
                              </li>
                              <li>
                                <Link
                                  to="/support/my-tickets"
                                  onClick={closeMenus}
                                  className="flex items-center w-full px-4 py-2 text-sm text-clr-dark-a0 dark:text-clr-light-a0 hover:bg-clr-surface-a40 rounded-b-md"
                                >
                                  <ListTodo className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> مشاهده تیکت‌ها
                                </Link>
                              </li>
                            </ul>
                          )}
                        </div>
                    </li>
                    {/* End of New Mobile Support Dropdown */}
                    <li>
                        <Link
                            to="/dashboard"
                            onClick={closeMenus}
                            className="block w-full text-left py-2 px-4 hover:bg-clr-surface-a20 rounded-md text-clr-dark-a0 dark:text-clr-light-a0 flex items-center"
                        >
                            <Home className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" /> {t('dashboard')}
                        </Link>
                    </li>
                    <li>
                        <button
                            onClick={() => { handleLogoutClick(); closeMenus(); }}
                            className="w-full text-left py-2 px-4 text-red-300 hover:bg-red-600 dark:text-red-400 dark:hover:bg-red-800 rounded-md flex items-center"
                        >
                            <LogOut className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" /> {t('logout')}
                        </button>
                    </li>
                </>
            ) : (
                <li>
                    <button
                        onClick={() => { onShowLoginModal(); closeMenus(); }}
                        className="w-full bg-clr-primary-a0 hover:bg-clr-primary-a10 text-clr-light-a0 py-2 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
                    >
                        <LogIn className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" /> {t('login_register')}
                    </button>
                </li>
            )}
            <li>
              <Link
                to="/faq"
                onClick={closeMenus}
                className="block w-full text-left py-2 px-4 hover:bg-clr-surface-a20 rounded-md text-clr-dark-a0 dark:text-clr-light-a0 flex items-center"
              >
                <HelpCircle className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" /> {t('faq_title')}
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}

export default Header;
