import { useState, useEffect, useCallback, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CurrencyContext } from '../pages/CurrencyContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com';

const NewReleaseGrid = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const { user } = useContext(AuthContext);
  const { currency, exchangeRate, country, loading: contextLoading } = useContext(CurrencyContext);
  const navigate = useNavigate();

  // Show toast notification
  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  }, []);

  const fetchNewReleases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/shopall?category=new`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to fetch products');
      }
      const productData = await response.json();
      const filteredProducts = productData
        .filter(item => item.is_product)
        .map(item => ({
          ...item,
          productId: item.product_id || item.id
        }));
      setProducts(filteredProducts);
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch products';
      console.error('Fetch products error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNewReleases();
  }, [fetchNewReleases]);

  const handleAddToCart = useCallback(async (variantId, productName) => {
    if (!user) {
      console.log('User not logged in, redirecting to /login');
      navigate('/login', { state: { from: { pathname: '/cart' } } });
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No JWT token found');
      }
      
      // Use requestIdleCallback for non-critical work
      const addToCart = async () => {
        const response = await fetch(`${API_BASE_URL}/api/cart`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: user.id,
            variant_id: parseInt(variantId),
            size_id: 1,
            quantity: 1,
            color_name: 'Default',
            size_name: 'M',
          }),
        });
        
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to add item to cart');
        }
        
        // Use requestAnimationFrame for UI updates
        requestAnimationFrame(() => {
          showToast(`${productName} added to cart!`);
          window.dispatchEvent(new Event('cartUpdated'));
        });
      };
      
      // Use setTimeout to break up the task
      setTimeout(addToCart, 0);
      
    } catch (err) {
      console.error('Add to cart error:', {
        message: err.message,
        status: err.response?.status,
      });
      requestAnimationFrame(() => {
        showToast(`Failed to add ${productName} to cart: ${err.message}`, 'error');
      });
    }
  }, [user, navigate, showToast]);

  const handleImageError = useCallback((e) => {
    e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
  }, []);

  if (loading || contextLoading) {
    return (
      <div 
        className="typography flex flex-col container-padding space-y-1 lg:py-8 mb-4"
        style={{
          '--color-Primarycolor': '#1E1E1E',
          '--color-Secondarycolor': '#ffffff',
          '--color-Accent': '#6E6E6E',
          '--color-Softcolor': '#F5F5DC',
          '--font-Manrope': '"Manrope", "sans-serif"',
          '--font-Jost': '"Jost", "sans-serif"'
        }}
      >
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-x-4 w-max">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="w-[calc(100vw-2rem)] sm:w-[calc(50vw-1.5rem)] md:min-w-[240px] md:max-w-[240px] bg-gray-100 rounded-lg p-3 sm:p-4 flex-shrink-0">
                  <div className="w-full aspect-[4/5] bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="typography flex flex-col container-padding space-y-1 lg:py-8 mb-4"
        style={{
          '--color-Primarycolor': '#1E1E1E',
          '--color-Secondarycolor': '#ffffff',
          '--color-Accent': '#6E6E6E',
          '--color-Softcolor': '#F5F5DC',
          '--font-Manrope': '"Manrope", "sans-serif"',
          '--font-Jost': '"Jost", "sans-serif"'
        }}
      >
        <h3 className="font-Manrope">New Release</h3>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4 font-Jost">Error: {error}</p>
          <button 
            onClick={fetchNewReleases}
            className="bg-accent text-Primarycolor py-2 px-4 rounded hover:bg-accent-dark transition-colors font-Jost"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="typography flex flex-col container-padding space-y-1 lg:py-8 mb-4"
      style={{
        '--color-Primarycolor': '#1E1E1E',
        '--color-Secondarycolor': '#ffffff',
        '--color-Accent': '#6E6E6E',
        '--color-Softcolor': '#F5F5DC',
        '--font-Manrope': '"Manrope", "sans-serif"',
        '--font-Jost': '"Jost", "sans-serif"'
      }}
    >
      <h3 className="text-2xl font-bold mb-2 font-Manrope">New Release</h3>
      <div className="flex flex-row justify-between items-center gap-y-4 mb-6">
        <h4 className="font-light text-gray-600 font-Manrope">Explore our latest products</h4>
        <Link to="/shop" className="text-black hover:text-accent transition-colors">
          <h4 className="font-semibold font-Manrope">SHOP <span className='hidden sm:inline font-Jost'>ALL</span></h4>
        </Link>
      </div>
      {products.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 font-Jost">No new releases available at the moment.</p>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4 scrollbar-hide">
          <div className="flex gap-x-4 w-max">
            {products.map((product, index) => (
              <ProductCard
                key={product.variantId}
                product={product}
                onAddToCart={handleAddToCart}
                onImageError={handleImageError}
                priority={index < 3} // Prioritize loading first 3 images
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Toast notification */}
      {toast.show && (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300 ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

const ProductCard = ({ product, onAddToCart, onImageError, priority }) => {
  const { name, price, image, productId, variantId } = product;
  const { currency, exchangeRate, country } = useContext(CurrencyContext);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Clean name to remove "– Something" or "(Color)" parts
  let displayName = name || 'Unnamed Product';
  if (displayName.includes('–')) {
    displayName = displayName.split('–')[0].trim();
  }
  if (displayName.match(/\((.*?)\)$/)) {
    displayName = displayName.replace(/\((.*?)\)$/, '').trim();
  }
  
  // Price in NGN for Nigeria, USD for others
  const parsedPrice = parseFloat(price) || 0;
  const displayPrice = country === 'Nigeria' ? parsedPrice : (parsedPrice * exchangeRate).toFixed(2);
  const displayCurrency = country === 'Nigeria' ? 'NGN' : 'USD';
  
  return (
    <div className="group w-[calc(100vw-2rem)] sm:w-[calc(50vw-1.5rem)] md:min-w-[240px] md:max-w-[240px] bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col flex-shrink-0">
      <Link to={`/product/${productId}?variant=${variantId}`} className="block">
        <div className="relative w-full aspect-[4/5] overflow-hidden bg-gray-100">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
          )}
          <img
            src={image}
            alt={displayName}
            className={`w-full h-full object-contain object-center transition-transform duration-300 ${
              imageLoaded ? 'hover:scale-105' : ''
            }`}
            onError={onImageError}
            onLoad={() => setImageLoaded(true)}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={priority ? "high" : "auto"}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 240px"
            style={{
              contentVisibility: priority ? 'auto' : 'auto',
            }}
          />
        </div>
        <div className="p-3 sm:p-4 flex-1 flex flex-col">
          <h3 className="text-sm sm:text-base font-semibold text-Primarycolor mb-2 line-clamp-2 leading-tight group-hover:text-Primarycolor transition-colors duration-200 font-Manrope">
            {displayName}
          </h3>
          <p className="text-lg sm:text-xl font-semibold font-Manrope text-Accent mt-auto">
            {parseFloat(displayPrice).toLocaleString(country === 'Nigeria' ? 'en-NG' : 'en-US', { 
              style: 'currency', 
              currency: displayCurrency,
              minimumFractionDigits: 2
            })}
          </p>
        </div>
      </Link>
      <div className="p-3 sm:p-4 pt-1">
        <Link to={`/product/${productId}?variant=${variantId}`}>
          <button
            onClick={(e) => {
              e.preventDefault();
              onAddToCart(variantId, displayName);
            }}
            className="w-full bg-gradient-to-r from-black to-gray-800 text-white font-semibold py-3 px-4 rounded-lg hover:from-gray-800 hover:to-black active:scale-95 text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl font-Jost"
            aria-label={`Add ${displayName} to cart`}
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

export default NewReleaseGrid;