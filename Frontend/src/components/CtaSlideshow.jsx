import React, { useState, useEffect } from 'react';
import Button from './Button';
import ctaimage from '../assets/images/ctaimage.png';
import Newsletterimage from '../assets/images/Newsletterimage.png';
import bundleImage from '../assets/images/bundleImage.png'; 
import { CheckCircle, AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';

// Use environment variable for base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com';
const api = axios.create({ baseURL: API_BASE_URL });

const CtaSlideshow = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, success, error
  const [message, setMessage] = useState('');

  // Auto-advance slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 4);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % 4);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + 4) % 4);
  };

  const handleDotClick = (index) => {
    setCurrentSlide(index);
  };

  // Newsletter form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Basic email validation
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }
    setIsLoading(true);
    setStatus('idle');
    try {
      // Call the correct endpoint
      const response = await api.post('/api/newsletter/subscribe', { email });
      if (response.data.success) {
        setStatus('success');
        setMessage(response.data.message);
        setEmail('');
      } else {
        throw new Error(response.data.message || 'Subscription failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage(
        error.response?.data?.message || 
        error.message || 
        'Failed to subscribe. Please try again later.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Slide 1: Original CTA
  const renderSlide1 = () => (
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
          <span className="inline font-Manrope">HIS AND HERS </span>
          <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
            SETS
          </span>
        </h2>
        
        <p className="text-base sm:text-lg lg:text-xl text-Secondarycolor/90 font-medium leading-relaxed font-Manrope mb-6 max-w-md">
          Your favourite style for every move.
        </p>
        
        <div className="flex flex-col gap-3">
          <Button
            label="Shop the Complete Set"
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

  // Slide 2: Sign Up CTA
  const renderSlide2 = () => (
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
          <span className="text-xs font-medium text-white/80 uppercase tracking-wider font-Manrope">Exclusive Offer</span>
          <div className="ml-2 w-2 h-2 bg-gradient-to-r from-pink-400 to-orange-400 rounded-full animate-pulse"></div>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold text-Secondarycolor mt-2 mb-4 leading-tight whitespace-nowrap">
          <span className="inline font-Manrope">SIGN UP </span>
          <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
            NOW
          </span>
        </h2>
        
        <p className="text-base sm:text-lg lg:text-xl text-Secondarycolor/90 font-medium leading-relaxed font-Manrope mb-6 max-w-md">
          Be the first to know about new drops, exclusive deals, and more.
        </p>
        
        <div className="flex flex-col gap-3">
          <div className="text-2xl sm:text-3xl font-bold text-white mb-2 font-Manrope">
            GET <span className="text-yellow-300">10% OFF</span> YOUR FIRST ORDER!
          </div>
          <Button
            label="SIGN UP"
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
            alt="Sign Up"
            className="relative object-contain h-[90%] w-auto max-h-full transform group-hover:scale-105 transition-transform duration-300 filter drop-shadow-2xl top-[-15em] sm:top-[-5em] md:top-[-5em] lg:top-11"
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

  // Slide 3: 3-in-1 Bundle CTA
  const renderSlide3 = () => (
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
          <span className="text-xs font-medium text-white/80 uppercase tracking-wider font-Manrope">Bundle Deal</span>
          <div className="ml-2 w-2 h-2 bg-gradient-to-r from-pink-400 to-orange-400 rounded-full animate-pulse"></div>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold text-Secondarycolor mt-2 mb-4 leading-tight whitespace-nowrap">
          <span className="inline font-Manrope">3-IN-1 </span>
          <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
            BUNDLE
          </span>
        </h2>
        
        <p className="text-base sm:text-lg lg:text-xl text-Secondarycolor/90 font-medium leading-relaxed font-Manrope mb-6 max-w-md">
          Get three products for the price of two. Limited time offer.
        </p>
        
        <div className="flex flex-col gap-3">
          <div className="text-2xl sm:text-3xl font-bold text-white mb-2 font-Manrope">
            SAVE <span className="text-yellow-300">33%</span> ON BUNDLES
          </div>
          <Link to="https://www.thetiabrand.org/bundle/15"></Link>
          <Button
            label="Shop the Bundle"
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
            src={bundleImage}
            alt="3-in-1 Bundle"
            className="relative object-contain h-[90%] w-auto max-h-full transform group-hover:scale-105 transition-transform duration-300 filter drop-shadow-2xl top-[-15em] sm:top-[-5em] md:top-[-5em] lg:top-11"
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

  // Slide 4: Newsletter CTA
  const renderSlide4 = () => (
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
          <span className="text-xs font-medium text-white/80 uppercase tracking-wider font-Manrope">Newsletter</span>
          <div className="ml-2 w-2 h-2 bg-gradient-to-r from-pink-400 to-orange-400 rounded-full animate-pulse"></div>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold text-Secondarycolor mt-2 mb-4 leading-tight whitespace-nowrap">
          <span className="inline font-Manrope">SUBSCRIBE TO </span>
          <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
            NEWSLETTER
          </span>
        </h2>
        
        <p className="text-base sm:text-lg lg:text-xl text-Secondarycolor/90 font-medium leading-relaxed font-Manrope mb-6 max-w-md">
          Get 10% Off Your First Order
        </p>
        
        <div className="flex flex-col gap-3">
          {/* Status Messages */}
          {status === 'success' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-green-700 text-sm">{message}</p>
            </div>
          )}
          {status === 'error' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700 text-sm">{message}</p>
            </div>
          )}
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full max-w-md">
            <div className="flex bg-Secondarycolor font-Manrope rounded-md overflow-hidden shadow-sm">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label="Email address"
                placeholder="Enter Your Email"
                className="px-3 py-2.5 w-full text-sm text-[#6e6e6e] font-medium border-none focus:outline-none font-manrope-medium placeholder:text-sm"
              />
              <button
                type="submit"
                disabled={isLoading}
                aria-label="Submit newsletter form"
                className="w-12 h-[42px] bg-[#d9d9d9] flex justify-center items-center hover:bg-[#c9c9c9] transition-colors duration-200 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 text-black animate-spin" />
                ) : (
                  <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-300 mt-2">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </form>
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
            src={Newsletterimage}
            alt="Newsletter"
            className="relative object-contain h-[90%] w-auto max-h-full transform group-hover:scale-105 transition-transform duration-300 filter drop-shadow-2xl top-[-15em] sm:top-[-5em] md:top-[-5em] lg:top-11"
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

  return (
    <div className="relative w-full">
      {/* Slides */}
      <div className="overflow-hidden">
        {currentSlide === 0 && renderSlide1()}
        {currentSlide === 1 && renderSlide2()}
        {currentSlide === 2 && renderSlide3()}
        {currentSlide === 3 && renderSlide4()}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={handlePrevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors duration-200 z-20"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>
      <button
        onClick={handleNextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors duration-200 z-20"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
        {[0, 1, 2, 3].map((index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`w-3 h-3 rounded-full transition-colors duration-200 ${
              currentSlide === index ? 'bg-white' : 'bg-white/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default CtaSlideshow;