import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { LogOut, Search, User, Package, ShoppingBag, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toastSuccess } from '../utils/toastConfig';
import Logo from '../assets/icons/logo.svg';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.warn('Navbar: Loading stuck, continuing render.');
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
      setIsSearchFocused(false);
    }
  };
  
  const handleMenuNavigation = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };
  
  if (loading && !loadingTimeout) {
    return (
      <nav className="bg-gradient-to-r from-Primarycolor via-Primarycolor to-Primarycolor/95 backdrop-blur-md">
        <div className="mx-auto max-w-full container-padding flex h-[4rem] items-center justify-center">
          <div className="flex items-center gap-3 text-white">
            <div className="relative">
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
            <span className="text-sm font-medium animate-pulse">Loading...</span>
          </div>
        </div>
      </nav>
    );
  }
  
  return (
    <Disclosure as="nav" className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-Primarycolor/95 backdrop-blur-lg shadow-lg border-b border-white/10' 
        : 'bg-Primarycolor'
    }`}>
      {({ open }) => (
        <>
          <div className="mx-auto max-w-full container-padding">
            <div className="relative flex h-[4rem] items-center justify-between">
              
              {/* Mobile menu button */}
              <div className="absolute inset-y-0 left-0 flex items-center lg:hidden">
                <DisclosureButton className="group inline-flex items-center justify-center rounded-xl p-2.5 text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200">
                  <span className="sr-only">Open menu</span>
                  <div className="relative w-6 h-6">
                    <Bars3Icon className={`absolute inset-0 h-6 w-6 transform transition-all duration-200 ${open ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'}`} />
                    <XMarkIcon className={`absolute inset-0 h-6 w-6 transform transition-all duration-200 ${open ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'}`} />
                  </div>
                </DisclosureButton>
              </div>
              
              {/* Left: User greeting (desktop only) */}
              <div className="hidden lg:flex flex-1 items-center">
                {user && (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-Softcolor to-accent rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-Secondarycolor font-Manrope">
                        Hi, {user.first_name}
                      </span>
                      <span className="text-xs text-Secondarycolor/70">Welcome back</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Center: Logo */}
              <div className="absolute left-1/2 transform -translate-x-1/2">
                <Link to="/home" className="group flex items-center transition-transform duration-200 hover:scale-105">
                  <div className="relative">
                    <img 
                      src={Logo} 
                      alt="Logo" 
                      className="h-8 w-auto sm:h-9 md:h-10 transition-all duration-200"
                    />
                    <div className="absolute inset-0 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 -m-1"></div>
                  </div>
                </Link>
              </div>
              
              {/* Right: Search, User Menu, Cart */}
              <div className="flex items-center gap-2 ml-auto">
                
                {/* Enhanced Search (desktop) */}
                <div className="relative hidden lg:flex items-center group">
                  <div className={`relative transition-all duration-300 ${
                    isSearchFocused ? 'w-80' : 'w-60 xl:w-72'
                  }`}>
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                      className="w-full h-10 pl-4 pr-12 text-sm text-Secondarycolor bg-white/10 border border-white/20 rounded-full backdrop-blur-sm placeholder-Secondarycolor/60 focus:bg-white/15 focus:border-Softcolor focus:outline-none focus:ring-2 focus:ring-Softcolor/30 transition-all duration-200"
                    />
                    <button 
                      onClick={handleSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors duration-200" 
                      aria-label="Search"
                    >
                      <Search className="h-4 w-4 text-Secondarycolor/80" />
                    </button>
                  </div>
                  
                  {/* Search suggestions overlay */}
                  {isSearchFocused && searchQuery && (
                    <div className="absolute top-12 left-0 right-0 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50">
                      <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
                        Search suggestions
                      </div>
                      {/* Add your search suggestions here */}
                    </div>
                  )}
                </div>
                
                {/* Notifications (if user logged in) */}
                {user && (
                  <button className="relative p-2.5 text-Secondarycolor hover:bg-white/10 rounded-full transition-all duration-200 group">
                    <Bell className="h-5 w-5" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-Primarycolor"></div>
                  </button>
                )}
                
                {/* Enhanced User Menu (desktop) */}
                <div className="hidden lg:flex relative" ref={menuRef}>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 p-2 hover:bg-white/10 rounded-full transition-all duration-200 group"
                    aria-label="User menu"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-Softcolor to-accent rounded-full flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  </button>
                  
                  {/* Enhanced Desktop dropdown menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 transform opacity-100 scale-100 transition-all duration-200">
                      {user ? (
                        <>
                          <div className="px-4 py-3 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-Softcolor to-accent rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{user.first_name}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="py-2">
                            <Link 
                              to="/profile" 
                              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                              onClick={() => handleMenuNavigation('/profile')}
                            >
                              <User className="h-4 w-4 text-gray-500" />
                              Profile Settings
                            </Link>
                            <Link 
                              to="/orders" 
                              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                              onClick={() => handleMenuNavigation('/orders')}
                            >
                              <Package className="h-4 w-4 text-gray-500" />
                              Order History
                            </Link>
                          </div>
                          
                          <div className="border-t border-gray-100 pt-2">
                            <button
                              onClick={handleLogout}
                              className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                            >
                              <LogOut className="h-4 w-4" />
                              Sign Out
                            </button>
                          </div>
                        </>
                      ) : (
                        <Link 
                          to="/login"
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                        >
                          <User className="h-4 w-4 text-gray-500" />
                          Sign In
                        </Link>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Auth button (mobile fallback) */}
                {!user && (
                  <Link to="/login" className="lg:hidden">
                    <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-Secondarycolor hover:bg-white/10 rounded-full transition-all duration-200">
                      <User className="h-4 w-4" />
                      <span className='font-Manrope'>Login</span>
                    </button>
                  </Link>
                )}
                
                {/* Enhanced Cart Button */}
                {location.pathname === '/cart' ? (
                  <button
                    onClick={() => navigate(-1)}
                    className="flex items-center justify-center w-10 h-10 text-Secondarycolor hover:bg-white/10 rounded-full transition-all duration-200 group"
                    aria-label="Go back"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform duration-200" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                  </button>
                ) : (
                  <Link to="/cart">
                    <button className="relative flex items-center justify-center w-10 h-10 text-Secondarycolor hover:bg-white/10 rounded-full transition-all duration-200 group">
                      <ShoppingBag className="h-5 w-5 group-hover:scale-105 transition-transform duration-200" />
                      {/* Cart item count badge */}
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-Softcolor text-white text-xs rounded-full flex items-center justify-center font-medium">
                        0
                      </div>
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>
          
          {/* Enhanced Mobile Menu */}
          <DisclosurePanel className="lg:hidden bg-Primarycolor/95 backdrop-blur-md border-t border-white/10">
            <div className="px-4 py-4 space-y-4">
              
              {/* User section (mobile) */}
              {user && (
                <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                  <div className="w-12 h-12 bg-gradient-to-br from-Softcolor to-accent rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Hi, {user.first_name}</p>
                    <p className="text-sm text-Secondarycolor/70">Welcome back</p>
                  </div>
                </div>
              )}
              
              {/* Enhanced Mobile Search */}
              <div className="relative">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-11 pl-4 pr-4 text-Secondarycolor text-sm bg-white/10 border border-white/20 rounded-full backdrop-blur-sm placeholder-Secondarycolor/60 focus:bg-white/15 focus:border-Softcolor focus:outline-none focus:ring-2 focus:ring-Softcolor/30"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-11 h-11 bg-Softcolor text-white rounded-full flex items-center justify-center hover:bg-Softcolor/90 transition-colors duration-200"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </form>
              </div>
              
              {/* Mobile Navigation Links */}
              {user && (
                <div className="space-y-1">
                  <Link to="/profile">
                    <button className="flex items-center gap-3 w-full text-left p-3 rounded-xl text-Secondarycolor hover:bg-white/10 transition-all duration-200">
                      <User className="h-5 w-5" />
                      <span className="font-medium">Profile Settings</span>
                    </button>
                  </Link>
                  
                  <Link to="/orders">
                    <button className="flex items-center gap-3 w-full text-left p-3 rounded-xl text-Secondarycolor hover:bg-white/10 transition-all duration-200">
                      <Package className="h-5 w-5" />
                      <span className="font-medium">My Orders</span>
                    </button>
                  </Link>
                  
                  <div className="pt-2 mt-2 border-t border-white/10">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full text-left p-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all duration-200"
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="font-medium">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
}