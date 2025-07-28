// toto-frontend-landing/src/sections/OpenGamesPredictionSection.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';
import { useLanguage } from '../contexts/LanguageContext';
import PredictionForm from './PredictionForm';

// یک کامپوننت ساده برای نمایش جزئیات یک بازی (اینجا استفاده نمی‌شود اما برای مرجع باقی می‌ماند)
// const GameCard = ({ game, isSelected, onClick, t }) => (
//   <div
//     className={`bg-white bg-opacity-15 p-4 rounded-lg shadow-md mb-4 cursor-pointer transition-all duration-300
//                 ${isSelected ? 'border-2 border-blue-400 transform scale-102' : 'border border-transparent hover:bg-opacity-20'}`}
//     onClick={() => onClick(game)}
//   >
//     <h3 className="text-xl font-semibold text-blue-200">{game.name}</h3>
//     <p className="text-sm text-gray-300">
//       {t('deadline')}: {format(new Date(game.deadline), 'yyyy/MM/dd HH:mm')}
//     </p>
//     <p className="text-sm text-gray-300">
//       {t('number_of_matches')}: {game.matches.length}
//     </p>
//     <p className="text-lg font-bold mt-2 text-green-300">
//       {t('total_prize_pool')}: {game.totalPot?.toLocaleString() || 'N/A'} {t('usdt')}
//     </p>
//   </div>
// );

function OpenGamesPredictionSection({ isAuthenticated, selectedGame, setSelectedGame }) {
  const { t } = useLanguage();

  const [openGames, setOpenGames] = useState([]); // لیست بازی‌های Toto فعال (برای انتخاب پیش‌فرض)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOpenGames = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/totos/open');
      if (response.data && response.data.length > 0) {
        setOpenGames(response.data);
        // If no game is currently selected from parent, select the first open game by default
        if (!selectedGame) { 
          setSelectedGame(response.data[0]);
        }
      } else {
        setOpenGames([]);
        setError(t('no_active_games_available'));
      }
    } catch (err) {
      console.error("خطا در دریافت بازی‌های باز:", err);
      setError(t('error_fetching_open_games'));
      setOpenGames([]);
    } finally {
      setLoading(false); 
    }
  }, [t, selectedGame, setSelectedGame]); // Add selectedGame and setSelectedGame to dependencies

  useEffect(() => {
    fetchOpenGames();
  }, [fetchOpenGames]);

  const handlePredictionSuccess = useCallback(() => {
    // After a successful prediction, re-fetch open games to update the list
    // This also ensures the selected game is reset or updated if needed
    fetchOpenGames(); 
  }, [fetchOpenGames]);

  const renderTime = ({ remainingTime }) => {
    if (remainingTime === 0) {
      return <div className="timer-text">{t('deadline_passed')}</div>;
    }
    const minutes = Math.floor(remainingTime / 60);
    const seconds = Math.floor(remainingTime % 60); // Use floor for seconds
    return (
      <div className="flex flex-col items-center">
        <div className="text-sm">{t('remaining')}</div>
        <div className="text-2xl font-bold">{`${minutes
          .toString()
          .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`}</div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center text-lg text-blue-200 py-8">
        {t('loading_active_games')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-800 bg-opacity-70 border border-red-500 text-red-200 px-4 py-3 rounded relative mb-4 shadow-lg">
        {error}
      </div>
    );
  }

  // If no game is selected (e.g., no open games available or initial state before fetch)
  if (!selectedGame) {
    return (
      <div className="text-center text-lg text-blue-200 py-8">
        {t('no_active_games_for_prediction')}
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Display selected game details */}
      <h2 className="text-3xl font-extrabold text-white mb-6 text-center">
        {t('active_game')}: {selectedGame.name}
      </h2>
      
      <div className="bg-blue-800 bg-opacity-20 p-6 rounded-lg shadow-inner mb-8 border border-blue-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-blue-300 text-sm">{t('prediction_deadline')}</p>
            <p className="text-xl font-bold">
              {format(new Date(selectedGame.deadline), 'yyyy/MM/dd HH:mm')}
            </p>
            {new Date(selectedGame.deadline) > new Date() && (
              <div className="mt-2 flex justify-center">
                <CountdownCircleTimer
                  isPlaying
                  duration={Math.max(0, (new Date(selectedGame.deadline).getTime() - Date.now()) / 1000)}
                  colors={[['#004777', 0.33], ['#F7B801', 0.33], ['#A30000', 0.33]]}
                  size={80}
                  strokeWidth={6}
                >
                  {renderTime}
                </CountdownCircleTimer>
              </div>
            )}
          </div>
          <div>
            <p className="text-blue-300 text-sm">{t('total_prize_pool')}</p>
            <p className="text-xl font-bold text-green-300">
              {selectedGame.totalPot?.toLocaleString() || 'N/A'} {t('usdt')}
            </p>
          </div>
          <div>
            <p className="text-blue-300 text-sm">{t('number_of_matches')}</p>
            <p className="text-xl font-bold">{selectedGame.matches.length}</p>
          </div>
        </div>
      </div>

      {/* Render the PredictionForm for the selected game */}
      <div className="bg-white bg-opacity-15 p-6 rounded-xl shadow-2xl backdrop-blur-sm border border-white border-opacity-20 mt-8">
        <PredictionForm 
          game={selectedGame} 
          isAuthenticated={isAuthenticated} 
          onPredictionSuccess={handlePredictionSuccess} 
        />
      </div>

      {/* You can optionally add a list of other open games here for quick switching,
          but the primary interaction is now through the selectedGame prop. */}
      {/* {openGames.length > 1 && (
        <div className="mt-8">
          <h3 className="text-2xl font-bold text-white mb-4 text-center">{t('other_open_games')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {openGames.filter(game => game._id !== selectedGame._id).map((game) => (
              <GameCard key={game._id} game={game} isSelected={false} onClick={() => setSelectedGame(game)} t={t} />
            ))}
          </div>
        </div>
      )} */}
    </div>
  );
}

export default OpenGamesPredictionSection;
