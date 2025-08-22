import { Resend } from 'resend';
import sql from '../db/index.js';
import dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendResetEmail = async (to, token) => {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}`;
  const html = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <h2 style="font-size: 24px; color: #000000; margin-bottom: 20px; text-align: center;">Reset Your Password</h2>
        <p style="font-size: 16px; color: #444444; margin-bottom: 24px; text-align: center;">
          Tap the button below to reset your password.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${resetLink}" style="background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 24px; font-size: 16px; border-radius: 8px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 14px; color: #777777; text-align: center; margin-top: 20px;">
          This link expires in 15 minutes. If you didn't request this, you can safely ignore this message.
        </p>
        <p style="font-size: 13px; color: #aaaaaa; text-align: center; margin-top: 30px;">
          — The The Tia Brand Team
        </p>
      </div>
    </div>
  `;
  await resend.emails.send({
    from: 'The Tia Brand <onboarding@resend.dev>',
    to,
    subject: 'Password Reset Request',
    html,
  });
  console.log(`✅ Sent password reset email to ${to}`);
};
// Add this function to emailService.js
export const sendAdminDeliveryFeePaymentConfirmation = async (orderId, customerName, deliveryFee, currency) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const formattedFee = currency === 'NGN'
    ? `₦${deliveryFee.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
    : `$${deliveryFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const html = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <h2 style="font-size: 24px; color: #1f2937; margin-bottom: 20px; text-align: center;">Delivery Fee Payment Confirmed</h2>
        <p style="font-size: 16px; color: #4b5563; margin-bottom: 24px;">
          Delivery fee payment has been confirmed for order #${orderId}.
        </p>
        <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0;">
            <strong>Customer:</strong> ${customerName}
          </p>
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0;">
            <strong>Delivery Fee:</strong> ${formattedFee}
          </p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${frontendUrl}/admin/orders" style="background-color: #111827; color: #ffffff; text-decoration: none; padding: 14px 24px; font-size: 16px; border-radius: 8px; display: inline-block;">
            View Order
          </a>
        </div>
        <p style="font-size: 13px; color: #9ca3af; text-align: center; margin-top: 30px;">
          — The Tia Brand Team
        </p>
      </div>
    </div>
  `;
  await resend.emails.send({
    from: 'The Tia Brand <onboarding@resend.dev>',
    to: process.env.ADMIN_EMAIL,
    subject: `Delivery Fee Payment Confirmed for Order #${orderId}`,
    html,
  });
  console.log(`✅ Sent admin delivery fee payment confirmation for order ${orderId}`);
};

