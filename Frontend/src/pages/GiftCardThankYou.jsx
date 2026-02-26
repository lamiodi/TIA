
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com';

const GiftCardThankYou = () => {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference');
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [giftCard, setGiftCard] = useState(null);
  const [receiptUrl, setReceiptUrl] = useState(null);

  useEffect(() => {
    if (reference) {
      verifyPayment();
    } else {
      setStatus('error');
    }
  }, [reference]);

  const verifyPayment = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/gift-cards/verify?reference=${reference}`);
      setGiftCard(response.data.giftCard);
      setReceiptUrl(response.data.receiptUrl);
      setStatus('success');
    } catch (error) {
      console.error('Error verifying payment:', error);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-Jost">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-12 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8 text-center">
          
          {status === 'verifying' && (
            <div className="py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-black mx-auto mb-4"></div>
              <h2 className="text-2xl font-semibold">Verifying Payment...</h2>
              <p className="text-gray-500 mt-2">Please wait while we confirm your transaction.</p>
            </div>
          )}

          {status === 'success' && giftCard && (
            <div className="py-8 animate-fade-in">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              
              <h1 className="text-3xl font-bold font-Manrope mb-4">Payment Successful!</h1>
              <p className="text-lg text-gray-600 mb-8">
                Your gift card for <span className="font-semibold text-black">₦{Number(giftCard.initial_amount).toLocaleString()}</span> has been created and sent to <span className="font-semibold text-black">{giftCard.recipient_email}</span>.
              </p>

              <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left border border-gray-100">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Reference</p>
                    <p className="font-medium text-gray-900 font-mono">{giftCard.payment_reference}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Recipient Phone</p>
                    <p className="font-medium text-gray-900">{giftCard.recipient_phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Amount</p>
                    <p className="font-medium text-gray-900">₦{Number(giftCard.initial_amount).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Status</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize">
                      {giftCard.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {receiptUrl && (
                  <a 
                    href={`${API_BASE_URL}${receiptUrl}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-black hover:bg-gray-800 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    Download Receipt
                  </a>
                )}
                
                <Link 
                  to="/shop" 
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="py-12">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4">Payment Verification Failed</h2>
              <p className="text-gray-600 mb-8">
                We couldn't verify your payment. Please contact support if you believe this is an error.
              </p>
              <Link 
                to="/gift-cards" 
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-black hover:bg-gray-800 transition-colors"
              >
                Try Again
              </Link>
            </div>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GiftCardThankYou;
