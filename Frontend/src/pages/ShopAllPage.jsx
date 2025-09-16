import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar2 from '../components/Navbar2';
import Footer from '../components/Footer';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { CurrencyContext } from '../pages/CurrencyContext';

// Hook to update meta tags dynamically
const useMetaTags = (title, description) => {
  useEffect(() => {
    // Update title
    document.title = title;
    
    // Update or create meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = description;
    
    // Cleanup on component unmount
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
  const [currentFilter, setCurrentFilter] = useState('All');
  const [sortBy, setSortBy] = useState('default');
  const [page, setPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileLayout, setMobileLayout] = useState('two');
  const { user } = useAuth();
  const { currency, exchangeRate, country, loading: contextLoading } = useContext(CurrencyContext);
  const navigate = useNavigate();
  const itemsPerPage = 16;
  const category = searchParams.get('category');
  const filterCategories = ['All', 'Briefs', 'Gymwear', 'New Arrivals', '3 in 1', '5 in 1'];
  const categoryMap = {
    'New Arrivals': 'new',
    'Briefs': 'briefs',
    'Gymwear': 'gymwear',
    '3 in 1': '3in1',
    '5 in 1': '5in1'
  };
  const reverseCategoryMap = {
    'new': 'New Arrivals',
    'briefs': 'Briefs',
    'gymwear': 'Gymwear',
    '3in1': '3 in 1',
    '5in1': '5 in 1'
  };

  // Meta tags configuration for each category
  const metaConfig = {
    'All': {
      title: 'Shop All - Premium Boxers, Gymwears & Bundles | The Tia Brand',
      description: 'Explore our complete collection of premium underwear, activewear, and exclusive bundles. Premium comfort wear designed for everyday luxury.'
    },
    'Briefs': {
      title: 'Premium Boxers & Briefs Collection | The Tia Brand',
      description: 'Discover our luxury boxers and briefs collection. Premium comfort underwear with superior fit, breathable fabrics, and modern designs.'
    },
    'Gymwear': {
      title: 'Premium Gymwear & Activewear Collection | The Tia Brand',
      description: 'Shop high-performance gymwear and activewear. Moisture-wicking fabrics, superior comfort, and stylish designs for your workout routine.'
    },
    'New Arrivals': {
      title: 'New Arrivals - Latest Comfort Wear Collection | The Tia Brand',
      description: 'Discover our newest arrivals in premium comfort wear. Be the first to experience our latest boxers, gymwears, and exclusive bundle designs.'
    },
    '3 in 1': {
      title: '3-in-1 Premium Bundles Collection | The Tia Brand',
      description: 'Explore our exclusive 3-in-1 bundles featuring coordinated boxers, gymwears, and accessories. Perfect matching sets for ultimate style and comfort.'
    },
    '5 in 1': {
      title: '5-in-1 Luxury Bundles Collection | The Tia Brand',
      description: 'Discover our premium 5-in-1 bundles with complete outfit coordination. Multiple pieces designed to work together for versatile styling options.'
    }
  };

  // Use meta tags hook
  const currentMeta = metaConfig[currentFilter] || metaConfig['All'];
  useMetaTags(currentMeta.title, currentMeta.description);

  // Helper function to check if a product is a brief
  const isBrief = useCallback((product) => {
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
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = category ? `/shopall?category=${category}` : `/shopall`;
      const res = await api.get(endpoint);
  
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
          category: item.category, // Include category for brief detection
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
          sizes: item.sizes || [], // Include sizes for add to cart
        };
      });
  
      // Sort to show briefs first when "All" is selected
      if (!category) {
        processedData.sort((a, b) => {
          const aIsBrief = isBrief(a);
          const bIsBrief = isBrief(b);
          
          // Sort briefs first, then everything else
          if (aIsBrief && !bIsBrief) return -1; // a comes before b
          if (!aIsBrief && bIsBrief) return 1;  // b comes before a
          return 0; // maintain original order for non-briefs
        });
      }
  
      setProducts(processedData);
      setCurrentFilter(reverseCategoryMap[category?.toLowerCase()] || 'All');
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [category, isBrief]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    if (currentFilter === '3 in 1' || currentFilter === '5 in 1') {
      filtered = filtered.filter(item =>
        !item.is_product &&
        item.bundle_types?.includes(currentFilter === '3 in 1' ? '3-in-1' : '5-in-1')
      );
    }
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
  }, [products, currentFilter, sortBy]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, page * itemsPerPage);
  }, [filteredProducts, page]);

  const hasMoreProducts = displayedProducts.length < filteredProducts.length;

  const handleFilterChange = (filter) => {
    setCurrentFilter(filter);
    const newParams = new URLSearchParams();
    if (filter !== 'All') {
      newParams.set('category', categoryMap[filter] || filter.toLowerCase());
    }
    setSearchParams(newParams);
    setPage(1);
  };

  const handleAddToCart = async (id, name, isProduct) => {
    // Redirect to product details page for proper size/color selection
    navigate(`/product/${id}`);
  };

  const handleImageError = (e) => {
    e.target.src = 'https://via.placeholder.com/400x500?text=No+Image';
  };

  const getPageTitle = () => currentFilter === 'All' ? 'All Products' : currentFilter;
  const getPageDescription = () => currentFilter === 'All'
    ? 'Premium comfort, tailored for everyday movement.'
    : `Explore our ${currentFilter.toLowerCase()} collection.`;

  if (loading || contextLoading) {
    return (
      <div className="container-padding typography  flex flex-col min-h-screen">
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
      {/* CollectionPage Schema for SEO */}
      <CollectionPageSchema />
      <Navbar2 />
      <div className="typography container-padding flex flex-col pt-20 py-8 px-2 sm:px-3 lg:px-4 flex-1">
        <div className="mb-8">
          <h3 className="text-3xl font-bold mb-2 capitalize">{getPageTitle()}</h3>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h4 className="font-light text-gray-600">{getPageDescription()}</h4>
            <p className="text-sm text-gray-500">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex flex-wrap gap-3">
              {filterCategories.map((filter) => (
                <button
                  key={filter}
                  onClick={() => handleFilterChange(filter)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    currentFilter === filter
                      ? 'bg-accent text-black'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
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
      </div>
      <Footer />
    </div>
  );
};

const ProductCard = ({ product, onImageError }) => {
  const { id, name, price, image, is_product, variantId, bundle_types } = product;
  const { currency, exchangeRate, country } = useContext(CurrencyContext);
  
  // Clean product name (remove trailing "– Something")
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
          <p className="text-lg sm:text-xl font-semibold font-Jost text-Accent">
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

export default ShopAllPage;