export const sendDeliveryFeeEmail = async (to, userName, country, deliveryFee, paymentLink, currency) => {
  const formattedFee = currency === 'NGN' 
    ? `₦${deliveryFee.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
    : `$${deliveryFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  
  const html = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <h2 style="font-size: 24px; color: #000000; margin-bottom: 20px; text-align: center;">International Delivery Fee</h2>
        <p style="font-size: 16px; color: #444444; margin-bottom: 24px; text-align: center;">
          Dear ${userName},<br>Your delivery fee for your order to ${country} is ${formattedFee}.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${paymentLink}" style="background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 24px; font-size: 16px; border-radius: 8px; display: inline-block;">
            Pay Delivery Fee
          </a>
        </div>
        <p style="font-size: 14px; color: #777777; text-align: center; margin-top: 20px;">
          Please pay the delivery fee to complete your order. Contact Thetiabrand1@gmail.com for assistance.
        </p>
        <p style="font-size: 13px; color: #aaaaaa; text-align: center; margin-top: 30px;">
          — The Tia Brand Team
        </p>
      </div>
    </div>
  `;
  await resend.emails.send({
    from: 'The Tia Brand <onboarding@resend.dev>',
    to,
    subject: 'Your International Delivery Fee',
    html,
  });
  console.log(`✅ Sent delivery fee email to ${to}`);
};

export const sendAdminDeliveryFeeNotification = async (orderId, userName, country, address) => {
  const html = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <h2 style="font-size: 24px; color: #000000; margin-bottom: 20px; text-align: center;">New International Order - Action Required</h2>
        <p style="font-size: 16px; color: #444444; margin-bottom: 24px;">
          A new international order (ID: ${orderId}) requires a DHL delivery fee quote.<br>
          <strong>User:</strong> ${userName}<br>
          <strong>Country:</strong> ${country}<br>
          <strong>Address:</strong> ${address.address_line_1}, ${address.city}, ${address.state || ''} ${address.zip_code}
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/delivery-fees" style="background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 24px; font-size: 16px; border-radius: 8px; display: inline-block;">
            Set Delivery Fee
          </a>
        </div>
        <p style="font-size: 13px; color: #aaaaaa; text-align: center; margin-top: 30px;">
          — The The Tia Brand Team
        </p>
      </div>
    </div>
  `;
  await resend.emails.send({
    from: 'The Tia Brand <onboarding@resend.dev>',
    to: process.env.ADMIN_EMAIL,
    subject: `Action Required: DHL Delivery Fee for Order ${orderId}`,
    html,
  });
  console.log(`✅ Sent admin delivery fee notification for order ${orderId}`);
};

// Updated function to accept payment status as a parameter
export const sendOrderConfirmationEmail = async (to, name, orderId, total, currency, paymentStatus = null) => {
  try {
    // Fetch order details, items, shipping, and billing addresses
    const [orderDetails, itemsResult] = await Promise.all([
      sql`
        SELECT 
          o.id, o.reference, o.payment_status, o.payment_method, o.shipping_method, o.shipping_cost,
          o.delivery_fee, o.delivery_fee_paid, o.created_at, o.shipping_country,
          a.title AS shipping_address_title, a.address_line_1 AS shipping_address_line_1, 
          a.landmark AS shipping_address_landmark, a.city AS shipping_address_city, 
          a.state AS shipping_address_state, a.zip_code AS shipping_address_zip_code, 
          a.country AS shipping_address_country,
          ba.full_name AS billing_address_full_name, ba.address_line_1 AS billing_address_line_1, 
          ba.city AS billing_address_city, ba.state AS billing_address_state, 
          ba.zip_code AS billing_address_zip_code, ba.country AS billing_address_country, 
          ba.email AS billing_address_email, ba.phone_number AS billing_address_phone_number
        FROM orders o
        LEFT JOIN addresses a ON o.address_id = a.id
        LEFT JOIN billing_addresses ba ON o.billing_address_id = ba.id
        WHERE o.id = ${orderId}
      `,
      sql`
        SELECT 
          oi.id, oi.variant_id, oi.quantity, oi.price, oi.product_name, oi.image_url, 
          oi.color_name, oi.size_name, oi.bundle_id, oi.bundle_details
        FROM order_items oi
        WHERE oi.order_id = ${orderId}
      `,
    ]);
    
    if (orderDetails.length === 0) {
      throw new Error('Order not found');
    }
    
    const [order] = orderDetails;
    // Override payment status if explicitly provided
    if (paymentStatus) {
      order.payment_status = paymentStatus;
    }
    
    const items = itemsResult;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    // Collect variant IDs for bundle items needing images
    const variantsNeedingImages = [];
    const bundleItems = [];
    items.forEach((item) => {
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
      const imagesResult = await sql`
        SELECT variant_id, image_url
        FROM product_images
        WHERE variant_id = ANY(${variantsNeedingImages}) AND is_primary = true
      `;
      
      imagesResult.forEach((row) => {
        variantImages[row.variant_id] = row.image_url;
      });
    }
    
    // Process items to include images in bundle_details
    const processedItems = items.map((item) => {
      if (item.bundle_id && item.bundle_details) {
        item.bundle_details = item.bundle_details.map((content) => ({
          ...content,
          image_url: content.image_url || (content.variant_id || content.product_id ? variantImages[content.variant_id || content.product_id] || 'https://via.placeholder.com/100' : 'https://via.placeholder.com/100'),
        }));
      }
      return item;
    });
    
    // Format currency
    const formatCurrency = (amount, curr) => {
      if (curr === 'NGN') {
        return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
      } else if (curr === 'USD') {
        const totalAmount = amount > 1000 ? amount / 100 : amount;
        return `$${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      }
      return `${amount} ${curr}`;
    };
    
    const formattedTotal = formatCurrency(total, currency);
    
    // Generate items HTML
    const itemsHtml = processedItems
      .map((item) => {
        const itemTotal = item.quantity * item.price;
        const formattedItemPrice = formatCurrency(item.price, currency);
        const formattedItemTotal = formatCurrency(itemTotal, currency);
        const imageUrl = item.image_url || 'https://via.placeholder.com/100';
        let itemDetails = `
          <li style="margin-bottom: 24px; display: flex; gap: 16px; align-items: flex-start;">
            <img src="${imageUrl}" alt="${item.product_name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb;" onerror="this.src='https://via.placeholder.com/100';" />
            <div style="flex: 1;">
              <p style="font-size: 16px; color: #1f2937; margin: 0 0 8px 0; font-weight: 600;">
                ${item.product_name}
              </p>
              <p style="font-size: 14px; color: #6b7280; margin: 0 0 4px 0;">
                Quantity: ${item.quantity} | Price: ${formattedItemPrice} | Total: ${formattedItemTotal}
              </p>
              ${item.color_name ? `<p style="font-size: 14px; color: #6b7280; margin: 0 0 4px 0;">Color: ${item.color_name}</p>` : ''}
              ${item.size_name ? `<p style="font-size: 14px; color: #6b7280; margin: 0 0 4px 0;">Size: ${item.size_name}</p>` : ''}
        `;
        
        if (item.bundle_id && item.bundle_details && item.bundle_details.length > 0) {
          itemDetails += `
            <div style="margin-top: 12px;">
              <p style="font-size: 14px; color: #1f2937; margin: 0 0 8px 0; font-weight: 500;">Bundle Contents:</p>
              <ul style="list-style: disc; padding-left: 20px; margin: 0;">
                ${item.bundle_details
                  .map(
                    (bi) => `
                      <li style="font-size: 14px; color: #6b7280; margin-bottom: 4px; display: flex; gap: 8px; align-items: center;">
                        <img src="${bi.image_url}" alt="${bi.product_name}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;" onerror="this.src='https://via.placeholder.com/50';" />
                        <span>
                          ${bi.product_name}${bi.color_name ? `, Color: ${bi.color_name}` : ''}${bi.size_name ? `, Size: ${bi.size_name}` : ''}
                        </span>
                      </li>
                    `
                  )
                  .join('')}
              </ul>
            </div>
          `;
        }
        
        return itemDetails + '</div></li>';
      })
      .join('');
    
    // Generate order summary HTML
    const orderSummaryHtml = `
      <div style="margin-bottom: 24px; padding: 16px; background-color: #f9fafb; border-radius: 8px;">
        <h3 style="font-size: 18px; color: #1f2937; margin: 0 0 12px 0;">Order Summary</h3>
        <div style="font-size: 14px; color: #6b7280;">
          <p style="margin: 0 0 4px 0;"><strong>Order ID:</strong> ${order.id}</p>
          <p style="margin: 0 0 4px 0;"><strong>Reference:</strong> ${order.reference}</p>
          <p style="margin: 0 0 4px 0;"><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}</p>
          <p style="margin: 0 0 4px 0;"><strong>Payment Status:</strong> <span style="color: ${
            order.payment_status === 'completed' ? '#15803d' : '#b45309'
          }">${order.payment_status}</span></p>
          <p style="margin: 0 0 4px 0;"><strong>Total:</strong> ${formattedTotal}</p>
          ${order.shipping_country !== 'Nigeria' && order.delivery_fee ? `
            <p style="margin: 0 0 4px 0;"><strong>Delivery Fee:</strong> ${
              order.delivery_fee_paid ? formatCurrency(order.delivery_fee, currency) : 'Pending'
            }</p>
          ` : ''}
          <p style="margin: 0 0 4px 0;"><strong>Shipping Country:</strong> ${order.shipping_country || 'N/A'}</p>
        </div>
      </div>
    `;
    
    // Generate shipping address HTML
    const shippingAddressHtml = order.shipping_address_title ? `
      <div style="margin-bottom: 24px; padding: 16px; background-color: #f9fafb; border-radius: 8px;">
        <h3 style="font-size: 18px; color: #1f2937; margin: 0 0 12px 0;">Shipping Address</h3>
        <div style="font-size: 14px; color: #6b7280;">
          <p style="margin: 0 0 4px 0;">${order.shipping_address_title}</p>
          <p style="margin: 0 0 4px 0;">${order.shipping_address_line_1}</p>
          ${order.shipping_address_landmark ? `<p style="margin: 0 0 4px 0;">Landmark: ${order.shipping_address_landmark}</p>` : ''}
          <p style="margin: 0 0 4px 0;">${order.shipping_address_city}, ${order.shipping_address_state || ''} ${
            order.shipping_address_zip_code
          }</p>
          <p style="margin: 0 0 4px 0;">${order.shipping_address_country}</p>
        </div>
      </div>
    ` : `
      <div style="margin-bottom: 24px; padding: 16px; background-color: #f9fafb; border-radius: 8px;">
        <h3 style="font-size: 18px; color: #1f2937; margin: 0 0 12px 0;">Shipping Address</h3>
        <p style="font-size: 14px; color: #6b7280;">No shipping address provided</p>
      </div>
    `;
    
    // Generate billing address HTML
    const billingAddressHtml = order.billing_address_full_name ? `
      <div style="margin-bottom: 24px; padding: 16px; background-color: #f9fafb; border-radius: 8px;">
        <h3 style="font-size: 18px; color: #1f2937; margin: 0 0 12px 0;">Billing Address</h3>
        <div style="font-size: 14px; color: #6b7280;">
          <p style="margin: 0 0 4px 0;">${order.billing_address_full_name}</p>
          <p style="margin: 0 0 4px 0;">${order.billing_address_line_1}</p>
          <p style="margin: 0 0 4px 0;">${order.billing_address_city}, ${order.billing_address_state || ''} ${
            order.billing_address_zip_code
          }</p>
          <p style="margin: 0 0 4px 0;">${order.billing_address_country}</p>
          <p style="margin: 0 0 4px 0;">Email: ${order.billing_address_email}</p>
          <p style="margin: 0 0 4px 0;">Phone: ${order.billing_address_phone_number}</p>
        </div>
      </div>
    ` : `
      <div style="margin-bottom: 24px; padding: 16px; background-color: #f9fafb; border-radius: 8px;">
        <h3 style="font-size: 18px; color: #1f2937; margin: 0 0 12px 0;">Billing Address</h3>
        <p style="font-size: 14px; color: #6b7280;">No billing address provided</p>
      </div>
    `;
    
    // Generate payment and shipping method HTML
    const paymentShippingHtml = `
      <div style="margin-bottom: 24px; padding: 16px; background-color: #f9fafb; border-radius: 8px;">
        <h3 style="font-size: 18px; color: #1f2937; margin: 0 0 12px 0;">Payment & Shipping Method</h3>
        <div style="font-size: 14px; color: #6b7280;">
          <p style="margin: 0 0 4px 0;"><strong>Payment Method:</strong> ${order.payment_method || 'Card'}</p>
          <p style="margin: 0 0 4px 0;"><strong>Shipping Method:</strong> ${order.shipping_method || 'Standard'}</p>
          ${order.shipping_cost ? `
            <p style="margin: 0 0 4px 0;"><strong>Shipping Cost:</strong> ${formatCurrency(order.shipping_cost, currency)}</p>
          ` : ''}
        </div>
      </div>
    `;
    
    // Complete email HTML
    const html = `
      <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <h2 style="font-size: 24px; color: #1f2937; margin-bottom: 20px; text-align: center;">Order Confirmation</h2>
          <p style="font-size: 16px; color: #4b5563; margin-bottom: 24px; text-align: center;">
            Dear ${name},<br>Thank you for your order! Your order #${orderId} has been successfully placed.
          </p>
          ${orderSummaryHtml}
          ${shippingAddressHtml}
          ${billingAddressHtml}
          ${paymentShippingHtml}
          <h3 style="font-size: 18px; color: #1f2937; margin-bottom: 16px;">Order Items</h3>
          <ul style="list-style: none; padding: 0; margin: 0 0 24px 0;">
            ${itemsHtml}
          </ul>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${frontendUrl}/orders?orderId=${orderId}" style="background-color: #111827; color: #ffffff; text-decoration: none; padding: 14px 24px; font-size: 16px; border-radius: 8px; display: inline-block;">
              View Order Details
            </a>
          </div>
          <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 20px;">
            You can track your order status in your account. Contact <a href="mailto:Thetiabrand1@gmail.com" style="color: #2563eb;">Thetiabrand1@gmail.com</a> for assistance.
          </p>
          <p style="font-size: 13px; color: #9ca3af; text-align: center; margin-top: 30px;">
            — The Tia Brand Team
          </p>
        </div>
      </div>
    `;
    
    await resend.emails.send({
      from: 'The Tia Brand <onboarding@resend.dev>',
      to,
      subject: `Order Confirmation - Order #${orderId}`,
      html,
    });
    console.log(`✅ Sent order confirmation email to ${to} for order ${orderId} with status: ${order.payment_status}`);
  } catch (error) {
    console.error(`❌ Error sending order confirmation email to ${to}:`, error.message);
    throw error;
  }
};

