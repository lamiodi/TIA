import { useState, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import axios from "axios";
import { Pencil, Trash2, PlusCircle, CheckCircle } from "lucide-react";
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com';

export default function AdminDiscounts() {
  const navigate = useNavigate();
  const { admin, adminLoading, adminLogout } = useAdminAuth();
  const [discounts, setDiscounts] = useState([]);
  const [form, setForm] = useState({
    code: "",
    type: "percentage",
    value: "",
    active: true,
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Create authenticated axios instance (same pattern as Orders component)
  const getAuthAxios = () => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      throw new Error('Admin not authenticated');
    }
    return axios.create({
      baseURL: API_BASE_URL,
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    });
  };
  
  // Error handler (same pattern as Orders component)
  const handleError = (err, defaultMessage) => {
    if (err.response?.status === 401) {
      setError('Authentication expired. Please log in again.');
      toast.error('Authentication expired. Please log in again.');
      adminLogout();
      setTimeout(() => navigate('/admin/login'), 2000);
    } else {
      const errorMessage = err.response?.data?.error || defaultMessage;
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };
  
  // Fetch discounts
  useEffect(() => {
    if (adminLoading) return;
    
    if (!admin || !admin.isAdmin) {
      setError('Admin access only');
      setLoading(false);
      toast.error('Admin access only');
      setTimeout(() => navigate('/admin/login'), 2000);
      return;
    }
    
    const fetchDiscounts = async () => {
      try {
        setLoading(true);
        setError(null);
        const authAxios = getAuthAxios();
        const response = await authAxios.get('/api/admin/discounts');
        setDiscounts(response.data);
        toast.success('Discounts loaded successfully');
      } catch (err) {
        console.error('Fetch discounts error:', err);
        handleError(err, 'Failed to load discounts');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDiscounts();
  }, [admin, adminLoading, adminLogout, navigate]);
  
  // Submit form (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const authAxios = getAuthAxios();
      const payload = { 
        ...form, 
        value: parseFloat(form.value),
        discount_type: form.type, // Map to backend field name
        discount_value: parseFloat(form.value) // Map to backend field name
      };
      
      if (editingId) {
        await authAxios.put(`/api/admin/discounts/${editingId}`, payload);
        toast.success("Discount updated successfully");
      } else {
        await authAxios.post('/api/admin/discounts', payload);
        toast.success("Discount added successfully");
      }
      
      // Reset form
      setForm({ code: "", type: "percentage", value: "", active: true });
      setEditingId(null);
      
      // Refresh discounts list
      const response = await authAxios.get('/api/admin/discounts');
      setDiscounts(response.data);
    } catch (err) {
      console.error("Submit error:", err);
      handleError(err, 'Failed to save discount');
    } finally {
      setLoading(false);
    }
  };
  
  // Edit discount
  const handleEdit = (discount) => {
    setForm({
      code: discount.code,
      type: discount.discount_type || discount.type, // Handle both field names
      value: discount.discount_value || discount.value, // Handle both field names
      active: discount.active,
    });
    setEditingId(discount.id);
  };
  
  // Delete discount
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this discount?")) return;
    
    setLoading(true);
    try {
      const authAxios = getAuthAxios();
      await authAxios.delete(`/api/admin/discounts/${id}`);
      toast.success("Discount deleted successfully");
      
      // Refresh discounts list
      const response = await authAxios.get('/api/admin/discounts');
      setDiscounts(response.data);
    } catch (err) {
      console.error("Delete error:", err);
      handleError(err, 'Failed to delete discount');
    } finally {
      setLoading(false);
    }
  };
  
  // Loading state
  if (loading || adminLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">
        {editingId ? "Edit Discount" : "Create Discount"}
      </h2>
      
      {/* Discount Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <input
          type="text"
          placeholder="Discount Code"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          className="border p-2 rounded"
          required
        />
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="percentage">Percentage (%)</option>
          <option value="fixed">Fixed Amount</option>
        </select>
        <input
          type="number"
          placeholder="Value"
          value={form.value}
          onChange={(e) => setForm({ ...form, value: e.target.value })}
          className="border p-2 rounded"
          required
        />
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="mr-2"
          />
          <span>Active</span>
        </div>
        <button
          type="submit"
          className="col-span-1 md:col-span-4 bg-blue-600 text-white py-2 px-4 rounded flex items-center justify-center disabled:opacity-50"
          disabled={loading}
        >
          {editingId ? (
            <CheckCircle className="w-5 h-5 mr-2" />
          ) : (
            <PlusCircle className="w-5 h-5 mr-2" />
          )}
          {editingId ? "Update Discount" : "Add Discount"}
        </button>
      </form>
      
      {/* Discount List */}
      <h3 className="text-xl font-semibold mb-2">Existing Discounts</h3>
      
      {loading && discounts.length === 0 ? (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-sm">Loading discounts...</p>
        </div>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">Code</th>
              <th className="p-2 border">Type</th>
              <th className="p-2 border">Value</th>
              <th className="p-2 border">Active</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {discounts.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center p-4">
                  No discounts found
                </td>
              </tr>
            ) : (
              discounts.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="p-2 border">{d.code}</td>
                  <td className="p-2 border capitalize">{d.discount_type || d.type}</td>
                  <td className="p-2 border">
                    {(d.discount_type || d.type) === 'percentage' 
                      ? `${d.discount_value || d.value}%` 
                      : `₦${d.discount_value || d.value}`}
                  </td>
                  <td className="p-2 border">{d.active ? "Yes" : "No"}</td>
                  <td className="p-2 border flex gap-2">
                    <button
                      onClick={() => handleEdit(d)}
                      className="bg-yellow-400 text-white px-2 py-1 rounded flex items-center disabled:opacity-50"
                      disabled={loading}
                    >
                      <Pencil className="w-4 h-4 mr-1" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded flex items-center disabled:opacity-50"
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}