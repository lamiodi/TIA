import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, AlertCircle, CheckCircle, Trash2, Bitcoin, MessageCircle, Smartphone, Truck, Clock, MapPin, Gift, X, Copy, User, Mail, Lock, Phone } from 'lucide-react';
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
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [showBitcoinInstructions, setShowBitcoinInstructions] = useState(false);
  
  // Guest user form state - now part of the main checkout form
  const [guestForm, setGuestForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: ''
  });
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isGuestConversion, setIsGuestConversion] = useState(false); // Track if this is a guest conversion
  
  const [shippingForm, setShippingForm] = useState({
    title: '',
    address_line_1: '',
    address_line_2: '',
    landmark: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'Nigeria',
    phone_number: user?.phone_number || '',
  });
  const [billingForm, setBillingForm] = useState({
    full_name: user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    address_line_1: '',
    address_line_2: '',
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
  
  // Check if guest cart has items
  const hasGuestCartItems = () => {
    const guestCart = localStorage.getItem('guestCart');
    if (!guestCart) return false;
    try {
      const parsedCart = JSON.parse(guestCart);
      return parsedCart.items && parsedCart.items.length > 0;
    } catch (err) {
      console.error('Error parsing guest cart:', err);
      return false;
    }
  };
  
  // Create temporary user for guest checkout
  const createTemporaryUser = async () => {
    try {
      // Validate form data
      if (!guestForm.first_name || !guestForm.last_name || !guestForm.email || !guestForm.phone_number) {
        setError('Please fill in all required fields');
        return false;
      }
      
      // Create temporary user
      const response = await axios.post(`${API_BASE_URL}/api/auth/temporary-user`, {
        first_name: guestForm.first_name,
        last_name: guestForm.last_name,
        email: guestForm.email,
        phone_number: guestForm.phone_number
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const { token, user, isTemporary } = response.data;
      
      // Store the token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('isTemporaryUser', isTemporary ? 'true' : 'false');
      
      // Update auth context
      if (login) {
        login({ token, user });
      }
      
      // Set guest conversion flag
      setIsGuestConversion(true);
      
      return true;
    } catch (error) {
      console.error('Guest registration error:', error);
      let errorMessage = 'Failed to create account';
      
      if (error.response) {
        errorMessage = error.response.data.error || errorMessage;
      } else if (error.request) {
        errorMessage = 'No response from server. Please try again.';
      } else {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  };
  
  // Transfer guest cart to user account
  const transferGuestCart = async () => {
    const guestCart = localStorage.getItem('guestCart');
    if (guestCart) {
      try {
        const token = getToken();
        const parsedCart = JSON.parse(guestCart);
        const userId = getUserId();
        
        // Add each item to the user's cart with correct body
        for (const item of parsedCart.items) {
          const body = {
            user_id: userId,
            product_type: item.product_type,
            quantity: item.quantity,
          };

          if (item.product_type === 'single') {
            body.variant_id = item.variant_id;
            body.size_id = item.size_id;
          } else if (item.product_type === 'bundle') {
            body.bundle_id = item.bundle_id;
            body.items = item.items;
          }

          await axios.post(
            `${API_BASE_URL}/api/cart`,
            body,
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
        
        // Clear the guest cart
        localStorage.removeItem('guestCart');
        console.log('Guest cart transferred successfully');
      } catch (error) {
        console.error('Error transferring guest cart:', error);
      }
    }
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
    console.log('Calculating first order discount:', {
      userFirstOrder: user?.first_order,
      isGuestConversion,
      currentSubtotal,
      userDataRefreshed,
      refreshCount
    });
    
    // Only apply first order discount if:
    // 1. User has first_order = true
    // 2. This is NOT a guest conversion (guests who create account don't get discount)
    if (user?.first_order && !isGuestConversion && currentSubtotal > 0) {
      const discountAmount = Number((currentSubtotal * 0.05).toFixed(2));
      setFirstOrderDiscount(discountAmount);
      console.log('Applied first order discount:', discountAmount);
    } else {
      setFirstOrderDiscount(0);
      console.log('No first order discount applied', {
        firstOrder: user?.first_order,
        isGuestConversion,
        hasItems: currentSubtotal > 0
      });
    }
  }, [user?.first_order, isGuestConversion, cart.subtotal, userDataRefreshed, refreshCount]);
  
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
        `${API_BASE_URL}/api/admin/discounts/validate`,
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
  
  const handleShippingSubmit = async (data) => {
    try {
      setLoading(true);
      if (!isAuthenticated()) {
        const created = await createTemporaryUser();
        if (!created) {
          setLoading(false);
          return;
        }
        await transferGuestCart();
        await refreshUserData();
        await fetchCartAndAddresses();
      }

      const userId = getUserId();
      const token = getToken();
      const payload = { user_id: userId, ...data };
      const response = await axios.post(
        `${API_BASE_URL}/api/addresses`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // normalize and prepend new address so it becomes the selected default
      const created = response.data?.data || response.data;
      setShippingAddresses(prev => [created, ...prev]);
      setShippingAddressId(String(created.id));
      
      // If billing address option is 'same', update billing address to match
      if (billingAddressOption === 'same') {
        // Create a billing address object from the shipping address
        const billingAddress = {
          full_name: user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : '',
          email: user?.email || '',
          phone_number: data.phone_number,
          address_line_1: data.address_line_1,
          address_line_2: data.address_line_2,
          city: data.city,
          state: data.state,
          zip_code: data.zip_code,
          country: data.country,
        };
        
        // Try to find if this billing address already exists
        const matchingBillingAddress = billingAddresses.find(addr => 
          addr.address_line_1 === billingAddress.address_line_1 &&
          addr.city === billingAddress.city &&
          addr.state === billingAddress.state
        );
        
        if (matchingBillingAddress) {
          setBillingAddressId(String(matchingBillingAddress.id));
        } else {
          // Create a new billing address
          try {
            const billingResponse = await axios.post(
              `${API_BASE_URL}/api/billing-addresses`,
              { user_id: userId, ...billingAddress },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            const newBillingAddress = billingResponse.data?.data || billingResponse.data;
            setBillingAddresses(prev => [newBillingAddress, ...prev]);
            setBillingAddressId(String(newBillingAddress.id));
          } catch (err) {
            console.error('Error creating billing address:', err);
            toast.error('Failed to create billing address from shipping address');
          }
        }
      }
      
      setShowShippingForm(false);
      setFormErrors({});
      setSuccess('Shipping address added successfully.');
      toast.success('Shipping address added');
    } catch (err) {
      const errorMessage = err.response?.data?.details || err.response?.data?.error || err.message;
      setError(`Failed to add shipping address: ${errorMessage}`);
      toast.error(`Failed to add shipping address: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleBillingSubmit = async (data) => {
    try {
      setLoading(true);
      if (!isAuthenticated()) {
        const created = await createTemporaryUser();
        if (!created) {
          setLoading(false);
          return;
        }
        await transferGuestCart();
        await refreshUserData();
        await fetchCartAndAddresses();
      }

      const userId = getUserId();
      const token = getToken();
      const payload = { user_id: userId, ...data };
      const response = await axios.post(
        `${API_BASE_URL}/api/billing-addresses`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const created = response.data?.data || response.data;
      setBillingAddresses(prev => [created, ...prev]);
      setBillingAddressId(String(created.id));
      setShowBillingForm(false);
      setFormErrors({});
      setSuccess('Billing address added successfully.');
      toast.success('Billing address added');
    } catch (err) {
      const errorMessage = err.response?.data?.details || err.response?.data?.error || err.message;
      setError(`Failed to add billing address: ${errorMessage}`);
      toast.error(`Failed to add billing address: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteAddress = async (type, addressId) => {
    try {
      setLoading(true);
      if (!isAuthenticated()) {
        const created = await createTemporaryUser();
        if (!created) {
          setLoading(false);
          return;
        }
        await transferGuestCart();
        await refreshUserData();
        await fetchCartAndAddresses();
      }

      const token = getToken();
  
      // 1. Delete address from backend
      await axios.delete(`${API_BASE_URL}/api/${type}/${addressId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (type === 'addresses') {
        // Remove from local state
        const remaining = shippingAddresses.filter(addr => String(addr.id) !== String(addressId));
        setShippingAddresses(remaining);
  
        // If deleted address was selected, pick first remaining or null
        if (String(shippingAddressId) === String(addressId)) {
          const newShippingId = remaining.length ? String(remaining[0].id) : null;
          setShippingAddressId(newShippingId);
  
          if (billingAddressOption === 'same' && remaining.length > 0) {
            const newShippingAddress = remaining[0];
  
            // Check for matching billing address
            const matchingBillingAddress = billingAddresses.find(addr =>
              addr.address_line_1 === newShippingAddress.address_line_1 &&
              addr.city === newShippingAddress.city &&
              addr.state === newShippingAddress.state
            );
  
            if (matchingBillingAddress) {
              setBillingAddressId(String(matchingBillingAddress.id));
            } else {
              // Create new billing address from shipping
              const billingAddress = {
                full_name: user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : '',
                email: user?.email || '',
                phone_number: newShippingAddress.phone_number,
                address_line_1: newShippingAddress.address_line_1,
                address_line_2: newShippingAddress.address_line_2,
                city: newShippingAddress.city,
                state: newShippingAddress.state,
                zip_code: newShippingAddress.zip_code,
                country: newShippingAddress.country,
              };
  
              try {
                const billingResponse = await axios.post(
                  `${API_BASE_URL}/api/billing-addresses`,
                  { user_id: getUserId(), ...billingAddress },
                  { headers: { Authorization: `Bearer ${token}` } }
                );
  
                const newBillingAddress = billingResponse.data?.data || billingResponse.data;
                setBillingAddresses(prev => [newBillingAddress, ...prev]);
                setBillingAddressId(String(newBillingAddress.id));
              } catch (err) {
                console.error('Error creating billing address:', err);
              }
            }
          }
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
  
  // Copy shipping address to billing address
  const copyShippingToBilling = () => {
    const selectedShippingAddress = shippingAddresses.find(addr => addr.id.toString() === shippingAddressId);
    if (!selectedShippingAddress) {
      toast.error('Please select a shipping address first');
      return;
    }
    
    // Create a billing address object from the shipping address
    const billingAddress = {
      full_name: user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : '',
      email: user?.email || '',
      phone_number: selectedShippingAddress.phone_number,
      address_line_1: selectedShippingAddress.address_line_1,
      address_line_2: selectedShippingAddress.address_line_2,
      city: selectedShippingAddress.city,
      state: selectedShippingAddress.state,
      zip_code: selectedShippingAddress.zip_code,
      country: selectedShippingAddress.country,
    };
    
    // Try to find if this billing address already exists
    const matchingBillingAddress = billingAddresses.find(addr => 
      addr.address_line_1 === billingAddress.address_line_1 &&
      addr.city === billingAddress.city &&
      addr.state === billingAddress.state
    );
    
    if (matchingBillingAddress) {
      setBillingAddressId(String(matchingBillingAddress.id));
      toast.success('Billing address updated to match shipping address');
    } else {
      // Create a new billing address
      const createBillingAddress = async () => {
        try {
          setLoading(true);
          const userId = getUserId();
          const token = getToken();
          
          const response = await axios.post(
            `${API_BASE_URL}/api/billing-addresses`,
            { user_id: userId, ...billingAddress },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          const newBillingAddress = response.data?.data || response.data;
          setBillingAddresses(prev => [newBillingAddress, ...prev]);
          setBillingAddressId(String(newBillingAddress.id));
          toast.success('Billing address created to match shipping address');
        } catch (err) {
          const errorMessage = err.response?.data?.details || err.response?.data?.error || err.message;
          setError(`Failed to create billing address: ${errorMessage}`);
          toast.error(`Failed to create billing address: ${errorMessage}`);
        } finally {
          setLoading(false);
        }
      };
      
      createBillingAddress();
    }
  };
  
  // Fetch cart and addresses function
  const fetchCartAndAddresses = async () => {
    setLoading(true);
    try {
      const userId = getUserId();
      const token = getToken();
      
      // Transfer guest cart if exists
      await transferGuestCart();
      
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

  const loadGuestCartForCheckout = () => {
    const guestCart = localStorage.getItem('guestCart');
    if (guestCart) {
      const parsedCart = JSON.parse(guestCart);
      setCart(parsedCart);
      console.log('Loaded guest cart for checkout');
    } else {
      setCart({ cartId: null, subtotal: 0, tax: 0, total: 0, items: [] });
    }
  };
  
  useEffect(() => {
    const fetchData = async () => {
      if (authLoading || contextLoading) return;

      if (isAuthenticated() && user) {
        await fetchCartAndAddresses();
      } else {
        loadGuestCartForCheckout();
      }
    };

    fetchData();
  }, [user, authLoading, contextLoading]);
  
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);
  
  const selectedShippingAddress = shippingAddresses.find(addr => addr.id.toString() === shippingAddressId);
  const addressCountry = selectedShippingAddress ? selectedShippingAddress.country : country;
  const isNigeria = addressCountry.toLowerCase() === 'nigeria';
  const selectedBillingAddress = billingAddresses.find(addr => addr.id.toString() === billingAddressId);
  
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
  
  const handlePayment = async () => {
    // If user is not authenticated, create temporary account first
    if (!isAuthenticated()) {
      setIsCreatingAccount(true);
      
      // Create temporary user
      const userCreated = await createTemporaryUser();
      
      if (!userCreated) {
        setIsCreatingAccount(false);
        return;
      }
      
      // Transfer guest cart
      await transferGuestCart();
      
      // Refresh user data
      await refreshUserData();
      setUserDataRefreshed(true);

      // Fetch updated cart and addresses
      await fetchCartAndAddresses();
      
      setIsCreatingAccount(false);
    }
    
    // Validate all required fields
    if (!shippingAddressId) {
      setError('Please select a shipping address.');
      toast.error('Please select a shipping address.');
      return;
    }
  
    if (!billingAddressId) {
      setError('Please select a billing address.');
      toast.error('Please select a billing address.');
      return;
    }
  
    if (isNigeria && !shippingMethod) {
      setError('Please select a shipping method.');
      toast.error('Please select a shipping method.');
      return;
    }
  
    if (!cart?.items?.length) {
      setError('Cart is empty.');
      toast.error('Cart is empty.');
      return;
    }
  
    setLoading(true);
    try {
      const selectedShippingAddress = shippingAddresses.find(addr => addr.id.toString() === shippingAddressId);
      if (!selectedShippingAddress) {
        throw new Error('Selected shipping address not found');
      }
      const addressCountry = selectedShippingAddress.country;
      const isNigeria = addressCountry.toLowerCase() === 'nigeria';
  
      const orderCurrency = 'NGN'; // Force NGN due to Paystack limitation
      const userId = getUserId();
      const token = getToken();
      
      // Calculate amounts in NGN
      const baseSubtotal = Number(cart?.subtotal) || 0;
      const baseFirstOrderDiscount = (user?.first_order && !isGuestConversion) ? Number((baseSubtotal * 0.05).toFixed(2)) : 0;
      const baseCouponDiscount = couponDiscount;
      const baseTotalDiscount = Number((baseFirstOrderDiscount + baseCouponDiscount).toFixed(2));
      const baseFinalDiscount = Math.min(baseTotalDiscount, baseSubtotal);
      const baseTax = isNigeria ? 0 : Number((baseSubtotal * 0.05).toFixed(2));
      const baseShippingCost = isNigeria ? shippingMethod?.total_cost || 0 : 0;
      const baseDiscountedSubtotal = Number((baseSubtotal - baseFinalDiscount).toFixed(2));
      const baseTotal = Number((baseDiscountedSubtotal + baseTax + baseShippingCost).toFixed(2));
      
      const orderData = {
        user_id: userId,
        address_id: parseInt(shippingAddressId),
        billing_address_id: parseInt(billingAddressId),
        cart_id: cart.cartId,
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
  
      const orderResponse = await axios.post(`${API_BASE_URL}/api/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      console.log('Order response:', orderResponse.data);
  
      const orderId = orderResponse.data.order?.id || orderResponse.data.id || orderResponse.data.data?.id;
      if (!orderId) {
        console.error('Order ID not found in response:', orderResponse.data);
        throw new Error('Order ID not found in response');
      }
  
      // Update user's first_order status if applicable
      if (user?.first_order && !isGuestConversion) {
        try {
          console.log('Updating first_order status for user:', getUserId());
          
          const response = await axios({
            method: 'PATCH',
            url: `${API_BASE_URL}/api/auth/users/${getUserId()}`, 
            data: { first_order: false },
            headers: { Authorization: `Bearer ${getToken()}` }
          });
          
          console.log('Update response:', response.data);
          
          if (response.data && response.data.success) {
            // Refresh user data from server using our custom hook
            const updatedUser = await refreshUserData();
            
            if (updatedUser && !updatedUser.first_order) {
              console.log('User data refreshed, first_order is now false');
            } else {
              console.warn('User data refresh failed or first_order is still true');
            }
          }
        } catch (err) {
          console.error('Failed to update first_order status:', err);
          
          // Only show error toast if it's a server error
          if (err.response) {
            toast.error('We had trouble updating your account. Please contact support if you see this discount again.');
          }
        }
      }
  
      const paymentCurrency = 'NGN';
      const paymentAmount = baseTotal;
  
      const callbackUrl = `${window.location.origin}/thank-you?reference=${orderData.reference}&orderId=${orderId}`;
      
      const paymentData = {
        order_id: orderId,
        reference: orderData.reference,
        email: selectedBillingAddress?.email || billingForm.email || user.email,
        amount: Math.round(paymentAmount * 100), // Convert to kobo
        currency: paymentCurrency,
        callback_url: callbackUrl,
      };
  
      console.log('Payment payload:', paymentData);
  
      const paymentResponse = await axios.post(
        `${API_BASE_URL}/api/paystack/initialize`,
        paymentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      console.log('Payment response:', paymentResponse.data);
      
      let paymentInfo = paymentResponse.data;
      if (paymentResponse.data.data) {
        paymentInfo = paymentResponse.data.data;
      }
      
      const accessCode = paymentInfo.access_code;
      const authorizationUrl = paymentInfo.authorization_url;
      
      if (accessCode) {
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
            // Use navigate instead of window.location.href
            navigate(`/thank-you?reference=${orderData.reference}&orderId=${orderId}`);
          },
          onClose: () => {
            // Check if payment was completed by verifying with backend
            const checkPaymentStatus = async () => {
              try {
                const token = getToken();
                const paymentResponse = await axios.post(
                  `${API_BASE_URL}/api/paystack/verify`,
                  { reference: orderData.reference },
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                
                if (paymentResponse.data.order?.payment_status === 'completed') {
                  toast.success('Payment was successful!');
                  navigate(`/thank-you?reference=${orderData.reference}&orderId=${orderId}`);
                } else {
                  toast.info('Payment window closed. You can complete payment later from your orders page.');
                  navigate(`/orders/${orderId}`);
                }
              } catch (err) {
                console.error('Error checking payment status:', err);
                toast.info('Payment window closed. You can complete payment later from your orders page.');
                navigate(`/orders/${orderId}`);
              } finally {
                localStorage.removeItem('pendingOrderId'); // Clear pendingOrderId
              }
            };
            
            checkPaymentStatus();
          }
        });
      } else if (authorizationUrl) {
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
      if (err.response?.data?.code === 'unsupported_currency') {
        setError('Payments in USD are not supported at this time. Please select a shipping address in Nigeria or contact support.');
        toast.error('Payments in USD are not supported. Please select a Nigeria address or contact support.');
      } else {
        setError(`Failed to process order: ${errorMessage}`);
        toast.error(`Failed to process order: ${errorMessage}`);
      }
      localStorage.removeItem('pendingOrderId'); // Clear pendingOrderId on error
    } finally {
      setLoading(false);
    }
  };
  
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
    })}\n- Currency: NGN\n- Order Reference: order_${getUserId()}_${Date.now()}\n\nI have attached a screenshot of my checkout for your reference.`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=${encodedMessage}`, '_blank');
    toast.success('Opening WhatsApp to complete your Bitcoin payment...');
  };
  
  if (authLoading || contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-gray-600">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-sm font-Jost">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-gray-600">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-sm font-Jost">Loading checkout data...</p>
        </div>
      </div>
    );
  }
  
  // Updated empty cart handling
  if (!cart?.items?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-600 py-8 font-Jost">
          Your cart is empty. Please add items to proceed.
          <Link to="/cart" className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-5 w-5 mr-2" /> Go to Cart
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="min-h-screen bg-gray-50 typography"
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
        <Link to="/cart" className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-6 font-Jost">
          <ArrowLeft className="h-5 w-5 mr-1" /> Back to Cart
        </Link>
        <h2 className="text-3xl font-bold text-gray-900 mb-8 font-Manrope">Checkout</h2>
        
        {/* Debug Panel - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-bold text-yellow-800 mb-2">Debug Info:</h4>
            <p className="text-sm text-yellow-700">
              User ID: {user?.id}<br />
              First Order (DB): {user?.first_order?.toString()}<br />
              Is Guest Conversion: {isGuestConversion?.toString()}<br />
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
                <h3 className="text-xl font-bold text-gray-900 flex items-center font-Manrope">
                  <Bitcoin className="h-5 w-5 mr-2 text-orange-500" />
                  Bitcoin Payment Instructions
                </h3>
                <button 
                  onClick={() => setShowBitcoinInstructions(false)}
                  className="text-gray-500 hover:text-gray-700"
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
                
                <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-600 font-Jost">
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
                    className="flex-1 bg-gray-200 text-gray-900 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors font-Jost"
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
            {/* Guest Information Section - Only show if user is not authenticated */}
            {!isAuthenticated() && (
              <div className="p-5 md:p-6 bg-white rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 font-Manrope">Your Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 font-Jost">
                      First Name
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="first_name"
                        name="first_name"
                        type="text"
                        required
                        value={guestForm.first_name}
                        onChange={(e) => setGuestForm({...guestForm, first_name: e.target.value})}
                        className="pl-10 block w-full border border-gray-300 rounded-md p-3 focus:ring-blue-500 focus:border-blue-500 font-Jost"
                        placeholder="John"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 font-Jost">
                      Last Name
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="last_name"
                        name="last_name"
                        type="text"
                        required
                        value={guestForm.last_name}
                        onChange={(e) => setGuestForm({...guestForm, last_name: e.target.value})}
                        className="pl-10 block w-full border border-gray-300 rounded-md p-3 focus:ring-blue-500 focus:border-blue-500 font-Jost"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 font-Jost">
                      Email Address
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={guestForm.email}
                        onChange={(e) => setGuestForm({...guestForm, email: e.target.value})}
                        className="pl-10 block w-full border border-gray-300 rounded-md p-3 focus:ring-blue-500 focus:border-blue-500 font-Jost"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 font-Jost">
                      Phone Number
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="phone_number"
                        name="phone_number"
                        type="tel"
                        required
                        value={guestForm.phone_number}
                        onChange={(e) => setGuestForm({...guestForm, phone_number: e.target.value})}
                        className="pl-10 block w-full border border-gray-300 rounded-md p-3 focus:ring-blue-500 focus:border-blue-500 font-Jost"
                        placeholder="08012345678"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-700 font-Jost">
                      <strong>Note:</strong> An account will be created automatically with the information you provide. You'll receive order updates via email.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-5 md:p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 font-Manrope">Shipping Address</h3>
              
              {shippingAddresses.length > 0 ? (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-Jost">Select Shipping Address</label>
                    <select
                      value={shippingAddressId ?? ''}
                      onChange={(e) => setShippingAddressId(String(e.target.value))}
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
                      onClick={() => setShowShippingForm(true)}
                      className="text-gray-900 hover:text-gray-800 text-sm flex items-center font-Jost"
                      disabled={loading}
                    >
                      Add New Address
                    </button>
                    <button
                      onClick={() => handleDeleteAddress('addresses', shippingAddressId)}
                      className="text-red-600 hover:text-red-800 text-sm flex items-center font-Jost"
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Delete Address
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => setShowShippingForm(!showShippingForm)}
                    className="text-gray-600 hover:text-gray-900 text-sm mb-4 font-Jost"
                  >
                    {showShippingForm ? 'Cancel' : 'Add Shipping Address'}
                  </button>
                  {showShippingForm && (
                    <ShippingAddressForm
                      address={{ state: shippingForm, setState: setShippingForm }}
                      onSubmit={handleShippingSubmit}
                      onCancel={() => setShowShippingForm(false)}
                      formErrors={formErrors}
                      setFormErrors={setFormErrors}
                      actionLoading={loading}
                    />
                  )}
                </div>
              )}
            </div>
            
            <div className="p-5 md:p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 font-Manrope">Billing Address</h3>
              
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
                      className="h-4 w-4 text-gray-900 focus:ring-gray-900 mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700 font-Jost">Same as shipping address</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="billingAddressOption"
                      value="different"
                      checked={billingAddressOption === 'different'}
                      onChange={() => setBillingAddressOption('different')}
                      className="h-4 w-4 text-gray-900 focus:ring-gray-900 mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700 font-Jost">Use a different billing address</span>
                  </label>
                </div>
              </div>
              
              {billingAddressOption === 'same' ? (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 font-Manrope mb-2">Billing Address (Same as Shipping)</h4>
                      {selectedShippingAddress ? (
                        <div className="text-sm text-gray-600 font-Jost">
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
                      className="ml-4 p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                      title="Copy shipping address to billing address"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {billingAddresses.length > 0 ? (
                    <div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1 font-Jost">Select Billing Address</label>
                        <select
                          value={billingAddressId ?? ''}
                          onChange={(e) => setBillingAddressId(String(e.target.value))}
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
                          onClick={() => setShowBillingForm(true)}
                          className="text-gray-900 hover:text-gray-800 text-sm flex items-center font-Jost"
                          disabled={loading}
                        >
                          Add New Address
                        </button>
                        <button
                          onClick={() => handleDeleteAddress('billing-addresses', billingAddressId)}
                          className="text-red-600 hover:text-red-800 text-sm flex items-center font-Jost"
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Delete Address
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <button
                        onClick={() => setShowBillingForm(!showBillingForm)}
                        className="text-gray-600 hover:text-gray-900 text-sm mb-4 font-Jost"
                      >
                        {showBillingForm ? 'Cancel' : 'Add Billing Address'}
                      </button>
                      {showBillingForm && (
                        <BillingAddressForm
                          address={{ state: billingForm, setState: setBillingForm }}
                          onSubmit={handleBillingSubmit}
                          onCancel={() => setShowBillingForm(false)}
                          formErrors={formErrors}
                          setFormErrors={setFormErrors}
                          actionLoading={loading}
                        />
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="p-5 md:p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 font-Manrope">Order Note (optional)</h3>
              <textarea
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                maxLength={500}
                placeholder="Add a note to your order (e.g., special instructions)"
                className="w-full p-2 border border-gray-300 rounded-md font-Jost"
              />
              <p className="text-sm text-gray-600 font-Jost">Characters left: {500 - orderNote.length}/500</p>
            </div>
            
            <div className="p-5 md:p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 font-Manrope">
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
                          ? 'border-gray-900 bg-gradient-to-r from-gray-50 to-blue-50 shadow-md' 
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
                            className="mt-1 h-4 w-4 text-gray-900 focus:ring-2 focus:ring-gray-900"
                          />
                          
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                              <div className="flex items-center gap-3">
                                <div className={`
                                  p-2 rounded-lg
                                  ${shippingMethod?.id === option.id 
                                    ? 'bg-gray-900 text-white' 
                                    : 'bg-gray-100 text-gray-600'
                                  }
                                `}>
                                  {getShippingIcon(option.icon)}
                                </div>
                                <div>
                                  <h4 className="font-bold text-gray-900 text-sm sm:text-base font-Manrope">
                                    {option.method}
                                  </h4>
                                  <p className="text-xs sm:text-sm text-gray-600 font-Jost">
                                    {option.description}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-gray-900 text-lg font-Manrope">
                                  {option.total_cost.toLocaleString('en-NG', {
                                    style: 'currency',
                                    currency: 'NGN',
                                    minimumFractionDigits: 2,
                                  })}
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 flex items-center gap-2 text-xs sm:text-sm text-gray-600 font-Jost">
                              <Clock className="h-4 w-4" />
                              <span>{option.estimated_delivery}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {shippingMethod?.id === option.id && (
                        <div className="absolute top-3 right-3">
                          <div className="bg-gray-900 text-white rounded-full p-1">
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
                      <h4 className="font-semibold text-gray-900 font-Manrope">
                        International Shipping to {addressCountry}
                      </h4>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 font-Jost mb-2">
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
          
          <div className="lg:col-span-1">
            <div className="p-6 bg-white rounded-lg shadow-md sticky top-24">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 font-Manrope">Order Summary</h3>
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
                          <div className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                            {cartItem.quantity || 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate font-Manrope">
                            {item.name || 'Unknown Item'}
                          </h4>
                          {item.is_product && (item.color || item.size) && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {item.color && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs text-gray-600 font-Jost">
                                  {item.color || item.color_name}
                                </span>
                              )}
                              {item.size && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs text-gray-600 font-Jost">
                                  {item.size || item.size_name}
                                </span>
                              )}
                            </div>
                          )}
                          {!item.is_product && Array.isArray(item.items) && item.items.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-600 mb-1 font-Jost">Bundle includes:</p>
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
                                    <span className="text-xs text-gray-600 font-Jost truncate w-full text-center">
                                      {bundleItem.color_name}
                                    </span>
                                    <span className="text-xs text-gray-600 font-Jost truncate w-full text-center">
                                      {bundleItem.size_name}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-gray-600 font-Jost">
                              {price.toLocaleString('en-NG', {
                                style: 'currency',
                                currency: 'NGN',
                                minimumFractionDigits: 2,
                              })} each
                            </span>
                            <span className="font-bold text-gray-900 font-Manrope">
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
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 font-Jost"
                      disabled={couponLoading}
                    />
                    <button
                      type="submit"
                      disabled={couponLoading || !couponCode.trim()}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-Jost hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {couponLoading ? 'Applying...' : 'Apply'}
                    </button>
                  </form>
                )}
                
                {couponError && (
                  <p className="text-sm text-red-600 mt-2 font-Jost">{couponError}</p>
                )}
                {couponSuccess && (
                  <p className="text-sm text-green-600 mt-2 font-Jost">{couponSuccess}</p>
                )}
              </div>
              
              {/* Order Summary Totals */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex justify-between text-sm font-Jost">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">
                    {displaySubtotal.toLocaleString('en-NG', {
                      style: 'currency',
                      currency: 'NGN',
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                
                {displayFirstOrderDiscount > 0 && (
                  <div className="flex justify-between text-sm font-Jost">
                    <span className="text-green-600">First Order Discount (5%)</span>
                    <span className="text-green-600">
                      -{displayFirstOrderDiscount.toLocaleString('en-NG', {
                        style: 'currency',
                        currency: 'NGN',
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
                
                {displayCouponDiscount > 0 && (
                  <div className="flex justify-between text-sm font-Jost">
                    <span className="text-green-600">Coupon Discount</span>
                    <span className="text-green-600">
                      -{displayCouponDiscount.toLocaleString('en-NG', {
                        style: 'currency',
                        currency: 'NGN',
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
                
                {displayTotalDiscount > 0 && (
                  <div className="flex justify-between text-sm font-Jost font-medium">
                    <span className="text-green-700">Total Discount</span>
                    <span className="text-green-700">
                      -{displayTotalDiscount.toLocaleString('en-NG', {
                        style: 'currency',
                        currency: 'NGN',
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
                
                {displayTax > 0 && (
                  <div className="flex justify-between text-sm font-Jost">
                    <span className="text-gray-600">Tax (5%)</span>
                    <span className="text-gray-900">
                      {displayTax.toLocaleString('en-NG', {
                        style: 'currency',
                        currency: 'NGN',
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
                
                {isNigeria && shippingCost > 0 && (
                  <div className="flex justify-between text-sm font-Jost">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-900">
                      {shippingCost.toLocaleString('en-NG', {
                        style: 'currency',
                        currency: 'NGN',
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between text-lg font-bold font-Manrope">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">
                    {displayTotal.toLocaleString('en-NG', {
                      style: 'currency',
                      currency: 'NGN',
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
              
              {/* Payment Method Selection */}
              <div className="mt-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 font-Manrope">Payment Method</h3>
                <div className="space-y-3">
                  <label className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      className="h-4 w-4 text-gray-900 focus:ring-gray-900"
                    />
                    <span className="ml-2 flex items-center text-sm font-medium text-gray-700 font-Jost">
                      <Smartphone className="h-5 w-5 mr-2" />
                      Pay with Card (Paystack)
                    </span>
                  </label>
                  
                  <label className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bitcoin"
                      checked={paymentMethod === 'bitcoin'}
                      onChange={() => setPaymentMethod('bitcoin')}
                      className="h-4 w-4 text-gray-900 focus:ring-gray-900"
                    />
                    <span className="ml-2 flex items-center text-sm font-medium text-gray-700 font-Jost">
                      <Bitcoin className="h-5 w-5 mr-2 text-orange-500" />
                      Pay with Bitcoin
                    </span>
                  </label>
                </div>
              </div>
              
              {/* Checkout Button */}
              <div className="mt-6">
                <button
                  onClick={() => {
                    if (paymentMethod === 'bitcoin') {
                      setShowBitcoinInstructions(true);
                    } else {
                      handlePayment();
                    }
                  }}
                  disabled={loading || isCreatingAccount || (!isAuthenticated() && (!guestForm.first_name || !guestForm.last_name || !guestForm.email || !guestForm.phone_number))}
                  className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-Jost"
                >
                  {loading || isCreatingAccount ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : paymentMethod === 'bitcoin' ? (
                    'Pay with Bitcoin'
                  ) : (
                    'Place Order'
                  )}
                </button>
              </div>
              
              {/* Security Note */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-600 font-Jost">
                  <Lock className="h-4 w-4 inline mr-1" />
                  Secure checkout powered by Paystack
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <WhatsAppChatWidget phoneNumber={WHATSAPP_NUMBER} />
      <Footer />
    </div>
  );
};

export default CheckoutPage;