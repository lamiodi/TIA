// cartController.js
import sql from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';

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

// Helper function to calculate cart totals
const calculateCartTotals = (items, country) => {
  const subtotal = items.reduce((sum, row) => sum + (parseFloat(row.item.price) * row.quantity), 0);
  const tax = country === 'Nigeria' ? 0 : subtotal * 0.05;
  const total = subtotal + tax;
  return { subtotal, tax, total };
};

// Helper function to fetch cart items
const fetchCartItems = async (sql, cartId) => {
  const cartItems = await sql`
    SELECT
      ci.id,
      ci.quantity::INTEGER,
      json_build_object(
        'id', ci.variant_id,
        'name', p.name,
        'price', ci.price,
        'image', pi.image_url,
        'size', ci.size_name,
        'size_id', ci.size_id,
        'color', ci.color_name,
        'is_product', true,
        'stock_quantity', vs.stock_quantity
      ) AS item
    FROM cart_items ci
    JOIN product_variants pv ON ci.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
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

// Guest cart functions
export const getGuestCart = async (req, res) => {
  try {
    // For guest carts, we'll return an empty cart since everything is handled on the frontend
    // This endpoint can be used to validate or sync guest carts if needed in the future
    const emptyCart = { cartId: null, subtotal: 0, tax: 0, total: 0, items: [] };
    console.log('Get guest cart payload:', JSON.stringify(emptyCart, null, 2));
    res.status(200).json(emptyCart);
  } catch (err) {
    console.error('Get guest cart error:', err.message, err.stack);
    res.status(500).json({ error: 'Server error' });
  }
};

export const addToGuestCart = async (req, res) => {
  try {
    // For guest carts, we'll just validate the request and return success
    // The actual cart management is handled on the frontend with localStorage
    const { product_type, variant_id, size_id, quantity, bundle_id, items } = req.body;
    
    // Validate input
    if (!quantity || !product_type ||
        (product_type === 'single' && (!variant_id || !size_id)) ||
        (product_type === 'bundle' && (!bundle_id || !items?.length))) {
      console.error('Missing required fields for guest cart:', { product_type, variant_id, size_id, quantity, bundle_id, items });
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    
    if (quantity < 1) {
      console.error('Invalid quantity for guest cart:', quantity);
      return res.status(400).json({ error: 'Quantity must be a positive integer.' });
    }
    
    // Return success response with empty cart data
    // The frontend will handle the actual cart management
    const response = {
      message: 'Guest cart item added successfully',
      cartId: null,
      subtotal: 0,
      tax: 0,
      total: 0,
      items: []
    };
    
    console.log('Add to guest cart response:', JSON.stringify(response, null, 2));
    res.status(201).json(response);
  } catch (err) {
    console.error('Add to guest cart error:', err.message, err.stack);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateGuestCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    let { quantity } = req.body;
    quantity = parseInt(quantity, 10);

    console.log('Backend: Updating guest cart item', { id, quantity });

    if (isNaN(quantity) || quantity < 1) {
      console.error('Backend: Invalid quantity for guest cart', { quantity });
      return res.status(400).json({ error: 'Quantity must be a positive integer' });
    }

    // For guest carts, we'll just validate and return success
    // The frontend handles the actual cart management
    console.log('Backend: Guest cart item updated successfully', { id, quantity });
    res.json({ message: 'Guest cart item updated successfully' });
  } catch (err) {
    console.error('Backend: Update guest cart item error:', err.message, err.stack);
    res.status(500).json({ error: `Server error: ${err.message}` });
  }
};

export const removeGuestCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Backend: Removing guest cart item', { id });

    // For guest carts, we'll just validate and return success
    // The frontend handles the actual cart management
    console.log('Backend: Guest cart item removed successfully', { id });
    res.json({ message: 'Guest cart item removed successfully' });
  } catch (err) {
    console.error('Backend: Remove guest cart item error:', err.message, err.stack);
    res.status(500).json({ error: `Server error: ${err.message}` });
  }
};

export const clearGuestCart = async (req, res) => {
  try {
    const { guestId } = req.params;
    console.log('Backend: Clearing guest cart for guestId:', guestId);

    // For guest carts, we'll just validate and return success
    // The frontend handles the actual cart management
    console.log('Backend: Guest cart cleared successfully for guestId:', guestId);
    res.json({ message: 'Guest cart cleared successfully' });
  } catch (err) {
    console.error('Backend: Clear guest cart error:', err.message, err.stack);
    res.status(500).json({ error: `Server error: ${err.message}` });
  }
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
    const cartItems = await fetchCartItems(sql, cartId);
    
    // Step 4: Calculate cart totals
    const { subtotal, tax, total } = calculateCartTotals(cartItems, country);
    
    // Step 5: Update cart total in case of discrepancies
    await sql`
      UPDATE cart SET total = ${total} WHERE id = ${cartId}
    `;
    
    // Step 6: Return the cart payload
    const payload = { cartId, subtotal, tax, total, items: cartItems };
    console.log('Get cart payload:', JSON.stringify(payload, null, 2));
    res.status(200).json(payload);
  } catch (err) {
    console.error('Get cart error:', err.message, err.stack);
    res.status(500).json({ error: 'Server error' });
  }
};

// Add to cart
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
        const existingItems = await sql`
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

  console.log('Backend: Updating cart item', { id, quantity });

  if (isNaN(quantity) || quantity < 1) {
    console.error('Backend: Invalid quantity', { quantity });
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
        console.error('Backend: Cart item not found', { id });
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
          console.error('Backend: Insufficient stock', {
            variant_id,
            size_id,
            requested: quantity,
            available: stockResult?.stock_quantity || 0,
          });
          return res.status(400).json({
            error: `Only ${stockResult?.stock_quantity || 0} items available in stock.`,
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
            console.error('Backend: Insufficient stock for bundle item', {
              variant_id: item.variant_id,
              size_id: item.size_id,
              requested: quantity,
              available: item.stock_quantity,
            });
            return res.status(400).json({
              error: `Only ${item.stock_quantity} items available for variant ${item.variant_id}.`,
            });
          }
        }
      }

      await sql`
        UPDATE cart_items SET quantity = ${quantity} WHERE id = ${id}
      `;

      await sql`
        UPDATE cart SET total = (
          SELECT COALESCE(SUM(ci.price * ci.quantity), 0) 
          FROM cart_items ci 
          WHERE ci.cart_id = ${cart_id}
        ) 
        WHERE id = ${cart_id}
      `;

      console.log('Backend: Cart item updated successfully', { id, quantity });
      res.json({ message: 'Quantity updated' });
    });
  } catch (err) {
    console.error('Backend: Update cart item error:', err.message, err.stack);
    res.status(500).json({ error: `Server error: ${err.message}` });
  }
};

