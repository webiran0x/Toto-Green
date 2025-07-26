// toto-frontend-admin/src/components/EditUser.js
// کامپوننت ویرایش پروفایل کاربر

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

// نیازی نیست token و API_BASE_URL به عنوان پراپ پاس داده شوند.
// axios.defaults.baseURL و axios.defaults.withCredentials در App.js تنظیم شده‌اند.
function EditUser() { // 'token' و 'API_BASE_URL' از پراپس حذف شدند
  const { userId } = useParams(); // دریافت userId از URL
  const navigate = useNavigate(); // هوک useNavigate برای ناوبری
  const [user, setUser] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: '',
    accessLevel: '',
    status: '',
    balance: 0,
    score: 0,
  });
  const { t } = useLanguage();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError('');
        // درخواست Axios برای دریافت اطلاعات کاربر:
        // baseURL از axios.defaults.baseURL در App.js گرفته می‌شود.
        // کوکی‌ها به خاطر axios.defaults.withCredentials = true ارسال می‌شوند.
        // بنابراین، نیازی به هدر Authorization یا تعیین کامل baseURL در اینجا نیست.
        const userRes = await axios.get(`/admin/users/${userId}`); // '/api' از ابتدای مسیر حذف شد
        setUser(userRes.data);
        setFormData({
          username: userRes.data.username,
          email: userRes.data.email,
          role: userRes.data.role,
          accessLevel: userRes.data.accessLevel,
          status: userRes.data.status,
          balance: userRes.data.balance,
          score: userRes.data.score,
        });

        // درخواست Axios برای دریافت پیش‌بینی‌های کاربر:
        const predictionsRes = await axios.get(`/admin/users/${userId}/predictions`); // '/api' از ابتدای مسیر حذف شد
        setPredictions(predictionsRes.data);

      } catch (err) {
        setError(err.response?.data?.message || t('error_fetching_user_info_admin'));
        console.error('Error fetching user data:', err.response?.data || err.message); // لاگ برای اشکال‌زدایی
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId, t]); // 'token' و 'API_BASE_URL' از وابستگی‌ها حذف شدند

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      // درخواست Axios برای به‌روزرسانی پروفایل کاربر:
      // baseURL از axios.defaults.baseURL در App.js گرفته می‌شود.
      // کوکی‌ها به خاطر axios.defaults.withCredentials = true ارسال می‌شوند.
      await axios.put(`/admin/users/${userId}`, formData); // '/api' از ابتدای مسیر حذف شد
      setMessage(t('profile_updated_success_admin'));
    } catch (err) {
      setError(err.response?.data?.message || t('error_updating_profile_admin'));
      console.error('Error updating user profile:', err.response?.data || err.message); // لاگ برای اشکال‌زدایی
    }
  };

  const getPredictionOutcomeText = (outcomeArray) => {
    return outcomeArray.join('/');
  };

  if (loading) return <div className="text-center py-8">{t('loading')}</div>;
  if (error) return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>;
  if (!user) return <div className="text-center py-8">{t('user_not_found_admin')}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">{t('edit_user_admin')} {user.username}</h2>
        <button
          onClick={() => navigate('/admin/users')}
          className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition duration-200"
        >
          {t('back_to_manage_users_admin')}
        </button>
      </div>

      {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">{message}</div>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">{t('username')}:</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">{t('email')}:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">{t('role_label_admin')}:</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="shadow border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="user">{t('normal_user_admin')}</option>
            <option value="admin">{t('admin_role_admin')}</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">{t('access_level_admin')}:</label>
          <select
            name="accessLevel"
            value={formData.accessLevel}
            onChange={handleChange}
            className="shadow border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="normal">normal</option>
            <option value="vip">vip</option>
            <option value="moderator">moderator</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">{t('status_admin')}:</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="shadow border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">{t('active_admin')}</option>
            <option value="blocked">{t('blocked_admin')}</option>
            <option value="suspended">{t('suspended_admin')}</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">{t('balance_admin')}:</label>
          <input
            type="number"
            name="balance"
            value={formData.balance}
            onChange={handleChange}
            className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">{t('total_score_label_admin')}:</label>
          <input
            type="number"
            name="score"
            value={formData.score}
            onChange={handleChange}
            className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {user.referrer && (
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">{t('referrer_admin')}:</label>
            <p className="py-2 px-3 text-gray-700 bg-gray-100 rounded-md">{user.referrer.username || user.referrer}</p>
          </div>
        )}
        <div className="md:col-span-2 mt-4">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-200 ease-in-out w-full"
          >
            {t('update_profile_admin')}
          </button>
        </div>
      </form>

      <h3 className="text-xl font-bold text-gray-800 mb-4 mt-8">{t('user_predictions_history_admin')}</h3>
      {predictions.length === 0 ? (
        <p className="text-gray-600">{t('no_predictions_for_user_admin')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {predictions.map((prediction) => (
            <div key={prediction._id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="font-bold text-lg text-blue-700 mb-2">{t('game')}: {prediction.totoGame?.name || t('unknown')}</p>
              <p className="text-gray-700 text-sm mb-1">{t('submission_date_admin')}: {new Date(prediction.createdAt).toLocaleString('fa-IR')}</p>
              <p className="text-gray-700 text-sm mb-1">{t('form_cost')}: {prediction.price?.toLocaleString('fa-IR') || 0} {t('toman')}</p>
              <p className="text-gray-700 text-sm font-bold mb-3">{t('total_score_label')}: {prediction.score} ({t('scored_admin')}: {prediction.isScored ? t('yes') : t('no')})</p>
              <p className="text-gray-700 text-sm mb-3">{t('refunded')}: {prediction.isRefunded ? t('yes') : t('no')}</p>


              <h4 className="font-semibold text-gray-800 mt-3 mb-2">{t('prediction_details_admin')}:</h4>
              <ul className="list-disc list-inside text-gray-600 text-sm">
                {prediction.predictions.map((predItem, index) => (
                  <li key={index} className="mb-1">
                    <span className="font-medium">
                      {prediction.totoGame?.matches.find(m => m._id === predItem.matchId)?.homeTeam} vs{' '}
                      {prediction.totoGame?.matches.find(m => m._id === predItem.matchId)?.awayTeam}:
                    </span>{' '}
                    <span className="font-bold text-blue-600">{getPredictionOutcomeText(predItem.chosenOutcome)}</span>
                    {prediction.totoGame?.status !== 'open' && prediction.totoGame?.matches.find(m => m._id === predItem.matchId)?.result && (
                        <span className="ml-2 text-gray-500"> ({t('result_label_admin')}: {prediction.totoGame.matches.find(m => m._id === predItem.matchId).result})</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EditUser;