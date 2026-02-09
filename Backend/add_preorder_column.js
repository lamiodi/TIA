import sql from './db/index.js';
import dotenv from 'dotenv';

dotenv.config();

const addPreorderColumn = async () => {
  try {
    console.log('Checking if allow_preorder column exists...');
    
    // Check if column exists
    const [columnExists] = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'allow_preorder'
    `;

    if (columnExists) {
      console.log('allow_preorder column already exists.');
    } else {
      console.log('Adding allow_preorder column...');
      await sql`
        ALTER TABLE products 
        ADD COLUMN allow_preorder boolean DEFAULT false
      `;
      console.log('allow_preorder column added successfully.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error adding column:', error);
    process.exit(1);
  }
};

addPreorderColumn();
