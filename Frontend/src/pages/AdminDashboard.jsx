import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDiscounts from '../components/AdminDiscounts';
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  Mail,
  LogOut,
  Tag,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import InventoryManager from '../components/InventoryManager';
import BundleCreator from '../components/BundleCreator';
import AdminUploader from '../components/AdminUploader';
import Orders from '../components/Orders';
import Customers from '../components/Customers';
import AdminNewsletterDashboard from '../components/AdminNewsletterDashboard';
import { useAdminAuth } from '../context/AdminAuthContext';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    avgOrderValue: 0,
    revenueGrowth: 0,
    customerGrowth: 0,
    orderGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { admin, adminLoading, adminLogout } = useAdminAuth();
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
    if (adminLoading) return;
    if (!admin || !admin.isAdmin) {
      setError('Admin access only');
      setLoading(false);
      toast.error('Admin access only');
      setTimeout(() => navigate('/admin/login'), 2000);
      return;
    }
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const authAxios = getAuthAxios();
        const response = await authAxios.get('/api/admin/analytics');
        setAnalytics(response.data);
        toast.success('Analytics loaded successfully');
      } catch (err) {
        console.error('Fetch analytics error:', err);
        if (err.response?.status === 401) {
          setError('Authentication expired. Please log in again.');
          toast.error('Authentication expired. Please log in again.');
          adminLogout();
          setTimeout(() => navigate('/admin/login'), 2000);
        } else {
          setError('Failed to load analytics data');
          toast.error('Failed to load analytics data');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [admin, adminLoading, adminLogout, navigate]);
  const handleLogout = () => {
    adminLogout();
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  const renderDashboard = () => (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-sm text-red-700 font-Jost">{error}</p>
        </div>
      )}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Revenue */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 font-Jost">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 font-Manrope">
                {formatCurrency(analytics.totalRevenue)}
              </p>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1 font-Jost">
                <TrendingUp className="w-4 h-4" />
                {analytics.revenueGrowth}% vs last month
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-500" />
          </div>
          {/* Orders */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 font-Jost">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 font-Manrope">
                {analytics.totalOrders}
              </p>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1 font-Jost">
                <TrendingUp className="w-4 h-4" />
                {analytics.orderGrowth}% vs last month
              </p>
            </div>
            <ShoppingCart className="w-8 h-8 text-blue-500" />
          </div>
          {/* Customers */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 font-Jost">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900 font-Manrope">
                {analytics.totalCustomers}
              </p>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1 font-Jost">
                <TrendingUp className="w-4 h-4" />
                {analytics.customerGrowth}% vs last month
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
          {/* Avg Order */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 font-Jost">Avg. Order Value</p>
              <p className="text-2xl font-bold text-gray-900 font-Manrope">
                {formatCurrency(analytics.avgOrderValue)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      )}
      {/* Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AdminUploader />
        <BundleCreator />
        {/* AdminDiscounts removed from here */}
      </div>
    </div>
  );
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between">
          <h1 className="text-2xl font-bold text-gray-900 font-Manrope">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </header>
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6 py-4">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: DollarSign },
            { id: 'orders', label: 'Orders', icon: ShoppingCart },
            { id: 'customers', label: 'Customers', icon: Users },
            { id: 'inventory', label: 'Inventory', icon: Package },
            { id: 'discounts', label: 'Discounts', icon: Tag },
            { id: 'newsletter', label: 'Newsletter', icon: Mail },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 py-2 px-3 text-sm font-medium ${
                activeTab === id
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-blue-600 hover:border-b-2 hover:border-blue-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>
      </nav>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'orders' && <Orders />}
        {activeTab === 'customers' && <Customers />}
        {activeTab === 'inventory' && <InventoryManager />}
        {activeTab === 'discounts' && <AdminDiscounts />}
        {activeTab === 'newsletter' && <AdminNewsletterDashboard />}
      </main>
    </div>
  );
};
export default AdminDashboard;