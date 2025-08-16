import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { LogOut, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toastSuccess } from '../utils/toastConfig';
import Logo from '../assets/icons/logo.svg';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
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
    toastSuccess('Logged out successfully');
    navigate('/login');
  };

  // Updated search function to navigate to search results page
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results page with the query as a URL parameter
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      // Clear search input after submission
      setSearchQuery('');
    }
  };

  if (loading && !loadingTimeout) {
    return (
      <nav className="bg-Primarycolor">
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
    <Disclosure as="nav" className="bg-Primarycolor">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-full container-padding">
            <div className="relative flex h-[3.75rem] items-center justify-between">
              
              {/* Mobile menu button - show below lg */}
              <div className="absolute inset-y-0 left-0 flex items-center lg:hidden">
                <DisclosureButton className="inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-accent hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                  <span className="sr-only">Open menu</span>
                  {open ? (
                    <XMarkIcon className="block h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                  )}
                </DisclosureButton>
              </div>
              
              {/* Left: User greeting (desktop only) */}
              <div className="hidden lg:flex flex-1 items-center">
                {user && (
                  <div className="flex items-center text-Secondarycolor">
                    <span className="text-sm font-medium font-Manrope">Hi, {user.first_name}</span>
                  </div>
                )}
              </div>
              
              {/* Center: Logo */}
              <div className="absolute left-1/2 transform -translate-x-1/2 sm:transform-none">
                <Link to="/home" className="flex items-center">
                  <img src={Logo} alt="Logo" className="h-6 w-auto sm:h-7 md:h-8" />
                </Link>
              </div>
              
              {/* Right: Auth and navigation */}
              <div className="flex items-center gap-4 ml-auto">
                {/* Search (desktop only - show from lg and above) */}
                <div className="relative hidden lg:flex items-center">
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                    className="w-40 lg:w-60 xl:w-70 2xl:w-70 pl-2 pr-8 py-1 text-Secondarycolor text-sm border-b border-Secondarycolor bg-transparent focus:border-b-2 focus:border-Softcolor focus:outline-none"
                  />
                  <button 
                    onClick={handleSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2" 
                    aria-label="Search"
                  >
                    <Search className="h-3 w-3 text-Secondarycolor sm:h-4 sm:w-4" />
                  </button>
                </div>
                
                {/* Profile icon (desktop only) */}
                <Link to="/profile" className="hidden lg:flex">
                  <button className="flex items-center p-1 hover:opacity-80 transition-opacity" aria-label="Profile">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-Secondarycolor" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </Link>
                
                {/* Auth button */}
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-sm font-medium text-Secondarycolor hover:underline"
                    aria-label="Logout"
                  >
                    <LogOut size={14} className="sm:w-4 sm:h-4" />
                    <span className='font-Manrope'>Logout</span>
                  </button>
                ) : (
                  <Link to="/login">
                    <button
                      className="flex items-center gap-1 text-sm font-medium text-Secondarycolor hover:underline"
                      aria-label="Login"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 sm:h-6 sm:w-6 text-Secondarycolor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                      </svg>
                      <span className='font-Manrope'>Login</span>
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-Secondarycolor" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                  </button>
                ) : (
                  <Link to="/cart">
                    <button className="flex items-center p-1 hover:opacity-80 transition-opacity" aria-label="Shopping cart">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-Secondarycolor" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                      </svg>
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>
          
          {/* Mobile Menu */}
          <DisclosurePanel className="lg:hidden">
            <div className="space-y-1 px-4 pb-3 pt-2">
              {/* User greeting (mobile) */}
              {user && (
                <div className="mb-2 px-3 py-2 text-white">
                  <span className="text-sm font-medium">Hi, {user.first_name}</span>
                </div>
              )}
              
              {/* Search input (mobile only - show below lg) */}
              <div className="mb-4">
                <form onSubmit={handleSearch} className="flex">
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-3 py-2 text-Secondarycolor text-sm border border-Secondarycolor rounded-l bg-transparent focus:border-Softcolor focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-Secondarycolor text-Primarycolor px-3 py-2 rounded-r"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </form>
              </div>
              
              {/* Profile link (mobile only) */}
              {user && (
                <Link to="/profile">
                  <button className="flex items-center w-full text-left px-3 py-2 text-sm rounded transition-colors text-Secondarycolor hover:text-Softcolor hover:bg-white/5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 text-Secondarycolor hover:text-Softcolor mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Profile
                  </button>
                </Link>
              )}
            </div>
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
}