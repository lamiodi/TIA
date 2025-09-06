"use client"

import React, { useState, useEffect, useRef, useContext, useCallback, useMemo } from "react"
import ReactFlagsSelect from "react-flags-select"
import { CurrencyContext } from "../pages/CurrencyContext"

const styles = {
  popup: {
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(12px)", // Reduced blur for better performance
    WebkitBackdropFilter: "blur(12px)",
  },
}

const countryCurrencyMap = {
  NG: { currency: "NGN", name: "Nigeria" },
  US: { currency: "USD", name: "United States" },
  GB: { currency: "USD", name: "United Kingdom" },
  default: { currency: "USD", name: "International" },
}

const exchangeRateCache = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

const LocationPopup = React.memo(() => {
  const [showPopup, setShowPopup] = useState(true)
  const [selectedCountry, setSelectedCountry] = useState("NG")
  const [isFetching, setIsFetching] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const popupRef = useRef(null)
  const { setCurrency, setCountry, setExchangeRate } = useContext(CurrencyContext)

  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => setIsVisible(true), 50) // Reduced delay
      return () => clearTimeout(timer)
    }
  }, [showPopup])

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape" && showPopup) {
        handleClose()
      }
    },
    [showPopup],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (showPopup && popupRef.current) {
      popupRef.current.focus()
    }
  }, [showPopup])

  const handleClose = useCallback(() => {
    setIsVisible(false)
    setTimeout(() => setShowPopup(false), 200) // Reduced animation time
  }, [])

  const fetchExchangeRate = useCallback(async (currency) => {
    const cacheKey = `${currency}_NGN`
    const cached = exchangeRateCache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.rate
    }

    try {
      const apiKey = import.meta.env.VITE_EXCHANGERATE_API_KEY
      if (!apiKey) throw new Error("API key missing")

      const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/NGN`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const data = await response.json()
      const rate = currency === "NGN" ? 1 : data.conversion_rates.USD || 0.00065311

      exchangeRateCache.set(cacheKey, { rate, timestamp: Date.now() })
      return rate
    } catch (err) {
      console.error("Exchange rate fetch failed:", err.message)
      return currency === "NGN" ? 1 : 0.00065311
    }
  }, [])

  const handleCountryChange = useCallback(
    async (code) => {
      setIsFetching(true)
      const { currency, name } = countryCurrencyMap[code] || countryCurrencyMap.default

      setSelectedCountry(code)
      localStorage.setItem("selectedCountry", code)

      setCurrency(currency)
      setCountry(name)

      const rate = await fetchExchangeRate(currency)
      setExchangeRate(rate)
      localStorage.setItem(
        "exchangeRate",
        JSON.stringify({
          rate,
          timestamp: Date.now(),
          currency,
        }),
      )

      setIsFetching(false)
      handleClose()
    },
    [setCurrency, setCountry, setExchangeRate, fetchExchangeRate, handleClose],
  )

  const overlayClasses = useMemo(
    () =>
      `fixed inset-0 z-50 flex items-end justify-center md:justify-start backdrop-blur-sm transition-all duration-300 ${
        isVisible ? "bg-black/40 opacity-100" : "bg-black/0 opacity-0"
      }`,
    [isVisible],
  )

  const popupClasses = useMemo(
    () =>
      `bg-white/80 backdrop-blur-md shadow-2xl rounded-xl overflow-hidden transition-all duration-300 transform w-full max-w-xs mx-4 my-4 md:m-6 border border-white/20 ${
        isVisible
          ? "translate-y-0 md:translate-x-0 opacity-100 scale-100"
          : "translate-y-full md:translate-y-0 md:-translate-x-full opacity-0 scale-95"
      }`,
    [isVisible],
  )

  return (
    <>
      {showPopup && (
        <div
          className={overlayClasses}
          role="dialog"
          aria-modal="true"
          aria-label="Select your country"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div ref={popupRef} tabIndex={-1} className={popupClasses} style={styles.popup}>
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/50 hover:bg-white/70 transition-colors duration-200 flex items-center justify-center z-10"
              aria-label="Close"
            >
              <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-4 border-b border-white/30 bg-white/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900">Select Location</h3>
                  <p className="text-xs text-gray-600">Customize experience</p>
                </div>
              </div>
            </div>

            <div className="p-2 space-y-4 bg-white/30">
              {/* Country Selector */}
              <div className="relative">
                <ReactFlagsSelect
                  selected={selectedCountry}
                  onSelect={handleCountryChange}
                  searchable
                  searchPlaceholder="Search..."
                  className="w-full border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-colors duration-200 shadow-sm bg-white/70"
                  rfsKey="country-selector"
                />
                {isFetching && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-lg">
                    <svg className="animate-spin h-5 w-5 text-Primarycolor" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              <div className="bg-white/20 rounded-lg p-1 border border-white/20">
                <p className="text-xs text-gray-600 font-semibold mb-1 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Personalized shopping experience
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/40 text-gray-900 px-3 py-2 rounded-lg font-medium shadow-sm border border-white/20 flex items-center gap-2">
                    <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Local pricing
                  </div>
                  <div className="bg-white/40 text-gray-900 px-3 py-2 rounded-lg font-medium shadow-sm border border-white/20 flex items-center gap-2">
                    <svg className="w-3 h-3 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    </svg>
                    Fast shipping
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-4 border border-white/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-white">Special Offer</span>
                  <div className="flex-1 flex justify-end">
                    <div className="bg-yellow-400/20 text-yellow-300 text-xs px-2 py-0.5 rounded-full font-bold border border-yellow-400/30">
                      10% OFF
                    </div>
                  </div>
                </div>
                <p className="text-sm text-white font-medium mb-1">Login for 10% off Your Next Order</p>
                <p className="text-xs text-white/70">Valid for new customers only</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 text-gray-600 bg-white/60 rounded-lg font-semibold text-sm hover:bg-white/80 hover:text-gray-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 border border-white/40"
                >
                  Skip for now
                </button>
                <button
                  onClick={() => handleCountryChange(selectedCountry)}
                  className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-lg font-semibold text-sm hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-900/50 shadow-lg"
                  disabled={isFetching}
                >
                  <span className="flex items-center justify-center gap-2">
                    {isFetching ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
                          />
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        Continue
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </>
                    )}
                  </span>
                </button>
              </div>

              <div className="pt-3 border-t border-white/30 flex justify-center">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-semibold">Secure & Trusted Platform</span>
                </div>
              </div>

              <div className="flex justify-center gap-1.5 pt-2">
                <div className="w-2 h-1 bg-blue-500 rounded-full"></div>
                <div className="w-6 h-1 bg-blue-500/30 rounded-full"></div>
                <div className="w-2 h-1 bg-blue-500/30 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
})

LocationPopup.displayName = "LocationPopup"

export default LocationPopup
