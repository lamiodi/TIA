import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com';

const AdminExchangeRate = () => {
  const [rate, setRate] = useState(0.0006);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Fetch exchange rate
  const fetchRate = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/exchange-rate`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setRate(response.data.rate);
    } catch (err) {
      console.error('Error fetching rate:', err);
      showToast('Failed to load exchange rate.', 'error');
    }
  }, []);

  useEffect(() => {
    fetchRate();
  }, [fetchRate]);

  // Toast helper
  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(
        `${API_BASE_URL}/api/exchange-rate`,
        { rate },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      showToast('Exchange rate updated successfully!', 'success');
    } catch (err) {
      console.error('Error updating rate:', err);
      showToast('Failed to update exchange rate.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Manage NGN to USD Exchange Rate</h2>
      <form onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-gray-700">
          Fixed Exchange Rate (NGN to USD)
        </label>
        <input
          type="number"
          step="0.000001"
          value={rate}
          onChange={(e) => setRate(parseFloat(e.target.value))}
          className="mt-1 w-full p-2 border rounded-lg"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg disabled:bg-gray-400"
        >
          {loading ? 'Updating...' : 'Update Rate'}
        </button>
      </form>

      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300 ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default AdminExchangeRate;
