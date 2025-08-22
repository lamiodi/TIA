import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Directly use the backup server URL
const API_BASE_URL = 'https://tia-backend-r331.onrender.com';
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
});

export const AdminAuthContext = createContext();
export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [adminLoading, setAdminLoading] = useState(true);
  
  useEffect(() => {
    const verifyAdminToken = async () => {
      const token = localStorage.getItem('adminToken');
      const storedAdmin = localStorage.getItem('admin');
      
      if (token && storedAdmin) {
        try {
          const parsedAdmin = JSON.parse(storedAdmin);
          console.log('AdminAuthProvider: Parsed admin', parsedAdmin);
          
          // Check if the admin object has the required fields
          if (parsedAdmin && (parsedAdmin.id || parsedAdmin.userId)) {
            // Standardize the admin object - ensure it has an 'id' field
            const adminWithId = { 
              ...parsedAdmin, 
              id: parsedAdmin.id || parsedAdmin.userId,
              isAdmin: parsedAdmin.isAdmin !== false // Ensure isAdmin is defined
            };
            console.log('AdminAuthProvider: Setting admin with standardized id', adminWithId);
            setAdmin(adminWithId);
          } else {
            throw new Error('Invalid admin object: missing required id field');
          }
        } catch (err) {
          console.error('AdminAuthProvider: Error parsing admin data:', err);
          localStorage.removeItem('admin');
          localStorage.removeItem('adminToken');
          setAdmin(null);
        }
      }
      
      setAdminLoading(false);
    };
    
    verifyAdminToken();
  }, []);
  
  const adminLogin = async (user, token) => {
    // Standardize the user object before storing
    const standardizedUser = {
      ...user,
      id: user.id || user.userId, // Ensure we have an id field
      isAdmin: user.isAdmin !== false // Ensure isAdmin is defined
    };
    
    // Store the admin data and token
    localStorage.setItem('adminToken', token);
    localStorage.setItem('admin', JSON.stringify(standardizedUser));
    setAdmin(standardizedUser);
    
    return { admin: standardizedUser, token };
  };
  
  const adminLogout = () => {
    console.log('AdminAuthProvider: Admin logging out');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    setAdmin(null);
  };
  
  return (
    <AdminAuthContext.Provider value={{ admin, adminLoading, adminLogin, adminLogout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
export const useAdminAuth = () => useContext(AdminAuthContext);