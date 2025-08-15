// routes/addressRoutes.js
import { Router } from 'express';
import sql from '../db/index.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Get all shipping addresses for a user
router.get('/user/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  if (req.user.id !== parseInt(userId, 10)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  try {
    const addresses = await sql`
      SELECT id, title, address_line_1, landmark, city, state, zip_code, country
      FROM addresses
      WHERE user_id = ${userId} AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;
    res.status(200).json(addresses);
  } catch (err) {
    console.error(`Error fetching addresses for user ${userId}:`, err);
    res.status(500).json({ error: 'Failed to fetch shipping addresses', details: err.message });
  }
});

// Get a specific address by ID
router.get('/:addressId', authenticateToken, async (req, res) => {
  const { addressId } = req.params;
  const userId = req.user.id;
  
  try {
    const [address] = await sql`
      SELECT id, title, address_line_1, landmark, city, state, zip_code, country
      FROM addresses
      WHERE id = ${addressId} AND user_id = ${userId} AND deleted_at IS NULL
    `;
    
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }
    
    res.status(200).json(address);
  } catch (err) {
    console.error(`Error fetching address ${addressId}:`, err);
    res.status(500).json({ error: 'Failed to fetch address', details: err.message });
  }
});

// Create a new shipping address
router.post('/', authenticateToken, async (req, res) => {
  const {
    user_id,
    title,
    address_line_1,
    address_line_2,
    city,
    state,
    country,
    zip_code
  } = req.body;
  
  if (req.user.id !== parseInt(user_id, 10)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  if (!title || !address_line_1 || !city || !country) {
    return res.status(400).json({ error: 'Title, address line 1, city, and country are required' });
  }
  
  try {
    // Check user existence
    const [user] = await sql`SELECT id FROM users WHERE id = ${user_id}`;
    if (!user) {
      return res.status(400).json({ error: 'User does not exist' });
    }
    
    // Insert new address (changed from update/replace to always create new)
    const [newAddress] = await sql`
      INSERT INTO addresses (
        user_id, title, address_line_1, landmark, city, state, zip_code, country, created_at
      ) VALUES (
        ${user_id}, 
        ${title}, 
        ${address_line_1}, 
        ${address_line_2 || null}, 
        ${city}, 
        ${state || null}, 
        ${zip_code || null}, 
        ${country}, 
        NOW()
      )
      RETURNING id, title, address_line_1, landmark, city, state, zip_code, country
    `;
    
    res.status(201).json(newAddress);
  } catch (err) {
    console.error(`Error adding address for user ${user_id}:`, err);
    res.status(500).json({ error: 'Failed to add address', details: err.message });
  }
});

// Update an existing shipping address
router.put('/:addressId', authenticateToken, async (req, res) => {
  const { addressId } = req.params;
  const userId = req.user.id;
  const {
    title,
    address_line_1,
    address_line_2,
    city,
    state,
    country,
    zip_code
  } = req.body;
  
  if (!title || !address_line_1 || !city || !country) {
    return res.status(400).json({ error: 'Title, address line 1, city, and country are required' });
  }
  
  try {
    // Check if address exists and belongs to user
    const [existingAddress] = await sql`
      SELECT id FROM addresses 
      WHERE id = ${addressId} AND user_id = ${userId} AND deleted_at IS NULL
    `;
    
    if (!existingAddress) {
      return res.status(404).json({ error: 'Address not found or not owned by user' });
    }
    
    // Update the address
    const [updatedAddress] = await sql`
      UPDATE addresses
      SET
        title = ${title},
        address_line_1 = ${address_line_1},
        landmark = ${address_line_2 || null},
        city = ${city},
        state = ${state || null},
        zip_code = ${zip_code || null},
        country = ${country},
        updated_at = NOW()
      WHERE id = ${addressId} AND user_id = ${userId} AND deleted_at IS NULL
      RETURNING id, title, address_line_1, landmark, city, state, zip_code, country
    `;
    
    res.status(200).json(updatedAddress);
  } catch (err) {
    console.error(`Error updating address ${addressId} for user ${userId}:`, err);
    res.status(500).json({ error: 'Failed to update address', details: err.message });
  }
});

// Soft delete a shipping address
router.delete('/:addressId', authenticateToken, async (req, res) => {
  const { addressId } = req.params;
  const userId = req.user.id;
  
  try {
    const [deletedAddress] = await sql`
      UPDATE addresses
      SET deleted_at = NOW()
      WHERE id = ${addressId} AND user_id = ${userId} AND deleted_at IS NULL
      RETURNING id
    `;
    
    if (!deletedAddress) {
      return res.status(404).json({ error: 'Address not found or not owned by user' });
    }
    
    res.status(200).json({ message: 'Address deleted successfully' });
  } catch (err) {
    console.error(`Error deleting address ${addressId} for user ${userId}:`, err);
    res.status(500).json({ error: 'Failed to delete address', details: err.message });
  }
});

export default router;