import React, { useState, useEffect, useRef, useCallback } from 'react';
import Button from './Button';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const mobileVideoRef = useRef(null);
  const desktopVideoRef = useRef(null);

  // Cloudinary video URLs with optimized delivery parameters
  const mobileVideoURL = 'https://res.cloudinary.com/dgcwviufp/video/upload/f_auto,q_auto:eco,w_800/v1/CS_m65dwf';
  const desktopVideoURL = 'https://res.cloudinary.com/dgcwviufp/video/upload/f_auto,q_auto:eco,w_1200/v1/tia2_gljwos';

  // Memoized resize handler
  const handleResize = useCallback(() => {
    const newIsMobile = window.innerWidth < 1024;
    if (newIsMobile !== isMobile) {
      setIsMobile(newIsMobile);
    }
  }, [isMobile]);

  useEffect(() => {
    let timeoutId;
    const throttledResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };
    window.addEventListener('resize', throttledResize);
    return () => {
      window.removeEventListener('resize', throttledResize);
      clearTimeout(timeoutId);
    };
  }, [handleResize]);

  // Video loading optimization
  useEffect(() => {
    const activeVideoRef = isMobile ? mobileVideoRef : desktopVideoRef;
    const video = activeVideoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setVideoLoaded(true);
      setVideoError(false);
      
      // Start playback immediately when ready
      video.play().catch((error) => {
        console.warn('Video autoplay failed:', error);
      });
    };

    const handleError = (error) => {
      console.error('Video loading error:', error);
      setVideoError(true);
    };

    const handleLoadStart = () => {
      console.log('Video loading started');
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', handleLoadStart);

    // Force immediate loading
    video.preload = 'auto';
    video.load(); // Explicitly trigger loading

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadstart', handleLoadStart);
    };
  }, [isMobile]);

  return (
    <div className="flex container-padding flex-col justify-start items-center h-[77dvh] sm:h-[84dvh] md:h-[82dvh] lg:h-[740px] relative overflow-hidden">
      {/* Loading/Error States */}
      {!videoLoaded && !videoError && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center z-10">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full"></div>
        </div>
      )}
      {videoError && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black z-10">
          {/* Fallback background */}
        </div>
      )}
      
      {/* Mobile Video */}
      <video
        ref={mobileVideoRef}
        src={mobileVideoURL}
        type="video/mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        controls={false}
        disablePictureInPicture
        className={`absolute top-0 left-0 object-cover w-full h-full lg:hidden transition-opacity duration-200 ${
          videoLoaded && !videoError ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ 
          pointerEvents: 'none',
          transform: 'translateZ(0)',
          willChange: 'transform, opacity'
        }}
      />
      
      {/* Desktop Video */}
      <video
        ref={desktopVideoRef}
        src={desktopVideoURL}
        type="video/mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        controls={false}
        disablePictureInPicture
        className={`absolute top-0 left-0 object-cover w-full h-full hidden lg:block transition-opacity duration-200 ${
          videoLoaded && !videoError ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ 
          pointerEvents: 'none',
          transform: 'translateZ(0)',
          willChange: 'transform, opacity'
        }}
      />

      {/* Quick Nav */}
      <nav 
        className="container quicknav flex flex-row justify-between lg:max-w-[800px] mb-[40dvh] sm:mb-38 md:mb-50 lg:mb-[50dvh] z-25"
        role="navigation"
        aria-label="Product categories"
      >
        <Link 
          to="/shop?category=new" 
          className="text-white hover:text-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded px-2 py-1"
        >
          NEW ARRIVALS
        </Link>
        <Link 
          to="/shop?category=briefs" 
          className="text-white hover:text-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded px-2 py-1"
        >
          BRIEFS
        </Link>
        <Link 
          to="/shop?category=gymwear" 
          className="text-white hover:text-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded px-2 py-1"
        >
          GYM WEAR
        </Link>
        <Link 
          to="/shop" 
          className="text-white hover:text-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded px-2 py-1"
        >
          SHOP ALL
        </Link>
      </nav>

      {/* Hero Content */}
      <div className="flex flex-col items-center justify-center text-center lg:text-left lg:items-start lg:max-w-[800px] z-20">
        <h1 className="text-center lg:text-left text-nowrap lg:text-5xl text-3xl sm:text-4xl md:text-5xl font-[351] text-white mb-4 lg:mb-6">
          ELEVATE YOUR STYLE
        </h1>
        <p className="text-white text-sm sm:text-base md:text-lg mb-6 lg:mb-8 max-w-[500px] lg:max-w-[600px]">
          Discover premium quality activewear designed for performance and style. 
          Experience the perfect blend of comfort and fashion.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            to="/shop" 
            variant="primary"
            className="px-8 py-3 text-sm sm:text-base"
          >
            SHOP NOW
          </Button>
          <Button 
            to="/about" 
            variant="secondary"
            className="px-8 py-3 text-sm sm:text-base"
          >
            LEARN MORE
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;