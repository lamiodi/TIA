import { Resend } from 'resend';
import sql from '../db/index.js';
import dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

// Logo header function for all email templates
const getLogoHeader = () => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `
    <div style="text-align: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #f0f0f0;">
      <img src="${frontendUrl}/favicon.png" alt="The Tia Brand Logo" style="height: 60px; width: auto; margin-bottom: 12px;" />
      <h1 style="font-size: 28px; color: #000000; margin: 0; font-weight: 700; letter-spacing: 0.5px;">THE TIA BRAND</h1>
      <p style="font-size: 14px; color: #666666; margin: 4px 0 0 0; font-style: italic;">Premium Fashion & Lifestyle</p>
    </div>
  `;
};

export const sendResetEmail = async (to, token) => {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}`;
  const html = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        ${getLogoHeader()}
        <h2 style="font-size: 24px; color: #000000; margin-bottom: 20px; text-align: center;">Reset Your Password</h2>
        <p style="font-size: 16px; color: #444444; margin-bottom: 24px; text-align: center;">
          Click the button below to reset your password. This link is valid for 15 minutes.
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
          — The Tia Brand Team
        </p>
      </div>
    </div>
  `;
  try {
    await resend.emails.send({
      from: 'The Tia Brand <support@thetiabrand.org>',
      to,
      subject: 'Password Reset Request',
      html,
    });
    console.log(`✅ Sent password reset email to ${to}`);
  } catch (error) {
    console.error(`❌ Error sending password reset email to ${to}:`, error.message);
    console.error('Email error details:', error.response?.data || error);
    throw error;
  }
};

export const sendAdminDeliveryFeePaymentConfirmation = async (orderId, customerName, deliveryFee, currency) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const formattedFee = currency === 'NGN'
    ? `₦${deliveryFee.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
    : `$${deliveryFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const html = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <h2 style="font-size: 24px; color: #1f2937; margin-bottom: 20px; text-align: center;">🎉 Delivery Fee Payment Successfully Processed</h2>
        <p style="font-size: 16px; color: #4b5563; margin-bottom: 16px;">
          Great news! The delivery fee payment for order <strong>#${orderId}</strong> has been successfully processed and confirmed.
        </p>
        <p style="font-size: 14px; color: #6b7280; margin-bottom: 24px;">
          <strong>Next Steps:</strong> The customer has completed their delivery fee payment. Please:
          <br>1. Coordinate with DHL for international shipping
          <br>2. Proceed with order fulfillment
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
          <a href="${frontendUrl}/admin/dashboard" style="background-color: #111827; color: #ffffff; text-decoration: none; padding: 14px 24px; font-size: 16px; border-radius: 8px; display: inline-block;">
            📦 Process Order & Arrange Shipping
          </a>
        </div>
        <p style="font-size: 13px; color: #9ca3af; text-align: center; margin-top: 30px;">
          — The Tia Brand Team
        </p>
      </div>
    </div>
  `;
  try {
    await resend.emails.send({
      from: 'The Tia Brand <support@thetiabrand.org>',
      to: process.env.ADMIN_EMAIL,
      subject: `Delivery Fee Payment Confirmed for Order #${orderId}`,
      html,
    });
    console.log(`✅ Sent admin delivery fee payment confirmation for order ${orderId}`);
  } catch (error) {
    console.error(`❌ Error sending admin delivery fee payment confirmation for order ${orderId}:`, error.message);
    console.error('Email error details:', error.response?.data || error);
    throw error;
  }
};



