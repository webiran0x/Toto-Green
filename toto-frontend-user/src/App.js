// toto-frontend-user/src/App.js
// فایل اصلی اپلیکیشن React پنل کاربری

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios'; // axios ایمپورت شده است
import Header from './components/Header';
import Auth from './components/Auth'; // شامل Login و Register
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
import Footer from './components/Footer'; // ایمپورت کامپوننت فوتر
import FAQ from './components/FAQ'; // ایمپورت کامپوننت FAQ

// آدرس پایه API رو اینجا برای Axios به صورت سراسری تنظیم می‌کنیم.
// این باعث میشه نیازی به تکرار 'https://lotto.green/api' در هر درخواست نباشه.
// فرض می‌کنیم این URL از متغیر محیطی REACT_APP_API_BASE_URL میاد.
// اگر در فایل .env پروژه کاربری، REACT_APP_API_BASE_URL تعریف شده باشد، از آن استفاده می‌شود.
// در غیر این صورت، از 'https://lotto.green/api' استفاده می‌شود.
axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL || 'https://lotto.green/api';

// این خط بسیار مهمه: به Axios میگه که کوکی‌ها رو در درخواست‌ها ارسال کنه.
// با توجه به اینکه بک‌اند شما از HttpOnly cookie استفاده می‌کنه، این تنظیم لازمه.
axios.defaults.withCredentials = true;

// کامپوننت Wrapper برای Auth تا به useLocation دسترسی داشته باشد
const AuthWrapper = ({ onLoginSuccess }) => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const referrerUsername = queryParams.get('ref');

  useEffect(() => {
    // پاک کردن پارامتر 'ref' از URL پس از خواندن آن
    if (referrerUsername && location.search.includes('ref=')) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('ref');
      window.history.replaceState({}, document.title, newUrl.pathname + newUrl.search);
    }
  }, [referrerUsername, location.search]);

  return <Auth onLoginSuccess={onLoginSuccess} initialReferrerUsername={referrerUsername} />;
};


// کامپوننت ریشه با LanguageProvider
function RootApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const { t } = useLanguage();

  // 1. وضعیت تم: ابتدا از localStorage بخوانید، در غیر این صورت 'light'
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  // 2. useEffect برای اعمال کلاس 'dark' به <html> و ذخیره در localStorage
  useEffect(() => {
    const root = document.documentElement; // عنصر <html>
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 3. تابع برای تغییر تم
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // بررسی وضعیت احراز هویت هنگام بارگذاری اپلیکیشن
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // Axios به طور خودکار کوکی احراز هویت را ارسال می‌کند.
        // اگر کوکی معتبر باشد، سرور 200 OK برمی‌گرداند.
        await axios.get('/users/profile'); // مسیر بدون API_BASE_URL، چون در axios.defaults تنظیم شده
        setIsAuthenticated(true);
      } catch (error) {
        // اگر 401 Unauthorized یا خطای دیگری رخ داد، یعنی احراز هویت ناموفق است.
        console.error('Auth verification failed:', error.response?.data?.message || error.message);
        setIsAuthenticated(false);
        // اگر خطای احراز هویت بود، کوکی را از سمت سرور پاک می‌کنیم (در صورت وجود)
        try {
          await axios.post('/auth/logout'); // مسیر بدون API_BASE_URL
        } catch (logoutErr) {
          console.warn('Error during auto-logout after auth verification failed:', logoutErr.message);
        }
      } finally {
        setLoadingAuth(false);
      }
    };
    verifyAuth();
  }, []); // فقط یک بار هنگام mount شدن کامپوننت اجرا می‌شود

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await axios.post('/auth/logout'); // درخواست به بک‌اند برای پاک کردن کوکی HttpOnly
    } catch (err) {
      console.warn('Logout request failed (but continuing anyway):', err.message);
    }
    setIsAuthenticated(false);
  };

  if (loadingAuth) {
    // 4. استایل‌دهی اولیه برای تم در صفحه بارگذاری
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <p>{t('loading')}</p>
      </div>
    );
  }

  return (
    <Router>
      {/* 5. ارسال وضعیت تم و تابع تغییر تم به Header */}
      <div className="App bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 min-h-screen flex flex-col transition-colors duration-300"> {/* flex-col برای چیدمان عمودی */}
        <Header
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
          currentTheme={theme} // تم فعلی
          toggleTheme={toggleTheme} // تابع تغییر تم
        />
        <main className="flex-grow container mx-auto p-4"> {/* flex-grow برای پر کردن فضای باقی‌مانده */}
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthWrapper onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/auth" replace />} />
            <Route path="/games" element={isAuthenticated ? <OpenTotoGames /> : <Navigate to="/auth" replace />} />
            <Route path="/my-predictions" element={isAuthenticated ? <MyPredictions /> : <Navigate to="/auth" replace />} />
            <Route path="/deposit" element={isAuthenticated ? <Deposit currentTheme={theme} /> : <Navigate to="/auth" replace />} /> {/* <--- currentTheme به Deposit ارسال شد */}
            <Route path="/my-transactions" element={isAuthenticated ? <MyTransactions /> : <Navigate to="/auth" replace />} />
            <Route path="/withdraw" element={isAuthenticated ? <Withdraw /> : <Navigate to="/auth" replace />} />
            <Route path="/support/create" element={isAuthenticated ? <CreateTicket /> : <Navigate to="/auth" replace />} />
            <Route path="/support/my-tickets" element={isAuthenticated ? <MyTickets /> : <Navigate to="/auth" replace />} />
            <Route path="/expired-games" element={isAuthenticated ? <ExpiredGames /> : <Navigate to="/auth" replace />} />
            <Route path="/faq" element={<FAQ />} /> {/* مسیر جدید برای FAQ */}
            <Route path="*" element={<h2 className="text-center text-red-500 dark:text-red-300 text-3xl font-bold mt-20">{t('page_not_found')}</h2>} />
          </Routes>
        </main>
        <Footer /> {/* اضافه کردن کامپوننت فوتر */}
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
