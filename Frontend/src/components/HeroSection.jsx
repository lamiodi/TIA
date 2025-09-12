import React, { useState, useEffect, useRef, useCallback } from 'react';
import Button from './Button';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);
  const mobileVideoRef = useRef(null);
  const desktopVideoRef = useRef(null);

  // Optimized Cloudinary video URLs with aggressive optimization
  const mobileVideoURL = 'https://res.cloudinary.com/dgcwviufp/video/upload/f_auto,q_auto:low,w_600,c_scale/v1/CS_m65dwf';
  const desktopVideoURL = 'https://res.cloudinary.com/dgcwviufp/video/upload/f_auto,q_auto:low,w_1000,c_scale/v1/tia2_gljwos';
  
  // Poster images for immediate display
  const mobilePosterURL = 'https://res.cloudinary.com/dgcwviufp/video/upload/f_auto,q_auto:low,w_600,c_scale,so_0/v1/CS_m65dwf.jpg';
  const desktopPosterURL = 'https://res.cloudinary.com/dgcwviufp/video/upload/f_auto,q_auto:low,w_1000,c_scale,so_0/v1/tia2_gljwos.jpg';

  // Detect iOS devices
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

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

  // Handle user interaction for iOS autoplay
  const handleUserInteraction = useCallback(() => {
    const activeVideoRef = isMobile ? mobileVideoRef : desktopVideoRef;
    const video = activeVideoRef.current;
    if (video && needsUserInteraction) {
      video.play().then(() => {
        setNeedsUserInteraction(false);
      }).catch((error) => {
        console.warn('Video play failed after user interaction:', error);
      });
    }
  }, [isMobile, needsUserInteraction]);

  // Aggressive video preloading
  useEffect(() => {
    // Preload videos immediately
    const preloadVideo = (url) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'video';
      link.href = url;
      document.head.appendChild(link);
    };
    
    preloadVideo(mobileVideoURL);
    preloadVideo(desktopVideoURL);
  }, []);

  // Video loading optimization
  useEffect(() => {
    const activeVideoRef = isMobile ? mobileVideoRef : desktopVideoRef;
    const video = activeVideoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setVideoLoaded(true);
      setVideoError(false);
      
      // Try to start playback immediately
      video.play().then(() => {
        setNeedsUserInteraction(false);
      }).catch((error) => {
        console.warn('Video autoplay failed:', error);
        // On iOS, this is expected - set flag for user interaction
        if (isIOS) {
          setNeedsUserInteraction(true);
        }
      });
    };

    const handleError = (error) => {
      console.error('Video loading error:', error);
      setVideoError(true);
    };

    const handleLoadedData = () => {
      console.log('Video data loaded');
      setVideoLoaded(true);
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);

    // Force immediate loading with highest priority
    video.preload = 'metadata';
    video.load();

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
    };
  }, [isMobile, isIOS]);

  // Add click handler to entire hero section for iOS
  useEffect(() => {
    if (needsUserInteraction) {
      document.addEventListener('click', handleUserInteraction);
      document.addEventListener('touchstart', handleUserInteraction);
      return () => {
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('touchstart', handleUserInteraction);
      };
    }
  }, [needsUserInteraction, handleUserInteraction]);

  return (
    <div 
      className="flex container-padding flex-col justify-start items-center h-[77dvh] sm:h-[84dvh] md:h-[82dvh] lg:h-[740px] relative overflow-hidden"
      onClick={needsUserInteraction ? handleUserInteraction : undefined}
    >
      {/* Poster Image for Immediate Display */}
      <img
        src={isMobile ? mobilePosterURL : desktopPosterURL}
        alt="Hero background"
        className={`absolute top-0 left-0 object-cover w-full h-full transition-opacity duration-300 ${
          videoLoaded ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          transform: 'translateZ(0)',
          willChange: 'opacity'
        }}
      />
      
      {/* Loading State */}
      {!videoLoaded && !videoError && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center z-10 opacity-50">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full"></div>
        </div>
      )}
      
      {/* iOS Autoplay Notice */}
      {needsUserInteraction && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
          <div className="text-white text-center p-4">
            <p className="mb-2">Tap to play video</p>
            <div className="w-12 h-12 mx-auto border-2 border-white rounded-full flex items-center justify-center">
              <div className="w-0 h-0 border-l-4 border-l-white border-t-2 border-t-transparent border-b-2 border-b-transparent ml-1"></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile Video */}
      <video
        ref={mobileVideoRef}
        src={mobileVideoURL}
        poster={mobilePosterURL}
        type="video/mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        className={`absolute top-0 left-0 object-cover w-full h-full lg:hidden transition-opacity duration-300 ${
          videoLoaded && !videoError ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ 
          pointerEvents: 'none',
          transform: 'translateZ(0)',
          willChange: 'transform, opacity',
          WebkitTapHighlightColor: 'transparent',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitAppearance: 'none',
          outline: 'none'
        }}
        onContextMenu={(e) => e.preventDefault()}
      />
      
      {/* Desktop Video */}
      <video
        ref={desktopVideoRef}
        src={desktopVideoURL}
        poster={desktopPosterURL}
        type="video/mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        disablePictureInPicture
        className={`absolute top-0 left-0 object-cover w-full h-full hidden lg:block transition-opacity duration-300 ${
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
      <div className="typography flex flex-col w-full items-center lgx:items-start space-y-3 md:space-y-4 min-lgx:space-y-[3rem] z-20">
        <h1 className="text-center lgx:text-left text-nowrap lgx:text-5xl">
          Unmatched Comfort.
          <span className="max-sm:hidden"> Bold Performance.</span>
          <br />
          <span className="max-sm:text-base sm:text-3xl lg:text-5xl">Everyday Style.</span>
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
  );
};

export default HeroSection;