import React from 'react';
import threadsicon from '../assets/icons/threads.png'
import instagramicon from '../assets/icons/instagram.png';
import Logo from '../assets/icons/logo.svg';
import Footerimage from '../assets/images/footer.JPG';
import { Link } from 'react-router-dom';



// Reusable Button Component
const Button = ({ className, label }) => {
  return (
    <button className={`px-4 py-2 rounded text-white bg-[#1e1e1e] hover:opacity-90 transition ${className}`}>
      {label}
    </button>
  );
};

const Footer = () => {
  return (
    <div className="container-padding typography relative bg-Primarycolor  py-6 ">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-5   mb-8">
      <div>
          <h3 className="text-white font-bold text-base mb-4">HELP CENTER</h3>
          <ul className="space-y-2 text-white text-base opacity-75 adjust">
            <Link to="/help">
            <li>Return Policy</li>
            <li>Shipping Policy</li>
            <li>Size Guide</li>
            <li>Faqs</li>
            <li>Contact Us</li>
            </Link>
            <li className="pt-2 space-y-2">
              <div>Thetiabrand1@gmail.com</div>
              <div> +2348104117122 </div>
              <div className="text-xs opacity-60 mt-1">Opening hours 8:30am - 10pm</div>
            </li>
            
          </ul>
        </div>
        <div>
          <h3 className="text-white font-bold text-base mb-4">MORE</h3>
          <Link to="/more">
          <ul className="space-y-2 text-white text-base opacity-75 adjust ">
            <li>About Us</li>
            <li>Terms</li>
            <li>Privacy</li>
            <li>Support</li>
          </ul>
          </Link>
        </div>
        
        <div className="bg-Secondarycolor p-3 relative w-full sm:col-span-2 md:col-span-2 aspect-[2/1] md:aspect-[2/1.1] lg:aspect-[2/1.2] flex items-center justify-center">
          <img
            src={Footerimage}
            alt="Promo"
            className="absolute left-0 top-0 w-1/2 h-full  object-cover "
          />
          <div className="ml-auto w-1/2 pl-4 ">
            <h3 className="text-black text-center  underline underline-offset-8 font-semibold text-2xl mb-2">Sign Up Now</h3>
            <img
              src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
              alt="Line"
              className="mb-4"
            />
            <p className="text-black text-xl font-Jost font-light mb-4 text-center">
              Be the first to know about new drops<span className='max-md:hidden'>, exclusive deals, and more.</span>
            </p>
            <div className="text-center mb-4">
              <div className="text-black text-[25px] font-bold">
                GET<br />10% OFF
              </div>
              <div className="text-xl font-Jost">your first order!</div>
            </div>
            <div className="text-center">
             <Link to='/signup' > <Button className="w-full" label="SIGN UP" /></Link>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white border-opacity-20 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-4">
          <img
            src={Logo}
            alt="Logo"
            className="h-10"
          />
        </div>
        <div className="flex items-center space-x-4">
        <div className='bg-Primarycolor p-2 rounded-full'>
          <Link to="https://www.instagram.com/tiastores.ng?igsh=ODN0YWFxcnA0bDF4">
          <img
            src={instagramicon}
            alt="Instagram"
            className="h-8  "
          /></Link>
          </div>
         <div className='bg-Primarycolor  rounded-full'>
          <Link to='https://www.threads.com/@tiastores.ng?igshid=NTc4MTIwNjQ2YQ=='>
          <img
            src={threadsicon}
            alt="Threads"
            className="h-8  rounded-full  ring-offset-Secondarycolor ring-[0.5px] ring-white ring-opacity-20 hover:ring-offset-Primarycolor transition-all duration-300"
          /></Link>
          </div>
        </div>
      </div>
      <p className="text-xs font-Manrope text-white text-right max-md:text-center mt-4">&copy; {new Date().getFullYear()} Tia Stores. All rights reserved.</p>
    </div>
  );
};

export default Footer;