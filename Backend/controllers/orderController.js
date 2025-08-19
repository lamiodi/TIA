import sql from '../db/index.js';
import dotenv from 'dotenv';
import { Country } from 'country-state-city';
import { sendAdminDeliveryFeeNotification } from '../utils/emailService.js';
dotenv.config();

const shippingOptions = [
  { id: 1, method: 'Delivery within Lagos', total_cost: 4000, estimated_delivery: '3–5 business days' },
  { id: 2, method: 'GIG Logistics (Outside Lagos)', total_cost: 6000, estimated_delivery: '5–7 business days' },
  { id: 3, method: 'Home Delivery – Outside Lagos', total_cost: 10000, estimated_delivery: '7–10 business days' },
];

export const createOrder = async (req, res) => {
  const {
    user_id,
    address_id,
    billing_address_id,
    cart_id,
    total,
    discount = 0,
    delivery_option,
    shipping_method_id,
    shipping_cost,
    payment_method,
    currency,
    reference,
    items,
    note,
    exchange_rate,
    base_currency_total,
    converted_total,
  } = req.body;
  console.log('📥 Create order request:', {
    user_id,
    cart_id,
    delivery_option,
    shipping_method_id,
    shipping_cost,
    currency,
    payment_method,
    exchange_rate,
    discount,
  });
  console.log('📋 Items:', items);
  
  try {
    await sql.begin(async (sql) => {
      // Validate user - handle both cases (with and without deleted_at)
      let [user] = await sql`
        SELECT id, first_name, last_name FROM users 
        WHERE id = ${user_id}
      `;
      
      // If user has deleted_at column, check it's null
      if (user && 'deleted_at' in user) {
        [user] = await sql`
          SELECT id, first_name, last_name FROM users 
          WHERE id = ${user_id} AND deleted_at IS NULL
        `;
      }
      
      if (!user) {
        console.error('Validation failed: User not found');
        throw new Error('User not found');
      }
      
      // Validate shipping address - handle both cases
      let [address] = await sql`
        SELECT id, country, address_line_1, city, state, zip_code FROM addresses 
        WHERE id = ${address_id} AND user_id = ${user_id}
      `;
      
      // If address has deleted_at column, check it's null
      if (address && 'deleted_at' in address) {
        [address] = await sql`
          SELECT id, country, address_line_1, city, state, zip_code FROM addresses 
          WHERE id = ${address_id} AND user_id = ${user_id} AND deleted_at IS NULL
        `;
      }
      
      if (!address) {
        console.error('Validation failed: Shipping address not found');
        throw new Error('Shipping address not found');
      }
      
      // Validate billing address - handle both cases
      let [billingAddress] = await sql`
        SELECT id FROM billing_addresses 
        WHERE id = ${billing_address_id} AND user_id = ${user_id}
      `;
      
      // If billingAddress has deleted_at column, check it's null
      if (billingAddress && 'deleted_at' in billingAddress) {
        [billingAddress] = await sql`
          SELECT id FROM billing_addresses 
          WHERE id = ${billing_address_id} AND user_id = ${user_id} AND deleted_at IS NULL
        `;
      }
      
      if (!billingAddress) {
        console.error('Validation failed: Billing address not found');
        throw new Error('Billing address not found');
      }
      
      // Validate cart - handle both cases
      let [cart] = await sql`
        SELECT id FROM cart WHERE id = ${cart_id} AND user_id = ${user_id}
      `;
      
      // If cart has deleted_at column, check it's null
      if (cart && 'deleted_at' in cart) {
        [cart] = await sql`
          SELECT id FROM cart WHERE id = ${cart_id} AND user_id = ${user_id} AND deleted_at IS NULL
        `;
      }
      
      if (!cart) {
        console.error('Validation failed: Cart not found');
        throw new Error('Cart not found');
      }
      
      // Validate discount
      if (discount < 0) {
        console.error('Validation failed: Discount cannot be negative');
        throw new Error('Discount cannot be negative');
      }
      
      // Validate delivery option
      if (!['standard', 'international'].includes(delivery_option)) {
        console.error('Validation failed: Invalid delivery option');
        throw new Error('Invalid delivery option');
      }
      
      // Validate currency
      if (currency !== 'NGN' && currency !== 'USD') {
        console.error('Validation failed: Invalid currency');
        throw new Error('Invalid currency');
      }
      
      let calculatedSubtotal = 0;
      const orderItems = [];
      
      // Validate and process items
      for (const item of items) {
        if (!item.variant_id && !item.bundle_id) {
          console.error('Validation failed: Item must have either variant_id or bundle_id', item);
          throw new Error('Item must have either variant_id or bundle_id');
        }
        
        if (item.variant_id && item.bundle_id) {
          console.error('Validation failed: Item cannot have both variant_id and bundle_id', item);
          throw new Error('Item cannot have both variant_id and bundle_id');
        }
        
        if (item.price <= 0) {
          console.error(`Validation failed: Invalid price for item: ${item.variant_id || item.bundle_id}`);
          throw new Error(`Invalid price for item: ${item.variant_id || item.bundle_id}`);
        }
        
        if (item.variant_id) {
          // Fetch product variant, using LEFT JOIN for sizes to handle null size_id
          const [variant] = await sql`
            SELECT pv.id, p.name, p.base_price, pi.image_url, c.color_name, s.size_name
            FROM product_variants pv
            JOIN products p ON pv.product_id = p.id
            JOIN colors c ON pv.color_id = c.id
            LEFT JOIN sizes s ON s.id = ${item.size_id}
            LEFT JOIN product_images pi ON pv.id = pi.variant_id AND pi.is_primary = true
            WHERE pv.id = ${item.variant_id}
          `;
          
          if (!variant) {
            console.error(`Validation failed: Product variant ${item.variant_id} not found`);
            throw new Error(`Product variant ${item.variant_id} not found`);
          }
          
          // Check stock, handle case where size_id is null
          let variantSize;
          if (item.size_id) {
            [variantSize] = await sql`
              SELECT stock_quantity FROM variant_sizes 
              WHERE variant_id = ${item.variant_id} AND size_id = ${item.size_id}
            `;
            if (!variantSize) {
              console.error(`Validation failed: Size ${item.size_id} not found for variant ${item.variant_id}`);
              throw new Error(`Size ${item.size_id} not found for variant ${item.variant_id}`);
            }
          } else {
            // Fallback for products without size; adjust based on your schema
            [variantSize] = await sql`
              SELECT stock_quantity FROM variant_sizes 
              WHERE variant_id = ${item.variant_id} LIMIT 1
            `;
            if (!variantSize) {
              console.error(`Validation failed: No stock found for variant ${item.variant_id} without size`);
              throw new Error(`No stock found for variant ${item.variant_id} without size`);
            }
          }
          
          const { stock_quantity } = variantSize;
          if (stock_quantity < item.quantity) {
            console.error(`Validation failed: Insufficient stock for variant ${item.variant_id}, requested: ${item.quantity}, available: ${stock_quantity}`);
            throw new Error(`Insufficient stock for variant ${item.variant_id}`);
          }
          
          // Validate price
          const expectedPrice = currency === 'USD' && exchange_rate > 0
            ? Number((variant.base_price * exchange_rate).toFixed(2))
            : variant.base_price;
          if (Math.abs(expectedPrice - item.price) > 0.01) {
            console.error(`Validation failed: Price mismatch for variant ${item.variant_id}: expected ${expectedPrice} ${currency}, got ${item.price} ${currency}`);
            throw new Error(`Price mismatch for variant ${item.variant_id}: expected ${expectedPrice} ${currency}, got ${item.price} ${currency}`);
          }
          
          calculatedSubtotal += item.price * item.quantity;
          orderItems.push({
            variant_id: item.variant_id,
            size_id: item.size_id || null,
            quantity: item.quantity,
            price: item.price,
            product_name: variant.name,
            image_url: variant.image_url,
            color_name: variant.color_name,
            size_name: variant.size_name,
          });
        } else if (item.bundle_id) {
          // Fetch bundle
          const [bundle] = await sql`
            SELECT b.id, b.name, b.bundle_price, bi.image_url
            FROM bundles b
            LEFT JOIN bundle_images bi ON b.id = bi.bundle_id AND bi.is_primary = true
            WHERE b.id = ${item.bundle_id}
          `;
          
          if (!bundle) {
            console.error(`Validation failed: Bundle ${item.bundle_id} not found`);
            throw new Error(`Bundle ${item.bundle_id} not found`);
          }
          
          // Validate bundle items (from frontend payload)
          const bundleItemsDetails = [];
          if (item.bundle_items && Array.isArray(item.bundle_items)) {
            for (const bi of item.bundle_items) {
              const [variant] = await sql`
                SELECT pv.id AS variant_id, pv.product_id, p.name AS product_name, 
                       c.color_name, s.size_name, pi.image_url
                FROM product_variants pv
                JOIN products p ON pv.product_id = p.id
                JOIN colors c ON pv.color_id = c.id
                LEFT JOIN sizes s ON s.id = ${bi.size_id}
                LEFT JOIN product_images pi ON pv.id = pi.variant_id AND pi.is_primary = true
                WHERE pv.id = ${bi.variant_id}
              `;
              
              if (!variant) {
                console.error(`Validation failed: Bundle item variant ${bi.variant_id} not found`);
                throw new Error(`Bundle item variant ${bi.variant_id} not found`);
              }
              
              let variantSize;
              if (bi.size_id) {
                [variantSize] = await sql`
                  SELECT stock_quantity FROM variant_sizes 
                  WHERE variant_id = ${bi.variant_id} AND size_id = ${bi.size_id}
                `;
                if (!variantSize) {
                  console.error(`Validation failed: Size ${bi.size_id} not found for bundle item variant ${bi.variant_id}`);
                  throw new Error(`Size ${bi.size_id} not found for bundle item variant ${bi.variant_id}`);
                }
              } else {
                [variantSize] = await sql`
                  SELECT stock_quantity FROM variant_sizes 
                  WHERE variant_id = ${bi.variant_id} LIMIT 1
                `;
                if (!variantSize) {
                  console.error(`Validation failed: No stock found for bundle item variant ${bi.variant_id} without size`);
                  throw new Error(`No stock found for bundle item variant ${bi.variant_id} without size`);
                }
              }
              
              if (variantSize.stock_quantity < item.quantity) {
                console.error(`Validation failed: Insufficient stock for bundle item variant ${bi.variant_id}, requested: ${item.quantity}, available: ${variantSize.stock_quantity}`);
                throw new Error(`Insufficient stock for bundle item variant ${bi.variant_id}`);
              }
              
              bundleItemsDetails.push({
                variant_id: bi.variant_id,
                size_id: bi.size_id || null,
                product_name: variant.product_name,
                color_name: variant.color_name,
                size_name: variant.size_name,
                image_url: variant.image_url,
              });
            }
          } else {
            console.warn(`No bundle_items provided for bundle ${item.bundle_id}; assuming no stock update needed`);
          }
          
          // Validate bundle price
          const expectedPrice = currency === 'USD' && exchange_rate > 0
            ? Number((bundle.bundle_price * exchange_rate).toFixed(2))
            : bundle.bundle_price;
          if (Math.abs(expectedPrice - item.price) > 0.01) {
            console.error(`Validation failed: Price mismatch for bundle ${item.bundle_id}: expected ${expectedPrice} ${currency}, got ${item.price} ${currency}`);
            throw new Error(`Price mismatch for bundle ${item.bundle_id}: expected ${expectedPrice} ${currency}, got ${item.price} ${currency}`);
          }
          
          calculatedSubtotal += item.price * item.quantity;
          orderItems.push({
            bundle_id: item.bundle_id,
            quantity: item.quantity,
            price: item.price,
            product_name: bundle.name,
            image_url: bundle.image_url,
            bundle_details: JSON.stringify(bundleItemsDetails),
          });
        }
      }
      
      // Calculate shipping and tax
      if (delivery_option === 'standard' && address.country.toLowerCase() === 'nigeria') {
        if (shipping_cost < 0) {
          console.error('Validation failed: Invalid shipping cost');
          throw new Error('Invalid shipping cost');
        }
        calculatedSubtotal += shipping_cost;
      } else if (delivery_option === 'international') {
        calculatedSubtotal += 0; // Shipping cost TBD
      }
      
      const calculatedTax = delivery_option === 'international' ? Number((calculatedSubtotal * 0.05).toFixed(2)) : 0;
      const calculatedTotal = Number((calculatedSubtotal - discount + calculatedTax).toFixed(2));
      
      if (Math.abs(calculatedTotal - total) > 0.01) {
        console.error(`Validation failed: Total mismatch: calculated ${calculatedTotal} ${currency}, provided ${total} ${currency}, discount ${discount}`);
        throw new Error(`Total mismatch: calculated ${calculatedTotal} ${currency}, provided ${total} ${currency}, discount ${discount}`);
      }
      
      // Validate base_currency_total
      const expectedBaseTotal = currency === 'USD' && exchange_rate > 0
        ? Math.round(total / exchange_rate)
        : total;
      if (Math.abs(expectedBaseTotal - base_currency_total) > 1) {
        console.error(`Validation failed: Base currency total mismatch: expected ${expectedBaseTotal} NGN, got ${base_currency_total} NGN`);
        throw new Error(`Base currency total mismatch: expected ${expectedBaseTotal} NGN, got ${base_currency_total} NGN`);
      }
      
      // Insert order
      const [order] = await sql`
        INSERT INTO orders (
          user_id, address_id, billing_address_id, cart_id, total, discount, tax, shipping_method_id, shipping_cost,
          shipping_country, payment_method, payment_status, status, currency, reference, note, exchange_rate,
          base_currency_total, converted_total, delivery_fee_paid
        ) VALUES (
          ${user_id}, ${address_id}, ${billing_address_id}, ${cart_id}, ${total}, ${discount}, 
          ${calculatedTax}, ${shipping_method_id}, ${shipping_cost},
          ${address.country}, ${payment_method}, 'pending', 'pending', ${currency}, ${reference}, ${note}, 
          ${exchange_rate}, ${base_currency_total}, ${converted_total}, 
          ${address.country.toLowerCase() === 'nigeria' ? true : false}
        )
        RETURNING id
      `;
      
      const orderId = order.id;
      
      // Insert order items and update stock
      for (const item of orderItems) {
        await sql`
          INSERT INTO order_items (
            order_id, variant_id, bundle_id, quantity, price, size_id, product_name, image_url, 
            color_name, size_name, bundle_details
          ) VALUES (
            ${orderId}, ${item.variant_id || null}, ${item.bundle_id || null}, ${item.quantity}, 
            ${item.price}, ${item.size_id || null}, ${item.product_name}, ${item.image_url},
            ${item.color_name || null}, ${item.size_name || null}, ${item.bundle_details || '[]'}
          )
        `;
        
        if (item.variant_id) {
          // Update stock for variant
          if (item.size_id) {
            const [updateResult] = await sql`
              UPDATE variant_sizes 
              SET stock_quantity = stock_quantity - ${item.quantity} 
              WHERE variant_id = ${item.variant_id} AND size_id = ${item.size_id}
              RETURNING stock_quantity
            `;
            if (!updateResult) {
              console.error(`Stock update failed: No stock found for variant ${item.variant_id}, size ${item.size_id}`);
              throw new Error(`Failed to update stock for variant ${item.variant_id}, size ${item.size_id}`);
            }
            console.log(`Updated stock for variant ${item.variant_id}, size ${item.size_id}: ${updateResult.stock_quantity}`);
          } else {
            const [updateResult] = await sql`
              UPDATE variant_sizes 
              SET stock_quantity = stock_quantity - ${item.quantity} 
              WHERE variant_id = ${item.variant_id} LIMIT 1
              RETURNING stock_quantity
            `;
            if (!updateResult) {
              console.error(`Stock update failed: No stock found for variant ${item.variant_id} without size`);
              throw new Error(`Failed to update stock for variant ${item.variant_id} without size`);
            }
            console.log(`Updated stock for variant ${item.variant_id} without size: ${updateResult.stock_quantity}`);
          }
        } else if (item.bundle_id) {
          const bundleItems = item.bundle_details ? JSON.parse(item.bundle_details) : [];
          for (const bi of bundleItems) {
            if (bi.size_id) {
              const [updateResult] = await sql`
                UPDATE variant_sizes 
                SET stock_quantity = stock_quantity - ${item.quantity} 
                WHERE variant_id = ${bi.variant_id} AND size_id = ${bi.size_id}
                RETURNING stock_quantity
              `;
              if (!updateResult) {
                console.error(`Stock update failed: No stock found for bundle item variant ${bi.variant_id}, size ${bi.size_id}`);
                throw new Error(`Failed to update stock for bundle item variant ${bi.variant_id}, size ${bi.size_id}`);
              }
              console.log(`Updated stock for bundle item variant ${bi.variant_id}, size ${bi.size_id}: ${updateResult.stock_quantity}`);
            } else {
              const [updateResult] = await sql`
                UPDATE variant_sizes 
                SET stock_quantity = stock_quantity - ${item.quantity} 
                WHERE variant_id = ${bi.variant_id} LIMIT 1
                RETURNING stock_quantity
              `;
              if (!updateResult) {
                console.error(`Stock update failed: No stock found for bundle item variant ${bi.variant_id} without size`);
                throw new Error(`Failed to update stock for bundle item variant ${bi.variant_id} without size`);
              }
              console.log(`Updated stock for bundle item variant ${bi.variant_id} without size: ${updateResult.stock_quantity}`);
            }
          }
        }
      }
      
      // Send notification for international orders
      if (address.country.toLowerCase() !== 'nigeria') {
        await sendAdminDeliveryFeeNotification(
          orderId,
          `${user.first_name} ${user.last_name}`,
          address.country,
          {
            address_line_1: address.address_line_1,
            city: address.city,
            state: address.state || '',
            zip_code: address.zip_code,
          }
        );
      }
      
      console.log(`✅ Created order ${orderId} for user ${user_id} with reference ${reference}, discount ${discount}`);
      res.status(201).json({ order: { id: orderId, reference, discount } });
    });
  } catch (err) {
    console.error('❌ Error creating order:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
};

export const verifyOrderByReference = async (req, res) => {
  try {
    const { reference } = req.params;
    if (!reference) {
      return res.status(400).json({ error: 'Reference is required' });
    }
    
    // First try without deleted_at
    let [order] = await sql`
      SELECT 
        o.id, o.user_id, o.total, o.discount, o.tax, o.shipping_method_id, o.shipping_cost, o.shipping_country, 
        o.payment_method, o.payment_status, o.status, o.created_at, o.reference, o.note, o.currency,
        o.delivery_fee_paid
      FROM orders o
      WHERE o.reference = ${reference}
    `;
    
    // If order exists and has deleted_at column, check it's null
    if (order && 'deleted_at' in order) {
      [order] = await sql`
        SELECT 
          o.id, o.user_id, o.total, o.discount, o.tax, o.shipping_method_id, o.shipping_cost, o.shipping_country, 
          o.payment_method, o.payment_status, o.status, o.created_at, o.reference, o.note, o.currency,
          o.delivery_fee_paid
        FROM orders o
        WHERE o.reference = ${reference} AND o.deleted_at IS NULL
      `;
    }
    
    if (!order) {
      console.log(`❌ Order not found for reference: ${reference}`);
      return res.status(404).json({ error: 'Order not found' });
    }
    
    console.log(`✅ verifyOrderByReference: Fetched order with reference ${reference}:`, order);
    res.status(200).json(order);
  } catch (err) {
    console.error('❌ Error verifying order by reference:', err.message);
    res.status(500).json({ error: 'Failed to verify order' });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    await sql.begin(async (sql) => {
      // First try without deleted_at
      let [order] = await sql`SELECT * FROM orders WHERE id = ${orderId}`;
      
      // If order exists and has deleted_at column, check it's null
      if (order && 'deleted_at' in order) {
        [order] = await sql`SELECT * FROM orders WHERE id = ${orderId} AND deleted_at IS NULL`;
      }
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      const items = await sql`SELECT * FROM order_items WHERE order_id = ${orderId}`;
      const bundleItems = await sql`SELECT * FROM order_bundle_items WHERE order_id = ${orderId}`;
      
      for (const item of items) {
        const [cartItem] = await sql`
          SELECT size_id FROM cart_items 
          WHERE variant_id = ${item.variant_id} AND cart_id = ${order.cart_id}
        `;
        
        if (cartItem && cartItem.size_id) {
          await sql`
            UPDATE variant_sizes 
            SET stock_quantity = stock_quantity + ${item.quantity} 
            WHERE variant_id = ${item.variant_id} AND size_id = ${cartItem.size_id}
          `;
        }
      }
      
      for (const item of bundleItems) {
        const bundleItemsDetails = await sql`
          SELECT bi.variant_id, vs.size_id, vs.stock_quantity
          FROM bundle_items bi
          JOIN variant_sizes vs ON vs.variant_id = bi.variant_id
          WHERE bi.bundle_id = ${item.bundle_id}
        `;
        
        for (const bi of bundleItemsDetails) {
          await sql`
            UPDATE variant_sizes 
            SET stock_quantity = stock_quantity + ${item.quantity} 
            WHERE variant_id = ${bi.variant_id} AND size_id = ${bi.size_id}
          `;
        }
      }
      
      await sql`DELETE FROM order_bundle_items WHERE order_id = ${orderId}`;
      await sql`DELETE FROM order_items WHERE order_id = ${orderId}`;
      await sql`DELETE FROM orders WHERE id = ${orderId}`;
      
      console.log(`✅ Cancelled order ${orderId}`);
      res.json({ message: 'Order cancelled and stock restored' });
    });
  } catch (err) {
    console.error('❌ Error cancelling order:', err.message);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
};

export const getOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user.id !== parseInt(userId) && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    // First try without deleted_at
    let orders = await sql`
      SELECT 
        o.id, o.user_id, o.total, o.discount, o.tax, o.shipping_method, o.shipping_cost, o.shipping_country, 
        o.payment_method, o.payment_status, o.status, o.created_at, o.reference, o.note, o.currency
      FROM orders o
      WHERE o.user_id = ${userId}
      ORDER BY o.created_at DESC
    `;
    
    // If orders exist and have deleted_at column, filter out deleted ones
    if (orders.length > 0 && 'deleted_at' in orders[0]) {
      orders = await sql`
        SELECT 
          o.id, o.user_id, o.total, o.discount, o.tax, o.shipping_method, o.shipping_cost, o.shipping_country, 
          o.payment_method, o.payment_status, o.status, o.created_at, o.reference, o.note, o.currency
        FROM orders o
        WHERE o.user_id = ${userId} AND o.deleted_at IS NULL
        ORDER BY o.created_at DESC
      `;
    }
    
    const formattedOrders = orders.map(order => ({
      ...order,
      shipping_country_name: Country.getAllCountries().find(c => c.name.toLowerCase() === order.shipping_country.toLowerCase())?.name || order.shipping_country,
    }));
    
    console.log(`getOrdersByUser: Fetched orders for user ${userId}:`, orders);
    res.status(200).json(formattedOrders);
  } catch (err) {
    console.error('❌ Error fetching user orders:', err.message);
    res.status(500).json({ error: 'Failed to fetch user orders' });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission to access this order
    if (!req.user.isAdmin) {
      // First try without deleted_at
      let [orderCheck] = await sql`SELECT user_id FROM orders WHERE id = ${id}`;
      
      // If order exists and has deleted_at column, check it's null
      if (orderCheck && 'deleted_at' in orderCheck) {
        [orderCheck] = await sql`SELECT user_id FROM orders WHERE id = ${id} AND deleted_at IS NULL`;
      }
      
      if (!orderCheck || req.user.id !== orderCheck.user_id) {
        return res.status(403).json({ error: 'Unauthorized access' });
      }
    }
    
    // First try without deleted_at
    let [order] = await sql`
      SELECT 
        o.*, 
        u.first_name, u.last_name, u.email,
        a.address_line_1, a.address_line_2, a.city, a.state, a.zip_code, a.country as shipping_country_code,
        ba.full_name as billing_full_name, ba.email as billing_email, ba.phone_number, 
        ba.address_line_1 as billing_address_line_1, ba.address_line_2 as billing_address_line_2,
        ba.city as billing_city, ba.state as billing_state, ba.zip_code as billing_zip_code
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN addresses a ON o.address_id = a.id
      JOIN billing_addresses ba ON o.billing_address_id = ba.id
      WHERE o.id = ${id}
    `;
    
    // If order exists and has deleted_at column, check it's null
    if (order && 'deleted_at' in order) {
      [order] = await sql`
        SELECT 
          o.*, 
          u.first_name, u.last_name, u.email,
          a.address_line_1, a.address_line_2, a.city, a.state, a.zip_code, a.country as shipping_country_code,
          ba.full_name as billing_full_name, ba.email as billing_email, ba.phone_number, 
          ba.address_line_1 as billing_address_line_1, ba.address_line_2 as billing_address_line_2,
          ba.city as billing_city, ba.state as billing_state, ba.zip_code as billing_zip_code
        FROM orders o
        JOIN users u ON o.user_id = u.id
        JOIN addresses a ON o.address_id = a.id
        JOIN billing_addresses ba ON o.billing_address_id = ba.id
        WHERE o.id = ${id} AND o.deleted_at IS NULL
      `;
    }
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const items = await sql`
      SELECT oi.*, p.name as product_name
      FROM order_items oi
      LEFT JOIN product_variants pv ON oi.variant_id = pv.id
      LEFT JOIN products p ON pv.product_id = p.id
      WHERE oi.order_id = ${id}
    `;
    
    const bundleItems = await sql`
      SELECT obi.*, b.name as bundle_name
      FROM order_bundle_items obi
      JOIN bundles b ON obi.bundle_id = b.id
      WHERE obi.order_id = ${id}
    `;
    
    const formattedOrder = {
      ...order,
      shipping_country_name: Country.getAllCountries().find(c => c.name.toLowerCase() === order.shipping_country.toLowerCase())?.name || order.shipping_country,
      items,
      bundle_items: bundleItems,
    };
    
    console.log(`getOrderById: Fetched order ${id}:`, formattedOrder);
    res.status(200).json(formattedOrder);
  } catch (err) {
    console.error('❌ Error fetching order:', err.message);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};