import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com';

const DeliveryFeeThankYou = () => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check if user is authenticated (not guest)
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    return !!token && !!user;
  };

  // Check if user is temporary (guest with account)
  const isTemporaryUser = () => {
    return user && user.is_temporary;
  };

  useEffect(() => {
    const verifyPayment = async () => {
      const params = new URLSearchParams(location.search);
      const reference = params.get('reference') || params.get('trxref');

      if (!reference) {
        toast.error('No payment reference provided');
        setLoading(false);
        setStatus('failed');
        return;
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/api/paystack/delivery-fee/verify`, { reference });
        if (response.data.message === 'Delivery fee payment verified successfully' || response.data.message === 'Delivery fee already verified') {
          toast.success('Delivery fee payment confirmed!');
          setStatus('success');
        } else {
          toast.error('Payment verification failed');
          setStatus('failed');
        }
      } catch (err) {
        console.error('Error verifying delivery fee payment:', err);
        toast.error('Failed to verify payment');
        setStatus('failed');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [location, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-Primarycolor"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        {status === 'success' ? (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Delivery Fee Payment Successful!</h2>
            <p className="text-gray-600 mb-6">Thank you for your payment. Your order is now ready for international shipping and will be processed shortly.</p>
          </>
        ) : (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Error</h2>
            <p className="text-gray-600 mb-6">There was an issue with your delivery fee payment. Please try again or contact support.</p>
          </>
        )}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          {isAuthenticated() ? (
            // Authenticated users (both regular and temporary)
            <>
              <button
                onClick={() => navigate('/orders')}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                View My Orders
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
              >
                Continue Shopping
              </button>
            </>
          ) : (
            // Guest users (not authenticated)
            <>
              <button
                onClick={() => navigate('/login', { state: { from: '/orders' } })}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Login to View Orders
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
              >
                Continue Shopping
              </button>
            </>
          )}
        </div>
        
        {/* Additional message for temporary users */}
        {isTemporaryUser() && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              💡 <strong>Tip:</strong> Create a permanent account to easily track all your orders and enjoy exclusive benefits!
            </p>
            <button
              onClick={() => navigate('/register')}
              className="mt-2 text-sm text-yellow-700 hover:text-yellow-900 underline font-medium"
            >
              Create Permanent Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryFeeThankYou;