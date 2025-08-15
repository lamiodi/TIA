// routes/billingAddressRoutes.js
import { Router } from 'express';
import sql from '../db/index.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Get the latest billing address for a user
router.get('/user/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;

  if (req.user.id !== parseInt(userId, 10)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const rows = await sql`
      SELECT id, full_name, email, phone_number, address_line_1, city, state, zip_code, country
      FROM billing_addresses
      WHERE user_id = ${userId} AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `;

    res.status(200).json(rows);
  } catch (err) {
    console.error(`Error fetching billing addresses for user ${userId}:`, err);
    res.status(500).json({ error: 'Failed to fetch billing addresses', details: err.message });
  }
});

// Create or update a billing address
router.post('/', authenticateToken, async (req, res) => {
  const {
    user_id,
    full_name,
    email,
    phone_number,
    address_line_1,
    city,
    state,
    zip_code,
    country
  } = req.body;

  if (req.user.id !== parseInt(user_id, 10)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (!full_name || !email || !address_line_1 || !city || !country) {
    return res.status(400).json({ error: 'Full name, email, address line 1, city, and country are required' });
  }

  try {
    await sql.begin(async (sql) => {
      // Check user existence
      const [userCheck] = await sql`
        SELECT id FROM users WHERE id = ${user_id}
      `;
      if (!userCheck) {
        return res.status(400).json({ error: 'User does not exist' });
      }

      // Check if a billing address exists
      const existingAddress = await sql`
        SELECT id FROM billing_addresses WHERE user_id = ${user_id} AND deleted_at IS NULL
      `;

      if (existingAddress.length) {
        // Update existing address
        const [updatedAddress] = await sql`
          UPDATE billing_addresses
          SET
            full_name = ${full_name},
            email = ${email},
            phone_number = ${phone_number || null},
            address_line_1 = ${address_line_1},
            city = ${city},
            state = ${state || null},
            zip_code = ${zip_code || null},
            country = ${country},
            updated_at = NOW(),
            deleted_at = NULL
          WHERE user_id = ${user_id} AND deleted_at IS NULL
          RETURNING id, full_name, email, phone_number, address_line_1, city, state, zip_code, country
        `;

        return res.status(200).json(updatedAddress);
      }

      // Insert new billing address
      const [newAddress] = await sql`
        INSERT INTO billing_addresses (
          user_id, full_name, email, phone_number, address_line_1, city, state, zip_code, country, created_at
        ) VALUES (
          ${user_id}, ${full_name}, ${email}, ${phone_number || null}, ${address_line_1},
          ${city}, ${state || null}, ${zip_code || null}, ${country}, NOW()
        )
        RETURNING id, full_name, email, phone_number, address_line_1, city, state, zip_code, country
      `;

      res.status(201).json(newAddress);
    });
  } catch (err) {
    console.error(`Error adding/updating billing address for user ${user_id}:`, err);
    res.status(500).json({ error: 'Failed to add/update billing address', details: err.message });
  }
});

// Soft delete a billing address
router.delete('/:addressId', authenticateToken, async (req, res) => {
  const { addressId } = req.params;
  const userId = req.user.id;

  try {
    const [deletedAddress] = await sql`
      UPDATE billing_addresses
      SET deleted_at = NOW()
      WHERE id = ${addressId} AND user_id = ${userId} AND deleted_at IS NULL
      RETURNING id
    `;

    if (!deletedAddress) {
      return res.status(404).json({ error: 'Billing address not found or not owned by user' });
    }

    res.status(200).json({ message: 'Billing address deleted successfully' });
  } catch (err) {
    console.error(`Error deleting billing address ${addressId} for user ${userId}:`, err);
    res.status(500).json({ error: 'Failed to delete billing address', details: err.message });
  }
});

export default router;
