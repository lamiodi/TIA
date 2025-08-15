import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

const AdminRoute = ({ children }) => {
  const { admin, adminLoading } = useAdminAuth();
  const location = useLocation();
  
  // Show loading spinner while authenticating
  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-gray-600">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-sm">Loading...</p>
        </div>
      </div>
    );
  }
  
  // If not authenticated as admin, redirect to admin login
  if (!admin || admin.isAdmin !== true) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  
  // If authenticated and is an admin, render the protected content
  return children;
};

export default AdminRoute;