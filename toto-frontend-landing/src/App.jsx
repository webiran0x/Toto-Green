import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import LastGameSection from './sections/LastGameSection';
import OpenGamesPredictionSection from './sections/OpenGamesPredictionSection';
import UpcomingGamesSection from './sections/UpcomingGamesSection';

axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL || 'https://lotto.green/api';
axios.defaults.withCredentials = true;

function App() {
  const [lastGame, setLastGame] = useState(null);
  const [upcomingGames, setUpcomingGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuthStatus = useCallback(async () => {
    try {
      const res = await axios.get('/users/profile'); // مسیر بدون API_BASE_URL
      // --- اصلاح شده: res.data.id یا res.data._id را چک کن ---
      if (res.status === 200 && (res.data.id || res.data._id)) { 
        setIsAuthenticated(true);
        console.log("App.jsx: User is authenticated via cookie.");
      } else {
        setIsAuthenticated(false);
        console.log("App.jsx: User is NOT authenticated (API call successful but no user ID/_ID).");
      }
    } catch (error) {
      setIsAuthenticated(false);
      console.error("App.jsx: Authentication check failed (e.g., 401/403 or network error):", error.response?.data?.message || error.message);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const fetchGameData = useCallback(async () => {
    setLoading(true);
    setGlobalError(null);

    let hasError = false;

    try {
      const lastGameRes = await axios.get('/totos/last-finished-game');
      setLastGame(lastGameRes.data);
    } catch (err) {
      console.error("Error fetching last completed game data:", err);
      setLastGame({
        name: 'بازی نمونه (خطا در بارگذاری)',
        matches: [{ _id: 'mockmatch1', homeTeam: 'تیم میزبان', awayTeam: 'تیم میهمان', date: new Date().toISOString(), result: '1', isClosed: true }],
        totalPot: 0, commissionAmount: 0, prizePool: 0, prizes: { firstPlace: 0, secondPlace: 0, thirdPlace: 0 }, winners: { first: [], second: [], third: [] }, status: 'completed', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      });
      setGlobalError("اطلاعات آخرین بازی تکمیل شده با خطا بارگذاری شد.");
      hasError = true;
    }

    try {
      const upcomingRes = await axios.get('/totos/open');
      setUpcomingGames(upcomingRes.data);
    } catch (err) {
      console.error("Error fetching upcoming games data:", err);
      setUpcomingGames([
        { _id: 'mock1', name: 'مسابقه نمونه آتی (خطا در بارگذاری)', deadline: new Date(Date.now() + 86400000 * 5).toISOString(), status: 'open', matches:[] },
      ]);
      setGlobalError(prev => (prev ? prev + " و " : "") + "اطلاعات بازی‌های آتی با خطا بارگذاری شد.");
      hasError = true;
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGameData();
  }, [fetchGameData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white flex flex-col items-center justify-center font-inter">
      <header className="w-full bg-black bg-opacity-40 shadow-xl py-4 absolute top-0 z-10 backdrop-blur-sm">
        <div className="container mx-auto flex justify-between items-center px-4">
          <h1 className="text-4xl font-extrabold tracking-wide text-blue-300 transform transition-transform duration-300 hover:scale-105">TotoLand</h1>
          <nav>
            <a
              href="https://panel.lotto.green/auth"
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold py-2 px-6 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
            >
              ورود / ثبت نام
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 py-20 w-full max-w-6xl mx-auto z-0 relative">
        <h2 className="text-6xl font-extrabold text-white mb-6 leading-tight drop-shadow-lg">
          به دنیای هیجان‌انگیز پیش‌بینی ورزشی بپیوندید!
        </h2>
        <p className="text-2xl text-blue-200 max-w-3xl mb-10 drop-shadow-md">
          با پلتفرم توتو، نتایج بازی‌ها را پیش‌بینی کنید و جوایز بزرگ ببرید.
          هیجان بازی‌ها را با ما تجربه کنید!
        </p>
        <a
          href="https://panel.lotto.green/register"
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-12 rounded-full text-xl shadow-xl transition duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-purple-300"
        >
          شروع کنید!
        </a>
      </main>

      <div className="container mx-auto px-4 py-8 flex flex-col gap-8 w-full max-w-6xl z-0">
        {loading && (
          <div className="text-center text-lg text-blue-200 py-8">در حال بارگذاری اطلاعات بازی‌ها...</div>
        )}
        {globalError && (
          <div className="bg-red-800 bg-opacity-70 border border-red-500 text-red-200 px-4 py-3 rounded relative mb-4 shadow-lg">
            {globalError}
          </div>
        )}

        {!loading && (
          <>
            {lastGame && (
              <div className="bg-white bg-opacity-10 p-6 rounded-xl shadow-2xl backdrop-blur-sm border border-white border-opacity-20">
                <LastGameSection lastGame={lastGame} />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white bg-opacity-10 p-6 rounded-xl shadow-2xl backdrop-blur-sm border border-white border-opacity-20">
                <OpenGamesPredictionSection
                  isAuthenticated={isAuthenticated}
                />
              </div>
              {upcomingGames.length > 0 && (
                <div className="bg-white bg-opacity-10 p-6 rounded-xl shadow-2xl backdrop-blur-sm border border-white border-opacity-20">
                  <UpcomingGamesSection upcomingGames={upcomingGames} />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <footer className="w-full bg-black bg-opacity-40 text-blue-200 py-4 mt-auto text-sm text-center shadow-inner">
        <div className="container mx-auto px-4">
          &copy; 2025 TotoLand. تمامی حقوق محفوظ است.
        </div>
      </footer>
    </div>
  );
}

export default App;