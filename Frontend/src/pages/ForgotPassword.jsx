import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address');
      return;
    }
    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
      setSuccess('Password reset link sent to your email.');
      toast.success('Reset link sent!');
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset link');
      toast.error('Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 font-Jost">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-center font-Manrope">Forgot Password</h2>
        {error && <div className="bg-red-100 text-red-600 p-2 rounded text-sm font-Jost">{error}</div>}
        {success && <div className="bg-green-100 text-green-600 p-2 rounded text-sm font-Jost">{success}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block font-Jost">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full border px-4 py-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black font-Jost"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition font-Manrope"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;