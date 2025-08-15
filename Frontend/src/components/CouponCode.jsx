import { useState } from 'react';
import { CheckCircle, XCircle, Gift, X } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com';

const CouponCode = ({ subtotal, onDiscountApplied }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate coupon code with backend
      const response = await axios.post(`${API_BASE_URL}/api/discounts/validate`, { code });
      
      if (response.data.valid) {
        const discount = response.data.discount;
        
        // Calculate discount amount
        let discountAmount = 0;
        if (discount.type === 'percentage') {
          discountAmount = (subtotal * discount.value) / 100;
        } else if (discount.type === 'fixed') {
          discountAmount = discount.value;
        }
        
        // Ensure discount doesn't exceed subtotal
        discountAmount = Math.min(discountAmount, subtotal);
        
        setAppliedDiscount({
          code: discount.code,
          type: discount.type,
          value: discount.value,
          amount: discountAmount
        });
        
        setSuccess(`Coupon applied! You saved ${discount.type === 'percentage' ? `${discount.value}%` : `₦${discount.value}`}`);
        onDiscountApplied(discountAmount);
      } else {
        setError(response.data.message || 'Invalid coupon code');
      }
    } catch (err) {
      console.error('Error validating coupon:', err);
      setError(err.response?.data?.message || 'Failed to validate coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedDiscount(null);
    setCode('');
    setSuccess('');
    onDiscountApplied(0);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center mb-3">
        <Gift className="h-5 w-5 text-green-600 mr-2" />
        <h3 className="font-medium text-gray-900">Have a coupon code?</h3>
      </div>
      
      {appliedDiscount ? (
        <div className="bg-green-50 rounded-lg p-3 mb-3 border border-green-200">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                <span className="font-medium text-green-800">{appliedDiscount.code} applied</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                You saved {appliedDiscount.type === 'percentage' 
                  ? `${appliedDiscount.value}% (₦${appliedDiscount.amount.toFixed(2)})` 
                  : `₦${appliedDiscount.amount.toFixed(2)}`}
              </p>
            </div>
            <button 
              onClick={handleRemoveCoupon}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Remove coupon"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleApplyCoupon} className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter coupon code"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Applying...' : 'Apply'}
          </button>
        </form>
      )}
      
      {error && (
        <div className="mt-2 flex items-center text-sm text-red-600">
          <XCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
      
      {success && !appliedDiscount && (
        <div className="mt-2 flex items-center text-sm text-green-600">
          <CheckCircle className="h-4 w-4 mr-1" />
          {success}
        </div>
      )}
    </div>
  );
};

export default CouponCode;