export const sendOrderStatusUpdateEmail = async (to, name, orderId, status, additionalInfo = {}) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  let statusMessage = `Your order #${orderId} status has been updated to <strong>${status}</strong>.`;
  if (status === 'delivery_fee_paid' && additionalInfo.deliveryFee) {
    const formattedFee = `$${additionalInfo.deliveryFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    statusMessage = `Thank you for paying the delivery fee of ${formattedFee} for order #${orderId}.`;
  }
  const html = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <h2 style="font-size: 24px; color: #1f2937; margin-bottom: 20px; text-align: center;">
          ${status === 'delivery_fee_paid' ? 'Delivery Fee Payment Confirmation' : 'Order Status Update'}
        </h2>
        <p style="font-size: 16px; color: #4b5563; margin-bottom: 24px; text-align: center;">
          Dear ${name},<br>${statusMessage}
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${frontendUrl}/orders?orderId=${orderId}" style="background-color: #111827; color: #ffffff; text-decoration: none; padding: 14px 24px; font-size: 16px; border-radius: 8px; display: inline-block;">
            View Order
          </a>
        </div>
        <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 20px;">
          You can track your order status in your account. Contact <a href="mailto:Thetiabrand1@gmail.com" style="color: #2563eb;">Thetiabrand1@gmail.com</a> for assistance.
        </p>
        <p style="font-size: 13px; color: #9ca3af; text-align: center; margin-top: 30px;">
          — The Tia Brand Team
        </p>
      </div>
    </div>
  `;
  await resend.emails.send({
    from: 'The Tia Brand <onboarding@resend.dev>',
    to,
    subject: `${status === 'delivery_fee_paid' ? 'Delivery Fee Payment Confirmation' : 'Order Status Update'} - Order #${orderId}`,
    html,
  });
  console.log(`✅ Sent ${status === 'delivery_fee_paid' ? 'delivery fee payment confirmation' : 'order status update'} email to ${to} for order ${orderId}`);
};