export const sendAdminDeliveryFeeNotification = async (orderId, userName, country, address) => {
  const html = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        ${getLogoHeader()}
        <h2 style="font-size: 24px; color: #000000; margin-bottom: 20px; text-align: center;">🌍 New International Order - DHL Quote Required</h2>
        <p style="font-size: 16px; color: #444444; margin-bottom: 16px;">
          A new international order <strong>#${orderId}</strong> has been placed and requires immediate attention for DHL delivery fee calculation.
        </p>
        <p style="font-size: 14px; color: #666666; margin-bottom: 20px;">
          <strong>Action Required:</strong> Contact DHL to obtain an accurate shipping quote for this international destination, then set the delivery fee in the admin dashboard.
        </p>
        <div style="background-color: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #007bff;">
          <p style="font-size: 14px; color: #333333; margin: 0 0 8px 0;">
            <strong>📋 Order Details:</strong>
          </p>
          <p style="font-size: 14px; color: #555555; margin: 0 0 8px 0;">
            <strong>Customer:</strong> ${userName}
          </p>
          <p style="font-size: 14px; color: #555555; margin: 0 0 8px 0;">
            <strong>Destination:</strong> ${country}
          </p>
          <p style="font-size: 14px; color: #555555; margin: 0;">
            <strong>Full Address:</strong> ${address.address_line_1}, ${address.city}, ${address.state || ''} ${address.zip_code}
          </p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/dashboard" style="background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 24px; font-size: 16px; border-radius: 8px; display: inline-block;">
            🚚 Calculate & Set DHL Delivery Fee
          </a>
        </div>
        <p style="font-size: 13px; color: #aaaaaa; text-align: center; margin-top: 30px;">
          — The Tia Brand Team
        </p>
      </div>
    </div>
  `;
  try {
    await resend.emails.send({
      from: 'The Tia Brand <support@thetiabrand.org>',
      to: process.env.ADMIN_EMAIL,
      subject: `Action Required: DHL Delivery Fee for Order ${orderId}`,
      html,
    });
    console.log(`✅ Sent admin delivery fee notification for order ${orderId}`);
  } catch (error) {
    console.error(`❌ Error sending admin delivery fee notification for order ${orderId}:`, error.message);
    console.error('Email error details:', error.response?.data || error);
    throw error;
  }
};

export const sendOrderConfirmationEmail = async (to, name, orderId, total, currency, paymentStatus = null, isTemporary = false) => {
  try {
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
    if (paymentStatus) {
      order.payment_status = paymentStatus;
    }

    const items = itemsResult;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

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

    const processedItems = items.map((item) => {
      if (item.bundle_id && item.bundle_details) {
        item.bundle_details = item.bundle_details.map((content) => ({
          ...content,
          image_url: content.image_url || (content.variant_id || content.product_id ? variantImages[content.variant_id || content.product_id] || 'https://via.placeholder.com/100' : 'https://via.placeholder.com/100'),
        }));
      }
      return item;
    });

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

    const itemsHtml = processedItems
      .map((item) => {
        const itemTotal = item.quantity * item.price;
        const formattedItemPrice = formatCurrency(item.price, currency);
        const formattedItemTotal = formatCurrency(itemTotal, currency);
        const imageUrl = item.image_url || 'https://via.placeholder.com/100';
        let itemDetails = `
          <li style="margin-bottom: 32px; display: flex; gap: 16px; align-items: flex-start; padding: 16px; background-color: #fafafa; border-radius: 8px; border: 1px solid #f0f0f0;">
            <div style="flex-shrink: 0;">
              <img src="${imageUrl}" alt="${item.product_name}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb; display: block;" onerror="this.src='https://via.placeholder.com/100';" />
            </div>
            <div style="flex: 1; min-width: 0; padding-left: 8px;">
              <p style="font-size: 16px; color: #1f2937; margin: 0 0 12px 0; font-weight: 600; line-height: 1.4;">
                ${item.product_name}
              </p>
              <div style="margin-bottom: 8px;">
                <p style="font-size: 14px; color: #6b7280; margin: 0 0 6px 0; line-height: 1.3;">
                  <strong>Quantity:</strong> ${item.quantity}
                </p>
                <p style="font-size: 14px; color: #6b7280; margin: 0 0 6px 0; line-height: 1.3;">
                  <strong>Price:</strong> ${formattedItemPrice}
                </p>
                <p style="font-size: 14px; color: #1f2937; margin: 0 0 6px 0; font-weight: 600; line-height: 1.3;">
                  <strong>Total:</strong> ${formattedItemTotal}
                </p>
              </div>
              ${item.color_name ? `<p style="font-size: 14px; color: #6b7280; margin: 0 0 6px 0; line-height: 1.3;"><strong>Color:</strong> ${item.color_name}</p>` : ''}
              ${item.size_name ? `<p style="font-size: 14px; color: #6b7280; margin: 0 0 6px 0; line-height: 1.3;"><strong>Size:</strong> ${item.size_name}</p>` : ''}
        `;
        
        if (item.bundle_id && item.bundle_details && item.bundle_details.length > 0) {
          itemDetails += `
            <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 14px; color: #1f2937; margin: 0 0 12px 0; font-weight: 600;">Bundle Contents:</p>
              <div style="margin: 0;">
                ${item.bundle_details
                  .map(
                    (bi) => `
                      <div style="font-size: 13px; color: #6b7280; margin-bottom: 8px; display: flex; gap: 12px; align-items: center; padding: 8px; background-color: #f9f9f9; border-radius: 6px;">
                        <div style="flex-shrink: 0;">
                          <img src="${bi.image_url}" alt="${bi.product_name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid #e5e7eb; display: block;" onerror="this.src='https://via.placeholder.com/50';" />
                        </div>
                        <div style="flex: 1; min-width: 0;">
                          <p style="margin: 0 0 4px 0; font-weight: 500; line-height: 1.3;">${bi.product_name}</p>
                          ${bi.color_name ? `<p style="margin: 0 0 2px 0; font-size: 12px; line-height: 1.2;"><strong>Color:</strong> ${bi.color_name}</p>` : ''}
                          ${bi.size_name ? `<p style="margin: 0; font-size: 12px; line-height: 1.2;"><strong>Size:</strong> ${bi.size_name}</p>` : ''}
                        </div>
                      </div>
                     `
                  )
                  .join('')}
              </div>
            </div>
          `;
        }
        
        return itemDetails + '</div></li>';
      })
      .join('');

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

    const billingAddressHtml = order.billing_address_full_name ? `
      <div style="margin-bottom: 24px; padding: 16px; background-color: #f9fafb; border-radius: 8px;">
        <h3 style="font-size: 18px; color: #1f2937; margin: 0 0 12px 0;">Billing Address</h3>
        <div style="font-size: 14px; color: #6b7280;">
          <p style="margin: 0 0 4px 0;">${order.billing_address_full_name}</p>
          <p style="margin: 0 0 4px 0;">${order.billing_address_city}, ${order.billing_address_state || ''}</p>
          <p style="margin: 0 0 4px 0;">${order.billing_address_country}</p>
        </div>
      </div>
    ` : `
      <div style="margin-bottom: 24px; padding: 16px; background-color: #f9fafb; border-radius: 8px;">
        <h3 style="font-size: 18px; color: #1f2937; margin: 0 0 12px 0;">Billing Address</h3>
        <p style="font-size: 14px; color: #6b7280;">No billing address provided</p>
      </div>
    `;

    // Payment & Shipping Method section removed as requested

    const html = `
      <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          ${getLogoHeader()}
          <h2 style="font-size: 24px; color: #1f2937; margin-bottom: 20px; text-align: center;">Order Confirmation</h2>
          <p style="font-size: 16px; color: #4b5563; margin-bottom: 24px; text-align: center;">
            Dear ${name},<br>Thank you for your order! Your order #${orderId} has been successfully placed.
          </p>
          ${orderSummaryHtml}
          ${shippingAddressHtml}
          ${billingAddressHtml}
          <h3 style="font-size: 18px; color: #1f2937; margin-bottom: 16px;">Order Items</h3>
          <ul style="list-style: none; padding: 0; margin: 0 0 24px 0;">
            ${itemsHtml}
          </ul>
          ${isTemporary ? `
            <div style="background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%); border-radius: 16px; padding: 32px 24px; margin: 32px 0; text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,0.12); border: 1px solid #333333;">
              <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; font-size: 12px; font-weight: 700; padding: 8px 16px; border-radius: 24px; display: inline-block; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);">🎉 UPGRADE NOW</div>
              <h3 style="font-size: 24px; color: #ffffff; margin: 0 0 20px 0; font-weight: 700; font-family: 'Segoe UI', sans-serif;">🚀 Unlock Your VIP Shopping Experience!</h3>
              <div style="background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border-radius: 12px; padding: 24px; margin: 20px 0; border: 1px solid rgba(255,255,255,0.1);">
                <p style="font-size: 16px; color: #e5e7eb; margin: 0 0 20px 0; line-height: 1.6; font-weight: 500;">
                  Transform your guest checkout into a <strong style="color: #ffffff;">premium shopping experience</strong> with these exclusive perks:
                </p>
                <div style="display: grid; gap: 12px; max-width: 400px; margin: 0 auto;">
                  <div style="background: rgba(255,255,255,0.08); border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; text-align: left;">
                    <span style="font-size: 20px; margin-right: 12px;">⚡</span>
                    <strong style="color: #ffffff; font-size: 14px;">Lightning-fast 1-click checkout</strong>
                  </div>
                  <div style="background: rgba(255,255,255,0.08); border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; text-align: left;">
                    <span style="font-size: 20px; margin-right: 12px;">📦</span>
                    <strong style="color: #ffffff; font-size: 14px;">Complete order history & tracking</strong>
                  </div>
                  <div style="background: rgba(255,255,255,0.08); border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; text-align: left;">
                    <span style="font-size: 20px; margin-right: 12px;">🎁</span>
                    <strong style="color: #ffffff; font-size: 14px;">Exclusive member-only deals</strong>
                  </div>
                  <div style="background: rgba(255,255,255,0.08); border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; text-align: left;">
                    <span style="font-size: 20px; margin-right: 12px;">🔔</span>
                    <strong style="color: #ffffff; font-size: 14px;">Early access to new collections</strong>
                  </div>
                </div>
              </div>
              <a href="${frontendUrl}/forgot-password" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; font-size: 16px; font-weight: 700; border-radius: 12px; display: inline-block; margin: 20px 0 16px 0; box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4); text-transform: uppercase; letter-spacing: 0.5px; transition: all 0.3s ease; border: none;">
                ✨ Create My VIP Account
              </a>
              <div style="background: rgba(255, 107, 107, 0.1); border-radius: 8px; padding: 16px; margin-top: 16px; border-left: 4px solid #ff6b6b;">
                <p style="font-size: 14px; color: #e5e7eb; margin: 0; font-style: italic;">
                  💡 <strong style="color: #ffffff;">Pro Tip:</strong> Use this same email (${to}) to instantly convert your guest order into a permanent account!
                </p>
              </div>
            </div>
          ` : `
            <div style="text-align: center; margin: 24px 0;">
              <a href="${frontendUrl}/orders" style="background-color: #111827; color: #ffffff; text-decoration: none; padding: 14px 24px; font-size: 16px; border-radius: 8px; display: inline-block;">
                View Order Details
              </a>
            </div>
          `}
          <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 20px;">
            ${isTemporary ? 'Contact' : 'You can track your order status in your account. Contact'} <a href="mailto:Thetiabrand1@gmail.com" style="color: #2563eb;">Thetiabrand1@gmail.com</a> for assistance.
          </p>
          <p style="font-size: 13px; color: #9ca3af; text-align: center; margin-top: 30px;">
            — The Tia Brand Team
          </p>
        </div>
      </div>
    `;

    try {
      await resend.emails.send({
        from: 'The Tia Brand <support@thetiabrand.org>',
        to,
        subject: `Order Confirmation - Order #${orderId}`,
        html,
      });
      console.log(`✅ Sent order confirmation email to ${to} for order ${orderId} with status: ${order.payment_status}`);
    } catch (error) {
      console.error(`❌ Error sending order confirmation email to ${to}:`, error.message);
      console.error('Email error details:', error.response?.data || error);
      throw error;
    }
  } catch (error) {
    console.error(`❌ Error processing order confirmation email for order ${orderId}:`, error.message);
    throw error;
  }
};

