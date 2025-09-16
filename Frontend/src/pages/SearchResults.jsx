import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar2 from '../components/Navbar2';
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
  const [searchCategory, setSearchCategory] = useState(searchParams.get('category') || ''); // New state
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
      let url = `/shopall/search?q=${encodeURIComponent(searchQuery)}`;
      
      // Add category filter if provided
      if (searchCategory) {
        url += `&category=${encodeURIComponent(searchCategory)}`;
      }
      
      const res = await api.get(url);
  
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
  }, [searchQuery, searchCategory]);

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
    // Redirect to product details page for proper size/color selection
    navigate(`/product/${id}`);
  };

  const handleImageError = (e) => {
    e.target.src = 'https://via.placeholder.com/400x500?text=No+Image';
  };

  if (loading || contextLoading) {
    return (
      <div className="typography container-padding flex flex-col min-h-screen">
        <Navbar2 />
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
        <Navbar2 />
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
      <Navbar2 />
      <div className="typography container-padding flex flex-col pt-20 py-8 px-2 sm:px-3 lg:px-4 flex-1">
        <div className="mb-10">
          <div className="border-b border-gray-200 pb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Search Results for <span className="text-blue-600">"{searchQuery}"</span>
            </h1>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                </span>
              </div>
              {filteredProducts.length > 0 && (
                <p className="text-sm text-gray-600 font-medium">
                  Showing <span className="font-bold text-gray-900">{Math.min(displayedProducts.length, filteredProducts.length)}</span> of <span className="font-bold text-gray-900">{filteredProducts.length}</span> products
                </p>
              )}
            </div>
          </div>
        </div>
        
        <div className="mb-10">
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-end">
               <div className="flex flex-row gap-6 flex-1">
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-semibold text-gray-800 mb-3">Filter by Category</label>
                  <select
                    value={searchCategory}
                    onChange={(e) => setSearchCategory(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium transition-all duration-200 hover:border-gray-400"
                  >
                    <option value="">All Categories</option>
                    <option value="briefs">Briefs</option>
                    <option value="gymwear">Gymwear</option>
                    <option value="new">New Arrivals</option>
                    <option value="3in1">3 in 1</option>
                    <option value="5in1">5 in 1</option>
                  </select>
                </div>
                
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-semibold text-gray-800 mb-3">Sort Products</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium transition-all duration-200 hover:border-gray-400"
                  >
                    <option value="default">Default Order</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name">Name: A to Z</option>
                    <option value="newest">Newest First</option>
                  </select>
                </div>
              </div>
              
              <div className="sm:hidden w-full lg:w-auto">
                <label className="block text-sm font-semibold text-gray-800 mb-3">Display View</label>
                <div className="flex bg-white rounded-xl p-2 border-2 border-gray-300 w-full">
                  <button
                    onClick={() => setMobileLayout('one')}
                    className={`flex-1 p-3 rounded-lg transition-all duration-200 text-sm font-semibold ${
                      mobileLayout === 'one'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                    title="Single column view"
                  >
                    <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setMobileLayout('two')}
                    className={`flex-1 p-3 rounded-lg transition-all duration-200 text-sm font-semibold ${
                      mobileLayout === 'two'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                    title="Two column view"
                  >
                    <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h7M4 12h7M4 18h7M15 6h5M15 12h5M15 18h5" />
                    </svg>
                  </button>
                </div>
              </div>
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
            <div className={`grid gap-4 sm:gap-5 md:gap-6 mb-8 ${
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
          {/* Updated to show all bundle types */}
          {bundle_types && bundle_types.length > 0 && (
            <div className="absolute top-3 right-3 flex flex-col gap-1">
              {bundle_types.map((type, index) => (
                <span key={index} className="bg-Primarycolor text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-md backdrop-blur-sm">
                  {type}
                </span>
              ))}
            </div>
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
              minimumFractionDigits: country === 'Nigeria' ? 0 : 2
            })}
          </p>
        </div>
      </Link>
      <div className="p-3 sm:p-4 pt-1 mt-auto">
        <Link to={productUrl}>
          <button
            className="w-full bg-gradient-to-r from-black to-gray-800 text-white font-semibold py-3 px-4 rounded-lg hover:from-gray-800 hover:to-black active:scale-95 text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform group-hover:translate-y-0"
          >
            Shop Now
          </button>
        </Link>
      </div>
    </div>
  );
};

export default SearchResults;