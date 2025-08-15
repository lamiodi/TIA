import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminExchangeRate = () => {
  const [rate, setRate] = useState(0.0006);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/exchange-rate`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setRate(response.data.rate);
      } catch (err) {
        console.error('AdminExchangeRate: Error fetching rate:', err);
        setError('Failed to load exchange rate.');
      }
    };
    fetchRate();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.put(
        `${process.env.REACT_APP_API_BASE_URL}/api/exchange-rate`,
        { rate },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setSuccess('Exchange rate updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('AdminExchangeRate: Error updating rate:', err);
      setError('Failed to update exchange rate.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Manage NGN to USD Exchange Rate</h2>
      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-600">{success}</p>}
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
    </div>
  );
};

export default AdminExchangeRate;