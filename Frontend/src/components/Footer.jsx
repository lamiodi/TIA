import React from 'react';
import threadsicon from '../assets/icons/threads.png';
import instagramicon from '../assets/icons/instagram.png';
import Logo from '../assets/icons/logo.svg';
import { Link } from 'react-router-dom';

const Footerimage = "https://res.cloudinary.com/dgcwviufp/image/upload/f_auto,q_auto/footer_ez7kcm.jpg";

const Footer = () => {
  return (
    <footer className="w-full bg-black text-white pt-12 pb-8 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* Help Center */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white mb-4">Help Center</h3>
            <ul className="space-y-2.5 text-xs text-gray-400 font-sans">
              <li><Link to="/help" className="hover:text-white transition-colors">Return Policy</Link></li>
              <li><Link to="/help" className="hover:text-white transition-colors">Shipping Policy</Link></li>
              <li><Link to="/help" className="hover:text-white transition-colors">Size Guide</Link></li>
              <li><Link to="/help" className="hover:text-white transition-colors">FAQs</Link></li>
              <li><Link to="/help" className="hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
            <div className="mt-6 pt-4 border-t border-white/10 text-xs text-gray-400 space-y-1">
              <p className="font-mono text-[11px] text-gray-300">thetiabrand1@gmail.com</p>
              <p className="font-mono text-[11px] text-gray-300">+234 810 411 7122</p>
              <p className="text-[10px] text-gray-500 mt-1">Hours: 8:30am - 10:00pm (WAT)</p>
            </div>
          </div>

          {/* Navigation & Policies */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white mb-4">Explore</h3>
            <ul className="space-y-2.5 text-xs text-gray-400 font-sans">
              <li><Link to="/shop" className="hover:text-white transition-colors">Shop All Products</Link></li>
              <li><Link to="/shop?category=briefs" className="hover:text-white transition-colors">Briefs & Boxers</Link></li>
              <li><Link to="/shop?category=lounge%20sets" className="hover:text-white transition-colors">Lounge Sets</Link></li>
              <li><Link to="/shop?category=3in1" className="hover:text-white transition-colors">3-in-1 & 5-in-1 Bundles</Link></li>
              <li><Link to="/gift-cards" className="hover:text-white transition-colors">Gift Cards</Link></li>
              <li><Link to="/more" className="hover:text-white transition-colors">About & Terms</Link></li>
            </ul>
          </div>

          {/* Promo Newsletter Box */}
          <div className="lg:col-span-2 bg-zinc-900 rounded-lg overflow-hidden border border-white/10 relative flex flex-col sm:flex-row">
            <div className="sm:w-1/2 h-44 sm:h-auto relative overflow-hidden">
              <img
                src={Footerimage}
                alt="The TiaBrand Campaign"
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/60 to-transparent"></div>
            </div>

            <div className="sm:w-1/2 p-6 flex flex-col justify-between text-center sm:text-left">
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  Exclusive Welcome
                </span>
                <h4 className="text-lg font-semibold tracking-tight text-white mt-2">
                  Get 5% OFF
                </h4>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Join our newsletter for early drop access, private sales & exclusive loungewear edits.
                </p>
              </div>

              <div className="mt-4">
                <Link 
                  to="/signup"
                  className="inline-flex items-center justify-center w-full px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-black bg-white rounded hover:bg-gray-200 transition-colors shadow-sm"
                >
                  Sign Up Now
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center space-x-3">
            <img
              src={Logo}
              alt="The TiaBrand"
              className="h-6 opacity-80"
            />
            <span className="text-[11px]">Luxury Comfort Wear</span>
          </div>

          <div className="flex items-center space-x-4">
            <a 
              href="https://www.instagram.com/the.tiabrand/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 bg-white/5 hover:bg-white/15 rounded-full transition-colors"
              aria-label="Instagram"
            >
              <img src={instagramicon} alt="Instagram" className="h-4 w-4" />
            </a>
            <a 
              href="https://www.threads.net/@tiastores.ng" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 bg-white/5 hover:bg-white/15 rounded-full transition-colors"
              aria-label="Threads"
            >
              <img src={threadsicon} alt="Threads" className="h-4 w-4" />
            </a>
          </div>

          <p className="text-[11px] font-mono text-gray-500">
            &copy; {new Date().getFullYear()} The TiaBrand. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
