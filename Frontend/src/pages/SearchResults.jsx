// pages/SearchResults.jsx
import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { CurrencyContext } from '../pages/CurrencyContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : 'https://tia-backend-r331.onrender.com/api';

const api = axios.create({ baseURL: API_BASE_URL });

const SearchResults = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('default');
  const [page, setPage] = useState(1);
  const [searchParams] = useSearchParams();
  const [mobileLayout, setMobileLayout] = useState('two');
  const { user } = useAuth();
  const { currency, exchangeRate, country, loading: contextLoading } = useContext(CurrencyContext);
  const navigate = useNavigate();
  const itemsPerPage = 16;
  
  // Get search query parameter
  const searchQuery = searchParams.get('q');

  const fetchSearchResults = useCallback(async () => {
    if (!searchQuery) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/shopall/search?q=${encodeURIComponent(searchQuery)}`);
  
      if (!Array.isArray(res.data)) {
        throw new Error('Unexpected response format');
      }
  
      const processedData = res.data.map(item => {
        const baseItem = {
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
          created_at: item.created_at,
        };
  
        if (!item.is_product) {
          return {
            ...baseItem,
            is_product: false,
            bundle_types: item.bundle_types || [],
          };
        }
  
        return {
          ...baseItem,
          is_product: true,
          variantId: item.variantId,
          sizes: item.sizes || [],
        };
      });
  
      setProducts(processedData);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to fetch search results');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchSearchResults();
  }, [fetchSearchResults]);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'name':
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        break;
      default:
        break;
    }
    return filtered;
  }, [products, sortBy]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, page * itemsPerPage);
  }, [filteredProducts, page]);

  const hasMoreProducts = displayedProducts.length < filteredProducts.length;

  const handleAddToCart = async (id, name, isProduct) => {
    try {
      if (!user || !user.id) {
        console.log('SearchResults.jsx: No user authenticated, redirecting to /login');
        navigate('/login', { state: { from: `/search?q=${searchQuery}` } });
        return;
      }
      if (isProduct) {
        // Fetch product details to get variant and size
        const res = await api.get(`/products/${id}`);
        const product = res.data;
        if (product.type !== 'product' || !product.data.variants?.length) {
          alert('Invalid product data');
          return;
        }
        const variant = product.data.variants[0]; // Use first variant
        const size = variant.sizes?.[0]; // Use first size
        if (!variant || !size) {
          alert('No valid variant or size available');
          return;
        }
        await api.post('/cart', {
          user_id: user.id,
          variant_id: variant.variant_id,
          size_id: size.size_id,
          quantity: 1,
          color_name: variant.color_name || 'Default',
          size_name: size.size_name || 'M',
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        alert(`${name} added to cart!`);
      } else {
        // Fetch bundle details
        const res = await api.get(`/products/${id}`);
        const bundle = res.data;
        if (bundle.type !== 'bundle' || !bundle.data.items?.length) {
          alert('Invalid bundle data');
          return;
        }
        // Use first variant and size for simplicity
        const variant = bundle.data.items[0]?.all_variants?.[0];
        const size = variant?.sizes?.[0];
        if (!variant || !size) {
          alert('No valid variant or size available for bundle');
          return;
        }
        await api.post('/cart', {
          user_id: user.id,
          bundle_id: id,
          quantity: 1,
          items: [{
            variant_id: variant.variant_id,
            size_id: size.size_id,
          }],
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        alert(`${name} bundle added to cart!`);
      }
    } catch (err) {
      console.error('❌ Add to cart error:', err);
      alert('Failed to add to cart. Please try again.');
    }
  };

  const handleImageError = (e) => {
    e.target.src = 'https://via.placeholder.com/400x500?text=No+Image';
  };

  if (loading || contextLoading) {
    return (
      <div className="typography container-padding flex flex-col min-h-screen">
        <Navbar />
        <div className={`grid gap-2 sm:gap-3 md:gap-4 lg:gap-5 mb-8 ${
          mobileLayout === 'one' 
            ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
            : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
        }`}>
          {[...Array(12)].map((_, index) => (
            <div key={index} className="bg-gray-100 rounded-xl p-3 animate-pulse shadow-sm">
              <div className="w-full aspect-[3/4] bg-gray-200 rounded-lg mb-3"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="typography container-padding flex flex-col min-h-screen">
        <Navbar />
        <div className="text-center py-12">
          <h3 className="text-red-600 mb-4">Error</h3>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={fetchSearchResults}
            className="mt-4 bg-accent text-black px-6 py-2 rounded hover:bg-accent-dark transition"
          >
            Try Again
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="typography container-padding flex flex-col py-8 px-2 sm:px-3 lg:px-4 flex-1">
        <div className="mb-8">
          <h3 className="text-3xl font-bold mb-2">Search Results for "{searchQuery}"</h3>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h4 className="font-light text-gray-600">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
            </h4>
          </div>
        </div>
        
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex sm:hidden bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setMobileLayout('one')}
                  className={`p-2 rounded-md transition-colors ${
                    mobileLayout === 'one'
                      ? 'bg-white shadow-sm text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Single column view"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setMobileLayout('two')}
                  className={`p-2 rounded-md transition-colors ${
                    mobileLayout === 'two'
                      ? 'bg-white shadow-sm text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Two column view"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h7M4 12h7M4 18h7M15 6h5M15 12h5M15 18h5" />
                  </svg>
                </button>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-Primarycolor focus:border-transparent"
              >
                <option value="default">Sort by: Default</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>
        </div>
        
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium mb-2">No results found</h3>
            <p className="text-gray-600">Try a different search term or browse our categories</p>
          </div>
        ) : (
          <>
            <div className={`grid gap-x-2 gap-y-[0.7em] sm:gap-x-3 sm:gap-y-[1.05em] md:gap-x-4 md:gap-y-[1.4em] lg:gap-x-3 lg:gap-y-[0.95em] mb-8 ${
              mobileLayout === 'one' 
                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
                : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
            }`}>
              {displayedProducts.map((product, index) => (
                <ProductCard
                  key={`${product.is_product ? 'product' : 'bundle'}-${product.id}-${index}`}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onImageError={handleImageError}
                />
              ))}
            </div>
            
            {hasMoreProducts && (
              <div className="flex justify-center">
                <Button
                  label={`Load More (${filteredProducts.length - displayedProducts.length} remaining)`}
                  variant="tertiary"
                  size="medium"
                  stateProp="default"
                  className="w-38"
                  divClassName="w-full h-9"
                  iconclassname="text-base"
                  onClick={() => setPage(prev => prev + 1)}
                />
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

const ProductCard = ({ product, onAddToCart, onImageError }) => {
  const { id, name, price, image, is_product, variantId, bundle_types } = product;
  const { currency, exchangeRate, country } = useContext(CurrencyContext);
  
  // Clean product name (remove trailing "– Something")
  let displayName = name || 'Unnamed Product';
  if (displayName.includes('–')) {
    displayName = displayName.split('–')[0].trim();
  }
  
  // Generate product URL based on type
  const productUrl = is_product
    ? `/product/${id}${variantId ? `?variant=${variantId}` : ''}`
    : `/bundle/${id}`;
    
  // Format price based on currency
  const parsedPrice = parseFloat(price) || 0;
  const displayPrice = country === 'Nigeria' ? parsedPrice : (parsedPrice * exchangeRate).toFixed(2);
  const displayCurrency = country === 'Nigeria' ? 'NGN' : 'USD';
  
  return (
    <div className="group bg-white shadow-lg rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full border border-gray-100">
      <Link to={productUrl} className="block relative overflow-hidden">
        <div className="relative w-full aspect-[3/4] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          <img
            src={image}
            alt={displayName}
            className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500 ease-out"
            onError={onImageError}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300"></div>
          {bundle_types?.[0] && (
            <span className="absolute top-3 right-3 bg-Primarycolor text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-md backdrop-blur-sm">
              {bundle_types[0]}
            </span>
          )}
        </div>
        <div className="p-3 sm:p-4">
          <h3 className="text-sm sm:text-base font-semibold text-Primarycolor mb-2 line-clamp-2 leading-tight group-hover:text-Primarycolor transition-colors duration-200">
            {displayName}
          </h3>
          <p className="text-lg sm:text-xl font-semibold font-Manrope text-Accent">
            {parseFloat(displayPrice).toLocaleString(country === 'Nigeria' ? 'en-NG' : 'en-US', { 
              style: 'currency', 
              currency: displayCurrency,
              minimumFractionDigits: 2
            })}
          </p>
        </div>
      </Link>
      <div className="p-3 sm:p-4 pt-1 mt-auto">
        <Link to={productUrl}>
          <button
            className="w-full bg-gradient-to-r from-black to-gray-800 text-white font-semibold py-3 px-4 rounded-lg hover:from-gray-800 hover:to-black active:scale-95 text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform group-hover:translate-y-0"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5A1 1 0 006.9 19H19M9 19a1 1 0 102 0 1 1 0 00-2 0zm8 0a1 1 0 102 0 1 1 0 00-2 0z"
              />
            </svg>
            Buy Now
          </button>
        </Link>
      </div>
    </div>
  );
};

export default SearchResults;