import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format, differenceInSeconds } from 'date-fns'; // برای فرمت‌دهی تاریخ و محاسبه زمان باقیمانده
import { faIR } from 'date-fns/locale'; // ایمپورت لوکال فارسی
import { CountdownCircleTimer } from 'react-countdown-circle-timer'; // برای نمایش تایمر، اگر نصب ندارید حذف یا نصب کنید
import { useLanguage } from '../contexts/LanguageContext'; // برای ترجمه
import {
  CheckCircleIcon, // آیکون موفقیت
  ExclamationCircleIcon, // آیکون خطا
  ArrowPathIcon, // آیکون پردازش
} from '@heroicons/react/24/outline'; // ایمپورت آیکون‌ها

// هزینه پایه برای هر ترکیب پیش‌بینی
// این مقدار می‌تواند از تنظیمات ادمین یا API دریافت شود، اما فعلاً ثابت در نظر گرفته شده است.
const FORM_BASE_COST = 1; // مثلاً 1 USDT یا 1000 تومان

/**
 * کامپوننت PredictionForm
 * فرم پیش‌بینی را برای یک بازی Toto مشخص نمایش می‌دهد.
 *
 * @param {object} props - پراپرتی‌های کامپوننت.
 * @param {object} props.game - شیء بازی Toto که کاربر در حال پیش‌بینی آن است.
 * @param {boolean} props.isAuthenticated - وضعیت احراز هویت کاربر.
 * @param {function} props.onPredictionSuccess - تابعی که پس از ارسال موفقیت‌آمیز پیش‌بینی فراخوانی می‌شود.
 */
