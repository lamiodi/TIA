import React, { useState, useEffect, useCallback, useMemo, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from './Button';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { CurrencyContext } from '../pages/CurrencyContext';
import imgWhite from '../assets/im/IMG_6222.PNG';
import imgBlack from '../assets/im/IMG_6254.PNG';
import imgGrey from '../assets/im/IMG_6255.PNG';
import { getCardImageUrl, optimizeCloudinaryVideoUrl } from '../utils/imageUtils';

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
      
      // For "All" category, we want to get everything
      if (filter !== 'All' && categoryMap[filter]) {
        url += `?category=${categoryMap[filter]}`;
      }
      
      const res = await axios.get(url);
      let productsData = res.data || [];
      
      // If "All" category is selected, sort to show briefs first
      if (filter === 'All') {
        productsData = [...productsData].sort((a, b) => {
          // Helper function to check if a product is a brief
          const isBrief = (product) => {
            if (!product) return false;
            
            // For bundles, check bundle_types
            if (!product.is_product && product.bundle_types && product.bundle_types.length > 0) {
              return product.bundle_types.some(type => {
                const typeLower = type.toLowerCase();
                return typeLower.includes('brief') || 
                       typeLower.includes('underwear') ||
                       typeLower.includes('boxer') ||
                       typeLower.includes('trunk');
              });
            }
            
            // For products, check the name and category
            const name = (product.name || '').toLowerCase();
            const category = (product.category || '').toLowerCase();
            
            return name.includes('brief') || 
                   name.includes('boxer') || 
                   name.includes('underwear') ||
                   name.includes('trunk') ||
                   category === 'briefs';
          };
          
          const aIsBrief = isBrief(a);
          const bIsBrief = isBrief(b);
          
          // Priority: Espresso Martini
          const aIsEspresso = (a.name || '').toLowerCase().includes('espresso martini');
          const bIsEspresso = (b.name || '').toLowerCase().includes('espresso martini');
          if (aIsEspresso && !bIsEspresso) return -1;
          if (!aIsEspresso && bIsEspresso) return 1;

          // Sort briefs first, then everything else
          if (aIsBrief && !bIsBrief) return -1; // a comes before b
          if (!aIsBrief && bIsBrief) return 1;  // b comes before a
          return 0; // maintain original order for non-briefs
        });
      }
      
      setProducts(productsData);
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
    let baseProducts = products.slice(0, page * itemsPerPage);
    
    // Find the first valid bundle ID to use for our promo cards
    const bundleProduct = products.find(p => !p.is_product && p.bundle_types);
    const bundleId = bundleProduct ? bundleProduct.id : '';
    
    // Create the 3 promo cards
    const promoCards = bundleId ? [
      {
        id: bundleId,
        is_promo: true,
        preloadColor: 'White',
        name: '5-in-1 Premium Boxers – All White',
        price: '98000',
        image: imgWhite,
        is_product: false,
        bundle_types: ['5-in-1']
      },
      {
        id: bundleId,
        is_promo: true,
        preloadColor: 'Black',
        name: '5-in-1 Premium Boxers – All Black',
        price: '98000',
        image: imgBlack,
        is_product: false,
        bundle_types: ['5-in-1']
      },
      {
        id: bundleId,
        is_promo: true,
        preloadColor: 'Grey',
        name: '5-in-1 Premium Boxers – All Grey',
        price: '98000',
        image: imgGrey,
        is_product: false,
        bundle_types: ['5-in-1']
      }
    ] : [];

    // Only inject on page 1, and only if filter is All or 5 in 1
    if (page === 1 && promoCards.length > 0 && (filter === 'All' || filter === '5 in 1')) {
      return [...promoCards, ...baseProducts];
    }
    
    return baseProducts;
  }, [products, page, filter]);

  const hasMoreProducts = displayedProducts.length < products.length;

  const handleFilterChange = (category) => {
    setFilter(category);
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

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
          <h4 className="font-semibold font-Manrope">SHOP <span className='hidden font-semibold sm:inline font-Jost'>ALL</span></h4>
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
        <div className="container-padding ">
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
            <div className="container-padding px-1">
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
                    key={`${product.is_promo ? 'promo-' + product.preloadColor : product.is_product ? 'product' : 'bundle'}-${product.id}-${index}`}
                    product={product}
                    onImageError={handleImageError}
                    priority={index < 4}
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

const ProductCard = ({ product, onImageError, priority = false }) => {
  const { id, name, price, image, video_url, color, is_product, variantId, bundle_types, sizes, allow_preorder, is_promo, preloadColor } = product;
  const { currency, exchangeRate, country } = useContext(CurrencyContext);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const cardRef = useRef(null);
  const videoRef = useRef(null);
  
  // Clean product name (remove trailing "– Color")
  let displayName = name || 'Unnamed Product';
  if (!is_promo && displayName.includes('–')) {
    displayName = displayName.split('–')[0].trim();
  }
  
  // Calculate stock status
  const isOutOfStock = is_product && sizes && Array.isArray(sizes) 
    ? sizes.every(s => (Number(s.stock_quantity) || 0) <= 0)
    : false;
    
  const isPreorder = is_product && isOutOfStock && allow_preorder;
  
  const productUrl = is_promo
    ? `/bundle/${id}?preloadBundle=5-in-1&preloadColor=${preloadColor}`
    : is_product
      ? `/product/${id}${variantId ? `?variant=${variantId}` : ''}`
      : `/bundle/${id}`;
  
  const parsedPrice = parseFloat(price) || 0;
  const isUSD = currency === 'USD' || country !== 'Nigeria';
  const displayPrice = isUSD ? (parsedPrice / (exchangeRate || 1529.26)) : parsedPrice;
  const displayCurrency = isUSD ? 'USD' : 'NGN';

  const optimizedImage = useMemo(() => getCardImageUrl(image, 550), [image]);
  const optimizedVideo = useMemo(() => {
    if (!video_url) return null;
    return optimizeCloudinaryVideoUrl(video_url, { width: 550, quality: 'auto:eco' });
  }, [video_url]);

  const hasVideo = !!optimizedVideo && !videoFailed;

  useEffect(() => {
    if (!hasVideo || !cardRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { rootMargin: '300px 0px', threshold: 0.05 }
    );
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [hasVideo]);

  useEffect(() => {
    if (!hasVideo || !videoRef.current) return;
    videoRef.current.defaultMuted = true;
    videoRef.current.muted = true;
    if (isInView) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } else {
      videoRef.current.pause();
    }
  }, [isInView, hasVideo]);

  const setVideoRef = (el) => {
    videoRef.current = el;
    if (el) {
      el.defaultMuted = true;
      el.muted = true;
      if (isInView) {
        el.play().catch(() => {});
      }
    }
  };

  return (
    <div 
      ref={cardRef}
      onMouseEnter={() => {
        if (videoRef.current) {
          videoRef.current.play().catch(() => {});
        }
      }}
      className="group bg-white shadow-lg rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full border border-gray-100"
    >
      <Link to={productUrl} className="block relative overflow-hidden">
        <div className="relative w-full aspect-[3/4] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          {!imgLoaded && (
            <div className="absolute inset-0 bg-stone-200/60 animate-pulse pointer-events-none" />
          )}
          <img
            src={optimizedImage}
            alt={displayName}
            className={`w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500 ease-out ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            } transition-opacity duration-300`}
            onError={onImageError}
            onLoad={() => setImgLoaded(true)}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
          />

          {/* Variant Video */}
          {hasVideo && (
            <video
              ref={setVideoRef}
              src={optimizedVideo}
              autoPlay
              muted
              loop
              playsInline
              webkit-playsinline="true"
              preload="metadata"
              disablePictureInPicture
              disableRemotePlayback
              onLoadedData={() => setVideoReady(true)}
              onCanPlay={() => setVideoReady(true)}
              onPlay={() => setVideoReady(true)}
              onPlaying={() => setVideoReady(true)}
              onError={() => setVideoFailed(true)}
              className={`absolute inset-0 w-full h-full object-cover object-center pointer-events-none group-hover:scale-110 transition-opacity duration-500 ease-out ${
                videoReady ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300 pointer-events-none"></div>
          
          {/* Status Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
            {isPreorder ? (
              <span className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-md backdrop-blur-sm">
                Pre-order
              </span>
            ) : isOutOfStock ? (
              <span className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-md backdrop-blur-sm">
                Sold Out
              </span>
            ) : null}
          </div>

          {/* Video Indicator */}
          {hasVideo && (
            <div className="absolute top-3 right-3 z-10 bg-black/40 backdrop-blur-sm text-white p-1 rounded-full pointer-events-none flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}

          {/* Updated to show all bundle types */}
          {bundle_types && bundle_types.length > 0 && !hasVideo && (
            <div className="absolute top-3 right-3 flex flex-col gap-1 z-10">
              {bundle_types.map((type, index) => (
                <span key={index} className="bg-Primarycolor text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-md backdrop-blur-sm">
                  {type}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="p-3 sm:p-4">
          <h3 className="text-sm sm:text-base font-semibold font-Manrope text-Primarycolor mb-2 line-clamp-2 leading-tight group-hover:text-Primarycolor transition-colors duration-200">
            {displayName}
          </h3>
          <p className="text-lg sm:text-xl font-semibold font-Manrope text-Accent">
            {Number(displayPrice).toLocaleString(isUSD ? 'en-US' : 'en-NG', { 
              style: 'currency', 
              currency: displayCurrency,
              minimumFractionDigits: isUSD ? 2 : 0
            })}
          </p>
        </div>
      </Link>
      
      <div className="p-3 sm:p-4 pt-1 mt-auto">
        <Link to={productUrl}>
          <button
            className="w-full bg-gradient-to-r from-black to-gray-800 text-white font-semibold py-3 px-4 rounded-lg hover:from-gray-800 hover:to-black active:scale-95 text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform group-hover:translate-y-0"
          >
            {isPreorder ? 'Pre-order Now' : 'Shop Now'}
          </button>
        </Link>
      </div>
    </div>
  );
};

export default ProductGrid;
