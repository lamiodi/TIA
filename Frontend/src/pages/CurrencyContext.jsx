import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';

export const CurrencyContext = createContext();

export const FALLBACK_EXCHANGE_RATE = 1529.26;

export const isValidExchangeRate = (rate) => {
  return typeof rate === 'number' && !isNaN(rate) && isFinite(rate) && rate >= 100 && rate <= 10000;
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('NGN');
  const [exchangeRate, setExchangeRate] = useState(FALLBACK_EXCHANGE_RATE);
  const [country, setCountry] = useState('Nigeria');
  const [contextLoading, setContextLoading] = useState(true);

  const countryCurrencyMap = useMemo(() => ({
    NG: { currency: 'NGN', name: 'Nigeria' },
    US: { currency: 'USD', name: 'United States' },
    GB: { currency: 'USD', name: 'United Kingdom' },
    CA: { currency: 'USD', name: 'Canada' },
    // Default for unmapped countries
    default: { currency: 'USD', name: 'International' },
  }), []);

  useEffect(() => {
    let isMounted = true;

    const initializeCurrency = async () => {
      let savedCountry = localStorage.getItem('selectedCountry');

      // IP detection if user has not manually chosen a country
      if (!savedCountry) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          const geoRes = await fetch('https://api.country.is', { signal: controller.signal });
          clearTimeout(timeoutId);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData?.country) {
              savedCountry = geoData.country.toUpperCase();
            }
          }
        } catch {
          // Geolocation optional fallback, default to NG
        }
      }

      if (!savedCountry) {
        savedCountry = 'NG';
      }

      const { currency: mappedCurrency, name } = countryCurrencyMap[savedCountry] || countryCurrencyMap.default;

      if (isMounted) {
        setCurrency(mappedCurrency);
        setCountry(name);
      }

      // Check cached exchange rate & sanitize against old corrupt rates (< 100)
      const cached = localStorage.getItem('exchangeRate');
      let currentRate = FALLBACK_EXCHANGE_RATE;

      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (isValidExchangeRate(parsed?.rate) && Date.now() - (parsed?.timestamp || 0) < 24 * 60 * 60 * 1000) {
            currentRate = parsed.rate;
          } else {
            // Remove corrupt or expired rate (e.g. old 0.00065311 or 1)
            localStorage.removeItem('exchangeRate');
          }
        } catch {
          localStorage.removeItem('exchangeRate');
        }
      }

      if (isMounted) {
        setExchangeRate(currentRate);
      }

      // Fetch fresh live exchange rate (NGN per 1 USD)
      try {
        const apiKey = import.meta.env.VITE_EXCHANGERATE_API_KEY;
        const url = apiKey
          ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`
          : `https://api.exchangerate-api.com/v4/latest/USD`;

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const fetchedRate = data.conversion_rates?.NGN || data.rates?.NGN;
          if (isValidExchangeRate(fetchedRate)) {
            if (isMounted) {
              setExchangeRate(fetchedRate);
            }
            localStorage.setItem('exchangeRate', JSON.stringify({ rate: fetchedRate, timestamp: Date.now() }));
          }
        }
      } catch (err) {
        console.warn('Live exchange rate fetch failed, using fallback/cached rate:', err.message);
      }

      if (isMounted) {
        setContextLoading(false);
      }
    };

    initializeCurrency();

    return () => {
      isMounted = false;
    };
  }, [countryCurrencyMap]);

  const toggleCurrency = useCallback(() => {
    const isCurrentlyNigeria = country === 'Nigeria' || currency === 'NGN';
    const nextCode = isCurrentlyNigeria ? 'US' : 'NG';
    const nextMap = countryCurrencyMap[nextCode] || countryCurrencyMap.default;
    localStorage.setItem('selectedCountry', nextCode);
    setCountry(nextMap.name);
    setCurrency(nextMap.currency);
  }, [country, currency, countryCurrencyMap]);

  const isUSD = currency === 'USD' || country !== 'Nigeria';

  const formatPrice = useCallback((amountInNaira) => {
    const numericAmount = Number(amountInNaira) || 0;
    const safeRate = isValidExchangeRate(exchangeRate) ? exchangeRate : FALLBACK_EXCHANGE_RATE;
    if (isUSD) {
      const converted = numericAmount / safeRate;
      return `$${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `₦${numericAmount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
  }, [isUSD, exchangeRate]);

  const convertPrice = useCallback((amountInNaira) => {
    const numericAmount = Number(amountInNaira) || 0;
    const safeRate = isValidExchangeRate(exchangeRate) ? exchangeRate : FALLBACK_EXCHANGE_RATE;
    return isUSD ? Number((numericAmount / safeRate).toFixed(2)) : numericAmount;
  }, [isUSD, exchangeRate]);

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      exchangeRate: isValidExchangeRate(exchangeRate) ? exchangeRate : FALLBACK_EXCHANGE_RATE,
      setExchangeRate,
      country,
      setCountry,
      toggleCurrency,
      formatPrice,
      convertPrice,
      isUSD,
      contextLoading
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};
