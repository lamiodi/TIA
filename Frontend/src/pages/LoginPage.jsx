import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle, Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Pic1 from '../assets/images/Loginpic1.JPG';
import Pic2 from '../assets/images/Loginpic2.JPG';
import Pic3 from '../assets/images/Loginpic3.JPG';
import axios from 'axios';

// Create API instance with environment variable support
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 6;

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  // Image carousel data
  const carouselImages = [
    {
      src: Pic1,
      title: 'Unleash Your Potential',
      description:
        'Step into performance-ready gymwear and briefs crafted for movement, comfort, and confidence.',
      placeholder: { bg: '#1E1E1E', pattern: 'circles' },
    },
    {
      src: Pic2,
      title: 'Built for Every Body',
      description:
        'From intense workouts to everyday comfort — our pieces are designed to move with you.',
      placeholder: { bg: '#6E6E6E', pattern: 'squares' },
    },
    {
      src: Pic3,
      title: 'Style Meets Strength',
      description:
        'Elevate your activewear with bold designs and breathable fabrics made to perform.',
      placeholder: { bg: '#1E1E1E', pattern: 'triangles' },
    },
  ];
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const from = location.state?.from?.pathname || '/home';
  
  // Helper function to decode JWT token
  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (err) {
      console.error('LoginPage: Error decoding token:', err);
      return null;
    }
  };
  
  useEffect(() => {
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) {
      setFormData((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
    if (location.state?.message) {
      setSuccessMsg(location.state.message);
    }
    // Auto-rotate carousel images
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselImages.length, location.state]);
  
  const validateField = useCallback((name, value) => {
    const errors = {};
    if (name === 'email') {
      if (!value.trim()) errors.email = 'Email is required';
      else if (!EMAIL_PATTERN.test(value)) errors.email = 'Enter a valid email address';
    }
    if (name === 'password') {
      if (!value) errors.password = 'Password is required';
      else if (value.length < PASSWORD_MIN_LENGTH)
        errors.password = `Min ${PASSWORD_MIN_LENGTH} characters`;
    }
    return errors;
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    const fieldErrors = validateField(name, value);
    if (Object.keys(fieldErrors).length > 0) {
      setTimeout(() => {
        setFormErrors((prev) => ({ ...prev, ...fieldErrors }));
      }, 300);
    }
    if (errorMsg) setErrorMsg('');
    if (successMsg) setSuccessMsg('');
  };
  
  const validateForm = () => {
    const allErrors = {
      ...validateField('email', formData.email),
      ...validateField('password', formData.password),
    };
    setFormErrors(allErrors);
    return Object.keys(allErrors).length === 0;
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      // Step 1: Actual API call using the configured API instance
      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password,
      });
      
      const data = response.data;
      const { token, user } = data;
      
      // Step 2: Block admin users (optional rule)
      if (user?.isAdmin) {
        setErrorMsg('Admins are not allowed to log in from the user portal.');
        setLoading(false);
        return;
      }
      
      // Step 3: Decode token to extract id
      const tokenData = decodeToken(token);
      const userWithId = {
        ...user,
        id: tokenData?.id || user.id || user.userId,
      };
      if (!userWithId.id) {
        throw new Error('No valid user ID found in user data or token');
      }
      
      // Step 4: Persist user in context
      console.log('LoginPage: Login response data:', data);
      console.log('LoginPage: Calling login with:', { user: userWithId, token });
      await login(userWithId, token);
      
      // Step 5: Remember email if user checked the box
      if (rememberMe) {
        localStorage.setItem('userEmail', formData.email);
      } else {
        localStorage.removeItem('userEmail');
      }
      
      // Step 6: Log localStorage for debugging
      console.log('LoginPage: Login completed, checking localStorage:', {
        token: localStorage.getItem('token'),
        user: localStorage.getItem('user'),
      });
      
      // Step 7: Redirect to intended page
      setSuccessMsg('Login successful! Redirecting...');
      setTimeout(() => navigate(from, { replace: true }), 1000);
    } catch (err) {
      console.error('LoginPage: Login error:', err?.response?.data || err.message);
      if (err.code === 'ECONNABORTED') {
        setErrorMsg('Request timed out. Please try again.');
      } else if (err.response?.status === 401) {
        setErrorMsg('Invalid email or password.');
      } else if (err.response?.status === 429) {
        setErrorMsg('Too many attempts. Please try again later.');
      } else {
        setErrorMsg(
          err.response?.data?.error ||
            err.response?.data?.message ||
            err.message ||
            'Login failed. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex bg-white font-Jost">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 lg:px-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 font-Manrope" style={{ color: '#1E1E1E' }}>
              Welcome Back
            </h1>
            <p className="text-base font-Jost" style={{ color: '#6E6E6E' }}>
              Sign in to your account to continue
            </p>
          </div>
          {/* Messages */}
          {successMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl mb-6 flex items-center gap-3 font-Jost">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-center gap-3 font-Jost">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{errorMsg}</span>
            </div>
          )}
          {/* Login Form */}
          <div className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold mb-2 font-Jost"
                style={{ color: '#1E1E1E' }}
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                  style={{ color: '#6E6E6E' }}
                />
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
                    ...(formErrors.email ? {} : { '--tw-ring-color': '#1E1E1E' }),
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
            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold mb-2 font-Jost"
                style={{ color: '#1E1E1E' }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                  style={{ color: '#6E6E6E' }}
                />
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
                    ...(formErrors.password
                      ? {}
                      : { '--tw-ring-color': '#1E1E1E' }),
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
                  style={{ color: '#6E6E6E' }}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {formErrors.password && (
                <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-Jost">
                  <AlertCircle className="w-4 h-4" />
                  {formErrors.password}
                </p>
              )}
            </div>
            {/* Remember Me & Forgot Password */}
            <div className="flex justify-between items-center text-sm font-Jost">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 focus:ring-2"
                  style={{ accentColor: '#1E1E1E' }}
                />
                <span style={{ color: '#1E1E1E' }}>Remember me</span>
              </label>
              <button
                type="button"
                onClick={() =>
                  navigate('/forgot-password', { state: { email: formData.email } })
                }
                className="font-medium hover:underline transition-all font-Manrope"
                style={{ color: '#1E1E1E' }}
              >
                Forgot password?
              </button>
            </div>
            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              onClick={handleLogin}
              className="w-full font-semibold py-3 rounded-xl focus:outline-none focus:ring-2 transition-all flex justify-center items-center gap-2 hover:opacity-90 font-Manrope"
              style={{
                backgroundColor: '#1E1E1E',
                color: '#ffffff',
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
          {/* Sign Up Link */}
          <div className="mt-8 text-center text-sm font-Jost">
            <span style={{ color: '#6E6E6E' }}>Don't have an account? </span>
            <Link
              to="/signup"
              className="font-semibold hover:underline transition-all font-Manrope"
              style={{ color: '#1E1E1E' }}
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
      {/* Right Side - Image Carousel */}
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
              <img src={image.src} alt={image.title} className="w-full h-full object-cover" />
              {/* Content overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 z-0">
                <div className="max-w-md">
                  <h2
                    className="text-3xl font-bold mb-4 transition-all duration-500 font-Manrope"
                    style={{ color: '#ffffff' }}
                  >
                    {image.title}
                  </h2>
                  <p
                    className="text-lg leading-relaxed mb-8 transition-all duration-500 delay-100 font-Jost"
                    style={{ color: '#F5F5DC' }}
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
                backgroundColor: index === currentImageIndex ? '#1E1E1E' : '#ffffff',
                opacity: index === currentImageIndex ? 1 : 0.6,
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 bg-opacity-30">
          <div
            className="h-full transition-all duration-5000 ease-linear"
            style={{
              backgroundColor: '#1E1E1E',
              width: `${((currentImageIndex + 1) / carouselImages.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;