export const sendOrderStatusUpdateEmail = async (to, name, orderId, status, additionalInfo = {}) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  let statusMessage = `Your order #${orderId} status has been updated to <strong>${status}</strong>.`;
  if (status === 'delivery_fee_paid' && additionalInfo.deliveryFee && additionalInfo.currency) {
    const formattedFee = additionalInfo.currency === 'NGN'
      ? `₦${additionalInfo.deliveryFee.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
      : `$${additionalInfo.deliveryFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    statusMessage = `Thank you for paying the delivery fee of ${formattedFee} for order #${orderId}.`;
  }
  const html = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        ${getLogoHeader()}
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
  try {
    await resend.emails.send({
      from: 'The Tia Brand <support@thetiabrand.org>',
      to,
      subject: `${status === 'delivery_fee_paid' ? 'Delivery Fee Payment Confirmation' : 'Order Status Update'} - Order #${orderId}`,
      html,
    });
    console.log(`✅ Sent ${status === 'delivery_fee_paid' ? 'delivery fee payment confirmation' : 'order status update'} email to ${to} for order ${orderId}`);
  } catch (error) {
    console.error(`❌ Error sending order status update email to ${to} for order ${orderId}:`, error.message);
    console.error('Email error details:', error.response?.data || error);
    throw error;
  }
};

