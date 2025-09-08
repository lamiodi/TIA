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
  const { first_name, last_name, email, password, phone_number } = req.body;
  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ error: 'All required fields must be filled' });
  }
  
  try {
    const [existing] = await sql`
      SELECT id, is_temporary FROM users WHERE LOWER(email) = LOWER(${email}) AND deleted_at IS NULL
    `;
    
    if (existing) {
      if (existing.is_temporary) {
        return res.status(409).json({
          error: 'You already have a temporary account with this email. Please click <a href="/forgot-password" style="color: #007bff; text-decoration: underline;">Forgot Password</a> to reset your password using this email address, then login to convert your temporary account to a permanent one.',
          suggestion: 'Use the password reset option with this email to convert your temporary account to a permanent account'
        });
      } else {
        return res.status(409).json({ 
          error: 'This email is already registered with a permanent account',
          suggestion: 'If you already have an account, please log in instead. If you forgot your password, you can reset it.'
        });
      }
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await sql.begin(async (sql) => {
      const [user] = await sql`
        INSERT INTO users
        (first_name, last_name, email, password, phone_number, created_at, updated_at, is_admin, first_order)
        VALUES (${first_name}, ${last_name}, LOWER(${email}), ${hashedPassword}, ${phone_number}, NOW(), NOW(), ${false}, ${true})
        RETURNING id, email, is_admin, first_order
      `;
      
      await sql`INSERT INTO cart (user_id, total) VALUES (${user.id}, 0)`;
      
      const token = generateToken(user);
      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
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

// Rate-limiter for password reset requests
const passwordResetAttempts = new Map();
const MAX_RESET_ATTEMPTS = 5;
const RESET_WINDOW_MS = 60 * 60 * 1000; // 1 hour
export const requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  const key = email.toLowerCase();
  const now = Date.now();
  const attempts = passwordResetAttempts.get(key) || [];
  const recentAttempts = attempts.filter((ts) => now - ts < RESET_WINDOW_MS);
  if (recentAttempts.length >= MAX_RESET_ATTEMPTS) {
    return res.status(429).json({ message: 'Too many reset requests. Please try again later.' });
  }
  // record this attempt
  recentAttempts.push(now);
  passwordResetAttempts.set(key, recentAttempts);
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
    // Get user details including is_temporary flag
    const [user] = await sql`
      SELECT id, is_temporary FROM users 
      WHERE reset_token = ${token} AND reset_token_expires > NOW() AND deleted_at IS NULL
    `;
    
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password and clear reset token
    // Also convert temporary account to permanent if needed
    await sql`
      UPDATE users 
      SET 
        password = ${hashedPassword}, 
        reset_token = NULL, 
        reset_token_expires = NULL, 
        is_temporary = ${user.is_temporary ? false : null}, // Set to false if it was a temporary account
        updated_at = NOW()
      WHERE reset_token = ${token}
    `;
    
    res.json({ 
      message: 'Password has been reset successfully',
      accountConverted: user.is_temporary // Let client know if account was converted
    });
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

// Add this to your auth controller
export const createTemporaryUser = async (req, res) => {
  try {
    const { name, email, phone_number } = req.body;
    
    // Validate input
    if (!name || !email || !phone_number) {
      return res.status(400).json({ error: 'Name, email, and phone number are required' });
    }
    
    // Split name into first and last name
    const nameParts = name.trim().split(' ');
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';
    
    // Check if there's an existing temporary user with the same email AND phone number
    const [existingTemporaryUser] = await sql`
      SELECT id, first_name, last_name, email, phone_number, is_temporary, first_order 
      FROM users 
      WHERE email = ${email} AND phone_number = ${phone_number} AND is_temporary = TRUE
    `;
    
    if (existingTemporaryUser) {
      // Return the existing temporary user's ID
      return res.status(200).json({
        user: existingTemporaryUser,
        message: 'Existing temporary account found',
        isExisting: true
      });
    }
    
    // Generate a random password (but we won't send it to the user)
    const generateRandomPassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let password = '';
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };
    
    const password = generateRandomPassword();
    
    // Hash the password - bcrypt is already imported at the top
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create the temporary user
    const [newUser] = await sql`
      INSERT INTO users (first_name, last_name, email, phone_number, password, is_temporary, first_order)
      VALUES (${first_name}, ${last_name}, ${email}, ${phone_number}, ${hashedPassword}, ${true}, ${false})
      RETURNING id, first_name, last_name, email, phone_number, is_temporary, first_order
    `;
    
    // Return user data without token
    res.status(201).json({
      user: newUser,
      message: 'Temporary account created successfully',
      isExisting: false
    });
  } catch (err) {
    console.error('Error creating temporary user:', err);
    res.status(500).json({ error: 'Failed to create temporary account' });
  }
};