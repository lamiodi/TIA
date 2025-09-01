"use client"
import React, { useState, useEffect, useRef, useContext, useMemo, useCallback } from "react"
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, AlertCircle, CheckCircle, Trash2, Bitcoin, MessageCircle, Smartphone, Truck, Clock, MapPin, Gift, X, Copy, User, RefreshCw } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WhatsAppChatWidget from '../components/WhatsAppChatWidget';
import { useAuth } from '../context/AuthContext';
import { useUserManager } from '../hooks/useUserManager';
import { CurrencyContext } from './CurrencyContext';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import PaystackPop from '@paystack/inline-js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com';
const WHATSAPP_NUMBER = '2348104117122';

// Unified Guest Checkout Form component
const UnifiedGuestCheckoutForm = React.memo(({ 
  formData, 
  formErrors, 
  existingUserType, 
  onFormChange,
  onLoginRedirect 
}) => (
  <div className="p-5 md:p-6 bg-white rounded-lg shadow-md mb-6">
    <h3 className="text-xl font-semibold text-Primarycolor mb-4 font-Manrope flex items-center">
      <User className="h-5 w-5 mr-2" />
      Guest Checkout
    </h3>
    <p className="text-sm text-Accent mb-4 font-Jost">
      Enter your details to create a temporary account and complete your purchase.
    </p>
    
    {existingUserType && (
      <div className={`mb-4 p-3 rounded-lg ${
        existingUserType === 'temporary' 
          ? 'bg-blue-50 border border-blue-200' 
          : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <div className="flex items-start">
          {existingUserType === 'temporary' ? (
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
          )}
          <div>
            <p className={`text-sm font-medium ${
              existingUserType === 'temporary' 
                ? 'text-blue-800' 
                : 'text-yellow-800'
            } font-Jost`}>
              {existingUserType === 'temporary' 
                ? 'A temporary account with this email already exists' 
                : 'An account with this email already exists'}
            </p>
            <p className={`text-xs mt-1 ${
              existingUserType === 'temporary' 
                ? 'text-blue-700' 
                : 'text-yellow-700'
            } font-Jost`}>
              {existingUserType === 'temporary' 
                ? 'Please use a different email or log in if you have a password.' 
                : 'Please log in to continue with your existing account.'}
            </p>
          </div>
        </div>
      </div>
    )}
    
    <div className="space-y-6">
      {/* Personal Information Section */}
      <div>
        <h4 className="text-lg font-medium text-Primarycolor mb-3 font-Manrope">Personal Information</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onFormChange('name', e.target.value)}
              className={`w-full p-2 border rounded-md font-Jost ${
                formErrors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your full name"
            />
            {formErrors.name && (
              <p className="text-sm text-red-600 mt-1 font-Jost">{formErrors.name}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => onFormChange('email', e.target.value)}
              className={`w-full p-2 border rounded-md font-Jost ${
                formErrors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your email address"
            />
            {formErrors.email && (
              <p className="text-sm text-red-600 mt-1 font-Jost">{formErrors.email}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
              Phone Number *
            </label>
            <input
              type="tel"
              value={formData.phone_number}
              onChange={(e) => onFormChange('phone_number', e.target.value)}
              className={`w-full p-2 border rounded-md font-Jost ${
                formErrors.phone_number ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your phone number"
            />
            {formErrors.phone_number && (
              <p className="text-sm text-red-600 mt-1 font-Jost">{formErrors.phone_number}</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Shipping Address Section */}
      <div>
        <h4 className="text-lg font-medium text-Primarycolor mb-3 font-Manrope">Shipping Address</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
              Address Title
            </label>
            <input
              type="text"
              value={formData.shipping_title}
              onChange={(e) => onFormChange('shipping_title', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md font-Jost"
              placeholder="e.g., Home, Office"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
              Address Line 1 *
            </label>
            <input
              type="text"
              value={formData.shipping_address_line_1}
              onChange={(e) => onFormChange('shipping_address_line_1', e.target.value)}
              className={`w-full p-2 border rounded-md font-Jost ${
                formErrors.shipping_address_line_1 ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Street address, P.O. box, company name"
            />
            {formErrors.shipping_address_line_1 && (
              <p className="text-sm text-red-600 mt-1 font-Jost">{formErrors.shipping_address_line_1}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
              Address Line 2
            </label>
            <input
              type="text"
              value={formData.shipping_address_line_2}
              onChange={(e) => onFormChange('shipping_address_line_2', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md font-Jost"
              placeholder="Apartment, suite, unit, building, floor, etc."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
              Landmark
            </label>
            <input
              type="text"
              value={formData.shipping_landmark}
              onChange={(e) => onFormChange('shipping_landmark', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md font-Jost"
              placeholder="Nearby landmark (optional)"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
                City *
              </label>
              <input
                type="text"
                value={formData.shipping_city}
                onChange={(e) => onFormChange('shipping_city', e.target.value)}
                className={`w-full p-2 border rounded-md font-Jost ${
                  formErrors.shipping_city ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="City"
              />
              {formErrors.shipping_city && (
                <p className="text-sm text-red-600 mt-1 font-Jost">{formErrors.shipping_city}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
                State
              </label>
              <input
                type="text"
                value={formData.shipping_state}
                onChange={(e) => onFormChange('shipping_state', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md font-Jost"
                placeholder="State"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
                ZIP Code
              </label>
              <input
                type="text"
                value={formData.shipping_zip_code}
                onChange={(e) => onFormChange('shipping_zip_code', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md font-Jost"
                placeholder="ZIP code"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
                Country *
              </label>
              <select
                value={formData.shipping_country}
                onChange={(e) => onFormChange('shipping_country', e.target.value)}
                className={`w-full p-2 border rounded-md font-Jost ${
                  formErrors.shipping_country ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Country</option>
                <option value="Nigeria">Nigeria</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
              </select>
              {formErrors.shipping_country && (
                <p className="text-sm text-red-600 mt-1 font-Jost">{formErrors.shipping_country}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Billing Address Section */}
      <div>
        <h4 className="text-lg font-medium text-Primarycolor mb-3 font-Manrope">Billing Address</h4>
        
        <div className="mb-4">
          <div className="flex items-center space-x-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="billingAddressOption"
                value="same"
                checked={formData.billingAddressOption === 'same'}
                onChange={() => onFormChange('billingAddressOption', 'same')}
                className="h-4 w-4 text-Primarycolor focus:ring-Primarycolor mr-2"
              />
              <span className="text-sm font-medium text-Accent font-Jost">Same as shipping address</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="billingAddressOption"
                value="different"
                checked={formData.billingAddressOption === 'different'}
                onChange={() => onFormChange('billingAddressOption', 'different')}
                className="h-4 w-4 text-Primarycolor focus:ring-Primarycolor mr-2"
              />
              <span className="text-sm font-medium text-Accent font-Jost">Use a different billing address</span>
            </label>
          </div>
        </div>
        
        {formData.billingAddressOption === 'different' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.billing_full_name}
                onChange={(e) => onFormChange('billing_full_name', e.target.value)}
                className={`w-full p-2 border rounded-md font-Jost ${
                  formErrors.billing_full_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Full name"
              />
              {formErrors.billing_full_name && (
                <p className="text-sm text-red-600 mt-1 font-Jost">{formErrors.billing_full_name}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
                Email *
              </label>
              <input
                type="email"
                value={formData.billing_email}
                onChange={(e) => onFormChange('billing_email', e.target.value)}
                className={`w-full p-2 border rounded-md font-Jost ${
                  formErrors.billing_email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Email address"
              />
              {formErrors.billing_email && (
                <p className="text-sm text-red-600 mt-1 font-Jost">{formErrors.billing_email}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.billing_phone_number}
                onChange={(e) => onFormChange('billing_phone_number', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md font-Jost"
                placeholder="Phone number"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
                Address Line 1 *
              </label>
              <input
                type="text"
                value={formData.billing_address_line_1}
                onChange={(e) => onFormChange('billing_address_line_1', e.target.value)}
                className={`w-full p-2 border rounded-md font-Jost ${
                  formErrors.billing_address_line_1 ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Street address, P.O. box, company name"
              />
              {formErrors.billing_address_line_1 && (
                <p className="text-sm text-red-600 mt-1 font-Jost">{formErrors.billing_address_line_1}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
                Address Line 2
              </label>
              <input
                type="text"
                value={formData.billing_address_line_2}
                onChange={(e) => onFormChange('billing_address_line_2', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md font-Jost"
                placeholder="Apartment, suite, unit, building, floor, etc."
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.billing_city}
                  onChange={(e) => onFormChange('billing_city', e.target.value)}
                  className={`w-full p-2 border rounded-md font-Jost ${
                    formErrors.billing_city ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="City"
                />
                {formErrors.billing_city && (
                  <p className="text-sm text-red-600 mt-1 font-Jost">{formErrors.billing_city}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
                  State
                </label>
                <input
                  type="text"
                  value={formData.billing_state}
                  onChange={(e) => onFormChange('billing_state', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md font-Jost"
                  placeholder="State"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={formData.billing_zip_code}
                  onChange={(e) => onFormChange('billing_zip_code', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md font-Jost"
                  placeholder="ZIP code"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
                  Country *
                </label>
                <select
                  value={formData.billing_country}
                  onChange={(e) => onFormChange('billing_country', e.target.value)}
                  className={`w-full p-2 border rounded-md font-Jost ${
                    formErrors.billing_country ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Country</option>
                  <option value="Nigeria">Nigeria</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                </select>
                {formErrors.billing_country && (
                  <p className="text-sm text-red-600 mt-1 font-Jost">{formErrors.billing_country}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
      <p className="text-xs text-blue-700 font-Jost">
        <strong>Note:</strong> A temporary account will be created with your information. 
        You'll receive an email with instructions to set a password and access your order history.
      </p>
    </div>
    
    {existingUserType === 'permanent' && (
      <div className="mt-3 text-center">
        <button
          type="button"
          onClick={onLoginRedirect}
          className="text-sm text-blue-600 hover:text-blue-800 font-Jost"
        >
          Log in to your existing account
        </button>
      </div>
    )}
  </div>
));

const CheckoutPage = () => {
  // Get user data from both AuthContext and our custom hook
  const { user: authUser, loading: authLoading, login } = useAuth();
  const { user: hookUser, refreshUser, refreshCount } = useUserManager();
  
  // Use the user from our custom hook, fall back to AuthContext if needed
  const user = hookUser || authUser;
  
  let currencyContext;
  try {
    currencyContext = useContext(CurrencyContext);
  } catch (error) {
    console.error('Error accessing CurrencyContext:', error);
    currencyContext = { 
      currency: 'NGN', 
      exchangeRate: 1, 
      country: 'Nigeria', 
      contextLoading: false 
    };
  }
  
  const { 
    currency: ctxCurrency, 
    exchangeRate: ctxExchangeRate, 
    country: ctxCountry, 
    contextLoading: ctxContextLoading
  } = currencyContext || {};
  
  const currency = typeof ctxCurrency === 'string' ? ctxCurrency : 'NGN';
  const exchangeRate = typeof ctxExchangeRate === 'number' ? ctxExchangeRate : 1;
  const country = typeof ctxCountry === 'string' ? ctxCountry : 'Nigeria';
  const contextLoading = typeof ctxContextLoading === 'boolean' ? ctxContextLoading : false;
  
  const navigate = useNavigate();
  const [cart, setCart] = useState({ cartId: null, subtotal: 0, tax: 0, total: 0, items: [] });
  const [shippingAddresses, setShippingAddresses] = useState([]);
  const [billingAddresses, setBillingAddresses] = useState([]);
  // always keep IDs as strings to avoid number/string mismatch bugs
  const [shippingAddressId, setShippingAddressId] = useState(null);
  const [billingAddressId, setBillingAddressId] = useState(null);
  const [shippingMethod, setShippingMethod] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [orderNote, setOrderNote] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBitcoinInstructions, setShowBitcoinInstructions] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    title: '',
    address_line_1: '',
    address_line_2: '',
    landmark: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'Nigeria',
    phone_number: '',
  });
  const [billingForm, setBillingForm] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'Nigeria',
  });
  
  // New state for unified guest form
  const [unifiedGuestForm, setUnifiedGuestForm] = useState({
    // Personal details
    name: '',
    email: '',
    phone_number: '',
    
    // Shipping address
    shipping_title: '',
    shipping_address_line_1: '',
    shipping_address_line_2: '',
    shipping_landmark: '',
    shipping_city: '',
    shipping_state: '',
    shipping_zip_code: '',
    shipping_country: 'Nigeria',
    
    // Billing address
    billingAddressOption: 'same', // 'same' or 'different'
    billing_full_name: '',
    billing_email: '',
    billing_phone_number: '',
    billing_address_line_1: '',
    billing_address_line_2: '',
    billing_city: '',
    billing_state: '',
    billing_zip_code: '',
    billing_country: 'Nigeria',
  });
  
  const [unifiedGuestFormErrors, setUnifiedGuestFormErrors] = useState({});
  
  // New state for billing address option
  const [billingAddressOption, setBillingAddressOption] = useState('same'); // 'same' or 'different'
  
  // Discount states
  const [firstOrderDiscount, setFirstOrderDiscount] = useState(0);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  
  // Add state to track if user data has been refreshed
  const [userDataRefreshed, setUserDataRefreshed] = useState(false);
  
  // Guest user states
  const [isGuest, setIsGuest] = useState(false);
  const [createdUserId, setCreatedUserId] = useState(null);
  const [existingUserType, setExistingUserType] = useState(null); // 'temporary', 'permanent', or null
  
  // State to track which form needs to be filled
  const [requiredForm, setRequiredForm] = useState(null); // 'guest', 'shipping', 'billing'
  
  // Memoize functions to prevent unnecessary re-renders
  const handleUnifiedGuestFormChange = useCallback((field, value) => {
    setUnifiedGuestForm(prev => ({...prev, [field]: value}));
    if (field === 'name' || field === 'email') {
      setExistingUserType(null);
    }
  }, []);
  
  const handleOrderNoteChange = useCallback((e) => {
    setOrderNote(e.target.value);
  }, []);
  
  const handleCouponCodeChange = useCallback((e) => {
    setCouponCode(e.target.value.toUpperCase());
  }, []);
  
  const handleLoginRedirect = useCallback(() => {
    navigate('/login', { state: { from: '/checkout' } });
  }, [navigate]);
  
  // Fixed isPlaceOrderDisabled useMemo
  const isPlaceOrderDisabled = useMemo(() => {
    try {
      // Basic checks
      if (loading) return true;
      
      if (isGuest) {
        // For guest users, check if the unified form is filled
        const hasPersonalDetails = unifiedGuestForm.name && 
                                  unifiedGuestForm.email && 
                                  unifiedGuestForm.phone_number;
        
        const hasShippingAddress = unifiedGuestForm.shipping_address_line_1 && 
                                  unifiedGuestForm.shipping_city && 
                                  unifiedGuestForm.shipping_country;
        
        let hasBillingAddress = false;
        if (unifiedGuestForm.billingAddressOption === 'same') {
          hasBillingAddress = hasShippingAddress;
        } else {
          hasBillingAddress = unifiedGuestForm.billing_full_name && 
                             unifiedGuestForm.billing_email && 
                             unifiedGuestForm.billing_address_line_1 && 
                             unifiedGuestForm.billing_city && 
                             unifiedGuestForm.billing_country;
        }
        
        if (!hasPersonalDetails || !hasShippingAddress || !hasBillingAddress) return true;
      } else {
        // For authenticated users, check if we have addresses
        const hasShippingAddress = shippingForm?.address_line_1 || shippingAddressId;
        if (!hasShippingAddress) return true;
        
        const hasBillingAddress = billingForm?.address_line_1 || billingAddressId;
        if (!hasBillingAddress) return true;
      }
      
      // Check shipping method if in Nigeria
      const addressCountry = isGuest ? unifiedGuestForm.shipping_country : (shippingForm?.country || country);
      const isNigeria = addressCountry?.toLowerCase() === 'nigeria';
      if (isNigeria && !shippingMethod) return true;
      
      // All checks passed, button should be enabled
      return false;
    } catch (error) {
      console.error('Error in isPlaceOrderDisabled:', error);
      return true; // Disable button if there's an error
    }
  }, [
    loading,
    isGuest,
    unifiedGuestForm,
    shippingForm,
    billingForm,
    shippingAddressId,
    billingAddressId,
    country,
    shippingMethod
  ]);
  
  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (err) {
      console.error('CheckoutPage: Error decoding token:', err);
      return null;
    }
  };
  
  const getToken = () => {
    if (user && user.token) return user.token;
    return localStorage.getItem('token');
  };
  
  const getUserId = () => {
    const token = getToken();
    if (!token) return null;
    const tokenData = decodeToken(token);
    return tokenData?.id;
  };
  
  const isAuthenticated = () => {
    return !!getToken();
  };
  
  // Replace your refreshUserData function with this
  const refreshUserData = async () => {
    try {
      console.log('Refreshing user data...');
      
      // Use the refreshUser function from our custom hook
      const updatedUser = await refreshUser();
      
      if (updatedUser) {
        console.log('User data refreshed successfully');
        setUserDataRefreshed(true);
        return updatedUser;
      } else {
        console.warn('Failed to refresh user data');
        return null;
      }
    } catch (err) {
      console.error('Failed to refresh user data:', err);
      return null;
    }
  };
  
  // Force refresh user data on component mount
  useEffect(() => {
    const refreshUserDataOnMount = async () => {
      if (user && isAuthenticated() && !userDataRefreshed) {
        try {
          await refreshUserData();
          console.log('User data refreshed on component mount');
        } catch (err) {
          console.error('Failed to refresh user data on mount:', err);
        }
      }
    };
    refreshUserDataOnMount();
  }, [user, userDataRefreshed]);
  
  // Fixed first order discount useEffect
  useEffect(() => {
    try {
      const currentSubtotal = cart?.subtotal || 0;
      
      console.log('Calculating first order discount:', {
        userFirstOrder: user?.first_order,
        currentSubtotal,
        userDataRefreshed,
        refreshCount,
        userExists: !!user
      });
      
      // Make sure user exists and first_order is true
      if (user && user.first_order === true && currentSubtotal > 0) {
        const discountAmount = Number((currentSubtotal * 0.05).toFixed(2));
        setFirstOrderDiscount(discountAmount);
        console.log('Applied first order discount:', discountAmount);
      } else {
        setFirstOrderDiscount(0);
        console.log('No first order discount applied. User:', user ? 'exists' : 'missing', 'First order:', user?.first_order);
      }
    } catch (error) {
      console.error('Error calculating first order discount:', error);
      setFirstOrderDiscount(0);
    }
  }, [user?.first_order, cart?.subtotal, userDataRefreshed, refreshCount, user]);
  
  // Apply coupon code
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }
    
    setCouponLoading(true);
    setCouponError('');
    setCouponSuccess('');
    
    try {
      const token = getToken();
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/discounts/validate`, // Updated to use /api/admin/discounts/validate
        { code: couponCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.valid) {
        const discount = response.data.discount;
        
        // Calculate discount amount
        let discountAmount = 0;
        if (discount.type === 'percentage') {
          discountAmount = (cart.subtotal * discount.value) / 100;
        } else if (discount.type === 'fixed') {
          discountAmount = discount.value;
        }
        
        // Ensure discount doesn't exceed subtotal
        discountAmount = Math.min(discountAmount, cart.subtotal);
        
        setAppliedCoupon({
          code: discount.code,
          type: discount.type,
          value: discount.value,
          amount: discountAmount
        });
        
        setCouponDiscount(discountAmount);
        setCouponSuccess(`Coupon applied! You saved ${discount.type === 'percentage' ? `${discount.value}%` : `₦${discount.value}`}`);
      } else {
        setCouponError(response.data.message || 'Invalid coupon code');
      }
    } catch (err) {
      console.error('Error validating coupon:', err);
      setCouponError(err.response?.data?.message || 'Failed to validate coupon');
    } finally {
      setCouponLoading(false);
    }
  };
  
  // Remove coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponDiscount(0);
    setCouponSuccess('');
  };
  
  const shippingOptions = [
    { 
      id: 1, 
      method: 'Delivery within Lagos', 
      total_cost: 4000, 
      estimated_delivery: '3–5 business days',
      icon: 'truck',
      description: 'Fast delivery within Lagos state'
    },
    { 
      id: 2, 
      method: 'GIG Logistics (Outside Lagos)', 
      total_cost: 6000, 
      estimated_delivery: '5–7 business days',
      icon: 'package',
      description: 'Reliable nationwide delivery'
    },
    { 
      id: 3, 
      method: 'Home Delivery – Outside Lagos', 
      total_cost: 10000, 
      estimated_delivery: '7–10 business days',
      icon: 'home',
      description: 'Direct to your doorstep'
    },
  ];
  
  const getShippingIcon = (iconType) => {
    switch (iconType) {
      case 'truck':
        return <Truck className="h-5 w-5" />;
      case 'package':
        return <MapPin className="h-5 w-5" />;
      case 'home':
        return <MapPin className="h-5 w-5" />;
      default:
        return <Truck className="h-5 w-5" />;
    }
  };
  
  // Function to validate the unified guest form
  const validateUnifiedGuestForm = () => {
    const errors = {};
    
    // Validate personal details
    if (!unifiedGuestForm.name.trim()) {
      errors.name = 'Name is required';
    }
    if (!unifiedGuestForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(unifiedGuestForm.email)) {
      errors.email = 'Email is invalid';
    }
    if (!unifiedGuestForm.phone_number.trim()) {
      errors.phone_number = 'Phone number is required';
    }
    
    // Validate shipping address
    if (!unifiedGuestForm.shipping_address_line_1.trim()) {
      errors.shipping_address_line_1 = 'Address line 1 is required';
    }
    if (!unifiedGuestForm.shipping_city.trim()) {
      errors.shipping_city = 'City is required';
    }
    if (!unifiedGuestForm.shipping_country.trim()) {
      errors.shipping_country = 'Country is required';
    }
    
    // Validate billing address
    if (unifiedGuestForm.billingAddressOption === 'different') {
      if (!unifiedGuestForm.billing_full_name.trim()) {
        errors.billing_full_name = 'Full name is required';
      }
      if (!unifiedGuestForm.billing_email.trim()) {
        errors.billing_email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(unifiedGuestForm.billing_email)) {
        errors.billing_email = 'Email is invalid';
      }
      if (!unifiedGuestForm.billing_address_line_1.trim()) {
        errors.billing_address_line_1 = 'Address line 1 is required';
      }
      if (!unifiedGuestForm.billing_city.trim()) {
        errors.billing_city = 'City is required';
      }
      if (!unifiedGuestForm.billing_country.trim()) {
        errors.billing_country = 'Country is required';
      }
    }
    
    setUnifiedGuestFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Validate shipping address for authenticated users
  const validateShippingAddress = () => {
    if (!shippingForm.address_line_1.trim()) {
      setError('Please add a shipping address');
      setRequiredForm('shipping');
      return false;
    }
    return true;
  };
  
  // Validate billing address for authenticated users
  const validateBillingAddress = () => {
    if (!billingForm.address_line_1.trim()) {
      setError('Please add a billing address');
      setRequiredForm('billing');
      return false;
    }
    return true;
  };
  
  // New function to create temporary user and return ID
  const createTemporaryUserAndGetId = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/create-temp-user`, {
        name: unifiedGuestForm.name,
        email: unifiedGuestForm.email,
        phone_number: unifiedGuestForm.phone_number
      });
      
      const { user, isExisting } = response.data;
      const userId = user.id;
      
      // Update all state at once
      setCreatedUserId(userId);
      setIsGuest(false);
      
      if (isExisting) {
        setExistingUserType('temporary');
        toast.success('Welcome back! We found your temporary account.');
      } else {
        setExistingUserType(null);
        toast.success('Account created successfully!');
      }
      
      return userId;
    } catch (err) {
      console.error('Error creating temporary user:', err);
      
      // Check if the error is because the user already exists
      if (err.response?.status === 400 && 
          (err.response?.data?.error?.includes('already exists') || 
           err.response?.data?.message?.includes('already registered'))) {
        
        if (err.response?.data?.existingUser) {
          const { existingUser } = err.response.data;
          
          if (existingUser.is_temporary === false) {
            // It's a permanent user
            setExistingUserType('permanent');
            setError('An account with this email and phone number already exists. Please log in to continue.');
            toast.error('An account with this email and phone number already exists. Please log in to continue.');
          } else {
            // It's a temporary user
            setExistingUserType('temporary');
            setError('A temporary account with this email and phone number already exists. Please use a different email or phone number or log in if you have a password.');
            toast.error('A temporary account with this email and phone number already exists. Please use a different email or phone number or log in if you have a password.');
          }
        } else {
          setExistingUserType('permanent');
          setError('An account with this email and phone number already exists. Please log in to continue.');
          toast.error('An account with this email and phone number already exists. Please log in to continue.');
        }
      } else if (err.response?.status === 500) {
        // Handle server error specifically
        setError('Server error occurred while creating your account. Please try again later.');
        toast.error('Server error occurred while creating your account. Please try again later.');
      } else {
        // Some other error occurred
        const errorMessage = err.response?.data?.error || 
                            err.response?.data?.message || 
                            err.message || 
                            'Failed to create account';
        setError(errorMessage);
        toast.error(errorMessage);
      }
      
      return null;
    }
  };
  
  // New function to save addresses to database
  const saveAddressesToDatabase = async (userId) => {
    try {
      let shippingAddressData;
      let billingAddressData;
      
      if (isGuest) {
        // For guest users, use data from the unified form
        shippingAddressData = {
          title: unifiedGuestForm.shipping_title,
          address_line_1: unifiedGuestForm.shipping_address_line_1,
          address_line_2: unifiedGuestForm.shipping_address_line_2,
          landmark: unifiedGuestForm.shipping_landmark,
          city: unifiedGuestForm.shipping_city,
          state: unifiedGuestForm.shipping_state,
          zip_code: unifiedGuestForm.shipping_zip_code,
          country: unifiedGuestForm.shipping_country,
          phone_number: unifiedGuestForm.phone_number,
        };
        
        if (unifiedGuestForm.billingAddressOption === 'same') {
          // Use shipping address for billing
          billingAddressData = {
            full_name: unifiedGuestForm.name,
            email: unifiedGuestForm.email,
            phone_number: unifiedGuestForm.phone_number,
            address_line_1: unifiedGuestForm.shipping_address_line_1,
            address_line_2: unifiedGuestForm.shipping_address_line_2,
            city: unifiedGuestForm.shipping_city,
            state: unifiedGuestForm.shipping_state,
            zip_code: unifiedGuestForm.shipping_zip_code,
            country: unifiedGuestForm.shipping_country,
          };
        } else {
          // Use separate billing address
          billingAddressData = {
            full_name: unifiedGuestForm.billing_full_name,
            email: unifiedGuestForm.billing_email,
            phone_number: unifiedGuestForm.billing_phone_number,
            address_line_1: unifiedGuestForm.billing_address_line_1,
            address_line_2: unifiedGuestForm.billing_address_line_2,
            city: unifiedGuestForm.billing_city,
            state: unifiedGuestForm.billing_state,
            zip_code: unifiedGuestForm.billing_zip_code,
            country: unifiedGuestForm.billing_country,
          };
        }
      } else {
        // For authenticated users, use existing form data
        shippingAddressData = shippingForm;
        billingAddressData = billingForm;
      }
      
      // Save shipping address
      const shippingResponse = await axios.post(`${API_BASE_URL}/api/addresses`, {
        user_id: userId,
        ...shippingAddressData
      });
      
      // Update the shipping address ID with the newly created address
      const newShippingAddressId = shippingResponse.data.id;
      setShippingAddressId(String(newShippingAddressId));
      
      // Save billing address
      const billingResponse = await axios.post(`${API_BASE_URL}/api/billing-addresses`, {
        user_id: userId,
        ...billingAddressData
      });
      
      // Update the billing address ID with the newly created address
      const newBillingAddressId = billingResponse.data.id;
      setBillingAddressId(String(newBillingAddressId));
      
      toast.success('Addresses saved successfully');
    } catch (err) {
      console.error('Error saving addresses:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message;
      setError(`Failed to save addresses: ${errorMessage}`);
      toast.error(`Failed to save addresses: ${errorMessage}`);
      throw err; // Re-throw to stop order processing
    }
  };
  
  // Updated processOrder function that takes a user ID
  const processOrderWithUserId = async (userId) => {
    try {
      const addressCountry = isGuest ? unifiedGuestForm.shipping_country : shippingForm.country;
      const isNigeria = addressCountry.toLowerCase() === 'nigeria';
      
      if (isNigeria && !shippingMethod) {
        setError('Please select a shipping method');
        setRequiredForm('shipping');
        return;
      }
      
      if (!cart?.items?.length) {
        setError('Cart is empty');
        toast.error('Cart is empty');
        return;
      }
      
      const orderCurrency = 'NGN'; // Force NGN due to Paystack limitation
      
      // Calculate amounts in NGN
      const baseSubtotal = Number(cart?.subtotal) || 0;
      const baseFirstOrderDiscount = user?.first_order ? (baseSubtotal * 0.05) : 0;
      const baseCouponDiscount = couponDiscount;
      const baseTotalDiscount = Number((baseFirstOrderDiscount + baseCouponDiscount).toFixed(2));
      const baseFinalDiscount = Math.min(baseTotalDiscount, baseSubtotal);
      const baseTax = isNigeria ? 0 : Number((baseSubtotal * 0.05).toFixed(2));
      const baseShippingCost = isNigeria ? shippingMethod?.total_cost || 0 : 0;
      const baseDiscountedSubtotal = Number((baseSubtotal - baseFinalDiscount).toFixed(2));
      const baseTotal = Number((baseDiscountedSubtotal + baseTax + baseShippingCost).toFixed(2));
      
      const orderData = {
        user_id: userId,
        // Send address IDs since we've saved them to the database
        address_id: parseInt(shippingAddressId),
        billing_address_id: parseInt(billingAddressId),
        cart_id: isAuthenticated() ? cart.cartId : null,
        total: baseTotal,
        discount: baseFinalDiscount,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        delivery_option: isNigeria ? 'standard' : 'international',
        shipping_method_id: isNigeria ? shippingMethod?.id : null,
        shipping_cost: baseShippingCost,
        shipping_country: addressCountry,
        payment_method: paymentMethod,
        currency: orderCurrency,
        reference: uuidv4(),
        items: cart.items.map(item => {
          const basePrice = Number(item.item?.price || 0);
          return {
            variant_id: item.item?.is_product ? item.item.id : null,
            bundle_id: item.item?.is_product ? null : item.item.id,
            quantity: item.quantity || 1,
            price: basePrice,
            size_id: item.item?.size_id || null,
            image_url: item.item?.image_url || item.item?.image || (item.item?.is_product ? 
              (item.item?.product_images?.find(img => img.is_primary)?.image_url || null) : 
              (item.item?.bundle_images?.find(img => img.is_primary)?.image_url || null)),
            product_name: item.item?.name || 'Unknown Item',
            color_name: item.item?.color || null,
            size_name: item.item?.size || null,
          };
        }),
        note: orderNote,
        exchange_rate: 1, // No conversion needed
        base_currency_total: baseTotal,
        converted_total: baseTotal,
        tax: baseTax,
      };
      
      console.log('Order payload:', orderData);
      
      const orderResponse = await axios.post(`${API_BASE_URL}/api/orders`, orderData);
      
      console.log('Order response:', orderResponse.data);
      
      const orderId = orderResponse.data.order?.id || orderResponse.data.id || orderResponse.data.data?.id;
      if (!orderId) {
        console.error('Order ID not found in response:', orderResponse.data);
        throw new Error('Order ID not found in response');
      }
      
      const paymentCurrency = 'NGN';
      const paymentAmount = baseTotal;
      
      const callbackUrl = `${window.location.origin}/thank-you?reference=${orderData.reference}&orderId=${orderId}`;
      
      const paymentData = {
        order_id: orderId,
        reference: orderData.reference,
        email: isGuest ? unifiedGuestForm.email : (billingForm.email || user.email),
        amount: Math.round(paymentAmount * 100), // Convert to kobo
        currency: paymentCurrency,
        callback_url: callbackUrl,
      };
      
      console.log('Payment payload:', paymentData);
      
      const paymentResponse = await axios.post(
        `${API_BASE_URL}/api/paystack/initialize`,
        paymentData
      );
      
      console.log('Payment response:', paymentResponse.data);
      
      let paymentInfo = paymentResponse.data;
      if (paymentResponse.data.data) {
        paymentInfo = paymentResponse.data.data;
      }
      
      const accessCode = paymentInfo.access_code;
      const authorizationUrl = paymentInfo.authorization_url;
      
      if (accessCode) {
        // Clear guest cart from localStorage
        localStorage.removeItem('guestCart');
        toast.success('Order placed successfully. Opening payment popup...');
        localStorage.setItem('lastOrderReference', orderData.reference);
        localStorage.setItem('pendingOrderId', orderId); // Store the order ID
        
        const paystack = new PaystackPop();
        paystack.newTransaction({
          key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
          email: paymentData.email,
          amount: paymentData.amount,
          currency: paymentData.currency,
          reference: paymentData.reference,
          callback: (response) => {
            toast.success('Payment successful!');
            navigate(`/thank-you?reference=${orderData.reference}&orderId=${orderId}`);
          },
          onClose: () => {
            toast.info('Payment window closed. You can complete payment later from your orders page.');
            navigate(`/orders/${orderId}`);
          }
        });
      } else if (authorizationUrl) {
        // Clear guest cart from localStorage
        localStorage.removeItem('guestCart');
        toast.success('Order placed successfully. Redirecting to payment page...');
        localStorage.setItem('lastOrderReference', orderData.reference);
        localStorage.setItem('pendingOrderId', orderId);
        window.location.href = authorizationUrl;
      } else {
        console.error('Neither access_code nor authorization_url found in payment response:', paymentResponse.data);
        throw new Error('Failed to get payment information');
      }
    } catch (err) {
      console.error('Payment processing error:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.details || err.message;
      setError(`Failed to process order: ${errorMessage}`);
      toast.error(`Failed to process order: ${errorMessage}`);
    }
  };
  
  // Handle place order - validates all forms and processes the order
  const handlePlaceOrder = async () => {
    setLoading(true);
    setError('');
    setRequiredForm(null);
    
    try {
      // Step 1: Validate forms based on user type
      if (isGuest) {
        // Validate unified guest form
        if (!validateUnifiedGuestForm()) {
          setRequiredForm('guest');
          setLoading(false);
          return;
        }
      } else {
        // For authenticated users, validate shipping and billing addresses
        if (!validateShippingAddress()) {
          setLoading(false);
          return;
        }
        
        if (!validateBillingAddress()) {
          setLoading(false);
          return;
        }
      }
      
      // Step 2: Get or create user ID
      let userId = null;
      
      if (isGuest) {
        // Create temporary user and get user ID
        userId = await createTemporaryUserAndGetId();
        if (!userId) {
          setLoading(false);
          return;
        }
      } else {
        // Use existing user ID
        userId = getUserId();
      }
      
      // Step 3: Save addresses to database
      await saveAddressesToDatabase(userId);
      
      // Step 4: Process the order with the user ID
      await processOrderWithUserId(userId);
    } catch (err) {
      console.error('Error in place order:', err);
      setLoading(false);
    }
  };
  
  const handleDeleteAddress = async (type, addressId) => {
    if (!isAuthenticated() && !createdUserId) {
      console.error('CheckoutPage: No user ID available');
      toast.error('Please create an account to delete address');
      return;
    }
  
    try {
      setLoading(true);
      
      // 1. Delete address from backend
      await axios.delete(`${API_BASE_URL}/api/${type}/${addressId}`);
  
      if (type === 'addresses') {
        // Remove from local state
        const remaining = shippingAddresses.filter(addr => String(addr.id) !== String(addressId));
        setShippingAddresses(remaining);
  
        // If deleted address was selected, pick first remaining or null
        if (String(shippingAddressId) === String(addressId)) {
          const newShippingId = remaining.length ? String(remaining[0].id) : null;
          setShippingAddressId(newShippingId);
        }
      } else {
        // Type = 'billing-addresses'
        const remaining = billingAddresses.filter(addr => String(addr.id) !== String(addressId));
        setBillingAddresses(remaining);
        if (String(billingAddressId) === String(addressId)) {
          setBillingAddressId(remaining.length ? String(remaining[0].id) : null);
        }
      }
  
      setSuccess(`Successfully deleted ${type === 'addresses' ? 'shipping' : 'billing'} address.`);
      toast.success(`Deleted ${type === 'addresses' ? 'shipping' : 'billing'} address`);
    } catch (err) {
      const errorMessage = err.response?.data?.details || err.response?.data?.error || err.message;
      setError(`Failed to delete address: ${errorMessage}`);
      toast.error(`Failed to delete address: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);
  
  useEffect(() => {
    const fetchCartAndAddresses = async () => {
      // Check if user is authenticated
      if (!isAuthenticated() && !createdUserId) {
        // Load guest cart from localStorage
        const guestCartData = localStorage.getItem('guestCart');
        if (guestCartData) {
          try {
            const guestCart = JSON.parse(guestCartData);
            setCart(guestCart);
            setIsGuest(true);
            setLoading(false);
            return;
          } catch (err) {
            console.error('Error parsing guest cart:', err);
          }
        }
        setCart({ cartId: null, subtotal: 0, tax: 0, total: 0, items: [] });
        setIsGuest(true);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const userId = createdUserId || getUserId();
        
        // If we have a createdUserId but no token, we don't need to fetch addresses
        if (createdUserId && !isAuthenticated()) {
          setLoading(false);
          return;
        }
        
        const token = getToken();
        
        const cartResponse = await axios.get(`${API_BASE_URL}/api/cart/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const cartData = cartResponse.data?.data || cartResponse.data;
        
        if (!cartData.cartId || !cartData.items?.length) {
          setError('Your cart is empty. Please add items to proceed.');
          toast.error('Your cart is empty. Please add items to proceed.');
          navigate('/cart');
          return;
        }
        
        setCart(cartData);
        setIsGuest(false);
        
        try {
          const shippingResponse = await axios.get(`${API_BASE_URL}/api/addresses/user/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log('Shipping addresses response:', shippingResponse.data);
          
          let shippingData = shippingResponse.data;
          if (shippingData && !Array.isArray(shippingData)) {
            shippingData = [shippingData];
          } else if (shippingData && Array.isArray(shippingData.data)) {
            shippingData = shippingData.data;
          } else if (!shippingData) {
            shippingData = [];
          }
          
          setShippingAddresses(shippingData);
          if (shippingData.length > 0) {
            setShippingAddressId(String(shippingData[0].id));
            // Pre-fill the shipping form with the first address
            setShippingForm({
              title: shippingData[0].title || '',
              address_line_1: shippingData[0].address_line_1 || '',
              address_line_2: shippingData[0].address_line_2 || '',
              landmark: shippingData[0].landmark || '',
              city: shippingData[0].city || '',
              state: shippingData[0].state || '',
              zip_code: shippingData[0].zip_code || '',
              country: shippingData[0].country || 'Nigeria',
              phone_number: shippingData[0].phone_number || '',
            });
          }
        } catch (err) {
          console.error('Error fetching shipping addresses:', err);
          toast.error(`Failed to fetch shipping addresses: ${err.response?.data?.error || err.message}`);
          setShippingAddresses([]);
        }
        
        try {
          const billingResponse = await axios.get(`${API_BASE_URL}/api/billing-addresses/user/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log('Billing addresses response:', billingResponse.data);
          
          let billingData = billingResponse.data;
          if (billingData && !Array.isArray(billingData)) {
            billingData = [billingData];
          } else if (billingData && Array.isArray(billingData.data)) {
            billingData = billingData.data;
          } else if (!billingData) {
            billingData = [];
          }
          
          setBillingAddresses(billingData);
          if (billingData.length > 0) {
            setBillingAddressId(String(billingData[0].id));
            // Pre-fill the billing form with the first address
            setBillingForm({
              full_name: billingData[0].full_name || '',
              email: billingData[0].email || '',
              phone_number: billingData[0].phone_number || '',
              address_line_1: billingData[0].address_line_1 || '',
              address_line_2: billingData[0].address_line_2 || '',
              city: billingData[0].city || '',
              state: billingData[0].state || '',
              zip_code: billingData[0].zip_code || '',
              country: billingData[0].country || 'Nigeria',
            });
          }
        } catch (err) {
          console.error('Error fetching billing addresses:', err);
          toast.error(`Failed to fetch billing addresses: ${err.response?.data?.error || err.message}`);
          setBillingAddresses([]);
        }
        
        toast.success('Checkout data loaded successfully');
      } catch (err) {
        const errorMessage = err.message || 'Unknown error';
        setError(`Failed to load checkout data: ${errorMessage}`);
        toast.error(`Failed to load checkout data: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };
    
    if (!authLoading && !contextLoading) {
      fetchCartAndAddresses();
    }
  }, [user, authLoading, contextLoading, navigate, createdUserId]);
  
  useEffect(() => {
    if (shippingAddresses.length > 0 && !shippingAddressId) {
      setShippingAddressId(String(shippingAddresses[0].id));
    }
    if (billingAddresses.length > 0 && !billingAddressId) {
      setBillingAddressId(String(billingAddresses[0].id));
    }
  }, [shippingAddresses, billingAddresses, shippingAddressId, billingAddressId]);
  
  useEffect(() => {
    const addressCountry = shippingForm.country || country;
    const isNigeria = addressCountry.toLowerCase() === 'nigeria';
    
    if (isNigeria && !shippingMethod) {
      const defaultMethod = shippingOptions[0];
      setShippingMethod(defaultMethod);
    }
    
    if (!isNigeria && shippingMethod) {
      setShippingMethod(null);
    }
  }, [shippingForm, country]);
  
  // Add this useEffect to check for pending orders
  useEffect(() => {
    const checkPendingOrder = async () => {
      const pendingOrderId = localStorage.getItem('pendingOrderId');
      if (pendingOrderId) {
        try {
          const token = getToken();
          const response = await axios.get(`${API_BASE_URL}/api/orders/${pendingOrderId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          const order = response.data;
          if (order.payment_status === 'pending') {
            toast.info('You have a pending order. Please complete the payment.');
            navigate(`/orders/${pendingOrderId}`);
            return;
          }
        } catch (err) {
          console.error('Error checking pending order:', err);
        } finally {
          localStorage.removeItem('pendingOrderId');
        }
      }
    };
    
    if (user && !authLoading && !contextLoading) {
      checkPendingOrder();
    }
  }, [user, authLoading, contextLoading, navigate]);
  
  const addressCountry = shippingForm.country || country;
  const isNigeria = addressCountry.toLowerCase() === 'nigeria';
  
  // Always use NGN for calculations
  const subtotal = Number(cart?.subtotal) || 0;
  const tax = isNigeria ? 0 : Number((subtotal * 0.05).toFixed(2));
  const shippingCost = isNigeria ? shippingMethod?.total_cost || 0 : 0;
  
  // Calculate total discount (first order + coupon)
  const totalDiscount = Number((firstOrderDiscount + couponDiscount).toFixed(2));
  // Ensure total discount doesn't exceed subtotal
  const finalDiscount = Math.min(totalDiscount, subtotal);
  const discountedSubtotal = Number((subtotal - finalDiscount).toFixed(2));
  const total = Number((discountedSubtotal + tax + shippingCost).toFixed(2));
  
  // Display values
  const displaySubtotal = subtotal;
  const displayFirstOrderDiscount = firstOrderDiscount;
  const displayCouponDiscount = couponDiscount;
  const displayTotalDiscount = finalDiscount;
  const displayTax = tax;
  const displayTotal = total;
  
  const handleWhatsAppPayment = () => {
    const message = `Hello, I would like to pay for my order with Bitcoin.\n\nOrder Details:\n- Subtotal: ${displaySubtotal.toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    })}\n${displayFirstOrderDiscount > 0 ? `- First Order Discount (5%): -${displayFirstOrderDiscount.toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    })}\n` : ''}${displayCouponDiscount > 0 ? `- Coupon Discount: -${displayCouponDiscount.toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    })}\n` : ''}- Total Amount: ${displayTotal.toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    })}\n- Currency: NGN\n- Order Reference: order_${createdUserId || getUserId()}_${Date.now()}\n\nI have attached a screenshot of my checkout for your reference.`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=${encodedMessage}`, '_blank');
    toast.success('Opening WhatsApp to complete your Bitcoin payment...');
  };
  
  if (authLoading || contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-Accent">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-sm font-Jost">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-Accent">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-sm font-Jost">Loading checkout data...</p>
        </div>
      </div>
    );
  }
  
  // Updated empty cart handling to check for pending orders
  if (!cart?.items?.length) {
    // Check if there's a pending order
    const pendingOrderId = localStorage.getItem('pendingOrderId');
    if (pendingOrderId) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center text-Accent py-8 font-Jost">
            <p>Your order is pending payment.</p>
            <Link to={`/orders/${pendingOrderId}`} className="mt-4 inline-flex items-center text-Accent hover:text-Primarycolor">
              View Order
            </Link>
          </div>
        </div>
      );
    }
    
    // Original empty cart message
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-Accent py-8 font-Jost">
          Your cart is empty. Please add items to proceed.
          <Link to="/cart" className="mt-4 inline-flex items-center text-Accent hover:text-Primarycolor">
            <ArrowLeft className="h-5 w-5 mr-2" /> Go to Cart
          </Link>
        </div>
      </div>
    );
  }
  
  // Debug information to help identify why the button is disabled
  const debugButtonDisabled = () => {
    console.log('Button disabled check:', {
      loading,
      isGuest,
      hasPersonalDetails: unifiedGuestForm.name && unifiedGuestForm.email && unifiedGuestForm.phone_number,
      hasShippingAddress: unifiedGuestForm.shipping_address_line_1 && unifiedGuestForm.shipping_city && unifiedGuestForm.shipping_country,
      billingAddressOption: unifiedGuestForm.billingAddressOption,
      hasBillingAddress: unifiedGuestForm.billingAddressOption === 'same' || 
                         (unifiedGuestForm.billing_full_name && unifiedGuestForm.billing_email && unifiedGuestForm.billing_address_line_1 && unifiedGuestForm.billing_city && unifiedGuestForm.billing_country),
      shippingFormAddressLine1: !!shippingForm.address_line_1,
      shippingAddressId: !!shippingAddressId,
      billingFormAddressLine1: !!billingForm.address_line_1,
      billingAddressId: !!billingAddressId,
      isNigeria,
      shippingMethod: !!shippingMethod,
      createdUserId: !!createdUserId
    });
  };
  
  return (
    <div 
      className="min-h-screen bg-gray-100 typography"
      style={{
        '--color-Primarycolor': '#1E1E1E',
        '--color-Secondarycolor': '#ffffff',
        '--color-Accent': '#6E6E6E',
        '--font-Manrope': '"Manrope", "sans-serif"',
        '--font-Jost': '"Jost", "sans-serif"'
      }}
    >
      <Navbar />
      <div className="max-w-7xl mx-auto px-[0.4em] md:px-4 sm:px-6 lg:px-8 py-7">
        <Link to="/cart" className="inline-flex items-center text-Accent hover:text-Primarycolor mb-6 font-Jost">
          <ArrowLeft className="h-5 w-5 mr-1" /> Back to Cart
        </Link>
        <h2 className="text-3xl font-bold text-Primarycolor mb-8 font-Manrope">Checkout</h2>
        
        {/* Debug Panel - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-bold text-yellow-800 mb-2">Debug Info:</h4>
            <p className="text-sm text-yellow-700">
              User ID: {user?.id || createdUserId}<br />
              Is Guest: {isGuest?.toString()}<br />
              First Order (DB): {user?.first_order?.toString()}<br />
              First Order Discount: ₦{displayFirstOrderDiscount.toFixed(2)}<br />
              Cart Subtotal: ₦{cart.subtotal.toFixed(2)}<br />
              User Data Refreshed: {userDataRefreshed?.toString()}
            </p>
            <button 
              onClick={refreshUserData}
              className="mt-2 px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
            >
              Refresh User Data
            </button>
            <button 
              onClick={debugButtonDisabled}
              className="mt-2 ml-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              Debug Button
            </button>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-sm text-red-700 font-Jost">{error}</span>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm text-green-600 font-Jost">{success}</span>
          </div>
        )}
        
        {showBitcoinInstructions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-Primarycolor flex items-center font-Manrope">
                  <Bitcoin className="h-5 w-5 mr-2 text-orange-500" />
                  Bitcoin Payment Instructions
                </h3>
                <button 
                  onClick={() => setShowBitcoinInstructions(false)}
                  className="text-Accent hover:text-Primarycolor"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm text-orange-800 font-Jost">
                    To complete your purchase with Bitcoin, please follow these steps:
                  </p>
                </div>
                
                <ol className="list-decimal pl-5 space-y-2 text-sm text-Accent font-Jost">
                  <li>Take a screenshot of your checkout page showing the order total and items</li>
                  <li>Click the button below to open WhatsApp</li>
                  <li>Send the screenshot along with your order details</li>
                  <li>Our team will provide you with Bitcoin payment instructions</li>
                  <li>Once payment is confirmed, we'll process your order immediately</li>
                </ol>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-blue-800 font-Jost">
                    <strong>Note:</strong> Your order will be reserved for 2 hours to allow time for Bitcoin payment completion.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    onClick={handleWhatsAppPayment}
                    className="flex-1 flex items-center justify-center bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors font-Jost"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Open WhatsApp
                  </button>
                  <button
                    onClick={() => setShowBitcoinInstructions(false)}
                    className="flex-1 bg-gray-200 text-Primarycolor py-2 px-4 rounded-md hover:bg-gray-300 transition-colors font-Jost"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Updated to two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Forms */}
          <div className="lg:col-span-7 space-y-8">
            {/* Unified Guest Checkout Form */}
            {isGuest && (
              <UnifiedGuestCheckoutForm
                formData={unifiedGuestForm}
                formErrors={unifiedGuestFormErrors}
                existingUserType={existingUserType}
                onFormChange={handleUnifiedGuestFormChange}
                onLoginRedirect={handleLoginRedirect}
              />
            )}
            
            {/* Authenticated User Forms */}
            {!isGuest && (
              <>
                {/* Shipping Address Form */}
                <div className="p-5 md:p-6 bg-white rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold text-Primarycolor mb-4 font-Manrope">Shipping Address</h3>
                  
                  {requiredForm === 'shipping' && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-red-800 font-Jost">
                            Please add a shipping address
                          </p>
                          <p className="text-xs mt-1 text-red-700 font-Jost">
                            This information is required to deliver your order
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {shippingAddresses.length > 0 ? (
                    <div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-Accent mb-1 font-Jost">Select Shipping Address</label>
                        <select
                          value={shippingAddressId ?? ''}
                          onChange={(e) => {
                            setShippingAddressId(String(e.target.value));
                            const selectedAddress = shippingAddresses.find(addr => String(addr.id) === String(e.target.value));
                            if (selectedAddress) {
                              setShippingForm({
                                title: selectedAddress.title || '',
                                address_line_1: selectedAddress.address_line_1 || '',
                                address_line_2: selectedAddress.address_line_2 || '',
                                landmark: selectedAddress.landmark || '',
                                city: selectedAddress.city || '',
                                state: selectedAddress.state || '',
                                zip_code: selectedAddress.zip_code || '',
                                country: selectedAddress.country || 'Nigeria',
                                phone_number: selectedAddress.phone_number || '',
                              });
                            }
                          }}
                          className="w-full p-2 border border-gray-300 rounded-md font-Jost"
                        >
                          {shippingAddresses.map((address) => (
                            <option key={address.id} value={String(address.id)}>
                              {address.title}, {address.address_line_1}, {address.city}, {address.country}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => {
                            setShippingForm({
                              title: '',
                              address_line_1: '',
                              address_line_2: '',
                              landmark: '',
                              city: '',
                              state: '',
                              zip_code: '',
                              country: 'Nigeria',
                              phone_number: '',
                            });
                          }}
                          className="text-Primarycolor hover:text-gray-800 text-sm flex items-center font-Jost"
                          disabled={loading}
                        >
                          Add New Address
                        </button>
                        {shippingAddressId && (
                          <button
                            onClick={() => handleDeleteAddress('addresses', shippingAddressId)}
                            className="text-red-600 hover:text-red-800 text-sm flex items-center font-Jost"
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Delete Address
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
                          Address Title
                        </label>
                        <input
                          type="text"
                          value={shippingForm.title}
                          onChange={(e) => setShippingForm({...shippingForm, title: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md font-Jost"
                          placeholder="e.g., Home, Office"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
                          Address Line 1 *
                        </label>
                        <input
                          type="text"
                          value={shippingForm.address_line_1}
                          onChange={(e) => setShippingForm({...shippingForm, address_line_1: e.target.value})}
                          className={`w-full p-2 border rounded-md font-Jost ${
                            formErrors.address_line_1 ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Street address, P.O. box, company name"
                        />
                        {formErrors.address_line_1 && (
                          <p className="text-sm text-red-600 mt-1 font-Jost">{formErrors.address_line_1}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
                          Address Line 2
                        </label>
                        <input
                          type="text"
                          value={shippingForm.address_line_2}
                          onChange={(e) => setShippingForm({...shippingForm, address_line_2: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md font-Jost"
                          placeholder="Apartment, suite, unit, building, floor, etc."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
                          Landmark
                        </label>
                        <input
                          type="text"
                          value={shippingForm.landmark}
                          onChange={(e) => setShippingForm({...shippingForm, landmark: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md font-Jost"
                          placeholder="Nearby landmark (optional)"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
                            City *
                          </label>
                          <input
                            type="text"
                            value={shippingForm.city}
                            onChange={(e) => setShippingForm({...shippingForm, city: e.target.value})}
                            className={`w-full p-2 border rounded-md font-Jost ${
                              formErrors.city ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="City"
                          />
                          {formErrors.city && (
                            <p className="text-sm text-red-600 mt-1 font-Jost">{formErrors.city}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
                            State
                          </label>
                          <input
                            type="text"
                            value={shippingForm.state}
                            onChange={(e) => setShippingForm({...shippingForm, state: e.target.value})}
                            className="w-full p-2 border border-gray-300 rounded-md font-Jost"
                            placeholder="State"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
                            ZIP Code
                          </label>
                          <input
                            type="text"
                            value={shippingForm.zip_code}
                            onChange={(e) => setShippingForm({...shippingForm, zip_code: e.target.value})}
                            className="w-full p-2 border border-gray-300 rounded-md font-Jost"
                            placeholder="ZIP code"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
                            Country *
                          </label>
                          <select
                            value={shippingForm.country}
                            onChange={(e) => setShippingForm({...shippingForm, country: e.target.value})}
                            className={`w-full p-2 border rounded-md font-Jost ${
                              formErrors.country ? 'border-red-500' : 'border-gray-300'
                            }`}
                          >
                            <option value="">Select Country</option>
                            <option value="Nigeria">Nigeria</option>
                            <option value="United States">United States</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="Canada">Canada</option>
                          </select>
                          {formErrors.country && (
                            <p className="text-sm text-red-600 mt-1 font-Jost">{formErrors.country}</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={shippingForm.phone_number}
                          onChange={(e) => setShippingForm({...shippingForm, phone_number: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md font-Jost"
                          placeholder="Phone number"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Billing Address Form */}
                <div className="p-5 md:p-6 bg-white rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold text-Primarycolor mb-4 font-Manrope">Billing Address</h3>
                  
                  {/* Billing Address Option Selector */}
                  <div className="mb-6">
                    <div className="flex items-center space-x-6">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="billingAddressOption"
                          value="same"
                          checked={billingAddressOption === 'same'}
                          onChange={() => setBillingAddressOption('same')}
                          className="h-4 w-4 text-Primarycolor focus:ring-Primarycolor mr-2"
                        />
                        <span className="text-sm font-medium text-Accent font-Jost">Same as shipping address</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="billingAddressOption"
                          value="different"
                          checked={billingAddressOption === 'different'}
                          onChange={() => setBillingAddressOption('different')}
                          className="h-4 w-4 text-Primarycolor focus:ring-Primarycolor mr-2"
                        />
                        <span className="text-sm font-medium text-Accent font-Jost">Use a different billing address</span>
                      </label>
                    </div>
                  </div>
                  
                  {requiredForm === 'billing' && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-red-800 font-Jost">
                            Please add a billing address
                          </p>
                          <p className="text-xs mt-1 text-red-700 font-Jost">
                            This information is required to process your payment
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {billingAddressOption === 'same' ? (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-Primarycolor font-Manrope mb-2">Billing Address (Same as Shipping)</h4>
                          {shippingForm.address_line_1 ? (
                            <div className="text-sm text-Accent font-Jost">
                              <p>{shippingForm.address_line_1}</p>
                              {shippingForm.address_line_2 && <p>{shippingForm.address_line_2}</p>}
                              <p>{shippingForm.city}, {shippingForm.state} {shippingForm.zip_code}</p>
                              <p>{shippingForm.country}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 font-Jost">Please select a shipping address first</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {billingAddresses.length > 0 ? (
                        <div>
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-Accent mb-1 font-Jost">Select Billing Address</label>
                            <select
                              value={billingAddressId ?? ''}
                              onChange={(e) => {
                                setBillingAddressId(String(e.target.value));
                                const selectedAddress = billingAddresses.find(addr => String(addr.id) === String(e.target.value));
                                if (selectedAddress) {
                                  setBillingForm({
                                    full_name: selectedAddress.full_name || '',
                                    email: selectedAddress.email || '',
                                    phone_number: selectedAddress.phone_number || '',
                                    address_line_1: selectedAddress.address_line_1 || '',
                                    address_line_2: selectedAddress.address_line_2 || '',
                                    city: selectedAddress.city || '',
                                    state: selectedAddress.state || '',
                                    zip_code: selectedAddress.zip_code || '',
                                    country: selectedAddress.country || 'Nigeria',
                                  });
                                }
                              }}
                              className="w-full p-2 border border-gray-300 rounded-md font-Jost"
                            >
                              {billingAddresses.map((address) => (
                                <option key={address.id} value={String(address.id)}>
                                  {address.full_name}, {address.address_line_1}, {address.city}, {address.country}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() => {
                                setBillingForm({
                                  full_name: '',
                                  email: '',
                                  phone_number: '',
                                  address_line_1: '',
                                  address_line_2: '',
                                  city: '',
                                  state: '',
                                  zip_code: '',
                                  country: 'Nigeria',
                                });
                              }}
                              className="text-Primarycolor hover:text-gray-800 text-sm flex items-center font-Jost"
                              disabled={loading}
                            >
                              Add New Address
                            </button>
                            {billingAddressId && (
                              <button
                                onClick={() => handleDeleteAddress('billing-addresses', billingAddressId)}
                                className="text-red-600 hover:text-red-800 text-sm flex items-center font-Jost"
                                disabled={loading}
                              >
                                <Trash2 className="h-4 w-4 mr-1" /> Delete Address
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
                              Full Name *
                            </label>
                            <input
                              type="text"
                              value={billingForm.full_name}
                              onChange={(e) => setBillingForm({...billingForm, full_name: e.target.value})}
                              className={`w-full p-2 border rounded-md font-Jost ${
                                formErrors.full_name ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="Full name"
                            />
                            {formErrors.full_name && (
                              <p className="text-sm text-red-600 mt-1 font-Jost">{formErrors.full_name}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
                              Email *
                            </label>
                            <input
                              type="email"
                              value={billingForm.email}
                              onChange={(e) => setBillingForm({...billingForm, email: e.target.value})}
                              className={`w-full p-2 border rounded-md font-Jost ${
                                formErrors.email ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="Email address"
                            />
                            {formErrors.email && (
                              <p className="text-sm text-red-600 mt-1 font-Jost">{formErrors.email}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              value={billingForm.phone_number}
                              onChange={(e) => setBillingForm({...billingForm, phone_number: e.target.value})}
                              className="w-full p-2 border border-gray-300 rounded-md font-Jost"
                              placeholder="Phone number"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
                              Address Line 1 *
                            </label>
                            <input
                              type="text"
                              value={billingForm.address_line_1}
                              onChange={(e) => setBillingForm({...billingForm, address_line_1: e.target.value})}
                              className={`w-full p-2 border rounded-md font-Jost ${
                                formErrors.address_line_1 ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="Street address, P.O. box, company name"
                            />
                            {formErrors.address_line_1 && (
                              <p className="text-sm text-red-600 mt-1 font-Jost">{formErrors.address_line_1}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
                              Address Line 2
                            </label>
                            <input
                              type="text"
                              value={billingForm.address_line_2}
                              onChange={(e) => setBillingForm({...billingForm, address_line_2: e.target.value})}
                              className="w-full p-2 border border-gray-300 rounded-md font-Jost"
                              placeholder="Apartment, suite, unit, building, floor, etc."
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
                                City *
                              </label>
                              <input
                                type="text"
                                value={billingForm.city}
                                onChange={(e) => setBillingForm({...billingForm, city: e.target.value})}
                                className={`w-full p-2 border rounded-md font-Jost ${
                                  formErrors.city ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="City"
                              />
                              {formErrors.city && (
                                <p className="text-sm text-red-600 mt-1 font-Jost">{formErrors.city}</p>
                              )}
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
                                State
                              </label>
                              <input
                                type="text"
                                value={billingForm.state}
                                onChange={(e) => setBillingForm({...billingForm, state: e.target.value})}
                                className="w-full p-2 border border-gray-300 rounded-md font-Jost"
                                placeholder="State"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
                                ZIP Code
                              </label>
                              <input
                                type="text"
                                value={billingForm.zip_code}
                                onChange={(e) => setBillingForm({...billingForm, zip_code: e.target.value})}
                                className="w-full p-2 border border-gray-300 rounded-md font-Jost"
                                placeholder="ZIP code"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-Accent mb-1 font-Jost">
                                Country *
                              </label>
                              <select
                                value={billingForm.country}
                                onChange={(e) => setBillingForm({...billingForm, country: e.target.value})}
                                className={`w-full p-2 border rounded-md font-Jost ${
                                  formErrors.country ? 'border-red-500' : 'border-gray-300'
                                }`}
                              >
                                <option value="">Select Country</option>
                                <option value="Nigeria">Nigeria</option>
                                <option value="United States">United States</option>
                                <option value="United Kingdom">United Kingdom</option>
                                <option value="Canada">Canada</option>
                              </select>
                              {formErrors.country && (
                                <p className="text-sm text-red-600 mt-1 font-Jost">{formErrors.country}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
            
            {/* Order Note */}
            <div className="p-5 md:p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-Primarycolor mb-4 font-Manrope">Order Note (optional)</h3>
              <textarea
                value={orderNote}
                onChange={handleOrderNoteChange}
                maxLength={500}
                placeholder="Add a note to your order (e.g., special instructions)"
                className="w-full p-2 border border-gray-300 rounded-md font-Jost"
              />
              <p className="text-sm text-Accent font-Jost">Characters left: {500 - orderNote.length}/500</p>
            </div>
            
            {/* Shipping Method */}
            <div className="p-5 md:p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-Primarycolor mb-6 font-Manrope">
                <Truck className="h-5 w-5 inline mr-2" />
                Shipping Method
              </h3>
              {isNigeria ? (
                <div className="grid gap-4">
                  {shippingOptions.map((option) => (
                    <label
                      key={option.id}
                      className={`
                        relative cursor-pointer rounded-xl border-2 transition-all duration-200
                        ${shippingMethod?.id === option.id 
                          ? 'border-Primarycolor bg-gradient-to-r from-gray-50 to-blue-50 shadow-md' 
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                        }
                      `}
                    >
                      <div className="p-4 sm:p-5">
                        <div className="flex items-start gap-4">
                          <input
                            type="radio"
                            name="shippingMethod"
                            value={option.id}
                            checked={shippingMethod?.id === option.id}
                            onChange={() => setShippingMethod(option)}
                            className="mt-1 h-4 w-4 text-Primarycolor focus:ring-2 focus:ring-Primarycolor"
                          />
                          
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                              <div className="flex items-center gap-3">
                                <div className={`
                                  p-2 rounded-lg
                                  ${shippingMethod?.id === option.id 
                                    ? 'bg-Primarycolor text-white' 
                                    : 'bg-gray-100 text-Accent'
                                  }
                                `}>
                                  {getShippingIcon(option.icon)}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-Primarycolor text-sm sm:text-base font-Manrope">
                                    {option.method}
                                  </h4>
                                  <p className="text-xs sm:text-sm text-Accent font-Jost">
                                    {option.description}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-Primarycolor text-lg font-Manrope">
                                  {option.total_cost.toLocaleString('en-NG', {
                                    style: 'currency',
                                    currency: 'NGN',
                                    minimumFractionDigits: 2,
                                  })}
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 flex items-center gap-2 text-xs sm:text-sm text-Accent font-Jost">
                              <Clock className="h-4 w-4" />
                              <span>{option.estimated_delivery}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {shippingMethod?.id === option.id && (
                        <div className="absolute top-3 right-3">
                          <div className="bg-Primarycolor text-white rounded-full p-1">
                            <CheckCircle className="h-4 w-4" />
                          </div>
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-Primarycolor font-Manrope">
                        International Shipping to {addressCountry}
                      </h4>
                    </div>
                  </div>
                  <p className="text-sm text-Accent font-Jost mb-2">
                    You will receive a separate email with payment instructions for international shipping fees.
                    Note: Payments are processed in NGN due to current system limitations.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-blue-600 font-Jost">
                    <Clock className="h-3 w-3" />
                    <span>Estimated delivery: 10-21 business days</span>
                  </div>
                </div>
              )}
              {formErrors.shippingMethod && (
                <p className="text-sm text-red-600 mt-2 font-Jost">{formErrors.shippingMethod}</p>
              )}
            </div>
          </div>
          
          {/* Right Column - Order Summary */}
          <div className="lg:col-span-5 ">
            <div className="p-6 bg-white rounded-lg shadow-md sticky top-24">
              <h3 className="text-xl font-semibold text-Primarycolor mb-6 font-Manrope">Order Summary</h3>
              <div className="space-y-4 mb-6">
                {cart.items.map((cartItem, index) => {
                  const item = cartItem.item || {};
                  const price = Number(item.price || 0);
                  const itemTotal = Number((price * (cartItem.quantity || 1)).toFixed(2));
                  
                  return (
                    <div key={cartItem.id || index} className="group">
                      <div className="flex gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                        <div className="relative flex-shrink-0">
                          <img
                            src={item.image || item.image_url || 'https://via.placeholder.com/80x80?text=No+Image'}
                            alt={item.name || 'Product'}
                            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
                            onError={(e) => { 
                              e.target.src = 'https://via.placeholder.com/80x80?text=No+Image'; 
                            }}
                          />
                          <div className="absolute -top-2 -right-2 bg-Primarycolor text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                            {cartItem.quantity || 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-Primarycolor text-sm sm:text-base truncate font-Manrope">
                            {item.name || 'Unknown Item'}
                          </h4>
                          {item.is_product && (item.color || item.size) && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {item.color && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs text-Accent font-Jost">
                                  {item.color || item.color_name}
                                </span>
                              )}
                              {item.size && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs text-Accent font-Jost">
                                  {item.size || item.size_name}
                                </span>
                              )}
                            </div>
                          )}
                          {!item.is_product && Array.isArray(item.items) && item.items.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-Accent mb-1 font-Jost">Bundle includes:</p>
                              <div className="grid grid-cols-3 gap-1">
                                {item.items.map((bundleItem, idx) => (
                                  <div key={bundleItem.id || idx} className="flex flex-col items-center">
                                    <img
                                      src={bundleItem.image_url || 'https://via.placeholder.com/40x40'}
                                      alt={bundleItem.product_name}
                                      className="w-12 h-12 object-cover rounded-md mb-1"
                                      onError={(e) => { 
                                        e.target.src = 'https://via.placeholder.com/40x40'; 
                                      }}
                                    />
                                    <span className="text-xs text-Accent font-Jost truncate w-full text-center">
                                      {bundleItem.color_name}
                                    </span>
                                    <span className="text-xs text-Accent font-Jost truncate w-full text-center">
                                      {bundleItem.size_name}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-Accent font-Jost">
                              {price.toLocaleString('en-NG', {
                                style: 'currency',
                                currency: 'NGN',
                                minimumFractionDigits: 2,
                              })} each
                            </span>
                            <span className="font-semibold text-Primarycolor font-Manrope">
                              {itemTotal.toLocaleString('en-NG', {
                                style: 'currency',
                                currency: 'NGN',
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Coupon Code Section */}
              <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center mb-3">
                  <Gift className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="font-medium text-gray-900 font-Jost">Have a coupon code?</h3>
                </div>
                
                {appliedCoupon ? (
                  <div className="bg-green-50 rounded-lg p-3 mb-3 border border-green-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                          <span className="font-medium text-green-800 font-Jost">{appliedCoupon.code} applied</span>
                        </div>
                        <p className="text-sm text-green-700 font-Jost mt-1">
                          You saved {appliedCoupon.type === 'percentage' 
                            ? `${appliedCoupon.value}% (₦${appliedCoupon.amount.toFixed(2)})` 
                            : `₦${appliedCoupon.amount.toFixed(2)}`}
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
                      value={couponCode}
                      onChange={handleCouponCodeChange}
                      placeholder="Enter coupon code"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 font-Jost"
                      disabled={couponLoading}
                    />
                    <button
                      type="submit"
                      disabled={couponLoading || !couponCode.trim()}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-Jost"
                    >
                      {couponLoading ? 'Applying...' : 'Apply'}
                    </button>
                  </form>
                )}
                
                {couponError && (
                  <div className="mt-2 flex items-center text-sm text-red-600 font-Jost">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {couponError}
                  </div>
                )}
                
                {couponSuccess && !appliedCoupon && (
                  <div className="mt-2 flex items-center text-sm text-green-600 font-Jost">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {couponSuccess}
                  </div>
                )}
              </div>
              
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-Primarycolor mb-3 font-Manrope">Payment Method</h4>
                <div className="space-y-2">
                  <label
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                      paymentMethod === 'card' ? 'border-Primarycolor bg-gray-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      className="h-4 w-4 text-Primarycolor focus:ring-Primarycolor mr-3"
                    />
                    <span className="text-sm text-Accent font-Jost">Card Payment</span>
                  </label>
                  <label
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                      paymentMethod === 'bank' ? 'border-Primarycolor bg-gray-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank"
                      checked={paymentMethod === 'bank'}
                      onChange={() => setPaymentMethod('bank')}
                      className="h-4 w-4 text-Primarycolor focus:ring-Primarycolor mr-3"
                    />
                    <span className="text-sm text-Accent font-Jost">Bank Transfer</span>
                  </label>
                  <label
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                      paymentMethod === 'bitcoin' ? 'border-Primarycolor bg-gray-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bitcoin"
                      checked={paymentMethod === 'bitcoin'}
                      onChange={() => setPaymentMethod('bitcoin')}
                      className="h-4 w-4 text-Primarycolor focus:ring-Primarycolor mr-3"
                    />
                    <div className="flex items-center">
                      <Bitcoin className="h-4 w-4 text-orange-500 mr-2" />
                      <span className="text-sm text-Accent font-Jost">Bitcoin/Crypto</span>
                    </div>
                  </label>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-Accent font-Jost">
                    <span>Subtotal</span>
                    <span>
                      {displaySubtotal.toLocaleString('en-NG', {
                        style: 'currency',
                        currency: 'NGN',
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  
                  {displayFirstOrderDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 font-Jost">
                      <span>First Order Discount (5%)</span>
                      <span>
                        -{displayFirstOrderDiscount.toLocaleString('en-NG', {
                          style: 'currency',
                          currency: 'NGN',
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}
                  
                  {displayCouponDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 font-Jost">
                      <span>Coupon Discount</span>
                      <span>
                        -{displayCouponDiscount.toLocaleString('en-NG', {
                          style: 'currency',
                          currency: 'NGN',
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm text-Accent font-Jost">
                    <span>Shipping</span>
                    <span>
                      {isNigeria ? (
                        (shippingMethod?.total_cost || 0).toLocaleString('en-NG', {
                          style: 'currency',
                          currency: 'NGN',
                          minimumFractionDigits: 2,
                        })
                      ) : (
                        'TBD'
                      )}
                    </span>
                  </div>
                  
                  {!isNigeria && (
                    <div className="flex justify-between text-sm text-Accent font-Jost">
                      <span>Tax (5%)</span>
                      <span>
                        {displayTax.toLocaleString('en-NG', {
                          style: 'currency',
                          currency: 'NGN',
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-gray-200 mt-3 pt-3">
                  <div className="flex justify-between text-lg font-bold text-Primarycolor font-Manrope">
                    <span>Total</span>
                    <span>
                      {displayTotal.toLocaleString('en-NG', {
                        style: 'currency',
                        currency: 'NGN',
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
                
                {!isNigeria && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700 font-Jost">
                      <strong>Note:</strong> International shipping fees will be calculated and invoiced separately. All payments are processed in NGN.
                    </p>
                  </div>
                )}
                
                {displayFirstOrderDiscount > 0 && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-700 font-Jost">
                      🎉 <strong>Congratulations!</strong> You've received a 5% discount on your first order.
                    </p>
                  </div>
                )}
                
                {appliedCoupon && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-700 font-Jost">
                      🎁 <strong>Coupon Applied!</strong> You saved {appliedCoupon.type === 'percentage' 
                        ? `${appliedCoupon.value}%` 
                        : `₦${appliedCoupon.amount.toFixed(2)}`} with coupon code {appliedCoupon.code}.
                    </p>
                  </div>
                )}
                
                {requiredForm && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800 font-Jost">
                          Please complete the required information
                        </p>
                        <p className="text-xs mt-1 text-yellow-700 font-Jost">
                          {requiredForm === 'guest' && 'Please fill in your personal details'}
                          {requiredForm === 'shipping' && 'Please add a shipping address'}
                          {requiredForm === 'billing' && 'Please add a billing address'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={handlePlaceOrder}
                  className="mt-6 w-full bg-Primarycolor text-Secondarycolor text-sm py-4 px-4 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-Manrope font-semibold"
                  disabled={isPlaceOrderDisabled}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                      Processing...
                    </div>
                  ) : (
                    'Place Order'
                  )}
                </button>
                
                {paymentMethod === 'bitcoin' && (
                  <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Bitcoin className="h-4 w-4 text-orange-600" />
                      <p className="text-xs text-orange-800 font-Jost">
                        Bitcoin payments require manual verification. Click "Place Order" to receive instructions.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <WhatsAppChatWidget />
      <Footer />
    </div>
  );
};

export default CheckoutPage;