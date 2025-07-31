import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import GameDetailsModal from '../components/GameDetailsModal';
import LoadingSpinner from '../components/LoadingSpinner';
import ClosedGamesResultsSection from '../components/ClosedGamesResultsSection';

import { useLanguage } from '../contexts/LanguageContext';

const ExpiredGamesPage = ({ currentTheme, toggleTheme, isAuthenticated, userBalance, onShowLoginModal, onLogout }) => {
  const { t } = useLanguage();
  const [expiredGames, setExpiredGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appError, setAppError] = useState('');
  const [showGameDetailsModal, setShowGameDetailsModal] = useState(false);
  const [selectedGameForDetails, setSelectedGameForDetails] = useState(null);

  // Fetch all expired games for this dedicated page
  const fetchAllExpiredGames = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/totos/public-expired', { params: { limit: 100 } }); // Fetch more games
      setExpiredGames(res.data.games);
    } catch (err) {
      setAppError(err.response?.data?.message || t('error_fetching_expired_games'));
      console.error('Error fetching expired games:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchAllExpiredGames();
  }, [fetchAllExpiredGames]);

  const handleViewGameDetails = (game) => {
    setSelectedGameForDetails(game);
    setShowGameDetailsModal(true);
  };
  
  const downloadExcel = (gameId) => {
    // This is a placeholder for a real API call
    const downloadUrl = `${axios.defaults.baseURL}/totos/public-download/${gameId}`;
    window.open(downloadUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex flex-col font-iranyekan">
        <Header
          currentTheme={currentTheme}
          toggleTheme={toggleTheme}
          isAuthenticated={isAuthenticated}
          userBalance={userBalance}
          onShowLoginModal={onShowLoginModal}
          onLogout={onLogout}
        />
        <main className="flex-grow flex items-center justify-center">
          <LoadingSpinner />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex flex-col font-iranyekan">
      <Header
        currentTheme={currentTheme}
        toggleTheme={toggleTheme}
        isAuthenticated={isAuthenticated}
        userBalance={userBalance}
        onShowLoginModal={onShowLoginModal}
        onLogout={onLogout}
      />
      <main className="flex-grow container mx-auto p-4 lg:p-8">
        <h1 className="text-4xl font-extrabold text-center text-gray-800 dark:text-white mb-10">
          {t('all_expired_games')}
        </h1>
        {appError && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-4 text-center">
            {appError}
          </div>
        )}
        <ClosedGamesResultsSection
          expiredGames={expiredGames}
          onDownload={downloadExcel}
          currentTheme={currentTheme}
          onViewDetails={handleViewGameDetails}
          isFullPage={true} // A prop to indicate it's a full page
        />
      </main>
      <Footer />
      <GameDetailsModal
        isOpen={showGameDetailsModal}
        onClose={() => setShowGameDetailsModal(false)}
        game={selectedGameForDetails}
      />
    </div>
  );
};

export default ExpiredGamesPage;
