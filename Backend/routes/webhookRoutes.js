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

router.post('/webhook', async (req, res) => {
  try {
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
    
    if (!reference.startsWith('DF-') && !reference.startsWith('ORD-') && !reference.match(/^[0-9a-zA-Z-]+$/)) {
      console.warn(`Unrecognized reference format: ${reference}. Event ignored.`);
      return res.status(200).json({ message: 'Unrecognized reference format, event ignored' });
    }
    
    if (reference.startsWith('DF-')) {
      const referenceParts = reference.split('-');
      if (referenceParts.length < 2) {
        console.error(`Invalid delivery fee reference format: ${reference}`);
        return res.status(200).json({ message: 'Invalid delivery fee reference format, event ignored' });
      }
      const orderId = referenceParts[1];
      
      if (event === 'charge.success') {
        console.log(`Processing delivery fee payment success for order=${orderId}, reference=${reference}`);
        
        // First attempt to find the order with deleted_at IS NULL
        let [orderDetails] = await sql`
          SELECT 
            o.id, 
            o.delivery_fee_paid, 
            o.user_id,
            o.delivery_fee,
            o.currency,
            u.email,  // Primary email from users table
            u.first_name,  // Primary name from users table
            ba.full_name as billing_full_name,
            ba.email as billing_email  // Keep for reference/logging
          FROM orders o
          LEFT JOIN users u ON o.user_id = u.id  // Changed to LEFT JOIN to handle guest orders
          LEFT JOIN billing_addresses ba ON o.billing_address_id = ba.id
          WHERE o.id = ${orderId} AND o.deleted_at IS NULL
        `;
        
        // If not found, try to find the order even if it's marked as deleted
        if (!orderDetails) {
          console.log(`Order ${orderId} not found with deleted_at IS NULL, trying to find deleted order...`);
          [orderDetails] = await sql`
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
        }
        
        if (!orderDetails) {
          console.error(`Order not found for delivery fee payment: ${orderId}`);
          return res.status(200).json({ message: 'Order not found, event ignored' });
        }
        
        if (orderDetails.delivery_fee_paid) {
          console.warn(`Delivery fee already paid for order=${orderId}`);
          return res.status(200).json({ message: 'Delivery fee already paid' });
        }
        
        try {
          const [updatedOrder] = await sql.begin(async sql => {
            const [result] = await sql`
              UPDATE orders 
              SET delivery_fee_paid = true, updated_at = NOW() 
              WHERE id = ${orderId}
              RETURNING id, delivery_fee_paid
            `;
            return result;
          });
          
          console.log(`✅ Delivery fee payment status updated for order=${orderId}, result:`, updatedOrder);
        } catch (dbError) {
          console.error(`Failed to update delivery fee payment status for order=${orderId}:`, dbError.message);
          // Continue processing to attempt email sending even if DB update fails
        }
        
        try {
          // Use the email from the users table (may be null for guest orders)
          const userEmail = orderDetails.email;
          const userName = orderDetails.first_name;
          
          // Fallback to billing email if user email is not available (guest orders)
          const billingEmail = orderDetails.billing_email;
          const billingName = orderDetails.billing_full_name;
          
          const finalEmail = userEmail || billingEmail;
          const finalName = userName || billingName || 'Customer';
          
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
        } catch (emailError) {
          console.error(`Failed to send delivery fee confirmation email for order ${orderId}:`, emailError.message);
          console.error('Email error details:', emailError.response?.data || emailError);
        }
        
        try {
          // Use name from users table or fallback to billing name for guest orders
          const userName = orderDetails.first_name;
          const billingName = orderDetails.billing_full_name;
          const finalName = userName || billingName || 'Customer';
          
          await sendAdminDeliveryFeePaymentConfirmation(
            orderId,
            finalName,
            orderDetails.delivery_fee,
            orderDetails.currency
          );
          console.log(`✅ Admin delivery fee confirmation notification sent for order ${orderId}`);
        } catch (emailError) {
          console.error(`Failed to send admin delivery fee confirmation for order ${orderId}:`, emailError.message);
          console.error('Email error details:', emailError.response?.data || emailError);
        }
        
        console.log(`✅ Delivery fee payment confirmed for order=${orderId}`);
        return res.status(200).json({ message: 'Delivery fee processed successfully' });
      }
      
      if (event === 'charge.failed') {
        console.log(`❌ Delivery fee payment failed for order=${orderId}, reference=${reference}`);
        
        // First attempt to find the order with deleted_at IS NULL
        let [orderDetails] = await sql`
          SELECT 
            o.id, 
            o.delivery_fee_paid,
            o.user_id,
            o.delivery_fee,
            o.currency
          FROM orders o
          WHERE o.id = ${orderId} AND o.deleted_at IS NULL
        `;
        
        // If not found, try to find the order even if it's marked as deleted
        if (!orderDetails) {
          console.log(`Order ${orderId} not found with deleted_at IS NULL, trying to find deleted order...`);
          [orderDetails] = await sql`
            SELECT 
              o.id, 
              o.delivery_fee_paid,
              o.user_id,
              o.delivery_fee,
              o.currency
            FROM orders o
            WHERE o.id = ${orderId}
          `;
        }
        
        if (!orderDetails) {
          console.error(`Order not found for failed delivery fee payment: ${orderId}`);
          return res.status(200).json({ message: 'Order not found, event ignored' });
        }
        
        // Log the failure details for debugging
        console.log(`Delivery fee payment failed for order=${orderId}, amount=${orderDetails.delivery_fee} ${orderDetails.currency}`);
        
        // We don't need to update anything in the database for failed delivery fee payments,
        // as the delivery_fee_paid flag should remain false
        
        return res.status(200).json({ message: 'Delivery fee failure recorded' });
      }
      
      return res.status(200).json({ message: 'Delivery fee event received' });
    }
    
    if (event === 'charge.success') {
      // Log the reference for debugging
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
          u.email,  // Primary email from users table
          u.first_name,  // Primary name from users table
          ba.full_name as billing_full_name,
          ba.email as billing_email  // Keep for reference/logging
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id  // Changed to LEFT JOIN to handle guest orders
        LEFT JOIN billing_addresses ba ON o.billing_address_id = ba.id
        WHERE o.reference = ${reference} AND o.deleted_at IS NULL
      `;
      
      if (!orderDetails) {
        console.error(`Order not found for reference: ${reference}`);
        
        // Try to find the order without the deleted_at condition as a fallback
        const [fallbackOrder] = await sql`
          SELECT id, reference, payment_status
          FROM orders
          WHERE reference = ${reference}
        `;
        
        if (fallbackOrder) {
          console.log(`Found order with reference=${reference} but it was marked as deleted`);
          return res.status(200).json({ message: 'Order found but marked as deleted, event ignored' });
        }
        
        return res.status(200).json({ message: 'Order not found, event ignored' });
      }
      
      if (orderDetails.payment_status === 'completed') {
        console.warn(`Payment already verified for reference=${reference}`);
        return res.status(200).json({ message: 'Payment already verified' });
      }
      
      try {
        await sql.begin(async sql => {
          // Update the order status
          const updatedOrders = await sql`
            UPDATE orders 
            SET payment_status = 'completed', status = 'processing', updated_at = NOW() 
            WHERE reference = ${reference}
            RETURNING id, payment_status
          `;
          
          console.log(`Updated order status for reference=${reference}, result:`, updatedOrders);
          
          if (orderDetails.cart_id) {
            await sql`DELETE FROM cart_items WHERE cart_id = ${orderDetails.cart_id}`;
            console.log(`✅ Cleared cart items for cart_id=${orderDetails.cart_id}, reference=${reference}`);
          }
        });
      } catch (dbError) {
        console.error(`Database error updating order for reference=${reference}:`, dbError);
        return res.status(500).json({ error: 'Database error updating order' });
      }
      
      if (!orderDetails.email_sent) {
        try {
          // Use the email from the users table (may be null for guest orders)
          const userEmail = orderDetails.email;
          const userName = orderDetails.first_name;
          
          // Fallback to billing email if user email is not available (guest orders)
          const billingEmail = orderDetails.billing_email;
          const billingName = orderDetails.billing_full_name;
          
          const finalEmail = userEmail || billingEmail;
          const finalName = userName || billingName || 'Customer';
          
          if (finalEmail) {
            await sendOrderConfirmationEmail(
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
          
          // Mark email as sent regardless of which email was used
          await sql`UPDATE orders SET email_sent = true WHERE id = ${orderDetails.id}`;
        } catch (emailError) {
          console.error(`Failed to send order confirmation email for order ${orderDetails.id}:`, emailError.message);
          console.error('Email error details:', emailError.response?.data || emailError);
          
          // Don't fail the webhook if email fails, just log it
        }
      }
      
      console.log(`✅ Processed charge.success for reference=${reference}`);
      return res.status(200).json({ message: 'Webhook processed successfully' });
    } else if (event === 'charge.failed') {
      // Log the reference for debugging
      console.log(`Processing charge.failed webhook for reference=${reference}`);
      
      const [order] = await sql`
        SELECT id, payment_status, cart_id, user_id
        FROM orders 
        WHERE reference = ${reference} AND deleted_at IS NULL
      `;
      
      if (!order) {
        console.error(`Order not found for reference: ${reference}`);
        
        // Try to find the order without the deleted_at condition as a fallback
        const [fallbackOrder] = await sql`
          SELECT id, reference, payment_status
          FROM orders
          WHERE reference = ${reference}
        `;
        
        if (fallbackOrder) {
          console.log(`Found order with reference=${reference} but it was marked as deleted`);
          return res.status(200).json({ message: 'Order found but marked as deleted, event ignored' });
        }
        
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
                SET stock_quantity = stock_quantity + ${item.quantity}
                WHERE variant_id = ${item.variant_id} AND size_id = ${item.size_id}
              `;
              console.log(`✅ Restocked ${item.quantity} units for variant_id=${item.variant_id}, size_id=${item.size_id}`);
            }
          }
          
          // Update order status
          const updatedOrders = await sql`
            UPDATE orders 
            SET payment_status = 'failed', updated_at = NOW()
            WHERE reference = ${reference}
            RETURNING id, payment_status
          `;
          
          console.log(`Updated order status to failed for reference=${reference}, result:`, updatedOrders);
        });
      } catch (dbError) {
        console.error(`Database error updating failed order for reference=${reference}:`, dbError);
        return res.status(500).json({ error: 'Database error updating failed order' });
      }
      
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

export default router;