import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { 
  Clock, AlertCircle, Package, CheckCircle, XCircle, Search, Filter, Eye, Edit, Trash2, 
  ChevronLeft, ChevronRight, Globe, Mail, CreditCard, Send
} from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { format } from 'date-fns';
import OrderDetailsModal from './OrderDetailsModal';
import AdminDeliveryFeeModal from './AdminDeliveryFeeModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Orders = () => {
  const navigate = useNavigate();
  const { admin, adminLoading, adminLogout } = useAdminAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeliveryFeeModal, setShowDeliveryFeeModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [orderDetails, setOrderDetails] = useState({});
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState({});
  
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
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const authAxios = getAuthAxios();
        const response = await authAxios.get('/api/admin/orders');
        const processedOrders = response.data.map(order => ({
          ...order,
          total: Number(order.total_amount) || 0,
          shipping_cost: Number(order.shipping_cost) || 0,
          created_at: order.created_at || new Date().toISOString(),
          shipping_country: order.shipping_country || 'Unknown',
          currency: order.currency || 'NGN',
          shipping_method: order.shipping_method || 'N/A',
          first_name: order.first_name || 'Unknown',
          last_name: order.last_name || 'Customer',
          user_email: order.user_email || 'N/A',
          payment_status: order.payment_status || 'pending',
          delivery_fee_paid: order.delivery_fee_paid || false,
          delivery_fee: order.delivery_fee || 0,
        }));
        setOrders(processedOrders);
        toast.success('Orders loaded successfully');
      } catch (err) {
        console.error('Fetch orders error:', err);
        handleError(err, 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [admin, adminLoading, adminLogout, navigate]);
  
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
  
  const fetchCompleteOrderDetails = async (orderId) => {
    try {
      setDetailsLoading(true);
      const authAxios = getAuthAxios();
      const response = await authAxios.get(`/api/admin/orders/complete/${orderId}`);
      const initialSelectedImages = {};
      response.data.items?.forEach(item => {
        if (item.images?.length > 0) initialSelectedImages[`item-${item.id}`] = 0;
      });
      response.data.bundleItems?.forEach(bundle => {
        if (bundle.images?.length > 0) initialSelectedImages[`bundle-${bundle.id}`] = 0;
        bundle.bundle_items?.forEach((bundleItem, index) => {
          if (bundleItem.images?.length > 0) initialSelectedImages[`bundle-item-${bundle.id}-${index}`] = 0;
        });
      });
      setSelectedImages(initialSelectedImages);
      setOrderDetails(prev => ({
        ...prev,
        [orderId]: response.data,
      }));
    } catch (err) {
      console.error('Fetch complete order details error:', err);
      handleError(err, 'Failed to load order details');
    } finally {
      setDetailsLoading(false);
    }
  };
  
  const handleImageChange = (itemId, imageIndex) => {
    setSelectedImages(prev => ({ ...prev, [itemId]: imageIndex }));
  };
  
  const updateOrderStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    try {
      const authAxios = getAuthAxios();
      const response = await authAxios.put(`/api/admin/orders/${selectedOrder.id}/status`, { status: newStatus });
      setOrders(orders.map(order => 
        order.id === selectedOrder.id ? { ...order, status: newStatus } : order
      ));
      setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      
      const details = orderDetails[selectedOrder.id] || {};
      const user = details.user || {};
      await authAxios.post('/api/email/send-order-status-update', {
        orderId: selectedOrder.id,
        userEmail: user.email || selectedOrder.user_email,
        userName: `${user.first_name || selectedOrder.first_name} ${user.last_name || selectedOrder.last_name}`,
        status: newStatus,
      });
      
      setShowStatusModal(false);
      toast.success('Order status updated and email sent');
    } catch (err) {
      console.error('Update order status error:', err);
      handleError(err, 'Failed to update order status');
    }
  };
  
  const deleteOrder = async () => {
    if (!selectedOrder) return;
    try {
      const authAxios = getAuthAxios();
      await authAxios.delete(`/api/admin/orders/${selectedOrder.id}`);
      setOrders(orders.filter(order => order.id !== selectedOrder.id));
      setShowDeleteModal(false);
      setShowOrderDetail(false);
      toast.success('Order deleted successfully');
    } catch (err) {
      console.error('Delete order error:', err);
      handleError(err, 'Failed to delete order');
    }
  };
  
  const markAsPacked = async () => {
    if (!selectedOrder) return;
    try {
      const authAxios = getAuthAxios();
      const newStatus = 'processing';
      await authAxios.put(`/api/admin/orders/${selectedOrder.id}/status`, { status: newStatus });
      setOrders(orders.map(order => 
        order.id === selectedOrder.id ? { ...order, status: newStatus } : order
      ));
      setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      
      const details = orderDetails[selectedOrder.id] || {};
      const user = details.user || {};
      await authAxios.post('/api/email/send-order-status-update', {
        orderId: selectedOrder.id,
        userEmail: user.email || selectedOrder.user_email,
        userName: `${user.first_name || selectedOrder.first_name} ${user.last_name || selectedOrder.last_name}`,
        status: newStatus,
      });
      
      setShowOrderDetail(false);
      toast.success('Order marked as packed and email sent');
    } catch (err) {
      console.error('Mark as packed error:', err);
      handleError(err, 'Failed to mark as packed');
    }
  };
  
  const sendEmail = async () => {
    if (!selectedOrder) return;
    try {
      const authAxios = getAuthAxios();
      if (!orderDetails[selectedOrder.id]) await fetchCompleteOrderDetails(selectedOrder.id);
      const details = orderDetails[selectedOrder.id] || {};
      const user = details.user || {};
      await authAxios.post('/api/email/send-order-status-update', {
        orderId: selectedOrder.id,
        userEmail: user.email || selectedOrder.user_email,
        userName: `${user.first_name || selectedOrder.first_name} ${user.last_name || selectedOrder.last_name}`,
        status: selectedOrder.status,
      });
      toast.success('Status update email sent successfully');
    } catch (err) {
      console.error('Send email error:', err);
      handleError(err, 'Failed to send email');
    }
  };
  
  const formatCurrency = (amount, currency = 'NGN') => {
    const numAmount = Number(amount) || 0;
    return new Intl.NumberFormat(currency === 'NGN' ? 'en-NG' : 'en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(numAmount);
  };
  
  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };
  
  const getStatusColor = (status) => ({
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }[status] || 'bg-gray-100 text-gray-800');
  
  const getPaymentStatusColor = (status) => ({
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  }[status] || 'bg-gray-100 text-gray-800');
  
  const getStatusIcon = (status) => ({
    pending: <Clock className="w-4 h-4" />,
    processing: <AlertCircle className="w-4 h-4" />,
    shipped: <Package className="w-4 h-4" />,
    delivered: <CheckCircle className="w-4 h-4" />,
    cancelled: <XCircle className="w-4 h-4" />,
  }[status] || <Clock className="w-4 h-4" />);
  
  const getPaymentStatusIcon = (status) => ({
    pending: <Clock className="w-4 h-4" />,
    completed: <CheckCircle className="w-4 h-4" />,
    failed: <XCircle className="w-4 h-4" />,
  }[status] || <Clock className="w-4 h-4" />);
  
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toString().includes(searchTerm) ||
      order.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPaymentStatus = paymentStatusFilter === 'all' || order.payment_status === paymentStatusFilter;
    const matchesCountry = countryFilter === 'all' || order.shipping_country === countryFilter;
    return matchesSearch && matchesStatus && matchesPaymentStatus && matchesCountry;
  });
  
  const countries = [...new Set(orders.map(order => order.shipping_country).filter(Boolean))];
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  const viewOrderDetails = async (order) => {
    setSelectedOrder(order);
    await fetchCompleteOrderDetails(order.id);
    setShowOrderDetail(true);
  };
  
  const renderStatusModal = () => showStatusModal && selectedOrder && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold font-Manrope">Update Order Status</h3>
        </div>
        <div className="p-4 sm:p-6">
          <p className="mb-4 font-Jost text-sm sm:text-base">Update status for order #{selectedOrder.id}</p>
          <div className="space-y-3">
            {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
              <label key={status} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="status"
                  value={status}
                  checked={newStatus === status}
                  onChange={() => setNewStatus(status)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <div className="ml-3 flex items-center">
                  {getStatusIcon(status)}
                  <span className="ml-2 text-sm font-medium capitalize font-Jost">{status}</span>
                </div>
              </label>
            ))}
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button onClick={() => setShowStatusModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-Jost">
              Cancel
            </button>
            <button onClick={updateOrderStatus} disabled={newStatus === selectedOrder.status} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-Manrope">
              Update Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderDeleteModal = () => showDeleteModal && selectedOrder && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold font-Manrope">Delete Order</h3>
        </div>
        <div className="p-4 sm:p-6">
          <p className="mb-4 font-Jost text-sm sm:text-base">Are you sure you want to delete order #{selectedOrder.id}?</p>
          <div className="mt-6 flex justify-end space-x-3">
            <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-Jost">
              Cancel
            </button>
            <button onClick={deleteOrder} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-Manrope">
              Delete Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
  if (loading || adminLoading) return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
  if (error) return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-auto max-w-7xl">
      <div className="flex">
        <XCircle className="h-5 w-5 text-red-400" />
        <p className="ml-3 text-sm text-red-700 font-Jost">{error}</p>
      </div>
    </div>
  );
  
  return (
    <div 
      className="container mx-auto p-4 sm:p-6 space-y-6 max-w-7xl"
      style={{
        '--color-Primarycolor': '#1E1E1E',
        '--color-Secondarycolor': '#ffffff',
        '--color-Accent': '#6E6E6E',
        '--font-Manrope': '"Manrope", "sans-serif"',
        '--font-Jost': '"Jost", "sans-serif"'
      }}
    >
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col gap-4 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 font-Manrope">Orders Management</h2>
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <div className="relative w-full sm:w-64">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ID, reference, or customer..."
                className="w-full pl-10 pr-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-Jost"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative w-full sm:w-48">
              <Filter className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select className="w-full pl-10 pr-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-Jost" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="relative w-full sm:w-48">
              <CreditCard className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select className="w-full pl-10 pr-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-Jost" value={paymentStatusFilter} onChange={(e) => setPaymentStatusFilter(e.target.value)}>
                <option value="all">All Payment Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div className="relative w-full sm:w-48">
              <Globe className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select className="w-full pl-10 pr-4 py-2 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-Jost" value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)}>
                <option value="all">All Countries</option>
                {countries.map(country => <option key={country} value={country}>{country}</option>)}
              </select>
            </div>
          </div>
        </div>
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8"><p className="text-gray-500 font-Jost">No orders found.</p></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 hidden sm:table-header-group">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs sm:text-sm font-Jost">Order ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs sm:text-sm font-Jost">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs sm:text-sm font-Jost">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs sm:text-sm font-Jost">Country</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs sm:text-sm font-Jost">Total</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs sm:text-sm font-Jost">Payment Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs sm:text-sm font-Jost">Order Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs sm:text-sm font-Jost">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrders.map(order => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 flex flex-col sm:table-row">
                      <td className="py-3 px-4 text-sm flex justify-between items-start sm:table-cell">
                        <div>
                          <div className="font-medium text-gray-900 font-Manrope">#{order.id}</div>
                          <div className="text-gray-600 font-Jost">{order.reference}</div>
                          {order.shipping_country !== 'Nigeria' && (
                            <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 font-Jost">
                              <Globe className="w-3 h-3 mr-1" /> International
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2 sm:hidden">
                          <button onClick={() => viewOrderDetails(order)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setSelectedOrder(order); setNewStatus(order.status); setShowStatusModal(true); }} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Update Status">
                            <Edit className="w-4 h-4" />
                          </button>
                          {order.shipping_country !== 'Nigeria' && order.payment_status === 'completed' && !order.delivery_fee_paid && (
                            <button onClick={() => { setSelectedOrder(order); setShowDeliveryFeeModal(true); }} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Send Delivery Fee">
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          {order.status === 'delivered' && (
                            <button onClick={() => { setSelectedOrder(order); setShowDeleteModal(true); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Order">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-2 sm:py-3 px-4 text-sm sm:table-cell">
                        <span className="sm:hidden font-medium font-Jost">Customer: </span>
                        <div className="font-medium text-gray-900 font-Manrope">{order.first_name} {order.last_name}</div>
                        <div className="text-gray-600 font-Jost">{order.user_email}</div>
                      </td>
                      <td className="py-2 sm:py-3 px-4 text-gray-600 text-sm font-Jost sm:table-cell">
                        <span className="sm:hidden font-medium">Date: </span>{formatDate(order.created_at)}
                      </td>
                      <td className="py-2 sm:py-3 px-4 text-gray-600 text-sm font-Jost sm:table-cell">
                        <span className="sm:hidden font-medium">Country: </span>{order.shipping_country}
                      </td>
                      <td className="py-2 sm:py-3 px-4 font-medium text-sm font-Manrope sm:table-cell">
                        <span className="sm:hidden font-medium font-Jost">Total: </span>{formatCurrency(order.total, order.currency)}
                      </td>
                      <td className="py-2 sm:py-3 px-4 text-sm sm:table-cell">
                        <span className="sm:hidden font-medium font-Jost">Payment Status: </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.payment_status)} font-Jost`}>
                          {getPaymentStatusIcon(order.payment_status)}
                          <span className="ml-1 capitalize">{order.payment_status}</span>
                        </span>
                      </td>
                      <td className="py-2 sm:py-3 px-4 text-sm sm:table-cell">
                        <span className="sm:hidden font-medium font-Jost">Order Status: </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)} font-Jost`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">{order.status}</span>
                        </span>
                      </td>
                      <td className="py-2 sm:py-3 px-4 hidden sm:table-cell">
                        <div className="flex space-x-2">
                          <button onClick={() => viewOrderDetails(order)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setSelectedOrder(order); setNewStatus(order.status); setShowStatusModal(true); }} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Update Status">
                            <Edit className="w-4 h-4" />
                          </button>
                          {order.shipping_country !== 'Nigeria' && order.payment_status === 'completed' && !order.delivery_fee_paid && (
                            <button onClick={() => { setSelectedOrder(order); setShowDeliveryFeeModal(true); }} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Send Delivery Fee">
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          {order.status === 'delivered' && (
                            <button onClick={() => { setSelectedOrder(order); setShowDeleteModal(true); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Order">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 px-4 py-3 mt-4 gap-4">
                <div className="text-sm text-gray-700 font-Jost">
                  Showing <span className="font-medium">{indexOfFirstOrder + 1}</span> to <span className="font-medium">{Math.min(indexOfLastOrder, filteredOrders.length)}</span> of <span className="font-medium">{filteredOrders.length}</span> orders
                </div>
                <nav className="flex items-center space-x-1">
                  <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 font-Jost">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNumber = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
                    return (
                      <button 
                        key={pageNumber} 
                        onClick={() => paginate(pageNumber)} 
                        className={`px-3 py-1 border rounded-md font-Jost ${currentPage === pageNumber ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 font-Jost">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
      <OrderDetailsModal
        selectedOrder={selectedOrder}
        showOrderDetail={showOrderDetail}
        setShowOrderDetail={setShowOrderDetail}
        orderDetails={orderDetails}
        detailsLoading={detailsLoading}
        selectedImages={selectedImages}
        handleImageChange={handleImageChange}
        formatCurrency={formatCurrency}
        getStatusIcon={getStatusIcon}
        formatDate={formatDate}
        onUpdateStatus={() => { setShowOrderDetail(false); setShowStatusModal(true); setNewStatus(selectedOrder?.status); }}
        onDeleteOrder={() => { setShowOrderDetail(false); setShowDeleteModal(true); }}
        onMarkAsPacked={markAsPacked}
        onSendEmail={sendEmail}
      />
      {renderStatusModal()}
      {renderDeleteModal()}
      <AdminDeliveryFeeModal
        selectedOrder={selectedOrder}
        showDeliveryFeeModal={showDeliveryFeeModal}
        setShowDeliveryFeeModal={setShowDeliveryFeeModal}
        setOrders={setOrders}
        setSelectedOrder={setSelectedOrder}
      />
    </div>
  );
};

export default Orders;