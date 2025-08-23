import { useState, useEffect, useContext, useCallback, useMemo, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, AlertCircle, CheckCircle, Trash2, Bitcoin, MessageCircle, Truck, Clock, MapPin, Gift, X, Copy } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BillingAddressForm from '../components/BillingAddressForm';
import ShippingAddressForm from '../components/ShippingAddressForm';
import WhatsAppChatWidget from '../components/WhatsAppChatWidget';
import { useAuth } from '../context/AuthContext';
import { useUserManager } from '../hooks/useUserManager';
import { CurrencyContext } from './CurrencyContext';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import PaystackPop from '@paystack/inline-js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com';
const WHATSAPP_NUMBER = '2348104117122';
const MAX_API_RETRIES = 3;
const RETRY_DELAY = 1000;

const CheckoutPage = memo(() => {
  const { user: authUser, loading: authLoading } = useAuth();
  const { user: hookUser, refreshUser, refreshCount } = useUserManager();
  const user = hookUser || authUser;
  const navigate = useNavigate();

  const currencyContext = useContext(CurrencyContext) || {
    currency: 'NGN',
    exchangeRate: 1,
    country: 'Nigeria',
    contextLoading: false
  };

  const { currency, exchangeRate, country, contextLoading } = currencyContext;

  const [state, setState] = useState({
    cart: { cartId: null, subtotal: 0, tax: 0, total: 0, items: [] },
    shippingAddresses: [],
    billingAddresses: [],
    shippingAddressId: null,
    billingAddressId: null,
    shippingMethod: null,
    paymentMethod: 'card',
    orderNote: '',
    formErrors: {},
    error: '',
    success: '',
    loading: false,
    showShippingForm: false,
    showBillingForm: false,
    showBitcoinInstructions: false,
    billingAddressOption: 'same',
    firstOrderDiscount: 0,
    couponDiscount: 0,
    couponCode: '',
    appliedCoupon: null,
    couponLoading: false,
    couponError: '',
    couponSuccess: '',
    userDataRefreshed: false,
    isGuest: !authUser,
    guestData: {
      email: '',
      first_name: '',
      last_name: '',
      phone_number: ''
    }
  });

  const shippingFormInitial = useMemo(() => ({
    title: '',
    address_line_1: '',
    address_line_2: '',
    landmark: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'Nigeria',
    phone_number: user?.phone_number || ''
  }), [user]);

  const billingFormInitial = useMemo(() => ({
    full_name: user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'Nigeria'
  }), [user]);

  const [shippingForm, setShippingForm] = useState(shippingFormInitial);
  const [billingForm, setBillingForm] = useState(billingFormInitial);

  const shippingOptions = useMemo(() => [
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
    }
  ], []);

  const decodeToken = useCallback((token) => {
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
  }, []);

  const getToken = useCallback(() => user?.token || localStorage.getItem('token'), [user]);
  const getUserId = useCallback(() => {
    if (state.isGuest) return null;
    const token = getToken();
    if (!token) return null;
    const tokenData = decodeToken(token);
    return tokenData?.id;
  }, [state.isGuest, getToken, decodeToken]);

  const isAuthenticated = useCallback(() => !!getToken() && !state.isGuest, [getToken, state.isGuest]);

  const retryApiCall = useCallback(async (fn, retries = MAX_API_RETRIES) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    if (state.isGuest) return null;
    try {
      const updatedUser = await refreshUser();
      if (updatedUser) {
        setState(prev => ({ ...prev, userDataRefreshed: true }));
        return updatedUser;
      }
      return null;
    } catch (err) {
      console.error('Failed to refresh user data:', err);
      return null;
    }
  }, [refreshUser, state.isGuest]);

  useEffect(() => {
    if (user && isAuthenticated() && !state.userDataRefreshed) {
      refreshUserData();
    }
  }, [user, isAuthenticated, state.userDataRefreshed, refreshUserData]);

  useEffect(() => {
    const currentSubtotal = state.cart.subtotal;
    if ((user?.first_order || state.isGuest) && currentSubtotal > 0) {
      const discountAmount = Number((currentSubtotal * 0.05).toFixed(2));
      setState(prev => ({ ...prev, firstOrderDiscount: discountAmount }));
    } else {
      setState(prev => ({ ...prev, firstOrderDiscount: 0 }));
    }
  }, [user?.first_order, state.cart.subtotal, state.userDataRefreshed, refreshCount, state.isGuest]);

  const handleApplyCoupon = useCallback(async (e) => {
    e.preventDefault();
    if (!state.couponCode.trim()) {
      setState(prev => ({ ...prev, couponError: 'Please enter a coupon code' }));
      return;
    }
    if (!/^[A-Z0-9]{4,10}$/.test(state.couponCode.trim())) {
      setState(prev => ({ ...prev, couponError: 'Invalid coupon code format' }));
      return;
    }

    setState(prev => ({ ...prev, couponLoading: true, couponError: '', couponSuccess: '' }));

    try {
      const token = getToken();
      const response = await retryApiCall(() => axios.post(
        `${API_BASE_URL}/api/admin/discounts/validate`,
        { code: state.couponCode },
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      ));

      if (response.data.valid) {
        const discount = response.data.discount;
        let discountAmount = discount.type === 'percentage'
          ? (state.cart.subtotal * discount.value) / 100
          : discount.value;
        discountAmount = Math.min(discountAmount, state.cart.subtotal);

        setState(prev => ({
          ...prev,
          appliedCoupon: {
            code: discount.code,
            type: discount.type,
            value: discount.value,
            amount: discountAmount
          },
          couponDiscount: discountAmount,
          couponSuccess: `Coupon applied! You saved ${discount.type === 'percentage' ? `${discount.value}%` : `₦${discount.value}`}`
        }));
      } else {
        setState(prev => ({ ...prev, couponError: response.data.message || 'Invalid coupon code' }));
      }
    } catch (err) {
      setState(prev => ({ ...prev, couponError: err.response?.data?.message || 'Failed to validate coupon' }));
    } finally {
      setState(prev => ({ ...prev, couponLoading: false }));
    }
  }, [state.couponCode, state.cart.subtotal, getToken, retryApiCall]);

  const handleRemoveCoupon = useCallback(() => {
    setState(prev => ({
      ...prev,
      appliedCoupon: null,
      couponCode: '',
      couponDiscount: 0,
      couponSuccess: ''
    }));
  }, []);

  const getShippingIcon = useCallback((iconType) => {
    switch (iconType) {
      case 'truck': return <Truck className="h-5 w-5" />;
      case 'package': return <MapPin className="h-5 w-5" />;
      case 'home': return <MapPin className="h-5 w-5" />;
      default: return <Truck className="h-5 w-5" />;
    }
  }, []);

  const handleShippingSubmit = useCallback(async (data) => {
    if (!isAuthenticated()) {
      toast.error('Please log in to add shipping address');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    setState(prev => ({ ...prev, loading: true }));
    try {
      const userId = getUserId();
      const token = getToken();
      const payload = { user_id: userId, ...data };
      const response = await retryApiCall(() => axios.post(
        `${API_BASE_URL}/api/addresses`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      ));

      const created = response.data?.data || response.data;
      setState(prev => ({
        ...prev,
        shippingAddresses: [created, ...prev.shippingAddresses],
        shippingAddressId: String(created.id),
        showShippingForm: false,
        formErrors: {},
        success: 'Shipping address added successfully.'
      }));
      toast.success('Shipping address added');

      if (state.billingAddressOption === 'same') {
        const billingAddress = {
          full_name: user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : '',
          email: user?.email || '',
          phone_number: data.phone_number,
          address_line_1: data.address_line_1,
          address_line_2: data.address_line_2,
          city: data.city,
          state: data.state,
          zip_code: data.zip_code,
          country: data.country
        };

        const matchingBillingAddress = state.billingAddresses.find(addr =>
          addr.address_line_1 === billingAddress.address_line_1 &&
          addr.city === billingAddress.city &&
          addr.state === billingAddress.state
        );

        if (matchingBillingAddress) {
          setState(prev => ({ ...prev, billingAddressId: String(matchingBillingAddress.id) }));
        } else {
          try {
            const billingResponse = await retryApiCall(() => axios.post(
              `${API_BASE_URL}/api/billing-addresses`,
              { user_id: userId, ...billingAddress },
              { headers: { Authorization: `Bearer ${token}` } }
            ));

            const newBillingAddress = billingResponse.data?.data || billingResponse.data;
            setState(prev => ({
              ...prev,
              billingAddresses: [newBillingAddress, ...prev.billingAddresses],
              billingAddressId: String(newBillingAddress.id)
            }));
          } catch (err) {
            toast.error('Failed to create billing address from shipping address');
          }
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.details || err.response?.data?.error || err.message;
      setState(prev => ({ ...prev, error: `Failed to add shipping address: ${errorMessage}` }));
      toast.error(`Failed to add shipping address: ${errorMessage}`);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [isAuthenticated, getUserId, getToken, state.billingAddressOption, state.billingAddresses, navigate, retryApiCall, user]);

  const handleBillingSubmit = useCallback(async (data) => {
    if (!isAuthenticated()) {
      toast.error('Please log in to add billing address');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    setState(prev => ({ ...prev, loading: true }));
    try {
      const userId = getUserId();
      const token = getToken();
      const payload = { user_id: userId, ...data };
      const response = await retryApiCall(() => axios.post(
        `${API_BASE_URL}/api/billing-addresses`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      ));

      const created = response.data?.data || response.data;
      setState(prev => ({
        ...prev,
        billingAddresses: [created, ...prev.billingAddresses],
        billingAddressId: String(created.id),
        showBillingForm: false,
        formErrors: {},
        success: 'Billing address added successfully.'
      }));
      toast.success('Billing address added');
    } catch (err) {
      const errorMessage = err.response?.data?.details || err.response?.data?.error || err.message;
      setState(prev => ({ ...prev, error: `Failed to add billing address: ${errorMessage}` }));
      toast.error(`Failed to add billing address: ${errorMessage}`);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [isAuthenticated, getUserId, getToken, navigate, retryApiCall]);

  const handleDeleteAddress = useCallback(async (type, addressId) => {
    if (!isAuthenticated()) {
      toast.error('Please log in to delete address');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    setState(prev => ({ ...prev, loading: true }));
    try {
      const token = getToken();
      await retryApiCall(() => axios.delete(`${API_BASE_URL}/api/${type}/${addressId}`, {
        headers: { Authorization: `Bearer ${token}` }
      }));

      if (type === 'addresses') {
        const remaining = state.shippingAddresses.filter(addr => String(addr.id) !== String(addressId));
        setState(prev => ({
          ...prev,
          shippingAddresses: remaining,
          shippingAddressId: String(addressId) === prev.shippingAddressId
            ? remaining.length ? String(remaining[0].id) : null
            : prev.shippingAddressId
        }));

        if (state.billingAddressOption === 'same' && remaining.length > 0) {
          const newShippingAddress = remaining[0];
          const matchingBillingAddress = state.billingAddresses.find(addr =>
            addr.address_line_1 === newShippingAddress.address_line_1 &&
            addr.city === newShippingAddress.city &&
            addr.state === newShippingAddress.state
          );

          if (matchingBillingAddress) {
            setState(prev => ({ ...prev, billingAddressId: String(matchingBillingAddress.id) }));
          } else {
            const billingAddress = {
              full_name: user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : '',
              email: user?.email || '',
              phone_number: newShippingAddress.phone_number,
              address_line_1: newShippingAddress.address_line_1,
              address_line_2: newShippingAddress.address_line_2,
              city: newShippingAddress.city,
              state: newShippingAddress.state,
              zip_code: newShippingAddress.zip_code,
              country: newShippingAddress.country
            };

            try {
              const billingResponse = await retryApiCall(() => axios.post(
                `${API_BASE_URL}/api/billing-addresses`,
                { user_id: getUserId(), ...billingAddress },
                { headers: { Authorization: `Bearer ${token}` } }
              ));

              const newBillingAddress = billingResponse.data?.data || billingResponse.data;
              setState(prev => ({
                ...prev,
                billingAddresses: [newBillingAddress, ...prev.billingAddresses],
                billingAddressId: String(newBillingAddress.id)
              }));
            } catch (err) {
              console.error('Error creating billing address:', err);
            }
          }
        }
      } else {
        const remaining = state.billingAddresses.filter(addr => String(addr.id) !== String(addressId));
        setState(prev => ({
          ...prev,
          billingAddresses: remaining,
          billingAddressId: String(addressId) === prev.billingAddressId
            ? remaining.length ? String(remaining[0].id) : null
            : prev.billingAddressId
        }));
      }

      setState(prev => ({ ...prev, success: `Successfully deleted ${type === 'addresses' ? 'shipping' : 'billing'} address.` }));
      toast.success(`Deleted ${type === 'addresses' ? 'shipping' : 'billing'} address`);
    } catch (err) {
      const errorMessage = err.response?.data?.details || err.response?.data?.error || err.message;
      setState(prev => ({ ...prev, error: `Failed to delete address: ${errorMessage}` }));
      toast.error(`Failed to delete address: ${errorMessage}`);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [isAuthenticated, getToken, getUserId, state.shippingAddresses, state.billingAddresses, state.billingAddressOption, state.shippingAddressId, state.billingAddressId, navigate, retryApiCall, user]);

  const copyShippingToBilling = useCallback(() => {
    const selectedShippingAddress = state.shippingAddresses.find(addr => addr.id.toString() === state.shippingAddressId);
    if (!selectedShippingAddress) {
      toast.error('Please select a shipping address first');
      return;
    }

    const billingAddress = {
      full_name: user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : '',
      email: user?.email || '',
      phone_number: selectedShippingAddress.phone_number,
      address_line_1: selectedShippingAddress.address_line_1,
      address_line_2: selectedShippingAddress.address_line_2,
      city: selectedShippingAddress.city,
      state: selectedShippingAddress.state,
      zip_code: selectedShippingAddress.zip_code,
      country: selectedShippingAddress.country
    };

    const matchingBillingAddress = state.billingAddresses.find(addr =>
      addr.address_line_1 === billingAddress.address_line_1 &&
      addr.city === billingAddress.city &&
      addr.state === billingAddress.state
    );

    if (matchingBillingAddress) {
      setState(prev => ({ ...prev, billingAddressId: String(matchingBillingAddress.id) }));
      toast.success('Billing address updated to match shipping address');
    } else {
      const createBillingAddress = async () => {
        setState(prev => ({ ...prev, loading: true }));
        try {
          const userId = getUserId();
          const token = getToken();
          const response = await retryApiCall(() => axios.post(
            `${API_BASE_URL}/api/billing-addresses`,
            { user_id: userId, ...billingAddress },
            { headers: { Authorization: `Bearer ${token}` } }
          ));

          const newBillingAddress = response.data?.data || response.data;
          setState(prev => ({
            ...prev,
            billingAddresses: [newBillingAddress, ...prev.billingAddresses],
            billingAddressId: String(newBillingAddress.id)
          }));
          toast.success('Billing address created to match shipping address');
        } catch (err) {
          const errorMessage = err.response?.data?.details || err.response?.data?.error || err.message;
          setState(prev => ({ ...prev, error: `Failed to create billing address: ${errorMessage}` }));
          toast.error(`Failed to create billing address: ${errorMessage}`);
        } finally {
          setState(prev => ({ ...prev, loading: false }));
        }
      };
      createBillingAddress();
    }
  }, [state.shippingAddresses, state.shippingAddressId, state.billingAddresses, getUserId, getToken, retryApiCall, user]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  useEffect(() => {
    const fetchCartAndAddresses = async () => {
      if (!isAuthenticated()) {
        setState(prev => ({ ...prev, error: 'Please log in to proceed with checkout.' }));
        toast.error('Please log in to proceed with checkout.');
        navigate('/login', { state: { from: '/checkout' } });
        return;
      }

      setState(prev => ({ ...prev, loading: true }));
      try {
        const userId = getUserId();
        const token = getToken();

        const cartResponse = await retryApiCall(() => axios.get(`${API_BASE_URL}/api/cart/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }));

        const cartData = cartResponse.data?.data || cartResponse.data;
        if (!cartData.cartId || !cartData.items?.length) {
          setState(prev => ({ ...prev, error: 'Your cart is empty. Please add items to proceed.' }));
          toast.error('Your cart is empty. Please add items to proceed.');
          navigate('/cart');
          return;
        }

        setState(prev => ({ ...prev, cart: cartData }));

        const shippingResponse = await retryApiCall(() => axios.get(`${API_BASE_URL}/api/addresses/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }));

        let shippingData = shippingResponse.data;
        if (shippingData && !Array.isArray(shippingData)) {
          shippingData = [shippingData];
        } else if (shippingData && Array.isArray(shippingData.data)) {
          shippingData = shippingData.data;
        } else if (!shippingData) {
          shippingData = [];
        }

        setState(prev => ({
          ...prev,
          shippingAddresses: shippingData,
          shippingAddressId: shippingData.length > 0 ? String(shippingData[0].id) : null
        }));

        const billingResponse = await retryApiCall(() => axios.get(`${API_BASE_URL}/api/billing-addresses/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }));

        let billingData = billingResponse.data;
        if (billingData && !Array.isArray(billingData)) {
          billingData = [billingData];
        } else if (billingData && Array.isArray(billingData.data)) {
          billingData = billingData.data;
        } else if (!billingData) {
          billingData = [];
        }

        setState(prev => ({
          ...prev,
          billingAddresses: billingData,
          billingAddressId: billingData.length > 0 ? String(billingData[0].id) : null
        }));

        toast.success('Checkout data loaded successfully');
      } catch (err) {
        const errorMessage = err.message || 'Unknown error';
        setState(prev => ({ ...prev, error: `Failed to load checkout data: ${errorMessage}` }));
        toast.error(`Failed to load checkout data: ${errorMessage}`);
      } finally {
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    if (user && !authLoading && !contextLoading) {
      fetchCartAndAddresses();
    }
  }, [user, authLoading, contextLoading, navigate, getUserId, getToken, isAuthenticated, retryApiCall]);

  useEffect(() => {
    if (state.billingAddressOption === 'same' && state.shippingAddressId) {
      const selectedShippingAddress = state.shippingAddresses.find(addr => addr.id.toString() === state.shippingAddressId);
      if (selectedShippingAddress) {
        const matchingBillingAddress = state.billingAddresses.find(addr =>
          addr.address_line_1 === selectedShippingAddress.address_line_1 &&
          addr.city === selectedShippingAddress.city &&
          addr.state === selectedShippingAddress.state
        );
        if (matchingBillingAddress) {
          setState(prev => ({ ...prev, billingAddressId: String(matchingBillingAddress.id) }));
        }
      }
    }
  }, [state.shippingAddressId, state.billingAddressOption, state.shippingAddresses, state.billingAddresses]);

  useEffect(() => {
    const selectedShippingAddress = state.shippingAddresses.find(addr => addr.id.toString() === state.shippingAddressId);
    const addressCountry = selectedShippingAddress ? selectedShippingAddress.country : country;
    const isNigeria = addressCountry.toLowerCase() === 'nigeria';

    if (isNigeria && !state.shippingMethod) {
      setState(prev => ({ ...prev, shippingMethod: shippingOptions[0] }));
    } else if (!isNigeria && state.shippingMethod) {
      setState(prev => ({ ...prev, shippingMethod: null }));
    }
  }, [state.shippingAddresses, state.shippingAddressId, country, state.shippingMethod, shippingOptions]);

  useEffect(() => {
    const checkPendingOrder = async () => {
      const pendingOrderId = localStorage.getItem('pendingOrderId');
      if (pendingOrderId) {
        try {
          const token = getToken();
          const response = await retryApiCall(() => axios.get(`${API_BASE_URL}/api/orders/${pendingOrderId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }));

          if (response.data.payment_status === 'pending') {
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
  }, [user, authLoading, contextLoading, navigate, getToken, retryApiCall]);

  const selectedShippingAddress = state.shippingAddresses.find(addr => addr.id.toString() === state.shippingAddressId);
  const addressCountry = selectedShippingAddress ? selectedShippingAddress.country : country;
  const isNigeria = addressCountry.toLowerCase() === 'nigeria';
  const selectedBillingAddress = state.billingAddresses.find(addr => addr.id.toString() === state.billingAddressId);

  const subtotal = Number(state.cart?.subtotal) || 0;
  const tax = isNigeria ? 0 : Number((subtotal * 0.05).toFixed(2));
  const shippingCost = isNigeria ? state.shippingMethod?.total_cost || 0 : 0;
  const totalDiscount = Number((state.firstOrderDiscount + state.couponDiscount).toFixed(2));
  const finalDiscount = Math.min(totalDiscount, subtotal);
  const discountedSubtotal = Number((subtotal - finalDiscount).toFixed(2));
  const total = Number((discountedSubtotal + tax + shippingCost).toFixed(2));

  const displaySubtotal = subtotal;
  const displayFirstOrderDiscount = state.firstOrderDiscount;
  const displayCouponDiscount = state.couponDiscount;
  const displayTotalDiscount = finalDiscount;
  const displayTax = tax;
  const displayTotal = total;

  const handlePayment = useCallback(async () => {
    if (!state.shippingAddressId) {
      setState(prev => ({ ...prev, error: 'Please select a shipping address.' }));
      toast.error('Please select a shipping address.');
      return;
    }

    if (!state.billingAddressId) {
      setState(prev => ({ ...prev, error: 'Please select a billing address.' }));
      toast.error('Please select a billing address.');
      return;
    }

    if (isNigeria && !state.shippingMethod) {
      setState(prev => ({ ...prev, error: 'Please select a shipping method.' }));
      toast.error('Please select a shipping method.');
      return;
    }

    if (!isAuthenticated()) {
      setState(prev => ({ ...prev, error: 'Please log in to process your order.' }));
      toast.error('Please log in to process your order.');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    if (!state.cart?.items?.length) {
      setState(prev => ({ ...prev, error: 'Cart is empty.' }));
      toast.error('Cart is empty.');
      return;
    }

    setState(prev => ({ ...prev, loading: true }));
    try {
      const selectedShippingAddress = state.shippingAddresses.find(addr => addr.id.toString() === state.shippingAddressId);
      if (!selectedShippingAddress) {
        throw new Error('Selected shipping address not found');
      }

      const orderCurrency = 'NGN';
      const userId = getUserId();
      const token = getToken();

      const orderData = {
        user_id: userId,
        address_id: parseInt(state.shippingAddressId),
        billing_address_id: parseInt(state.billingAddressId),
        cart_id: state.cart.cartId,
        total,
        discount: finalDiscount,
        coupon_code: state.appliedCoupon ? state.appliedCoupon.code : null,
        delivery_option: isNigeria ? 'standard' : 'international',
        shipping_method_id: isNigeria ? state.shippingMethod?.id : null,
        shipping_cost: shippingCost,
        shipping_country: addressCountry,
        payment_method: state.paymentMethod,
        currency: orderCurrency,
        reference: uuidv4(),
        items: state.cart.items.map(item => {
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
            size_name: item.item?.size || null
          };
        }),
        note: state.orderNote,
        exchange_rate: 1,
        base_currency_total: total,
        converted_total: total,
        tax
      };

      const orderResponse = await retryApiCall(() => axios.post(`${API_BASE_URL}/api/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` }
      }));

      const orderId = orderResponse.data.order?.id || orderResponse.data.id || orderResponse.data.data?.id;
      if (!orderId) {
        throw new Error('Order ID not found in response');
      }

      if (user.first_order) {
        try {
          await retryApiCall(() => axios.patch(
            `${API_BASE_URL}/api/auth/users/${userId}`,
            { first_order: false },
            { headers: { Authorization: `Bearer ${token}` } }
          ));
          await refreshUserData();
        } catch (err) {
          if (err.response) {
            toast.error('We had trouble updating your account. Please contact support if you see this discount again.');
          }
        }
      }

      const paymentData = {
        order_id: orderId,
        reference: orderData.reference,
        email: selectedBillingAddress?.email || billingForm.email || user.email,
        amount: Math.round(total * 100),
        currency: orderCurrency,
        callback_url: `${window.location.origin}/thank-you?reference=${orderData.reference}&orderId=${orderId}`
      };

      const paymentResponse = await retryApiCall(() => axios.post(
        `${API_BASE_URL}/api/paystack/initialize`,
        paymentData,
        { headers: { Authorization: `Bearer ${token}` } }
      ));

      const paymentInfo = paymentResponse.data.data || paymentResponse.data;
      const { access_code: accessCode, authorization_url: authorizationUrl } = paymentInfo;

      if (accessCode) {
        toast.success('Order placed successfully. Opening payment popup...');
        localStorage.setItem('lastOrderReference', orderData.reference);
        localStorage.setItem('pendingOrderId', orderId);

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
          onClose: async () => {
            try {
              const token = getToken();
              const paymentResponse = await retryApiCall(() => axios.post(
                `${API_BASE_URL}/api/paystack/verify`,
                { reference: orderData.reference },
                { headers: { Authorization: `Bearer ${token}` } }
              }));

              if (paymentResponse.data.order?.payment_status === 'completed') {
                toast.success('Payment was successful!');
                navigate(`/thank-you?reference=${orderData.reference}&orderId=${orderId}`);
              } else {
                toast.info('Payment window closed. You can complete payment later from your orders page.');
                navigate(`/orders/${orderId}`);
              }
            } catch (err) {
              toast.info('Payment window closed. You can complete payment later from your orders page.');
              navigate(`/orders/${orderId}`);
            }
          }
        });
      } else if (authorizationUrl) {
        toast.success('Order placed successfully. Redirecting to payment page...');
        localStorage.setItem('lastOrderReference', orderData.reference);
        localStorage.setItem('pendingOrderId', orderId);
        window.location.href = authorizationUrl;
      } else {
        throw new Error('Failed to get payment information');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.details || err.message;
      setState(prev => ({ ...prev, error: `Failed to process order: ${errorMessage}` }));
      toast.error(`Failed to process order: ${errorMessage}`);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [state, isAuthenticated, getUserId, getToken, navigate, retryApiCall, user, selectedBillingAddress, billingForm.email, refreshUserData]);

  const handleWhatsAppPayment = useCallback(() => {
    const message = `Hello, I would like to pay for my order with Bitcoin.\n\nOrder Details:\n- Subtotal: ${displaySubtotal.toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    })}\n${displayFirstOrderDiscount > 0 ? `- First Order Discount (5%): -${displayFirstOrderDiscount.toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    })}\n` : ''}${displayCouponDiscount > 0 ? `- Coupon Discount: -${displayCouponDiscount.toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    })}\n` : ''}- Total Amount: ${displayTotal.toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    })}\n- Currency: NGN\n- Order Reference: order_${getUserId()}_${Date.now()}\n\nI have attached a screenshot of my checkout for your reference.`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=${encodedMessage}`, '_blank');
    toast.success('Opening WhatsApp to complete your Bitcoin payment...');
  }, [displaySubtotal, displayFirstOrderDiscount, displayCouponDiscount, displayTotal, getUserId]);

  if (authLoading || contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-Accent">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-8 rounded-full bg-gray-200"></div>
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated() && !authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600 py-8 font-Jost">Please log in to proceed with checkout.</div>
      </div>
    );
  }

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-Accent">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-8 rounded-full bg-gray-200"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!state.cart?.items?.length) {
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

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-bold text-yellow-800 mb-2">Debug Info:</h4>
            <p className="text-sm text-yellow-700">
              User ID: {user?.id}<br />
              First Order (DB): {user?.first_order?.toString()}<br />
              First Order Discount: ₦{displayFirstOrderDiscount.toFixed(2)}<br />
              Cart Subtotal: ₦{state.cart.subtotal.toFixed(2)}<br />
              User Data Refreshed: {state.userDataRefreshed?.toString()}
            </p>
            <button
              onClick={refreshUserData}
              className="mt-2 px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
            >
              Refresh User Data
            </button>
          </div>
        )}

        {state.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-sm text-red-700 font-Jost">{state.error}</span>
          </div>
        )}

        {state.success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm text-green-600 font-Jost">{state.success}</span>
          </div>
        )}

        {state.showBitcoinInstructions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-Primarycolor flex items-center font-Manrope">
                  <Bitcoin className="h-5 w-5 mr-2 text-orange-500" />
                  Bitcoin Payment Instructions
                </h3>
                <button
                  onClick={() => setState(prev => ({ ...prev, showBitcoinInstructions: false }))}
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
                    onClick={() => setState(prev => ({ ...prev, showBitcoinInstructions: false }))}
                    className="flex-1 bg-gray-200 text-Primarycolor py-2 px-4 rounded-md hover:bg-gray-300 transition-colors font-Jost"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="p-5 md:p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-Primarycolor mb-4 font-Manrope">Shipping Address</h3>

              {state.shippingAddresses.length > 0 ? (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-Accent mb-1 font-Jost" htmlFor="shipping-address-select">Select Shipping Address</label>
                    <select
                      id="shipping-address-select"
                      value={state.shippingAddressId ?? ''}
                      onChange={(e) => setState(prev => ({ ...prev, shippingAddressId: String(e.target.value) }))}
                      className="w-full p-2 border border-gray-300 rounded-md font-Jost"
                      aria-required="true"
                    >
                      {state.shippingAddresses.map((address) => (
                        <option key={address.id} value={String(address.id)}>
                          {address.title}, {address.address_line_1}, {address.city}, {address.country}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setState(prev => ({ ...prev, showShippingForm: true }))}
                      className="text-Primarycolor hover:text-gray-800 text-sm flex items-center font-Jost"
                      disabled={state.loading}
                      aria-label="Add new shipping address"
                    >
                      Add New Address
                    </button>
                    <button
                      onClick={() => handleDeleteAddress('addresses', state.shippingAddressId)}
                      className="text-red-600 hover:text-red-800 text-sm flex items-center font-Jost"
                      disabled={state.loading}
                      aria-label="Delete selected shipping address"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Delete Address
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => setState(prev => ({ ...prev, showShippingForm: !prev.showShippingForm }))}
                    className="text-Accent hover:text-Primarycolor text-sm mb-4 font-Jost"
                    aria-label={state.showShippingForm ? 'Cancel adding shipping address' : 'Add shipping address'}
                  >
                    {state.showShippingForm ? 'Cancel' : 'Add Shipping Address'}
                  </button>
                  {state.showShippingForm && (
                    <ShippingAddressForm
                      address={{ state: shippingForm, setState: setShippingForm }}
                      onSubmit={handleShippingSubmit}
                      onCancel={() => setState(prev => ({ ...prev, showShippingForm: false }))}
                      formErrors={state.formErrors}
                      setFormErrors={(errors) => setState(prev => ({ ...prev, formErrors: errors }))}
                      actionLoading={state.loading}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="p-5 md:p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-Primarycolor mb-4 font-Manrope">Billing Address</h3>

              <div className="mb-6">
                <div className="flex items-center space-x-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="billingAddressOption"
                      value="same"
                      checked={state.billingAddressOption === 'same'}
                      onChange={() => setState(prev => ({ ...prev, billingAddressOption: 'same' }))}
                      className="h-4 w-4 text-Primarycolor focus:ring-Primarycolor mr-2"
                      aria-label="Use same address as shipping"
                    />
                    <span className="text-sm font-medium text-Accent font-Jost">Same as shipping address</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="billingAddressOption"
                      value="different"
                      checked={state.billingAddressOption === 'different'}
                      onChange={() => setState(prev => ({ ...prev, billingAddressOption: 'different' }))}
                      className="h-4 w-4 text-Primarycolor focus:ring-Primarycolor mr-2"
                      aria-label="Use different billing address"
                    />
                    <span className="text-sm font-medium text-Accent font-Jost">Use a different billing address</span>
                  </label>
                </div>
              </div>

              {state.billingAddressOption === 'same' ? (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-Primarycolor font-Manrope mb-2">Billing Address (Same as Shipping)</h4>
                      {selectedShippingAddress ? (
                        <div className="text-sm text-Accent font-Jost">
                          <p>{selectedShippingAddress.address_line_1}</p>
                          {selectedShippingAddress.address_line_2 && <p>{selectedShippingAddress.address_line_2}</p>}
                          <p>{selectedShippingAddress.city}, {selectedShippingAddress.state} {selectedShippingAddress.zip_code}</p>
                          <p>{selectedShippingAddress.country}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 font-Jost">Please select a shipping address first</p>
                      )}
                    </div>
                    <button
                      onClick={copyShippingToBilling}
                      className="ml-4 p-2 bg-Primarycolor text-white rounded-lg hover:bg-gray-800 transition-colors"
                      title="Copy shipping address to billing address"
                      aria-label="Copy shipping address to billing address"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {state.billingAddresses.length > 0 ? (
                    <div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-Accent mb-1 font-Jost" htmlFor="billing-address-select">Select Billing Address</label>
                        <select
                          id="billing-address-select"
                          value={state.billingAddressId ?? ''}
                          onChange={(e) => setState(prev => ({ ...prev, billingAddressId: String(e.target.value) }))}
                          className="w-full p-2 border border-gray-300 rounded-md font-Jost"
                          aria-required="true"
                        >
                          {state.billingAddresses.map((address) => (
                            <option key={address.id} value={String(address.id)}>
                              {address.full_name}, {address.address_line_1}, {address.city}, {address.country}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => setState(prev => ({ ...prev, showBillingForm: true }))}
                          className="text-Primarycolor hover:text-gray-800 text-sm flex items-center font-Jost"
                          disabled={state.loading}
                          aria-label="Add new billing address"
                        >
                          Add New Address
                        </button>
                        <button
                          onClick={() => handleDeleteAddress('billing-addresses', state.billingAddressId)}
                          className="text-red-600 hover:text-red-800 text-sm flex items-center font-Jost"
                          disabled={state.loading}
                          aria-label="Delete selected billing address"
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Delete Address
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <button
                        onClick={() => setState(prev => ({ ...prev, showBillingForm: !prev.showBillingForm }))}
                        className="text-Accent hover:text-Primarycolor text-sm mb-4 font-Jost"
                        aria-label={state.showBillingForm ? 'Cancel adding billing address' : 'Add billing address'}
                      >
                        {state.showBillingForm ? 'Cancel' : 'Add Billing Address'}
                      </button>
                      {state.showBillingForm && (
                        <BillingAddressForm
                          address={{ state: billingForm, setState: setBillingForm }}
                          onSubmit={handleBillingSubmit}
                          onCancel={() => setState(prev => ({ ...prev, showBillingForm: false }))}
                          formErrors={state.formErrors}
                          setFormErrors={(errors) => setState(prev => ({ ...prev, formErrors: errors }))}
                          actionLoading={state.loading}
                        />
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-5 md:p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-Primarycolor mb-4 font-Manrope">Order Note (optional)</h3>
              <textarea
                value={state.orderNote}
                onChange={(e) => setState(prev => ({ ...prev, orderNote: e.target.value }))}
                maxLength={500}
                placeholder="Add a note to your order (e.g., special instructions)"
                className="w-full p-2 border border-gray-300 rounded-md font-Jost"
                aria-label="Order note"
              />
              <p className="text-sm text-Accent font-Jost">Characters left: {500 - state.orderNote.length}/500</p>
            </div>

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
                        ${state.shippingMethod?.id === option.id
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
                            checked={state.shippingMethod?.id === option.id}
                            onChange={() => setState(prev => ({ ...prev, shippingMethod: option }))}
                            className="mt-1 h-4 w-4 text-Primarycolor focus:ring-2 focus:ring-Primarycolor"
                            aria-label={`Select ${option.method} shipping`}
                          />

                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                              <div className="flex items-center gap-3">
                                <div className={`
                                  p-2 rounded-lg
                                  ${state.shippingMethod?.id === option.id
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
                                    minimumFractionDigits: 2
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
                      {state.shippingMethod?.id === option.id && (
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
              {state.formErrors.shippingMethod && (
                <p className="text-sm text-red-600 mt-2 font-Jost">{state.formErrors.shippingMethod}</p>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="p-6 bg-white rounded-lg shadow-md sticky top-24">
              <h3 className="text-xl font-semibold text-Primarycolor mb-6 font-Manrope">Order Summary</h3>
              <div className="space-y-4 mb-6">
                {state.cart.items.map((cartItem, index) => {
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
                                minimumFractionDigits: 2
                              })} each
                            </span>
                            <span className="font-semibold text-Primarycolor font-Manrope">
                              {itemTotal.toLocaleString('en-NG', {
                                style: 'currency',
                                currency: 'NGN',
                                minimumFractionDigits: 2
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center mb-3">
                  <Gift className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="font-medium text-gray-900 font-Jost">Have a coupon code?</h3>
                </div>

                {state.appliedCoupon ? (
                  <div className="bg-green-50 rounded-lg p-3 mb-3 border border-green-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                          <span className="font-medium text-green-800 font-Jost">{state.appliedCoupon.code} applied</span>
                        </div>
                        <p className="text-sm text-green-700 font-Jost mt-1">
                          You saved {state.appliedCoupon.type === 'percentage'
                            ? `${state.appliedCoupon.value}% (₦${state.appliedCoupon.amount.toFixed(2)})`
                            : `₦${state.appliedCoupon.amount.toFixed(2)}`}
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
                      value={state.couponCode}
                      onChange={(e) => setState(prev => ({ ...prev, couponCode: e.target.value.toUpperCase() }))}
                      placeholder="Enter coupon code"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 font-Jost"
                      disabled={state.couponLoading}
                      aria-label="Coupon code"
                    />
                    <button
                      type="submit"
                      disabled={state.couponLoading || !state.couponCode.trim()}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-Jost"
                      aria-label="Apply coupon code"
                    >
                      {state.couponLoading ? 'Applying...' : 'Apply'}
                    </button>
                  </form>
                )}

                {state.couponError && (
                  <div className="mt-2 flex items-center text-sm text-red-600 font-Jost">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {state.couponError}
                  </div>
                )}

                {state.couponSuccess && !state.appliedCoupon && (
                  <div className="mt-2 flex items-center text-sm text-green-600 font-Jost">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {state.couponSuccess}
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-Primarycolor mb-3 font-Manrope">Payment Method</h4>
                <div className="space-y-2">
                  <label
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                      state.paymentMethod === 'card' ? 'border-Primarycolor bg-gray-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={state.paymentMethod === 'card'}
                      onChange={() => setState(prev => ({ ...prev, paymentMethod: 'card' }))}
                      className="h-4 w-4 text-Primarycolor focus:ring-Primarycolor mr-3"
                      aria-label="Pay with card"
                    />
                    <span className="text-sm text-Accent font-Jost">Card Payment</span>
                  </label>
                  <label
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                      state.paymentMethod === 'bank' ? 'border-Primarycolor bg-gray-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank"
                      checked={state.paymentMethod === 'bank'}
                      onChange={() => setState(prev => ({ ...prev, paymentMethod: 'bank' }))}
                      className="h-4 w-4 text-Primarycolor focus:ring-Primarycolor mr-3"
                      aria-label="Pay with bank transfer"
                    />
                    <span className="text-sm text-Accent font-Jost">Bank Transfer</span>
                  </label>
                  <label
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                      state.paymentMethod === 'bitcoin' ? 'border-Primarycolor bg-gray-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bitcoin"
                      checked={state.paymentMethod === 'bitcoin'}
                      onChange={() => setState(prev => ({ ...prev, paymentMethod: 'bitcoin' }))}
                      className="h-4 w-4 text-Primarycolor focus:ring-Primarycolor mr-3"
                      aria-label="Pay with Bitcoin/Crypto"
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
                        minimumFractionDigits: 2
                      })}
                    </span>
                  </div>

                  {user?.first_order && displayFirstOrderDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 font-Jost">
                      <span>First Order Discount (5%)</span>
                      <span>
                        -{displayFirstOrderDiscount.toLocaleString('en-NG', {
                          style: 'currency',
                          currency: 'NGN',
                          minimumFractionDigits: 2
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
                          minimumFractionDigits: 2
                        })}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm text-Accent font-Jost">
                    <span>Shipping</span>
                    <span>
                      {isNigeria ? (
                        (state.shippingMethod?.total_cost || 0).toLocaleString('en-NG', {
                          style: 'currency',
                          currency: 'NGN',
                          minimumFractionDigits: 2
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
                          minimumFractionDigits: 2
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
                        minimumFractionDigits: 2
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

                {user?.first_order && displayFirstOrderDiscount > 0 && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-700 font-Jost">
                      🎉 <strong>Congratulations!</strong> You've received a 5% discount on your first order.
                    </p>
                  </div>
                )}

                {state.appliedCoupon && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-700 font-Jost">
                      🎁 <strong>Coupon Applied!</strong> You saved {state.appliedCoupon.type === 'percentage'
                        ? `${state.appliedCoupon.value}%`
                        : `₦${state.appliedCoupon.amount.toFixed(2)}`} with coupon code {state.appliedCoupon.code}.
                    </p>
                  </div>
                )}

                <button
                  onClick={handlePayment}
                  className="mt-6 w-full bg-Primarycolor text-Secondarycolor text-sm py-4 px-4 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-Manrope font-semibold"
                  disabled={state.loading || !state.shippingAddressId || !state.billingAddressId || (isNigeria && !state.shippingMethod)}
                  aria-label="Place order"
                >
                  {state.loading ? (
                    <div className="flex items-center justify-center">
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                      Processing...
                    </div>
                  ) : (
                    'Place Order'
                  )}
                </button>

                {state.paymentMethod === 'bitcoin' && (
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