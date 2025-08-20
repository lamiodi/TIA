import React from "react";
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import ProductGrid from '../components/ProductGrid';
import CtaSlideshow from '../components/CtaSlideshow';
import NewsletterForm from '../components/NewsletterForm';
import Footer from '../components/Footer';
import '../index.css';
import Newreleasegrid from "../components/Newreleasegrid";
import LocationPopup from "../components/LocationPopup";
import WhatsAppChatWidget from "../components/WhatsAppChatWidget";




const Home = () =>{
  return (
    <div className="bg-Secondarycolor flex flex-col min-h-screen w-full overflow-x-hidden">
      <WhatsAppChatWidget />
       <Navbar />
       <HeroSection />
       <Newreleasegrid />
       <CtaSlideshow />
       <ProductGrid />
       <NewsletterForm />
       <Footer />
       <LocationPopup />
   </div>
  )
}

export default Home