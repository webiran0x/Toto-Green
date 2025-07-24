// src/components/SetResults.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';

function SetResults({ token, API_BASE_URL }) {
  const [totoGames, setTotoGames] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState('');
  const [matchesToSetResults, setMatchesToSetResults] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [gamesLoading, setGamesLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchTotoGames = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/totos`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTotoGames(res.data);
      } catch (err) {
        setError(err.response?.data?.message || t('error_fetching_data'));
      } finally {
        setGamesLoading(false);
      }
    };
    fetchTotoGames();
  }, [token, API_BASE_URL, t]);

  useEffect(() => {
    if (selectedGameId) {
      const selectedGame = totoGames.find(game => game._id === selectedGameId);
      if (selectedGame) {
        const matchesWithoutResult = selectedGame.matches.filter(match => match.result === null && !match.isCancelled);
        setMatchesToSetResults(matchesWithoutResult.map(match => ({
          matchId: match._id,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          result: '',
        })));
        setMessage('');
        setError('');
      }
    } else {
      setMatchesToSetResults([]);
    }
  }, [selectedGameId, totoGames]);

  const handleResultChange = (index, value) => {
    const newMatches = [...matchesToSetResults];
    newMatches[index].result = value;
    setMatchesToSetResults(newMatches);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    const resultsToSend = matchesToSetResults
      .filter(match => ['1', 'X', '2'].includes(match.result))
      .map(match => ({
        matchId: match.matchId,
        result: match.result,
      }));

    if (resultsToSend.length === 0) {
      setError(t('please_select_at_least_one_result'));
      setLoading(false);
      return;
    }

    console.log('Sending results:', resultsToSend);

    try {
      const res = await axios.put(
        `${API_BASE_URL}/admin/games/set-results/${selectedGameId}`,
        { results: resultsToSend },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Response from server:', res.data);

      setMessage(res.data.message || '');
      setTotoGames(prev =>
        prev.map(game => (game._id === res.data.totoGame._id ? res.data.totoGame : game))
      );

      if (res.data.status === 'complete') {
        setSelectedGameId('');
        setMatchesToSetResults([]);
      } else {
        const remaining = res.data.totoGame.matches.filter(m => !m.result && !m.isCancelled);
        setMatchesToSetResults(remaining.map(match => ({
          matchId: match._id,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          result: '',
        })));
      }
    } catch (err) {
      console.error('Error submitting results:', err);
      setError(err.response?.data?.message || t('error_setting_results'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('set_game_results')}</h2>

      {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">{message}</div>}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}

      <div className="mb-4">
        <label htmlFor="selectGame" className="block text-gray-700 text-sm font-bold mb-2">{t('select_toto_game')}</label>
        {gamesLoading ? (
          <p>{t('loading')}</p>
        ) : (
          <select
            id="selectGame"
            value={selectedGameId}
            onChange={e => setSelectedGameId(e.target.value)}
            className="shadow border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('select_game_placeholder')}</option>
            {totoGames.map(game => (
              <option key={game._id} value={game._id}>
                {game.name} ({t(`status_${game.status}`)})
              </option>
            ))}
          </select>
        )}
      </div>

      {matchesToSetResults.length > 0 ? (
        <form onSubmit={handleSubmit}>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">{t('set_results_for_selected_matches')}</h3>
          {matchesToSetResults.map((match, index) => (
            <div key={match.matchId} className="mb-4 p-3 border rounded">
              <h4 className="font-semibold mb-1">{match.homeTeam} vs {match.awayTeam}</h4>
              <div>
                <label className="block mb-1">{t('final_result')}</label>
                <select
                  className="shadow border rounded-md w-full py-2 px-3 text-gray-700"
                  value={match.result}
                  onChange={e => handleResultChange(index, e.target.value)}
                >
                  <option value="">{t('select_outcome')}</option>
                  <option value="1">{t('home_win', { homeTeam: match.homeTeam })}</option>
                  <option value="X">{t('draw')}</option>
                  <option value="2">{t('away_win', { awayTeam: match.awayTeam })}</option>
                </select>
              </div>
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md w-full focus:outline-none focus:shadow-outline transition duration-200 ease-in-out disabled:opacity-50"
          >
            {loading ? t('submitting') : t('submit_results_and_score')}
          </button>
        </form>
      ) : selectedGameId && !gamesLoading ? (
        <p className="text-gray-600 mt-4">{t('all_matches_have_results')}</p>
      ) : null}
    </div>
  );
}

export default SetResults;
