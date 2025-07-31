// toto-frontend-user/src/App.js
// فایل اصلی اپلیکیشن React پنل کاربری

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Header from './components/Header';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import OpenTotoGames from './components/OpenTotoGames';
import MyPredictions from './components/MyPredictions';
import Deposit from './components/Deposit';
import Withdraw from './components/Withdraw';
import MyTransactions from './components/MyTransactions';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import CreateTicket from './components/CreateTicket';
import MyTickets from './components/MyTickets';
import ExpiredGames from './components/ExpiredGames';
import Footer from './components/Footer';
import FAQ from './components/FAQ';

axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL || 'https://lotto.green/api';
axios.defaults.withCredentials = true;

const AuthWrapper = ({ onLoginSuccess }) => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const referrerUsername = queryParams.get('ref');

  useEffect(() => {
    if (referrerUsername && location.search.includes('ref=')) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('ref');
      window.history.replaceState({}, document.title, newUrl.pathname + newUrl.search);
    }
  }, [referrerUsername, location.search]);

  return <Auth onLoginSuccess={onLoginSuccess} initialReferrerUsername={referrerUsername} />;
};


function RootApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const { t } = useLanguage();

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        await axios.get('/users/profile');
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth verification failed:', error.response?.data?.message || error.message);
        setIsAuthenticated(false);
        try {
          await axios.post('/auth/logout');
        } catch (logoutErr) {
          console.warn('Error during auto-logout after auth verification failed:', logoutErr.message);
        }
      } finally {
        setLoadingAuth(false);
      }
    };
    verifyAuth();
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch (err) {
      console.warn('Logout request failed (but continuing anyway):', err.message);
    }
    setIsAuthenticated(false);
  };

  if (loadingAuth) {
    // OLD: bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200
    return (
      <div className="min-h-screen flex items-center justify-center bg-clr-surface-a10 dark:bg-clr-surface-a0 text-clr-dark-a0 dark:text-clr-light-a0"> {/* NEW */}
        <p>{t('loading')}</p>
      </div>
    );
  }

  return (
    <Router>
      {/* OLD: bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 */}
      <div className="App bg-clr-surface-a0 text-clr-dark-a0 dark:text-clr-light-a0 min-h-screen flex flex-col transition-colors duration-300"> {/* NEW */}
        <Header
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
          currentTheme={theme}
          toggleTheme={toggleTheme}
        />
        <main className="flex-grow container mx-auto p-4">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthWrapper onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/auth" replace />} />
            <Route path="/games" element={isAuthenticated ? <OpenTotoGames /> : <Navigate to="/auth" replace />} />
            <Route path="/my-predictions" element={isAuthenticated ? <MyPredictions /> : <Navigate to="/auth" replace />} />
            <Route path="/deposit" element={isAuthenticated ? <Deposit currentTheme={theme} /> : <Navigate to="/auth" replace />} />
            <Route path="/my-transactions" element={isAuthenticated ? <MyTransactions /> : <Navigate to="/auth" replace />} />
            <Route path="/withdraw" element={isAuthenticated ? <Withdraw /> : <Navigate to="/auth" replace />} />
            <Route path="/support/create" element={isAuthenticated ? <CreateTicket /> : <Navigate to="/auth" replace />} />
            <Route path="/support/my-tickets" element={isAuthenticated ? <MyTickets /> : <Navigate to="/auth" replace />} />
            <Route path="/expired-games" element={isAuthenticated ? <ExpiredGames /> : <Navigate to="/auth" replace />} />
            <Route path="/faq" element={<FAQ />} />
            {/* Keep red for page not found message */}
            <Route path="*" element={<h2 className="text-center text-red-500 dark:text-red-300 text-3xl font-bold mt-20">{t('page_not_found')}</h2>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

function App() {
  return (
    <LanguageProvider>
      <RootApp />
    </LanguageProvider>
  );
}

export default App;