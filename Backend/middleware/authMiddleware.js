import jwt from 'jsonwebtoken';
import sql from '../db/index.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('authMiddleware: Auth Header for', req.url, ':', authHeader);
  
  // Check if Authorization header exists and has the correct format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('authMiddleware: Invalid or missing Authorization header for', req.url);
    return res.status(401).json({ 
      error: 'Access Denied: Invalid or missing Authorization header' 
    });
  }
  
  const token = authHeader.split(' ')[1];
  if (!token) {
    console.error('authMiddleware: No token provided for', req.url);
    return res.status(401).json({ error: 'Access Denied: No token provided' });
  }
  
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('authMiddleware: JWT_SECRET not defined for', req.url);
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    // Verify the token
    const decoded = jwt.verify(token, secret);
    console.log('authMiddleware: Decoded token for', req.url, ':', decoded);
    
    // Check if user exists and is not deleted
    const [user] = await sql`
      SELECT id, first_name, last_name, username, email, phone_number, is_admin 
      FROM users 
      WHERE id = ${decoded.id} AND deleted_at IS NULL
    `;
    
    if (!user) {
      console.error('authMiddleware: User not found for id:', decoded.id, 'on', req.url);
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Standardize the user object with consistent property names
    req.user = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      email: user.email,
      phone_number: user.phone_number,
      isAdmin: Boolean(user.is_admin) // Ensure boolean value
    };
    
    console.log('authMiddleware: Authenticated user for', req.url, ':', req.user);
    next();
  } catch (err) {
    console.error('authMiddleware: Token verification failed for', req.url, ':', err.message);
    
    // Handle specific JWT errors
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    // Handle other errors
    return res.status(401).json({ 
      error: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

export const requireAdmin = (req, res, next) => {
  // Check if user exists and has admin privileges
  if (!req.user || req.user.isAdmin !== true) {
    console.error('requireAdmin: Access denied, isAdmin:', req.user?.isAdmin, 'for user:', req.user?.id, 'on', req.url);
    return res.status(403).json({ 
      error: 'Admin access only',
      code: 'ADMIN_REQUIRED' 
    });
  }
  next();
};