import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, AlertCircle, CheckCircle, Trash2, Bitcoin, MessageCircle, Truck, Clock, MapPin, Gift, X, Copy, User, Mail, Phone } from 'lucide-react';
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
  // User authentication and management
  const { user: authUser, loading: authLoading, login } = useAuth();
  const { user: hookUser, refreshUser } = useUserManager();
  const user = hookUser || authUser;
  
  // Currency context with fallback
  const currencyContext = useContext(CurrencyContext) || { 
    currency: 'NGN', 
    exchangeRate: 1, 
    country: 'Nigeria', 
    contextLoading: false 
  };
  
  const { currency = 'NGN', exchangeRate = 1, country = 'Nigeria', contextLoading = false } = currencyContext;
  
  const navigate = useNavigate();
  
  // Core state
  const [cart, setCart] = useState({ cartId: null, subtotal: 0, tax: 0, total: 0, items: [] });
  const [shippingAddresses, setShippingAddresses] = useState([]);
  const [billingAddresses, setBillingAddresses] = useState([]);
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
  const [billingAddressOption, setBillingAddressOption] = useState('same');
  
  // Discount state
  const [firstOrderDiscount, setFirstOrderDiscount] = useState(0);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  
  // Guest checkout state
  const [guestForm, setGuestForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: ''
  });
  const [guestUserCreated, setGuestUserCreated] = useState(false);
  
  // Form state
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

  // Utility functions
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
  
  const isTemporaryUser = localStorage.getItem('isTemporaryUser') === 'true' || user?.is_temporary;
  const isGuestCheckout = !isAuthenticated() && !guestUserCreated;

  // Load guest cart from localStorage
  const loadGuestCart = () => {
    try {
      const guestCart = localStorage.getItem('guestCart');
      if (guestCart) {
        const parsedCart = JSON.parse(guestCart);
        if (!parsedCart.items || !Array.isArray(parsedCart.items)) {
          setError('Invalid cart data. Please try adding items again.');
          setCart({ cartId: null, subtotal: 0, tax: 0, total: 0, items: [] });
          return;
        }
        setCart(parsedCart);
      } else {
        setError('No items in your cart. Please add items to proceed.');
        setCart({ cartId: null, subtotal: 0, tax: 0, total: 0, items: [] });
      }
    } catch (err) {
      console.error('Checkout: Error loading guest cart:', err);
      setError('Failed to load cart. Please try adding items again.');
      setCart({ cartId: null, subtotal: 0, tax: 0, total: 0, items: [] });
    }
  };
  
  // Create temporary user for guest checkout
  const createTemporaryUser = async () => {
    if (!guestForm.first_name || !guestForm.last_name || !guestForm.email || !guestForm.phone_number) {
      throw new Error('Please provide all required personal information: first name, last name, email, and phone number.');
    }
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/temporary-user`, {
        first_name: guestForm.first_name,
        last_name: guestForm.last_name,
        email: guestForm.email,
        phone_number: guestForm.phone_number,
      });
      
      const { token, user: userData } = response.data;
      if (!token || !userData?.id) {
        throw new Error('Invalid response from temporary user creation');
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('isTemporaryUser', 'true');
      
      login({ token, user: userData, isTemporary: true });
      setGuestUserCreated(true);
      
      await refreshUser();
      return true;
    } catch (err) {
      console.error('Error creating temporary user:', err);
      let errorMessage = 'Failed to create temporary user account';
      
      if (err.response) {
        if (err.response.status === 400) {
          errorMessage = err.response.data.error || 'Invalid input data. Please check your information.';
        } else if (err.response.status === 409) {
          errorMessage = err.response.data.error || 'Email already in use. Please use another email or log in.';
        } else if (err.response.status === 500) {
          errorMessage = err.response.data.error || 'Server error. Please try again later.';
        }
      } else if (err.request) {
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = err.message || 'Failed to create temporary user account';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  };
  
  // Transfer guest cart to user cart
  const transferGuestCart = async () => {
    try {
      const guestCart = localStorage.getItem('guestCart');
      if (!guestCart) return;
      
      const userId = getUserId();
      const token = getToken();
      
      await axios.post(
        `${API_BASE_URL}/api/cart/transfer-guest-cart`,
        { 
          user_id: userId,
          guest_cart: JSON.parse(guestCart)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      localStorage.removeItem('guestCart');
    } catch (err) {
      console.error('Error transferring guest cart:', err);
      toast.error('Failed to transfer your cart. Please try again.');
    }
  };
  
  // Fetch cart and addresses
  const fetchCartAndAddresses = async () => {
    if (!isAuthenticated()) {
      loadGuestCart();
      return;
    }
    
    try {
      const userId = getUserId();
      const token = getToken();
      
      // Fetch cart
      const cartResponse = await axios.get(`${API_BASE_URL}/api/cart/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const cartData = cartResponse.data?.data || cartResponse.data;
      setCart(cartData);
      
      // Fetch shipping addresses
      try {
        const shippingResponse = await axios.get(`${API_BASE_URL}/api/addresses/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
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
        setShippingAddresses([]);
      }
      
      // Fetch billing addresses
      try {
        const billingResponse = await axios.get(`${API_BASE_URL}/api/billing-addresses/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
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
        setBillingAddresses([]);
      }
    } catch (err) {
      console.error('Error fetching cart and addresses:', err);
    }
  };
  
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
        let discountAmount = 0;
        
        if (discount.type === 'percentage') {
          discountAmount = (cart.subtotal * discount.value) / 100;
        } else if (discount.type === 'fixed') {
          discountAmount = discount.value;
        }
        
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
  
  // Shipping options
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
      case 'truck': return <Truck className="h-5 w-5" />;
      case 'package': return <MapPin className="h-5 w-5" />;
      case 'home': return <MapPin className="h-5 w-5" />;
      default: return <Truck className="h-5 w-5" />;
    }
  };
  
  // Prepare guest user for address creation
  const prepareGuestForAddresses = async () => {
    if (!isAuthenticated()) {
      if (!guestForm.first_name || !guestForm.last_name || !guestForm.email || !guestForm.phone_number) {
        setError('Please provide all required personal information: first name, last name, email, and phone number.');
        toast.error('Please provide all required personal information.');
        return false;
      }
      
      setLoading(true);
      try {
        const created = await createTemporaryUser();
        if (!created) return false;
        
        await transferGuestCart();
        await refreshUser();
        await fetchCartAndAddresses();
        
        return true;
      } catch (err) {
        console.error('Error preparing guest for addresses:', err);
        const errorMessage = err.response?.data?.error || err.message || 'Failed to prepare guest account';
        setError(errorMessage);
        toast.error(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    }
    
    return true;
  };
  
  // Handle shipping form submission
  const handleShippingSubmit = async (data) => {
    try {
      setLoading(true);
      
      if (!data.title || !data.address_line_1 || !data.city || !data.country) {
        throw new Error('Please provide title, address line 1, city, and country.');
      }
      
      if (!isAuthenticated()) {
        const created = await createTemporaryUser();
        if (!created) throw new Error('Failed to create temporary user account');
        
        await transferGuestCart();
        await refreshUser();
        await fetchCartAndAddresses();
      }
      
      const userId = getUserId();
      const token = getToken();
      
      if (!userId || !token) {
        throw new Error('Authentication error: User ID or token is missing');
      }
      
      const payload = { user_id: userId, ...data };
      const response = await axios.post(
        `${API_BASE_URL}/api/addresses`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const createdAddress = response.data?.data || response.data;
      setShippingAddresses(prev => [createdAddress, ...prev]);
      setShippingAddressId(String(createdAddress.id));
      setShowShippingForm(false);
      setFormErrors({});
      setSuccess('Shipping address added successfully.');
      toast.success('Shipping address added');
      
      if (billingAddressOption === 'same') {
        await copyShippingToBilling(createdAddress);
      }
    } catch (err) {
      console.error('Error in handleShippingSubmit:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to add shipping address';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle billing form submission
  const handleBillingSubmit = async (data) => {
    try {
      setLoading(true);
      
      if (!data.full_name || !data.email || !data.address_line_1 || !data.city || !data.country) {
        throw new Error('Please provide full name, email, address line 1, city, and country.');
      }
      
      if (!isAuthenticated()) {
        const created = await createTemporaryUser();
        if (!created) throw new Error('Failed to create temporary user account');
        
        await transferGuestCart();
        await refreshUser();
        await fetchCartAndAddresses();
      }
      
      const userId = getUserId();
      const token = getToken();
      
      if (!userId || !token) {
        throw new Error('Authentication error: User ID or token is missing');
      }
      
      const payload = { user_id: userId, ...data };
      const response = await axios.post(
        `${API_BASE_URL}/api/billing-addresses`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const createdAddress = response.data?.data || response.data;
      setBillingAddresses(prev => [createdAddress, ...prev]);
      setBillingAddressId(String(createdAddress.id));
      setShowBillingForm(false);
      setFormErrors({});
      setSuccess('Billing address added successfully.');
      toast.success('Billing address added');
    } catch (err) {
      console.error('Error in handleBillingSubmit:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to add billing address';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle address deletion
  const handleDeleteAddress = async (type, addressId) => {
    if (!isAuthenticated()) {
      toast.error('Please log in to delete address');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
  
    try {
      setLoading(true);
      const token = getToken();
  
      await axios.delete(`${API_BASE_URL}/api/${type}/${addressId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (type === 'addresses') {
        const remaining = shippingAddresses.filter(addr => String(addr.id) !== String(addressId));
        setShippingAddresses(remaining);
  
        if (String(shippingAddressId) === String(addressId)) {
          const newShippingId = remaining.length ? String(remaining[0].id) : null;
          setShippingAddressId(newShippingId);
  
          if (billingAddressOption === 'same' && remaining.length > 0) {
            const newShippingAddress = remaining[0];
            const matchingBillingAddress = billingAddresses.find(addr =>
              addr.address_line_1 === newShippingAddress.address_line_1 &&
              addr.city === newShippingAddress.city &&
              addr.state === newShippingAddress.state
            );
  
            if (matchingBillingAddress) {
              setBillingAddressId(String(matchingBillingAddress.id));
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
  const copyShippingToBilling = async (shippingAddress) => {
    if (!shippingAddress) {
      const selectedShippingAddress = shippingAddresses.find(addr => addr.id.toString() === shippingAddressId);
      if (!selectedShippingAddress) {
        toast.error('Please select a shipping address first');
        return;
      }
      shippingAddress = selectedShippingAddress;
    }
    
    const billingAddress = {
      full_name: guestForm.first_name && guestForm.last_name ? `${guestForm.first_name} ${guestForm.last_name}` : 
                 (user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : ''),
      email: guestForm.email || user?.email || '',
      phone_number: shippingAddress.phone_number,
      address_line_1: shippingAddress.address_line_1,
      address_line_2: shippingAddress.address_line_2,
      city: shippingAddress.city,
      state: shippingAddress.state,
      zip_code: shippingAddress.zip_code,
      country: shippingAddress.country,
    };
    
    const matchingBillingAddress = billingAddresses.find(addr => 
      addr.address_line_1 === billingAddress.address_line_1 &&
      addr.city === billingAddress.city &&
      addr.state === billingAddress.state
    );
    
    if (matchingBillingAddress) {
      setBillingAddressId(String(matchingBillingAddress.id));
      toast.success('Billing address updated to match shipping address');
    } else {
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
    }
  };
  
  // Load Paystack script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);
  
  // Initial data loading
  useEffect(() => {
    const fetchInitialData = async () => {
      if (authLoading || contextLoading) return;
      
      setLoading(true);
      try {
        if (isAuthenticated()) {
          await fetchCartAndAddresses();
          toast.success('Checkout data loaded successfully');
        } else {
          loadGuestCart();
        }
      } catch (err) {
        const errorMessage = err.message || 'Unknown error';
        setError(`Failed to load checkout data: ${errorMessage}`);
        toast.error(`Failed to load checkout data: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [user, authLoading, contextLoading]);
  
  // Update billing address when shipping address changes if option is 'same'
  useEffect(() => {
    if (billingAddressOption === 'same' && shippingAddressId) {
      const selectedShippingAddress = shippingAddresses.find(addr => addr.id.toString() === shippingAddressId);
      if (selectedShippingAddress) {
        const matchingBillingAddress = billingAddresses.find(addr => 
          addr.address_line_1 === selectedShippingAddress.address_line_1 &&
          addr.city === selectedShippingAddress.city &&
          addr.state === selectedShippingAddress.state
        );
        
        if (matchingBillingAddress) {
          setBillingAddressId(String(matchingBillingAddress.id));
        }
      }
    }
  }, [shippingAddressId, billingAddressOption, shippingAddresses, billingAddresses]);
  
  // Set default addresses
  useEffect(() => {
    if (shippingAddresses.length > 0 && !shippingAddressId) {
      setShippingAddressId(String(shippingAddresses[0].id));
    }
    if (billingAddresses.length > 0 && !billingAddressId) {
      setBillingAddressId(String(billingAddresses[0].id));
    }
  }, [shippingAddresses, billingAddresses, shippingAddressId, billingAddressId]);
  
  // Set default shipping method
  useEffect(() => {
    const selectedShippingAddress = shippingAddresses.find(addr => addr.id.toString() === shippingAddressId);
    const addressCountry = selectedShippingAddress ? selectedShippingAddress.country : country;
    const isNigeria = addressCountry.toLowerCase() === 'nigeria';
    
    if (isNigeria && !shippingMethod) {
      setShippingMethod(shippingOptions[0]);
    }
    
    if (!isNigeria && shippingMethod) {
      setShippingMethod(null);
    }
  }, [shippingAddresses, shippingAddressId, country]);
  
  // Calculate first order discount
  useEffect(() => {
    const currentSubtotal = cart.subtotal;
    
    if (user?.first_order && !isTemporaryUser && currentSubtotal > 0) {
      const discountAmount = Number((currentSubtotal * 0.05).toFixed(2));
      setFirstOrderDiscount(discountAmount);
    } else {
      setFirstOrderDiscount(0);
    }
  }, [user?.first_order, isTemporaryUser, cart.subtotal]);
  
  // Derived values
  const selectedShippingAddress = shippingAddresses.find(addr => addr.id.toString() === shippingAddressId);
  const addressCountry = selectedShippingAddress ? selectedShippingAddress.country : country;
  const isNigeria = addressCountry.toLowerCase() === 'nigeria';
  const selectedBillingAddress = billingAddresses.find(addr => addr.id.toString() === billingAddressId);
  
  // Calculations
  const subtotal = Number(cart?.subtotal) || 0;
  const tax = isNigeria ? 0 : Number((subtotal * 0.05).toFixed(2));
  const shippingCost = isNigeria ? shippingMethod?.total_cost || 0 : 0;
  const totalDiscount = Number((firstOrderDiscount + couponDiscount).toFixed(2));
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
  
  // Handle payment
  const handlePayment = async () => {
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
    
    if (!isAuthenticated()) {
      const created = await createTemporaryUser();
      if (!created) {
        setError('Failed to create temporary user account');
        toast.error('Failed to create temporary user account');
        return;
      }
      
      await transferGuestCart();
      await refreshUser();
      await fetchCartAndAddresses();
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
      const orderCurrency = 'NGN';
      const userId = getUserId();
      const token = getToken();
      
      const baseSubtotal = Number(cart?.subtotal) || 0;
      const baseFirstOrderDiscount = (user?.first_order && !isTemporaryUser) 
        ? Number((baseSubtotal * 0.05).toFixed(2)) 
        : 0;
      
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
        exchange_rate: 1,
        base_currency_total: baseTotal,
        converted_total: baseTotal,
        tax: baseTax,
      };
      
      const orderResponse = await axios.post(`${API_BASE_URL}/api/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const orderId = orderResponse.data.order?.id || orderResponse.data.id || orderResponse.data.data?.id;
      if (!orderId) {
        throw new Error('Order ID not found in response');
      }
      
      // Update user's first_order status if applicable
      if (user.first_order && !isTemporaryUser) {
        try {
          await axios({
            method: 'PATCH',
            url: `${API_BASE_URL}/api/auth/users/${getUserId()}`, 
            data: { first_order: false },
            headers: { Authorization: `Bearer ${getToken()}` }
          });
          
          const updatedUser = await refreshUser();
          if (updatedUser && !updatedUser.first_order) {
            console.log('User data refreshed, first_order is now false');
          }
        } catch (err) {
          console.error('Failed to update first_order status:', err);
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
        email: selectedBillingAddress?.email || billingForm.email || user.email || guestForm.email,
        amount: Math.round(paymentAmount * 100),
        currency: paymentCurrency,
        callback_url: callbackUrl,
      };
      
      const paymentResponse = await axios.post(
        `${API_BASE_URL}/api/paystack/initialize`,
        paymentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      let paymentInfo = paymentResponse.data;
      if (paymentResponse.data.data) {
        paymentInfo = paymentResponse.data.data;
      }
      
      const accessCode = paymentInfo.access_code;
      const authorizationUrl = paymentInfo.authorization_url;
      
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
          onClose: () => {
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
    } finally {
      setLoading(false);
    }
  };
  
  // Handle WhatsApp payment
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
  
  // Loading states
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
  
  if (loading && !guestUserCreated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-Accent">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-sm font-Jost">Loading checkout data...</p>
        </div>
      </div>
    );
  }
  
  // Empty cart handling
  if (!cart?.items || !Array.isArray(cart.items) || cart.items.length === 0) {
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
        
        {/* Guest Information Form */}
        {isGuestCheckout && (
          <div className="p-5 md:p-6 bg-white rounded-lg shadow-md mb-8">
            <h3 className="text-xl font-semibold text-Primarycolor mb-4 font-Manrope flex items-center">
              <User className="h-5 w-5 mr-2" />
              Your Information
            </h3>
            <p className="text-sm text-gray-600 mb-4 font-Jost">
              Please provide your details to continue with guest checkout. An account will be created automatically, and order updates will be sent via email.
            </p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-Jost">First Name *</label>
                  <input
                    type="text"
                    required
                    value={guestForm.first_name}
                    onChange={(e) => setGuestForm(prev => ({ ...prev, first_name: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-Jost">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={guestForm.last_name}
                    onChange={(e) => setGuestForm(prev => ({ ...prev, last_name: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 font-Jost flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={guestForm.email}
                  onChange={(e) => setGuestForm(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500 font-Jost">
                  We'll send order updates to this email address
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 font-Jost flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={guestForm.phone_number}
                  onChange={(e) => setGuestForm(prev => ({ ...prev, phone_number: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500 font-Jost">
                  For delivery updates and order confirmation
                </p>
              </div>
            </div>
            
            {error && <p className="text-sm text-red-600 mt-2 font-Jost">{error}</p>}
            
            <div className="mt-6">
              <button
                onClick={prepareGuestForAddresses}
                disabled={!guestForm.first_name || !guestForm.last_name || !guestForm.email || !guestForm.phone_number}
                className={`w-full bg-Primarycolor text-Secondarycolor py-3 px-4 rounded-lg font-Manrope font-medium ${!guestForm.first_name || !guestForm.last_name || !guestForm.email || !guestForm.phone_number ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Continue to Shipping
              </button>
              
              <div className="mt-3 text-xs text-gray-500 font-Jost">
                By clicking "Continue to Shipping", you agree to create a temporary account for this order.
              </div>
            </div>
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
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-8">
            {/* Shipping Address */}
            <div className="p-5 md:p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-Primarycolor mb-4 font-Manrope flex items-center">
                <Truck className="h-5 w-5 mr-2" />
                Shipping Address
              </h3>
              
              {shippingAddresses.length > 0 ? (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-Accent mb-1 font-Jost">Select Shipping Address</label>
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
                      className="text-Primarycolor hover:text-gray-800 text-sm flex items-center font-Jost"
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
                  {isAuthenticated() || guestUserCreated ? (
                    <>
                      <button
                        onClick={() => setShowShippingForm(!showShippingForm)}
                        className="text-Accent hover:text-Primarycolor text-sm mb-4 font-Jost"
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
                    </>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-yellow-800 font-Jost">
                        Please provide your information and click "Continue to Shipping" to add a shipping address.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Billing Address */}
            <div className="p-5 md:p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-Primarycolor mb-4 font-Manrope flex items-center">
                <Copy className="h-5 w-5 mr-2" />
                Billing Address
              </h3>
              
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
                        <label className="block text-sm font-medium text-Accent mb-1 font-Jost">Select Billing Address</label>
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
                          className="text-Primarycolor hover:text-gray-800 text-sm flex items-center font-Jost"
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
                      {isAuthenticated() || guestUserCreated ? (
                        <>
                          <button
                            onClick={() => setShowBillingForm(!showBillingForm)}
                            className="text-Accent hover:text-Primarycolor text-sm mb-4 font-Jost"
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
                        </>
                      ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                          <p className="text-sm text-yellow-800 font-Jost">
                            Please provide your information and click "Continue to Shipping" to add a billing address.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Order Note */}
            <div className="p-5 md:p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-Primarycolor mb-4 font-Manrope">
                <Clock className="h-5 w-5 inline mr-2" />
                Order Note (optional)
              </h3>
              <textarea
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
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
          <div className="lg:col-span-1">
            <div className="p-6 bg-white rounded-lg shadow-md sticky top-24">
              <h3 className="text-xl font-semibold text-Primarycolor mb-6 font-Manrope">Order Summary</h3>
              
              {/* Cart Items */}
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
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
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
              
              {/* Payment Method */}
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
              
              {/* Order Total */}
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
                  
                  {user?.first_order && !isTemporaryUser && displayFirstOrderDiscount > 0 && (
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
                
                {user?.first_order && !isTemporaryUser && displayFirstOrderDiscount > 0 && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-700 font-Jost">
                      🎉 <strong>Congratulations!</strong> You've received a 5% discount on your first order.
                    </p>
                  </div>
                )}
                
                {isTemporaryUser && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700 font-Jost">
                      💡 <strong>Note:</strong> Create a permanent account to qualify for first order discounts on future purchases.
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
                
                <button
                  onClick={handlePayment}
                  className="mt-6 w-full bg-Primarycolor text-Secondarycolor text-sm py-4 px-4 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-Manrope font-semibold"
                  disabled={
                    loading || 
                    !shippingAddressId || 
                    !billingAddressId || 
                    (isNigeria && !shippingMethod) ||
                    (isGuestCheckout && (!guestForm.first_name || !guestForm.last_name || !guestForm.email || !guestForm.phone_number))
                  }
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