// toto-frontend-landing/src/sections/OpenGamesPredictionSection.jsx
// این کامپوننت بازی‌های فعال را نمایش می‌دهد و امکان پیش‌بینی را فراهم می‌کند.
// در صورت عدم احراز هویت، کاربر را به پنل کاربری هدایت می‌کند.

import React, { useState, useEffect, useCallback } from 'react'; // useCallback اضافه شد
import axios from 'axios';

// توجه: در Landing Page، ما به useLanguage دسترسی نداریم.
// بنابراین، پیام‌ها را مستقیماً به فارسی/انگلیسی (یا فقط فارسی) می‌نویسیم.
// برای چندزبانه کردن واقعی این بخش، باید یک راه حل i18n ساده‌تر برای Landing Page پیاده‌سازی شود
// یا پیام‌ها از App.js به عنوان prop ارسال شوند.
const messages = {
  loading: 'در حال بارگذاری بازی‌ها...',
  error_fetching_data: 'خطا در بارگذاری اطلاعات بازی‌ها.',
  select_game_for_prediction: 'بازی مورد نظر برای پیش‌بینی را انتخاب کنید:',
  select_game_placeholder: 'یک بازی را انتخاب کنید',
  no_active_games: 'در حال حاضر هیچ بازی فعالی برای پیش‌بینی وجود ندارد.',
  predict_for: 'پیش‌بینی برای',
  your_form_price: 'مبلغ فرم شما',
  usdt: 'ریال', // یا 'USDT' اگر واحد پول شما USDT است
  home_win_abbr: 'برد میزبان',
  draw_abbr: 'مساوی',
  away_win_abbr: 'برد میهمان',
  submit_prediction: 'ثبت فرم',
  submitting_prediction: 'در حال ثبت پیش‌بینی...',
  prediction_submitted_success: 'پیش‌بینی شما با موفقیت ثبت شد!',
  error_submitting_prediction: 'خطا در ثبت پیش‌بینی.',
  please_select_at_least_one_outcome: 'لطفاً برای بازی %{homeTeam} مقابل %{awayTeam} حداقل یک نتیجه را انتخاب کنید.',
  error: 'خطا',
  close: 'بستن',
  login_to_predict: 'برای ثبت پیش‌بینی، لطفاً وارد شوید یا ثبت نام کنید.',
  go_to_user_panel: 'ورود / ثبت نام در پنل کاربری',
  game_name: 'نام بازی',
  deadline: 'مهلت',
  match: 'بازی',
  home_team: 'تیم میزبان',
  away_team: 'تیم میهمان',
  match_date: 'تاریخ بازی',
};

// تابع ساده برای ترجمه (در غیاب useLanguage)
const t = (key, params = {}) => {
  let msg = messages[key] || key;
  for (const p in params) {
    msg = msg.replace(`%\{${p}\}`, params[p]);
  }
  return msg;
};


