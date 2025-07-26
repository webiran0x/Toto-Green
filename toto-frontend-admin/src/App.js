// toto-frontend-admin/src/App.js
// فایل اصلی اپلیکیشن React پنل مدیریت

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';

// کامپوننت‌ها
import AdminLogin from './components/AdminLogin';
import Dashboard from './components/Dashboard';
import CreateTotoGame from './components/CreateTotoGame';
import SetResults from './components/SetResults';
import ViewPredictions from './components/ViewPredictions';
import AllTotoGames from './components/AllTotoGames';
import ManageUsers from './components/ManageUsers';
import EditUser from './components/EditUser';
import ManageTransactions from './components/ManageTransactions';
import ExternalApiSync from './components/ExternalApiSync';
import SystemLogs from './components/SystemLogs';
import ManageCryptoDeposits from './components/ManageCryptoDeposits';
import Settings from './components/Settings';
import ManageWithdrawals from './components/ManageWithdrawals';

import AdminHeader from './components/AdminHeader';

// زبان
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

// آدرس پایه API رو اینجا برای Axios به صورت سراسری تنظیم می‌کنیم.
// این باعث میشه نیازی به تکرار 'https://lotto.green/api' در هر درخواست نباشه.
// فرض می‌کنیم این URL از متغیر محیطی REACT_APP_API_BASE_URL میاد.
axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL || 'https://lotto.green/api'; // <-- تغییر: اطمینان حاصل کنید که "/api" در اینجا وجود دارد.

// این خط بسیار مهمه: به Axios میگه که کوکی‌ها رو در درخواست‌ها ارسال کنه.
// با توجه به اینکه بک‌اند شما از HttpOnly cookie استفاده می‌کنه، این تنظیم لازمه.
axios.defaults.withCredentials = true;

function RootApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const { t } = useLanguage();
  const navigate = useNavigate();

  // بررسی اعتبار با کوکی:
  // این تابع بررسی می‌کنه که آیا کاربر فعلی (که کوکی رو داره) ادمین هست یا نه.
  // اگه کوکی معتبر و شامل نقش ادمین باشه، کاربر احراز هویت شده در نظر گرفته میشه.
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // Axios به صورت خودکار کوکی احراز هویت رو (به خاطر axios.defaults.withCredentials = true) ارسال می‌کنه.
        const res = await axios.get('/admin/profile'); // مسیر بدون baseURL، چون در axios.defaults تنظیم شده.
        if (res.data?.role === 'admin') {
          setIsAuthenticated(true);
        } else {
          // اگه کاربر نقش ادمین نداشت، حتی اگه لاگین کرده بود، خارجش می‌کنیم.
          console.warn('User is authenticated but not an admin. Logging out.');
          await axios.post('/auth/logout'); // پاک کردن کوکی
          setIsAuthenticated(false);
        }
      } catch (error) {
        // اگه درخواست با خطا مواجه شد (مثلاً 401 Unauthorized چون کوکی معتبر نیست)،
        // کاربر احراز هویت نشده تلقی میشه.
        console.error('Auth verification failed:', error.response?.data?.message || error.message);
        setIsAuthenticated(false);
      } finally {
        setLoadingAuth(false);
      }
    };

    verifyAuth();
  }, []); // این useEffect فقط یک بار هنگام بارگذاری کامپوننت اجرا میشه.

  // ورود موفق: این تابع وقتی AdminLogin با موفقیت کاربر رو لاگین کرد فراخوانی میشه.
  // نیازی به دریافت توکن به عنوان آرگومان نداره، چون مدیریت کوکی خودکاره.
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    // بعد از ورود موفق، کاربر رو به داشبورد هدایت می‌کنیم.
    navigate('/admin/dashboard', { replace: true });
  };

  // خروج ادمین: این تابع وقتی کاربر روی دکمه خروج کلیک می‌کنه فراخوانی میشه.
  const handleLogout = async () => {
    try {
      // درخواست به بک‌اند برای پاک کردن کوکی احراز هویت
      await axios.post('/auth/logout');
    } catch (err) {
      console.warn('Logout request failed (but continuing anyway):', err.message);
      // حتی اگه خطایی در سمت سرور رخ داد، در فرانت‌اند وضعیت رو به حالت لاگ‌اوت تغییر میدیم.
    }
    setIsAuthenticated(false);
    // کاربر رو به صفحه لاگین هدایت می‌کنیم.
    navigate('/admin/login', { replace: true });
  };

  // نمایش وضعیت بارگذاری اولیه
  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        {t('loading')}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* هدر ادمین که شامل دکمه خروج هم هست */}
      <AdminHeader isAuthenticated={isAuthenticated} onLogout={handleLogout} />
      <main className="flex-grow container mx-auto p-4">
        <Routes>
          {/* ریدایرکت از روت اصلی به مسیر /admin */}
          <Route path="/" element={<Navigate to="/admin" replace />} />
          {/* مدیریت مسیر /admin: اگه لاگین کرده، به داشبورد برو، وگرنه به لاگین */}
          <Route path="/admin" element={isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/admin/login" replace />} />

          {/* صفحه لاگین: اگه کاربر لاگین کرده باشه، به داشبورد هدایت میشه */}
          <Route
            path="/admin/login"
            element={isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin onLoginSuccess={handleLoginSuccess} />}
          />

          {/* صفحات محافظت‌شده: فقط در صورتی قابل دسترسی هستند که کاربر احراز هویت شده باشه */}
          {isAuthenticated ? (
            <>
              <Route path="/admin/dashboard" element={<Dashboard />} /> {/* API_BASE_URL دیگه لازم نیست به عنوان پراپ پاس داده بشه */}
              <Route path="/admin/users" element={<ManageUsers />} />
              <Route path="/admin/users/:userId" element={<EditUser />} />
              <Route path="/admin/games/create" element={<CreateTotoGame />} />
              <Route path="/admin/games/set-results" element={<SetResults />} />
              <Route path="/admin/games/view-predictions" element={<ViewPredictions />} />
              <Route path="/admin/games/all" element={<AllTotoGames />} />
              <Route path="/admin/transactions" element={<ManageTransactions />} />
              <Route path="/admin/manage-withdrawals" element={<ManageWithdrawals />} />
              <Route path="/admin/external-sync" element={<ExternalApiSync />} />
              <Route path="/admin/system-logs" element={<SystemLogs />} />
              <Route path="/admin/settings" element={<Settings />} />
              <Route path="/admin/crypto-deposits" element={<ManageCryptoDeposits />} />
            </>
          ) : (
            // اگه احراز هویت نشده بود، همه مسیرهای زیر /admin رو به صفحه لاگین ریدایرکت می‌کنیم
            <Route path="/admin/*" element={<Navigate to="/admin/login" replace />} />
          )}

          {/* مدیریت خطای 404 (صفحه یافت نشد) */}
          <Route path="*" element={<h2 className="text-center text-red-500 text-3xl font-bold mt-20">{t('page_not_found')}</h2>} />
        </Routes>
      </main>
    </div>
  );
}

// LanguageProvider و Router رو در روت اصلی اپلیکیشن قرار میدیم تا برای همه کامپوننت‌ها در دسترس باشند.
function App() {
  return (
    <LanguageProvider>
      <Router>
        <RootApp />
      </Router>
    </LanguageProvider>
  );
}

export default App;
