import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Pencil, Trash2, PlusCircle, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { format } from 'date-fns';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com';

export default function AdminDiscounts() {
  const navigate = useNavigate();
  const { admin, adminLoading, adminLogout } = useAdminAuth();
  const [discounts, setDiscounts] = useState([]);
  const [form, setForm] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    active: true,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd') // 30 days from now
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Create an axios instance with admin auth headers
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
  
  useEffect(() => {
    if (!adminLoading && (!admin || !admin.isAdmin)) {
      setError('Admin access only');
      setLoading(false);
      toast.error('Admin access only');
      return;
    }
    
    const fetchDiscounts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const authAxios = getAuthAxios();
        const res = await authAxios.get('/api/admin/discounts');
        
        setDiscounts(res.data);
        toast.success('Discounts loaded successfully');
      } catch (error) {
        console.error('Failed to fetch discounts:', error);
        
        if (error.response?.status === 401) {
          setError('Your session has expired. Please log in again.');
          toast.error('Session expired. Please log in again.');
          adminLogout();
          return;
        }
        
        setError(`Failed to load discounts: ${error.response?.data?.error || error.message}`);
        toast.error(`Failed to load discounts: ${error.response?.data?.error || error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    if (!adminLoading) fetchDiscounts();
  }, [admin, adminLoading, adminLogout, navigate]);
  
  // Submit form (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const authAxios = getAuthAxios();
      
      // Prepare payload with all required fields
      const payload = { 
        ...form, 
        discount_value: parseFloat(form.discount_value),
        product_id: null // We're not using product-specific discounts
      };
      
      if (editingId) {
        await authAxios.put(`/api/admin/discounts/${editingId}`, payload);
        toast.success("Discount updated successfully");
      } else {
        await authAxios.post('/api/admin/discounts', payload);
        toast.success("Discount added successfully");
      }
      
      // Reset form
      setForm({
        code: "",
        discount_type: "percentage",
        discount_value: "",
        active: true,
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
      });
      setEditingId(null);
      
      // Refresh discounts list
      const response = await authAxios.get('/api/admin/discounts');
      setDiscounts(response.data);
    } catch (error) {
      console.error("Submit error:", error);
      
      if (error.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        toast.error('Session expired. Please log in again.');
        adminLogout();
        return;
      }
      
      setError(`Failed to save discount: ${error.response?.data?.error || error.message}`);
      toast.error(`Failed to save discount: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Edit discount
  const handleEdit = (discount) => {
    setForm({
      code: discount.code,
      discount_type: discount.discount_type,
      discount_value: discount.discount_value,
      active: discount.active,
      start_date: discount.start_date ? format(new Date(discount.start_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      end_date: discount.end_date ? format(new Date(discount.end_date), 'yyyy-MM-dd') : format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
    });
    setEditingId(discount.id);
  };
  
  // Delete discount
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this discount?")) return;
    
    try {
      setLoading(true);
      const authAxios = getAuthAxios();
      await authAxios.delete(`/api/admin/discounts/${id}`);
      toast.success("Discount deleted successfully");
      
      // Refresh discounts list
      const response = await authAxios.get('/api/admin/discounts');
      setDiscounts(response.data);
    } catch (error) {
      console.error("Delete error:", error);
      
      if (error.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        toast.error('Session expired. Please log in again.');
        adminLogout();
        return;
      }
      
      setError(`Failed to delete discount: ${error.response?.data?.error || error.message}`);
      toast.error(`Failed to delete discount: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Loading state
  if (loading) {
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
            <XCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="space-y-6"
      style={{
        '--color-Primarycolor': '#1E1E1E',
        '--color-Secondarycolor': '#ffffff',
        '--color-Accent': '#6E6E6E',
        '--font-Manrope': '"Manrope", "sans-serif"',
        '--font-Jost': '"Jost", "sans-serif"'
      }}
    >
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-gray-900 font-Manrope">
            Discounts Management
          </h2>
        </div>
        
        {/* Discount Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-Jost">Discount Code</label>
            <input
              type="text"
              placeholder="Enter discount code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-Jost">Discount Type</label>
            <select
              value={form.discount_type}
              onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
              className="w-full border p-2 rounded"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-Jost">Discount Value</label>
            <input
              type="number"
              placeholder="Enter value"
              value={form.discount_value}
              onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-Jost">Start Date</label>
            <div className="relative">
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full border p-2 rounded"
                required
              />
              <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-Jost">End Date</label>
            <div className="relative">
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full border p-2 rounded"
                required
              />
              <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700 font-Jost">Active</span>
          </div>
          
          <div className="md:col-span-2 lg:col-span-3">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded flex items-center justify-center disabled:opacity-50"
              disabled={loading}
            >
              {editingId ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Update Discount
                </>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Add Discount
                </>
              )}
            </button>
          </div>
        </form>
        
        {/* Discount List */}
        <h3 className="text-xl font-semibold mb-4">Existing Discounts</h3>
        
        {discounts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 font-Jost">No discounts found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm font-Jost">Code</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm font-Jost">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm font-Jost">Value</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm font-Jost">Start Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm font-Jost">End Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm font-Jost">Active</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm font-Jost">Actions</th>
                </tr>
              </thead>
              <tbody>
                {discounts.map((d) => (
                  <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 font-Manrope">{d.code}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 font-Jost capitalize">
                      {d.discount_type}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 font-Manrope">
                      {d.discount_type === 'percentage' 
                        ? `${d.discount_value}%` 
                        : `₦${d.discount_value}`}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 font-Jost">
                      {d.start_date ? format(new Date(d.start_date), 'MMM dd, yyyy') : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 font-Jost">
                      {d.end_date ? format(new Date(d.end_date), 'MMM dd, yyyy') : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        d.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      } font-Jost`}>
                        {d.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(d)}
                          className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(d.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}