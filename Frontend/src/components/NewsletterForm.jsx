import React, { useState } from 'react';
import Newsletterimage from '../assets/images/Newsletterimage.png';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

// Use environment variable for base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com';
const api = axios.create({ baseURL: API_BASE_URL });

const NewsletterForm = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, success, error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic email validation
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setStatus('idle');

    try {
      // Call the correct endpoint
      const response = await api.post('/api/newsletter/subscribe', { email });

      if (response.data.success) {
        setStatus('success');
        setMessage(response.data.message);
        setEmail('');
      } else {
        throw new Error(response.data.message || 'Subscription failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage(
        error.response?.data?.message || 
        error.message || 
        'Failed to subscribe. Please try again later.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center relative max-w-[1390px] 2xl:max-w-[2300px] mx-auto px-4 sm:px-6 lg:px-8 mb-10 mt-15">
      <div className="relative w-[93vw] z-10 bg-Primarycolor rounded-[20px] overflow-visible pt-12 sm:pt-14 md:pt-16 lg:pt-18 xl:pt-20 2xl:pt-30 pb-8 sm:pb-10 px-4 sm:px-6 md:px-12">
        
        {/* Image */}
        <div className="absolute top-[-3.5em] left-6 sm:top-[-4.5em] sm:left-6 md:top-[-5.5em] md:left-8 lg:top-[-6em] lg:left-10 xl:top-[-8em] xl:left-12 2xl:top-[-9em] 2xl:left-16 w-37 sm:w-53 md:w-60 lg:w-70 xl:w-82 2xl:w-96 z-0">
          <img src={Newsletterimage} alt="Newsletter Illustration" className="w-full h-auto object-contain" />
        </div>
        
        {/* Text + Form */}
        <div className="relative z-10 text-Secondarycolor text-right max-w-2xl mx-auto md:ml-auto 2xl:ml-115">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-7xl font-extrabold font-Jost tracking-tight leading-snug [text-shadow:-2px_0px_10px_#f5f5dc80] [-webkit-text-stroke:1px_#6e6e6e] sm:[-webkit-text-stroke:1.5px_#6e6e6e] md:[-webkit-text-stroke:2px_#6e6e6e] lg:text-nowrap lg:ms-10 lg:max-w-sm">
            SUBSCRIBE TO OUR NEWSLETTER
          </h2>
          <p className="mt-3 sm:mt-4 text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-6xl font-Manrope font-bold lg:ms-[30vw] lg:text-nowrap">
            Get 10% Off Your First Order
          </p>

          {/* Status Messages */}
          {status === 'success' && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-green-700 text-sm">{message}</p>
            </div>
          )}
          {status === 'error' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700 text-sm">{message}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-4 sm:mt-6 w-full max-w-[95vw] sm:max-w-[75vw] md:max-w-[50vw] lg:max-w-[40vw] xl:max-w-[35vw] ml-auto lg:ml-48 xl:ml-60 2xl:ml-130">
            <div className="flex bg-Secondarycolor font-Manrope rounded-md overflow-hidden shadow-sm">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label="Email address"
                placeholder="Enter Your Email For Alerts of Restocks and Drop"
                className="px-3 sm:px-4 py-2.5 sm:py-3 w-full text-xs sm:text-sm text-[#6e6e6e] font-medium border-none focus:outline-none font-manrope-medium placeholder:text-xs sm:placeholder:text-sm"
              />
              <button
                type="submit"
                disabled={isLoading}
                aria-label="Submit newsletter form"
                className="w-8 sm:w-10 md:w-12 lg:w-14 h-[40px] sm:h-[45px] bg-[#d9d9d9] flex justify-center items-center hover:bg-[#c9c9c9] transition-colors duration-200 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-black animate-spin" />
                ) : (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewsletterForm;