// Clear cart
export const clearCart = async (req, res) => {
  const { userId } = req.params;

  console.log('Backend: Clearing cart for userId:', userId);

  try {
    await sql.begin(async (sql) => {
      const [cart] = await sql`
        SELECT id FROM cart WHERE user_id = ${userId}
      `;
      if (!cart) {
        console.error('Backend: Cart not found for userId:', userId);
        return res.status(404).json({ error: 'Cart not found' });
      }

      const cartId = cart.id;

      await sql`
        DELETE FROM cart_bundle_items 
        WHERE cart_item_id IN (SELECT id FROM cart_items WHERE cart_id = ${cartId})
      `;
      await sql`
        DELETE FROM cart_items WHERE cart_id = ${cartId}
      `;
      await sql`
        UPDATE cart SET total = 0 WHERE id = ${cartId}
      `;

      console.log('Backend: Cart cleared successfully for userId:', userId);
      res.json({ message: 'Cart cleared' });
    });
  } catch (err) {
    console.error('Backend: Clear cart error:', err.message, err.stack);
    res.status(500).json({ error: `Server error: ${err.message}` });
  }
};

// POST fallback for updateCartItem
export const updateCartItemPost = async (req, res) => {
  console.log('Backend: POST /api/cart/:id called as fallback');
  return updateCartItem(req, res);
};

// POST fallback for clearCart
export const clearCartPost = async (req, res) => {
  console.log('Backend: POST /api/cart/clear/:userId called as fallback');
  return clearCart(req, res);
};