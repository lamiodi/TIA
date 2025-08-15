import React, { createContext, useState, useEffect } from 'react';

export const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('NGN');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [country, setCountry] = useState('Nigeria');
  const [contextLoading, setContextLoading] = useState(true);

  const countryCurrencyMap = {
    NG: { currency: 'NGN', name: 'Nigeria' },
    US: { currency: 'USD', name: 'United States' },
    GB: { currency: 'USD', name: 'United Kingdom' }, // Use USD as per requirement
    // Default for unmapped countries
    default: { currency: 'USD', name: 'International' },
  };

  useEffect(() => {
    const initializeCurrency = async () => {
      const savedCountry = localStorage.getItem('selectedCountry') || 'NG';
      const { currency: mappedCurrency, name } = countryCurrencyMap[savedCountry] || countryCurrencyMap.default;
      setCurrency(mappedCurrency);
      setCountry(name);
      
      const savedExchangeRate = localStorage.getItem('exchangeRate');
      if (savedExchangeRate) {
        const { rate, timestamp, currency: savedCurrency } = JSON.parse(savedExchangeRate);
        const isRecent = Date.now() - timestamp < 24 * 60 * 60 * 1000; // 24 hours
        if (isRecent && savedCurrency === mappedCurrency) {
          setExchangeRate(rate);
          setContextLoading(false);
          console.log('Using cached exchange rate:', { currency: mappedCurrency, rate, country: name });
          return;
        }
      }
      
      try {
        const apiKey = import.meta.env.VITE_EXCHANGERATE_API_KEY;
        if (!apiKey) {
          throw new Error('API key is missing');
        }
        
        // Fixed: Get the exchange rate for converting NGN to the target currency
        const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/NGN`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        // Fixed: Use the correct conversion rate
        const rate = mappedCurrency === 'NGN' ? 1 : data.conversion_rates[mappedCurrency] || 0.00065311;
        
        setExchangeRate(rate);
        localStorage.setItem('exchangeRate', JSON.stringify({ 
          rate, 
          timestamp: Date.now(), 
          currency: mappedCurrency 
        }));
        
        console.log('Exchange rate fetched:', { currency: mappedCurrency, rate, country: name });
      } catch (err) {
        console.error('Error initializing exchange rate:', err.message);
        // Fixed: Use the correct fallback rate
        const fallbackRate = mappedCurrency === 'NGN' ? 1 : 0.00065311;
        setExchangeRate(fallbackRate);
        localStorage.setItem('exchangeRate', JSON.stringify({ 
          rate: fallbackRate, 
          timestamp: Date.now(), 
          currency: mappedCurrency 
        }));
      }
      
      setContextLoading(false);
      console.log('Context initialized:', { 
        currency: mappedCurrency, 
        exchangeRate: exchangeRate || 1, 
        country: name 
      });
    };
    
    initializeCurrency();
  }, []);

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      setCurrency, 
      exchangeRate, 
      setExchangeRate, 
      country, 
      setCountry, 
      contextLoading 
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};