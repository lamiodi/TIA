import sql from '../db/index.js';

// Common SQL query for fetching cart items
const CART_ITEMS_QUERY = (cartId) => sql`
  WITH aggregated_single_items AS (
    SELECT
      MIN(ci.id) AS id,
      ci.variant_id,
      ci.size_id,
      COALESCE(SUM(ci.quantity), 0)::INTEGER AS quantity,
      ci.price,
      ci.color_name,
      ci.size_name,
      pv.product_id,
      p.name AS product_name,
      pi.image_url AS image_url,
      vs.stock_quantity
    FROM cart_items ci
    JOIN product_variants pv ON ci.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
    LEFT JOIN product_images pi ON pi.variant_id = pv.id AND pi.is_primary = TRUE
    LEFT JOIN variant_sizes vs ON vs.variant_id = pv.id AND vs.size_id = ci.size_id
    WHERE ci.cart_id = ${cartId} AND ci.bundle_id IS NULL AND pv.deleted_at IS NULL AND p.deleted_at IS NULL
    GROUP BY ci.variant_id, ci.size_id, ci.price, ci.color_name, ci.size_name, pv.product_id, p.name, pi.image_url, vs.stock_quantity
  ),
  bundle_items AS (
    SELECT
      ci.id,
      ci.bundle_id,
      ci.quantity::INTEGER,
      ci.price,
      b.name AS bundle_name,
      bi_image.image_url AS bundle_image,
      (
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
      ) AS bundle_items
    FROM cart_items ci
    JOIN bundles b ON ci.bundle_id = b.id
    LEFT JOIN bundle_images bi_image ON bi_image.bundle_id = b.id AND bi_image.is_primary = TRUE
    WHERE ci.cart_id = ${cartId} AND ci.bundle_id IS NOT NULL AND b.deleted_at IS NULL
  )
  SELECT
    id,
    quantity,
    json_build_object(
      'id', variant_id,
      'name', product_name,
      'price', price,
      'image', image_url,
      'size', size_name,
      'size_id', size_id,
      'color', color_name,
      'is_product', true,
      'stock_quantity', stock_quantity
    ) AS item
  FROM aggregated_single_items
  UNION ALL
  SELECT
    id,
    quantity,
    json_build_object(
      'id', bundle_id,
      'name', bundle_name,
      'price', price,
      'image', bundle_image,
      'is_product', false,
      'items', bundle_items
    ) AS item
  FROM bundle_items
`;

// Helper function to calculate cart totals
const calculateCartTotals = (items, country) => {
  const subtotal = items.reduce((sum, row) => sum + (parseFloat(row.item.price) * row.quantity), 0);
  const tax = country === 'Nigeria' ? 0 : subtotal * 0.05;
  const total = subtotal + tax;
  return { subtotal, tax, total };
};

// Helper function to fetch cart items
const fetchCartItems = async (sql, cartId) => {
  const cartItems = await CART_ITEMS_QUERY(cartId);
  return cartItems.map(row => ({
    id: row.id,
    quantity: row.quantity,
    item: row.item
  }));
};

// Helper function to update cart total
const updateCartTotal = async (sql, cartId, country) => {
  const [subtotalResult] = await sql`
    SELECT COALESCE(SUM(ci.price * ci.quantity), 0) as subtotal
    FROM cart_items ci
    WHERE ci.cart_id = ${cartId}
  `;
  
  const subtotal = subtotalResult.subtotal;
  const tax = country === 'Nigeria' ? 0 : subtotal * 0.05;
  const total = subtotal + tax;
  
  await sql`
    UPDATE cart SET total = ${total} WHERE id = ${cartId}
  `;
  
  return { subtotal, tax, total };
};

