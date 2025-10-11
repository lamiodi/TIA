// Script to add temporary logging to orderController.js to debug frontend payload
import fs from 'fs';
import path from 'path';

const orderControllerPath = 'C:/Users/nuke/Documents/TiaBrand/ecommerce website/Backend/controllers/orderController.js';

// Read the current file
const content = fs.readFileSync(orderControllerPath, 'utf8');

// Add logging right after the items validation starts
const logCode = `
    // DEBUG: Log the entire request payload
    console.log('=== DEBUG: Full request payload ===');
    console.log('Items received from frontend:', JSON.stringify(items, null, 2));
    console.log('Number of items:', items.length);
    items.forEach((item, index) => {
      console.log(\`Item \${index}:\`);
      console.log(\`  bundle_id: \${item.bundle_id}\`);
      console.log(\`  bundle_items: \${JSON.stringify(item.bundle_items)}\`);
      console.log(\`  bundle_items type: \${typeof item.bundle_items}\`);
      console.log(\`  bundle_items length: \${item.bundle_items ? item.bundle_items.length : 'null'}\`);
    });
    console.log('=== END DEBUG ===\\n');
`;

// Find the line where items validation starts (around line 300)
const lines = content.split('\n');
let insertIndex = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('for (const item of items)') && lines[i].includes('// Validate each item')) {
    insertIndex = i;
    break;
  }
}

if (insertIndex === -1) {
  // Try alternative search
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('// Validate each item') || lines[i].includes('for (const item of items)')) {
      insertIndex = i;
      break;
    }
  }
}

if (insertIndex !== -1) {
  // Insert the debug code before the validation loop
  lines.splice(insertIndex, 0, logCode);
  
  // Write the modified content back
  fs.writeFileSync(orderControllerPath, lines.join('\n'));
  console.log('✅ Added debug logging to orderController.js');
  console.log(`Inserted at line ${insertIndex + 1}`);
} else {
  console.log('❌ Could not find insertion point in orderController.js');
  console.log('Please add the debug code manually before the items validation loop');
}

console.log('\nDebug code to add:');
console.log(logCode);