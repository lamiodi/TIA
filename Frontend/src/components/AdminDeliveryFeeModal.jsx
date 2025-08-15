import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { XCircle, DollarSign } from 'lucide-react';

const AdminDeliveryFeeModal = ({ selectedOrder, showDeliveryFeeModal, setShowDeliveryFeeModal, setOrders, setSelectedOrder }) => {
  const [deliveryFee, setDeliveryFee] = useState('');
  const [paymentLink, setPaymentLink] = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const fee = parseFloat(deliveryFee);
    if (isNaN(fee) || fee <= 0) {
      toast.error('Please enter a valid delivery fee');
      return;
    }
    if (!paymentLink) {
      toast.error('Please enter a payment link');
      return;
    }

    try {
      setLoading(true);
      const authAxios = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json',
        },
      });

      const response = await authAxios.post('/api/admin/orders/delivery-fee', {
        orderId: selectedOrder.id,
        fee,
        paymentLink,
      });

      setOrders(prev =>
        prev.map(order =>
          order.id === selectedOrder.id
            ? { ...order, delivery_fee: fee, delivery_fee_paid: false }
            : order
        )
      );
      setSelectedOrder(prev => ({ ...prev, delivery_fee: fee, delivery_fee_paid: false }));
      setShowDeliveryFeeModal(false);
      setDeliveryFee('');
      setPaymentLink('');
      toast.success('Delivery fee email sent successfully');
    } catch (err) {
      console.error('Error setting delivery fee:', err);
      toast.error(err.response?.data?.error || 'Failed to set delivery fee');
    } finally {
      setLoading(false);
    }
  };

  if (!showDeliveryFeeModal || !selectedOrder) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold font-Manrope">Set Delivery Fee</h3>
            <button onClick={() => setShowDeliveryFeeModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 font-Jost">Order ID</label>
              <p className="mt-1 text-sm text-gray-900 font-Manrope">#{selectedOrder.id}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 font-Jost">Customer</label>
              <p className="mt-1 text-sm text-gray-900 font-Manrope">
                {selectedOrder.first_name} {selectedOrder.last_name} ({selectedOrder.user_email})
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 font-Jost">Shipping Country</label>
              <p className="mt-1 text-sm text-gray-900 font-Manrope">{selectedOrder.shipping_country || 'N/A'}</p>
            </div>
            <div>
              <label htmlFor="deliveryFee" className="block text-sm font-medium text-gray-700 font-Jost">
                Delivery Fee (USD)
              </label>
              <div className="mt-1 relative">
                <DollarSign className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  id="deliveryFee"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                  className="pl-10 w-full py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-Jost"
                  placeholder="Enter delivery fee"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
            <div>
              <label htmlFor="paymentLink" className="block text-sm font-medium text-gray-700 font-Jost">
                Payment Link
              </label>
              <input
                type="text"
                id="paymentLink"
                value={paymentLink}
                onChange={(e) => setPaymentLink(e.target.value)}
                className="w-full py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-Jost"
                placeholder="Enter payment link"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowDeliveryFeeModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-Jost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-Manrope"
            >
              {loading ? 'Submitting...' : 'Set Delivery Fee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDeliveryFeeModal;