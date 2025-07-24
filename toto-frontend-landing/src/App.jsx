import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LastGameSection from './sections/LastGameSection';
import OpenGamesPredictionSection from './sections/OpenGamesPredictionSection'; // <--- Import the new component
import UpcomingGamesSection from './sections/UpcomingGamesSection';

// Define your API base URL for the backend
const API_BASE_URL = 'https://lotto.green/api'; // <--- Update this to your actual backend API URL

function App() {
  const [lastGame, setLastGame] = useState(null);
  const [upcomingGames, setUpcomingGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState(null);

  // --- Mock Authentication State for Landing Page ---
  // در یک سناریوی واقعی، این حالت‌ها باید از یک context احراز هویت یا بررسی localStorage تامین شوند.
  // برای مثال، می‌توانید یک تابع برای بررسی وجود توکن در localStorage اینجا اضافه کنید.
  const [isAuthenticated, setIsAuthenticated] = useState(false); // <--- Mock state
  const [token, setToken] = useState(null); // <--- Mock state

  useEffect(() => {
    // در اینجا می‌توانید منطق ساده‌ای برای بررسی احراز هویت اضافه کنید،
    // مثلاً بررسی وجود توکن در localStorage.
    const storedToken = localStorage.getItem('userToken'); // فرض کنید توکن در localStorage ذخیره می‌شود
    if (storedToken) {
      setIsAuthenticated(true);
      setToken(storedToken);
    }
  }, []);
  // --- End Mock Authentication State ---


  useEffect(() => {
    const fetchGameData = async () => {
      setLoading(true);
      setGlobalError(null);

      let hasError = false;

      // --- Fetch Last Completed Game Data ---
      try {
        const lastGameRes = await axios.get(`${API_BASE_URL}/totos/last-completed-game`);
        setLastGame(lastGameRes.data);
      } catch (err) {
        console.error("Error fetching last completed game data:", err);
        setLastGame({
          name: 'اسکارنود - ۱۷۵ (داده نمونه)',
          matches: [
            { home: 'لیورپول', score: '0 - 2', away: 'چلسی', day: 'یکشنبه', time: '17:00', status: 'پایان' },
            { home: 'منچستر سیتی', score: '3 - 1', away: 'استون ویلا', day: 'شنبه', time: '18:30', status: 'پایان' },
          ],
          stats: {
            totalForms: '36153', totalAmount: '2,143,384,770',
            firstPlaceWinners: '2132', firstPlacePrize: '522.000',
            secondPlaceWinners: '7874', secondPlacePrize: '35.000',
          },
        });
        hasError = true;
      }

      // --- Fetch Upcoming/Active Games (for UpcomingGamesSection) ---
      // OpenGamesPredictionSection خودش بازی‌های فعال را از /totos/open می‌خواند.
      // این بخش برای UpcomingGamesSection است.
      try {
        const upcomingRes = await axios.get(`${API_BASE_URL}/totos/upcoming-games`);
        setUpcomingGames(upcomingRes.data);
      } catch (err) {
        console.error("Error fetching upcoming games data:", err);
        setUpcomingGames([
          { _id: 'mock1', name: 'مسابقه اسکارنود - ۱۷۸ (نمونه)', link: '#', deadline: new Date(Date.now() + 86400000 * 5).toISOString() },
          { _id: 'mock2', name: 'جام جهانی - دور ۱۶ (نمونه)', link: '#', deadline: new Date(Date.now() + 86400000 * 10).toISOString() },
        ]);
        hasError = true;
      }

      setLoading(false);
      if (hasError) {
        setGlobalError("برخی اطلاعات بازی‌ها با خطا بارگذاری شدند. داده‌های نمونه نمایش داده می‌شوند.");
      }
    };

    fetchGameData();
  }, [API_BASE_URL]); // فقط با تغییر API_BASE_URL اجرا شود

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white flex flex-col items-center justify-center font-inter"> {/* Updated background and font */}
      {/* Header for Landing Page */}
      <header className="w-full bg-black bg-opacity-40 shadow-xl py-4 absolute top-0 z-10 backdrop-blur-sm"> {/* Darker, transparent header */}
        <div className="container mx-auto flex justify-between items-center px-4">
          <h1 className="text-4xl font-extrabold tracking-wide text-blue-300 transform transition-transform duration-300 hover:scale-105">TotoLand</h1> {/* Larger, more vibrant title */}
          <nav>
            <a
              href="https://panel.lotto.green/auth" // <--- Update this URL to your user panel login/register
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold py-2 px-6 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105" // Styled button
            >
              ورود / ثبت نام
            </a>
          </nav>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 py-20 w-full max-w-6xl mx-auto z-0 relative">
        <h2 className="text-6xl font-extrabold text-white mb-6 leading-tight drop-shadow-lg"> {/* Larger, white text with shadow */}
          به دنیای هیجان‌انگیز پیش‌بینی ورزشی بپیوندید!
        </h2>
        <p className="text-2xl text-blue-200 max-w-3xl mb-10 drop-shadow-md"> {/* Larger, lighter blue text */}
          با پلتفرم توتو، نتایج بازی‌ها را پیش‌بینی کنید و جوایز بزرگ ببرید.
          هیجان بازی‌ها را با ما تجربه کنید!
        </p>
        <a
          href="https://panel.lotto.green/register" // <--- Update this URL to your user panel registration
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-12 rounded-full text-xl shadow-xl transition duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-purple-300" // More vibrant, larger button
        >
          شروع کنید!
        </a>
      </main>

      {/* Sections for Game Data */}
      <div className="container mx-auto px-4 py-8 flex flex-col gap-8 w-full max-w-6xl z-0"> {/* Added z-0 to ensure it's behind header */}
        {/* Display loading/error messages */}
        {loading && (
          <div className="text-center text-lg text-blue-200 py-8">در حال بارگذاری اطلاعات بازی‌ها...</div>
        )}
        {globalError && (
          <div className="bg-red-800 bg-opacity-70 border border-red-500 text-red-200 px-4 py-3 rounded relative mb-4 shadow-lg"> {/* Darker error message */}
            {globalError}
          </div>
        )}

        {/* Render sections when loading is complete, regardless of individual errors */}
        {!loading && (
          <>
            {lastGame && (
              <div className="bg-white bg-opacity-10 p-6 rounded-xl shadow-2xl backdrop-blur-sm border border-white border-opacity-20"> {/* Styled section container */}
                <LastGameSection lastGame={lastGame} />
              </div>
            )}

            {/* Grid layout for OpenGamesPredictionSection and UpcomingGamesSection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white bg-opacity-10 p-6 rounded-xl shadow-2xl backdrop-blur-sm border border-white border-opacity-20"> {/* Styled section container */}
                <OpenGamesPredictionSection
                  isAuthenticated={isAuthenticated}
                  token={token}
                  API_BASE_URL={API_BASE_URL}
                />
              </div>
              {upcomingGames.length > 0 && (
                <div className="bg-white bg-opacity-10 p-6 rounded-xl shadow-2xl backdrop-blur-sm border border-white border-opacity-20"> {/* Styled section container */}
                  <UpcomingGamesSection upcomingGames={upcomingGames} />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer for Landing Page */}
      <footer className="w-full bg-black bg-opacity-40 text-blue-200 py-4 mt-auto text-sm text-center shadow-inner"> {/* Darker, transparent footer */}
        <div className="container mx-auto px-4">
          &copy; 2025 TotoLand. تمامی حقوق محفوظ است.
        </div>
      </footer>
    </div>
  );
}

export default App;