// token و API_BASE_URL از پراپس حذف شدند.
// isAuthenticated هنوز نیاز است تا لاگین کاربر بررسی شود.
function OpenGamesPredictionSection({ isAuthenticated }) {
  const [openGames, setOpenGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [predictions, setPredictions] = useState({});
  const [formPrice, setFormPrice] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalErrorMessage, setModalErrorMessage] = useState('');

  const FORM_BASE_COST = 1;

  // تابع fetchOpenGames را داخل useCallback قرار می‌دهیم
  const fetchOpenGames = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      // درخواست Axios: baseURL از axios.defaults.baseURL در App.jsx گرفته می‌شود.
      // بنابراین، نیازی به API_BASE_URL در اینجا نیست.
      const res = await axios.get('/totos/open'); // مسیر اصلاح شد: '/api/' از ابتدای مسیر حذف شد
      setOpenGames(res.data);
    } catch (err) {
      console.error("Error fetching open games for landing page:", err.response?.data || err.message);
      setError(t('error_fetching_data'));
      // Fallback to mock data
      setOpenGames([
          { _id: 'mock-game-1', name: 'مسابقه نمونه لندینگ ۱', deadline: new Date(Date.now() + 86400000 * 2).toISOString(), status: 'open',
            matches: Array(15).fill(null).map((_, i) => ({ _id: `match1_${i+1}`, homeTeam: `تیم ${i+1}م`, awayTeam: `تیم ${i+1}ه`, date: new Date(Date.now() + 86400000 * (1 + i/10)).toISOString() })),
            totalPot: 1000, prizes: {firstPlace: 700, secondPlace: 200, thirdPlace: 100}, winners: {first:[], second:[], third:[]}
          },
          { _id: 'mock-game-2', name: 'مسابقه نمونه لندینگ ۲', deadline: new Date(Date.now() + 86400000 * 5).toISOString(), status: 'open',
            matches: Array(15).fill(null).map((_, i) => ({ _id: `match2_${i+1}`, homeTeam: `تیم ${i+1}م`, awayTeam: `تیم ${i+1}ه`, date: new Date(Date.now() + 86400000 * (4 + i/10)).toISOString() })),
            totalPot: 500, prizes: {firstPlace: 350, secondPlace: 100, thirdPlace: 50}, winners: {first:[], second:[], third:[]}
          }
      ]);
    } finally {
      setLoading(false);
    }
  }, []); // useCallback بدون وابستگی خارجی به prop

  useEffect(() => {
    fetchOpenGames();
  }, [fetchOpenGames]); // fetchOpenGames به dependency array اضافه شد

  useEffect(() => {
    let calculatedCombinations = 1;
    if (selectedGame) {
      selectedGame.matches.forEach(match => {
        const outcomes = predictions[match._id];
        if (outcomes && outcomes.length > 0) {
          calculatedCombinations *= outcomes.length;
        } else {
          calculatedCombinations *= 1;
        }
      });
      setFormPrice(calculatedCombinations * FORM_BASE_COST);
    } else {
      setFormPrice(0);
    }
  }, [predictions, selectedGame, FORM_BASE_COST]);

  const handleGameSelect = (gameId) => {
    const game = openGames.find(g => g._id === gameId);
    setSelectedGame(game);
    setPredictions({});
    setFormPrice(0);
    setMessage('');
    setError('');
  };

  const handlePredictionChange = (matchId, outcome) => {
    setPredictions(prev => {
      const currentOutcomes = prev[matchId] || [];
      let newOutcomes;

      if (currentOutcomes.includes(outcome)) {
        newOutcomes = currentOutcomes.filter(o => o !== outcome);
      } else {
        newOutcomes = [...currentOutcomes, outcome];
      }
      return { ...prev, [matchId]: newOutcomes };
    });
  };

  const handleSubmitPrediction = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSubmitting(true);

    // --- منطق بررسی احراز هویت (بدون توکن در جاوااسکریپت) ---
    if (!isAuthenticated) {
        setModalErrorMessage(t('login_to_predict'));
        setShowErrorModal(true);
        setSubmitting(false);
        return; // جلوگیری از ادامه
    }
    // --- پایان منطق بررسی احراز هویت ---

    if (!selectedGame) {
      setModalErrorMessage(t('select_game_for_prediction_error'));
      setShowErrorModal(true);
      setSubmitting(false);
      return;
    }

    try {
      const formattedPredictions = selectedGame.matches.map(match => {
        const chosenOutcome = predictions[match._id];
        if (!chosenOutcome || chosenOutcome.length === 0) {
          setModalErrorMessage(
            t('please_select_at_least_one_outcome', { homeTeam: match.homeTeam, awayTeam: match.awayTeam })
          );
          setShowErrorModal(true);
          setSubmitting(false);
          throw new Error('Validation failed: Not all matches predicted');
        }
        return {
          matchId: match._id,
          chosenOutcome: chosenOutcome.sort(),
        };
      });

      // ارسال درخواست پیش‌بینی.
      // Axios به طور خودکار کوکی‌ها را (به خاطر axios.defaults.withCredentials = true) ارسال می‌کند.
      await axios.post(
        '/totos/predict', // مسیر اصلاح شد: '/api/' از ابتدای مسیر حذف شد
        { totoGameId: selectedGame._id, predictions: formattedPredictions, price: formPrice },
        // نیازی به هدر Authorization نیست.
      );

      setMessage(t('prediction_submitted_success'));
      setSelectedGame(null);
      setPredictions({});
      setFormPrice(0);

    } catch (err) {
      if (err.message === 'Validation failed: Not all matches predicted') {
        return;
      }
      setError(err.response?.data?.message || t('error_submitting_prediction'));
      console.error("Error submitting prediction:", err.response?.data || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-8">{t('loading')}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">{t('active_toto_games')}</h2>

      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 text-center">
          {message}
        </div>
      )}
      {error && !showErrorModal && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-center">
          {error}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="selectGame">
          {t('select_game_for_prediction')}:
        </label>
        {openGames.length === 0 ? (
          <p className="text-gray-600 text-center py-4">{t('no_active_games')}</p>
        ) : (
          <select
            id="selectGame"
            className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            value={selectedGame ? selectedGame._id : ''}
            onChange={(e) => handleGameSelect(e.target.value)}
          >
            <option value="">{t('select_game_placeholder')}</option>
            {openGames.map((game) => (
              <option key={game._id} value={game._id}>
                {game.name} ({t('deadline')}: {new Date(game.deadline).toLocaleString('fa-IR')})
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedGame && (
        <form onSubmit={handleSubmitPrediction} className="p-6 border border-blue-200 rounded-xl shadow-lg bg-blue-50">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            {t('predict_for')}: {selectedGame.name}
          </h3>
          <p className="text-xl font-bold text-blue-700 mb-6 text-center">
            {t('your_form_price')}: {formPrice.toLocaleString('fa-IR')} {t('usdt')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedGame.matches.map((match) => (
              <div
                key={match._id}
                className="bg-white p-5 rounded-lg shadow-md border border-gray-200 transform transition-transform duration-200 hover:scale-[1.02]"
              >
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  {match.homeTeam} <span className="text-gray-500">vs</span> {match.awayTeam}
                  <span className="block text-sm text-gray-600 font-normal">
                    ({new Date(match.date).toLocaleDateString('fa-IR')})
                  </span>
                </h4>
                <div className="flex flex-col space-y-2">
                  <label className="inline-flex items-center cursor-pointer bg-blue-100 p-2 rounded-md hover:bg-blue-200 transition duration-150">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-blue-600 rounded"
                      checked={predictions[match._id]?.includes('1') || false}
                      onChange={() => handlePredictionChange(match._id, '1')}
                    />
                    <span className="ml-2 text-gray-700">{t('home_win_abbr')}</span>
                  </label>
                  <label className="inline-flex items-center cursor-pointer bg-blue-100 p-2 rounded-md hover:bg-blue-200 transition duration-150">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-blue-600 rounded"
                      checked={predictions[match._id]?.includes('X') || false}
                      onChange={() => handlePredictionChange(match._id, 'X')}
                    />
                    <span className="ml-2 text-gray-700">{t('draw_abbr')}</span>
                  </label>
                  <label className="inline-flex items-center cursor-pointer bg-blue-100 p-2 rounded-md hover:bg-blue-200 transition duration-150">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-blue-600 rounded"
                      checked={predictions[match._id]?.includes('2') || false}
                      onChange={() => handlePredictionChange(match._id, '2')}
                    />
                    <span className="ml-2 text-gray-700">{t('away_win_abbr')}</span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-green-600 to-teal-700 hover:from-green-700 hover:to-teal-800 text-white font-bold py-3 px-8 rounded-lg text-xl focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {submitting ? t('submitting_prediction') : t('submit_prediction', { price: formPrice.toLocaleString('fa-IR') })}
            </button>
          </div>
        </form>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-red-600">{t('error')}</h3>
            <p className="mb-6 text-gray-700">{modalErrorMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowErrorModal(false)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OpenGamesPredictionSection;