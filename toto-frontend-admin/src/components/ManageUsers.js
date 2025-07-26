import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

// نیازی نیست token و API_BASE_URL به عنوان پراپ پاس داده شوند.
// axios.defaults.baseURL و axios.defaults.withCredentials در App.js تنظیم شده‌اند.
function ManageUsers() { // 'token' و 'API_BASE_URL' از پراپس حذف شدند
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [accessLevelFilter, setAccessLevelFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { t } = useLanguage();
  const navigate = useNavigate();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      const params = {
        page: currentPage,
        limit: 10, // می‌توانید تعداد کاربران در هر صفحه را تنظیم کنید
        keyword,
        role: roleFilter,
        status: statusFilter,
        accessLevel: accessLevelFilter,
      };
      // درخواست Axios:
      // baseURL از axios.defaults.baseURL در App.js گرفته می‌شود.
      // کوکی‌ها به خاطر axios.defaults.withCredentials = true ارسال می‌شوند.
      // بنابراین، نیازی به هدر Authorization یا تعیین کامل baseURL در اینجا نیست.
      const res = await axios.get('/admin/users', { // '/api' از ابتدای مسیر حذف شد
        params,
      });
      setUsers(res.data.users);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      setError(err.response?.data?.message || t('error_fetching_users'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, keyword, roleFilter, statusFilter, accessLevelFilter, t]); // token و API_BASE_URL از وابستگی‌ها حذف شدند

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleBlockActivate = async (userId, newStatus) => {
    try {
      setMessage('');
      setError('');
      const endpoint = newStatus === 'blocked' ? 'block' : 'activate';
      // درخواست Axios:
      // baseURL از axios.defaults.baseURL در App.js گرفته می‌شود.
      // کوکی‌ها به خاطر axios.defaults.withCredentials = true ارسال می‌شوند.
      const res = await axios.put(
        `/admin/users/${userId}/${endpoint}`, // '/api' از ابتدای مسیر حذف شد
        {},
        // نیازی به هدر Authorization نیست
      );
      setMessage(res.data.message);
      fetchUsers(); // رفرش لیست کاربران
    } catch (err) {
      setError(err.response?.data?.message || t('error_updating_user_status'));
    }
  };

  const handleEditUser = (userId) => {
    navigate(`/admin/users/${userId}`);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('manage_users')}</h2>

      {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">{message}</div>}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder={t('search_by_username_email')}
          className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <select
          className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">{t('filter_by_role')}</option>
          <option value="user">{t('user')}</option>
          <option value="admin">{t('admin')}</option>
          <option value="support">{t('support')}</option>
        </select>
        <select
          className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">{t('filter_by_status')}</option>
          <option value="active">{t('active')}</option>
          <option value="blocked">{t('blocked')}</option>
          <option value="suspended">{t('suspended')}</option>
        </select>
        <select
          className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={accessLevelFilter}
          onChange={(e) => setAccessLevelFilter(e.target.value)}
        >
          <option value="">{t('filter_by_access_level')}</option>
          <option value="normal">{t('normal')}</option>
          <option value="vip">{t('vip')}</option>
          <option value="moderator">{t('moderator')}</option>
        </select>
        <button
          onClick={() => {
            setKeyword('');
            setRoleFilter('');
            setStatusFilter('');
            setAccessLevelFilter('');
            setCurrentPage(1); // بازنشانی صفحه به 1 پس از پاک کردن فیلترها
          }}
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-200 ease-in-out"
        >
          {t('clear_filters')}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">{t('loading')}</div>
      ) : users.length === 0 ? (
        <div className="text-center py-8 text-gray-600">{t('no_users_found')}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow overflow-hidden">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">{t('username')}</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">{t('email')}</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">{t('role')}</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">{t('status')}</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">{t('balance')}</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">{t('score')}</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-800">{user.username}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">{user.email}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">{t(user.role)}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' :
                        user.status === 'blocked' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {t(user.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-800">{user.balance.toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">{user.score}</td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditUser(user._id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-md text-xs transition duration-200"
                      >
                        {t('edit')}
                      </button>
                      {user.status === 'active' ? (
                        <button
                          onClick={() => handleBlockActivate(user._id, 'blocked')}
                          className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md text-xs transition duration-200"
                        >
                          {t('block')}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBlockActivate(user._id, 'active')}
                          className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded-md text-xs transition duration-200"
                        >
                          {t('activate')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-md disabled:opacity-50 transition duration-200"
          >
            {t('previous')}
          </button>
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index + 1}
              onClick={() => handlePageChange(index + 1)}
              className={`py-2 px-4 rounded-md transition duration-200 ${
                currentPage === index + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-md disabled:opacity-50 transition duration-200"
          >
            {t('next')}
          </button>
        </div>
      )}
    </div>
  );
}

export default ManageUsers;