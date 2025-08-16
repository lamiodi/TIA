import React from 'react';
import Button from './Button';
import ctaimage from '../assets/images/ctaimage.png';

const Cta = () => {
  return (
    <div className="container-padding custom-gradient relative flex flex-col lg:flex-row items-center justify-between w-full aspect-[2/1.8] sm:aspect-[2/1.5] md:aspect-[2/1.3] lg:max-h-[510px] xl:max-h-[630px] 2xl:max-h-[970px] overflow-hidden">
      
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl translate-y-12 -translate-x-12"></div>
      <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-white/20 rounded-full animate-pulse"></div>
      <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-white/30 rounded-full animate-pulse delay-1000"></div>
      
      {/* Text Section */}
      <div className="relative z-10 flex flex-col justify-center items-start w-full lg:w-1/2 px-4 py-3 sm:px-8 h-full ">
        {/* Badge */}
        <div className="inline-flex items-center px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-4">
          <span className="text-xs font-medium text-white/80 uppercase tracking-wider font-Manrope">New Collection</span>
          <div className="ml-2 w-2 h-2 bg-gradient-to-r from-pink-400 to-orange-400 rounded-full animate-pulse"></div>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold text-Secondarycolor mt-2 mb-4 leading-tight whitespace-nowrap">
          <span className="inline font-Manrope">OUR TOP </span>
          <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
            SETS
          </span>
        </h2>
        
        <p className="text-base sm:text-lg lg:text-xl text-Secondarycolor/90 font-medium leading-relaxed font-Manrope mb-6 max-w-md">
          Your favourite style for every move.
        </p>
        
        <div className="flex flex-col gap-3">
          <Button
            label="Discover Your Fit"
            variant="primary"
            size="medium"
            stateProp="default"
            className="w-44 transform hover:scale-105 transition-transform duration-200 shadow-lg hover:shadow-xl font-Manrope"
          />
        </div>
      </div>

      {/* Image Section */}
      <div className="relative w-full lg:w-1/2 flex justify-center items-center h-full px-2 sm:px-4 z-1 ">
        {/* Image Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-l from-white/5 to-transparent rounded-2xl"></div>
        
        <div className="relative group">
          {/* Background Circle */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-xl scale-110 group-hover:scale-125 transition-transform duration-500"></div>
          
          <img
            src={ctaimage}
            alt="Top Sets"
            className="relative object-contain h-[90%] w-auto max-h-full transform group-hover:scale-105 transition-transform duration-300 filter drop-shadow-2xl top-[-9em] sm:top-[-5em] md:top-[-5em] lg:top-11"
          />
          
          {/* Floating Elements around Image */}
          <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-pink-400/20 to-orange-400/20 rounded-lg backdrop-blur-sm border border-white/10 animate-bounce delay-300"></div>
          <div className="absolute -bottom-6 -left-6 w-6 h-6 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full backdrop-blur-sm border border-white/10 animate-bounce delay-700"></div>
        </div>
      </div>
      
      {/* Bottom Accent Line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      
    </div>
  );
};

export default Cta;