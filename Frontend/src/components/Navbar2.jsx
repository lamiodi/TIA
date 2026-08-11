import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { LogOut, Search, User, Package, ChevronDown, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CurrencyContext } from '../pages/CurrencyContext';
import { toastSuccess } from '../utils/toastConfig';
import LogoWhite from '../assets/icons/LogoWhite.svg';
import LogoBlack from '../assets/icons/LogoBLACK.svg';

export default function Navbar2() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const { currency, toggleCurrency } = useContext(CurrencyContext) || {};
  
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Scroll detection for dynamic header elevation & backdrop
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync cart item count from localStorage
  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cartData = JSON.parse(localStorage.getItem('cart') || '[]');
        if (Array.isArray(cartData)) {
          const totalUnits = cartData.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
          setCartCount(totalUnits);
        }
      } catch (err) {
        setCartCount(0);
      }
    };

    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    // Interval fallback to catch soft-state cart changes
    const interval = setInterval(updateCartCount, 1000);

    return () => {
      window.removeEventListener('storage', updateCartCount);
      clearInterval(interval);
    };
  }, []);
  
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

  const isLightMode = isWhiteBackgroundPage();
  
  if (loading && !loadingTimeout) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <div className="mx-auto max-w-full container-padding flex h-[3.75rem] items-center justify-center">
          <div className="flex items-center gap-2 text-white text-xs tracking-widest uppercase font-mono">
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>The TiaBrand</span>
          </div>
        </div>
      </nav>
    );
  }
  
  return (
    <Disclosure as="nav" className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? (isLightMode ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100 py-0' : 'bg-black/90 backdrop-blur-md border-b border-white/10 py-0') 
        : 'bg-transparent py-1'
    }`}>
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative flex h-16 items-center justify-between">
              
              {/* Mobile menu button - show below lg */}
              <div className="absolute inset-y-0 left-0 flex items-center lg:hidden">
                <DisclosureButton className={`inline-flex items-center justify-center rounded-md p-2 hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors ${
                  isLightMode ? 'text-black' : 'text-white'
                }`}>
                  <span className="sr-only">Open menu</span>
                  {open ? (
                    <XMarkIcon className="block h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-5 w-5" aria-hidden="true" />
                  )}
                </DisclosureButton>
              </div>
              
              {/* Left: Desktop Navigation Links */}
              <div className="hidden lg:flex items-center space-x-8">
                <Link 
                  to="/shop" 
                  className={`text-xs font-semibold tracking-widest uppercase transition-opacity hover:opacity-70 ${
                    isLightMode ? 'text-black' : 'text-white'
                  }`}
                >
                  Shop All
                </Link>
                <Link 
                  to="/shop?category=briefs" 
                  className={`text-xs font-medium tracking-widest uppercase transition-opacity hover:opacity-70 ${
                    isLightMode ? 'text-gray-600' : 'text-gray-300'
                  }`}
                >
                  Briefs
                </Link>
                <Link 
                  to="/shop?category=lounge%20sets" 
                  className={`text-xs font-medium tracking-widest uppercase transition-opacity hover:opacity-70 ${
                    isLightMode ? 'text-gray-600' : 'text-gray-300'
                  }`}
                >
                  Lounge
                </Link>
                <Link 
                  to="/shop?category=3in1" 
                  className={`text-xs font-medium tracking-widest uppercase transition-opacity hover:opacity-70 ${
                    isLightMode ? 'text-gray-600' : 'text-gray-300'
                  }`}
                >
                  3-in-1
                </Link>
                <Link 
                  to="/gift-cards" 
                  className={`text-xs font-medium tracking-widest uppercase transition-opacity hover:opacity-70 ${
                    isLightMode ? 'text-gray-600' : 'text-gray-300'
                  }`}
                >
                  Gift Cards
                </Link>
              </div>

              {/* Center: Brand Logo */}
              <div className="flex-1 flex justify-center lg:flex-initial">
                <Link to="/home" className="flex items-center focus:outline-none focus:ring-2 focus:ring-black rounded px-1">
                  <img 
                    src={isLightMode ? LogoBlack : LogoWhite} 
                    alt="The TiaBrand" 
                    className="h-8 sm:h-9 w-auto object-contain transition-transform duration-200 hover:scale-[1.02]"
                  />
                </Link>
              </div>

              {/* Right Side Tools: Currency, Search, Profile, Cart */}
              <div className="flex items-center space-x-4 sm:space-x-6">
                
                {/* Currency Switcher Toggle */}
                {toggleCurrency && (
                  <button
                    onClick={toggleCurrency}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono tracking-wider rounded-full border transition-all duration-200 ${
                      isLightMode 
                        ? 'border-gray-300 hover:border-black text-black bg-gray-50/50' 
                        : 'border-white/20 hover:border-white text-white bg-white/5'
                    }`}
                    title="Switch currency (NGN / USD)"
                    aria-label="Toggle currency"
                  >
                    <Globe size={12} className="opacity-70" />
                    <span>{currency || 'NGN'}</span>
                  </button>
                )}

                {/* Search input (Desktop) */}
                <div className="relative hidden lg:flex items-center">
                  <form onSubmit={handleSearch} className="flex items-center">
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-28 focus:w-44 transition-all duration-300 pl-2 pr-7 py-1 text-xs tracking-wider border-b bg-transparent focus:outline-none ${
                        isLightMode 
                          ? 'text-black border-gray-300 focus:border-black placeholder-gray-400' 
                          : 'text-white border-white/30 focus:border-white placeholder-gray-400'
                      }`}
                    />
                    <button 
                      type="submit"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 opacity-70 hover:opacity-100" 
                      aria-label="Submit Search"
                    >
                      <Search size={14} className={isLightMode ? 'text-black' : 'text-white'} />
                    </button>
                  </form>
                </div>

                {/* User Menu / Auth */}
                {user ? (
                  <div className="relative">
                    <button
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className={`p-1.5 rounded-full transition-opacity hover:opacity-80 focus:outline-none ${
                        isLightMode ? 'text-black hover:bg-gray-100' : 'text-white hover:bg-white/10'
                      }`}
                      aria-label="User Account"
                    >
                      <User size={18} />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 rounded-md shadow-xl py-1 z-50 border border-gray-100 dark:border-zinc-800 text-xs">
                        <div className="px-4 py-2 border-b border-gray-100 dark:border-zinc-800 text-gray-500 font-mono">
                          {user.email || 'Account'}
                        </div>
                        <Link 
                          to="/profile" 
                          className="flex items-center px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <User size={14} className="mr-3 opacity-70" />
                          Profile
                        </Link>
                        <Link 
                          to="/orders" 
                          className="flex items-center px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Package size={14} className="mr-3 opacity-70" />
                          Orders
                        </Link>
                        <div className="border-t border-gray-100 dark:border-zinc-800 my-1"></div>
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                          <LogOut size={14} className="mr-3" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link to="/login" aria-label="Login">
                    <button className={`p-1.5 rounded-full transition-opacity hover:opacity-80 ${
                      isLightMode ? 'text-black' : 'text-white'
                    }`}>
                      <User size={18} />
                    </button>
                  </Link>
                )}

                {/* Shopping Cart Link with Dynamic Badge */}
                <Link to="/cart" className="relative p-1.5 focus:outline-none" aria-label="Shopping Cart">
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-200 hover:scale-105 ${
                    isLightMode ? 'text-black' : 'text-white'
                  }`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black dark:bg-white text-[10px] font-bold font-mono text-white dark:text-black shadow-sm animate-pulse">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Drawer */}
          <DisclosurePanel className="lg:hidden bg-black/95 backdrop-blur-xl border-t border-white/10 text-white">
            <div className="px-4 pt-4 pb-6 space-y-4">
              
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="flex">
                <input
                  type="text"
                  placeholder="Search products or categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs bg-white/10 border border-white/20 rounded-l-md text-white placeholder-gray-400 focus:outline-none focus:border-white"
                />
                <button
                  type="submit"
                  className="bg-white text-black px-4 py-2.5 rounded-r-md text-xs font-semibold"
                >
                  <Search size={14} />
                </button>
              </form>

              {/* Mobile Navigation Links */}
              <div className="space-y-2 pt-2 text-xs font-medium tracking-widest uppercase">
                <Link 
                  to="/shop" 
                  className="block px-3 py-2.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Shop All Products
                </Link>
                <Link 
                  to="/shop?category=briefs" 
                  className="block px-3 py-2 rounded-md hover:bg-white/10 text-gray-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Briefs & Boxers (Min 3 Units)
                </Link>
                <Link 
                  to="/shop?category=lounge%20sets" 
                  className="block px-3 py-2 rounded-md hover:bg-white/10 text-gray-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Lounge Sets
                </Link>
                <Link 
                  to="/shop?category=3in1" 
                  className="block px-3 py-2 rounded-md hover:bg-white/10 text-gray-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  3-in-1 Bundles
                </Link>
                <Link 
                  to="/shop?category=5in1" 
                  className="block px-3 py-2 rounded-md hover:bg-white/10 text-gray-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  5-in-1 Bundles
                </Link>
                <Link 
                  to="/gift-cards" 
                  className="block px-3 py-2 rounded-md hover:bg-white/10 text-gray-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Gift Cards
                </Link>
                <Link 
                  to="/help" 
                  className="block px-3 py-2 rounded-md hover:bg-white/10 text-gray-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Help & Contact
                </Link>
              </div>
            </div>
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
}