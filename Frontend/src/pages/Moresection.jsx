import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Mail, Phone, Clock, Package, MessageCircle, Info, HeartHandshake, FileText, Eye, Shield, Users, Award, Zap, CheckCircle, Star, HelpCircle, RefreshCw, ChevronRight, ShoppingCart, CreditCard, Truck, Shirt, Building, Monitor } from 'lucide-react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';

const MorePage = () => {
  const [activeTab, setActiveTab] = useState('about');
  const [expandedSection, setExpandedSection] = useState(null);
  
  const moreItems = [
    { id: 'about', label: 'About Us', icon: Info },
    { id: 'terms', label: 'Terms', icon: FileText },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'support', label: 'Support', icon: HeartHandshake }
  ];
  
  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };
  
  // Get the label for the active tab
  const activeTabLabel = moreItems.find((item) => item.id === activeTab)?.label || 'More';
  
  // Help topics content
  const helpTopicsContent = {
    'help-0': {
      title: 'Order Status & Tracking',
      icon: <Package className="w-5 h-5" />,
      content: (
        <div className="mt-4 pl-2 space-y-3">
          <p className="font-Jost text-gray-600">
            You can check your order status at any time by logging into your account on our website. 
            Once your order is placed, you'll receive a confirmation email with your order details.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="font-Jost text-blue-800 font-medium flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              Email Notifications
            </p>
            <p className="font-Jost text-blue-700 text-sm mt-2">
              Our admin team automatically sends email updates whenever your order status changes. 
              You'll receive notifications when:
            </p>
            <ul className="list-disc list-inside font-Jost text-blue-700 text-sm mt-2 space-y-1">
              <li>Your order is confirmed</li>
              <li>Your payment is processed</li>
              <li>Your order is being prepared</li>
              <li>Your order ships (with tracking information)</li>
              <li>Your order is delivered</li>
            </ul>
          </div>
          <p className="font-Jost text-gray-600">
            To track your package, use the tracking number provided in the shipping confirmation email 
            on our website or the courier's website.
          </p>
        </div>
      )
    },
    'help-1': {
      title: 'Size Exchange',
      icon: <Shirt className="w-5 h-5" />,
      content: (
        <div className="mt-4 pl-2 space-y-3">
          <p className="font-Jost text-gray-600">
            If you need a different size, we offer free size exchanges within 30 days of purchase. 
            The item must be unworn, unwashed, and in its original packaging with all tags attached.
          </p>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="font-Jost text-green-800 font-medium">Exchange Process:</p>
            <ol className="list-decimal list-inside font-Jost text-green-700 text-sm mt-2 space-y-1">
              <li>Contact our support team with your order number</li>
              <li>We'll send you a return shipping label via email</li>
              <li>Package the item securely and attach the label</li>
              <li>Drop off the package at any courier location</li>
              <li>Once received, we'll ship your new size immediately</li>
            </ol>
          </div>
          <p className="font-Jost text-gray-600">
            You'll receive email notifications at each step of the exchange process, including when 
            we receive your return and when your replacement ships.
          </p>
        </div>
      )
    },
    'help-2': {
      title: 'Payment Issues',
      icon: <CreditCard className="w-5 h-5" />,
      content: (
        <div className="mt-4 pl-2 space-y-3">
          <p className="font-Jost text-gray-600">
            If you're experiencing payment issues, here are some common solutions:
          </p>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="font-Jost text-yellow-800 font-medium">Troubleshooting Tips:</p>
            <ul className="list-disc list-inside font-Jost text-yellow-700 text-sm mt-2 space-y-1">
              <li>Ensure your card details are entered correctly</li>
              <li>Check that your card has sufficient funds</li>
              <li>Verify your card is enabled for online transactions</li>
              <li>Try a different payment method or browser</li>
              <li>Contact your bank if the issue persists</li>
            </ul>
          </div>
          <p className="font-Jost text-gray-600">
            If your payment is successful but you don't receive a confirmation email within 30 minutes, 
            please check your spam folder or contact our support team.
          </p>
        </div>
      )
    },
    'help-3': {
      title: 'Product Care Instructions',
      icon: <Shirt className="w-5 h-5" />,
      content: (
        <div className="mt-4 pl-2 space-y-3">
          <p className="font-Jost text-gray-600">
            To ensure the longevity of your Tia products, please follow these care instructions:
          </p>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="font-Jost text-purple-800 font-medium">General Care Guidelines:</p>
            <ul className="list-disc list-inside font-Jost text-purple-700 text-sm mt-2 space-y-1">
              <li>Machine wash cold with similar colors</li>
              <li>Use mild detergent, avoid bleach</li>
              <li>Tumble dry low or hang to dry</li>
              <li>Do not iron directly on elastic or prints</li>
              <li>Wash inside out to preserve color and fabric</li>
            </ul>
          </div>
          <p className="font-Jost text-gray-600">
            For specific product care instructions, refer to the label on your garment or the product 
            page on our website.
          </p>
        </div>
      )
    },
    'help-4': {
      title: 'Wholesale Inquiries',
      icon: <Building className="w-5 h-5" />,
      content: (
        <div className="mt-4 pl-2 space-y-3">
          <p className="font-Jost text-gray-600">
            Interested in becoming a Tia brand retailer or distributor? We offer wholesale partnerships 
            for qualified businesses.
          </p>
          <div className="bg-indigo-50 p-4 rounded-lg">
            <p className="font-Jost text-indigo-800 font-medium">Wholesale Benefits:</p>
            <ul className="list-disc list-inside font-Jost text-indigo-700 text-sm mt-2 space-y-1">
              <li>Competitive wholesale pricing</li>
              <li>Marketing materials and support</li>
              <li>Exclusive access to new collections</li>
              <li>Flexible order quantities</li>
              <li>Dedicated account manager</li>
            </ul>
          </div>
          <p className="font-Jost text-gray-600">
            To apply for a wholesale account, please email us at <strong>Thetiabrand1@gmail.com</strong> with 
            your business information, including your company name, location, and type of retail establishment.
          </p>
        </div>
      )
    },
    'help-5': {
      title: 'Technical Support',
      icon: <Monitor className="w-5 h-5" />,
      content: (
        <div className="mt-4 pl-2 space-y-3">
          <p className="font-Jost text-gray-600">
            Experiencing technical issues with our website or your account? Our technical support team is here to help.
          </p>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="font-Jost text-red-800 font-medium">Common Issues We Resolve:</p>
            <ul className="list-disc list-inside font-Jost text-red-700 text-sm mt-2 space-y-1">
              <li>Account login problems</li>
              <li>Website navigation difficulties</li>
              <li>Checkout process errors</li>
              <li>Mobile app functionality issues</li>
              <li>Data privacy concerns</li>
            </ul>
          </div>
          <p className="font-Jost text-gray-600">
            For technical support, please email us with a detailed description of the issue, screenshots if applicable, 
            and your device/browser information. Our technical team will respond within 24 hours with a solution.
          </p>
        </div>
      )
    }
  };
  
  const renderContent = () => {
    switch (activeTab) {
      case 'about':
        return (
          <div className="space-y-8 animate-fade-in">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-8 rounded-xl border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
              <h3 className="text-3xl font-bold font-Manrope text-Primarycolor mb-4">About The Tia brand</h3>
              <p className="text-xl font-Jost text-gray-600 leading-relaxed mb-4">
                Premium comfort, tailored for everyday movement.
              </p>
              <p className="font-Jost text-gray-600 leading-relaxed">
                Founded with a vision to revolutionize men's underwear and activewear,The Tia brand combines cutting-edge design with uncompromising comfort.
              </p>
            </div>
            {/* Mission & Vision */}
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                  <Award className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-xl font-semibold font-Manrope text-Primarycolor mb-4">Our Mission</h4>
                <p className="font-Jost text-gray-600 leading-relaxed mb-6">
                  At Tia brand, we believe that comfort shouldn't compromise style. We create premium 
                  underwear and activewear that moves with you, providing unmatched comfort for your 
                  everyday adventures.
                </p>
                <p className="font-Jost text-gray-600 leading-relaxed">
                  Every piece is crafted with attention to detail, using high-quality materials that 
                  last longer and feel better against your skin.
                </p>
              </div>
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-blue-100 rounded-full flex items-center justify-center mb-6">
                  <Zap className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-xl font-semibold font-Manrope text-Primarycolor mb-4">Our Vision</h4>
                <p className="font-Jost text-gray-600 leading-relaxed mb-6">
                  To become Africa's leading premium underwear brand, setting new standards for comfort, 
                  quality, and style in men's intimate apparel.
                </p>
                <p className="font-Jost text-gray-600 leading-relaxed">
                  We envision a world where every man experiences the confidence that comes from wearing 
                  perfectly fitted, premium quality underwear designed for the modern lifestyle.
                </p>
              </div>
            </div>
            {/* Our Values */}
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100">
              <h4 className="text-2xl font-semibold font-Manrope text-Primarycolor mb-8 text-center">Our Core Values</h4>
              <div className="grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                <div className="text-center group hover:scale-105 transition-transform duration-300">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg transition-shadow">
                    <Star className="w-10 h-10 text-blue-600" />
                  </div>
                  <h5 className="text-lg font-semibold font-Manrope text-Primarycolor mb-3">Quality First</h5>
                  <p className="font-Jost text-gray-600 leading-relaxed">
                    We source only the finest materials and employ rigorous quality control processes 
                    to ensure every product meets our high standards.
                  </p>
                </div>
                <div className="text-center group hover:scale-105 transition-transform duration-300">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg transition-shadow">
                    <Users className="w-10 h-10 text-green-600" />
                  </div>
                  <h5 className="text-lg font-semibold font-Manrope text-Primarycolor mb-3">Customer-Centric</h5>
                  <p className="font-Jost text-gray-600 leading-relaxed">
                    Your comfort and satisfaction drive everything we do. We listen to feedback and 
                    continuously improve our products and services.
                  </p>
                </div>
                <div className="text-center group hover:scale-105 transition-transform duration-300">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg transition-shadow">
                    <Zap className="w-10 h-10 text-purple-600" />
                  </div>
                  <h5 className="text-lg font-semibold font-Manrope text-Primarycolor mb-3">Innovation</h5>
                  <p className="font-Jost text-gray-600 leading-relaxed">
                    We constantly push boundaries, exploring new technologies and designs to create 
                    products that exceed expectations.
                  </p>
                </div>
              </div>
            </div>
            {/* Why Choose Us */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 sm:p-8 rounded-xl border border-gray-100 shadow-lg">
              <h4 className="text-2xl font-semibold font-Manrope text-Primarycolor mb-8 text-center">Why Choose Tiabrand?</h4>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <h5 className="font-semibold font-Manrope text-Primarycolor mb-2">Premium Materials</h5>
                  <p className="text-sm font-Jost text-gray-600">High-grade fabrics sourced from trusted suppliers worldwide</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-6 h-6 text-green-600" />
                  </div>
                  <h5 className="font-semibold font-Manrope text-Primarycolor mb-2">Perfect Fit</h5>
                  <p className="text-sm font-Jost text-gray-600">Designed for comfort with multiple size options and fits</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  <h5 className="font-semibold font-Manrope text-Primarycolor mb-2">Great Service</h5>
                  <p className="text-sm font-Jost text-gray-600">Exceptional customer support and fast, reliable delivery</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-6 h-6 text-orange-600" />
                  </div>
                  <h5 className="font-semibold font-Manrope text-Primarycolor mb-2">Proven Quality</h5>
                  <p className="text-sm font-Jost text-gray-600">Thousands of satisfied customers across Nigeria</p>
                </div>
              </div>
            </div>
            {/* Our Story */}
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100">
              <h4 className="text-2xl font-semibold font-Manrope text-Primarycolor mb-6">Our Story</h4>
              <div className="prose prose-gray max-w-none">
                <p className="font-Jost text-gray-600 leading-relaxed mb-6">
                  Tiabrand was born from a simple observation: men deserve better underwear. After experiencing 
                  countless uncomfortable moments with ill-fitting, low-quality underwear, our founders decided to 
                  create a solution that would change the game entirely.
                </p>
                <p className="font-Jost text-gray-600 leading-relaxed mb-6">
                  Starting from a small workshop in Lagos, we began crafting underwear with an obsessive attention 
                  to detail. We tested dozens of fabric combinations, refined our fits through countless iterations, 
                  and worked directly with customers to understand their needs.
                </p>
                <p className="font-Jost text-gray-600 leading-relaxed">
                  Today, Tiabrand has grown into Nigeria's premier underwear brand, trusted by thousands of men 
                  who refuse to compromise on comfort and quality. But our journey is just beginning – we're constantly 
                  innovating and expanding to serve you better.
                </p>
              </div>
            </div>
          </div>
        );
      case 'terms':
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 sm:p-8 rounded-xl border border-gray-100 shadow-lg">
              <h3 className="text-3xl font-bold font-Manrope text-Primarycolor mb-4">Terms of Service</h3>
              <p className="font-Jost text-gray-600 leading-relaxed">
                Please read these terms and conditions carefully before using our service. 
                By accessing our website and making purchases, you agree to these terms.
              </p>
              <p className="text-sm font-Jost text-gray-500 mt-4">Last updated: January 2025</p>
            </div>
            <div className="space-y-6">
              {/* Agreement to Terms */}
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <h4 className="text-xl font-semibold font-Manrope text-Primarycolor mb-4 flex items-center">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                  1. Agreement to Terms
                </h4>
                <p className="font-Jost text-gray-600 leading-relaxed mb-4">
                  By accessing and using Tiabrand's website and services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="font-Jost text-blue-800 text-sm">
                    <strong>Important:</strong> These terms apply to all visitors, users, and customers of our website and services.
                  </p>
                </div>
              </div>
              {/* Use License */}
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <h4 className="text-xl font-semibold font-Manrope text-Primarycolor mb-4 flex items-center">
                  <FileText className="w-6 h-6 text-blue-600 mr-3" />
                  2. Use License
                </h4>
                <p className="font-Jost text-gray-600 leading-relaxed mb-4">
                  Permission is granted to temporarily download one copy of the materials on Tiabrand's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
                </p>
                <div className="bg-red-50 p-4 rounded-lg mb-4">
                  <h5 className="font-semibold font-Manrope text-red-800 mb-2">Under this license you may NOT:</h5>
                  <ul className="list-disc list-inside font-Jost text-red-700 space-y-1 text-sm">
                    <li>Modify or copy the materials</li>
                    <li>Use the materials for commercial purposes or public display</li>
                    <li>Attempt to reverse engineer any software on the website</li>
                    <li>Remove copyright or proprietary notations from materials</li>
                  </ul>
                </div>
                <p className="font-Jost text-gray-600 text-sm">
                  This license shall automatically terminate if you violate any of these restrictions and may be terminated by us at any time.
                </p>
              </div>
              {/* Product Information */}
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <h4 className="text-xl font-semibold font-Manrope text-Primarycolor mb-4 flex items-center">
                  <Package className="w-6 h-6 text-purple-600 mr-3" />
                  3. Product Information & Pricing
                </h4>
                <p className="font-Jost text-gray-600 leading-relaxed mb-4">
                  We strive to provide accurate product descriptions, images, and pricing. However, we do not warrant that product descriptions or other content is accurate, complete, reliable, current, or error-free.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-semibold font-Manrope text-Primarycolor mb-2">Pricing Policy</h5>
                    <ul className="font-Jost text-gray-600 text-sm space-y-1">
                      <li>• All prices are in Nigerian Naira (₦)</li>
                      <li>• Prices are subject to change without notice</li>
                      <li>• We reserve the right to modify or discontinue products</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-semibold font-Manrope text-Primarycolor mb-2">Payment Terms</h5>
                    <ul className="font-Jost text-gray-600 text-sm space-y-1">
                      <li>• Payment must be received prior to shipment</li>
                      <li>• We accept major credit cards and bank transfers</li>
                      <li>• All transactions are processed securely</li>
                    </ul>
                  </div>
                </div>
              </div>
              {/* Shipping & Delivery */}
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <h4 className="text-xl font-semibold font-Manrope text-Primarycolor mb-4 flex items-center">
                  <Package className="w-6 h-6 text-blue-600 mr-3" />
                  4. Shipping & Delivery
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-semibold font-Manrope text-Primarycolor mb-2">Domestic Shipping</h5>
                    <ul className="font-Jost text-gray-600 text-sm space-y-1">
                      <li>• We ship nationwide within Nigeria</li>
                      <li>• Delivery typically takes 2-5 business days</li>
                      <li>• Free shipping on orders over ₦50,000</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-semibold font-Manrope text-Primarycolor mb-2">International Shipping</h5>
                    <ul className="font-Jost text-gray-600 text-sm space-y-1">
                      <li>• We offer international shipping via DHL</li>
                      <li>• Shipping fees calculated at checkout</li>
                      <li>• Delivery times vary by destination</li>
                    </ul>
                  </div>
                </div>
                <p className="font-Jost text-gray-600 text-sm mt-4">
                  Once your order ships, you'll receive a tracking number via email and SMS to monitor your package's progress.
                </p>
              </div>
              {/* Returns & Exchanges */}
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <h4 className="text-xl font-semibold font-Manrope text-Primarycolor mb-4 flex items-center">
                  <RefreshCw className="w-6 h-6 text-green-600 mr-3" />
                  5. Returns & Exchanges
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h5 className="font-semibold font-Manrope text-Primarycolor mb-2">Our Policy</h5>
                  <ul className="font-Jost text-gray-600 text-sm space-y-1">
                    <li>• 3-day return policy for unused items</li>
                    <li>• Free size exchanges within Nigeria</li>
                    <li>• Refunds processed within 5-7 business days</li>
                  </ul>
                </div>
                <p className="font-Jost text-gray-600 text-sm">
                  For international returns, customers are responsible for return shipping costs. Contact our support team to initiate any return or exchange.
                </p>
              </div>
              {/* Limitation of Liability */}
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <h4 className="text-xl font-semibold font-Manrope text-Primarycolor mb-4 flex items-center">
                  <Shield className="w-6 h-6 text-orange-600 mr-3" />
                  6. Limitation of Liability
                </h4>
                <p className="font-Jost text-gray-600 leading-relaxed mb-4">
                  In no event shall Tiabrand or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our website.
                </p>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="font-Jost text-yellow-800 text-sm">
                    <strong>Note:</strong> Some jurisdictions do not allow limitations on implied warranties or the exclusion of certain damages, so these limitations may not apply to you.
                  </p>
                </div>
              </div>
              {/* Governing Law */}
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <h4 className="text-xl font-semibold font-Manrope text-Primarycolor mb-4">7. Governing Law & Contact</h4>
                <p className="font-Jost text-gray-600 leading-relaxed mb-4">
                  These terms and conditions are governed by and construed in accordance with the laws of Nigeria, and you irrevocably submit to the exclusive jurisdiction of the courts in that state or location.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="font-Jost text-blue-800 text-sm">
                    For questions about these Terms of Service, please contact us at: <strong>Thetiabrand1@gmail.com</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'privacy':
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 sm:p-8 rounded-xl border border-gray-100 shadow-lg">
              <h3 className="text-3xl font-bold font-Manrope text-Primarycolor mb-4">Privacy Policy</h3>
              <p className="font-Jost text-gray-600 leading-relaxed">
                Your privacy is important to us. This policy explains how we collect, use, and protect your 
                personal information when you visit our website or make a purchase.
              </p>
              <p className="text-sm font-Jost text-gray-500 mt-4">Last updated: January 2025</p>
            </div>
            <div className="space-y-6">
              {/* Information We Collect */}
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <h4 className="text-xl font-semibold font-Manrope text-Primarycolor mb-6 flex items-center">
                  <Info className="w-6 h-6 text-blue-600 mr-3" />
                  Information We Collect
                </h4>
                
                <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                    <h5 className="font-semibold font-Manrope text-Primarycolor mb-4 flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      Personal Information
                    </h5>
                    <ul className="font-Jost text-gray-600 space-y-2 text-sm">
                      <li>• <strong>Contact Details:</strong> Name, email address, phone number</li>
                      <li>• <strong>Address Information:</strong> Billing and shipping addresses</li>
                      <li>• <strong>Payment Data:</strong> Payment information (processed securely by third parties)</li>
                      <li>• <strong>Account Info:</strong> Username, password, order history</li>
                      <li>• <strong>Preferences:</strong> Size preferences, favorite products</li>
                    </ul>
                  </div>
                  <div className="p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                    <h5 className="font-semibold font-Manrope text-Primarycolor mb-4 flex items-center">
                      <Eye className="w-5 h-5 mr-2" />
                      Usage Information
                    </h5>
                    <ul className="font-Jost text-gray-600 space-y-2 text-sm">
                      <li>• <strong>Website Activity:</strong> Pages visited, time spent, clicks</li>
                      <li>• <strong>Device Data:</strong> Device type, browser, operating system</li>
                      <li>• <strong>Location:</strong> IP address and general location data</li>
                      <li>• <strong>Cookies:</strong> Tracking technologies for better experience</li>
                      <li>• <strong>Communications:</strong> Customer service interactions</li>
                    </ul>
                  </div>
                </div>
              </div>
              {/* How We Use Your Information */}
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <h4 className="text-xl font-semibold font-Manrope text-Primarycolor mb-6 flex items-center">
                  <Zap className="w-6 h-6 text-green-600 mr-3" />
                  How We Use Your Information
                </h4>
                <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
                  <div className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                    <h5 className="font-semibold font-Manrope text-Primarycolor mb-3">Service Delivery</h5>
                    <ul className="font-Jost text-gray-600 space-y-2 text-sm">
                      <li>• Process and fulfill your orders</li>
                      <li>• Provide customer support</li>
                      <li>• Send order confirmations and updates</li>
                      <li>• Handle returns and exchanges</li>
                      <li>• Improve our products and services</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                    <h5 className="font-semibold font-Manrope text-Primarycolor mb-3">Communication</h5>
                    <ul className="font-Jost text-gray-600 space-y-2 text-sm">
                      <li>• Send promotional emails (with consent)</li>
                      <li>• Notify about new products and sales</li>
                      <li>• Gather feedback and reviews</li>
                      <li>• Provide important service updates</li>
                      <li>• Respond to your inquiries</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                    <h5 className="font-semibold font-Manrope text-Primarycolor mb-3">Analytics & Security</h5>
                    <ul className="font-Jost text-gray-600 space-y-2 text-sm">
                      <li>• Analyze website usage patterns</li>
                      <li>• Prevent fraud and security threats</li>
                      <li>• Improve website functionality</li>
                      <li>• Personalize your experience</li>
                      <li>• Comply with legal requirements</li>
                    </ul>
                  </div>
                </div>
              </div>
              {/* Data Protection */}
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <h4 className="text-xl font-semibold font-Manrope text-Primarycolor mb-6 flex items-center">
                  <Shield className="w-6 h-6 text-red-600 mr-3" />
                  Data Protection & Security
                </h4>
                <p className="font-Jost text-gray-600 leading-relaxed mb-6">
                  We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. Your data security is our top priority.
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-6 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                    <Shield className="w-10 h-10 text-green-600 mx-auto mb-3" />
                    <h5 className="font-semibold font-Manrope text-Primarycolor mb-2">SSL Encryption</h5>
                    <p className="text-sm font-Jost text-gray-600">All data transmission is encrypted using industry-standard SSL</p>
                  </div>
                  <div className="text-center p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                    <Shield className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                    <h5 className="font-semibold font-Manrope text-Primarycolor mb-2">Secure Storage</h5>
                    <p className="text-sm font-Jost text-gray-600">Your data is stored in secure, protected databases</p>
                  </div>
                  <div className="text-center p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                    <Shield className="w-10 h-10 text-purple-600 mx-auto mb-3" />
                    <h5 className="font-semibold font-Manrope text-Primarycolor mb-2">Access Control</h5>
                    <p className="text-sm font-Jost text-gray-600">Limited access to your data by authorized personnel only</p>
                  </div>
                </div>
              </div>
              {/* Your Rights */}
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <h4 className="text-xl font-semibold font-Manrope text-Primarycolor mb-6 flex items-center">
                  <CheckCircle className="w-6 h-6 text-orange-600 mr-3" />
                  Your Privacy Rights
                </h4>
                <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <h5 className="font-semibold font-Manrope text-Primarycolor">Access Your Data</h5>
                        <p className="text-sm font-Jost text-gray-600">Request a copy of all personal information we have about you</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h5 className="font-semibold font-Manrope text-Primarycolor">Update Information</h5>
                        <p className="text-sm font-Jost text-gray-600">Correct or update your personal data at any time</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-1">
                        <CheckCircle className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <h5 className="font-semibold font-Manrope text-Primarycolor">Delete Account</h5>
                        <p className="text-sm font-Jost text-gray-600">Request deletion of your personal information</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-1">
                        <CheckCircle className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <h5 className="font-semibold font-Manrope text-Primarycolor">Opt-out</h5>
                        <p className="text-sm font-Jost text-gray-600">Unsubscribe from marketing communications</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="font-Jost text-blue-800 text-sm">
                    <strong>To exercise your rights:</strong> Contact us at Thetiabrand1@gmail.com or call +234 810 411 7122. We'll respond within 30 days.
                  </p>
                </div>
              </div>
              {/* Contact Information */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 sm:p-8 rounded-xl border border-gray-100 shadow-lg">
                <h4 className="text-lg font-semibold font-Manrope text-Primarycolor mb-4">Questions About Privacy?</h4>
                <p className="font-Jost text-gray-600 mb-4">
                  If you have any questions about this Privacy Policy or how we handle your personal information, please don't hesitate to contact us.
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium font-Jost text-gray-600">Thetiabrand1@gmail.com</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium font-Jost text-gray-600">+234 810 411 7122</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'support':
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 sm:p-8 rounded-xl border border-gray-100 shadow-lg">
              <h3 className="text-3xl font-bold font-Manrope text-Primarycolor mb-4">Customer Support</h3>
              <p className="text-lg font-Jost text-gray-600 leading-relaxed">
                Our dedicated support team is here to help you with any questions, concerns, or issues you may have. 
                We're committed to providing exceptional service every step of the way.
              </p>
            </div>
            {/* Contact Methods */}
            <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="font-semibold font-Manrope text-Primarycolor mb-2">Email Support</h4>
                <p className="font-Jost text-gray-600 mb-4 text-sm">Get detailed help via email</p>
                <a 
                  href="mailto:Thetiabrand1@gmail.com"
                  className="text-blue-600 hover:text-blue-800 font-medium font-Jost transition-colors"
                >
                  Thetiabrand1@gmail.com
                </a>
                <p className="text-xs font-Jost text-gray-500 mt-2">Response within 24 hours</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="font-semibold font-Manrope text-Primarycolor mb-2">Phone Support</h4>
                <p className="font-Jost text-gray-600 mb-4 text-sm">Speak directly with our team</p>
                <a 
                  href="tel:+2348104117122"
                  className="text-green-600 hover:text-green-800 font-medium font-Jost transition-colors"
                >
                  +234 810 411 7122
                </a>
                <p className="text-xs font-Jost text-gray-500 mt-2">Immediate assistance</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="font-semibold font-Manrope text-Primarycolor mb-2">Business Hours</h4>
                <p className="font-Jost text-gray-600 mb-4 text-sm">We're available to help</p>
                <p className="text-purple-600 font-medium font-Jost">8:30am - 10:00pm</p>
                <p className="text-xs font-Jost text-gray-500 mt-2">Monday - Sunday</p>
              </div>
            </div>
            {/* Quick Help Topics */}
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100">
                <h4 className="text-xl font-semibold font-Manrope text-Primarycolor mb-6 flex items-center">
                  <HelpCircle className="w-6 h-6 text-blue-600 mr-3" />
                  Quick Help Topics
                </h4>
                <div className="space-y-3">
                  {[
                    { id: 'help-0', topic: 'Order Status & Tracking', desc: 'Check your order progress and delivery status', icon: <Package className="w-5 h-5" /> },
                    { id: 'help-1', topic: 'Size Exchange', desc: 'Request a different size for your purchase', icon: <Shirt className="w-5 h-5" /> },
                    { id: 'help-2', topic: 'Payment Issues', desc: 'Resolve payment and billing problems', icon: <CreditCard className="w-5 h-5" /> },
                    { id: 'help-3', topic: 'Product Care Instructions', desc: 'Learn how to care for your Tia products', icon: <Shirt className="w-5 h-5" /> },
                    { id: 'help-4', topic: 'Wholesale Inquiries', desc: 'Bulk orders and business partnerships', icon: <Building className="w-5 h-5" /> },
                    { id: 'help-5', topic: 'Technical Support', desc: 'Website issues and account problems', icon: <Monitor className="w-5 h-5" /> }
                  ].map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer ${
                        expandedSection === item.id ? 'bg-accent text-black' : 'bg-gray-50 text-gray-700'
                      }`}
                      onClick={() => toggleSection(item.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-gray-500">
                            {item.icon}
                          </div>
                          <div>
                            <h5 className="font-medium font-Manrope text-Primarycolor">{item.topic}</h5>
                            <p className="text-sm font-Jost text-gray-600 mt-1">{item.desc}</p>
                          </div>
                        </div>
                        {expandedSection === item.id ? 
                          <ChevronUp className="w-4 h-4 text-gray-400" /> : 
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        }
                      </div>
                      {expandedSection === item.id && helpTopicsContent[item.id]?.content}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100">
                <h4 className="text-xl font-semibold font-Manrope text-Primarycolor mb-6 flex items-center">
                  <MessageCircle className="w-6 h-6 text-green-600 mr-3" />
                  Support Channels
                </h4>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h5 className="font-semibold font-Manrope text-Primarycolor">Email Support</h5>
                      <p className="text-sm font-Jost text-gray-600 mb-2">Best for detailed questions and documentation</p>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-Jost">24hr response</span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h5 className="font-semibold font-Manrope text-Primarycolor">Phone Support</h5>
                      <p className="text-sm font-Jost text-gray-600 mb-2">For urgent issues and immediate assistance</p>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-Jost">Instant help</span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h5 className="font-semibold font-Manrope text-Primarycolor">Live Chat</h5>
                      <p className="text-sm font-Jost text-gray-600 mb-2">Real-time messaging support</p>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-Jost">Coming soon</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Common Issues Solutions */}
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100">
              <h4 className="text-xl font-semibold font-Manrope text-Primarycolor mb-6 flex items-center">
                <CheckCircle className="w-6 h-6 text-orange-600 mr-3" />
                Common Issues & Quick Solutions
              </h4>
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-4">
                  <div className="p-5 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-red-600 text-sm font-bold">!</span>
                      </div>
                      <div>
                        <h5 className="font-semibold font-Manrope text-Primarycolor mb-2">Order Not Received</h5>
                        <p className="text-sm font-Jost text-gray-600 mb-3">Expected delivery date has passed but package hasn't arrived.</p>
                        <div className="bg-gray-50 p-3 rounded text-xs font-Jost text-gray-600">
                          <strong>Solution:</strong> Check your tracking number first, then contact us immediately for investigation and replacement.
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 text-sm font-bold">?</span>
                      </div>
                      <div>
                        <h5 className="font-semibold font-Manrope text-Primarycolor mb-2">Wrong Size Delivered</h5>
                        <p className="text-sm font-Jost text-gray-600 mb-3">Received a different size than what you ordered.</p>
                        <div className="bg-gray-50 p-3 rounded text-xs font-Jost text-gray-600">
                          <strong>Solution:</strong> We offer free exchanges within 30 days. Contact us to arrange pickup and replacement.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-5 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-yellow-600 text-sm font-bold">⚠</span>
                      </div>
                      <div>
                        <h5 className="font-semibold font-Manrope text-Primarycolor mb-2">Product Defect</h5>
                        <p className="text-sm font-Jost text-gray-600 mb-3">Manufacturing defect or quality issue with your purchase.</p>
                        <div className="bg-gray-50 p-3 rounded text-xs font-Jost text-gray-600">
                          <strong>Solution:</strong> We provide immediate replacement or full refund for any defective items with photo proof.
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-green-600 text-sm font-bold">₦</span>
                      </div>
                      <div>
                        <h5 className="font-semibold font-Manrope text-Primarycolor mb-2">Payment Failed</h5>
                        <p className="text-sm font-Jost text-gray-600 mb-3">Transaction was declined or payment couldn't be processed.</p>
                        <div className="bg-gray-50 p-3 rounded text-xs font-Jost text-gray-600">
                          <strong>Solution:</strong> Try a different payment method, check your card details, or contact your bank for assistance.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Support Guarantee */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 sm:p-8 rounded-xl border border-gray-100 shadow-lg">
              <h4 className="text-xl font-semibold font-Manrope text-Primarycolor mb-4 text-center">Our Support Promise</h4>
              <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-blue-600" />
                  </div>
                  <h5 className="font-semibold font-Manrope text-Primarycolor mb-2">Quick Response</h5>
                  <p className="text-sm font-Jost text-gray-600">We respond to all inquiries within 24 hours, usually much faster</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-green-600" />
                  </div>
                  <h5 className="font-semibold font-Manrope text-Primarycolor mb-2">Expert Help</h5>
                  <p className="text-sm font-Jost text-gray-600">Our team knows our products inside and out to give you the best advice</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <HeartHandshake className="w-8 h-8 text-purple-600" />
                  </div>
                  <h5 className="font-semibold font-Manrope text-Primarycolor mb-2">Personal Care</h5>
                  <p className="text-sm font-Jost text-gray-600">Every customer matters to us - we treat you like family</p>
                </div>
              </div>
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
                to="/"
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
                More
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
              <h2 className="text-lg font-semibold font-Manrope text-Primarycolor mb-6">More Information</h2>
              <nav className="space-y-2">
                {moreItems.map((item) => {
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
            {/* Fixed: Changed min-h-[600px] to min-h-0 md:min-h-[600px] */}
            <div className="min-h-0 md:min-h-[600px]">
              {renderContent()}
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

export default MorePage;