
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import giftCardImage from '../assets/images/GiftCardImage.png';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com';

const GiftCardPage = () => {
  const [formData, setFormData] = useState({
    amount: '',
    sender_name: '',
    recipient_email: '',
    recipient_phone: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const amounts = [100000, 200000, 500000, 700000, 1000000];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAmountSelect = (amount) => {
    setFormData({ ...formData, amount });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate phone
      if (!/^\d{11}$/.test(formData.recipient_phone)) {
        toast.error('Recipient phone number must be 11 digits.');
        setLoading(false);
        return;
      }

      // Validate amount
      if (!formData.amount) {
        toast.error('Please select an amount.');
        setLoading(false);
        return;
      }

      const response = await axios.post(`${API_BASE_URL}/api/gift-cards/purchase`, {
        ...formData,
        currency: 'NGN' // Default to NGN as per requirement
      });

      const { authorization_url } = response.data;
      window.location.href = authorization_url;

    } catch (error) {
      console.error('Error initiating purchase:', error);
      toast.error(error.response?.data?.error || 'Failed to initiate purchase. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-Jost">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Page Header */}
          <div className="pt-8 pb-4 px-6 text-center bg-white border-b border-gray-100">
             <span className="inline-block bg-black text-white text-[11px] font-bold px-3 py-1 uppercase tracking-widest rounded-full mb-2">
               Digital Gift Card
             </span>
             <h1 className="text-3xl md:text-4xl font-bold font-Manrope text-gray-900 mb-2 tracking-tight">Give the Perfect Gift</h1>
             <p className="text-gray-600 font-medium max-w-md mx-auto text-sm md:text-base">
               Send The Tia Brand Gift Card instantly via email. The ultimate gift of choice.
             </p>
          </div>

          {/* Unobscured Card Display */}
          <div className="bg-[#E5D4C0] p-6 md:p-10 flex items-center justify-center">
             <div className="relative w-full max-w-lg h-56 md:h-72 flex items-center justify-center">
                <img 
                  src={giftCardImage} 
                  alt="The Tia Brand Gift Card" 
                  className="w-full h-full object-contain filter drop-shadow-2xl hover:scale-105 transition-transform duration-500" 
                />
             </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            
            {/* Amount Selection */}
            <div>
              <label className="block text-gray-700 font-semibold mb-4 text-lg">Select Amount (₦)</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {amounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleAmountSelect(amt)}
                    className={`py-3 px-4 rounded-xl border-2 transition-all duration-200 font-medium text-lg ${
                      Number(formData.amount) === amt
                        ? 'border-black bg-black text-white shadow-lg transform scale-105'
                        : 'border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    ₦{amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Sender Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">From</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name (Optional)</label>
                  <input
                    type="text"
                    name="sender_name"
                    value={formData.sender_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              {/* Recipient Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">To</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recipient's Email *</label>
                  <input
                    type="email"
                    name="recipient_email"
                    value={formData.recipient_email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                    placeholder="recipient@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recipient's Phone Number *</label>
                  <input
                    type="tel"
                    name="recipient_phone"
                    value={formData.recipient_phone}
                    onChange={handleChange}
                    required
                    pattern="\d{11}"
                    title="Please enter exactly 11 digits"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                    placeholder="08012345678"
                  />
                  <p className="text-xs text-gray-500 mt-1">Must be a valid 11-digit Nigerian number.</p>
                </div>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Personal Message (Optional)</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="4"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-colors resize-none"
                placeholder="Write a sweet note..."
              ></textarea>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-lg text-white transition-all duration-200 shadow-lg ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-black hover:bg-gray-800 hover:shadow-xl transform hover:-translate-y-1'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                `Pay ₦${Number(formData.amount || 0).toLocaleString()}`
              )}
            </button>
            
            <p className="text-center text-sm text-gray-500 mt-4">
              By proceeding, you agree to our Terms & Conditions.
            </p>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GiftCardPage;
