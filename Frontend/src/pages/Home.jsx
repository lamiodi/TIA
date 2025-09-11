import React from "react";
import { Helmet } from 'react-helmet-async';
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

const Home = () => {
  return (
    <div className="bg-Secondarycolor flex flex-col min-h-screen w-full overflow-x-hidden">
      <Helmet>
        <title>The Tia Brand | Premium Comfort Wear</title>
        <meta name="description" content="Discover luxury fashion at The Tia Brand. Shop premium clothing, accessories, and exclusive collections with worldwide shipping." />
        <link rel="canonical" href="https://thetiabrand.org/" />
        {/* Structured data for organization/logo and social links in search results */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "The Tia Brand",
            "url": "https://www.thetiabrand.org/",
            "logo": "https://www.thetiabrand.org/public/favicon.png", // Update to a higher-res logo if available (e.g., a 512x512 PNG)
            "sameAs": [
              "https://www.instagram.com/tiastores.ng",
              "https://www.threads.com/@tiastores.ng"
            ]
          })}
        </script>
      </Helmet>
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

export default Home;