export const sendAdminPaymentConfirmationNotification = async (orderId, customerName, total, currency) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const formattedTotal = currency === 'NGN'
    ? `₦${total.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
    : `$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const html = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <h2 style="font-size: 24px; color: #1f2937; margin-bottom: 20px; text-align: center;">Payment Confirmed</h2>
        <p style="font-size: 16px; color: #4b5563; margin-bottom: 24px;">
          Payment has been confirmed for order #${orderId}.
        </p>
        <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0;">
            <strong>Customer:</strong> ${customerName}
          </p>
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0;">
            <strong>Total:</strong> ${formattedTotal}
          </p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${frontendUrl}/admin//dashboard" style="background-color: #111827; color: #ffffff; text-decoration: none; padding: 14px 24px; font-size: 16px; border-radius: 8px; display: inline-block;">
            View Order
          </a>
        </div>
        <p style="font-size: 13px; color: #9ca3af; text-align: center; margin-top: 30px;">
          — The Tia Brand Team
        </p>
      </div>
    </div>
  `;
  await resend.emails.send({
    from: 'The Tia Brand <onboarding@resend.dev>',
    to: process.env.ADMIN_EMAIL,
    subject: `Payment Confirmed for Order #${orderId}`,
    html,
  });
  console.log(`✅ Sent admin payment confirmation notification for order ${orderId}`);
};