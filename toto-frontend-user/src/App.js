// toto-frontend-user/src/App.js
// فایل اصلی اپلیکیشن React پنل کاربری

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'; // useNavigate حذف شد زیرا دیگر نیازی نیست
import axios from 'axios';
import Header from './components/Header';
import Auth from './components/Auth'; // شامل Login و Register
import Dashboard from './components/Dashboard';
import OpenTotoGames from './components/OpenTotoGames';
import MyPredictions from './components/MyPredictions';
import Deposit from './components/Deposit';
import Withdraw from './components/Withdraw'; // <--- اضافه شده: کامپوننت برداشت وجه
import MyTransactions from './components/MyTransactions';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext'; // <--- اضافه شده
import CreateTicket from './components/CreateTicket'; // <--- اضافه شده
import MyTickets from './components/MyTickets'; // <--- اضافه شده

// کامپوننت Wrapper برای Auth تا به useLocation دسترسی داشته باشد
const AuthWrapper = ({ onLoginSuccess, API_BASE_URL }) => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const referrerUsername = queryParams.get('ref');

  useEffect(() => {
    // پاک کردن پارامتر 'ref' از URL پس از خواندن آن
    // این کار URL را تمیز نگه می‌دارد و از مشکلات احتمالی جلوگیری می‌کند
    if (referrerUsername && location.search.includes('ref=')) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('ref');
      // استفاده از replaceState برای تغییر URL بدون اضافه کردن به تاریخچه مرورگر
      window.history.replaceState({}, document.title, newUrl.pathname + newUrl.search);
    }
  }, [referrerUsername, location.search]);

  return <Auth onLoginSuccess={onLoginSuccess} API_BASE_URL={API_BASE_URL} initialReferrerUsername={referrerUsername} />;
};


// کامپوننت ریشه با LanguageProvider
function RootApp() {
  const [token, setToken] = useState(localStorage.getItem('userToken') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const { t } = useLanguage(); // استفاده از هوک زبان برای ترجمه متن

  // تعیین URL پایه برای API بک‌اند
  const API_BASE_URL = 'https://lotto.green/api'; // مطمئن شوید که این URL صحیح است

  // بررسی وضعیت احراز هویت هنگام بارگذاری اپلیکیشن یا تغییر توکن
  useEffect(() => {
    const verifyAuth = async () => {
      if (token) {
        try {
          await axios.get(`${API_BASE_URL}/users/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Token verification failed:', error);
          setToken('');
          localStorage.removeItem('userToken');
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setLoadingAuth(false);
    };
    verifyAuth();
  }, [token, API_BASE_URL]);

  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
    localStorage.setItem('userToken', newToken);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('userToken');
    setIsAuthenticated(false);
  };

  if (loadingAuth) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-100">{t('loading')}</div>; // ترجمه شده
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Header isAuthenticated={isAuthenticated} onLogout={handleLogout} />
        <main className="flex-grow container mx-auto p-4">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthWrapper onLoginSuccess={handleLoginSuccess} API_BASE_URL={API_BASE_URL} />} />
            <Route path="/dashboard" element={isAuthenticated ? <Dashboard token={token} API_BASE_URL={API_BASE_URL} /> : <Navigate to="/auth" replace />} />
            <Route path="/games" element={isAuthenticated ? <OpenTotoGames token={token} API_BASE_URL={API_BASE_URL} /> : <Navigate to="/auth" replace />} />
            <Route path="/my-predictions" element={isAuthenticated ? <MyPredictions token={token} API_BASE_URL={API_BASE_URL} /> : <Navigate to="/auth" replace />} />
            <Route path="/deposit" element={isAuthenticated ? <Deposit token={token} API_BASE_URL={API_BASE_URL} /> : <Navigate to="/auth" replace />} />
            <Route path="/my-transactions" element={isAuthenticated ? <MyTransactions token={token} API_BASE_URL={API_BASE_URL} /> : <Navigate to="/auth" replace />} />
            <Route path="/withdraw" element={isAuthenticated ? <Withdraw token={token} API_BASE_URL={API_BASE_URL} /> : <Navigate to="/auth" replace />} /> 
            <Route path="/support/create" element={isAuthenticated ? <CreateTicket token={token} API_BASE_URL={API_BASE_URL} /> : <Navigate to="/auth" replace />} />
          <Route path="/support/my-tickets" element={isAuthenticated ? <MyTickets token={token} API_BASE_URL={API_BASE_URL} /> : <Navigate to="/auth" replace />} />
            <Route path="*" element={<h2 className="text-center text-red-500 text-3xl font-bold mt-20">{t('page_not_found')}</h2>} /> {/* ترجمه شده */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

// رندر کردن RootApp با LanguageProvider
function App() {
  return (
    <LanguageProvider>
      <RootApp />
    </LanguageProvider>
  );
}

export default App;