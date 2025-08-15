import React, { createContext, useState, useEffect } from 'react';

export const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('NGN');
  const [exchangeRate, setExchangeRate] = useState(1529.26);
  const [country, setCountry] = useState('Nigeria');
  const [contextLoading, setContextLoading] = useState(true);

  const countryCurrencyMap = {
    NG: { currency: 'NGN', name: 'Nigeria' },
    US: { currency: 'USD', name: 'United States' },
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

      if (mappedCurrency === 'USD') {
        setExchangeRate(1);
        localStorage.setItem('exchangeRate', JSON.stringify({ rate: 1, timestamp: Date.now(), currency: mappedCurrency }));
      } else if (mappedCurrency === 'NGN') {
        try {
          const apiKey = import.meta.env.VITE_EXCHANGERATE_API_KEY;
          if (!apiKey) {
            throw new Error('API key is missing');
          }
          const response = await fetch(`https://api.exchangerate-api.com/v4/latest/USD?apiKey=${apiKey}`);
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          const data = await response.json();
          const rate = data.rates[mappedCurrency] || 1529.26;
          setExchangeRate(rate);
          localStorage.setItem('exchangeRate', JSON.stringify({ rate, timestamp: Date.now(), currency: mappedCurrency }));
          console.log('Exchange rate fetched:', { currency: mappedCurrency, rate, country: name });
        } catch (err) {
          console.error('Error initializing exchange rate:', err.message);
          const fallbackRate = 1529.26;
          setExchangeRate(fallbackRate);
          localStorage.setItem('exchangeRate', JSON.stringify({ rate: fallbackRate, timestamp: Date.now(), currency: mappedCurrency }));
        }
      } else {
        // For other currencies (e.g., GBP), use USD for now as per requirement
        setExchangeRate(1);
        localStorage.setItem('exchangeRate', JSON.stringify({ rate: 1, timestamp: Date.now(), currency: mappedCurrency }));
      }
      setContextLoading(false);
      console.log('Context initialized:', { currency: mappedCurrency, exchangeRate: exchangeRate || 1529.26, country: name });
    };

    initializeCurrency();
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, exchangeRate, setExchangeRate, country, setCountry, contextLoading }}>
      {children}
    </CurrencyContext.Provider>
  );
};