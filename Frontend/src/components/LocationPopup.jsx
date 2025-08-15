import React, { useState, useEffect, useRef, useContext } from 'react';
import ReactFlagsSelect from 'react-flags-select';
import { CurrencyContext } from '../pages/CurrencyContext';
import '../LocationPopup.css';

// Map country codes to currency codes and names
const countryCurrencyMap = {
  NG: { currency: 'NGN', name: 'Nigeria' },
  US: { currency: 'USD', name: 'United States' },
  GB: { currency: 'USD', name: 'United Kingdom' }, // Use USD as per requirement
  // Default for unmapped countries
  default: { currency: 'USD', name: 'International' },
};

const LocationPopup = () => {
  const [showPopup, setShowPopup] = useState(true); // Always show on refresh
  const [selectedCountry, setSelectedCountry] = useState('NG');
  const [isFetching, setIsFetching] = useState(false); // Track fetch state
  const popupRef = useRef(null);
  const { setCurrency, setCountry, setExchangeRate } = useContext(CurrencyContext);

  // Handle Escape key to close popup
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showPopup) {
        setShowPopup(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPopup]);

  // Focus trap for accessibility
  useEffect(() => {
    if (showPopup && popupRef.current) {
      popupRef.current.focus();
    }
  }, [showPopup]);

  const handleCountryChange = async (code) => {
    setIsFetching(true);
    const { currency, name } = countryCurrencyMap[code] || countryCurrencyMap.default;
    setSelectedCountry(code);
    localStorage.setItem('selectedCountry', code);

    console.log('Updating context:', { code, currency, name });

    // Update CurrencyContext
    setCurrency(currency);
    setCountry(name);

    // Set exchange rate (1 for NGN, USD per NGN for USD)
    try {
      const apiKey = import.meta.env.VITE_EXCHANGERATE_API_KEY;
      if (!apiKey) {
        throw new Error('API key is missing');
      }
      const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/NGN`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      const rate = currency === 'NGN' ? 1 : data.conversion_rates.USD || 0.00065311; // 1 for NGN, USD per NGN for others
      setExchangeRate(rate);
      localStorage.setItem('exchangeRate', JSON.stringify({ rate, timestamp: Date.now(), currency }));
      console.log('Exchange rate fetched:', { currency, rate });
    } catch (err) {
      console.error('Error fetching exchange rate:', err.message);
      const fallbackRate = currency === 'NGN' ? 1 : 0.00065311; // Fallback for USD
      setExchangeRate(fallbackRate);
      localStorage.setItem('exchangeRate', JSON.stringify({ rate: fallbackRate, timestamp: Date.now(), currency }));
    }

    setIsFetching(false);
    setShowPopup(false); // Close popup
    console.log('Selected Country Code:', code, 'Currency:', currency, 'Country:', name);
  };

  return (
    <>
      {showPopup && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center md:justify-start bg-black/20 backdrop-blur-sm transition-opacity duration-500 ease-out"
          role="dialog"
          aria-modal="true"
          aria-label="Select your country"
        >
          <div
            ref={popupRef}
            tabIndex={-1}
            className="bg-white shadow-lg rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 w-full max-w-xs mx-4 my-4 md:m-6 border border-gray-100 pointer-events-auto group"
          >
            {/* Header - Compact */}
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-gray-800 rounded-lg flex items-center justify-center shadow-sm">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-blue-600 leading-tight">Select Location</h3>
                  <p className="text-xs text-gray-500 font-medium">Customize experience</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Country Selector - Compact */}
              <div className="relative">
                <ReactFlagsSelect
                  selected={selectedCountry}
                  onSelect={handleCountryChange}
                  searchable
                  searchPlaceholder="Search..."
                  className="w-full border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-transparent hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md"
                  rfsKey="country-selector"
                />
                {isFetching && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                    <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Benefits - Compact */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
                <p className="text-xs text-gray-600 font-medium mb-2 flex items-center gap-2">
                  <svg className="w-3 h-3 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Personalized shopping experience
                </p>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <span className="bg-white text-gray-600 px-2 py-0.5 rounded-full font-medium border border-gray-200 shadow-sm">Local pricing</span>
                  <span className="bg-white text-gray-600 px-2 py-0.5 rounded-full font-medium border border-gray-200 shadow-sm">Fast shipping</span>
                </div>
              </div>

              {/* Action buttons - Compact */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPopup(false)}
                  className="flex-1 px-4 py-2.5 text-gray-600 bg-gray-100 rounded-lg font-semibold text-sm hover:bg-gray-200 hover:text-gray-700 active:scale-95 transform transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 border border-gray-200 hover:border-gray-300"
                >
                  Skip
                </button>
                <button
                  onClick={() => handleCountryChange(selectedCountry)}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-black to-gray-800 text-white rounded-lg font-semibold text-sm hover:from-gray-800 hover:to-black hover:shadow-lg active:scale-95 transform transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-md relative overflow-hidden group/btn"
                  disabled={isFetching}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Continue
                    <svg className="w-3 h-3 transform group-hover/btn:translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </button>
              </div>

              {/* Trust badge - Compact */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Secure & Trusted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LocationPopup;