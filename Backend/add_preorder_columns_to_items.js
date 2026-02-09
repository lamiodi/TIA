import sql from './db/index.js';
import dotenv from 'dotenv';

dotenv.config();

const addPreorderColumns = async () => {
  try {
    console.log('Checking/Adding is_preorder columns...');

    // cart_items
    const [cartColumn] = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'cart_items' AND column_name = 'is_preorder'
    `;

    if (cartColumn) {
      console.log('cart_items.is_preorder already exists.');
    } else {
      console.log('Adding is_preorder to cart_items...');
      await sql`
        ALTER TABLE cart_items 
        ADD COLUMN is_preorder boolean DEFAULT false
      `;
      console.log('cart_items.is_preorder added.');
    }

    // order_items
    const [orderColumn] = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'order_items' AND column_name = 'is_preorder'
    `;

    if (orderColumn) {
      console.log('order_items.is_preorder already exists.');
    } else {
      console.log('Adding is_preorder to order_items...');
      await sql`
        ALTER TABLE order_items 
        ADD COLUMN is_preorder boolean DEFAULT false
      `;
      console.log('order_items.is_preorder added.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error adding columns:', error);
    process.exit(1);
  }
};

addPreorderColumns();
