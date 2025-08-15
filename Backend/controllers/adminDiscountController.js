// adminDiscountController.js
import sql from '../db/index.js';

// Create discount
export const createDiscount = async (req, res) => {
  const { product_id, discount_type, discount_value, start_date, end_date } = req.body;
  try {
    const result = await sql`
      INSERT INTO discounts (product_id, discount_type, discount_value, start_date, end_date)
      VALUES (${product_id}, ${discount_type}, ${discount_value}, ${start_date}, ${end_date})
      RETURNING *
    `;
    res.json(result[0]);
  } catch (error) {
    console.error('Error creating discount:', error);
    res.status(500).json({ error: 'Error creating discount' });
  }
};

// Get all discounts
export const getDiscounts = async (req, res) => {
  try {
    const discounts = await sql`SELECT * FROM discounts ORDER BY start_date DESC`;
    res.json(discounts);
  } catch (error) {
    console.error('Error fetching discounts:', error);
    res.status(500).json({ error: 'Error fetching discounts' });
  }
};

// Update discount
export const updateDiscount = async (req, res) => {
  const { id } = req.params;
  const { product_id, discount_type, discount_value, start_date, end_date } = req.body;
  try {
    const result = await sql`
      UPDATE discounts
      SET product_id = ${product_id},
          discount_type = ${discount_type},
          discount_value = ${discount_value},
          start_date = ${start_date},
          end_date = ${end_date}
      WHERE id = ${id}
      RETURNING *
    `;
    if (!result.length) return res.status(404).json({ error: 'Discount not found' });
    res.json(result[0]);
  } catch (error) {
    console.error('Error updating discount:', error);
    res.status(500).json({ error: 'Error updating discount' });
  }
};

// Delete discount
export const deleteDiscount = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await sql`
      DELETE FROM discounts WHERE id = ${id} RETURNING *
    `;
    if (!result.length) return res.status(404).json({ error: 'Discount not found' });
    res.json({ message: 'Discount deleted successfully' });
  } catch (error) {
    console.error('Error deleting discount:', error);
    res.status(500).json({ error: 'Error deleting discount' });
  }
};

// adminDiscountController.js
export const validateCoupon = async (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ valid: false, message: 'Coupon code is required' });
  }
  
  try {
    // Find active discount with matching code
    const [discount] = await sql`
      SELECT * FROM discounts 
      WHERE code = ${code} 
      AND active = true 
      AND (start_date <= NOW() OR start_date IS NULL)
      AND (end_date >= NOW() OR end_date IS NULL)
    `;
    
    if (!discount) {
      return res.status(404).json({ valid: false, message: 'Invalid or expired coupon code' });
    }
    
    // Return discount details
    res.json({
      valid: true,
      discount: {
        code: discount.code,
        type: discount.discount_type,
        value: discount.discount_value
      }
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ valid: false, message: 'Error validating coupon' });
  }
};