import sql from './db/index.js';

async function renameSizes() {
  try {
    console.log('Checking current sizes in database...');
    
    // Get current sizes
    const currentSizes = await sql`SELECT * FROM sizes ORDER BY id`;
    console.log('Current sizes:', currentSizes);
    
    // First, rename all existing sizes to temporary names to avoid conflicts
    console.log('\nStep 1: Renaming to temporary names...');
    for (const size of currentSizes) {
      const tempName = `TEMP_${size.id}`;
      await sql`
        UPDATE sizes 
        SET size_name = ${tempName}, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${size.id}
      `;
      console.log(`Renamed size ID ${size.id} from '${size.size_name}' to '${tempName}'`);
    }
    
    // Define the final mapping
    const sizeMapping = {
      1: 'XS',
      2: 'S', 
      3: 'M',
      4: 'L',
      5: 'XL'
    };
    
    console.log('\nStep 2: Applying final size names...');
    
    // Update to final names
    for (const [id, newName] of Object.entries(sizeMapping)) {
      const result = await sql`
        UPDATE sizes 
        SET size_name = ${newName}, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${id}
      `;
      
      if (result.count > 0) {
        console.log(`Updated size ID ${id} to '${newName}'`);
      } else {
        console.log(`No size found with ID ${id}`);
      }
    }
    
    // Remove any sizes beyond ID 5 (like XXL)
    console.log('\nStep 3: Removing extra sizes...');
    const deleteResult = await sql`DELETE FROM sizes WHERE id > 5`;
    if (deleteResult.count > 0) {
      console.log(`Removed ${deleteResult.count} extra size(s)`);
    }
    
    console.log('\nFinal sizes in database:');
    const finalSizes = await sql`SELECT * FROM sizes ORDER BY id`;
    finalSizes.forEach(size => {
      console.log(`ID ${size.id}: ${size.size_name}`);
    });
    
    console.log('\n✅ Size renaming completed successfully!');
    
  } catch (error) {
    console.error('❌ Error renaming sizes:', error);
  }
}

renameSizes();