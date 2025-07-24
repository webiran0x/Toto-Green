// toto-frontend-landing/src/sections/LastGameSection.js
import React from 'react';

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
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">روز</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ساعت</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وضعیت</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {lastGame.matches.map((match, index) => (
              <tr key={index}>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{match.home}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-center text-gray-700 font-semibold">{match.score}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{match.away}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{match.day}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{match.time}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{match.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">گزارش آماری مسابقه ({lastGame.matches.length} بازی)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
        <p><strong>تعداد فرم:</strong> <span className="float-left font-semibold text-blue-600">{lastGame.stats.totalForms} فرم</span></p>
        <p><strong>مبلغ کل:</strong> <span className="float-left font-semibold text-blue-600">{lastGame.stats.totalAmount} ریال</span></p>
        <p><strong>تعداد نفرات اول:</strong> <span className="float-left font-semibold text-green-600">{lastGame.stats.firstPlaceWinners} فرم (16 امتیازی)</span></p>
        <p><strong>جایزه هر نفر (اول):</strong> <span className="float-left font-semibold text-green-600">{lastGame.stats.firstPlacePrize} ریال</span></p>
        <p><strong>تعداد نفرات دوم:</strong> <span className="float-left font-semibold text-green-600">{lastGame.stats.secondPlaceWinners} فرم (15 امتیازی)</span></p>
        <p><strong>جایزه هر نفر (دوم):</strong> <span className="float-left font-semibold text-green-600">{lastGame.stats.secondPlacePrize} ریال</span></p>
        <p><strong>فایل فتوکل:</strong> <a href="#" className="float-left text-blue-500 hover:underline">دانلود</a></p>
        <p><strong>فایل نفرات برتر:</strong> <a href="#" className="float-left text-blue-500 hover:underline">دانلود</a></p>
      </div>
    </section>
  );
}

export default LastGameSection;
