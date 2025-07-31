// toto-frontend-user/src/components/Header.js

import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Menu,
  X,
  ChevronDown,
  Home,
  Gamepad2,
  ListChecks,
  ReceiptText,
  Wallet,
  Banknote,
  LifeBuoy,
  PlusCircle,
  Ticket,
  LogOut,
  LogIn,
  PlayIcon,
  Clock,
  Settings,
  Globe,
  Sun,
  Moon,
  HelpCircle
} from 'lucide-react';

function Header({ isAuthenticated, onLogout, currentTheme, toggleTheme }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSupportDropdownOpen, setIsSupportDropdownOpen] = useState(false);
  const [isGamesDropdownOpen, setIsGamesDropdownOpen] = useState(false);
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
  
  const [isSupportMobileDropdownOpen, setIsSupportMobileDropdownOpen] = useState(false);
  const [isGamesMobileDropdownOpen, setIsGamesMobileDropdownOpen] = useState(false);
  const [isSettingsMobileDropdownOpen, setIsSettingsMobileDropdownOpen] = useState(false);

  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isLanguageMobileDropdownOpen, setIsLanguageMobileDropdownOpen] = useState(false);

  const hoveredGamesTimeout = useRef(null);
  const hoveredSupportTimeout = useRef(null);
  const hoveredSettingsTimeout = useRef(null);
  const hoveredLanguageTimeout = useRef(null);

  const { language, setLanguage, t } = useLanguage();

  const HOVER_DELAY = 200;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsSupportDropdownOpen(false);
    setIsGamesDropdownOpen(false);
    setIsSettingsDropdownOpen(false);
    setIsSupportMobileDropdownOpen(false);
    setIsGamesMobileDropdownOpen(false);
    setIsSettingsMobileDropdownOpen(false);
    setIsLanguageDropdownOpen(false);
    setIsLanguageMobileDropdownOpen(false);
    clearAllHoverTimeouts();
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    closeMenus();
  };

  const clearAllHoverTimeouts = () => {
    if (hoveredGamesTimeout.current) clearTimeout(hoveredGamesTimeout.current);
    if (hoveredSupportTimeout.current) clearTimeout(hoveredSupportTimeout.current);
    if (hoveredSettingsTimeout.current) clearTimeout(hoveredSettingsTimeout.current);
    if (hoveredLanguageTimeout.current) clearTimeout(hoveredLanguageTimeout.current);
  };

  const handleDropdownOpen = (setter, timeoutRef, otherSetters = []) => () => {
    clearAllHoverTimeouts();
    timeoutRef.current = setTimeout(() => {
      setter(true);
      otherSetters.forEach(s => s(false));
    }, HOVER_DELAY);
  };

  const handleDropdownClose = (setter, timeoutRef) => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setter(false);
    }, HOVER_DELAY);
  };

  const toggleMobileDropdown = (setter) => () => {
    setter(prevState => !prevState);
    if (setter !== setIsSettingsMobileDropdownOpen) {
        setIsLanguageMobileDropdownOpen(false);
    }
  };

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
    clearAllHoverTimeouts();
  };

  return (
    // Add font-iranyekan here to ensure header uses the new font, or rely on global body font
    <header className="w-full sticky top-0 z-50 font-iranyekan"> {/* NEW: Add font-iranyekan */}
      {/* ردیف بالایی: لوگو و تنظیمات */}
      {/* OLD: bg-gradient-to-r from-blue-700 to-indigo-800 text-white */}
      <div className="bg-clr-surface-a0 text-clr-light-a0 shadow-lg p-4"> {/* NEW */}
        <div className="container mx-auto flex justify-between items-center h-16">
          {/* لوگو/نام سایت */}
          {/* OLD: hover:text-blue-200 */}
          <Link to="/" className="text-3xl font-extrabold tracking-tight hover:text-clr-primary-a30 transition duration-300 ease-in-out"> {/* NEW */}
            TotoGame
          </Link>

          {/* Hamburger menu for mobile & Settings for desktop */}
          <div className="flex items-center space-x-4">
            {/* دکمه همبرگر/بستن (فقط در موبایل) */}
            {/* OLD: hover:bg-blue-600 */}
            <button onClick={toggleMobileMenu} className="md:hidden text-clr-light-a0 focus:outline-none p-1 rounded-md hover:bg-clr-primary-a10 transition duration-200"> {/* NEW */}
              {isMobileMenuOpen ? (
                <X className="w-7 h-7" />
              ) : (
                <Menu className="w-7 h-7" />
              )}
            </button>

            {/* دکمه تغییر تم (فقط در دسکتاپ) */}
            {/* OLD: hover:bg-blue-600 */}
            <button
              onClick={toggleTheme}
              className="hidden md:block text-clr-light-a0 focus:outline-none p-2 rounded-full hover:bg-clr-primary-a10 transition duration-200"
              aria-label="Toggle theme"
            >
              {currentTheme === 'light' ? (
                <Moon className="w-6 h-6" />
              ) : (
                <Sun className="w-6 h-6" />
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
                  clearAllHoverTimeouts();
                }}
                className="hover:text-clr-primary-a30 text-base transition duration-200 px-3 py-2 rounded-md flex items-center focus:outline-none text-lg"
                aria-haspopup="true"
                aria-expanded={isSettingsDropdownOpen}
              >
                <Settings className="w-5 h-5 mr-2" />
                {t('settings')}
                <ChevronDown className={`ml-1 w-4 h-4 transition-transform duration-200 ${isSettingsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSettingsDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-clr-surface-a0 text-clr-dark-a0 dark:text-clr-light-a0 rounded-md shadow-lg ring-1 ring-clr-dark-a0 ring-opacity-5 dark:ring-clr-surface-a30 z-50 transform origin-top-right animate-scaleIn transition-colors duration-300"> {/* NEW */}
                  {/* دراپ‌داون زبان در منوی Settings */}
                  <div
                    className="relative w-full text-left px-4 py-2 hover:bg-clr-surface-a10 transition duration-150 rounded-t-md" // OLD: hover:bg-blue-100 dark:hover:bg-blue-800, NEW: hover:bg-clr-surface-a10
                    onMouseEnter={handleDropdownOpen(setIsLanguageDropdownOpen, hoveredLanguageTimeout, [])}
                    onMouseLeave={handleDropdownClose(setIsLanguageDropdownOpen, hoveredLanguageTimeout)}
                  >
                    {/* OLD: text-gray-800 dark:text-gray-200 */}
                    <button
                      onClick={() => {
                        setIsLanguageDropdownOpen(prevState => !prevState);
                        clearAllHoverTimeouts();
                      }}
                      className="flex items-center justify-between w-full text-clr-dark-a0 dark:text-clr-light-a0 focus:outline-none" // NEW
                    >
                      <span className="flex items-center">
                        <Globe className="w-4 h-4 mr-2" />
                        {t('language')}
                      </span>
                      <ChevronDown className={`ml-1 w-4 h-4 transition-transform duration-200 ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isLanguageDropdownOpen && (
                      <ul className="absolute left-full top-0 ml-1 w-32 bg-clr-surface-a0 text-clr-dark-a0 dark:text-clr-light-a0 rounded-md shadow-lg ring-1 ring-clr-dark-a0 ring-opacity-5 dark:ring-clr-surface-a20 z-50 animate-scaleIn transition-colors duration-300"> {/* NEW */}
                        <li>
                          <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); handleLanguageChange('en'); }}
                            className={`flex items-center px-4 py-2 hover:bg-clr-surface-a10 transition duration-150 ${language === 'en' ? 'bg-clr-surface-a10 text-clr-primary-a0' : ''}`} // NEW: Note: text-clr-primary-a0 for active language text
                          >
                            English
                          </a>
                        </li>
                        <li>
                          <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); handleLanguageChange('fa'); }}
                            className={`flex items-center px-4 py-2 hover:bg-clr-surface-a10 transition duration-150 ${language === 'fa' ? 'bg-clr-surface-a10 text-clr-primary-a0' : ''}`} // NEW
                          >
                            فارسی
                          </a>
                        </li>
                      </ul>
                    )}
                  </div>
                  {/* دکمه خروج */}
                  {/* OLD: text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800 */}
                  <button
                    onClick={() => { onLogout(); closeMenus(); }}
                    className="flex items-center w-full px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800 transition duration-150 rounded-b-md" // Keep red for warnings/danger
                  >
                    <LogOut className="w-4 h-4 mr-2" /> {t('logout')}
                  </button>
                </div>
              )}
            </div>

            {!isAuthenticated && (
              <Link
                to="/auth"
                className="hidden md:flex bg-clr-primary-a0 hover:bg-clr-primary-a10 text-clr-light-a0 font-bold py-2 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg items-center text-lg" // NEW
                onClick={closeMenus}
              >
                <LogIn className="w-5 h-5 mr-2" /> {t('login_register')}
              </Link>
            )}
          </div>
        </div>
      </div>

      {isAuthenticated && (
        <nav className="hidden md:block bg-clr-primary-a0 dark:bg-clr-surface-tonal-a0 text-clr-light-a0 shadow-md py-2 transition-colors duration-300"> {/* NEW */}
          <div className="container mx-auto flex justify-center items-center space-x-6 text-lg relative">
            <NavLink to="/dashboard" t={t} icon={Home} textKey="dashboard" onClick={closeMenus} />
            
            {/* دسته بازی‌ها - Dropdown برای دسکتاپ */}
            <div
              className="relative"
              onMouseEnter={handleDropdownOpen(setIsGamesDropdownOpen, hoveredGamesTimeout, [setIsSupportDropdownOpen, setIsSettingsDropdownOpen])}
              onMouseLeave={handleDropdownClose(setIsGamesDropdownOpen, hoveredGamesTimeout)}
            >
              {/* OLD: hover:text-blue-200 */}
              <button
                onClick={() => {
                  setIsGamesDropdownOpen(prevState => !prevState);
                  clearAllHoverTimeouts();
                }}
                className="hover:text-clr-primary-a30 text-base transition duration-200 px-3 py-2 rounded-md flex items-center focus:outline-none" // NEW
                aria-haspopup="true"
                aria-expanded={isGamesDropdownOpen}
              >
                <Gamepad2 className="w-5 h-5 mr-2" />
                {t('games')}
                <ChevronDown className={`ml-1 w-4 h-4 transition-transform duration-200 ${isGamesDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isGamesDropdownOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 bg-clr-surface-a0 text-clr-dark-a0 dark:text-clr-light-a0 rounded-md shadow-lg ring-1 ring-clr-dark-a0 ring-opacity-5 dark:ring-clr-surface-a30 z-50 transform origin-top animate-scaleIn transition-colors duration-300">
                  <Link
                    to="/games"
                    className="flex items-center px-4 py-2 hover:bg-clr-surface-a10 transition duration-150 rounded-t-md" // NEW
                    onClick={closeMenus}
                  >
                    <PlayIcon className="w-4 h-4 mr-2" /> {t('active_games')}
                  </Link>
                  <Link
                    to="/expired-games"
                    className="flex items-center px-4 py-2 hover:bg-clr-surface-a10 transition duration-150 rounded-b-md" // NEW
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

            <div
              className="relative"
              onMouseEnter={handleDropdownOpen(setIsSupportDropdownOpen, hoveredSupportTimeout, [setIsGamesDropdownOpen, setIsSettingsDropdownOpen])}
              onMouseLeave={handleDropdownClose(setIsSupportDropdownOpen, hoveredSupportTimeout)}
            >
              <button
                onClick={() => {
                  setIsSupportDropdownOpen(prevState => !prevState);
                  clearAllHoverTimeouts();
                }}
                className="hover:text-clr-primary-a30 text-base transition duration-200 px-3 py-2 rounded-md flex items-center focus:outline-none" // NEW
                aria-haspopup="true"
                aria-expanded={isSupportDropdownOpen}
              >
                <LifeBuoy className="w-5 h-5 mr-2" />
                {t('role_support')}
                <ChevronDown className={`ml-1 w-4 h-4 transition-transform duration-200 ${isSupportDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSupportDropdownOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 bg-clr-surface-a0 text-clr-dark-a0 dark:text-clr-light-a0 rounded-md shadow-lg ring-1 ring-clr-dark-a0 ring-opacity-5 dark:ring-clr-surface-a30 z-50 transform origin-top animate-scaleIn transition-colors duration-300">
                  <Link
                    to="/support/create"
                    className="flex items-center px-4 py-2 hover:bg-clr-surface-a10 transition duration-150 rounded-t-md" // NEW
                    onClick={closeMenus}
                  >
                    <PlusCircle className="w-4 h-4 mr-2" /> {t('create_ticket')}
                  </Link>
                  <Link
                    to="/support/my-tickets"
                    className="flex items-center px-4 py-2 hover:bg-clr-surface-a10 transition duration-150 rounded-b-md" // NEW
                    onClick={closeMenus}
                  >
                    <Ticket className="w-4 h-4 mr-2" /> {t('my_tickets')}
                  </Link>
                </div>
              )}
            </div>
            <NavLink to="/faq" t={t} icon={HelpCircle} textKey="faq_title" onClick={closeMenus} />
          </div>
        </nav>
      )}

      {isMobileMenuOpen && (
        <div className="md:hidden bg-clr-primary-a0 dark:bg-clr-surface-a0 mt-0 py-2 rounded-b-lg shadow-inner animate-slideDown transition-colors duration-300"> {/* NEW */}
          <ul className="flex flex-col items-start space-y-3 text-lg px-4">
            <li>
                <button
                    onClick={toggleTheme}
                    className="w-full text-left text-clr-light-a0 focus:outline-none p-2 rounded-md hover:bg-clr-primary-a10 transition duration-200 flex items-center" // NEW
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
                    className="w-full flex justify-between items-center py-2 px-4 hover:bg-clr-primary-a10 rounded-md focus:outline-none" // NEW
                  >
                    <span className="flex items-center"><Gamepad2 className="w-5 h-5 mr-2" />{t('games')}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isGamesMobileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isGamesMobileDropdownOpen && (
                    <ul className="bg-clr-primary-a10 dark:bg-clr-surface-a10 mt-1 rounded-md shadow-inner w-full animate-slideDown transition-colors duration-300"> {/* NEW */}
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
                    className="w-full flex justify-between items-center py-2 px-4 hover:bg-clr-primary-a10 rounded-md focus:outline-none" // NEW
                  >
                    <span className="flex items-center"><LifeBuoy className="w-5 h-5 mr-2" />{t('role_support')}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSupportMobileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isSupportMobileDropdownOpen && (
                    <ul className="bg-clr-primary-a10 dark:bg-clr-surface-a10 mt-1 rounded-md shadow-inner w-full animate-slideDown transition-colors duration-300"> {/* NEW */}
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
                    className="w-full flex justify-between items-center py-2 px-4 hover:bg-clr-primary-a10 rounded-md focus:outline-none" // NEW
                  >
                    <span className="flex items-center"><Settings className="w-5 h-5 mr-2" />{t('settings')}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSettingsMobileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isSettingsMobileDropdownOpen && (
                    <ul className="bg-clr-primary-a10 dark:bg-clr-surface-a10 mt-1 rounded-md shadow-inner w-full animate-slideDown transition-colors duration-300">
                      <li>
                        <button
                          onClick={toggleMobileDropdown(setIsLanguageMobileDropdownOpen)}
                          className="w-full flex justify-between items-center py-2 px-4 text-left hover:bg-clr-primary-a20 rounded-md focus:outline-none" // NEW
                        >
                          <span className="flex items-center">
                            <Globe className="w-5 h-5 mr-2" /> {t('language')}
                          </span>
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isLanguageMobileDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isLanguageMobileDropdownOpen && (
                          <ul className="bg-clr-primary-a20 dark:bg-clr-surface-a20 mt-1 rounded-md shadow-inner w-full animate-slideDown transition-colors duration-300"> {/* NEW */}
                            <li>
                              <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); handleLanguageChange('en'); }}
                                className={`block w-full text-left py-2 px-4 hover:bg-clr-primary-a30 rounded-md ${language === 'en' ? 'bg-clr-primary-a30' : ''}`} // NEW
                              >
                                English
                              </a>
                            </li>
                            <li>
                              <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); handleLanguageChange('fa'); }}
                                className={`block w-full text-left py-2 px-4 hover:bg-clr-primary-a30 rounded-md ${language === 'fa' ? 'bg-clr-primary-a30' : ''}`} // NEW
                              >
                                فارسی
                              </a>
                            </li>
                          </ul>
                        )}
                      </li>
                      <li>
                        <button
                          onClick={() => { onLogout(); closeMenus(); }}
                          className="w-full text-left py-2 px-4 text-red-300 hover:bg-red-600 dark:text-red-400 dark:hover:bg-red-800 rounded-md flex items-center" // Keep red for warnings/danger
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
                  className="w-full bg-clr-primary-a0 hover:bg-clr-primary-a10 text-clr-light-a0 py-2 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg flex items-center justify-center" // NEW
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
  // Apply font-iranyekan here if it's not universally applied by body or parent
  <Link to={to} className="hover:text-clr-primary-a30 text-base transition duration-200 px-3 py-2 rounded-md flex items-center" onClick={onClick}>
    {Icon && <Icon className="w-5 h-5 mr-2" />}
    {t(textKey)}
  </Link>
);

// کامپوننت کمکی برای لینک‌های ناوبری موبایل
const NavLinkMobile = ({ to, t, icon: Icon, textKey, onClick }) => (
  // Apply font-iranyekan here if it's not universally applied by body or parent
  <Link to={to} onClick={onClick} className="block w-full text-left py-2 px-4 hover:bg-clr-primary-a10 rounded-md flex items-center">
    {Icon && <Icon className="w-5 h-5 mr-2" />}
    {t(textKey)}
  </Link>
);

export default Header;