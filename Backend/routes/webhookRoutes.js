// webhookRoutes.js
import express from 'express';
import sql from '../db/index.js';
import crypto from 'crypto';
import dotenv from 'dotenv';
import axios from 'axios';
import { sendOrderConfirmationEmail, sendDeliveryFeePaymentConfirmation, sendAdminDeliveryFeePaymentConfirmation } from '../utils/emailService.js';

dotenv.config();

const router = express.Router();
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Webhook endpoint for Paystack
router.post('/webhook', async (req, res) => {
  try {
    // Validate environment configuration
    if (!PAYSTACK_SECRET_KEY) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Validate Paystack signature
    if (!req.rawBody) {
      console.error('Raw body not available');
      return res.status(400).json({ error: 'Invalid request' });
    }

    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(req.rawBody)
      .digest('hex');
      
    if (hash !== req.headers['x-paystack-signature']) {
      console.error('Invalid Paystack webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }
    
    // Parse the raw body
    const payload = JSON.parse(req.rawBody.toString('utf8'));
    const { event, data } = payload;
    const reference = data.reference;
    
    // Validate reference format
    if (!reference.startsWith('DF-') && !reference.startsWith('ORD-') && !reference.match(/^[0-9a-zA-Z-]+$/)) {
      console.warn(`Unrecognized reference format: ${reference}. Event ignored.`);
      return res.status(200).json({ message: 'Unrecognized reference format, event ignored' });
    }
    
    // Handle delivery fee payments (DF- references)
    if (reference.startsWith('DF-')) {
      return await handleDeliveryFeePayment(event, reference, res);
    }
    
    // Handle regular order payments
    if (event === 'charge.success') {
      return await handleSuccessfulPayment(reference, res);
    } else if (event === 'charge.failed') {
      return await handleFailedPayment(reference, res);
    }
    
    console.warn(`Unhandled webhook event: ${event}`);
    return res.status(200).json({ message: 'Event not handled' });
  } catch (err) {
    console.error('Webhook processing error:', err.message);
    return res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// Helper function to handle delivery fee payments
async function handleDeliveryFeePayment(event, reference, res) {
  const referenceParts = reference.split('-');
  if (referenceParts.length < 2) {
    console.error(`Invalid delivery fee reference format: ${reference}`);
    return res.status(200).json({ message: 'Invalid delivery fee reference format, event ignored' });
  }
  const orderId = referenceParts[1];
  
  if (event === 'charge.success') {
    console.log(`Processing delivery fee payment success for order=${orderId}, reference=${reference}`);
    
    // Find the order (including potentially deleted ones)
    let [orderDetails] = await sql`
      SELECT 
        o.id, 
        o.delivery_fee_paid, 
        o.user_id,
        o.delivery_fee,
        o.currency,
        u.email,
        u.first_name,
        ba.full_name as billing_full_name,
        ba.email as billing_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN billing_addresses ba ON o.billing_address_id = ba.id
      WHERE o.id = ${orderId}
    `;
    
    if (!orderDetails) {
      console.error(`Order not found for delivery fee payment: ${orderId}`);
      return res.status(200).json({ message: 'Order not found, event ignored' });
    }
    
    if (orderDetails.delivery_fee_paid) {
      console.warn(`Delivery fee already paid for order=${orderId}`);
      return res.status(200).json({ message: 'Delivery fee already paid' });
    }
    
    // Update delivery fee status
    try {
      await sql`
        UPDATE orders 
        SET delivery_fee_paid = true, updated_at = NOW() 
        WHERE id = ${orderId}
      `;
      console.log(`✅ Delivery fee payment status updated for order=${orderId}`);
    } catch (dbError) {
      console.error(`Failed to update delivery fee payment status for order=${orderId}:`, dbError.message);
    }
    
    // Send confirmation emails
    await sendDeliveryFeeEmails(orderDetails, orderId);
    
    console.log(`✅ Delivery fee payment confirmed for order=${orderId}`);
    return res.status(200).json({ message: 'Delivery fee processed successfully' });
  }
  
  if (event === 'charge.failed') {
    console.log(`❌ Delivery fee payment failed for order=${orderId}, reference=${reference}`);
    
    const [orderDetails] = await sql`
      SELECT o.id, o.delivery_fee, o.currency
      FROM orders o
      WHERE o.id = ${orderId}
    `;
    
    if (!orderDetails) {
      console.error(`Order not found for failed delivery fee payment: ${orderId}`);
      return res.status(200).json({ message: 'Order not found, event ignored' });
    }
    
    console.log(`Delivery fee payment failed for order=${orderId}, amount=${orderDetails.delivery_fee} ${orderDetails.currency}`);
    return res.status(200).json({ message: 'Delivery fee failure recorded' });
  }
  
  return res.status(200).json({ message: 'Delivery fee event received' });
}

// Helper function to handle successful payments
async function handleSuccessfulPayment(reference, res) {
  console.log(`Processing charge.success webhook for reference=${reference}`);
  
  const [orderDetails] = await sql`
    SELECT 
      o.id, 
      o.payment_status, 
      o.user_id, 
      o.total, 
      o.currency, 
      o.email_sent, 
      o.cart_id,
      o.delivery_fee,
      o.delivery_fee_paid,
      COALESCE(u.email, ba.email) as email,
      COALESCE(u.first_name, ba.full_name) as first_name,
      ba.full_name as billing_full_name,
      ba.email as billing_email
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN billing_addresses ba ON o.billing_address_id = ba.id
    WHERE o.reference = ${reference} AND o.deleted_at IS NULL
  `;
  
  if (!orderDetails) {
    console.error(`Order not found for reference: ${reference}`);
    return res.status(200).json({ message: 'Order not found, event ignored' });
  }
  
  if (orderDetails.payment_status === 'completed') {
    console.warn(`Payment already verified for reference=${reference}`);
    return res.status(200).json({ message: 'Payment already verified' });
  }
  
  try {
    await sql.begin(async sql => {
      // Update order status
      await sql`
        UPDATE orders 
        SET payment_status = 'completed', status = 'processing', updated_at = NOW() 
        WHERE reference = ${reference}
      `;
      
      // Clear cart if exists
      if (orderDetails.cart_id) {
        await sql`DELETE FROM cart_items WHERE cart_id = ${orderDetails.cart_id}`;
        console.log(`✅ Cleared cart items for cart_id=${orderDetails.cart_id}, reference=${reference}`);
      }
    });
  } catch (dbError) {
    console.error(`Database error updating order for reference=${reference}:`, dbError);
    return res.status(500).json({ error: 'Database error updating order' });
  }
  
  // Send confirmation email if not already sent
  if (!orderDetails.email_sent) {
    await sendOrderConfirmationEmailHelper(orderDetails);
  }
  
  console.log(`✅ Processed charge.success for reference=${reference}`);
  return res.status(200).json({ message: 'Webhook processed successfully' });
}

// Helper function to handle failed payments
async function handleFailedPayment(reference, res) {
  console.log(`Processing charge.failed webhook for reference=${reference}`);
  
  const [order] = await sql`
    SELECT id, payment_status, cart_id, user_id
    FROM orders 
    WHERE reference = ${reference} AND deleted_at IS NULL
  `;
  
  if (!order) {
    console.error(`Order not found for reference: ${reference}`);
    return res.status(200).json({ message: 'Order not found, event ignored' });
  }
  
  if (order.payment_status !== 'pending') {
    console.warn(`Order not in pending state for reference=${reference}`);
    return res.status(200).json({ message: 'Order already processed' });
  }
  
  const orderItems = await sql`
    SELECT variant_id, size_id, quantity 
    FROM order_items 
    WHERE order_id = ${order.id}
  `;
  
  try {
    await sql.begin(async sql => {
      // Restock inventory
      for (const item of orderItems) {
        if (item.variant_id && item.size_id) {
          await sql`
            UPDATE variant_sizes
            SET stock = stock + ${item.quantity}
            WHERE variant_id = ${item.variant_id} AND size_id = ${item.size_id}
          `;
          console.log(`✅ Restocked ${item.quantity} units for variant_id=${item.variant_id}, size_id=${item.size_id}`);
        }
      }
      
      // Update order status
      await sql`
        UPDATE orders 
        SET payment_status = 'failed', updated_at = NOW()
        WHERE reference = ${reference}
      `;
    });
  } catch (dbError) {
    console.error(`Database error updating failed order for reference=${reference}:`, dbError);
    return res.status(500).json({ error: 'Database error updating failed order' });
  }
  
  console.log(`✅ Processed charge.failed for reference=${reference}`);
  return res.status(200).json({ message: 'Webhook processed successfully' });
}

// Helper function to send delivery fee emails
async function sendDeliveryFeeEmails(orderDetails, orderId) {
  try {
    // Determine email and name to use
    const userEmail = orderDetails.email;
    const userName = orderDetails.first_name;
    const billingEmail = orderDetails.billing_email;
    const billingName = orderDetails.billing_full_name;
    
    const finalEmail = userEmail || billingEmail;
    const finalName = userName || billingName || 'Customer';
    
    // Send customer email
    if (finalEmail) {
      await sendDeliveryFeePaymentConfirmation(
        finalEmail,
        finalName,
        orderId,
        orderDetails.delivery_fee,
        orderDetails.currency
      );
      console.log(`✅ Delivery fee confirmation email sent to ${finalEmail} for order ${orderId}`);
    } else {
      console.error(`No email available for delivery fee confirmation for order ${orderId}`);
    }
    
    // Send admin notification
    await sendAdminDeliveryFeePaymentConfirmation(
      orderId,
      finalName,
      orderDetails.delivery_fee,
      orderDetails.currency
    );
    console.log(`✅ Admin delivery fee confirmation notification sent for order ${orderId}`);
  } catch (emailError) {
    console.error(`Failed to send delivery fee confirmation emails for order ${orderId}:`, emailError.message);
    console.error('Email error details:', emailError.response?.data || emailError);
  }
}

// Helper function to send order confirmation email
async function sendOrderConfirmationEmailHelper(orderDetails) {
  try {
    // Determine email and name to use
    const userEmail = orderDetails.email;
    const userName = orderDetails.first_name;
    const billingEmail = orderDetails.billing_email;
    const billingName = orderDetails.billing_full_name;
    
    const finalEmail = userEmail || billingEmail;
    const finalName = userName || billingName || 'Customer';
    
    if (finalEmail) {
      await sendOrderConfirmationEmail(  // This is the imported function
        finalEmail, 
        finalName, 
        orderDetails.id, 
        orderDetails.total, 
        orderDetails.currency,
        'completed'
      );
      console.log(`✅ Sent order confirmation email to ${finalEmail} for order ${orderDetails.id}`);
    } else {
      console.error(`No email available for order ${orderDetails.id}`);
    }
    
    // Mark email as sent
    await sql`UPDATE orders SET email_sent = true WHERE id = ${orderDetails.id}`;
  } catch (emailError) {
    console.error(`Failed to send order confirmation email for order ${orderDetails.id}:`, emailError.message);
    console.error('Email error details:', emailError.response?.data || emailError);
  }
}

// Test endpoint to verify webhook route is working
router.get('/test', (req, res) => {
  res.status(200).json({ 
    message: 'Webhook endpoint is working',
    timestamp: new Date().toISOString()
  });
});

export default router;