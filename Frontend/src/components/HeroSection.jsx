import React, { useState, useEffect, useRef } from 'react';
import Button from './Button';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const mobileVideoRef = useRef(null);
  const desktopVideoRef = useRef(null);

  useEffect(() => {
    // Check if mobile on mount and resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Preload the appropriate video based on screen size
    const videoRef = isMobile ? mobileVideoRef : desktopVideoRef;
    const video = videoRef.current;
    
    if (video) {
      // Set loading strategy
      video.preload = 'metadata';
      
      const handleCanPlay = () => {
        setVideoLoaded(true);
        // Start playing once it can play smoothly
        video.play().catch(console.error);
      };

      const handleLoadStart = () => {
        // Prioritize loading the visible video
        if ((isMobile && video === mobileVideoRef.current) || 
            (!isMobile && video === desktopVideoRef.current)) {
          video.preload = 'auto';
        }
      };

      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('loadstart', handleLoadStart);
      
      return () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('loadstart', handleLoadStart);
      };
    }
  }, [isMobile]);

  return (
    <div className="flex container-padding flex-col justify-start items-center h-[77dvh] sm:h-[84dvh] md:h-[82dvh] lg:h-[740px] relative overflow-hidden">
      {/* Loading placeholder */}
      {!videoLoaded && (
        <div 
          className="absolute top-0 left-0 w-full h-full bg-gray-900 flex items-center justify-center z-10"
          style={{
            backgroundImage: `url(${isMobile 
              ? 'https://res.cloudinary.com/dgcwviufp/image/upload/v1756112530/CS_thumb.jpg'
              : 'https://res.cloudinary.com/dgcwviufp/image/upload/v1756112795/tia2_thumb.jpg'
            })`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="animate-pulse text-white">Loading...</div>
        </div>
      )}

      {/* Mobile Video */}
      <video
        ref={mobileVideoRef}
        src="https://res.cloudinary.com/dgcwviufp/video/upload/v1756112530/CS_m65dwf.mp4"
        type="video/mp4"
        autoPlay={false} // Let JavaScript control playback
        muted
        loop
        playsInline
        preload="none" // Start with none, upgrade based on viewport
        controls={false}
        disablePictureInPicture
        poster="https://res.cloudinary.com/dgcwviufp/image/upload/v1756112530/CS_thumb.jpg"
        className={`absolute top-0 left-0 object-cover w-full h-full transition-opacity duration-300 lg:hidden ${
          videoLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ 
          pointerEvents: 'none', 
          willChange: 'transform',
          transform: 'translateZ(0)' // Force hardware acceleration
        }}
        onLoadedData={() => isMobile && setVideoLoaded(true)}
      />

      {/* Desktop Video */}
      <video
        ref={desktopVideoRef}
        src="https://res.cloudinary.com/dgcwviufp/video/upload/v1756112795/tia2_gljwos.mp4"
        type="video/mp4"
        autoPlay={false} // Let JavaScript control playback
        muted
        loop
        playsInline
        preload="none" // Start with none, upgrade based on viewport
        controls={false}
        disablePictureInPicture
        poster="https://res.cloudinary.com/dgcwviufp/image/upload/v1756112795/tia2_thumb.jpg"
        className={`absolute top-0 left-0 object-cover w-full h-full transition-opacity duration-300 hidden lg:block ${
          videoLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ 
          pointerEvents: 'none', 
          willChange: 'transform',
          transform: 'translateZ(0)' // Force hardware acceleration
        }}
        onLoadedData={() => !isMobile && setVideoLoaded(true)}
      />

      {/* Quick Nav */}
      <div className="container quicknav flex flex-row justify-between lg:max-w-[800px] mb-[40dvh] sm:mb-38 md:mb-50 lg:mb-[50dvh] z-25">
        <Link to="/shop?category=new" className="text-white hover:text-gray-300 transition-colors">
          NEW ARRIVALS
        </Link>
        <Link to="/shop?category=briefs" className="text-white hover:text-gray-300 transition-colors">
          BRIEFS
        </Link>
        <Link to="/shop?category=gymwear" className="text-white hover:text-gray-300 transition-colors">
          GYM WEAR
        </Link>
        <Link to="/shop" className="text-white hover:text-gray-300 transition-colors">
          SHOP ALL
        </Link>
      </div>

      {/* Hero Text + CTA */}
      <div className="typography flex flex-col w-full items-center lgx:items-start space-y-3 md:space-y-4 min-lgx:space-y-[3rem] z-20">
        <h1 className="text-center lgx:text-left text-nowrap lgx:text-5xl">
          Unmatched Comfort.
          <span className="max-sm:hidden">Bold Performance.</span>
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
          />
        </Link>
      </div>
    </div>
  );
};

export default HeroSection;