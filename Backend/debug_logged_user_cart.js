// Debug script to test logged-in user cart structure for bundle items
import dotenv from 'dotenv';
import sql from './db/index.js';

dotenv.config();

async function debugLoggedUserCart() {
  try {
    console.log('=== DEBUGGING LOGGED-IN USER CART STRUCTURE ===\n');
    
    // Find a cart with bundle items for a logged-in user
    const cartWithBundles = await sql`
      SELECT DISTINCT c.id as cart_id, c.user_id
      FROM cart c
      JOIN cart_items ci ON c.id = ci.cart_id
      WHERE ci.bundle_id IS NOT NULL
      LIMIT 1
    `;
    
    if (cartWithBundles.length === 0) {
      console.log('No carts with bundles found for logged-in users');
      return;
    }
    
    const cartId = cartWithBundles[0].cart_id;
    const userId = cartWithBundles[0].user_id;
    console.log(`Found cart with bundles: cart_id=${cartId}, user_id=${userId}`);
    
    // Simulate the fetchCartItems function from cartController.js
    const cartItems = await sql`
      SELECT
        ci.id,
        ci.quantity::INTEGER,
        json_build_object(
          'id', ci.variant_id,
          'name', p.name,
          'price', ci.price,
          'image', pi.image_url,
          'size', COALESCE(ci.size_name, s.size_name),
          'size_id', ci.size_id,
          'color', COALESCE(ci.color_name, c.color_name),
          'is_product', true,
          'stock_quantity', vs.stock_quantity
        ) AS item
      FROM cart_items ci
      JOIN product_variants pv ON ci.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN colors c ON pv.color_id = c.id
      LEFT JOIN sizes s ON ci.size_id = s.id
      LEFT JOIN product_images pi ON pi.variant_id = pv.id AND pi.is_primary = TRUE
      LEFT JOIN variant_sizes vs ON vs.variant_id = pv.id AND vs.size_id = ci.size_id
      WHERE ci.cart_id = ${cartId} AND ci.bundle_id IS NULL AND pv.deleted_at IS NULL AND p.deleted_at IS NULL
      UNION ALL
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
    
    const formattedCartItems = cartItems.map(row => ({
      id: row.id,
      quantity: row.quantity,
      item: row.item
    }));
    
    console.log('\n=== CART ITEMS FROM BACKEND ===');
    console.log(JSON.stringify(formattedCartItems, null, 2));
    
    console.log('\n=== TESTING CHECKOUT MAPPING FOR LOGGED-IN USER ===');
    
    // This is how CheckoutPage.jsx maps the cart items for logged-in users
    const mappedItems = formattedCartItems.map(item => {
      const basePrice = Number(item.item?.price || 0);
      const orderItem = {
        variant_id: item.item?.is_product ? item.item.id : null,
        bundle_id: item.item?.is_product ? null : item.item.id,
        quantity: item.quantity || 1,
        price: basePrice,
        size_id: item.size_id || null,
        image_url: item.item?.image_url || item.item?.image || (item.item?.is_product ? 
          (item.item?.product_images?.find(img => img.is_primary)?.image_url || null) : 
          (item.item?.bundle_images?.find(img => img.is_primary)?.image_url || null)),
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
    
    console.log('\nMapped order items for logged-in user:');
    console.log(JSON.stringify(mappedItems, null, 2));
    
    console.log('\n=== ANALYSIS ===');
    const bundleItems = mappedItems.filter(item => item.bundle_id);
    if (bundleItems.length > 0) {
      console.log('Bundle items found:', bundleItems.length);
      bundleItems.forEach((item, index) => {
        console.log(`Bundle ${index + 1}:`);
        console.log(`  - Bundle ID: ${item.bundle_id}`);
        console.log(`  - Has bundle_items: ${item.bundle_items ? 'YES' : 'NO'}`);
        console.log(`  - Bundle items count: ${item.bundle_items?.length || 0}`);
        if (item.bundle_items) {
          console.log(`  - Bundle items:`, item.bundle_items);
        }
      });
    } else {
      console.log('No bundle items found in mapped items');
    }
    
  } catch (error) {
    console.error('Error debugging logged user cart:', error);
  } finally {
    await sql.end();
  }
}

debugLoggedUserCart();