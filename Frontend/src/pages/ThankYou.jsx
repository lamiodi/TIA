import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, CheckCircle, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com';

const ThankYou = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reference = searchParams.get('reference') || localStorage.getItem('lastOrderReference');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [polling, setPolling] = useState(false);
  const pollIntervalRef = useRef(null);
  const timeoutRef = useRef(null);

  // Clean up intervals and timeouts on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const startPolling = (token) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    setPolling(true);
    
    pollIntervalRef.current = setInterval(async () => {
      try {
        const pollResponse = await axios.get(`${API_BASE_URL}/api/orders/verify/${reference}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (pollResponse.data.payment_status === 'completed') {
          setOrder(pollResponse.data);
          setPolling(false);
          clearInterval(pollIntervalRef.current);
          toast.success('Payment verified successfully!');
        }
      } catch (err) {
        console.error('Error polling payment status:', err);
      }
    }, 5000); // Poll every 5 seconds
    
    // Clear interval after 2 minutes to prevent infinite polling
    timeoutRef.current = setTimeout(() => {
      clearInterval(pollIntervalRef.current);
      setPolling(false);
    }, 120000);
  };

  const handleRefresh = () => {
    setRetryCount(0);
    verifyOrder();
  };

  const verifyOrder = async () => {
    if (!reference) {
      setError('No order reference provided. Please check your email for order confirmation.');
      setLoading(false);
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to view your order details.');
      setLoading(false);
      navigate('/login', { state: { from: `/thank-you?reference=${reference}` } });
      return;
    }
    
    try {
      console.log(`📡 Fetching order for reference: ${reference}, attempt ${retryCount + 1}`);
      const response = await axios.get(`${API_BASE_URL}/api/orders/verify/${reference}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const orderData = response.data;
      setOrder(orderData);
      console.log('✅ Order verified:', orderData);
      
      // If payment is still pending, start polling
      if (orderData.payment_status === 'pending') {
        startPolling(token);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('❌ Error verifying order:', err.response?.data || err.message);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Authentication failed. Please log in again.');
        navigate('/login', { state: { from: `/thank-you?reference=${reference}` } });
      } else if (err.response?.status === 404) {
        if (retryCount < 3) {
          setRetryCount(prev => prev + 1);
          setTimeout(verifyOrder, 3000);
          return;
        }
        setError('Order not found. Payment may still be processing. Please try verifying manually.');
      } else {
        setError('Failed to verify order. Please try verifying manually.');
      }
      setLoading(false);
    }
  };
  
  useEffect(() => {
    verifyOrder();
  }, [reference, navigate, retryCount]);

  const handleManualVerify = async () => {
    if (!reference) return;
    
    setVerifying(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/webhooks/verify`,
        { reference },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.order) {
        setOrder(response.data.order);
        setError(null);
        toast.success('Payment verified successfully!');
      }
    } catch (err) {
      setError('Failed to verify payment. Please try again later or contact support.');
    } finally {
      setVerifying(false);
    }
  };

  const formatTotal = () => {
    if (!order) return '';
    
    if (order.currency === 'NGN') {
      return `₦${order.total.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
    } else if (order.currency === 'USD') {
      const totalAmount = order.total > 1000 ? order.total / 100 : order.total;
      return `$${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }
    return `${order.total} ${order.currency}`;
  };

  const isInternational = order && order.shipping_country !== 'Nigeria';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-Accent mx-auto mb-4" />
          <p className="text-Accent font-Jost">Verifying your payment...</p>
          {retryCount > 0 && (
            <p className="text-sm text-Accent mt-2 font-Jost">
              Retry attempt {retryCount} of 3
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="min-h-screen bg-gray-100 typography"
        style={{
          '--color-Primarycolor': '#1E1E1E',
          '--color-Secondarycolor': '#ffffff',
          '--color-Accent': '#6E6E6E',
          '--font-Manrope': '"Manrope", "sans-serif"',
          '--font-Jost': '"Jost", "sans-serif"'
        }}
      >
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-Primarycolor mb-4 font-Manrope">Payment Verification Issue</h2>
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 max-w-lg mx-auto">
              <p className="text-red-700 font-Jost">{error}</p>
            </div>
            <div className="space-y-4">
              <button
                onClick={handleManualVerify}
                disabled={verifying}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 font-Jost"
              >
                {verifying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Verify Payment Manually
                  </>
                )}
              </button>
              
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 font-Jost"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </button>
              
              <div className="mt-6">
                <button
                  onClick={() => navigate('/')}
                  className="text-Accent hover:text-Primarycolor font-Jost"
                >
                  Return to Homepage
                </button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div 
        className="min-h-screen bg-gray-100 typography"
        style={{
          '--color-Primarycolor': '#1E1E1E',
          '--color-Secondarycolor': '#ffffff',
          '--color-Accent': '#6E6E6E',
          '--font-Manrope': '"Manrope", "sans-serif"',
          '--font-Jost': '"Jost", "sans-serif"'
        }}
      >
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-Primarycolor mb-4 font-Manrope">Order Not Found</h2>
            <p className="text-Accent mb-6 font-Jost">We couldn't find your order details. Please try verifying your payment manually.</p>
            <div className="space-y-4">
              <button
                onClick={handleManualVerify}
                disabled={verifying}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 font-Jost"
              >
                {verifying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Verify Payment Manually
                  </>
                )}
              </button>
              
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 font-Jost"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </button>
              
              <div className="mt-6">
                <button
                  onClick={() => navigate('/')}
                  className="text-Accent hover:text-Primarycolor font-Jost"
                >
                  Return to Homepage
                </button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gray-100 typography"
      style={{
        '--color-Primarycolor': '#1E1E1E',
        '--color-Secondarycolor': '#ffffff',
        '--color-Accent': '#6E6E6E',
        '--font-Manrope': '"Manrope", "sans-serif"',
        '--font-Jost': '"Jost", "sans-serif"'
      }}
    >
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-Primarycolor mb-4 font-Manrope">
            {isInternational && !order.delivery_fee_paid
              ? 'Order Received - Awaiting Delivery Fee'
              : 'Order Confirmed'}
          </h2>
          
          {order && order.payment_status === 'pending' && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 max-w-2xl mx-auto">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Loader2 className="h-5 w-5 text-yellow-400 animate-spin" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700 font-Jost">
                    Payment is still being processed. This page will update automatically once payment is confirmed.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="max-w-2xl mx-auto">
            <p className="text-Accent mb-4 font-Jost">
              {isInternational && !order.delivery_fee_paid
                ? 'Thank you for your order! We will send you a delivery fee quote for your international order soon.'
                : 'Thank you for your order! You\'ll receive a confirmation email soon.'}
            </p>
            
            {isInternational && !order.delivery_fee_paid && (
              <p className="text-Accent mb-6 font-Jost">
                Please check your email for the delivery fee payment link.
              </p>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md text-left max-w-lg mx-auto mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-Accent font-Jost">Order ID</p>
                <p className="font-medium text-Primarycolor font-Jost">{order.id}</p>
              </div>
              <div>
                <p className="text-sm text-Accent font-Jost">Reference</p>
                <p className="font-medium text-Primarycolor font-Jost">{order.reference}</p>
              </div>
              <div>
                <p className="text-sm text-Accent font-Jost">Total</p>
                <p className="font-medium text-Primarycolor font-Jost">{formatTotal()}</p>
              </div>
              <div>
                <p className="text-sm text-Accent font-Jost">Payment Status</p>
                <p className={`font-medium ${
                  order.payment_status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                } font-Jost`}>
                  {order.payment_status}
                  {polling && order.payment_status === 'pending' && (
                    <Loader2 className="h-3 w-3 ml-1 inline animate-spin" />
                  )}
                </p>
              </div>
              {isInternational && (
                <div>
                  <p className="text-sm text-Primarycolor font-Jost">Delivery Fee</p>
                  <p className={`font-medium ${
                    order.delivery_fee_paid ? 'text-green-600' : 'text-yellow-600'
                  } font-Jost`}>
                    {order.delivery_fee_paid ? 'Paid' : 'Pending'}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-Accent font-Jost">Shipping Country</p>
                <p className="font-medium text-Primarycolor font-Jost">{order.shipping_country}</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate(`/orders?orderId=${order.id}`)}
              className="bg-Primarycolor text-Secondarycolor py-2 px-6 rounded-md hover:bg-gray-800 transition-colors font-Jost flex items-center justify-center"
            >
              View Order Details
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-white text-Primarycolor border border-gray-300 py-2 px-6 rounded-md hover:bg-gray-50 transition-colors font-Jost flex items-center justify-center"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ThankYou;