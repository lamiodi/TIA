// src/pages/ForgotPassword.jsx
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, UserPlus } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTemporaryAccount, setIsTemporaryAccount] = useState(false);
  
  const location = useLocation();
  
  // Check if we have state from navigation (coming from ThankYou page)
  useState(() => {
    if (location.state && location.state.isTemporary) {
      setIsTemporaryAccount(true);
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase();
    
    if (!normalizedEmail) {
      setError('Please enter your email.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Enter a valid email address');
      return;
    }
    
    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email: normalizedEmail });
      setSuccess('Password reset link sent to your email.');
      toast.success('Reset link sent!');
      setEmail('');
    } catch (err) {
      // Replace optional chaining with traditional checks
      const errorMessage = err.response && err.response.data && err.response.data.error 
        ? err.response.data.error 
        : 'Failed to send reset link';
      setError(errorMessage);
      toast.error('Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold font-Manrope">
              {isTemporaryAccount ? 'Create Password for Your Account' : 'Forgot Password'}
            </h2>
            
            {isTemporaryAccount && (
              <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <UserPlus className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700 font-Jost">
                      You're using a temporary account. Enter your email and we'll send you a link to set up a password and convert your account to a permanent one.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg text-sm font-Jost">{error}</div>}
          {success && (
            <div className="bg-green-100 text-green-600 p-3 rounded-lg text-sm font-Jost flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block font-Jost">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full border px-4 py-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black font-Jost"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition font-Manrope disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Sending...' : (isTemporaryAccount ? 'Create Password' : 'Send Reset Link')}
            </button>
          </form>
          
          <div className="text-center mt-4">
            <button
              onClick={() => navigate('/login')}
              className="text-Accent hover:text-Primarycolor font-Jost flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Login
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default ForgotPassword;