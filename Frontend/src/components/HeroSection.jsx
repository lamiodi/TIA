import React, { useState, useEffect, useRef, useCallback } from 'react';
import videoBG from '../assets/CS.mp4';
import videoBG2 from '../assets/tia2.mp4';
import Button from './Button';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const mobileVideoRef = useRef(null);
  const desktopVideoRef = useRef(null);
  const intersectionObserverRef = useRef(null);

  // Memoized resize handler to prevent unnecessary re-renders
  const handleResize = useCallback(() => {
    const newIsMobile = window.innerWidth < 1024;
    if (newIsMobile !== isMobile) {
      setIsMobile(newIsMobile);
      setVideoLoaded(false); // Reset loading state when switching videos
    }
  }, [isMobile]);

  useEffect(() => {
    // Throttled resize listener
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

  // Video loading and playback management
  useEffect(() => {
    const activeVideoRef = isMobile ? mobileVideoRef : desktopVideoRef;
    const video = activeVideoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setVideoLoaded(true);
      setVideoError(false);
      
      // Use requestAnimationFrame for smoother playback start
      requestAnimationFrame(() => {
        video.play().catch((error) => {
          console.warn('Video autoplay failed:', error);
          // Fallback: try playing on user interaction
          document.addEventListener('click', () => video.play().catch(() => {}), { once: true });
        });
      });
    };

    const handleError = (error) => {
      console.error('Video loading error:', error);
      setVideoError(true);
      setVideoLoaded(false);
    };

    const handleLoadStart = () => {
      // Optimize loading based on visibility
      if (intersectionObserverRef.current) {
        video.preload = 'metadata';
      }
    };

    // Event listeners
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', handleLoadStart);

    // Intersection Observer for performance
    if ('IntersectionObserver' in window) {
      intersectionObserverRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.target === video) {
              video.preload = 'auto';
            }
          });
        },
        { threshold: 0.1 }
      );
      
      intersectionObserverRef.current.observe(video);
    } else {
      // Fallback for browsers without IntersectionObserver
      video.preload = 'auto';
    }

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadstart', handleLoadStart);
      
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
    };
  }, [isMobile]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
    };
  }, []);

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
          {/* Fallback background image or gradient */}
        </div>
      )}
      {/* Mobile Video */}
      <video
        ref={mobileVideoRef}
        src={videoBG}
        type="video/mp4"
        autoPlay={false} // Controlled via JavaScript
        muted
        loop
        playsInline
        preload="none" // Start conservative, upgrade based on intersection
        controls={false}
        disablePictureInPicture
        className={`absolute top-0 left-0 object-cover w-full h-full lg:hidden transition-opacity duration-500 ${
          videoLoaded && !videoError ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ 
          pointerEvents: 'none',
          transform: 'translateZ(0)', // Hardware acceleration
          willChange: 'transform, opacity'
        }}
      />
      {/* Desktop Video */}
      <video
        ref={desktopVideoRef}
        src={videoBG2}
        type="video/mp4"
        autoPlay={false} // Controlled via JavaScript
        muted
        loop
        playsInline
        preload="none" // Start conservative, upgrade based on intersection
        controls={false}
        disablePictureInPicture
        className={`absolute top-0 left-0 object-cover w-full h-full hidden lg:block transition-opacity duration-500 ${
          videoLoaded && !videoError ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ 
          pointerEvents: 'none',
          transform: 'translateZ(0)', // Hardware acceleration
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
      {/* Hero Text + CTA */}
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