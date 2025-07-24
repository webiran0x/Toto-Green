// toto-frontend-user/src/components/Header.js

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

function Header({ isAuthenticated, onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSupportDropdownOpen, setIsSupportDropdownOpen] = useState(false);
  const [isSupportMobileDropdownOpen, setIsSupportMobileDropdownOpen] = useState(false);

  const { language, setLanguage, t } = useLanguage();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsSupportMobileDropdownOpen(false);
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

  return (
    <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-lg p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-3xl font-extrabold tracking-tight hover:text-blue-200 transition duration-300 ease-in-out">
          TotoGame
        </Link>

        {/* Hamburger menu for mobile */}
        <div className="md:hidden flex items-center space-x-4">
          <select
            value={language}
            onChange={handleLanguageChange}
            className="bg-blue-600 border border-blue-500 text-white rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="fa">فارسی</option>
            <option value="en">English</option>
          </select>
          <button onClick={toggleMobileMenu} className="text-white focus:outline-none">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              )}
            </svg>
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-lg relative">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="hover:text-blue-200 transition duration-200 px-3 py-2 rounded-md">
                {t('dashboard')}
              </Link>
              <Link to="/games" className="hover:text-blue-200 transition duration-200 px-3 py-2 rounded-md">
                {t('games')}
              </Link>
              <Link to="/my-predictions" className="hover:text-blue-200 transition duration-200 px-3 py-2 rounded-md">
                {t('my_predictions')}
              </Link>
              <Link to="/my-transactions" className="hover:text-blue-200 transition duration-200 px-3 py-2 rounded-md">
                {t('transactions')}
              </Link>
              <Link to="/deposit" className="hover:text-blue-200 transition duration-200 px-3 py-2 rounded-md">
                {t('deposit')}
              </Link>
              <Link to="/withdraw" className="hover:text-blue-200 transition duration-200 px-3 py-2 rounded-md">
                {t('withdraw')}
              </Link>

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
                  {t('role_support')}
                  <svg
                    className="ml-1 w-4 h-4 fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M5.516 7.548L10 12.032l4.484-4.484 1.032 1.032L10 14.096 4.484 8.58z" />
                  </svg>
                </button>

                {isSupportDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg text-black ring-1 ring-black ring-opacity-5 z-50">
                    <Link
                      to="/support/create"
                      className="block px-4 py-2 hover:bg-blue-100"
                      onClick={() => setIsSupportDropdownOpen(false)}
                    >
                      {t('create_ticket')}
                    </Link>
                    <Link
                      to="/support/my-tickets"
                      className="block px-4 py-2 hover:bg-blue-100"
                      onClick={() => setIsSupportDropdownOpen(false)}
                    >
                      {t('my_tickets')}
                    </Link>
                  </div>
                )}
              </div>

              <select
                value={language}
                onChange={handleLanguageChange}
                className="bg-blue-600 border border-blue-500 text-white rounded-md px-2 py-1 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="fa">فارسی</option>
                <option value="en">English</option>
              </select>

              <button
                onClick={onLogout}
                className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition duration-200 shadow-md hover:shadow-lg"
              >
                {t('logout')}
              </button>
            </>
          ) : (
            <>
              <select
                value={language}
                onChange={handleLanguageChange}
                className="bg-blue-600 border border-blue-500 text-white rounded-md px-2 py-1 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="fa">فارسی</option>
                <option value="en">English</option>
              </select>
              <Link
                to="/auth"
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition duration-200 shadow-md hover:shadow-lg"
              >
                {t('login_register')}
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-blue-800 mt-4 py-2 rounded-lg shadow-inner">
          <ul className="flex flex-col items-center space-y-3 text-lg px-4">
            {isAuthenticated ? (
              <>
                <li>
                  <Link
                    to="/dashboard"
                    onClick={toggleMobileMenu}
                    className="block w-full text-center py-2 px-4 hover:bg-blue-700 rounded-md"
                  >
                    {t('dashboard')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/games"
                    onClick={toggleMobileMenu}
                    className="block w-full text-center py-2 px-4 hover:bg-blue-700 rounded-md"
                  >
                    {t('games')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/my-predictions"
                    onClick={toggleMobileMenu}
                    className="block w-full text-center py-2 px-4 hover:bg-blue-700 rounded-md"
                  >
                    {t('my_predictions')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/my-transactions"
                    onClick={toggleMobileMenu}
                    className="block w-full text-center py-2 px-4 hover:bg-blue-700 rounded-md"
                  >
                    {t('transactions')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/deposit"
                    onClick={toggleMobileMenu}
                    className="block w-full text-center py-2 px-4 hover:bg-blue-700 rounded-md"
                  >
                    {t('deposit')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/withdraw"
                    onClick={toggleMobileMenu}
                    className="block w-full text-center py-2 px-4 hover:bg-blue-700 rounded-md"
                  >
                    {t('withdraw')}
                  </Link>
                </li>

                {/* دسته پشتیبانی موبایل */}
                <li>
                  <button
                    onClick={toggleSupportMobileDropdown}
                    className="w-full flex justify-between items-center py-2 px-4 hover:bg-blue-700 rounded-md focus:outline-none"
                  >
                    <span>{t('role_support')}</span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isSupportMobileDropdownOpen ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  {isSupportMobileDropdownOpen && (
                    <ul className="bg-blue-700 mt-1 rounded-md shadow-inner">
                      <li>
                        <Link
                          to="/support/create"
                          onClick={() => {
                            toggleMobileMenu();
                            setIsSupportMobileDropdownOpen(false);
                          }}
                          className="block py-2 px-4 hover:bg-blue-600 rounded-md"
                        >
                          {t('create_ticket')}
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/support/my-tickets"
                          onClick={() => {
                            toggleMobileMenu();
                            setIsSupportMobileDropdownOpen(false);
                          }}
                          className="block py-2 px-4 hover:bg-blue-600 rounded-md"
                        >
                          {t('my_tickets')}
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>

                <li>
                  <button
                    onClick={() => {
                      onLogout();
                      toggleMobileMenu();
                    }}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition duration-200 shadow-md hover:shadow-lg"
                  >
                    {t('logout')}
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link
                  to="/auth"
                  onClick={toggleMobileMenu}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition duration-200 shadow-md hover:shadow-lg"
                >
                  {t('login_register')}
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}

export default Header;
