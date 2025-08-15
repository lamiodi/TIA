// DeliveryFeePayment.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadPaystackScript } from '../utils/paystack';
import { toast } from 'react-toastify';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com';

const DeliveryFeePayment = () => {
  const { orderId, amount, currency } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/orders/${orderId}`);
        setOrderDetails(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching order details:', error);
        toast.error('Failed to load order details');
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [orderId]);
  
  const handlePayment = async () => {
    setPaymentProcessing(true);
    
    try {
      // Load Paystack script
      await loadPaystackScript();
      
      // Initialize payment
      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: orderDetails.user_email,
        amount: parseFloat(amount) * 100, // Paystack expects amount in kobo
        currency: currency || 'NGN',
        ref: `delivery_fee_${orderId}_${Date.now()}`,
        callback: async (response) => {
          try {
            // Verify payment on the server
            await axios.post(`${API_BASE_URL}/api/verify-delivery-fee-payment`, {
              reference: response.reference,
              orderId: orderId
            });
            
            toast.success('Delivery fee payment successful!');
            navigate('/order-success');
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed');
            setPaymentProcessing(false);
          }
        },
        onClose: () => {
          setPaymentProcessing(false);
        }
      });
      
      handler.openIframe();
    } catch (error) {
      console.error('Payment initialization error:', error);
      toast.error('Failed to initialize payment');
      setPaymentProcessing(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        <div className="p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Delivery Fee Payment</h1>
            <p className="text-gray-600 mb-6">Complete your order by paying the delivery fee</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium">#{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Customer:</span>
                <span className="font-medium">{orderDetails?.first_name} {orderDetails?.last_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping Country:</span>
                <span className="font-medium">{orderDetails?.shipping_country}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3 mt-3">
                <span className="text-gray-900 font-semibold">Delivery Fee:</span>
                <span className="text-lg font-semibold text-green-600">
                  {new Intl.NumberFormat(currency === 'NGN' ? 'en-NG' : 'en-US', {
                    style: 'currency',
                    currency: currency || 'NGN',
                  }).format(parseFloat(amount) || 0)}
                </span>
              </div>
            </div>
          </div>
          
          <button
            onClick={handlePayment}
            disabled={paymentProcessing}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
          >
            {paymentProcessing ? 'Processing...' : `Pay ${new Intl.NumberFormat(currency === 'NGN' ? 'en-NG' : 'en-US', {
              style: 'currency',
              currency: currency || 'NGN',
            }).format(parseFloat(amount) || 0)}`}
          </button>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Secure payment powered by Paystack</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryFeePayment;