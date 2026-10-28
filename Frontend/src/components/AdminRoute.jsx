import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

const AdminRoute = ({ children }) => {
  const { admin, adminLoading } = useAdminAuth();
  const location = useLocation();
  
  // Show loading spinner while authenticating
  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gray-50 font-Jost animate-pulse p-6">
        <div className="h-16 bg-white rounded-xl border border-gray-200 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-gray-200" />
          ))}
        </div>
        <div className="h-96 bg-white rounded-xl border border-gray-200" />
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