export const sendDeliveryFeePaymentConfirmation = async (to, userName, orderId, deliveryFee, currency, isTemporary = false) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const formattedFee = currency === 'NGN'
    ? `₦${deliveryFee.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
    : `$${deliveryFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  
  // Conditional content based on user type
  const viewOrderSection = isTemporary ? `
    <!-- Enhanced Guest Account Conversion Section -->
    <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 24px; border-radius: 12px; margin: 32px 0; text-align: center; box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);">
      <div style="background: rgba(255, 255, 255, 0.95); padding: 20px; border-radius: 8px; margin-bottom: 16px;">
        <div style="background: linear-gradient(45deg, #dc2626, #ef4444); color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-size: 12px; font-weight: bold; margin-bottom: 12px;">🎉 UPGRADE NOW</div>
        <h3 style="color: #1f2937; font-size: 20px; margin: 0 0 16px 0; font-weight: 700;">🚀 Unlock Your VIP Shopping Experience!</h3>
        <div style="text-align: left; margin: 16px 0;">
          <div style="margin: 8px 0; color: #374151; font-size: 14px;">⚡ Lightning-fast 1-click checkout</div>
          <div style="margin: 8px 0; color: #374151; font-size: 14px;">📦 Complete order history & tracking</div>
          <div style="margin: 8px 0; color: #374151; font-size: 14px;">🎁 Exclusive member-only deals</div>
          <div style="margin: 8px 0; color: #374151; font-size: 14px;">🔔 Early access to new collections</div>
        </div>
      </div>
      <a href="${frontendUrl}/forgot-password" style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; font-size: 16px; font-weight: bold; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(31, 41, 55, 0.4); transition: all 0.3s ease;">
        ✨ Create My VIP Account
      </a>
      <p style="font-size: 12px; color: #6b7280; margin: 12px 0 0 0; font-style: italic;">
        💡 <strong>Pro Tip:</strong> Use ${to} to create your account instantly!
      </p>
    </div>
  ` : `
    <div style="text-align: center; margin: 24px 0;">
      <a href="${frontendUrl}/orders" style="background-color: #111827; color: #ffffff; text-decoration: none; padding: 14px 24px; font-size: 16px; border-radius: 8px; display: inline-block;">
        View Your Orders
      </a>
    </div>
  `;
  
  const html = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        ${getLogoHeader()}
        <h2 style="font-size: 24px; color: #1f2937; margin-bottom: 20px; text-align: center;">Delivery Fee Payment Confirmed</h2>
        <p style="font-size: 16px; color: #4b5563; margin-bottom: 24px;">
          Dear ${userName},<br>Your delivery fee payment for order #${orderId} has been successfully processed.
        </p>
        <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0;">
            <strong>Order ID:</strong> ${orderId}
          </p>
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0;">
            <strong>Delivery Fee:</strong> ${formattedFee}
          </p>
        </div>
        ${viewOrderSection}
        <p style="font-size: 14px; color: #777777; text-align: center; margin-top: 20px;">
          Thank you for your payment. Contact <a href="mailto:Thetiabrand1@gmail.com" style="color: #2563eb;">Thetiabrand1@gmail.com</a> for any questions.
        </p>
        <p style="font-size: 13px; color: #aaaaaa; text-align: center; margin-top: 30px;">
          — The Tia Brand Team
        </p>
      </div>
    </div>
  `;
  try {
    await resend.emails.send({
      from: 'The Tia Brand <support@thetiabrand.org>',
      to,
      subject: `Delivery Fee Payment Confirmed for Order #${orderId}`,
      html,
    });
    console.log(`✅ Sent delivery fee payment confirmation to ${to} for order ${orderId}`);
  } catch (error) {
    console.error(`❌ Error sending delivery fee payment confirmation to ${to} for order ${orderId}:`, error.message);
    console.error('Email error details:', error.response?.data || error);
    throw error;
  }
};

