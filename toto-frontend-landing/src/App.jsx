import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import LastGameSection from './sections/LastGameSection';
import OpenGamesPredictionSection from './sections/OpenGamesPredictionSection';
import UpcomingGamesSection from './sections/UpcomingGamesSection';

axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL || 'https://lotto.green/api';
axios.defaults.withCredentials = true;

function App() {
  const [lastGame, setLastGame] = useState(null);
  const [upcomingGames, setUpcomingGames] = useState([]); // This will be fetched by UpcomingGamesSection now
  const [loadingApp, setLoadingApp] = useState(true); // Loading state for App.jsx's own data (lastGame)
  const [globalError, setGlobalError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // New state to manage which game's form is displayed in OpenGamesPredictionSection
  const [selectedGameForPrediction, setSelectedGameForPrediction] = useState(null);

  const checkAuthStatus = useCallback(async () => {
    try {
      const res = await axios.get('/users/profile');
      if (res.status === 200 && (res.data.id || res.data._id)) {
        setIsAuthenticated(true);
        console.log("App.jsx: User is authenticated via cookie.");
      } else {
        setIsAuthenticated(false);
        console.log("App.jsx: User is NOT authenticated (API call successful but no user ID/_ID).");
      }
    } catch (error) {
      setIsAuthenticated(false);
      console.error("App.jsx: Authentication check failed:", error.response?.data?.message || error.message);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Fetch only last completed game in App.jsx
  const fetchLastGameData = useCallback(async () => {
    setLoadingApp(true);
    setGlobalError(null);
    try {
      // Corrected API endpoint based on backend analysis: /totos/last-completed for last finished game
      const lastGameRes = await axios.get('/totos/last-completed'); 
      setLastGame(lastGameRes.data);
    } catch (err) {
      console.error("Error fetching last completed game data:", err);
      // Fallback mock data for lastGame
      setLastGame({
        name: 'بازی نمونه (خطا در بارگذاری)',
        matches: [{
          _id: 'mockmatch1',
          homeTeam: 'تیم میزبان',
          awayTeam: 'تیم میهمان',
          date: new Date().toISOString(),
          result: '1',
          isClosed: true
        }],
        totalPot: 0,
        commissionAmount: 0,
        prizePool: 0,
        prizes: { firstPlace: 0, secondPlace: 0, thirdPlace: 0 },
        winners: { first: [], second: [], third: [] },
        status: 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setGlobalError("اطلاعات آخرین بازی تکمیل شده با خطا بارگذاری شد.");
    } finally {
      setLoadingApp(false);
    }
  }, []);

  useEffect(() => {
    fetchLastGameData();
  }, [fetchLastGameData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white flex flex-col items-center justify-center font-inter">
      <header className="w-full bg-black bg-opacity-40 shadow-xl py-4 absolute top-0 z-10 backdrop-blur-sm">
        <div className="container mx-auto flex justify-between items-center px-4">
          <h1 className="text-4xl font-extrabold tracking-wide text-blue-300 transform transition-transform duration-300 hover:scale-105">
            TotoLand
          </h1>
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

      <main className="flex-grow flex flex-col items-center justify-start text-center px-4 py-20 w-full max-w-6xl mx-auto z-0 relative">
        {/* Loading and Error Messages for App.jsx's own data */}
        {loadingApp && (
          <div className="text-center text-lg text-blue-200 py-8">
            در حال بارگذاری اطلاعات بازی‌ها...
          </div>
        )}

        {globalError && (
          <div className="bg-red-800 bg-opacity-70 border border-red-500 text-red-200 px-4 py-3 rounded relative mb-4 shadow-lg w-full">
            {globalError}
          </div>
        )}

        {!loadingApp && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
            {/* Main Content: Open Games (col-span-2 on large screens) */}
            <div className="lg:col-span-2 bg-white bg-opacity-10 p-6 rounded-xl shadow-2xl backdrop-blur-sm border border-white border-opacity-20 flex flex-col h-full">
              {/* Pass selectedGameForPrediction and its setter to OpenGamesPredictionSection */}
              <OpenGamesPredictionSection 
                isAuthenticated={isAuthenticated} 
                selectedGame={selectedGameForPrediction}
                setSelectedGame={setSelectedGameForPrediction} // Pass the setter
              />
            </div>

            {/* Sidebars: Upcoming and Last Game */}
            <div className="lg:col-span-1 flex flex-col gap-8">
              {/* Sidebar 1: Upcoming Games */}
              <div className="bg-white bg-opacity-10 p-6 rounded-xl shadow-2xl backdrop-blur-sm border border-white border-opacity-20 flex-grow">
                {/* Pass the setter to UpcomingGamesSection */}
                <UpcomingGamesSection 
                  onSelectGame={setSelectedGameForPrediction} // Pass the setter
                />
              </div>

              {/* Sidebar 2: Last Game */}
              {lastGame && (
                <div className="bg-white bg-opacity-10 p-6 rounded-xl shadow-2xl backdrop-blur-sm border border-white border-opacity-20 flex-grow">
                  <LastGameSection lastGame={lastGame} />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="w-full bg-black bg-opacity-40 text-blue-200 py-4 mt-auto text-sm text-center shadow-inner">
        <div className="container mx-auto px-4">
          &copy; 2025 TotoLand. تمامی حقوق محفوظ است.
        </div>
      </footer>
    </div>
  );
}

export default App;
