import React, { useState, useEffect, useRef, useContext, useMemo, useCallback } from "react";
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, AlertCircle, CheckCircle, Trash2, Bitcoin, MessageCircle, Smartphone, Truck, Clock, MapPin, Gift, X, Copy, User, RefreshCw, Edit, Plus, CreditCard } from 'lucide-react';
import Navbar2 from '../components/Navbar2';
import Footer from '../components/Footer';
const BillingAddressForm = React.lazy(() => import('../components/BillingAddressForm'));
const ShippingAddressForm = React.lazy(() => import('../components/ShippingAddressForm'));
const WhatsAppChatWidget = React.lazy(() => import('../components/WhatsAppChatWidget'));
import { useAuth } from '../context/AuthContext';
import { useUserManager } from '../hooks/useUserManager';
import { CurrencyContext } from './CurrencyContext';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import PaystackPop from '@paystack/inline-js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com';
const WHATSAPP_NUMBER = '2348104117122';

// Memoized GuestCheckoutModal component to prevent unnecessary re-renders
const GuestCheckoutModal = React.memo(({ 
  guestForm, 
  guestFormErrors, 
  existingUserType, 
  requiredForm,
  onGuestFormChange,
  onLoginRedirect,
  onSubmitGuestForm,
  loading,
  navigate
}) => (
  // Backdrop with blur effects
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200">
      {/* Simplified header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <div className="p-2 bg-Primarycolor rounded-lg mr-3">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-Primarycolor font-Inter">
              Complete Your Order
            </h3>
            <p className="text-sm text-Accent font-Jost">
              Enter your details to proceed
            </p>
          </div>
        </div>
        <button 
          onClick={() => {}} // Prevent closing the modal
          className="p-2 text-gray-400 hover:text-Accent hover:bg-gray-100 rounded-lg transition-colors cursor-not-allowed"
          title="Please complete the form to continue"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      

      
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
      
      {requiredForm === 'guest' && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800 font-Jost">
                Please fill in your details to continue
              </p>
              <p className="text-xs mt-1 text-red-700 font-Jost">
                All fields marked with * are required
              </p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={onSubmitGuestForm} className="space-y-4">
        {/* Enhanced form fields with better styling */}
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-Primarycolor mb-1 font-Jost flex items-center">
            <User className="h-4 w-4 mr-2 text-Accent" />
            Full Name *
          </label>
          <div className="relative">
            <input
              type="text"
              name="name"
              value={guestForm.name}
              onChange={(e) => onGuestFormChange('name', e.target.value)}
              className={`w-full px-3 py-2 border-2 rounded-xl font-Jost transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-Primarycolor/20 ${
                guestFormErrors.name 
                  ? 'border-red-400 bg-red-50 focus:border-red-500' 
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 focus:border-Primarycolor focus:bg-white'
              }`}
              placeholder="Enter your full name"
            />
            {guestFormErrors.name && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <AlertCircle className="h-4 w-4 text-red-500" />
              </div>
            )}
          </div>
          {guestFormErrors.name && (
            <p className="text-xs text-red-600 mt-1 font-Jost flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {guestFormErrors.name}
            </p>
          )}
        </div>
        
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-Primarycolor mb-1 font-Jost flex items-center">
            <svg className="h-4 w-4 mr-2 text-Accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
            Email Address *
          </label>
          <div className="relative">
            <input
              type="email"
              name="email"
              value={guestForm.email}
              onChange={(e) => onGuestFormChange('email', e.target.value)}
              className={`w-full px-3 py-2 border-2 rounded-xl font-Jost transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-Primarycolor/20 ${
                guestFormErrors.email 
                  ? 'border-red-400 bg-red-50 focus:border-red-500' 
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 focus:border-Primarycolor focus:bg-white'
              }`}
              placeholder="Enter your email address"
            />
            {guestFormErrors.email && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <AlertCircle className="h-4 w-4 text-red-500" />
              </div>
            )}
          </div>
          {guestFormErrors.email && (
            <p className="text-xs text-red-600 mt-1 font-Jost flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {guestFormErrors.email}
            </p>
          )}
        </div>
        
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-Primarycolor mb-1 font-Jost flex items-center">
            <Smartphone className="h-4 w-4 mr-2 text-Accent" />
            Phone Number *
          </label>
          <div className="relative">
            <input
              type="tel"
              name="phone_number"
              value={guestForm.phone_number}
              onChange={(e) => onGuestFormChange('phone_number', e.target.value)}
              className={`w-full px-3 py-2 border-2 rounded-xl font-Jost transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-Primarycolor/20 ${
                guestFormErrors.phone_number 
                  ? 'border-red-400 bg-red-50 focus:border-red-500' 
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 focus:border-Primarycolor focus:bg-white'
              }`}
              placeholder="Enter your phone number"
            />
            {guestFormErrors.phone_number && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <AlertCircle className="h-4 w-4 text-red-500" />
              </div>
            )}
          </div>
          {guestFormErrors.phone_number && (
            <p className="text-xs text-red-600 mt-1 font-Jost flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {guestFormErrors.phone_number}
            </p>
          )}
        </div>
        
        {/* Order details info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-sm text-blue-800 font-Jost leading-relaxed">
            Your order details will be saved automatically. We'll send you order updates via email.
          </p>
        </div>
        
        {existingUserType === 'permanent' && (
          <div className="bg-Secondarycolor/10 border border-Secondarycolor/20 rounded-xl p-3 text-center">
            <p className="text-sm text-Secondarycolor font-Jost mb-2">
              Account already exists with this email
            </p>
            <button
              type="button"
              onClick={onLoginRedirect}
              className="inline-flex items-center px-3 py-2 bg-Secondarycolor text-white rounded-lg hover:bg-Secondarycolor/90 font-Jost font-medium transition-colors"
            >
              <User className="h-4 w-4 mr-2" />
              Log in to your existing account
            </button>
          </div>
        )}
        
        {/* Enhanced button section with compact spacing */}
        <div className="pt-3 space-y-2">
          {/* Primary action button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2.5 bg-Primarycolor text-white rounded-xl hover:bg-Primarycolor/90 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed font-Jost font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                Continue to Checkout
                <svg className="h-4 w-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
          
          {/* Secondary action */}
          <button
            type="button"
            onClick={() => navigate('/cart')}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-Accent hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center font-Jost font-medium transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Cart
          </button>
          

        </div>
      </form>
    </div>
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
    currency = 'NGN', 
    exchangeRate = 1, 
    country = 'Nigeria', 
    contextLoading = false 
  } = currencyContext || {};
  
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
  const [shippingAddressLoading, setShippingAddressLoading] = useState(false);
  const [billingAddressLoading, setBillingAddressLoading] = useState(false);
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [editingShippingAddress, setEditingShippingAddress] = useState(null);
  const [editingBillingAddress, setEditingBillingAddress] = useState(null);
  const [showBitcoinInstructions, setShowBitcoinInstructions] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    title: '',
    address_line_1: '',
    // address_line_2 removed - using landmark instead
    landmark: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'Nigeria',
    phone_number: '', // Will be removed for guest users
  });
  const [billingForm, setBillingForm] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    address_line_1: '',
    // address_line_2 removed
    city: '',
    state: '',
    zip_code: '',
    country: 'Nigeria',
  });
  
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
  const [guestForm, setGuestForm] = useState({
    name: '',
    email: '',
    phone_number: ''
  });
  const [showGuestModal, setShowGuestModal] = useState(true); // Changed to showGuestModal
  const [guestFormErrors, setGuestFormErrors] = useState({});
  const [createdUserId, setCreatedUserId] = useState(null);
  const [existingUserType, setExistingUserType] = useState(null); // 'temporary', 'permanent', or null
  
  // State to track which form needs to be filled
  const [requiredForm, setRequiredForm] = useState(null); // 'guest', 'shipping', 'billing'
  
  // State to track if guest form has been submitted
  const [guestFormSubmitted, setGuestFormSubmitted] = useState(false);
  
  // NEW: State to prevent duplicate submissions
  const [isProcessing, setIsProcessing] = useState(false);
  
  // NEW: Generate idempotency key once per session
  const [idempotencyKey] = useState(() => uuidv4());
  
  // Memoize functions to prevent unnecessary re-renders
  const handleGuestFormChange = useCallback((field, value) => {
    setGuestForm(prev => ({...prev, [field]: value}));
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
  
  // Update the useEffect that calculates the first order discount
  useEffect(() => {
    const currentSubtotal = cart.subtotal; // Always in NGN
    
    // Guest users (temporary) don't get first order discount
    if (isGuest) {
      setFirstOrderDiscount(0);
    } 
    // For authenticated users, check if it's their first order
    else if (user && (user.first_order === true || user.first_order === 1) && currentSubtotal > 0) {
      const discountAmount = Number((currentSubtotal * 0.05).toFixed(2));
      setFirstOrderDiscount(discountAmount);
    } else {
      setFirstOrderDiscount(0);
    }
  }, [user?.first_order, cart.subtotal, userDataRefreshed, refreshCount, isGuest]); // Added isGuest to dependencies
  
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
      method: 'Delivery within Lagos Island', 
      total_cost: 4000, 
      estimated_delivery: '3–5 business days',
      icon: 'truck',
      description: 'Fast delivery within Lagos Island'
    },
    { 
      id: 2, 
      method: 'Delivery within Lagos Mainland', 
      total_cost: 6000, 
      estimated_delivery: '5–7 business days',
      icon: 'package',
      description: 'Reliable delivery within Lagos Mainland'
    },
    { 
      id: 3, 
      method: 'Outside Lagos', 
      total_cost: 7000, 
      estimated_delivery: '7–10 business days',
      icon: 'home',
      description: 'Delivery outside Lagos state'
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
  
  // Memoized guest form validation to prevent unnecessary recalculations
  const validateGuestForm = useCallback(() => {
    const errors = {};
    if (!guestForm.name.trim()) {
      errors.name = 'Please enter your full name';
    } else if (guestForm.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    if (!guestForm.email.trim()) {
      errors.email = 'Please enter your email address';
    } else if (!/\S+@\S+\.\S+/.test(guestForm.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!guestForm.phone_number.trim()) {
      errors.phone_number = 'Please enter your phone number';
    } else if (guestForm.phone_number.trim().length < 10) {
      errors.phone_number = 'Phone number must be at least 10 digits';
    }
    
    if (Object.keys(errors).length > 0) {
      setGuestFormErrors(errors);
      return false;
    }
    
    setGuestFormErrors({});
    return true;
  }, [guestForm.name, guestForm.email, guestForm.phone_number]);
  
  // Handle guest form submission
  const handleGuestFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateGuestForm()) {
      setRequiredForm('guest');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Call the createTemporaryUser API endpoint
      const response = await axios.post(`${API_BASE_URL}/api/auth/create-temp-user`, {
        name: guestForm.name,
        email: guestForm.email,
        phone_number: guestForm.phone_number
      });
      
      const { user, isExisting } = response.data;
      const userId = user.id;
      
      // Update all state at once
      setCreatedUserId(userId);
      // Keep isGuest as true for both new and existing temporary users
      setShowGuestModal(false); // Close the modal instead of setting showGuestForm
      setGuestFormSubmitted(true);
      
      if (isExisting) {
        setExistingUserType('temporary');
        toast.success('Welcome back! We found your temporary account.');
      } else {
        setExistingUserType(null);
        toast.success('Account created successfully!');
      }
      
      // Update shipping and billing forms with guest information
      setShippingForm(prev => ({
        ...prev,
        title: 'Home', // Add default title
        address_line_1: '',
        // address_line_2 removed
        landmark: '',
        city: '',
        state: '',
        zip_code: '',
        country: 'Nigeria',
        phone_number: guestForm.phone_number
      }));
      
      setBillingForm(prev => ({
        ...prev,
        full_name: guestForm.name,
        email: guestForm.email,
        phone_number: guestForm.phone_number,
        address_line_1: '',
        // address_line_2 removed
        city: '',
        state: '',
        zip_code: '',
        country: 'Nigeria',
      }));
      
      // Set the billing address option to 'same' by default
      setBillingAddressOption('same');
      
      // Return the user ID to use in processOrder
      return userId;
    } catch (err) {
      console.error('Error in guest submission:', err);
      
      // Check if the error is because the user already exists
      if (err.response?.status === 400 && 
          (err.response?.data?.error?.includes('already exists') || 
           err.response?.data?.message?.includes('already registered'))) {
        
        // Check if the error response includes existingUser data
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
          // Fallback if existingUser is not included in the response
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
      
      return false;
    } finally {
      setShippingAddressLoading(false);
    }
  };
  
  // Validate shipping address
  const validateShippingAddress = () => {
    if (!shippingForm.address_line_1) {
      setError('Please add a shipping address');
      setRequiredForm('shipping');
      return false;
    }
    return true;
  };
  
  // Validate billing address
  const validateBillingAddress = () => {
    if (!billingForm.address_line_1) {
      setError('Please add a billing address');
      setRequiredForm('billing');
      return false;
    }
    return true;
  };
  
  // NEW: Generate a unique order reference
  const generateOrderReference = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `ORD-${timestamp}-${random}`;
  };
  
  // Modified processOrder function with better error handling and loading state management
  const processOrder = async (guestUserId = null) => {
    // Use the provided guestUserId if available, otherwise fall back to state
    const userId = guestUserId || createdUserId || getUserId();
    
    // Skip guest form check if we have a guestUserId
    if (!guestUserId && isGuest && !guestFormSubmitted) {
      setError('Please complete the guest form to continue');
      setRequiredForm('guest');
      setLoading(false); // Reset loading state
      return;
    }
    
    // Check if user has provided shipping address (either form data or selected address ID)
    const hasShippingAddress = isAuthenticated() 
      ? (shippingAddressId && shippingAddresses.length > 0) || shippingForm.address_line_1
      : shippingForm.address_line_1;
    
    if (!hasShippingAddress) {
      setError('Please add a shipping address');
      setRequiredForm('shipping');
      setLoading(false); // Reset loading state
      return;
    }
    
    // Check if user has provided billing address (either form data, selected address ID, or same as shipping)
    const hasBillingAddress = isAuthenticated() 
      ? (billingAddressOption === 'same' && hasShippingAddress) || (billingAddressId && billingAddresses.length > 0)
      : billingForm.address_line_1;
    
    if (!hasBillingAddress) {
      setError('Please add a billing address');
      setRequiredForm('billing');
      setLoading(false); // Reset loading state
      return;
    }
    
    const addressCountry = shippingForm.country;
    const isNigeria = addressCountry.toLowerCase() === 'nigeria';
    
    if (isNigeria && !shippingMethod) {
      setError('Please select a shipping method');
      setLoading(false); // Reset loading state
      return;
    }
    
    if (!cart?.items?.length) {
      setError('Cart is empty');
      toast.error('Cart is empty');
      setLoading(false); // Reset loading state
      return;
    }
    
    try {
      const orderCurrency = 'NGN'; // Force NGN due to Paystack limitation
      
      // Calculate amounts in NGN
      const baseSubtotal = Number(cart?.subtotal) || 0;
      const baseFirstOrderDiscount = firstOrderDiscount; // Use the calculated discount
      const baseCouponDiscount = couponDiscount;
      const baseTotalDiscount = Number((baseFirstOrderDiscount + baseCouponDiscount).toFixed(2));
      const baseFinalDiscount = Math.min(baseTotalDiscount, baseSubtotal);
      const baseTax = isNigeria ? 0 : Number((baseSubtotal * 0.05).toFixed(2));
      const baseShippingCost = isNigeria ? shippingMethod?.total_cost || 0 : 0;
      const baseDiscountedSubtotal = Number((baseSubtotal - baseFinalDiscount).toFixed(2));
      const baseTotal = Number((baseDiscountedSubtotal + baseTax + baseShippingCost).toFixed(2));
      
      // Format payment method as a string to match backend expectations
      const formattedPaymentMethod = paymentMethod;
      
      const orderData = {
        user_id: userId,
        // For guests, we send shipping_data and billing_data
        // For authenticated users, we send address_id and billing_address_id
        shipping_data: !isAuthenticated() ? shippingForm : null,
        billing_data: !isAuthenticated() ? billingForm : null,
        address_id: isAuthenticated() ? parseInt(shippingAddressId) : null,
        billing_address_id: isAuthenticated() ? 
          (billingAddressOption === 'same' ? parseInt(shippingAddressId) : parseInt(billingAddressId)) : null,
        cart_id: isAuthenticated() ? cart.cartId : null,
        total: baseTotal,
        discount: baseFinalDiscount,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        delivery_option: isNigeria ? 'standard' : 'international',
        shipping_method_id: isNigeria ? shippingMethod?.id : null,
        shipping_cost: baseShippingCost,
        shipping_country: addressCountry,
        payment_method: formattedPaymentMethod, // Use formatted payment method as string
        currency: orderCurrency,
        // NEW: Use the new reference generator
        reference: generateOrderReference(),
        items: cart.items.map(item => {
          const basePrice = Number(item.item?.price || 0);
          const orderItem = {
            variant_id: item.item?.is_product ? item.item.id : null,
            bundle_id: item.item?.is_product ? null : item.item.id,
            quantity: item.quantity || 1,
            price: basePrice,
            size_id: item.size_id || null,
            image_url: item.item?.image_url || item.item?.image || (item.item?.is_product ? 
              (item.item?.product_images?.find(img => img.is_primary)?.image_url || null) : 
              (item.item?.bundle_images?.find(img => img.is_primary)?.image_url || null)),
            product_name: item.item?.name || 'Unknown Item',
            color_name: item.item?.color || null,
            size_name: item.size_name || null,
          };
          
          // Add bundle_items array for bundle orders
          if (!item.item?.is_product && item.item?.items) {
            orderItem.bundle_items = item.item.items.map(bundleItem => ({
              variant_id: bundleItem.variant_id,
              size_id: bundleItem.size_id
            }));
          }
          
          return orderItem;
        }),
        note: orderNote,
        exchange_rate: 1, // No conversion needed
        base_currency_total: baseTotal,
        converted_total: baseTotal,
        tax: baseTax,
      };
      

      
      let orderResponse;
      try {
        // NEW: Include idempotency key in headers
        orderResponse = await axios.post(`${API_BASE_URL}/api/orders`, orderData, {
          headers: {
            'X-Idempotency-Key': idempotencyKey
          }
        });
        
        // Handle case where backend returns 200 with 'Order already exists with pending payment'
        if (orderResponse.data.message === 'Order already exists with pending payment') {
          const existingOrderId = orderResponse.data.order.id;
          
          // Continue with payment initialization using existing order
          orderResponse = { data: { order: { id: existingOrderId, reference: orderResponse.data.order.reference } } };
        }
      } catch (err) {
        // Handle case where order with same reference already exists
        if (err.response?.status === 409 && err.response?.data?.order_id) {
          const existingOrderId = err.response.data.order_id;
          
          // If payment is already completed, redirect to thank you page
          if (err.response.data.payment_status === 'completed') {
            toast.success('Order already exists with completed payment');
            navigate(`/thank-you?reference=${err.response.data.reference || orderData.reference}&orderId=${existingOrderId}`);
            return;
          }
          
          // If payment is pending, continue with payment initialization
          orderResponse = { 
            data: { 
              order: { 
                id: existingOrderId, 
                reference: err.response.data.reference || orderData.reference 
              } 
            } 
          };
        } else {
          throw err;
        }
      }
      

      
      const orderId = orderResponse.data.order?.id || orderResponse.data.id || orderResponse.data.data?.id;
      if (!orderId) {
        console.error('Order ID not found in response:', orderResponse.data);
        throw new Error('Order ID not found in response');
      }
      
      const paymentCurrency = 'NGN';
      const paymentAmount = baseTotal;
      
      const callbackUrl = `${window.location.origin}/thank-you?reference=${orderResponse.data.order?.reference || orderData.reference}&orderId=${orderId}`;
      
      const paymentData = {
        order_id: orderId,
        reference: orderResponse.data.order?.reference || orderData.reference,
        email: billingForm.email || guestForm.email || user.email,
        amount: Math.round(paymentAmount * 100), // Convert to kobo
        currency: paymentCurrency,
        callback_url: callbackUrl,
      };
      

      
      // Try to initialize payment with multiple retries
      let paymentResponse;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          // Increase timeout for each retry
          const timeout = 15000 * (retryCount + 1); // 15s, 30s, 45s
          
          paymentResponse = await Promise.race([
            axios.post(`${API_BASE_URL}/api/paystack/initialize`, paymentData),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Payment initialization timeout')), timeout)
            )
          ]);
          
          // If we get here, the request was successful
          break;
        } catch (err) {
          retryCount++;
          
          if (retryCount >= maxRetries) {
            throw new Error('Payment initialization failed after multiple attempts');
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      let paymentInfo = paymentResponse.data;
      if (paymentResponse.data.data) {
        paymentInfo = paymentResponse.data.data;
      }
      
      const accessCode = paymentInfo.access_code;
      const authorizationUrl = paymentInfo.authorization_url;
      
      // Clear guest cart from localStorage
      if (isGuest) {
        localStorage.removeItem('guestCart');
      }
      
      toast.success('Order placed successfully!');
      localStorage.setItem('lastOrderReference', orderResponse.data.order?.reference || orderData.reference);
      localStorage.setItem('pendingOrderId', orderId); // Store the order ID
      
      if (accessCode) {
        const paystack = new PaystackPop();
        paystack.newTransaction({
          key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
          email: paymentData.email,
          amount: paymentData.amount,
          currency: paymentData.currency,
          reference: paymentData.reference,
          callback: (response) => {
            toast.success('Payment successful!');
            navigate(`/thank-you?reference=${paymentData.reference}&orderId=${orderId}`);
          },
          onClose: () => {
            toast.info('Payment window closed. You can complete payment later from your orders page.');
            // For guest users, go to thank you page with reference instead of orders page
            if (isGuest) {
              navigate(`/thank-you?reference=${paymentData.reference}&orderId=${orderId}`);
            } else {
              navigate(`/orders/${orderId}`);
            }
          }
        });
      } else if (authorizationUrl) {
        window.location.href = authorizationUrl;
      } else {
        throw new Error('Failed to get payment information');
      }
    } catch (err) {
      // Handle specific error cases
      let errorMessage = 'Failed to process order';
      
      if (err.message === 'Payment initialization timeout' || 
          err.message === 'Payment initialization failed after multiple attempts') {
        errorMessage = 'Payment service is currently experiencing high traffic. Please try again later.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(`Failed to process order: ${errorMessage}`);
      toast.error(`Failed to process order: ${errorMessage}`);
      setLoading(false); // Reset loading state
      
      // If order was created but payment failed, redirect to order page
      if (err.orderId) {
        navigate(`/orders/${err.orderId}`);
      }
    }
  };
  
  // Updated handlePlaceOrder to ensure loading state is reset and prevent duplicate submissions
  const handlePlaceOrder = async () => {
    // Prevent multiple submissions
    if (isProcessing) return;
    
    setIsProcessing(true);
    setLoading(true);
    setError('');
    setRequiredForm(null);
    
    try {
      // For guest users, first process the guest form to get the user ID
      if (isGuest && !guestFormSubmitted) {
        const guestUserId = await handleGuestFormSubmit();
        if (!guestUserId) {
          setLoading(false);
          setIsProcessing(false);
          return;
        }
        
        // Now process the order with the returned user ID
        await processOrder(guestUserId);
      } else {
        // For logged-in users or already submitted guest forms, process directly
        await processOrder();
      }
    } catch (err) {
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };
  
  // Fixed handleShippingSubmit to close the form after saving
  const handleShippingSubmit = async (data) => {
    try {
      setShippingAddressLoading(true);
      
      // For authenticated users, save address to backend
      if (isAuthenticated()) {
        const token = localStorage.getItem('token');
        const userId = getUserId();
        
        const addressData = {
          user_id: userId,
          title: data.title || 'Home',
          address_line_1: data.address_line_1,
          address_line_2: data.address_line_2,
          city: data.city,
          state: data.state,
          zip_code: data.zip_code,
          country: data.country
        };
        
        let response;
        if (editingShippingAddress) {
          // Update existing address
          response = await axios.put(`${API_BASE_URL}/api/addresses/${editingShippingAddress.id}`, addressData, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // Update the address in the list
          const updatedAddress = response.data;
          setShippingAddresses(prev => 
            prev.map(addr => addr.id === editingShippingAddress.id ? updatedAddress : addr)
          );
          setShippingAddressId(String(updatedAddress.id));
        } else {
          // Create new address
          response = await axios.post(`${API_BASE_URL}/api/addresses/`, addressData, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // Add the new address to the list and set it as selected
          const newAddress = response.data;
          setShippingAddresses(prev => [newAddress, ...prev]);
          setShippingAddressId(String(newAddress.id));
        }
      }
      
      // Update shipping form state
      setShippingForm(data);
      setShowShippingForm(false); // This ensures the form closes after saving
      setEditingShippingAddress(null); // Clear editing state
      
      // If billing address option is 'same', update billing address to match
      if (billingAddressOption === 'same') {
        // Create a billing address object from the shipping address
        const billingAddress = {
          full_name: guestForm.name || billingForm.full_name,
          email: guestForm.email || billingForm.email,
          // For guest users, use the phone number from guest form instead of shipping form
          phone_number: isGuest ? guestForm.phone_number : data.phone_number,
          address_line_1: data.address_line_1,
          // address_line_2 removed
          city: data.city,
          state: data.state,
          zip_code: data.zip_code,
          country: data.country,
        };
        
        // Update billing form state
        setBillingForm(billingAddress);
      }
      
      const successMessage = editingShippingAddress ? 'Shipping address updated successfully.' : 'Shipping address added successfully.';
      setSuccess(successMessage);
      toast.success(editingShippingAddress ? 'Shipping address updated' : 'Shipping address added');
    } catch (err) {
      const errorMessage = err.response?.data?.details || err.response?.data?.error || err.message;
      const action = editingShippingAddress ? 'update' : 'add';
      setError(`Failed to ${action} shipping address: ${errorMessage}`);
      toast.error(`Failed to ${action} shipping address: ${errorMessage}`);
      // Ensure form closes even if there's an error
      setShowShippingForm(false);
      setEditingShippingAddress(null);
    } finally {
      setShippingAddressLoading(false);
    }
  };
  
  const handleBillingSubmit = async (data) => {
    try {
      setBillingAddressLoading(true);
      
      // For authenticated users, save billing address to backend
      if (isAuthenticated()) {
        const token = localStorage.getItem('token');
        const userId = getUserId();
        
        const billingData = {
          user_id: userId,
          full_name: data.full_name,
          email: data.email,
          phone_number: data.phone_number,
          address_line_1: data.address_line_1,
          city: data.city,
          state: data.state,
          zip_code: data.zip_code,
          country: data.country
        };
        
        let response;
        if (editingBillingAddress) {
          // Update existing billing address
          response = await axios.put(`${API_BASE_URL}/api/billing-addresses/${editingBillingAddress.id}`, billingData, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // Update the billing address in the list
          const updatedBillingAddress = response.data;
          setBillingAddresses(prev => 
            prev.map(addr => addr.id === editingBillingAddress.id ? updatedBillingAddress : addr)
          );
          setBillingAddressId(String(updatedBillingAddress.id));
        } else {
          // Create new billing address
          response = await axios.post(`${API_BASE_URL}/api/billing-addresses/`, billingData, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // Add the new billing address to the list and set it as selected
          const newBillingAddress = response.data;
          setBillingAddresses(prev => [newBillingAddress, ...prev]);
          setBillingAddressId(String(newBillingAddress.id));
        }
      }
      
      // Update billing form state
      setBillingForm(data);
      setShowBillingForm(false);
      setEditingBillingAddress(null); // Clear editing state
      
      const successMessage = editingBillingAddress ? 'Billing address updated successfully.' : 'Billing address added successfully.';
      setSuccess(successMessage);
      toast.success(editingBillingAddress ? 'Billing address updated' : 'Billing address added');
    } catch (err) {
      const errorMessage = err.response?.data?.details || err.response?.data?.error || err.message;
      const action = editingBillingAddress ? 'update' : 'add';
      setError(`Failed to ${action} billing address: ${errorMessage}`);
      toast.error(`Failed to ${action} billing address: ${errorMessage}`);
      // Ensure form closes even if there's an error
      setShowBillingForm(false);
      setEditingBillingAddress(null);
    } finally {
      setBillingAddressLoading(false);
    }
  };
  
  const handleEditAddress = (type, address) => {
    if (type === 'addresses') {
      setShippingForm(address);
      setEditingShippingAddress(address);
      setShowShippingForm(true);
    } else {
      setBillingForm(address);
      setEditingBillingAddress(address);
      setShowBillingForm(true);
    }
  };

  const handleAddNewShippingAddress = () => {
    setEditingShippingAddress(null);
    setShippingForm({
      title: '',
      address_line_1: '',
      address_line_2: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'Nigeria',
      phone_number: ''
    });
    setShowShippingForm(true);
  };

  const handleAddNewBillingAddress = () => {
    setEditingBillingAddress(null);
    setBillingForm({
      full_name: user?.name || '',
      email: user?.email || '',
      phone_number: '',
      address_line_1: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'Nigeria'
    });
    setShowBillingForm(true);
  };

  const handleDeleteAddress = async (type, addressId) => {
    if (!isAuthenticated() && !createdUserId) {
      console.error('CheckoutPage: No user ID available');
      toast.error('Please create an account to delete address');
      return;
    }

    // Show confirmation dialog
    const addressType = type === 'addresses' ? 'shipping' : 'billing';
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this ${addressType} address?\n\nThis action cannot be undone.`
    );
    
    if (!confirmDelete) {
      return;
    }
  
    try {
      setLoading(true);
      
      // 1. Delete address from backend
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/${type}/${addressId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      if (type === 'addresses') {
        // Remove from local state
        const remaining = shippingAddresses.filter(addr => String(addr.id) !== String(addressId));
        setShippingAddresses(remaining);

        // If deleted address was selected, pick first remaining or null
        if (String(shippingAddressId) === String(addressId)) {
          const newShippingId = remaining.length ? String(remaining[0].id) : null;
          setShippingAddressId(newShippingId);
          
          // If no addresses remain, automatically show the shipping form
          if (remaining.length === 0) {
            setShowShippingForm(true);
          }
        }
      } else {
        // Type = 'billing-addresses'
        const remaining = billingAddresses.filter(addr => String(addr.id) !== String(addressId));
        setBillingAddresses(remaining);
        if (String(billingAddressId) === String(addressId)) {
          const newBillingId = remaining.length ? String(remaining[0].id) : null;
          setBillingAddressId(newBillingId);
          
          // If no addresses remain, automatically show the billing form
          if (remaining.length === 0) {
            setShowBillingForm(true);
          }
        }
      }
  
      setSuccess(`Successfully deleted ${addressType} address.`);
      toast.success(`Deleted ${addressType} address`);
    } catch (err) {
      const errorMessage = err.response?.data?.details || err.response?.data?.error || err.message;
      setError(`Failed to delete address: ${errorMessage}`);
      toast.error(`Failed to delete address: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Optimized copyShippingToBilling to not copy phone number for guest users
  const copyShippingToBilling = () => {
    if (!shippingForm.address_line_1) {
      toast.error('Please add a shipping address first');
      return;
    }
    
    // Create a billing address object from the shipping address
    const billingAddress = {
      full_name: guestForm.name || billingForm.full_name,
      email: guestForm.email || billingForm.email,
      // For guest users, use the phone number from guest form instead of shipping form
      phone_number: isGuest ? guestForm.phone_number : shippingForm.phone_number,
      address_line_1: shippingForm.address_line_1,
      // address_line_2 removed
      city: shippingForm.city,
      state: shippingForm.state,
      zip_code: shippingForm.zip_code,
      country: shippingForm.country,
    };
    
    // Update billing form state
    setBillingForm(billingAddress);
    toast.success('Billing address updated to match shipping address');
  };
  
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);
  
  // Memoized fetch function to prevent unnecessary re-creation
  const fetchCartAndAddresses = useCallback(async () => {
    // Check if user is authenticated
    if (!isAuthenticated() && !createdUserId) {
      // Load guest cart from localStorage
      const guestCartData = localStorage.getItem('guestCart');
      if (guestCartData) {
        try {
          const guestCart = JSON.parse(guestCartData);
          setCart(guestCart);
          setIsGuest(true);
          setShowGuestModal(true);
          setLoading(false);
          return;
        } catch (err) {
          console.error('Error parsing guest cart:', err);
        }
      }
      setCart({ cartId: null, subtotal: 0, tax: 0, total: 0, items: [] });
      setIsGuest(true);
      setShowGuestModal(true);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const userId = createdUserId || getUserId();
      
      // If we have a createdUserId but no token, we don't need to fetch addresses
      if (createdUserId && !isAuthenticated()) {
        setIsGuest(true);
        setLoading(false);
        return;
      }
      
      const token = getToken();
      
      // Use Promise.allSettled for parallel API calls with better error handling
      const [cartResult, shippingResult, billingResult] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/api/cart/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/api/addresses/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/api/billing-addresses/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);
      
      // Handle cart data
      if (cartResult.status === 'fulfilled') {
        const cartData = cartResult.value.data?.data || cartResult.value.data;
        
        if (!cartData.cartId || !cartData.items?.length) {
          setError('Your cart is empty. Please add items to proceed.');
          toast.error('Your cart is empty. Please add items to proceed.');
          navigate('/cart');
          return;
        }
        
        setCart(cartData);
        setIsGuest(false);
      } else {
        throw new Error('Failed to fetch cart data');
      }
      
      // Handle shipping addresses
      if (shippingResult.status === 'fulfilled') {
        let shippingData = shippingResult.value.data;
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
        } else {
          setShowShippingForm(true);
        }
      } else {
        console.error('Error fetching shipping addresses:', shippingResult.reason);
        setShippingAddresses([]);
      }
      
      // Handle billing addresses
      if (billingResult.status === 'fulfilled') {
        let billingData = billingResult.value.data;
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
        } else {
          setShowBillingForm(true);
        }
      } else {
        console.error('Error fetching billing addresses:', billingResult.reason);
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
  }, [createdUserId, navigate]);
  
  useEffect(() => {
    if (!authLoading && !contextLoading) {
      fetchCartAndAddresses();
    }
  }, [authLoading, contextLoading, fetchCartAndAddresses]);
  
  // Update billing address when shipping address changes if option is 'same'
  useEffect(() => {
    if (billingAddressOption === 'same' && shippingForm.address_line_1) {
      // Update billing form to match shipping form
      const billingAddress = {
        full_name: guestForm.name || billingForm.full_name,
        email: guestForm.email || billingForm.email,
        // For guest users, use the phone number from guest form instead of shipping form
        phone_number: isGuest ? guestForm.phone_number : shippingForm.phone_number,
        address_line_1: shippingForm.address_line_1,
        // address_line_2 removed
        city: shippingForm.city,
        state: shippingForm.state,
        zip_code: shippingForm.zip_code,
        country: shippingForm.country,
      };
      
      setBillingForm(billingAddress);
    }
  }, [shippingForm, billingAddressOption, guestForm.name, guestForm.email, guestForm.phone_number, isGuest, billingForm.full_name, billingForm.email]);
  
  useEffect(() => {
    if (shippingAddresses.length > 0 && !shippingAddressId) {
      setShippingAddressId(String(shippingAddresses[0].id));
    }
    if (billingAddresses.length > 0 && !billingAddressId) {
      setBillingAddressId(String(billingAddresses[0].id));
    }
  }, [shippingAddresses, billingAddresses, shippingAddressId, billingAddressId]);
  
  // Initialize billing form with user data for logged-in users
  useEffect(() => {
    if (user && isAuthenticated() && billingAddresses.length === 0 && !billingForm.full_name && !billingForm.email) {
      setBillingForm(prev => ({
        ...prev,
        full_name: user.name || '',
        email: user.email || ''
      }));
    }
  }, [user, billingAddresses.length, billingForm.full_name, billingForm.email]);
  
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
          } else if (order.payment_status === 'completed') { // NEW: Check for completed orders
            toast.success('Your payment has been completed. Thank you for your order!');
            navigate(`/thank-you?reference=${order.reference}&orderId=${pendingOrderId}`);
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
  
  // Memoize expensive calculations to prevent unnecessary recalculations
  const calculatedValues = useMemo(() => {
    const subtotal = Number(cart?.subtotal) || 0;
    const tax = isNigeria ? 0 : Number((subtotal * 0.05).toFixed(2));
    const shippingCost = isNigeria ? shippingMethod?.total_cost || 0 : 0;
    
    // Calculate total discount (first order + coupon)
    const totalDiscount = Number((firstOrderDiscount + couponDiscount).toFixed(2));
    // Ensure total discount doesn't exceed subtotal
    const finalDiscount = Math.min(totalDiscount, subtotal);
    const discountedSubtotal = Number((subtotal - finalDiscount).toFixed(2));
    const total = Number((discountedSubtotal + tax + shippingCost).toFixed(2));
    
    return {
      subtotal,
      tax,
      shippingCost,
      finalDiscount,
      total,
      displaySubtotal: subtotal,
      displayFirstOrderDiscount: firstOrderDiscount,
      displayCouponDiscount: couponDiscount,
      displayTotalDiscount: finalDiscount,
      displayTax: tax,
      displayTotal: total
    };
  }, [cart?.subtotal, isNigeria, shippingMethod?.total_cost, firstOrderDiscount, couponDiscount]);
  
  const {
    subtotal,
    tax,
    shippingCost,
    finalDiscount,
    total,
    displaySubtotal,
    displayFirstOrderDiscount,
    displayCouponDiscount,
    displayTotalDiscount,
    displayTax,
    displayTotal
  } = calculatedValues;
  
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
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-Primarycolor"></div>
          <p className="mt-2 text-sm font-Jost">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar2 />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Checkout Form Skeleton */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
            {/* Right Column - Order Summary Skeleton */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between">
                      <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-5 bg-gray-200 rounded w-1/5"></div>
                    </div>
                  </div>
                  <div className="h-12 bg-gray-200 rounded mt-6"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
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
  

  
  return (
    <div 
      className="min-h-screen bg-gray-100 typography"
      style={{
        '--color-Primarycolor': '#1E1E1E',
        '--color-Secondarycolor': '#ffffff',
        '--color-Accent': '#6E6E6E',
        '--font-Inter': '"Inter", sans-serif',
        '--font-Jost': '"Jost", "sans-serif"'
      }}
    >
      <Navbar2 />
      <div className="max-w-7xl mx-auto px-[0.4em] md:px-4 sm:px-6 lg:px-8 py-7 pt-20">
        <Link to="/cart" className="inline-flex items-center text-Accent hover:text-Primarycolor mb-6 font-Jost">
          <ArrowLeft className="h-5 w-5 mr-1" /> Back to Cart
        </Link>
        <h2 className="text-3xl font-bold text-Primarycolor mb-8 font-Inter">Checkout</h2>
        
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
                <h3 className="text-xl font-bold text-Primarycolor flex items-center font-Inter">
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
        
        {/* Guest Modal */}
        {isGuest && showGuestModal && (
          <GuestCheckoutModal
            guestForm={guestForm}
            guestFormErrors={guestFormErrors}
            existingUserType={existingUserType}
            requiredForm={requiredForm}
            onGuestFormChange={handleGuestFormChange}
            onLoginRedirect={handleLoginRedirect}
            onSubmitGuestForm={handleGuestFormSubmit}
            loading={loading}
            navigate={navigate}
          />
        )}
        
        {/* Only show the checkout content if the guest form has been submitted or user is authenticated */}
        {(!isGuest || guestFormSubmitted) && (
          <>
            {/* Updated to two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column - Forms */}
              <div className="lg:col-span-7 space-y-8">
                {/* Address Forms - Different for guests and logged-in users */}
                {isGuest ? (
                  // Guest Address Forms
                  <>
                    {/* Shipping Address Form for Guests */}
                    <div className="p-5 md:p-6 bg-white rounded-lg shadow-md">
                      <h3 className="text-xl font-semibold text-Primarycolor mb-4 font-Inter">Shipping Address</h3>
                      
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
                      
                      {!showShippingForm ? (
                        shippingForm.address_line_1 ? (
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex items-start">
                              <div className="flex-1">
                                <h4 className="font-medium text-Primarycolor font-Inter mb-2">Shipping Address</h4>
                                <div className="text-sm text-black font-Jost">
                                  <p className="text-sm text-Primarycolor font-Inter">{shippingForm.address_line_1}</p>
                                  {shippingForm.landmark && <p>{shippingForm.landmark}</p>}
                                  <p className="text-sm text-Primarycolor font-Inter">{shippingForm.city}, {shippingForm.state} {shippingForm.zip_code}</p>
                                  <p className="text-sm text-Primarycolor font-Inter">{shippingForm.country}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => setShowShippingForm(true)}
                                className="ml-4 p-2 bg-Primarycolor text-white rounded-lg hover:bg-gray-800 transition-colors"
                                title="Edit shipping address"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <button
                              onClick={() => setShowShippingForm(true)}
                              className="px-6 py-3 bg-Primarycolor text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                            >
                              <MapPin className="h-5 w-5 inline mr-2" />
                              Add Shipping Address
                            </button>
                          </div>
                        )
                      ) : (
                        <React.Suspense fallback={<div className="animate-pulse h-64 bg-gray-200 rounded"></div>}>
                          <ShippingAddressForm
                            address={{ state: shippingForm, setState: setShippingForm }}
                            onSubmit={handleShippingSubmit}
                            onCancel={() => setShowShippingForm(false)}
                            formErrors={formErrors}
                            setFormErrors={setFormErrors}
                            actionLoading={loading}
                            isGuest={true}
                            guestData={guestForm}
                          />
                        </React.Suspense>
                      )}
                    </div>
                    
                    {/* Billing Address Form for Guests */}
                    <div className="p-5 md:p-6 bg-white rounded-lg shadow-md">
                      <h3 className="text-xl font-semibold text-Primarycolor mb-4 font-Inter">Billing Address</h3>
                      
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
                            <span className="text-sm font-medium text-Accent font-Jost">Use my shipping address for billing</span>
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
                            <span className="text-sm font-medium text-Accent font-Jost">Enter a different billing address</span>
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
                              <h4 className="font-medium text-Primarycolor font-Inter mb-2">Billing Address (Same as Shipping)</h4>
                              {shippingForm.address_line_1 ? (
                                <div className="text-sm text-black font-Jost">
                                  <p className="text-sm text-Primarycolor font-Inter">{shippingForm.address_line_1}</p>
                                  {shippingForm.landmark && <p>{shippingForm.landmark}</p>}
                                  <p className="text-sm text-Primarycolor font-Inter">{shippingForm.city}, {shippingForm.state} {shippingForm.zip_code}</p>
                                  <p className="text-sm text-Primarycolor font-Inter">{shippingForm.country}</p>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 font-Jost">Please enter a shipping address first</p>
                              )}
                            </div>
                            <button
                              onClick={copyShippingToBilling}
                              className="ml-4 p-2 bg-Primarycolor text-white rounded-lg hover:bg-gray-800 transition-colors"
                              title="Copy shipping address to billing address"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <React.Suspense fallback={<div className="animate-pulse h-64 bg-gray-200 rounded"></div>}>
                          <BillingAddressForm
                            address={{ state: billingForm, setState: setBillingForm }}
                            onSubmit={handleBillingSubmit}
                            onCancel={() => setShowBillingForm(false)}
                            formErrors={formErrors}
                            setFormErrors={setFormErrors}
                            actionLoading={loading}
                            isGuest={true}
                            guestData={guestForm}
                            userData={null}
                          />
                        </React.Suspense>
                      )}
                    </div>
                  </>
                ) : (
                  // Logged-in User Address Management
                  <>
                    {/* Shipping Address Section */}
                    <div className="p-5 md:p-6 bg-white rounded-lg shadow-md">
                      <h3 className="text-xl font-semibold text-Primarycolor mb-4 font-Inter">Shipping Address</h3>
                      
                      {shippingAddresses.length > 0 ? (
                        <>
                          {/* Address Selection Dropdown */}
                          {shippingAddresses.length > 1 && (
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-Primarycolor mb-2 font-Jost">
                                Select Shipping Address
                              </label>
                              <select
                                value={shippingAddressId || ''}
                                onChange={(e) => setShippingAddressId(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-Primarycolor focus:border-transparent font-Jost"
                              >
                                {shippingAddresses.map(address => (
                                  <option key={address.id} value={String(address.id)}>
                                    {address.title} - {address.city}, {address.state}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          
                          {/* Selected Address Display */}
                          <div className="border rounded-lg p-4 bg-gray-50">
                            {shippingAddresses
                              .filter(addr => String(addr.id) === String(shippingAddressId))
                              .map(address => (
                                <div key={address.id}>
                                  <div className="flex justify-between items-start mb-2">
                                    <p className="font-medium text-Primarycolor">{address.title}</p>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleEditAddress('addresses', address)}
                                        className="p-1 text-Primarycolor hover:text-gray-800 transition-colors"
                                        title="Edit address"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteAddress('addresses', address.id)}
                                        className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                        title="Delete address"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-sm text-Accent">{address.address_line_1}</p>
                                  {address.landmark && <p className="text-sm text-Accent">{address.landmark}</p>}
                                  <p className="text-sm text-Accent">{address.city}, {address.state} {address.zip_code}</p>
                                  <p className="text-sm text-Accent">{address.country}</p>
                                  {address.phone_number && <p className="text-sm text-Accent">{address.phone_number}</p>}
                                </div>
                              ))
                            }
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <button
                                onClick={handleAddNewShippingAddress}
                                className="flex items-center text-Primarycolor hover:text-gray-800 transition-colors text-sm font-Jost"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Another Address
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-lg font-medium text-Primarycolor mb-2 font-Inter">No shipping address found</p>
                          <p className="text-sm text-gray-600 mb-6 font-Jost">Add your shipping address to continue with checkout</p>
                          <button
                            onClick={handleAddNewShippingAddress}
                            className="inline-flex items-center px-6 py-3 bg-Primarycolor text-white rounded-lg hover:bg-gray-800 transition-colors font-medium font-Jost"
                          >
                            <MapPin className="h-5 w-5 mr-2" />
                            Add Shipping Address
                          </button>
                        </div>
                      )}
                    </div>


                    
                    {/* Shipping Address Form for Logged-in Users */}
                    {showShippingForm && (
                      <div className="p-5 md:p-6 bg-white rounded-lg shadow-md mb-6">
                        <h3 className="text-xl font-semibold text-Primarycolor mb-4 font-Inter">
                          {editingShippingAddress ? 'Edit Shipping Address' : 'Add Shipping Address'}
                        </h3>
                        <React.Suspense fallback={<div className="animate-pulse h-64 bg-gray-200 rounded"></div>}>
                          <ShippingAddressForm
                            address={{ state: shippingForm, setState: setShippingForm }}
                            onSubmit={handleShippingSubmit}
                            onCancel={() => setShowShippingForm(false)}
                            formErrors={formErrors}
                            setFormErrors={setFormErrors}
                            actionLoading={shippingAddressLoading}
                            isGuest={false}
                          />
                        </React.Suspense>
                      </div>
                    )}

                    {/* Billing Address Section */}
                    <div className="p-5 md:p-6 bg-white rounded-lg shadow-md">
                      <h3 className="text-xl font-semibold text-Primarycolor mb-4 font-Inter">Billing Address</h3>
                      
                      {/* Billing Address Option Selector for Logged-in Users */}
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
                      
                      {billingAddressOption === 'same' ? (
                        /* Same as Shipping Address Display */
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="flex items-start">
                            <div className="flex-1">
                              <h4 className="font-medium text-Primarycolor font-Inter mb-2">Billing Address (Same as Shipping)</h4>
                              {shippingAddresses.length > 0 && shippingAddressId ? (
                                <div className="text-sm text-black font-Jost">
                                  {shippingAddresses
                                    .filter(addr => String(addr.id) === String(shippingAddressId))
                                    .map(address => (
                                      <div key={address.id}>
                                        <p className="text-sm text-Primarycolor font-Inter">{address.title}</p>
                                        <p className="text-sm text-Primarycolor font-Inter">{address.address_line_1}</p>
                                        {address.landmark && <p>{address.landmark}</p>}
                                        <p className="text-sm text-Primarycolor font-Inter">{address.city}, {address.state} {address.zip_code}</p>
                                        <p className="text-sm text-Primarycolor font-Inter">{address.country}</p>
                                        {address.phone_number && <p className="text-sm text-Primarycolor font-Inter">{address.phone_number}</p>}
                                      </div>
                                    ))
                                  }
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 font-Jost">Please select a shipping address first</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Different Billing Address Selection */
                        billingAddresses.length > 0 ? (
                        <>
                          {/* Address Selection Dropdown */}
                          {billingAddresses.length > 1 && (
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-Primarycolor mb-2 font-Jost">
                                Select Billing Address
                              </label>
                              <select
                                value={billingAddressId || ''}
                                onChange={(e) => setBillingAddressId(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-Primarycolor focus:border-transparent font-Jost"
                              >
                                {billingAddresses.map(address => (
                                  <option key={address.id} value={String(address.id)}>
                                    {address.full_name} - {address.city}, {address.state}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          
                          {/* Selected Address Display */}
                          <div className="border rounded-lg p-4 bg-gray-50">
                            {billingAddresses
                              .filter(addr => String(addr.id) === String(billingAddressId))
                              .map(address => (
                                <div key={address.id}>
                                  <div className="flex justify-between items-start mb-2">
                                    <p className="font-medium text-Primarycolor">{address.full_name}</p>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleEditAddress('billing-addresses', address)}
                                        className="p-1 text-Primarycolor hover:text-gray-800 transition-colors"
                                        title="Edit address"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteAddress('billing-addresses', address.id)}
                                        className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                        title="Delete address"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-sm text-Accent">{address.email}</p>
                                  {address.phone_number && <p className="text-sm text-Accent">{address.phone_number}</p>}
                                  <p className="text-sm text-Accent">{address.address_line_1}</p>
                                  <p className="text-sm text-Accent">{address.city}, {address.state} {address.zip_code}</p>
                                  <p className="text-sm text-Accent">{address.country}</p>
                                </div>
                              ))
                            }
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <button
                                onClick={handleAddNewBillingAddress}
                                className="flex items-center text-Primarycolor hover:text-gray-800 transition-colors text-sm font-Jost"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Another Address
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-lg font-medium text-Primarycolor mb-2 font-Inter">No billing address found</p>
                          <p className="text-sm text-gray-600 mb-6 font-Jost">Add your billing address for payment processing</p>
                          <button
                            onClick={handleAddNewBillingAddress}
                            className="inline-flex items-center px-6 py-3 bg-Primarycolor text-white rounded-lg hover:bg-gray-800 transition-colors font-medium font-Jost"
                          >
                            <CreditCard className="h-5 w-5 mr-2" />
                            Add Billing Address
                          </button>
                        </div>
                      )
                      )}
                    </div>
                    

                    

                  </>
                )}
                
                {/* Billing Address Form for Logged-in Users */}
                    {showBillingForm && (
                      <div className="p-5 md:p-6 bg-white rounded-lg shadow-md mb-6">
                        <h3 className="text-xl font-semibold text-Primarycolor mb-4 font-Inter">Add Billing Address</h3>
                        <React.Suspense fallback={<div className="animate-pulse h-64 bg-gray-200 rounded"></div>}>
                          <BillingAddressForm
                            address={{ state: billingForm, setState: setBillingForm }}
                            onSubmit={handleBillingSubmit}
                            onCancel={() => setShowBillingForm(false)}
                            formErrors={formErrors}
                            setFormErrors={setFormErrors}
                            actionLoading={billingAddressLoading}
                            isGuest={false}
                            userData={user}
                          />
                        </React.Suspense>
                      </div>
                    )}

                    {/* Order Note */}
                    <div className="p-5 md:p-6 bg-white rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold text-Primarycolor mb-4 font-Inter">Special Instructions (optional)</h3>
                  <textarea
                    value={orderNote}
                    onChange={handleOrderNoteChange}
                    maxLength={500}
                    placeholder="Add special delivery instructions, gift message, or other notes for your order"
                    className="w-full p-2 border border-gray-300 rounded-md font-Jost"
                  />
                  <p className="text-sm text-Accent font-Jost">Characters left: {500 - orderNote.length}/500</p>
                </div>
                
                {/* Shipping Method */}
                <div className="p-5 md:p-6 bg-white rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold text-Primarycolor mb-6 font-Inter">
                    <Truck className="h-5 w-5 inline mr-2" />
                    Choose Delivery Method
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
                                      <h4 className="font-semibold text-Primarycolor text-sm sm:text-base font-Inter">
                                        {option.method}
                                      </h4>
                                      <p className="text-xs sm:text-sm text-Accent font-Jost">
                                        {option.description}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-Primarycolor text-lg font-Inter">
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
                          <h4 className="font-semibold text-Primarycolor font-Inter">
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
                  <h3 className="text-xl font-semibold text-Primarycolor mb-6 font-Inter">Order Summary</h3>
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
                              <h4 className="font-medium text-Primarycolor text-sm sm:text-base truncate font-Inter">
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
                                <span className="font-semibold text-Primarycolor font-Inter">
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
                    <h4 className="text-sm font-semibold text-Primarycolor mb-3 font-Inter">Payment Method</h4>
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
                        <div className="flex flex-col">
                          <span className="text-sm text-Accent font-Jost font-medium">Debit/Credit Card</span>
                          <span className="text-xs text-gray-500 font-Jost">Pay securely with Visa, Mastercard, or Verve</span>
                        </div>
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
                        <div className="flex flex-col">
                          <span className="text-sm text-Accent font-Jost font-medium">Bank Transfer</span>
                          <span className="text-xs text-gray-500 font-Jost">Direct transfer from your bank account</span>
                        </div>
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
                          <div className="flex flex-col">
                            <span className="text-sm text-Accent font-Jost font-medium">Bitcoin/Crypto</span>
                            <span className="text-xs text-gray-500 font-Jost">Pay with Bitcoin or other cryptocurrencies</span>
                          </div>
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
                      <div className="flex justify-between text-lg font-bold text-Primarycolor font-Inter">
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
                              {requiredForm === 'guest' && 'Complete Your Details'}
                              {requiredForm === 'shipping' && 'Add Shipping Address'}
                              {requiredForm === 'billing' && 'Add Billing Address'}
                            </p>
                            <p className="text-xs mt-1 text-yellow-700 font-Jost">
                              {requiredForm === 'guest' && 'Fill in your name, email, and phone number above to continue'}
                              {requiredForm === 'shipping' && 'Add your shipping address to proceed with checkout'}
                              {requiredForm === 'billing' && 'Add your billing address or use same as shipping address'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Updated Place Order Button */}
                    <button
                      onClick={handlePlaceOrder}
                      className="mt-6 w-full bg-Primarycolor text-Secondarycolor text-sm py-4 px-4 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-Inter font-semibold"
                      disabled={isProcessing || loading || 
                        (!shippingForm.address_line_1 && !shippingAddressId) || 
                        (!billingForm.address_line_1 && !billingAddressId) || 
                        (isNigeria && !shippingMethod) || 
                        (isGuest && !createdUserId && !guestFormSubmitted)
                      }
                    >
                      {isProcessing || loading ? (
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
                            <strong>Bitcoin Payment:</strong> After placing your order, you'll receive detailed payment instructions via email.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <React.Suspense fallback={<div></div>}>
        <WhatsAppChatWidget />
      </React.Suspense>
      <Footer />
    </div>
  );
};

export default CheckoutPage;