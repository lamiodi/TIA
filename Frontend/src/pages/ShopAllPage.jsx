import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar2 from '../components/Navbar2';
import Footer from '../components/Footer';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { CurrencyContext } from '../pages/CurrencyContext';
import { Ban } from 'lucide-react';

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
      document.title = 'The Tia Brand - Premium Comfort Wear';
    };
  }, [title, description]);
};

const CollectionPageSchema = () => {
  const pageTitle = 'Shop All';
  const pageDescription = 'Explore our complete collection of premium underwear and activewear';
  const pageUrl = window.location.href;
  
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
          "itemListElement": []
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

  const primaryFilters = ['ALL', 'BRIEFS', 'LOUNGE SETS', '3 IN 1', '5 IN 1', 'NEW ARRIVALS'];

  // Removed subFiltersMap as per new requirement for flat filter list

  const categoryMap = {
    'ALL': 'all',
    'BRIEFS': 'briefs',
    'LOUNGE SETS': 'lounge sets',
    '3 IN 1': '3in1',
    '5 IN 1': '5in1',
    'NEW ARRIVALS': 'new'
  };

  const reverseCategoryMap = {
    'all': 'ALL',
    'briefs': 'BRIEFS',
    'lounge set': 'LOUNGE SETS', // Handle singular backend response
    'lounge sets': 'LOUNGE SETS',
    '3in1': '3 IN 1',
    '5in1': '5 IN 1',
    'new': 'NEW ARRIVALS'
  };

  // Meta tags configuration
  const metaConfig = {
    'ALL': {
      title: 'Shop All - Premium Boxers, Gymwears & Bundles | The Tia Brand',
      description: 'Explore our complete collection of premium underwear, activewear, and exclusive bundles.'
    },
    'BRIEFS': {
      title: 'Premium Boxers & Briefs Collection | The Tia Brand',
      description: 'Discover our luxury boxers and briefs collection. Premium comfort underwear with superior fit, breathable fabrics, and modern designs.'
    },
    'LOUNGE SETS': {
      title: 'Lounge Sets Collection | The Tia Brand',
      description: 'Shop our coordinated lounge sets. Perfect matching combinations for style and comfort.'
    },
    '3 IN 1': {
      title: '3-in-1 Premium Bundles Collection | The Tia Brand',
      description: 'Explore our exclusive 3-in-1 bundles featuring coordinated boxers, gymwears, and accessories.'
    },
    '5 IN 1': {
      title: '5-in-1 Luxury Bundles Collection | The Tia Brand',
      description: 'Discover our premium 5-in-1 bundles with complete outfit coordination.'
    },
    'NEW ARRIVALS': {
      title: 'New Arrivals - Latest Comfort Wear Collection | The Tia Brand',
      description: 'Discover our newest arrivals in premium comfort wear. Be the first to experience our latest designs.'
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

  // Fetch products based on primary filter
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const catParam = category ? category.toLowerCase() : 'all';
      // Map URL param to primary filter if possible, else default to ALL logic
      const endpoint = `/shopall?category=${catParam}`;
      const res = await api.get(endpoint);

      if (!Array.isArray(res.data)) {
        throw new Error('Unexpected response format');
      }

      const processedData = res.data.map(item => ({
        ...item,
        // Ensure numeric price
        price: Number(item.price) || 0,
        // Ensure array for bundle_types
        bundle_types: item.bundle_types || [],
        // Ensure array for sizes
        sizes: item.sizes || []
      }));

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
  }, [category]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset page when primary filter changes
  useEffect(() => {
    setPage(1);
  }, [currentFilter]);

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
        // Default sort: Briefs first if 'ALL'
        if (currentFilter === 'ALL') {
           filtered.sort((a, b) => {
             const aBrief = isBrief(a);
             const bBrief = isBrief(b);
             if (aBrief && !bBrief) return -1;
             if (!aBrief && bBrief) return 1;
             return 0;
           });
        }
        break;
    }
    return filtered;
  }, [products, sortBy, currentFilter, isBrief]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, page * itemsPerPage);
  }, [filteredProducts, page]);

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
      <div className="container-padding typography flex flex-col min-h-screen">
        <Navbar2 />
        <div className="pt-20 py-8 px-2 sm:px-3 lg:px-4 flex-1">
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
              {[...Array(10)].map((_, i) => (
                 <div key={i} className="bg-gray-100 h-64 rounded-xl animate-pulse"></div>
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
      <CollectionPageSchema />
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
          <div className="flex flex-wrap gap-3 justify-center sm:justify-start border-b border-gray-200 pb-4">
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

          {/* Sub Filters & Sort - Sub Filters removed */}
          <div className="flex flex-col sm:flex-row justify-end items-center gap-4">
            
            {/* Layout & Sort */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
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
              key={`${product.is_product ? 'product' : 'bundle'}-${product.id}-${index}`}
              product={product}
              onAddToCart={handleAddToCart}
              onImageError={handleImageError}
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

const ProductCard = ({ product, onImageError }) => {
  const { id, name, price, image, is_product, variantId, bundle_types } = product;
  const { currency, exchangeRate, country } = useContext(CurrencyContext);
  const sizes = product.sizes || [];
  const isSoldOut = is_product && Array.isArray(sizes) && sizes.length > 0 && sizes.every(sz => (Number(sz.stock_quantity) || 0) <= 0);
  
  let displayName = name || 'Unnamed Product';
  if (displayName.includes('–')) {
    displayName = displayName.split('–')[0].trim();
  }
  
  const productUrl = is_product
    ? `/product/${id}${variantId ? `?variant=${variantId}` : ''}`
    : `/bundle/${id}`;
    
  const parsedPrice = parseFloat(price) || 0;
  const displayPrice = country === 'Nigeria' ? parsedPrice : (parsedPrice * exchangeRate).toFixed(2);
  const displayCurrency = country === 'Nigeria' ? 'NGN' : 'USD';
  
  return (
    <div className="group bg-white shadow-sm hover:shadow-xl rounded-xl overflow-hidden transition-all duration-300 flex flex-col h-full border border-gray-100 relative">
      <Link to={productUrl} className="block relative overflow-hidden flex-1">
        <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-50">
          <img
            src={image}
            alt={displayName}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
            onError={onImageError}
            loading="lazy"
          />
          
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
          </div>

          {/* Sold Out Overlay */}
          {isSoldOut && (
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
            {parseFloat(displayPrice).toLocaleString(country === 'Nigeria' ? 'en-NG' : 'en-US', { 
              style: 'currency', 
              currency: displayCurrency,
              minimumFractionDigits: country === 'Nigeria' ? 0 : 2
            })}
          </p>
        </div>
      </Link>
    </div>
  );
};

export default ShopAllPage;
