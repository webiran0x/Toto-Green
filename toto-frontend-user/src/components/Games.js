// toto-frontend-user/src/components/Games.js


import React, { useEffect, useState } from 'react';
import axios from 'axios';

function ExpiredGames() {
  const [games, setGames] = useState([]);

  useEffect(() => {
    axios.get('/api/user/games/expired', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then(res => setGames(res.data.games))
      .catch(err => console.error(err));
  }, []);

  const downloadExcel = (gameId) => {
    window.open(`/api/user/games/${gameId}/download`, '_blank');
  };

  return (
    <div className="mt-10 p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">مسابقات پایان‌یافته</h2>
      {games.length === 0 && <p>هیچ مسابقه‌ای به پایان نرسیده.</p>}
      <ul>
        {games.map((game) => (
          <li key={game._id} className="flex justify-between items-center border-b py-2">
            <div>
              <p className="font-medium">{game.title}</p>
              <p className="text-sm text-gray-500">تاریخ پایان: {new Date(game.deadline).toLocaleDateString()}</p>
            </div>
            <button
              className="bg-green-600 text-white px-3 py-1 rounded"
              onClick={() => downloadExcel(game._id)}
            >
              دانلود اکسل
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ExpiredGames;
