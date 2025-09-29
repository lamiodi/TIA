import sql from './db/index.js';

async function checkXSProducts() {
  try {
    console.log('Checking for products with XS size...');
    
    const products = await sql`
      SELECT p.name, v.color_name, s.size_name, vs.stock_quantity 
      FROM products p 
      JOIN variants v ON p.id = v.product_id 
      JOIN variant_sizes vs ON v.id = vs.variant_id 
      JOIN sizes s ON vs.size_id = s.id 
      WHERE s.size_name = 'XS' 
      LIMIT 10
    `;
    
    console.log('Products with XS size:');
    console.log(products);
    
    if (products.length === 0) {
      console.log('No products found with XS size. Checking all available sizes...');
      
      const allSizes = await sql`SELECT * FROM sizes ORDER BY id`;
      console.log('All sizes in database:');
      console.log(allSizes);
    }
    
  } catch (error) {
    console.error('Error checking XS products:', error);
  } finally {
    process.exit(0);
  }
}

checkXSProducts();