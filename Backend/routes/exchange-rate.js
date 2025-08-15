import express from 'express';
import sql from '../db/index.js'; // Changed from pool to sql
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/exchange-rate', async (req, res) => {
  try {
    // Changed to tagged template literal and destructuring assignment
    const [result] = await sql`SELECT rate FROM settings WHERE key = ${'ngn_to_usd_rate'}`;
    const rate = result?.rate || 0.0006;
    res.json({ rate });
  } catch (error) {
    console.error('ExchangeRate: Error fetching rate:', error);
    res.status(500).json({ error: 'Failed to fetch exchange rate' });
  }
});

router.put('/exchange-rate', authenticateAdmin, async (req, res) => {
  const { rate } = req.body;
  if (!rate || rate <= 0) {
    return res.status(400).json({ error: 'Invalid exchange rate' });
  }
  
  try {
    // Changed to tagged template literal
    await sql`
      INSERT INTO settings (key, rate) 
      VALUES (${'ngn_to_usd_rate'}, ${rate}) 
      ON CONFLICT (key) DO UPDATE SET rate = ${rate}
    `;
    console.log('ExchangeRate: Updated rate to', rate);
    res.json({ rate });
  } catch (error) {
    console.error('ExchangeRate: Error updating rate:', error);
    res.status(500).json({ error: 'Failed to update exchange rate' });
  }
});

export default router;