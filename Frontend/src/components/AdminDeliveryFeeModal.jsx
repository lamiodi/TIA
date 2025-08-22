import { useState, useEffect } from 'react';
import { DollarSign, X, Link, Copy } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 
  ? `${import.meta.env.VITE_API_BASE_URL}` 
  : 'https://tia-backend-r331.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

const AdminDeliveryFeeModal = ({ 
  selectedOrder, 
  showDeliveryFeeModal, 
  setShowDeliveryFeeModal,
  setOrders 
}) => {
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [paymentLink, setPaymentLink] = useState('');
  const [emailError, setEmailError] = useState(null);
  
  useEffect(() => {
    if (selectedOrder) {
      setDeliveryFee(selectedOrder.delivery_fee || 0);
      setCurrency(selectedOrder.currency || 'USD');
      setPaymentLink(''); // Reset payment link when order changes
      setEmailError(null); // Reset email error
    }
  }, [selectedOrder]);
  
  const getAuthApi = () => {
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
  
  const generatePaymentLink = async () => {
    try {
      setLoading(true);
      setEmailError(null);
      const authApi = getAuthApi();
      
      const response = await authApi.post(
        '/api/paystack/delivery-fee/initialize',
        {
          order_id: selectedOrder.id,
          delivery_fee: deliveryFee,
          currency: currency,
          callback_url: `${import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/delivery-fee-thank-you`
        }
      );
      
      const { authorization_url } = response.data;
      setPaymentLink(authorization_url);
      
      navigator.clipboard.writeText(authorization_url);
      toast.success('Payment link generated and copied to clipboard! Email sent to customer.');
      
      setOrders(prev => prev.map(order => 
        order.id === selectedOrder.id 
          ? { ...order, delivery_fee: deliveryFee, delivery_fee_paid: false } 
          : order
      ));
      
    } catch (err) {
      console.error('Error generating payment link:', err);
      const errorMessage = err.response?.data?.error || 'Failed to generate payment link. Please try again.';
      if (errorMessage.includes('Failed to send delivery fee email')) {
        setEmailError('Payment link generated, but email failed to send. Please share the link manually.');
        toast.warn('Payment link generated, but email failed to send. Link copied to clipboard.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const copyToClipboard = () => {
    if (paymentLink) {
      navigator.clipboard.writeText(paymentLink);
      toast.success('Payment link copied to clipboard!');
    }
  };
  
  if (!showDeliveryFeeModal || !selectedOrder) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center">
            <DollarSign className="mr-2" />
            International Delivery Fee
          </h3>
          <button 
            onClick={() => setShowDeliveryFeeModal(false)} 
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Order #{selectedOrder.id} for {selectedOrder.first_name} {selectedOrder.last_name}
            </p>
            <p className="text-sm text-blue-800">
              Shipping to: {selectedOrder.shipping_country}
            </p>
          </div>
          
          {!paymentLink ? (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="NGN">NGN (Recommended - USD not approved yet)</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Fee Amount ({currency})
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">
                      {currency === 'NGN' ? '₦' : '$'}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                    className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <button
                onClick={generatePaymentLink}
                disabled={loading || deliveryFee <= 0}
                className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors duration-200 ${
                  loading || deliveryFee <= 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Generating...' : 'Generate Payment Link'}
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800 flex items-center">
                  <Link className="w-4 h-4 mr-2" />
                  Payment link generated successfully
                </p>
                <p className="text-sm text-green-800 break-all">
                  {paymentLink}
                </p>
              </div>
              {emailError && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">{emailError}</p>
                </div>
              )}
              <button
                onClick={copyToClipboard}
                className="w-full py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200 flex items-center justify-center"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Payment Link
              </button>
              <button
                onClick={() => setShowDeliveryFeeModal(false)}
                className="w-full py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDeliveryFeeModal;