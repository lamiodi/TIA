import { useState, useEffect } from 'react';
import { DollarSign, X, Link, Copy } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

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

  useEffect(() => {
    if (selectedOrder) {
      setDeliveryFee(selectedOrder.delivery_fee || 0);
      setCurrency(selectedOrder.currency || 'USD');
    }
  }, [selectedOrder]);

  const generatePaymentLink = async () => {
    try {
      setLoading(true);
      const adminToken = localStorage.getItem('adminToken');
      
      // First update the delivery fee amount
      await axios.put(
        `${API_BASE_URL}/api/admin/orders/${selectedOrder.id}/delivery-fee`,
        { delivery_fee: deliveryFee },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Generate unique reference with DF- prefix
      const reference = `DF-${selectedOrder.id}`;
      
      // Initialize payment with Paystack
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email: selectedOrder.user_email,
          amount: deliveryFee * 100, // Convert to kobo/cents
          reference,
          currency,
          callback_url: `${window.location.origin}/admin/orders`,
          metadata: {
            order_id: selectedOrder.id,
            payment_type: 'delivery_fee'
          }
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const { authorization_url } = response.data.data;
      setPaymentLink(authorization_url);
      
      // Copy to clipboard
      navigator.clipboard.writeText(authorization_url);
      toast.success('Payment link copied to clipboard!');
      
      // Update orders state
      setOrders(prev => prev.map(order => 
        order.id === selectedOrder.id 
          ? { ...order, delivery_fee, delivery_fee_paid: false } 
          : order
      ));
      
    } catch (err) {
      console.error('Error:', err);
      toast.error(err.response?.data?.error || 'Failed to generate payment link');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(paymentLink);
    toast.success('Payment link copied to clipboard!');
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
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDeliveryFeeModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={generatePaymentLink}
                  disabled={loading || deliveryFee <= 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Link className="w-4 h-4 mr-2" />
                      Generate Payment Link
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Link
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={paymentLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <p className="text-sm text-yellow-700">
                  Share this link with the customer to collect the delivery fee. 
                  The payment will be automatically processed when completed.
                </p>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowDeliveryFeeModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDeliveryFeeModal;