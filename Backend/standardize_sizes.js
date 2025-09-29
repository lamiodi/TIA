import sql from './db/index.js';

async function standardizeSizes() {
  try {
    console.log('Starting size standardization...');
    
    // First, let's see what sizes currently exist
    const currentSizes = await sql`SELECT * FROM sizes ORDER BY id`;
    console.log('Current sizes:', currentSizes);
    
    // Update existing sizes to standard names
    const sizeUpdates = [
      { id: 1, name: 'XS' },
      { id: 2, name: 'S' },
      { id: 3, name: 'M' },
      { id: 4, name: 'L' },
      { id: 5, name: 'XL' }
    ];
    
    // Update each size
    for (const size of sizeUpdates) {
      await sql`
        UPDATE sizes 
        SET size_name = ${size.name}
        WHERE id = ${size.id}
      `;
      console.log(`Updated size ID ${size.id} to ${size.name}`);
    }
    
    // Remove any sizes beyond ID 5 (like XXL or other legacy sizes)
    const deletedSizes = await sql`DELETE FROM sizes WHERE id > 5 RETURNING *`;
    if (deletedSizes.length > 0) {
      console.log('Deleted legacy sizes:', deletedSizes);
    }
    
    // Show final sizes
    const finalSizes = await sql`SELECT * FROM sizes ORDER BY id`;
    console.log('Final standardized sizes:', finalSizes);
    
    console.log('Size standardization completed successfully!');
    
  } catch (error) {
    console.error('Error standardizing sizes:', error);
  } finally {
    process.exit(0);
  }
}

standardizeSizes();