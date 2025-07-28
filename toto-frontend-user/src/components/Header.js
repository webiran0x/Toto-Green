import React, { useState, useRef } from 'react'; // useRef اضافه شد
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
  Clock, // آیکون بازی‌های گذشته
  Settings, // آیکون تنظیمات
  Globe, // آیکون زبان
  Sun, // آیکون خورشید برای تم روشن
  Moon, // آیکون ماه برای تم تیره
  HelpCircle // آیکون سوال برای FAQ
} from 'lucide-react';

// کامپوننت Header
function Header({ isAuthenticated, onLogout, currentTheme, toggleTheme }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSupportDropdownOpen, setIsSupportDropdownOpen] = useState(false);
  const [isGamesDropdownOpen, setIsGamesDropdownOpen] = useState(false);
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
  
  // وضعیت‌های موبایل برای دراپ‌داون‌های تودرتو
  const [isSupportMobileDropdownOpen, setIsSupportMobileDropdownOpen] = useState(false);
  const [isGamesMobileDropdownOpen, setIsGamesMobileDropdownOpen] = useState(false);
  const [isSettingsMobileDropdownOpen, setIsSettingsMobileDropdownOpen] = useState(false);

  // وضعیت برای دراپ‌داون زبان
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isLanguageMobileDropdownOpen, setIsLanguageMobileDropdownOpen] = useState(false);

  // رفرنس‌ها برای نگهداری تایم‌اوت‌ها
  const hoveredGamesTimeout = useRef(null);
  const hoveredSupportTimeout = useRef(null);
  const hoveredSettingsTimeout = useRef(null);
  const hoveredLanguageTimeout = useRef(null); // برای دراپ‌داون زبان در Settings


  const { language, setLanguage, t } = useLanguage();

  // زمان تأخیر برای باز و بسته شدن دراپ‌داون‌ها (میلی‌ثانیه)
  const HOVER_DELAY = 200; // 200 میلی‌ثانیه مکث

  // تابع برای تاگل کردن منوی موبایل
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    // بستن تمام دراپ‌داون‌ها هنگام باز/بسته شدن منوی موبایل
    setIsSupportDropdownOpen(false);
    setIsGamesDropdownOpen(false);
    setIsSettingsDropdownOpen(false);
    setIsSupportMobileDropdownOpen(false);
    setIsGamesMobileDropdownOpen(false);
    setIsSettingsMobileDropdownOpen(false);
    setIsLanguageDropdownOpen(false);
    setIsLanguageMobileDropdownOpen(false);
    clearAllHoverTimeouts(); // پاک کردن تایم‌اوت‌های هاور
  };

  // تابع برای تغییر زبان
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    closeMenus(); // بستن تمام منوها پس از تغییر زبان
  };

  // تابع کمکی برای پاک کردن تمام تایم‌اوت‌های هاور
  const clearAllHoverTimeouts = () => {
    if (hoveredGamesTimeout.current) clearTimeout(hoveredGamesTimeout.current);
    if (hoveredSupportTimeout.current) clearTimeout(hoveredSupportTimeout.current);
    if (hoveredSettingsTimeout.current) clearTimeout(hoveredSettingsTimeout.current);
    if (hoveredLanguageTimeout.current) clearTimeout(hoveredLanguageTimeout.current);
  };

  // توابع مشترک برای باز و بسته کردن دراپ‌داون‌ها (دسکتاپ)
  const handleDropdownOpen = (setter, timeoutRef, otherSetters = []) => () => {
    clearAllHoverTimeouts(); // پاک کردن هر تایم‌اوت قبلی
    timeoutRef.current = setTimeout(() => {
      setter(true);
      otherSetters.forEach(s => s(false)); // بستن سایر دراپ‌داون‌های اصلی
    }, HOVER_DELAY);
  };

  const handleDropdownClose = (setter, timeoutRef) => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current); // پاک کردن تایم‌اوت باز شدن
    timeoutRef.current = setTimeout(() => {
      setter(false);
    }, HOVER_DELAY);
  };

  // توابع مشترک برای باز و بسته کردن دراپ‌داون‌های موبایل (اینها با کلیک کار می‌کنند، پس delay ندارند)
  const toggleMobileDropdown = (setter) => () => {
    setter(prevState => !prevState);
    // بستن دراپ‌داون زبان موبایل وقتی سایر دراپ‌داون‌های موبایل باز می‌شوند
    if (setter !== setIsSettingsMobileDropdownOpen) {
        setIsLanguageMobileDropdownOpen(false);
    }
  };

  // تابع کمکی برای بستن تمام منوها و دراپ‌داون‌ها
  const closeMenus = () => {
    setIsMobileMenuOpen(false);
    setIsSupportDropdownOpen(false);
    setIsGamesDropdownOpen(false);
    setIsSettingsDropdownOpen(false);
    setIsSupportMobileDropdownOpen(false);
    setIsGamesMobileDropdownOpen(false);
    setIsSettingsMobileDropdownOpen(false);
    setIsLanguageDropdownOpen(false);
    setIsLanguageMobileDropdownOpen(false);
    clearAllHoverTimeouts(); // اطمینان از پاک شدن تایم‌اوت‌ها
  };

  return (
    <header className="w-full sticky top-0 z-50 font-inter">
      {/* ردیف بالایی: لوگو و تنظیمات */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-lg p-4">
        <div className="container mx-auto flex justify-between items-center h-16">
          {/* لوگو/نام سایت */}
          <Link to="/" className="text-3xl font-extrabold tracking-tight hover:text-blue-200 transition duration-300 ease-in-out">
            TotoGame
          </Link>

          {/* Hamburger menu for mobile & Settings for desktop */}
          <div className="flex items-center space-x-4">
            {/* دکمه همبرگر/بستن (فقط در موبایل) */}
            <button onClick={toggleMobileMenu} className="md:hidden text-white focus:outline-none p-1 rounded-md hover:bg-blue-600 transition duration-200">
              {isMobileMenuOpen ? (
                <X className="w-7 h-7" />
              ) : (
                <Menu className="w-7 h-7" />
              )}
            </button>

            {/* دکمه تغییر تم (فقط در دسکتاپ) */}
            <button
              onClick={toggleTheme}
              className="hidden md:block text-white focus:outline-none p-2 rounded-full hover:bg-blue-600 transition duration-200"
              aria-label="Toggle theme"
            >
              {currentTheme === 'light' ? (
                <Moon className="w-6 h-6" /> // آیکون ماه برای تم روشن
              ) : (
                <Sun className="w-6 h-6" /> // آیکون خورشید برای تم تیره
              )}
            </button>

            {/* دسته Settings - Dropdown برای دسکتاپ (فقط در دسکتاپ) */}
            <div
              className="hidden md:block relative"
              onMouseEnter={handleDropdownOpen(setIsSettingsDropdownOpen, hoveredSettingsTimeout, [setIsSupportDropdownOpen, setIsGamesDropdownOpen])}
              onMouseLeave={handleDropdownClose(setIsSettingsDropdownOpen, hoveredSettingsTimeout)}
            >
              <button
                onClick={() => {
                  setIsSettingsDropdownOpen(prevState => !prevState);
                  clearAllHoverTimeouts(); // پاک کردن تایم‌اوت‌ها هنگام کلیک
                }}
                className="hover:text-blue-200 transition duration-200 px-3 py-2 rounded-md flex items-center focus:outline-none text-lg"
                aria-haspopup="true"
                aria-expanded={isSettingsDropdownOpen}
              >
                <Settings className="w-5 h-5 mr-2" />
                {t('settings')}
                <ChevronDown className={`ml-1 w-4 h-4 transition-transform duration-200 ${isSettingsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSettingsDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg text-gray-800 dark:text-gray-200 ring-1 ring-black ring-opacity-5 dark:ring-gray-600 z-50 transform origin-top-right animate-scaleIn transition-colors duration-300">
                  {/* دراپ‌داون زبان در منوی Settings */}
                  <div
                    className="relative w-full text-left px-4 py-2 hover:bg-blue-100 dark:hover:bg-blue-800 transition duration-150 rounded-t-md"
                    onMouseEnter={handleDropdownOpen(setIsLanguageDropdownOpen, hoveredLanguageTimeout, [])} // فقط خودش را باز کند
                    onMouseLeave={handleDropdownClose(setIsLanguageDropdownOpen, hoveredLanguageTimeout)}
                  >
                    <button
                      onClick={() => {
                        setIsLanguageDropdownOpen(prevState => !prevState);
                        clearAllHoverTimeouts(); // پاک کردن تایم‌اوت‌ها هنگام کلیک
                      }}
                      className="flex items-center justify-between w-full text-gray-800 dark:text-gray-200 focus:outline-none"
                    >
                      <span className="flex items-center">
                        <Globe className="w-4 h-4 mr-2" />
                        {t('language')}
                      </span>
                      <ChevronDown className={`ml-1 w-4 h-4 transition-transform duration-200 ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isLanguageDropdownOpen && (
                      <ul className="absolute left-full top-0 ml-1 w-32 bg-white dark:bg-gray-600 rounded-md shadow-lg text-gray-800 dark:text-gray-200 ring-1 ring-black ring-opacity-5 dark:ring-gray-500 z-50 animate-scaleIn transition-colors duration-300">
                        <li>
                          <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); handleLanguageChange('en'); }}
                            className={`flex items-center px-4 py-2 hover:bg-blue-100 dark:hover:bg-blue-700 transition duration-150 ${language === 'en' ? 'bg-blue-100 dark:bg-blue-700 text-blue-700 dark:text-white' : ''}`}
                          >
                            English
                          </a>
                        </li>
                        <li>
                          <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); handleLanguageChange('fa'); }}
                            className={`flex items-center px-4 py-2 hover:bg-blue-100 dark:hover:bg-blue-700 transition duration-150 ${language === 'fa' ? 'bg-blue-100 dark:bg-blue-700 text-blue-700 dark:text-white' : ''}`}
                          >
                            فارسی
                          </a>
                        </li>
                      </ul>
                    )}
                  </div>
                  {/* دکمه خروج */}
                  <button
                    onClick={() => { onLogout(); closeMenus(); }}
                    className="flex items-center w-full px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800 transition duration-150 rounded-b-md"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> {t('logout')}
                  </button>
                </div>
              )}
            </div>

            {/* دکمه ورود/ثبت نام (فقط در دسکتاپ و برای کاربران مهمان) */}
            {!isAuthenticated && (
              <Link
                to="/auth"
                className="hidden md:flex bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg items-center text-lg"
                onClick={closeMenus}
              >
                <LogIn className="w-5 h-5 mr-2" /> {t('login_register')}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ردیف پایینی: منوهای اصلی (فقط در دسکتاپ) */}
      {isAuthenticated && (
        <nav className="hidden md:block bg-blue-600 dark:bg-blue-900 text-white shadow-md py-2 transition-colors duration-300">
          <div className="container mx-auto flex justify-center items-center space-x-6 text-lg relative">
            <NavLink to="/dashboard" t={t} icon={Home} textKey="dashboard" onClick={closeMenus} />
            
            {/* دسته بازی‌ها - Dropdown برای دسکتاپ */}
            <div
              className="relative"
              onMouseEnter={handleDropdownOpen(setIsGamesDropdownOpen, hoveredGamesTimeout, [setIsSupportDropdownOpen, setIsSettingsDropdownOpen])}
              onMouseLeave={handleDropdownClose(setIsGamesDropdownOpen, hoveredGamesTimeout)}
            >
              <button
                onClick={() => {
                  setIsGamesDropdownOpen(prevState => !prevState);
                  clearAllHoverTimeouts(); // پاک کردن تایم‌اوت‌ها هنگام کلیک
                }}
                className="hover:text-blue-200 transition duration-200 px-3 py-2 rounded-md flex items-center focus:outline-none"
                aria-haspopup="true"
                aria-expanded={isGamesDropdownOpen}
              >
                <Gamepad2 className="w-5 h-5 mr-2" />
                {t('games')}
                <ChevronDown className={`ml-1 w-4 h-4 transition-transform duration-200 ${isGamesDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isGamesDropdownOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg text-gray-800 dark:text-gray-200 ring-1 ring-black ring-opacity-5 dark:ring-gray-600 z-50 transform origin-top animate-scaleIn transition-colors duration-300">
                  <Link
                    to="/games"
                    className="flex items-center px-4 py-2 hover:bg-blue-100 dark:hover:bg-blue-800 transition duration-150 rounded-t-md"
                    onClick={closeMenus}
                  >
                    <PlayIcon className="w-4 h-4 mr-2" /> {t('active_games')}
                  </Link>
                  <Link
                    to="/expired-games" 
                    className="flex items-center px-4 py-2 hover:bg-blue-100 dark:hover:bg-blue-800 transition duration-150 rounded-b-md"
                    onClick={closeMenus}
                  >
                    <Clock className="w-4 h-4 mr-2" /> {t('expired_games_title')}
                  </Link>
                </div>
              )}
            </div>

            <NavLink to="/my-predictions" t={t} icon={ListChecks} textKey="my_predictions" onClick={closeMenus} />
            <NavLink to="/my-transactions" t={t} icon={ReceiptText} textKey="transactions" onClick={closeMenus} />
            <NavLink to="/deposit" t={t} icon={Wallet} textKey="deposit" onClick={closeMenus} />
            <NavLink to="/withdraw" t={t} icon={Banknote} textKey="withdraw" onClick={closeMenus} />

            {/* دسته پشتیبانی - Dropdown */}
            <div
              className="relative"
              onMouseEnter={handleDropdownOpen(setIsSupportDropdownOpen, hoveredSupportTimeout, [setIsGamesDropdownOpen, setIsSettingsDropdownOpen])}
              onMouseLeave={handleDropdownClose(setIsSupportDropdownOpen, hoveredSupportTimeout)}
            >
              <button
                onClick={() => {
                  setIsSupportDropdownOpen(prevState => !prevState);
                  clearAllHoverTimeouts(); // پاک کردن تایم‌اوت‌ها هنگام کلیک
                }}
                className="hover:text-blue-200 transition duration-200 px-3 py-2 rounded-md flex items-center focus:outline-none"
                aria-haspopup="true"
                aria-expanded={isSupportDropdownOpen}
              >
                <LifeBuoy className="w-5 h-5 mr-2" />
                {t('role_support')}
                <ChevronDown className={`ml-1 w-4 h-4 transition-transform duration-200 ${isSupportDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSupportDropdownOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg text-gray-800 dark:text-gray-200 ring-1 ring-black ring-opacity-5 dark:ring-gray-600 z-50 transform origin-top animate-scaleIn transition-colors duration-300">
                  <Link
                    to="/support/create"
                    className="flex items-center px-4 py-2 hover:bg-blue-100 dark:hover:bg-blue-800 transition duration-150 rounded-t-md"
                    onClick={closeMenus}
                  >
                    <PlusCircle className="w-4 h-4 mr-2" /> {t('create_ticket')}
                  </Link>
                  <Link
                    to="/support/my-tickets"
                    className="flex items-center px-4 py-2 hover:bg-blue-100 dark:hover:bg-blue-800 transition duration-150 rounded-b-md"
                    onClick={closeMenus}
                  >
                    <Ticket className="w-4 h-4 mr-2" /> {t('my_tickets')}
                  </Link>
                </div>
              )}
            </div>
            {/* جدید: لینک به صفحه FAQ */}
            <NavLink to="/faq" t={t} icon={HelpCircle} textKey="faq_title" onClick={closeMenus} />
          </div>
        </nav>
      )}

      {/* Mobile Menu (باز شدن با انیمیشن) */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-blue-800 dark:bg-gray-900 mt-0 py-2 rounded-b-lg shadow-inner animate-slideDown transition-colors duration-300">
          <ul className="flex flex-col items-start space-y-3 text-lg px-4">
            {/* دکمه تغییر تم (فقط در موبایل) */}
            <li>
                <button
                    onClick={toggleTheme}
                    className="w-full text-left text-white focus:outline-none p-2 rounded-md hover:bg-blue-700 dark:hover:bg-gray-700 transition duration-200 flex items-center"
                    aria-label="Toggle theme"
                >
                    {currentTheme === 'light' ? (
                        <Moon className="w-6 h-6 mr-2" />
                    ) : (
                        <Sun className="w-6 h-6 mr-2" />
                    )}
                    {currentTheme === 'light' ? t('dark_mode') : t('light_mode')}
                </button>
            </li>

            {isAuthenticated ? (
              <>
                <li><NavLinkMobile to="/dashboard" t={t} icon={Home} textKey="dashboard" onClick={closeMenus} /></li>
                
                {/* دسته بازی‌ها - Dropdown برای موبایل */}
                <li>
                  <button
                    onClick={toggleMobileDropdown(setIsGamesMobileDropdownOpen)}
                    className="w-full flex justify-between items-center py-2 px-4 hover:bg-blue-700 dark:hover:bg-gray-700 rounded-md focus:outline-none"
                  >
                    <span className="flex items-center"><Gamepad2 className="w-5 h-5 mr-2" />{t('games')}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isGamesMobileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isGamesMobileDropdownOpen && (
                    <ul className="bg-blue-700 dark:bg-gray-800 mt-1 rounded-md shadow-inner w-full animate-slideDown transition-colors duration-300">
                      <li><NavLinkMobile to="/games" t={t} icon={PlayIcon} textKey="active_games" onClick={closeMenus} /></li>
                      <li><NavLinkMobile to="/expired-games" t={t} icon={Clock} textKey="expired_games_title" onClick={closeMenus} /></li>
                    </ul>
                  )}
                </li>

                <li><NavLinkMobile to="/my-predictions" t={t} icon={ListChecks} textKey="my_predictions" onClick={closeMenus} /></li>
                <li><NavLinkMobile to="/my-transactions" t={t} icon={ReceiptText} textKey="transactions" onClick={closeMenus} /></li>
                <li><NavLinkMobile to="/deposit" t={t} icon={Wallet} textKey="deposit" onClick={closeMenus} /></li>
                <li><NavLinkMobile to="/withdraw" t={t} icon={Banknote} textKey="withdraw" onClick={closeMenus} /></li>

                {/* دسته پشتیبانی موبایل */}
                <li>
                  <button
                    onClick={toggleMobileDropdown(setIsSupportMobileDropdownOpen)}
                    className="w-full flex justify-between items-center py-2 px-4 hover:bg-blue-700 dark:hover:bg-gray-700 rounded-md focus:outline-none"
                  >
                    <span className="flex items-center"><LifeBuoy className="w-5 h-5 mr-2" />{t('role_support')}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSupportMobileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isSupportMobileDropdownOpen && (
                    <ul className="bg-blue-700 dark:bg-gray-800 mt-1 rounded-md shadow-inner w-full animate-slideDown transition-colors duration-300">
                      <li><NavLinkMobile to="/support/create" t={t} icon={PlusCircle} textKey="create_ticket" onClick={closeMenus} /></li>
                      <li><NavLinkMobile to="/support/my-tickets" t={t} icon={Ticket} textKey="my_tickets" onClick={closeMenus} /></li>
                    </ul>
                  )}
                </li>

                {/* جدید: لینک به صفحه FAQ در منوی موبایل */}
                <li><NavLinkMobile to="/faq" t={t} icon={HelpCircle} textKey="faq_title" onClick={closeMenus} /></li>

                {/* دسته Settings - Dropdown برای موبایل */}
                <li>
                  <button
                    onClick={toggleMobileDropdown(setIsSettingsMobileDropdownOpen)}
                    className="w-full flex justify-between items-center py-2 px-4 hover:bg-blue-700 dark:hover:bg-gray-700 rounded-md focus:outline-none"
                  >
                    <span className="flex items-center"><Settings className="w-5 h-5 mr-2" />{t('settings')}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSettingsMobileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isSettingsMobileDropdownOpen && (
                    <ul className="bg-blue-700 dark:bg-gray-800 mt-1 rounded-md shadow-inner w-full animate-slideDown transition-colors duration-300">
                      {/* دراپ‌داون زبان در منوی Settings موبایل */}
                      <li>
                        <button
                          onClick={toggleMobileDropdown(setIsLanguageMobileDropdownOpen)}
                          className="w-full flex justify-between items-center py-2 px-4 text-left hover:bg-blue-600 dark:hover:bg-gray-700 rounded-md focus:outline-none"
                        >
                          <span className="flex items-center">
                            <Globe className="w-5 h-5 mr-2" /> {t('language')}
                          </span>
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isLanguageMobileDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isLanguageMobileDropdownOpen && (
                          <ul className="bg-blue-600 dark:bg-gray-700 mt-1 rounded-md shadow-inner w-full animate-slideDown transition-colors duration-300">
                            <li>
                              <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); handleLanguageChange('en'); }}
                                className={`block w-full text-left py-2 px-4 hover:bg-blue-500 dark:hover:bg-gray-600 rounded-md ${language === 'en' ? 'bg-blue-500 dark:bg-gray-600' : ''}`}
                              >
                                English
                              </a>
                            </li>
                            <li>
                              <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); handleLanguageChange('fa'); }}
                                className={`block w-full text-left py-2 px-4 hover:bg-blue-500 dark:hover:bg-gray-600 rounded-md ${language === 'fa' ? 'bg-blue-500 dark:bg-gray-600' : ''}`}
                              >
                                فارسی
                              </a>
                            </li>
                          </ul>
                        )}
                      </li>
                      {/* دکمه خروج */}
                      <li>
                        <button
                          onClick={() => { onLogout(); closeMenus(); }}
                          className="w-full text-left py-2 px-4 text-red-300 hover:bg-red-600 dark:text-red-400 dark:hover:bg-red-800 rounded-md flex items-center"
                        >
                          <LogOut className="w-5 h-5 mr-2" /> {t('logout')}
                        </button>
                      </li>
                    </ul>
                  )}
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
  <Link to={to} onClick={onClick} className="block w-full text-left py-2 px-4 hover:bg-blue-700 dark:hover:bg-gray-700 rounded-md flex items-center">
    {Icon && <Icon className="w-5 h-5 mr-2" />}
    {t(textKey)}
  </Link>
);

export default Header;