// Helper function to validate single product
const validateSingleProduct = async (sql, variant_id, size_id, quantity) => {
  const [variant] = await sql`
    SELECT pv.id, p.base_price, vs.stock_quantity
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    JOIN variant_sizes vs ON vs.variant_id = pv.id AND vs.size_id = ${size_id}
    WHERE pv.id = ${variant_id} AND pv.deleted_at IS NULL AND p.deleted_at IS NULL
  `;
  
  if (!variant) {
    throw new Error('Invalid variant or size.');
  }
  
  const { base_price, stock_quantity } = variant;
  if (stock_quantity < quantity) {
    throw new Error(`Only ${stock_quantity} items available in stock.`);
  }
  
  // Fetch color and size names
  const [details] = await sql`
    SELECT c.color_name AS color_name, s.size_name AS size_name
    FROM colors c
    JOIN product_variants pv ON c.id = pv.color_id
    JOIN sizes s ON s.id = ${size_id}
    WHERE pv.id = ${variant_id}
  `;
  
  const { color_name, size_name } = details || {};
  if (!color_name || !size_name) {
    throw new Error('Could not retrieve color or size information.');
  }
  
  return { base_price, color_name, size_name };
};

// Helper function to validate bundle
const validateBundle = async (sql, bundle_id, items, quantity) => {
  const [bundle] = await sql`
    SELECT b.bundle_price, b.bundle_type, b.product_id
    FROM bundles b
    WHERE b.id = ${bundle_id} AND b.deleted_at IS NULL
  `;
  
  if (!bundle) {
    throw new Error('Invalid bundle.');
  }
  
  const { bundle_price, bundle_type, product_id } = bundle;
  const expectedItems = bundle_type === '3-in-1' ? 3 : 5;
  if (items.length !== expectedItems) {
    throw new Error(`Bundle requires exactly ${expectedItems} items.`);
  }
  
  // Validate bundle items belong to the bundle's product and have sufficient stock
  for (const item of items) {
    const { variant_id, size_id } = item;
    const [itemResult] = await sql`
      SELECT vs.stock_quantity
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      JOIN variant_sizes vs ON vs.variant_id = pv.id AND vs.size_id = ${size_id}
      WHERE pv.id = ${variant_id} AND pv.product_id = ${product_id} AND pv.deleted_at IS NULL AND p.deleted_at IS NULL
    `;
    
    if (!itemResult) {
      throw new Error(`Invalid variant or size for bundle item: variant_id ${variant_id}, size_id ${size_id}.`);
    }
    
    if (itemResult.stock_quantity < quantity) {
      throw new Error(`Only ${itemResult.stock_quantity} items available for variant ${variant_id}.`);
    }
  }
  
  return { bundle_price, bundle_type, product_id };
};

// Helper function to check for existing bundle
const findExistingBundle = async (sql, cart_id, bundle_id, sortedItems) => {
  const cartItems = await sql`
    SELECT id, quantity
    FROM cart_items
    WHERE cart_id = ${cart_id} AND bundle_id = ${bundle_id} AND is_bundle = TRUE
  `;
  
  for (const item of cartItems) {
    const bundleItems = await sql`
      SELECT variant_id, size_id
      FROM cart_bundle_items
      WHERE cart_item_id = ${item.id}
      ORDER BY variant_id, size_id
    `;
    
    const existingItems = bundleItems
      .map(bi => ({ variant_id: bi.variant_id, size_id: bi.size_id }))
      .sort((a, b) => a.variant_id === b.variant_id ? a.size_id - b.size_id : a.variant_id - b.variant_id);
    
    if (JSON.stringify(existingItems) === JSON.stringify(sortedItems)) {
      return item.id;
    }
  }
  
  return null;
};

