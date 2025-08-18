import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Mail, Phone, Clock, Package, Truck, Ruler, HelpCircle, MessageCircle, ChevronRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import ContactWhatsAppWidget from '../components/contactWhatsAppWidget';

const HelpPage = () => {
  const [activeTab, setActiveTab] = useState('return-policy');
  const [expandedFaq, setExpandedFaq] = useState(null);
  
  const helpItems = [
    { id: 'return-policy', label: 'Return Policy', icon: Package },
    { id: 'shipping-policy', label: 'Shipping Policy', icon: Truck },
    { id: 'size-guide', label: 'Size Guide', icon: Ruler },
    { id: 'faqs', label: 'FAQs', icon: HelpCircle },
    { id: 'contact', label: 'Contact Us', icon: MessageCircle }
  ];

  const faqData = [
    {
      question: "How long does shipping take?",
      answer: "Standard Delievery takes 3-5 business days within Nigeria."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, debit cards, bank transfers, and mobile payment options through Paystack "
    },
    {
      question: "Can I track my order?",
      answer: "Yes! Once your order ships, you'll receive a tracking number via email. If you have any questions about your order, feel free to WhatsApp us or send us an email us we're happy to help!"
    },
    {
      question: "Do you offer international shipping?",
      answer: "Yes! We offer international shipping via DHL. Once you place your order, we'll calculate the shipping fee based on your location and send the details via email or WhatsApp. Feel free to reach out if you have any questions!"
    },
    {
      question: "How do I know what size to order?",
      answer: "Please refer to our detailed Size Guide section. We recommend measuring yourself and comparing with our size chart for the perfect fit."
    },
    {
      question: "Are your products authentic?",
      answer: "Absolutely! All our products are 100% authentic and sourced directly from verified manufacturers."
    }
  ];

  const sizeChart = {
    briefs: [
      { size: 'S', waist: '28-30', hip: '34-36' },
      { size: 'M', waist: '32-34', hip: '38-40' },
      { size: 'L', waist: '36-38', hip: '42-44' },
      { size: 'XL', waist: '40-42', hip: '46-48' },
      { size: 'XXL', waist: '44-46', hip: '50-52' }
    ],
    gymwear: [
      { size: 'S', chest: '34-36', waist: '28-30', length: '27' },
      { size: 'M', chest: '38-40', waist: '32-34', length: '28' },
      { size: 'L', chest: '42-44', waist: '36-38', length: '29' },
      { size: 'XL', chest: '46-48', waist: '40-42', length: '30' },
      { size: 'XXL', chest: '50-52', waist: '44-46', length: '31' }
    ]
  };

  // Get the label for the active tab
  const activeTabLabel = helpItems.find((item) => item.id === activeTab)?.label || 'Help';

  const renderHelpContent = () => {
    switch (activeTab) {
      case 'return-policy':
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 sm:p-8 rounded-xl border border-gray-100 shadow-lg">
              <h3 className="text-3xl font-bold font-Manrope text-Primarycolor mb-4">3-Day Return Policy</h3>
              <p className="font-Jost text-gray-600 leading-relaxed">
                All returns must be 2 to 3 days from the date of delivery. To be eligible for a return, your item must be unused, in the same condition that you received it, and in its original packaging. A receipt or proof of purchase is required.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <h4 className="text-xl font-semibold font-Manrope text-Primarycolor mb-4 flex items-center">
                  <Package className="w-6 h-6 text-green-600 mr-3" />
                  Returnable Items
                </h4>
                <ul className="space-y-2 font-Jost text-gray-600">
                  <li>• Unworn items with original tags</li>
                  <li>• Items in original packaging</li>
                  <li>• Defective or damaged products</li>
                  <li>• Client must be in Lagos</li>
                  <li>• Items returned within 3 days</li>
                </ul>
              </div>
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <h4 className="text-xl font-semibold font-Manrope text-Primarycolor mb-4 flex items-center">
                  <Package className="w-6 h-6 text-red-600 mr-3" />
                  Non-Returnable Items
                </h4>
                <ul className="space-y-2 font-Jost text-gray-600">
                  <li>• Worn or washed items</li>
                  <li>• Items without original tags</li>
                  <li>• Intimate apparel (for hygiene reasons)</li>
                  <li>• Torn item will not be accepted</li>
                </ul>
              </div>
            </div>
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100">
              <h4 className="text-xl font-semibold font-Manrope text-Primarycolor mb-6">Return Process</h4>
              <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold font-Manrope">1</span>
                  </div>
                  <h5 className="font-semibold font-Manrope text-Primarycolor mb-2">Contact Us</h5>
                  <p className="text-sm font-Jost text-gray-600">Email us your return request</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold font-Manrope">2</span>
                  </div>
                  <h5 className="font-semibold font-Manrope text-Primarycolor mb-2">Package Item</h5>
                  <p className="text-sm font-Jost text-gray-600">Pack item in original condition</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold font-Manrope">3</span>
                  </div>
                  <h5 className="font-semibold font-Manrope text-Primarycolor mb-2">Ship Back</h5>
                  <p className="text-sm font-Jost text-gray-600">Deliver within 3-days for Nigeria orders</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'shipping-policy':
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 sm:p-8 rounded-xl border border-gray-100 shadow-lg">
              <h3 className="text-3xl font-bold font-Manrope text-Primarycolor mb-4">Shipping Information</h3>
              <p className="font-Jost text-gray-600 leading-relaxed">
                We offer fast and reliable shipping across Nigeria with multiple delivery options to suit your needs.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <h4 className="text-xl font-semibold font-Manrope text-Primarycolor mb-4 flex items-center">
                  <Truck className="w-6 h-6 text-blue-600 mr-3" />
                  Standard Within Nigeria
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-Jost text-gray-600">Delivery Time:</span>
                    <span className="font-semibold font-Jost">1-4 Business Days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-Jost text-gray-600">Cost:</span>
                    <span className="font-semibold font-Jost">₦4000 - ₦10000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-Jost text-gray-600">Available:</span>
                    <span className="font-semibold font-Jost">All States</span>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <h4 className="text-xl font-semibold font-Manrope text-Primarycolor mb-4 flex items-center">
                  <Truck className="w-6 h-6 text-purple-600 mr-3" />
                  Express Outside Nigeria
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-Jost text-gray-600">Delivery Time:</span>
                    <span className="font-semibold font-Jost">1-5 Business Days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-Jost text-gray-600">Cost:</span>
                    <span className="font-semibold font-Jost">Emailed Delivery Fee </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-Jost text-gray-600">Available:</span>
                    <span className="font-semibold font-Jost">Most Countries Through DHL</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100">
              <h4 className="text-xl font-semibold font-Manrope text-Primarycolor mb-6">Shipping Locations for Nigeria</h4>
              <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
                <div className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <h5 className="font-semibold font-Manrope text-Primarycolor mb-2">Zone 1 - Lagos</h5>
                  <p className="text-sm font-Jost text-gray-600">Same day delivery available</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <h5 className="font-semibold font-Manrope text-Primarycolor mb-2">Zone 2 - Major Cities</h5>
                  <p className="text-sm font-Jost text-gray-600">Abuja, Port Harcourt, Kano</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                  <h5 className="font-semibold font-Manrope text-Primarycolor mb-2">Zone 3 - Other States</h5>
                  <p className="text-sm font-Jost text-gray-600">All other Nigerian states</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100">
              <h4 className="text-xl font-semibold font-Manrope text-Primarycolor mb-6">Important Notes</h4>
              <ul className="space-y-2 font-Jost text-gray-600">
                <li>• Orders placed before 2 PM are processed same day</li>
                <li>• Weekend orders are processed on the next business day</li>
                <li>• Remote areas may require additional 1-2 days</li>
                <li>• All packages are insured and trackable</li>
              </ul>
            </div>
          </div>
        );
      case 'size-guide':
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 sm:p-8 rounded-xl border border-gray-100 shadow-lg">
              <h3 className="text-3xl font-bold font-Manrope text-Primarycolor mb-4">Find Your Perfect Fit</h3>
              <p className="font-Jost text-gray-600 leading-relaxed">
                Our sizing is designed for comfort and style. Measure yourself accurately and refer to our charts below. 
                All measurements are in inches.
              </p>
            </div>
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <h4 className="text-xl font-semibold font-Manrope text-Primarycolor mb-6">Briefs Size Chart</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-Primarycolor">
                        <th className="text-left p-3 font-semibold font-Manrope">Size</th>
                        <th className="text-left p-3 font-semibold font-Manrope">Waist</th>
                        <th className="text-left p-3 font-semibold font-Manrope">Hip</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sizeChart.briefs.map((row, idx) => (
                        <tr key={idx} className="border-t border-gray-200 hover:bg-gray-100 transition-colors">
                          <td className="p-3 font-medium font-Manrope">{row.size}</td>
                          <td className="p-3 font-Jost">{row.waist}"</td>
                          <td className="p-3 font-Jost">{row.hip}"</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <h4 className="text-xl font-semibold font-Manrope text-Primarycolor mb-6">Gymwear Size Chart</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-Primarycolor">
                        <th className="text-left p-3 font-semibold font-Manrope">Size</th>
                        <th className="text-left p-3 font-semibold font-Manrope">Chest</th>
                        <th className="text-left p-3 font-semibold font-Manrope">Waist</th>
                        <th className="text-left p-3 font-semibold font-Manrope">Length</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sizeChart.gymwear.map((row, idx) => (
                        <tr key={idx} className="border-t border-gray-200 hover:bg-gray-100 transition-colors">
                          <td className="p-3 font-medium font-Manrope">{row.size}</td>
                          <td className="p-3 font-Jost">{row.chest}"</td>
                          <td className="p-3 font-Jost">{row.waist}"</td>
                          <td className="p-3 font-Jost">{row.length}"</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100">
              <h4 className="text-xl font-semibold font-Manrope text-Primarycolor mb-6">How to Measure</h4>
              <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
                <div className="text-center group hover:scale-105 transition-transform duration-300">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:shadow-lg transition-shadow">
                    <Ruler className="w-8 h-8 text-blue-600" />
                  </div>
                  <h5 className="font-semibold font-Manrope text-Primarycolor mb-2">Chest</h5>
                  <p className="text-sm font-Jost text-gray-600">Measure around the fullest part of your chest</p>
                </div>
                <div className="text-center group hover:scale-105 transition-transform duration-300">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:shadow-lg transition-shadow">
                    <Ruler className="w-8 h-8 text-blue-600" />
                  </div>
                  <h5 className="font-semibold font-Manrope text-Primarycolor mb-2">Waist</h5>
                  <p className="text-sm font-Jost text-gray-600">Measure around your natural waistline</p>
                </div>
                <div className="text-center group hover:scale-105 transition-transform duration-300">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:shadow-lg transition-shadow">
                    <Ruler className="w-8 h-8 text-blue-600" />
                  </div>
                  <h5 className="font-semibold font-Manrope text-Primarycolor mb-2">Hip</h5>
                  <p className="text-sm font-Jost text-gray-600">Measure around the fullest part of your hips</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'faqs':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 sm:p-8 rounded-xl border border-gray-100 shadow-lg">
              <h3 className="text-3xl font-bold font-Manrope text-Primarycolor mb-4">Frequently Asked Questions</h3>
              <p className="font-Jost text-gray-600 leading-relaxed">
                Find quick answers to common questions about our products, shipping, and policies.
              </p>
            </div>
            <div className="space-y-4">
              {faqData.map((faq, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                    className={`w-full p-6 text-left flex items-center justify-between rounded-full transition-all duration-200 ${
                      expandedFaq === idx ? 'bg-accent text-black' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    aria-expanded={expandedFaq === idx}
                    aria-controls={`faq-${idx}`}
                  >
                    <h4 className="font-semibold font-Manrope text-Primarycolor">{faq.question}</h4>
                    {expandedFaq === idx ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {expandedFaq === idx && (
                    <div id={`faq-${idx}`} className="px-6 pb-6">
                      <p className="font-Jost text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      case 'contact':
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 sm:p-8 rounded-xl border border-gray-100 shadow-lg">
              <h3 className="text-3xl font-bold font-Manrope text-Primarycolor mb-4">Get in Touch</h3>
              <p className="font-Jost text-gray-600 leading-relaxed">
                We're here to help! Reach out to us through any of the channels below.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="font-semibold font-Manrope text-Primarycolor mb-2">Email Us</h4>
                <p className="font-Jost text-gray-600 mb-4 text-sm">Get in touch via email</p>
                <a 
                  href="mailto:thetiabrand1@gmail.com"
                  className="text-blue-600 hover:text-blue-800 font-medium font-Jost transition-colors"
                >
                  thetiabrand1@gmail.com
                </a>
              </div>
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="font-semibold font-Manrope text-Primarycolor mb-2">Call Us</h4>
                <p className="font-Jost text-gray-600 mb-4 text-sm">Speak with our team</p>
                <a 
                  href="tel:+2348104117122"
                  className="text-green-600 hover:text-green-800 font-medium font-Jost transition-colors"
                >
                  +234 810 411 7122
                </a>
              </div>
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="font-semibold font-Manrope text-Primarycolor mb-2">Business Hours</h4>
                <p className="font-Jost text-gray-600 mb-4 text-sm">We're available</p>
                <p className="text-purple-600 font-medium font-Jost">8:30am - 10:00pm</p>
                <p className="text-xs font-Jost text-gray-500 mt-1">Monday - Sunday</p>
              </div>
            </div>
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100">
              <h4 className="text-xl font-semibold font-Manrope text-Primarycolor mb-6">Send us a Message</h4>
              <ContactWhatsAppWidget />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen" style={{
      '--color-Primarycolor': '#1E1E1E',
      '--color-Secondarycolor': '#ffffff',
      '--color-Accent': '#6E6E6E',
      '--color-Softcolor': '#F5F5DC',
      '--font-Manrope': '"Manrope", "sans-serif"',
      '--font-Jost': '"Jost", "sans-serif"'
    }}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center space-x-2 text-sm sm:text-base">
            <li>
              <Link
                to="/home"
                className="px-3 py-1 rounded-full bg-gray-100 text-Primarycolor hover:bg-gray-200 hover:text-blue-800 transition-all duration-200 font-Jost"
              >
                Home
              </Link>
            </li>
            <li>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </li>
            <li>
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold font-Jost">
                Help
              </span>
            </li>
            <li>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </li>
            <li>
              <span
                className="px-3 py-1 rounded-full bg-accent text-black font-semibold font-Jost"
                aria-current="page"
              >
                {activeTabLabel}
              </span>
            </li>
          </ol>
        </nav>
        <div className="grid lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sticky top-8">
              <h2 className="text-lg font-semibold font-Manrope text-Primarycolor mb-6">Help Topics</h2>
              <nav className="space-y-2">
                {helpItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-2 rounded-full text-left transition-all duration-200 font-Jost ${
                        activeTab === item.id
                          ? 'bg-accent text-black border border-accent shadow-sm'
                          : 'text-gray-600 bg-gray-100 hover:bg-gray-200 hover:text-gray-800'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="min-h-[600px]">
              {renderHelpContent()}
            </div>
          </div>
        </div>
      </div>
      {/* Custom CSS for animations */}
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default HelpPage;