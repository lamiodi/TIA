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

      const fallbackRate = 1529.26;
      
      try {
        const apiKey = import.meta.env.VITE_EXCHANGERATE_API_KEY;
        if (apiKey) {
          const response = await fetch(`https://api.exchangerate-api.com/v4/latest/USD?apiKey=${apiKey}`);
          if (response.ok) {
            const data = await response.json();
            const rate = data.rates['NGN'] || fallbackRate;
            setExchangeRate(rate);
            localStorage.setItem('exchangeRate', JSON.stringify({ rate, timestamp: Date.now() }));
          } else {
            setExchangeRate(fallbackRate);
          }
        } else {
          setExchangeRate(fallbackRate);
        }
      } catch (err) {
        setExchangeRate(fallbackRate);
      }

      setContextLoading(false);
    };

    initializeCurrency();
  }, []);

  const toggleCurrency = () => {
    const isCurrentlyNigeria = country === 'Nigeria' || currency === 'NGN';
    const nextCode = isCurrentlyNigeria ? 'US' : 'NG';
    const nextMap = countryCurrencyMap[nextCode];
    localStorage.setItem('selectedCountry', nextCode);
    setCountry(nextMap.name);
    setCurrency(nextMap.currency);
  };

  const formatPrice = (amountInNaira) => {
    const numericAmount = Number(amountInNaira) || 0;
    if (currency === 'USD') {
      const converted = numericAmount / (exchangeRate || 1529.26);
      return `$${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `₦${numericAmount.toLocaleString('en-NG')}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, exchangeRate, setExchangeRate, country, setCountry, toggleCurrency, formatPrice, contextLoading }}>
      {children}
    </CurrencyContext.Provider>
  );
};
