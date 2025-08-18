import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from './Button';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { CurrencyContext } from '../pages/CurrencyContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com';
const ProductGrid = () => {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mobileLayout, setMobileLayout] = useState('two');
  const { user } = useContext(AuthContext);
  const { currency, exchangeRate, country, contextLoading } = useContext(CurrencyContext);
  const navigate = useNavigate();
  const itemsPerPage = 12;
  const categories = ['All', 'Briefs', 'Gymwear', 'New Arrivals', '3 in 1', '5 in 1'];
  const categoryMap = {
    'Briefs': 'briefs',
    'Gymwear': 'gymwear',
    'New Arrivals': 'new',
    '3 in 1': '3in1',
    '5 in 1': '5in1'
  };

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let url = `${API_BASE_URL}/api/shopall`;
      if (filter !== 'All' && categoryMap[filter]) {
        url += `?category=${categoryMap[filter]}`;
      }
      const res = await axios.get(url);
      setProducts(res.data || []);
      setPage(1);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const displayedProducts = useMemo(() => {
    return products.slice(0, page * itemsPerPage);
  }, [products, page]);

  const hasMoreProducts = displayedProducts.length < products.length;

  const handleFilterChange = (category) => {
    setFilter(category);
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  const handleAddToCart = useCallback(async (id, name) => {
    if (!user) {
      navigate('/login');
      return;
    }
    console.log('Add to cart:', id, name);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/cart`,
        {
          user_id: user.id,
          variant_id: id,
          size_id: 1,
          quantity: 1,
          color_name: 'Default',
          size_name: 'M'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('Add to cart response:', response.data);
      alert(`${name} added to cart!`);
    } catch (err) {
      console.error('Add to cart error:', err);
      alert(err.response?.data?.error || 'Failed to add item to cart');
    }
  }, [user, navigate]);

  const handleImageError = useCallback((e) => {
    e.target.src = 'https://via.placeholder.com/400x500?text=No+Image';
  }, []);

  return (
    <div className="my-5">
      <div className="typography flex flex-col container-padding space-y-1 lg:py-8">
        <h3 className="text-2xl font-bold mb-2">Shop Our Collection</h3>
        <div className="flex flex-row justify-between items-center gap-y-4">
          <h4 className="font-light text-gray-600 text-balance sm:text-nowrap max-w-[320px]">
            Premium comfort, tailored for everyday movement.
          </h4>
          <Link to="/shop" className="text-black hover:text-accent transition-colors">
          <h4 className="font-semibold font-Manrope">SHOP <span className='hidden sm:inline font-Jost'>ALL</span></h4>
          </Link>
        </div>
      </div>
      <div className="flex flex-col items-center container-padding my-6">
        <Button
          label="FILTER & SORT"
          variant="primary"
          size="large"
          stateProp="default"
          className="w-60 mb-4"
          divClassName="bg-Softcolor w-full gap-x-1.5 font-Manrope rounded-sm"
          iconclassname="text-base"
          showIcon={true}
        />
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {categories.map((category) => (
            <div
              key={category}
              onClick={() => handleFilterChange(category)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 font-Manrope ${
                filter === category
                  ? 'bg-accent text-black font-bold'
                  : 'text-gray-700 hover:text-accent hover:bg-gray-100'
              }`}
              aria-pressed={filter === category}
            >
              {category}
            </div>
          ))}
        </div>
      </div>
      {loading || contextLoading ? (
        <div className="p-1">
          <div className="flex justify-end sm:hidden mb-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
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
          </div>
          <div className={`grid gap-2 sm:gap-3 md:gap-4 lg:gap-5 mb-8 ${
            mobileLayout === 'one' 
              ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
              : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
          } p-3`}>
            {[...Array(12)].map((_, index) => (
              <div key={index} className="bg-gray-100 rounded-xl p-3 animate-pulse shadow-sm">
                <div className="w-full aspect-[3/4] bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-3"></div>
                <div className="h-8 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="container-padding text-center py-8">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={fetchProducts}
            className="bg-accent text-black py-2 px-4 rounded hover:bg-accent-dark transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          {displayedProducts.length === 0 ? (
            <div className="container-padding text-center py-8">
              <p className="text-gray-500">No products found for the selected filter.</p>
            </div>
          ) : (
            <div className="container-padding">
              <div className="flex justify-end sm:hidden mb-2">
                <div className="flex bg-gray-100 rounded-lg p-1">
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
              </div>
              <div className={`grid px-0 gap-x-2 gap-y-[0.7em] sm:gap-x-3 sm:gap-y-[1.05em] md:gap-x-4 md:gap-y-[1.4em] lg:gap-x-3 lg:gap-y-[0.95em] mb-8 ${
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
            </div>
          )}
          {hasMoreProducts && (
            <div className="flex justify-center mt-8 mb-4">
              <Button
                label={`Load More (${products.length - displayedProducts.length} remaining)`}
                variant="tertiary"
                size="medium"
                stateProp="default"
                className="w-38"
                divClassName="w-full h-9"
                iconclassname="text-base"
                onClick={handleLoadMore}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

const ProductCard = ({ product, onAddToCart, onImageError }) => {
  const { id, name, price, image, color, is_product, variantId, bundle_types } = product;
  const { currency, exchangeRate, country } = useContext(CurrencyContext);
  
  // Log for debugging
  console.log('ProductCard context:', { currency, exchangeRate, country, price });
  
  // Clean product name (remove trailing "– Color")
  let displayName = name || 'Unnamed Product';
  if (displayName.includes('–')) {
    displayName = displayName.split('–')[0].trim();
  }
  
  const productUrl = is_product
    ? `/product/${id}${variantId ? `?variant=${variantId}` : ''}`
    : `/bundle/${id}`;
  
  // Price in NGN for Nigeria, USD for others
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
          <h3 className="text-sm sm:text-base font-semibold font-Manrope text-Primarycolor mb-2 line-clamp-2 leading-tight group-hover:text-Primarycolor transition-colors duration-200">
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
            onClick={() => onAddToCart(variantId || id, displayName)}
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

export default ProductGrid;