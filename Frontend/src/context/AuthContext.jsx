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
      console.error('Error decoding token:', err);
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
      console.error('Error checking token expiration:', err);
      return true;
    }
  };

  useEffect(() => {
    console.log('AuthProvider: Checking for existing auth');
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    console.log('AuthProvider: Found token and user', {
      token: token ? token.substring(0, 10) + '...' : 'none',
      storedUser: storedUser ? 'exists' : 'none',
    });

    const checkAuth = async () => {
      if (token && storedUser) {
        try {
          // Check if token is expired
          if (isTokenExpired(token)) {
            console.log('AuthProvider: Token expired, logging out');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            setLoading(false);
            return;
          }

          let parsedUser;
          try {
            parsedUser = JSON.parse(storedUser);
            console.log('AuthProvider: Parsed user', parsedUser);
          } catch (parseError) {
            console.error('AuthProvider: Error parsing user data:', parseError);
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
              console.log('AuthProvider: Setting user with userId from id', userWithUserId);
              setUser(userWithUserId);
            } 
            // If the user has a 'userId' property but no 'id', use the 'userId'
            else if (parsedUser.userId && !parsedUser.id) {
              const userWithId = { ...parsedUser, id: parsedUser.userId };
              console.log('AuthProvider: Setting user with id from userId', userWithId);
              setUser(userWithId);
            }
            // If the user has both properties, use both
            else if (parsedUser.id && parsedUser.userId) {
              console.log('AuthProvider: User has both id and userId', parsedUser);
              setUser(parsedUser);
            }
            // If the user has neither, throw an error
            else {
              console.error('AuthProvider: Invalid user object: missing both id and userId');
              throw new Error('Invalid user object: missing both id and userId');
            }
          } else {
            console.error('AuthProvider: Invalid user object: missing user data');
            throw new Error('Invalid user object: missing user data');
          }
        } catch (err) {
          console.error('AuthProvider: Error in authentication check:', err);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      console.log('AuthProvider: Setting loading to false');
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (userData, tokenData) => {
    console.log('AuthProvider: Login called with user and token', {
      userData,
      token: tokenData ? 'exists' : 'none',
    });
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
      console.log('AuthProvider: Login completed, user state set', userToSave);
      return { user: userToSave, token: tokenData };
    } catch (error) {
      console.error('AuthProvider: Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('AuthProvider: Logging out');
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