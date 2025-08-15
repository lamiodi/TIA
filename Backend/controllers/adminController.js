// AdminController.js
import sql from '../db/index.js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const getAllOrdersForAdmin = async (req, res) => {
  try {
    const orders = await sql`
      SELECT 
        o.id,
        o.user_id,
        o.created_at AS order_date,
        o.total AS total_amount,
        o.status,
        o.shipping_method,
        o.shipping_cost,
        o.payment_method,
        o.payment_status,
        o.reference,
        o.created_at,
        o.updated_at,
        o.address_id,
        o.billing_address_id,
        o.currency,
        o.delivery_fee,
        o.delivery_fee_paid,
        u.email AS user_email,
        u.first_name,
        u.last_name,
        COALESCE(a.country, o.shipping_country) AS shipping_country
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN addresses a ON o.address_id = a.id
      WHERE o.deleted_at IS NULL
      ORDER BY o.created_at DESC
    `;
    console.log('getAllOrdersForAdmin: Fetched orders:', orders.length);
    res.json(orders);
  } catch (error) {
    console.error('getAllOrdersForAdmin error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getAllUsersForAdmin = async (req, res) => {
  try {
    const users = await sql`
      SELECT 
        u.id AS user_id,
        u.first_name,
        u.last_name,
        u.username,
        u.email,
        u.phone_number,
        u.is_admin,
        u.created_at,
        u.updated_at,
        COALESCE(SUM(o.total), 0) AS total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id AND o.deleted_at IS NULL
      WHERE u.deleted_at IS NULL
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `;
    console.log('getAllUsersForAdmin: Fetched users:', users.length);
    res.json(users);
  } catch (error) {
    console.error('getAllUsersForAdmin error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getUserAddresses = async (req, res) => {
  try {
    const { userId } = req.params;
    const parsedUserId = parseInt(userId, 10);
    console.log('getUserAddresses: Received userId:', parsedUserId, 'Type:', typeof parsedUserId);
    
    if (!parsedUserId || isNaN(parsedUserId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const addresses = await sql`
      SELECT 
        a.id,
        a.title,
        a.address_line_1,
        a.landmark,
        a.city,
        a.state,
        a.zip_code,
        a.country
      FROM addresses a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.user_id = ${parsedUserId} AND a.deleted_at IS NULL
    `;
    
    console.log('getUserAddresses: Fetched addresses for user', parsedUserId, ':', addresses);
    res.json(addresses);
  } catch (error) {
    console.error('getUserAddresses error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getCompleteOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId || isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }
    
    console.log(`Starting fetch for orderId: ${orderId}`);
    
    await sql.begin(async (sql) => {
      const [order] = await sql`
        SELECT 
          o.*, 
          u.first_name, u.last_name, u.email, u.phone_number
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.id = ${orderId} AND o.deleted_at IS NULL
      `;
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      let shippingAddress = null;
      if (order.address_id) {
        [shippingAddress] = await sql`
          SELECT 
            a.id, a.title, a.address_line_1, a.landmark, a.city, 
            a.state, a.zip_code, a.country
          FROM addresses a
          WHERE a.id = ${order.address_id} AND a.deleted_at IS NULL
        `;
      }
      
      let billingAddress = null;
      if (order.billing_address_id) {
        [billingAddress] = await sql`
          SELECT 
            ba.id, ba.full_name, ba.email, ba.phone_number, 
            ba.address_line_1, ba.city, ba.state, 
            ba.zip_code, ba.country
          FROM billing_addresses ba
          WHERE ba.id = ${order.billing_address_id} AND ba.deleted_at IS NULL
        `;
      }
      
      const items = await sql`
        SELECT 
          oi.id, oi.variant_id, oi.quantity, oi.price, oi.size_id, 
          oi.product_name, oi.color_name, oi.size_name, oi.image_url
        FROM order_items oi
        WHERE oi.order_id = ${orderId} AND oi.bundle_id IS NULL
      `;
      
      const bundleItems = await sql`
        SELECT 
          oi.id, oi.quantity, oi.price, oi.bundle_id, oi.product_name, 
          oi.image_url, oi.bundle_details
        FROM order_items oi
        WHERE oi.order_id = ${orderId} AND oi.bundle_id IS NOT NULL
      `;
      
      const variantsNeedingImages = [];
      items.forEach(item => {
        if (!item.image_url && item.variant_id) {
          variantsNeedingImages.push(item.variant_id);
        }
      });
      
      bundleItems.forEach(item => {
        if (item.bundle_details) {
          let bundleContents = typeof item.bundle_details === 'string' ? JSON.parse(item.bundle_details) : item.bundle_details;
          bundleContents.forEach(content => {
            if (!content.image_url && content.variant_id) {
              variantsNeedingImages.push(content.variant_id);
            }
          });
        }
      });
      
      let variantImages = {};
      if (variantsNeedingImages.length > 0) {
        const images = await sql`
          SELECT variant_id, image_url
          FROM product_images
          WHERE variant_id = ANY(${variantsNeedingImages}) AND is_primary = true
        `;
        
        images.forEach(row => {
          variantImages[row.variant_id] = row.image_url;
        });
      }
      
      const processedItems = items.map(item => {
        const imageUrl = item.image_url || (item.variant_id ? variantImages[item.variant_id] : null);
        const images = imageUrl ? [imageUrl] : [];
        return {
          ...item,
          primary_image_url: imageUrl,
          additional_images: [],
          images: images,
        };
      });
      
      const processedBundleItems = bundleItems.map(item => {
        let bundleContents = [];
        if (item.bundle_details) {
          try {
            bundleContents = typeof item.bundle_details === 'string' ? JSON.parse(item.bundle_details) : item.bundle_details;
            if (!Array.isArray(bundleContents)) bundleContents = [];
          } catch (e) {
            console.error(`Failed to parse bundle_details for orderItemId: ${item.id}: ${e.message}`);
            bundleContents = [];
          }
        }
        
        const images = item.image_url ? [imageUrl] : [];
        const processedBundleContents = bundleContents.map(content => {
          const imageUrl = content.image_url || (content.variant_id ? variantImages[content.variant_id] : null);
          const contentImages = imageUrl ? [imageUrl] : [];
          return {
            product_id: content.variant_id || content.product_id || null,
            product_name: content.product_name || 'N/A',
            color_name: content.color_name || null,
            size_name: content.size_name || null,
            primary_image_url: imageUrl,
            additional_images: [],
            images: contentImages,
          };
        });
        
        return {
          ...item,
          bundle_name: item.product_name || 'Unnamed Bundle',
          bundle_image_url: item.image_url,
          bundle_additional_images: [],
          images: images,
          bundle_items: processedBundleContents,
        };
      });
      
      const completeOrder = {
        user: {
          id: order.user_id,
          first_name: order.first_name || 'N/A',
          last_name: order.last_name || 'N/A',
          email: order.email || 'N/A',
          phone_number: order.phone_number || 'N/A',
        },
        shippingAddress,
        billingAddress,
        items: processedItems,
        bundleItems: processedBundleItems,
        order: {
          id: order.id,
          user_id: order.user_id,
          cart_id: order.cart_id,
          address_id: order.address_id,
          billing_address_id: order.billing_address_id,
          total: order.total || 0,
          tax: order.tax || 0,
          shipping_method: order.shipping_method || 'N/A',
          shipping_method_id: order.shipping_method_id,
          shipping_cost: order.shipping_cost || 0,
          shipping_country: order.shipping_country || 'N/A',
          payment_method: order.payment_method || 'N/A',
          payment_status: order.payment_status || 'N/A',
          status: order.status || 'pending',
          created_at: order.created_at,
          reference: order.reference || 'N/A',
          note: order.note || '',
          currency: order.currency || 'NGN',
          delivery_fee: order.delivery_fee || 0,
          delivery_fee_paid: order.delivery_fee_paid || false,
        },
      };
      
      res.status(200).json(completeOrder);
    });
  } catch (err) {
    console.error(`Error fetching order details for orderId: ${req.params.orderId}: ${err.message}`, err.stack);
    res.status(500).json({ error: 'Failed to fetch order details', details: err.message });
  }
};

export const getAnalyticsData = async (req, res) => {
  try {
    await sql.begin(async (sql) => {
      // Total Revenue
      const [revenueResult] = await sql`
        SELECT COALESCE(SUM(total), 0) AS total_revenue
        FROM orders
        WHERE deleted_at IS NULL AND payment_status = 'completed'
      `;
      const totalRevenue = parseFloat(revenueResult.total_revenue) || 0;
      
      // Total Orders
      const [ordersResult] = await sql`
        SELECT COUNT(*) AS total_orders
        FROM orders
        WHERE deleted_at IS NULL
      `;
      const totalOrders = parseInt(ordersResult.total_orders) || 0;
      
      // Total Customers
      const [customersResult] = await sql`
        SELECT COUNT(DISTINCT user_id) AS total_customers
        FROM orders
        WHERE deleted_at IS NULL
      `;
      const totalCustomers = parseInt(customersResult.total_customers) || 0;
      
      // Average Order Value
      const [avgOrderResult] = await sql`
        SELECT COALESCE(AVG(total), 0) AS avg_order_value
        FROM orders
        WHERE deleted_at IS NULL AND payment_status = 'completed'
      `;
      const avgOrderValue = parseFloat(avgOrderResult.avg_order_value) || 0;
      
      // Revenue Growth (vs previous 30 days)
      const [revenueGrowthResult] = await sql`
        SELECT 
          COALESCE(SUM(total), 0) AS current_revenue
        FROM orders
        WHERE deleted_at IS NULL 
          AND payment_status = 'completed'
          AND created_at >= NOW() - INTERVAL '30 days'
      `;
      const currentRevenue = parseFloat(revenueGrowthResult.current_revenue) || 0;
      
      const [prevRevenueResult] = await sql`
        SELECT COALESCE(SUM(total), 0) AS prev_revenue
        FROM orders
        WHERE deleted_at IS NULL 
          AND payment_status = 'completed'
          AND created_at >= NOW() - INTERVAL '60 days'
          AND created_at < NOW() - INTERVAL '30 days'
      `;
      const prevRevenue = parseFloat(prevRevenueResult.prev_revenue) || 0;
      const revenueGrowth = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue * 100).toFixed(1) : 0;
      
      // Order Growth (vs previous 30 days)
      const [orderGrowthResult] = await sql`
        SELECT COUNT(*) AS current_orders
        FROM orders
        WHERE deleted_at IS NULL
          AND created_at >= NOW() - INTERVAL '30 days'
      `;
      const currentOrders = parseInt(orderGrowthResult.current_orders) || 0;
      
      const [prevOrderResult] = await sql`
        SELECT COUNT(*) AS prev_orders
        FROM orders
        WHERE deleted_at IS NULL
          AND created_at >= NOW() - INTERVAL '60 days'
          AND created_at < NOW() - INTERVAL '30 days'
      `;
      const prevOrders = parseInt(prevOrderResult.prev_orders) || 0;
      const orderGrowth = prevOrders > 0 ? ((currentOrders - prevOrders) / prevOrders * 100).toFixed(1) : 0;
      
      // Customer Growth (vs previous 30 days)
      const [customerGrowthResult] = await sql`
        SELECT COUNT(DISTINCT user_id) AS current_customers
        FROM orders
        WHERE deleted_at IS NULL
          AND created_at >= NOW() - INTERVAL '30 days'
      `;
      const currentCustomers = parseInt(customerGrowthResult.current_customers) || 0;
      
      const [prevCustomerResult] = await sql`
        SELECT COUNT(DISTINCT user_id) AS prev_customers
        FROM orders
        WHERE deleted_at IS NULL
          AND created_at >= NOW() - INTERVAL '60 days'
          AND created_at < NOW() - INTERVAL '30 days'
      `;
      const prevCustomers = parseInt(prevCustomerResult.prev_customers) || 0;
      const customerGrowth = prevCustomers > 0 ? ((currentCustomers - prevCustomers) / prevCustomers * 100).toFixed(1) : 0;
      
      res.json({
        totalRevenue,
        totalOrders,
        totalCustomers,
        avgOrderValue,
        revenueGrowth: parseFloat(revenueGrowth),
        orderGrowth: parseFloat(orderGrowth),
        customerGrowth: parseFloat(customerGrowth),
      });
    });
  } catch (err) {
    console.error('Error fetching analytics data:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const orders = await sql`
      SELECT 
        o.id,
        o.user_id,
        o.total AS total_amount,
        o.status,
        o.shipping_method,
        o.shipping_cost,
        o.payment_method,
        o.payment_status,
        o.reference,
        o.created_at,
        o.updated_at
      FROM orders o
      WHERE o.user_id = ${userId} AND o.deleted_at IS NULL
      ORDER BY o.created_at DESC
    `;
    
    console.log('getUserOrders: Fetched orders for user', userId, ':', orders.length);
    res.json(orders);
  } catch (error) {
    console.error('getUserOrders error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    await sql.begin(async (sql) => {
      const [order] = await sql`SELECT * FROM orders WHERE id = ${orderId}`;
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      if (order.status !== 'delivered') {
        return res.status(400).json({ error: 'Only delivered orders can be deleted' });
      }
      
      await sql`DELETE FROM order_items WHERE order_id = ${orderId}`;
      await sql`DELETE FROM orders WHERE id = ${orderId}`;
      
      console.log(`deleteOrder: Deleted order ${orderId}`);
      res.status(200).json({ message: 'Order deleted successfully' });
    });
  } catch (err) {
    console.error('❌ Error deleting order:', err.message);
    res.status(500).json({ error: 'Failed to delete order' });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }
    
    const [order] = await sql`SELECT * FROM orders WHERE id = ${orderId}`;
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const [updatedOrder] = await sql`
      UPDATE orders 
      SET status = ${status}, updated_at = NOW() 
      WHERE id = ${orderId} 
      RETURNING *
    `;
    
    console.log(`updateOrderStatus: Updated status for order ${orderId} to ${status}`);
    res.status(200).json(updatedOrder);
  } catch (err) {
    console.error('❌ Error updating order status:', err.message);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

export const setDeliveryFee = async (req, res) => {
  try {
    const { orderId, fee, paymentLink } = req.body;
    if (!orderId || isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }
    if (typeof fee !== 'number' || isNaN(fee) || fee < 0) {
      return res.status(400).json({ error: 'Invalid delivery fee. Must be a positive number' });
    }
    if (!paymentLink || typeof paymentLink !== 'string') {
      return res.status(400).json({ error: 'Payment link is required' });
    }

    await sql.begin(async (sql) => {
      const [order] = await sql`
        SELECT o.*, u.email, u.first_name, u.last_name
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.id = ${orderId} AND o.deleted_at IS NULL
      `;
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      if (order.shipping_country.toLowerCase() === 'nigeria') {
        return res.status(400).json({ error: 'Delivery fee can only be set for international orders' });
      }
      if (order.payment_status !== 'completed') {
        return res.status(400).json({ error: 'Order payment must be completed' });
      }
      if (order.delivery_fee_paid) {
        return res.status(400).json({ error: 'Delivery fee already paid' });
      }

      const [updatedOrder] = await sql`
        UPDATE orders
        SET delivery_fee = ${fee}, updated_at = NOW()
        WHERE id = ${orderId}
        RETURNING *
      `;

      // Trigger email via emailRoutes (assumes email.js handles /api/email/send-delivery-fee-email)
      await axios.post(
        `${process.env.API_BASE_URL || 'https://tia-backend-r331.onrender.com'}/api/email/send-delivery-fee-email`,
        { orderId, fee, paymentLink },
        {
          headers: {
            Authorization: req.headers.authorization, // Pass admin token
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`setDeliveryFee: Set fee ${fee} for order ${orderId}`);
      res.json(updatedOrder);
    });
  } catch (error) {
    console.error('setDeliveryFee error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to set delivery fee' });
  }
};

export const getOrderItemsForAdmin = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const items = await sql`
      SELECT 
        oi.id,
        oi.quantity,
        oi.price,
        p.name AS product_name,
        c.color_name,
        s.size_name,
        pi.image_url
      FROM order_items oi
      LEFT JOIN product_variants pv ON oi.variant_id = pv.id
      LEFT JOIN products p ON pv.product_id = p.id
      LEFT JOIN colors c ON pv.color_id = c.id
      LEFT JOIN sizes s ON oi.size_id = s.id
      LEFT JOIN product_images pi ON pv.id = pi.variant_id AND pi.is_primary = true
      WHERE oi.order_id = ${orderId} AND oi.bundle_id IS NULL
    `;
    
    res.status(200).json(items);
  } catch (err) {
    console.error('❌ Error fetching order items:', err.message);
    res.status(500).json({ error: 'Failed to fetch order items' });
  }
};

export const getOrderBundleItemsForAdmin = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const bundleItems = await sql`
      SELECT 
        oi.id,
        oi.quantity,
        oi.price,
        b.id AS bundle_id,
        b.name AS bundle_name,
        b.description AS bundle_description,
        bi.image_url,
        (
          SELECT COALESCE(json_agg(
            json_build_object(
              'product_id', p.id,
              'product_name', p.name,
              'color_name', c.color_name,
              'size_name', s.size_name,
              'image_url', pi.image_url
            )
          ), '[]'::json)
          FROM bundle_items bi
          JOIN product_variants pv ON bi.variant_id = pv.id
          JOIN products p ON pv.product_id = p.id
          LEFT JOIN colors c ON pv.color_id = c.id
          LEFT JOIN sizes s ON pv.size_id = s.id
          LEFT JOIN product_images pi ON pv.id = pi.variant_id AND pi.is_primary = true
          WHERE bi.bundle_id = b.id
        ) AS bundle_items
      FROM order_items oi
      JOIN bundles b ON oi.bundle_id = b.id
      LEFT JOIN bundle_images bi ON b.id = bi.bundle_id AND bi.is_primary = true
      WHERE oi.order_id = ${orderId} AND oi.bundle_id IS NOT NULL
    `;
    
    res.status(200).json(bundleItems);
  } catch (err) {
    console.error('❌ Error fetching order bundle items:', err.message);
    res.status(500).json({ error: 'Failed to fetch order bundle items' });
  }
};

export const getOrderShippingAddress = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const [address] = await sql`
      SELECT 
        a.*,
        o.id AS order_id
      FROM addresses a
      JOIN orders o ON a.id = o.address_id
      WHERE o.id = ${orderId}
    `;
    
    if (!address) {
      return res.status(404).json({ error: 'Shipping address not found' });
    }
    
    res.status(200).json(address);
  } catch (err) {
    console.error('❌ Error fetching shipping address:', err.message);
    res.status(500).json({ error: 'Failed to fetch shipping address' });
  }
};

export const getOrderBillingAddress = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const [address] = await sql`
      SELECT 
        a.*,
        o.id AS order_id
      FROM addresses a
      JOIN orders o ON a.id = o.billing_address_id
      WHERE o.id = ${orderId}
    `;
    
    if (!address) {
      return res.status(404).json({ error: 'Billing address not found' });
    }
    
    res.status(200).json(address);
  } catch (err) {
    console.error('❌ Error fetching billing address:', err.message);
    res.status(500).json({ error: 'Failed to fetch billing address' });
  }
};