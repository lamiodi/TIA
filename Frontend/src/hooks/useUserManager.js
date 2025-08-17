import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tia-backend-r331.onrender.com';

export const useUserManager = () => {
  const [user, setUser] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);
  
  // Get user from localStorage on initial render
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== 'undefined') {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Error parsing user from localStorage:', err);
        localStorage.removeItem('user');
      }
    }
  }, []);
  
  // Function to refresh user data
  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found for refreshing user data');
        return null;
      }
      
      const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      let userData = response.data;
      if (response.data && response.data.user) {
        userData = response.data.user;
      }
      
      if (userData) {
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Update local state
        setUser(userData);
        
        // Increment refresh count to trigger re-renders in components
        setRefreshCount(prev => prev + 1);
        
        console.log('User data refreshed successfully');
        return userData;
      } else {
        console.warn('No user data in response');
        return null;
      }
    } catch (err) {
      console.error('Failed to refresh user data:', err);
      return null;
    }
  };
  
  return { user, refreshUser, refreshCount };
};