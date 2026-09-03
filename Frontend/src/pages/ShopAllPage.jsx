import React, { useState, useEffect, useCallback, useMemo, useContext, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar2 from '../components/Navbar2';
import Footer from '../components/Footer';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { CurrencyContext } from '../pages/CurrencyContext';
import { Ban, ChevronDown } from 'lucide-react';
import giftCardImage from '../assets/images/GiftCardImage.png';
import imgWhite from '../assets/im/IMG_6222.PNG';
import imgBlack from '../assets/im/IMG_6254.PNG';
import imgGrey from '../assets/im/IMG_6255.PNG';
import { getCardImageUrl, optimizeCloudinaryVideoUrl } from '../utils/imageUtils';

// Hook to update meta tags dynamically
const useMetaTags = (title, description) => {
  useEffect(() => {
    document.title = title;
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = description;
    return () => {
      document.title = 'The TiaBrand - Premium Comfort Wear';
    };
  }, [title, description]);
};

const CollectionPageSchema = ({ products = [] }) => {
  const pageTitle = 'Shop All | The TiaBrand';
  const pageDescription = 'Explore our luxury collection of underwear, boxer briefs, lounge sets, and activewear.';
  const pageUrl = window.location.href;
  
  const itemListElement = products.slice(0, 16).map((product, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": product.name || 'TiaBrand Product',
    "url": `${window.location.origin}/product/${product.id}`
  }));

  return (
    <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": pageTitle,
        "description": pageDescription,
        "url": pageUrl,
        "mainEntity": {
          "@type": "ItemList",
          "itemListElement": itemListElement
        }
      })}
    </script>
  );
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : 'https://tia-backend-r331.onrender.com/api';
const api = axios.create({ baseURL: API_BASE_URL });

const ShopAllPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentFilter, setCurrentFilter] = useState('ALL');
  const [subFilter, setSubFilter] = useState('VIEW ALL');
  const [sortBy, setSortBy] = useState('default');
  const [page, setPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileLayout, setMobileLayout] = useState('two');
  const { user } = useAuth();
  const { currency, exchangeRate, country, loading: contextLoading } = useContext(CurrencyContext);
  const navigate = useNavigate();
  const itemsPerPage = 16;
  
  const category = searchParams.get('category');

  const primaryFilters = ['ALL', 'BRIEFS', 'LOUNGE SETS', '3 IN 1', '5 IN 1', 'NEW ARRIVALS', 'GIFT CARDS'];

  // Removed subFiltersMap as per new requirement for flat filter list

  const categoryMap = {
    'ALL': 'all',
    'BRIEFS': 'briefs',
    'LOUNGE SETS': 'lounge sets',
    '3 IN 1': '3in1',
    '5 IN 1': '5in1',
    'NEW ARRIVALS': 'new',
    'GIFT CARDS': 'gift-cards'
  };

  const reverseCategoryMap = {
    'all': 'ALL',
    'briefs': 'BRIEFS',
    'lounge set': 'LOUNGE SETS', // Handle singular backend response
    'lounge sets': 'LOUNGE SETS',
    '3in1': '3 IN 1',
    '5in1': '5 IN 1',
    'new': 'NEW ARRIVALS',
    'gift-cards': 'GIFT CARDS'
  };

  // Meta tags configuration
  const metaConfig = {
    'ALL': {
      title: 'Shop All - Premium Boxers, Gymwears & Bundles | The TiaBrand',
      description: 'Explore our complete collection of premium underwear, activewear, and exclusive bundles.'
    },
    'BRIEFS': {
      title: 'Premium Boxers & Briefs Collection | The TiaBrand',
      description: 'Discover our luxury boxers and briefs collection. Premium comfort underwear with superior fit, breathable fabrics, and modern designs.'
    },
    'LOUNGE SETS': {
      title: 'Lounge Sets Collection | The TiaBrand',
      description: 'Shop our coordinated lounge sets. Perfect matching combinations for style and comfort.'
    },
    '3 IN 1': {
      title: '3-in-1 Premium Bundles Collection | The TiaBrand',
      description: 'Explore our exclusive 3-in-1 bundles featuring coordinated boxers, gymwears, and accessories.'
    },
    '5 IN 1': {
      title: '5-in-1 Luxury Bundles Collection | The TiaBrand',
      description: 'Discover our premium 5-in-1 bundles with complete outfit coordination.'
    },
    'NEW ARRIVALS': {
      title: 'New Arrivals - Latest Comfort Wear Collection | The TiaBrand',
      description: 'Discover our newest arrivals in premium comfort wear. Be the first to experience our latest designs.'
    },
    'GIFT CARDS': {
      title: 'The Tia Brand Gift Card | The TiaBrand',
      description: 'Give the perfect gift with The Tia Brand Gift Card. Available in various denominations.'
    }
  };

  const currentMeta = metaConfig[currentFilter] || metaConfig['ALL'];
  useMetaTags(currentMeta.title, currentMeta.description);

  // Helper to check for brief keywords
  const isBrief = useCallback((product) => {
    if (!product) return false;
    // Check bundles
    if (!product.is_product && product.bundle_types?.length > 0) {
      return product.bundle_types.some(type => {
        const t = type.toLowerCase();
        return t.includes('brief') || t.includes('underwear') || t.includes('boxer') || t.includes('trunk');
      });
    }
    // Check products
    const name = (product.name || '').toLowerCase();
    const cat = (product.category || '').toLowerCase();
    return name.includes('brief') || name.includes('boxer') || name.includes('underwear') || name.includes('trunk') || cat === 'briefs';
  }, []);

  const GIFT_CARD_PRODUCT = useMemo(() => ({
    id: 'gift-card',
    name: 'The Tia Brand Gift Card',
    price: 100000,
    image: giftCardImage,
    is_product: true,
    is_gift_card: true,
    category: 'Gift Cards',
    sizes: [],
    variants: [],
    allow_preorder: false,
    is_new_release: false
  }), []);

  // Fetch products based on primary filter
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const catParam = category ? category.toLowerCase() : 'all';
      
      let processedData = [];

      // If category is specifically 'gift-cards', we don't need to fetch from backend (unless we store them there later)
      // For now, we only fetch real products if it's NOT just gift-cards
      if (catParam !== 'gift-cards') {
        const endpoint = `/shopall?category=${catParam}`;
        const res = await api.get(endpoint);

        if (!Array.isArray(res.data)) {
          throw new Error('Unexpected response format');
        }

        processedData = res.data.map(item => ({
          ...item,
          // Ensure numeric price
          price: Number(item.price) || 0,
          // Ensure array for bundle_types
          bundle_types: item.bundle_types || [],
          // Ensure array for sizes
          sizes: item.sizes || []
        }));
      }

      // Inject Gift Card if appropriate
      if (catParam === 'all' || catParam === 'gift-cards') {
        processedData.unshift(GIFT_CARD_PRODUCT);
      }

      setProducts(processedData);
      
      // Update primary filter state based on URL, or default to ALL
      const mappedFilter = reverseCategoryMap[catParam] || 'ALL';
      setCurrentFilter(mappedFilter);

    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [category, GIFT_CARD_PRODUCT]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset page when primary filter changes
  useEffect(() => {
    setPage(1);
  }, [currentFilter]);

  // Helper to check for sold out
  const isProductSoldOut = useCallback((product) => {
    if (!product.is_product) return false; // Bundles handling could be added if needed
    const sizes = product.sizes || [];
    return Array.isArray(sizes) && sizes.length > 0 && sizes.every(sz => (Number(sz.stock_quantity) || 0) <= 0);
  }, []);

  // Filter products based on sub-filter (Logic simplified since sub-filters removed)
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Sort Logic
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        break;
      default:
        // Default sort: 
        // 1. New Releases (top priority)
        // 2. Available Products (standard)
        // 3. Priority: Espresso Martini
        // 4. Gift Cards
        // 5. Briefs priority if 'ALL' filter
        // 6. Creation date (Newest first)
        
        filtered.sort((a, b) => {
             // 1. New Release Priority (always show new releases at top)
             if (a.is_new_release && !b.is_new_release) return -1;
             if (!a.is_new_release && b.is_new_release) return 1;

             // Check Sold Out status (Treat Pre-order as Available)
             const aSoldOut = isProductSoldOut(a) && !a.allow_preorder;
             const bSoldOut = isProductSoldOut(b) && !b.allow_preorder;

             // If one is sold out and the other isn't, available (or pre-order) comes first
             if (aSoldOut && !bSoldOut) return 1;
             if (!aSoldOut && bSoldOut) return -1;

             // Priority: Espresso Martini
             const aIsEspresso = (a.name || '').toLowerCase().includes('espresso martini');
             const bIsEspresso = (b.name || '').toLowerCase().includes('espresso martini');
             if (aIsEspresso && !bIsEspresso) return -1;
             if (!aIsEspresso && bIsEspresso) return 1;

             // Gift Cards
             if (a.is_gift_card && !b.is_gift_card) return -1;
             if (!a.is_gift_card && b.is_gift_card) return 1;

             // Fallback to Briefs logic if 'ALL' filter
             if (currentFilter === 'ALL') {
                const aBrief = isBrief(a);
                const bBrief = isBrief(b);
                if (aBrief && !bBrief) return -1;
                if (!aBrief && bBrief) return 1;
             }
             
             return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        });
        break;
    }

    // Restriction: "His and Hers" products should ONLY appear in 'ALL' filter
    // if (currentFilter !== 'ALL') {
    //   filtered = filtered.filter(p => !p.name.toLowerCase().includes('his and hers'));
    // }

    return filtered;
  }, [products, sortBy, currentFilter, isBrief]);

  const displayedProducts = useMemo(() => {
    let baseProducts = filteredProducts.slice(0, page * itemsPerPage);
    
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

    // Only inject on page 1, and only if filter is ALL or 5 IN 1
    if (page === 1 && promoCards.length > 0 && (currentFilter === 'ALL' || currentFilter === '5 IN 1')) {
      const newReleases = baseProducts.filter(p => p.is_new_release);
      const otherProducts = baseProducts.filter(p => !p.is_new_release);
      return [...newReleases, ...promoCards, ...otherProducts];
    }
    
    return baseProducts;
  }, [filteredProducts, page, products, currentFilter]);

  const hasMoreProducts = displayedProducts.length < filteredProducts.length;

  const handlePrimaryFilterChange = (filter) => {
    if (filter === currentFilter) return;
    setCurrentFilter(filter);
    const newParams = new URLSearchParams();
    if (filter !== 'ALL') {
      newParams.set('category', categoryMap[filter]);
    } else {
      newParams.delete('category');
    }
    setSearchParams(newParams);
    // Subfilter reset handled by useEffect
  };

  const handleAddToCart = (id) => {
    navigate(`/product/${id}`);
  };

  const handleImageError = (e) => {
    e.target.src = 'https://via.placeholder.com/400x500?text=No+Image';
  };

  const getPageTitle = () => {
    if (currentFilter === 'ALL') return 'All Products';
    return currentFilter;
  };
  
  const getPageDescription = () => {
    if (currentFilter === 'NEW ARRIVALS') return 'Check out our latest additions.';
    if (currentFilter === 'HIS') return 'Premium collection for Him.';
    if (currentFilter === 'HERS') return 'Premium collection for Her.';
    return 'Premium comfort, tailored for everyday movement.';
  };

  if (loading || contextLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar2 />
        <div className="typography container-padding flex flex-col pt-20 py-8 px-2 sm:px-3 lg:px-4 flex-1">
          {/* Header skeleton */}
          <div className="mb-8 space-y-3">
            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <div className="h-4 w-72 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
          {/* Filter bar skeleton */}
          <div className="mb-8 space-y-4">
            <div className="flex gap-3 pb-4 border-b border-gray-100">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="h-8 w-20 bg-gray-200 rounded-full animate-pulse hidden sm:block" />
              ))}
              <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse sm:hidden" />
            </div>
            <div className="flex justify-end gap-2">
              <div className="h-8 w-24 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
          {/* Product grid skeleton */}
          <div className="grid gap-x-3 gap-y-6 mb-8 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col">
                <div className="aspect-[3/4] bg-gray-200 animate-pulse rounded-t-xl" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="typography container-padding flex flex-col min-h-screen">
        <Navbar2 />
        <div className="text-center py-12 pt-32">
          <h3 className="text-red-600 mb-4">Error</h3>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={fetchProducts}
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
      <CollectionPageSchema products={displayedProducts} />
      <Navbar2 />
      <div className="typography container-padding flex flex-col pt-20 py-8 px-2 sm:px-3 lg:px-4 flex-1">
        
        {/* Header Section */}
        <div className="mb-8">
          <h3 className="text-3xl font-bold mb-2 capitalize">{getPageTitle()}</h3>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h4 className="font-light text-gray-600">{getPageDescription()}</h4>
            <p className="text-sm text-gray-500">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>

        {/* Filter Section */}
        <div className="mb-8 space-y-6">
          {/* Primary Filters */}
          <div className="flex flex-col sm:flex-row gap-4 border-b border-gray-200 pb-4">
             {/* Mobile Filter Dropdown */}
             <div className="sm:hidden w-full relative">
               <select 
                 value={currentFilter} 
                 onChange={(e) => handlePrimaryFilterChange(e.target.value)}
                 className="w-full p-3 pr-10 border border-gray-200 rounded-lg text-base font-medium focus:ring-1 focus:ring-black focus:border-black bg-white appearance-none text-gray-800"
               >
                 {primaryFilters.map((filter) => (
                   <option key={filter} value={filter}>{filter}</option>
                 ))}
               </select>
               <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                 <ChevronDown className="w-5 h-5" />
               </div>
             </div>

             {/* Desktop Filter Buttons */}
             <div className="hidden sm:flex flex-wrap gap-3 justify-start">
                {primaryFilters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => handlePrimaryFilterChange(filter)}
                    className={`px-6 py-2 rounded-full text-sm font-bold tracking-wide transition-all duration-300 ${
                      currentFilter === filter
                        ? 'bg-black text-white shadow-md transform scale-105'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-black'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
             </div>
          </div>

          {/* Sub Filters & Sort - Sub Filters removed */}
          <div className="flex flex-col sm:flex-row justify-end items-center gap-4">
            
            {/* Layout & Sort */}
            <div className="flex items-center justify-between w-full sm:w-auto sm:gap-3">
               <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setMobileLayout('one')}
                  className={`p-1.5 rounded-md transition-colors ${
                    mobileLayout === 'one' ? 'bg-white shadow-sm text-black' : 'text-gray-400'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <button
                  onClick={() => setMobileLayout('two')}
                  className={`p-1.5 rounded-md transition-colors ${
                    mobileLayout === 'two' ? 'bg-white shadow-sm text-black' : 'text-gray-400'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h7M4 12h7M4 18h7M15 6h5M15 12h5M15 18h5" /></svg>
                </button>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-black cursor-pointer bg-white"
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

        {/* Product Grid */}
        <div className={`grid gap-x-3 gap-y-6 mb-8 ${
          mobileLayout === 'one' 
            ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
            : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
        }`}>
          {displayedProducts.map((product, index) => (
            <ProductCard
              key={`${product.is_promo ? 'promo-' + product.preloadColor : product.is_product ? 'product' : 'bundle'}-${product.id}-${index}`}
              product={product}
              onAddToCart={handleAddToCart}
              onImageError={handleImageError}
              priority={index < 4}
            />
          ))}
        </div>

        {/* Load More */}
        {hasMoreProducts && (
          <div className="flex justify-center mt-8">
            <Button
              label={`Load More (${filteredProducts.length - displayedProducts.length} remaining)`}
              variant="tertiary"
              size="medium"
              onClick={() => setPage(prev => prev + 1)}
            />
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

const ProductCard = ({ product, onImageError, priority = false }) => {
  const { id, name, price, image, video_url, is_product, variantId, bundle_types, allow_preorder, is_promo, preloadColor } = product;
  const { currency, exchangeRate, country } = useContext(CurrencyContext);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const cardRef = useRef(null);
  const videoRef = useRef(null);

  const sizes = product.sizes || [];
  const isSoldOut = is_product && Array.isArray(sizes) && sizes.length > 0 && sizes.every(sz => (Number(sz.stock_quantity) || 0) <= 0);
  
  const isPreorder = isSoldOut && allow_preorder;

  let displayName = name || 'Unnamed Product';
  if (!is_promo && displayName.includes('–')) {
    displayName = displayName.split('–')[0].trim();
  }
  
  const productUrl = product.is_gift_card
    ? '/gift-cards'
    : is_promo
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

  const hasVideo = !!optimizedVideo && !videoFailed && !product.is_gift_card;

  // Viewport Observer to optimize video loading and playback
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

  // Safely manage video playback when in viewport
  useEffect(() => {
    if (!hasVideo || !videoRef.current) return;
    videoRef.current.defaultMuted = true;
    videoRef.current.muted = true;
    if (isInView) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay policy prevented playback until user interaction
        });
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
      className="group bg-white shadow-sm hover:shadow-xl rounded-xl overflow-hidden transition-all duration-300 flex flex-col h-full border border-gray-100 relative"
    >
      <Link to={productUrl} className="block relative overflow-hidden flex-1">
        <div className={`relative w-full aspect-[3/4] overflow-hidden ${product.is_gift_card ? 'bg-[#E5D4C0] flex items-center justify-center p-3' : 'bg-gray-50'}`}>
          {!imgLoaded && (
            <div className="absolute inset-0 bg-stone-200/60 animate-pulse pointer-events-none" />
          )}
          
          {/* Base Image / Poster */}
          <img
            src={optimizedImage}
            alt={displayName}
            className={`w-full h-full ${product.is_gift_card ? 'object-contain filter drop-shadow-md' : 'object-cover object-center'} group-hover:scale-105 transition-transform duration-700 ease-out ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            } transition-opacity duration-300`}
            onError={onImageError}
            onLoad={() => setImgLoaded(true)}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
          />

          {/* Optimized Variant Video */}
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
              className={`absolute inset-0 w-full h-full object-cover object-center pointer-events-none group-hover:scale-105 transition-opacity duration-500 ease-out ${
                videoReady ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
             {product.is_new_release && (
               <span className="bg-black text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">New</span>
             )}
             {bundle_types?.[0] && (
                <span className="bg-white text-black text-[10px] font-bold px-2 py-1 uppercase tracking-wider border border-black">
                  {bundle_types[0]}
                </span>
             )}
             {product.is_gift_card && (
                <span className="bg-black text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">Gift Card</span>
             )}
          </div>

          {/* Video Indicator Badge */}
          {hasVideo && (
            <div className="absolute top-2 right-2 z-20 transition-opacity duration-300 bg-black/40 backdrop-blur-sm text-white p-1 rounded-full pointer-events-none flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}

          {/* Status Overlay */}
          {isPreorder ? (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-30">
              <span className="bg-blue-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-widest">
                Pre-order
              </span>
            </div>
          ) : isSoldOut && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-30">
              <span className="bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-widest">
                Sold Out
              </span>
            </div>
          )}
        </div>
        
        {/* Product Info */}
        <div className="p-4 flex flex-col gap-1">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-1 group-hover:text-gray-600 transition-colors">
            {displayName}
          </h3>
          <p className="text-sm font-semibold text-gray-900">
            {Number(displayPrice).toLocaleString(isUSD ? 'en-US' : 'en-NG', { 
              style: 'currency', 
              currency: displayCurrency,
              minimumFractionDigits: isUSD ? 2 : 0
            })}
          </p>
        </div>
      </Link>
    </div>
  );
};

export default ShopAllPage;