export const sendAdminPaymentConfirmationNotification = async (orderId, customerName, total, currency) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const formattedTotal = currency === 'NGN'
    ? `₦${total.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
    : `$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const html = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        ${getLogoHeader()}
        <h2 style="font-size: 24px; color: #1f2937; margin-bottom: 20px; text-align: center;">💳 Payment Successfully Received</h2>
        <p style="font-size: 16px; color: #4b5563; margin-bottom: 16px;">
          Excellent! Payment for order <strong>#${orderId}</strong> has been successfully processed and confirmed.
        </p>
        <p style="font-size: 14px; color: #6b7280; margin-bottom: 24px;">
          <strong>Next Steps:</strong> The customer's payment has been secured. Please:
          <br>1. Prepare the order items for packaging
          <br>2. Update inventory levels accordingly
          <br>3. Coordinate shipping logistics
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
          <a href="${frontendUrl}/admin/dashboard" style="background-color: #111827; color: #ffffff; text-decoration: none; padding: 14px 24px; font-size: 16px; border-radius: 8px; display: inline-block;">
            📋 View Order & Begin Fulfillment
          </a>
        </div>
        <p style="font-size: 13px; color: #9ca3af; text-align: center; margin-top: 30px;">
          — The Tia Brand Team
        </p>
      </div>
    </div>
  `;
  try {
    await resend.emails.send({
      from: 'The Tia Brand <support@thetiabrand.org>',
      to: process.env.ADMIN_EMAIL,
      subject: `Payment Confirmed for Order #${orderId}`,
      html,
    });
    console.log(`✅ Sent admin payment confirmation notification for order ${orderId}`);
  } catch (error) {
    console.error(`❌ Error sending admin payment confirmation notification for order ${orderId}:`, error.message);
    console.error('Email error details:', error.response?.data || error);
    throw error;
  }
};

