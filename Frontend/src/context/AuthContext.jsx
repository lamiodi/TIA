import React, { createContext, useContext, useState, useEffect } from 'react';

export const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper function to decode JWT token
  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (err) {
      // Silent error handling
      return null;
    }
  };

  // Check if token is expired
  const isTokenExpired = (token) => {
    try {
      const decoded = decodeToken(token);
      if (!decoded || !decoded.exp) return true;
      
      // Check if expiration time is past current time (with 5-minute buffer)
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime - 300; // 300 seconds = 5 minutes buffer
    } catch (err) {
      // Silent error handling
      return true;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    const checkAuth = async () => {
      if (token && storedUser) {
        try {
          // Check if token is expired
          if (isTokenExpired(token)) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            setLoading(false);
            return;
          }
          
          let parsedUser;
          try {
            parsedUser = JSON.parse(storedUser);
          } catch (parseError) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setUser(null);
            setLoading(false);
            return;
          }
          
          // FIXED: Check for both 'id' and 'userId' properties
          if (parsedUser) {
            // If the user has an 'id' property but no 'userId', use the 'id'
            if (parsedUser.id && !parsedUser.userId) {
              const userWithUserId = { ...parsedUser, userId: parsedUser.id };
              setUser(userWithUserId);
            } 
            // If the user has a 'userId' property but no 'id', use the 'userId'
            else if (parsedUser.userId && !parsedUser.id) {
              const userWithId = { ...parsedUser, id: parsedUser.userId };
              setUser(userWithId);
            }
            // If the user has both properties, use both
            else if (parsedUser.id && parsedUser.userId) {
              setUser(parsedUser);
            }
            // If the user has neither, throw an error
            else {
              throw new Error('Invalid user object: missing both id and userId');
            }
          } else {
            throw new Error('Invalid user object: missing user data');
          }
        } catch (err) {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = async (userData, tokenData) => {
    try {
      // FIXED: Ensure the user object has both 'id' and 'userId' properties
      let userToSave;
      if (userData.id && !userData.userId) {
        userToSave = { ...userData, userId: userData.id };
      } else if (userData.userId && !userData.id) {
        userToSave = { ...userData, id: userData.userId };
      } else {
        userToSave = userData;
      }
      
      localStorage.setItem('token', tokenData);
      localStorage.setItem('user', JSON.stringify(userToSave));
      setUser(userToSave);
      return { user: userToSave, token: tokenData };
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);