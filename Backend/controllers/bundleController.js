// controllers/bundleController.js
import sql from '../db/index.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET all active products (for bundle dropdown)
export const getProducts = async (req, res) => {
  try {
    const products = await sql`
      SELECT id, name, sku_prefix 
      FROM products 
      WHERE is_active = TRUE
    `;
    res.json(products);
  } catch (err) {
    console.error('Products fetch failed:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// GET distinct sku_prefixes for active products
export const getSkuPrefixes = async (req, res) => {
  try {
    const rows = await sql`
      SELECT DISTINCT sku_prefix 
      FROM products 
      WHERE is_active = TRUE
    `;
    res.json(rows.map(r => r.sku_prefix));
  } catch (err) {
    console.error('SKU prefix fetch failed:', err);
    res.status(500).json({ error: 'Failed to fetch SKU prefixes.' });
  }
};

// POST to create a single bundle
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
    
    // Check if there's a permanent user with the same email AND phone number
    const [existingPermanentUser] = await sql`
      SELECT id, first_name, last_name, email, phone_number, is_temporary, first_order 
      FROM users 
      WHERE email = ${email} AND phone_number = ${phone_number} AND is_temporary = FALSE
    `;
    
    if (existingPermanentUser) {
      // Return information about the existing permanent user
      return res.status(400).json({ 
        error: 'An account with this email and phone number already exists',
        existingUser: {
          id: existingPermanentUser.id,
          is_temporary: existingPermanentUser.is_temporary,
          email: existingPermanentUser.email,
          phone_number: existingPermanentUser.phone_number
        }
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