// Get cart
export const getCart = async (req, res) => {
  const { userId } = req.params;
  const country = req.headers['x-user-country'] || 'Nigeria';
  try {
    // Step 1: Get the cart for the user
    const [cart] = await sql`
      SELECT id, total FROM cart WHERE user_id = ${userId} ORDER BY updated_at DESC LIMIT 1
    `;
    
    // Step 2: If no cart exists, return an empty cart
    if (!cart) {
      const emptyCart = { cartId: null, subtotal: 0, tax: 0, total: 0, items: [] };
      console.log('Get cart payload:', JSON.stringify(emptyCart, null, 2));
      return res.status(200).json(emptyCart);
    }
    
    const cartId = cart.id;
    
    // Step 3: Fetch all cart items
    const cartItems = await sql`
      SELECT 
        ci.id,
        ci.quantity,
        ci.variant_id,
        ci.bundle_id,
        ci.size_id,
        ci.color_name,
        ci.size_name,
        ci.price,
        ci.is_bundle,
        pv.product_id,
        p.name AS product_name,
        pi.image_url AS image_url,
        vs.stock_quantity,
        b.name AS bundle_name,
        bi.image_url AS bundle_image
      FROM cart_items ci
      LEFT JOIN product_variants pv ON ci.variant_id = pv.id
      LEFT JOIN products p ON pv.product_id = p.id
      LEFT JOIN product_images pi ON pi.variant_id = pv.id AND pi.is_primary = TRUE
      LEFT JOIN variant_sizes vs ON vs.variant_id = pv.id AND vs.size_id = ci.size_id
      LEFT JOIN bundles b ON ci.bundle_id = b.id
      LEFT JOIN bundle_images bi ON bi.bundle_id = b.id AND bi.is_primary = TRUE
      WHERE ci.cart_id = ${cartId}
        AND (ci.bundle_id IS NULL OR b.deleted_at IS NULL)
        AND (ci.variant_id IS NULL OR (pv.deleted_at IS NULL AND p.deleted_at IS NULL))
      ORDER BY ci.id
    `;
    
    // Step 4: Group items by variant_id and size_id for single products and handle bundles separately
    const singleItemsMap = new Map();
    const bundleItemsMap = new Map(); // Use a Map to prevent duplicate bundles
    
    for (const item of cartItems) {
      if (item.is_bundle) {
        // Use bundle_id as the key to prevent duplicate bundles
        const key = item.bundle_id;
        if (!bundleItemsMap.has(key)) {
          bundleItemsMap.set(key, item);
        }
      } else {
        const key = `${item.variant_id}-${item.size_id}`;
        if (singleItemsMap.has(key)) {
          // If item already exists, log a warning and skip summing up quantities
          console.warn(`Duplicate item detected for key: ${key}. Skipping.`);
        } else {
          singleItemsMap.set(key, { ...item });
        }
      }
    }
    
    // Step 5: Transform single items to the expected format
    const transformedSingleItems = Array.from(singleItemsMap.values()).map(item => ({
      id: item.id,
      quantity: item.quantity,
      item: {
        id: item.variant_id,
        name: item.product_name,
        price: item.price,
        image: item.image_url,
        size: item.size_name,
        size_id: item.size_id,
        color: item.color_name,
        is_product: true,
        stock_quantity: item.stock_quantity
      }
    }));
    
    // Step 6: Transform bundle items to the expected format
    const bundleItems = Array.from(bundleItemsMap.values());
    const transformedBundleItems = await Promise.all(bundleItems.map(async (row) => {
      const bundleItems = await sql`
        SELECT DISTINCT ON (cbi.variant_id, cbi.size_id)
          cbi.id,
          cbi.variant_id,
          cbi.size_id,
          pv.product_id,
          p.name AS product_name,
          pi.image_url AS image_url,
          c.color_name AS color_name,
          s.size_name AS size_name,
          vs.stock_quantity
        FROM cart_bundle_items cbi
        JOIN product_variants pv ON cbi.variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        JOIN colors c ON pv.color_id = c.id
        JOIN sizes s ON cbi.size_id = s.id
        LEFT JOIN product_images pi ON pi.variant_id = pv.id AND pi.is_primary = TRUE
        LEFT JOIN variant_sizes vs ON vs.variant_id = pv.id AND vs.size_id = cbi.size_id
        WHERE cbi.cart_item_id = ${row.id}
          AND pv.deleted_at IS NULL
          AND p.deleted_at IS NULL
        ORDER BY cbi.variant_id, cbi.size_id
      `;
      
      return {
        id: row.id,
        quantity: row.quantity,
        item: {
          id: row.bundle_id,
          name: row.bundle_name,
          price: row.price,
          image: row.bundle_image,
          is_product: false,
          items: bundleItems.map(bi => ({
            id: bi.id,
            variant_id: bi.variant_id,
            size_id: bi.size_id,
            product_id: bi.product_id,
            product_name: bi.product_name,
            image_url: bi.image_url,
            color_name: bi.color_name,
            size_name: bi.size_name,
            stock_quantity: bi.stock_quantity
          }))
        }
      };
    }));
    
    // Step 7: Combine single items and bundle items
    const items = [...transformedSingleItems, ...transformedBundleItems];
    
    // Step 8: Calculate cart totals
    const { subtotal, tax, total } = calculateCartTotals(items, country);
    
    // Step 9: Update cart total in case of discrepancies
    await sql`
      UPDATE cart SET total = ${total} WHERE id = ${cartId}
    `;
    
    // Step 10: Return the cart payload
    const payload = { cartId, subtotal, tax, total, items };
    console.log('Get cart payload:', JSON.stringify(payload, null, 2));
    res.status(200).json(payload);
  } catch (err) {
    console.error('Get cart error:', err.message, err.stack);
    res.status(500).json({ error: 'Server error' });
  }
};
// Add to cart
// Update the addToCart function in your cartController.js

export const addToCart = async (req, res) => {
  try {
    const { user_id, product_type, variant_id, size_id, quantity, bundle_id, items } = req.body;
    const country = req.headers['x-user-country'] || 'Nigeria';
    console.log('Add to cart request:', { user_id, product_type, variant_id, size_id, quantity, bundle_id, items });
    
    // Validate input
    if (!user_id || !quantity || !product_type || 
        (product_type === 'single' && (!variant_id || !size_id)) || 
        (product_type === 'bundle' && (!bundle_id || !items?.length))) {
      console.error('Missing required fields:', { user_id, product_type, variant_id, size_id, quantity, bundle_id, items });
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    
    if (quantity < 1) {
      console.error('Invalid quantity:', quantity);
      return res.status(400).json({ error: 'Quantity must be a positive integer.' });
    }
    
    await sql.begin(async (sql) => {
      // Get or create cart
      let [cart] = await sql`
        SELECT id FROM cart WHERE user_id = ${user_id} ORDER BY updated_at DESC LIMIT 1
      `;
      
      let cart_id;
      if (!cart) {
        try {
          const [newCart] = await sql`
            INSERT INTO cart (user_id, total) VALUES (${user_id}, 0) RETURNING id
          `;
          cart_id = newCart.id;
        } catch (err) {
          console.error('Error creating cart:', err.message, err.stack);
          throw new Error('Failed to create cart.');
        }
      } else {
        cart_id = cart.id;
      }
      
      console.log('Cart ID:', cart_id);
      
      // Handle single product
      if (product_type === 'single') {
        const { base_price, color_name, size_name } = await validateSingleProduct(sql, variant_id, size_id, quantity);
        
        // First, let's check if there are any existing items for this variant and size
        const [existingItems] = await sql`
          SELECT id, quantity FROM cart_items 
          WHERE cart_id = ${cart_id} AND variant_id = ${variant_id} AND size_id = ${size_id} AND bundle_id IS NULL
        `;
        
        console.log('Existing items for this variant and size:', existingItems);
        
        if (existingItems && existingItems.length > 0) {
          // If there are multiple items, delete all but the first one and update its quantity
          if (existingItems.length > 1) {
            console.log(`Found ${existingItems.length} duplicate items, cleaning up...`);
            
            // Keep the first item and delete the rest
            const keepItem = existingItems[0];
            const totalQuantity = existingItems.reduce((sum, item) => sum + item.quantity, 0) + quantity;
            
            // Update the kept item with the new total quantity
            await sql`
              UPDATE cart_items 
              SET quantity = ${totalQuantity} 
              WHERE id = ${keepItem.id}
            `;
            
            // Delete all other items
            const itemIdsToDelete = existingItems.slice(1).map(item => item.id);
            if (itemIdsToDelete.length > 0) {
              await sql`
                DELETE FROM cart_items 
                WHERE id = ANY(${itemIdsToDelete})
              `;
            }
            
            console.log(`Cleaned up duplicates, updated item ${keepItem.id} with quantity ${totalQuantity}`);
          } else {
            // Just one existing item, update its quantity
            const newQuantity = existingItems[0].quantity + quantity;
            await sql`
              UPDATE cart_items SET quantity = ${newQuantity} WHERE id = ${existingItems[0].id}
            `;
            console.log(`Updated existing item quantity: cart_item_id=${existingItems[0].id}, new_quantity=${newQuantity}`);
          }
        } else {
          // No existing items, add a new one
          await sql`
            INSERT INTO cart_items (cart_id, variant_id, size_id, quantity, is_bundle, price, color_name, size_name)
            VALUES (${cart_id}, ${variant_id}, ${size_id}, ${quantity}, ${false}, ${base_price}, ${color_name}, ${size_name})
          `;
          console.log(`Added new single product: variant_id=${variant_id}, quantity=${quantity}`);
        }
      } 
      // Handle bundle
      else if (product_type === 'bundle') {
        const { bundle_price, bundle_type } = await validateBundle(sql, bundle_id, items, quantity);
        
        // Sort items for consistent comparison
        const sortedItems = items
          .map(item => ({ variant_id: item.variant_id, size_id: item.size_id }))
          .sort((a, b) => a.variant_id === b.variant_id ? a.size_id - b.size_id : a.variant_id - b.variant_id);
        
        // Check for existing bundle with identical items
        const existingCartItemId = await findExistingBundle(sql, cart_id, bundle_id, sortedItems);
        
        if (existingCartItemId) {
          // Increment quantity
          const [existingItem] = await sql`
            SELECT quantity FROM cart_items WHERE id = ${existingCartItemId}
          `;
          
          const newQuantity = existingItem.quantity + quantity;
          await sql`
            UPDATE cart_items SET quantity = ${newQuantity} WHERE id = ${existingCartItemId}
          `;
          console.log(`Incremented bundle quantity: cart_item_id=${existingCartItemId}, new_quantity=${newQuantity}`);
        } else {
          // Add new bundle
          const [insertCartItem] = await sql`
            INSERT INTO cart_items (cart_id, bundle_id, quantity, is_bundle, price)
            VALUES (${cart_id}, ${bundle_id}, ${quantity}, ${true}, ${bundle_type === '5-in-1' ? bundle_price * 1.5 : bundle_price})
            RETURNING id
          `;
          
          const cart_item_id = insertCartItem.id;
          
          for (const item of items) {
            await sql`
              INSERT INTO cart_bundle_items (cart_item_id, variant_id, size_id)
              VALUES (${cart_item_id}, ${item.variant_id}, ${item.size_id})
            `;
          }
          console.log(`Added new bundle: cart_item_id=${cart_item_id}, bundle_id=${bundle_id}`);
        }
      } else {
        console.error('Invalid product type:', product_type);
        throw new Error('Invalid product type.');
      }
      
      // Update cart totals
      const { subtotal, tax, total } = await updateCartTotal(sql, cart_id, country);
      
      // Fetch updated cart for response
      const [updatedCart] = await sql`
        SELECT id, total FROM cart WHERE id = ${cart_id}
      `;
      
      const cartItems = await fetchCartItems(sql, cart_id);
      
      const payload = {
        cartId: updatedCart.id,
        subtotal,
        tax,
        total,
        items: cartItems
      };
      
      console.log('Add to cart response:', JSON.stringify(payload, null, 2));
      return res.status(201).json(payload);
    });
  } catch (err) {
    console.error('Error adding to cart:', err.message, err.stack);
    return res.status(400).json({ error: err.message || 'Failed to add to cart.' });
  }
};


// Remove from cart
export const removeFromCart = async (req, res) => {
  const { id } = req.params;
  
  try {
    await sql.begin(async (sql) => {
      const [cartItem] = await sql`SELECT cart_id FROM cart_items WHERE id = ${id}`;
      if (!cartItem) {
        return res.status(404).json({ error: 'Cart item not found' });
      }
      
      const cartId = cartItem.cart_id;
      
      await sql`DELETE FROM cart_bundle_items WHERE cart_item_id = ${id}`;
      await sql`DELETE FROM cart_items WHERE id = ${id}`;
      
      await sql`
        UPDATE cart SET total = (
          SELECT COALESCE(SUM(ci.price * ci.quantity), 0) 
          FROM cart_items ci 
          WHERE ci.cart_id = ${cartId}
        ) 
        WHERE id = ${cartId}
      `;
      
      res.json({ message: 'Item removed' });
    });
  } catch (err) {
    console.error('Delete cart item error:', err.message, err.stack);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update cart item
export const updateCartItem = async (req, res) => {
  const { id } = req.params;
  let { quantity } = req.body;
  quantity = parseInt(quantity, 10);
  
  if (isNaN(quantity) || quantity < 1) {
    return res.status(400).json({ error: 'Quantity must be a positive integer' });
  }
  
  try {
    await sql.begin(async (sql) => {
      const [cartItem] = await sql`
        SELECT ci.cart_id, ci.bundle_id, ci.variant_id, ci.size_id
        FROM cart_items ci
        WHERE ci.id = ${id}
      `;
      
      if (!cartItem) {
        return res.status(404).json({ error: 'Cart item not found' });
      }
      
      const { cart_id, bundle_id, variant_id, size_id } = cartItem;
      
      // Validate stock for single product
      if (!bundle_id) {
        const [stockResult] = await sql`
          SELECT vs.stock_quantity
          FROM variant_sizes vs
          WHERE vs.variant_id = ${variant_id} AND vs.size_id = ${size_id}
        `;
        
        if (!stockResult || stockResult.stock_quantity < quantity) {
          return res.status(400).json({ 
            error: `Only ${stockResult?.stock_quantity || 0} items available in stock.` 
          });
        }
      } else {
        // Validate stock for bundle items
        const bundleItems = await sql`
          SELECT cbi.variant_id, cbi.size_id, vs.stock_quantity
          FROM cart_bundle_items cbi
          JOIN variant_sizes vs ON vs.variant_id = cbi.variant_id AND vs.size_id = cbi.size_id
          WHERE cbi.cart_item_id = ${id}
        `;
        
        for (const item of bundleItems) {
          if (item.stock_quantity < quantity) {
            return res.status(400).json({ 
              error: `Only ${item.stock_quantity} items available for variant ${item.variant_id}.` 
            });
          }
        }
      }
      
      await sql`UPDATE cart_items SET quantity = ${quantity} WHERE id = ${id}`;
      
      await sql`
        UPDATE cart SET total = (
          SELECT COALESCE(SUM(ci.price * ci.quantity), 0) 
          FROM cart_items ci 
          WHERE ci.cart_id = ${cart_id}
        ) 
        WHERE id = ${cart_id}
      `;
      
      res.json({ message: 'Quantity updated' });
    });
  } catch (err) {
    console.error('Update cart item error:', err.message, err.stack);
    res.status(500).json({ error: 'Server error' });
  }
};

// Clear cart
export const clearCart = async (req, res) => {
  const { userId } = req.params;
  
  try {
    await sql.begin(async (sql) => {
      const [cart] = await sql`SELECT id FROM cart WHERE user_id = ${userId}`;
      if (!cart) {
        return res.status(404).json({ error: 'Cart not found' });
      }
      
      const cartId = cart.id;
      
      await sql`
        DELETE FROM cart_bundle_items 
        WHERE cart_item_id IN (SELECT id FROM cart_items WHERE cart_id = ${cartId})
      `;
      await sql`DELETE FROM cart_items WHERE cart_id = ${cartId}`;
      await sql`UPDATE cart SET total = 0 WHERE id = ${cartId}`;
      
      res.json({ message: 'Cart cleared' });
    });
  } catch (err) {
    console.error('Clear cart error:', err.message, err.stack);
    res.status(500).json({ error: 'Server error' });
  }
};