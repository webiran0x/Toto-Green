// toto-frontend-landing/src/sections/NewGameFormSection.js
import React, { useState, useEffect } from 'react';

// این کامپوننت فرم پیش‌بینی برای بازی جدید را نمایش می‌دهد.
// داده‌های بازی‌ها از طریق 'activeGame' به عنوان یک prop به آن ارسال می‌شوند.
function NewGameFormSection({ activeGame }) { // Changed prop name to activeGame
  // Extract matches and game name from the activeGame object
  const newGameMatches = activeGame?.matches || [];
  const gameName = activeGame?.name || 'مسابقه جدید';

  const [predictions, setPredictions] = useState(
    newGameMatches.map((match) => ({
      matchId: match._id, // Use _id directly as it's from MongoDB
      chosenOutcome: [], // 1, X, 2
    }))
  );

  // این useEffect برای زمانی است که activeGame (یا matches آن) از API تغییر کند
  // تا حالت predictions را ریست کند.
  useEffect(() => {
    setPredictions(
      newGameMatches.map((match) => ({
        matchId: match._id, // Use _id directly
        chosenOutcome: [],
      }))
    );
  }, [newGameMatches]); // Depend on newGameMatches, which is derived from activeGame


  const handlePredictionChange = (matchId, outcome) => {
    setPredictions((prevPredictions) =>
      prevPredictions.map((pred) =>
        pred.matchId === matchId
          ? {
              ...pred,
              chosenOutcome: pred.chosenOutcome.includes(outcome)
                ? pred.chosenOutcome.filter((o) => o !== outcome)
                : [...pred.chosenOutcome, outcome],
            }
          : pred
      )
    );
  };

  const calculateFormPrice = () => {
    let combinations = 1;
    predictions.forEach((pred) => {
      if (pred.chosenOutcome.length > 0) {
        combinations *= pred.chosenOutcome.length;
      }
    });
    return combinations * 1000; // فرض: هر ترکیب 1000 ریال
  };

  const handleSubmitNewForm = (e) => {
    e.preventDefault();
    const price = calculateFormPrice();
    alert(`مبلغ فرم شما: ${price.toLocaleString('fa-IR')} ریال. پیش‌بینی‌ها ثبت شد.`);
    // اینجا می‌توانید منطق ارسال به بک‌اند را اضافه کنید
    console.log('Predictions submitted:', predictions);
    console.log('Calculated Price:', price);
    // توجه: این فرم در Landing Page فقط برای نمایش است و برای ارسال به بک‌اند نیاز به احراز هویت کاربر دارد.
    // در یک سناریوی واقعی، کاربر باید به پنل کاربری هدایت شود تا پیش‌بینی را ثبت کند.
  };

  if (!activeGame || newGameMatches.length === 0) {
    return (
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">فرم مسابقه جدید</h2>
        <p className="text-gray-600 text-center py-4">در حال حاضر مسابقه جدیدی برای پیش‌بینی وجود ندارد.</p>
      </section>
    );
  }

  return (
    <section className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">فرم مسابقه جدید: {gameName}</h2> {/* Display game name */}
      <form onSubmit={handleSubmitNewForm} className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-md text-blue-800 font-medium text-sm flex justify-between items-center">
            <span>حداقل مبلغ: 9,720 ریال</span>
            <span>حداکثر مبلغ: 1,050,000 ریال</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {newGameMatches.map((match) => (
            <div key={match._id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 shadow-sm"> {/* Use _id for real data */}
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-gray-800">{match.homeTeam}</span> {/* Use homeTeam */}
                <span className="text-gray-600"> - </span>
                <span className="font-semibold text-gray-800">{match.awayTeam}</span> {/* Use awayTeam */}
              </div>
              <div className="flex justify-around space-x-2 rtl:space-x-reverse">
                {['1', 'X', '2'].map((outcome) => (
                  <label
                    key={outcome}
                    className={`flex items-center justify-center w-1/3 py-2 rounded-md cursor-pointer transition-colors duration-200
                      ${predictions.find(p => p.matchId === match._id)?.chosenOutcome.includes(outcome) // Use match._id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={predictions.find(p => p.matchId === match._id)?.chosenOutcome.includes(outcome)} // Use match._id
                      onChange={() => handlePredictionChange(match._id, outcome)} // Use match._id
                    />
                    {outcome === '1' ? 'برد میزبان' : outcome === 'X' ? 'مساوی' : 'برد میهمان'}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end items-center space-x-4 rtl:space-x-reverse mt-6">
          <span className="text-xl font-bold text-gray-800">
            مبلغ فرم: <span className="text-blue-600">{calculateFormPrice().toLocaleString('fa-IR')}</span> ریال
          </span>
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-200 ease-in-out transform hover:scale-105"
          >
            ثبت فرم
          </button>
        </div>
      </form>
    </section>
  );
}

export default NewGameFormSection;
