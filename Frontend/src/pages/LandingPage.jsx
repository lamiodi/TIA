import React, { useState, useEffect, useRef, Suspense, lazy, useContext } from 'react';
import { Menu, X, Star, Shield, Truck, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar2 from '../components/Navbar2';
import { CurrencyContext } from '../pages/CurrencyContext';
import NewsletterForm from '../components/NewsletterForm';
import Footer from '../components/Footer';
import Button from '../components/Button';

// Lazy load components for better performance
const LocationPopup = lazy(() => import('../components/LocationPopup'));
const WhatsAppChatWidget = lazy(() => import('../components/WhatsAppChatWidget'));

const LandingPage = () => {
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState({ mobile: false, desktop: false });
  const mobileVideoRef = useRef(null);
  const desktopVideoRef = useRef(null);
  
  // Access currency context for dynamic price formatting
  const currencyContext = useContext(CurrencyContext) || {
    currency: 'NGN',
    exchangeRate: 1,
    country: 'Nigeria',
    contextLoading: false,
  };
  
  const {
    currency = 'NGN',
    exchangeRate = 1,
    country = 'Nigeria',
    contextLoading = false,
  } = currencyContext;
  
  // Helper function to format prices dynamically
  const formatPrice = (priceInNaira) => {
    const parsedPrice = parseFloat(priceInNaira.replace(/[₦,]/g, '')) || 0;
    const displayPrice = country === 'Nigeria' ? parsedPrice : (parsedPrice * exchangeRate);
    const displayCurrency = country === 'Nigeria' ? 'NGN' : 'USD';
    
    return displayPrice.toLocaleString(country === 'Nigeria' ? 'en-NG' : 'en-US', {
      style: 'currency',
      currency: displayCurrency,
      minimumFractionDigits: country === 'Nigeria' ? 0 : 2
    });
  };

  const handleVideoError = (videoType) => {
    console.error(`${videoType} video failed to load`);
    setVideoError(true);
  };

  const handleVideoLoaded = (videoType) => {
    console.log(`${videoType} video loaded successfully`);
    setVideoLoaded(prev => ({ ...prev, [videoType.toLowerCase()]: true }));
  };

  useEffect(() => {
    // Force video load on component mount
    if (mobileVideoRef.current) {
      mobileVideoRef.current.load();
    }
    if (desktopVideoRef.current) {
      desktopVideoRef.current.load();
    }
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-y-auto">
      {/* Navigation - Overlaying the hero section */}
      <Navbar2 />
      <main className="bg-Primarycolor">
        {/* Hero Section */}
        <section className="relative h-[85vh] md:h-[90vh] lg:h-screen bg-black overflow-hidden">
          {/* Cloudinary Videos */}
          <video
            ref={mobileVideoRef}
            className="absolute top-0 left-0 w-full h-full object-cover lg:hidden z-10"
            src="https://res.cloudinary.com/dgcwviufp/video/upload/f_mp4,q_auto:low,w_600,c_scale/v1/CS_m65dwf.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onError={() => handleVideoError('Mobile')}
            onLoadStart={() => console.log('Mobile video loading started')}
            onCanPlay={() => console.log('Mobile video can play')}
            onLoadedData={() => handleVideoLoaded('Mobile')}
          />
          <video
            ref={desktopVideoRef}
            className="absolute top-0 left-0 w-full h-full object-cover hidden lg:block z-10"
            src="https://res.cloudinary.com/dgcwviufp/video/upload/f_mp4,q_auto:low,w_1000,c_scale/v1/tia2_gljwos.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onError={() => handleVideoError('Desktop')}
            onLoadStart={() => console.log('Desktop video loading started')}
            onCanPlay={() => console.log('Desktop video can play')}
            onLoadedData={() => handleVideoLoaded('Desktop')}
          />
          
          {/* Debug overlay - shows if videos are not loading */}
          {videoError && (
            <div className="absolute inset-0 bg-red-500 bg-opacity-50 flex items-center justify-center z-30">
              <p className="text-white text-xl font-bold">Video Loading Error</p>
            </div>
          )}
          
          {/* Content overlay with transparent background */}
          <div className="relative z-30 container mx-auto lg:mx-5 h-full flex items-center md:items-end justify-start pt-12 sm:pt-16 md:pt-20 md:pb-16 lg:pt-0 lg:pb-32">
            <div className="typography flex flex-col w-full items-start space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-5 z-20 ml-2 lg:ml-8">
              <h1 className="text-left lgx:text-5xl leading-tight sm:leading-normal md:leading-relaxed">
                <span className="max-sm:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold">
                  <span className="max-sm:block sm:inline">UNMATCHED COMFORT.</span>
                  <span className="max-sm:hidden sm:inline"> BOLD PERFORMANCE.</span>
                </span>
                <br className="max-sm:hidden" />
                <span className="max-sm:text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl block mt-1 sm:mt-0 md:mt-1">
                  <span className="sm:hidden text-sm font-light font-Jost">STYLE FOR ALL</span>
                  <span className="hidden font-Jost sm:inline">EVERYDAY STYLE</span>
                </span>
              </h1>
              <Link to="/shop">
                <Button
                  label="SHOP NOW"
                  variant="primary"
                  size="medium"
                  stateProp="default"
                  className="w-44"
                  divClassName=""
                />
              </Link>
            </div>
          </div>
        </section>
        
        {/* Product Showcase Grid */}
        <section className="bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
            {/* Product 1 */}
            <div className="relative group cursor-pointer overflow-hidden">
              <div className="aspect-[4/5]">
                <img 
                  src="https://res.cloudinary.com/dgcwviufp/image/upload/v1756112981/Loginpic1_lki5se.jpg" 
                  alt="Sculpt Blush Collection" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-8 left-8 text-white">
                  <h3 className="text-3xl font-bold mb-2">THE MICHEAL JORDAN</h3>
                  <p className="text-lg mb-4">{formatPrice('₦19,999')}</p>
                  <Link to="/shop?category=briefs">
                    <button className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                      SHOP NOW
                    </button>
                  </Link>
                </div>
              </div>
            </div>
            {/* Product 2 */}
            <div className="relative group cursor-pointer overflow-hidden">
              <div className="aspect-[4/5]">
                <img 
                  src="https://res.cloudinary.com/dgcwviufp/image/upload/v1751100926/e2okih4fkrhkejikken4.webp" 
                  alt="Sculpt Bon Bon Collection" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-8 left-8 text-white">
                  <h3 className="text-3xl font-bold mb-2">YOU THE BOSS</h3>
                  <p className="text-lg mb-4">{formatPrice('₦19,000')}</p>
                  <Link to="/shop?category=briefs">
                    <button className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                      SHOP NOW
                    </button>
                  </Link>
                </div>
              </div>
            </div>
            {/* Product 3 */}
            <div className="relative group cursor-pointer overflow-hidden">
              <div className="aspect-[4/5]">
                <img 
                  src="https://res.cloudinary.com/dgcwviufp/image/upload/v1757873752/tinywow_IMG_2972_2__83441506_eqsdds.jpg" 
                  alt="Sculpt Storm Collection" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-8 left-8 text-white">
                  <h3 className="text-3xl font-bold mb-2">HIS AND HERS</h3>
                  <p className="text-lg mb-4">{formatPrice('₦103,850')}</p>
                  <Link to="/shop">
                    <button className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                      SHOP NOW
                    </button>
                  </Link>
                </div>
              </div>
            </div>
            {/* Product 4 */}
            <div className="relative group cursor-pointer overflow-hidden">
              <div className="aspect-[4/5]">
                <img 
                  src="https://res.cloudinary.com/dgcwviufp/image/upload/v1756112985/Signuppic2_q1rzbx.jpg" 
                  alt="Sculpt Premium Collection" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-8 left-8 text-white">
                  <h3 className="text-3xl font-bold mb-2">EVSS TEA I</h3>
                  <p className="text-lg mb-4">{formatPrice('₦52,850.00')}</p>
                  <Link to="/shop?category=gymwear">
                    <button className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                      SHOP NOW
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <NewsletterForm />
      </main>
      {/* Footer */}
      <Footer />
      
      {/* Lazy-loaded components for better performance */}
      <Suspense fallback={null}>
        <WhatsAppChatWidget />
      </Suspense>
      <Suspense fallback={null}>
        <LocationPopup />
      </Suspense>
    </div>
  );
};

export default LandingPage;