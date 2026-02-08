
import sql from './db/index.js';
import dotenv from 'dotenv';

dotenv.config();

const checkProducts = async () => {
  try {
    const products = await sql`
      SELECT id, name, category, gender 
      FROM products 
      WHERE name ILIKE '%His%' OR name ILIKE '%Hers%'
    `;
    
    const bundles = await sql`
      SELECT id, name, bundle_type 
      FROM bundles 
      WHERE name ILIKE '%His%' OR name ILIKE '%Hers%'
    `;

    console.log('Products matching His/Hers:', products);
    console.log('Bundles matching His/Hers:', bundles);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkProducts();
