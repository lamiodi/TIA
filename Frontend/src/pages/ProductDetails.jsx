import React, { useEffect, useState, useContext } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import axios from 'axios';
import {
  ChevronLeft, ChevronRight, Heart, Minus, Plus, Share2, ShoppingCart, Star, Check, Truck, Shield, RotateCcw, Package
} from 'lucide-react';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { CurrencyContext } from '../pages/CurrencyContext';
import ReviewSection from '../components/ReviewSection';
import DescriptionSection from '../components/DescriptionSection';
import { toastSuccess, toastError } from '../utils/toastConfig';
const API_BASE_URL = 'http://localhost:5000';
const ProductDetails = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  // Add error handling for context access
  let currencyContext;
  try {
    currencyContext = useContext(CurrencyContext);
  } catch (error) {
    console.error('Error accessing CurrencyContext:', error);
    // Fallback values if context fails
    currencyContext = { 
      currency: 'NGN', 
      exchangeRate: 1, 
      country: 'Nigeria', 
      contextLoading: false 
    };
  }
  
  // Destructure with default values
  const { 
    currency = 'NGN', 
    exchangeRate = 1, 
    country = 'Nigeria', 
    contextLoading = false 
  } = currencyContext || {};
  
  const variantParam = searchParams.get('variant');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productData, setProductData] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [bundleType, setBundleType] = useState('3-in-1');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedBundleVariants, setSelectedBundleVariants] = useState({});
  
  const colorMap = {
    'Black': '#000000',
    'White': '#FFFFFF',
    'Gray': '#808080',
    'Blue': '#0066CC',
    'Brown': '#8B4513',
    'Cream': '#F5F5DC',
    'Pink': '#FFC0CB',
  };
  
  // Helper function to decode JWT token
  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (err) {
      console.error('ProductDetails: Error decoding token:', err);
      return null;
    }
  };
  
  // Helper function to get the JWT token
  const getToken = () => {
    // First try to get token from user object
    if (user && user.token) {
      return user.token;
    }
    
    // If not in user object, get from localStorage
    return localStorage.getItem('token');
  };
  
  // Helper function to get user ID
  const getUserId = () => {
    const token = getToken();
    if (!token) return null;
    
    // Decode token to get ID
    const tokenData = decodeToken(token);
    return tokenData?.id;
  };
  
  // Helper function to check if user is authenticated
  const isAuthenticated = () => {
    const token = getToken();
    return !!token; // Just check if token exists
  };
  
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError('Product ID is missing');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/products/${id}`);
        
        // Validate response data
        if (!res.data) {
          setError('Invalid product data received');
          return;
        }
        
        setProductData(res.data);
        
        if (res.data.type === 'product') {
          const variants = Array.isArray(res.data.data.variants) ? res.data.data.variants : [];
          const variantIndex = variants.findIndex(
            (v) => v.variant_id?.toString() === variantParam
          );
          const variant = variantIndex !== -1 ? variants[variantIndex] : variants[0];
          
          if (variant) {
            setSelectedVariant(variant);
            setSelectedColor(variant?.color_name || null);
            setSelectedSize(variant?.sizes?.[0]?.size_name || null);
          }
        } else {
          setBundleType(res.data.data.bundle_type && ['3-in-1', '5-in-1'].includes(res.data.data.bundle_type) 
            ? res.data.data.bundle_type 
            : '3-in-1');
          setSelectedBundleVariants({});
          
          const sizes = res.data.data.items?.[0]?.all_variants?.[0]?.sizes || [];
          setSelectedSize(sizes[0]?.size_name || null);
        }
      } catch (err) {
        console.error('Product fetch error:', err);
        setError(err.response?.data?.error || err.message || 'Failed to fetch product');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id, variantParam]);
  
  const handleColorChange = (colorName) => {
    if (!productData || productData.type !== 'product') return;
    
    const variants = Array.isArray(productData.data.variants) ? productData.data.variants : [];
    const variant = variants.find((v) => v.color_name === colorName);
    
    if (variant) {
      setSelectedVariant(variant);
      setSelectedColor(variant.color_name);
      setSelectedSize(variant.sizes?.[0]?.size_name || null);
      setSelectedImage(0);
    }
  };
  
  const handleSizeChange = (sizeName) => {
    setSelectedSize(sizeName);
    
    if (productData && productData.type === 'bundle') {
      const updatedVariants = {};
      Object.entries(selectedBundleVariants).forEach(([key, selection]) => {
        updatedVariants[key] = {
          ...selection,
          sizeName: sizeName,
        };
      });
      setSelectedBundleVariants(updatedVariants);
    }
  };
  
  const handleBundleTypeChange = (newBundleType) => {
    const currentSelections = Object.keys(selectedBundleVariants).length;
    const newMax = newBundleType === '3-in-1' ? 3 : 5;
    
    if (currentSelections > newMax) {
      setSelectedBundleVariants({});
      setSelectedSize(null);
    }
    
    setBundleType(newBundleType);
  };
  
  const handleBundleColorSelection = (variant) => {
    const maxSelections = bundleType === '3-in-1' ? 3 : 5;
    const totalSelected = Object.keys(selectedBundleVariants).length;
    
    if (totalSelected >= maxSelections) return;
    
    if (!selectedSize) {
      toastError('Please select a size first.');
      return;
    }
    
    const sizeMap = {
      S: 'Small',
      M: 'Medium',
      L: 'Large',
      XL: 'XL',
      XXL: 'XXL',
    };
    
    const reverseSizeMap = Object.fromEntries(Object.entries(sizeMap).map(([k, v]) => [v, k]));
    const sizes = Array.isArray(variant.sizes) ? variant.sizes : [];
    
    let sizeObj =
      sizes.find((s) => s.size_name === selectedSize) ||
      sizes.find((s) => s.size_name === sizeMap[selectedSize]) ||
      sizes.find((s) => s.size_name === reverseSizeMap[selectedSize]) ||
      sizes.find((s) => s.size_name?.toLowerCase() === selectedSize?.toLowerCase());
    
    if (!sizeObj || !sizeObj.size_id) {
      toastError(`No valid size_id found for ${variant.color_name} (${selectedSize})`);
      return;
    }
    
    const nextIndex = Object.keys(selectedBundleVariants).length;
    setSelectedBundleVariants((prev) => ({
      ...prev,
      [nextIndex]: {
        variantId: variant.variant_id,
        colorName: variant.color_name,
        sizeName: sizeObj.size_name,
        sizeId: sizeObj.size_id,
      },
    }));
  };
  
  const removeBundleColor = (indexToRemove) => {
    const newSelections = {};
    let newIndex = 0;
    Object.entries(selectedBundleVariants).forEach(([key, selection]) => {
      if (parseInt(key) !== indexToRemove) {
        newSelections[newIndex] = selection;
        newIndex++;
      }
    });
    setSelectedBundleVariants(newSelections);
  };
  
  const handleAddToCart = async () => {
    try {
      if (!isAuthenticated()) {
        console.log('ProductDetails.jsx: No authenticated user, redirecting to /login');
        toastError('Please log in to add items to cart');
        navigate(`/login`, { 
          state: { 
            from: `/product/${id}${variantParam ? `?variant=${variantParam}` : ''}` 
          } 
        });
        return;
      }
      
      const userId = getUserId();
      if (!userId) {
        throw new Error('Could not determine user ID from authentication data');
      }
      
      const token = getToken();
      
      // Single product
      if (productData.type === 'product') {
        if (!selectedVariant || !selectedSize) {
          toastError('Please select color and size');
          return;
        }
        
        const sizes = Array.isArray(selectedVariant.sizes) ? selectedVariant.sizes : [];
        const selectedSizeObj = sizes.find((s) => s.size_name === selectedSize);
        
        if (!selectedSizeObj) {
          toastError('Invalid size selected');
          return;
        }
        
        console.log('Adding to cart: user_id=', userId, 'variant_id=', selectedVariant.variant_id, 'size_id=', selectedSizeObj.size_id);
        
        const authAxios = axios.create({
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        await authAxios.post(`${API_BASE_URL}/api/cart`, {
          user_id: userId,
          product_type: 'single',
          variant_id: selectedVariant.variant_id,
          size_id: selectedSizeObj.size_id,
          quantity,
        });
        
        toastSuccess('Product added to cart');
        window.dispatchEvent(new Event('cartUpdated'));
      }
      // Bundle product
      else if (productData.type === 'bundle') {
        const totalRequired = bundleType === '3-in-1' ? 3 : 5;
        const selectedItems = Object.values(selectedBundleVariants);
        
        if (selectedItems.length !== totalRequired) {
          toastError(`Please select ${totalRequired} items for the ${bundleType} bundle`);
          return;
        }
        
        const allComplete = selectedItems.every((item) => item.variantId && item.sizeId);
        if (!allComplete) {
          toastError('Each bundle item must have both color and size selected');
          return;
        }
        
        console.log('Adding bundle to cart: user_id=', userId, 'bundle_id=', productData.data.id, 'items=', selectedItems);
        
        const authAxios = axios.create({
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        await authAxios.post(`${API_BASE_URL}/api/cart`, {
          user_id: userId,
          product_type: 'bundle',
          bundle_id: productData.data.id,
          quantity,
          items: selectedItems.map((item) => ({
            variant_id: item.variantId,
            size_id: item.sizeId,
          })),
        });
        
        toastSuccess('Bundle added to cart');
        window.dispatchEvent(new Event('cartUpdated'));
        
        // Reset bundle progress after adding to cart
        setSelectedBundleVariants({});
      }
    } catch (err) {
      console.error('❌ Add to cart error:', err.response?.data || err.message);
      
      if (err.response?.status === 401) {
        toastError('Your session has expired. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login', { 
          state: { 
            from: `/product/${id}${variantParam ? `?variant=${variantParam}` : ''}` 
          } 
        });
      } else {
        toastError(err.response?.data?.error || 'Failed to add to cart. Please try again.');
      }
    }
  };
  
  const toggleWishlist = () => {
    if (!isAuthenticated()) {
      toastError('Please log in to add items to wishlist');
      navigate(`/login`, { 
        state: { 
          from: `/product/${id}${variantParam ? `?variant=${variantParam}` : ''}` 
        } 
      });
      return;
    }
    setIsWishlisted(!isWishlisted);
  };
  
  const getBundlePrice = () => {
    if (!productData || productData.type !== 'bundle') return 0;
    const basePrice = parseFloat(productData.data.price) || 0;
    return bundleType === '5-in-1' ? basePrice * 1.5 : basePrice;
  };
  
  if (loading || contextLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-gray-600">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-sm font-Jost">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (error || !productData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 font-Manrope">Oops! Product Not Found</h2>
          <p className="text-gray-600 font-Jost">{error || 'Failed to load product'}</p>
        </div>
      </div>
    );
  }
  
  // Safely extract data with null checks
  const { type, data } = productData || {};
  const isProduct = type === 'product';
  const images = isProduct 
    ? (Array.isArray(selectedVariant?.images) ? selectedVariant.images : []) 
    : (Array.isArray(data?.images) ? data.images : []);
  const name = data?.name || 'Unnamed Product';
  const rawPrice = isProduct ? data?.price : getBundlePrice();
  const parsedPrice = parseFloat(rawPrice) || 0;
  const displayPrice = country === 'Nigeria' ? parsedPrice : (parsedPrice * exchangeRate).toFixed(2);
  const displayCurrency = country === 'Nigeria' ? 'NGN' : 'USD';
  const description = data?.description || 'No description available';
  const colorOptions = isProduct 
    ? (Array.isArray(data?.variants) ? data.variants.map((v) => v.color_name).filter(Boolean) : []) 
    : [];
  const sizeOptions = isProduct
    ? (Array.isArray(selectedVariant?.sizes) ? selectedVariant.sizes : [])
    : (Array.isArray(data?.items?.[0]?.all_variants?.[0]?.sizes) ? data.items[0].all_variants[0].sizes : []);
  const bundleTypes = ['3-in-1', '5-in-1'];
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4">
        {/* Breadcrumb */}
        <nav className="flex mb-8 text-sm font-Jost">
          <a href="/home" className="text-gray-500 hover:text-Primarycolor">Home</a>
          <span className="mx-2 text-gray-400">/</span>
          <a href="/shop" className="text-gray-500 hover:text-gray-700">Products</a>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-Primarycolor font-medium font-Jost">{name}</span>
        </nav>
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Image Section */}
            <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white">
              <div className="space-y-6">
                {/* Main Image */}
                <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-lg group">
                  <img
                    src={images[selectedImage] || 'https://via.placeholder.com/500'}
                    alt="Product"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Bundle Badge */}
                  {!isProduct && (
                    <div className="absolute top-4 left-4 bg-gradient-to-r font-Manrope from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                      <Package className="w-4 h-4" />
                      <span>Bundle</span>
                    </div>
                  )}
                  {/* Navigation Buttons */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImage((selectedImage - 1 + images.length) % images.length)}
                        className="absolute top-1/2 left-4 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-200 hover:scale-110"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setSelectedImage((selectedImage + 1) % images.length)}
                        className="absolute top-1/2 right-4 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-200 hover:scale-110"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  {/* Image Counter */}
                  {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-Jost">
                      {selectedImage + 1} / {images.length}
                    </div>
                  )}
                </div>
                {/* Thumbnail Images */}
                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-3">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        className={`relative aspect-square rounded-lg overflow-hidden transition-all duration-200 ${
                          selectedImage === idx ? 'ring-2 ring-gray-900 shadow-lg' : 'hover:shadow-md hover:scale-105'
                        }`}
                        onClick={() => setSelectedImage(idx)}
                      >
                        <img
                          src={img}
                          alt={`thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {selectedImage === idx && (
                          <div className="absolute inset-0 bg-gray-900/20"></div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Product Info Section */}
            <div className="p-3 sm:p-4 md:p-12">
              <div className="space-y-8">
                {/* Header */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight font-Manrope">{name}</h1>
                      <div className="flex items-center mt-2 space-x-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 font-Jost">(4.8) · 128 reviews</span>
                      </div>
                    </div>
                    <button
                      onClick={toggleWishlist}
                      className={`p-3 rounded-full transition-all duration-200 ${
                        isWishlisted ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <p className="text-3xl font-bold text-gray-900 font-Manrope">
                      {parseFloat(displayPrice).toLocaleString(country === 'Nigeria' ? 'en-NG' : 'en-US', { 
                        style: 'currency', 
                        currency: displayCurrency,
                        minimumFractionDigits: 2
                      })}
                    </p>
                    <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full font-Jost">In Stock</span>
                    {!isProduct && (
                      <span className="text-sm text-purple-600 bg-purple-50 px-2 py-1 rounded-full font-Jost">
                        {bundleType} Bundle
                      </span>
                    )}
                  </div>
                </div>
                {/* Product Options */}
                {isProduct && (
                  <div className="space-y-6">
                    {/* Color Selection */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 font-Manrope">
                        Color: <span className="font-normal font-Manrope text-gray-600">{selectedColor}</span>
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {colorOptions.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleColorChange(color)}
                            className={`relative flex items-center space-x-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                              color === selectedColor ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-full shadow-sm ${color === 'White' ? 'border border-gray-300' : ''}`}
                              style={{ backgroundColor: colorMap[color] || '#cccccc' }}
                            ></div>
                            <span className="text-sm font-medium font-Jost">{color}</span>
                            {color === selectedColor && (
                              <Check className="w-4 h-4 text-gray-900" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Size Selection */}
                    <div>
                      <h3 className="text-lg font-semibold text-Primarycolor font-Manrope mb-4">
                        Size: <span className="font-normal text-gray-600 font-Manrope">{selectedSize}</span>
                      </h3>
                      <div className="grid grid-cols-4 gap-3">
                        {sizeOptions.map((s) => (
                          <button
                            key={s.size_name}
                            onClick={() => handleSizeChange(s.size_name)}
                            disabled={s.stock_quantity === 0}
                            className={`relative py-3 px-2 text-sm font-Manrope font-medium border-2 rounded-xl transition-all duration-200 ${
                              selectedSize === s.size_name
                                ? 'border-Primarycolor bg-gray-900 text-white shadow-lg'
                                : s.stock_quantity > 0
                                ? 'border-gray-200 text-gray-900 hover:border-gray-300 hover:shadow-md'
                                : 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50'
                            }`}
                          >
                            {s.size_name}
                            {s.stock_quantity === 0 && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-full h-0.5 bg-gray-300 rotate-45"></div>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {/* Bundle Options */}
                {!isProduct && (
                  <div className="space-y-6">
                    {/* Bundle Type Selection */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 font-Manrope">Bundle Type</h3>
                      <div className="flex space-x-4">
                        {bundleTypes.map((type) => (
                          <button
                            key={type}
                            onClick={() => handleBundleTypeChange(type)}
                            className={`px-6 py-3 border-2 rounded-xl text-sm font-medium font-Manrope transition-all duration-200 ${
                              bundleType === type
                                ? 'border-gray-900 bg-gray-900 text-white shadow-lg'
                                : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-md'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Size Selection for Bundle */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 font-Manrope">
                        Size: <span className="font-normal text-gray-600 font-Manrope">{selectedSize}</span>
                      </h3>
                      <div className="grid grid-cols-4 gap-3">
                        {sizeOptions.map((size) => (
                          <button
                            key={size.size_name}
                            onClick={() => handleSizeChange(size.size_name)}
                            disabled={size.stock_quantity === 0}
                            className={`relative py-3 px-2 text-sm font-medium font-Manrope border-2 rounded-xl transition-all duration-200 ${
                              selectedSize === size.size_name
                                ? 'border-gray-900 bg-gray-900 text-white shadow-lg'
                                : size.stock_quantity > 0
                                ? 'border-gray-200 text-gray-900 hover:border-gray-300 hover:shadow-md'
                                : 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50'
                            }`}
                          >
                            {size.size_name}
                            {size.stock_quantity === 0 && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-full h-0.5 bg-gray-300 rotate-45"></div>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Bundle Color Selection */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 font-Manrope">
                        Select Items
                        <span className="text-sm font-normal text-gray-600 ml-2 font-Manrope">
                          ({Object.keys(selectedBundleVariants).length}/{bundleType === '3-in-1' ? '3' : '5'})
                        </span>
                      </h3>
                      <div className="p-6 border border-gray-200 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50">
                        {/* Available Colors */}
                        <div className="mb-6">
                          <h4 className="font-medium text-gray-900 mb-3 font-Manrope">Available Colors</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {(Array.isArray(data?.items?.[0]?.all_variants) ? data.items[0].all_variants : []).map((variant) => {
                              const colorCount = Object.values(selectedBundleVariants).filter(
                                (selection) => selection?.colorName === variant.color_name
                              ).length;
                              const maxSelections = bundleType === '3-in-1' ? 3 : 5;
                              const totalSelected = Object.keys(selectedBundleVariants).length;
                              const canSelect = totalSelected < maxSelections;
                              return (
                                <button
                                  key={`${variant.variant_id}-${Date.now()}`}
                                  onClick={() => handleBundleColorSelection(variant)}
                                  disabled={!canSelect}
                                  className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                                    colorCount > 0
                                      ? 'border-purple-500 bg-purple-100 shadow-lg'
                                      : canSelect
                                      ? 'border-gray-200 bg-white hover:border-gray-300'
                                      : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                                  }`}
                                >
                                  <div
                                    className={`w-8 h-8 rounded-full shadow-sm mb-2 ${
                                      variant.color_name === 'White' ? 'border-2 border-gray-300' : ''
                                    }`}
                                    style={{ backgroundColor: colorMap[variant.color_name] || '#cccccc' }}
                                  />
                                  <span className="text-sm font-medium text-center font-Jost">{variant.color_name}</span>
                                  {colorCount > 0 && (
                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                      {colorCount}
                                    </div>
                                  )}
                                  {canSelect && (
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                      +
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        {/* Selected Items Display */}
                        {Object.keys(selectedBundleVariants).length > 0 && (
                          <div className="mb-6">
                            <h4 className="font-medium text-gray-900 mb-3 font-Manrope">Selected Items</h4>
                            <div className="flex flex-wrap gap-3">
                              {Object.entries(selectedBundleVariants).map(([index, selection]) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm"
                                >
                                  <div className="flex items-center space-x-2">
                                    <div
                                      className={`w-5 h-5 rounded-full shadow-sm ${
                                        selection.colorName === 'White' ? 'border border-gray-300' : ''
                                      }`}
                                      style={{ backgroundColor: colorMap[selection.colorName] || '#cccccc' }}
                                    />
                                    <span className="text-sm font-medium text-gray-900 font-Jost">{selection.colorName}</span>
                                    <span className="text-xs text-gray-500 font-Jost">#{parseInt(index) + 1}</span>
                                  </div>
                                  <button
                                    onClick={() => removeBundleColor(parseInt(index))}
                                    className="text-red-400 hover:text-red-600 transition-colors ml-2"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Progress Indicator */}
                        <div className="pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 font-Jost">Bundle Progress</span>
                            <span className="font-medium text-purple-600 font-Jost">
                              {Object.keys(selectedBundleVariants).length}/{bundleType === '3-in-1' ? '3' : '5'} items selected
                            </span>
                          </div>
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                              style={{
                                width: `${(Object.keys(selectedBundleVariants).length / (bundleType === '3-in-1' ? 3 : 5)) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* Quantity and Add to Cart */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium font-Manrope text-gray-900">Quantity:</span>
                    <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-3 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-4 py-3 font-medium min-w-[60px] text-center font-Jost">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="p-3 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 py-4 bg-gray-900 text-white rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-gray-800 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      <ShoppingCart className="h-5 w-5 " />
                      <span className='font-Manrope'>Add to Cart</span>
                    </button>
                    <button className="p-4 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all duration-200 hover:shadow-md">
                      <Share2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                {/* Features */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100">
                  <div className="text-center space-y-2">
                    <Truck className="h-6 w-6 mx-auto text-gray-600" />
                    <p className="text-xs text-gray-600 font-Manrope">Free Shipping</p>
                  </div>
                  <div className="text-center space-y-2">
                    <RotateCcw className="h-6 w-6 mx-auto text-gray-600" />
                    <p className="text-xs text-gray-600 font-Manrope">Easy Returns</p>
                  </div>
                  <div className="text-center space-y-2">
                    <Shield className="h-6 w-6 mx-auto text-gray-600" />
                    <p className="text-xs text-gray-600 font-Manrope">2 Year Warranty</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DescriptionSection isProduct={isProduct} description={description} data={data} />
          <ReviewSection 
            productId={isProduct ? id : null} 
            bundleId={isProduct ? null : id} 
            productName={name} 
          />
        </div>
      </div>
      <Footer />
    </div>
  );
};
export default ProductDetails;