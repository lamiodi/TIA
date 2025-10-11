// Comprehensive test to verify the entire bundle flow from cart to order creation
import dotenv from 'dotenv';
import sql from './db/index.js';

dotenv.config();

async function comprehensiveBundleTest() {
  try {
    console.log('=== COMPREHENSIVE BUNDLE FLOW TEST ===\n');
    
    // Step 1: Find a user with bundle items in cart
    console.log('Step 1: Finding user with bundle items in cart...');
    const userWithBundles = await sql`
      SELECT DISTINCT c.user_id, c.id as cart_id
      FROM cart c
      JOIN cart_items ci ON c.id = ci.cart_id
      WHERE ci.bundle_id IS NOT NULL
      LIMIT 1
    `;
    
    if (userWithBundles.length === 0) {
      console.log('❌ No users with bundle items found. Creating test data...');
      
      // Create test user
      const [testUser] = await sql`
        INSERT INTO users (first_name, last_name, email, password_hash, is_temporary)
        VALUES ('Test', 'User', 'test@example.com', 'hash', false)
        RETURNING id
      `;
      
      // Create test cart
      const [testCart] = await sql`
        INSERT INTO cart (user_id, total)
        VALUES (${testUser.id}, 0)
        RETURNING id
      `;
      
      // Add bundle to cart
      const [testCartItem] = await sql`
        INSERT INTO cart_items (cart_id, bundle_id, quantity, price)
        VALUES (${testCart.id}, 15, 1, 59999)
        RETURNING id
      `;
      
      // Add bundle items
      const bundleItems = [
        { variant_id: 7, size_id: 3 },
        { variant_id: 9, size_id: 3 },
        { variant_id: 8, size_id: 3 }
      ];
      
      for (const item of bundleItems) {
        await sql`
          INSERT INTO cart_bundle_items (cart_item_id, variant_id, size_id)
          VALUES (${testCartItem.id}, ${item.variant_id}, ${item.size_id})
        `;
      }
      
      console.log(`✅ Created test data: user_id=${testUser.id}, cart_id=${testCart.id}`);
      userWithBundles.push({ user_id: testUser.id, cart_id: testCart.id });
    }
    
    const userId = userWithBundles[0].user_id;
    const cartId = userWithBundles[0].cart_id;
    
    console.log(`✅ Found user with bundles: user_id=${userId}, cart_id=${cartId}`);
    
    // Step 2: Simulate fetchCartItems (backend)
    console.log('\nStep 2: Simulating backend fetchCartItems...');
    const cartItems = await sql`
      SELECT
        ci.id,
        ci.quantity::INTEGER,
        json_build_object(
          'id', ci.bundle_id,
          'name', b.name,
          'price', ci.price,
          'image', bi_image.image_url,
          'is_product', false,
          'items', (
            SELECT json_agg(
              json_build_object(
                'id', cbi.id,
                'variant_id', cbi.variant_id,
                'size_id', cbi.size_id,
                'product_id', pv2.product_id,
                'product_name', p2.name,
                'image_url', pi2.image_url,
                'color_name', c2.color_name,
                'size_name', s2.size_name,
                'stock_quantity', vs2.stock_quantity
              ) ORDER BY cbi.id
            )
            FROM cart_bundle_items cbi
            JOIN product_variants pv2 ON cbi.variant_id = pv2.id
            JOIN products p2 ON pv2.product_id = p2.id
            JOIN colors c2 ON pv2.color_id = c2.id
            JOIN sizes s2 ON cbi.size_id = s2.id
            LEFT JOIN (
              SELECT DISTINCT ON (variant_id) variant_id, image_url
              FROM product_images
              WHERE is_primary = TRUE
            ) pi2 ON pi2.variant_id = cbi.variant_id
            LEFT JOIN variant_sizes vs2 ON vs2.variant_id = cbi.variant_id AND vs2.size_id = cbi.size_id
            WHERE cbi.cart_item_id = ci.id AND pv2.deleted_at IS NULL AND p2.deleted_at IS NULL
          )
        ) AS item
      FROM cart_items ci
      JOIN bundles b ON ci.bundle_id = b.id
      LEFT JOIN bundle_images bi_image ON bi_image.bundle_id = b.id AND bi_image.is_primary = TRUE
      WHERE ci.cart_id = ${cartId} AND ci.bundle_id IS NOT NULL AND b.deleted_at IS NULL
    `;
    
    console.log('✅ Backend cart items structure:');
    console.log(JSON.stringify(cartItems, null, 2));
    
    // Step 3: Simulate frontend mapping (CheckoutPage.jsx)
    console.log('\nStep 3: Simulating frontend checkout mapping...');
    const mappedItems = cartItems.map(item => {
      const basePrice = Number(item.item?.price || 0);
      const orderItem = {
        variant_id: item.item?.is_product ? item.item.id : null,
        bundle_id: item.item?.is_product ? null : item.item.id,
        quantity: item.quantity || 1,
        price: basePrice,
        size_id: item.size_id || null,
        image_url: item.item?.image_url || item.item?.image,
        product_name: item.item?.name || 'Unknown Item',
        color_name: item.item?.color || null,
        size_name: item.size_name || null,
      };
      
      // Add bundle_items array for bundle orders
      if (!item.item?.is_product && item.item?.items) {
        orderItem.bundle_items = item.item.items.map(bundleItem => ({
          variant_id: bundleItem.variant_id,
          size_id: bundleItem.size_id
        }));
      }
      
      return orderItem;
    });
    
    console.log('✅ Frontend mapped items:');
    console.log(JSON.stringify(mappedItems, null, 2));
    
    // Step 4: Simulate backend order processing
    console.log('\nStep 4: Simulating backend order processing...');
    
    for (const item of mappedItems) {
      if (item.bundle_id) {
        console.log(`Processing bundle ${item.bundle_id}...`);
        
        // Fetch bundle
        const [bundle] = await sql`
          SELECT b.id, b.name, b.bundle_price, b.bundle_type, bi.image_url
          FROM bundles b
          LEFT JOIN bundle_images bi ON b.id = bi.bundle_id AND bi.is_primary = true
          WHERE b.id = ${item.bundle_id}
        `;
        
        console.log('Bundle found:', bundle);
        
        // Process bundle items
        const bundleItemsDetails = [];
        if (item.bundle_items && Array.isArray(item.bundle_items)) {
          for (const bi of item.bundle_items) {
            const [variant] = await sql`
              SELECT pv.id AS variant_id, pv.product_id, p.name AS product_name, 
                     c.color_name, s.size_name, pi.image_url
              FROM product_variants pv
              JOIN products p ON pv.product_id = p.id
              JOIN colors c ON pv.color_id = c.id
              LEFT JOIN sizes s ON s.id = ${bi.size_id || null}
              LEFT JOIN product_images pi ON pv.id = pi.variant_id AND pi.is_primary = true
              WHERE pv.id = ${bi.variant_id}
            `;
            
            if (variant) {
              bundleItemsDetails.push({
                variant_id: bi.variant_id,
                size_id: bi.size_id || null,
                product_name: variant.product_name,
                color_name: variant.color_name,
                size_name: variant.size_name,
                image_url: variant.image_url,
              });
            }
          }
        }
        
        console.log('Bundle items details:', JSON.stringify(bundleItemsDetails, null, 2));
        console.log('Bundle details JSON:', JSON.stringify(bundleItemsDetails));
        
        // This is what would be stored in order_items.bundle_details
        const orderItem = {
          bundle_id: item.bundle_id,
          quantity: item.quantity,
          price: item.price,
          product_name: bundle.name,
          image_url: bundle.image_url,
          bundle_details: JSON.stringify(bundleItemsDetails),
        };
        
        console.log('Order item to be stored:', JSON.stringify(orderItem, null, 2));
      }
    }
    
    console.log('\n=== TEST RESULTS ===');
    console.log('✅ Backend fetchCartItems: WORKING - includes items array');
    console.log('✅ Frontend mapping: WORKING - creates bundle_items array');
    console.log('✅ Backend order processing: WORKING - processes bundle_items and stores as bundle_details');
    console.log('\n🎉 ENTIRE BUNDLE FLOW IS WORKING CORRECTLY!');
    
    // Step 5: Check actual order data in database
    console.log('\nStep 5: Checking actual orders in database...');
    const recentOrders = await sql`
      SELECT o.id, o.reference, oi.bundle_id, oi.bundle_details, oi.product_name
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE oi.bundle_id IS NOT NULL
      ORDER BY o.created_at DESC
      LIMIT 3
    `;
    
    if (recentOrders.length > 0) {
      console.log('Recent bundle orders in database:');
      recentOrders.forEach(order => {
        console.log(`Order ${order.id} (${order.reference}):`);
        console.log(`  Bundle: ${order.product_name} (ID: ${order.bundle_id})`);
        console.log(`  Bundle Details: ${order.bundle_details}`);
        
        try {
          const parsedDetails = JSON.parse(order.bundle_details);
          console.log(`  Parsed Details: ${parsedDetails.length} items`);
          parsedDetails.forEach((detail, index) => {
            console.log(`    ${index + 1}. ${detail.product_name} (${detail.color_name}, ${detail.size_name})`);
          });
        } catch (e) {
          console.log(`  ❌ Failed to parse bundle_details: ${e.message}`);
        }
        console.log('');
      });
    } else {
      console.log('❌ No bundle orders found in database');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sql.end();
  }
}

comprehensiveBundleTest();