export const sendDeliveryFeePaymentLinkEmail = async (to, userName, orderId, deliveryFee, currency, paymentLink) => {
  const formattedFee = currency === 'NGN' 
    ? `₦${deliveryFee.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
    : `$${deliveryFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  
  const html = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        ${getLogoHeader()}
        <h2 style="font-size: 24px; color: #000000; margin-bottom: 20px; text-align: center;">International Delivery Fee Payment</h2>
        <p style="font-size: 16px; color: #444444; margin-bottom: 24px; text-align: center;">
          Dear ${userName},<br>Your international order #${orderId} requires a delivery fee payment to proceed with shipping.
        </p>
        <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0;">
            <strong>Order ID:</strong> ${orderId}
          </p>
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0;">
            <strong>Delivery Fee:</strong> ${formattedFee}
          </p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${paymentLink}" style="background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 24px; font-size: 16px; border-radius: 8px; display: inline-block;">
            Pay Delivery Fee Now
          </a>
        </div>
        <p style="font-size: 14px; color: #777777; text-align: center; margin-top: 20px;">
          Please complete your payment to proceed with your order. Contact <a href="mailto:Thetiabrand1@gmail.com" style="color: #2563eb;">Thetiabrand1@gmail.com</a> for assistance.
        </p>
        <p style="font-size: 13px; color: #aaaaaa; text-align: center; margin-top: 30px;">
          — The Tia Brand Team
        </p>
      </div>
    </div>
  `;
  
  try {
    await resend.emails.send({
      from: 'The Tia Brand <support@thetiabrand.org>',
      to,
      subject: `Delivery Fee Payment Required - Order #${orderId}`,
      html,
    });
    console.log(`✅ Sent delivery fee payment link email to ${to} for order ${orderId}`);
  } catch (error) {
    console.error(`❌ Error sending delivery fee payment link email to ${to} for order ${orderId}:`, error.message);
    console.error('Email error details:', error.response?.data || error);
    throw error;
  }
};