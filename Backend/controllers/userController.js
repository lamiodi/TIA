import sql from '../db/index.js';
import bcrypt from 'bcrypt';

// Fetch user profile
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const [user] = await sql`
      SELECT id, first_name, last_name, username, email, phone_number, created_at, updated_at
      FROM users
      WHERE id = ${userId} AND deleted_at IS NULL
    `;
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('getUserProfile: Fetched user:', user);
    res.json(user);
  } catch (error) {
    console.error('getUserProfile error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { first_name, last_name, username, email, phone_number } = req.body;
    
    // Build dynamic update query
    const updates = {};
    if (first_name) updates.first_name = first_name;
    if (last_name) updates.last_name = last_name;
    if (username) updates.username = username;
    if (email) updates.email = email;
    if (phone_number) updates.phone_number = phone_number;
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    const [updatedUser] = await sql`
      UPDATE users
      SET ${sql(updates, 'first_name', 'last_name', 'username', 'email', 'phone_number')}, updated_at = NOW()
      WHERE id = ${userId} AND deleted_at IS NULL
      RETURNING id, first_name, last_name, username, email, phone_number, created_at, updated_at
    `;
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('updateUserProfile: Updated user:', updatedUser);
    res.json(updatedUser);
  } catch (error) {
    console.error('updateUserProfile error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update user password
export const updateUserPassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    
    // Verify current password
    const [user] = await sql`
      SELECT password FROM users WHERE id = ${userId} AND deleted_at IS NULL
    `;
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const [updatedUser] = await sql`
      UPDATE users
      SET password = ${hashedPassword}, updated_at = NOW()
      WHERE id = ${userId} AND deleted_at IS NULL
      RETURNING id, first_name, last_name, username, email, phone_number, created_at, updated_at
    `;
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('updateUserPassword: Password updated for user:', updatedUser);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('updateUserPassword error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Fetch user orders
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await sql`
      SELECT 
        o.id, o.reference, o.total, o.currency, o.payment_status, 
        o.shipping_country, o.created_at, o.updated_at, 
        o.delivery_fee, o.delivery_fee_paid,
        a.title AS shipping_address_title,
        a.address_line_1 AS shipping_address_line_1,
        a.landmark AS shipping_address_landmark,
        a.city AS shipping_address_city,
        a.state AS shipping_address_state,
        a.zip_code AS shipping_address_zip_code,
        a.country AS shipping_address_country,
        ba.full_name AS billing_address_full_name,
        ba.email AS billing_address_email,
        ba.phone_number AS billing_address_phone_number,
        ba.address_line_1 AS billing_address_line_1,
        ba.city AS billing_address_city,
        ba.state AS billing_address_state,
        ba.zip_code AS billing_address_zip_code,
        ba.country AS billing_address_country,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'variant_id', oi.variant_id,
              'bundle_id', oi.bundle_id,
              'quantity', oi.quantity,
              'price', oi.price,
              'product_name', oi.product_name,
              'image_url', oi.image_url,
              'color_name', oi.color_name,
              'size_name', oi.size_name,
              'bundle_details', oi.bundle_details
            )
          ), '[]'::json
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN addresses a ON o.address_id = a.id
      LEFT JOIN billing_addresses ba ON o.billing_address_id = ba.id
      WHERE o.user_id = ${userId} AND o.deleted_at IS NULL
      GROUP BY o.id, a.title, a.address_line_1, a.landmark, a.city, a.state, a.zip_code, a.country,
               ba.full_name, ba.email, ba.phone_number, ba.address_line_1, ba.city, ba.state, ba.zip_code, ba.country
      ORDER BY o.created_at DESC
    `;
    
    // Process items to include image_url for bundle_details
    const processedOrders = await Promise.all(
      orders.map(async (order) => {
        const variantsNeedingImages = [];
        const bundleItems = [];
        
        // Collect variant IDs from bundle_details
        order.items.forEach((item) => {
          if (item.bundle_id && item.bundle_details) {
            let bundleContents;
            try {
              bundleContents = typeof item.bundle_details === 'string' ? JSON.parse(item.bundle_details) : item.bundle_details;
              if (!Array.isArray(bundleContents)) bundleContents = [];
            } catch (e) {
              console.error(`Failed to parse bundle_details for orderItemId: ${item.id}: ${e.message}`);
              bundleContents = [];
            }
            bundleContents.forEach((content) => {
              if (!content.image_url && (content.variant_id || content.product_id)) {
                variantsNeedingImages.push(content.variant_id || content.product_id);
                bundleItems.push({ itemId: item.id, content });
              }
            });
            item.bundle_details = bundleContents;
          }
        });
        
        // Fetch missing images
        let variantImages = {};
        if (variantsNeedingImages.length > 0) {
          const images = await sql`
            SELECT variant_id, image_url
            FROM product_images
            WHERE variant_id = ANY(${variantsNeedingImages}) AND is_primary = true
          `;
          
          images.forEach((row) => {
            variantImages[row.variant_id] = row.image_url;
          });
        }
        
        // Update bundle_details with images
        const processedItems = order.items.map((item) => {
          if (item.bundle_id && item.bundle_details) {
            item.bundle_details = item.bundle_details.map((content) => ({
              ...content,
              image_url: content.image_url || 
                        (content.variant_id || content.product_id ? 
                         variantImages[content.variant_id || content.product_id] || 
                         'https://via.placeholder.com/100' : 
                         'https://via.placeholder.com/100'),
            }));
          }
          return item;
        });
        
        return { ...order, items: processedItems };
      })
    );
    
    console.log('getUserOrders: Fetched and processed orders for user:', userId);
    res.json(processedOrders);
  } catch (error) {
    console.error('getUserOrders error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};