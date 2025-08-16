// components/ProtectedRoute.jsx
import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    // Add a small delay to ensure AuthContext has finished initializing
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  console.log('ProtectedRoute: State:', { 
    user: user ? JSON.stringify(user) : null, 
    loading, 
    isChecking 
  });
  
  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center text-gray-600">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-sm">Loading authentication...</p>
        </div>
      </div>
    );
  }
  
  // Double-check localStorage directly as a fallback
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  
  console.log('ProtectedRoute: Fallback check:', { 
    token: token ? 'exists' : 'none',
    storedUser: storedUser ? 'exists' : 'none'
  });
  
  if (!user && (!token || !storedUser)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If we have user in context, use it
  if (user) {
    return children;
  }
  
  // If we don't have user in context but have it in localStorage, try to parse it
  if (token && storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser);
      return children;
    } catch (err) {
      console.error('ProtectedRoute: Error parsing user from localStorage:', err);
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  }
  
  console.log('ProtectedRoute: Fallback - redirecting to login');
  return <Navigate to="/login" state={{ from: location }} replace />;
};

export default ProtectedRoute;