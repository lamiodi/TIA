import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { LogOut, Search, User, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toastSuccess } from '../utils/toastConfig';
import LogoWhite from '../assets/icons/LogoWhite.svg';
import LogoBlack from '../assets/icons/LogoBLACK.svg';

export default function Navbar2() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Determine if current page has white background
  const isWhiteBackgroundPage = () => {
    const whiteBackgroundPages = [
      '/shop',
      '/shopall',
      '/search',
      '/product/',
      '/bundle/',
      '/cart',
      '/checkout',
      '/orders',
      '/profile',
      '/signup',
      '/forgot-password',
      '/help',
      '/more',
      '/thank-you'
    ];
    
    return whiteBackgroundPages.some(path => location.pathname.includes(path));
  };
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.warn('Navbar2: Loading stuck, continuing render.');
        setLoadingTimeout(true);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [loading]);
  
  const handleLogout = () => {
    logout();
    localStorage.removeItem('pendingOrderId');
    toastSuccess('Logged out successfully');
    navigate('/login');
    setIsMenuOpen(false);
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };
  
  const handleMenuNavigation = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };
  
  if (loading && !loadingTimeout) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <div className="mx-auto max-w-full container-padding flex h-[3.75rem] items-center justify-center">
          <div className="flex items-center gap-2 text-white">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading...</span>
          </div>
        </div>
      </nav>
    );
  }
  
  return (
    <Disclosure as="nav" className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-sm">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-full container-padding py-1">
            <div className="relative flex h-[3.75rem] items-center justify-between">
              
              {/* Mobile menu button - show below lg */}
              <div className="absolute inset-y-0 left-0 flex items-center lg:hidden">
                <DisclosureButton className={`inline-flex items-center justify-center rounded-md p-2 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white ${
                  isWhiteBackgroundPage() ? 'text-Primarycolor' : 'text-Secondarycolor'
                }`}>
                  <span className="sr-only">Open menu</span>
                  {open ? (
                    <XMarkIcon className="block h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                  )}
                </DisclosureButton>
              </div>
              

              
              {/* Center: Logo */}
              <div className="absolute left-1/2 transform -translate-x-1/2 sm:transform-none">
                <Link to="/home" className="flex items-center">
                  <img 
                    src={isWhiteBackgroundPage() ? LogoBlack : LogoWhite} 
                    alt="Logo" 
                    className="h-10 w-40 sm:h-12 sm:w-48 md:h-14 md:w-56"
                  />
                </Link>
              </div>
              
              {/* Left-side Navigation Links for large screens - SHOP, CONTACT, MORE */}
              <div className="hidden lg:flex items-center gap-6 ml-6">
                <Link 
                  to="/shop" 
                  className={`text-sm font-medium hover:opacity-80 transition-opacity ${
                    isWhiteBackgroundPage() ? 'text-Primarycolor' : 'text-Secondarycolor'
                  }`}
                >
                  SHOP
                </Link>
                <Link 
                  to="/help" 
                  className={`text-sm font-medium hover:opacity-80 transition-opacity ${
                    isWhiteBackgroundPage() ? 'text-Primarycolor' : 'text-Secondarycolor'
                  }`}
                >
                  CONTACT
                </Link>
                <Link 
                  to="/more" 
                  className={`text-sm font-medium hover:opacity-80 transition-opacity ${
                    isWhiteBackgroundPage() ? 'text-Primarycolor' : 'text-Secondarycolor'
                  }`}
                >
                  MORE
                </Link>
              </div>
              

              
              {/* Right: Auth and navigation */}
              <div className="flex items-center gap-4 ml-auto">
                {/* Search (desktop only - show from lg and above) */}
                <div className="relative hidden lg:flex items-center">
                  <input
                    type="text"
                    placeholder="Search products or categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                    className={`w-40 lg:w-60 xl:w-70 2xl:w-70 pl-2 pr-8 py-1 text-sm border-b bg-transparent focus:border-b-2 focus:outline-none ${
                      isWhiteBackgroundPage() 
                        ? 'text-Primarycolor border-Primarycolor focus:border-Primarycolor placeholder-Primarycolor/70' 
                        : 'text-Secondarycolor border-Secondarycolor focus:border-Secondarycolor placeholder-white/70'
                    }`}
                  />
                  <button 
                    onClick={handleSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2" 
                    aria-label="Search"
                  >
                    <Search className={`h-3 w-3 sm:h-4 sm:w-4 ${
                      isWhiteBackgroundPage() ? 'text-Primarycolor' : 'text-Secondarycolor'
                    }`} />
                  </button>
                </div>
                
                {/* Hamburger menu for desktop - show from lg and above, only when user is logged in */}
                {user && (
                  <div className="hidden lg:flex relative group">
                    <button
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className="flex items-center p-1 hover:opacity-80 transition-opacity relative"
                      aria-label="User menu"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`h-5 w-5 sm:h-6 sm:w-6 ${
                        isWhiteBackgroundPage() ? 'text-Primarycolor' : 'text-Secondarycolor'
                      }`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                      </svg>
                    </button>
                    
                    {/* Tooltip for Order History */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      Order History
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-800"></div>
                    </div>
                    
                    {/* Desktop dropdown menu */}
                    {isMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                        <Link 
                          to="/profile" 
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => handleMenuNavigation('/profile')}
                        >
                          <User className="h-4 w-4 mr-3 text-gray-500" />
                          Profile
                        </Link>
                        <Link 
                          to="/orders" 
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => handleMenuNavigation('/orders')}
                        >
                          <Package className="h-4 w-4 mr-3 text-gray-500" />
                          Order History
                        </Link>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <LogOut className="h-4 w-4 mr-3 text-gray-500" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Auth button */}
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-sm font-medium hover:opacity-80 transition-opacity"
                    aria-label="Logout"
                  >
                    <LogOut size={14} className={`sm:w-4 sm:h-4 ${
                      isWhiteBackgroundPage() ? 'text-Primarycolor' : 'text-Secondarycolor'
                    }`} />
                  </button>
                ) : (
                  <Link to="/login">
                    <button
                      className="flex items-center gap-1 text-sm font-medium hover:opacity-80 transition-opacity"
                      aria-label="Login"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`h-5 w-5 sm:h-6 sm:w-6 ${
                        isWhiteBackgroundPage() ? 'text-Primarycolor' : 'text-Secondarycolor'
                      }`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                      </svg>
                    </button>
                  </Link>
                )}
                
                {/* Cart or Back */}
                {location.pathname === '/cart' ? (
                  <button
                    onClick={() => navigate(-1)}
                    className="flex items-center p-1 hover:opacity-80 transition-opacity"
                    aria-label="Go back"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 sm:h-6 sm:w-6 ${
                      isWhiteBackgroundPage() ? 'text-Primarycolor' : 'text-Secondarycolor'
                    }`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                  </button>
                ) : (
                  <Link to="/cart">
                    <button className="flex items-center p-1 hover:opacity-80 transition-opacity" aria-label="Shopping cart">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 sm:h-6 sm:w-6 ${
                        isWhiteBackgroundPage() ? 'text-Primarycolor' : 'text-Secondarycolor'
                      }`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                      </svg>
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>
          
          {/* Enhanced Mobile Menu */}
          <DisclosurePanel className="lg:hidden bg-black/70 backdrop-blur-md border-t border-white/10">
            <div className="space-y-1 px-4 pb-4 pt-3">
              
              {/* Enhanced Search input (mobile only - show below lg) */}
              <div className="mb-6">
                <form onSubmit={handleSearch} className="flex">
                  <input
                    type="text"
                    placeholder="Search products or categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-3 text-sm border rounded-l bg-white/10 backdrop-blur-sm text-white border-white/20 placeholder-white/70 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all duration-200"
                  />
                  <button
                    type="submit"
                    className="bg-white/20 backdrop-blur-sm text-white px-4 py-3 rounded-r border border-l-0 border-white/20 hover:bg-white/30 transition-all duration-200"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </form>
              </div>
              
              {/* Enhanced Quick Navigation Links */}
              <nav 
                className="container quicknav flex flex-col space-y-3 lg:max-w-[800px] mb-[40dvh] sm:mb-38 md:mb-50 lg:mb-[50dvh] z-25 lg:absolute lg:left-0 lg:bg-black/70" 
                role="navigation" 
                aria-label="Product categories"
              >
                <Link 
                  to="/shop" 
                  className="text-white hover:text-white/80 hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/30 rounded-lg px-4 py-3 font-medium backdrop-blur-sm border border-white/10 hover:border-white/20"
                >
                  SHOP
                </Link>
                <Link 
                  to="/shop?category=briefs" 
                  className="text-white hover:text-white/80 hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/30 rounded-lg px-4 py-3 font-medium backdrop-blur-sm border border-white/10 hover:border-white/20"
                >
                  BRIEFS
                </Link>
                 
                 {/* Additional Navigation Links */}
                 <Link 
                   to="/shop?category=bundles" 
                   className="text-white hover:text-white/80 hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/30 rounded-lg px-4 py-3 font-medium backdrop-blur-sm border border-white/10 hover:border-white/20"
                 >
                   3 in 1 BUNDLES
                 </Link>
                 <Link 
                   to="/shop?category=gymwear" 
                   className="text-white hover:text-white/80 hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/30 rounded-lg px-4 py-3 font-medium backdrop-blur-sm border border-white/10 hover:border-white/20"
                 >
                   GYMWEARS
                 </Link>
                 <Link 
                   to="/help" 
                   className="text-white hover:text-white/80 hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/30 rounded-lg px-4 py-3 font-medium backdrop-blur-sm border border-white/10 hover:border-white/20"
                 >
                   CONTACT
                 </Link>
                 <Link 
                   to="/more" 
                   className="text-white hover:text-white/80 hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/30 rounded-lg px-4 py-3 font-medium backdrop-blur-sm border border-white/10 hover:border-white/20"
                 >
                   MORE
                 </Link>
               </nav>
              
              {/* Enhanced Profile and Orders links (mobile only) */}
              {user && (
                <>
                  <div className="border-t border-white/10 pt-4 mt-4">
                    <Link to="/profile">
                      <button className="flex items-center w-full text-left px-4 py-3 text-sm rounded-lg transition-all duration-200 text-white hover:text-white/80 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white mr-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Profile
                      </button>
                    </Link>
                    
                    {/* Orders link (mobile only) */}
                    <Link to="/orders">
                      <button className="flex items-center w-full text-left px-4 py-3 text-sm rounded-lg transition-all duration-200 text-white hover:text-white/80 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20">
                        <Package className="h-4 w-4 text-white mr-3" />
                        Order History
                      </button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
}