import express from 'express';
import sql from '../db/index.js';
import crypto from 'crypto';
import dotenv from 'dotenv';
import axios from 'axios';
import { sendOrderConfirmationEmail, sendDeliveryFeePaymentConfirmation } from '../utils/emailService.js';
dotenv.config();
const router = express.Router();
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

router.post('/webhook', async (req, res) => {
  try {
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');
      
    if (hash !== req.headers['x-paystack-signature']) {
      console.error('Invalid Paystack webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }
    
    const { event, data } = req.body;
    const reference = data.reference;
    
    // Early validation: Check if reference is recognized format
    if (!reference.startsWith('DF-') && !reference.match(/^[0-9a-zA-Z-]+$/)) {
      console.warn(`Unrecognized reference format: ${reference}. Event ignored.`);
      return res.status(200).json({ message: 'Unrecognized reference format, event ignored' });
    }
    
    // Check if this is a delivery fee payment (DF- prefix)
    if (reference.startsWith('DF-')) {
      // Extract order_id from reference (e.g., DF-72-1755869309026 -> 72)
      const referenceParts = reference.split('-');
      if (referenceParts.length < 2) {
        console.error(`Invalid delivery fee reference format: ${reference}`);
        return res.status(200).json({ message: 'Invalid delivery fee reference format, event ignored' });
      }
      const orderId = referenceParts[1]; // Second part is order_id
      
      if (event === 'charge.success') {
        // Get order details in a single query
        const [orderDetails] = await sql`
          SELECT 
            o.id, 
            o.delivery_fee_paid, 
            o.user_id,
            o.delivery_fee,
            o.currency,
            u.email,
            u.first_name
          FROM orders o
          JOIN users u ON o.user_id = u.id
          WHERE o.id = ${orderId} AND o.deleted_at IS NULL
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
        await sql`
          UPDATE orders 
          SET delivery_fee_paid = true, updated_at = NOW() 
          WHERE id = ${orderId}
        `;
        
        // Send delivery fee confirmation email to user
        try {
          await sendDeliveryFeePaymentConfirmation(
            orderDetails.email,
            orderDetails.first_name,
            orderId,
            orderDetails.delivery_fee,
            orderDetails.currency
          );
          console.log(`✅ Delivery fee confirmation email sent to ${orderDetails.email} for order ${orderId}`);
        } catch (emailError) {
          console.error(`Failed to send delivery fee confirmation email: ${emailError.message}`);
          // Continue processing even if email fails
        }
        
        // Send delivery fee confirmation email to admin
        try {
          await sendAdminDeliveryFeePaymentConfirmation(
            orderId,
            orderDetails.first_name,
            orderDetails.delivery_fee,
            orderDetails.currency
          );
          console.log(`✅ Admin delivery fee confirmation notification sent for order ${orderId}`);
        } catch (emailError) {
          console.error(`Failed to send admin delivery fee confirmation: ${emailError.message}`);
          // Continue processing even if email fails
        }
        
        console.log(`✅ Delivery fee payment confirmed for order=${orderId}`);
        return res.status(200).json({ message: 'Delivery fee processed successfully' });
      }
      
      if (event === 'charge.failed') {
        console.log(`❌ Delivery fee payment failed for order=${orderId}`);
        // You could add additional logic here if needed, like sending a failure notification
        return res.status(200).json({ message: 'Delivery fee failure recorded' });
      }
      
      return res.status(200).json({ message: 'Delivery fee event received' });
    }
    
    // Existing order payment handling (unchanged)
    if (event === 'charge.success') {
      // Get order and user details in a single query
      const [orderDetails] = await sql`
        SELECT 
          o.id, 
          o.payment_status, 
          o.user_id, 
          o.total, 
          o.currency, 
          o.email_sent, 
          o.cart_id,
          u.email,
          u.first_name
        FROM orders o
        JOIN users u ON o.user_id = u.id
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
      
      await sql.begin(async sql => {
        await sql`
          UPDATE orders 
          SET payment_status = 'completed', status = 'processing', updated_at = NOW() 
          WHERE reference = ${reference}
        `;
        
        if (orderDetails.cart_id) {
          await sql`DELETE FROM cart_items WHERE cart_id = ${orderDetails.cart_id}`;
          console.log(`✅ Cleared cart items for cart_id=${orderDetails.cart_id}, reference=${reference}`);
        }
      });
      
      if (!orderDetails.email_sent) {
        await sendOrderConfirmationEmail(
          orderDetails.email, 
          orderDetails.first_name, 
          orderDetails.id, 
          orderDetails.total, 
          orderDetails.currency,
          'completed'
        );
        
        await sql`UPDATE orders SET email_sent = true WHERE id = ${orderDetails.id}`;
      }
      
      console.log(`✅ Processed charge.success for reference=${reference}`);
      return res.status(200).json({ message: 'Webhook processed successfully' });
    } else if (event === 'charge.failed') {
      const [order] = await sql`
        SELECT id, payment_status, cart_id 
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
      
      await sql.begin(async sql => {
        for (const item of orderItems) {
          if (item.variant_id && item.size_id) {
            await sql`
              UPDATE variant_sizes
              SET stock_quantity = stock_quantity + ${item.quantity}
              WHERE variant_id = ${item.variant_id} AND size_id = ${item.size_id}
            `;
            console.log(`✅ Restocked ${item.quantity} units for variant_id=${item.variant_id}, size_id=${item.size_id}`);
          }
        }
        
        await sql`
          UPDATE orders 
          SET payment_status = 'failed', updated_at = NOW()
          WHERE reference = ${reference}
        `;
      });
      
      console.log(`✅ Processed charge.failed for reference=${reference}`);
      return res.status(200).json({ message: 'Webhook processed successfully' });
    }
    
    console.warn(`Unhandled webhook event: ${event}`);
    return res.status(200).json({ message: 'Event not handled' });
  } catch (err) {
    console.error('Webhook processing error:', err.message);
    return res.status(500).json({ error: 'Failed to process webhook' });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { reference } = req.body;
    if (!reference) {
      return res.status(400).json({ error: 'Reference is required' });
    }
    
    // Handle delivery fee verification
    if (reference.startsWith('DF-')) {
      // Extract order_id from reference (e.g., DF-72-1634567890123 -> 72)
      const referenceParts = reference.split('-');
      if (referenceParts.length < 2) {
        console.error(`Invalid delivery fee reference format: ${reference}`);
        return res.status(400).json({ error: 'Invalid delivery fee reference format' });
      }
      const orderId = referenceParts[1]; // Second part is order_id
      
      // Get order details in a single query
      const [orderDetails] = await sql`
        SELECT 
          o.id, 
          o.delivery_fee_paid, 
          o.user_id,
          o.delivery_fee,
          o.currency,
          u.email,
          u.first_name
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.id = ${orderId} AND o.deleted_at IS NULL
      `;
      
      if (!orderDetails) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      if (orderDetails.delivery_fee_paid) {
        return res.status(200).json({ message: 'Delivery fee already verified' });
      }
      
      // Use the /api/paystack path instead of direct Paystack call
      const response = await axios.get(`${process.env.API_BASE_URL || 'http://localhost:5000'}/api/paystack/delivery-fee/verify`, {
        params: { reference }
      });
      
      if (response.data.success) {
        await sql`
          UPDATE orders 
          SET delivery_fee_paid = true, updated_at = NOW() 
          WHERE id = ${orderId}
        `;
        
        // Send delivery fee confirmation email
        try {
          await sendDeliveryFeePaymentConfirmation(
            orderDetails.email,
            orderDetails.first_name,
            orderId,
            orderDetails.delivery_fee,
            orderDetails.currency
          );
          console.log(`✅ Delivery fee confirmation email sent to ${orderDetails.email} for order ${orderId}`);
        } catch (emailError) {
          console.error(`Failed to send delivery fee confirmation email: ${emailError.message}`);
          // Continue processing even if email fails
        }
        
        return res.status(200).json({ message: 'Delivery fee verified successfully' });
      } else {
        return res.status(400).json({ error: 'Delivery fee payment not successful' });
      }
    }
    
    // Existing order verification logic
    const [order] = await sql`
      SELECT id, payment_status, user_id, total, currency, cart_id, email_sent 
      FROM orders 
      WHERE reference = ${reference} AND deleted_at IS NULL
    `;
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (order.payment_status === 'completed') {
      return res.status(200).json({ message: 'Payment already verified', order });
    }
    
    // Use the /api/paystack path instead of direct Paystack call
    const response = await axios.get(`${process.env.API_BASE_URL || 'http://localhost:5000'}/api/paystack/verify`, {
      params: { reference }
    });
    
    if (!response.data.success) {
      const orderItems = await sql`
        SELECT variant_id, size_id, quantity 
        FROM order_items 
        WHERE order_id = ${order.id}
      `;
      
      await sql.begin(async sql => {
        for (const item of orderItems) {
          if (item.variant_id && item.size_id) {
            await sql`
              UPDATE variant_sizes
              SET stock_quantity = stock_quantity + ${item.quantity}
              WHERE variant_id = ${item.variant_id} AND size_id = ${item.size_id}
            `;
            console.log(`✅ Restocked ${item.quantity} units for variant_id=${item.variant_id}, size_id=${item.size_id}`);
          }
        }
        
        await sql`
          UPDATE orders 
          SET payment_status = 'failed', updated_at = NOW()
          WHERE reference = ${reference}
        `;
      });
      
      return res.status(400).json({ error: 'Payment not successful', order });
    }
    
    const [user] = await sql`SELECT email, first_name FROM users WHERE id = ${order.user_id}`;
    
    await sql.begin(async sql => {
      await sql`
        UPDATE orders 
        SET payment_status = 'completed', status = 'processing', updated_at = NOW() 
        WHERE reference = ${reference}
      `;
      
      if (order.cart_id) {
        await sql`DELETE FROM cart_items WHERE cart_id = ${order.cart_id}`;
        console.log(`✅ Cleared cart items for cart_id=${order.cart_id}`);
      }
    });
    
    if (!order.email_sent) {
      await sendOrderConfirmationEmail(
        user.email, 
        user.first_name, 
        order.id, 
        order.total, 
        order.currency,
        'completed'
      );
      
      await sql`UPDATE orders SET email_sent = true WHERE id = ${order.id}`;
    }
    
    return res.status(200).json({ message: 'Payment verified successfully', order });
  } catch (err) {
    console.error('Error verifying payment:', err.message);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

export default router;