import React, { createContext, useContext, useState, useEffect } from 'react';

export const AdminAuthContext = createContext();
export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    
    const token = localStorage.getItem('adminToken');
    const storedAdmin = localStorage.getItem('admin');
    
    if (token && storedAdmin) {
      try {
        const parsedAdmin = JSON.parse(storedAdmin);
        console.log('AdminAuthProvider: Parsed admin', parsedAdmin);
        // Standardize the admin object by mapping 'userId' to 'id'
        if (parsedAdmin && parsedAdmin.userId) {
          const adminWithId = { ...parsedAdmin, id: parsedAdmin.userId };
          console.log('AdminAuthProvider: Setting admin with standardized id', adminWithId);
          setAdmin(adminWithId);
        } else {
          throw new Error('Invalid admin object: missing userId');
        }
      } catch (err) {
        console.error('AdminAuthProvider: Error parsing admin data:', err);
        localStorage.removeItem('admin');
        localStorage.removeItem('adminToken');
        setAdmin(null);
      }
    }
    
    setAdminLoading(false);
  }, []);

  const adminLogin = async (email, password) => {
    
    
    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw { response: { status: response.status, data: errorData } };
      }

      const data = await response.json();
      const { user, token } = data;
      
      // Standardize the admin object by mapping 'userId' to 'id'
      const adminToSave = { ...user, id: user.userId };
      
      localStorage.setItem('adminToken', token);
      localStorage.setItem('admin', JSON.stringify(adminToSave));
      setAdmin(adminToSave);
      
      
      return { admin: adminToSave, token };
    } catch (error) {
      console.error('AdminAuthProvider: Admin login error:', error);
      throw error;
    }
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