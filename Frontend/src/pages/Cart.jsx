import { useState, useEffect, useContext, useCallback, useMemo, lazy, Suspense } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag, Loader2, Package, Star, X, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { CurrencyContext } from './CurrencyContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Lazy load non-critical components
const WhatsAppChatWidget = lazy(() => import('../components/WhatsAppChatWidget'));
const Footer = lazy(() => import('../components/Footer'));

// Skeleton loader for cart items
const CartItemSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 animate-pulse">
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-shrink-0">
        <div className="w-full h-40 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-gray-200 rounded-lg"></div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="flex justify-between">
          <div className="h-8 bg-gray-200 rounded w-24"></div>
          <div className="h-6 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    </div>
  </div>
);

const Cart = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Safely access CurrencyContext with error handling
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
  
  const [cart, setCart] = useState({ cartId: null, subtotal: 0, tax: 0, total: 0, items: [] });
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(null);
  const [isCartLoading, setIsCartLoading] = useState(true);
  
  // Helper function to decode JWT token
  const decodeToken = useCallback((token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (err) {
      console.error('Cart: Error decoding token:', err);
      return null;
    }
  }, []);
  
  // Helper function to get the JWT token
  const getToken = useCallback(() => {
    if (user && user.token) {
      return user.token;
    }
    return localStorage.getItem('token');
  }, [user]);
  
  // Helper function to check if user is authenticated
  const isAuthenticated = useCallback(() => {
    return !!getToken();
  }, [getToken]);
  
  // Helper function to get user ID
  const getUserId = useCallback(() => {
    const token = getToken();
    if (!token) return null;
    
    const tokenData = decodeToken(token);
    return tokenData?.id;
  }, [getToken, decodeToken]);
  
  // Helper function to handle authentication errors
  const handleAuthError = useCallback(() => {
    console.log('Cart: Authentication error, clearing user data and redirecting');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (logout) {
      logout();
    }
    setError('Your session has expired. Please log in again.');
    toast.error('Your session has expired. Please log in again.');
    navigate('/login', { state: { from: location.pathname } });
  }, [logout, navigate, location.pathname]);
  
  // Create a centralized axios instance with auth headers
  const getAuthAxios = useCallback(() => {
    const token = getToken();
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    return axios.create({
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-User-Country': country
      },
      timeout: 15000,
    });
  }, [getToken, country]);
  
  // Fetch cart data
  useEffect(() => {
    const fetchCart = async (retries = 3, delay = 1000) => {
      if (!isAuthenticated()) {
        console.log('Cart: No valid user session, redirecting to /login');
        setError('Please log in to view your cart.');
        toast.error('Please log in to view your cart.');
        navigate('/login', { state: { from: location.pathname } });
        setIsCartLoading(false);
        return;
      }
      
      try {
        const userId = getUserId();
        if (!userId) {
          throw new Error('Could not determine user ID from authentication data');
        }
        
        console.log('Cart: Fetching cart for userId=', userId, 'URL=', `/api/cart/${userId}`);
        
        const authAxios = getAuthAxios();
        const response = await authAxios.get(`${API_BASE_URL}/api/cart/${userId}`);
        
        if (response.status !== 200) {
          throw new Error(`HTTP error ${response.status}`);
        }
        
        if (typeof response.data === 'string' && response.data.startsWith('<!doctype html')) {
          throw new Error('Received HTML instead of JSON; check Vite proxy configuration');
        }
        
        console.log('Cart: Fetched cart:', JSON.stringify(response.data, null, 2));
        setCart(response.data);
        setError('');
        toast.success('Cart loaded successfully');
      } catch (err) {
        console.error('Cart: Fetch error details:', {
          message: err.message,
          code: err.code,
          response: err.response ? {
            status: err.response.status,
            data: typeof err.response.data === 'string' ? err.response.data.slice(0, 100) + '...' : err.response.data,
          } : 'No response',
          config: err.config,
        });
        
        if (err.response?.status === 401 || err.message.includes('Could not determine user ID')) {
          handleAuthError();
          return;
        }
        
        if (retries > 0 && (err.code === 'ECONNABORTED' || err.message.includes('Network Error') || err.message.includes('HTML instead of JSON'))) {
          console.log(`Cart: Retrying fetchCart (${retries} retries left)...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchCart(retries - 1, delay * 2);
        }
        
        const errorMessage = err.response?.status === 404 
          ? 'Cart not found. Start shopping to add items!' 
          : err.response?.status === 401 
          ? 'Unauthorized. Please log in again.' 
          : `Server error: ${err.message}. Check backend server and Vite proxy settings.`;
          
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsCartLoading(false);
      }
    };
    
    if (!authLoading && !contextLoading) {
      fetchCart();
    }
  }, [user, authLoading, contextLoading, country, navigate, location.pathname, isAuthenticated, getUserId, getAuthAxios, handleAuthError]);
  
  // Debounce function
  const debounce = useCallback((func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }, []);
  
  // Update quantity
  const updateQuantity = useCallback(async (itemId, newQuantity) => {
    if (newQuantity < 1 || isUpdating === itemId) return;
    
    console.log(`Cart: Updating quantity for cart_item_id ${itemId} to ${newQuantity}`);
    setIsUpdating(itemId);
    
    try {
      if (!isAuthenticated()) {
        console.log('Cart: No valid user session, redirecting to /login');
        setError('Please log in to update your cart.');
        toast.error('Please log in to update your cart.');
        navigate('/login', { state: { from: location.pathname } });
        return;
      }
      
      const item = cart.items.find(item => item.id === itemId);
      if (!item) throw new Error('Item not found in cart');
      
      if (newQuantity > item.item.stock_quantity) {
        setError(`Cannot add more. Only ${item.item.stock_quantity} in stock.`);
        toast.error(`Cannot add more. Only ${item.item.stock_quantity} in stock.`);
        return;
      }
      
      // Optimistic update
      setCart(prev => {
        const updatedItems = prev.items.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        );
        const subtotal = updatedItems.reduce(
          (sum, item) => sum + item.quantity * item.item.price,
          0
        );
        const tax = country === 'Nigeria' ? 0 : subtotal * 0.05;
        const total = subtotal + tax;
        console.log('Cart: Optimistic cart update:', { items: updatedItems, subtotal, tax, total });
        return { ...prev, items: updatedItems, subtotal, tax, total };
      });
      
      const authAxios = getAuthAxios();
      const response = await authAxios.put(`/api/cart/${itemId}`, { quantity: newQuantity });
      
      if (response.status !== 200) {
        throw new Error(response.data?.error || 'Failed to update quantity');
      }
      
      // Show success toast without refreshing the entire cart
      toast.success('Quantity updated successfully');
    } catch (err) {
      console.error('Cart: Update error:', err);
      
      if (err.response?.status === 401 || err.message.includes('Could not determine user ID')) {
        handleAuthError();
        return;
      }
      
      const errorMessage = err.response?.status === 404 
        ? 'Item not found.' 
        : err.message || 'Server error';
        
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Revert optimistic update
      setCart(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.id === itemId ? { ...item, quantity: item.quantity } : item
        ),
        subtotal: prev.items.reduce(
          (sum, item) => sum + item.quantity * item.item.price,
          0
        ),
        tax: country === 'Nigeria' ? 0 : prev.items.reduce(
          (sum, item) => sum + item.quantity * item.item.price,
          0
        ) * 0.05,
        total: prev.items.reduce(
          (sum, item) => sum + item.quantity * item.item.price,
          0
        ) * (country === 'Nigeria' ? 1 : 1.05)
      }));
    } finally {
      setIsUpdating(null);
    }
  }, [isUpdating, isAuthenticated, cart.items, country, navigate, location.pathname, getAuthAxios, handleAuthError]);
  
  const debouncedUpdateQuantity = useMemo(() => debounce(updateQuantity, 500), [updateQuantity, debounce]);
  
  // Remove item
  const removeItem = useCallback(async (itemId) => {
    try {
      if (!isAuthenticated()) {
        console.log('Cart: No valid user session, redirecting to /login');
        setError('Please log in to update your cart.');
        toast.error('Please log in to update your cart.');
        navigate('/login', { state: { from: location.pathname } });
        return;
      }
      
      console.log(`Cart: Removing item with cart_item_id ${itemId}`);
      
      const authAxios = getAuthAxios();
      const response = await authAxios.delete(`/api/cart/${itemId}`);
      
      if (response.status === 200) {
        setCart(prev => {
          const remaining = prev.items.filter(item => item.id !== itemId);
          const subtotal = remaining.reduce(
            (sum, item) => sum + item.quantity * item.item.price,
            0
          );
          const tax = country === 'Nigeria' ? 0 : subtotal * 0.05;
          const total = subtotal + tax;
          console.log('Cart: Item removed, updated cart:', { items: remaining, subtotal, tax, total });
          return { ...prev, items: remaining, subtotal, tax, total };
        });
        setError('');
        toast.success('Item removed from cart');
      } else {
        throw new Error(response.data?.error || 'Failed to remove item');
      }
    } catch (err) {
      console.error('Cart: Remove error:', err);
      
      if (err.response?.status === 401 || err.message.includes('Could not determine user ID')) {
        handleAuthError();
        return;
      }
      
      const errorMessage = err.response?.status === 404 
        ? 'Item not found.' 
        : err.response?.data?.error || 'Server error';
        
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [isAuthenticated, navigate, location.pathname, getAuthAxios, handleAuthError]);
  
  // Clear cart
  const clearCart = useCallback(async () => {
    try {
      if (!isAuthenticated()) {
        console.log('Cart: No valid user session, redirecting to /login');
        setError('Please log in to update your cart.');
        toast.error('Please log in to update your cart.');
        navigate('/login', { state: { from: location.pathname } });
        return;
      }
      
      console.log(`Cart: Clearing cart for userId=${getUserId()}`);
      
      const authAxios = getAuthAxios();
      const response = await authAxios.delete(`/api/cart/clear/${getUserId()}`);
      
      if (response.status === 200) {
        setCart({ cartId: null, subtotal: 0, tax: 0, total: 0, items: [] });
        setError('');
        toast.success('Cart cleared successfully');
      } else {
        throw new Error(response.data?.error || 'Failed to clear cart');
      }
    } catch (err) {
      console.error('Cart: Clear error:', err);
      
      if (err.response?.status === 401 || err.message.includes('Could not determine user ID')) {
        handleAuthError();
        return;
      }
      
      const errorMessage = err.response?.status === 404 
        ? 'Cart not found.' 
        : err.response?.data?.error || 'Server error';
        
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [isAuthenticated, getUserId, navigate, location.pathname, getAuthAxios, handleAuthError]);
  
  // Loading state
  if (authLoading || contextLoading) {
    return (
      <div style={{
        '--color-Primarycolor': '#1E1E1E',
        '--color-Secondarycolor': '#ffffff',
        '--color-Accent': '#6E6E6E',
        '--color-Softcolor': '#F5F5DC',
        '--font-Manrope': '"Manrope", "sans-serif"',
        '--font-Jost': '"Jost", "sans-serif"'
      }}>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center justify-center text-gray-600">
            <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
            <p className="mt-2 text-sm font-Jost">Loading cart...</p>
          </div>
        </div>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </div>
    );
  }
  
  // Not authenticated
  if (!isAuthenticated() && !authLoading) {
    return (
      <div style={{
        '--color-Primarycolor': '#1E1E1E',
        '--color-Secondarycolor': '#ffffff',
        '--color-Accent': '#6E6E6E',
        '--color-Softcolor': '#F5F5DC',
        '--font-Manrope': '"Manrope", "sans-serif"',
        '--font-Jost': '"Jost", "sans-serif"'
      }}>
        <Navbar />
        <div className="text-center py-16 text-red-600 font-Jost">Please log in to view your cart.</div>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </div>
    );
  }
  
  // Calculate cart totals with safe fallbacks
  const subtotal = Number(cart.subtotal) || 0;
  const tax = Number(cart.tax) || 0;
  const total = Number(cart.total) || 0;
  
  // Format values for display
  const displaySubtotal = country === 'Nigeria' ? subtotal : (subtotal * exchangeRate);
  const displayTax = country === 'Nigeria' ? tax : (tax * exchangeRate);
  const displayTotal = country === 'Nigeria' ? total : (total * exchangeRate);
  
  // Memoized Cart Item Component
  const CartItem = useMemo(() => ({ item }) => {
    const bundleItems = item.item.is_product ? [] : (item.item.items || []);
    console.log(`Cart: Rendering cart_item_id ${item.id}, bundle items:`, JSON.stringify(bundleItems, null, 2));
    
    const basePrice = Number(item.item.price) || 0;
    const displayPrice = country === 'Nigeria' ? basePrice : (basePrice * exchangeRate);
    const formattedPrice = displayPrice.toLocaleString(country === 'Nigeria' ? 'en-NG' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    });
    const totalPrice = displayPrice * item.quantity;
    const formattedTotalPrice = totalPrice.toLocaleString(country === 'Nigeria' ? 'en-NG' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    });
    
    const isOutOfStock = item.item.stock_quantity === 0;
    
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Product Image */}
          <div className="relative flex-shrink-0">
            <div className="relative overflow-hidden rounded-lg bg-gray-100">
              <img
                src={item.item.image || 'https://via.placeholder.com/150x150?text=No+Image'}
                alt={item.item.name}
                className={`w-full h-40 sm:w-24 sm:h-24 md:w-28 md:h-28 object-cover ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}
                onError={(e) => { 
                  e.target.src = 'https://via.placeholder.com/150x150?text=No+Image'; 
                }}
                loading="lazy"
                width="150"
                height="150"
              />
              {/* Quantity Badge */}
              <div className="absolute -top-2 -right-2 bg-gray-900 text-white text-sm font-bold rounded-full h-7 w-7 flex items-center justify-center sm:text-xs sm:h-6 sm:w-6">
                {item.quantity}
              </div>
              {isOutOfStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-90 rounded-lg">
                  <span className="text-white text-sm sm:text-xs font-bold">Out of Stock</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Product Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
              {/* Product Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-base md:text-lg font-semibold font-Manrope text-gray-900 line-clamp-2">
                      {item.item.name}
                      {!item.item.is_product && (
                        <span className="inline-flex items-center ml-2 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          <Package className="h-3 w-3 mr-1" />
                          Bundle
                        </span>
                      )}
                    </h3>
                    
                    {/* Product Variants */}
                    {item.item.is_product && (item.item.color || item.item.size) && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {item.item.color && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs text-gray-600">
                            Color: {item.item.color}
                          </span>
                        )}
                        {item.item.size && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs text-gray-600">
                            Size: {item.item.size}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Stock Status */}
                    <div className="mt-2 flex items-center gap-2">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Out of Stock
                        </span>
                      ) : item.item.stock_quantity <= 5 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Only {item.item.stock_quantity} left
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          In Stock
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Delete Button - Top Right */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Bundle Items Display */}
                {!item.item.is_product && bundleItems.length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center">
                      <Package className="h-3 w-3 mr-1" />
                      Bundle includes ({bundleItems.length} items):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {bundleItems.slice(0, 4).map((bi, index) => (
                        <div key={`${item.id}-bundle-item-${bi.id}`} className="flex items-center gap-2">
                          <img
                            src={bi.image_url || 'https://via.placeholder.com/40x40'}
                            alt={bi.product_name}
                            className="w-8 h-8 rounded object-cover flex-shrink-0"
                            onError={(e) => { 
                              e.target.src = 'https://via.placeholder.com/40x40'; 
                            }}
                            loading="lazy"
                            width="40"
                            height="40"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-gray-800 truncate">
                              {bi.product_name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {bi.color_name && `${bi.color_name}`}
                              {bi.size_name && `, ${bi.size_name}`}
                            </p>
                          </div>
                        </div>
                      ))}
                      {bundleItems.length > 4 && (
                        <div className="col-span-full text-center">
                          <span className="text-xs text-gray-500">
                            +{bundleItems.length - 4} more items
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Price Section */}
              <div className="flex-shrink-0 text-right">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 font-Jost">
                    {formattedPrice} each
                  </p>
                  <p className="text-lg md:text-xl font-bold text-gray-900 font-Manrope">
                    {formattedTotalPrice}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Quantity Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 pt-4 border-t border-gray-200 gap-3">
              <div className="flex items-center">
                <label className="text-sm text-gray-600 font-Jost mr-3">Quantity:</label>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => debouncedUpdateQuantity(item.id, item.quantity - 1)}
                    disabled={isOutOfStock || isUpdating === item.id || item.quantity <= 1}
                    className="p-1 sm:p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                  <div className="px-2 sm:px-4 py-1 sm:py-2 bg-gray-50 border-x border-gray-300 min-w-[2.5rem] sm:min-w-[3rem] text-center">
                    {isUpdating === item.id ? (
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mx-auto" />
                    ) : (
                      <span className="text-xs sm:text-sm font-semibold font-Manrope">
                        {item.quantity}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => debouncedUpdateQuantity(item.id, item.quantity + 1)}
                    disabled={
                      isOutOfStock || 
                      isUpdating === item.id || 
                      item.quantity >= item.item.stock_quantity
                    }
                    className="p-1 sm:p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>
              
              {/* Delete Button - Bottom */}
              <button
                onClick={() => removeItem(item.id)}
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 font-Jost transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }, [country, currency, exchangeRate, debouncedUpdateQuantity, isUpdating, removeItem]);
  
  return (
    <div style={{
      '--color-Primarycolor': '#1E1E1E',
      '--color-Secondarycolor': '#ffffff',
      '--color-Accent': '#6E6E6E',
      '--color-Softcolor': '#F5F5DC',
      '--font-Manrope': '"Manrope", "sans-serif"',
      '--font-Jost': '"Jost", "sans-serif"'
    }}>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
          {/* Header Section */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold font-Manrope text-gray-900">
                  Shopping Cart
                </h1>
                <p className="font-Jost text-gray-600 text-sm md:text-base mt-1">
                  {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'} in your cart
                </p>
              </div>
              
              {/* Continue Shopping Button - Better Position */}
              {cart.items.length > 0 && (
                <Link to="/shop" className="self-start">
                  <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium font-Jost flex items-center gap-2 transition-colors">
                    <ArrowRight className="h-4 w-4 rotate-180" />
                    Continue Shopping
                  </button>
                </Link>
              )}
            </div>
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <span className="text-red-700 font-Jost text-sm">{error}</span>
            </div>
          )}
          
          {/* Empty Cart State */}
          {cart.items.length === 0 ? (
            <div className="text-center py-16 md:py-24">
              <div className="max-w-md mx-auto">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-gray-100 rounded-full mb-4">
                    <ShoppingBag className="h-10 w-10 md:h-12 md:w-12 text-gray-400" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold font-Manrope text-gray-900 mb-3">
                    Your cart is empty
                  </h2>
                  <p className="font-Jost text-gray-600 mb-8 text-sm md:text-base">
                    Looks like you haven't added anything to your cart yet. Start shopping to fill it up!
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Link to="/shop">
                    <button className="w-full bg-gray-900 text-white px-6 py-3 md:px-8 md:py-4 rounded-lg hover:bg-gray-800 transition-colors font-Jost text-sm md:text-base font-medium">
                      Continue Shopping
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* Cart with Items */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Cart Items Section */}
              <div className="lg:col-span-2">
                <div className="space-y-4">
                  {/* Your Items Header with Clear All Items Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                    <h2 className="text-lg md:text-xl font-semibold font-Manrope text-gray-900">
                      Your Items
                    </h2>
                    <button
                      onClick={clearCart}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium font-Jost flex items-center justify-center gap-2 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear All Items
                    </button>
                  </div>
                  
                  {/* Cart Items List */}
                  <div className="space-y-4">
                    {isCartLoading ? (
                      // Show skeleton loaders while cart is loading
                      Array.from({ length: 3 }).map((_, index) => (
                        <CartItemSkeleton key={index} />
                      ))
                    ) : (
                      cart.items.map((item) => (
                        <CartItem key={`${item.id}-${item.item.is_product ? 'product' : 'bundle'}`} item={item} />
                      ))
                    )}
                  </div>
                </div>
              </div>
              
              {/* Order Summary Section */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm sticky top-6">
                  {/* Header */}
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold font-Manrope text-gray-900">
                      Order Summary
                    </h2>
                  </div>
                  
                  {/* Summary Details */}
                  <div className="p-6 space-y-4">
                    {/* Items Count */}
                    <div className="flex justify-between text-sm">
                      <span className="font-Jost text-gray-600">
                        Items ({cart.items.length})
                      </span>
                      <span className="font-medium font-Manrope text-gray-900">
                        {displaySubtotal.toLocaleString(country === 'Nigeria' ? 'en-NG' : 'en-US', {
                          style: 'currency',
                          currency: currency,
                          minimumFractionDigits: 0
                        })}
                      </span>
                    </div>
                    
                    {/* Shipping Info */}
                    <div className="flex justify-between text-sm">
                      <span className="font-Jost text-gray-600">Shipping</span>
                      <span className="font-medium font-Manrope text-gray-900">
                        Calculated at checkout
                      </span>
                    </div>
                    
                    {/* Free Shipping Progress */}
                    {country === 'Nigeria' && subtotal < 7500 && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="h-4 w-4 text-blue-600" />
                          <span className="text-xs font-semibold text-blue-800">Free Shipping Progress</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-blue-700">Current: {subtotal.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 })}</span>
                            <span className="text-blue-700">Target: ₦7,500</span>
                          </div>
                          <div className="w-full bg-blue-100 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${Math.min((subtotal / 7500) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-blue-700">
                            Add {(7500 - subtotal).toLocaleString('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 })} more for free shipping!
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Tax (for international) */}
                    {displayTax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="font-Jost text-gray-600">Tax (5%)</span>
                        <span className="font-medium font-Manrope text-gray-900">
                          {displayTax.toLocaleString(country === 'Nigeria' ? 'en-NG' : 'en-US', {
                            style: 'currency',
                            currency: currency,
                            minimumFractionDigits: 0
                          })}
                        </span>
                      </div>
                    )}
                    
                    {/* Divider */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between text-lg font-bold">
                        <span className="font-Manrope text-gray-900">Total</span>
                        <span className="font-Manrope text-gray-900">
                          {displayTotal.toLocaleString(country === 'Nigeria' ? 'en-NG' : 'en-US', {
                            style: 'currency',
                            currency: currency,
                            minimumFractionDigits: 0
                          })}
                        </span>
                      </div>
                    </div>
                    
                    {/* Checkout Button */}
                    <Link to="/checkout">
                      <button
                        className="w-full mt-6 bg-gray-900 text-white py-4 px-6 rounded-lg font-semibold font-Manrope hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={cart.items.some((item) => item.item.stock_quantity === 0)}
                      >
                        <span>Proceed to Checkout</span>
                        <ArrowRight className="h-5 w-5" />
                      </button>
                    </Link>
                    
                    {/* Warning for out of stock items */}
                    {cart.items.some((item) => item.item.stock_quantity === 0) && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                          <p className="text-xs text-red-700 font-Jost">
                            Remove out of stock items to continue checkout
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Shipping Note */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 font-Jost text-center">
                        {country === 'Nigeria'
                          ? '🚚 Local delivery fees will be calculated at checkout based on your location.'
                          : '✈️ International shipping fees will be provided via email after order confirmation.'}
                      </p>
                    </div>
                    
                    {/* Security Badge */}
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="font-Jost">Secure Checkout</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Suspense fallback={null}>
        <WhatsAppChatWidget />
        <Footer />
      </Suspense>
    </div>
  );
};

export default Cart;