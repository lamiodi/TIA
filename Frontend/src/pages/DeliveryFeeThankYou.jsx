import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com';

const DeliveryFeeThankYou = () => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyPayment = async () => {
      const params = new URLSearchParams(location.search);
      const reference = params.get('reference');

      if (!reference) {
        toast.error('No payment reference provided');
        setLoading(false);
        setStatus('failed');
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/api/paystack/delivery-fee/verify`, { params: { reference } });
        if (response.data.message === 'Delivery fee verified successfully') {
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
        setTimeout(() => navigate('/orders'), 5000); // Redirect to user orders page after 5 seconds
      }
    };

    verifyPayment();
  }, [location, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
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
            <p className="text-gray-600 mb-6">Thank you for your payment. Your order is now ready for international shipping. You'll receive a confirmation email shortly.</p>
            <p className="text-sm text-gray-500">Redirecting to your orders in 5 seconds...</p>
          </>
        ) : (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Error</h2>
            <p className="text-gray-600 mb-6">There was an issue with your delivery fee payment. Please try again or contact support.</p>
          </>
        )}
        <button
          onClick={() => navigate('/orders')}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          View Orders
        </button>
      </div>
    </div>
  );
};

export default DeliveryFeeThankYou;