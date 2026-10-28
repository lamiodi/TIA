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
  
 
  
  if (loading || isChecking) {
    return (
      <div className="min-h-screen bg-gray-50/50 font-Jost animate-pulse">
        <div className="h-20 border-b border-gray-100 bg-white px-6 sm:px-12 flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-28" />
          <div className="w-8 h-8 rounded-full bg-gray-100" />
        </div>
        <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
          <div className="h-8 bg-gray-200 rounded-lg w-52" />
          <div className="h-4 bg-gray-100 rounded w-72" />
          <div className="h-64 bg-white rounded-2xl border border-gray-200/70 p-6 space-y-4">
            <div className="h-5 bg-gray-200 rounded w-1/3" />
            <div className="space-y-3 pt-2">
              <div className="h-11 bg-gray-50 rounded-xl border border-gray-100" />
              <div className="h-11 bg-gray-50 rounded-xl border border-gray-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Double-check localStorage directly as a fallback
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  
  
  
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
