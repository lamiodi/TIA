import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Lock, Phone, User, ArrowRight, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Pic1 from '../assets/images/Signuppic1.JPG';
import Pic2 from '../assets/images/Signuppic2.JPG';
import Pic3 from '../assets/images/Signuppic3.JPG';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com';

const SignupPage = () => {
  const navigate = useNavigate();
  // Image carousel data
  const carouselImages = [
    {
      src: Pic1,
      title: 'Step Into Your Power',
      description: 'Create your account and join a growing tribe of bold individuals redefining comfort and performance.',
      placeholder: { bg: '#1E1E1E', pattern: 'waves' }
    },
    {
      src: Pic2,
      title: 'Perks Just for You',
      description: 'Get early access to drops, member-only discounts, and gear that fits your lifestyle.',
      placeholder: { bg: '#6E6E6E', pattern: 'dots' }
    },
    {
      src: Pic3,
      title: 'Shop with Confidence',
      description: 'Your privacy matters. Enjoy a seamless, secure experience every time you suit up.',
      placeholder: { bg: '#1E1E1E', pattern: 'grid' }
    },
  ];
  
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', username: '',
    email: '', password: '', phone_number: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Auto-rotate carousel images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [carouselImages.length]);
  
  const validateField = useCallback((name, value) => {
    const errors = {};
    if (name === 'first_name' && !value.trim()) errors.first_name = 'First name is required';
    if (name === 'last_name' && !value.trim()) errors.last_name = 'Last name is required';
    if (name === 'username' && !value.trim()) errors.username = 'Username is required';
    if (name === 'email') {
      if (!value.trim()) errors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.email = 'Enter a valid email address';
    }
    if (name === 'password') {
      if (!value) errors.password = 'Password is required';
      else if (value.length < 8) errors.password = 'Min 8 characters';
      else if (!/[A-Z]/.test(value)) errors.password = 'Must include at least one uppercase letter';
      else if (!/[a-z]/.test(value)) errors.password = 'Must include at least one lowercase letter';
      else if (!/[0-9]/.test(value)) errors.password = 'Must include at least one number';
      else if (!/[^A-Za-z0-9]/.test(value)) errors.password = 'Must include at least one special character';
    }
    return errors;
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: undefined }));
    const fieldErrors = validateField(name, value);
    if (Object.keys(fieldErrors).length > 0) {
      setTimeout(() => {
        setFormErrors(prev => ({ ...prev, ...fieldErrors }));
      }, 300);
    }
    if (error) setError('');
    if (successMsg) setSuccessMsg('');
  };
  
  const validateForm = () => {
    const allErrors = {
      ...validateField('first_name', formData.first_name),
      ...validateField('last_name', formData.last_name),
      ...validateField('username', formData.username),
      ...validateField('email', formData.email),
      ...validateField('password', formData.password),
    };
    setFormErrors(allErrors);
    return Object.keys(allErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true); setError(''); setSuccessMsg('');
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/signup`, formData);
      setSuccessMsg(res.data.message);
      setFormData({
        first_name: '', last_name: '', username: '',
        email: '', password: '', phone_number: ''
      });
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50 relative overflow-hidden font-Jost">
      {/* Subtle background patterns */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-black/5 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-gray-500/5 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-slate-500/5 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>
      <Navbar />
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] relative z-10">
        {/* Left Side - Image Carousel */}
        <div className="hidden lg:flex flex-1 relative overflow-hidden">
          {/* Background overlay */}
          <div 
            className="absolute inset-0 opacity-10 transition-all duration-1000"
            style={{ backgroundColor: carouselImages[currentImageIndex].placeholder.bg }}
          />
          {/* Image carousel container */}
          <div className="relative w-full h-full">
            {carouselImages.map((image, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                  index === currentImageIndex 
                    ? 'opacity-100 transform translate-x-0' 
                    : index < currentImageIndex 
                      ? 'opacity-0 transform -translate-x-full'
                      : 'opacity-0 transform translate-x-full'
                }`}
              >
                <img 
                  src={image.src}
                  alt={image.title}
                  className="w-full h-full object-cover"
                />
                {/* Content overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 bg-opacity-10">
                  <div className="max-w-md">
                    <h2 
                      className="text-3xl font-bold mb-4 transition-all duration-500 font-Manrope"
                      style={{ color: '#ffffff' }}
                    >
                      {image.title}
                    </h2>
                    <p 
                      className="text-lg leading-relaxed mb-8 transition-all duration-500 delay-100 font-Jost"
                      style={{ color: '#6E6E6E' }}
                    >
                      {image.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Navigation dots */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
            {carouselImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 hover:scale-110 ${
                  index === currentImageIndex ? 'scale-125' : ''
                }`}
                style={{ 
                  backgroundColor: index === currentImageIndex ? '#1E1E1E' : '#6E6E6E',
                  opacity: index === currentImageIndex ? 1 : 0.6
                }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 bg-opacity-30">
            <div 
              className="h-full transition-all duration-4500 ease-linear"
              style={{ 
                backgroundColor: '#1E1E1E',
                width: `${((currentImageIndex + 1) / carouselImages.length) * 100}%`
              }}
            />
          </div>
        </div>
        {/* Right Side - Signup Form */}
        <div className="flex-1 flex items-center justify-center px-4 py-8 lg:px-8">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2 font-Manrope" style={{ color: '#1E1E1E' }}>
                Create Your Account
              </h1>
              <p className="text-base font-Jost" style={{ color: '#6E6E6E' }}>
                Sign up to unlock exclusive access
              </p>
            </div>
            {/* Messages */}
            {successMsg && (
              <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl mb-6 flex items-center gap-3 font-Jost">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{successMsg}</span>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-center gap-3 font-Jost">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* First Name */}
              <div>
                <label htmlFor="first_name" className="block text-sm font-semibold mb-2 font-Jost" style={{ color: '#1E1E1E' }}>
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#6E6E6E' }} />
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    value={formData.first_name}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 font-Jost ${
                      formErrors.first_name 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300'
                    }`}
                    style={{ 
                      color: '#1E1E1E',
                      ...(formErrors.first_name ? {} : { '--tw-ring-color': '#1E1E1E' })
                    }}
                    placeholder="First Name"
                    autoComplete="given-name"
                  />
                </div>
                {formErrors.first_name && (
                  <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-Jost">
                    <AlertCircle className="w-4 h-4" />
                    {formErrors.first_name}
                  </p>
                )}
              </div>
              {/* Last Name */}
              <div>
                <label htmlFor="last_name" className="block text-sm font-semibold mb-2 font-Jost" style={{ color: '#1E1E1E' }}>
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#6E6E6E' }} />
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    value={formData.last_name}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 font-Jost ${
                      formErrors.last_name 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300'
                    }`}
                    style={{ 
                      color: '#1E1E1E',
                      ...(formErrors.last_name ? {} : { '--tw-ring-color': '#1E1E1E' })
                    }}
                    placeholder="Last Name"
                    autoComplete="family-name"
                  />
                </div>
                {formErrors.last_name && (
                  <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-Jost">
                    <AlertCircle className="w-4 h-4" />
                    {formErrors.last_name}
                  </p>
                )}
              </div>
              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-semibold mb-2 font-Jost" style={{ color: '#1E1E1E' }}>
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#6E6E6E' }} />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 font-Jost ${
                      formErrors.username 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300'
                    }`}
                    style={{ 
                      color: '#1E1E1E',
                      ...(formErrors.username ? {} : { '--tw-ring-color': '#1E1E1E' })
                    }}
                    placeholder="Username"
                    autoComplete="username"
                  />
                </div>
                {formErrors.username && (
                  <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-Jost">
                    <AlertCircle className="w-4 h-4" />
                    {formErrors.username}
                  </p>
                )}
              </div>
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-2 font-Jost" style={{ color: '#1E1E1E' }}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#6E6E6E' }} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 font-Jost ${
                      formErrors.email 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300'
                    }`}
                    style={{ 
                      color: '#1E1E1E',
                      ...(formErrors.email ? {} : { '--tw-ring-color': '#1E1E1E' })
                    }}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
                {formErrors.email && (
                  <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-Jost">
                    <AlertCircle className="w-4 h-4" />
                    {formErrors.email}
                  </p>
                )}
              </div>
              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold mb-2 font-Jost" style={{ color: '#1E1E1E' }}>
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#6E6E6E' }} />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-10 py-3 text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 font-Jost ${
                      formErrors.password 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300'
                    }`}
                    style={{ 
                      color: '#1E1E1E',
                      ...(formErrors.password ? {} : { '--tw-ring-color': '#1E1E1E' })
                    }}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
                    style={{ color: '#6E6E6E' }}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-Jost">
                    <AlertCircle className="w-4 h-4" />
                    {formErrors.password}
                  </p>
                )}
              </div>
              {/* Phone */}
              <div>
                <label htmlFor="phone_number" className="block text-sm font-semibold mb-2 font-Jost" style={{ color: '#1E1E1E' }}>
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#6E6E6E' }} />
                  <input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-300 transition-all focus:outline-none focus:ring-2 font-Jost"
                    style={{ 
                      color: '#1E1E1E',
                      '--tw-ring-color': '#1E1E1E'
                    }}
                    placeholder="Phone Number"
                    autoComplete="tel"
                  />
                </div>
              </div>
              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full font-semibold py-3 rounded-xl focus:outline-none focus:ring-2 transition-all flex justify-center items-center gap-2 hover:opacity-90 font-Manrope"
                style={{ 
                  backgroundColor: '#1E1E1E', 
                  color: '#ffffff'
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
              {/* Login Link */}
              <div className="mt-8 text-center text-sm font-Jost">
                <span style={{ color: '#6E6E6E' }}>Already have an account? </span>
                <Link 
                  to="/login"
                  className="font-semibold hover:underline transition-all font-Manrope"
                  style={{ color: '#1E1E1E' }}
                >
                  Log in here
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SignupPage;

