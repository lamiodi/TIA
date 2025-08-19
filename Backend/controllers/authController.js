// controllers/authController.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import sql from '../db/index.js';
import { sendResetEmail } from '../utils/emailService.js';

const generateToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, isAdmin: user.is_admin },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [user] = await sql`
      SELECT id, first_name, last_name, username, email, phone_number, is_admin, password, first_order
      FROM users
      WHERE LOWER(email) = LOWER(${email}) AND deleted_at IS NULL
    `;
    
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        email: user.email,
        phone_number: user.phone_number,
        isAdmin: user.is_admin,
        first_order: user.first_order,
      },
    });
  } catch (err) {
    console.error('loginUser error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [user] = await sql`
      SELECT id, first_name, last_name, username, email, phone_number, is_admin, password, first_order
      FROM users
      WHERE LOWER(email) = LOWER(${email}) AND is_admin = true AND deleted_at IS NULL
    `;
    
    if (!user) return res.status(401).json({ error: 'Invalid admin credentials' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid admin credentials' });
    
    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        email: user.email,
        phone_number: user.phone_number,
        isAdmin: user.is_admin,
      },
    });
  } catch (err) {
    console.error('adminLogin error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getMe = async (req, res) => {
  try {
    const [user] = await sql`
      SELECT id, first_name, last_name, username, email, phone_number, is_admin, first_order
      FROM users
      WHERE id = ${req.user.id} AND deleted_at IS NULL
    `;
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const signupUser = async (req, res) => {
  const { first_name, last_name, username, email, password, phone_number } = req.body;
  if (!first_name || !last_name || !username || !email || !password) {
    return res.status(400).json({ error: 'All required fields must be filled' });
  }
  
  try {
    const [existing] = await sql`
      SELECT id FROM users WHERE LOWER(email) = LOWER(${email}) AND deleted_at IS NULL
    `;
    
    if (existing) return res.status(409).json({ error: 'Email is already registered' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await sql.begin(async (sql) => {
      const [user] = await sql`
        INSERT INTO users
        (first_name, last_name, username, email, password, phone_number, created_at, updated_at, is_admin, first_order)
        VALUES (${first_name}, ${last_name}, ${username}, LOWER(${email}), ${hashedPassword}, ${phone_number}, NOW(), NOW(), ${false}, ${true})
        RETURNING id, email, username, is_admin, first_order
      `;
      
      await sql`INSERT INTO cart (user_id, total) VALUES (${user.id}, 0)`;
      
      const token = generateToken(user);
      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.is_admin ? 'admin' : 'user',
          first_order: user.first_order,
        },
      });
    });
  } catch (err) {
    console.error('signupUser error:', err);
    res.status(500).json({ error: 'Internal server error during signup' });
  }
};

export const requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  
  try {
    // Get the user's actual email from the database
    const [user] = await sql`
      SELECT id, email FROM users WHERE LOWER(email) = LOWER(${email}) AND deleted_at IS NULL
    `;
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    
    await sql`
      UPDATE users 
      SET reset_token = ${token}, reset_token_expires = ${expires} 
      WHERE id = ${user.id}
    `;
    
    // Use the email from the database (correct case) instead of user input
    await sendResetEmail(user.email, token);
    res.status(200).json({ message: 'Reset link sent to email' });
  } catch (err) {
    console.error('requestPasswordReset error:', err);
    res.status(500).json({ message: 'Failed to send reset email', details: err.message });
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const [user] = await sql`
      SELECT id FROM users 
      WHERE reset_token = ${token} AND reset_token_expires > NOW() AND deleted_at IS NULL
    `;
    
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await sql`
      UPDATE users 
      SET password = ${hashedPassword}, reset_token = NULL, reset_token_expires = NULL, updated_at = NOW()
      WHERE reset_token = ${token}
    `;
    
    res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    console.error('resetPassword error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateProfile = async (req, res) => {
  const { first_name, last_name, username, phone_number } = req.body;
  try {
    const [user] = await sql`
      UPDATE users
      SET first_name = ${first_name}, last_name = ${last_name}, username = ${username}, phone_number = ${phone_number}, updated_at = NOW()
      WHERE id = ${req.user.id} AND deleted_at IS NULL
      RETURNING id, first_name, last_name, username, email, phone_number, is_admin, first_order
    `;
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({ ...user, role: user.is_admin ? 'admin' : 'user' });
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const updateUserFirstOrder = async (req, res) => {
  const { id } = req.params;
  const { first_order } = req.body;
  
  // Security check: Ensure users can only update their own record (unless they're an admin)
  if (req.user.id !== parseInt(id) && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Unauthorized to update this user' });
  }
  
  try {
    // Check if user exists before updating
    const [existingUser] = await sql`
      SELECT id, first_order FROM users
      WHERE id = ${id} AND deleted_at IS NULL
    `;
    
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Only update if the value is actually changing
    if (existingUser.first_order === first_order) {
      return res.status(200).json({ 
        message: 'No update needed', 
        user: existingUser 
      });
    }
    
    // Update the user record
    const [user] = await sql`
      UPDATE users
      SET first_order = ${first_order}, updated_at = NOW()
      WHERE id = ${id} AND deleted_at IS NULL
      RETURNING id, first_name, last_name, username, email, phone_number, is_admin, first_order
    `;
    
    // Return the full updated user object
    res.json({
      success: true,
      message: `First order status updated to ${first_order}`,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        email: user.email,
        phone_number: user.phone_number,
        isAdmin: user.is_admin,
        first_order: user.first_order,
      }
    });
  } catch (err) {
    console.error('updateUserFirstOrder error:', err);
    res.status(500).json({ 
      error: 'Failed to update first order status',
      details: err.message 
    });
  }
};