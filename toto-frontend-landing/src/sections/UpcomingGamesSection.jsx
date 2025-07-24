// toto-frontend-landing/src/sections/UpcomingGamesSection.js
import React from 'react';

// این کامپوننت لیستی از بازی‌های آتی را نمایش می‌دهد.
// داده‌های بازی‌ها از طریق 'upcomingGames' به عنوان یک prop به آن ارسال می‌شوند.
function UpcomingGamesSection({ upcomingGames }) {
  if (!upcomingGames || upcomingGames.length === 0) {
    return (
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">مسابقات آتی</h2>
        <p className="text-gray-600 text-center py-4">در حال حاضر مسابقه آتی در دسترسی نیست.</p>
      </section>
    );
  }

  return (
    <section className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">مسابقات آتی</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {upcomingGames.map((game) => (
          <a
            key={game._id || game.id} // از _id برای بازی‌های واقعی و id برای mock data استفاده کنید
            href={`https://panel.lotto.green/games/${game._id || game.id}`} // <--- این URL را به مسیر واقعی بازی در پنل کاربری خود تغییر دهید
            className="block bg-blue-50 hover:bg-blue-100 p-4 rounded-md transition-colors duration-200 text-blue-700 font-semibold"
          >
            {game.name}
            {game.deadline && (
              <span className="block text-gray-500 text-sm mt-1">
                مهلت: {new Date(game.deadline).toLocaleString('fa-IR')}
              </span>
            )}
            <span className="float-left text-gray-500 text-sm mt-1"> &larr; جزئیات و فرم</span>
          </a>
        ))}
      </div>
    </section>
  );
}

export default UpcomingGamesSection;
