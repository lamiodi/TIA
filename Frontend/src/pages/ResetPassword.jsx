import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com').replace(/\/$/, '');
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
});

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();

    if (!token) return setMessage('Invalid or expired token.');
    if (password !== confirmPassword) return setMessage("Passwords don't match.");

    try {
      setLoading(true);
      const res = await api.post('/auth/reset-password', {
        token,
        newPassword: password,
      });

      if (res.data.success) {
        setSuccess(true);
        setMessage('Password has been reset successfully!');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setMessage(res.data.message || 'Something went wrong.');
      }
    } catch {
      setMessage('Reset failed. Token may be expired or invalid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center mb-6">Reset Your Password</h2>

        {message && (
          <div
            className={`mb-4 text-sm p-2 rounded ${
              success ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}
          >
            {message}
          </div>
        )}

        {!success && (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">New Password</label>
              <input
                type="password"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Confirm Password</label>
              <input
                type="password"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
