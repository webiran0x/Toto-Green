// toto-frontend-user/src/components/Games.js
// این کامپوننت برای نمایش و مدیریت مسابقات پایان‌یافته کاربر است (همانند ExpiredGames.js)

import React, { useEffect, useState, useCallback } from 'react'; // useCallback اضافه شد
import axios from 'axios';
// اگر نیاز به ترجمه متون "مسابقات پایان‌یافته" و "هیچ مسابقه‌ای به پایان نرسیده" دارید،
// باید useLanguage را اضافه کرده و متن‌ها را با t() ترجمه کنید.

function ExpiredGames() { // نام کامپوننت را همان ExpiredGames نگه می‌داریم تا با استفاده در Dashboard.js همخوانی داشته باشد
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true); // وضعیت لودینگ اضافه شد
  const [error, setError] = useState(''); // وضعیت خطا اضافه شد

  // تابع fetchGames را داخل useCallback قرار می‌دهیم
  const fetchGames = useCallback(async () => {
    try {
      setLoading(true); // شروع لودینگ
      setError(''); // پاک کردن خطاهای قبلی

      // axios به صورت خودکار baseURL و withCredentials را از App.js استفاده می‌کند.
      // بنابراین، نیازی به token و هدر Authorization دستی نیست.
      // مسیر اصلاح شد: '/api/' از ابتدای مسیر حذف شد
      const res = await axios.get('/user/games/expired');

      // فرض می‌کنیم پاسخ مستقیماً آرایه‌ای از بازی‌ها است.
      // اگر پاسخ در یک شیء با کلید 'games' قرار دارد (مثلاً { games: [...] })
      // باید setGames(res.data.games) را استفاده کنید.
      setGames(res.data);
    } catch (err) {
      // خطاها را به صورت کنسول لاگ و در UI نمایش می‌دهیم.
      console.error('Error fetching expired games:', err.response?.data || err.message);
      setError('خطا در دریافت مسابقات پایان‌یافته.'); // پیام خطای عمومی
    } finally {
      setLoading(false); // پایان لودینگ
    }
  }, []); // هیچ وابستگی خارجی اینجا نیست

  useEffect(() => {
    fetchGames();
  }, [fetchGames]); // fetchGames به عنوان dependency برای useEffect

  const downloadExcel = (gameId) => {
    // استفاده از axios.defaults.baseURL برای ساخت URL دانلود.
    // این روش انعطاف‌پذیرتر از hardcode کردن آدرس است.
    const downloadUrl = `${axios.defaults.baseURL}/user/games/${gameId}/download`;
    window.open(downloadUrl, '_blank');
  };

  if (loading) return <div className="text-center py-4">در حال بارگذاری مسابقات...</div>;
  if (error) return <div className="text-center text-red-600 py-4">{error}</div>;

  return (
    <div className="mt-10 p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">مسابقات پایان‌یافته</h2>
      {games.length === 0 ? (
        <p>هیچ مسابقه‌ای به پایان نرسیده.</p>
      ) : (
        <ul>
          {games.map((game) => (
            <li key={game._id} className="flex justify-between items-center border-b py-2">
              <div>
                <p className="font-medium">{game.title || game.name}</p> {/* استفاده از game.name هم در صورت وجود */}
                <p className="text-sm text-gray-500">تاریخ پایان: {new Date(game.deadline || game.endDate).toLocaleDateString('fa-IR')}</p> {/* استفاده از deadline هم در صورت وجود */}
              </div>
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition duration-200"
                onClick={() => downloadExcel(game._id)}
              >
                دانلود اکسل
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ExpiredGames;