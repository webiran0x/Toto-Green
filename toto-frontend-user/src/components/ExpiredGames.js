// toto-frontend-user/src/components/ExpiredGames.js
import React, { useEffect, useState, useCallback } from 'react'; // useCallback اضافه شد
import axios from 'axios';
// useLanguage اضافه نشده است، اما اگر متن فارسی نیاز به ترجمه دارد، باید اضافه شود.

const ExpiredGames = () => {
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
      const response = await axios.get('/users/games/expired'); // مسیر اصلاح شد: /api/ حذف شد

      // اگر ساختار پاسخ مثل { games: [...] } است، می‌توانید آن را به این شکل ست کنید:
      // setGames(response.data.games);

      // اگر پاسخ مستقیم آرایه است (که به نظر می‌رسد همینطور است):
      setGames(response.data);
    } catch (error) {
      // بهتر است خطاهای مربوط به عدم احراز هویت را در App.js مدیریت کنید.
      // در اینجا فقط خطاهای دریافت اطلاعات را نمایش می‌دهیم.
      console.error('Error fetching expired games:', error.response?.data || error.message);
      setError('خطا در دریافت مسابقات پایان‌یافته.'); // پیام خطای عمومی
    } finally {
      setLoading(false); // پایان لودینگ
    }
  }, []); // هیچ وابستگی به token یا API_BASE_URL نیست

  useEffect(() => {
    fetchGames();
  }, [fetchGames]); // fetchGames به عنوان dependency برای useEffect

  const handleDownload = (gameId) => {
    // استفاده از axios.defaults.baseURL برای ساخت URL دانلود
    // اگر فایل در همین دامنه API ارائه می‌شود، مرورگر کوکی‌ها را به صورت خودکار ارسال می‌کند.
    const downloadUrl = `${axios.defaults.baseURL}/users/games/${gameId}/download`;
    window.open(downloadUrl, '_blank');
  };

  if (loading) {
    return <div className="text-center py-4">در حال بارگذاری مسابقات...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600 py-4">{error}</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">مسابقات پایان یافته</h2>
      {games.length === 0 ? (
        <p className="text-gray-600">هیچ مسابقه پایان‌یافته‌ای یافت نشد.</p>
      ) : (
        <ul className="list-disc pl-5">
          {games.map(game => (
            <li key={game._id} className="mb-2 p-2 border-b border-gray-200">
              <strong className="text-blue-700">{game.name}</strong> - تاریخ: {new Date(game.endDate || game.deadline).toLocaleDateString('fa-IR')}
              <button
                onClick={() => handleDownload(game._id)}
                className="ml-4 bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-md text-sm transition duration-200"
              >
                دانلود شرکت‌کنندگان (Excel/CSV)
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ExpiredGames;