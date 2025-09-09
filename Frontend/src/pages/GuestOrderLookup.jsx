import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Mail, Package, Calendar, CreditCard, MapPin, User, Phone, Truck, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const GuestOrderLookup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [reference, setReference] = useState(searchParams.get('reference') || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // Auto-lookup if both email and reference are provided in URL
  useEffect(() => {
    if (email && reference) {
      handleLookup();
    }
  }, []);

  const handleLookup = async (e) => {
    if (e) e.preventDefault();
    
    if (!email || !reference) {
      setError('Please provide both email and order reference');
      return;
    }

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/orders/guest-lookup`, {
        email: email.trim(),
        reference: reference.trim()
      });

      setOrder(response.data);
      setShowOrderDetails(true);
      toast.success('Order found successfully!');
    } catch (err) {
      console.error('Guest order lookup error:', err);
      if (err.response?.status === 404) {
        setError('Order not found. Please check your email and order reference.');
      } else if (err.response?.status === 403) {
        setError('Access denied. This order does not belong to the provided email.');
      } else {
        setError('Failed to lookup order. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'processing':
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'processing':
      case 'shipped':
        return <Truck className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount, currency = 'NGN') => {
    const symbols = { NGN: '₦', USD: '$', EUR: '€', GBP: '£' };
    return `${symbols[currency] || currency} ${parseFloat(amount || 0).toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 font-Manrope flex items-center gap-2">
            <Package className="w-6 h-6" />
            Guest Order Lookup
          </h1>
          
          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-Jost">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-Jost"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-Jost">
                Order Reference
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Enter your order reference (e.g., ORD-123456)"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-Jost"
                  required
                />
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm font-Jost">{error}</p>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors font-Manrope disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Looking up order...' : 'Find My Order'}
            </button>
          </form>
        </div>
        
        {order && showOrderDetails && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 font-Manrope">
                Order Details
              </h2>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)} font-Jost`}>
                {getStatusIcon(order.status)}
                <span className="ml-1 capitalize">{order.status}</span>
              </span>
            </div>
            
            {/* Order Summary */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-Jost">Order Reference</p>
                    <p className="font-medium font-Manrope">{order.reference}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-Jost">Order Date</p>
                    <p className="font-medium font-Manrope">{formatDate(order.created_at)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-Jost">Total Amount</p>
                    <p className="font-medium font-Manrope">{formatCurrency(order.total, order.currency)}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-Jost">Customer</p>
                    <p className="font-medium font-Manrope">
                      {order.billing_full_name || `${order.first_name} ${order.last_name}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-Jost">Email</p>
                    <p className="font-medium font-Manrope">{order.billing_email || order.user_email}</p>
                  </div>
                </div>
                
                {order.phone_number && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Phone className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-Jost">Phone</p>
                      <p className="font-medium font-Manrope">{order.phone_number}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Shipping Address */}
            {(order.address_line_1 || order.billing_address_line_1) && (
              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 font-Manrope flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Shipping Address
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium font-Manrope">
                    {order.billing_full_name || `${order.first_name} ${order.last_name}`}
                  </p>
                  <p className="text-gray-600 font-Jost">
                    {order.address_line_1 || order.billing_address_line_1}
                  </p>
                  {(order.address_line_2 || order.billing_address_line_2) && (
                    <p className="text-gray-600 font-Jost">
                      {order.address_line_2 || order.billing_address_line_2}
                    </p>
                  )}
                  <p className="text-gray-600 font-Jost">
                    {order.city || order.billing_city}, {order.state || order.billing_state} {order.zip_code || order.billing_zip_code}
                  </p>
                  <p className="text-gray-600 font-Jost">
                    {order.shipping_country || order.country}
                  </p>
                </div>
              </div>
            )}
            
            {/* Order Items */}
            {order.items && order.items.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 font-Manrope">
                  Order Items ({order.items.length})
                </h3>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 font-Manrope">{item.name}</h4>
                        <p className="text-sm text-gray-500 font-Jost">
                          Quantity: {item.quantity} × {formatCurrency(item.price, order.currency)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium font-Manrope">
                          {formatCurrency(item.quantity * item.price, order.currency)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-6 pt-6 border-t">
              <button
                onClick={() => navigate('/')}
                className="w-full bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors font-Manrope"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default GuestOrderLookup;