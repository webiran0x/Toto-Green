// toto-frontend-landing/src/sections/LastGameSection.jsx
import React from 'react';
import axios from 'axios'; // axios برای تابع دانلود نیاز است

// این کامپوننت جزئیات آخرین بازی تکمیل شده و آمار آن را نمایش می‌دهد.
// داده‌های بازی از طریق 'lastGame' به عنوان یک prop به آن ارسال می‌شوند.
function LastGameSection({ lastGame }) {
  if (!lastGame) {
    return (
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">آخرین بازی انجام شده</h2>
        <p className="text-gray-600 text-center py-4">اطلاعات آخرین بازی در حال حاضر در دسترس نیست.</p>
      </section>
    );
  }

  // دسترسی به مقادیر مستقیماً از آبجکت lastGame، طبق ساختار مدل TotoGame
  // --- اصلاح شده: اطمینان از دسترسی صحیح به prizePool ---
  const totalPotDisplay = lastGame.totalPot ? lastGame.totalPot.toLocaleString('fa-IR') : '0';
  const prizePoolDisplay = lastGame.prizePool ? lastGame.prizePool.toLocaleString('fa-IR') : '0';
  const commissionAmountDisplay = lastGame.commissionAmount ? lastGame.commissionAmount.toLocaleString('fa-IR') : '0';

  const firstPlacePrizeDisplay = lastGame.prizes?.firstPlace ? lastGame.prizes.firstPlace.toLocaleString('fa-IR') : '0';
  const secondPlacePrizeDisplay = lastGame.prizes?.secondPlace ? lastGame.prizes.secondPlace.toLocaleString('fa-IR') : '0';
  const thirdPlacePrizeDisplay = lastGame.prizes?.thirdPlace ? lastGame.prizes.thirdPlace.toLocaleString('fa-IR') : '0';

  // Winners are populated with username now, so map them
  const firstPlaceWinnersDisplay = lastGame.winners?.first?.map(w => w.username).join(', ') || '---';
  const secondPlaceWinnersDisplay = lastGame.winners?.second?.map(w => w.username).join(', ') || '---';
  const thirdPlaceWinnersDisplay = lastGame.winners?.third?.map(w => w.username).join(', ') || '---';

  // --- تابع برای ساخت URL دانلود فایل پیش‌بینی‌ها ---
  const handleDownloadPredictions = (gameId, gameName) => {
    // از axios.defaults.baseURL استفاده می‌کنیم که در App.jsx تنظیم شده است.
    // سپس مسیر API دانلود را به آن اضافه می‌کنیم.
    const downloadUrl = `${axios.defaults.baseURL}/admin/download-predictions/${gameId}`;
    
    // ساخت نام فایل پیشنهادی
    const filename = `predictions_${gameName.replace(/\s/g, '_')}.csv`; // جایگزینی فاصله با آندرلاین برای نام فایل

    // باز کردن لینک در تب جدید مرورگر
    window.open(downloadUrl, '_blank');
    // توجه: برای دانلود مستقیم با نام مشخص در مرورگر، باید هدرهای Content-Disposition در بک‌اند صحیح تنظیم شده باشند.
  };
  // --- پایان تابع دانلود ---

  return (
    <section className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">آخرین بازی انجام شده: {lastGame.name}</h2>
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">میزبان</th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">نتیجه</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">میهمان</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاریخ</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">زمان</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وضعیت</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {lastGame.matches && lastGame.matches.length > 0 ? (
              lastGame.matches.map((match, index) => (
                <tr key={match._id || index}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{match.homeTeam}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-center text-gray-700 font-semibold">{match.result || '---'}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{match.awayTeam}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{new Date(match.date).toLocaleDateString('fa-IR')}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{new Date(match.date).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{lastGame.status === 'completed' ? 'پایان' : '---'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-2 text-center text-sm text-gray-500">هیچ بازی برای نمایش وجود ندارد.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">گزارش آماری مسابقه ({lastGame.matches?.length || 0} بازی)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
        <p><strong>مجموع مبلغ فرم‌ها:</strong> <span className="float-left font-semibold text-blue-600">{totalPotDisplay} ریال</span></p>
        <p><strong>کمیسیون کسر شده:</strong> <span className="float-left font-semibold text-blue-600">{commissionAmountDisplay} ریال</span></p>
        <p><strong>جایزه کل:</strong> <span className="float-left font-semibold text-blue-600">{prizePoolDisplay} ریال</span></p>
        <p><strong>تعداد نفرات اول:</strong> <span className="float-left font-semibold text-green-600">{lastGame.winners?.first?.length || 0} فرم</span></p>
        <p><strong>جایزه هر نفر (اول):</strong> <span className="float-left font-semibold text-green-600">{firstPlacePrizeDisplay} ریال</span></p>
        <p><strong>تعداد نفرات دوم:</strong> <span className="float-left font-semibold text-green-600">{lastGame.winners?.second?.length || 0} فرم</span></p>
        <p><strong>جایزه هر نفر (دوم):</strong> <span className="float-left font-semibold text-green-600">{secondPlacePrizeDisplay} ریال</span></p>
        <p><strong>تعداد نفرات سوم:</strong> <span className="float-left font-semibold text-green-600">{lastGame.winners?.third?.length || 0} فرم</span></p>
        <p><strong>جایزه هر نفر (سوم):</strong> <span className="float-left font-semibold text-green-600">{thirdPlacePrizeDisplay} ریال</span></p>
        <p><strong>برندگان نفر اول:</strong> <span className="float-left font-semibold text-green-600">{firstPlaceWinnersDisplay}</span></p>
        <p><strong>برندگان نفر دوم:</strong> <span className="float-left font-semibold text-green-600">{secondPlaceWinnersDisplay}</span></p>
        <p><strong>برندگان نفر سوم:</strong> <span className="float-left font-semibold text-green-600">{thirdPlaceWinnersDisplay}</span></p>
        
        {/* --- اضافه شدن دکمه دانلود --- */}
        {lastGame._id && ( // اگر ID بازی وجود داشت، دکمه دانلود رو نمایش بده
            <div className="md:col-span-2 mt-4 pt-4 border-t border-gray-200 text-center">
                <button
                    onClick={() => handleDownloadPredictions(lastGame._id, lastGame.name)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline transition duration-200 ease-in-out shadow-lg"
                >
                    دانلود فرم‌های پیش‌بینی این بازی
                </button>
            </div>
        )}
        {/* --- پایان اضافه شدن دکمه دانلود --- */}

        {/* می‌توانید لینک‌های دانلود فایل‌های دیگر را نیز اینجا اضافه کنید */}
        {/* <p><strong>فایل فتوکل:</strong> <a href="#" className="float-left text-blue-500 hover:underline">دانلود</a></p>
        <p><strong>فایل نفرات برتر:</strong> <a href="#" className="float-left text-blue-500 hover:underline">دانلود</a></p> */}
      </div>
    </section>
  );
}

export default LastGameSection;
