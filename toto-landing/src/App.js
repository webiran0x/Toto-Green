import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Header from './components/Header';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';
import GameDetailsModal from './components/GameDetailsModal';
import FAQPage from './pages/FAQPage';
import TermsAndConditionsPage from './pages/TermsAndConditionsPage';
import { useLanguage } from './contexts/LanguageContext';
import { Routes, Route } from 'react-router-dom';
import LoadingSpinner from './components/LoadingSpinner';
import ActiveGamesSection from './components/ActiveGamesSection';
import PredictionFormSectionWrapper from './components/PredictionFormSectionWrapper';
import ClosedGamesResultsSection from './components/ClosedGamesResultsSection';
import DepositPage from './pages/DepositPage';
import WithdrawPage from './pages/WithdrawPage';
import MyPredictionsPage from './pages/MyPredictionsPage';
import MyTransactionsPage from './pages/MyTransactionsPage';
import DashboardPage from './pages/DashboardPage';
// NEW: Import the support ticket pages
import CreateTicketPage from './pages/CreateTicketPage';
import MyTicketsPage from './pages/MyTicketsPage';
import ExpiredGamesPage from './pages/ExpiredGamesPage';



function App() {
  const { t, language } = useLanguage();

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userBalance, setUserBalance] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showGameDetailsModal, setShowGameDetailsModal] = useState(false);
  const [selectedGameForDetails, setSelectedGameForDetails] = useState(null);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);

    if (language === 'fa') {
      root.setAttribute('dir', 'rtl');
    } else {
      root.setAttribute('dir', 'ltr');
    }

  }, [theme, language]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const fetchUserProfile = useCallback(async () => {
    try {
      const res = await axios.get('/users/profile');
      setIsAuthenticated(true);
      setUserBalance(res.data.balance);
    } catch (error) {
      setIsAuthenticated(false);
      setUserBalance(null);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const [openGames, setOpenGames] = useState([]);
  const [expiredGames, setExpiredGames] = useState([]);
  const [loadingOpenGames, setLoadingOpenGames] = useState(true);
  const [loadingExpiredGames, setLoadingExpiredGames] = useState(true);
  const [appError, setAppError] = useState('');

  const [selectedGameForPrediction, setSelectedGameForPrediction] = useState(null);
  const [predictionsForForm, setPredictionsForForm] = useState({});
  const [formPriceForForm, setFormPriceForForm] = useState(0);
  const [submittingPrediction, setSubmittingPrediction] = useState(false);
  const FORM_BASE_COST = 1;

  axios.defaults.baseURL = 'https://lotto.green/api';
  axios.defaults.withCredentials = true;

  const fetchOpenGames = useCallback(async () => {
    try {
      setLoadingOpenGames(true);
      const res = await axios.get('/totos/open');
      setOpenGames(res.data);
      if (res.data.length > 0) {
        setSelectedGameForPrediction(res.data[0]);
      } else {
        setSelectedGameForPrediction(null);
      }
    } catch (err) {
      setAppError(err.response?.data?.message || t('error_fetching_data'));
      console.error('Error fetching open games:', err.response?.data || err.message);
    } finally {
      setLoadingOpenGames(false);
    }
  }, [t]);

  const fetchExpiredGames = useCallback(async () => {
    try {
      setLoadingExpiredGames(true);
      const res = await axios.get('/totos/public-expired', { params: { limit: 5 } });
      setExpiredGames(res.data.games);
    }
    catch (err) {
      setAppError(err.response?.data?.message || t('error_fetching_expired_games'));
      console.error('Error fetching expired games:', err.response?.data || err.message);
    } finally {
      setLoadingExpiredGames(false);
    }
  }, [t]);


  useEffect(() => {
    fetchOpenGames();
    fetchExpiredGames();
  }, [fetchOpenGames, fetchExpiredGames]);

  useEffect(() => {
    let calculatedCombinations = 1;
    if (selectedGameForPrediction) {
      selectedGameForPrediction.matches.forEach(match => {
        const outcomes = predictionsForForm[match._id];
        if (outcomes && outcomes.length > 0) {
          calculatedCombinations *= outcomes.length;
        } else {
          calculatedCombinations *= 1;
        }
      });
      setFormPriceForForm(calculatedCombinations * FORM_BASE_COST);
    } else {
      setFormPriceForForm(0);
    }
  }, [predictionsForForm, selectedGameForPrediction, FORM_BASE_COST]);

  const handleParticipateInGameSection1 = (game) => {
    setSelectedGameForPrediction(game);
    setPredictionsForForm({});
    setFormPriceForForm(0);
  };

  const handlePredictionChangeForForm = useCallback((matchId, outcome) => {
    setPredictionsForForm(prev => {
      const currentOutcomes = prev[matchId] || [];
      let newOutcomes;
      if (currentOutcomes.includes(outcome)) {
        newOutcomes = currentOutcomes.filter(o => o !== outcome);
      } else {
        newOutcomes = [...currentOutcomes, outcome];
      }
      return { ...prev, [matchId]: newOutcomes };
    });
  }, []);

  const handleSubmitPredictionForForm = async (e) => {
    e.preventDefault();
    setAppError('');
    setSubmittingPrediction(true);

    if (!isAuthenticated) {
      setShowLoginModal(true);
      setAppError(t('login_required_to_predict'));
      setSubmittingPrediction(false);
      return;
    }

    if (!selectedGameForPrediction) {
      setAppError(t('select_game_for_prediction_error'));
      setSubmittingPrediction(false);
      return;
    }

    try {
      const formattedPredictions = [];
      let allMatchesPredicted = true;

      for (const match of selectedGameForPrediction.matches) {
        const chosenOutcome = predictionsForForm[match._id];
        if (!chosenOutcome || chosenOutcome.length === 0) {
          setAppError(t('please_select_at_least_one_outcome', { homeTeam: match.homeTeam, awayTeam: match.awayTeam }));
          allMatchesPredicted = false;
          break;
        }
        formattedPredictions.push({
          matchId: match._id,
          chosenOutcome: chosenOutcome.sort(),
        });
      }

      if (!allMatchesPredicted) {
        setSubmittingPrediction(false);
        return;
      }
      
      let calculatedCombinationsFinal = 1;
      formattedPredictions.forEach(pred => {
          calculatedCombinationsFinal *= pred.chosenOutcome.length;
      });
      const finalFormPriceCalculated = calculatedCombinationsFinal * FORM_BASE_COST;

      if (userBalance < finalFormPriceCalculated) {
          setAppError(t('insufficient_balance'));
          setSubmittingPrediction(false);
          return;
      }

      const payload = {
        gameId: selectedGameForPrediction._id,
        predictions: formattedPredictions,
        formAmount: finalFormPriceCalculated,
      };

      const res = await axios.post('/users/predict', payload);
      alert(t('prediction_submitted_success_with_code', { formId: res.data.prediction?.formId || 'N/A' }));
      
      setSelectedGameForPrediction(null);
      setPredictionsForForm({});
      setFormPriceForForm(0);
      fetchOpenGames();
      fetchUserProfile();
    } catch (err) {
      setAppError(err.response?.data?.message || t('error_submitting_prediction'));
      console.error('Error submitting prediction:', err.response?.data || err.message);
    } finally {
      setSubmittingPrediction(false);
    }
  };

  const handleLoginSuccessFromModal = () => {
    setIsAuthenticated(true);
    setShowLoginModal(false);
    setAppError('');
    fetchUserProfile();
  };

  const handleLogout = async () => {
    try {
      await axios.post('/auth/logout');
      setIsAuthenticated(false);
      setUserBalance(null);
    } catch (error) {
      console.error('Logout failed:', error);
      setIsAuthenticated(false);
      setUserBalance(null);
    }
  };

  const handleViewGameDetails = (game) => {
    setSelectedGameForDetails(game);
    setShowGameDetailsModal(true);
  };

  const downloadExcel = (gameId) => {
    const downloadUrl = `${axios.defaults.baseURL}/totos/public-download/${gameId}`;
    window.open(downloadUrl, '_blank');
  };
  
  // A component for the main landing page content
  const LandingPageMain = () => (
    <>
      <Header
        currentTheme={theme}
        toggleTheme={toggleTheme}
        isAuthenticated={isAuthenticated}
        userBalance={userBalance}
        onShowLoginModal={() => setShowLoginModal(true)}
        onLogout={handleLogout}
      />
      <main className="flex-grow container mx-auto p-4 lg:p-8">
        {appError && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-4 text-center">
            {appError}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <ActiveGamesSection
            openGames={openGames}
            onParticipate={handleParticipateInGameSection1}
            currentTheme={theme}
          />
          <PredictionFormSectionWrapper
            selectedGameForPrediction={selectedGameForPrediction}
            onSubmitPrediction={handleSubmitPredictionForForm}
            formPriceForForm={formPriceForForm}
            onPredictionChange={{ handler: handlePredictionChangeForForm, predictions: predictionsForForm }}
            submittingPrediction={submittingPrediction}
            FORM_BASE_COST={FORM_BASE_COST}
          />
          <ClosedGamesResultsSection
            expiredGames={expiredGames}
            onDownload={downloadExcel}
            currentTheme={theme}
            onViewDetails={handleViewGameDetails}
          />
        </div>
      </main>
      <Footer />
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccessFromModal}
      />
      <GameDetailsModal
        isOpen={showGameDetailsModal}
        onClose={() => setShowGameDetailsModal(false)}
        game={selectedGameForDetails}
      />
    </>
  );

  if (loadingOpenGames || loadingExpiredGames) {
    return <LoadingSpinner />;
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex flex-col font-iranyekan">
      <Routes>
        <Route path="/" element={<LandingPageMain />} />
        <Route path="/faq" element={<FAQPage currentTheme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/terms" element={<TermsAndConditionsPage currentTheme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/deposit" element={<DepositPage currentTheme={theme} toggleTheme={toggleTheme} isAuthenticated={isAuthenticated} />} />
        <Route path="/withdraw" element={<WithdrawPage currentTheme={theme} toggleTheme={toggleTheme} isAuthenticated={isAuthenticated} />} />
        <Route path="/my-predictions" element={<MyPredictionsPage currentTheme={theme} toggleTheme={toggleTheme} isAuthenticated={isAuthenticated} />} />
        <Route path="/my-transactions" element={<MyTransactionsPage currentTheme={theme} toggleTheme={toggleTheme} isAuthenticated={isAuthenticated} />} />
        <Route path="/dashboard" element={<DashboardPage currentTheme={theme} toggleTheme={toggleTheme} isAuthenticated={isAuthenticated} />} />
        {/* NEW: Routes for the new support pages */}
        <Route path="/support/create-ticket" element={<CreateTicketPage currentTheme={theme} toggleTheme={toggleTheme} isAuthenticated={isAuthenticated} />} />
        <Route path="/support/my-tickets" element={<MyTicketsPage currentTheme={theme} toggleTheme={toggleTheme} isAuthenticated={isAuthenticated} />} />
      {/* NEW: Route for the dedicated expired games page */}
        <Route
          path="/expired-games"
          element={
            <ExpiredGamesPage
              currentTheme={theme}
              toggleTheme={toggleTheme}
              isAuthenticated={isAuthenticated}
              userBalance={userBalance}
              onShowLoginModal={() => setShowLoginModal(true)}
              onLogout={handleLogout}
            />
          }
        />
      </Routes>
    </div>
  );
}

export default App;
