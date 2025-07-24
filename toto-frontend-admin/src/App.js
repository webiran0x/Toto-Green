// toto-frontend-admin/src/App.js
// فایل اصلی اپلیکیشن React پنل مدیریت با React Router

import React, { useState, useEffect } from 'react';
// useNavigate فقط در کامپوننت‌هایی که فرزند <Router> هستند استفاده می‌شود
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';

// کامپوننت‌های موجود شما
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
import ManageWithdrawals from './components/ManageWithdrawals'; // <--- اضافه شد


// کامپوننت Header ادمین
import AdminHeader from './components/AdminHeader';

// Context زبان
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

// کامپوننت ریشه با LanguageProvider
function RootApp() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const { t } = useLanguage();
  const navigate = useNavigate(); // هوک useNavigate اکنون در داخل <Router> استفاده می‌شود

  const API_BASE_URL = 'https://lotto.green/api';

 useEffect(() => {
  const verifyAuth = async () => {
    if (!token) {
      setIsAuthenticated(false);
      setLoadingAuth(false);
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/admin/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        },
      });
      console.log('Admin profile response:', res.data);

      if (res.data && res.data.role === 'admin') {
        setIsAuthenticated(true);
      } else {
        setToken('');
        localStorage.removeItem('adminToken');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Admin token verification failed:', error);
      setToken('');
      localStorage.removeItem('adminToken');
      setIsAuthenticated(false);
    } finally {
      setLoadingAuth(false);
    }
  };
  verifyAuth();
}, [token, API_BASE_URL]);


  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
    localStorage.setItem('adminToken', newToken);
    setIsAuthenticated(true);
    navigate('/admin/dashboard', { replace: true }); // هدایت صریح به داشبورد
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    navigate('/admin/login', { replace: true }); // هدایت به صفحه ورود پس از خروج
  };

  if (loadingAuth) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-100">{t('loading')}</div>;
  }

  return (
    // <Router> از اینجا حذف شد و به کامپوننت App منتقل شد
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* AdminHeader حالا بر اساس isAuthenticated لینک‌ها را نمایش می‌دهد */}
      <AdminHeader isAuthenticated={isAuthenticated} onLogout={handleLogout} />
      <main className="flex-grow container mx-auto p-4">
        <Routes>
          {/* مسیر پیش‌فرض: اگر isAuthenticated درست باشد به داشبورد، در غیر این صورت به لاگین */}
          <Route path="/" element={isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/admin/login" replace />} />
          <Route path="/admin" element={isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/admin/login" replace />} />

          {/* مسیر ورود ادمین */}
          <Route
            path="/admin/login"
            element={isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin onLoginSuccess={handleLoginSuccess} API_BASE_URL={API_BASE_URL} />}
          />

          {/* مسیرهای محافظت شده برای ادمین */}
          {isAuthenticated ? (
            <>
              <Route path="/admin/dashboard" element={<Dashboard token={token} API_BASE_URL={API_BASE_URL} />} />
              <Route path="/admin/users" element={<ManageUsers token={token} API_BASE_URL={API_BASE_URL} />} />
              <Route path="/admin/users/:userId" element={<EditUser token={token} API_BASE_URL={API_BASE_URL} />} />
              <Route path="/admin/games/create" element={<CreateTotoGame token={token} API_BASE_URL={API_BASE_URL} />} />
              <Route path="/admin/games/set-results" element={<SetResults token={token} API_BASE_URL={API_BASE_URL} />} />
              <Route path="/admin/games/view-predictions" element={<ViewPredictions token={token} API_BASE_URL={API_BASE_URL} />} />
              <Route path="/admin/games/all" element={<AllTotoGames token={token} API_BASE_URL={API_BASE_URL} />} />
              <Route path="/admin/transactions" element={<ManageTransactions token={token} API_BASE_URL={API_BASE_URL} />} />
              <Route path="/admin/manage-withdrawals" element={<ManageWithdrawals token={token} API_BASE_URL={API_BASE_URL} />} />
              <Route path="/admin/external-sync" element={<ExternalApiSync token={token} API_BASE_URL={API_BASE_URL} />} />
              <Route path="/admin/system-logs" element={<SystemLogs token={token} API_BASE_URL={API_BASE_URL} />} />
              <Route path="/admin/settings" element={<Settings token={token} API_BASE_URL={API_BASE_URL} />} />
              <Route path="/admin/crypto-deposits" element={<ManageCryptoDeposits token={token} API_BASE_URL={API_BASE_URL} />} />
            </>
          ) : (
            <Route path="/admin/*" element={<Navigate to="/admin/login" replace />} />
          )}

          {/* مسیر 404 برای هر مسیر ناموجود دیگر */}
          <Route path="*" element={<h2 className="text-center text-red-500 text-3xl font-bold mt-20">{t('page_not_found')}</h2>} />
        </Routes>
      </main>
    </div>
  );
}

// رندر کردن RootApp با LanguageProvider
function App() {
  return (
    <LanguageProvider>
      <Router> {/* <--- Router به اینجا منتقل شد تا RootApp را دربر بگیرد */}
        <RootApp />
      </Router>
    </LanguageProvider>
  );
}

export default App;