function PredictionForm({ game, isAuthenticated, onPredictionSuccess }) {
  const { t } = useLanguage(); // تابع ترجمه از Context زبان

  // state برای نگهداری پیش‌بینی‌های کاربر برای هر مسابقه: { matchId: [outcome1, outcome2, ...] }
  const [predictions, setPredictions] = useState({});
  // state برای قیمت محاسبه شده برای فرم پیش‌بینی
  const [formPrice, setFormPrice] = useState(0); 
  // state برای وضعیت ارسال فرم (در حال ارسال، موفق، خطا)
  const [submitting, setSubmitting] = useState(false); // وضعیت ارسال پیش‌بینی
  const [message, setMessage] = useState(''); // پیام‌های موفقیت
  // State برای کنترل مودال خطا و پیام آن
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalErrorMessage, setModalErrorMessage] = useState('');

  // هنگام تغییر بازی، پیش‌بینی‌های اولیه و قیمت را ریست می‌کند
  useEffect(() => {
    if (game && game.matches) {
      const initialPredictions = {};
      game.matches.forEach(match => {
        initialPredictions[match._id] = []; // شروع با آرایه خالی برای انتخاب‌های چندگانه
      });
      setPredictions(initialPredictions);
      setFormPrice(0); // قیمت اولیه 0
      setMessage('');
      setModalErrorMessage('');
      setShowErrorModal(false);
    }
  }, [game]);

  // محاسبه فرمول قیمت بر اساس انتخاب‌های کاربر
  useEffect(() => {
    let calculatedCombinations = 1;
    if (game && game.matches) {
      game.matches.forEach(match => {
        const outcomes = predictions[match._id];
        if (outcomes && outcomes.length > 0) {
          calculatedCombinations *= outcomes.length; 
        } else {
          // اگر برای یک مسابقه هیچ انتخابی نشده باشد، آن را 1 ترکیب در نظر می‌گیریم
          // اما در زمان ارسال، کاربر را مجبور به انتخاب می‌کنیم.
          calculatedCombinations *= 1; 
        }
      });
      setFormPrice(calculatedCombinations * FORM_BASE_COST);
    } else {
      setFormPrice(0); 
    }
  }, [predictions, game]); 

  // useEffect برای پاکسازی پیام موفقیت پس از چند ثانیه
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 5000); // پیام پس از 5 ثانیه ناپدید می‌شود
      return () => clearTimeout(timer); // پاکسازی تایمر در صورت unmount شدن کامپوننت یا تغییر پیام
    }
  }, [message]);

  // هندلر برای تغییر پیش‌بینی‌های کاربر برای یک مسابقه خاص
  const handlePredictionChange = (matchId, outcome) => {
    setPredictions(prev => {
      const currentOutcomes = prev[matchId] || []; 
      let newOutcomes;

      if (currentOutcomes.includes(outcome)) {
        // اگر نتیجه قبلاً انتخاب شده، آن را حذف می‌کند
        newOutcomes = currentOutcomes.filter(o => o !== outcome);
      } else {
        // اگر نتیجه انتخاب نشده، آن را اضافه می‌کند
        newOutcomes = [...currentOutcomes, outcome];
      }
      return { ...prev, [matchId]: newOutcomes }; 
    });
  };

  // بررسی اینکه آیا تمام مسابقات حداقل یک پیش‌بینی دارند
  const allMatchesHaveAtLeastOnePrediction = useCallback(() => {
    if (!game || !game.matches) return false;
    return game.matches.every(match => predictions[match._id] && predictions[match._id].length > 0);
  }, [game, predictions]);

  // هندلر ارسال فرم
  const handleSubmitPrediction = async (e) => {
    e.preventDefault();
    setMessage('');
    setModalErrorMessage('');
    setShowErrorModal(false);
    setSubmitting(true); 

    if (!isAuthenticated) {
      setModalErrorMessage(t('login_required_message_full'));
      setShowErrorModal(true);
      setSubmitting(false);
      return;
    }

    if (!allMatchesHaveAtLeastOnePrediction()) {
      setModalErrorMessage(t('please_select_at_least_one_outcome_for_all_matches'));
      setShowErrorModal(true);
      setSubmitting(false);
      return;
    }

    const userPredictions = game.matches.map(match => ({
      matchId: match._id,
      chosenOutcome: predictions[match._id].sort(), // اطمینان از مرتب‌سازی برای ثبات
    }));

    try {
      const payload = {
        gameId: game._id, 
        predictions: userPredictions,
        formAmount: formPrice, // ارسال قیمت محاسبه شده توسط فرانت‌اند
      };

      const res = await axios.post('/users/predict', payload); 

      const formId = res.data.prediction?.formId; 
      const successMessage = t('prediction_submitted_success_with_code', { formId: formId || 'N/A' });
      setMessage(successMessage); 

      // پس از موفقیت، به کامپوننت والد اطلاع می‌دهد
      if (onPredictionSuccess) {
        onPredictionSuccess();
      }

      // پاکسازی فرم پس از ارسال موفقیت‌آمیز
      setPredictions({}); 
      setFormPrice(0); 

    } catch (err) {
      console.error('Error submitting prediction:', err.response?.data || err.message); 
      const errorMessage = err.response?.data?.message || t('error_submitting_prediction');
      setModalErrorMessage(errorMessage);
      setShowErrorModal(true);
    } finally {
      setSubmitting(false); 
    }
  };

  // محاسبه زمان باقیمانده تا مهلت پیش‌بینی
  const deadlineSeconds = game ? Math.max(0, differenceInSeconds(new Date(game.deadline), new Date())) : 0;

  // منطق رندر تایمر برای CountdownCircleTimer
  const renderTime = ({ remainingTime }) => {
    if (remainingTime <= 0) {
      return <div className="text-red-400 text-xs">{t('deadline_passed')}</div>;
    }
    const days = Math.floor(remainingTime / (60 * 60 * 24));
    const hours = Math.floor((remainingTime % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((remainingTime % (60 * 60)) / 60);
    const seconds = Math.floor(remainingTime % 60); // Changed to floor to prevent floating point issues

    return (
      <div className="flex flex-col items-center">
        <div className="text-xs text-blue-200">{t('remaining')}</div>
        <div className="text-lg font-bold">
          {days > 0 ? `${days}${t('day_abbr')} ` : ''}
          {`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`}
        </div>
      </div>
    );
  };

  if (!game) {
    return (
      <div className="text-center text-lg text-blue-200 py-8">
        {t('no_game_selected_for_prediction')}
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* پیام موفقیت در بالای فرم نمایش داده می‌شود */}
      {message && (
        <div 
          className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 px-4 py-3 rounded relative mb-4 text-center transition-colors duration-300"
          style={{ position: 'sticky', top: '1rem', zIndex: 1000 }} 
        >
          <CheckCircleIcon className="h-5 w-5 inline-block mr-2" /> {message}
        </div>
      )}

      {/* پیام ورود/ثبت نام اگر احراز هویت نشده باشد */}
      {!isAuthenticated && (
        <div className="bg-yellow-800 bg-opacity-70 border border-yellow-500 text-yellow-200 px-6 py-4 rounded-xl shadow-lg text-center mb-6">
          <p className="mb-3 font-semibold">{t('login_required_message_full')}</p>
          <a
            href="https://panel.lotto.green/auth" // لینک به صفحه ورود/ثبت نام پنل کاربری
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-2 px-6 rounded-full text-md shadow-xl transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            {t('login_register_button')}
          </a>
        </div>
      )}

      <h3 className="text-2xl font-bold text-white mb-4 text-center">{t('predict_for')}: {game.name}</h3>
      
      {/* تایمر مهلت پیش‌بینی */}
      {deadlineSeconds > 0 && (
        <div className="flex justify-center mb-6">
          <CountdownCircleTimer
            isPlaying
            duration={deadlineSeconds}
            colors={[['#22C55E', 0.6], ['#FBBF24', 0.2], ['#EF4444', 0.2]]}
            colorsTime={[deadlineSeconds * 0.6, deadlineSeconds * 0.2, 0]} // تنظیم زمان برای تغییر رنگ
            size={120}
            strokeWidth={8}
            onComplete={() => ({ shouldRepeat: false, delay: 1 })} // وقتی زمان تمام شد، متوقف شود
          >
            {renderTime}
          </CountdownCircleTimer>
        </div>
      )}
      {deadlineSeconds <= 0 && (
        <div className="text-center text-red-400 text-xl font-bold mb-6">
          {t('prediction_deadline_passed')}
        </div>
      )}

      <p className="text-xl font-bold text-blue-400 mb-6 text-center">
        {t('your_form_price')}: {formPrice.toLocaleString('fa-IR')} {t('usdt')}
      </p>

      <form onSubmit={handleSubmitPrediction}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {game.matches.map((match, index) => (
            <div
              key={match._id}
              className="bg-white bg-opacity-10 p-5 rounded-lg shadow-md border border-white border-opacity-20 transform transition-transform duration-200 hover:scale-[1.02]"
            >
              <h4 className="text-lg font-semibold text-white mb-3">
                {index + 1}. {match.homeTeam}
                <span className="text-gray-300 mx-2"> {t('vs')} </span>
                {match.awayTeam}
                <span className="block text-sm text-gray-400 font-normal">
                  ({format(new Date(match.date), 'yyyy/MM/dd HH:mm', { locale: faIR })}) {/* Changed locale here */}
                </span>
              </h4>
              <div className="flex flex-col space-y-2">
                {['1', 'X', '2'].map(outcome => (
                  <label 
                    key={outcome}
                    className={`inline-flex items-center cursor-pointer p-2 rounded-md transition duration-150
                                ${predictions[match._id]?.includes(outcome)
                                  ? 'bg-blue-600 bg-opacity-50'
                                  : 'bg-blue-700 bg-opacity-30 hover:bg-opacity-50'
                                }`}
                  >
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-blue-400 rounded focus:ring-blue-500"
                      checked={predictions[match._id]?.includes(outcome) || false}
                      onChange={() => handlePredictionChange(match._id, outcome)}
                      // چک‌باکس‌ها در صورت ارسال یا اتمام مهلت غیرفعال می‌شوند
                      disabled={submitting || deadlineSeconds <= 0}
                    />
                    <span className="ml-2 text-white">
                      {outcome === '1' ? t('home_win_abbr', { homeTeam: match.homeTeam }) : 
                       outcome === 'X' ? t('draw_abbr') : 
                       t('away_win_abbr', { awayTeam: match.awayTeam })}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="submit"
            // دکمه ارسال در صورت لاگین نبودن، در حال ارسال بودن، عدم انتخاب همه مسابقات یا اتمام مهلت غیرفعال می‌شود
            disabled={!isAuthenticated || submitting || !allMatchesHaveAtLeastOnePrediction() || deadlineSeconds <= 0}
            className={`py-4 px-10 rounded-full text-xl font-bold shadow-xl transition duration-300 ease-in-out transform
                        ${(!isAuthenticated || !allMatchesHaveAtLeastOnePrediction() || submitting || deadlineSeconds <= 0)
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:scale-105'
                        }`}
          >
            {submitting ? (
              <>
                <ArrowPathIcon className="h-5 w-5 inline-block mr-2 animate-spin" /> {t('submitting_prediction')}
              </>
            ) : (
              t('submit_prediction_button', { price: formPrice.toLocaleString('fa-IR') })
            )}
          </button>
        </div>
      </form>

      {/* مودال خطا */}
      {showErrorModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6 border border-red-700">
            <h3 className="text-xl font-bold mb-4 text-red-400 flex items-center">
              <ExclamationCircleIcon className="h-6 w-6 mr-2" /> {t('error')}
            </h3>
            <p className="mb-6 text-gray-200 whitespace-pre-line">{modalErrorMessage}</p> 
            <div className="flex justify-end">
              <button
                onClick={() => setShowErrorModal(false)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
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

export default PredictionForm;
