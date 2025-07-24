// toto-frontend-user/src/components/ExpiredGames.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ExpiredGames = () => {
  const [games, setGames] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('توکن موجود نیست، لطفا وارد شوید');
      return;
    }

    axios.get('https://lotto.green/api/users/games/expired', {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    })
    .then(response => {
      // اگر ساختار پاسخ مثل { games: [...] } است:
      // setGames(response.data.games);

      // اگر پاسخ مستقیم آرایه است:
      setGames(response.data);
    })
    .catch(error => console.error('Error fetching expired games:', error));
  }, []);

  const handleDownload = (gameId) => {
    window.open(`https://lotto.green/api/users/games/${gameId}/download`, '_blank');
  };

  return (
    <div>
      <h2>مسابقات پایان یافته</h2>
      {games.length === 0 ? (
        <p>هیچ مسابقه پایان‌یافته‌ای یافت نشد.</p>
      ) : (
        <ul>
          {games.map(game => (
            <li key={game._id}>
              <strong>{game.name}</strong> - تاریخ: {new Date(game.endDate).toLocaleDateString('fa-IR')}
              <button onClick={() => handleDownload(game._id)} style={{ marginRight: '10px' }}>
                دانلود اکسل شرکت‌کنندگان
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ExpiredGames;
