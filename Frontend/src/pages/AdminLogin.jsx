import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { toast } from 'react-toastify';
import { Mail, Lock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

// Create API instance with environment variable support
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com').replace(/\/$/, '');
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com').replace(/\/$/, '');
console.log('API_BASE_URL:', API_BASE_URL);
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 7;

const AdminLogin = () => {
  const { admin, adminLoading, adminLogin } = useAdminAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [formErrors, setFormErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Redirect if already authenticated as admin
  React.useEffect(() => {
    if (admin && admin.isAdmin === true) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [admin, navigate]);
  
  const validateField = (name, value) => {
    const errors = {};
    if (name === 'email') {
      if (!value.trim()) errors.email = 'Email is required';
      else if (!EMAIL_PATTERN.test(value)) errors.email = 'Enter a valid email address';
    }
    if (name === 'password') {
      if (!value) errors.password = 'Password is required';
      else if (value.length < PASSWORD_MIN_LENGTH) errors.password = `Min ${PASSWORD_MIN_LENGTH} characters`;
    }
    return errors;
  };
  
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
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setErrorMsg('');
    setLoading(true);
    
    try {
      // Use the configured API instance instead of the context method
      const response = await api.post('/auth/admin-login', {
        email: formData.email,
        password: formData.password,
      });
      
      const { token, admin } = response.data;
      
      // Use the adminLogin method from context to update state
      await adminLogin(admin, token);
      
      setSuccessMsg('Admin login successful! Redirecting...');
      toast.success('Admin login successful!');
      setTimeout(() => navigate('/admin/dashboard', { replace: true }), 1000);
    } catch (err) {
      console.error('AdminLogin: Login error:', err?.response?.data || err.message);
      
      if (err.response?.status === 401) {
        setErrorMsg('Invalid admin credentials. Please check your email or password.');
        toast.error('Invalid admin credentials.');
      } else if (err.response?.status === 403) {
        setErrorMsg('Access denied. Admin privileges required.');
        toast.error('Access denied. Admin privileges required.');
      } else {
        const errorMessage = err.response?.data?.error || 
                            err.response?.data?.message || 
                            err.message || 
                            'Login failed. Please try again.';
        setErrorMsg(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };
  
  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-gray-600">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="mt-2 text-sm font-Jost">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="min-h-screen flex bg-white"
      style={{
        '--color-Primarycolor': '#1E1E1E',
        '--color-Secondarycolor': '#ffffff',
        '--color-Accent': '#6E6E6E',
        '--font-Manrope': '"Manrope", "sans-serif"',
        '--font-Jost': '"Jost", "sans-serif"'
      }}
    >
      <div className="flex-1 flex items-center justify-center px-4 py-8 lg:px-8">
        <div className="w-full max-w-md">
          <h1 className="text-4xl font-bold mb-1 text-center font-Manrope" style={{ color: '#1E1E1E' }}>
            Admin Login
          </h1>
          <p className="text-base text-center font-Jost mb-4" style={{ color: '#6E6E6E' }}>
            Sign in to access the admin dashboard
          </p>
          
          {successMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl mt-6 mb-6 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-Jost">{successMsg}</span>
            </div>
          )}
          
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mt-6 mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-Jost">{errorMsg}</span>
            </div>
          )}
          
          <div className="space-y-6">
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
                    formErrors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  style={{ 
                    color: '#1E1E1E',
                    ...(formErrors.email ? {} : { '--tw-ring-color': '#1E1E1E' })
                  }}
                  placeholder="admin@example.com"
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
            
            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-2 font-Jost" style={{ color: '#1E1E1E' }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#6E6E6E' }} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-10 py-3 text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 font-Jost ${
                    formErrors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  style={{ 
                    color: '#1E1E1E',
                    ...(formErrors.password ? {} : { '--tw-ring-color': '#1E1E1E' })
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
              {formErrors.password && (
                <p className="mt-2 text-xs text-red-600 flex items-center gap-1 font-Jost">
                  <AlertCircle className="w-4 h-4" />
                  {formErrors.password}
                </p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={loading}
              onClick={handleSubmit}
              className="w-full font-semibold py-3 rounded-xl focus:outline-none focus:ring-2 transition-all flex justify-center items-center gap-2 hover:opacity-90 font-Manrope"
              style={{ backgroundColor: '#1E1E1E', color: '#ffffff' }}
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
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;